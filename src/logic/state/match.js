// GameState: the whole simulation as one plain object. Units are kept by id.
// { match: { mode, turn, side, order, over }, map, units: { id: unit }, teams: { team: { faction, resources, tickets } },
//   points: [...], rng: integer (services/rng state; the store restores the generator from it) }
import { createUnit } from './unit.js';

/**
 * setup: { mode, map: { cols, rows, terrain?, edges? }, order: [first team, second], teams: { team: { faction, resources, tickets? } },
 *          units: [{ team, sbps, pos, facing?, stance? }], points?: [...], rng: integer }
 */
export function createMatch(setup, data) {
  const units = {};
  setup.units.forEach((spec, i) => {
    const id = spec.id ?? `u${i + 1}`;
    units[id] = createUnit({ ...spec, id }, data);
  });
  return {
    match: { mode: setup.mode ?? 'annihilation', turn: 0, side: null, order: [...setup.order], over: null, nextId: setup.units.length + 1 },
    map: { cols: setup.map.cols, rows: setup.map.rows, terrain: { ...(setup.map.terrain || {}) }, edges: { ...(setup.map.edges || {}) } },
    units,
    teams: structuredClone(setup.teams),
    points: structuredClone(setup.points || []),
    rng: setup.rng >>> 0,
  };
}
