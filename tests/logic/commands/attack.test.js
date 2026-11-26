import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apply } from '../../../src/logic/commands/index.js';
import { createRng } from '../../../src/services/rng/index.js';
import { testMatch } from '../../helpers/match.js';

const H = (c, r) => ({ c, r });

test('Attack: damage, suppression, reveal, XP and the spent action, each by its owner', () => {
  const { state, data } = testMatch([{ team: 'blue', sbps: 'hmg_30cal_us', pos: H(1, 5), stance: 'EMPLACED' }, { team: 'red', sbps: 'grenadier_ger', pos: H(4, 5) }]);
  const r = apply(state, { type: 'Attack', side: 'blue', unit: 'u1', target: 'u2' }, data, createRng(3));
  const mg = r.state.units.u1, g = r.state.units.u2;
  assert.equal(mg.budget.action, 0);
  assert.equal(mg.budget.fired, true);
  assert.ok(mg.timers.revealedUntil > state.match.turn);
  assert.ok(g === undefined || g.suppression > 0);
  assert.ok(mg.xp > 0);
  assert.equal(r.events[0].type, 'Fired');
  assert.equal(apply(r.state, { type: 'Attack', side: 'blue', unit: 'u1', target: 'u2' }, data, createRng(3)).error, r.state.units.u2 ? 'no_action_left' : 'no_such_target');
});

test('Attack until destroyed removes the squad', () => {
  const { state, data } = testMatch([{ team: 'blue', sbps: 'hmg_30cal_us', pos: H(1, 5), stance: 'EMPLACED' }, { team: 'red', sbps: 'grenadier_ger', pos: H(3, 5) }]);
  let s = state;
  for (let i = 0; i < 12 && s.units.u2; i++) {
    s = { ...s, units: { ...s.units, u1: { ...s.units.u1, budget: { ...s.units.u1.budget, action: 1 }, fsm: { ...s.units.u1.fsm, action: 'IDLE' } } } };
    s = apply(s, { type: 'Attack', side: 'blue', unit: 'u1', target: 'u2' }, data, createRng(i)).state;
  }
  assert.equal(s.units.u2, undefined);
});
