// Map features take damage and break (docs/map-design.md §5, SPEC §10): garrisonable buildings collapse, natural cover and
// defensive structures are destroyed (some leave a weaker feature), vehicles crush crushable lines, wrecks are placed.
// Writes only GameState.map.changes.
import { key } from '../hex/index.js';
import { ev } from '../events/index.js';
import { mapOf, structureAt, edgeAt } from './access.js';

const withChanges = (state, fn) => ({ ...state, map: { ...state.map, changes: fn(state.map.changes) } });

/** May this weapon damage a feature of this definition? (explosives, fire, AT weapons per the feature's group) */
export function canDamage(data, def, weapon) {
  const rules = data.rules.terrain, group = rules.groups[def.group ?? 'building'];
  return group.damaged_by.some(src => {
    const s = rules.damage_sources[src];
    return (s.damage_types || []).includes(weapon.damage_type) || (s.weapon_categories || []).includes(weapon.category);
  });
}

/** Full HP of a feature: a defensive feature placed by a side takes its faction's CoH3 entity; else the rule's own HP. */
export function featureHp(state, data, def, team) {
  const faction = team ? state.teams[team]?.faction : null, ebps = faction ? data.units.ebps[def.faction_ebps?.[faction]] : null;
  return { hp: ebps?.hp ?? def.hp ?? 0, armor: ebps?.armor?.front ?? def.armor ?? 1 };
}

/** Damage after armour: penetration below the armour scales it down (CoH3 rule, no rolls on terrain). */
const effective = (amount, pen, armor) => (pen == null || armor <= 1 ? amount : amount * Math.min(1, pen / armor));

/** Damage the line on the edge between a and b. hit: { weapon, amount, pen? } → { state, events } */
export function damageEdge(state, data, a, b, hit) {
  const e = edgeAt(state, data, a, b);
  if (!e || !canDamage(data, e.def, hit.weapon)) return { state, events: [] };
  const id = `${e.line}:${e.seg}`, line = mapOf(state, data).lines[e.line];
  const full = featureHp(state, data, e.def, line.team);
  const cur = state.map.changes.segments[id]?.hp ?? full.hp;
  const hp = Math.max(0, Math.round(cur - effective(hit.amount, hit.pen, full.armor)));
  if (hp > 0) {
    return { state: withChanges(state, c => ({ ...c, segments: { ...c.segments, [id]: { kind: e.kind, hp } } })), events: [ev('FeatureDamaged', { feature: id, kind: e.kind, hp })] };
  }
  return destroySegment(state, data, e, id, 'damage');
}

function destroySegment(state, data, e, id, by) {
  const leaves = e.def.leaves ?? null;
  const next = { kind: leaves, hp: leaves ? data.rules.terrain.lines[leaves].hp : 0 };
  return { state: withChanges(state, c => ({ ...c, segments: { ...c.segments, [id]: next } })),
    events: [ev('FeatureDestroyed', { feature: id, kind: e.kind, leaves, by })] };
}

/** A vehicle crossing a crushable line breaks it. mover: 'vehicle' | 'infantry' */
export function crushEdge(state, data, a, b, moveClass) {
  const e = edgeAt(state, data, a, b);
  if (moveClass !== 'vehicle' || !e?.def.crushable) return { state, events: [] };
  const r = destroySegment(state, data, e, `${e.line}:${e.seg}`, 'crush');
  return { state: r.state, events: [ev('Crushed', { feature: `${e.line}:${e.seg}`, kind: e.kind }), ...r.events] };
}

/**
 * Damage a building. A collapse turns its footprint to rubble and reports the units inside (container = building id):
 * lifecycle kills them (SPEC §10). Indestructible buildings (HQ) stop at 1 HP. → { state, events, collapsed, garrison }
 */
