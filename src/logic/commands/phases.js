// Turn phases (SPEC §2, docs/unit-state.md §3): the order in which the owners run at a side's turn start and end.
// Only sequencing lives here (logic/turn cannot import every system without import cycles); each rule is its owner's.
import * as movement from '../movement/index.js';
import * as turn from '../turn/index.js';
import * as vision from '../vision/index.js';
import * as status from '../status/index.js';
import * as crew from '../crew/index.js';
import * as lifecycle from '../lifecycle/index.js';
import * as capture from '../capture/index.js';
import * as economy from '../economy/index.js';
import * as victory from '../victory/index.js';
import { distance } from '../hex/index.js';
import { unitsOf, enemyOf } from '../state/index.js';
import { chain, ifUnit, overwatchStep } from './steps.js';

/**
 * A retreating unit walks on toward its rally point (×1.6 move, SPEC §4) and its turn is spent; enemy overwatch may fire.
 * Shared by the Retreat command and the turn start.
 */
export const retreatWalk = (s, d, rng, id) => chain(s, [
  x => movement.moveToward(x, d, id, x.units[id].retreatTo, movement.movePoints(x.units[id], d), overwatchStep(d, rng)),
  ifUnit(id, x => vision.revealOnMove(x, id)),
  ifUnit(id, x => status.arriveIfNear(x, id, d, distance(x.units[id].pos, x.units[id].retreatTo ?? x.units[id].pos))),
  ifUnit(id, x => turn.exhaust(x, id)),
]);

/** Per-unit hooks at the own turn start, in axis order (docs/unit-state.md §3). null: the axis has nothing to do yet. */
export const UNIT_TURN_START = Object.freeze([
  { axis: 'life', run: null },
  { axis: 'location', run: null },
  { axis: 'stance', run: (s, d, rng, id) => crew.crewTurnStart(s, id) },
  { axis: 'morale', run: (s, d, rng, id) => status.decaySuppression(s, id, d) },
  { axis: 'action', run: (s, d, rng, id) => (s.units[id].fsm.morale === 'RETREATING' ? retreatWalk(s, d, rng, id) : turn.refreshUnit(s, id, d)) },
  { axis: 'visibility', run: null },
]);

/** Per-unit hooks at the own turn end: the reverse axis order. The turret swings back last (it reads engaged). */
export const UNIT_TURN_END = Object.freeze([
  { axis: 'visibility', run: (s, d, rng, id) => vision.visibilityTurnEnd(s, id, d) },
  { axis: 'action', run: (s, d, rng, id) => turn.actionTurnEnd(s, id) },
  { axis: 'morale', run: (s, d, rng, id) => status.engagedTurnEnd(s, id) },
  { axis: 'stance', run: (s, d, rng, id) => crew.crewTurnEnd(s, id, d) },
  { axis: 'location', run: null },
  { axis: 'life', run: (s, d, rng, id) => lifecycle.lifeTurnEnd(s, id) },
  { axis: 'turret', run: (s, d, rng, id) => movement.turretReturn(s, id, s.units[id].engaged) },
]);

/** Run hooks for every unit of a team (unit by unit, hooks in order); a unit removed on the way is skipped. */
function eachUnit(state, d, rng, team, hooks) {
  const ids = unitsOf(state, team).map(u => u.id);
  return chain(state, ids.flatMap(id => hooks.filter(h => h.run).map(h => ifUnit(id, x => h.run(x, d, rng, id)))));
}

/**
 * Side turn start in SPEC §2 order: strikes → status → capture tick → victory settlement → income.
 * status: the side's units run their turn-start hooks; the other side's units get their counter fire for this turn.
 * Phases with run null are filled by later systems (skills: pending strikes).
 */
export const SIDE_TURN_START = Object.freeze([
  { phase: 'strikes', run: null },
  { phase: 'status', run: (s, d, rng) => chain(s, [
    x => eachUnit(x, d, rng, x.match.side, UNIT_TURN_START),
    x => eachUnit(x, d, rng, enemyOf(x, x.match.side), [{ run: (y, dd, r, id) => turn.armCounter(y, id, dd) }]),
  ]) },
  { phase: 'capture', run: (s, d) => capture.captureTick(s, d, s.match.side) },
  { phase: 'victory', run: (s, d) => victory.settle(s, d, s.match.side) },
  { phase: 'income', run: (s, d) => economy.collectIncome(s, d, s.match.side) },
]);

/** The next side's turn begins: the clock moves, then the start phases. */
export function startTurn(state, d, rng) {
  return chain(state, [turn.openTurn, ...SIDE_TURN_START.filter(p => p.run).map(p => x => p.run(x, d, rng))]);
}

/** The side to move ends its turn: its units' turn-end hooks, then the clock closes the turn. */
export function endTurn(state, d, rng) {
  return chain(state, [x => eachUnit(x, d, rng, x.match.side, UNIT_TURN_END), turn.closeTurn]);
}
