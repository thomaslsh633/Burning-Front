// Explicit state machines: an enum of states plus a transition table.
// Every state change in the game goes through step(); an event the table does not list is an error.

export class InvalidTransition extends Error {
  constructor(machine, state, event) {
    super(`${machine}: no transition for '${event}' in state '${state}'`);
    this.name = 'InvalidTransition';
    this.machine = machine;
    this.state = state;
    this.event = event;
  }
}

// enumOf('Idle', 'Move') -> frozen { Idle: 'Idle', Move: 'Move' }
export function enumOf(...names) {
  const seen = new Set();
  for (const n of names) {
    if (typeof n !== 'string' || !n) throw new TypeError('enum names must be non-empty strings');
    if (seen.has(n)) throw new TypeError(`duplicate enum name '${n}'`);
    seen.add(n);
  }
  return Object.freeze(Object.fromEntries(names.map(n => [n, n])));
}

// transitions: { State: { event: NextState | (data) => NextState } }
// A state with no entry in transitions is final.
export function defineMachine(name, { states, initial, transitions }) {
  const valid = new Set(Object.values(states));
  if (!valid.has(initial)) throw new TypeError(`${name}: initial state '${initial}' is not one of its states`);
  const table = {};
  for (const [from, events] of Object.entries(transitions)) {
    if (!valid.has(from)) throw new TypeError(`${name}: transitions list unknown state '${from}'`);
    for (const [event, to] of Object.entries(events)) {
      if (typeof to !== 'function' && !valid.has(to)) throw new TypeError(`${name}: '${from}' --${event}--> unknown state '${to}'`);
    }
    table[from] = Object.freeze({ ...events });
  }
  return Object.freeze({ name, states, initial, table: Object.freeze(table) });
}

export function can(machine, state, event) {
  const events = machine.table[state];
  return !!events && Object.prototype.hasOwnProperty.call(events, event);
}

// Events that are allowed in a state, in table order.
export function eventsFrom(machine, state) {
  return Object.keys(machine.table[state] || {});
}

export function step(machine, state, event, data) {
  if (!can(machine, state, event)) throw new InvalidTransition(machine.name, state, event);
  const target = machine.table[state][event];
  const next = typeof target === 'function' ? target(data) : target;
  if (!Object.prototype.hasOwnProperty.call(machine.states, next)) {
    throw new TypeError(`${machine.name}: '${state}' --${event}--> returned unknown state '${next}'`);
  }
  return next;
}
