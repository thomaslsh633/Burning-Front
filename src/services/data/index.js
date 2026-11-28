// services/data — game data: layered merge of base, designer overrides and mods (merge.js); flat lookup for the rules (units.js);
// the game files and their assembly (game.js).
export { deepMerge, mergeKind, combineFiles, UNIT_KINDS } from './merge.js';
export { indexUnits } from './units.js';
export { BALANCE_FILES, RULE_FILES, gameFiles, assembleGameData } from './game.js';
