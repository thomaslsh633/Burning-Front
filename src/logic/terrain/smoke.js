// Smoke on the map (2026-11-28): state.map.changes.smoke { "c,r": turn it clears }. Laid by abilities (logic/skills);
// vision blocks sight through, into and out of a smoked hex (SPEC §10). Smoke on a hex already smoked lasts the longer.
import { key } from '../hex/index.js';
import { ev } from '../events/index.js';

/** Is the hex under smoke now? Smoke laid in turn T for N turns clears when turn T + N begins. */
export const isSmoked = (state, h) => (state.map.changes.smoke?.[key(h)] ?? 0) > state.match.turn;

/** Smoke these hexes for `turns` turns (data/balance/vision.json smoke_turns). */
export function placeSmoke(state, hexes, turns) {
  const until = state.match.turn + turns, smoke = { ...(state.map.changes.smoke ?? {}) };
  for (const h of hexes) smoke[key(h)] = Math.max(smoke[key(h)] ?? 0, until);
  return { state: { ...state, map: { ...state.map, changes: { ...state.map.changes, smoke } } }, events: [ev('SmokeLaid', { hexes: hexes.map(h => ({ ...h })), until })] };
}
