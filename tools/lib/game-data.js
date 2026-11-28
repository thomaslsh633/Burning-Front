// The game data the rules read (src/logic), from disk: the same file list the browser loads (services/data gameFiles).
// Shared by tests (tests/helpers/game-data.js) and tools that run the rules engine (tools/greybox).
import fs from 'node:fs';
import path from 'node:path';
import { gameFiles, assembleGameData } from '../../src/services/data/index.js';

/** root: repo root → { units, balance, rules, maps } (not frozen). */
export function loadGameData(root) {
  const read = rel => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
  const mapDir = path.join(root, 'data/generated/maps');
  const maps = Object.fromEntries(fs.readdirSync(mapDir).filter(f => f.endsWith('.json')).map(f => [path.basename(f, '.json'), read(`data/generated/maps/${f}`)]));
  return assembleGameData(Object.fromEntries(gameFiles().map(f => [f, read(f)])), maps);
}
