# Burning Front — Game Design (planning draft)

Status: **working draft** (2026-11-25). The final plan is `docs/game-plan.ko.md`; where they differ (campaign structure), the final plan wins. Marks used below:
**[Decided]** = you decided it or it is in `SPEC.md` · **[Proposed]** = my call, open to change · **[Open]** = needs your answer.

Related: `SPEC.md` (rules in force), `docs/ARCHITECTURE.md` (code), `docs/data-form-roadmap.md` (unit data, after this plan).

---

## 1. Overview

| | |
| --- | --- |
| Genre | Turn-based tactics on a hex grid, isometric view **[Decided]** |
| Setting | World War II, several theatres and years; place and date belong to each map's briefing (SPEC §9) **[Decided]** |
| Platform | Mobile, landscape, one offline HTML file **[Decided]** |
| Modes | Solo campaign · 1 vs 1 on one device (two players take turns) **[Decided]** |
| Factions | Wehrmacht, US Forces, Afrikakorps, British Forces; unit numbers from CoH3, tuned to Burning Front rules **[Decided]** |
| Turn and combat model | Burning Bridges style: sides alternate whole turns, every unit acts once per turn **[Decided]** |
| Direction | Dynamic combat with the feel of CoH3 (suppression, cover, flanking, reactions, destruction), fully playable on a phone **[Decided]**; rules and controls in §19–20 |
| Victory | Set per map / mission: (1) capture points and drain the enemy's victory points, or (2) deploy with a starting budget and complete mission objectives (destroy, capture, escort, reach) **[Decided]** |
| Session length | One mission or match 20–40 minutes, a turn under about a minute **[Proposed]** |

**Pitch [Proposed]:** *Command a WWII company one turn at a time. Every hex, hedge and hull angle matters. Read the
odds, set up the crossfire, and win the objective before the enemy's guns find you.*

## 2. Design pillars [Proposed]

Every feature should serve at least one of these. A feature that serves none is cut.

1. **Readable tactics.** On a phone screen, one glance shows who can shoot whom, from where, with what chance.
   The preview and the result use the same formula (ARCHITECTURE: one `hitChance`).
2. **Combined arms.** Infantry, crew weapons, tanks and artillery each beat something and lose to something;
   CoH3 data provides the counters, the hex rules make them visible (facing, cover, range bands).
3. **Ground matters.** Cover, buildings, sight lines, roads, bridges and elevation decide fights more than unit count.
4. **Short, complete sessions.** A mission or match fits a commute; autosave means nothing is lost.

## 3. Elements a full game plan needs

The checklist of planning areas, with where each one stands. Sections below cover the ones marked in this document.

| Area | Status | Where |
| --- | --- | --- |
| Concept, pillars, target player | draft | §1–2, §17 |
| Setting and story | **3 options, your choice** | §4 |
| Game modes | draft | §5 |
| Victory and mission rules | draft (your two types + additions) | §6 |
| Core loops (turn / mission / campaign) | draft | §7 |
| Gameplay mechanics | mostly in SPEC; gaps listed | §8 |
| Factions and doctrines | draft | §9 |
| AI opponent (needed for the campaign) | **new: does not exist yet** | §10 |
| Maps and theatres | draft | §11 |
| Campaign structure and progression | draft | §12 |
| UI / UX, onboarding, accessibility | draft | §13 |
| Art and audio direction | draft | §14 |
| Technology, tools, content pipeline | draft | §15 |
| Success factors and risks | draft | §16 |
| Scope, MVP and milestones | draft | §17 |
| Legal / IP, audience and distribution | **open** | §16, §18 |

## 4. Setting and story

### Frame [Proposed]

- Four theatres, in time order: **North Africa 1942–43**, **Italy 1943–44**, **Normandy 1944**, **Ardennes 1944–45**.
  Natural pairings: British ↔ Afrikakorps (desert), US ↔ Wehrmacht (Europe); Italy mixes all four.
