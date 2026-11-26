# BURNING FRONT — Game Plan

> **Superseded by `docs/game-plan.ko.md` (v1.1, Korean)**: campaigns are now one perspective each, 6 stages × 3 missions
> (Campaign 1 North Africa, Afrikakorps; Campaign 2 Italy, Allied / AFHQ). This English v1.0 is kept for reference.

Version 1.0 · 2026-11-25 · Final plan, built on the working documents `docs/game-design.md`, `docs/tech-plan.md`,
`docs/ARCHITECTURE.md` and `SPEC.md`.
Items marked *(assumed)* follow a recommendation you have not confirmed yet; see "Decisions still open" at the end.

---

## 1. Game Overview

### 1.1 Game title

**BURNING FRONT**
Subtitle for the campaign: *Two Sides of the Line*

### 1.2 Game genre

Turn-based tactical strategy · hexagonal grid · isometric view · World War II.
Squad-level combined arms (infantry, crew weapons, vehicles, artillery) with the dynamic feel of real-time WWII
tactics: suppression, directional cover, flanking, reactions and destructible terrain.

### 1.3 Game platform

| Item | Plan |
| --- | --- |
| Device | Smartphones and tablets, landscape; also plays in desktop browsers |
| Release form | 1) installable web app (PWA): open the link, add to home screen, plays offline *(assumed)* · 2) Android app (APK / Google Play) built from the same code *(assumed)* |
| Later | iPhone App Store build from the same code; PC (Steam) if demand exists |
| Technology | JavaScript (ES modules), GPU-accelerated 2D sprite rendering, fully offline after the first load *(assumed)* |
| Players | 1 player (campaign vs AI) · 2 players on one device (pass and play) |

### 1.4 Game description

BURNING FRONT puts the player in command of a WWII company, one turn at a time. Each squad, gun and tank is
built from real-world-calibrated statistics: accuracy and penetration by range, armour by facing, rate of fire, suppression.
Every hex, hedge and hull angle matters. Squads pinned in the open die, tanks shown side-on burn, and an MG on overwatch
can stop an attack cold.

The campaign follows **two sides of each front**: missions alternate between an Allied and an Axis commander whose
paths cross from the North African desert to the snow of the Ardennes. One side's defeat is the next mission's starting
position. In **1 vs 1** mode, two players share one phone and fight for victory points.

Four factions: **British Forces, Afrikakorps, US Forces, Wehrmacht**. Each has its own roster, strengths and doctrines.

### 1.5 Game objective

| Mode | The player wins by |
| --- | --- |
| Campaign mission, type 1: **Victory points** | capturing strategic points and holding them until the enemy's victory points reach 0 |
| Campaign mission, type 2: **Mission objectives** | deploying a force from a starting budget, then completing the mission's objectives: destroy, capture, escort, reach (plus hold, survive, eliminate, protect) |
| 1 vs 1 | victory points (capture mode) or annihilation |
| Campaign overall | finishing all four chapters; stars (1–3 per mission) reward clean, fast, complete victories |

**Player experience goals:** read the battlefield, make one meaningful decision per unit per turn, and feel that wins come
from good positioning, not luck or numbers.

---

## 2. Game System Design

### 2.1 How to play

**Mission flow**

```text
Briefing → Deployment → Battle (turns) → Victory / defeat → After-action report → next mission
```

1. **Briefing:** map, place and date, objectives, budget, a short message from the commander.
2. **Deployment** (type 2 missions): buy units from the allowed list with the budget and place them in the blue
   deployment zone. Type 1 missions start from a base with income instead.
3. **Battle:** sides alternate turns. In your turn, give each unit a **move** and an **action**. During the enemy turn your units
   react on their own (counter fire, overwatch).
4. **Result:** the after-action report shows objectives, losses, veterans and stars.

**A unit's turn**

| Step | Player does | Game shows |
| --- | --- | --- |
| Select | tap a unit | green hexes = can move, red hexes = can attack |
| Move | tap a green hex, tap it again | path, move cost; unit moves |
| Act | tap an enemy, tap it again (or an ability) | hit and penetration chance, expected loss on the target's health bar; combat plays out |
| Hold | tap "Hold" | unit goes on overwatch for the enemy turn |
| Next | tap "Next unit" | jumps to the next unit that can still act |
| End | tap "End turn" | enemy turn plays (1× / 2× / skip) |

