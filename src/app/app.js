// Holds the current App state. send(event) is the only way to change it; listeners hear every change.
import { step, eventsFrom } from '../core/fsm.js';
import { AppMachine } from './app-state.js';

export function createApp(machine = AppMachine) {
  let state = machine.initial;
  const listeners = new Set();
  return {
    get state() { return state; },
    allowedEvents: () => eventsFrom(machine, state),
    send(event, data) {
      const prev = state;
      state = step(machine, state, event, data);
      for (const fn of listeners) fn(state, prev, event);
      return state;
    },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  };
}
