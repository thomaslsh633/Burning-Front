# CODEMAP

## How the code runs
- `build.js` bundles `src/main.js` and everything it imports into one classic script (a small module registry,
  `tools/build/bundle.js`), inlines `src/view/styles/*.css` (name order) into `src/index.html`, and writes
  `dist/burning_front_<VERSION>.html`. Tests run first; `tools/build/check.js` enforces the layer rules.
- Boot: `src/main.js` creates the App state (`src/app/app.js`), the board renderer and the screen switcher,
  then `boot()` sends `loaded` (Boot → Lobby). Screens follow the App state; nothing else switches them.
- The frozen v214 game lives in `legacy/` with its own `build.js`, `CODEMAP.md` and tools.

## Layers
| layer | folder | owns | may import |
|---|---|---|---|
| Game Logic | `src/core/` | rules as pure functions, game state, state machines | core, data |
| App | `src/app/` | App state machine, controller and interaction modes, match flow, undo | app, core, services, data |
| Input | `src/input/` | pointer and gesture recognition → intents | input, services |
| Presentation | `src/view/` | rendering, effects, HUD and screens | view, core, services, data |
| Services | `src/services/` | rng, clock, storage, save, i18n, audio | services, core, data |
| Data | `data/` | numbers and text only (JSON) | — |
| Wiring | `src/main.js` | connects the layers | everything |

## State machines
| machine | file | states |
|---|---|---|
| App (game level) | `src/app/app-state.js` | Boot, Lobby, Setup, Loading, Playing, Paused, TurnCurtain, GameOver, Result |

Planned (roadmap): TurnPhase (`core/turn/state.js`), InteractionMode (`app/modes/`), unit aspects
(`core/unit/state.js`, `core/crew/state.js`), structure life (`core/build/state.js`), point control
(`core/capture/state.js`), match result (`core/victory/state.js`), fx playback (`view/fx/state.js`).

## Tools
| command | what it does |
|---|---|
| `node build.js` | tests + layer check + `dist/burning_front_<VERSION>.html` |
| `node build.js --test-only` | run the tests only |
| `node tools/codemap.js` | refresh the file table below |
| `node legacy/build.js` | build the frozen v214 game (oracle) |
| `node legacy/tools/where.js <name>` | find a v214 function |

## Files
<!-- AUTO:FILES -->
### Game (src/)

| file | lines | owns |
|---|---:|---|
| `src/app/app-state.js` | 26 | Game-level state: the whole app is in exactly one App state. Screens, input and rendering switch on it. |
| `src/app/app.js` | 20 | Holds the current App state. send(event) is the only way to change it; listeners hear every change. |
| `src/app/boot.js` | 7 | Boot: load what the game needs, then enter the lobby. Data loading arrives in Phase 1. |
| `src/core/fsm.js` | 60 | Explicit state machines: an enum of states plus a transition table. |
| `src/index.html` | 20 |  |
| `src/main.js` | 27 | Entry point: wires services, app, input and view together. The only file allowed to import every layer. |
| `src/services/i18n.js` | 17 | Player-visible text. Strings live in data/i18n/<lang>.json, never in code. |
| `src/view/render/renderer.js` | 22 | Board canvas: sizes itself to the window at device pixel ratio and draws the frame. |
| `src/view/styles/00_base.css` | 56 | Base frame and theme tokens. Angular UI: radius <= 2px; borders cream > matte grey bevel > blue-grey plate. |
| `src/view/ui/dom.js` | 13 | Small DOM helper for UI components: el('button', { class: 'btn', onclick }, 'text'). |
| `src/view/ui/screens/index.js` | 20 | Picks the screen for the current App state and swaps it in. Knows nothing about transitions: |
| `src/view/ui/screens/lobby.js` | 17 | Lobby screen: title, version and the match entry buttons. Buttons only report the player's choice. |
| `src/view/ui/screens/placeholder.js` | 16 | Stand-in for a screen that is not built yet: shows the state name and one button per allowed event, |

### Data (data/)

| file | lines | owns |
|---|---:|---|
| `data/i18n/ko.json` | 31 | data |

### Tests (tests/)

| file | lines | owns |
|---|---:|---|
| `tests/app/app-state.test.js` | 59 | App machine: the drawn game-level states, reachability, refused combinations, listeners. |
| `tests/core/fsm.test.js` | 55 | State machine helper: enums, tables, guarded steps, refused events. |
| `tests/tools/build.test.js` | 99 | Bundler and architecture guard: builds small module trees in a temp folder and runs the bundle in a sandbox. |
<!-- /AUTO:FILES -->