### 2.2 Game rules

**Scale**: 1 hex = 7 m · 1 turn = 10 seconds of combat · unit statistics from real-time WWII reference data
(CoH3), tuned for turns.

**Turns and actions**

- Sides alternate whole turns. Each unit has **one move** (its move points; infantry 4 hexes) and **one action**
  (fire, ability, emplace, build, repair, board), in either order.
- Firing after moving uses the weapon's moving accuracy; crew weapons must be emplaced to fire.
- **Hold:** a unit that neither moves nor acts goes on **overwatch** and fires once during the enemy turn at the
  first enemy that moves into its range and arc.
- **Counter fire:** a unit that is attacked fires back once per enemy turn if it can see and reach the attacker.

**Combat**

- Every shot rolls **hit** (accuracy by range band × target size × cover × modifiers), then **penetration**
  (penetration vs armour). Range bands: near / mid / far = thirds of the weapon's range.
- A hit kills or wounds one squad member (no overkill to the next); HE adds splash inside the hex.
  Squads lose firepower with each man lost.
- **Suppression:** fire builds suppression. *Suppressed*: move −50 %, accuracy ×0.5. *Pinned*: cannot move except
  retreat, cannot capture. Suppression fades at the start of the own turn, faster in cover.
- **Cover:** light (yellow) and heavy (green) cover reduce received accuracy, damage and suppression. Hedges, walls and
  sandbags sit on hex edges and protect only against fire crossing that edge, so **flanking removes cover**.
  Garrisoned buildings protect most. Vehicles take no terrain cover.
- **Vehicles:** armour by hit side (front / side / rear) from the angle to the hull; turrets aim on their own. A penetrating hit can
  cause a **critical**: engine damaged, immobilised, main gun damaged, or crew shocked.
- **Indirect fire** (mortars, howitzers, rockets) can target unseen hexes in range; shells scatter and ignore cover.
- **Destruction:** tanks crush hedges and fences; HE turns buildings into ruins; heavy shells leave craters (light cover).
- **Smoke** blocks sight for 1–2 turns. A unit that fires is revealed until its next turn.
- **Retreat:** a squad can fall back to its rally point at high speed, harder to hit, without returning fire.
- **Veterancy:** units gain experience and up to 3 ranks with stat bonuses.

**Crew weapons and vehicles**

- MGs, mortars, AT and field guns are **packed** (can move and turn) or **emplaced** (can fire, cannot move).
- Vehicles turn by moving or by a turn action (≤ 120° = 1 move, wider = 2); fixed-gun vehicles fire within a 120° arc;
  every vehicle can reverse.

**Economy and production** (victory-point missions and 1 vs 1)

- Resources: **manpower, munitions, fuel**. Income from the HQ and from captured resource points linked to the HQ.
- Upkeep: 2 % of each unit's price per turn (max 20 MP).
- Points are captured by holding their zone through turn starts; armed infantry capture, vehicles only contest.
- Production buildings by tier; engineers build fortifications, mines, bunkers and emplacements.
- **Command points** unlock doctrine abilities (barrages, airborne drops, strikes, recon).

**Victory and defeat** — set per mission (see §1.5 and §4). Failure: turn limit reached, protected unit lost,
all units lost, or HQ captured (when the mission says so).

### 2.3 Game interface (UI/UX)

**Screens**

| Screen | Content |
| --- | --- |
| Title / lobby | Campaign, 1 vs 1, Continue, Settings |
| Campaign map | four theatre chapters, missions with stars, commander portraits |
| Briefing | map preview, place and date, objectives, budget, commander message |
| Deployment | allowed units, budget, blue deployment zone |
| Battle HUD | below |
| Turn curtain | (1 vs 1) hides the board while the phone changes hands |
| After-action report | result, stars, losses, veterans, next mission line |
| Settings | animation speed, reduce motion, colour-blind palette, text size, sound / music volume, theme |

