import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ACTION, freshBudget, refreshUnit, budgetCheck, spend } from '../../../src/logic/turn/index.js';
import { permits } from '../../../src/logic/fsm/index.js';
import { testMatch, tweak } from '../../helpers/match.js';
import { assertOwnsOnly } from '../../helpers/ownership.js';

const H = (c, r) => ({ c, r });

test('a fresh turn: move points, one action, one counter; shocked crews get no action', () => {
  const { state, data } = testMatch([{ team: 'blue', sbps: 'sherman_us', pos: H(2, 2) }]);
  assert.deepEqual(freshBudget(state.units.u1, data), { move: 6, action: 1, counter: 1, moved: false, fired: false });
  assert.equal(freshBudget({ ...state.units.u1, criticals: ['crew_shocked'] }, data).action, 0);
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
