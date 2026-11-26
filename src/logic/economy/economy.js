// Resources, income, upkeep and unit production (SPEC §3, §10). Owns GameState.teams[team].resources.
// Tuning: data/balance/economy.json; what each production building offers: data/rules/production.json.
import { ev } from '../events/index.js';
import { distance, fromKey } from '../hex/index.js';
import { unitAt } from '../state/index.js';
import { mapOf } from '../terrain/index.js';
import { stepCost, moveClass } from '../movement/index.js';
import { suppliedPoints } from '../capture/index.js';

const RESOURCES = ['manpower', 'munition', 'fuel'];
/** A squad's price: { manpower?, munition?, fuel? }. */
export const priceOf = (sbps, data) => data.units.sbps[sbps].price?.cost ?? {};

/** Gross income per resource: base plus the yields of owned points that are supplied (VPs pay nothing). */
export function grossIncome(state, data, team) {
  const inc = data.balance.economy.income, supplied = suppliedPoints(state, data, team);
  const out = Object.fromEntries(RESOURCES.map(r => [r, inc.base[r] ?? 0]));
  for (const p of mapOf(state, data).points) {
    if (!supplied.has(p.id)) continue;
    for (const [r, v] of Object.entries(inc.points[p.kind] ?? {})) out[r] += v;
  }
  return out;
}

/** Upkeep of a team's active units: share of each manpower price up to a cap per unit, the excess in fuel. */
export function upkeep(state, data, team) {
  const u = data.balance.economy.upkeep;
  let manpower = 0, fuel = 0;
  for (const unit of Object.values(state.units)) {
    if (unit.team !== team || unit.fsm.life !== 'ACTIVE') continue;
    const raw = u.share_of_price * (priceOf(unit.sbps, data).manpower ?? 0), mp = Math.min(raw, u.max_manpower);
    manpower += mp; fuel += (raw - mp) / u.excess_fuel_divisor;
  }
  return { manpower: Math.round(manpower), fuel: Math.round(fuel) };
}

/** Own turn start: income in, upkeep out; net manpower never below min_net_share of gross; no resource below 0. */
export function collectIncome(state, data, team) {
  const gross = grossIncome(state, data, team), up = upkeep(state, data, team), floor = data.balance.economy.upkeep.min_net_share;
  const net = { ...gross, manpower: Math.max(Math.round(gross.manpower * floor), gross.manpower - up.manpower), fuel: gross.fuel - up.fuel };
  const have = state.teams[team].resources;
  const resources = Object.fromEntries(RESOURCES.map(r => [r, Math.max(0, (have[r] ?? 0) + net[r])]));
  return { state: { ...state, teams: { ...state.teams, [team]: { ...state.teams[team], resources } } },
    events: [ev('IncomeReceived', { team, gross, net }), ev('UpkeepPaid', { team, ...up })] };
}

export const canAfford = (state, team, cost) => Object.entries(cost).every(([r, v]) => (state.teams[team].resources[r] ?? 0) >= v);

/** Pay a price (checked with canAfford first). */
export function pay(state, team, cost) {
  const have = state.teams[team].resources;
  const resources = { ...have, ...Object.fromEntries(Object.entries(cost).map(([r, v]) => [r, (have[r] ?? 0) - v])) };
  return { state: { ...state, teams: { ...state.teams, [team]: { ...state.teams[team], resources } } }, events: [] };
}

/** Squad ids a production building offers to its team's faction (data/rules/production.json). */
export function offers(state, data, buildingId) {
  const b = mapOf(state, data).production.find(x => x.id === buildingId);
  return b ? data.rules.production.buildings[b.type]?.[state.teams[b.team]?.faction] ?? [] : [];
}

/**
 * Produce command: { side, building, sbps, hex }. An own production building that offers the squad, its price in hand, and
 * a free hex next to the building that the unit can enter (v214: deploy beside the building). → reason or null
 */
export function validateProduce(state, cmd, data) {
  const b = mapOf(state, data).production.find(x => x.id === cmd.building);
  if (!b || b.team !== cmd.side) return 'no_such_building';
  if (!offers(state, data, cmd.building).includes(cmd.sbps)) return 'not_offered';
  if (!canAfford(state, cmd.side, priceOf(cmd.sbps, data))) return 'cannot_afford';
  const cls = moveClass({ members: data.units.sbps[cmd.sbps].members.map(m => ({ ebps: m.entity })) }, data);
  const beside = b.hexes.map(fromKey).find(h => cmd.hex && distance(h, cmd.hex) === 1 && stepCost(state, data, h, cmd.hex, cls ?? 'infantry') != null);
  if (!beside || b.hexes.includes(`${cmd.hex.c},${cmd.hex.r}`)) return 'bad_hex';
  return unitAt(state, cmd.hex) ? 'hex_occupied' : null;
}
