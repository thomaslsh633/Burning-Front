# SPEC — rules in force (v209)

> The rules below are the target for the rewrite in `src/`. File and function references (`js/…`, `tools/…`) point into `legacy/`.

What the game does **now**, checked against the v209 code (= v208 behaviour). One line per rule, newest decision only.
`(vNNN)` = version that set the rule; the code for it carries the same tag (`node tools/where.js` / grep `vNNN`).
Unit numbers are not copied here: `python3 -I tools/unit.py <unit>` prints them from the running game.

Update this file in the same change that alters a rule. Section 10 holds decided rules that are not in the code yet;
move a line up when it ships. Section 11 lists places where the code differs from an earlier request.

## 1. Scale and data
- 1 hex = 7 m, 1 turn = 10 s; rate of fire = shots in 6 s per turn, the fraction carries over to the next turn (v162, v164, v165).
- Unit data: CoH3 in-game JSON (US / Wehrmacht) + coh3stats 3.0.1; units without CoH3 data are estimates on the same scale (v162, v167).
- Engine scale: HP / damage ×0.36, penetration / armour ×0.12; every number the player sees is the raw CoH3 value (v162, v167).
- Stats are whole numbers where the player sees them (v162).
- Movement: infantry 3.6 m/s = 4 hexes per turn, everything else by its speed ratio; crew weapons move 4 (v162, v172).
- Range: weapon max range / 7 m, then +1 for direct-fire weapons only; heavy-weapon teams and indirect fire keep their range (v200).
- Sight: +1 for every unit (v200).
- Range bands: near / mid / far = thirds of the range (6 → 1-2 / 3-4 / 5-6; 7 → 1-3 / 4-5 / 6-7) (v200).
  Exception: lobbed-HE vehicles (M4(105) Dozer, Brummbär, Stummel) use the near-band values over the whole range (v201).
- Removed units: M22 Locust (v191).

## 2. Match setup and victory
- Flow: lobby → setup → (briefing) → play → turn curtain (pass & play) or flash banner (skirmish) → AAR; autosave, also on leaving the app; move undo (v202).
- Two players on one screen, no AI (v202).
- Maps: Skirmish 1v1 22×14 (every tier building pre-built; modes capture, annihilation); Faymonville 48×48 at 0.9 scale (capture) (v162, v168, v169, v202).
- Capture mode: the opponent's Victory-Meter tickets reach 0 (default 350). No turn limit, no HQ-kill or resource win (v59).
- Annihilation mode (Skirmish only): win when every enemy unit is gone (passengers included) AND the enemy cannot deploy a new one
  (no working production building, or not enough resources for its cheapest unit); optional round cap (v202).
- HQ cannot be destroyed (crippled state); HQ HP 690 (v59, v126).
- Start resources, standard: 600 MP / 10 munitions / 20 fuel; the side moving second gets +40 MP / +10 munitions once (editable in setup) (v206).
  Larger test presets: fuel = 7 % of funds, munitions 60 (v206).
- Turn-start order: strikes → status → capture tick → victory settlement → income (v59).

## 3. Points, economy, production
- A point is captured by holding its zone (VP radius 2, resource points radius 1) through turn-start ticks, never by stepping on a hex (v59).
- Capture and neutralisation each take 2 ticks of the side's own turn starts: neutral → own = 2 turns; enemy → neutral → own = 4 turns (v139).
  (Confirmed correct; strength-based capture is planned, section 10.)
  Both sides armed in the zone = contested, progress frozen; leaving the zone loses the progress (v59).