- Fictional characters and units in historically grounded operations. No real person speaks; real places and dates
  appear in briefings.
- Tone: grounded and personal: the company, its losses, the ground it must take. No glorification of either side.
  German factions are shown at the level of soldiers and operations; no swastika or Nazi symbolism
  (factions use the iron cross on red, SPEC §9). This also matters for app-store and German-market rules if the game is ever released.
- Story, characters, maps and missions are original. CoH3 supplies unit statistics only. Burning Bridges supplies
  rule ideas only; its story, levels, art and sounds are not used.

### Campaign perspective: option B **[Decided 2026-11-25]**

B was chosen: two sides of each front, missions alternating between the two commanders of a theatre.
The table keeps the options for reference.

| Option | What it is | Gains | Costs |
| --- | --- | --- | --- |
| **A. One company, whole war** | One Allied company (US, later joined by British) from Tunisia to the Ardennes. The enemy is AI. | Strong attachment to the same units and characters; simplest to write | German factions only playable in 1 vs 1 |
| **B. Two sides of each front** *(my pick)* | Each theatre is a chapter told from both sides: a British and an Afrikakorps commander in the desert, a US and a Wehrmacht commander in Europe. Missions alternate, and their paths cross (one side's defeat is the next mission's starting position). | All four factions playable in the campaign; each mission teaches one faction; the crossing gives the story a hook | Needs AI for all four factions; tone needs care |
| **C. Operations anthology** | Stand-alone missions grouped by theatre, no continuing characters. | Cheapest to produce and to extend later | Weakest pull to keep playing |

### Story delivery [Proposed]

- **Briefing:** map overview, place and date, objectives, a short text from the commander (portrait + 3–5 lines).
- **In mission:** trigger messages (radio lines, 1–2 sentences) on events: reinforcements, objective changed,
  enemy counter-attack. Text only at first; voice is out of scope.
- **Debriefing / AAR:** result, losses, veterans, stars, and one line that leads into the next mission.

## 5. Game modes

### Campaign (solo) [Decided, structure Proposed]

- Chapters by theatre, about 4–6 missions each; the first chapter starts with 2–3 tutorial missions.
- Mission rules and objectives come from mission data (§6). The opponent is the AI (§10).
- Replay any finished mission for more stars.

### 1 vs 1 on one device [Decided]

- Two players pass the device; the turn curtain hides the board between turns (SPEC §2).
- Choose map, mode (VP capture or annihilation; mission scenarios later), factions, start resources.
- Fog of war is per player; the curtain is what makes it fair.

### Later [Proposed]

- **Skirmish vs AI:** free once the campaign AI exists.
- **Asymmetric 1 vs 1 scenarios:** attacker / defender missions on the mission system (one side has objectives, the other holds).
- **Remote play (asynchronous):** possible because rules are deterministic and every action is a command
  (ARCHITECTURE); needs a server, so it is far down the list.

## 6. Victory and mission system

### Type 1: Victory points [Decided]

Capture strategic points, hold them, and drain the enemy's VP tickets to 0 (SPEC §2–3: tickets 350, zones,
2-tick capture, sectors linked to the HQ).

### Type 2: Mission objectives [Decided, details Proposed]

Each side deploys from a starting budget, then plays to the mission's objectives. Objective types:

| Type | Goal | Example |
| --- | --- | --- |
| **Destroy** [Decided] | destroy given units / structures (or a count of a type) | silence a coastal battery |
| **Capture** [Decided] | own a point or area at a turn start | take the crossroads |
| **Escort** [Decided] | a given unit reaches an area alive | bring the engineers to the bridge |
| **Reach** [Decided] | any (or given) unit enters an area | recon patrol reaches the ridge |
| Hold [Proposed] | keep an area free of the enemy until turn N | hold the village until relieved |
| Survive [Proposed] | keep a unit or a share of the force alive until turn N | rearguard |
| Eliminate [Proposed] | no enemy units left (annihilation) | clear the wadi |
| Protect [Proposed] | a given unit or structure must not be destroyed (fails the mission when lost) | the field hospital |

