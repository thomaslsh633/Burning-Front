// Production lists from CoH3: what each production building spawns (spawner_ext spawn_items, the data coh3stats' explorer
// shows per race). data/rules/production.json `types` (hand-edited) maps a map building type to the CoH3 building of each
// faction; this tool rewrites `buildings` from the roster.
// Squads no mapped building produces (battlegroup call-ins, v214 restores, coh3stats-only units) join the race's building
// whose squads resemble them most; only high-tier ones need research there (2026-11-26).
// usage: node tools/coh3/production.js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '../lib/config.js';
import { loadSource } from '../lib/coh3.js';
import { buildRoster } from './roster.js';

const SKIP = u => ['built', 'upgrade'].includes(u.source) || u.category === 'emplacements' || /jettisoned/.test(u.id);
const ARMOUR = ['medium_armor', 'heavy_armor', 'vehicle_turret'];

/** Non-tank support vehicle (trucks, ambulances, medical / recovery half-tracks): built in the faction's Tier 2 building. */
export const isSupportVehicle = u => u.category === 'vehicles' && !u.tags.some(t => ARMOUR.includes(t))
  && (u.tags.includes('healer') || /truck|ambulance|recovery|medical/.test(u.id));

const total = u => Object.values(u.price?.cost ?? {}).reduce((a, b) => a + b, 0);
const base = id => id.replace(/_[a-z]+$/, '');   // race suffix off: panzer_iv_cmd_ger → panzer_iv_cmd

/**
 * rosterOut: buildRoster result; prod: data/rules/production.json (types, tier2, place, research).
 * Squads a mapped CoH3 building spawns are produced there; support vehicles go to the race's Tier 2 building; squads no
 * mapped building spawns join the most similar building, directly, unless they are high tier (hero, heavy armour) or a
 * pricier variant of a squad the race already produces: then research. place / research override per squad.
 * → { building: { squads, research } }
 */
export function buildProduction(rosterOut, { types, tier2 = {}, place = {}, research = {} }) {
  const mapped = new Set(Object.values(types).flatMap(t => Object.values(t)));
  const out = Object.fromEntries([...mapped].sort().map(b => [b, { squads: [], research: [] }]));
  const all = Object.values(rosterOut).flatMap(r => r.units);
  const byId = Object.fromEntries(all.map(u => [u.id, { ...u, tagSet: new Set(u.tags) }]));
  const put = (b, list, id) => { if (!out[b][list].includes(id)) out[b][list].push(id); };
  for (const [race, r] of Object.entries(rosterOut)) {
    const candidates = Object.values(types).map(t => t[race]).filter(Boolean);
    const spawned = u => u.producers.filter(b => mapped.has(b));
    const produced = r.units.filter(u => spawned(u).length);
    for (const u of r.units) {
      if (SKIP(u) || !candidates.length && !spawned(u).length) continue;
      const support = isSupportVehicle(u) && tier2[race];
      if (spawned(u).length) {
        for (const b of place[u.id] ? [place[u.id]] : support ? [tier2[race]] : spawned(u)) put(b, research[u.id] ? 'research' : 'squads', u.id);
        continue;
      }
      // affinity: mean over the building's squads; same category (infantry / team weapons / vehicles) first, then shared squad types
      // (support vehicles moved to Tier 2 do not count: they say nothing about what a building makes)
      const score = b => {
        const own = out[b].squads.filter(id => !isSupportVehicle(byId[id]));
        return own.reduce((sum, id) => sum + (byId[id].category === u.category ? 10 : 0) + u.tags.filter(t => byId[id].tagSet.has(t)).length, 0) / (own.length || 1);
      };
      const b = place[u.id] ?? (support || candidates.reduce((a, c) => (score(c) > score(a) ? c : a)));
      const superior = produced.some(p => base(u.id).startsWith(`${base(p.id)}_`) && total(u) > total(p));
      const locked = research[u.id] ?? (!support && (u.hero || u.tags.includes('heavy_armor') || superior));
      put(b, locked ? 'research' : 'squads', u.id);
    }
  }
  for (const v of Object.values(out)) { v.squads.sort(); v.research.sort(); }
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const file = path.join(root, 'data/rules/production.json');
  const prod = JSON.parse(fs.readFileSync(file, 'utf8'));
  prod.buildings = buildProduction(buildRoster(loadSource(root), loadConfig(root).roster), prod);
  fs.writeFileSync(file, `${JSON.stringify(prod, null, 2)}\n`);
  console.log(`production: ${Object.keys(prod.buildings).length} buildings`);
}
