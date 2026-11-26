import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ACTION, freshBudget, refreshUnit, budgetCheck, spend, actionTurnEnd, armCounter, counterCheck, spendCounter, nextSide, openTurn, closeTurn } from '../../../src/logic/turn/index.js';
import { permits } from '../../../src/logic/fsm/index.js';
import { testMatch, tweak } from '../../helpers/match.js';
import { assertOwnsOnly } from '../../helpers/ownership.js';

const H = (c, r) => ({ c, r });

test('a fresh turn: move points and one action (the counter is armed in the enemy turn); shocked crews get no action', () => {
  const { state, data } = testMatch([{ team: 'blue', sbps: 'sherman_us', pos: H(2, 2) }]);
  assert.deepEqual(freshBudget(state.units.u1, data), { move: 6, action: 1, counter: 0, moved: false, fired: false, shocked: false });
  assert.deepEqual(freshBudget({ ...state.units.u1, criticals: ['crew_shocked'] }, data), { move: 6, action: 0, counter: 0, moved: false, fired: false, shocked: true });
  assert.equal(state.units.u1.fsm.action, 'IDLE');
});

test('inactive units stay exhausted at their turn start', () => {
  const { state, data } = testMatch([{ team: 'red', sbps: 'at_gun_57mm_us', pos: H(2, 2) }]);
  const decrewed = tweak(state, 'u1', { fsm: { ...state.units.u1.fsm, life: 'DECREWED' } });
  assert.equal(refreshUnit(decrewed, 'u1', data).state, decrewed);
});

test('spend: move and action in either order; EXHAUSTED when both are gone', () => {
  const { state } = testMatch([{ team: 'blue', sbps: 'riflemen_us', pos: H(2, 2) }]);
  const a = spend(state, 'u1', { action: 1, fired: true });
  assert.equal(a.state.units.u1.fsm.action, 'IDLE');
  assert.equal(a.state.units.u1.budget.fired, true);
  const b = spend(a.state, 'u1', { move: 4 });
  assert.equal(b.state.units.u1.fsm.action, 'EXHAUSTED');
  assert.deepEqual(b.events.map(e => e.to), ['EXHAUSTED']);
  assertOwnsOnly('turn', state, b.state);
  assert.deepEqual(permits([ACTION], b.state.units.u1, 'Move'), { ok: false, axis: 'action', state: 'EXHAUSTED', reason: 'no_actions_left' });
});

test('budget check', () => {
  const { state } = testMatch([{ team: 'blue', sbps: 'riflemen_us', pos: H(2, 2) }]);
  const u = state.units.u1;
  assert.equal(budgetCheck(u, 'Move', 3), null);
  assert.equal(budgetCheck(u, 'Move', 5), 'no_move_left');
  assert.equal(budgetCheck({ ...u, budget: { ...u.budget, action: 0 } }, 'Attack'), 'no_action_left');
});

test('own turn end: what is left lapses (EXHAUSTED); an MG on overwatch keeps waiting', () => {
  const { state } = testMatch([{ team: 'blue', sbps: 'riflemen_us', pos: H(2, 2) }, { team: 'blue', sbps: 'hmg_30cal_us', pos: H(4, 4) }]);
  const watching = tweak(state, 'u2', { fsm: { ...state.units.u2.fsm, action: 'OVERWATCH' }, overwatch: { weapon: 'w', facing: 0, arc_deg: 95 } });
  const r = actionTurnEnd(watching, 'u1');
  assert.deepEqual([r.state.units.u1.fsm.action, r.state.units.u1.budget.move, r.state.units.u1.budget.action], ['EXHAUSTED', 0, 0]);
  assert.equal(actionTurnEnd(watching, 'u2').state, watching);
  assertOwnsOnly('turn', watching, r.state);
});

test('counter fire: armed at the enemy turn start (moved / fired cleared), spent once, permitted while EXHAUSTED', () => {
  const { state, data } = testMatch([{ team: 'red', sbps: 'grenadier_ger', pos: H(2, 2) }]);
  const was = tweak(state, 'u1', { budget: { ...state.units.u1.budget, moved: true, fired: true } });
  const a = armCounter(was, 'u1', data);
  assert.deepEqual(a.state.units.u1.budget, { move: 0, action: 0, counter: 1, moved: false, fired: false });
  assert.equal(counterCheck(a.state.units.u1), null);
  const b = spendCounter(a.state, 'u1');
  assert.equal(counterCheck(b.state.units.u1), 'no_counter_left');
  assert.deepEqual(permits([ACTION], b.state.units.u1, 'Counter'), { ok: true });
  assertOwnsOnly('turn', was, b.state);
});

test('clock: the first side opens turn 1; the turn number grows when the first side moves again', () => {
  const { state } = testMatch([]);
  const fresh = { ...state, match: { ...state.match, side: null, turn: 0 } };
  assert.equal(nextSide(fresh), 'blue');
  const t1 = openTurn(fresh);
  assert.deepEqual([t1.state.match.side, t1.state.match.turn], ['blue', 1]);
  assert.deepEqual(t1.events, [{ type: 'TurnStarted', turn: 1, side: 'blue' }]);
  const t1red = openTurn(t1.state).state, t2 = openTurn(t1red).state;
  assert.deepEqual([t1red.match.side, t1red.match.turn, t2.match.side, t2.match.turn], ['red', 1, 'blue', 2]);
  assert.deepEqual(closeTurn(t2).events, [{ type: 'TurnEnded', turn: 2, side: 'blue' }]);
});