- **Primary** objectives win the mission; **secondary** objectives give stars and bonuses; **hidden** objectives
  appear through triggers.
- **Failure conditions:** turn limit reached, protected unit lost, all units lost, HQ captured.
- **Stars:** 1 = win, 2 = all secondary objectives, 3 = win within par turns (or under a loss limit).

### Deployment phase (type 2) [Proposed]

1. The briefing shows the budget, the units the mission allows, and the deployment zone (blue hexes, SPEC §8).
2. The player buys units from the allowed list with the budget and places them in the zone.
3. Unspent budget counts toward the score, and may be kept for scripted reinforcement points.
4. Mid-mission money comes only from the mission: captured supply points, triggers ("reinforcements arrive"), or none.

### Triggers [Proposed]

Missions need events, not just goals. A small fixed vocabulary covers most RTS-style missions, without a scripting language:

- **When:** turn N starts · a unit enters an area · a unit / structure is destroyed · an objective completes · a point changes owner
- **Do:** spawn units (reinforcement) · show a message · add / complete / fail an objective · reveal an area · give resources · change an AI group's order

### Mission data sketch [Proposed]

```json
{
  "id": "tunisia_03", "map": "kasserine_pass", "turn_limit": 18, "par_turns": 12,
  "sides": {
    "player": { "faction": "british", "budget": { "manpower": 900, "munition": 60, "fuel": 40 },
                "allowed": ["infantry_section_uk", "vickers_team_uk", "six_pounder_uk"], "deploy_zone": "zone_west" },
    "enemy":  { "faction": "afrika_korps", "ai": "defensive", "groups": ["g_ridge", "g_reserve"] }
  },
  "objectives": [
    { "id": "o1", "type": "capture", "area": "pass_crossing", "primary": true },
    { "id": "o2", "type": "destroy", "targets": ["flak_88_a"], "primary": false }
  ],
  "fail": [{ "type": "turn_limit" }],
  "triggers": [
    { "when": { "objective_done": "o1" }, "do": [{ "spawn": "g_counterattack", "at": "zone_east" }, { "message": "msg.tunisia_03.counter" }] }
  ]
}
```

## 7. Core loops [Proposed]

```text
Turn (≈1 min)    select unit → preview (move / attack odds) → act → events play → next unit → end turn
Mission (20–40)  briefing → deploy (budget) → turns until objectives / VP decide → AAR (stars, veterans)
Campaign         chapter map → mission → AAR → unlocks (units, doctrines) → next mission
1 vs 1 match     setup → deploy / start position → turns with curtain → victory → AAR
```

## 8. Gameplay mechanics

Most rules are already decided in `SPEC.md`. This section groups them and lists what is missing.

| Mechanic | Current rule (SPEC) | Gap or proposal |
| --- | --- | --- |
| Turn structure | sides alternate; each unit moves (move points), attacks once, counters once (§3, §4) | **[Open]** keep this, or 2 action points per unit (move or attack each); `logic/turn` owns it either way |
| Movement and facing | 1 hex = 7 m; infantry 4 hexes; hull turn costs; reverse (§1, §6) | — |
| Sight and fog | sight from data +1; LOS through cover; concealment (§1, §5) | Multi-hex building sight (§10 of SPEC) |
| Cover and terrain | yellow / green cover; vehicles take no cover (§4) | Desert terrain set (sand, dunes, wadi, rocky ridge) for North Africa **[Proposed]** |
| Combat | hit roll, then penetration roll; one member per hit; tank persons table (§4) | Directional armour from CoH3 front / side / rear (data plan) |
| Suppression and retreat | cover vs suppression; retreat ×1.6 to rally point (§4) | Pinned state values to retune with the new data |
| Veterancy | CoH3 ranks and modifiers | Carry-over between campaign missions **[Open]** (§12) |
| Crew weapons | pack / emplace, arcs, watch fire, concealment (§5) | — |
| Indirect fire | blind barrage, CoH3 scatter, reload turns (§5) | — |
| Engineering | build range 1–2 hexes, fortifications, mines (§3) | **Bridges** as mission objects: build / repair / demolish **[Proposed]** (fits escort, reach and destroy missions) |
| Transport and garrison | boarding, dismount, airborne drop | — |
| Supply | units carry ammo and fuel; supply trucks refill (legacy v127, Burning Bridges style) | **[Open]** keep per-unit ammo / fuel? It adds logistics depth but also bookkeeping on a phone |
| Economy | VP mode: income from points, upkeep (§3) | Type 2 missions: budget + scripted income only (§6) |
| Production and tech | buildings by tier, CP milestones, doctrines (§3) | Doctrines rebuilt per faction (§9) |
| Abilities and off-map support | barrages, smoke, grenades, recon / strikes (§5) | Aircraft stay **off-map** abilities (no flying units) **[Proposed]** |
| Weather / time of day | none | Night and snow as mission modifiers later (sight −, movement +cost) **[Proposed, later]** |
| Naval | none | Out of scope **[Proposed]** |

