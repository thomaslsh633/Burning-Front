// logic/terrain public API: geometry, map compiler, lookups over the change overlay, feature durability.
export { hexCentre, mapPoint, segmentsCross, lineEdges } from './geometry.js';
export { compileMap, edgesAround } from './compile.js';
export { mapOf, structureAt, hexAt, elevation, edgeAt, isCollapsed, hqDestroyed } from './access.js';
export { isSmoked, placeSmoke } from './smoke.js';
export { canDamage, featureHp, damageEdge, crushEdge, damageStructure, damageHex, placeWreck, clearWreck, rebuildStructure } from './durability.js';
