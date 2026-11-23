# CHANGELOG

Gameplay history before v209 lives in the section headers of the source files (`[vNNN] …`) and in FILES.md.
New entries go on top, one short block per delivered version.

## R0 — rewrite Phase 0: new folder, build and state machines
- v214 moved unchanged to `legacy/` (tag `v214-legacy`); `node legacy/build.js` still builds the identical file.
- New tree `src/` (core / app / input / view / services), `data/`, `tests/`; new `build.js` bundles ES modules into
  one HTML with no npm packages, runs the tests first and refuses builds that break the layer rules
  (e.g. `Math.random` or `document` inside `src/core/`).
- `src/core/fsm.js`: enums + transition tables for every state in the game. First machine: App
  (Boot, Lobby, Setup, Loading, Playing, Paused, TurnCurtain, GameOver, Result).
- Playable build shows the lobby; other screens are stand-ins with one button per allowed transition.

## v214 — indirect fire from the CoH3 data
- Mortars, howitzers, SPG artillery and rocket launchers take damage, penetration, AoE falloff, member cap and scatter from the CoH3 JSON
  (`tools/coh3_indirect.py` → `js/0125_v214_coh3-indirect-generated.js`); ranges and prices unchanged.
- New reload turns: 105 mm, 150 mm, Priest, Wespe, Whizbang 1 turn; 210 mm and Nebelwerfer 2 turns. Reloading units cannot return fire.
- Accuracy is the chance to land on the hex (from scatter); member caps 210 mm 3, 150 mm and Nebelwerfer 5.
- Out-of-sight fire uses the same damage per shell; 105 mm barrage ability fires 6 shells.

## v213 — indirect fire: more shells, lower accuracy
- Mortars, howitzers, SPG artillery and rocket launchers fire 2–9 shells at about half the old accuracy with a wider hit area;
  attack set so even an all-hit volley leaves a full squad alive. One volley ≈ 35–43 % of a squad (was 50–93 %, Whizbang killed 48 %).
- No new mechanics, prices unchanged. Damage vs vehicles is lower (was already small).

## v212 — blind indirect fire, large emplacements, 2-hex build range
- Indirect fire can target hexes out of sight in range: shells land at random within 7 hexes of the aimed hex (tap twice; no names in the log).
- 105 mm, 210 mm and 88 mm emplacements take 7 hexes (centre + neighbours), no overlap; prices 320/60, 360/60, 320/65.
- Engineers build everything 1–2 hexes away.
- Removed the CP3 "2 counters" research; every unit counters once.
- Yellow cover cuts suppression to ×0.5 (was ×0.7).
- 150 mm sFH 18 price 340/60 (was 400/60).
- Rocket volley ability lands in the turn it is fired (was next own turn).
- Fix: structure damage from impacts that pass a unit profile (was NaN).

## v211 — lobby emblem without a setting line
- Removed "ARDENNES · WINTER 1944" from the lobby emblem: the game will cover battlefields of several eras, not only the Ardennes.

## v210 — renamed to Burning Front
- Title, lobby emblem and info screen say "Burning Front"; build output is `burning_front_v<VERSION>.html`.
- The version number lives only in `VERSION`; build.js fills it into the title and the in-game version (was hard-coded v208).
- Save / settings keys (`coh1944.*`, sprite cache DB) unchanged so existing saves and settings survive.

## v209 — source restructure (no gameplay change)
- Split the single 2.3 MB HTML into 230 JS files + CSS / fonts / markup, rebuilt by `build.js` (no dependencies).
- 122 wrapper chains (280 layers, up to 14 deep) collected into `js/chains/<function>.js`; originals renamed `F__base`.
- Removed dead code: 28 chain layers that a later layer had fully replaced, 25 functions referenced nowhere.
- Added SPEC.md: rules in force, checked against the code; decided-but-unimplemented items and code/request mismatches listed.
- Replaced the stale in-script table of contents with CODEMAP.md (+ FILES.md, CLAUDE.md).
- Added tools: `where.js` (symbol lookup), `unit.py` (computed unit stats), `regress.sh` / `harness.py` (seeded
  play-through comparing two builds).
- Verified: 4 seeded play-throughs (skirmish ×3 at 200 steps, Faymonville at 120 steps) give identical game state,
  DOM and canvas pixels to v208 at every step.
