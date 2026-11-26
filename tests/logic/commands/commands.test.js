import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validate, apply } from '../../../src/logic/commands/index.js';
import { defineMachine } from '../../../src/logic/fsm/index.js';

const state = { match: { side: 'blue', over: null }, units: { u1: { id: 'u1', team: 'blue', fsm: { morale: 'NORMAL' } }, u2: { id: 'u2', team: 'red', fsm: { morale: 'PINNED' } } } };
const routes = {
  Ping: { validate: (s, c) => (c.loud ? 'too_loud' : null), apply: s => ({ state: { ...s, pinged: true }, events: [{ type: 'Pinged' }] }) },
  Step: { unit: true, undoable: true, apply: s => ({ state: s, events: [] }) },
};
const morale = defineMachine('morale', 'NORMAL', { NORMAL: {}, PINNED: { denies: { Step: 'pinned' } } });

test('common checks: unknown command, match over, whose turn', () => {
  assert.equal(validate(state, { type: 'Fly', side: 'blue' }, {}, routes), 'unknown_command');
  assert.equal(validate({ ...state, match: { side: 'blue', over: { winner: 'red' } } }, { type: 'Ping', side: 'blue' }, {}, routes), 'match_over');
  assert.equal(validate(state, { type: 'Ping', side: 'red' }, {}, routes), 'not_your_turn');
});

test('unit commands: own unit, then every axis may veto, then the route', () => {
  assert.equal(validate(state, { type: 'Step', side: 'blue', unit: 'u9' }, {}, routes, [morale]), 'no_such_unit');
  assert.equal(validate(state, { type: 'Step', side: 'blue', unit: 'u2' }, {}, routes, [morale]), 'not_your_unit');
  const pinned = { ...state, units: { ...state.units, u1: { ...state.units.u1, fsm: { morale: 'PINNED' } } } };
  assert.equal(validate(pinned, { type: 'Step', side: 'blue', unit: 'u1' }, {}, routes, [morale]), 'pinned');
  assert.equal(validate(state, { type: 'Step', side: 'blue', unit: 'u1' }, {}, routes, [morale]), null);
});

test('apply returns the route result or the reason', () => {
  assert.deepEqual(apply(state, { type: 'Ping', side: 'blue', loud: true }, {}, null, routes), { error: 'too_loud' });
  const r = apply(state, { type: 'Ping', side: 'blue' }, {}, null, routes);
  assert.equal(r.state.pinged, true);
  assert.deepEqual(r.events, [{ type: 'Pinged' }]);
  assert.equal(r.undoable, false);
});