## 9. Factions [Proposed]

Each faction feels different through its data (CoH3 rosters) and one or two signature rules. Doctrine names are
original (not CoH3 battlegroup names).

| Faction | Identity | Strengths | Weaknesses | Doctrine ideas (pick 2–3) |
| --- | --- | --- | --- | --- |
| US Forces | flexible, upgrades, numbers | upgradable infantry, cheap medium armour, mobile support | weaker heavy armour, AT needs support | Infantry company · Airborne · Armoured |
| Wehrmacht | defence in depth, quality | MGs, emplacements, strong late armour | expensive, slow to replace losses | Assault group · Defensive line · Heavy armour |
| Afrikakorps | mobile desert warfare | light vehicles, mobile guns, repair on the move | small infantry squads, little heavy armour early | Mobile battle group · Artillery and 88s · Recovery and logistics |
| British Forces | firepower and fortification | durable sections, emplacements, artillery | slow, emplacements lock positions | Infantry and fieldworks · Artillery regiment · Armoured brigade |

The legacy game has three US / German doctrines (infantry, airborne, armour); they become the starting point for US and Wehrmacht.

## 10. AI opponent [Proposed]

The campaign needs an AI; today there is none (SPEC §2). Two layers, both in `logic/ai`, both deterministic (seeded rng):

1. **Mission layer:** missions place enemy units in **groups** with an order (*defend area*, *attack toward*,
   *patrol*, *wait until trigger*, *retreat when below X %*) plus flags (*hold fire*, *stay together*, *capture on the way*).
   Triggers change orders. This is how RTS missions script enemies, and it is cheap to author.
2. **Tactical layer:** for each unit, score candidate actions with the same functions the player sees:
   `previewAttack` for expected damage, cover value of the destination hex, threat on that hex, objective value.
   Pick the best; crew weapons emplace facing threats; damaged units retreat.

- **Difficulty** changes budgets, reinforcements and how careful the scoring is. It never gives the AI vision it would not have.
- **Self-play** (AI vs AI) doubles as the balance tool: thousands of fights from the data, no screen.

## 11. Maps and theatres [Proposed]

| Theatre | Terrain set | Signature features |
| --- | --- | --- |
| North Africa | sand, hard ground, dunes, wadis, rocky ridges, palm oases, stone villages | long sight lines, few hard covers, passes |
| Italy | hills, terraces, stone towns, olive groves, rivers | elevation, narrow streets, bridges |
| Normandy | bocage hedgerows, orchards, farms, small towns | short sight lines, hedges as green cover |
| Ardennes | snow, dense forest, villages, roads | roads matter, forest blocks vehicles |

- Sizes: skirmish 22×14 (exists), mission maps about 24×16 to 32×24 for a phone screen; 48×48 (Faymonville)
  only for long VP matches.
