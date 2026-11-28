# Unit state model and state-driven architecture

Status: **specification** (2026-11-25). Must be in place before any unit data is wired into the engine
(data import resumes at `docs/data-form-roadmap.md` Phase 2 after this). Rules: `SPEC.md` §10. Layers: `docs/ARCHITECTURE.md`.

## 1. Principles

1. **State-driven, not condition-driven.** A unit's behaviour comes from the states it is in. Each state is a handler
   with `enter` / `exit` effects, the commands it allows, its reactions to turn phases, and its transitions. No system
   asks "if emplaced and not pinned and not loaded and …"; it asks the unit's state machines.
2. **Orthogonal axes.** A unit is in exactly one state on each of six independent axes at once (action, stance,
   morale, location, lifecycle, visibility). Each axis is its own small FSM, owned by one logic system. Together they
   form a hierarchical FSM: lifecycle is the top level; the other axes only run while the unit is `ACTIVE`.
3. **Turn-based "update".** There is no per-frame update in the rules. A state's update hooks are turn phases:
   `onTurnStart`, `onTurnEnd`, and `onStep` (each hex of a move, so reactions can interrupt it).
4. **Pure transitions.** A transition is a pure function: `(unit, event, ctx) → { unit, events }`. `ctx` holds the
   game data, the rest of the state and the seeded rng. Nothing reads the clock, the DOM or `Math.random`.
5. **Derived, not stored.** What depends on who is asking is computed, not kept as a state: cover depends on the
   attacker's direction, and whether a side can see the unit depends on that side's sight. Only facts are stored.

## 2. Layers

| Layer | Folder | Holds | Rule |
| --- | --- | --- | --- |
| Data | `data/schema`, `data/units`, `data/rules` → `services/data` | definitions derived from CoH3: units, entities, weapons, state tuning (setup turns, suppression thresholds, crit chances) | immutable (frozen at load), never changed at runtime |
| Runtime state | `src/logic/state/` (`unit.js`, `match.js`, …) | the mutable simulation: positions, HP per member, ammo, FSM states, budgets, timers | plain serialisable objects; changed only by applying a command or a phase through the store |
| Systems | `src/logic/<system>/` | stateless rule evaluators: movement, vision, combat, suppression (`status`), capture, crew, lifecycle, turn … | pure functions of (state, data, rng); each owns one or more state axes |
| Presentation | `src/presentation/render` (PixiJS), `animation`, `ui`, `audio` | drawing and playback | subscribes to the store (state + events); contains no rules and never changes state |

Flow: `input → controller → store.dispatch(command) → commands.apply → systems (FSM transitions) → { state, events } → presentation`.

## 3. The FSM mechanism (`src/logic/fsm`)

A machine is data plus pure handlers. One generic helper runs every axis.

```js
// src/logic/fsm/index.js (shape; implementation follows in D2)
/** @typedef {{ allows?: string[], denies?: Record<string,string>,
 *              enter?: (unit, ctx) => Effect, exit?: (unit, ctx) => Effect,
 *              onTurnStart?: (unit, ctx) => Transition|null, onTurnEnd?: (unit, ctx) => Transition|null,
 *              onStep?: (unit, ctx) => Transition|null,
 *              on?: Record<string, string | ((unit, ctx) => string|null)> }} StateDef */
export const defineMachine = (axis, initial, states) => Object.freeze({ axis, initial, states });

// transition: exit old → set state → enter new; returns the new unit and the events produced
export function transition(machine, unit, to, ctx) { /* … */ return { unit, events }; }

// handle an event name (e.g. 'SuppressionChanged'); the state's `on` table decides the target
export function send(machine, unit, eventName, ctx) { /* … */ }

// may this unit perform this command? every axis may veto with a reason
export function permits(machines, unit, commandType) { /* → { ok: true } | { ok: false, axis, reason } */ }
```

- **Command validity** is the intersection of all axes: each state lists what it `allows` (whitelist) or `denies`
  (with a reason code). The controller shows the reason; the AI skips the command.
- **Order of phase hooks** at a side's turn start: lifecycle → location → stance → morale → action → visibility.
  At turn end the order is reversed. The order is fixed in `logic/commands/phases.js` (it sequences every owner, which
  `logic/turn` cannot import without cycles) and tested.
