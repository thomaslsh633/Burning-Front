import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as crew from '../../../src/logic/crew/index.js';
import { apply } from '../../../src/logic/commands/index.js';
import { testMatch, tweak } from '../../helpers/match.js';
import { assertOwnsOnly } from '../../helpers/ownership.js';

const H = (c, r) => ({ c, r });

test('emplace: spends the rest of the move and the action; emplaced at the next own turn start', () => {
  const { state, data } = testMatch([{ team: 'blue', sbps: 'hmg_30cal_us', pos: H(3, 3) }, { team: 'red', sbps: 'grenadier_ger', pos: H(7, 3) }]);
  const r = apply(state, { type: 'Emplace', side: 'blue', unit: 'u1' }, data, null);
  const u = r.state.units.u1;
  assert.equal(u.fsm.stance, 'SETTING_UP');
  assert.deepEqual([u.budget.move, u.budget.action, u.fsm.action], [0, 0, 'EXHAUSTED']);
  const next = crew.crewTurnStart(r.state, 'u1');
  assert.equal(next.state.units.u1.fsm.stance, 'EMPLACED');
  assertOwnsOnly('crew', r.state, next.state);
});

test('emplaced crews cannot move; a crew that fired cannot pack; packing ends at turn end (teardown 0)', () => {
  const { state, data } = testMatch([{ team: 'blue', sbps: 'hmg_30cal_us', pos: H(3, 3), stance: 'EMPLACED' }]);
  assert.equal(apply(state, { type: 'Move', side: 'blue', unit: 'u1', to: H(4, 3) }, data, null).error, 'emplaced');
  const fired = tweak(state, 'u1', { budget: { ...state.units.u1.budget, fired: true } });
  assert.equal(apply(fired, { type: 'Pack', side: 'blue', unit: 'u1' }, data, null).error, 'fired_this_turn');
  const p = apply(state, { type: 'Pack', side: 'blue', unit: 'u1' }, data, null);
  assert.equal(p.state.units.u1.fsm.stance, 'PACKING_UP');
  assert.equal(apply(p.state, { type: 'Attack', side: 'blue', unit: 'u1', target: 'u1' }, data, null).error, 'packing_up');
  assert.equal(crew.crewTurnEnd(p.state, 'u1', data).state.units.u1.fsm.stance, 'MOBILE');
});

test('packed crews that must emplace set up by themselves at turn end; squads cannot emplace', () => {
  const { state, data } = testMatch([{ team: 'blue', sbps: 'mortar_81mm_us', pos: H(3, 3) }, { team: 'blue', sbps: 'riflemen_us', pos: H(6, 6) }]);
  assert.equal(crew.crewTurnEnd(state, 'u1', data).state.units.u1.fsm.stance, 'SETTING_UP');
  assert.equal(crew.crewTurnEnd(state, 'u2', data).state, state);
  assert.equal(apply(state, { type: 'Emplace', side: 'blue', unit: 'u2' }, data, null).error, 'cannot_emplace');
  assert.equal(crew.setupTurns(state.units.u1, data), 1);
});

test('resetStance: a recrewed gun starts packed', () => {
  const { state } = testMatch([{ team: 'blue', sbps: 'at_gun_57mm_us', pos: H(3, 3), stance: 'EMPLACED' }]);
  const r = crew.resetStance(state, 'u1');
  assert.equal(r.state.units.u1.fsm.stance, 'MOBILE');
  assertOwnsOnly('crew', state, r.state);
});

test('a crew without its towed gun cannot emplace and does not auto-emplace', () => {
  const { state, data } = testMatch([{ team: 'blue', sbps: 'at_gun_57mm_us', pos: H(3, 3) }]);
  const crewOnly = tweak(state, 'u1', { members: state.units.u1.members.filter(m => m.ebps !== 'tw_at_gun_57mm_us') });
  assert.equal(crew.validateEmplace(crewOnly, { unit: 'u1' }, data), 'cannot_emplace');
  assert.equal(crew.validateEmplace(state, { unit: 'u1' }, data), null);
  assert.equal(crew.crewTurnEnd(crewOnly, 'u1', data).state, crewOnly);
  assert.equal(crew.STANCE.states.SETTING_UP.denies.Counter, 'setting_up');
});
