// logic/state public API: GameState shape (match.js), unit runtime state (unit.js), selectors, field ownership.
export { UNIT_FIELD_OWNERS, ownerOf, changedPaths, foreignWrites } from './ownership.js';
export { AXES, createUnit, checkUnit } from './unit.js';
export { createMatch, spawnUnit } from './match.js';
export { unitById, allUnits, unitsOf, isOnMap, isActive, unitAt, enemyOf, putUnit } from './selectors.js';
