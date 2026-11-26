// Move cost of one step, from what logic/terrain says the hex and the edge are made of.
import { inside } from '../hex/index.js';
import { hexAt, edgeAt } from '../terrain/index.js';

/** Move points to step from a into its neighbour b for a move class; null when impassable or off the map. */
export function stepCost(state, data, a, b, cls) {
  if (!inside(b, state.map.cols, state.map.rows)) return null;
  const { ground, feature, oob } = hexAt(state, data, b);
  if (oob || ground.cost[cls] == null) return null;
  const enter = (feature ?? ground).cost[cls];
  if (enter == null) return null;
  const edge = edgeAt(state, data, a, b);
  const cross = edge ? edge.def.cross[cls] : 0;
  return cross == null ? null : enter + cross;
}
