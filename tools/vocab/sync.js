// Closed word lists (data/rules/vocab.json): every tag, class, trait, state and flag a data file may use.
// The CoH3 lists keep CoH3's own words; this tool collects the words our roster uses from data/source/coh3.
//
// usage: node tools/vocab/sync.js --check   report CoH3 words used by the roster that vocab.json lacks (exit 1 if any)
//        node tools/vocab/sync.js --seed    add those words to vocab.json (hand-written lists are kept)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { indexKind } from '../coh3/catalog.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const COH3_LISTS = ['weapon_class', 'damage_type', 'unit_tags', 'pass'];

const EXT = (rec, n) => (rec?.extensions || []).map(x => x.exts || x.squadexts || x).find(x => x.template_reference?.value?.endsWith(n));

/** CoH3 words used by the units in reports/catalog.json. */
export function collectCoh3Words() {
  const dir = path.join(root, 'data/source/coh3');
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'reports/catalog.json'), 'utf8')).catalog;
  const byId = idx => new Map([...idx].map(([p, v]) => [p.split('/').pop(), v.rec]));
  const ebps = byId(indexKind(dir, 'ebps', r => `ebps/races/${r}`));
  const weapons = byId(indexKind(dir, 'weapon', r => `weapon/${r}`));
  const words = Object.fromEntries(COH3_LISTS.map(k => [k, new Set()]));
  for (const faction of Object.values(catalog)) {
    for (const u of faction.units) for (const m of u.members) {
      const e = ebps.get(m.entity);
      for (const t of EXT(e, 'type_ext')?.unit_type_list || []) words.unit_tags.add(t.unit_type);
      const pass = EXT(e, 'moving_ext')?.pass_type?.instance_reference;
      if (pass) words.pass.add(pass.split('/').pop());
    }
    for (const w of faction.weapons) {
      const bag = weapons.get(w.id)?.weapon_bag;
      if (bag?.weapon_class) words.weapon_class.add(bag.weapon_class);
      if (bag?.damage?.damage_type) words.damage_type.add(bag.damage.damage_type);
    }
  }
  return Object.fromEntries(Object.entries(words).map(([k, v]) => [k, [...v].sort()]));
}

export function missingWords(vocab, words) {
  const out = {};
  for (const [k, list] of Object.entries(words)) {
    const known = new Set(vocab.lists?.[k] || []);
    const miss = list.filter(w => !known.has(w));
    if (miss.length) out[k] = miss;
  }
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const file = path.join(root, 'data/rules/vocab.json');
  const vocab = JSON.parse(fs.readFileSync(file, 'utf8'));
  const missing = missingWords(vocab, collectCoh3Words());
  if (process.argv.includes('--seed')) {
    for (const [k, miss] of Object.entries(missing)) vocab.lists[k] = [...new Set([...(vocab.lists[k] || []), ...miss])].sort();
    fs.writeFileSync(file, JSON.stringify(vocab, null, 2) + '\n');
    console.log(`seeded: ${Object.entries(missing).map(([k, v]) => `${k} +${v.length}`).join(', ') || 'nothing new'}`);
  } else {
    for (const [k, miss] of Object.entries(missing)) console.log(`${k}: ${miss.join(', ')}`);
    console.log(Object.keys(missing).length ? 'vocab is missing CoH3 words (run --seed after review)' : 'vocab covers every CoH3 word the roster uses');
    process.exit(Object.keys(missing).length ? 1 : 0);
  }
}
