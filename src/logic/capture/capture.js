// Points and sectors (SPEC §3, §10). Owns GameState.points: [{ id, owner, progress, by }].
// A point is taken by holding its zone through the side's own turn-start ticks: each capturing squad adds points_per_squad
// (capture is per squad, not per man); points_per_step (data/balance/economy.json) neutralises an enemy point or captures a neutral one, at most one step
// per tick. Armed enemies in the zone contest it (frozen); a side that left the zone loses its progress.
import { key, fromKey, neighbours } from '../hex/index.js';
import { ev } from '../events/index.js';
import { enemyOf } from '../state/index.js';
import { mapOf } from '../terrain/index.js';
import { firingWeapons } from '../combat/index.js';

const onMap = u => u.fsm.life === 'ACTIVE' && u.fsm.location === 'ON_MAP';

/** Capture strength of a unit: points_per_squad for an armed squad or crew that can capture (CoH3 capture block), not pinned or retreating. */
export function capturePower(unit, data) {
  if (!data.units.sbps[unit.sbps].capture || !onMap(unit) || ['PINNED', 'RETREATING'].includes(unit.fsm.morale) || !firingWeapons(unit, data).length) return 0;
  return data.balance.economy.capture.points_per_squad;
}

/** Contests a zone: any armed unit on the map that is not retreating (pinned infantry and armed vehicles too). */
export const contests = (unit, data) => onMap(unit) && unit.fsm.morale !== 'RETREATING' && firingWeapons(unit, data).length > 0;

/** The capture tick of `side` (its own turn start) over every point. */
export function captureTick(state, data, side) {
  const step = data.balance.economy.capture.points_per_step, enemy = enemyOf(state, side), events = [];
  const defs = Object.fromEntries(mapOf(state, data).points.map(p => [p.id, p]));
  const points = state.points.map(p => {
    const zone = new Set(defs[p.id].zone), here = Object.values(state.units).filter(u => onMap(u) && zone.has(key(u.pos)));
    const power = here.filter(u => u.team === side).reduce((s, u) => s + capturePower(u, data), 0);
    if (!power) return p.by === side ? { ...p, progress: 0, by: null } : p;
    if (here.some(u => u.team === enemy && contests(u, data)) || p.owner === side) return p;
    const progress = (p.by === side ? p.progress : 0) + power;
    if (progress < step) {
      events.push(ev('PointProgress', { point: p.id, team: side, progress, of: step }));
      return { ...p, progress, by: side };
    }
    const owner = p.owner ? null : side;
    events.push(ev(owner ? 'PointCaptured' : 'PointNeutralised', { point: p.id, team: side, from: p.owner }));
    return { ...p, owner, progress: 0, by: null };
  });
  return { state: { ...state, points }, events };
}

/**
 * Ids of the points that pay `team` (SPEC §3): with no sectors on the map, or a point outside every sector, all owned
 * points; otherwise owned points whose sector links to the team's HQ sector through the team's own sectors.
 */
export function suppliedPoints(state, data, team) {
  const m = mapOf(state, data), owned = state.points.filter(p => p.owner === team).map(p => p.id);
  if (!m.sectors.length) return new Set(owned);
  const sectorOf = {};
  for (const s of m.sectors) for (const k of s.hexes) sectorOf[k] = s.id;
  const pointSector = Object.fromEntries(m.points.map(p => [p.id, p.sector ?? sectorOf[p.hex]]));
  const own = new Set(owned.map(id => pointSector[id]).filter(Boolean));
  const hq = Object.values(m.structures).filter(s => s.kind === 'hq' && s.team === team).flatMap(s => s.hexes.map(k => sectorOf[k])).filter(Boolean);
  hq.forEach(s => own.add(s));
  const linked = new Set(hq), queue = [...hq];
  while (queue.length) {
    const cur = queue.pop();
    for (const k of m.sectors.find(s => s.id === cur).hexes) {
      for (const n of neighbours(fromKey(k))) {
        const nb = sectorOf[key(n)];
        if (nb && own.has(nb) && !linked.has(nb)) { linked.add(nb); queue.push(nb); }
      }
    }
  }
  return new Set(owned.filter(id => !pointSector[id] || linked.has(pointSector[id])));
}
