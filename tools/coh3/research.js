// Research per production building (2026-11-28), written to data/rules/research.json:
//   upgrade  CoH3 player upgrades the building researches (its upgrade_ext standard_upgrades) that something in the unit
//            data needs (an ability's or a weapon kit's requirements), at CoH3 cost and time (seconds ÷ seconds_per_turn);
//   unit     the building's `research` squads of data/rules/production.json, at data/balance/economy.json research settings.
// usage: node tools/coh3/research.js   (after npm run build:data)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSource, byId, EXT, last } from '../lib/coh3.js';
import { loadConfig } from '../lib/config.js';
import { loadGameData } from '../lib/game-data.js';

const RES = ['manpower', 'munition', 'fuel'];
const costOf = c => Object.fromEntries(RES.filter(r => (c?.[r] ?? 0) > 0).map(r => [r, Math.round(c[r])]));

/** → { factions: { faction: { building: { id: { unlocks, cost, turns, coh3_ref? } } } } } */
export function buildResearch({ ebps, upgrades }, prod, units, settings, scale) {
  const needed = new Set([...Object.values(units.ability).flatMap(a => a.requires?.upgrades || []),
    ...Object.values(units.upgrade).flatMap(u => [...(u.requires?.upgrades || []), ...(u.requires?.any_upgrades || [])])]);
  const round5 = v => Math.round(v / 5) * 5;
  const out = {};
  for (const [faction, f] of Object.entries(prod.factions)) {
    for (const [building, lists] of Object.entries(f.buildings)) {
      const items = {};
      for (const ref of (EXT(ebps.get(building)?.rec, 'upgrade_ext')?.standard_upgrades || []).map(u => u.upgrade?.instance_reference)) {
        const id = last(ref), bag = upgrades.get(id)?.rec?.upgrade_bag;
        if (!bag || bag.owner_type !== 'player' || !needed.has(id)) continue;
        items[id] = { unlocks: 'upgrade', cost: costOf(bag.time_cost?.cost), turns: Math.max(1, Math.ceil((bag.time_cost?.time_seconds ?? 0) / scale.seconds_per_turn)), coh3_ref: ref };
      }
      for (const id of lists.research || []) {
        const price = units.sbps[id]?.price?.cost;
        if (!price) continue;   // not in the unit data
        items[id] = { unlocks: 'unit', cost: Object.fromEntries(Object.entries(price).map(([r, v]) => [r, round5(v * settings.unit_price_share)]).filter(([, v]) => v > 0)), turns: settings.unit_turns };
      }
      if (Object.keys(items).length) (out[faction] ??= {})[building] = items;
    }
  }
  return { factions: out, needed };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const src = loadSource(root), data = loadGameData(root), { scale } = loadConfig(root);
  const prod = JSON.parse(fs.readFileSync(path.join(root, 'data/rules/production.json'), 'utf8'));
  const { factions, needed } = buildResearch({ ebps: byId(src.ebps), upgrades: byId(src.upgrades) }, prod, data.units, data.balance.economy.research, scale);
  const about = 'Research per faction and CoH3 production building (written by node tools/coh3/research.js; do not edit). upgrade: a CoH3 player upgrade that an ability or weapon kit requires, at CoH3 cost and time; unit: a squad of the building\'s production research list, at data/balance/economy.json research settings. A building researches one item at a time; the side holds it (teams[t].unlocks) from the turn it finishes.';
  fs.writeFileSync(path.join(root, 'data/rules/research.json'), `${JSON.stringify({ about, factions }, null, 2)}\n`);
  const found = new Set(Object.values(factions).flatMap(f => Object.values(f).flatMap(b => Object.keys(b))));
  console.log(`research: ${found.size} items; required upgrades no building researches (doctrine / battlegroup): ${[...needed].filter(id => !found.has(id)).length}`);
}
