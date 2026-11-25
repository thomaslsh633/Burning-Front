# src/logic/store/

**Layer 2 — Game Logic** — Holds the current GameState, runs commands, keeps undo history, notifies listeners (state management, runtime side).

## Owns
- current state + history (undo = previous state)
- dispatch → commands.apply → new state + events
- subscribe(listener(state, events))
- dev mode: freezes state so presentation cannot mutate it

## Public API (planned, exported from `index.js`)
- `createStore(initialState, data, rng)`
- `dispatch(command) → events`
- `getState()`
- `undo()`
- `subscribe(fn)`

## May import
- `logic/*` only (other systems through their `index.js`)

## Must not
- know who listens (app wires listeners)
