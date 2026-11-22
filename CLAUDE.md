# Burning Front (hex tactics) — working rules

Single-file HTML mobile (landscape) hex tactics game, built from this source tree. The user chats in Korean;
write code, comments and identifiers in English.

## Start of every task
1. Read `CODEMAP.md` (file map, wrapper chains, tools). Do not read whole files you do not need.
2. Find code with `node tools/where.js <name>` or grep, then read only the lines around the hit.
3. Gameplay rules in force: `SPEC.md` (read the section the task touches). If a request conflicts with it, say so before changing.
4. Unit numbers: `python3 -I tools/unit.py <key|name>` prints the final computed stats; do not read the data files to find them.
5. Never open `assets/` (base64 fonts) or the `js/*17e_models-*` files unless the task is about a 3D model.

## Rules for changes
- One classic script: every `js/` file shares one global scope and runs in `manifest.txt` order.
- **No new wrappers.** Do not write `const o = F; F = function () { … o() … }`. Edit the function itself:
  if `js/chains/F.js` exists, change the layer that owns the behaviour (or `F__base`, `where.js` shows where it is).
- New feature → new file `js/NNNN_vXXX_short-name.js` with a `// [vXXX] …` header line, added to `manifest.txt`
  at the right place (number between its neighbours). Edit existing files in place for changes to existing behaviour.
- Keep comments short and in English. Version history goes in `CHANGELOG.md`, not in code comments.
- Changed a rule? Update its line in `SPEC.md` in the same change (move items from section 10 when they ship).
- Bump `VERSION` once per delivered build (build.js writes it into the title and the in-game version); add a short CHANGELOG entry.

## Build and check
- `node build.js` → `dist/burning_front_v<VERSION>.html` (the file the user plays). No dependencies.
- `node tools/codemap.js` after adding, removing or renaming files (refreshes the tables in CODEMAP.md).
- Behaviour-preserving refactors: `tools/regress.sh <old.html> <new.html>` (needs playwright + Chrome; ~10 min)
  plays both builds with the same seeded taps and compares game state, DOM and canvas pixels step by step.
  Gameplay changes are expected to diverge — use it only to prove "nothing else changed".
