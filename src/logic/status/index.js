// logic/status public API: morale axis and suppression (morale.js), veterancy (xp.js).
export { MORALE, applySuppression, decaySuppression, validateRetreat, startRetreat, arriveIfNear, ammoState, setEngaged, engagedTurnEnd, resetMorale } from './morale.js';
export { unitValue, xpFor, gainXp, rankMods } from './xp.js';
