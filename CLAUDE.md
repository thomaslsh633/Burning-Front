# Burning Front (hex tactics) — working rules

Turn-based hex tactics for mobile (landscape), one HTML file. Turn and combat mechanics follow Burning Bridges;
unit and weapon characteristics follow CoH3. The user chats in Korean; write code, comments and identifiers in English.

The game is being rewritten in `src/`. `legacy/` is the frozen v214 game (its own `CLAUDE.md` applies there;
no new features in it).

## Start of every task
1. Read `docs/ARCHITECTURE.md` (layers, where each responsibility lives, rules) and, for anything about units,
   `docs/unit-state.md` (the six state axes and who owns each).
2. Read the `README.md` of the system folder the task touches; it says what the system owns and must not do.
3. Gameplay rules: `SPEC.md` (read the section the task touches). If a request conflicts with it, say so before changing.
4. Old behaviour or numbers: look in `legacy/` (`node legacy/tools/where.js <name>` from `legacy/`); never copy its wrappers.

## Rules for changes
- Put code in the system that owns the behaviour. If no system owns it, propose a new folder before writing code.
- Three layers, calls go down only: presentation → logic; presentation → services; logic → logic only; services → services only.
  `app/` wires them and holds no rules.
- Import another system only through its `index.js`.
- `src/logic/` is pure: no DOM, storage, clock, timers or `Math.random`. Data and rng come in as arguments.
  A player action is a command; applying it returns `{ state, events }`. Presentation plays the events.
- No wrappers, no monkey-patching, no patching data at load time. Edit the one function that owns the behaviour.
- Name files by responsibility, never by version. Version history goes in `CHANGELOG.md`.
- Unit behaviour comes from state machines: add or change a state handler in the owning system, never an if/else chain.
- Unit numbers come from CoH3 (`data/source/coh3`); v214 is a gameplay reference, not a data baseline.
- Numbers a designer tunes go in `data/balance/` or the data forms; player-visible text goes in `data/i18n/`.
- Every logic function gets a Node test in `tests/` (mirrors `src/`).
- Changed a rule? Update its line in `SPEC.md` in the same change.

## Check
- `npm run check` — layer and purity rules, every data file against its schema and word lists (`tools/validate.js`,
  `data/schema/index.json`), and CoH3 word coverage (`tools/vocab/sync.js --check`). New data file → add it to the index.
- `npm test` — all tests (`node --test`).
- `npm run legacy:build` — builds the v214 reference into `legacy/dist/`.
