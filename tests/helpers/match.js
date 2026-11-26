// Small matches for logic tests: real unit data, a compiled test map, blue to move with fresh budgets.
import { createMatch } from '../../src/logic/state/index.js';
import { refreshUnit } from '../../src/logic/turn/index.js';
import { compileMap } from '../../src/logic/terrain/index.js';
import { gameData } from './game-data.js';

/**
 * units: [{ team, sbps, pos, facing?, stance?, id? }]
 * map: { cols, rows, terrain: { "c,r": { ground?, object?, elev? } }, edges: { edgeKey: kind }, lines, structures } (map definition layers)
 * → { state, data } with data.maps.test the compiled map. Blue units get their turn budget.
 */
export function testMatch(units, map = {}) {
  const def = { meta: { id: 'test', cols: map.cols ?? 12, rows: map.rows ?? 10 }, hexes: map.terrain, edges: map.edges, lines: map.lines, structures: map.structures };
  const base = gameData();
  const compiled = compileMap(def, base.rules.terrain);
  if (compiled.errors.length) throw new Error(compiled.errors.join('\n'));
  const data = { ...base, maps: { ...base.maps, test: compiled.map } };
  let state = createMatch({ map: { id: 'test' }, order: ['blue', 'red'], rng: 1,
    teams: { blue: { faction: 'american', resources: { manpower: 600, munition: 10, fuel: 20 }, rally: { c: 0, r: 0 } },
      red: { faction: 'german', resources: { manpower: 600, munition: 10, fuel: 20 }, rally: { c: 11, r: 9 } } },
    units }, data);
  state = { ...state, match: { ...state.match, turn: 1, side: 'blue' } };
  for (const u of Object.values(state.units)) if (u.team === 'blue') state = refreshUnit(state, u.id, data).state;
  return { state, data };
}

/** Set fields on one unit (test setup only). */
export const tweak = (state, id, patch) => ({ ...state, units: { ...state.units, [id]: { ...state.units[id], ...patch } } });
