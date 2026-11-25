# Burning Front — Platform, code format and asset plan

Status: **proposal** (2026-11-25). Goes with `docs/game-design.md` §19–20 (rules and controls) and `docs/ARCHITECTURE.md`.

## 1. Distribution: web or APK

| Option | How the player gets it | Good | Bad |
| --- | --- | --- | --- |
| A. Single HTML file (today) | copy one file to the phone, open it | fully offline, no server | opening a local file on a phone is awkward; storage tied to the file path; no fullscreen or orientation lock; cannot hold large sprite and sound assets well |
| **B. Web app (PWA)** *(my pick, first)* | open a URL once, "Add to Home Screen" | one build for Android and iPhone; works offline after the first load (service worker); fullscreen and landscape when installed; updates are instant | needs a static host (e.g. GitHub Pages, free); iPhone may clear data of sites not opened for weeks unless installed; storage limits per browser |
| **C. Android APK** *(my pick, second)* | install an `.apk` (side-load or Play Store) | real app: icon, fullscreen, landscape lock, durable storage, vibration; can go to the Play Store | Android only; needs a build toolchain (done in CI, not on the offline PC); side-loading needs "unknown sources" |

**Recommendation:** one web code base, shipped as a **PWA first**, then wrapped into an **APK** with Capacitor
(same files inside a native shell). The APK is built by GitHub Actions, so the offline PC never needs the
Android SDK. The single HTML stays as a quick test build.

What the code needs for this (already in the architecture): storage, clock, audio and assets go through
`services/`, so switching from browser storage to the APK's file storage changes one service.

Build outputs:

```text
dist/web/      index.html, assets/, sw.js (offline cache), manifest.webmanifest   → PWA host
dist/apk/      Capacitor project wrapping dist/web → CI builds burning-front.apk
dist/single/   one HTML file (tests, quick sharing; small asset set)
```

## 2. Code file format

| Item | Choice | Why |
| --- | --- | --- |
| Language | **JavaScript (ES modules) with JSDoc types**; `// @ts-check` checked by `tsc --noEmit` in CI only | runs in Node and the browser without compiling; the offline PC needs only Node; types still checked. TypeScript is the alternative if you want a compiler step |
| Modules | one file per responsibility, `kebab-case.js`; each system exports through `index.js` | enforced by `npm run check` |
| Data | `.json` (no comments), checked against `data/schema` | — |
| Styles | `.css` with theme tokens as CSS variables | SPEC §8 theme presets |
| Markup | one `index.html` shell; UI panels built by `presentation/ui` | — |
| Tests | `node --test`, files `*.test.js` mirroring `src/` | already in place |
| Dependencies | **none in `logic/` and `services/`**; at most one vendored, version-pinned renderer in `presentation/render/vendor/` (see §3) | keeps rules testable and the build offline |

## 3. Rendering engine

"Dynamic combat like CoH3" needs effects (smoke, fire, explosions, tracers, debris) at 60 fps on a phone.

| Option | What it is | Good | Bad |
| --- | --- | --- | --- |
| A. Canvas 2D + baked sprites (today) | software drawing, TankBaker meshes baked to sprites at runtime | no dependency, works everywhere | CPU-bound; many particles or big maps stutter; little lighting |
| **B. WebGL 2D sprites** *(my pick)* | GPU sprite renderer (PixiJS, vendored and pinned) drawing baked sprites, particles and light overlays | much faster on phones; real particle effects, blend modes, shadows; isometric stays 2D, so art is simpler | one vendored library (~0.5 MB); render code rewritten (it is being rewritten anyway) |
| C. Full 3D (Three.js / Babylon.js) | real-time 3D models, free camera, lighting | closest to CoH3's look | heaviest on phones, much more art work (every model textured and animated in 3D), longest to build |

B keeps the door to C open: the rules do not know how they are drawn, so only `presentation/render` would change.

## 4. Asset modelling plan

### Pipeline

```text
assets/source/   .blend (3D), .kra/.psd (2D), .wav (sound)            ← edited by hand (large files: Git LFS)
      │  tools/assets/bake   (Blender command line render, no screen)
      ▼
assets/build/    sprite atlases .png/.webp + atlas.json, sounds .mp3, fonts .woff2   ← generated, never edited
      │  referenced by id from data/units/*/fx.json and data/presentation
      ▼
services/assets  loads per screen / theatre, caches, releases
```

### What gets made

| Asset | Source | Baked output | Notes |
| --- | --- | --- | --- |
| Vehicles | low-poly 3D (1–3 k triangles), separate hull / turret / gun nodes, 512 px texture | hull and turret sprites at 32 angles, plus damaged and wreck states | turret sprite drawn on the hull at its own angle (SPEC §6) |
| Infantry | one rigged soldier, uniform and weapon swapped per faction | 8 directions × idle, walk, fire, prone, die | legacy soldier rig is the reference |
| Crew weapons | 3D, packed and emplaced poses | 16 angles × 2 poses | |
| Buildings | 3D, footprint in hexes | intact / damaged / ruin | ruins change cover (game-design §19) |
| Terrain | hex tile textures per theatre, edge objects (hedge, wall, fence, sandbag) | atlas per theatre | edges crushable |
| Effects | small sprite sheets + particles in code | muzzle flash, tracer, impact, explosion, smoke, fire, dust | count and size limited by a quality setting |
| Icons / UI | SVG, illustrated (SPEC §9) | — | |
| Sound | licensed packs or self-made | `.mp3` (plays on iPhone and Android) | per weapon class, not per weapon |

### Reuse and new work

- **Reuse now:** the legacy TankBaker meshes (US and German vehicles, soldier rig) are exported once to the new
  pipeline, so M1 needs no new art.
- **New:** British vehicles and guns (e.g. Churchill, Crusader, Matilda, 6-pounder, 25-pounder) and the
  Afrikakorps' Italian and desert vehicles have no legacy mesh; they are the first Blender work (milestone M5).
- **Budgets:** first download under 30 MB; each theatre's terrain and sound load on entering it; whole game under 150 MB.
- **Rights:** only self-made, commissioned or licensed assets. No CoH3 or Burning Bridges art or sound.

## 5. Decisions needed

1. Distribution: PWA first, APK from the same code via CI. Agree?
2. Renderer: WebGL 2D with one vendored library (B), which relaxes "no dependencies" for `presentation/render` only. Agree, or stay with Canvas 2D (A)?
3. Language: JavaScript + JSDoc (no compiler needed), or TypeScript?
4. Art source: you model in Blender yourself, commission, or use licensed asset packs? This sets the pace of milestone M5.
