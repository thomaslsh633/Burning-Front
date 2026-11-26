// Seeds data/i18n/en.json with CoH3's English names (coh3stats) for the text keys the unit data uses and en.json lacks.
// Never overwrites: a hand-edited English text stays. Korean (ko.json) is written by hand.
//
// usage: node tools/i18n/seed.js   (after npm run build:data)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCoh3stats } from '../lib/coh3.js';
import { textKeys } from '../data-links.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const clean = t => String(t ?? '').replace(/\\n/g, '\n').trim();

/** CoH3 English text by key, from coh3stats: squad name and brief, weapon and upgrade names (CoH3 leaves many weapons unnamed),
 * and the entity name of a one-model squad. */
export function englishNames(coh3stats) {
  const out = {};
  const put = (key, text) => { if (clean(text) && !(key in out)) out[key] = clean(text); };
  for (const units of Object.values(coh3stats)) {
    for (const [id, s] of Object.entries(units)) {
      put(`unit.${id}.name`, s.name);
      put(`unit.${id}.desc`, s.brief);
      const only = s.loadout?.length === 1 && s.loadout[0].num === 1 ? s.loadout[0].entity : null;
      if (only) put(`entity.${only}.name`, s.name);   // one model (vehicle, emplacement): the entity is the unit
      for (const w of s.weapons || []) put(`weapon.${w.id}.name`, w.name);
      for (const u of s.upgrades || []) put(`upgrade.${u.id}.name`, u.name);
    }
  }
  return out;
}

/** strings + the keys in use → strings with every used key that has an English name added, and the added keys. */
export function seed(strings, used, names) {
  const added = [...used].filter(k => !(k in strings) && k in names).sort();
  const out = { ...strings };
  for (const k of added) out[k] = names[k];
  return { strings: Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b))), added };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const file = path.join(root, 'data/i18n/en.json');
  const en = JSON.parse(fs.readFileSync(file, 'utf8'));
  const units = JSON.parse(fs.readFileSync(path.join(root, 'data/generated/units.json'), 'utf8'));
  const used = new Set(Object.values(units.factions).flatMap(textKeys));
  const r = seed(en.strings, used, englishNames(loadCoh3stats(root)));
  fs.writeFileSync(file, JSON.stringify({ ...en, strings: r.strings }, null, 2) + '\n');
  console.log(`en.json: +${r.added.length} keys from coh3stats; ${[...used].filter(k => !(k in r.strings)).length} keys in use still without English text`);
}
