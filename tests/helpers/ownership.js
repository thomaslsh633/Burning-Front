// The per-system ownership test: every logic system's apply test ends with
//   assertOwnsOnly('<system>', stateBefore, stateAfter)
// so a system that writes another system's part of a unit fails its own tests (docs/unit-state.md §7).
import assert from 'node:assert/strict';
import { foreignWrites } from '../../src/logic/state/index.js';

const byId = units => (Array.isArray(units) ? Object.fromEntries(units.map(u => [u.id, u])) : units ?? {});

/** before / after: GameState (or { units }); units as an array or { id: unit }. Units added or removed are not checked here. */
export function assertOwnsOnly(system, before, after) {
  const a = byId(before.units), b = byId(after.units);
  const bad = Object.keys(a).filter(id => id in b)
    .flatMap(id => foreignWrites(system, a[id], b[id]).map(w => `unit ${id}: ${w.path} (owner: ${w.owner ?? 'none yet'})`));
  assert.deepEqual(bad, [], `${system} wrote fields it does not own`);
}
