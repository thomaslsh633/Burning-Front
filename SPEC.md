# SPEC — rules in force (v209)

> The rules below are the target for the rewrite in `src/`. File and function references (`js/…`, `tools/…`) point into `legacy/`.

What the game does **now**, checked against the v209 code (= v208 behaviour). One line per rule, newest decision only.
`(vNNN)` = version that set the rule; the code for it carries the same tag (`node tools/where.js` / grep `vNNN`).
Unit numbers are not copied here: `python3 -I tools/unit.py <unit>` prints them from the running game.

Update this file in the same change that alters a rule. Section 10 holds decided rules that are not in the code yet;
move a line up when it ships. Section 11 lists places where the code differs from an earlier request.

## 1. Scale and data
- 1 hex = 7 m, 1 turn = 10 s; rate of fire = shots in 6 s per turn, the fraction carries over to the next turn (v162, v164, v165).
  The scale numbers in this section live in `data/balance/scale.json`; tools read them from there.
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
  The converted v214 maps (`data/maps/skirmish`, `faymonville`) are reference only; new maps are made from scratch (2026-11-26).
- Capture mode: the opponent's Victory-Meter tickets reach 0 (default 350). No turn limit, no HQ-kill or resource win (v59).
  Settlement at every side's turn start (D2-9, `data/balance/victory.json`, v214 values): the side behind on VPs loses
  2 / 5 / 10 tickets for a lead of 1 / 2 / 3+, +1 per 6 consecutive settlements with the same leader (a shrinking lead halves
  the streak); at VP parity a resource-control gap of 4 (fuel / munition / manpower points 2 each) costs the weaker side 1.
  Both at 0: more VPs wins.
- Annihilation mode (2026-11-26): win by destroying the enemy HQ or by eliminating every enemy unit (passengers included);
  no HQ capture, no "cannot deploy" clause; optional round cap (v202). Checked at each side's turn start; both sides out at
  once: the side whose turn starts wins; after the round cap the higher surviving unit value wins, equal is a draw.
- Buildings by class (2026-11-28): HQ, tier buildings (production), doctrine buildings (produce nothing yet), neutral buildings
  (houses, church). Every building can be destroyed, in every mode (2026-11-26). Tier, doctrine and HQ buildings: CoH3 armour
  35 (below every tank gun's penetration) and HP in CoH3's ratio 1500 : 2000 : 3000 scaled so a Sherman 75 mm needs at least
  8 hits: tier 1–2 1000 HP (8 hits), tier 3–4 1375 (11), HQ 2000 (16) (`data/rules/terrain.json`). Neutral buildings on
  the same scale, armour 35: small house 625 (5), house 1000 (8), large house 1375 (11), church 2000 (16). Explosives hit
  every building and map feature at full damage; other damage scales by penetration ÷ armour (2026-11-28). Capture mode
  is still won by VP tickets only. A destroyed HQ pays
  no base income, produces nothing and links no sector; the side's engineers may rebuild it on its own footprint (one HQ
  per side at a time): 500 MP (CoH3 HQ cost) when work starts, 2 turns of work within 2 hexes, it stands again at 50 % HP
  (design values, confirmed 2026-11-28).
  A destroyed production building produces nothing (not rebuildable yet).
- Start resources, standard: 600 MP / 10 munitions / 20 fuel; the side moving second gets +40 MP / +10 munitions once (editable in setup) (v206).
  Larger test presets: fuel = 7 % of funds, munitions 60 (v206).
- Turn-start order: strikes → status → capture tick → victory settlement → income (v59).

## 3. Points, economy, production
- A point is captured by holding its zone (VP radius 2, resource points radius 1) through turn-start ticks, never by stepping on a hex (v59).
- Capture by squad (2026-11-28, `data/balance/economy.json`): at each of the side's own turn starts the capturing squads'
  CoH3 capture rates add up (riflemen / grenadiers 1.25; per squad, not per man); 2 points neutralise an enemy point or
  capture a neutral one; the steps enemy → neutral → own are separate (at most one step per tick, the rest is not carried
  over): one rifle squad takes a neutral point in 2 turns, two squads in 1; enemy → neutral → own takes twice as long.
  Both sides armed in the zone = contested, progress frozen; leaving the zone loses the progress (v59).