**Battle HUD (landscape)**

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

**Controls**

| Gesture | Effect |
| --- | --- |
| Tap own unit | select |
| Tap hex / enemy, tap again | preview, then confirm move / attack |
| Tap enemy out of range | shows hexes from which it can be hit |
| Tap empty ground | cancel |
| Long press | range and line of sight, full unit card |
| Drag from selected vehicle | set facing |
| One-finger drag / pinch / double tap | pan / zoom / centre on unit |

**UX principles**

- No numbers on the map; odds appear on the first tap, and the preview uses the same formula as the result.
- Colours: green = move, red = attack, yellow = buff, blue = deploy. Each also has a pattern for colour-blind players.
- Buildings in front of the selected unit fade; buttons are at least 44 pt; everything works with one thumb.
- Angular UI plates in gunmetal and navy; theme presets.
- Autosave every turn and on leaving the app; undo for a move that revealed nothing.

---

## 3. Characters and Scenario

### 3.1 Main characters (character concepts)

All characters, units and their stories are fictional; places and dates are historical.

| Character | Side | Concept | Arc | In gameplay |
| --- | --- | --- | --- | --- |
| **Major Edward Ashby** | British Forces · 2nd Bn, Wessex Rifles (fictional) | 38, survivor of France 1940; careful, dry humour, counts every man he loses | from caution born of defeat to the confidence to attack, at a cost he never stops counting | Chapters 1–2; teaches infantry, fieldworks and artillery |
| **Hauptmann Konrad Reiss** | Afrikakorps, later Wehrmacht · reconnaissance company | 34, professional cavalry-turned-recon officer; respects the enemy, proud of his men, slowly sees what the war serves | from a soldier who believes it is "just the job" to one who chooses his men's survival over orders | Chapters 1–2, returns in 4; mobile warfare, light vehicles, recovery |
| **Lt. Daniel Kowalski** | US Forces · Company C, fictional infantry battalion | 24, steelworker's son from Pittsburgh, first command in Italy | from green lieutenant to the captain who holds a crossroads in the snow | Chapters 2–4; teaches US combined arms and upgrades |
| **Leutnant Erich Lang** | Wehrmacht · panzergrenadier company | 21, once Reiss's driver in Africa; idealistic, then hardened by Normandy | from belief to doubt; the Ardennes forces his choice | Chapters 3–4; defence in depth, armour |

**Supporting NPCs**

| NPC | With | Role |
| --- | --- | --- |
| Sgt. Major Bill Mercer | Ashby | old regular NCO; voice of the ranks, tutorial guide in Chapter 1 |
| Feldwebel Hans Brück | Reiss | mechanic and fixer; recovery vehicles, repair missions |
| Sgt. Luis Ortega | Kowalski | platoon sergeant from Texas; keeps the green lieutenant alive |
| Cpl. Ada "Radio" Price | Ashby / Kowalski | radio operator; delivers in-mission messages and artillery calls |
| Obergefreiter Paul Seidel | Lang | the last of Lang's original squad; the human cost on the German side |

Enemy commanders appear in each other's missions only through radio intercepts and the battlefield itself.

### 3.2 Story overview (synopsis)

*Two Sides of the Line.* The war is fought by people who never meet, until they do.

**Chapter 1 — North Africa (Oct 1942 – Mar 1943).** Ashby's battalion arrives in the desert as the Allies push west.
Across the wire, Reiss's recon company screens the Afrikakorps' withdrawal. They fight for ridges, wadis and a railway
station. Reiss spares a British field hospital he could have shelled; Ashby holds the line that breaks Reiss's last counterstroke.
Reiss's driver, a boy named Erich Lang, is sent home wounded.

**Chapter 2 — Italy (Sep 1943 – May 1944).** The Allies land. Kowalski's company comes ashore green; Ashby's veterans
fight beside them up the mountain roads. Reiss, now with a Wehrmacht division, fights a delaying war from town to town,
demolishing bridges behind him. At a river crossing the three commanders' paths meet. Reiss is badly wounded and evacuated.

