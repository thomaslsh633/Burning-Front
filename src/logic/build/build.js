// Construction. For now: rebuilding a destroyed HQ on its own footprint (2026-11-26), so a side never has more than one HQ.
// Engineer construction of new structures waits for the build-menu entities (stage G) and runtime-placed structures.
import { distance, fromKey } from '../hex/index.js';
import { unitAt } from '../state/index.js';
import { mapOf, isCollapsed } from '../terrain/index.js';
import { canAfford } from '../economy/index.js';

/** The rebuild rule of a structure's kind (data/rules/terrain.json structures.<kind>.rebuild), or null. */
export const rebuildOf = (state, data, id) => data.rules.terrain.structures[mapOf(state, data).structures[id]?.kind]?.rebuild ?? null;

/** Has rebuilding started (paid)? */
const started = (state, id) => (state.map.changes.structures[id]?.work ?? 0) > 0;

/**
 * Rebuild command: { unit, structure }. The side's own destroyed building of a rebuildable kind; a unit of a rebuild role
 * within 2 hexes of its footprint (SPEC §3 build range); the footprint clear of units; the cost in hand when work starts.
 */
export function validateRebuild(state, cmd, data) {
  const u = state.units[cmd.unit], s = mapOf(state, data).structures[cmd.structure], r = rebuildOf(state, data, cmd.structure);
  if (!s || !r || s.team !== u.team) return 'cannot_rebuild';
  if (!isCollapsed(state, cmd.structure)) return 'not_destroyed';
  if (!r.roles.includes(data.units.sbps[u.sbps].role)) return 'cannot_build';
  const hexes = s.hexes.map(fromKey);
  if (!hexes.some(h => distance(u.pos, h) <= 2)) return 'too_far';
  if (hexes.some(h => unitAt(state, h))) return 'hex_occupied';
  return started(state, cmd.structure) || canAfford(state, u.team, r.cost) ? null : 'cannot_afford';
}

/** The price to pay now: the rebuild cost when work starts, nothing after. */
export const rebuildCost = (state, data, id) => (started(state, id) ? {} : rebuildOf(state, data, id).cost);
