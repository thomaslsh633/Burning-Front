// Overwatch (docs/unit-state.md §5.1.1, SPEC §10): only emplaced machine-gun teams hold. An MG on OVERWATCH fires once in
// the enemy turn at the first enemy that steps into its arc, range and sight, then is EXHAUSTED. Eligibility comes from
// data (unit kind + weapon class, data/balance/turn.json); stance and morale vetoes are the crew and status machines'.
import { transition } from '../fsm/index.js';
import { putUnit, enemyOf } from '../state/index.js';
import { ev } from '../events/index.js';
import { firingWeapons, weaponReach } from '../combat/index.js';
import { unitSees } from '../vision/index.js';
import { ACTION } from './action.js';

/** The weapon this unit would overwatch with, or null. */
export function overwatchWeapon(unit, data) {
  const o = data.balance.turn.overwatch;
  if (!o.kinds.includes(unit.kind)) return null;
  return firingWeapons(unit, data).find(w => o.weapon_classes.includes(w.weapon.class)) ?? null;
}

/** Hold command check (stance EMPLACED and morale are vetoed by their machines). → reason or null */
export function validateHold(state, cmd, data) {
  const u = state.units[cmd.unit];
  if (!overwatchWeapon(u, data)) return 'cannot_overwatch';
  if (u.budget.fired) return 'fired_this_turn';
  return u.budget.action > 0 ? null : 'no_action_left';
}

/** Hold: the rest of the turn is spent waiting; the arc is the weapon's around the hull facing. */
export function hold(state, unitId, data) {
  const u = state.units[unitId], w = overwatchWeapon(u, data);
  const overwatch = { weapon: w.id, facing: u.facing, arc_deg: w.weapon.attack.arc_deg ?? 360 };
  const t = transition(ACTION, { ...u, overwatch, budget: { ...u.budget, move: 0, action: 0 } }, 'OVERWATCH');
  return { state: putUnit(state, t.unit), events: t.events };
}

/** Units of the mover's enemy on OVERWATCH that see the mover where it stands and can hit it there. */
export function overwatchers(state, data, moverId) {
  const mover = state.units[moverId];
  if (!mover || mover.fsm.life !== 'ACTIVE' || !mover.team) return [];
  const enemy = enemyOf(state, mover.team);
  return Object.values(state.units).filter(u => u.team === enemy && u.fsm.action === 'OVERWATCH' && u.fsm.life === 'ACTIVE'
    && unitSees(state, data, u, mover)
    && firingWeapons(u, data).some(w => w.id === u.overwatch.weapon && !weaponReach(state, data, u, w, mover.pos)))
    .map(u => u.id);
}

/** The reaction fired: overwatch over, nothing left until the own turn start. */
export function overwatchFired(state, unitId, targetId) {
  const u = state.units[unitId];
  const t = transition(ACTION, { ...u, overwatch: null }, 'EXHAUSTED');
  return { state: putUnit(state, t.unit), events: [ev('OverwatchFired', { unit: unitId, target: targetId }), ...t.events] };
}

/** Should the mover's walk stop here? Dead, or its morale fell into a stopping state (data). */
export function stopsMover(state, data, moverId) {
  const u = state.units[moverId];
  return !u || u.fsm.life !== 'ACTIVE' || data.balance.turn.overwatch.stops_mover.includes(u.fsm.morale);
}
