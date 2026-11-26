import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EVENT, ev } from '../../../src/logic/events/index.js';

test('ev builds a plain event; unknown types throw', () => {
  assert.deepEqual(ev('Moved', { unit: 'u1', to: { c: 1, r: 2 } }), { type: 'Moved', unit: 'u1', to: { c: 1, r: 2 } });
  assert.throws(() => ev('Teleported'));
  assert.equal(EVENT.StateChanged, 'StateChanged', 'the fsm helper event is in the table');
  assert.ok(Object.isFrozen(EVENT));
});