- Every map lists its points, sectors, deployment zones, areas (for objectives and triggers) and AI group spawns.
- Tooling: the existing map tools move into `tools/`; a map is data (`data/maps/`).

## 12. Campaign structure and progression [Proposed]

- **Chapters:** North Africa → Italy → Normandy → Ardennes; about 4–6 missions each (with option B, alternating sides).
- **Unlocks:** new units and doctrines arrive with the story, so each mission teaches one new thing.
- **Stars** (§6) unlock optional challenge missions and are the replay reason.
- **Core company carry-over** **[Open]:** surviving units keep veterancy into the next mission of the same side. It builds
  attachment and rewards careful play, but punishes a bad mission and makes balance harder. Middle ground:
  carry over veterancy of up to 3 chosen units.
- No in-game currency or shop.

## 13. UI / UX [Proposed, extends SPEC §8]

- **One-thumb play in landscape:** tap to select, two-tap to act (SPEC §8), long press for range; nothing needs precise drags except turning.
- **Information on demand:** odds preview on the first tap (hit / pen per band, expected damage as the black HP section);
  a full unit card on long press. No numbers on the map itself (SPEC §8).
- **Turn flow:** a "units left to act" indicator instead of an idle-unit popup (SPEC §8 removed the popup).
- **Onboarding:** 2–3 tutorial missions in the first chapter, each teaching one thing: move and cover, then facing
  and armour, then crew weapons and artillery. No text walls; the mission is the lesson.
- **Accessibility:** red and green tiles are hard to tell apart for colour-blind players; add a second cue
  (pattern or border) and a colour-blind palette. Reduce-motion and fast-animation settings. Text size setting.

## 14. Art and audio direction [Proposed, extends SPEC §9]

- **Look:** realistic, muted, isometric; baked 3D vehicle sprites (TankBaker) and illustrated 2D icons; each theatre
  has its own palette (desert ochre, Italian stone, Normandy green, Ardennes snow-grey).
- **UI:** gunmetal and navy, angular plates (SPEC §8–9); faction marks only.
- **Effects:** short and readable: muzzle flash, tracer, impact, ricochet, smoke; nothing that hides the board.
- **Audio** (new system `presentation/audio`): weapon classes (rifle, MG, tank gun, mortar, artillery), impacts,
  engines, UI clicks, short radio barks, one music theme per theatre. All sounds from licensed or self-made sources.

## 15. Technology, tools and content pipeline [Proposed]

- One offline HTML, mobile browser; 60 fps target on a mid-range phone at 32×24, acceptable at 48×48.
- Deterministic rules + commands: undo, autosave, replays, AI self-play, and later remote play come from the same design.
- **Content is data:** units (`data/units`), maps (`data/maps`), missions (`data/missions`), campaign (`data/campaign`),
  text (`data/i18n`). New content means new files, not new code.
- **Tools to build:** mission validator (every area, group and objective id resolves), map tools, unit lookup,
  balance self-play runner.
- **Architecture additions this plan needs:** `logic/mission` (objectives, triggers, failure), deployment as part of
  `logic/economy` or its own `logic/deployment`, campaign progress in `services/save`, briefing / AAR screens in `presentation/ui`.

## 16. Success factors and risks

| Success factor | Why it matters | How the plan covers it |
| --- | --- | --- |
| Readability on a phone | tactics fail if players cannot see why they lost | preview = resolve formula, colour + pattern tiles, one rule per SPEC line |
| A decision every turn | "attack the nearest" gets boring | facing, cover, bands, crossfire and suppression make position matter |
| Pacing | mobile sessions are short | 20–40 min missions, fast animations, autosave |
| Credible AI | the campaign lives or dies by it | mission groups + tactical scoring, self-play testing |
| Mission variety | the same "capture all" map gets old | 8 objective types, triggers, deployment budgets, theatres |
| Faction balance | four asymmetric factions from translated CoH3 numbers | data pipeline + oracle + AI self-play |
| Producible by a small team | content cost grows fast | everything is data; tools before content; vertical slice first |

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Scope: 4 factions × campaign × 1 vs 1 | never finished | MVP slice (§17), add a theatre at a time |
| AI is harder than expected | campaign blocked | missions lean on scripted groups first; tactical layer improves over time |
| CoH3 → turn translation breaks balance | unfun matches | oracle against v214, self-play, values tuned for the game (decision 5) |
| Phone performance on big maps | stutter | cached terrain layer, sprite baking, map size guidance |
| IP: CoH3 data and names, Burning Bridges material | blocks any public release | original story, maps, art and sound; CoH3 used as stat reference only; no Burning Bridges assets |
| Historical sensitivity | store rejection, players put off | no Nazi symbolism, soldier-level framing, grounded tone |

