// State machine helper: enums, tables, guarded steps, refused events.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enumOf, defineMachine, can, step, eventsFrom, InvalidTransition } from '../../src/core/fsm.js';

const Light = enumOf('Off', 'On', 'Broken');
const machine = defineMachine('light', {
  states: Light,
  initial: Light.Off,
  transitions: {
    Off: { flip: Light.On },
    On: { flip: Light.Off, surge: (d) => (d && d.volts > 300 ? Light.Broken : Light.On) },
  },
});

test('enumOf builds a frozen name -> name map', () => {
  assert.deepEqual(Light, { Off: 'Off', On: 'On', Broken: 'Broken' });
  assert.ok(Object.isFrozen(Light));
  assert.throws(() => enumOf('A', 'A'), /duplicate/);
  assert.throws(() => enumOf(''), TypeError);
});

test('defineMachine rejects unknown states', () => {
  assert.throws(() => defineMachine('x', { states: Light, initial: 'Nope', transitions: {} }), /initial/);
  assert.throws(() => defineMachine('x', { states: Light, initial: 'Off', transitions: { Nope: {} } }), /unknown state 'Nope'/);
  assert.throws(() => defineMachine('x', { states: Light, initial: 'Off', transitions: { Off: { go: 'Nope' } } }), /unknown state 'Nope'/);
});

test('step follows the table', () => {
  assert.equal(step(machine, Light.Off, 'flip'), Light.On);
  assert.equal(step(machine, Light.On, 'flip'), Light.Off);
});

test('step with a guard function uses the event data', () => {
  assert.equal(step(machine, Light.On, 'surge', { volts: 230 }), Light.On);
  assert.equal(step(machine, Light.On, 'surge', { volts: 400 }), Light.Broken);
});

test('an unlisted event is an error, not a no-op', () => {
  assert.throws(() => step(machine, Light.Off, 'surge'), InvalidTransition);
  assert.throws(() => step(machine, Light.Broken, 'flip'), (e) => e.state === 'Broken' && e.event === 'flip');
});

test('a guard that returns an unknown state is an error', () => {
  const bad = defineMachine('bad', { states: Light, initial: 'Off', transitions: { Off: { go: () => 'Nope' } } });
  assert.throws(() => step(bad, 'Off', 'go'), /unknown state 'Nope'/);
});

test('can and eventsFrom report what is allowed', () => {
  assert.equal(can(machine, Light.Off, 'flip'), true);
  assert.equal(can(machine, Light.Off, 'toString'), false);
  assert.deepEqual(eventsFrom(machine, Light.On), ['flip', 'surge']);
  assert.deepEqual(eventsFrom(machine, Light.Broken), []);
});