- **Each machine has a transition table test**: every (state, event) pair → expected state and events.

## 4. Unit runtime state (`src/logic/state/unit.js`)

```js
{
  id: 'u12', team: 'blue', sbps: 'riflemen_us',          // data reference (read from services/data)
  kind: 'squad',                                          // squad | team_weapon | vehicle | structure
  pos: { c: 4, r: 7 }, facing: 2, turretFacing: 2,        // hex, hull and turret direction (0–5)
  members: [{ ebps: 'rifleman_us', hp: 95 }, …],          // one entry per model; HP per model
  ammo: 18,                                               // per-unit ammunition (SPEC §10)
  xp: 0, rank: 0,
  fsm: { life: 'ACTIVE', location: 'ON_MAP', stance: 'MOBILE', morale: 'NORMAL', action: 'IDLE', visibility: 'REVEALED' },
  budget: { move: 4, action: 1, counter: 0, moved: false, fired: false, shocked: false },
                                                          // move / action reset at own turn start; counter armed at the
                                                          // enemy turn start (moved / fired cleared then); shocked: this
                                                          // turn's action was lost to crew_shocked
  suppression: 0,                                         // points; morale FSM thresholds come from data
  engaged: false,                                         // attacked in its last own turn (or by counter / overwatch since)
  criticals: [],                                          // vehicle conditions: engine_damaged, immobilised, main_gun_damaged, crew_shocked
  timers: { stance: 0, smoke: 0, revealedUntil: 0, reload: 0 },   // turns left for timed states (reload: turn)
  overwatch: null,                                        // { weapon, facing, arc_deg } while in OVERWATCH
  container: null,                                        // building or transport id while GARRISONED / LOADED
  crew: null,                                             // reserved (vehicle crews, §6); team weapon crews are members
  retreatTo: null,                                        // rally point while RETREATING
  marks: {}                                               // repair mark and other short effects (SPEC §7)
}
```

Invariants (tested): `container != null` ⇔ location ∈ {GARRISONED, LOADED}; stance ≠ MOBILE ⇒ kind = team_weapon;
`overwatch != null` ⇔ action = OVERWATCH; life ≠ ACTIVE ⇒ action = EXHAUSTED and no budget.

## 5. State axes

### 5.1 Action FSM — owner `logic/turn`

| State | Meaning | Allows | Enter / exit |
| --- | --- | --- | --- |
| `IDLE` | ready for orders; budget left (move and / or action) | Move, Attack, UseAbility, Emplace, Pack, Board, Build, Repair, Recrew, Hold (MG team only, §5.1.1) | — |
| `MOVING` | resolving a path, one hex per `onStep` | — (in progress) | enter: spend move per hex; each step emits `Moved`; an overwatch trigger can interrupt → back to IDLE / EXHAUSTED at that hex |
| `ATTACKING` | resolving a fire command | — (in progress) | enter: spend action and ammo; emits `Fired`, `ShotHit`, `Damaged`, `Suppressed` …; exit when resolved |
| `OVERWATCH` | emplaced MG team waiting to react during the enemy turn | — | enter: record arc and weapon; first enemy step inside arc, range and sight → reaction fire once → `EXHAUSTED`; exit at own turn start |
| `EXHAUSTED` | nothing left this turn, or the turn ended | — | exits at own turn start → `IDLE` with a fresh budget |

Transitions: IDLE →(Move)→ MOVING →(path done / interrupted)→ IDLE if budget left else EXHAUSTED ·
IDLE →(Attack)→ ATTACKING →(resolved)→ IDLE / EXHAUSTED · IDLE →(Hold)→ OVERWATCH · IDLE →(EndTurn)→ EXHAUSTED ·
OVERWATCH →(triggered)→ EXHAUSTED · any →(own turn start)→ IDLE (unless morale = RETREATING, which runs the retreat move first).
Counter fire is a reaction during the enemy turn; it uses `budget.counter`, not the action state. It is checked like a
command named `Counter`: EXHAUSTED and OVERWATCH permit it; a reloading unit (`timers.reload`) never counters; PINNED, RETREATING, SETTING_UP / PACKING_UP and every state but
ACTIVE veto it; the unit must be able to attack the attacker from where it stands (sight, range, arc, ammo), so a flank
attack outside the weapon arc draws none. Overwatch fire and counter fire draw no counter fire.
A move that triggers overwatch stops on that hex when the mover dies or ends in a morale state listed in
`data/balance/turn.json` (`stops_mover`, PINNED); only the steps taken are paid, and the move cannot be undone.

