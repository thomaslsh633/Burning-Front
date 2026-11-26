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

test('an id defined by two factions is an error', () => {
  const g = { factions: { a: { sbps: { infantry: { x: {} } } }, b: { sbps: { infantry: { x: {} } } } } };
  assert.deepEqual(indexUnits(g).errors, ['sbps id "x" is defined by two factions']);
});
