// Converts the v214 maps (data/legacy-snapshot/maps) into map definitions (data/maps/<id>/map.json, docs/map-design.md §3).
// Display text leaves the map: point and map names go to data/i18n (only keys that are missing; Hangul → ko, Latin → en).
// Building hexes become structures (connected groups, kind by size); HQs keep their team; production buildings are kept
// for the economy; legacy units become placements when their CoH3 squad is imported, else they are listed in the report.
//
// usage: node tools/maps/import-legacy.js   → data/maps/{skirmish,faymonville}/map.json, reports/maps/legacy-import.md
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { key, fromKey, neighbours, inside, distance } from '../../src/logic/hex/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = rel => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));

export const GROUND_CODES = { plains: '.', road: '=', cobblestone: '+', field: ',', shallow_water: '~', deep_water: 'W', snow: '*', ice: 'i', desert: 'd' };
export const OBJECT_CODES = { forest: 'f', forest_dense: 'F', forest_light: 'l', bush: 'b', crater: 'c', rubble: 'r', trench: 't', rock: 'R', dune: 'D', debris: 'x', tank_trap: 'T' };
const POINT_KIND = { vp: 'vp', oil: 'fuel', mun: 'munition', money: 'manpower' };
const NAMES = { skirmish: { ko: '교전 시험장', en: 'Skirmish Test Ground' }, faymonville: { ko: '페이몽빌', en: 'Faymonville' } };
const BUNKER = { blue: 'hmg_fighting_position_us', red: 'hmg_mg42_bunker_ger' };
const hangul = s => /[가-힣]/.test(s);

/** Legacy hex → { ground, object } */
function split(cell) {
  const t = cell.terrainType;
  if (GROUND_CODES[t]) return { ground: t, object: null };
  if (t === 'dune') return { ground: 'desert', object: 'dune' };
  if (OBJECT_CODES[t]) return { ground: 'plains', object: t };
  return { ground: 'plains', object: null, unknown: t };
}

/** Connected groups of hexes (by neighbourhood). */
function groups(keys) {
  const left = new Set(keys), out = [];
  while (left.size) {
    const start = left.values().next().value, group = [start];
    left.delete(start);
    for (let i = 0; i < group.length; i++) for (const n of neighbours(fromKey(group[i]))) if (left.delete(key(n))) group.push(key(n));
    out.push(group.sort());
  }
  return out;
}

