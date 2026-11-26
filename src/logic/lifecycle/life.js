// Lifecycle axis (docs/unit-state.md §5.5): the top of the hierarchy. Owns fsm.life, criticals, crew, team.
// D2-6: deaths and criticals. Recrew, abandon and wreck clearing follow (D2-7).
import { defineMachine, transition } from '../fsm/index.js';
import { putUnit } from '../state/index.js';
import { ev } from '../events/index.js';
import { exhaust } from '../turn/index.js';

const NOTHING = reason => ({ allows: [], denies: Object.fromEntries(['Move', 'Turn', 'Attack', 'Emplace', 'Pack', 'Hold', 'UseSkill', 'Build', 'Repair', 'Board', 'Recrew', 'Retreat'].map(c => [c, reason])) });

export const LIFE = defineMachine('life', 'ACTIVE', {
  ACTIVE: {},
  DECREWED: NOTHING('decrewed'),
  ABANDONED: NOTHING('abandoned'),
  WRECKED: NOTHING('wrecked'),
});

const alive = m => m.hp > 0;

/** Leave ACTIVE: no owner, no budget. */
function retire(state, unitId, to, extraEvents) {
  const x = exhaust(state, unitId);
  const t = transition(LIFE, { ...x.state.units[unitId], team: null }, to);
  return { state: putUnit(x.state, t.unit), events: [...extraEvents, ...x.events, ...t.events] };
}

/**
 * After damage: an infantry squad with no men is removed; a team weapon whose crew died while the gun stands is DECREWED;
 * a vehicle, structure or gun with no HP becomes a WRECK (terrain). A towed gun destroyed under a living crew leaves the
 * crew as the unit (it can no longer fire, but can retreat and recrew).
 */
export function checkDeaths(state, unitId, data) {
  const u = state.units[unitId];
  if (!u || u.fsm.life !== 'ACTIVE') return { state, events: [] };
  const tw = data.units.sbps[u.sbps].team_weapon;
  const living = u.members.filter(alive);
  if (tw?.weapon_entity) {
    const gun = u.members.find(m => m.ebps === tw.weapon_entity), crew = u.members.filter(m => m.ebps === tw.crew_entity);
    if (gun && alive(gun) && !crew.some(alive)) return retire(state, unitId, 'DECREWED', [ev('CrewWiped', { unit: unitId, team: u.team })]);
    if (!living.length) return retire(state, unitId, 'WRECKED', [ev('UnitDestroyed', { unit: unitId, team: u.team }), ev('Wrecked', { unit: unitId })]);
    return { state, events: [] };
  }
  if (living.length) return { state, events: [] };
  if (u.kind === 'vehicle' || u.kind === 'structure') {
    return retire(state, unitId, 'WRECKED', [ev('UnitDestroyed', { unit: unitId, team: u.team }), ev('Wrecked', { unit: unitId })]);
  }
  const { [unitId]: gone, ...units } = state.units;
  return { state: { ...state, units }, events: [ev('UnitDestroyed', { unit: unitId, team: u.team }), ev('UnitRemoved', { unit: unitId })] };
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
