// Dumps the final values the legacy v214 game computes (after all its load-time patches) into data/legacy-snapshot/.
// The rewrite's data pipeline and rules are checked against these files.
//
// usage: node tools/oracle/snapshot.js
// Needs Playwright with Chromium (dev machines only; the offline PC uses the committed snapshot).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = path.join(root, 'data/legacy-snapshot');

// Global data tables of the legacy game (see legacy/CODEMAP.md, `node legacy/tools/where.js --list`).
export const TABLES = {
  units: ['UNIT_ROSTER', 'CATS', 'MACRO_CAT', 'ROLE_CODE', 'COH3_RAW', 'COH3_IND', 'COH3_COST', 'KIT_INFO', 'SQUAD_N',
    'AOE_MODEL_CAP', 'REINF_VEH', 'V199', 'V200', 'V214'],
  rules: ['TERRAIN_DEFS', 'GROUND_DEFS', 'OBJ_DEFS', 'EDGE_DEFS', 'COV_RANK', 'COV_LEGACY', 'COV_NEW', 'TECH', 'BLD', 'BLD_T',
    'BLD_LIST', 'FORT', 'UPG', 'UPG_BY_CAT', 'BASE_INCOME', 'HUB_G', 'HUB_F', 'BASE_FUEL', 'BASE_MUN', 'YIELD', 'ZONE_R',
    'ZONE_R_SMALL', 'SUPP_MAX', 'SUPP_RECOVER', 'K_PEN_UNIT', 'K_PEN_BLD', 'PEN_CUTOFF', 'COVER_SOFT_YELLOW',
    'COVER_SOFT_HARD', 'COVER_FLAME_HARD', 'BAND_N'],
  veterancy: ['VET_THRESHOLDS', 'VET_TABLE', 'VET_MULT', 'VET_ACC_ALL', 'VET_CLASS_OF', 'VET_RAW_BASE'],
  doctrines: ['DOC', 'PKG', 'BG'],
};
export const MAPS = ['skirmish', 'faymonville'];

// Runs in the page: serialise globals without functions or cycles.
const DUMP = names => {
  const seen = new WeakSet();
  const clean = (k, v) => {
    if (typeof v === 'function') return undefined;
    if (v instanceof Set) return [...v];
    if (v instanceof Map) return Object.fromEntries(v);
    if (v && typeof v === 'object') { if (seen.has(v)) return '[ref]'; seen.add(v); }
    return v;
  };
  const out = {};
  for (const n of names) {
    let v; try { v = (0, eval)(n); } catch (e) { out[n] = { error: 'not defined' }; continue; }
    out[n] = JSON.parse(JSON.stringify(v, clean) ?? 'null');
  }
  return out;
};

// Runs in the page: every roster unit as the game creates it (kits, squad, weapons applied).
const SPAWN = () => {
  const seen = new WeakSet();
  const clean = (k, v) => {
    if (typeof v === 'function') return undefined;
    if (v && typeof v === 'object') { if (seen.has(v)) return '[ref]'; seen.add(v); }
    return v;
  };
  const out = {};
  for (const tm of ['blue', 'red']) for (const k of Object.keys(UNIT_ROSTER[tm] || {})) {
    try {
      const u = createUnitFromKey(9000, tm, k, 0, 0);
      units = units.filter(x => x !== u);
      out[`${tm}/${k}`] = JSON.parse(JSON.stringify(u, clean));
    } catch (e) { out[`${tm}/${k}`] = { error: e.message }; }
  }
  return out;
};

// Runs in the page: load one map the way the setup screen does, then dump the battlefield.
const MAP = id => {
  SHELL.cfg.map = id; shApplyCfg(); shQuietReset();
  const pick = u => ({ id: u.id, team: u.team, key: u.key ?? u.unitKey, c: u.c ?? u.col, r: u.r ?? u.row, facing: u.facing });
  const seen = new WeakSet();
  const clean = (k, v) => {
    if (typeof v === 'function') return undefined;
    if (v instanceof Set) return [...v];
    if (v && typeof v === 'object') { if (seen.has(v)) return '[ref]'; seen.add(v); }
    return v;
  };
  const g = n => { try { return JSON.parse(JSON.stringify((0, eval)(n), clean) ?? 'null'); } catch (e) { return null; } };
  return { id, cols: g('COLS'), rows: g('ROWS'), terrain: g('terrainMap'), edges: g('EDGES'), points: g('capturePoints'),
    buildings: g('buildings'), bunkers: g('bunkers'), mines: g('mines'), units: (units || []).map(pick) };
};

async function main() {
  const require = createRequire(import.meta.url);
  const { chromium } = require('playwright');
  const html = path.join(root, 'legacy/dist/snapshot_query.html');
  execFileSync('node', [path.join(root, 'legacy/build.js'), html], { stdio: 'ignore' });
  const version = fs.readFileSync(path.join(root, 'legacy/VERSION'), 'utf8').trim();

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 420 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + html, { timeout: 180000 });

  fs.mkdirSync(path.join(outDir, 'maps'), { recursive: true });
  const write = (name, data) => fs.writeFileSync(path.join(outDir, name), JSON.stringify(data, null, 1) + '\n');
  const missing = [];
  for (const [group, names] of Object.entries(TABLES)) {
    const data = await page.evaluate(DUMP, names);
    for (const [n, v] of Object.entries(data)) if (v && v.error) missing.push(n);
    write(`${group}.json`, data);
  }
  write('spawned-units.json', await page.evaluate(SPAWN));
  for (const id of MAPS) write(`maps/${id}.json`, await page.evaluate(MAP, id));
  write('meta.json', { source: 'legacy', version, tables: TABLES, maps: MAPS, missing, page_errors: errors });
  await browser.close();
  fs.rmSync(html, { force: true });
  console.log(`snapshot of v${version} → data/legacy-snapshot/` + (missing.length ? ` (not defined: ${missing.join(', ')})` : '') +
    (errors.length ? ` (${errors.length} page errors, see meta.json)` : ''));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
