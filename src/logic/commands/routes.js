// Which system handles each command, and the unit state machines every unit command must pass.
// A route only sequences the owning systems' functions (each writes only its own fields); it holds no rule itself.
//
// route: { validate(state, cmd, data) → reason | null, apply(state, cmd, data, rng) → { state, events, undoable? },
//          unit?: true (cmd.unit must be an own unit and every axis must permit cmd.type), undoable?: true }
// apply may return undoable: false when this run revealed something (a reaction fired), even on an undoable route.
import * as movement from '../movement/index.js';
import * as turn from '../turn/index.js';
import * as vision from '../vision/index.js';
import * as combat from '../combat/index.js';
import * as status from '../status/index.js';
import * as crew from '../crew/index.js';
import * as lifecycle from '../lifecycle/index.js';
import * as terrain from '../terrain/index.js';
import * as economy from '../economy/index.js';
import { spawnUnit } from '../state/index.js';
import { ev } from '../events/index.js';
import { MACHINES, chain, ifUnit, featureSteps, fire, counterFire, overwatchStep } from './steps.js';
import { startTurn, endTurn, retreatWalk } from './phases.js';

export { MACHINES };

const moveCost = (s, c, d) => movement.reachable(s, d, c.unit, { reverse: !!c.reverse }).get(`${c.to.c},${c.to.r}`)?.cost ?? 0;

export const ROUTES = {
  Move: {
    unit: true, undoable: true,
    validate: (s, c, d) => movement.validateMove(s, c, d) ?? turn.budgetCheck(s.units[c.unit], 'Move', moveCost(s, c, d)),
    apply(s, c, d, rng) {
      let cost = 0;
      const reacted = { fired: 0 };
      const out = chain(s, [
        x => { const m = movement.applyMove(x, c, d, overwatchStep(d, rng, reacted)); cost = m.cost; return m; },
        ifUnit(c.unit, x => turn.spend(x, c.unit, { move: cost })),
        ifUnit(c.unit, x => vision.revealOnMove(x, c.unit)),
      ]);
      return { ...out, undoable: reacted.fired === 0 };
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
    validate: (s, c, d) => combat.canAttack(s, d, c.unit, c.target) ?? turn.budgetCheck(s.units[c.unit], 'Attack') ?? turn.reloadCheck(s.units[c.unit]),
    apply: (s, c, d, rng) => chain(s, [
      x => fire(x, d, rng, c.unit, c.target),
      x => turn.spend(x, c.unit, { action: 1, fired: true }),
      x => counterFire(x, d, rng, c.target, c.unit),
    ]),
  },
  AttackFeature: {
    unit: true,
    validate: (s, c, d) => combat.canAttackFeature(s, d, c.unit, c.target) ?? turn.budgetCheck(s.units[c.unit], 'Attack') ?? turn.reloadCheck(s.units[c.unit]),
    apply(s, c, d, rng) {
      const r = combat.resolveFeatureAttack(s, d, c.unit, c.target, rng);
      const out = chain(r.state, [...featureSteps(r.featureHits, d), x => vision.revealOnFire(x, c.unit, d), x => status.setEngaged(x, c.unit),
        x => turn.startReload(x, c.unit, d), x => turn.spend(x, c.unit, { action: 1, fired: true })]);
      return { state: out.state, events: [...r.events, ...out.events] };
    },
  },
  Emplace: {
    unit: true,
    validate: (s, c, d) => crew.validateEmplace(s, c, d) ?? turn.budgetCheck(s.units[c.unit], 'Emplace'),
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
  Hold: {
    unit: true,
    validate: (s, c, d) => turn.validateHold(s, c, d),
    apply: (s, c, d) => turn.hold(s, c.unit, d),
  },
  Retreat: {
    unit: true,
    validate: (s, c) => status.validateRetreat(s, c),
    apply: (s, c, d, rng) => chain(s, [x => status.startRetreat(x, c.unit), x => retreatWalk(x, d, rng, c.unit)]),
  },
  Recrew: {
    unit: true,
    validate: (s, c, d) => lifecycle.validateRecrew(s, c, d) ?? turn.budgetCheck(s.units[c.unit], 'Recrew'),
    apply: (s, c, d) => chain(s, [
      x => combat.setMembers(x, c.target, lifecycle.recrewMembers(x, c.target, c.unit, d)),
      x => lifecycle.recrew(x, c.target, c.unit, d),
      x => crew.resetStance(x, c.target),
      x => status.resetMorale(x, c.target),
    ]),
  },
  Abandon: {
    unit: true,
    validate: (s, c, d) => lifecycle.validateAbandon(s, c, d) ?? turn.budgetCheck(s.units[c.unit], 'Abandon'),
    apply(s, c, d) {
      const u = s.units[c.unit], { gun, crew: men } = lifecycle.splitCrew(s, c.unit, d);
      const born = spawnUnit(s, { team: u.team, sbps: u.sbps, pos: lifecycle.freeNeighbour(s, d, c.unit), facing: u.facing, members: men }, d);
      const out = chain(born.state, [x => combat.setMembers(x, c.unit, gun), x => turn.exhaust(x, c.unit), x => lifecycle.abandon(x, c.unit)]);
      return { state: out.state, events: [ev('UnitCreated', { unit: born.id, from: c.unit }), ...out.events] };
    },
  },
  ClearWreck: {
    unit: true,
    validate: (s, c, d) => lifecycle.validateClearWreck(s, c, d) ?? turn.budgetCheck(s.units[c.unit], 'ClearWreck'),
    apply: (s, c, d) => chain(s, [x => terrain.clearWreck(x, d, c.hex), x => turn.spend(x, c.unit, { action: 1 })]),
  },
  /** { side, building, sbps, hex }: the new unit stands beside the building and acts from the next own turn. */
  Produce: {
    validate: (s, c, d) => economy.validateProduce(s, c, d),
    apply(s, c, d) {
      const paid = economy.pay(s, c.side, economy.priceOf(c.sbps, d));
      const born = spawnUnit(paid.state, { team: c.side, sbps: c.sbps, pos: c.hex }, d);
      return { state: born.state, events: [ev('UnitProduced', { unit: born.id, team: c.side, sbps: c.sbps, building: c.building })] };
    },
  },
  /** { unit, to }: a field conversion (data/rules/conversions.json); spends the action. */
  Convert: {
    unit: true,
    validate: (s, c, d) => economy.validateConvert(s, c, d) ?? turn.budgetCheck(s.units[c.unit], 'Convert'),
    apply: (s, c, d) => chain(s, [
      x => economy.pay(x, x.units[c.unit].team, economy.conversionOf(d, x.units[c.unit].sbps, c.to).cost),
      x => combat.setMembers(x, c.unit, lifecycle.convertedMembers(x, c.unit, c.to, d)),
      x => lifecycle.convert(x, c.unit, c.to),
      x => turn.spend(x, c.unit, { action: 1 }),
    ]),
  },
  EndTurn: {
    apply: (s, c, d, rng) => chain(s, [x => endTurn(x, d, rng), x => startTurn(x, d, rng)]),
  },
  /** The first turn: { type: 'StartMatch', side: null } (no side moves before it). */
  StartMatch: {
    validate: s => (s.match.side == null ? null : 'already_started'),
    apply: (s, c, d, rng) => startTurn(s, d, rng),
  },
};
