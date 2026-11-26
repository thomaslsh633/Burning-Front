// Barrage / indirect-fire abilities: attack power as CoH3's ability data defines it.
// A unit barrage ability references a weapon item (ebps …/weapons/…) whose weapon_ext names the weapon, and carries
// NUM_SHOTS (NUM_SHOTS_2 / _3 for later veterancy). Off-map strikes reference custom_property_container/offmap records,
// which coh3-data does not publish; they are listed with cost / recharge / radius only.
//
// usage: node tools/coh3/barrages.js   → reports/barrages.md, reports/barrages.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RACES } from './fetch.js';
import { classOf, rangeHex, minRangeHex, barrageUse } from '../import-coh3/indirect.js';
import { loadConfig } from '../lib/config.js';
import { indexKind, EXT, avg } from '../lib/coh3.js';

const ROUND = x => Math.round(x);

/** Ability records (records holding ability_bag) with their path. */
export function* abilityRecords(node, p = []) {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return;
  if ('ability_bag' in node) { yield { path: p, rec: node }; return; }
  for (const [k, v] of Object.entries(node)) yield* abilityRecords(v, [...p, k]);
}

/** Named numeric custom properties anywhere in an ability record: { NUM_SHOTS: 6, … }. */
export function numericProps(rec) {
  const out = {};
  for (const m of JSON.stringify(rec).matchAll(/"id": ?"([A-Z0-9_]+)", ?"value": ?(-?[0-9.]+)/g)) out[m[1]] ??= Number(m[2]);
  return out;
}

export const turns = (seconds, scale) => Math.max(1, Math.ceil((seconds ?? 0) / scale.seconds_per_turn));   // SPEC §1

