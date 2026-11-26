import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ownerOf, changedPaths, foreignWrites, UNIT_FIELD_OWNERS } from '../../../src/logic/state/index.js';
import { assertOwnsOnly } from '../../helpers/ownership.js';

const unit = () => ({
  id: 'u1', team: 'blue', sbps: 'squad_a', pos: { c: 4, r: 7 }, facing: 2, members: [{ ebps: 'e', hp: 95 }], ammo: 18,
  fsm: { life: 'ACTIVE', location: 'ON_MAP', stance: 'MOBILE', morale: 'NORMAL', action: 'IDLE', visibility: 'REVEALED' },
  budget: { move: 4, action: 1, counter: 1 }, suppression: 0, criticals: [], timers: { stance: 0, smoke: 0, revealedUntil: 0 },
  overwatch: null, container: null, crew: null, retreatTo: null, marks: {},
});

test('each FSM axis has exactly one owner', () => {
  const axes = ['action', 'stance', 'location', 'morale', 'life', 'visibility'];
  assert.deepEqual(axes.map(a => ownerOf(`fsm.${a}`)), ['turn', 'crew', 'transport', 'status', 'lifecycle', 'vision']);
  assert.equal(ownerOf('budget.move'), 'turn', 'a path owns everything below it');
  assert.equal(ownerOf('marks.repair'), null);
});

test('changedPaths: nested objects by field, arrays as a whole', () => {
  const a = unit(), b = unit();
  b.fsm.morale = 'PINNED'; b.members[0].hp = 60; b.pos.c = 5;
  assert.deepEqual(changedPaths(a, b).sort(), ['fsm.morale', 'members', 'pos.c']);
  assert.deepEqual(changedPaths(a, unit()), []);
});

test('foreignWrites names the owner of each field a system should not have touched', () => {
  const a = unit(), b = unit();
  b.fsm.action = 'MOVING'; b.budget.move = 0; b.suppression = 40; b.xp = 1; b.marks = { x: 1 };
  const byPath = (x, y) => x.path.localeCompare(y.path);
  assert.deepEqual(foreignWrites('turn', a, b).sort(byPath), [{ path: 'marks.x', owner: null }, { path: 'suppression', owner: 'status' }, { path: 'xp', owner: 'status' }]);
});

test('assertOwnsOnly passes for own fields and fails with the owner named', () => {
  const before = { units: [unit()] };
  const after = { units: [{ ...unit(), suppression: 40, fsm: { ...unit().fsm, morale: 'SUPPRESSED' } }] };
  assertOwnsOnly('status', before, after);
  assert.throws(() => assertOwnsOnly('combat', before, after), /unit u1: fsm\.morale \(owner: status\)/);
});

test('owners are logic systems that exist', async () => {
  const fs = await import('node:fs');
  for (const system of new Set(Object.values(UNIT_FIELD_OWNERS))) assert.ok(fs.existsSync(new URL(`../../../src/logic/${system}/README.md`, import.meta.url)), system);
});
