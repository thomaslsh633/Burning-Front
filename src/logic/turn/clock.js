// The match clock: whose turn it is and the turn number. Writes only state.match.side and state.match.turn.
import { ev } from '../events/index.js';

/** The side that moves after `side` (the first side when the match has not started). */
export const nextSide = (state, side = state.match.side) => {
  const order = state.match.order;
  return side == null ? order[0] : order[(order.indexOf(side) + 1) % order.length];
};

/** Close the current side's turn. */
export const closeTurn = state => ({ state, events: [ev('TurnEnded', { turn: state.match.turn, side: state.match.side })] });

/** Hand the turn to the next side; the turn number grows when the first side moves again. */
export function openTurn(state) {
  const side = nextSide(state), turn = side === state.match.order[0] ? state.match.turn + 1 : state.match.turn;
  return { state: { ...state, match: { ...state.match, side, turn } }, events: [ev('TurnStarted', { turn, side })] };
}
