  // ══════════════════════════════════════════════════════════════
  // [17+2] v155 — capture point masts as baked 3D models (Faymonville), the mast hex is impassable
  //   · victory point: steel lattice radio mast (≈13 m) with a platform, lamps and an aerial, on a concrete pad inside a ring
  //     of sandbags, three Czech hedgehogs and a toppled signal plate around it (after the reference shot)
  //   · resource point: a wooden pole leaning a little on a cairn of field stones, held by three guy ropes to stakes
  //   · the cloth (team colour / neutral) is still drawn live at the top of the mast; income and tick badges unchanged
  //   · rules: the mast hex itself cannot be entered (zone capture is done from the hexes around it)
  // ══════════════════════════════════════════════════════════════
  const V155 = { on: true, H: { vp: 13.2, res: 7.4 } };
  const V155M = (() => {
    let seed = 3; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const beam = (M, a, b, r, m) => {   // square bar between two points
      const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(...d) || 1; d[0] /= L; d[1] /= L; d[2] /= L;
      let u = Math.abs(d[2]) < .9 ? [0, 0, 1] : [1, 0, 0]; let v = [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]]; const lv = Math.hypot(...v); v = v.map(q => q / lv);
      u = [v[1] * d[2] - v[2] * d[1], v[2] * d[0] - v[0] * d[2], v[0] * d[1] - v[1] * d[0]];
      const P = (p, s, t) => [p[0] + (u[0] * s + v[0] * t) * r, p[1] + (u[1] * s + v[1] * t) * r, p[2] + (u[2] * s + v[2] * t) * r];
      const c = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], S = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
      for (let i = 0; i < 4; i++) { const s0 = S[i], s1 = S[(i + 1) % 4]; M.quad(P(a, ...s0), P(b, ...s0), P(b, ...s1), P(a, ...s1), m, c); }
    };
    const bag = (M, x, y, z, a, m) => { const c = Math.cos(a), s = Math.sin(a), q = (dx, dy) => [x + dx * c - dy * s, y + dx * s + dy * c];
      const p = [q(-.42, -.2), q(.42, -.2), q(.42, .2), q(-.42, .2)]; M.hex8([[...p[0], z], [...p[1], z], [...p[2], z], [...p[3], z], [...p[0], z + .26], [...p[1], z + .26], [...p[2], z + .26], [...p[3], z + .26]], m); };
    function vp(M, P) {
      M.lathe('z', [0, 0, 0], [[0, 0], [0, 1.7], [.35, 1.6], [.35, 0]], 8, P.conc);                                         // pad
      for (let row = 0; row < 2; row++) for (let i = 0; i < 16; i++) { const a = (i + row * .5) / 16 * 6.283; if (a > 4.2 && a < 5.1) continue; bag(M, Math.cos(a) * 2.45, Math.sin(a) * 2.45, row * .26, a + Math.PI / 2, P.bag); }
      const leg = (h) => { const w = 1.25 * (1 - h / 11) + .28 * (h / 11); return w; }, H = 10;
      [[1, 1], [-1, 1], [-1, -1], [1, -1]].forEach(([sx, sy], i, A) => {
        beam(M, [sx * leg(0), sy * leg(0), .35], [sx * leg(H), sy * leg(H), H], .07, P.steel);
        const [tx, ty] = A[(i + 1) % 4];
        for (let k = 0; k < 5; k++) { const h0 = .35 + k * 1.95, h1 = h0 + 1.95;
          beam(M, [sx * leg(h0), sy * leg(h0), h0], [tx * leg(h1), ty * leg(h1), h1], .035, P.steelD);
          beam(M, [sx * leg(h1), sy * leg(h1), h1], [tx * leg(h1), ty * leg(h1), h1], .03, P.steelD); }
      });
      M.box(-1.05, 1.05, -1.05, 1.05, 6.3, 6.42, P.steel);                                                                     // platform + rail
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([sx, sy]) => beam(M, [sx * 1.05 - sy * 1.05, sy * 1.05 + sx * 1.05, 7.1], [sx * 1.05 + sy * 1.05, sy * 1.05 - sx * 1.05, 7.1], .025, P.steelD));
      M.box(-.35, .35, -.35, .35, H, H + .5, P.steelD); beam(M, [0, 0, H + .5], [0, 0, 13.2], .045, P.steel);                   // aerial
      [[.6, .4], [-.5, .6]].forEach(([x, y]) => M.lathe('z', [x, y, 6.42], [[0, 0], [0, .16], [.22, .16], [.22, 0]], 6, P.lamp));
      // hedgehogs
      [[2.9, 1.3, .3], [-2.6, 2.0, 1.1], [-.6, -3.1, 2.2]].forEach(([x, y, a]) => { const c = Math.cos(a), s = Math.sin(a);
        [[1, 0, 0], [0, 1, 0], [0, 0, 1]].forEach(([ax, ay, az]) => { const dx = (ax * c - ay * s) * .9, dy = (ax * s + ay * c) * .9, dz = az * .9; beam(M, [x - dx, y - dy, .55 - dz * .55], [x + dx, y + dy, .55 + dz * .55], .06, P.steelD); }); });
      // toppled signal plate leaning on the sandbags
      M.hex8([[1.4, -1.9, 0], [2.6, -1.4, 0], [2.6, -1.25, .1], [1.4, -1.75, .1], [1.2, -1.75, 1.3], [2.4, -1.25, 1.3], [2.4, -1.1, 1.4], [1.2, -1.6, 1.4]], P.plate);
    }
    function res(M, P) {
      for (let i = 0; i < 11; i++) { const a = i / 11 * 6.283 + rnd() * .3, d = i < 8 ? .75 : .3, r = .28 + rnd() * .14; M.lathe('z', [Math.cos(a) * d, Math.sin(a) * d, (i < 8 ? 0 : .32) - r * .2], [[0, 0], [0, r * .9], [r * .9, r], [r * 1.5, r * .55], [r * 1.7, 0]], 6, rnd() < .5 ? P.stone : P.stoneD); }
      const top = [.45, .2, 7.4]; beam(M, [0, 0, 0], top, .09, P.wood);                                                         // leaning pole
      [[1.0, 0], [3.2, 2.1], [5.3, 4.2]].forEach(([dir, k], i) => { const a = i / 3 * 6.283 + .5, gx = Math.cos(a) * 2.6, gy = Math.sin(a) * 2.6;
        beam(M, [top[0] * .82, top[1] * .82, 6.1], [gx, gy, .05], .012, P.rope); beam(M, [gx, gy, -.05], [gx, gy, .35], .04, P.wood); });
    }
    const make = kind => { seed = kind === 'cp_vp' ? 5 : 9; const M = new TankBaker.Mesh(), m = c => M.mat(c, { noise: 1.1 });
      const P = { conc: m([150, 148, 140]), bag: m([170, 156, 118]), steel: m([66, 70, 74]), steelD: m([44, 47, 50]), lamp: m([236, 230, 200]), plate: m([58, 64, 70]),
        stone: m([178, 174, 166]), stoneD: m([132, 128, 120]), wood: m([96, 74, 52]), rope: m([60, 54, 44]) };
      (kind === 'cp_vp' ? vp : res)(M, P); return M; };
    return { make, has: k => k === 'cp_vp' || k === 'cp_res' };
  })();
  { const o_make155 = V146M.make; V146M.make = function (kind) { return V155M.has(kind) ? V155M.make(kind) : o_make155.apply(this, arguments); }; }
  const v155On = () => V155.on && V99 && V99.on && v150Fay();
  // spots: one per capture point, sitting on the blurred surface
  function v155Spots() {
    return capturePoints.map((cp, i) => { const f = v146CellFlat(cp.c, cp.r), vh = v146Z(cp.c, cp.r);
      return { kind: cp.cls === 'vp' ? 'cp_vp' : 'cp_res', v: 0, fx: f[0], fy: f[1], ang: (cp.cls === 'vp' ? .35 : 0) + (i % 3) * 2.1, cp: true, deco: true,
        get z() { return V137.grid ? v137H(this.fx, this.fy) : vh; } }; });
  }
  { 
    /* loadHistoricalMap: layer moved to js/chains/loadHistoricalMap.js */ }
  // mast top in screen space (for the live cloth)
  function v155Top(cp) {
    if (!v155On()) return null; const q = getHexCenter(cp.c, cp.r), ce = Math.sqrt(1 - TILT * TILT), Hm = cp.cls === 'vp' ? V155.H.vp : V155.H.res;
    const lean = cp.cls === 'vp' ? 0 : .45; return { x: q.x + lean * SCALE_REF.mapPxM() * .7, y: q.y - Hm * ce * SCALE_REF.mapPxM() };
  }
  // the mast hex is impassable
  { 
    /* getTileMovementCost: layer moved to js/chains/getTileMovementCost.js */ }


