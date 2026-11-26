// services/data — game data: layered merge of base, designer overrides and mods (merge.js); flat lookup for the rules (units.js).
export { deepMerge, mergeKind, combineFiles, UNIT_KINDS } from './merge.js';
export { indexUnits } from './units.js';
