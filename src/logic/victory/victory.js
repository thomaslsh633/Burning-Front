// Win conditions, one per match mode (SPEC §2; tuning data/balance/victory.json). Owns teams[team].tickets,
// GameState.victory ({ leader, streak, prevLead }: the Victory Meter's momentum) and match.over ({ winner, reason }).
import { ev } from '../events/index.js';
import { enemyOf, unitsOf } from '../state/index.js';
import { mapOf } from '../terrain/index.js';
import { unitValue } from '../status/index.js';
import { producers, offers, priceOf, canAfford, population } from '../economy/index.js';

const vpCount = (state, data, team) => {
  const kind = Object.fromEntries(mapOf(state, data).points.map(p => [p.id, p.kind]));
  return state.points.filter(p => p.owner === team && kind[p.id] === 'vp').length;
};
const control = (state, data, team) => {
  const kind = Object.fromEntries(mapOf(state, data).points.map(p => [p.id, p.kind])), w = data.balance.victory.parity.weights;
  return state.points.filter(p => p.owner === team).reduce((s, p) => s + (w[kind[p.id]] ?? 0), 0);
};

const end = (state, winner, reason) => ({ state: { ...state, match: { ...state.match, over: { winner, reason } } }, events: [ev('MatchEnded', { winner, reason })] });

/** Capture mode settlement: the side behind on VPs bleeds tickets; at 0 tickets the match ends. */
function settleCapture(state, data) {
  const v = data.balance.victory, [a, b] = state.match.order;
  const va = vpCount(state, data, a), vb = vpCount(state, data, b), lead = Math.abs(va - vb);
  const leader = va > vb ? a : vb > va ? b : null, prev = state.victory;
  let victory = { leader: null, streak: 0, prevLead: 0 }, loser = null, bleed = 0;
  if (leader) {
    const streak = (prev.leader === leader ? (lead < prev.prevLead ? Math.floor(prev.streak / 2) : prev.streak) : 0) + 1;
    victory = { leader, streak, prevLead: lead };
    loser = enemyOf(state, leader);
    bleed = v.bleed_by_vp_lead[Math.min(lead, v.bleed_by_vp_lead.length - 1)] + Math.floor((streak - 1) / v.momentum_every);
  } else {
    const ca = control(state, data, a), cb = control(state, data, b);
    if (Math.abs(ca - cb) >= v.parity.control_gap) { loser = ca > cb ? b : a; bleed = v.parity.bleed; }
  }
  let s = { ...state, victory };
  const events = [];
  if (loser && bleed) {
    const tickets = Math.max(0, s.teams[loser].tickets - bleed);
    s = { ...s, teams: { ...s.teams, [loser]: { ...s.teams[loser], tickets } } };
    events.push(ev('TicketsLost', { team: loser, amount: bleed, left: tickets }));
  }
  const ta = s.teams[a].tickets, tb = s.teams[b].tickets;
  if (ta > 0 && tb > 0) return { state: s, events };
  const winner = ta <= 0 && tb <= 0 ? (vpCount(s, data, b) > va ? b : a) : ta <= 0 ? b : a;
  const e = end(s, winner, 'tickets');
  return { state: e.state, events: [...events, ...e.events] };
}

/** Can a side field a new unit: something its HQ or production buildings offer that it can afford within the population cap. */
export function canDeploy(state, data, team) {
  const room = data.balance.economy.population_cap - population(state, data, team);
  return producers(state, data).filter(b => b.team === team)
    .some(b => offers(state, data, b.id).some(id => canAfford(state, team, priceOf(id, data)) && (data.units.sbps[id].pop ?? 0) <= room));
}

/**
 * Annihilation settlement: a side with no active units that cannot deploy loses; both at once: the side whose turn starts
 * (it did not act) wins. With a round cap (match.roundCap), once the turn passes it the higher surviving value wins.
 */
function settleAnnihilation(state, data, side) {
  const out = t => !unitsOf(state, t).some(u => u.fsm.life === 'ACTIVE') && !canDeploy(state, data, t);
  const [a, b] = state.match.order;
  if (out(a) || out(b)) return end(state, out(a) && out(b) ? side : out(a) ? b : a, 'annihilation');
  if (state.match.roundCap && state.match.turn > state.match.roundCap) {
    const value = t => unitsOf(state, t).filter(u => u.fsm.life === 'ACTIVE').reduce((s, u) => s + unitValue(u, data), 0);
    const va = value(a), vb = value(b);
    return end(state, va === vb ? null : va > vb ? a : b, 'round_cap');
  }
  return { state, events: [] };
}

/** The victory phase of a side's turn start (SPEC §2 order: after the capture tick, before income). */
export function settle(state, data, side) {
  if (state.match.over) return { state, events: [] };
  return state.match.mode === 'capture' ? settleCapture(state, data) : settleAnnihilation(state, data, side);
}