- Who counts: armed, un-pinned infantry / crews capture; pinned infantry and armed vehicles only contest; unarmed vehicles and passengers are ignored (v59).
- Sectors: a captured point takes its sector; resources pay only while the sector links to the HQ sector through own sectors; VPs always count (v131).
- Income: HQ base 60 MP; fuel points 12 fuel + 10 MP; munition points 11 munitions + 10 MP (v140, v166).
- Upkeep: each unit 4 % of its price, at most 40 MP per unit, the excess / 3 paid in fuel; net MP income never below 25 % of gross (v141).
- Kill bounty: destroying an enemy unit pays max(40, 20 % of its value) MP (`claimKillBounty`) — decided to remove, see section 10.
- No reinforcing while engaged (v158).
- Buildings at CoH3 prices; T1 builds in 1 turn, T2 / T3 in 2 with an engineer-type unit within 2 hexes; a site starts at 50 % HP and produces nothing (v140, v212).
- Build range: engineers build everything (trench, sandbag, mine, bunker, building, emplacement) 1–2 hexes away, never on their own hex;
  a footprint may not include the engineer's hex; no overlap with buildings, units, emplacements, bunkers or points (v151, v212).
- CP milestones: CP2 field fortification (build −15 %), CP5 heavy tanks. The CP3 "2 counters" research is gone; every unit counters once per turn (v212).
- Prices: 105 mm howitzer 320 MP / 60 fuel, 150 mm sFH 18 340 / 60 (v212).

## 4. Combat
- Attack = one damage value + penetration per band + accuracy per band; each shot rolls hit, then penetration (v126, v161).
- A hit lands on one squad member and never carries to the next (no overkill); HE adds splash (v162).
- Squads lose firepower per lost man and take −30 % received accuracy × lost men / (N − 1) (v140).
- Tank main gun vs infantry / crews: one attack value; "persons reached" per shell decides damage (v199):
  shared hit table near / mid / far 75 / 60 / 45 % × target size; cover removes persons (yellow ×0.7, green ×0.45);
  persons: Sherman 2, Chaffee 1.5, Easy Eight 1.25, Pershing 2.5, Dozer 3.5, M3 GMC 2.5, M18 0.75 ·
  Pz IV 2, Pz IV cmd 2, Panther 1.25, Tiger 2, Brummbär 3.5, Stummel 3, StuG 1.25, Marder 0.75.
- M3 GMC and Stummel are curved-fire support half-tracks: role anti-infantry, cover never reduces persons, minimum range 2 (v199).
- Vehicles take no terrain cover (v140).
- Cover vs suppression (soft targets): yellow ×0.5, hard ×0.3; garrisoned 0; indirect fire ignores cover (v145, v212).
- Range view (long press) paints only hexes the unit can really hit: direct fire needs a clear line; mortars, howitzers and rockets fire over cover (v206).
- Engaged mark: set by attacking (or an attack ability), not by taking damage; cleared at the end of an own turn without an attack and by retreat (retreat flag instead) (v158).
- Retreat: ×1.6 movement toward the rally point (HQ or a designated outpost), received accuracy ×0.5, no return fire; not after attacking this turn;
  walks on by itself each turn start until within 3 hexes of the rally point (v140).

## 5. Crew weapons (MG, mortar, AT / AA / field guns, rockets)
- Packed: can move and turn the arc, cannot fire. Emplaced: cannot move or turn, fires from the turn after emplacing (v159).
- Emplaced: received damage −10 %, suppression −20 %; emplacing spends the remaining move; a crew that fired cannot pack up; only MGs emplace inside buildings (v159).
- Packed crews emplace by themselves at the end of their turn (v206). Crews at game start begin emplaced, new / unloaded crews begin packed (v159).
- Watch fire (toggle, default on): an emplaced direct-fire crew with a limited arc fires once per enemy turn, without return fire, at a visible enemy moving into range and arc (v159).
  AT weapons have no watch fire (v198). MG cover fire is gone (v159).
- Concealment: an emplaced crew in cover that spends a whole own turn without firing becomes concealed (seen from 2 hexes, lost on moving / firing) (v159).
- Crews turn for free while packed (no mortars / artillery / Nebelwerfer); turning lives in the turn stage, 거치 / 거치 해제 stay in the skill tray (v189).
- Indirect fire (mortars, howitzers, SPG artillery, rocket launchers) may target hexes out of own sight inside range and arc:
  blind barrage = the unit's shells (rof, at least 1) land at random within radius 1 (7 hexes) of the aimed hex and hit whatever stands there;
  first tap marks, second tap fires; no return fire, the log names no target. Targets in sight keep the aimed shot (v212).