#### 5.1.1 Overwatch eligibility (SPEC §10)

Only **machine-gun teams** overwatch: a unit of kind `team_weapon` whose main weapon is of class `hmg`
(CoH3 subcategory `heavy_machine_gun`), e.g. M1919, MG42 and Vickers teams.

| Condition | Arc | Fires with |
| --- | --- | --- |
| stance `EMPLACED`, action `IDLE`, did not fire this turn, morale not PINNED / RETREATING, life `ACTIVE` | the weapon's emplaced arc | the HMG, once per enemy turn |

Infantry squads with LMGs, vehicles with coaxial / hull / pintle MGs, mortars, guns, AT weapons, rifles and SMGs
never overwatch; they keep counter fire. This replaces the legacy crew watch fire (SPEC §5).
Eligibility is derived from data (`kind` + weapon `class`); no per-unit flag is needed.

### 5.2 Stance and deployment FSM — owner `logic/crew`

Applies to team weapons (`kind = team_weapon`). Other units stay `MOBILE`.

| State | Meaning | Allows | Transitions |
| --- | --- | --- | --- |
| `MOBILE` | packed, can move and turn | Move, Turn, Emplace, Board (if towable) | Emplace → `SETTING_UP` (spends the rest of the move) |
| `SETTING_UP` | setting up; cannot move or fire | — | at own turn start, after `setup_turns` (data; default 1) → `EMPLACED` |
| `EMPLACED` | anchored; fixed arc; can fire; HMG may overwatch | Attack, Hold (HMG), Pack, UseAbility | Pack → `PACKING_UP` (not after firing this turn, SPEC §5) |
| `PACKING_UP` | packing; cannot fire | — | at own turn start, after `teardown_turns` (data; default 0 = this turn's end) → `MOBILE` |

Received damage −10 % and suppression −20 % while `EMPLACED` (SPEC §5) are effects of the state, read by combat.

**Cover is derived, not a stance.** `coverAgainst(state, unit, attacker)` in `logic/vision` returns `NONE | LIGHT | HEAVY | GARRISON`
from terrain and the edge the shot crosses (directional edge cover, SPEC §10). It is computed per shot and shown in previews.

### 5.3 Location FSM — owner `logic/transport`

| State | Meaning | Allows | Transitions |
| --- | --- | --- | --- |
| `ON_MAP` | on its hex | everything the other axes allow | Garrison → `GARRISONED`; Board → `LOADED` |
| `GARRISONED` | inside a building (`container` = building id) | Attack from the building, Exit | building collapses → infantry die, team weapons destroyed (2026-11-26); Exit → `ON_MAP` |
| `LOADED` | inside a transport (`container` = vehicle id) | Dismount | transport destroyed → `ON_MAP` (casualties from data) |

Stance and location exclude each other: a team weapon must be `MOBILE` to board; only MGs may garrison (SPEC §5).

### 5.4 Morale and suppression FSM — owner `logic/status`

| State | Effects | Transitions |
| --- | --- | --- |
| `NORMAL` | none | suppression ≥ `suppressed_at` → `SUPPRESSED` |
| `SUPPRESSED` | move ×0.5, accuracy ×0.5, no sprint-type abilities | ≥ `pinned_at` → `PINNED`; decays below `recover_at` at own turn start → `NORMAL` |
| `PINNED` | no move except Retreat; accuracy ×0.25; cannot capture; no counter fire; abilities with `requires_unpinned` blocked | decays below `suppressed_at` → `SUPPRESSED`; Retreat → `RETREATING` |
| `RETREATING` | auto-moves ×1.6 toward `retreatTo` at own turn start; no attack, no counter fire; received accuracy ×0.5 (SPEC §4) | within 3 hexes of the rally point → `NORMAL` (suppression cleared); arriving at its turn start it keeps that turn's action |

Thresholds, decay per turn (faster in cover) and the accuracy multipliers are data (`data/rules`). Vehicles and
team weapons in `EMPLACED` use their own thresholds or are immune, as the data says.

### 5.5 Lifecycle FSM — owner `logic/lifecycle` (new)

Top level of the hierarchy: the other axes only run while `ACTIVE`.

| State | Applies to | Meaning | Transitions |
| --- | --- | --- | --- |
| `ACTIVE` | all | normal; may carry **critical conditions** (below) | last crew member dies or the crew abandons it (towed gun) → `DECREWED`; HP 0 → `WRECKED` (vehicles, guns, structures) or removed (infantry) |
| `DECREWED` | towed team weapons | gun left on its hex without a crew, owner `null`; keeps HP, ammo, facing, stance; any side may attack it (CoH3) | an infantry squad recrews → `ACTIVE` under the squad's side; destroyed → `WRECKED` |

Vehicles are always standalone units: they are never abandoned, bailed out or captured (decided 2026-11-26).
| `WRECKED` | vehicles, guns, structures | the unit is removed and a **wreck object** is placed on its hex in the map change overlay (`logic/terrain`): heavy cover for infantry, obstacle for vehicles | cleared by engineers → wreck removed |

**Critical conditions** are a set (`criticals`), not exclusive states, because several can hold at once:
`engine_damaged` (move ×0.5), `immobilised` (no move, can still turn the turret), `main_gun_damaged` (main weapon
disabled), `crew_shocked` (action budget 0 at the next own turn start, cleared at that turn's end). Repair removes them (SPEC §7).
They are set by `logic/combat` on a penetrating hit (chances from data) and read by the other axes' vetoes.

### 5.6 Visibility FSM — owner `logic/vision`

| State | Meaning | Transitions |
| --- | --- | --- |
| `REVEALED` | can be seen by any enemy that has sight of the hex | stealth conditions met at own turn end (in cover / emplaced, did not fire or move) → `CONCEALED` |
| `CONCEALED` | enemies see it only within `detected_hex` (data, CoH3 `camouflage_ext`) | fires, moves (unless data allows) or is detected → `REVEALED`; firing also sets `timers.revealedUntil` (SPEC §10) |

Which side currently sees the unit is derived each time from sight, line of sight and this state.

## 6. Recrew and capture (approved 2026-11-25)

Based on CoH3 `recrewable_ext` and `team_weapon_ext` (checked in `data/source/coh3`): each recrewable weapon lists,
per capturing faction, the squad blueprint it becomes, `min_capture_crew_size` (57 mm AT gun: 2),
`recrew_max_squad_size` (57 mm: 5) and `can_manual_abandon`. Vehicles leave a **wreck** when destroyed
(`wreck_entity_option`, e.g. `sherman_wreck_us`); CoH3's recrewable vehicle blueprints are not used (2026-11-26).

| Rule | Proposal |
| --- | --- |
| Decrew (team weapon) | when the crew's last member dies, the gun stays on its hex as `DECREWED`, owner none, HP / ammo / stance kept. If the gun itself is destroyed first, surviving crew become a small infantry squad |
| Manual abandon | a crew may abandon its gun (action) where the data allows it (`can_manual_abandon`): the gun becomes `DECREWED`, the crew a small infantry squad |
| Recrew / capture | an infantry squad, `IDLE` with its action left, not PINNED or RETREATING, on or next to the hex, spends its action; any squad size (2026-11-28: capacity counts squads, not men; CoH3 `min_capture_crew_size` / `recrew_max_squad_size` are not used). Own or enemy equipment alike: capturing is recrewing |
| Result: team weapon | the squad becomes the crew (all its members); the gun turns `ACTIVE` under the squad's side as that faction's capture blueprint; stance `MOBILE` (must set up again); veterancy reset; ammo kept |
| Wrecks | `WRECKED` vehicles become terrain: heavy cover (green) for infantry, as a wreck object in the map change overlay (2026-11-26), block vehicle movement, infantry may pass; engineers clear them (action, `clear_turns` from data); a recovery vehicle may tow them |
| Denial | as in CoH3, a `DECREWED` gun is an ownerless target: any side (its old owner too) may attack it; at 0 HP it is removed and leaves a wreck |
| Upkeep and population | captured equipment counts for its new owner from the next turn |
| Later (optional) | dropped weapons picked up by squads, CoH3 `unequip_weapons_on_death` + `entity_inventory_ext`: only weapons from upgrades / weapon slots (LMGs, launchers), never team weapons or a unit's base armament (decided 2026-11-26) |

Events: `CrewWiped`, `Abandoned`, `Recrewed`, `Captured`, `Wrecked`, `WreckClearing`, `WreckCleared`.

Built in D2-7 (`logic/lifecycle/crewing.js`, routes `Recrew`, `Abandon`, `ClearWreck`):
- Recrew of team weapons, own or enemy: the squad's living men become crewmen of the capturing faction's blueprint (HP kept,
  capped at the crew entity's HP); the squad unit is removed. A crew without its gun counts as men on foot and may recrew.
  `Recrewed` is emitted for both cases (the previous owner is not stored).
- Abandon: the living crew steps onto the first free neighbouring hex as a new unit of the same blueprint without the gun
  (`state.spawnUnit`); without a free hex the order is refused (`no_room`). A crew whose gun is gone (abandoned or
  destroyed) fights with its own small arms, cannot emplace and leaves no wreck when it dies.
- Wreck clearing: units whose squad `role` is in `data/rules/terrain.json` `wreck_clearing.roles` (engineers) spend their
  action on or next to a wreck; the wreck goes after its `clear_turns` turns of work (vehicle 2, emplacement 1).
- Crewless guns are ownerless targets: any side may attack them (no counter fire, no suppression, no XP); shells landing
  on their hex hit them too.
- Not yet: dropped weapon pickups.

## 7. Ownership summary

| Axis / concern | System (folder) | Stored in unit | Data it reads |
| --- | --- | --- | --- |
| Action FSM, budgets, overwatch eligibility, reload | `logic/turn` | `fsm.action`, `budget`, `overwatch`, `timers.reload` | weapon classes, move points |
| Stance FSM | `logic/crew` | `fsm.stance`, `timers.stance` | `setup_turns`, `teardown_turns`, arcs |
| Location FSM | `logic/transport` | `fsm.location`, `container` | capacities, garrison rules |
| Morale FSM, suppression points, veterancy, engaged | `logic/status` | `fsm.morale`, `suppression`, `retreatTo`, `xp`, `rank`, `engaged` | thresholds, decay, multipliers, veterancy sets |
| Lifecycle FSM, criticals, recrew, wrecks | `logic/lifecycle` | `fsm.life`, `criticals`, `crew`, `team`, `sbps` (a captured gun takes its new blueprint) | recrewable data, crit chances, wreck rules |
| Visibility FSM | `logic/vision` | `fsm.visibility`, `timers.revealedUntil` | stealth data, sight |
| Position and facing | `logic/movement` | `pos`, `facing`, `turretFacing` | move points, pass types, terrain costs |
| Cover (derived) | `logic/vision` | — | terrain, edges, cover tables |
| Damage, hits, crit rolls | `logic/combat` | `members[].hp`, `ammo` (via events) | weapons, armour, cover |
| Generic machine helper | `logic/fsm` | — | — |

The "Stored in unit" column is also code: `src/logic/state/ownership.js` (`UNIT_FIELD_OWNERS`). Change both together.
`timers.smoke` and `marks` have no owner yet; the system that first writes one adds its row here and there.
Each system's apply test checks it with `assertOwnsOnly` (`tests/helpers/ownership.js`).

## 8. What this means for data

The data forms gain the state tuning they need, all CoH3-derived where CoH3 has it:
weapon `class` (overwatch eligibility), `emplace.setup_turns` / `teardown_turns` (CoH3 `setup.duration`,
`teardown.duration` → turns), unit `stealth` (CoH3 `camouflage_ext`), `recrew` block on team-weapon and
recrewable-vehicle entities (CoH3 `recrewable_ext`: capture blueprint per faction, min crew, max squad size,
manual abandon), `wreck` (CoH3 `wreck_entity_option`), and `data/rules` tables for suppression thresholds and
critical chances. These are added to the schemas in data Phases 2–4.

## 9. Status flags

What the HUD marks and rules read is listed in `data/rules/status-flags.json`: each flag is either **stored** in the unit
(e.g. `reloading`, `repairing`, `engaged`, critical conditions) or **derived** from the six axes and stored values
(e.g. `emplaced` = stance EMPLACED, `low_ammo` = ammo ≤ share of capacity, `pinned` = morale PINNED). Derived flags are
never stored twice. Each flag names its owner system, what clears it and its HUD icon priority.
