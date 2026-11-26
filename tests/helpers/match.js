// Small matches for logic tests: real unit data, a plain map, blue to move with fresh budgets.
import { createMatch } from '../../src/logic/state/index.js';
import { refreshUnit } from '../../src/logic/turn/index.js';
import { gameData } from './game-data.js';

/** units: [{ team, sbps, pos, facing?, stance?, id? }]; map: { cols, rows, terrain, edges }. Blue units get their turn budget. */
export function testMatch(units, map = {}) {
  const data = gameData();
  let state = createMatch({ map: { cols: 12, rows: 10, ...map }, order: ['blue', 'red'], rng: 1,
    teams: { blue: { faction: 'american', resources: { manpower: 600, munition: 10, fuel: 20 } }, red: { faction: 'german', resources: { manpower: 600, munition: 10, fuel: 20 } } },
    units }, data);
  state = { ...state, match: { ...state.match, turn: 1, side: 'blue' } };
  for (const u of Object.values(state.units)) if (u.team === 'blue') state = refreshUnit(state, u.id, data).state;
  return { state, data };
}

/** Set fields on one unit (test setup only). */
export const tweak = (state, id, patch) => ({ ...state, units: { ...state.units, [id]: { ...state.units[id], ...patch } } });