- Indirect fire from CoH3 data (v214, `js/0125` generated by `tools/coh3_indirect.py`, applied in `js/0145`):
  damage ×0.36, penetration ×0.12, AoE falloff (averaged over a 5 m squad spread) and scatter from the game JSON; range = the game's current range.
  Raw HE rule: a direct hit lands on one man (at most his HP), the falloff splashes the others up to the member cap; a miss splashes half.
  Accuracy = chance to land on the target hex, from the scatter at each band's middle distance.
  Turn values — shells per attack / reload own turns / member cap: 81 mm 1/0/4 · 75 mm pack 1/0/4 · Scott 1/0/3 · 105 mm 1/1/4 · Priest 1/1/4 ·
  Whizbang 2/1/4 · 150 mm sFH 18 and Hummel 1/1/5 · Wespe 1/1/4 · 210 mm 1/2/3 · Nebelwerfer 2/2/5. A reloading unit cannot fire or return fire.
- 105 mm concentrated barrage ability: 6 shells (CoH3 HE barrage), cooldown 4 turns (v214).
- Rocket volley ability (Whizbang, Nebelwerfer): 5 rockets, radius 2, all land in the turn it is fired (v212).
  Pending (next own turn) barrages remain for the mortar / 105 / 150 mm concentrated fire and forward-observer abilities.
- Emplacements: large (7 hexes: centre + 6 neighbours, all open ground) = 105 mm howitzer pit 320/60, 210 mm 360/60, 88 mm Flak 320/65;
  Pak bunker, 20 mm Flak, mortar pit stay 1 hex. Any footprint hex selects the emplacement and blocks movement (v134, v212).
- Marks: packed = yellow badge, emplacing this turn = yellow tripod, emplaced = no mark (v206).

## 6. Vehicles: facing, turret, reverse
- Hull facing changes only by moving or by a turn action: up to 120° costs 1 move, wider turns 2 (up to 180°) (v197).
- Turning: long-press drag or the 선회 tile opens the turn stage; the tray shows only "선회 확정" (no ✔ icon); empty-spot tap cancels;
  the red fire tiles follow the proposed arc while dragging; no text prompts (v185, v189, v190).
- Vehicles may turn after attacking (v191). Emplace then pack in the same turn keeps the new direction (v191).
- Split turrets (turret aims, hull stays; hit zones follow the hull): Sherman, Grant (upper turret), Chaffee, Stuart, Easy Eight, Pershing,
  Dozer, M18, M8 Greyhound, M16 · Pz IV, Pz IV cmd, Pz III L, Panther, Tiger, Puma, Wirbelwind (v183, v191, v192, v195).
- Turret hold: while engaged the turret keeps its absolute aim when the hull moves or turns; at the end of the owner's turn every
  unengaged turret swings back to the hull; no manual realign tile (v194).
- Fixed guns, 120° arc around the hull, attacking turns the hull to the target at no move cost but only inside the arc:
  StuG, Brummbär, Marder III, Wanze, Stummel, Sd.Kfz. 221 sPzB · M3 GMC (v185, v186, v187, v191, v193).
- Artillery has no firing arc (v188).
- Reverse ("후진" toggle, every vehicle): move tiles inside ±60° behind the hull at +1 move per hex; the hull keeps its facing;
  the toggle switches off after one move (v196, v197).
- Movement animation by weight class (infantry / crew weapon size / wheeled / tank medium / heavy) (v207).

## 7. Support actions
- Repair: every engineer-type unit and recovery vehicles; full amount even when engaged (v140, v158).
  The repaired vehicle carries the repair mark until its side's next turn: received hit chance ×2 (cap 100 %), received damage ×2.
  The repairer cannot attack or use abilities in the turn it repairs, and cannot start repairing after attacking (v158).
- Healing out of combat at turn start: HQ +20 within 3 hexes, medical vehicles / medic bunkers +15 within 3 (v140); none while engaged (v158).
- Conversion (v208), in place, keeping id, hex, facing, veterancy and HP ratio; needs a building that can produce the target, near own HQ (3) or outpost (2), out of combat:
  promotion (full squad): US Riflemen → Rangers / Paratroopers / Commandos · Grenadiers → Panzergrenadiers / Sturmtruppen / Jäger / Fallschirmjäger;
  price = MP cost difference, rounded to 5.
  refit: M3 half-track → M3 GMC · Sd.Kfz. 221 → 221 sPzB · Sd.Kfz. 251 → Stummel; price = 2 × MP and fuel difference, rounded to 5.

