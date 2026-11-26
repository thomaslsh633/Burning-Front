// Data layers end to end: base → designer overrides, checked after merging (tools/build-data.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildData } from '../../tools/build-data.js';
import { tempRoot, writeJson as write } from '../helpers/temp-root.js';

const garand = out => out.factions.american.weapon.rifle.garand_rifleman_us;

test('base alone builds without errors', () => {
  const { errors } = buildData(tempRoot());
  assert.deepEqual(errors, []);
});

test('a designer override changes the merged value and is listed with the base value', () => {
  const root = tempRoot();
  write(root, 'data/units/american/weapon.json', { rifle: { garand_rifleman_us: { attack: { accuracy: { far: 0.4 } }, damage: 12 } } });
  const { out, errors, overrides } = buildData(root);
  assert.deepEqual(errors, []);
  assert.equal(garand(out).attack.accuracy.far, 0.4);
  assert.equal(garand(out).attack.accuracy.near, 0.68, 'untouched fields come from the base');
  const far = overrides.find(o => o.field === 'attack.accuracy.far');
  assert.deepEqual([far.base, far.value, far.redundant], [0.35, 0.4, false]);
  assert.equal(overrides.find(o => o.field === 'damage').redundant, true, 'same as base → redundant');
});

test('a broken override is rejected and the error names the layers', () => {
  const root = tempRoot();
  write(root, 'data/units/american/weapon.json', { rifle: { garand_rifleman_us: { class: 'laser', attack: { shots_per_turn: { near: 2.5 } } } } });
  const { errors } = buildData(root);
  assert.ok(errors.some(e => e.includes('garand_rifleman_us (from base → units)') && e.includes('"laser" not in vocab list weapon_class')));
  assert.ok(errors.some(e => e.includes('shots_per_turn.near: expected integer')));
});

test('the link check runs on the merged data: an override pointing at a missing record is rejected', () => {
  const root = tempRoot();
  write(root, 'data/units/american/ebps.json', { infantry: { rifleman_us: { weapons: [{ weapon: 'garand_typo_us', mount: 'hull', slot: 'main' }] } } });
  const { errors } = buildData(root);
  assert.ok(errors.includes('american: ebps rifleman_us weapons[].weapon: no weapon record "garand_typo_us"'), errors.join('\n'));
});

test('removing a record that others still use breaks its links', () => {
  const root = tempRoot();
  write(root, 'data/units/american/ebps.json', { infantry: { rifleman_us: { remove: true } } });
  const { errors } = buildData(root);
  assert.ok(errors.some(e => e.includes('sbps riflemen_us members[].entity: no ebps record "rifleman_us"')));
  assert.ok(errors.some(e => e.includes('fx ebps/rifleman_us: no ebps record')));
});

test('overrides can sit in a unit folder; the base is split into unit folders and shared/', () => {
  const root = tempRoot();
  write(root, 'data/units/american/riflemen_us/weapon.json', { rifle: { garand_rifleman_us: { attack: { accuracy: { far: 0.4 } } } } });
  const { out, errors } = buildData(root);
  assert.deepEqual(errors, []);
  assert.equal(garand(out).attack.accuracy.far, 0.4);
});

test('one id in two files of the same layer, or folders nested too deep, are errors', () => {
  const root = tempRoot();
  write(root, 'data/units/american/riflemen_us/weapon.json', { rifle: { garand_rifleman_us: { damage: 12 } } });
  write(root, 'data/units/american/shared/weapon.json', { rifle: { garand_rifleman_us: { damage: 13 } } });
  write(root, 'data/units/american/riflemen_us/extra/weapon.json', {});
  const { errors } = buildData(root);
  assert.ok(errors.includes('american/weapon units: id "garand_rifleman_us" is in riflemen_us/weapon.json and shared/weapon.json'), errors.join('\n'));
  assert.ok(errors.some(e => e.startsWith('data/units/american/riflemen_us/extra: folders go one level deep')));
});