## 17. Scope and milestones [Proposed]

| Milestone | Content | Depends on |
| --- | --- | --- |
| M1 Rewrite core | new `src/` reaches v214 rules; 1 vs 1 VP on the skirmish map, US vs Wehrmacht | rewrite plan, data Phases 1–6 |
| M2 Mission system | objectives, triggers, deployment phase, briefing / AAR; 3 test missions | `logic/mission` |
| M3 AI | mission groups + tactical layer; skirmish vs AI | `logic/ai` |
| M4 Vertical slice | Ardennes or Normandy: 1 tutorial + 3 missions, one side, sound | M2, M3 |
| M5 Second front | Afrikakorps + British data, desert terrain, North Africa chapter | data Phase 7 |
| M6 Full campaign | remaining chapters, doctrines for all factions, stars, carry-over | M4, M5 |

## 18. Open questions (most important first)

1. ~~Campaign perspective~~: B (decided). Platform, battle rules and controls, code and assets: §19–21.
2. **Who is it for:** you and friends, or a public release (store)? This decides how strict the IP and sensitivity rules must be, and how much polish and content the plan needs.
3. **Turn rule:** keep SPEC's move + attack per unit, or two action points?
4. **Supply:** keep per-unit ammo and fuel with supply trucks, or simplify?
5. **Carry-over:** do veterans carry between campaign missions?
6. **Mission income:** in objective missions, budget only, or captured supply points pay too?
7. **Theatres:** the four proposed, in that order?

## 19. Battle rules for dynamic combat [Proposed]

CoH3 feels dynamic because squads react, suppression pins them, cover has a direction, tanks show their flanks,
and the ground gets destroyed. A turn-based game can keep all of that; what it must avoid is a side standing
still while the other moves.

### Turn structure: three options

| Option | How it works | Feel | Problems |
| --- | --- | --- | --- |
| **A. Side turns + reactions** *(my pick)* | Sides alternate whole turns (Burning Bridges). Units react during the enemy turn: counter fire, overwatch, watch fire. Each action plays as a short real-time scene. | dynamic enough; every enemy move can be punished | the first move in a turn can still be an alpha strike, kept small by reactions and suppression |
| B. Alternating activation | One unit from each side in turn. | very dynamic | on one device with fog of war the phone must change hands after every unit, so 1 vs 1 breaks |
| C. Simultaneous (plan, then resolve together) | Both sides give orders, then 10 s play out at once. | closest to CoH3 | breaks almost every SPEC rule; the AI has to plan blind; collisions are hard to make readable |

### Unit turn [Proposed]

- Each unit has **Move** (its move points) and **one Action** (fire, ability, emplace, build, repair, board), in either order.
- **Move then fire** uses the weapon's moving accuracy (CoH3 `moving.accuracy_multiplier`); weapons that cannot fire
  on the move (`can_fire = false`, crew weapons) must fire first or not move.
- **Overwatch (machine guns only, decided 2026-11-25):** an emplaced HMG team, or an infantry squad / vehicle with an MG
  that holds (no move, no action), fires its MG once during the enemy turn at the first enemy that moves into its range
  and arc. No other weapon overwatches (SPEC §10, `docs/unit-state.md` §5.1.1).
