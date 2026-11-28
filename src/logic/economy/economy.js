// Resources, income, upkeep, unit production and research (SPEC §3, §10). Owns GameState.teams[team].resources, unlocks, research.
// Tuning: data/balance/economy.json; what each production building offers: data/rules/production.json; research: data/rules/research.json.
import { ev } from '../events/index.js';
import { distance, fromKey, inside } from '../hex/index.js';
import { unitAt } from '../state/index.js';
import { mapOf, isCollapsed, hqDestroyed, hexAt, structureAt } from '../terrain/index.js';
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
  if (c.unlock && c.unlock !== 'base' && !hasUnlock(state, u.team, c.to)) return `needs_${c.unlock}`;   // research (or a doctrine) unlocks the target
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
  if (has.includes('all')) return true;   // (hasUnlock below for single ids)
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

/** Does the side hold this research / doctrine unlock? ('all': everything, for testing) */
export const hasUnlock = (state, team, id) => { const u = state.teams[team].unlocks ?? []; return u.includes('all') || u.includes(id); };

/** The CoH3 building a production building stands for (its faction's slot), and the faction's lists. */
function buildingOf(state, data, buildingId) {
  const b = producers(state, data).find(x => x.id === buildingId), faction = b && state.teams[b.team]?.faction, f = faction && data.rules.production.factions[faction];
  return f ? { b, faction, coh3: f.slots[b.type], lists: f.buildings[f.slots[b.type]] ?? {} } : null;
}

/**
 * Squad ids a building offers its team (data/rules/production.json): its faction's CoH3 building for the map tier slot, the
 * squads it produces from the start (`base`) plus the `research` and `doctrine` squads the side has unlocked, that the unit data has.
 */
export function offers(state, data, buildingId) {
  const x = buildingOf(state, data, buildingId);
  if (!x) return [];
  const unlocked = [...(x.lists.research ?? []), ...(x.lists.doctrine ?? [])].filter(id => hasUnlock(state, x.b.team, id));
  return [...(x.lists.base ?? []), ...unlocked].filter(id => data.units.sbps[id]);
}

/** Research a building offers its side now (data/rules/research.json for its CoH3 building): not held, not under way. */
export function researchOffers(state, data, buildingId) {
  const x = buildingOf(state, data, buildingId);
  if (!x) return [];
  const t = state.teams[x.b.team], busy = new Set((t.research ?? []).map(r => r.id));
  return Object.keys(data.rules.research.factions[x.faction]?.[x.coh3] ?? {}).filter(id => !(t.unlocks ?? []).includes(id) && !busy.has(id));
}

export const researchOf = (state, data, buildingId, id) => { const x = buildingOf(state, data, buildingId); return data.rules.research.factions[x.faction][x.coh3][id]; };

/** Research command: { side, building, research }. An own standing building that offers it, idle (one at a time), paid. */
export function validateResearch(state, cmd, data) {
  const b = producers(state, data).find(x => x.id === cmd.building);
  if (!b || b.team !== cmd.side) return 'no_such_building';
  if (!researchOffers(state, data, cmd.building).includes(cmd.research)) return 'not_offered';
  if ((state.teams[cmd.side].research ?? []).some(r => r.building === cmd.building)) return 'busy';
  return canAfford(state, cmd.side, researchOf(state, data, cmd.building, cmd.research).cost) ? null : 'cannot_afford';
}

/** Start research (paid by the route): it finishes after its turns, counted at the side's turn starts. */
export function startResearch(state, cmd, data) {
  const t = state.teams[cmd.side], turns = researchOf(state, data, cmd.building, cmd.research).turns;
  const research = [...(t.research ?? []), { id: cmd.research, building: cmd.building, left: turns }];
  return { state: { ...state, teams: { ...state.teams, [cmd.side]: { ...t, research } } }, events: [ev('ResearchStarted', { team: cmd.side, research: cmd.research, building: cmd.building, turns })] };
}

/** Own turn start: research in a standing building is one turn nearer; finished research becomes an unlock. */
export function researchTick(state, data, team) {
  const t = state.teams[team], standing = new Set(producers(state, data).map(b => b.id)), events = [];
  const research = (t.research ?? []).map(r => (standing.has(r.building) ? { ...r, left: r.left - 1 } : r));   // a destroyed building's research waits
  const done = research.filter(r => r.left <= 0);
  for (const r of done) events.push(ev('ResearchCompleted', { team, research: r.id, building: r.building }));
  return { state: { ...state, teams: { ...state.teams, [team]: { ...t, research: research.filter(r => r.left > 0), unlocks: [...(t.unlocks ?? []), ...done.map(r => r.id)] } } }, events };
}

/**
 * Paradrop (CoH3 call-ins that fly the squad in, `can_target_in_fow`): anywhere on the map, on a free hex the unit can stand on
 * (no building, no impassable ground). → reason or null
 */
function dropHex(state, data, hex, cls) {
  const t = hex && inside(hex, state.map.cols, state.map.rows) && hexAt(state, data, hex);
  if (!t || t.oob || structureAt(state, data, hex) || (t.feature?.cost?.[cls] ?? t.ground.cost[cls]) == null) return 'bad_hex';
  return unitAt(state, hex) ? 'hex_occupied' : null;
}

/**
 * Produce command: { side, building, sbps, hex }. An own production building that offers the squad, its price in hand, and
 * a free hex next to the building that the unit can enter (v214: deploy beside the building); a paradrop squad anywhere. → reason or null
 */
export function validateProduce(state, cmd, data) {
  const b = producers(state, data).find(x => x.id === cmd.building);
  if (!b || b.team !== cmd.side) return 'no_such_building';
  if (!offers(state, data, cmd.building).includes(cmd.sbps)) return 'not_offered';
  if (!canAfford(state, cmd.side, priceOf(cmd.sbps, data))) return 'cannot_afford';
  if (population(state, data, cmd.side) + (data.units.sbps[cmd.sbps].pop ?? 0) > data.balance.economy.population_cap) return 'population_cap';
  const cls = moveClass({ members: data.units.sbps[cmd.sbps].members.map(m => ({ ebps: m.entity })) }, data);
  if ((data.units.sbps[cmd.sbps].traits || []).includes('paradrop')) return dropHex(state, data, cmd.hex, cls ?? 'infantry');
  const beside = b.hexes.map(fromKey).find(h => cmd.hex && distance(h, cmd.hex) === 1 && stepCost(state, data, h, cmd.hex, cls ?? 'infantry') != null);
  if (!beside || b.hexes.includes(`${cmd.hex.c},${cmd.hex.r}`)) return 'bad_hex';
  return unitAt(state, cmd.hex) ? 'hex_occupied' : null;
}
