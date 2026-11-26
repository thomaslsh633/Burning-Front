// logic/movement public API: move points, reachable hexes, paths, turning (movement.js); terrain lookups (terrain.js).
export { moveClass, movePoints, reachable, pathTo, turnCost, validateMove, applyMove, validateTurn, applyTurn, moveToward } from './movement.js';
export { stepCost } from './terrain.js';
