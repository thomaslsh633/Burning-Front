// What a hex and a hex edge are made of, read from the map and data/rules/terrain.json.
import { key, edgeKey, neighbours, inside, equals } from '../hex/index.js';

/** { ground, object } of a hex (ground defaults to the rules' default_ground). */
export function hexTerrain(state, data, h) {
  const t = state.map.terrain[key(h)] || {};
  const rules = data.rules.terrain;
  return { ground: rules.ground[t.ground ?? rules.default_ground], object: t.object ? rules.objects[t.object] : null };
}

/** The edge object between two neighbouring hexes, or null. */
export function edgeBetween(state, data, a, b) {
  const d = neighbours(a).findIndex(n => equals(n, b));
  if (d < 0) return null;
  const id = state.map.edges[edgeKey(a, d)];
  return id ? data.rules.terrain.edges[id] : null;
}

/** Move points to step from a into its neighbour b for a move class; null when impassable or off the map. */
export function stepCost(state, data, a, b, cls) {
  if (!inside(b, state.map.cols, state.map.rows)) return null;
  const { ground, object } = hexTerrain(state, data, b);
  const enter = (object ?? ground).cost[cls];
  if (enter == null || (object && ground.cost[cls] == null)) return null;
  const edge = edgeBetween(state, data, a, b);
  const cross = edge ? edge.cross[cls] : 0;
  return cross == null ? null : enter + cross;
}
