  // ══════════════════════════════════════════════════════════════
  // [17p] v115 — U.S. crew-served weapons drawn from their 3D models: gun + the surviving crew baked together (one variant per head count),
  //       24 directions baked lazily and warmed on idle; portraits and side-silhouette icons from the same meshes
  // ══════════════════════════════════════════════════════════════
  const V115_GUN = {
    'blue:at_gun': { mk: 'g57', X0: -1.05, n: 5, S: 7.5, R: 3.6, Hm: 2.0, big: true, iS: 45 },     // v116: crews 5 / 6 / 4 / 5 · 4 / 4 / 4; iS = icon bake scale (px/m)
    'blue:m5gun': { mk: 'g3in', X0: -1.25, n: 6, S: 7, R: 4.2, Hm: 2.0, big: true, iS: 45 },
    'blue:howitzer': { mk: 'g105', X0: -1.1, n: 4, S: 7, R: 4.5, Hm: 2.3, big: true, iS: 45 },
    'blue:pack75': { mk: 'g75p', X0: -0.8, n: 5, S: 8, R: 3.0, Hm: 1.9, big: true, iS: 60 },
    'blue:mortar': { mk: 'm81', X0: -0.2, n: 4, S: 9, R: 1.55, Hm: 1.8, sq: true, iS: 90 },
    'blue:hmg': { mk: 'm1919', X0: -0.3, n: 4, S: 10, R: 1.8, Hm: 1.5, iS: 120 },
    'blue:hmg_50': { mk: 'm2hb', X0: -0.45, n: 4, S: 9, R: 2.05, Hm: 1.5, iS: 100 },
    // v118: German — field grey, crews MG 4 · Flak 5 · LG 5 · Pak 5 · sFH 4
    'red:mortar': { mk: 'grw34', X0: -0.2, n: 4, S: 9, R: 1.55, Hm: 1.8, sq: true, iS: 90, paint: 'grey' },
    'red:hmg': { mk: 'mg42', X0: -0.3, n: 4, S: 10, R: 1.9, Hm: 1.7, iS: 110, paint: 'grey' },
    'red:flak': { mk: 'flak30', X0: -0.55, n: 5, S: 8, R: 2.7, Hm: 2.0, big: true, iS: 50, paint: 'grey' },
    'red:lg40': { mk: 'lg40', X0: -0.15, n: 5, S: 9, R: 1.9, Hm: 1.7, big: true, iS: 80, paint: 'grey' },
    'red:at_gun': { mk: 'pak40', X0: -0.95, n: 5, S: 7.5, R: 4.1, Hm: 1.9, big: true, iS: 45, paint: 'grey' },
    'red:nebel': { mk: 'nbw', X0: -.45, n: 4, S: 8, big: true, R: 3, Hm: 1.8, iS: 55, paint: 'grey' },                     // v121
    'red:flak36': { mk: 'flak36', X0: -.45, n: 6, S: 6, big: true, R: 5, Hm: 2.9, iS: 32, paint: 'grey' },
    'red:flak38': { mk: 'flak38', X0: -.30, n: 4, S: 9, big: true, R: 2, Hm: 1.6, iS: 75, paint: 'grey' },
    'red:obice210': { mk: 'obice210', X0: -1.50, n: 6, S: 5.5, big: true, R: 6, Hm: 3.5, iS: 30, paint: 'grey' },
    'red:howitzer': { mk: 'sfh18', X0: -1.2, n: 4, S: 6.5, R: 5.0, Hm: 2.3, big: true, iS: 40, paint: 'grey' }
  };
  const GUN_SPR = {
    cache: new Map(), meshes: new Map(), sig: '', warmed: {}, CAP: 320,
    cell(g, x) { const R = x ? x.R : g.R, Hm = x ? x.Hm : g.Hm, ce = Math.sqrt(1 - TILT * TILT), W = Math.ceil(2 * R * g.S + 4), PY = Math.ceil((Hm * ce + R * TILT) * g.S + 3); return { W, PY, H: Math.ceil(PY + R * TILT * g.S + 3) }; },
    ext(mesh, X0) { if (mesh._ext) return mesh._ext; let R = 0, Hm = 0; const P = mesh.P; for (let i = 0; i < P.length; i += 3) { const r = Math.hypot(P[i] - X0, P[i + 1]); if (r > R) R = r; if (P[i + 2] > Hm) Hm = P[i + 2]; } return (mesh._ext = { R: R + .12, Hm: Hm + .08 }); },   // v119
    get(g, n, fa) {
      TANK_SPR.ensureView(); if (this.sig !== TANK_SPR.sig) { this.sig = TANK_SPR.sig; this.cache.clear(); this.warmed = {}; }
      const i = TANK_SPR.idx(fa), mk = g.mk + '_c' + n, ck = mk + '|' + i; let e = this.cache.get(ck);
      if (e) { this.cache.delete(ck); this.cache.set(ck, e); return e; }
      let mesh = this.meshes.get(mk); if (!mesh) { mesh = TankBaker.build(mk, g.paint || 'olive'); this.meshes.set(mk, mesh); while (this.meshes.size > 16) this.meshes.delete(this.meshes.keys().next().value); }
      const B = 4, { W, H, PY } = this.cell(g, this.ext(mesh, g.X0 || 0));
      const hi = TankBaker.bakeCell(mesh, { yaw: TANK_SPR.yaw(i), X0: g.X0 || 0, S: g.S * B, ss: 2, W: W * B, H: H * B, px: W / 2 * B, py: PY * B, view: TANK_SPR.view, L: TANK_SPR.light });
      const lo = TankBaker.mkCanvas(W * B / 2, H * B / 2), lc = lo.getContext('2d'); lc.imageSmoothingEnabled = true; lc.imageSmoothingQuality = 'high'; lc.drawImage(hi, 0, 0, lo.width, lo.height);
      e = { hi, lo, W, H, PX: W / 2, PY }; this.cache.set(ck, e);
      while (this.cache.size > this.CAP) this.cache.delete(this.cache.keys().next().value);
      return e;
    },
    warm(g, n) {   // the remaining directions, one per idle tick
      const k = g.mk + '_c' + n; if (this.warmed[k]) return; this.warmed[k] = 1;
      let i = 0; const step = () => { if (i >= TANK_SPR.N || this.warmed[k] !== 1) return; this.get(g, n, TANK_SPR.yaw(i)); i++; setTimeout(step, 40); };
      setTimeout(step, 300);
    }
  };
  // draw scale (game px per metre): MG / mortar teams match the infantry figures; towed guns sit between the vehicle and infantry scales
  const v115Scale = g => v117Hs();   // v117: crews at the infantry scale (big guns may spill over the hex)
  
  /* drawUnitArt: layer moved to js/chains/drawUnitArt.js */
  // build-menu / unit-card portrait from the full-crew model
  { 
    /* v101Portrait: layer moved to js/chains/v101Portrait.js */ }
  // every crew weapon (v116: MGs and mortar too): white side silhouette of its 3D model (trails closed, no crew) for the banner / menu icon, like the vehicles;
  // the mortar, as tall as it is long, gets a square icon
  { 
    /* v105Icon: layer moved to js/chains/v105Icon.js */ }

