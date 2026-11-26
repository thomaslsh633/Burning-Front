// Movement (SPEC §1, §4, §6): move points, reachable hexes, paths, hull turning and reverse.
// Writes only pos, facing and turretFacing (src/logic/state/ownership.js); the move budget is the turn system's.
import { key, fromKey, equals, neighbours, direction, turnSteps, angle, distance } from '../hex/index.js';
import { unitAt, putUnit } from '../state/index.js';
import { ev } from '../events/index.js';
import { stepCost } from './terrain.js';
import { crushEdge } from '../terrain/index.js';

const membersWithMove = (unit, data) => unit.members.map(m => data.units.ebps[m.ebps]?.move).filter(mv => mv && mv.hex > 0);

/** 'infantry' | 'vehicle' from the members' CoH3 pass type, or null for a unit that cannot move. */
export function moveClass(unit, data) {
  const mv = membersWithMove(unit, data)[0];
  return mv ? data.rules.terrain.pass_classes[mv.pass] ?? null : null;
}

/** Move points at turn start: slowest member, then suppression, engine damage, retreat (data/balance/movement.json). */
export function movePoints(unit, data) {
  const list = membersWithMove(unit, data);
  if (!list.length || unit.criticals.includes('immobilised')) return 0;
  const m = data.balance.movement.multipliers;
  let pts = Math.min(...list.map(mv => mv.hex));
  if (unit.fsm.morale === 'SUPPRESSED') pts *= m.suppressed;
  if (unit.fsm.morale === 'RETREATING') pts *= m.retreating;
  if (unit.criticals.includes('engine_damaged')) pts *= m.engine_damaged;
  return Math.max(1, Math.floor(pts));
}

/** Reverse (vehicles): the step must lie in the arc behind the hull. */
const behind = (unit, from, to, arcDeg) => {
  const back = (unit.facing + 3) % 6;
  const diff = Math.abs(((angle(from, to) - back * 60 + 540) % 360) - 180);
  return diff <= arcDeg / 2 + 1e-9;
};

/** Can a unit stop on this hex / pass through it? */
function occupancy(state, unit, h, data) {
  const other = unitAt(state, h);
  if (!other || other.id === unit.id) return { pass: true, stop: true };
  const friendly = other.team === unit.team && other.fsm.life === 'ACTIVE';
  return { pass: friendly && data.balance.movement.friendly_pass_through, stop: false };
}

/**
 * Every hex the unit can reach with `points` (default: its move budget): Map key → { cost, prev, stop }.
 * opts.reverse: vehicles only, steps behind the hull at extra cost, facing kept.
 */
export function reachable(state, data, unitId, opts = {}) {
  const unit = state.units[unitId], cls = moveClass(unit, data);
  const points = opts.points ?? unit.budget.move;
  const rev = data.balance.movement.reverse;
  const out = new Map([[key(unit.pos), { cost: 0, prev: null, stop: true }]]);
  if (!cls) return out;
  const open = [{ h: unit.pos, cost: 0 }];
  while (open.length) {
    open.sort((a, b) => a.cost - b.cost);
    const { h, cost } = open.shift();
    if (cost > out.get(key(h)).cost) continue;
    for (const n of neighbours(h)) {
      let c = stepCost(state, data, h, n, cls);
      if (c == null) continue;
      if (opts.reverse) { if (cls !== 'vehicle' || !behind(unit, h, n, rev.arc_deg)) continue; c += rev.extra_cost_per_hex; }
      const total = cost + c, occ = occupancy(state, unit, n, data);
      if (total > points || !occ.pass) continue;
      const prevBest = out.get(key(n));
      if (prevBest && prevBest.cost <= total) continue;
      out.set(key(n), { cost: total, prev: key(h), stop: occ.stop });
      open.push({ h: n, cost: total });
    }
  }
  return out;
}

/** The path (start excluded) to a hex in a reachable map, or null. */
export function pathTo(reach, to) {
  if (!reach.has(key(to))) return null;
  const path = [];
  for (let k = key(to); reach.get(k).prev; k = reach.get(k).prev) path.unshift(fromKey(k));
  return path;
}