**Chapter 3 — Normandy (Jun – Aug 1944).** Kowalski, now a captain, fights through the hedgerows. Lang, recovered and
commissioned, leads panzergrenadiers in the crossroads defence that bleeds the Americans. When the front collapses, Lang
breaks his men out of the pocket and leaves Seidel behind to cover them.

**Chapter 4 — Ardennes (Dec 1944 – Jan 1945).** In fog and snow the German offensive hits Kowalski's thin line.
Lang attacks through the forest; Reiss, back as his battalion commander, sees the operation will fail. The last missions
are fought over a crossroads village (Faymonville). The finale is played from both sides. Reiss orders a withdrawal that saves
Lang's company, and Kowalski holds. The epilogue follows each character after the war.

**Theme:** the front burns on both sides; every unit on the map is someone's squad.

### 3.3 Background settings

| Theatre | Period | Ground | Atmosphere |
| --- | --- | --- | --- |
| North Africa (Libya / Tunisia) | 1942–43 | sand, hard ground, dunes, wadis, rocky ridges, oases, stone villages, railway | heat haze, long sight lines, open flanks; dust storms as a mission modifier |
| Italy (Salerno to the mountain line) | 1943–44 | terraced hills, stone towns, olive groves, rivers and bridges, mountain roads | elevation, narrow streets, rain |
| Normandy (bocage) | 1944 | hedgerows, orchards, farms, small towns, sunken lanes | short sight lines, every field a fortress |
| Ardennes | 1944–45 | snow, dense pine forest, villages, crossroads, frozen rivers | fog, cold, roads decide everything |

Tone: grounded and personal. German factions are shown as soldiers and operations; no Nazi symbolism (factions use
the iron cross on red); no glorification of either side.

---

## 4. Level Design

### 4.1 Stage list

25 campaign missions in 4 chapters (alternating sides within each chapter), plus 1 vs 1 maps.
Map sizes in hexes. Type 1 = victory points, Type 2 = mission objectives.

| # | Mission | Side | Type | Map |
| --- | --- | --- | --- | --- |
| **Chapter 1 — North Africa** | | | | |
| 1-1 | Sand and Wire *(tutorial)* | British | 2 | 16×12 |
| 1-2 | Ridge Patrol *(tutorial)* | Afrikakorps | 2 | 18×12 |
| 1-3 | The Gun Line *(tutorial)* | British | 2 | 20×14 |
| 1-4 | Wadi Crossing | Afrikakorps | 2 | 24×16 |
| 1-5 | The Station | British | 1 | 24×18 |
| 1-6 | Counterstroke | Afrikakorps | 2 | 28×18 |
| 1-7 | The Hospital at Bir Safra | British | 2 | 24×16 |
| **Chapter 2 — Italy** | | | | |
| 2-1 | Beachhead | US | 2 | 24×16 |
| 2-2 | Fighting Withdrawal | Wehrmacht (Reiss) | 2 | 26×16 |
| 2-3 | Ponte Sereno | British | 2 | 24×18 |
| 2-4 | The Hill Town | Wehrmacht (Reiss) | 1 | 26×20 |
| 2-5 | Mountain Road | US | 2 | 28×18 |
| 2-6 | Three Commanders | British + US / Wehrmacht (played as Allies) | 2 | 30×22 |
| **Chapter 3 — Normandy** | | | | |
| 3-1 | Hedgerow Country | US | 2 | 24×16 |
| 3-2 | Crossroads Defence | Wehrmacht (Lang) | 2 | 24×18 |
| 3-3 | The Long Lane | US | 2 | 28×14 |
| 3-4 | Panzer Counterattack | Wehrmacht (Lang) | 2 | 28×20 |
| 3-5 | Breakthrough | US | 1 | 32×24 |
| 3-6 | The Pocket | Wehrmacht (Lang) | 2 | 30×20 |
| **Chapter 4 — Ardennes** | | | | |
| 4-1 | Into the Fog | Wehrmacht (Lang) | 2 | 26×18 |
| 4-2 | Hold the Crossroads | US | 2 | 24×18 |
| 4-3 | Fuel | Wehrmacht (Reiss / Lang) | 2 | 28×20 |
| 4-4 | Relief Column | US | 2 | 30×16 |
| 4-5 | The Bridge | Wehrmacht (Lang) | 2 | 26×20 |
| 4-6 | Faymonville | US | 1 | 48×48 (0.9 scale) |
| 4-7 | Faymonville: the Other Side *(finale)* | Wehrmacht (Reiss) | 2 | 48×48 (0.9 scale) |

