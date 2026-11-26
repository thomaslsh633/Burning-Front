// Which system handles each command, and the unit state machines every unit command must pass.
// A route only sequences the owning systems' functions (each writes only its own fields); it holds no rule itself.
//
// route: { validate(state, cmd, data) → reason | null, apply(state, cmd, data, rng) → { state, events },
//          unit?: true (cmd.unit must be an own unit and every axis must permit cmd.type), undoable?: true }
import * as movement from '../movement/index.js';
import * as turn from '../turn/index.js';
import * as vision from '../vision/index.js';
import * as combat from '../combat/index.js';
import * as status from '../status/index.js';
import * as crew from '../crew/index.js';
import * as lifecycle from '../lifecycle/index.js';
import * as terrain from '../terrain/index.js';
import { distance } from '../hex/index.js';

/** Unit axes in hierarchy order: lifecycle first (docs/unit-state.md §3). */
export const MACHINES = [lifecycle.LIFE, crew.STANCE, status.MORALE, turn.ACTION, vision.VISIBILITY];

/** Run steps in order; each gets the state the previous one returned. */
function chain(state, steps) {
  let s = state;
  const events = [];
  for (const step of steps) { const r = step(s); s = r.state; events.push(...r.events); }
  return { state: s, events };
}

/** Feature hits from combat → terrain damage; a collapsing building kills its garrison (lifecycle). */
const featureSteps = (hits, d) => hits.map(h => x => {
  if (h.edge) return terrain.damageEdge(x, d, h.edge[0], h.edge[1], h);
  const r = terrain.damageHex(x, d, h.hex, h);
  if (!r.collapsed) return r;
  const k = lifecycle.killGarrison(r.state, d, r.garrison);
  return { state: k.state, events: [...r.events, ...k.events] };
});

const moveCost = (s, c, d) => movement.reachable(s, d, c.unit, { reverse: !!c.reverse }).get(`${c.to.c},${c.to.r}`)?.cost ?? 0;
const hpOf = u => (u ? u.members.reduce((a, m) => a + m.hp, 0) : 0);

export const ROUTES = {
  Move: {
    unit: true, undoable: true,
    validate: (s, c, d) => movement.validateMove(s, c, d) ?? turn.budgetCheck(s.units[c.unit], 'Move', moveCost(s, c, d)),
    apply(s, c, d) {
      let cost = 0;
      return chain(s, [
        x => { const m = movement.applyMove(x, c, d); cost = m.cost; return m; },
        x => turn.spend(x, c.unit, { move: cost }),
        x => vision.revealOnMove(x, c.unit),
      ]);
    },
  },
  Turn: {
    unit: true, undoable: true,
    validate: (s, c, d) => movement.validateTurn(s, c, d) ?? turn.budgetCheck(s.units[c.unit], 'Turn', movement.turnCost(s.units[c.unit], d, c.facing)),
    apply(s, c, d) {
      let cost = 0;
      return chain(s, [x => { const m = movement.applyTurn(x, c, d); cost = m.cost; return m; }, x => turn.spend(x, c.unit, { move: cost })]);
    },
  },
  Attack: {
    unit: true,
    validate: (s, c, d) => combat.canAttack(s, d, c.unit, c.target) ?? turn.budgetCheck(s.units[c.unit], 'Attack'),
    apply(s, c, d, rng) {
      const before = Object.fromEntries(Object.values(s.units).map(u => [u.id, hpOf(u)]));
      const r = combat.resolveAttack(s, d, c.unit, c.target, rng);
      const hit = Object.keys(before).filter(id => hpOf(r.state.units[id]) < before[id]);
      const enemyLoss = hit.filter(id => s.units[id].team !== s.units[c.unit].team)
        .reduce((xp, id) => xp + status.xpFor(s.units[id], before[id] - hpOf(r.state.units[id]), d), 0);
      const out = chain(r.state, [
        ...Object.entries(r.suppression).map(([id, pts]) => x => status.applySuppression(x, id, pts, d)),
        x => lifecycle.applyCriticals(x, r.criticals),
        ...featureSteps(r.featureHits, d),
        x => status.gainXp(x, c.unit, enemyLoss, d),
        ...hit.map(id => x => (x.units[id] ? lifecycle.checkDeaths(x, id, d) : { state: x, events: [] })),
        x => vision.revealOnFire(x, c.unit, d),
        x => turn.spend(x, c.unit, { action: 1, fired: true }),
      ]);
      return { state: out.state, events: [...r.events, ...out.events] };
    },
  },
  AttackFeature: {
    unit: true,
    validate: (s, c, d) => combat.canAttackFeature(s, d, c.unit, c.target) ?? turn.budgetCheck(s.units[c.unit], 'Attack'),
    apply(s, c, d, rng) {
      const r = combat.resolveFeatureAttack(s, d, c.unit, c.target, rng);
      const out = chain(r.state, [...featureSteps(r.featureHits, d), x => vision.revealOnFire(x, c.unit, d), x => turn.spend(x, c.unit, { action: 1, fired: true })]);
      return { state: out.state, events: [...r.events, ...out.events] };
    },
  },
  Emplace: {
    unit: true,
    validate: (s, c) => crew.validateEmplace(s, c) ?? turn.budgetCheck(s.units[c.unit], 'Emplace'),
    apply: (s, c, d) => chain(s, [
      x => crew.emplace(x, c.unit, d),
      x => turn.spend(x, c.unit, { action: 1, move: d.balance.crew.emplace_spends_remaining_move ? x.units[c.unit].budget.move : 0 }),
    ]),
  },
  Pack: {
    unit: true,
    validate: (s, c) => crew.validatePack(s, c) ?? turn.budgetCheck(s.units[c.unit], 'Pack'),
    apply: (s, c, d) => chain(s, [x => crew.pack(x, c.unit, d), x => turn.spend(x, c.unit, { action: 1 })]),
  },
  Retreat: {
    unit: true,
    validate: (s, c) => status.validateRetreat(s, c),
    apply(s, c, d) {
      return chain(s, [
        x => status.startRetreat(x, c.unit),
        x => movement.moveToward(x, d, c.unit, x.units[c.unit].retreatTo, movement.movePoints(x.units[c.unit], d)),
        x => vision.revealOnMove(x, c.unit),
        x => status.arriveIfNear(x, c.unit, d, distance(x.units[c.unit].pos, x.units[c.unit].retreatTo)),
        x => turn.exhaust(x, c.unit),
      ]);
    },
  },
};
