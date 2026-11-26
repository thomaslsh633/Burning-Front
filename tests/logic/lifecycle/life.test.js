import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as life from '../../../src/logic/lifecycle/index.js';
import { checkUnit } from '../../../src/logic/state/index.js';
import { testMatch, tweak } from '../../helpers/match.js';

const H = (c, r) => ({ c, r });
const kill = (state, id, which = () => true) => tweak(state, id, { members: state.units[id].members.map((m, i) => (which(m, i) ? { ...m, hp: 0 } : m)) });

test('a squad with no men is removed', () => {
  const { state, data } = testMatch([{ team: 'blue', sbps: 'riflemen_us', pos: H(3, 3) }]);
  const r = life.checkDeaths(kill(state, 'u1'), 'u1', data);
  assert.equal(r.state.units.u1, undefined);
  assert.deepEqual(r.events.map(e => e.type), ['UnitDestroyed', 'UnitRemoved']);
  assert.equal(life.checkDeaths(state, 'u1', data).state, state, 'alive: nothing happens');
});

test('a towed gun whose crew dies is DECREWED, ownerless, with no budget', () => {
  const { state, data } = testMatch([{ team: 'blue', sbps: 'at_gun_57mm_us', pos: H(3, 3) }]);
  const r = life.checkDeaths(kill(state, 'u1', m => m.ebps === 'crew_at_gun_57mm_us'), 'u1', data);
  const u = r.state.units.u1;
  assert.deepEqual([u.fsm.life, u.team, u.fsm.action, u.budget.move], ['DECREWED', null, 'EXHAUSTED', 0]);
  assert.deepEqual(checkUnit(u), []);
  assert.equal(r.events[0].type, 'CrewWiped');
});

test('a destroyed vehicle becomes a wreck that still occupies its hex', () => {
  const { state, data } = testMatch([{ team: 'blue', sbps: 'sherman_us', pos: H(3, 3) }]);
  const r = life.checkDeaths(kill(state, 'u1'), 'u1', data);
  assert.equal(r.state.units.u1.fsm.life, 'WRECKED');
  assert.deepEqual(checkUnit(r.state.units.u1), []);
});

test('criticals are a set', () => {
  const { state } = testMatch([{ team: 'blue', sbps: 'sherman_us', pos: H(3, 3) }]);
  const r = life.applyCriticals(state, [{ unit: 'u1', critical: 'engine_damaged' }, { unit: 'u1', critical: 'engine_damaged' }, { unit: 'u1', critical: 'crew_shocked' }]);
  assert.deepEqual(r.state.units.u1.criticals, ['engine_damaged', 'crew_shocked']);
  assert.equal(r.events.length, 2);
});