**1 vs 1 maps:** Skirmish Field 22×14 (exists) · Faymonville 48×48 (exists) · one new map per theatre:
Desert Ridge, Hill Town, Bocage Fields, Forest Crossroads.

### 4.2 Objectives and characteristics of each level

| # | Objectives (★ primary, ☆ secondary) | Characteristic / what it teaches |
| --- | --- | --- |
| 1-1 | ★ reach the wire gap · ★ capture the outpost · ☆ lose no squad | movement, cover colours, two-tap; Mercer guides |
| 1-2 | ★ reach three observation hexes · ★ destroy the British scout car · ☆ undetected until the last hex | vehicle facing, armour sides, recon, sight |
| 1-3 | ★ hold the gun line for 8 turns · ☆ keep both AT guns | emplacing crew weapons, overwatch, calling artillery |
| 1-4 | ★ escort 3 supply trucks across the wadi · ☆ all 3 arrive | escort, supply (ammo / fuel), ambush points |
| 1-5 | ★ drain enemy VP to 0 | first victory-point battle; base, production, income, sectors |
| 1-6 | ★ destroy the British artillery park · ☆ within 14 turns | armoured attack, flanking, smoke |
| 1-7 | ★ survive 10 turns · ★ protect the field hospital | defensive layering; the hospital is the mission Reiss chose not to shell (story crossing) |
| 2-1 | ★ capture the beach exits (3 points) · ☆ no landing craft lost | landing deployment, combined arms intro for US |
| 2-2 | ★ hold each delay line 4 turns, then reach the exit · ☆ demolish the bridge behind you | withdrawal, bridge demolition, trading space for time |
| 2-3 | ★ escort engineers to the bridge · ★ capture it before demolition | race against a trigger; bridges as objects |
| 2-4 | ★ drain enemy VP to 0 (defending a hill town) | elevation, garrisons, buildings into ruins |
| 2-5 | ★ destroy 4 guns on the mountain road · ☆ no vehicle lost | elevation sight, mortars, mountain paths |
| 2-6 | ★ cross the river and capture the far bank · ★ British and US units both survive | two allied forces under the player; Reiss wounded (story) |
| 3-1 | ★ capture 3 hedgerow fields in order | directional edge cover, short sight lines, engineers breaching hedges |
| 3-2 | ★ hold the crossroads 10 turns · ☆ destroy 3 Shermans | defence in depth, MG overwatch, AT ambush |
| 3-3 | ★ escort the recon jeep and supply trucks down the lane · ☆ clear both ambushes | escort through ambush, reveal on fire |
| 3-4 | ★ destroy the US forward positions · ☆ within 12 turns | panzer counterattack, criticals, air strike threat (off-map) |
| 3-5 | ★ drain enemy VP to 0 on a large map | big combined-arms VP battle, full economy |
| 3-6 | ★ reach the breakout exit with at least 50 % of the force · ★ Seidel's rearguard holds 6 turns | survive + reach; sacrifice decision (story) |
| 4-1 | ★ reach the far forest edge · ★ capture the forester's lodge | fog (sight −2), forest blocks vehicles, infiltration |
| 4-2 | ★ hold the crossroads until relief (12 turns) | last stand, snow movement, limited budget, no income |
| 4-3 | ★ capture the fuel depot intact · ☆ capture it within 10 turns | fuel scarcity as a mission rule; depot must not be shelled |
| 4-4 | ★ escort the relief column to the crossroads | escort on roads, ambushes, bridges |
| 4-5 | ★ capture the bridge before the US engineers blow it | mirror of 2-3; triggers race |
| 4-6 | ★ drain enemy VP to 0 at Faymonville | final large VP battle (US) |
| 4-7 | ★ hold Faymonville 8 turns · ★ then withdraw 60 % of the force | finale from the other side; withdrawal; epilogue |

