// Action axis (docs/unit-state.md §5.1) and the per-unit budget: one move allowance (move points, spent by Move and
// Turn, in any number of steps) and one action (fire, ability, emplace, build, repair, board …) in either order,
// plus counter fire in the enemy turn (SPEC §10). Owns fsm.action, budget, overwatch.
import { defineMachine, transition } from '../fsm/index.js';
import { putUnit } from '../state/index.js';
import { movePoints } from '../movement/index.js';
import { firingWeapons } from '../combat/index.js';

/** Commands that spend move points; every other unit command spends the action. */
export const MOVE_COMMANDS = Object.freeze(['Move', 'Turn']);

/** 'Counter' is the reaction in the enemy turn: every axis may veto it like a command. */
const SPENT = ['Move', 'Turn', 'Attack', 'AttackFeature', 'Emplace', 'Pack', 'Hold', 'UseSkill', 'Build', 'Repair', 'Board', 'Recrew', 'Abandon', 'ClearWreck', 'Convert', 'Rebuild'];

export const ACTION = defineMachine('action', 'EXHAUSTED', {
  IDLE: {},
  MOVING: { allows: [] },      // only inside a Move command (events), never stored between commands
  ATTACKING: { allows: [] },   // only inside an Attack command
  OVERWATCH: { denies: { Move: 'on_overwatch', Turn: 'on_overwatch' }, allows: ['Counter'] },
  EXHAUSTED: { allows: ['Counter'], denies: Object.fromEntries(SPENT.map(c => [c, 'no_actions_left'])) },
});

/**
 * Budget at the unit's own turn start (SPEC §10). A shocked crew gets no action (§5.5 criticals); `shocked` tells
 * lifecycle the shock was served, so it clears it at the turn end. The counter is armed at the enemy's turn start.
 */
export function freshBudget(unit, data) {
  const shocked = unit.criticals.includes('crew_shocked');
  return { move: movePoints(unit, data), action: shocked ? 0 : 1, counter: 0, moved: false, fired: false, shocked };
}

/** Own turn start for one unit: fresh budget, IDLE (overwatch ends). Inactive units stay EXHAUSTED with nothing. */
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

/**
 * Reload (SPEC §10 indirect cadence): a weapon that fires one volley every N turns (indirect.usage_turns) reloads for the
 * N − 1 own turns after the one it fired in; a reloading unit neither fires nor counter fires.
 */
export function startReload(state, unitId, data) {
  const u = state.units[unitId];
  const turns = Math.max(0, ...firingWeapons(u, data).map(w => (w.weapon.indirect?.usage_turns ?? 1) - 1));
  if (turns <= u.timers.reload) return { state, events: [] };
  return { state: putUnit(state, { ...u, timers: { ...u.timers, reload: turns } }), events: [] };
}

export const reloadCheck = unit => (unit.timers.reload > 0 ? 'reloading' : null);

/** Own turn end: whatever is left lapses (an MG on overwatch keeps waiting); a turn spent not firing counts toward the reload. */
export function actionTurnEnd(state, unitId) {
  let u = state.units[unitId];
  if (u.fsm.life !== 'ACTIVE') return { state, events: [] };
  if (u.timers.reload > 0 && !u.budget.fired) u = { ...u, timers: { ...u.timers, reload: u.timers.reload - 1 } };
  if (u.fsm.action === 'OVERWATCH') return { state: putUnit(state, u), events: [] };
  const t = transition(ACTION, { ...u, budget: { ...u.budget, move: 0, action: 0 } }, 'EXHAUSTED');
  return { state: putUnit(state, t.unit), events: t.events };
}

/** Enemy turn start: counter fire armed (data/balance/turn.json); last turn's moved / fired no longer apply. */
export function armCounter(state, unitId, data) {
  const u = state.units[unitId];
  if (u.fsm.life !== 'ACTIVE') return { state, events: [] };
  return { state: putUnit(state, { ...u, budget: { ...u.budget, counter: data.balance.turn.counter.per_enemy_turn, moved: false, fired: false } }), events: [] };
}

export const counterCheck = unit => (unit.budget.counter > 0 ? null : 'no_counter_left');

export function spendCounter(state, unitId) {
  const u = state.units[unitId];
  return { state: putUnit(state, { ...u, budget: { ...u.budget, counter: u.budget.counter - 1 } }), events: [] };
}
