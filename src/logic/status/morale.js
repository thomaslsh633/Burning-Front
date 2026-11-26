// Morale axis and suppression points (docs/unit-state.md §5.4, SPEC §4, §10). Owns fsm.morale, suppression, retreatTo, engaged.
// Thresholds and decay: data/balance/status.json.
import { defineMachine, send, transition } from '../fsm/index.js';
import { putUnit } from '../state/index.js';
import { ev } from '../events/index.js';
import { hexCover } from '../vision/index.js';

const level = (u, ctx) => {
  const s = ctx.data.balance.status.suppression, p = u.suppression;
  return p >= s.pinned_at ? 'PINNED' : p >= s.suppressed_at ? 'SUPPRESSED' : null;
};

export const MORALE = defineMachine('morale', 'NORMAL', {
  NORMAL: { on: { SuppressionChanged: level, Retreat: 'RETREATING' } },
  SUPPRESSED: {
    on: { Retreat: 'RETREATING',
      SuppressionChanged: (u, ctx) => level(u, ctx) === 'PINNED' ? 'PINNED' : u.suppression < ctx.data.balance.status.suppression.recover_below ? 'NORMAL' : null },
  },
  PINNED: {
    denies: { Move: 'pinned', Emplace: 'pinned', Recrew: 'pinned', Board: 'pinned', Hold: 'pinned', ClearWreck: 'pinned' },
    on: { Retreat: 'RETREATING',
      SuppressionChanged: (u, ctx) => (level(u, ctx) === 'PINNED' ? null : level(u, ctx) ?? 'NORMAL') },
  },
  RETREATING: {
    denies: Object.fromEntries(['Move', 'Turn', 'Attack', 'AttackFeature', 'Emplace', 'Pack', 'Hold', 'UseSkill', 'Build', 'Repair', 'Board', 'Recrew', 'Abandon', 'ClearWreck', 'Retreat', 'Counter'].map(c => [c, 'retreating'])),
    on: { Arrived: 'NORMAL' },
  },
});

/** Add suppression points (combat's result); the morale state follows the thresholds. */
export function applySuppression(state, unitId, points, data) {
  const u = state.units[unitId];
  if (!u || !points || u.fsm.life !== 'ACTIVE') return { state, events: [] };
  const s = data.balance.status.suppression, suppression = Math.min(s.max, u.suppression + points);
  const r = send(MORALE, { ...u, suppression }, 'SuppressionChanged', { data });
  return { state: putUnit(state, r.unit), events: [ev('Suppressed', { unit: unitId, amount: suppression - u.suppression, total: suppression }), ...r.events] };
}

/** Own turn start: suppression decays (faster in cover); the state follows. Retreating units are moved by the turn system. */
export function decaySuppression(state, unitId, data) {
  const u = state.units[unitId];
  if (u.fsm.life !== 'ACTIVE' || u.fsm.morale === 'RETREATING' || u.suppression === 0) return { state, events: [] };
  const s = data.balance.status.suppression;
  const inCover = ['light', 'heavy'].includes(hexCover(state, data, u.pos)) || u.fsm.location === 'GARRISONED';
  const suppression = Math.max(0, u.suppression - (inCover ? s.decay_in_cover : s.decay_per_turn));
  const r = send(MORALE, { ...u, suppression }, 'SuppressionChanged', { data });
  return { state: putUnit(state, r.unit), events: r.events };
}

/** Retreat order: not after attacking this turn (SPEC §4); needs a rally point. → reason or null */
export function validateRetreat(state, cmd) {
  const u = state.units[cmd.unit];
  if (u.budget.fired) return 'already_fired';
  if (!state.teams[u.team].rally) return 'no_rally_point';
  return null;
}

export function startRetreat(state, unitId) {
  const u = state.units[unitId];
  const r = send(MORALE, { ...u, retreatTo: { ...state.teams[u.team].rally }, engaged: false }, 'Retreat');
  return { state: putUnit(state, r.unit), events: r.events };
}

/** Within reach of the rally point: retreat ends, suppression cleared. */
export function arriveIfNear(state, unitId, data, distanceToRally) {
  const u = state.units[unitId];
  if (u.fsm.morale !== 'RETREATING' || distanceToRally > data.balance.status.retreat.arrive_within_hex) return { state, events: [] };
  const r = transition(MORALE, { ...u, suppression: 0, retreatTo: null }, 'NORMAL');
  return { state: putUnit(state, r.unit), events: r.events };
}

/** Engaged (SPEC §4): set by attacking (own attack, counter fire, overwatch), never by taking damage. */
export function setEngaged(state, unitId) {
  const u = state.units[unitId];
  if (!u || u.engaged) return { state, events: [] };
  return { state: putUnit(state, { ...u, engaged: true }), events: [] };
}

/** Own turn end: a unit that did not attack in this turn is no longer engaged. */
export function engagedTurnEnd(state, unitId) {
  const u = state.units[unitId];
  if (!u.engaged || u.budget.fired) return { state, events: [] };
  return { state: putUnit(state, { ...u, engaged: false }), events: [] };
}

/** A captured or recrewed unit starts over: no veterancy, no suppression, not engaged (docs/unit-state.md §6). */
export function resetMorale(state, unitId) {
  const u = state.units[unitId];
  const t = transition(MORALE, { ...u, xp: 0, rank: 0, suppression: 0, retreatTo: null, engaged: false }, 'NORMAL');
  return { state: putUnit(state, t.unit), events: t.events };
}

/** 'ok' | 'low' | 'out' (status flag, derived). */
export function ammoState(unit, data) {
  const cap = data.units.sbps[unit.sbps]?.supply?.ammo ?? 0;
  if (unit.ammo <= 0) return 'out';
  return cap && unit.ammo <= cap * data.balance.status.low_ammo_share ? 'low' : 'ok';
}
