// The current GameState, dispatch, undo and listeners. The random generator is rebuilt from state.rng for every
// command and its state written back, so undo and saved games replay the same rolls.
import { apply } from '../commands/index.js';

function deepFreeze(o) {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const v of Object.values(o)) deepFreeze(v); }
  return o;
}

/**
 * initial: GameState · data: game data · opts: { rngFrom(state integer) → rng (services/rng, injected by app),
 * routes?, machines? (tests), freeze? (dev: presentation cannot mutate state) }.
 * Undo: only commands whose route is undoable (moves); any other command clears the history.
 */
export function createStore(initial, data, { rngFrom, routes, machines, freeze = false }) {
  let state = freeze ? deepFreeze(initial) : initial;
  let history = [];
  const listeners = new Set();
  const notify = events => { for (const fn of listeners) fn(state, events); };

  return {
    getState: () => state,
    dispatch(cmd) {
      const rng = rngFrom(state.rng);
      const r = apply(state, cmd, data, rng, routes, machines);   // undefined → the real route table
      if (r.error) return { error: r.error };
      history = r.undoable ? [...history, state] : [];
      state = { ...r.state, rng: rng.state() };
      if (freeze) deepFreeze(state);
      notify(r.events);
      return { events: r.events };
    },
    canUndo: () => history.length > 0,
    undo() {
      if (!history.length) return false;
      state = history.at(-1);
      history = history.slice(0, -1);
      notify([]);
      return true;
    },
    /** Replace the state outside a command (load a save, run a turn phase); clears undo. */
    replace(next, events = []) { state = freeze ? deepFreeze(next) : next; history = []; notify(events); },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  };
}
