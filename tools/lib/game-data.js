// The game data the rules read (src/logic): data/generated/units.json indexed by id, the compiled maps, balance and rules.
// Shared by tests (tests/helpers/game-data.js) and tools that run the rules engine (tools/greybox).
import fs from 'node:fs';
import path from 'node:path';
import { indexUnits } from '../../src/services/data/index.js';

const BALANCE = ['scale', 'fire-rate', 'indirect', 'ammo', 'movement', 'vision', 'combat', 'status', 'crew', 'turn', 'economy', 'victory'];
const RULES = ['vocab', 'roster', 'weapon-flags', 'status-flags', 'terrain', 'production', 'conversions'];

/** root: repo root → { units, balance, rules, maps } (not frozen). */
export function loadGameData(root) {
  const read = rel => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
  const { units } = indexUnits(read('data/generated/units.json'));
  const mapDir = path.join(root, 'data/generated/maps');
  const maps = Object.fromEntries(fs.readdirSync(mapDir).filter(f => f.endsWith('.json')).map(f => [path.basename(f, '.json'), read(`data/generated/maps/${f}`)]));
  const pick = (dir, names) => Object.fromEntries(names.map(n => [n.replace('-', '_'), read(`data/${dir}/${n}.json`)]));
  return { units, balance: pick('balance', BALANCE), rules: pick('rules', RULES), maps };
}
