// logic/lifecycle public API: lifecycle axis, deaths and criticals (life.js); recrew, abandon, wreck clearing (crewing.js).
export { LIFE, checkDeaths, killGarrison, applyCriticals, lifeTurnEnd, remove } from './life.js';
export { validateRecrew, recrewMembers, recrew, freeNeighbour, validateAbandon, splitCrew, abandon, validateClearWreck, convertedMembers, convert } from './crewing.js';