- Who counts: armed, un-pinned infantry / crews capture; pinned infantry and armed vehicles only contest; unarmed vehicles and passengers are ignored (v59).
- Sectors: a captured point takes its sector; resources pay only while the sector links to the HQ sector through own sectors; VPs always count (v131).
- Income per own turn: HQ 60 MP + 5 fuel + 10 munitions (none while the HQ is destroyed); manpower points 70 MP; fuel points 12 fuel + 10 MP; munition points
  11 munitions + 10 MP; VPs pay nothing; a map may set a point's own yield (`yield`) (D2-8, confirmed 2026-11-26).
  Sectors (when the map defines them) as above.
- Upkeep (D2-8): each active unit 2 % of its manpower price, at most 20 MP per unit, the excess / 3 paid in fuel; net MP income
  never below 25 % of gross.
- No kill bounty (removed 2026-11-22).
- Production (D2-8): the HQ and each own production building (map `production` type → the faction's CoH3 building,
  `data/rules/production.json`) offer what that CoH3 building spawns (as coh3stats' explorer lists it; generated by
  `tools/coh3/production.js`); the unit is paid at once, stands on a free hex beside the building and acts from the next own
  turn. Population cap 300 per side (sum of squad pop).
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
  walks on by itself each turn start until within 3 hexes of the rally point (v140); reaching it at its turn start, it may
  still act that turn (its move is spent) (2026-11-28).

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
- Conversion (2026-11-26, replaces v208): CoH3 field conversions to another blueprint (`data/rules/conversions.json`), anywhere,
  out of combat (not engaged), for the listed cost and the unit's action; in place, keeping id, hex, facing and veterancy;
  each member keeps its HP share (dead men stay dead, new members start at the unit's share). Battlegroup-tied and global
  conversions (e.g. Riflemen → Rangers, M1919 → M2HB, M4A1 → M4A1(76)) need research (not built yet). Weapon upgrades on the
  same blueprint (221 Panzerbüchse 41 and radio antenna, Demo Sappers, Panzer III / StuG gun swap) are not conversions.
  Squads reached only by conversion are not produced by buildings.

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
- Campaign: veterancy does not carry over between missions.
- Data authority: all unit stats, weapon values and mechanics come from the CoH3 data (`data/source/coh3`), converted and tuned
  for turns and hexes. v214 is a gameplay reference only, not a data baseline; differences from v214 are reported, not errors.
- Unit state: every unit is in one state on each of six axes (action, stance, location, morale, lifecycle, visibility);
  behaviour comes from these state machines (`docs/unit-state.md`). Critical conditions are a set on an active vehicle.
- Fire rate (replaces the §1 fraction carry-over): the CoH3 rate per range band comes from CoH3 timings (aim, wind-up / down,
  burst, cooldown, reload) over a 6 s fire window; the game uses whole shots, and expected damage per turn stays the CoH3 rate:
  · small arms (volley): whole damage per shot (≥ CoH3 damage ÷ 6) and whole shots, the largest damage that keeps every
    band within 5 % where possible; suppression per shot scaled the same way (Kar98k: 5 / 4 / 4 shots at 5);
  · tank guns, AT guns, infantry AT (and small arms slower than one shot per turn): one shot per turn, damage × rate
    (Sherman 75 mm 120 → 125);
  · artillery (mortars, howitzers, heavy artillery): CoH3 damage per shell kept; rate rounded up as shells per turn or
    reload turns, accuracy × (CoH3 rate ÷ game rate) (81 mm: 2 shells, accuracy ×0.89; 105 mm: 1 shell every 2 turns,
    accuracy ×0.83); further balance through reload, scatter and accuracy overrides. Artillery too slow for normal fire is
    fired by abilities only;
  · grenades and mines: one shot per use at CoH3 damage. Settings: `data/balance/fire-rate.json`.
- Numbers are whole wherever possible (rounded): shots, damage per shot, HP, cost. Small arms pick a whole damage per shot
  and whole shots together (Kar98k: 5 / 4 / 4 shots at 5; Garand: 13 / 9 / 7 at 3); single-shot damage is rounded
  (57 mm AT 202 / 201 / 199). Only ratios (accuracy, multipliers) keep two decimals.
- Factions and data sets: Wehrmacht, US Forces, Afrikakorps from their CoH3 sets; British Forces use CoH3 `british_africa`
  in North Africa and CoH3 `british` in Italy (`data/rules/roster.json`).
- Roster: units CoH3 produces, builds, spawns by upgrade or calls in, plus units restored from v214 (Fallschirmjäger,
  Fallschirmpioniere, medical half-track, Stummel, recovery vehicle, medical truck; US ambulance, recovery vehicle, 6×6 truck).
  British North Africa: every CoH3 `british_africa` squad (73), incl. Indian infantry, SAS, Commandos, Crusader 57 mm, Priest.
  Missing stats come from comparable units (`clone` in roster.json): Australian supply truck cost from the CWT 15 flatbed.
  Every unit coh3stats.com lists with an English name is in the roster too (e.g. Assault Grenadiers, Guastatori, Folgore,
  Goliath, Panzer IV for Afrikakorps); squad price, population and build time come from coh3stats where it has the unit.
- No battlegroup call-ins (2026-11-26): units no CoH3 production building makes (battlegroup call-ins, restored v214 units)
  join the most similar production building and are produced there directly; only high-tier units (heroes, heavy armour)
  and pricier variants of a squad the faction already produces need research, done in that (tier) building.
  Non-tank support vehicles (trucks, ambulances, medical and recovery vehicles) are produced in the faction's Tier 2 building.
  Research itself is not built yet (`data/rules/production.json` `research` lists).
- Hero units (CoH3 unique units: Major Russo, SSF Commando "Torch", Tiger Ace, boss Tiger, Torch Obice) are in the roster;
  at most one of each per side (`data/rules/roster.json` heroes).
- Barrage abilities take their attack power from CoH3 ability data: the ability's weapon item → weapon (damage, AoE,
  penetration, scatter) × NUM_SHOTS shells; recharge ÷ 10 s → turns (e.g. 81 mm barrage 6 × 100, 2 turns; 105 mm howitzer
  6 × 160, 6 turns; Hummel 6 × 200, 5 turns). Off-map strikes: CoH3 does not publish their shells; set in doctrine design.
