// Construction: rebuilding a destroyed HQ on its own footprint (2026-11-26), so a side never has more than one HQ, and
// squads building the structures on their CoH3 build menu that are units (bunkers, fighting positions, emplacements).
// Owns timers.build (work turns a site still needs). Walls, wire and mines (map lines / objects) are not built yet.
import { distance, fromKey, inside } from '../hex/index.js';
import { unitAt, putUnit } from '../state/index.js';
import { mapOf, isCollapsed, hexAt, structureAt } from '../terrain/index.js';
import { canAfford, priceOf } from '../economy/index.js';

/** The rebuild rule of a structure's kind (data/rules/terrain.json structures.<kind>.rebuild), or null. */
export const rebuildOf = (state, data, id) => data.rules.terrain.structures[mapOf(state, data).structures[id]?.kind]?.rebuild ?? null;

/** Has rebuilding started (paid)? */
const started = (state, id) => (state.map.changes.structures[id]?.work ?? 0) > 0;

/**
 * Rebuild command: { unit, structure }. The side's own destroyed building of a rebuildable kind; a unit of a rebuild role
 * within 2 hexes of its footprint (SPEC §3 build range); the footprint clear of units; the cost in hand when work starts.
 */
export function validateRebuild(state, cmd, data) {
  const u = state.units[cmd.unit], s = mapOf(state, data).structures[cmd.structure], r = rebuildOf(state, data, cmd.structure);
  if (!s || !r || s.team !== u.team) return 'cannot_rebuild';
  if (!isCollapsed(state, cmd.structure)) return 'not_destroyed';
  if (!r.roles.includes(data.units.sbps[u.sbps].role)) return 'cannot_build';
  const hexes = s.hexes.map(fromKey);
  if (!hexes.some(h => distance(u.pos, h) <= 2)) return 'too_far';
  if (hexes.some(h => unitAt(state, h))) return 'hex_occupied';
  return started(state, cmd.structure) || canAfford(state, u.team, r.cost) ? null : 'cannot_afford';
}

/** The price to pay now: the rebuild cost when work starts, nothing after. */
export const rebuildCost = (state, data, id) => (started(state, id) ? {} : rebuildOf(state, data, id).cost);

/** Structure squads a unit can build: kind structure, source built, its entity on the unit's CoH3 build menu. */
export function buildable(unit, data) {
  const menu = data.units.sbps[unit.sbps].build?.menu || [];
  return Object.entries(data.units.sbps).filter(([, s]) => s.kind === 'structure' && s.source === 'built' && menu.includes(s.members[0]?.entity)).map(([id]) => id);
}

/**
 * Build command. New site { unit, sbps, hex }: a structure on the unit's build menu, 1–2 hexes away (never its own hex),
 * on open ground with no unit, building or capture point (SPEC §3 build range), its price in hand.
 * More work { unit, site }: an own site still under construction, 1–2 hexes away, that the unit could have built.
 */
export function validateBuild(state, cmd, data) {
  const u = state.units[cmd.unit];
  if (cmd.site) {
    const site = state.units[cmd.site];
    if (!site || site.team !== u.team || site.fsm.life !== 'CONSTRUCTING') return 'not_a_site';
    if (!buildable(u, data).includes(site.sbps)) return 'cannot_build';
    return distance(u.pos, site.pos) <= 2 ? null : 'too_far';
  }
  if (!buildable(u, data).includes(cmd.sbps)) return 'cannot_build';
  const d = cmd.hex && distance(u.pos, cmd.hex);
  if (!d || d > 2) return 'too_far';
  const t = hexAt(state, data, cmd.hex), points = new Set(mapOf(state, data).points.map(p => p.hex));
  if (!inside(cmd.hex, state.map.cols, state.map.rows) || t.oob || t.feature || t.ground.cost.infantry == null || structureAt(state, data, cmd.hex)
    || points.has(`${cmd.hex.c},${cmd.hex.r}`)) return 'bad_hex';
  if (unitAt(state, cmd.hex)) return 'hex_occupied';
  return canAfford(state, u.team, priceOf(cmd.sbps, data)) ? null : 'cannot_afford';
}

/** A new site: CoH3 build turns, the first one done by the placing builder (SPEC §3: a site starts at 50 % HP). */
export function startSite(state, siteId, data) {
  const u = state.units[siteId];
  return { state: putUnit(state, { ...u, timers: { ...u.timers, build: (data.units.sbps[u.sbps].build_turns ?? 1) - 1 } }), events: [] };
}

/** One more turn of work on a site. */
export function work(state, siteId) {
  const u = state.units[siteId];
  return { state: putUnit(state, { ...u, timers: { ...u.timers, build: Math.max(0, u.timers.build - 1) } }), events: [] };
}

export const isBuilt = (state, siteId) => state.units[siteId]?.fsm.life === 'CONSTRUCTING' && state.units[siteId].timers.build <= 0;

/** Site HP: placed at half (SPEC §3: a site starts at 50 % HP); finishing adds the other half, keeping damage taken. */
export const siteMembers = (unit, data, finished) => unit.members.map(m => {
  const max = data.units.ebps[m.ebps].hp, half = Math.round(max / 2);
  return { ...m, hp: finished ? Math.min(max, m.hp + max - half) : half };
});