/** Move points a hull turn costs (SPEC §6); team weapons turn free while packed; infantry has no hull. null = cannot turn. */
export function turnCost(unit, data, toFacing) {
  if (unit.kind === 'team_weapon') return 0;
  if (unit.kind !== 'vehicle') return null;
  return data.balance.movement.hull_turn_cost[turnSteps(unit.facing, toFacing)];
}

/** Move command check: { unit, to, reverse? } → reason or null. */
export function validateMove(state, cmd, data) {
  const unit = state.units[cmd.unit];
  if (!moveClass(unit, data)) return 'cannot_move';
  if (cmd.reverse && moveClass(unit, data) !== 'vehicle') return 'cannot_reverse';
  if (equals(unit.pos, cmd.to)) return 'already_there';
  const spot = reachable(state, data, cmd.unit, { reverse: !!cmd.reverse }).get(key(cmd.to));
  if (!spot) return 'out_of_reach';
  if (!spot.stop) return 'hex_occupied';
  return null;
}

/** Turret: aligned with the hull it follows the hull; aimed elsewhere it holds its absolute aim (SPEC §6). */
const withFacing = (u, facing) => ({ ...u, facing, turretFacing: u.turretFacing === u.facing ? facing : u.turretFacing });

/**
 * Walk the path hex by hex. onStep(state, unitId) → { state, events, stop } lets reactions (overwatch) interrupt.
 * points: move points to path with (default: the unit's move budget; retreat passes its own).
 * → { state, events, cost } (cost = move points actually spent).
 */
export function applyMove(state, cmd, data, onStep, points) {
  const reach = reachable(state, data, cmd.unit, { reverse: !!cmd.reverse, points });
  const path = pathTo(reach, cmd.to);
  let s = state, cost = 0;
  const events = [];
  for (const h of path) {
    const u = s.units[cmd.unit], from = u.pos;
    const facing = cmd.reverse || u.kind === 'structure' ? u.facing : direction(from, h);
    s = putUnit(s, { ...withFacing(u, facing), pos: { ...h } });
    cost = reach.get(key(h)).cost;
    events.push(ev('Moved', { unit: cmd.unit, from, to: { ...h }, facing, reverse: !!cmd.reverse }));
    const crush = crushEdge(s, data, from, h, moveClass(u, data));   // vehicles break fences, hedges, wire, sandbags
    s = crush.state; events.push(...crush.events);
    if (onStep) {
      const r = onStep(s, cmd.unit);
      s = r.state; events.push(...r.events);
      if (r.stop) { events.push(ev('MoveInterrupted', { unit: cmd.unit, at: { ...h } })); break; }
    }
  }
  return { state: s, events, cost };
}

/** Turn command: { unit, facing } → new state; cost from turnCost. */
export function validateTurn(state, cmd, data) {
  const unit = state.units[cmd.unit], cost = turnCost(unit, data, cmd.facing);
  if (cost == null) return 'cannot_turn';
  if (cmd.facing === unit.facing) return 'already_facing';
  return null;
}

export function applyTurn(state, cmd, data) {
  const u = state.units[cmd.unit];
  return { state: putUnit(state, withFacing(u, cmd.facing)), events: [ev('Turned', { unit: u.id, from: u.facing, to: cmd.facing })], cost: turnCost(u, data, cmd.facing) };
}

/** Walk as close to `goal` as `points` allow (retreat): the free reachable hex nearest the goal, cheapest on ties. onStep as applyMove. */
export function moveToward(state, data, unitId, goal, points, onStep) {
  const reach = reachable(state, data, unitId, { points });
  let best = null;
  for (const [k, v] of reach) {
    if (!v.stop) continue;
    const h = fromKey(k), d = distance(h, goal);
    if (!best || d < best.d || (d === best.d && v.cost < best.cost)) best = { h, d, cost: v.cost };
  }
  if (!best || equals(best.h, state.units[unitId].pos)) return { state, events: [], cost: 0 };
  return applyMove(state, { unit: unitId, to: best.h }, data, onStep, points);
}

/** Own turn end: a turret that is not engaged swings back to the hull (SPEC §6). engaged: read from status by the caller. */
export function turretReturn(state, unitId, engaged) {
  const u = state.units[unitId];
  if (engaged || u.turretFacing === u.facing) return { state, events: [] };
  return { state: putUnit(state, { ...u, turretFacing: u.facing }), events: [ev('TurretTurned', { unit: unitId, from: u.turretFacing, to: u.facing })] };
}
