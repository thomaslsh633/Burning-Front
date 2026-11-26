// Lifecycle axis (docs/unit-state.md §5.5): the top of the hierarchy. Owns fsm.life, criticals, crew, team.
// D2-6: deaths and criticals. Recrew, abandon and wreck clearing follow (D2-7).
import { defineMachine, transition } from '../fsm/index.js';
import { putUnit } from '../state/index.js';
import { ev } from '../events/index.js';
import { exhaust } from '../turn/index.js';
import { placeWreck } from '../terrain/index.js';

const NOTHING = reason => ({ allows: [], denies: Object.fromEntries(['Move', 'Turn', 'Attack', 'AttackFeature', 'Emplace', 'Pack', 'Hold', 'UseSkill', 'Build', 'Repair', 'Board', 'Recrew', 'Retreat'].map(c => [c, reason])) });

export const LIFE = defineMachine('life', 'ACTIVE', {
  ACTIVE: {},
  DECREWED: NOTHING('decrewed'),
  ABANDONED: NOTHING('abandoned'),
});

const alive = m => m.hp > 0;

/** Leave ACTIVE: no owner, no budget. */
function retire(state, unitId, to, extraEvents) {
  const x = exhaust(state, unitId);
  const t = transition(LIFE, { ...x.state.units[unitId], team: null }, to);
  return { state: putUnit(x.state, t.unit), events: [...extraEvents, ...x.events, ...t.events] };
}

/** Remove a dead unit; vehicles, emplacements and guns leave a wreck object on their hex (logic/terrain, SPEC §10). */
function remove(state, data, unitId, wreck) {
  const u = state.units[unitId], { [unitId]: gone, ...units } = state.units;
  let s = { ...state, units }, events = [ev('UnitDestroyed', { unit: unitId, team: u.team }), ev('UnitRemoved', { unit: unitId })];
  if (wreck && u.fsm.location === 'ON_MAP') { const w = placeWreck(s, data, u.pos, wreck); s = w.state; events = [...events, ev('Wrecked', { unit: unitId }), ...w.events]; }
  return { state: s, events };
}

const wreckKind = u => (u.kind === 'vehicle' ? 'vehicle' : u.kind === 'structure' || u.kind === 'team_weapon' ? 'emplacement' : null);

/**
 * After damage: an infantry squad with no men is removed; a team weapon whose crew died while the gun stands is DECREWED;
 * a vehicle, structure or gun with no HP is removed and leaves a wreck. A towed gun destroyed under a living crew leaves
 * the crew as the unit (it can no longer fire, but can retreat and recrew).
 */
export function checkDeaths(state, unitId, data) {
  const u = state.units[unitId];
  if (!u || u.fsm.life !== 'ACTIVE') return { state, events: [] };
  const tw = data.units.sbps[u.sbps].team_weapon;
  const living = u.members.filter(alive);
  if (tw?.weapon_entity) {
    const gun = u.members.find(m => m.ebps === tw.weapon_entity), crew = u.members.filter(m => m.ebps === tw.crew_entity);
    if (gun && alive(gun) && !crew.some(alive)) return retire(state, unitId, 'DECREWED', [ev('CrewWiped', { unit: unitId, team: u.team })]);
    if (!living.length) return remove(state, data, unitId, wreckKind(u));
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