- Indirect fire for turn play (`data/balance/indirect.json`), normal fire and barrages alike: one volley every N turns —
  mortars 1, Priest / Hummel / Wespe (and Bishop) 1, light guns 1, 105 mm / 155-class howitzers and Obice 2, Nebelwerfer
  and other rockets 2. Shells per volley = CoH3 damage rate over N turns ÷ CoH3 damage per shell, rounded up (barrages:
  CoH3 shells × N × 10 s ÷ CoH3 recharge, never more than CoH3), so a faster cadence fires fewer shells; shell damage stays
  CoH3; accuracy × carries the rounding. Range = CoH3 metres ÷ 7 capped: mortar 12, light 14, SPG 16, rockets 16, heavy 18.
  Spread: mortars and light guns land on the aimed hex; SPGs and heavy howitzers put each shell on a random hex within 1
  (7 hexes), rockets within 2 (19 hexes); on the hex where it lands the shell rolls accuracy against the units there.
  Examples: 81 mm barrage 3 shells every turn; 105 mm barrage 2 shells every 2 turns over 7 hexes; Hummel barrage 2 shells
  every turn at accuracy ×0.67.
- Minimum range: indirect weapons cannot fire at targets closer than round(CoH3 min ÷ CoH3 max × our range) hexes, at least
  the class floor (mortar 2, light 2, SPG 3, heavy 3, rocket 3); direct fire keeps CoH3 min ÷ 7 (almost always 0).
- Rocket volleys in normal fire are capped at 3 rockets (as their barrage); their damage per turn is then below CoH3.
- Fire beyond sight: indirect weapons without `needs_sight` may target any hex in range, seen or not. Blind fire: accuracy ÷
  CoH3 scatter fog multipliers (angle × distance, usually 1.25 × 1.25 → ×0.64) and spread one hex wider.
- Counter-barrage: the hex an indirect weapon fires from is sound-ranged for the opponent until the end of the opponent's next
  turn (status flag `sound_ranged`); fire at a sound-ranged hex has no blind penalty, even out of sight.
