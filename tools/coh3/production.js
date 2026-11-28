// Production lists from CoH3: what each production building spawns (spawner_ext spawn_items, the data coh3stats' explorer
// shows per race). data/rules/production.json `types` (hand-edited) maps a map building type to the CoH3 building of each
// faction; this tool rewrites `buildings` from the roster.
// Squads no mapped building produces (battlegroup call-ins, v214 restores, coh3stats-only units) join the race's building of
// their CoH3 tier tag (if any) whose squads resemble them most; only high-tier ones need research there (2026-11-26).
// The HQ makes only engineers and recon units; tiers stop at T3, a tier may have branches (t2a, t2b) (2026-11-28).
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

/** Units the HQ may make: engineers (CoH3 combat_engineer) and recon units (CoH3 has no recon tag: scouts, pathfinders, recon bikes). */
export const isHqUnit = u => u.tags.includes('combat_engineer') || /scout|recon|pathfinder|kettenkrad|kradschutzen|motorcycle/.test(u.id);

const total = u => Object.values(u.price?.cost ?? {}).reduce((a, b) => a + b, 0);
const base = id => id.replace(/_[a-z]+$/, '');   // race suffix off: panzer_iv_cmd_ger → panzer_iv_cmd

/**
 * rosterOut: buildRoster result; prod: data/rules/production.json (types, tier2, place, research); converted: squad ids
 * reached by conversion (data/rules/conversions.json) — without a CoH3 producer they are never produced; lockedConversions:
 * targets of research-locked conversions — research wherever they are produced.
 * Squads a mapped CoH3 building spawns are produced there; support vehicles go to the race's Tier 2 building; squads no
 * mapped building spawns join the most similar building, directly, unless they are high tier (hero, heavy armour) or a
 * pricier variant of a squad the race already produces: then research. place / research override per squad.
 * → { building: { squads, research } }
 */
export function buildProduction(rosterOut, { types, tier2 = {}, place = {}, research = {} }, converted = new Set(), lockedConversions = new Set()) {
  const mapped = new Set(Object.values(types).flatMap(t => Object.values(t))), hqs = new Set(Object.values(types.hq ?? {}));
  const out = Object.fromEntries([...mapped].sort().map(b => [b, { squads: [], research: [] }]));
  const all = Object.values(rosterOut).flatMap(r => r.units);
  const byId = Object.fromEntries(all.map(u => [u.id, { ...u, tagSet: new Set(u.tags) }]));
  const put = (b, list, id) => { if (!out[b][list].includes(id)) out[b][list].push(id); };
  const lockedBy = u => research[u.id] ?? lockedConversions.has(u.id);
  for (const [race, r] of Object.entries(rosterOut)) {
    const slots = Object.entries(types).filter(([k]) => k !== 'hq' && types[k][race]).map(([k, t]) => ({ tier: Number(k[1]), b: t[race] }));
    const candidates = slots.map(x => x.b), hq = types.hq?.[race];
    // a CoH3 tier tag (tier1 … tier4, capped at T3) narrows the choice to that tier's buildings when the race has one
    const inTier = u => { const t = Math.min(3, Number(u.tags.find(x => /^tier\d$/.test(x))?.[4] ?? 0)); const l = slots.filter(x => x.tier === t).map(x => x.b); return l.length ? l : candidates; };
    // the HQ makes only engineers and recon units (2026-11-28); a CoH3 HQ squad of another kind is placed like any other
    const spawned = u => u.producers.filter(b => mapped.has(b) && (!hqs.has(b) || isHqUnit(u)));
    const produced = r.units.filter(u => spawned(u).length);
    const todo = r.units.filter(u => !SKIP(u) && (candidates.length || spawned(u).length));
    for (const u of todo.filter(x => spawned(x).length)) {   // first what CoH3 buildings spawn, then the rest by resemblance
      const support = isSupportVehicle(u) && tier2[race];
      for (const b of place[u.id] ? [place[u.id]] : support ? [tier2[race]] : spawned(u)) put(b, lockedBy(u) ? 'research' : 'squads', u.id);
    }
    for (const u of todo.filter(x => !spawned(x).length)) {
      if (converted.has(u.id) && !place[u.id] && !u.producers.some(b => mapped.has(b))) continue;
      const support = isSupportVehicle(u) && tier2[race];
      // affinity: mean over the building's squads; same category (infantry / team weapons / vehicles) first, then shared squad types
      // (support vehicles moved to Tier 2 do not count: they say nothing about what a building makes)
      const score = b => {
        const own = out[b].squads.filter(id => !isSupportVehicle(byId[id]));
        return own.reduce((sum, id) => sum + (byId[id].category === u.category ? 10 : 0) + u.tags.filter(t => byId[id].tagSet.has(t)).length, 0) / (own.length || 1);
      };
      const b = place[u.id] ?? (support || (isHqUnit(u) && hq) || inTier(u).reduce((x, c) => (score(c) > score(x) ? c : x)));
      const superior = produced.some(p => base(u.id).startsWith(`${base(p.id)}_`) && total(u) > total(p));
      const locked = research[u.id] ?? (lockedConversions.has(u.id) || (!support && (u.hero || u.tags.includes('heavy_armor') || superior)));
      put(b, locked ? 'research' : 'squads', u.id);
    }
  }
  for (const v of Object.values(out)) { v.squads.sort(); v.research.sort(); }
  return out;
}

