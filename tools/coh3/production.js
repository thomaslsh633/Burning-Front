// Production lists from CoH3: what each production building spawns (spawner_ext spawn_items, the data coh3stats' explorer
// shows per race). data/rules/production.json is per faction: `slots` (hand-edited) maps the map tier slots (hq, t1–t3,
// branches t2a …) to the faction's CoH3 buildings, `tier2` names its Tier 2 building; this tool rewrites each faction's
// `buildings` with three unlock lists: base, doctrine, research (rules at buildProduction).
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

/** Engineers (CoH3 combat_engineer) and recon units (CoH3 has no recon tag: scouts, pathfinders, recon bikes). */
export const isHqUnit = u => u.tags.includes('combat_engineer') || /scout|recon|pathfinder|kettenkrad|kradschutzen|motorcycle/.test(u.id);

const total = u => Object.values(u.price?.cost ?? {}).reduce((a, b) => a + b, 0);
const base = id => id.replace(/_[a-z]+$/, '');   // race suffix off: panzer_iv_cmd_ger → panzer_iv_cmd
export const UNLOCKS = ['base', 'doctrine', 'research'];

/**
 * rosterOut: buildRoster result; prod: data/rules/production.json (factions[race].slots / tier2, place, unlock);
 * conversions: data/rules/conversions.json list. → { race: { building: { slot, base, doctrine, research } } }
 *
 * Where: what a mapped CoH3 building spawns is made there; non-tank support vehicles in the race's Tier 2 building; the HQ
 * makes only base engineers and recon it spawns in CoH3, no elite squads (mid-game engineers go to tier buildings); every
 * other unit joins a tier building — of its CoH3 tier tag (capped at T3) if it has one, then the most similar. Squads
 * reached only by conversion are not produced.
 * How unlocked: doctrine — CoH3 battlegroup units (only called in, or only on coh3stats; not heroes) and targets of
 * doctrine-unlocked conversions; research — targets of research conversions, and for units no CoH3 building makes:
 * heroes, heavy armour, pricier variants of a squad the race already produces; base — the rest. `unlock` / `place` override.
 */
export function buildProduction(rosterOut, { factions, place = {}, unlock = {} }, conversions = []) {
  const convTo = Object.fromEntries(conversions.map(c => [c.to, c]));
  const home = {}, out = {};
  for (const [race, f] of Object.entries(factions)) {
    out[race] = {};
    for (const [slot, b] of Object.entries(f.slots)) { home[b] = race; out[race][b] = { slot, base: [], doctrine: [], research: [] }; }
  }
  const all = Object.values(rosterOut).flatMap(r => r.units);
  const byId = Object.fromEntries(all.map(u => [u.id, { ...u, tagSet: new Set(u.tags) }]));
  const put = (b, list, id) => { const v = out[home[b]][b]; if (!v[list].includes(id)) v[list].push(id); };
  // battlegroup units: only called in by an ability, or only named on coh3stats (CoH3's battlegroup-requirement flag also
  // marks base squads such as Scouts and the M3, so it is not used); heroes are research
  const doctrineUnit = u => ['called_in', 'coh3stats'].includes(u.source) && !u.hero;
  for (const [race, r] of Object.entries(rosterOut)) {
    const f = factions[race];
    const slots = f ? Object.entries(f.slots).filter(([k]) => k !== 'hq').map(([k, b]) => ({ tier: Number(k[1]), b })) : [];
    const candidates = slots.map(x => x.b);
    const inTier = u => { const t = Math.min(3, Number(u.tags.find(x => /^tier\d$/.test(x))?.[4] ?? 0)); const l = slots.filter(x => x.tier === t).map(x => x.b); return l.length ? l : candidates; };
    const fixedUnlock = u => unlock[u.id] ?? convTo[u.id]?.unlock ?? (doctrineUnit(u) ? 'doctrine' : null);
    const hqOk = (u, b) => isHqUnit(u) && !u.tags.includes('elite_infantry') && !fixedUnlock(u) && b === f?.slots.hq;
    const spawned = u => u.producers.filter(b => home[b] && (out[home[b]][b].slot !== 'hq' || hqOk(u, b)));
    const produced = r.units.filter(u => spawned(u).length);
    const todo = r.units.filter(u => !SKIP(u) && (candidates.length || spawned(u).length));
    for (const u of todo.filter(x => spawned(x).length)) {   // first what CoH3 buildings spawn, then the rest by resemblance
      const support = isSupportVehicle(u) && f?.tier2;
      for (const b of place[u.id] ? [place[u.id]] : support ? [f.tier2] : spawned(u)) put(b, fixedUnlock(u) ?? 'base', u.id);
    }
    for (const u of todo.filter(x => !spawned(x).length)) {
      if (convTo[u.id] && !place[u.id] && !u.producers.some(b => home[b])) continue;
      const support = isSupportVehicle(u) && f.tier2;
      // affinity: mean over the building's base squads; same category (infantry / team weapons / vehicles) first, then shared squad
      // types (support vehicles moved to Tier 2 do not count: they say nothing about what a building makes)
      const score = b => {
        const own = out[race][b].base.filter(id => !isSupportVehicle(byId[id]));
        return own.reduce((sum, id) => sum + (byId[id].category === u.category ? 10 : 0) + u.tags.filter(t => byId[id].tagSet.has(t)).length, 0) / (own.length || 1);
      };
      const b = place[u.id] ?? (support || inTier(u).reduce((x, c) => (score(c) > score(x) ? c : x)));
      const superior = produced.some(p => base(u.id).startsWith(`${base(p.id)}_`) && total(u) > total(p));
      put(b, fixedUnlock(u) ?? (!support && (u.hero || u.tags.includes('heavy_armor') || superior) ? 'research' : 'base'), u.id);
    }
  }
  for (const f of Object.values(out)) for (const v of Object.values(f)) for (const k of UNLOCKS) v[k].sort();
  return out;
}

