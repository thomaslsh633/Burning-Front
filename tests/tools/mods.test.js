// Mods end to end: load order, manifest checks, vocab additions, and the same merge + checks as designer overrides.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildData } from '../../tools/build-data.js';
import { repo, tempRoot, writeJson as write } from '../helpers/temp-root.js';

const EXAMPLE = 'example_veteran_riflemen';
const read = (root, rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));

/** Temp root with the example mod copied in and the given load order. */
function withMods(enabled, extra = {}) {
  const root = tempRoot();
  fs.cpSync(path.join(repo, 'mods', EXAMPLE), path.join(root, 'mods', EXAMPLE), { recursive: true });
  for (const [id, manifest] of Object.entries(extra)) write(root, `mods/${id}/mod.json`, manifest);
  write(root, 'mods/load-order.json', { enabled });
  return root;
}

test('the example mod is in the repo but not enabled', () => {
  assert.equal(read(repo, 'mods/load-order.json').enabled.includes(EXAMPLE), false);
});

test('an enabled mod overrides a value, adds a squad and a word, and is listed as a layer', () => {
  const { out, errors, overrides } = buildData(withMods([EXAMPLE]));
  assert.deepEqual(errors, []);
  const us = out.factions.american;
  assert.equal(us.weapon.rifle.garand_rifleman_us.attack.accuracy.far, 0.4);
  assert.deepEqual(us.sbps.infantry.riflemen_veteran_us.traits, ['desert_veteran']);
  assert.ok(us.fx.sbps.riflemen_veteran_us);
  assert.deepEqual(out.layers.mods, [{ id: EXAMPLE, version: '1.0.0' }]);
  assert.ok(overrides.some(o => o.layer === `mod:${EXAMPLE}` && o.id === 'garand_rifleman_us' && o.field === 'attack.accuracy.far'));
});

test('without its vocab addition the new word is rejected', () => {
  const root = withMods([EXAMPLE]);
  fs.rmSync(path.join(root, 'mods', EXAMPLE, 'rules'), { recursive: true });
  const { errors } = buildData(root);
  assert.ok(errors.some(e => e.includes('riflemen_veteran_us') && e.includes('"desert_veteran" not in vocab list unit_trait')), errors.join('\n'));
});

test('a mod can only add words to an existing list', () => {
  const root = withMods([EXAMPLE]);
  write(root, `mods/${EXAMPLE}/rules/vocab.json`, { lists: { unit_trait: ['desert_veteran'], laser_types: ['red'] } });
  const { errors } = buildData(root);
  assert.ok(errors.includes(`mod:${EXAMPLE} rules/vocab.json: no word list "laser_types" (a mod can only add words to an existing list)`));
});

test('later mods load on top of earlier ones; load_after is enforced', () => {
  const patch = { id: 'accuracy_patch', name: 'Patch', version: '0.1.0', data_format: 1, load_after: [EXAMPLE] };
  const ok = withMods([EXAMPLE, 'accuracy_patch'], { accuracy_patch: patch });
  write(ok, 'mods/accuracy_patch/units/american/weapon.json', { rifle: { garand_rifleman_us: { attack: { accuracy: { far: 0.45 } } } } });
  const r = buildData(ok);
  assert.deepEqual(r.errors, []);
  assert.equal(r.out.factions.american.weapon.rifle.garand_rifleman_us.attack.accuracy.far, 0.45);

  const wrong = withMods(['accuracy_patch', EXAMPLE], { accuracy_patch: patch });
  assert.ok(buildData(wrong).errors.includes(`mod:accuracy_patch: must load after "${EXAMPLE}"; move "${EXAMPLE}" above it in mods/load-order.json`));
});

test('manifest problems stop the build', () => {
  const root = withMods([EXAMPLE, 'missing_mod', 'old_mod', 'renamed'], {
    old_mod: { id: 'old_mod', name: 'Old', version: '1.0.0', data_format: 0 },
    renamed: { id: 'other_name', name: 'R', version: '1.0', data_format: 1 },
  });
  const { errors } = buildData(root);
  assert.ok(errors.includes('mod:missing_mod: no mods/missing_mod/mod.json'));
  assert.ok(errors.some(e => e.startsWith('mod:old_mod') && e.includes('data format 0')));
  assert.ok(errors.includes('mod:renamed mod.json: id "other_name" must match its folder name'));
  assert.ok(errors.some(e => e.startsWith('mod:renamed mod.json $.version')));
});

test('unknown factions and files in override or mod folders are errors, not silently ignored', () => {
  const root = withMods([EXAMPLE]);
  write(root, `mods/${EXAMPLE}/units/american/riflemen_us/weapons.json`, {});
  write(root, 'data/units/japanese/sbps.json', {});
  const { errors } = buildData(root);
  assert.ok(errors.some(e => e.startsWith(`mod:${EXAMPLE} units/american/riflemen_us/weapons.json: unknown file`)));
  assert.ok(errors.includes('data/units/japanese: no faction "japanese" in data/base'));
});

test('mod text: the new squad has Korean and English text; a mod can add a language', () => {
  const root = withMods([EXAMPLE]);
  write(root, `mods/${EXAMPLE}/i18n/fr.json`, { strings: { 'unit.riflemen_us.name': 'Fusiliers' } });
  const { i18n, warnings, errors } = buildData(root);
  assert.deepEqual(errors, []);
  assert.equal(i18n.ko['unit.riflemen_veteran_us.name'], '역전의 소총수 분대');
  assert.equal(i18n.en['unit.riflemen_us.name'], 'Riflemen Squad', 'base text stays');
  assert.equal(i18n.fr['unit.riflemen_us.name'], 'Fusiliers');
  assert.ok(!warnings.some(w => w.startsWith('i18n ko') || w.startsWith('i18n en')), warnings.join('\n'));
  assert.ok(warnings.some(w => w.startsWith('i18n fr: ')), 'a partial language is reported, not rejected');
});

test('without its text the new squad is reported as missing text', () => {
  const root = withMods([EXAMPLE]);
  fs.rmSync(path.join(root, 'mods', EXAMPLE, 'i18n'), { recursive: true });
  const { warnings } = buildData(root);
  assert.ok(warnings.some(w => w.startsWith('i18n ko: 3 of') && w.includes('unit.riflemen_veteran_us.desc')), warnings.join('\n'));
});

test('a text file must be named by a language code and hold strings', () => {
  const root = withMods([EXAMPLE]);
  write(root, `mods/${EXAMPLE}/i18n/korean.json`, { strings: {} });
  write(root, `mods/${EXAMPLE}/i18n/de.json`, { strings: { 'Unit.Name': 'x' } });
  const { errors } = buildData(root);
  assert.ok(errors.includes(`mod:${EXAMPLE} i18n/korean.json: file name must be a language code (ko.json, en.json)`));
  assert.ok(errors.some(e => e.startsWith(`mod:${EXAMPLE} i18n/de.json $.strings.Unit.Name: key: does not match`)));
});
