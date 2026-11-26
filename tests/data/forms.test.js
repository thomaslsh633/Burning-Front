// D1-4 gate: one hand-written sample per category validates against its schema and profile;
// broken samples (a mine with attack, a mortar without scatter, a vehicle that captures) are rejected.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validate, loadContext } from '../../tools/validate.js';
import { checkGroupedFile } from '../../tools/profiles.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ctx = loadContext(root);
const profiles = JSON.parse(fs.readFileSync(path.join(root, 'data/schema/profiles.json'), 'utf8'));
const sample = k => JSON.parse(fs.readFileSync(path.join(root, `tests/fixtures/forms/${k}.json`), 'utf8'));
const check = (kind, data) => [...validate(ctx.schemas[`${kind}.schema.json`], data, ctx),
  ...(profiles[kind] ? checkGroupedFile(profiles, kind, data) : [])].map(e => `${e.path} ${e.message}`);

for (const kind of ['weapon', 'ebps', 'sbps', 'veterancy', 'upgrade', 'fx']) {
  test(`${kind} samples are valid`, () => assert.deepEqual(check(kind, sample(kind)), []));
}

test('every category has a profile and a sample', () => {
  const vocab = ctx.vocab.lists;
  assert.deepEqual(Object.keys(profiles.weapon.categories).sort(), [...vocab.weapon_category].sort());
  assert.deepEqual(Object.keys(sample('weapon')).sort(), [...vocab.weapon_category].sort());
  assert.deepEqual(Object.keys(profiles.ebps.categories).sort(), [...vocab.unit_category].sort());
  assert.deepEqual(Object.keys(sample('ebps')).sort(), [...vocab.unit_category].sort());
  assert.deepEqual(Object.keys(sample('sbps')).sort(), [...vocab.unit_category].sort());
});

test('a mine with an attack block is rejected', () => {
  const w = sample('weapon');
  w.mine.m2_mine_us.attack = w.rifle.garand_rifleman_us.attack;
  assert.ok(check('weapon', w).includes('$.mine.m2_mine_us module "attack" not allowed for mine'));
});

test('a mortar without scatter is rejected', () => {
  const w = sample('weapon');
  delete w.mortar['81mm_mortar_us'].scatter;
  assert.ok(check('weapon', w).includes('$.mortar.81mm_mortar_us missing module "scatter" (must for mortar)'));
});

test('a vehicle squad that captures is rejected (SPEC §3: vehicles only contest)', () => {
  const s = sample('sbps');
  s.vehicles.sherman_us.capture = { rate: 1 };
  assert.ok(check('sbps', s).some(e => e.includes('module "capture" not')));
});

test('wrong words and shapes are rejected', () => {
  const w = sample('weapon');
  w.rifle.garand_rifleman_us.class = 'laser';
  w.rifle.garand_rifleman_us.attack.shots_per_turn.near = 3.5;
  w.rifle.garand_rifleman_us.attack.vs_cover.glass = { accuracy: 1 };
  const errs = check('weapon', w);
  assert.ok(errs.some(e => e.includes('"laser" not in vocab list weapon_class')));
  assert.ok(errs.some(e => e.includes('shots_per_turn.near expected integer')));
  assert.ok(errs.some(e => e.includes('key "glass" not in vocab list cover')));
});
