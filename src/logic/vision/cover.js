// Cover is derived per shot, never stored (docs/unit-state.md §5.2): terrain of the target's hex and the hex edge the
// shot crosses (directional edge cover, SPEC §10). Vehicles take no terrain cover (SPEC §4).
import { line, equals } from '../hex/index.js';
import { hexAt, edgeAt } from '../terrain/index.js';

const RANK = { negative: -1, none: 0, light: 1, heavy: 2 };
const asCover = c => (c === 'water' ? 'negative' : c ?? 'none');

export const receivesCover = (unit, data) => unit.members.some(m => (data.units.ebps[m.ebps]?.traits || []).includes('receives_cover'));

/** 'none' | 'light' | 'heavy' | 'garrison' | 'negative' for a shot from hex `from` at the target unit. */
export function coverAgainst(state, data, target, from) {
  if (target.fsm.location === 'GARRISONED') return 'garrison';
  if (!receivesCover(target, data)) return 'none';
  const { ground, feature } = hexAt(state, data, target.pos);
  let best = feature ? asCover(feature.cover) : asCover(ground.cover);
  if (from && !equals(from, target.pos)) {
    const path = line(from, target.pos), edge = edgeAt(state, data, path.at(-2), target.pos)?.def;
    if (edge && RANK[asCover(edge.cover)] > RANK[best]) best = asCover(edge.cover);
  }
  return best;
}

/** Cover of the unit's own hex, ignoring direction (concealment rule for emplaced crews). */
export const hexCover = (state, data, h) => { const t = hexAt(state, data, h); return asCover((t.feature ?? t.ground).cover); };

/** The hex the shot enters the target's hex from (its covering edge is between them). */
export const entryHex = (from, to) => line(from, to).at(-2);
