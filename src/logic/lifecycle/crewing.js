// Recrew, capture, manual abandon and wreck clearing (docs/unit-state.md §6). Owns fsm.life, team, sbps.
// The route sequences the other owners: members (combat), stance (crew), morale and veterancy (status), the wreck (terrain).
import { transition } from '../fsm/index.js';
import { putUnit, unitAt } from '../state/index.js';
import { ev } from '../events/index.js';
import { distance, neighbours, inside } from '../hex/index.js';
import { hexAt } from '../terrain/index.js';
import { stepCost } from '../movement/index.js';
import { LIFE } from './life.js';

const alive = m => m.hp > 0;
const teamWeapon = (u, data) => data.units.sbps[u.sbps]?.team_weapon ?? null;

/** The recrewable entity of a unit (its towed gun or the vehicle itself) with its CoH3 recrew block, or null. */
function recrewable(u, data) {
  const tw = teamWeapon(u, data);
  const member = tw?.weapon_entity ? u.members.find(m => m.ebps === tw.weapon_entity) : u.kind === 'vehicle' ? u.members[0] : null;
  const recrew = member && data.units.ebps[member.ebps]?.recrew;
  return recrew ? { member, recrew } : null;
}

/** Men on foot: an infantry squad, or a gun crew without a living gun. */
function onFoot(u, data) {
  if (u.kind === 'squad') return true;
  const tw = teamWeapon(u, data);
  return !!tw?.weapon_entity && !u.members.some(m => m.ebps === tw.weapon_entity && alive(m));
}

/**
 * Recrew / capture: { unit (squad), target (DECREWED gun) }. On or next to the hex, with between min_crew and max_squad men;
 * own or enemy equipment alike. Abandoned vehicles need a recrewable blueprint (not in the data yet). → reason or null
 */
export function validateRecrew(state, cmd, data) {
  const squad = state.units[cmd.unit], gun = state.units[cmd.target];
  if (!gun || gun.fsm.life !== 'DECREWED') return 'not_recrewable';
  const r = recrewable(gun, data), faction = state.teams[squad.team].faction;
  if (!r || !r.recrew.by_faction[faction] || !teamWeapon({ sbps: r.recrew.by_faction[faction] }, data)) return 'not_recrewable';
  if (!onFoot(squad, data)) return 'cannot_recrew';
  if (distance(squad.pos, gun.pos) > 1) return 'too_far';
  const men = squad.members.filter(alive).length;
  return men >= r.recrew.min_crew && men <= r.recrew.max_squad ? null : 'wrong_squad_size';
}

/** The gun's members after a recrew: the gun, then every man of the squad as a crewman of the new blueprint (HP kept, capped). */
export function recrewMembers(state, gunId, squadId, data) {
  const gun = state.units[gunId], squad = state.units[squadId], r = recrewable(gun, data);
  const crewEntity = teamWeapon({ sbps: r.recrew.by_faction[state.teams[squad.team].faction] }, data).crew_entity, cap = data.units.ebps[crewEntity].hp;
  return [r.member, ...squad.members.filter(alive).map(m => ({ ebps: crewEntity, hp: Math.min(m.hp, cap) }))];
}

/** The squad becomes the crew: the gun turns ACTIVE under the squad's side as its faction's blueprint; the squad is gone. */
export function recrew(state, gunId, squadId, data) {
  const gun = state.units[gunId], squad = state.units[squadId];
  const sbps = recrewable(gun, data).recrew.by_faction[state.teams[squad.team].faction];
  const t = transition(LIFE, { ...gun, team: squad.team, sbps }, 'ACTIVE');
  const { [squadId]: gone, ...units } = putUnit(state, t.unit).units;
  return { state: { ...state, units }, events: [ev('Recrewed', { unit: gunId, by: squadId, team: squad.team, sbps }), ...t.events, ev('UnitRemoved', { unit: squadId })] };
}

/** A free hex next to the unit that men on foot can step onto (the first in direction order), or null. */
export function freeNeighbour(state, data, unitId) {
  const u = state.units[unitId];
  return neighbours(u.pos).find(h => inside(h, state.map.cols, state.map.rows) && !unitAt(state, h) && stepCost(state, data, u.pos, h, 'infantry') != null) ?? null;
}

/** Manual abandon (CoH3 can_manual_abandon): a towed gun with a living crew and a free hex beside it. → reason or null */
export function validateAbandon(state, cmd, data) {
  const u = state.units[cmd.unit], r = recrewable(u, data), tw = teamWeapon(u, data);
  if (!r?.recrew.manual_abandon || !tw?.weapon_entity || !alive(r.member)) return 'cannot_abandon';
  if (!u.members.some(m => m.ebps === tw.crew_entity && alive(m))) return 'cannot_abandon';
  return freeNeighbour(state, data, cmd.unit) ? null : 'no_room';
}

/** Abandon splits the unit: the gun stays (gun members), the living crew walks away with its HP (crew members). */
export function splitCrew(state, unitId, data) {
  const u = state.units[unitId], tw = teamWeapon(u, data);
  return { gun: u.members.filter(m => m.ebps === tw.weapon_entity), crew: u.members.filter(m => m.ebps === tw.crew_entity && alive(m)) };
}

/** The gun left behind: DECREWED, no owner (its crew is now a separate unit next to it). The route exhausts it first (turn). */
export function abandon(state, unitId) {
  const u = state.units[unitId];
  const t = transition(LIFE, { ...u, team: null }, 'DECREWED');
  return { state: putUnit(state, t.unit), events: [ev('Abandoned', { unit: unitId, team: u.team }), ...t.events] };
}

/** Clear a wreck: a unit of a clearing role (data/rules/terrain.json wreck_clearing), on or next to the wreck. → reason or null */
export function validateClearWreck(state, cmd, data) {
  const u = state.units[cmd.unit];
  if (!data.rules.terrain.wreck_clearing.roles.includes(data.units.sbps[u.sbps].role)) return 'cannot_clear';
  if (!cmd.hex || distance(u.pos, cmd.hex) > 1) return 'too_far';
  return hexAt(state, data, cmd.hex).featureKind === 'wreck' ? null : 'no_wreck';
}
