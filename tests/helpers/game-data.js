// Real game data for logic tests (tools/lib/game-data.js), frozen: logic must not change data.
import { fileURLToPath } from 'node:url';
import { loadGameData } from '../../tools/lib/game-data.js';

let cached;
/** { units, balance: { scale, …}, rules: { … }, maps: { id: compiled map } } — frozen; logic must not change data. */
export function gameData() {
  return (cached ??= deepFreeze(loadGameData(fileURLToPath(new URL('../../', import.meta.url)))));
}

function deepFreeze(o) {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const v of Object.values(o)) deepFreeze(v); }
  return o;
}
