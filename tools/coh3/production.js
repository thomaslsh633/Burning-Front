// Production lists from CoH3: what each production building spawns (spawner_ext spawn_items, the data coh3stats' explorer
// shows per race). data/rules/production.json `types` (hand-edited) maps a map building type to the CoH3 building of each
// faction; this tool rewrites `buildings` from the roster.
// Squads no mapped building produces (battlegroup call-ins, v214 restores, coh3stats-only units) go to the `research` list
// of the race's building whose squads resemble them most (same category, then shared CoH3 squad types): unlocked by research, not produced at start.
// usage: node tools/coh3/production.js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '../lib/config.js';
import { loadSource } from '../lib/coh3.js';
import { buildRoster } from './roster.js';

const SKIP = u => ['built', 'upgrade'].includes(u.source) || u.category === 'emplacements' || /jettisoned/.test(u.id);

/**
 * rosterOut: buildRoster result; types: { mapType: { race: coh3 building id } }; place: { squad: building } hand placements
 * for research squads (they win over the guess) → { building: { squads, research } }
 */
export function buildProduction(rosterOut, types, place = {}) {
  const mapped = new Set(Object.values(types).flatMap(t => Object.values(t)));
  const out = Object.fromEntries([...mapped].sort().map(b => [b, { squads: [], research: [] }]));
  const all = Object.values(rosterOut).flatMap(r => r.units);
  for (const u of all) for (const b of u.producers) if (mapped.has(b) && !out[b].squads.includes(u.id)) out[b].squads.push(u.id);
  for (const [race, r] of Object.entries(rosterOut)) {
    const candidates = Object.values(types).map(t => t[race]).filter(Boolean);
    if (!candidates.length) continue;
    const byId = Object.fromEntries(all.map(u => [u.id, { category: u.category, tags: new Set(u.tags) }]));
    for (const u of r.units) {
      if (SKIP(u) || u.producers.some(b => mapped.has(b))) continue;
      // affinity: mean over the building's squads; same category (infantry / team weapons / vehicles) first, then shared squad types
      const score = b => out[b].squads.reduce((sum, id) => sum + (byId[id]?.category === u.category ? 10 : 0) + u.tags.filter(t => byId[id]?.tags.has(t)).length, 0) / (out[b].squads.length || 1);
      const best = place[u.id] ?? candidates.reduce((a, b) => (score(b) > score(a) ? b : a));
      out[best].research.push(u.id);
    }
  }
  for (const v of Object.values(out)) { v.squads.sort(); v.research.sort(); }
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const file = path.join(root, 'data/rules/production.json');
  const prod = JSON.parse(fs.readFileSync(file, 'utf8'));
  prod.buildings = buildProduction(buildRoster(loadSource(root), loadConfig(root).roster), prod.types, prod.place);
  fs.writeFileSync(file, `${JSON.stringify(prod, null, 2)}\n`);
  console.log(`production: ${Object.keys(prod.buildings).length} buildings`);
}
