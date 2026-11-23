# Burning Front (hex tactics) — working rules

Single-file HTML mobile (landscape) hex tactics game. The user chats in Korean;
write code, comments and identifiers in English. Player-visible text goes in `data/i18n/ko.json`.

The game is being rewritten in `src/` (plan: the "Burning Front — Architecture Reset Plan" doc, tabs
"Architecture plan" and "Rewrite roadmap"). `legacy/` is the frozen v214 game: **never edit it**; it is only
built and run as the oracle that new rules are compared against.

## Start of every task
1. Read `CODEMAP.md` (layers, folders, every file with its one-line purpose).
2. Gameplay rules in force: `SPEC.md`. If a request conflicts with it, say so before changing.
3. Old behaviour you need to reproduce: look it up in `legacy/` with `node legacy/tools/where.js <name>`
   (see `legacy/CODEMAP.md`); read only the lines around the hit.

## Architecture rules (build.js refuses a build that breaks 1–3)
1. Layers, calls only go down: `input` / `view` → `app` → `core` → `data`. Allowed imports:
   core → core, data · services → services, core, data · app → app, core, services, data ·
   input → input, services · view → view, core, services, data · `src/main.js` wires everything.
2. `src/core/` is pure game rules: no `window`, `document`, `localStorage`, `Date`, `performance`, timers,
   `console` or `Math.random`. Rules take `(state, command, data, rng)` and return new state + events.
3. Plain ES modules with relative paths and the extension (`'./fsm.js'`); no packages, no dynamic `import()`,
   no import cycles.
4. **Explicit state.** Every state is an enum + transition table built with `src/core/fsm.js`
   (`enumOf`, `defineMachine`, `step`, `can`). No boolean flag sets (`isPaused && !isGameOver`), no
   stringly-typed modes outside an enum. An aspect that follows from a number (pinned from suppression) is
   computed, not stored.
5. One folder per system, one file per responsibility. Inside a `core/` system: `state.js` (enums + tables),
   `formulas.js` (pure math), `queries.js` (read-only checks), `commands.js` (validate + apply → events).
   Files are named by what they do, never by version. No wrappers, no monkey-patching.
6. Numbers a designer tunes go in `data/balance/`; text a player reads goes in `data/i18n/`.
7. Every `core/` and `app/` module gets a test in `tests/` (same path, `.test.js`). Each state machine's
   test walks its listed transitions and checks that unlisted ones throw.

## Build and check
- `node build.js` → runs every `tests/**/*.test.js`, checks the layer rules, writes
  `dist/burning_front_<VERSION>.html`. `--no-test` skips tests, `--test-only` skips the HTML.
- `node tools/codemap.js` after adding, removing or renaming files (refreshes the file table in CODEMAP.md).
- New file: first line is a `//` comment saying what the file owns (CODEMAP shows it).
- Changed a rule? Update its line in `SPEC.md` in the same change.
- Bump `VERSION` once per delivered build (`R0`, `R1`, … for rewrite builds); add a short CHANGELOG entry.
- Must run on Node 20 (the user's offline PC): no Node 22-only APIs, `node --test` gets explicit file paths.
