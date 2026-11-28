// Location axis (docs/unit-state.md §5.3): ON_MAP, GARRISONED (inside a building), LOADED (inside a transport or a fortified
// position). Owns fsm.location and container. Capacity counts squads: an infantry squad takes 1 slot, a carried heavy weapon
// team (HMG, mortar) 1 as well (2026-11-28); towed guns and vehicles never go inside. Buildings hold their `garrison` slots
// (data/rules/terrain.json) and take squads and MG teams (SPEC §5); a unit with a `hold` (CoH3 hold_ext: transports,
// bunkers, fighting positions) holds its `slots` and takes heavy weapon teams only when `heavy_weapons`.
import { defineMachine, transition } from '../fsm/index.js';
import { putUnit, unitAt } from '../state/index.js';
import { ev } from '../events/index.js';
import { distance, fromKey, neighbours, inside } from '../hex/index.js';
import { mapOf, structureAt, isCollapsed } from '../terrain/index.js';
import { stepCost, moveClass } from '../movement/index.js';

const INSIDE = ['Move', 'Turn', 'Emplace', 'Pack', 'Hold', 'Board', 'Garrison', 'Retreat', 'Recrew', 'Abandon', 'ClearWreck', 'Rebuild', 'Build', 'Convert', 'Upgrade'];
export const LOCATION = defineMachine('location', 'ON_MAP', {
  ON_MAP: { denies: { Exit: 'not_inside' } },
  GARRISONED: { denies: Object.fromEntries([...INSIDE.filter(c => !['Emplace', 'Pack'].includes(c)), 'Unload'].map(c => [c, 'garrisoned'])) },   // fires out, MGs set up, exits
  LOADED: { denies: Object.fromEntries([...INSIDE, 'Unload', 'Attack', 'AttackFeature', 'Counter'].map(c => [c, 'loaded'])) },   // only exits
});

const alive = m => m.hp > 0;
const holdOf = (unit, data) => data.units.ebps[unit.members[0]?.ebps]?.hold ?? null;

/** Slots a unit takes inside, or null when it cannot go in (vehicles, structures, towed guns). */
export function slotsOf(unit, data) {
  if (unit.kind === 'squad') return 1;
  const tw = data.units.sbps[unit.sbps].team_weapon;
  return unit.kind === 'team_weapon' && tw?.weapon && !tw.weapon_entity ? 1 : null;   // a carried (small) team weapon: one slot
}
const isMgTeam = (unit, data) => data.units.weapon[data.units.sbps[unit.sbps].team_weapon?.weapon]?.class === 'hmg';

/** A container by id: a standing map building, or a unit with a hold. → { id, kind: 'building' | 'unit', slots, hexes, team, accepts(unit) } */
export function containerOf(state, data, id) {
  const s = mapOf(state, data).structures[id];
  if (s) {
    const slots = data.rules.terrain.structures[s.kind]?.garrison ?? 0;
    if (!slots || isCollapsed(state, id)) return null;
    return { id, kind: 'building', slots, hexes: s.hexes.map(fromKey), team: s.team ?? null, accepts: u => u.kind === 'squad' || isMgTeam(u, data) };
  }
  const u = state.units[id], hold = u && u.fsm.life === 'ACTIVE' && holdOf(u, data);
  if (!hold) return null;
  return { id, kind: 'unit', slots: hold.slots, hexes: [u.pos], team: u.team, accepts: x => x.kind === 'squad' || hold.heavy_weapons };
}

export const passengers = (state, id) => Object.values(state.units).filter(u => u.container === id);
const used = (state, data, id) => passengers(state, id).reduce((n, u) => n + (slotsOf(u, data) ?? 0), 0);

/**
 * Enter: { unit, into } — a building (Garrison) or an own unit with a hold (Board). Next to it, room for the unit's slots,
 * a building not held by the enemy, move left (entering ends the move). → reason or null
 */
export function validateEnter(state, cmd, data) {
  const u = state.units[cmd.unit], c = containerOf(state, data, cmd.into);
  if (!c) return 'no_room_inside';
  const need = slotsOf(u, data);
  if (need == null || !c.accepts(u)) return 'cannot_go_inside';
  if (c.kind === 'unit' && c.team !== u.team) return 'not_your_transport';
  if (c.kind === 'building' && passengers(state, c.id).some(p => p.team !== u.team)) return 'held_by_enemy';
  if (!c.hexes.some(h => distance(u.pos, h) <= 1)) return 'too_far';
  if (used(state, data, c.id) + need > c.slots) return 'full';
  return u.budget.move > 0 ? null : 'no_move_left';
}

/** Go inside (location and container; the position is the movement system's, set by the route). */
export function enter(state, unitId, containerId, data) {
  const u = state.units[unitId], c = containerOf(state, data, containerId);
  const t = transition(LOCATION, { ...u, container: containerId }, c.kind === 'building' ? 'GARRISONED' : 'LOADED');
  return { state: putUnit(state, t.unit), events: [ev(c.kind === 'building' ? 'Garrisoned' : 'Boarded', { unit: unitId, container: containerId }), ...t.events] };
}

/** A free hex next to the container that the unit can stand on. preferred: a hex the player chose (must qualify). */
export function exitHex(state, data, unitId, preferred) {
  const u = state.units[unitId], c = containerOf(state, data, u.container) ?? { hexes: [u.pos] };
  const cls = moveClass(u, data) ?? 'infantry';
  const ok = h => inside(h, state.map.cols, state.map.rows) && !unitAt(state, h) && !structureAt(state, data, h)
    && c.hexes.some(f => distance(f, h) === 1 && stepCost(state, data, f, h, cls) != null);
  if (preferred) return ok(preferred) ? preferred : null;
  return c.hexes.flatMap(neighbours).find(ok) ?? null;
}

/** Exit: { unit, hex? } — out onto a free hex beside the container; costs one move point. → reason or null */
export function validateExit(state, cmd, data) {
  const u = state.units[cmd.unit];
  if (!exitHex(state, data, cmd.unit, cmd.hex)) return cmd.hex ? 'bad_hex' : 'no_room_outside';
  return u.budget.move > 0 ? null : 'no_move_left';
}

/** Out again: on the map, no container. */
export function leave(state, unitId) {
  const u = state.units[unitId], from = u.container;
  const t = transition(LOCATION, { ...u, container: null }, 'ON_MAP');
  return { state: putUnit(state, t.unit), events: [ev('Exited', { unit: unitId, container: from }), ...t.events] };
}

/** Unload: the transport (or position) puts every passenger out. → reason or null */
export function validateUnload(state, cmd) {
  return passengers(state, cmd.unit).length ? null : 'empty';
}

/** Passengers whose container unit is gone (destroyed): they get out, losing models (CoH3 percent_unload_on_death). */
export const stranded = state => Object.values(state.units).filter(u => u.fsm.location === 'LOADED' && !state.units[u.container]);

/** Members a stranded passenger keeps: the first share of its living models (at least none). */
export function survivors(unit, share) {
  let keep = Math.floor(unit.members.filter(alive).length * share);
  return unit.members.map(m => (alive(m) && keep-- > 0 ? m : { ...m, hp: 0 }));
}