**Stars per mission:** ★ win · ★★ all secondary objectives · ★★★ win within par turns (or under the loss limit).
**Difficulty curve:** Chapter 1 teaches one system per mission; Chapter 2 combines them; Chapters 3–4 are full
combined-arms battles with tighter budgets and stronger AI.

---

## 5. Game Graphic Art Design

### 5.1 Character design (PC / NPC)

**Units (the "characters" on the map)**

| Unit type | Design | Production |
| --- | --- | --- |
| Infantry squads | one rigged 3D soldier, uniform, helmet and weapon swapped per faction (British brodie helmet, US M1, German Stahlhelm, Afrikakorps tropical kit); squad shown as 2–6 figures in the hex | 8 directions × idle, walk, fire, prone, die, baked to sprites |
| Crew weapons | MG, mortar, AT / field guns with 2–3 crew | packed and emplaced poses, 16 angles |
| Vehicles | low-poly 3D, faction camouflage (desert sand, olive drab, dunkelgelb, winter whitewash), separate turret | hull and turret at 32 angles; damaged and wreck states |
| Buildings and emplacements | 3D, footprint in hexes | intact, damaged, ruin |

- Readable silhouettes first: each class must be recognisable at the smallest zoom.
- Team marking: a thin blue or red ground ring and the banner above the unit. No flags or antennas on vehicles.
- No Nazi symbolism; German vehicles carry the iron cross only.

**Commanders and NPCs (portraits)**

- Illustrated, painterly portraits (bust, 3/4 view), three expressions each (neutral, strain, resolve).
- Used in briefings, radio messages and the after-action report.
- Colour per faction: British khaki and brass, Afrikakorps sand and faded olive, US olive drab, Wehrmacht field grey.

### 5.2 Background design (BGA)

- Isometric hex terrain, realistic and muted; each theatre has its own palette and tile set (see §3.3).
- Layers: ground tiles → roads and rivers → edge objects (hedges, walls, fences, sandbags) → props (trees, wrecks, crates)
  → buildings. Terrain is cached so only units and effects redraw each frame.
- States: hedges crushed, buildings damaged → ruins, craters, scorched ground, snow tracks.
- Time and weather as palettes: day, dusk, fog, snow, dust storm.
- UI art: gunmetal and navy plates, cream edges, angular corners; illustrated 2D icons for units, abilities and statuses.

### 5.3 Effect design

| Effect | Use | Design rule |
| --- | --- | --- |
| Muzzle flash, tracer | every shot | colour by weapon class; tracers show who shoots whom |
| Impact: dirt, sparks, ricochet | hit / miss / failed penetration | ricochet spark = "did not penetrate", readable without numbers |
| Explosion, shockwave, debris | HE, grenades, artillery | size by calibre; short (≤ 0.8 s) |
| Smoke screen | smoke ability | soft volume that clearly marks blocked hexes |
| Fire and burning wreck | destroyed vehicles, flame weapons | lingers as a battlefield marker |
| Dust, exhaust, track marks | vehicle movement | subtle; dust heavier in the desert |
| Suppression | suppressed / pinned squads | figures go prone, a status icon; nothing hides the hex |
| Health bar drain | damage | black section fades in and out on preview (SPEC §8) |

Effects scale with a quality setting; reduce-motion skips them without changing results.

---

## 6. Game Sound Design (Audio Design)

### 6.1 Background music (BGM)

| Track | Where | Character |
| --- | --- | --- |
| Main theme | title, campaign map | orchestral, restrained, brass and strings; the "two sides" motif played by two instruments |
| North Africa | Chapter 1 | low strings, sparse percussion, open fifths |
| Italy | Chapter 2 | strings with a mandolin / accordion colour, minor key |
| Normandy | Chapter 3 | snare-driven, tense, close |
| Ardennes | Chapter 4 | cold, choir pads, slow build |
| Battle layers | in battle | each theatre track has calm and combat layers; the combat layer fades in when units exchange fire |
| Victory / defeat / AAR | result screens | short stingers |

