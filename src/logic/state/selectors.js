// Pure read helpers over GameState, and the one way to put a changed unit back.

export const unitById = (state, id) => state.units[id];
export const allUnits = state => Object.values(state.units);
export const unitsOf = (state, team) => allUnits(state).filter(u => u.team === team);
export const isOnMap = u => u.fsm.location === 'ON_MAP';
export const isActive = u => u.fsm.life === 'ACTIVE';

/** The unit standing on a hex (on the map, any lifecycle: a wreck still occupies it), or undefined. */
export const unitAt = (state, h) => allUnits(state).find(u => isOnMap(u) && u.pos.c === h.c && u.pos.r === h.r);

/** The opposing team. */
export const enemyOf = (state, team) => state.match.order.find(t => t !== team);

/** New state with this unit replaced (or added). */
export const putUnit = (state, unit) => ({ ...state, units: { ...state.units, [unit.id]: unit } });