function build(dir) {
  const { indirect, scale } = loadConfig(path.join(dir, '../../..'));
  const ebps = indexKind(dir, 'ebps', r => `ebps/races/${r}`);
  const weapons = indexKind(dir, 'weapon', r => `weapon/${r}`);
  const sbps = indexKind(dir, 'sbps', r => `sbps/races/${r}`);
  const out = [];
  for (const race of RACES.filter(r => r !== 'common')) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, 'abilities', `${race}.json`), 'utf8'));
    for (const { path: p, rec } of abilityRecords(data)) {
      const id = p[p.length - 1], text = JSON.stringify(rec), bag = rec.ability_bag;
      const items = [...new Set(text.match(/ebps\/races\/[a-z_]+\/weapons\/[a-z0-9_/]+/g) || [])];
      const offmap = /custom_property_container\/offmap\//.test(text);
      if (!items.length && !offmap) continue;
      if (!items.length && !/barrage|artillery|strike|rocket|bombard|howitzer|mortar/.test(id)) continue;
      const casters = [...sbps].filter(([, s]) => JSON.stringify(EXT(s.rec, 'squad_ability_ext') ?? {}).includes(`/${id}"`)).map(([q]) => q.split('/').pop());
      const props = numericProps(rec);
      const cost = Object.fromEntries(Object.entries({ ...bag.cost_to_player }).filter(([k, v]) => v && ['manpower', 'munition', 'fuel'].includes(k)).map(([k, v]) => [k, ROUND(v)]));
      const row = { race, id, category: p[0], casters, offmap, cost, recharge_s: bag.recharge_time ?? 0, recharge_turns: turns(bag.recharge_time, scale),
        range_m: bag.range ?? 0, range_hex: bag.range ? ROUND(bag.range / scale.metres_per_hex) : 0, min_range_m: bag.min_range ?? 0,
        radius_m: bag.ui_reticule_radius_max ?? 0, radius_hex: bag.ui_reticule_radius_max ? Math.max(0, ROUND(bag.ui_reticule_radius_max / scale.metres_per_hex)) : 0,
        shots: props.NUM_SHOTS ?? props.SHOTS_TO_FIRE_AT_TARGET ?? null, shots_vet: [props.NUM_SHOTS_2, props.NUM_SHOTS_3].filter(v => v != null),
        weapons: [] };
      for (const item of items) {
        const w = EXT(ebps.get(item)?.rec, 'weapon_ext')?.weapon?.instance_reference;
        const wb = w ? weapons.get(w)?.rec?.weapon_bag : null;
        if (!wb) { row.weapons.push({ item: item.split('/').pop(), weapon: null }); continue; }
        const ae = wb.area_effect || {};
        row.weapons.push({ item: item.split('/').pop(), weapon: w.split('/').pop(), class: wb.weapon_class ?? '',
          damage: ROUND(avg(wb.damage)), penetration: ROUND(wb.penetration?.near ?? 0),
          aoe_radius_m: ae.area_info?.outer_radius ?? 0, aoe_falloff: ae.damage ? [ae.damage.near, ae.damage.mid, ae.damage.far] : null,
          max_members: ae.damage_max_members_per_squad ?? null,
          scatter: wb.scatter ? { angle_deg: wb.scatter.angle_scatter, distance_ratio: wb.scatter.distance_scatter_ratio, distance_max_m: wb.scatter.distance_scatter_max } : null,
          suppression: wb.area_effect?.suppression?.near ?? 0, range_max_m: wb.range?.max ?? 0 });
      }
      const main = row.weapons.find(x => x.weapon && x.damage > 0) ?? row.weapons.find(x => x.weapon);
      row.total_damage = main && row.shots ? ROUND(main.damage * row.shots) : null;
      // game values (data/balance/indirect.json): cadence, shells per use, range cap, spread
      const cls = classOf(id, indirect) ?? (main?.weapon ? classOf(main.weapon, indirect) : null);
      if (cls && row.shots) {
        const g = barrageUse({ shells: row.shots, recharge_s: row.recharge_s }, cls);
        row.game = { class: cls.id, ...g, damage_per_shell: main.damage, total_damage: main.damage * g.shells,
          range_hex: rangeHex(row.range_m || main.range_max_m, cls),
          min_range_hex: minRangeHex(row.min_range_m || 0, row.range_m || main.range_max_m, cls) };
      }
      out.push(row);
    }
  }
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const rows = build(path.join(root, 'data/source/coh3'));
  const { scale } = loadConfig(root), m = scale.metres_per_hex, t = scale.seconds_per_turn;
  fs.writeFileSync(path.join(root, 'reports/barrages.json'), JSON.stringify(rows, null, 1) + '\n');
  const res = o => Object.entries(o).map(([k, v]) => `${v} ${k.slice(0, 3)}`).join(', ') || '—';
  const L = ['# Barrage and indirect-fire abilities (CoH3 ability data)', '',
    'Generated by `node tools/coh3/barrages.js`; do not edit. Damage is CoH3 per shell; total = shells × damage per shell.',
    `Game columns (data/balance/indirect.json): one use every N turns, shells = CoH3 shells × N × ${t} s ÷ CoH3 recharge (rounded up, accuracy × carries the rest), shell damage unchanged, each shell lands on a random hex within the spread, range = metres ÷ ${m} capped per class.`,
    `Turns: recharge ÷ ${t} s rounded up; hexes: metres ÷ ${m} (data/balance/scale.json). Off-map strikes: CoH3 keeps their shells in custom_property_container/offmap, which coh3-data does not publish.`, ''];
  for (const race of [...new Set(rows.map(r => r.race))]) {
    const mine = rows.filter(r => r.race === race);
    L.push(`## ${race}`, '', '| Ability | casters | weapon | dmg / shell | pen | AoE m | CoH3 shells (vet) | CoH3 total | CoH3 recharge s | range m | cost | game: class | every (turns) | shells | acc × | spread hex | range hex (min–max) | game total |',
      '| --- | --- | --- | ---: | ---: | ---: | --- | ---: | ---: | ---: | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |');
    for (const r of mine.sort((a, b) => Number(a.offmap) - Number(b.offmap) || a.id.localeCompare(b.id))) {
      const w = r.weapons.find(x => x.weapon && x.damage > 0) ?? r.weapons.find(x => x.weapon) ?? {};
      L.push(`| ${r.id}${r.offmap ? ' (off-map)' : ''} | ${r.casters.join(', ') || '—'} | ${w.weapon ?? (r.offmap ? 'not published' : '—')} | ${w.damage ?? '—'} | ${w.penetration ?? '—'} | ${w.aoe_radius_m ?? '—'} | ` +
        `${r.shots ?? '—'}${r.shots_vet.length ? ` (${r.shots_vet.join(' / ')})` : ''} | ${r.total_damage ?? '—'} | ${r.recharge_s} | ${r.range_m} | ${res(r.cost)} | ` +
        (r.game ? `${r.game.class} | ${r.game.usage_turns} | ${r.game.shells} | ${r.game.accuracy_scale} | ${r.game.spread_hex} | ${r.game.min_range_hex}–${r.game.range_hex} | ${r.game.total_damage} |` : '— | | | | | | |'));
    }
    L.push('');
  }
  fs.writeFileSync(path.join(root, 'reports/barrages.md'), L.join('\n') + '\n');
  const unit = rows.filter(r => !r.offmap), off = rows.filter(r => r.offmap);
  console.log(`${rows.length} abilities: ${unit.length} with weapon data (${unit.filter(r => r.total_damage).length} with shells × damage), ${off.length} off-map`);
}
