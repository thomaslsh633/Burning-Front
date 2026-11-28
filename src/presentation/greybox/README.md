# src/presentation/greybox/

**Layer 1 — Input / Presentation** — Art-free "greybox" view for checking data and rules before the real PixiJS screen exists (dev plan stage G).

## Owns
- Canvas 2D drawing: hexes in grey steps by terrain, units as faction-coloured discs with a type letter and HP number, no effects
- debug overlay: range and minimum range, hit and penetration chance with expected damage per target, shots per turn, the six state axes and status flags, indirect spread area
- a build entry so the greybox can be opened on a phone

## Public API (exported from `index.js`)
- `createView(size, { yaw = 45, pitch = 35 })` → `{ centre, toHex, fit(cols, rows), draw(ctx, state, ui, data) }`: quarter view (SPEC §9) — done (G-2)
- `debugText(state, ui, data)`: match, resources, the selected unit's six axes, budget, suppression, ammo, reload, weapons
  (range, shots, accuracy, damage, penetration, spread) and the attack / move preview — done (G-3)
- opened through `greybox.html` (boot: `src/app/greybox.js`; serve: `node tools/greybox/serve.js`)

## May import
- `presentation/*`, `logic/<system>/index.js`, `services/<system>/index.js`

## Must not
- hold rules or change state (it uses the same controller and store as the real game)
- be required by the real renderer (`presentation/render` never imports it)