- Weapon operation rules come from CoH3 weapon behaviour (`data/rules/weapon-flags.json`): ignores blockers, needs sight,
  anti-air, emplace required / faces target, friendly fire, piercing, hits all on miss / hit, attack ground, targets garrison,
  sniper kill, replaceable by upgrades, fire on move, reveals on fire.
- Status flags (`data/rules/status-flags.json`): stored or derived from the six state axes; e.g. reloading, low / out of ammo,
  repairing / being repaired, emplaced / setting up / packed, overwatch, engaged, criticals, decrewed, hero.
- Recrew and capture (approved 2026-11-25, `docs/unit-state.md` §6): a team weapon whose crew dies stays on its hex,
  decrewed, and any side may attack and destroy it (CoH3); an infantry squad with enough men spends its action to recrew
  own or enemy team weapons; destroyed vehicles leave wrecks (cover, obstacle, cleared by engineers).
  Vehicles are always standalone: never abandoned, bailed out or captured (2026-11-26).
  Dropped weapon pickups (later): only upgrade / slot weapons, never team weapons or base armament (2026-11-26).
- Unit turn: one move and one action (fire, ability, emplace, build, repair, board) in either order; firing after moving
  uses the weapon's moving accuracy; weapons that cannot fire on the move must fire first or not move.
  The move is a pool of move points: Move and hull Turn spend from it, in as many steps as it lasts (D2).
- Terrain (`data/rules/terrain.json`, v214 values): a hex has a ground (cost per move class: infantry / vehicle) and at most
  one object (crater, trench, bush, dune, rubble, debris, three forest densities, rock, tank trap) whose cost replaces the
  ground's; a line on a hex edge (hedge, fence, stone wall, low wall, balustrade, sandbag row, wire) adds a crossing cost;
  null = impassable. Buildings are structures with a footprint: nobody walks in (garrisoning is a command). Wrecks: infantry
  cross them, vehicles cannot. Units pass through friendly units but never stop on them; enemies block (D2).
  Shots that miss fly on into the line on the target's covering edge; shells damage what stands on the hex they land on.
- Overwatch is for machine-gun teams only (HMG team weapons, e.g. M1919 / MG42 / Vickers teams). An emplaced MG team that
  holds (does not fire in its turn) fires once in the enemy turn at the first enemy that moves into its arc, range and sight.
  Infantry with LMGs, vehicles with MGs and every other weapon never overwatch; this replaces crew watch fire (§5).
  Counter fire stays for all units (§4).
- Suppression has two states: suppressed (move −50 %, accuracy ×0.5) and pinned (no move except retreat, cannot capture);
  it decays at the own turn start, faster in cover. Values are tuned in data.
  D2 values (`data/balance/status.json`, 0–100): suppressed at 30, pinned at 80, back to normal below 20; decay 35 per own turn
  start, 50 in cover. Emplacing spends the rest of the move and the action; a packed crew that must emplace sets up by itself
  at its turn end. Veterancy XP = share of the victim's HP destroyed × its price; ranks at the CoH3 thresholds.
- Edge cover is directional: hedges, walls, fences and sandbags on a hex edge protect only against fire that crosses that edge.
- Vehicle criticals: a penetrating hit can roll engine damaged (move −50 %), immobilised, main gun damaged or crew shocked
  (no action next turn); chances from data.
- Destruction: tanks crush hedges and fences; HE damages buildings into ruins (cover changes); heavy shells leave craters (light cover).
- Map features (2026-11-26, `docs/map-design.md` §5): garrisonable buildings have HP by size (hundreds to thousands, HP bar on
  hover / select); when one collapses, every garrisoned infantry man dies and garrisoned team weapons are destroyed. Natural
  cover (fences, hedges, walls, debris) has HP and is destructible but shows no HP bar. Defensive structures (sandbags, wire,
  tank traps, bunkers) take HP and armour per faction from CoH3; they fall to explosives, fire, AT weapons and vehicle crush
  (tank traps cannot be crushed). Destroyed vehicles and emplacements leave wreck objects: heavy cover (green) for infantry.
  Every building, the HQ included, can be destroyed (§2).
- Walls, hedges, fences, sandbags and wire are drawn as free lines; a line occupies the hex edge between two hexes when it
  crosses the segment joining their centres (`docs/map-design.md` §2 B).
