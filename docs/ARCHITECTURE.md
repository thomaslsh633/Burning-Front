# Burning Front — Architecture

A game is many responsibilities running at once: reading taps, applying rules, keeping state, drawing,
animating, playing sound, saving, thinking for the AI, and loading data and assets. Each of these gets
**its own folder with one owner**, and the folders sit in three layers. Calls go **down** only.

The frozen v214 game is in `legacy/`. It builds on its own (`npm run legacy:build`) and is a **gameplay reference
only**: unit stats, weapon values and mechanics come from the CoH3 data (`data/source/coh3`), converted for turns and hexes.
Units are state-driven: every unit runs six orthogonal state machines (`docs/unit-state.md`). No code is copied from it except the 3D
meshes (`presentation/models`).

## Layers

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ app/  composition root: boot, wiring, screen flow, frame loop (no rules)     │
└──────────────────────────────────────────────────────────────────────────────┘
          │ creates and connects everything below
┌──────────────────────────────────────────────────────────────────────────────┐
│ Layer 1  INPUT / PRESENTATION                         src/presentation/        │
│  input → controller ──command──┐        render · animation · ui · audio      │
│                                │              ▲ read state, play events      │
└────────────────────────────────┼──────────────┼──────────────────────────────┘
                                 ▼              │
┌──────────────────────────────────────────────────────────────────────────────┐
│ Layer 2  GAME LOGIC (pure: no DOM, no clock, no Math.random)   src/logic/      │
│  store ─▶ commands.apply ─▶ owning system ─▶ { state, events }               │
│  state · events · fsm · hex · movement · vision · combat · crew · status      │
│  lifecycle · capture · economy · build · skills · transport · turn            │
│  victory · ai                                                                 │
└──────────────────────────────────────────────────────────────────────────────┘
          ▲ data and rng are passed in as arguments
┌──────────────────────────────────────────────────────────────────────────────┐
│ Layer 3  DATA / SERVICE                                       src/services/    │
│  data · assets · save · storage · rng · clock · i18n                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

Logic does not import services. Services and data come in as arguments (`apply(state, command, data, rng)`), so
every rule runs in a Node test with plain objects.

## Where each responsibility lives

| Responsibility | Folder(s) | Layer |
| --- | --- | --- |
| Input | `presentation/input` (gestures → intents), `presentation/controller` (intent → command, UiState) | 1 |
| Game rules | `logic/hex` … `logic/victory`, one folder per rule area; `logic/commands` routes each command to its owner | 2 |
| Unit states | six FSM axes on every unit, generic helper `logic/fsm`; each axis owned by one system (`docs/unit-state.md` §7) | 2 |
| State management | `logic/state` (GameState shape, selectors), `logic/store` (current state, dispatch, undo, subscribe); UI-only state is `UiState` in `presentation/controller` | 2 / 1 |
| UI | `presentation/ui` (HUD, menus, screens), `presentation/render` (canvas) | 1 |
| Animation | `presentation/animation` (event player, ViewModel) | 1 |
| Sound | `presentation/audio` (event → cue), files loaded by `services/assets` | 1 / 3 |
| Save / load | `services/save` (schema, version, migrate), `services/storage` (localStorage) | 3 |
| AI | `logic/ai` (`decide(state, team, data, rng) → command[]`) | 2 |
| Resource management: game data | `services/data` (load, validate, look up `data/generated`) | 3 |
| Resource management: assets | `services/assets` (fonts, images, sprites, sounds: load, cache, release) | 3 |
| Resource management: in-game resources | `logic/economy` (manpower, munitions, fuel, upkeep, production) | 2 |
| Randomness, time, text | `services/rng`, `services/clock`, `services/i18n` | 3 |

Each folder has a `README.md` with what it owns, its planned public API, what it may import and what it must not do.

## One action, end to end

An attack, from tap to sound:

1. `input` sees a tap on a hex → intent `tapHex(c, r)`.
2. `controller` is in mode `unitSelected`; it asks `logic/combat.canAttack(...)` and, if allowed, switches to
   `attackPreview` with `previewAttack(...)` (the flashing HP-bar loss).
3. A second tap → `store.dispatch({ type: 'Attack', attackerId, targetId })`.
4. `store` → `commands.apply` → `combat.resolveAttack` returns the new state and events:
   `Turned, Fired, ShotHit, PenetrationFailed, Damaged, Suppressed, ModelKilled, CounterFired`.
5. `store` notifies its listeners. `app` wired them: `animation.play(events)`, `audio.onEvents(events)`,
   `ui.update(...)`, the battle log (`i18n.logLine(event)`), and autosave (`save` + `storage`).

