# CODEMAP

<!-- AUTO:STATS -->
238 files · 231 JS files · 122 wrapper chains · 2291 KB total
<!-- /AUTO:STATS -->

## How the code runs
- `build.js` concatenates `manifest.txt` top to bottom into one HTML: head → CSS → fonts → body markup → one `<script>` → tail.
- All `js/` files are **one classic script**: one global scope, executed in manifest order. Top-level `let`/`const`
  must be declared before code that runs at load time uses them; function declarations are hoisted.
- `js/*17e_models-1…9` are slices of one large IIFE (`TankBaker`: software 3D renderer + vehicle/soldier meshes).
  They are not valid JS on their own; keep the cut points intact.
- Boot: `js/2300_18_boot.js` → `renderCP() → initProjection() → sizeCanvas() → shellBoot()` (lobby first;
  `resetGame()` runs when a match is deployed from the setup screen).

## Wrapper chains (js/chains/)
Older versions patched behaviour by wrapping functions (`const o = F; F = function(){ … o() … }`), up to 14 layers deep.
Each chain now lives in **one file**: the outermost layer keeps the public name `F`, each lower layer is a named function
(`render__v130`, `render__v99`, …), and the original declaration was renamed `F__base` in place.
The header of each chain file lists the call order. Layers that replaced everything below them made the lower layers
dead code; those were removed.

Still wrapped in place (not safe to merge mechanically): `addLog`, `v117Hs` (re-wrapped at runtime),
`drawHexPolygon`, `drawGlyph` (old layer also called directly), `impact` (layer uses block-local state),
`incomeOf`, `v158EndOwnTurn` (non-function reassignment), `useTgl` (captured at load time).
For these, `node tools/where.js <name>` lists every reassignment ("assigned:").

<!-- AUTO:CHAINS -->
Function (layer count) — file is `js/chains/<function>.js`:
drawUnitArt (15) · render (15) · loadHistoricalMap (12) · processTurnStartStatus (12) · resetGame (12) · updateUnitInfoPanel (10) · executeCombat (9) · loadFaymonville (9) · drawBuildingShape (6) · handleSpecialTap (6) · updateVision (6) · v99Uprights (6) · calcDamage (5) · createUnitFromKey (5) · getTileMovementCost (5) · suppressionOf (5) · updateActionTiles (5) · addSuppression (4) · fxDraw (4) · previewUnit (4) · rebuildHud (4) · showTileInfo (4) · uskBlock (4) · v173Begin (4) · v99Info (4) · drawTerritory (3) · pvDraw (3) · renderTileStrip (3) · startTargetedBuild (3) · tglBtns (3) · toggleMode (3) · updateBuildMenu (3) · updateGoldUI (3) · uskPay (3) · v149Assign (3) · v151Pieces (3) · v173End (3) · v174Attack (3) · v185Drag (3) · v99BldTop (3) · v99Bunker (3) · v99Ground (3) · validActionTiles (3) · vmCheckWinner (3) · ambHeal (2) · applyPkg (2) · armorRepair (2) · bergepanzerRepair (2) · boardUnit (2) · canProd (2) · canReinforce (2) · checkElevationCombatRule (2) · drawBanner (2) · drawCapturePoint (2) · drawIco (2) · drawSkTiles (2) · drawStatusIcon (2) · faceToward (2) · fillRangeTiles (2) · getHexCenter (2) · getTerrainFillColor (2) · mgCanCover (2) · openDetail (2) · openVmSheet (2) · runStrikes (2) · settleVictory (2) · showAttackPreview (2) · skEnd (2) · skirmishPoints (2) · startTargetedDismount (2) · startTargetedSupply (2) · startUnitDeployment (2) · statusLineHtml (2) · stripStatus (2) · tglBlock (2) · throwAt (2) · tileOf (2) · useSkill (2) · uskEnd (2) · v101Portrait (2) · v105Icon (2) · v105Status (2) · v110BldBanner (2) · v129Eject (2) · v140RetStep (2) · v146EdgeSpots (2) · v146LineEdges (2) · v151RoadPolys (2) · v152ApplyDeco (2) · v153Build (2) · v159SetEmpl (2) · v159WatchFire (2) · v173Plan (2) · v173Pos (2) · v173Snap (2) · v173Tick (2) · v180TurnMs (2) · v185Confirm (2) · v99Build (2) · v99Conifer (2) · v99Decid (2) · v99Flag (2) · v99Flats (2) · v99HexLines (2) · v99Repaint (2) · v99Rock (2) · v99Territory (2) · vmRefreshHud (2) · captureTick (1) · chooseDoc (1) · drawZones (1) · retreatBlock (1) · retreatMove (1) · v132DrawOob (1) · v132DrawSectors (1) · v167CrewMarks (1) · v174Boom (1) · v174Flame (1) · v174Flash (1) · v174Puff (1) · v98Disc (1) · v99Paint (1)
<!-- /AUTO:CHAINS -->

