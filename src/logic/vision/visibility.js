// Visibility axis (docs/unit-state.md §5.6): REVEALED ↔ CONCEALED. Owns fsm.visibility and timers.revealedUntil.
import { defineMachine, send, runHook } from '../fsm/index.js';
import { putUnit } from '../state/index.js';
import { hexCover } from './cover.js';

/** May the unit conceal at its turn end? Did not fire or move, and either has CoH3 camouflage or is an emplaced crew in cover (SPEC §5). */
function mayConceal(unit, { state, data }) {
  if (unit.fsm.life !== 'ACTIVE' || unit.budget.fired || unit.budget.moved) return false;
  if (unit.members.some(m => data.units.ebps[m.ebps]?.stealth)) return true;
  return unit.kind === 'team_weapon' && unit.fsm.stance === 'EMPLACED' && ['light', 'heavy'].includes(hexCover(state, data, unit.pos));
}

export const VISIBILITY = defineMachine('visibility', 'REVEALED', {
  REVEALED: { onTurnEnd: (u, ctx) => (mayConceal(u, ctx) ? 'CONCEALED' : null) },
  CONCEALED: { on: { Fired: 'REVEALED', Moved: 'REVEALED', Detected: 'REVEALED' } },
});

/** Firing reveals the unit and keeps it seen until its owner's next turn (SPEC §10). */
export function revealOnFire(state, unitId, data) {
  const u = state.units[unitId];
  const r = send(VISIBILITY, { ...u, timers: { ...u.timers, revealedUntil: state.match.turn + data.balance.vision.revealed_after_firing_turns } }, 'Fired');
  return { state: putUnit(state, r.unit), events: r.events };
}

export function revealOnMove(state, unitId) {
  const r = send(VISIBILITY, state.units[unitId], 'Moved');
  return { state: putUnit(state, r.unit), events: r.events };
}

/** Own turn end for one unit. */
export function visibilityTurnEnd(state, unitId, data) {
  const r = runHook(VISIBILITY, state.units[unitId], 'onTurnEnd', { state, data });
  return { state: putUnit(state, r.unit), events: r.events };
}