/**
 * Markdown table of every unit and where it is produced. rosterOut: buildRoster result; prod: production.json;
 * conv: conversions.json list (units reached by conversion are listed with their source unit).
 */
export function productionReport(rosterOut, prod, conv, commit = '', imported = new Set()) {
  const units = Object.fromEntries(Object.values(rosterOut).flatMap(r => r.units).map(u => [u.id, u]));
  const slotOf = {};
  for (const [type, byRace] of Object.entries(prod.types)) for (const [race, b] of Object.entries(byRace)) (slotOf[b] ??= []).push({ type, race });
  const name = id => `${units[id]?.name?.replace(/^!/, '') || '—'}${imported.has(id) ? ' ✓' : ''}`;
  const cost = c => Object.entries(c).map(([r, v]) => `${v} ${r === 'manpower' ? 'MP' : r === 'munition' ? 'mun' : 'fuel'}`).join(' + ') || 'free';
  const lines = [`# Production — every unit and where it is made`, '',
    `Generated by \`node tools/coh3/production.js\` from \`data/rules/production.json\` and \`data/rules/conversions.json\`${commit ? ` (CoH3 data \`${commit}\`)` : ''}.`,
    'Start = produced from the start; Research = unlocked by research in that building (not built yet). ✓ = in the imported unit data (playable now).', ''];
  for (const race of Object.keys(rosterOut)) {
    const rows = [];
    for (const [b, v] of Object.entries(prod.buildings)) {
      const slot = (slotOf[b] || []).find(x => x.race === race);
      if (!slot) continue;
      const tier2 = prod.tier2?.[race] === b ? ' (Tier 2)' : '';
      for (const [list, label] of [['squads', 'Start'], ['research', 'Research']]) {
        for (const id of v[list]) rows.push(`| \`${slot.type}\`${tier2} | \`${b}\` | ${name(id)} | \`${id}\` | ${label} |`);
      }
    }
    const conversions = conv.filter(c => units[c.from] && Object.keys(rosterOut).find(r => rosterOut[r].units.some(u => u.id === c.from)) === race);
    if (!rows.length && !conversions.length) continue;
    lines.push(`## ${race}`, '', '| Map building type | CoH3 building | Unit | Id | Available |', '| --- | --- | --- | --- | --- |', ...rows, '');
    if (conversions.length) {
      lines.push('Conversions (made from another unit in the field, not in a building):', '', '| From | To | Cost | Available |', '| --- | --- | --- | --- |',
        ...conversions.map(c => `| ${name(c.from)} (\`${c.from}\`) | ${name(c.to)} (\`${c.to}\`) | ${cost(c.cost)} | ${c.research ? (c.global ? 'Research (global)' : 'Research') : 'Start'} |`), '');
    }
  }
  return `${lines.join('\n')}\n`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const file = path.join(root, 'data/rules/production.json');
  const prod = JSON.parse(fs.readFileSync(file, 'utf8'));
  const conv = JSON.parse(fs.readFileSync(path.join(root, 'data/rules/conversions.json'), 'utf8')).conversions;
  const roster = buildRoster(loadSource(root), loadConfig(root).roster);
  prod.buildings = buildProduction(roster, prod, new Set(conv.map(c => c.to)), new Set(conv.filter(c => c.research).map(c => c.to)));
  fs.writeFileSync(file, `${JSON.stringify(prod, null, 2)}\n`);
  const commit = JSON.parse(fs.readFileSync(path.join(root, 'data/source/coh3/SOURCE.json'), 'utf8')).commit.slice(0, 8);
  const gen = JSON.parse(fs.readFileSync(path.join(root, 'data/generated/units.json'), 'utf8'));
  const imported = new Set(Object.values(gen.factions || {}).flatMap(f => Object.values(f.sbps || {}).flatMap(g => Object.keys(g))));
  fs.writeFileSync(path.join(root, 'reports/production.md'), productionReport(roster, prod, conv, commit, imported));
  console.log(`production: ${Object.keys(prod.buildings).length} buildings`);
}