export function damageStructure(state, data, id, hit) {
  const m = mapOf(state, data), s = m.structures[id], def = data.rules.terrain.structures[s.kind], ch = state.map.changes.structures[id] || {};
  const none = { state, events: [], collapsed: false, garrison: [] };
  if (ch.collapsed || !canDamage(data, { group: 'building' }, hit.weapon)) return none;
  const hp = Math.max(def.indestructible ? 1 : 0, Math.round((ch.hp ?? def.hp) - effective(hit.amount, hit.pen, def.armor)));
  if (hp > 0) {
    return { ...none, state: withChanges(state, c => ({ ...c, structures: { ...c.structures, [id]: { hp } } })), events: [ev('FeatureDamaged', { feature: id, kind: s.kind, hp })] };
  }
  const garrison = Object.values(state.units).filter(u => u.container === id).map(u => u.id);
  const next = withChanges(state, c => ({
    ...c,
    structures: { ...c.structures, [id]: { hp: 0, collapsed: true } },
    hexes: { ...c.hexes, ...Object.fromEntries(s.hexes.map(k => [k, { ...(c.hexes[k] || {}), object: def.leaves ?? null }])) },
  }));
  return { state: next, events: [ev('StructureCollapsed', { feature: id, kind: s.kind, garrison })], collapsed: true, garrison };
}

/** Damage whatever stands on a hex: a building, else a wreck, else a hex object with HP. */
export function damageHex(state, data, h, hit) {
  const s = structureAt(state, data, h);
  if (s) return damageStructure(state, data, s.id, hit);
  const k = key(h), rules = data.rules.terrain, ch = state.map.changes.hexes[k] || {};
  if (ch.wreck) {
    const def = rules.wrecks[ch.wreck.kind];
    if (!canDamage(data, def, hit.weapon)) return { state, events: [] };
    const hp = Math.max(0, Math.round(ch.wreck.hp - effective(hit.amount, hit.pen, def.armor)));
    const wreck = hp > 0 ? { ...ch.wreck, hp } : undefined;
    const next = withChanges(state, c => ({ ...c, hexes: { ...c.hexes, [k]: { ...ch, wreck } } }));
    return { state: next, events: [ev(hp > 0 ? 'FeatureDamaged' : 'FeatureDestroyed', { feature: `wreck:${k}`, kind: ch.wreck.kind, hp })] };
  }
  const objId = 'object' in ch ? ch.object : mapOf(state, data).hexes[k]?.object;
  const def = objId ? rules.objects[objId] : null;
  if (!def?.hp || !canDamage(data, def, hit.weapon)) return { state, events: [] };
  const full = featureHp(state, data, def, null);
  const hp = Math.max(0, Math.round((ch.hp ?? full.hp) - effective(hit.amount, hit.pen, full.armor)));
  const next = withChanges(state, c => ({ ...c, hexes: { ...c.hexes, [k]: hp > 0 ? { ...ch, object: objId, hp } : { ...ch, object: def.leaves ?? null, hp: undefined } } }));
  return { state: next, events: [ev(hp > 0 ? 'FeatureDamaged' : 'FeatureDestroyed', { feature: `hex:${k}`, kind: objId, hp })] };
}

/** A destroyed vehicle or emplacement leaves a wreck object (heavy cover for infantry). kind: 'vehicle' | 'emplacement' */
export function placeWreck(state, data, h, kind) {
  const k = key(h), def = data.rules.terrain.wrecks[kind];
  const next = withChanges(state, c => ({ ...c, hexes: { ...c.hexes, [k]: { ...(c.hexes[k] || {}), wreck: { kind, hp: def.hp } } } }));
  return { state: next, events: [ev('WreckPlaced', { hex: { ...h }, kind })] };
}

/** One turn of clearing work on a wreck; gone after its clear_turns (data). → { state, events, cleared } */
export function clearWreck(state, data, h) {
  const k = key(h), ch = state.map.changes.hexes[k] || {};
  if (!ch.wreck) return { state, events: [], cleared: false };
  const need = data.rules.terrain.wrecks[ch.wreck.kind].clear_turns ?? 1, work = (ch.wreck.work ?? 0) + 1;
  if (work >= need) {
    const { wreck, ...rest } = ch;
    return { state: withChanges(state, c => ({ ...c, hexes: { ...c.hexes, [k]: rest } })), events: [ev('WreckCleared', { hex: { ...h }, kind: wreck.kind })], cleared: true };
  }
  return { state: withChanges(state, c => ({ ...c, hexes: { ...c.hexes, [k]: { ...ch, wreck: { ...ch.wreck, work } } } })),
    events: [ev('WreckClearing', { hex: { ...h }, kind: ch.wreck.kind, work, of: need })], cleared: false };
}
