// GameState: the whole simulation as one plain object. Units are kept by id.
// { match: { mode, turn, side, order, over }, map: { id, cols, rows, changes (logic/terrain) }, units: { id: unit }, teams: { team: { faction, resources, tickets } },
//   points: [{ id, owner, progress, by }] (logic/capture), victory (logic/victory), rng: integer (services/rng state; the store restores the generator from it) }
import { createUnit } from './unit.js';
import { fromKey } from '../hex/index.js';

/**
 * setup: { mode, map: { id } (compiled map in data.maps), order: [first team, second], teams: { team: { faction, resources, tickets? } },
 *          units?: [{ team, sbps, pos, facing?, stance? }], roundCap?, rng: integer }; every map point starts neutral;
 *          tickets default to data/balance/victory.json; teams[t].unlocks: research / doctrine unlocks held (ids, or 'all' for testing); teams[t].research: under way [{ id, building, left }]
 * Without `units` the map's placements are used; a team without `rally` takes the map's deploy rally point.
 */
export function createMatch(setup, data) {
  const map = data.maps[setup.map.id];
  const specs = setup.units ?? (map.placements || []).map(p => ({ team: p.team, sbps: p.sbps, pos: fromKey(p.hex), facing: p.facing, stance: p.stance }));
  const units = {};
  specs.forEach((spec, i) => {
    const id = spec.id ?? `u${i + 1}`;
    units[id] = createUnit({ ...spec, id }, data);
  });
  return {
    match: { mode: setup.mode ?? 'annihilation', turn: 0, side: null, order: [...setup.order], over: null, nextId: specs.length + 1, roundCap: setup.roundCap ?? null },
    map: { id: setup.map.id, cols: map.cols, rows: map.rows, changes: { hexes: {}, segments: {}, structures: {} } },
    units,
    teams: Object.fromEntries(Object.entries(setup.teams).map(([t, v]) => [t, { tickets: data.balance?.victory?.tickets ?? null, unlocks: [], research: [], ...structuredClone(v), rally: v.rally ?? (map.deploy?.[t] ? fromKey(map.deploy[t].rally) : null) }])),
    points: (map.points || []).map(p => ({ id: p.id, owner: null, progress: 0, by: null })),
    victory: { leader: null, streak: 0, prevLead: 0 },
    rng: setup.rng >>> 0,
  };
}

/** Add a new unit with the next free id (match.nextId). spec as createUnit, without id. → { state, id } */
export function spawnUnit(state, spec, data) {
  const id = `u${state.match.nextId}`;
  const unit = createUnit({ ...spec, id }, data);
  return { state: { ...state, match: { ...state.match, nextId: state.match.nextId + 1 }, units: { ...state.units, [id]: unit } }, id };
}
