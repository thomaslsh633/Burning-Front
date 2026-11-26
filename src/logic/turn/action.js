// Action axis (docs/unit-state.md §5.1) and the per-unit budget: one move allowance (move points, spent by Move and
// Turn, in any number of steps) and one action (fire, ability, emplace, build, repair, board …) in either order,
// plus one counter fire in the enemy turn (SPEC §10). Owns fsm.action, budget, overwatch.
import { defineMachine, transition } from '../fsm/index.js';
import { putUnit } from '../state/index.js';
import { movePoints } from '../movement/index.js';

/** Commands that spend move points; every other unit command spends the action. */
export const MOVE_COMMANDS = Object.freeze(['Move', 'Turn']);

export const ACTION = defineMachine('action', 'EXHAUSTED', {
  IDLE: {},
  MOVING: { allows: [] },      // only inside a Move command (events), never stored between commands
  ATTACKING: { allows: [] },   // only inside an Attack command
  OVERWATCH: { denies: { Move: 'on_overwatch', Turn: 'on_overwatch' }, allows: [] },
  EXHAUSTED: { allows: [], denies: Object.fromEntries(['Move', 'Turn', 'Attack', 'Emplace', 'Pack', 'Hold', 'UseSkill', 'Build', 'Repair', 'Board', 'Recrew']
    .map(c => [c, 'no_actions_left'])) },
});

/** Budget at the unit's own turn start (SPEC §10); a shocked crew gets no action (§5.5 criticals). */
export function freshBudget(unit, data) {
  return { move: movePoints(unit, data), action: unit.criticals.includes('crew_shocked') ? 0 : 1, counter: 1, moved: false, fired: false };
}

/** Own turn start for one unit: fresh budget, IDLE. Inactive units stay EXHAUSTED with nothing. */
export function refreshUnit(state, unitId, data) {
  const u = state.units[unitId];
  if (u.fsm.life !== 'ACTIVE') return { state, events: [] };
  const t = transition(ACTION, { ...u, budget: freshBudget(u, data), overwatch: null }, 'IDLE');
  return { state: putUnit(state, t.unit), events: t.events };
}

/** Reason the unit cannot pay for this command now, or null. cost: move points for Move / Turn. */
export function budgetCheck(unit, commandType, cost = 0) {
  if (MOVE_COMMANDS.includes(commandType)) return unit.budget.move >= cost && (cost > 0 || commandType === 'Turn') ? null : 'no_move_left';
  return unit.budget.action > 0 ? null : 'no_action_left';
}

/** Pay for a command: { move?, action?, fired? } → state with the budget spent; EXHAUSTED when nothing is left. */
export function spend(state, unitId, { move = 0, action = 0, fired = false }) {
  const u = state.units[unitId];
  const budget = { ...u.budget, move: u.budget.move - move, action: u.budget.action - action,
    moved: u.budget.moved || move > 0, fired: u.budget.fired || fired };
  let unit = { ...u, budget };
  const events = [];
  if (budget.move <= 0 && budget.action <= 0) {
    const t = transition(ACTION, unit, 'EXHAUSTED');
    unit = t.unit; events.push(...t.events);
  }
  return { state: putUnit(state, unit), events };
}

/** End the unit's turn now (retreat, leaving ACTIVE): no budget, EXHAUSTED, overwatch dropped. */
export function exhaust(state, unitId) {
  const u = state.units[unitId];
  const t = transition(ACTION, { ...u, budget: { ...u.budget, move: 0, action: 0, counter: 0 }, overwatch: null }, 'EXHAUSTED');
  return { state: putUnit(state, t.unit), events: t.events };
}
