// Resources, income, upkeep and unit production (SPEC §3, §10). Owns GameState.teams[team].resources.
// Tuning: data/balance/economy.json; what each production building offers: data/rules/production.json.
import { ev } from '../events/index.js';
import { distance, fromKey } from '../hex/index.js';
import { unitAt } from '../state/index.js';
import { mapOf, isCollapsed, hqDestroyed } from '../terrain/index.js';
import { stepCost, moveClass } from '../movement/index.js';
import { suppliedPoints } from '../capture/index.js';

const RESOURCES = ['manpower', 'munition', 'fuel'];
/** A squad's price: { manpower?, munition?, fuel? }. */
export const priceOf = (sbps, data) => data.units.sbps[sbps].price?.cost ?? {};

/** Gross income per resource: the HQ's base (none while it is destroyed) plus the yields of owned, supplied points (VPs pay nothing). */
export function grossIncome(state, data, team) {
  const inc = data.balance.economy.income, supplied = suppliedPoints(state, data, team), hq = !hqDestroyed(state, data, team);
  const out = Object.fromEntries(RESOURCES.map(r => [r, hq ? inc.base[r] ?? 0 : 0]));
  for (const p of mapOf(state, data).points) {
    if (!supplied.has(p.id)) continue;
    for (const [r, v] of Object.entries(p.yield ?? inc.points[p.kind] ?? {})) out[r] += v;   // a map may set a point's own yield
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

/** The conversion of a blueprint into another (data/rules/conversions.json), or null. */
export const conversionOf = (data, from, to) => data.rules.conversions.conversions.find(c => c.from === from && c.to === to) ?? null;

/**
 * Convert command: { unit, to }. A conversion the data lists for the unit's blueprint, not doctrine- or research-locked
 * (neither is built yet), the target blueprint in the unit data and of the same kind, out of combat, paid, within the population cap.
 */
export function validateConvert(state, cmd, data) {
  const u = state.units[cmd.unit], c = conversionOf(data, u.sbps, cmd.to), to = data.units.sbps[cmd.to];
  if (!c) return 'cannot_convert';
  if (c.unlock && c.unlock !== 'base') return `needs_${c.unlock}`;   // doctrines and research are not built yet
  if (!to || to.kind !== u.kind) return 'not_available';
  if (u.engaged) return 'engaged';
  if (!canAfford(state, u.team, c.cost)) return 'cannot_afford';
  const extra = (to.pop ?? 0) - (data.units.sbps[u.sbps].pop ?? 0);
  return population(state, data, u.team) + extra > data.balance.economy.population_cap ? 'population_cap' : null;
}

/** Are an upgrade's CoH3 requirements met? `upgrades`: every one unlocked; `any_upgrades`: one unlocked or one of the
 * team's standing buildings (CoH3 building ids). A team holding 'all' has everything (testing). */
export function requirementsMet(state, data, team, req = {}) {
  const has = state.teams[team].unlocks ?? [];
  if (has.includes('all')) return true;
  const f = data.rules.production.factions[state.teams[team].faction];
  const built = new Set(producers(state, data).filter(b => b.team === team).map(b => f?.slots[b.type]).filter(Boolean));
  return (req.upgrades || []).every(id => has.includes(id)) && (!req.any_upgrades?.length || req.any_upgrades.some(id => has.includes(id) || built.has(id)));
}

/**
 * Upgrade command: { unit, upgrade } — a weapon kit from the squad's CoH3 upgrade list: requirements met, under its limit,
 * out of combat, paid. shortcut: fitted at once (CoH3 build time `build_turns` not modelled), add it when kits take time.
 */
export function validateUpgrade(state, cmd, data) {
  const u = state.units[cmd.unit], up = data.units.upgrade[cmd.upgrade];
  if (!up || !(data.units.sbps[u.sbps].upgrades?.list || []).includes(cmd.upgrade)) return 'cannot_upgrade';
  if (u.upgrades.filter(x => x === cmd.upgrade).length >= (up.limit ?? 1)) return 'already_upgraded';
  if (!requirementsMet(state, data, u.team, up.requires)) return 'needs_unlock';
  if (u.engaged) return 'engaged';
  return canAfford(state, u.team, up.cost ?? {}) ? null : 'cannot_afford';
}

/** Population a side fields: the pop of its active units. */
export const population = (state, data, team) => Object.values(state.units)
  .filter(u => u.team === team && u.fsm.life === 'ACTIVE').reduce((s, u) => s + (data.units.sbps[u.sbps].pop ?? 0), 0);

export const canAfford = (state, team, cost) => Object.entries(cost).every(([r, v]) => (state.teams[team].resources[r] ?? 0) >= v);

/** Pay a price (checked with canAfford first). */
export function pay(state, team, cost) {
  const have = state.teams[team].resources;
  const resources = { ...have, ...Object.fromEntries(Object.entries(cost).map(([r, v]) => [r, (have[r] ?? 0) - v])) };
  return { state: { ...state, teams: { ...state.teams, [team]: { ...state.teams[team], resources } } }, events: [] };
}

/** Buildings that produce: the map's production buildings and each side's HQ (type 'hq'), while they stand. */
export function producers(state, data) {
  const m = mapOf(state, data);
  return [...m.production, ...Object.entries(m.structures).filter(([, s]) => s.kind === 'hq').map(([id, s]) => ({ id, type: 'hq', team: s.team, hexes: s.hexes }))]
    .filter(b => !isCollapsed(state, b.id));
}

/**
 * Squad ids a building offers its team (data/rules/production.json): its faction's CoH3 building for the map tier slot, the
 * squads it produces from the start (`base`) that the unit data has. Doctrine and research lists are not offered yet.
 */
export function offers(state, data, buildingId) {
  const b = producers(state, data).find(x => x.id === buildingId), f = b && data.rules.production.factions[state.teams[b.team]?.faction];
  return (f?.buildings[f.slots[b.type]]?.base ?? []).filter(id => data.units.sbps[id]);   // doctrine / research lists: locked (not built yet)
}

/**
 * Produce command: { side, building, sbps, hex }. An own production building that offers the squad, its price in hand, and
 * a free hex next to the building that the unit can enter (v214: deploy beside the building). → reason or null
 */
export function validateProduce(state, cmd, data) {
  const b = producers(state, data).find(x => x.id === cmd.building);
  if (!b || b.team !== cmd.side) return 'no_such_building';
  if (!offers(state, data, cmd.building).includes(cmd.sbps)) return 'not_offered';
  if (!canAfford(state, cmd.side, priceOf(cmd.sbps, data))) return 'cannot_afford';
  if (population(state, data, cmd.side) + (data.units.sbps[cmd.sbps].pop ?? 0) > data.balance.economy.population_cap) return 'population_cap';
  const cls = moveClass({ members: data.units.sbps[cmd.sbps].members.map(m => ({ ebps: m.entity })) }, data);
  const beside = b.hexes.map(fromKey).find(h => cmd.hex && distance(h, cmd.hex) === 1 && stepCost(state, data, h, cmd.hex, cls ?? 'infantry') != null);
  if (!beside || b.hexes.includes(`${cmd.hex.c},${cmd.hex.r}`)) return 'bad_hex';
  return unitAt(state, cmd.hex) ? 'hex_occupied' : null;
}
