import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { indexUnits } from '../../../src/services/data/index.js';

test('flat maps by id with category and faction; the real generated data indexes cleanly', () => {
  const generated = JSON.parse(fs.readFileSync(new URL('../../../data/generated/units.json', import.meta.url), 'utf8'));
  const { units, errors } = indexUnits(generated);
  assert.deepEqual(errors, []);
  assert.equal(units.sbps.riflemen_us.category, 'infantry');
  assert.equal(units.faction.grenadier_ger, 'german');
  assert.equal(units.weapon.garand_rifleman_us.class, 'rifle');
  assert.ok(units.veterancy.riflemen_us);
});

test('an id two factions define differently is an error; the same shared record is fine', () => {
  const g = { factions: { a: { sbps: { infantry: { x: { hp: 1 } } } }, b: { sbps: { infantry: { x: { hp: 2 } } } } } };
  assert.deepEqual(indexUnits(g).errors, ['sbps id "x" is defined differently by two factions']);
  const same = { factions: { a: { weapon: { rifle: { w: { hp: 1 } } } }, b: { weapon: { rifle: { w: { hp: 1 } } } } } };
  assert.deepEqual(indexUnits(same).errors, []);
});
