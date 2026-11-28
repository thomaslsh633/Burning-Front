// Lifecycle axis (docs/unit-state.md §5.5): the top of the hierarchy. Owns fsm.life, criticals, crew, team.
// Deaths and criticals; recrew, abandon and wreck clearing are in crewing.js.
import { defineMachine, transition } from '../fsm/index.js';
import { putUnit } from '../state/index.js';
import { ev } from '../events/index.js';
import { exhaust } from '../turn/index.js';
import { placeWreck } from '../terrain/index.js';

const NOTHING = reason => ({ allows: [], denies: Object.fromEntries(['Move', 'Turn', 'Attack', 'AttackFeature', 'Emplace', 'Pack', 'Hold', 'UseSkill', 'Build', 'Repair', 'Board', 'Recrew', 'Abandon', 'ClearWreck', 'Convert', 'Rebuild', 'Upgrade', 'Garrison', 'Exit', 'Unload', 'Retreat', 'Counter'].map(c => [c, reason])) });

export const LIFE = defineMachine('life', 'ACTIVE', {
  ACTIVE: {},
  DECREWED: NOTHING('decrewed'),   // team weapons only: vehicles are never abandoned or captured (2026-11-26)
  CONSTRUCTING: NOTHING('under_construction'),   // a structure site: can be shot, does nothing until built (logic/build)
});

const alive = m => m.hp > 0;

/** Leave ACTIVE: no owner, no budget. */
function retire(state, unitId, to, extraEvents) {
  const x = exhaust(state, unitId);
  const t = transition(LIFE, { ...x.state.units[unitId], team: null }, to);
  return { state: putUnit(x.state, t.unit), events: [...extraEvents, ...x.events, ...t.events] };
}

/** Remove a dead unit; vehicles, emplacements and guns leave a wreck object on their hex (logic/terrain, SPEC §10). */
export function remove(state, data, unitId, wreck) {
  const u = state.units[unitId], { [unitId]: gone, ...units } = state.units;
  let s = { ...state, units }, events = [ev('UnitDestroyed', { unit: unitId, team: u.team }), ev('UnitRemoved', { unit: unitId })];
  if (wreck && u.fsm.location === 'ON_MAP') { const w = placeWreck(s, data, u.pos, wreck); s = w.state; events = [...events, ev('Wrecked', { unit: unitId }), ...w.events]; }
  return { state: s, events };
}

const wreckKind = u => (u.kind === 'vehicle' ? 'vehicle' : u.kind === 'structure' || u.kind === 'team_weapon' ? 'emplacement' : null);

/**
 * After damage: an infantry squad with no men is removed; a team weapon whose crew died while the gun stands is DECREWED;
 * a vehicle, structure or gun with no HP is removed and leaves a wreck. A towed gun destroyed under a living crew leaves
 * the crew as the unit: a small infantry squad with its own small arms (logic/combat firingWeapons) that can recrew.
 */
export function checkDeaths(state, unitId, data) {
  const u = state.units[unitId];
  if (!u) return { state, events: [] };
  if (u.fsm.life === 'DECREWED') return u.members.some(alive) ? { state, events: [] } : remove(state, data, unitId, wreckKind(u));   // a crewless gun shot to pieces (CoH3)
  if (u.fsm.life === 'CONSTRUCTING') return u.members.some(alive) ? { state, events: [] } : remove(state, data, unitId, null);   // an unfinished site leaves nothing
  if (u.fsm.life !== 'ACTIVE') return { state, events: [] };
  const tw = data.units.sbps[u.sbps].team_weapon;
  const living = u.members.filter(alive);
  if (tw?.weapon_entity) {
    const gun = u.members.find(m => m.ebps === tw.weapon_entity), crew = u.members.filter(m => m.ebps === tw.crew_entity);
    if (gun && alive(gun) && !crew.some(alive)) return retire(state, unitId, 'DECREWED', [ev('CrewWiped', { unit: unitId, team: u.team })]);
    if (!living.length) return remove(state, data, unitId, gun ? wreckKind(u) : null);   // a crew without its gun leaves no wreck
    return { state, events: [] };
  }
  if (living.length) return { state, events: [] };
  return remove(state, data, unitId, wreckKind(u));
}

/** A building collapsed: every unit inside dies — infantry men and team weapons alike, no wreck (SPEC §10). */
export function killGarrison(state, data, unitIds) {
  let s = state;
  const events = [];
  for (const id of unitIds) {
    if (!s.units[id]) continue;
    const r = remove(s, data, id, null);
    s = r.state; events.push(...r.events);
  }
  return { state: s, events };
}

/** A structure placed by a builder becomes a site (it keeps its team). */
export function startConstruction(state, unitId) {
  const t = transition(LIFE, state.units[unitId], 'CONSTRUCTING');
  return { state: putUnit(state, t.unit), events: [ev('ConstructionStarted', { unit: unitId }), ...t.events] };
}

/** The site's work is done: the structure is ACTIVE from its side's next turn. */
export function finishConstruction(state, unitId) {
  const t = transition(LIFE, state.units[unitId], 'ACTIVE');
  return { state: putUnit(state, t.unit), events: [ev('ConstructionFinished', { unit: unitId }), ...t.events] };
}

/** Own turn end: a crew shock that cost this turn's action is over (docs/unit-state.md §5.5). */
export function lifeTurnEnd(state, unitId) {
  const u = state.units[unitId];
  if (!u.budget.shocked || !u.criticals.includes('crew_shocked')) return { state, events: [] };
  return { state: putUnit(state, { ...u, criticals: u.criticals.filter(c => c !== 'crew_shocked') }), events: [] };
}

/** Criticals from combat (a set: each at most once). */
export function applyCriticals(state, list) {
  let s = state;
  const events = [];
  for (const { unit, critical } of list) {
    const u = s.units[unit];
    if (!u || u.fsm.life !== 'ACTIVE' || u.criticals.includes(critical)) continue;
    s = putUnit(s, { ...u, criticals: [...u.criticals, critical] });
    events.push(ev('CriticalInflicted', { unit, critical }));
  }
  return { state: s, events };
}
