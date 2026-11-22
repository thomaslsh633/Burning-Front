# CHANGELOG

Gameplay history before v209 lives in the section headers of the source files (`[vNNN] …`) and in FILES.md.
New entries go on top, one short block per delivered version.

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