- Smoke blocks sight for 1–2 turns. A unit that fires is visible to the enemy until its next turn.
- Attack resolution (D2, `data/balance/combat.json`): every living member fires its main / secondary weapons (carried team
  weapons fire the crew weapon once; towed guns fire the gun; smoke launchers, grenades and ability weapons do not).
  Each shot: hit = CoH3 accuracy[band] × target size × weapon cover / target-morale modifiers × attacker morale (suppressed
  ×0.5, pinned ×0.25) × moving accuracy after a move × (1 + 0.3 × lost men ÷ (N − 1)) × retreating ×0.5 × obscured ×0.85 (≤ 1);
  then penetration = penetration ÷ armour of the face hit (front within 60°, side within 120°, else rear), else CoH3
  deflection damage; damage × cover and target-type modifiers × directional damage; emplaced targets take ×0.9 damage, ×0.8
  suppression. AoE weapons splash squads at the falloff for a 2.5 m spread (miss: half). Penetrating hits on vehicles roll
  criticals (chances in data). An attack spends one volley of ammo (indirect: one per shell). Suppression = CoH3 amount × 100
  per shot ÷ the volley multiplier × cover / morale modifiers; vehicles and structures take none.
- Sight (D2, v214 v144 rules, `data/balance/vision.json`): a line is blocked where ground or a `block` object / edge rises above
  the line from the viewer's eye (infantry and crews 1.5, vehicles 2, structures 3) to 1 above the target's ground; `partial`
  objects obscure (hit ×0.85); low objects (height ≤ 2) beside the viewer are ignored; neighbours always see each other.
  Units in bush or light forest are seen from 2 hexes, dense forest and buildings from 1; an emplaced crew in cover that
  neither moved nor fired conceals at its turn end (seen from 2); CoH3 camouflage units use their `detected_hex`.
- Turn flow (D2-7, `logic/commands/phases.js`): `StartMatch` opens turn 1 for the first side; `EndTurn` runs the side's
  turn-end hooks (concealment, unused move / action lapse, engaged cleared without an attack, packed crews auto-emplace,
  served crew shock cleared, unengaged turrets swing back), then the next side's turn start (strikes → status → capture →
  victory → income; status = setup / teardown timers, suppression decay, retreat walk or a fresh budget, and the other
  side's counter fire armed). Retreating units walk on by themselves at their turn start and spend that turn, unless they arrive.
- Counter fire (D2-7, `data/balance/turn.json`): one per enemy turn; the attacked unit fires back at the attacker with every
  weapon that can reach it from where it stands (sight, range, arc, ammo), so an attack from outside its arc draws none.
  Pinned, retreating and reloading units and crews setting up or packing up do not counter; suppressed units do
  (2026-11-28); overwatch and counter fire draw no
  counter fire. Reload: a weapon that fires one volley every N turns (`indirect.usage_turns`) cannot fire or counter fire
  for the N − 1 own turns after the turn it fired in (`timers.reload`).
  Counter fire, overwatch fire and ground attacks set engaged.
- Overwatch reaction (D2-7, confirmed 2026-11-28): a move that steps into an overwatching MG's arc, range and sight draws one
  burst, an ordinary attack with its suppression; no separate stop rule: the mover stops only because it died or the added
  suppression pinned it (only the steps taken are paid). Such a move cannot be undone.
- Abandon and crews without guns (D2-7): a towed-gun crew may abandon its gun (CoH3 `can_manual_abandon`): the crew steps
  onto a free neighbouring hex as its own unit, the gun stays decrewed. A crew whose gun is gone fights with its small arms
  and may recrew. Recrew takes any squad on foot, whatever its size (2026-11-28: capacity counts squads, not men).
- Capacity (2026-11-28, for transports and garrisons, not built): counted in squads; a heavy weapon team takes 2 slots.
- Wreck clearing (D2-7, `data/rules/terrain.json`): engineers (squad role `engineer`) spend their action on or next to a
  wreck; vehicle wrecks go after 2 turns of work, emplacement wrecks after 1.

Confirmed 2026-11-22:
- Delete the Wehrmacht Panzerschreck squad (`at_inf`, duplicates Jäger).

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