## 8. UI conventions
- Tile colours: green = move (selected path a little darker, blinking), red = attack range (smoke and grenades too), yellow = buff / heal only,
  blue = deploy / unload / drop / spawn (v30, v31, v32, v175; skill colours: `SKRGB` in `0300_17b_v30.js`).
- Two-tap actions: first tap previews (path + move cost, or skill result), a second tap on the same hex executes, anywhere else cancels (v30, v175).
- HP preview: the banner HP bar shows the expected loss as a black section fading in and out; no numbers (v33).
- No instructional text on the map or in prompts ("tap again to …", landing labels) (v31, v188).
- Angular UI: border-radius ≤ 2 px; frame order cream edge > matte grey shade > blue-grey plate; unit card, tray buttons and combat previews use the same plate (v204).
- Turn-end button: icon only; no idle-unit popup; briefing / log reachable from the settings menu (v205).
- Theme presets taken from CoH3 UI colours only (v205).

## 9. Visual direction
- Name "Burning Front" (v210). Battlefields of several eras and places, not only the Ardennes 1944: game-wide UI (lobby, title) names no single setting; place and date belong to each map's briefing (v211).
- Realistic CoH3 / Burning Bridges look; gunmetal + navy UI; factions by US flag vs red-background iron cross; illustrated 2D icons.
- No flags or antennas drawn on vehicles (v181, v183).

## 10. Decided, not in the code yet
Confirmed 2026-11-25 (rewrite):
- Per-unit ammunition stays: each attack spends ammo; supply trucks / supply sources refill it.
- Per-unit fuel consumption is removed: vehicles move without spending unit fuel. Fuel remains a faction resource (prices, upkeep, income).
- Release scope: North Africa and Italy only (factions: Afrikakorps, British Forces, US Forces, Wehrmacht); free web release.

Confirmed 2026-11-22:
- Capture by strength: each capturing man adds 1 point per tick; 2 points neutralise or capture in one turn
  (e.g. 2 men together neutralise an enemy point in one turn instead of 2). Still 2 points per step.
- Upkeep: 2 % of each unit's price (was 4 %), at most 20 MP per unit (was 40).
- Remove the kill bounty (MP for destroying an enemy unit).
- Delete the Wehrmacht Panzerschreck squad (`at_inf`, duplicates Jäger).
- Annihilation mode gets a dedicated, capturable HQ building (capturing it is a win route next to "no units and cannot deploy").

From the v211+ planning (code is still v208 behaviour):
- Add CoH3 stats for units missing from the list (Grant, Pz III, Flak 36 / 38, 150 mm sFH 18 as a stand-in from similar real guns, Obice, …);
  DAK / British stats from the uploaded CoH3 JSON + coh3stats 3.0.1.
- Multi-hex buildings: a unit inside is seen when any hex of the building is visible.
- Lower the flamethrower bonus vs units in buildings.
- Hide hexes blocked by cover while a firing-arc unit is being turned.
- Balance: emplacement protection, MG suppression (or counters), indirect fire rate / kill speed.
- v215-based re-apply plan, still open: MG suppression 40 · indirect crew weapons do not return fire · green cover values ·
  rocket 7-hex random barrage for normal fire · Whizbang more rockets · Nebel incendiary · Whizbang → M4A1 Sherman conversion ·
  emplacement build turns. Missing from this code line: Flak 36 move 2 (v213), multi-hex building garrison sight (v214),
  flamethrower vs buildings lowered (v215).

## 11. Code differs from an earlier request (confirm which is right)
None open. Resolved 2026-11-22: capture 2 ticks per step (v139) is correct; upkeep since v141 is correct (new values in section 10);
Panzerschreck squad deletion confirmed; annihilation HQ capture comes with the dedicated HQ building (section 10).
