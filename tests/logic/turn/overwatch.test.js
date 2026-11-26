import { test } from 'node:test';
import assert from 'node:assert/strict';
import { overwatchWeapon, validateHold, hold, overwatchers, overwatchFired, stopsMover, ACTION } from '../../../src/logic/turn/index.js';
import { STANCE } from '../../../src/logic/crew/index.js';
import { MORALE } from '../../../src/logic/status/index.js';
import { permits } from '../../../src/logic/fsm/index.js';
import { checkUnit } from '../../../src/logic/state/index.js';
import { testMatch, tweak } from '../../helpers/match.js';
import { assertOwnsOnly } from '../../helpers/ownership.js';

const H = (c, r) => ({ c, r });
const AXES = [STANCE, MORALE, ACTION];

test('only machine-gun teams overwatch: not riflemen with LMGs, not mortars, not tanks', () => {
  const { state, data } = testMatch([
    { team: 'blue', sbps: 'hmg_30cal_us', pos: H(1, 1), stance: 'EMPLACED' }, { team: 'blue', sbps: 'riflemen_us', pos: H(3, 1) },
    { team: 'blue', sbps: 'mortar_81mm_us', pos: H(5, 1), stance: 'EMPLACED' }, { team: 'blue', sbps: 'sherman_us', pos: H(7, 1) },
  ]);
  assert.equal(overwatchWeapon(state.units.u1, data).weapon.class, 'hmg');
  for (const id of ['u2', 'u3', 'u4']) assert.equal(validateHold(state, { unit: id }, data), 'cannot_overwatch', id);
});

test('Hold: emplaced, has not fired, not pinned (each axis vetoes its own part)', () => {
  const { state, data } = testMatch([{ team: 'blue', sbps: 'hmg_30cal_us', pos: H(1, 1), stance: 'EMPLACED' }, { team: 'blue', sbps: 'hmg_30cal_us', pos: H(3, 3) }]);
  assert.equal(validateHold(state, { unit: 'u1' }, data), null);
  assert.equal(permits(AXES, state.units.u2, 'Hold').reason, 'not_emplaced');
  assert.equal(validateHold(tweak(state, 'u1', { budget: { ...state.units.u1.budget, fired: true } }), { unit: 'u1' }, data), 'fired_this_turn');
  assert.equal(permits(AXES, { ...state.units.u1, fsm: { ...state.units.u1.fsm, morale: 'PINNED' } }, 'Hold').reason, 'pinned');
});

test('hold → OVERWATCH with the weapon arc around the hull; the turn is spent; no move while watching', () => {
  const { state, data } = testMatch([{ team: 'blue', sbps: 'hmg_30cal_us', pos: H(1, 1), stance: 'EMPLACED', facing: 0 }]);
  const r = hold(state, 'u1', data), u = r.state.units.u1;
  assert.equal(u.fsm.action, 'OVERWATCH');
  assert.deepEqual(u.overwatch, { weapon: '30cal_hmg_us', facing: 0, arc_deg: 95 });
  assert.deepEqual([u.budget.move, u.budget.action], [0, 0]);
  assert.deepEqual(checkUnit(u), []);
  assert.equal(permits(AXES, u, 'Move').ok, false);
  assertOwnsOnly('turn', state, r.state);
});

test('overwatchers: enemy MGs watching that see the mover inside arc and range', () => {
  const { state, data } = testMatch([
    { team: 'blue', sbps: 'hmg_30cal_us', pos: H(1, 5), stance: 'EMPLACED', facing: 0 },
    { team: 'red', sbps: 'grenadier_ger', pos: H(5, 5) }, { team: 'red', sbps: 'grenadier_ger', pos: H(0, 2) },
  ]);
  const watching = hold(state, 'u1', data).state;
  assert.deepEqual(overwatchers(watching, data, 'u2'), ['u1'], 'ahead, 4 hexes: in arc and range');
  assert.deepEqual(overwatchers(watching, data, 'u3'), [], 'behind the arc');
  assert.deepEqual(overwatchers(state, data, 'u2'), [], 'not on overwatch');
  assert.deepEqual(overwatchers(watching, data, 'u1'), [], 'own units are never targets');
});

test('the reaction fires once: EXHAUSTED, overwatch cleared; dead or pinned movers stop', () => {
  const { state, data } = testMatch([{ team: 'blue', sbps: 'hmg_30cal_us', pos: H(1, 5), stance: 'EMPLACED' }, { team: 'red', sbps: 'grenadier_ger', pos: H(5, 5) }]);
  const watching = hold(state, 'u1', data).state;
  const r = overwatchFired(watching, 'u1', 'u2');
  assert.deepEqual([r.state.units.u1.fsm.action, r.state.units.u1.overwatch], ['EXHAUSTED', null]);
  assert.equal(r.events[0].type, 'OverwatchFired');
  assertOwnsOnly('turn', watching, r.state);
  assert.equal(stopsMover(state, data, 'u2'), false);
  assert.equal(stopsMover(tweak(state, 'u2', { fsm: { ...state.units.u2.fsm, morale: 'PINNED' } }), data, 'u2'), true);
  assert.equal(stopsMover(state, data, 'gone'), true);
});