## Where to look (by topic)
| topic | start here |
|---|---|
| unit stats, prices, rosters | `0110_07_units-squads`, `0120/0130_v162_*` (CoH3 raw data → stats), `0180_v167_unit-prices`, `0190_v162_upgrade-weapons` (kits, `createUnitFromKey`) — or `tools/unit.py` |
| veterancy | `0060_v162_veterancy-from-the-coh3` |
| terrain rules, cover, edges | `0050_04_rules-data`, `0100_06b_v143-terrain-layers`, `0700_17x_v145-edge-objects` |
| maps | `0080_06_map-gen-terrain`, `0090_v162_skirmish-test-map`, `0870_v168_skirmish-test-map-lay`, Faymonville: `0580…0820` (v132–v157) |
| hex math, helpers | `0200_08_hex-math-helpers` (`getHexCenter`, `getDistance`, `getUnitAt`, …) |
| movement, vision, firing arcs | `0210_09_movement-vision-arcs`, `0890_v173_moves-follow-a-path`, `0910_v175_two-tap-movement` |
| combat / damage formula | `0230_11_combat`, chains `executeCombat`, `calcDamage`, `suppressionOf`; v199 tank vs infantry: `0150_v199_*`; ranges/bands: `0140/0160_v200_*`, `0170_v201_*`, `0560_17s_v130_*` |
| economy, build, research, CP | `0240_12_economy-build-research-cp` |
| doctrines, skills, barrages | `0250_13_doctrine-skills-barrage`, skill range UI `0300_17b_v30` |
| special actions, supply, repair | `0260_14_special-actions-supply-repair`, marks `0830_17x5_v158`, emplace/watch fire `0840_17x6_v159` |
| input / taps / action tiles | `0270_15_input-action-tiles`, turning stage `1000_v185`, `1020_v189`, `1030_v190` |
| HUD, panels, sheets | `0280_16_ui-panels-hud`, chain `updateUnitInfoPanel` |
| turn flow, victory | `0290_17_turn-flow`, chains `processTurnStartStatus`, `resetGame`; zones/VP `0320_17c_v59-zone-capture` |
| rendering | chain `render` (outermost) → `render__base` in `0220_10_render`; unit art chain `drawUnitArt`; map look `0440_17g_v99`, `0630_17z_v137` |
| animations / effects | `0900_v174` … `0970_v181`, turret/hull `0980_v182`, `0990_v183`, `1040_v194` |
| app shell (lobby, setup, save, AAR, undo) | `1050_19_game-shell-1`, `1060_19_game-shell-2` |
| styles / theme | `css/01_styles.css`, `css/02_styles.css` (v204 frame, theme presets) |

## Event listeners shared by several files
Several handlers on one element + event run in registration order, i.e. manifest order.
<!-- AUTO:LISTENERS -->
| element · event | handlers | where (in run order) |
|---|---:|---|
| canvas · click | 6 | js/0270_15_input-action-tiles.js:160, js/0300_17b_v30.js:214, js/0300_17b_v30.js:224, js/0720_17x_v147-structures-garrison-banner.js:112, js/0890_v173_moves-follow-a-path.js:116, js/0900_v174_move-animation-tuning-burning.js:95 |
| endTurnBtn · click | 6 | js/0290_17_turn-flow.js:5, js/0290_17_turn-flow.js:15, js/0290_17_turn-flow.js:115, js/0290_17_turn-flow.js:134, js/1050_19_game-shell-1.js:347, js/1050_19_game-shell-1.js:348 |
| canvas · pointerdown | 3 | js/0030_02_ui-utils.js:10, js/0270_15_input-action-tiles.js:81, js/1050_19_game-shell-1.js:318 |
| goldBoxEl · click | 3 | js/0280_16_ui-panels-hud.js:226, js/0320_17c_v59-zone-capture.js:235, js/1060_19_game-shell-2.js:3 |
| document · pointerdown | 3 | js/0280_16_ui-panels-hud.js:408, js/0300_17b_v30.js:236, js/1050_19_game-shell-1.js:96 |
| supTab · click | 2 | js/0030_02_ui-utils.js:9, js/1050_19_game-shell-1.js:319 |
| window · keydown | 2 | js/0040_03_viewport-camera.js:105, js/0280_16_ui-panels-hud.js:224 |
| goldBoxEl · keydown | 2 | js/0280_16_ui-panels-hud.js:227, js/0320_17c_v59-zone-capture.js:236 |
| window · resize | 2 | js/0450_17h_v100-ui-visual-overhaul.js:224, js/1050_19_game-shell-1.js:722 |
| sel · change | 2 | js/0950_v179_ricochets-thrown-launched-skill.js:133, js/0990_v183_turret-hull-rules-for.js:41 |
<!-- /AUTO:LISTENERS -->

## All files
The full file table (lines, size, header of every file) is in `FILES.md` — open it only when the topic table above is not enough.

## Tools
| command | what it does |
|---|---|
| `node build.js` | build `dist/burning_front_v<VERSION>.html` |
| `node tools/where.js <name> [--uses]` | declaration / assignments / uses as file:line; points to the chain file |
| `node tools/where.js --list [text]` | every top-level declaration with file:line |
| `python3 -I tools/unit.py <key\|name> [--team blue\|red] [--spawn]` | final computed unit stats from a headless run |
| `node tools/codemap.js` | refresh the AUTO tables in this file |
| `tools/regress.sh <a.html> <b.html>` | seeded play-through of both builds, compares state/DOM/pixels per step |
| `tools/refactor/*` | one-off scripts used for the v209 restructure (split, chain merge, dead code); kept for reference |
