# CHANGELOG

Gameplay history before v209 lives in the section headers of the source files (`[vNNN] …`) and in FILES.md.
New entries go on top, one short block per delivered version.

## rewrite — doctrines (2026-11-28)
- Each side picks one CoH3 battlegroup per match: its units join the tier buildings, its abilities and conversions open.

## rewrite — research (2026-11-28)
- Production buildings research CoH3 upgrades (e.g. Riflemen grenades) and their locked units (e.g. Sherman 76 mm).
- Research takes turns, one item per building at a time; the greybox and automatic 1v1s use it.

## rewrite — abilities (2026-11-28)
- Squads use their CoH3 grenades, satchels, Panzerfausts, special shots and barrages: paid in munitions, then a cooldown.
- Greybox lists each unit's abilities (with why one is locked); automatic 1v1s use them.

## rewrite — fortified positions, paradrop (2026-11-28)
- Engineers build fighting positions, bunkers and emplacements from their CoH3 build menu; sites take turns and can be shot.
- Paratroopers, Fallschirmjäger, Folgore and commandos drop anywhere on the map; an HMG or mortar team takes one slot.

## rewrite — garrisons and transports (2026-11-28)
- Squads and MG teams garrison houses; squads and heavy weapon teams ride half-tracks, trucks and other CoH3 transports.
- Passengers move with the vehicle and get out beside it; a destroyed transport loses half of each squad inside.

## rewrite — weapon kits, autoplay (2026-11-28)
- Squads can buy weapon kits (e.g. a BAR for riflemen): one man switches to the new weapon.
- Automatic 1v1s between all faction pairs run to the end without errors; a free supply truck was found and priced.

## rewrite — greybox production (2026-11-28)
- New test map with every tier building per side; tap a building to produce, tap a unit to see its conversions.
- Brummbär fires every turn at what it sees; Guards (Italy) carry their bazookas.

## rewrite — data fixes, camera turn and zoom (2026-11-28)
- Ammunition ×1.5; bazooka teams, Panzerjäger and similar squads now carry their AT weapons; HE splash hits whole squads.
- Greybox: turn the map and zoom (buttons, mouse wheel, pinch); one finger scrolls; checked on emulated phones.

## rewrite — G-1 all factions, G-4 TTK report (2026-11-28)
- US Forces, Wehrmacht, Afrikakorps and British Forces imported from CoH3: 287 squads.
- A time-to-kill report duels every armed squad against reference targets and flags outliers.
- Greybox: an art-free playable screen (`greybox.html`) with a debug panel, served by `node tools/greybox/serve.js`.

## rewrite — unit unlocks (2026-11-28)
- Each faction's tier buildings list their units as base, doctrine-unlocked or research-unlocked.
- Mid-game engineers (Guastatori, Fallschirmpioneers, Assault Engineers) come from tier buildings, not the HQ.

## rewrite — production by tier (2026-11-28)
- Buildings are tier slots T1–T3 per faction (a tier may branch: T2A / T2B); no doctrine buildings.
- The HQ builds only engineers and recon units; doctrine units come from the tier buildings.

## rewrite — rule decisions (2026-11-28)
- Pinned units no longer counter fire; a retreating unit reaching its rally point at its turn start can still act.
- Any squad can recrew a gun; capture speed adds up the squads' capture rates.
- Tier buildings take 8 Sherman hits (tier 3–4: 11, HQ: 16); houses and the church on the same scale (5 / 8 / 11 / 16).
- Explosives do full damage to buildings and other map features.

## rewrite — every building destructible, HQ rebuild (2026-11-26)
- HQs and production buildings can be destroyed in every mode; capture mode is still won by tickets.
- A destroyed HQ gives no income and produces nothing until engineers rebuild it on its footprint.

## rewrite — annihilation by HQ, field conversions (2026-11-26)
- Annihilation: destroy the enemy HQ or every enemy unit; the HQ can be destroyed in this mode only.
- Units convert in the field (e.g. 251 → Stummel, M3 → M16, Crusader II → III) for munitions / fuel / manpower.

## rewrite — D2-9 victory, D2 done (2026-11-26)
- Capture mode: the Victory Meter bleeds the side behind on VPs every turn start; 0 tickets loses.
- Annihilation: a side with no units that cannot field a new one loses; optional round cap.
- A whole 1v1 match now plays to the end through commands alone (integration test).

## rewrite — D2-8 points and economy (2026-11-26)
- Points are taken at turn-start ticks, one point per capturing squad; contested zones freeze; sectors decide supply.
- Income and upkeep at each own turn start; `Produce` buys a squad beside the HQ or a production building, with the CoH3
  production lists of each faction; population cap 300.
- Vehicles are never abandoned or captured; crewless guns can be destroyed by either side; reloading units do not counter.

## rewrite — D2-7 turn flow and reactions (2026-11-26)
- `EndTurn` / `StartMatch`: turn-end and turn-start hooks in a fixed order; retreating units walk on by themselves.
- Counter fire once per enemy turn; MG overwatch (`Hold`) that can stop a move; engaged mark and turret return.
- `Recrew`, `Abandon` and `ClearWreck` commands; a crew without its gun fights as a small squad.

## rewrite — folder structure (2026-11-25)
- v214 moved to `legacy/` unchanged (frozen, builds with `node legacy/build.js`); it is the reference for the rewrite.
- New tree: `src/` in three layers (presentation / logic / services) plus `app/`, one folder per system, `data/` per data form.
- `docs/ARCHITECTURE.md` describes the layers and rules; `npm run check` enforces imports and pure-code globals; `npm test` runs `tests/`.

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
