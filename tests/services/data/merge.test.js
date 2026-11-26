import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deepMerge, mergeKind } from '../../../src/services/data/index.js';

test('deepMerge: objects merge field by field, arrays are replaced, null deletes', () => {
  const base = { hp: 95, armor: { front: 1, side: 1, rear: 1 }, tags: ['a', 'b'], move: { hex: 4 } };
  const patch = { hp: 100, armor: { rear: 2 }, tags: ['c'], move: null };
  assert.deepEqual(deepMerge(base, patch), { hp: 100, armor: { front: 1, side: 1, rear: 2 }, tags: ['c'] });
  assert.deepEqual(base.armor.rear, 1, 'base is not changed');
});

const L = (name, data) => ({ name, data });

test('grouped kind: a later layer patches by id, wherever the record sits', () => {
  const base = { rifle: { garand: { damage: 12, class: 'rifle' } }, tank_gun: { m4: { damage: 120 } } };
  const units = { rifle: { garand: { damage: 14 } } };
  const r = mergeKind('grouped', [L('base', base), L('units', units)]);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.data.rifle.garand, { damage: 14, class: 'rifle' });
  assert.deepEqual(r.origin.garand, ['base', 'units']);
});

test('grouped kind: new ids are added, { remove: true } deletes, a different group moves the record', () => {
  const base = { rifle: { garand: { damage: 12 }, kar98k: { damage: 14 } }, mortar: { smoke: { damage: 0 } } };
  const mod = { rifle: { lee_enfield: { damage: 13 }, kar98k: { remove: true } }, smoke: { smoke: { aoe: 1 } } };
  const r = mergeKind('grouped', [L('base', base), L('mod', mod)]);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(Object.keys(r.data.rifle).sort(), ['garand', 'lee_enfield']);
  assert.deepEqual(r.data.smoke, { smoke: { damage: 0, aoe: 1 } });
  assert.equal(r.data.mortar, undefined, 'empty groups are dropped');
});

test('errors: an id twice in one layer, removing an id that does not exist', () => {
  const bad = { rifle: { garand: { damage: 1 } }, sidearm: { garand: { damage: 2 } } };
  const r = mergeKind('grouped', [L('base', { rifle: {} }), L('units', bad), L('mod', { rifle: { ghost: { remove: true } } })]);
  assert.deepEqual(r.errors, ['units: id "garand" appears in rifle and sidearm', 'mod: cannot remove "ghost" (not defined)']);
});

test('sections kind (fx): ids are unique per section only', () => {
  const base = { ebps: { sherman_us: { name: 'entity.sherman_us.name' } }, sbps: { sherman_us: { name: 'unit.sherman_us.name' } } };
  const r = mergeKind('sections', [L('base', base), L('units', { sbps: { sherman_us: { icon: 'sherman' } } })]);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.data.sbps.sherman_us, { name: 'unit.sherman_us.name', icon: 'sherman' });
  assert.deepEqual(r.data.ebps.sherman_us, { name: 'entity.sherman_us.name' });
});

test('flat kind (veterancy)', () => {
  const r = mergeKind('flat', [L('base', { riflemen_us: { xp: [1, 2, 3] } }), L('units', { riflemen_us: { xp: [9, 9, 9] } })]);
  assert.deepEqual(r.data.riflemen_us.xp, [9, 9, 9]);
});
