import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defineMachine, transition, send, runHook, permits, table, stateOf } from '../../../src/logic/fsm/index.js';

// a toy door, not a game axis
const door = defineMachine('door', 'CLOSED', {
  CLOSED: { allows: ['Open', 'Knock'], on: { Push: 'OPEN', Kick: (u, ctx) => (ctx.strong ? 'BROKEN' : null) } },
  OPEN: { denies: { Knock: 'already_open' }, enter: u => ({ unit: { ...u, draught: true } }), exit: u => ({ unit: { ...u, draught: false }, events: [{ type: 'Creak' }] }),
    on: { Pull: 'CLOSED' }, onTurnEnd: () => 'CLOSED' },
  BROKEN: { allows: [] },
});
const unit = { id: 'u1', fsm: { door: 'CLOSED' } };

test('transition runs exit, sets the state, runs enter, and reports StateChanged', () => {
  const r = transition(door, unit, 'OPEN');
  assert.equal(r.unit.fsm.door, 'OPEN');
  assert.equal(r.unit.draught, true);
  assert.deepEqual(r.events, [{ type: 'StateChanged', unit: 'u1', axis: 'door', from: 'CLOSED', to: 'OPEN' }]);
  const back = transition(door, r.unit, 'CLOSED');
  assert.deepEqual(back.events.map(e => e.type), ['Creak', 'StateChanged']);
  assert.equal(back.unit.draught, false);
  assert.equal(unit.fsm.door, 'CLOSED', 'the input unit is not changed');
});

test('same state is a no-op; unknown state throws', () => {
  assert.deepEqual(transition(door, unit, 'CLOSED'), { unit, events: [] });
  assert.throws(() => transition(door, unit, 'AJAR'));
  assert.throws(() => defineMachine('x', 'NOPE', { A: {} }));
});

test('send follows the on-table; functions may decline', () => {
  assert.equal(send(door, unit, 'Push').unit.fsm.door, 'OPEN');
  assert.equal(send(door, unit, 'Kick', {}).unit, unit);
  assert.equal(send(door, unit, 'Kick', { strong: true }).unit.fsm.door, 'BROKEN');
  assert.equal(send(door, unit, 'Pull').unit, unit, 'no rule for this event in this state');
});

test('phase hooks', () => {
  const open = transition(door, unit, 'OPEN').unit;
  assert.equal(runHook(door, open, 'onTurnEnd').unit.fsm.door, 'CLOSED');
  assert.equal(runHook(door, unit, 'onTurnEnd').unit, unit);
});

test('permits: whitelist, deny reasons, first veto wins', () => {
  const lock = defineMachine('lock', 'UNLOCKED', { UNLOCKED: {}, LOCKED: { denies: { Open: 'locked' } } });
  const u = { id: 'u', fsm: { door: 'CLOSED', lock: 'LOCKED' } };
  assert.deepEqual(permits([door, lock], u, 'Open'), { ok: false, axis: 'lock', state: 'LOCKED', reason: 'locked' });
  assert.deepEqual(permits([door, lock], { ...u, fsm: { ...u.fsm, lock: 'UNLOCKED' } }, 'Open'), { ok: true });
  assert.deepEqual(permits([door], u, 'Fly'), { ok: false, axis: 'door', state: 'CLOSED', reason: 'door_closed' });
  assert.equal(permits([door], { fsm: { door: 'OPEN' } }, 'Knock').reason, 'already_open');
});

test('table lists every (state, event) pair', () => {
  assert.deepEqual(table(door, {}, { strong: true }), [
    { state: 'CLOSED', event: 'Push', to: 'OPEN' }, { state: 'CLOSED', event: 'Kick', to: 'BROKEN' }, { state: 'OPEN', event: 'Pull', to: 'CLOSED' }]);
  assert.equal(stateOf(door, { fsm: {} }), 'CLOSED', 'missing axis reads as the initial state');
});
