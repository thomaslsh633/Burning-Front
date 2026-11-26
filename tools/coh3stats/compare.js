// Cross-checks our CoH3-derived data against the statistics coh3stats.com calculates.
// usage: node tools/coh3stats/compare.js   → reports/coh3stats-compare.md, reports/coh3stats-compare.json
//
// 1. roster: units on coh3stats vs units in our catalog (reports/catalog.json)
// 2. unit stats: squad cost / population, entity HP / speed / sight vs data/source/coh3
// 3. fire rate: CoH3 expected DPS from our cycle formula (raw rate × damage × accuracy ÷ 6 s) vs coh3stats' DPS curve at
//    each band's CoH3 distance, and the same for the game's whole-number values (shots × damage per shot × accuracy scale)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { indexKind } from '../coh3/catalog.js';
import { rawShots, fireRate } from '../import-coh3/fire-rate.js';
import { RACE_MAP } from './fetch.js';
import { loadConfig } from '../lib/config.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dir = path.join(root, 'data/source/coh3');
const statsDir = path.join(root, 'data/source/coh3stats');
const EXT = (rec, name) => (rec?.extensions || []).map(x => x.exts || x.squadexts || x).find(x => x.template_reference?.value?.endsWith(name));
const avg = r => ((r?.min ?? 0) + (r?.max ?? 0)) / 2;
const pct = x => (x == null || !isFinite(x) ? '—' : `${x >= 0 ? '+' : ''}${Math.round(x * 100)} %`);
const BANDS = ['near', 'mid', 'far'];