- **Counter fire** stays: a unit that is attacked fires back once per enemy turn if it can see and reach the attacker (SPEC §4).
- This answers the open "turn rule" question without action points; `logic/turn` still owns it alone.

### Combat rules that make it dynamic [Proposed]

| Rule | What happens | Data |
| --- | --- | --- |
| Suppression states | Suppression points build from fire. **Suppressed**: move −50 %, accuracy ×0.5. **Pinned**: cannot move except retreat, cannot capture. They decay at own turn start, faster in cover. | weapon `suppression`, unit `vs_suppressed / vs_pinned` |
| Directional cover | Hedges, walls and sandbags sit on hex **edges**. They protect only against fire that crosses them, so flanking removes cover. | legacy edge objects (v145) |
| Directional armour | The hit side (front / side / rear) comes from the angle to the hull; turrets aim on their own (SPEC §6). | ebps `armor`, `directional_damage` |
| Vehicle criticals | A penetrating hit can roll a critical: engine damaged (move −50 %), immobilised, main gun damaged, crew shocked (no action next turn). | small table in `data/rules` |
| Destruction | Tanks crush hedges and fences; HE damages buildings to ruins (cover changes); heavy shells leave craters (light cover). | `data/rules` terrain states |
| Smoke | Blocks sight for 1–2 turns. | ability data |
| Reveal on fire | A unit that fires is visible to the enemy until its next turn (CoH3 `reveal_self_on_attack`). | weapon flag |
| Retreat | As in SPEC §4: fast move to the rally point, harder to hit, no return fire. | — |

### Presenting a turn [Proposed]

- Every command plays as a short scene: the unit turns, moves, fires, tracers fly, the target reacts or counter-fires.
  A reaction (overwatch, counter fire) interrupts the move at the hex where it happened.
- The enemy turn (AI, or the other player after the curtain) is played back with speed 1× / 2× / skip.
- The camera follows the action only when it leaves the screen; no forced cinematic camera.

## 20. Unit control scheme on a phone [Proposed]

### Screen layout (landscape)

```text
┌────────────────────────────────────────────────────────────────────┐
│ MP 600  MUN 10  FUEL 20     VP ▓▓▓▓░░ 312 : 280    objectives ≡   ⚙ │
│┌─────────┐                                                         │
││unit card│                     map                                 │
││HP, vet, │                                                ┌──────┐ │
││status   │                                                │ next │ │
│└─────────┘                                                │ unit │ │
│                                                           │  3 ▸ │ │
│  [ fire ][ ability ][ ability ][ hold ][ face ]   ↶ undo   │ END  │ │
└────────────────────────────────────────────────────────────────────┘
```

### Gestures

| Gesture | On | Does |
| --- | --- | --- |
| Tap | own unit | select; shows move (green) and attack (red) hexes |
| Tap | green hex | preview path and cost; **tap again** to move |
| Tap | enemy | preview odds (hit / pen per band, expected loss on its HP bar); **tap again** to fire |
| Tap | enemy out of range | shows hexes from which it can be hit; tapping one previews move then fire |
| Tap | empty ground / outside | cancel |
| Long press | any hex or unit | range and line-of-sight view; full unit card |
| Drag from selected vehicle / crew | — | set facing (turn stage, SPEC §6) |
| One-finger drag | empty ground | pan |
| Pinch | — | zoom (3 steps; at the closest step a hex is at least 9 mm wide) |
| Double tap | unit | centre the camera on it |
| Button: next unit | — | select the next unit that can still act |
| Button: undo | — | undo the last move if it revealed nothing new |

- Units are controlled as whole squads; there is no control of single soldiers.
- After a move, vehicles face the way they drove; a drag changes facing within the turn cost rules.
- Buildings in front of a selected unit fade so units behind them stay visible.
- Minimum touch target 44 pt for buttons; nothing needs a precise drag except facing.

## 21. Platform, code and assets

See `docs/tech-plan.md`: distribution (web / APK), code file format and the asset modelling plan.