No step reaches across: the animation never knows how damage was computed, and the rule never knows it is animated.
The AI follows the same path from step 3, with commands from `ai.decide` instead of the controller.

## Rules (checked by `npm run check`)

| From | May import |
| --- | --- |
| `app/` | everything |
| `presentation/` | `presentation/`, `logic/`, `services/` |
| `logic/` | `logic/` only |
| `services/` | `services/` only |

- Another system is imported only through its `index.js`; files inside a system are private to it.
- No package imports (offline PC, no dependencies). One exception: PixiJS, vendored and version-pinned in
  `presentation/render/vendor/`, imported by relative path from `presentation/render` only.
- `logic/` and `services/rng/` may not use `document`, `window`, `localStorage`, `fetch`, `Math.random`, `Date`,
  `performance`, timers or `requestAnimationFrame`.
- No wrappers and no monkey-patching. A behaviour change edits the one function that owns it.
- Files are named by responsibility, never by version. History lives in `CHANGELOG.md` and git.
- Presentation never changes GameState; it sends commands through the store (the store freezes state in dev).

`tools/check-layers.js` enforces the import and global rules; its tests are in `tests/tools/`.

## Data

Data is plain JSON: numbers, ids and translation keys, never functions or display text. The game reads final
values from `data/generated/`; nothing is patched at load time.

```text
data/
  schema/          field definitions (JSON Schema), checked at build
  source/coh3/     raw CoH3 files, untouched
  source/burning-bridges/  notes on turn mechanics (reference only, no assets copied)
  balance/         turn scale and tuning
  factions/ units/ entities/ weapons/ upgrades/ abilities/ veterancy/
  rules/           terrain, cover, buildings, closed vocabularies
  maps/  presentation/  i18n/
  generated/       built by the derive pipeline, never hand-edited
  legacy-snapshot/ values dumped from v214, gameplay reference (differences are reported, not errors)
```

Shared pieces every form is built from:

- `Band3` `{ near, mid, far }` — accuracy, penetration, damage falloff
- `Resources` `{ manpower, munition, fuel }` — cost, upkeep, income (omit zeros)
- `Mods` `{ accuracy, damage, penetration, suppression }` — cover, target type, veterancy, conditions
- ids are strings (`riflemen_us`), text is an i18n key, distances are hexes (`_hex`), time is turns (`_turns`)

A **unit** (CoH3 squad, the thing on a hex) holds cost, pop and members, plus optional component blocks:
`move`, `vision`, `attack`, `capture`, `build`, `transport`, `crew`, `stealth`, …. Each block is owned by
exactly one logic system, so a unit without `build` simply cannot build. An **entity** (CoH3 entity, one
member) holds HP, armour front / side / rear, target size and weapons.

Turn rule for the rewrite: today's SPEC rule (move points, one attack, one counter). The action budget lives
in `logic/turn` alone, so an AP model can replace it later without touching other systems.

## Layout

```text
src/
  app/
  presentation/  input  controller  render  models  animation  ui  audio  greybox (art-free debug view, stage G)
  logic/         state  store  commands  events  fsm  hex  movement  vision  combat  crew
                 status  lifecycle  capture  economy  build  skills  transport  turn  victory  ai
  services/      data  assets  save  storage  rng  clock  i18n
data/            (above)
tools/           check-layers.js, validate.js + profiles.js (schemas), build-data.js (base + units + mods → generated),
                 data-links.js, mods.js
  lib/           config.js (the one reader of data/balance), coh3.js (CoH3 source helpers + loadSource)
  coh3/          fetch, census, roster.js (pure roster decisions), catalog + barrages (reports only)
  import-coh3/   convert.js (pure record conversion), fire-rate.js, indirect.js, import.js → data/base
  coh3stats/  vocab/  oracle/
tests/           node --test, mirrors src/ and tools/
docs/            this file
legacy/          frozen v214, builds on its own
```

## Next

1. Snapshot v214 values into `data/legacy-snapshot/` (gameplay reference). Done.
1a. Unit state model and system taxonomy (`docs/unit-state.md`). Done; required before any data is wired in.
2. Write `data/schema` for unit, entity and weapon forms; build the derive pipeline until it reproduces the snapshot.
3. Logic systems bottom up (`hex` → `movement` / `vision` → `combat` …), each with Node tests; FSM transition tables tested per axis.
4. Presentation and app; the game becomes playable on `src/`.
5. New build script for `src/` (one HTML, tiny module registry), running `check` and `test` first.
