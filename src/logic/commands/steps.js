// Shared step sequences for routes and turn phases: an attack with all its consequences, counter fire and the overwatch
// reaction. Like the routes, these only sequence the owners' functions; every rule is in the owning system.
import * as turn from '../turn/index.js';
import * as vision from '../vision/index.js';
import * as combat from '../combat/index.js';
import * as status from '../status/index.js';
import * as crew from '../crew/index.js';
import * as lifecycle from '../lifecycle/index.js';
import * as terrain from '../terrain/index.js';
import { permits } from '../fsm/index.js';
import { ev } from '../events/index.js';

/** Unit axes in hierarchy order: lifecycle first (docs/unit-state.md §3). */
export const MACHINES = [lifecycle.LIFE, crew.STANCE, status.MORALE, turn.ACTION, vision.VISIBILITY];

const NONE = s => ({ state: s, events: [] });

/** Run steps in order; each gets the state the previous one returned. */
export function chain(state, steps) {
  let s = state;
  const events = [];
  for (const step of steps) { const r = step(s); s = r.state; events.push(...r.events); }
  return { state: s, events };
}

/** A step that runs only while the unit still exists (it may die in a reaction). */
export const ifUnit = (id, step) => x => (x.units[id] ? step(x) : NONE(x));

/** Feature hits from combat → terrain damage; a collapsing building kills its garrison (lifecycle). */
export const featureSteps = (hits, d) => hits.map(h => x => {
  if (h.edge) return terrain.damageEdge(x, d, h.edge[0], h.edge[1], h);
  const r = terrain.damageHex(x, d, h.hex, h);
  if (!r.collapsed) return r;
  const k = lifecycle.killGarrison(r.state, d, r.garrison);
  return { state: k.state, events: [...r.events, ...k.events] };
});

const hpOf = u => (u ? u.members.reduce((a, m) => a + m.hp, 0) : 0);

/**
 * One attack and everything it causes: damage (combat), suppression and XP (status), criticals and deaths (lifecycle),
 * map damage (terrain), the attacker revealed (vision) and engaged (status). The budget is the caller's.
 */
export function fire(state, d, rng, attackerId, targetId) {
  const before = Object.fromEntries(Object.values(state.units).map(u => [u.id, hpOf(u)]));
  const r = combat.resolveAttack(state, d, attackerId, targetId, rng);
  const hit = Object.keys(before).filter(id => hpOf(r.state.units[id]) < before[id]);
  const enemyLoss = hit.filter(id => state.units[id].team && state.units[id].team !== state.units[attackerId].team)   // no XP for ownerless guns
    .reduce((xp, id) => xp + status.xpFor(state.units[id], before[id] - hpOf(r.state.units[id]), d), 0);
  const out = chain(r.state, [
    ...Object.entries(r.suppression).map(([id, pts]) => x => status.applySuppression(x, id, pts, d)),
    x => lifecycle.applyCriticals(x, r.criticals),
    ...featureSteps(r.featureHits, d),
    x => status.gainXp(x, attackerId, enemyLoss, d),
    ...hit.map(id => ifUnit(id, x => lifecycle.checkDeaths(x, id, d))),
    ifUnit(attackerId, x => vision.revealOnFire(x, attackerId, d)),
    x => status.setEngaged(x, attackerId),
    x => turn.startReload(x, attackerId, d),
  ]);
  return { state: out.state, events: [...r.events, ...out.events] };
}

/**
 * Counter fire (SPEC §4): the unit that was attacked fires back once per enemy turn if every axis permits it (not
 * retreating, set up, active), it has its counter left, is not reloading and can attack the attacker from where it stands.
 */
export function counterFire(state, d, rng, unitId, attackerId) {
  const u = state.units[unitId];
  if (!u || !state.units[attackerId] || !permits(MACHINES, u, 'Counter').ok || turn.counterCheck(u) || turn.reloadCheck(u)
    || combat.canAttack(state, d, unitId, attackerId)) return NONE(state);
  const out = chain(state, [x => fire(x, d, rng, unitId, attackerId), x => turn.spendCounter(x, unitId)]);
  return { state: out.state, events: [ev('CounterFired', { unit: unitId, target: attackerId }), ...out.events] };
}

/**
 * The onStep hook for a move (movement.applyMove): every enemy MG on overwatch that can see and hit the mover fires once
 * (no counter fire); the move stops when the mover dies or is pinned (data/balance/turn.json). reacted.fired counts shots.
 */
export const overwatchStep = (d, rng, reacted = { fired: 0 }) => (state, moverId) => {
  const ids = turn.overwatchers(state, d, moverId);
  if (!ids.length) return { state, events: [], stop: false };
  const out = chain(state, ids.map(id => ifUnit(moverId, x => {
    reacted.fired++;
    return chain(x, [x2 => fire(x2, d, rng, id, moverId), x2 => turn.overwatchFired(x2, id, moverId)]);
  })));
  return { ...out, stop: turn.stopsMover(out.state, d, moverId) };
};