/**
 * Markdown tables: per faction, per building, every unit and how it is unlocked, then the faction's field conversions.
 * imported: squad ids in the unit data (marked ✓, playable now).
 */
export function productionReport(rosterOut, prod, conv, commit = '', imported = new Set()) {
  const units = Object.fromEntries(Object.values(rosterOut).flatMap(r => r.units).map(u => [u.id, u]));
  const raceOf = Object.fromEntries(Object.entries(rosterOut).flatMap(([race, r]) => r.units.map(u => [u.id, race])));
  const name = id => `${units[id]?.name?.replace(/^!/, '') || '—'}${imported.has(id) ? ' ✓' : ''}`;
  const cost = c => Object.entries(c).map(([r, v]) => `${v} ${r === 'manpower' ? 'MP' : r === 'munition' ? 'mun' : 'fuel'}`).join(' + ') || 'free';
  const LABEL = { base: 'Base', doctrine: 'Doctrine', research: 'Research' };
  const lines = ['# Production — every unit and where it is made', '',
    `Generated by \`node tools/coh3/production.js\` from \`data/rules/production.json\` and \`data/rules/conversions.json\`${commit ? ` (CoH3 data \`${commit}\`)` : ''}.`,
    'Base = produced from the start; Doctrine = unlocked by a doctrine; Research = unlocked by research in that building (data/rules/research.json); Doctrine = unlocked by picking that CoH3 battlegroup (data/rules/doctrines.json). ✓ = in the imported unit data (playable now).', ''];
  for (const [race, f] of Object.entries(prod.factions)) {
    lines.push(`## ${race}`, '');
    for (const [b, v] of Object.entries(f.buildings)) {
      const n = UNLOCKS.reduce((s, k) => s + v[k].length, 0);
      lines.push(`### ${v.slot.toUpperCase()} — \`${b}\`${f.tier2 === b ? ' (Tier 2: support vehicles)' : ''}`, '');
      if (!n) { lines.push('(nothing yet)', ''); continue; }
      lines.push('| Unit | Id | Unlock |', '| --- | --- | --- |', ...UNLOCKS.flatMap(k => v[k].map(id => `| ${name(id)} | \`${id}\` | ${LABEL[k]} |`)), '');
    }
    const cs = conv.filter(c => raceOf[c.from] === race);
    if (cs.length) lines.push('### Field conversions (made from another unit, not in a building)', '', '| From | To | Cost | Unlock |', '| --- | --- | --- | --- |',
      ...cs.map(c => `| ${name(c.from)} (\`${c.from}\`) | ${name(c.to)} (\`${c.to}\`) | ${cost(c.cost)} | ${LABEL[c.unlock ?? 'base']}${c.doctrine ? ` (${c.doctrine})` : ''}${c.global ? ', global' : ''} |`), '');
  }
  return `${lines.join('\n')}\n`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const file = path.join(root, 'data/rules/production.json');
  const prod = JSON.parse(fs.readFileSync(file, 'utf8'));
  const conv = JSON.parse(fs.readFileSync(path.join(root, 'data/rules/conversions.json'), 'utf8')).conversions;
  const roster = buildRoster(loadSource(root), loadConfig(root).roster);
  const built = buildProduction(roster, prod, conv);
  for (const [race, f] of Object.entries(prod.factions)) f.buildings = built[race];
  fs.writeFileSync(file, `${JSON.stringify(prod, null, 2)}\n`);
  const commit = JSON.parse(fs.readFileSync(path.join(root, 'data/source/coh3/SOURCE.json'), 'utf8')).commit.slice(0, 8);
  const gen = JSON.parse(fs.readFileSync(path.join(root, 'data/generated/units.json'), 'utf8'));
  const imported = new Set(Object.values(gen.factions || {}).flatMap(f => Object.values(f.sbps || {}).flatMap(g => Object.keys(g))));
  fs.writeFileSync(path.join(root, 'reports/production.md'), productionReport(roster, prod, conv, commit, imported));
  console.log(`production: ${Object.values(prod.factions).reduce((n, f) => n + Object.keys(f.buildings).length, 0)} buildings`);
}
