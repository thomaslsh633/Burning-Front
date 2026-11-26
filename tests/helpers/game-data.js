// Real unit data for logic tests: data/generated/units.json indexed the way the game reads it, plus balance and rules.
import fs from 'node:fs';
import path from 'node:path';
import { indexUnits } from '../../src/services/data/index.js';

const read = rel => JSON.parse(fs.readFileSync(new URL(`../../${rel}`, import.meta.url), 'utf8'));

let cached;
/** { units, balance: { scale, …}, rules: { … }, maps: { id: compiled map } } — frozen; logic must not change data. */
export function gameData() {
  if (cached) return cached;
  const { units } = indexUnits(read('data/generated/units.json'));
  const mapDir = new URL('../../data/generated/maps/', import.meta.url);
  const maps = Object.fromEntries(fs.readdirSync(mapDir).filter(f => f.endsWith('.json')).map(f => [path.basename(f, '.json'), read(`data/generated/maps/${f}`)]));
  const balance = Object.fromEntries(['scale', 'fire-rate', 'indirect', 'ammo', 'movement', 'vision', 'combat', 'status', 'crew', 'turn'].map(n => [n.replace('-', '_'), read(`data/balance/${n}.json`)]));
  const rules = Object.fromEntries(['vocab', 'roster', 'weapon-flags', 'status-flags', 'terrain'].map(n => [n.replace('-', '_'), read(`data/rules/${n}.json`)]));
  cached = deepFreeze({ units, balance, rules, maps });
  return cached;
}

function deepFreeze(o) {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const v of Object.values(o)) deepFreeze(v); }
  return o;
}
