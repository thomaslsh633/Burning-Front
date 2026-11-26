// Sight lines, sight range and what a side sees (v214 v144 rules; tuning in data/balance/vision.json).
// Heights: a hex's elevation × elevation_height, plus object / edge heights from data/rules/terrain.json.
import { key, line, distance, disk, inside, equals } from '../hex/index.js';
import { hexTerrain, edgeBetween } from '../movement/index.js';
import { allUnits } from '../state/index.js';

const elevOf = (state, h) => state.map.terrain[key(h)]?.elev ?? 0;

/**
 * Straight line a → b for a viewer whose eye is `eye` above its ground. The two end hexes never block; the edge the
 * viewer stands behind and the target's own entry edge are not counted. → { block, obscured }
 */
export function sightLine(state, data, a, b, eye) {
  const v = data.balance.vision, E = v.elevation_height;
  const path = line(a, b), n = path.length - 1;
  if (n <= 1) return { block: false, obscured: false };
  const z0 = elevOf(state, a) * E + eye, z1 = elevOf(state, b) * E + v.target_height;
  let obscured = false;
  for (let i = 1; i < n; i++) {
    const h = path[i], z = z0 + ((z1 - z0) * i) / n, g = elevOf(state, h) * E;
    if (i >= 2) {
      const edge = edgeBetween(state, data, path[i - 1], h);
      if (edge && edge.sight !== 'none') {
        const ze = z0 + ((z1 - z0) * (i - 0.5)) / n, ge = Math.max(elevOf(state, h), elevOf(state, path[i - 1])) * E;
        if (ge + edge.height > ze) { if (edge.sight === 'block') return { block: true, obscured }; obscured = true; }
      }
    }
    if (g > z) return { block: true, obscured };
    const obj = hexTerrain(state, data, h).object;
    if (!obj || obj.sight === 'none' || g + obj.height <= z || (i === 1 && obj.height <= v.ignore_low_objects_next_to_viewer)) continue;
    if (obj.sight === 'block') return { block: true, obscured };
    obscured = true;
  }
  return { block: false, obscured };
}

export const eyeHeight = (unit, data) => data.balance.vision.eye_height[unit.kind] ?? 1.5;

/** Hexes a unit sees: best member sight + its hex's elevation, minus the morale penalty. */
export function sightRange(unit, state, data) {
  const base = Math.max(0, ...unit.members.map(m => data.units.ebps[m.ebps]?.sight?.hex ?? 0));
  return Math.max(1, base + elevOf(state, unit.pos) - (data.balance.vision.sight_penalty[unit.fsm.morale] ?? 0));
}

export function hasLineOfSight(state, data, unit, h) {
  return distance(unit.pos, h) <= 1 || !sightLine(state, data, unit.pos, h, eyeHeight(unit, data)).block;
}

/** Units that give their side sight: active, not inside a transport. */
const viewers = (state, team) => allUnits(state).filter(u => u.team === team && u.fsm.life === 'ACTIVE' && u.fsm.location !== 'LOADED');

/** Set of hex keys a side sees. */
export function visibleHexes(state, data, team) {
  const out = new Set();
  for (const u of viewers(state, team)) {
    for (const h of disk(u.pos, sightRange(u, state, data))) {
      if (inside(h, state.map.cols, state.map.rows) && !out.has(key(h)) && hasLineOfSight(state, data, u, h)) out.add(key(h));
    }
  }
  return out;
}

/**
 * Hexes from which a unit is seen at all (0 = from anywhere in sight): the tightest of terrain concealment
 * (bush, forest, building) and its own concealed state (CoH3 camouflage, or an emplaced crew in cover).
 */
export function detectionRange(state, data, unit) {
  const v = data.balance.vision, ranges = [];
  const obj = state.map.terrain[key(unit.pos)]?.object;
  if (obj && v.terrain_concealment[obj]) ranges.push(v.terrain_concealment[obj]);
  if (unit.fsm.visibility === 'CONCEALED') {
    const stealth = unit.members.map(m => data.units.ebps[m.ebps]?.stealth?.detected_hex).find(x => x != null);
    ranges.push(stealth ?? v.emplaced_concealment_hex);
  }
  return ranges.length ? Math.min(...ranges) : 0;
}

/** Does `team` see this unit? Seen hex, and close enough if it is concealed; a unit that fired recently is seen anyway. */
export function canSee(state, data, team, unit, seen = visibleHexes(state, data, team)) {
  if (unit.team === team) return true;
  if (unit.fsm.location === 'LOADED' || !seen.has(key(unit.pos))) return false;
  if (state.match.turn < unit.timers.revealedUntil) return true;
  const k = detectionRange(state, data, unit);
  return !k || viewers(state, team).some(v => distance(v.pos, unit.pos) <= k && !equals(v.pos, unit.pos));
}
