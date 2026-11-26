// Map lookups: the compiled map (data.maps[id], immutable) with the match's changes on top (GameState.map.changes).
// changes: { hexes: { "c,r": { object?: id | null, hp?, wreck?: { kind, hp, work? } } },
//            segments: { "line:seg": { kind: id | null, hp } }, structures: { id: { hp, collapsed? } } }
import { key, neighbours, equals, edgeKey } from '../hex/index.js';

export const mapOf = (state, data) => data.maps[state.map.id];

const RANK = { negative: -1, none: 0, light: 1, heavy: 2, garrison: 3 };

/** A building standing on the hex (not collapsed): { id, kind, def, hp, team } or null. */
export function structureAt(state, data, h) {
  const id = mapOf(state, data).structureAt[key(h)];
  if (!id) return null;
  const s = mapOf(state, data).structures[id], ch = state.map.changes.structures[id] || {};
  if (ch.collapsed) return null;
  const def = data.rules.terrain.structures[s.kind];
  return { id, kind: s.kind, def, hp: ch.hp ?? def.hp, team: s.team ?? null };
}

/**
 * What a hex is made of now: { ground, elev, oob, feature, featureKind ('structure' | 'wreck' | 'object' | null), featureId }.
 * oob: scenery outside the play area (seen, never entered).
 * `feature` carries cost / cover / sight / height: a standing building first, then a wreck, then the hex object.
 */
export function hexAt(state, data, h) {
  const rules = data.rules.terrain, k = key(h), base = mapOf(state, data).hexes[k] || {}, ch = state.map.changes.hexes[k] || {};
  const ground = rules.ground[base.ground ?? rules.default_ground];
  const out = { ground, elev: base.elev ?? 0, oob: !!base.oob, feature: null, featureKind: null, featureId: null };
  const s = structureAt(state, data, h);
  if (s) return { ...out, feature: { ...rules.structure_terrain, height: s.def.height }, featureKind: 'structure', featureId: s.id };
  if (ch.wreck) return { ...out, feature: rules.wrecks[ch.wreck.kind], featureKind: 'wreck', featureId: ch.wreck.kind };
  const obj = 'object' in ch ? ch.object : base.object;
  return obj ? { ...out, feature: rules.objects[obj], featureKind: 'object', featureId: obj } : out;
}

export const elevation = (state, data, h) => mapOf(state, data).hexes[key(h)]?.elev ?? 0;

/** The standing line on the edge between two neighbouring hexes (strongest cover first): { line, seg, kind, def } or null. */
export function edgeAt(state, data, a, b) {
  const d = neighbours(a).findIndex(n => equals(n, b));
  if (d < 0) return null;
  const entries = mapOf(state, data).edges[edgeKey(a, d)];
  if (!entries) return null;
  let best = null;
  for (const { line, seg } of entries) {
    const ch = state.map.changes.segments[`${line}:${seg}`];
    const kind = ch ? ch.kind : mapOf(state, data).lines[line].kind;
    if (!kind) continue;
    const def = data.rules.terrain.lines[kind];
    if (!best || RANK[def.cover] > RANK[best.def.cover]) best = { line, seg, kind, def };
  }
  return best;
}
