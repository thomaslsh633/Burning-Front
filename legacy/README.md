# legacy/ — frozen v214

The v214 game exactly as it was before the rewrite (tag `v214-legacy`). Do not edit anything here.
It is kept only as the oracle: the rewrite in `../src/` is checked against what this build computes.

- Build: `node legacy/build.js` → `legacy/dist/burning_front_v214.html`
- Find a function: `node legacy/tools/where.js <name>`; map of the old code: `legacy/CODEMAP.md`
- `legacy/package.json` keeps these tools as CommonJS (the new tree is ES modules).

Deleted in Phase 6 of the rewrite roadmap.
