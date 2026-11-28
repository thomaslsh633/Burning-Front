// The game data the rules read, from data/generated and data/balance / data/rules. One list of files for every loader:
// the browser fetches them (app), tools and tests read them from disk (tools/lib/game-data.js).
import { indexUnits } from './units.js';

export const BALANCE_FILES = ['scale', 'fire-rate', 'indirect', 'ammo', 'movement', 'vision', 'combat', 'status', 'crew', 'turn', 'economy', 'victory'];
export const RULE_FILES = ['vocab', 'roster', 'weapon-flags', 'status-flags', 'terrain', 'production', 'conversions'];

/** Paths (relative to the repo root) of every file the game reads, besides the compiled maps. */
export const gameFiles = () => ['data/generated/units.json', ...BALANCE_FILES.map(n => `data/balance/${n}.json`), ...RULE_FILES.map(n => `data/rules/${n}.json`)];

/** files: { path: parsed json } (gameFiles()), maps: { id: compiled map } → { units, balance, rules, maps } */
export function assembleGameData(files, maps) {
  const pick = (dir, names) => Object.fromEntries(names.map(n => [n.replace('-', '_'), files[`data/${dir}/${n}.json`]]));
  return { units: indexUnits(files['data/generated/units.json']).units, balance: pick('balance', BALANCE_FILES), rules: pick('rules', RULE_FILES), maps };
}
