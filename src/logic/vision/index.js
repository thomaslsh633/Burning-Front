// logic/vision public API: sight (sight.js), cover per shot (cover.js), visibility axis (visibility.js).
export { sightLine, eyeHeight, sightRange, hasLineOfSight, visibleHexes, detectionRange, canSee } from './sight.js';
export { coverAgainst, receivesCover, hexCover, entryHex } from './cover.js';
export { VISIBILITY, revealOnFire, revealOnMove, visibilityTurnEnd } from './visibility.js';