/** Linear interpolation on a [[x, y], …] curve. */
export function curveAt(curve, x) {
  if (!curve?.length) return null;
  if (x <= curve[0][0]) return curve[0][1];
  for (let i = 1; i < curve.length; i++) {
    const [x1, y1] = curve[i], [x0, y0] = curve[i - 1];
    if (x <= x1) return x1 === x0 ? y1 : y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return null;   // beyond the curve (out of range)
}

/** CoH3 distance in metres of each band; far = -1 means max range. */
export function bandDistances(bag) {
  const d = bag.range?.distance || {}, max = bag.range?.max ?? 0;
  return Object.fromEntries(BANDS.map(b => [b, d[b] == null || d[b] < 0 ? max : d[b]]));
}

function main() {
  const fireCfg = loadConfig(root).fire;
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'reports/catalog.json'), 'utf8')).catalog;
  const ebps = indexKind(dir, 'ebps', r => `ebps/races/${r}`);
  const weapons = indexKind(dir, 'weapon', r => `weapon/${r}`);
  const ebpsById = new Map([...ebps].map(([p, v]) => [p.split('/').pop(), v]));
  const weaponById = new Map([...weapons].map(([p, v]) => [p.split('/').pop(), v]));

  const out = {};
  for (const ours of Object.values(RACE_MAP)) {
    const file = path.join(statsDir, `${ours}.json`);
    if (!fs.existsSync(file)) continue;
    const stats = JSON.parse(fs.readFileSync(file, 'utf8'));
    const cat = catalog[ours]?.units ?? [];
    const catIds = new Set(cat.map(u => u.id)), statIds = new Set(Object.keys(stats));
    const r = { onlyCoh3stats: [...statIds].filter(i => !catIds.has(i)).sort(), onlyOurs: [...catIds].filter(i => !statIds.has(i)).sort(),
      unitDiffs: [], dps: [], names: {} };

    for (const [id, s] of Object.entries(stats)) {
      r.names[id] = s.name;
      // squad cost from CoH3 entities (sum of member cost × count) vs coh3stats total
      const mine = { manpower: 0, munition: 0, fuel: 0 };
      for (const l of s.loadout) {
        const c = EXT(ebpsById.get(l.entity)?.rec, 'cost_ext')?.time_cost?.cost || {};
        for (const k of Object.keys(mine)) mine[k] += (c[k] || 0) * (l.num || 0);
      }
      for (const k of Object.keys(mine)) {
        const theirs = s.cost?.[k] ?? 0;
        if (Math.round(mine[k]) !== Math.round(theirs)) r.unitDiffs.push({ unit: id, field: `cost.${k}`, coh3: Math.round(mine[k]), coh3stats: theirs });
      }
      for (const e of s.entities) {
        const rec = ebpsById.get(e.id)?.rec;
        if (!rec) { r.unitDiffs.push({ unit: id, field: `entity ${e.id}`, coh3: 'missing', coh3stats: 'present' }); continue; }
        const mineE = { hp: EXT(rec, 'health_ext')?.hitpoints ?? null, speed: EXT(rec, 'moving_ext')?.speed_scaling_table?.max_speed ?? null,
          sight: EXT(rec, 'sight_ext')?.sight_package?.outer_radius ?? null };
        for (const k of ['hp', 'speed', 'sight']) if (e[k] != null && mineE[k] != null && Math.abs(e[k] - mineE[k]) > 0.01) {
          r.unitDiffs.push({ unit: id, field: `${e.id}.${k}`, coh3: mineE[k], coh3stats: e[k] });
        }
      }
      // fire rate vs coh3stats DPS
      for (const w of s.weapons) {
        const rec = weaponById.get(w.id);
        if (!rec || !w.dps?.length || r.dps.some(x => x.weapon === w.id)) continue;
        const bag = rec.rec.weapon_bag, category = rec.path[rec.path.length - 2] ?? rec.path[0];
        const dmg = avg(bag.damage), dist = bandDistances(bag), fr = fireRate(bag, category, fireCfg, w.id);
        const row = { weapon: w.id, name: w.name, unit: id, rule: fr.rule, bands: {} };
        for (const b of BANDS) {
          const acc = bag.accuracy?.[b] ?? 1, theirs = curveAt(w.dps, dist[b]);
          const coh3 = (rawShots(bag, b, fireCfg.window_seconds) * dmg * acc) / fireCfg.window_seconds;
          const game = fr.rule === 'per_use' || fr.rule === 'ability' ? null
            : (fr.shots_per_turn[b] * fr.damage_per_shot[b] * acc * (fr.accuracy_scale?.[b] ?? 1)) / ((fr.reload_turns + 1) * fireCfg.window_seconds);
          row.bands[b] = { distance: dist[b], coh3stats: theirs, coh3, game,
            formula_vs_coh3stats: theirs ? coh3 / theirs - 1 : null, game_vs_coh3stats: theirs && game != null ? game / theirs - 1 : null };
        }
        r.dps.push(row);
      }
    }
    out[ours] = r;
  }
  fs.writeFileSync(path.join(root, 'reports/coh3stats-compare.json'), JSON.stringify(out, null, 1) + '\n');

  const srcFile = path.join(statsDir, 'SOURCE.json');
  const src = fs.existsSync(srcFile) ? JSON.parse(fs.readFileSync(srcFile, 'utf8')) : { build_id: '(download in progress)', fetched: '—' };
  const L = ['# coh3stats cross-check', '', `coh3stats build \`${src.build_id}\` (fetched ${src.fetched}) vs coh3-data in \`data/source/coh3\`.`,
    'Generated by `node tools/coh3stats/compare.js`; do not edit.', '',
    '- **formula**: CoH3 expected DPS from our fire-cycle formula (raw rate × damage × accuracy ÷ 6 s) against the coh3stats DPS curve at each band\'s CoH3 distance.',
    '- **game**: the same for the game values (whole shots × whole damage × accuracy scale, reload turns counted).', '',
    '## Known differences', '',
    '- **Rifles, SMGs, MGs, tank guns**: within about ±6 %, so the fire-cycle formula matches coh3stats.',
    '- **AT guns (towed and emplaced) ≈ +320 %**: the coh3stats default DPS is against an infantry target and applies the weapon\'s',
    '  infantry damage multiplier (57 mm: ×0.25; ours × 0.25 ÷ coh3stats = 1.04). Our formula is the weapon\'s raw rate.',
    '- **Mortars and artillery**: coh3stats shows 0 DPS for indirect fire, so they cannot be checked here.',
    '- **Snipers, Boys AT rifles ≈ +106 %, 20 mm guns ≈ +50 %**: not explained yet (no infantry multiplier in their data);',
    '  probably coh3stats counts ready-aim for each new target. Our rate is the sustained rate.',
    '- **Squad prices**: some coh3stats totals are lower than the sum of entity costs (Panzergrenadiers 340 vs 5 × 72 = 360);',
    '  the catalog uses the coh3stats total, the price the game shows.', ''];
  L.push('## Summary', '', '| Faction | coh3stats units | only on coh3stats | only ours | unit stat differences | weapons checked | formula within 10 % | game within 10 % |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
  const within = (rows, key) => rows.filter(x => BANDS.every(b => x.bands[b][key] == null || Math.abs(x.bands[b][key]) <= 0.1)).length;
  for (const [f, r] of Object.entries(out)) {
    L.push(`| ${f} | ${Object.keys(r.names).length} | ${r.onlyCoh3stats.length} | ${r.onlyOurs.length} | ${r.unitDiffs.length} | ${r.dps.length} | ${within(r.dps, 'formula_vs_coh3stats')} | ${within(r.dps, 'game_vs_coh3stats')} |`);
  }
  for (const [f, r] of Object.entries(out)) {
    L.push('', `## ${f}`, '', `**Only on coh3stats (${r.onlyCoh3stats.length}):** ${r.onlyCoh3stats.map(i => `${i} (${r.names[i]})`).join(', ') || '—'}`, '',
      `**Only in our catalog (${r.onlyOurs.length}):** ${r.onlyOurs.join(', ') || '—'}`, '');
    if (r.unitDiffs.length) {
      L.push('### Unit stat differences', '', '| Unit | field | CoH3 files | coh3stats |', '| --- | --- | --- | --- |');
      for (const d of r.unitDiffs) L.push(`| ${d.unit} | ${d.field} | ${d.coh3} | ${d.coh3stats} |`);
      L.push('');
    }
    L.push('### Fire rate vs coh3stats DPS (near / mid / far)', '', '| Weapon | name | rule | formula | game |', '| --- | --- | --- | --- | --- |');
    for (const x of r.dps.sort((a, b) => a.weapon.localeCompare(b.weapon))) {
      L.push(`| ${x.weapon} | ${x.name} | ${x.rule} | ${BANDS.map(b => pct(x.bands[b].formula_vs_coh3stats)).join(' / ')} | ${BANDS.map(b => pct(x.bands[b].game_vs_coh3stats)).join(' / ')} |`);
    }
  }
  fs.writeFileSync(path.join(root, 'reports/coh3stats-compare.md'), L.join('\n') + '\n');
  for (const [f, r] of Object.entries(out)) {
    console.log(`${f}: ${Object.keys(r.names).length} units, only coh3stats ${r.onlyCoh3stats.length}, only ours ${r.onlyOurs.length}, stat diffs ${r.unitDiffs.length}, ` +
      `weapons ${r.dps.length} (formula ±10 %: ${within(r.dps, 'formula_vs_coh3stats')}, game ±10 %: ${within(r.dps, 'game_vs_coh3stats')})`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
