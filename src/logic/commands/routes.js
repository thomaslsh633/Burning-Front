// Which system handles each command, and the unit state machines every unit command must pass.
// A route only sequences the owning systems' functions; it holds no rule itself.
//
// route: { validate(state, cmd, data) → reason | null, apply(state, cmd, data, rng) → { state, events },
//          unit?: true (cmd.unit must be an own unit and every axis must permit cmd.type), undoable?: true }
import * as movement from '../movement/index.js';
import * as turn from '../turn/index.js';
import * as vision from '../vision/index.js';

/** Unit axes in hierarchy order (lifecycle first); filled as their owning systems ship. */
export const MACHINES = [turn.ACTION, vision.VISIBILITY];

const moveCost = (s, c, d) => movement.reachable(s, d, c.unit, { reverse: !!c.reverse }).get(`${c.to.c},${c.to.r}`)?.cost ?? 0;

export const ROUTES = {
  Move: {
    unit: true, undoable: true,
    validate: (s, c, d) => movement.validateMove(s, c, d) ?? turn.budgetCheck(s.units[c.unit], 'Move', moveCost(s, c, d)),
    apply(s, c, d) {
      const m = movement.applyMove(s, c, d);
      const t = turn.spend(m.state, c.unit, { move: m.cost });
      const v = vision.revealOnMove(t.state, c.unit);
      return { state: v.state, events: [...m.events, ...t.events, ...v.events] };
    },
  },
  Turn: {
    unit: true, undoable: true,
    validate: (s, c, d) => movement.validateTurn(s, c, d) ?? turn.budgetCheck(s.units[c.unit], 'Turn', movement.turnCost(s.units[c.unit], d, c.facing)),
    apply(s, c, d) {
      const m = movement.applyTurn(s, c, d);
      const t = turn.spend(m.state, c.unit, { move: m.cost });
      return { state: t.state, events: [...m.events, ...t.events] };
    },
  },
};