/** legacy map → { def, text: { ko, en }, report } */
export function convert(legacy, sbpsOf, importedSquads) {
  const { id, cols, rows } = legacy, report = [], text = { ko: {}, en: {} };
  const at = (c, r) => legacy.terrain[`${c},${r}`] || { terrainType: 'plains', elevation: 0 };
  const grid = f => Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => f(at(c, r), c, r)).join(''));
  const buildingHexes = [];
  const def = {
    about: `Converted from the v214 map "${id}" by tools/maps/import-legacy.js; edit freely.`,
    meta: { id, cols, rows, name: `map.${id}.name`, source: `legacy v214 ${id}` },
    legend: { ground: Object.fromEntries(Object.entries(GROUND_CODES).map(([k, v]) => [v, k])), objects: { '.': null, ...Object.fromEntries(Object.entries(OBJECT_CODES).map(([k, v]) => [v, k])) } },
    ground: grid(cell => GROUND_CODES[split(cell).ground]),
    objects: grid((cell, c, r) => {
      const s = split(cell);
      if (cell.terrainType === 'building') buildingHexes.push(`${c},${r}`);
      if (s.unknown && s.unknown !== 'building') report.push(`hex ${c},${r}: terrain "${s.unknown}" has no counterpart, left as plains`);
      return s.object ? OBJECT_CODES[s.object] : '.';
    }),
    elevation: grid(cell => String(Math.min(9, cell.elevation || 0))),
    bounds: grid(cell => (cell.oob ? '#' : '.')),
    structures: [], production: [], points: [], deploy: {}, placements: [], mines: [],
  };
  text.ko[`map.${id}.name`] = NAMES[id]?.ko; text.en[`map.${id}.name`] = NAMES[id]?.en;
  if (!def.bounds.some(r => r.includes('#'))) delete def.bounds;
  if (def.elevation.every(r => /^0+$/.test(r))) delete def.elevation;

  const hqHexes = new Set(legacy.buildings.flatMap(b => (b.cells || [[b.c, b.r]]).map(([c, r]) => `${c},${r}`)));
  for (const b of legacy.buildings) {
    const hexes = (b.cells || [[b.c, b.r]]).map(([c, r]) => `${c},${r}`);
    if (b.type === 'hq') def.structures.push({ id: b.id, kind: 'hq', hexes, team: b.team });
    else def.production.push({ id: b.id, type: b.type, team: b.team, hexes });
  }
  groups(buildingHexes.filter(k => !hqHexes.has(k))).forEach((g, i) => {
    def.structures.push({ id: `building_${i + 1}`, kind: g.length === 1 ? 'house_small' : g.length === 2 ? 'house' : 'house_large', hexes: g });
  });
  for (const p of legacy.points) {
    const pid = p.id.replace(/[^a-z0-9_]/g, '_'), k = `map.${id}.point.${pid}`;
    def.points.push({ id: pid, kind: POINT_KIND[p.kind] ?? 'vp', hex: `${p.c},${p.r}`, radius: p.radius ?? 1, name: k });
    if (p.name) text[hangul(p.name) ? 'ko' : 'en'][k] = p.name;
  }
  // deployment: around each HQ; rally = the nearest open hex to the HQ
  const blocked = new Set([...hqHexes, ...buildingHexes]);
  const open = h => inside(h, cols, rows) && !blocked.has(key(h)) && !at(h.c, h.r).oob && !['deep_water', 'shallow_water'].includes(at(h.c, h.r).terrainType);
  for (const hq of def.structures.filter(s => s.kind === 'hq')) {
    const cells = hq.hexes.map(fromKey), near = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const h = { c, r }, d = Math.min(...cells.map(x => distance(x, h)));
      if (d >= 1 && d <= 3 && open(h)) near.push({ h, d });
    }
    near.sort((a, b) => a.d - b.d || a.h.r - b.h.r || a.h.c - b.h.c);
    def.deploy[hq.team] = { zone: near.map(x => key(x.h)), rally: key(near[0].h) };
  }
  for (const u of legacy.units) {
    const sbps = sbpsOf(u.team, u.key);
    if (sbps && importedSquads.has(sbps)) def.placements.push({ team: u.team, sbps, hex: `${u.c},${u.r}`, facing: u.team === 'blue' ? 0 : 3 });
    else report.push(`unit ${u.team}:${u.key} at ${u.c},${u.r}: ${sbps ? `squad ${sbps} not imported yet` : 'no CoH3 squad'}, left out`);
  }
  for (const b of legacy.bunkers || []) {
    if (importedSquads.has(BUNKER[b.team])) def.placements.push({ team: b.team, sbps: BUNKER[b.team], hex: `${b.c},${b.r}`, facing: b.team === 'blue' ? 0 : 3 });
    else report.push(`bunker ${b.team} at ${b.c},${b.r}: no imported bunker squad, left out`);
  }
  for (const m of legacy.mines || []) def.mines.push({ team: m.team, hex: `${m.c},${m.r}` });
  for (const k of ['production', 'placements', 'mines']) if (!def[k].length) delete def[k];
  return { def, text, report };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const roster = read('data/legacy-snapshot/units.json').COH3_RAW;
  const sbpsOf = (team, k) => roster[team]?.[k]?.sbp ?? null;
  const imported = new Set(Object.values(read('data/generated/units.json').factions).flatMap(f => Object.values(f.sbps).flatMap(Object.keys)));
  const L = ['# Legacy map import', '', 'Generated by `node tools/maps/import-legacy.js`. What could not be carried over from the v214 maps.', ''];
  for (const id of ['skirmish', 'faymonville']) {
    const { def, text, report } = convert(read(`data/legacy-snapshot/maps/${id}.json`), sbpsOf, imported);
    fs.mkdirSync(path.join(root, 'data/maps', id), { recursive: true });
    fs.writeFileSync(path.join(root, 'data/maps', id, 'map.json'), JSON.stringify(def, null, 1) + '\n');
    for (const [lang, strings] of Object.entries(text)) {
      const file = path.join(root, 'data/i18n', `${lang}.json`), cur = JSON.parse(fs.readFileSync(file, 'utf8'));
      for (const [k, v] of Object.entries(strings)) if (v && !(k in cur.strings)) cur.strings[k] = v;
      fs.writeFileSync(file, JSON.stringify(cur, null, 2) + '\n');
    }
    L.push(`## ${id}`, '', ...(report.length ? report.map(r => `- ${r}`) : ['Nothing left out.']), '');
    console.log(`${id}: ${def.structures.length} structures, ${def.points.length} points, ${(def.placements || []).length} placements, ${report.length} notes`);
  }
  fs.mkdirSync(path.join(root, 'reports/maps'), { recursive: true });
  fs.writeFileSync(path.join(root, 'reports/maps/legacy-import.md'), L.join('\n'));
}