Source: commissioned composer or licensed library music; looped OGG/MP3, about 2–3 minutes each.

### 6.2 Sound effects (SFX)

| Group | Sounds |
| --- | --- |
| Small arms | rifle, SMG, LMG, HMG (by faction weapon family), distant versions for off-screen fire |
| Heavy weapons | AT gun, tank guns by calibre class, mortar launch and whistle, howitzer, rockets |
| Impacts | dirt, wood, stone, metal hit, ricochet ("did not penetrate"), explosion by size |
| Vehicles | engines (light, medium, heavy, half-track, truck), tracks, turret traverse, brake |
| Environment | wind (desert), rain (Italy), birds and wind in hedges (Normandy), snow and forest (Ardennes) |
| UI | tap, select, confirm, cancel, end turn, objective complete / failed, star |
| Status | suppression whizz, unit pinned, unit lost, veterancy up |

Grouped by weapon class (not per weapon) to keep the download small. Format: MP3 (plays on Android and iPhone).

### 6.3 Voice

| Use | Plan |
| --- | --- |
| Unit acknowledgements | short barks per faction in its own language (British English, American English, German): select, move, attack, under fire, pinned, retreat. About 15–20 lines per faction, with radio filter |
| Story | text with portraits at launch (briefings, radio messages); no full voice acting |
| Later | voiced briefings for key story missions if the budget allows |
| Localisation | text in Korean and English at launch; voice stays in the faction languages |

---

## 7. Gameplay Test Plan

### 7.1 Playtest plan

| Phase | When | Who | What is tested | Pass criteria |
| --- | --- | --- | --- | --- |
| Automated | every build | test runner | rule functions (Node tests), layer rules, data checks, comparison with the v214 numbers | all tests green |
| Balance self-play | weekly from M3 | AI vs AI, thousands of fights | unit and faction win rates, cost-effectiveness, mission difficulty | no unit type > 60 % win rate vs its cost peer; each mission winnable by the AI player |
| Internal | each milestone | developer | full missions on 3 phone sizes | no blocker; turn under 1 min |
| Closed alpha | from M4 (vertical slice) | 5–10 friends | 1 vs 1 pass and play, first campaign missions | understand rules without help after the tutorials |
| Open beta | early access | 50–200 players (web link, community) | whole available campaign, 1 vs 1 | completion and drop-off rates per mission, bug rate |
| Usability | alpha and beta | 5 new players per round, observed | first 15 minutes: can they select, move, attack, end turn | 4 of 5 without help |

**What we measure**

- Mission completion and retry rate, turns per mission, time per turn, where players quit.
- Unit usage and win rate by faction and unit (from saved games, opt-in).
- Questionnaire after each mission: clarity (did you know why you won / lost?), difficulty, fun (1–5).

### 7.2 Game debugging plan

| Tool / practice | Purpose |
| --- | --- |
| Deterministic replays | the rules use a seeded random generator and every action is a command, so a save + command log reproduces any bug exactly |
| "Report a problem" button | exports the save, the command log, device info and the last errors as one file to attach |
| Debug overlay (developer setting) | shows line of sight, hit / penetration odds, AI action scores, hex coordinates, frame time |
| Error capture | uncaught errors logged with the turn and last command; the game offers to reload the last autosave |
| Regression tests | every fixed bug gets a test (Node test or replay) so it cannot return |
| Device matrix | low / mid / high Android phone, an iPhone, a tablet, desktop Chrome / Safari |
| Performance budget | 60 fps on a mid-range phone at 32×24, load under 5 s, memory under 300 MB; checked each milestone |
| Bug triage | severity: blocker (crash, lost save) → major (wrong rule) → minor (visual) → polish; blockers fixed before any new feature |

---

## 8. Game Launch and Marketing Plan (BM)

### 8.1 Release schedule (expected)

Estimates for a small team; each date depends on the previous milestone.

