import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../../../src/logic/store/index.js';
import { createRng } from '../../../src/services/rng/index.js';

const routes = {
  Roll: { apply: (s, c, d, rng) => ({ state: { ...s, rolls: [...s.rolls, rng.int(100)] }, events: [{ type: 'Rolled' }] }) },
  Step: { undoable: true, apply: s => ({ state: { ...s, steps: s.steps + 1 }, events: [{ type: 'Stepped' }] }) },
};
const initial = () => ({ match: { side: 'blue', over: null }, units: {}, rolls: [], steps: 0, rng: 1234 });
const store = (opts = {}) => createStore(initial(), {}, { rngFrom: s => createRng({ state: s }), routes, ...opts });

test('dispatch applies, stores the generator state, notifies listeners', () => {
  const s = store(), seen = [];
  s.subscribe((state, events) => seen.push(events.map(e => e.type)));
  assert.deepEqual(s.dispatch({ type: 'Roll', side: 'blue' }).events, [{ type: 'Rolled' }]);
  assert.notEqual(s.getState().rng, 1234);
  assert.deepEqual(seen, [['Rolled']]);
  assert.deepEqual(s.dispatch({ type: 'Roll', side: 'red' }), { error: 'not_your_turn' });
});

test('the same commands from the same state give the same rolls', () => {
  const a = store(), b = store();
  for (const s of [a, b]) for (let i = 0; i < 3; i++) s.dispatch({ type: 'Roll', side: 'blue' });
  assert.deepEqual(a.getState().rolls, b.getState().rolls);
});

test('undo steps back over undoable commands only', () => {
  const s = store();
  s.dispatch({ type: 'Step', side: 'blue' });
  s.dispatch({ type: 'Step', side: 'blue' });
  assert.equal(s.undo(), true);
  assert.equal(s.getState().steps, 1);
  s.dispatch({ type: 'Roll', side: 'blue' });
  assert.equal(s.canUndo(), false, 'a roll cannot be taken back');
  assert.equal(s.undo(), false);
});

test('dev freeze: state cannot be mutated by a listener', () => {
  const s = store({ freeze: true });
  s.dispatch({ type: 'Step', side: 'blue' });
  assert.throws(() => { s.getState().steps = 99; });
});
