// Map definition (data/maps/<id>/map.json) → compiled map (data/generated/maps/<id>.json). Pure: definition and
// data/rules/terrain.json in, { map, errors } out. Layers: docs/map-design.md §3.
import { key, fromKey, inside, disk, neighbours, edgeKey } from '../hex/index.js';
import { lineEdges } from './geometry.js';

const rowsOf = (def, layer, cols, rows, errors, legend, name) => {
  const out = {};
  const lines = def[layer];
  if (!lines) return out;
  if (lines.length !== rows) errors.push(`${layer}: ${lines.length} rows, the map has ${rows}`);
  lines.forEach((line, r) => {
    if (line.length !== cols) errors.push(`${layer} row ${r}: ${line.length} hexes, the map has ${cols}`);
    [...line].forEach((ch, c) => {
      const v = legend ? legend[ch] : Number(ch);
      if (legend && !(ch in legend)) errors.push(`${layer} row ${r}: code "${ch}" is not in legend.${name}`);
      else if (!legend && !Number.isInteger(v)) errors.push(`${layer} row ${r}: "${ch}" is not a digit`);
      else if (legend ? v != null : v !== 0) out[`${c},${r}`] = v;   // legend: null = nothing; digits: 0 = flat
    });
  });
  return out;
};

/** → { map, errors } */
export function compileMap(def, rules) {
  const errors = [];
  const { id, cols, rows } = def.meta;
  const isIn = k => inside(fromKey(k), cols, rows);
  const hexes = {};
  const set = (k, field, v) => { (hexes[k] ??= {})[field] = v; };
  for (const [k, v] of Object.entries(rowsOf(def, 'ground', cols, rows, errors, def.legend?.ground, 'ground'))) if (v !== rules.default_ground) set(k, 'ground', v);
  for (const [k, v] of Object.entries(rowsOf(def, 'objects', cols, rows, errors, def.legend?.objects, 'objects'))) if (v) set(k, 'object', v);
  for (const [k, v] of Object.entries(rowsOf(def, 'elevation', cols, rows, errors))) set(k, 'elev', v);
  for (const k of Object.keys(rowsOf(def, 'bounds', cols, rows, errors, { '.': null, '#': true }, 'bounds'))) set(k, 'oob', true);   // scenery outside the play area
  for (const [k, v] of Object.entries(def.hexes || {})) {
    if (!isIn(k)) { errors.push(`hexes.${k}: outside the map`); continue; }
    for (const [field, x] of Object.entries(v)) set(k, field, x);
  }
  for (const [k, v] of Object.entries(hexes)) {
    if (v.ground && !rules.ground[v.ground]) errors.push(`hex ${k}: unknown ground "${v.ground}"`);
    if (v.object && !rules.objects[v.object]) errors.push(`hex ${k}: unknown object "${v.object}"`);
  }

  // lines → edges; edges placed directly (imports, tests) become one-segment lines
  const lines = {}, edges = {};
  const addEdge = (edge, line, seg) => (edges[edge] ??= []).push({ line, seg });
  for (const l of def.lines || []) {
    if (!rules.lines[l.kind]) { errors.push(`line ${l.id}: unknown kind "${l.kind}"`); continue; }
    if ((l.points || []).length < 2) { errors.push(`line ${l.id}: needs at least two points`); continue; }
    if (lines[l.id]) { errors.push(`line ${l.id}: id used twice`); continue; }
    lines[l.id] = { kind: l.kind, points: l.points, segments: l.points.length - 1, ...(l.team ? { team: l.team } : {}) };
    const placed = lineEdges(l.points, cols, rows);
    if (!placed.length) errors.push(`line ${l.id}: crosses no hex edge inside the map`);
    for (const { edge, seg } of placed) addEdge(edge, l.id, seg);
  }
  for (const [edge, kind] of Object.entries(def.edges || {})) {
    if (!rules.lines[kind]) { errors.push(`edge ${edge}: unknown kind "${kind}"`); continue; }
    const lid = `edge:${edge}`;
    lines[lid] = { kind, segments: 1 };
    addEdge(edge, lid, 0);
  }

  // structures
  const structures = {}, structureAt = {};
  for (const s of def.structures || []) {
    if (!rules.structures[s.kind]) { errors.push(`structure ${s.id}: unknown kind "${s.kind}"`); continue; }
    for (const k of s.hexes) {
      if (!isIn(k)) errors.push(`structure ${s.id}: hex ${k} outside the map`);
      else if (structureAt[k]) errors.push(`structure ${s.id}: hex ${k} already belongs to ${structureAt[k]}`);
      else if (hexes[k]?.ground && rules.ground[hexes[k].ground]?.cost.infantry == null) errors.push(`structure ${s.id}: hex ${k} is water`);
      else structureAt[k] = s.id;
    }
    structures[s.id] = { kind: s.kind, hexes: [...s.hexes], ...(s.team ? { team: s.team } : {}) };
  }

  const passable = k => isIn(k) && !structureAt[k] && !hexes[k]?.oob && rules.ground[hexes[k]?.ground ?? rules.default_ground]?.cost.infantry != null;
  const points = (def.points || []).map(p => {
    if (!passable(p.hex)) errors.push(`point ${p.id}: hex ${p.hex} is not open ground inside the map`);
    return { ...p, zone: disk(fromKey(p.hex), p.radius ?? 0).filter(h => inside(h, cols, rows)).map(key) };
  });
  const deploy = {};
  for (const [team, d] of Object.entries(def.deploy || {})) {
    const zone = Array.isArray(d.zone) ? d.zone : Array.from({ length: (d.zone.rows[1] - d.zone.rows[0] + 1) * cols },
      (_, i) => `${i % cols},${d.zone.rows[0] + Math.floor(i / cols)}`);
    if (!passable(d.rally)) errors.push(`deploy.${team}: rally ${d.rally} is not open ground`);
    deploy[team] = { zone: zone.filter(passable), rally: d.rally };
  }
  for (const p of def.placements || []) if (!passable(p.hex)) errors.push(`placement ${p.sbps} at ${p.hex}: not open ground`);

  const map = { id, cols, rows, ...(def.meta.theatre ? { theatre: def.meta.theatre } : {}),
    ...(def.meta.name ? { name: def.meta.name } : {}), ...(def.meta.briefing ? { briefing: def.meta.briefing } : {}),
    hexes, edges, lines, structures, structureAt, points, sectors: def.sectors || [], deploy, placements: def.placements || [],
    production: def.production || [], mines: def.mines || [] };
  return { map, errors };
}

/** Every edge key around a hex (for tools and tests). */
export const edgesAround = h => neighbours(h).map((n, d) => edgeKey(h, d));