| Milestone | Content | Expected |
| --- | --- | --- |
| M1 Rewrite core | new engine reaches the current rules; 1 vs 1 US vs Wehrmacht | 2027 Q1 |
| M2 + M3 Missions and AI | mission system, deployment, triggers, AI opponent | 2027 Q2 |
| M4 Vertical slice → closed alpha | Ardennes preview (3 missions, US and German art already exists) + 1 vs 1 | 2027 Q3 |
| Early access (web, free) | Ardennes chapter + 1 vs 1 (2 maps) | 2027 Q4 |
| M5 Second front | British and Afrikakorps, North Africa chapter | 2028 Q1 |
| **1.0 launch** | all 4 chapters, 25 missions, 6 1 vs 1 maps; web + Google Play | **2028 Q2** |
| After launch | iPhone App Store build, extra challenge missions, PC (Steam) if demand | 2028 H2 |

The early access ships the Ardennes chapter out of story order because its art exists; the full release keeps the chronological order.

### 8.2 Game price (expected)

| Edition | Price | Content |
| --- | --- | --- |
| Free | ₩0 | tutorial missions (1-1 to 1-3), 1 vs 1 on two maps; playable in the browser |
| Full game (one-time purchase) | **₩8,900 / US$5.99** | full campaign (25 missions), all 1 vs 1 maps and factions |
| Later expansions (optional) | ₩4,400 / US$2.99 each | new theatre chapters (e.g. Eastern Front, Pacific), new maps |

- No ads, no loot boxes, no pay-to-win; everything that affects battles is earned in play.
- Premium is the right fit: tactics players pay for complete games and dislike energy systems; it also keeps the code free of ad and shop SDKs.
- Store costs: Google Play developer account (one-time US$25); Apple developer program (US$99 / year) only when the iPhone build ships.

### 8.3 Game marketing strategy

**Target players**

- Core: mobile strategy and tactics players, WWII and real-time-tactics fans who want a turn-based game on the phone.
- Secondary: board / wargame players; history enthusiasts.
- Markets: Korea first (Korean text, local communities), then English-speaking markets.

**Positioning:** *"Real-time WWII tactics, one turn at a time — on your phone."* The selling points are combat that
looks and plays dynamically (suppression, flanking, destruction), two-sided campaign storytelling, and no microtransactions.

**Channels and actions**

| When | Action |
| --- | --- |
| From now | devlog (short posts and GIFs of combat scenes) on X / Reddit (r/turnbasedstrategy, r/WWIIgames, r/AndroidGaming), Korean strategy communities (e.g. DC Inside strategy gallery, Ruliweb); a Discord server |
| Closed alpha | invite community members; collect feedback publicly in Discord |
| Early access | free web version on itch.io and the game's own page; YouTube Shorts / TikTok clips of tank flanks and artillery; contact tactics YouTubers and streamers with keys / links |
| Launch | Google Play store page with trailer (60 s), 8 screenshots, a short "how to play" video; press kit; launch-week discount (−30 %); submit to Google Play indie features and Korean indie game events (e.g. BIC, G-STAR indie zone) |
| After launch | regular updates (challenge missions, balance), community map / mission contests, wishlist and announcement for the iPhone version |

**Success metrics (first year)**

| Metric | Target |
| --- | --- |
| Free players (web + Play) | 20,000 |
| Conversion to full game | 5 % (≈ 1,000 sales) |
| Store rating | ≥ 4.3 |
| Campaign Chapter 1 completion (of buyers) | ≥ 60 % |
| Crash-free sessions | ≥ 99.5 % |

**Legal checks before commercial launch**

- Trademark search for "Burning Front".
- Review use of CoH3-derived statistics and unit naming (historical vehicle and weapon names are generic; no CoH3 names, art, text or sound).
- No Burning Bridges material; mechanics only.
- Age rating questionnaire (IARC) for war violence; no Nazi symbolism keeps the game sellable in Germany.

---

## Decisions still open

1. Distribution: web app first, then APK from the same code *(assumed above)*.
2. Renderer: GPU 2D with one vendored library *(assumed)*, or stay on Canvas 2D.
3. Language: JavaScript + JSDoc *(assumed)*, or TypeScript.
4. Art production: self-made in Blender, commissioned, or licensed packs; this drives the M5 date.
5. Supply (per-unit ammo and fuel) and veteran carry-over between missions.
6. Price and free tier as above, or a fully free / personal project.
