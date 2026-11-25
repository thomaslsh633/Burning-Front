// Downloads the unit statistics coh3stats.com calculates (explorer pages) for our factions and keeps a trimmed copy:
// English names and descriptions, squad totals (cost, population, time, upkeep), entities (HP, armour, speed, sight),
// weapons with their DPS-over-distance curve, veterancy, upgrades, abilities.
// coh3stats builds these from the same coh3-data files as data/source/coh3; we use them as reference and cross-check.
//
// usage: node tools/coh3stats/fetch.js   → data/source/coh3stats/<faction>.json, SOURCE.json
// Behind an HTTPS proxy run with NODE_USE_ENV_PROXY=1 (Node 22+). Polite: one request at a time with a pause; responses are cached in the OS temp folder so a rerun resumes.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SITE = 'https://coh3stats.com';
// coh3stats race id → our CoH3 race id (coh3stats "british" is the multiplayer British Forces = british_africa)
export const RACE_MAP = { german: 'german', american: 'american', dak: 'afrika_korps', british: 'british_africa' };
const PAUSE_MS = 150;

const r2 = x => (typeof x === 'number' ? Math.round(x * 100) / 100 : x);

/** Keep what Burning Front uses from one unit page's calculatedData. */
export function trimUnit(cd) {
  const sq = cd.resolvedSquad || {};
  const vet = sq.veterancyInfo || {};
  return {
    id: sq.id, faction: sq.faction, type: sq.unitType, path: sq.path,
    name: sq.ui?.screenName ?? '', help: sq.ui?.helpText ?? '', brief: sq.ui?.briefText ?? '',
    loadout: (sq.loadout || []).map(l => ({ entity: String(l.type ?? l.ebp ?? l.id ?? '').split('/').pop(), num: l.num })),
    cost: cd.totalCost ?? null, upkeep: cd.totalUpkeepCost ?? null,
    pop: sq.populationExt?.personnel_pop ?? null,
    reinforce: sq.reinforce ?? null, capture_rate: sq.capture_rate ?? null,
    veterancy: ['one', 'two', 'three'].filter(k => vet[k]).map(k => ({ xp: vet[k].exp, text: vet[k].screenName, modifiers: vet[k].modifiers })),
    entities: (cd.resolvedEntities || []).map(e => ({
      id: e.id, type: e.unitType, types: e.unitTypes, cost: e.cost,
      hp: e.health?.hitpoints ?? null, target_size: e.health?.targetSize ?? null,
      armor: e.health?.armorLayout ? { front: e.health.armorLayout.frontArmor, side: e.health.armorLayout.sideArmor, rear: e.health.armorLayout.rearArmor } : null,
      speed: e.moving_ext?.speed_scaling_table?.max_speed ?? null,
      sight: e.sight_ext?.sight_package?.outer_radius ?? null, detect: e.sight_ext?.detect_camouflage?.tp_global ?? null,
    })),
    weapons: (cd.squadWeapons || []).map(w => ({
      id: w.weapon_id, name: w.weapon?.ui_name ?? w.description ?? '', class: w.weapon?.weapon_class ?? '', num: w.num, carrier: w.unit,
      dps: (w.dps_default || []).map(p => [r2(p.x), r2(p.y)]),
    })),
    upgrades: (cd.upgrades || []).map(u => ({ id: u.id, name: u.ui?.screenName ?? '', brief: u.ui?.briefText ?? '', cost: u.cost ?? u.time_cost ?? null })),
    upgrade_weapons: (cd.upgradeWeaponLoadouts || []).map(u => ({ upgrade: u.upgrade?.id, weapons: (u.weapons || u.loadout || []).map(w => w.weapon_id ?? w.id).filter(Boolean) })),
    abilities: (cd.abilities || []).map(a => (typeof a === 'string' ? a : a.id)).filter(Boolean),
  };
}

async function get(url, cacheDir) {
  const file = path.join(cacheDir, url.replace(/[^a-z0-9]+/gi, '_').slice(-180) + '.json');
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(url, { headers: { 'user-agent': 'burning-front-data-tool' } }).catch(e => ({ ok: false, status: e.message }));
    if (res.ok) { const text = await res.text(); fs.writeFileSync(file, text); await new Promise(r => setTimeout(r, PAUSE_MS)); return JSON.parse(text); }
    if (res.status === 404) return null;
    await new Promise(r => setTimeout(r, 1000 * attempt));
  }
  throw new Error(`failed: ${url}`);
}

async function buildId() {
  const html = await (await fetch(SITE + '/')).text();
  const m = html.match(/"buildId":"([^"]+)"/);
  if (!m) throw new Error('coh3stats buildId not found');
  return m[1];
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const outDir = path.join(root, 'data/source/coh3stats');
  fs.mkdirSync(outDir, { recursive: true });
  const id = await buildId();
  const cacheDir = path.join(os.tmpdir(), `coh3stats-cache-${id}`);
  fs.mkdirSync(cacheDir, { recursive: true });
  const counts = {};
  for (const [race, ours] of Object.entries(RACE_MAP)) {
    const list = (await get(`${SITE}/_next/data/${id}/en/explorer/races/${race}/units.json`, cacheDir))?.pageProps?.units || [];
    const ids = list.map(u => u.id).filter(u => !u.startsWith('hoff_'));
    const units = {};
    let missing = 0;
    for (const [i, unit] of ids.entries()) {
      const page = await get(`${SITE}/_next/data/${id}/en/explorer/races/${race}/units/${unit}.json`, cacheDir);
      const cd = page?.pageProps?.calculatedData;
      if (!cd) { missing++; continue; }
      units[unit] = trimUnit(cd);
      if ((i + 1) % 25 === 0) console.log(`  ${race}: ${i + 1}/${ids.length}`);
    }
    fs.writeFileSync(path.join(outDir, `${ours}.json`), JSON.stringify(units, null, 1) + '\n');
    counts[ours] = { coh3stats_race: race, listed: list.length, skipped_hoff: list.length - ids.length, saved: Object.keys(units).length, missing };
    console.log(`${race} → ${ours}: ${Object.keys(units).length} units saved, ${missing} without data`);
  }
  fs.writeFileSync(path.join(outDir, 'SOURCE.json'), JSON.stringify({ site: SITE, build_id: id, fetched: new Date().toISOString().slice(0, 10), race_map: RACE_MAP, counts }, null, 2) + '\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
