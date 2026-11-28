// Doctrines = CoH3 battlegroups (2026-11-28), written to data/rules/doctrines.json `factions`:
//   units     the faction's doctrine squads (data/rules/production.json `doctrine` lists) that a battlegroup's abilities or
//             upgrades name (the squad id without its race suffix, longest match first); `assign` (hand) places the rest, and
//             conversion targets go to their conversion's battlegroup (`aliases` maps conversions.json names to CoH3 ids);
//   upgrades  every CoH3 upgrade under the battlegroup (abilities and kits require them).
// usage: node tools/coh3/doctrines.js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BG_RACE = { british_africa: 'british' };   // CoH3 keeps the British battlegroups in the Italy set
const stem = id => id.replace(/_(us|ger|ak|uk)$/, '').replace(/_africa$/, '').replace(/_africa_uk$/, '');

/** Upgrade ids anywhere under a node (records holding upgrade_bag). */
function* upgradeIds(node, p = []) {
  if (!node || typeof node !== 'object') return;
  if ('upgrade_bag' in node) { yield p[p.length - 1]; return; }
  for (const [k, v] of Object.entries(node)) yield* upgradeIds(v, [...p, k]);
}

/** → { factions: { faction: { bg: { units, upgrades } } }, unplaced: { faction: [ids] } } */
export function buildDoctrines(readRace, prod, conversions, hand) {
  const factions = {}, unplaced = {};
  for (const [faction, f] of Object.entries(prod.factions)) {
    const race = BG_RACE[faction] ?? faction, ab = readRace('abilities', race)?.battlegroups ?? {}, up = readRace('upgrade', race)?.battlegroups ?? {};
    const bgs = Object.keys(up).length ? Object.keys(up) : Object.keys(ab);   // a battlegroup has its upgrade tree (abilities hold strays)
    const text = Object.fromEntries(bgs.map(b => [b, JSON.stringify(ab[b] ?? {}) + JSON.stringify(up[b] ?? {})]));
    const out = Object.fromEntries(bgs.map(b => [b, { units: [], upgrades: [...upgradeIds(up[b])].sort() }]));
    const conv = Object.fromEntries(conversions.filter(c => c.unlock === 'doctrine').map(c => [c.to, hand.aliases[c.doctrine] ?? c.doctrine]));
    for (const id of [...new Set(Object.values(f.buildings).flatMap(b => b.doctrine))].sort()) {
      let where = [hand.assign[id] ?? conv[id]].filter(b => out[b]);
      const tokens = stem(id).split('_');
      for (let n = tokens.length; !where.length && n >= Math.max(1, tokens.length - 1); n--) {
        const re = new RegExp(`[/_"]${tokens.slice(0, n).join('_')}[_"\\\\/]`);
        where = bgs.filter(b => re.test(text[b]));
      }
      if (!where.length) (unplaced[faction] ??= []).push(id);
      for (const b of where) out[b].units.push(id);
    }
    factions[faction] = out;
  }
  return { factions, unplaced };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const json = f => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));
  const file = path.join(root, 'data/rules/doctrines.json');
  const doc = json('data/rules/doctrines.json');
  const readRace = (kind, race) => { const p = path.join(root, `data/source/coh3/${kind}/${race}.json`); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null; };
  const { factions, unplaced } = buildDoctrines(readRace, json('data/rules/production.json'), json('data/rules/conversions.json').conversions, doc);
  fs.writeFileSync(file, `${JSON.stringify({ ...doc, factions }, null, 2)}\n`);
  console.log(`doctrines: ${Object.values(factions).reduce((n, f) => n + Object.keys(f).length, 0)} battlegroups; unplaced doctrine units: ${JSON.stringify(unplaced)}`);
}
