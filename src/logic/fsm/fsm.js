// Generic state machine helper (docs/unit-state.md §3). A machine is data plus pure handlers; one helper runs every
// axis. The concrete axes live in their owning systems; this file knows no state or rule.
//
// StateDef: { allows?: [command], denies?: { command: reason }, enter?(unit, ctx), exit?(unit, ctx),
//             onTurnStart?(unit, ctx), onTurnEnd?(unit, ctx), onStep?(unit, ctx), on?: { event: state | (unit, ctx) => state|null } }
// enter / exit return an effect { unit?, events? } or nothing; hooks return a target state or null.

export const defineMachine = (axis, initial, states) => {
  if (!states[initial]) throw new Error(`machine ${axis}: initial state ${initial} is not defined`);
  return Object.freeze({ axis, initial, states: Object.freeze({ ...states }) });
};

export const stateOf = (machine, unit) => unit.fsm?.[machine.axis] ?? machine.initial;

const applyEffect = (fx, unit, events) => {
  if (!fx) return unit;
  if (fx.events) events.push(...fx.events);
  return fx.unit ?? unit;
};

/** exit old → set state → enter new. Same state: no change, no events. */
export function transition(machine, unit, to, ctx = {}) {
  const from = stateOf(machine, unit);
  if (from === to) return { unit, events: [] };
  if (!machine.states[to]) throw new Error(`machine ${machine.axis}: no state ${to}`);
  const events = [];
  let u = applyEffect(machine.states[from]?.exit?.(unit, ctx), unit, events);
  u = { ...u, fsm: { ...u.fsm, [machine.axis]: to } };
  events.push({ type: 'StateChanged', unit: u.id, axis: machine.axis, from, to });
  u = applyEffect(machine.states[to].enter?.(u, ctx), u, events);
  return { unit: u, events };
}

/** An event name; the current state's `on` table decides the target (none: no change). */
export function send(machine, unit, eventName, ctx = {}) {
  const rule = machine.states[stateOf(machine, unit)]?.on?.[eventName];
  const to = typeof rule === 'function' ? rule(unit, ctx) : rule;
  return to ? transition(machine, unit, to, ctx) : { unit, events: [] };
}

/** Run a phase hook (onTurnStart, onTurnEnd, onStep) of the current state. */
export function runHook(machine, unit, hook, ctx = {}) {
  const to = machine.states[stateOf(machine, unit)]?.[hook]?.(unit, ctx);
  return to ? transition(machine, unit, to, ctx) : { unit, events: [] };
}

/** May the unit perform this command? Every axis may veto; the first veto (in machine order) is returned. */
export function permits(machines, unit, commandType) {
  for (const m of machines) {
    const state = stateOf(m, unit), def = m.states[state];
    if (def.denies?.[commandType]) return { ok: false, axis: m.axis, state, reason: def.denies[commandType] };
    if (def.allows && !def.allows.includes(commandType)) return { ok: false, axis: m.axis, state, reason: `${m.axis}_${state.toLowerCase()}` };
  }
  return { ok: true };
}

/** Every (state, event) pair of a machine → target, for transition-table tests and docs. */
export function table(machine, unit = {}, ctx = {}) {
  const rows = [];
  for (const [state, def] of Object.entries(machine.states)) {
    for (const [event, rule] of Object.entries(def.on || {})) {
      rows.push({ state, event, to: typeof rule === 'function' ? rule({ ...unit, fsm: { ...unit.fsm, [machine.axis]: state } }, ctx) : rule });
    }
  }
  return rows;
}
