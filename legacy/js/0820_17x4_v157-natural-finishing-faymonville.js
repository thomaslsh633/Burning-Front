  // ══════════════════════════════════════════════════════════════
  // [17+4] v157 — natural finishing (Faymonville, visual only except the villa terrace edges)
  //     · infantry leans toward its cover: a soft unit next to a wall / hedge / fence / balustrade / sandbag edge (or a house)
  //       is drawn up to 0.25 hex toward the cover line it actually sees, picking the side that faces the enemy
  //     · yard walls: stone gate pillars with caps at both ends of the gate gap, some with an open wooden gate leaf
  //     · villa: the balustrade edges are re-laid on the paved terrace rim (three sides, gap at the steps), found through the
  //       sprite's own projection; the railing itself is the villa mesh's (raised to wall height, correctly hidden behind the house)
  //     · hedges and fences: chains are simplified to straight runs (corners kept) instead of smoothed curves
  // ══════════════════════════════════════════════════════════════
  var V157 = { on: true, lean: .25, terraceEdges: true, cover: { low_wall: 1, stone_wall: 1, hedge: .9, fence: .8, balustrade: 1, sandbag_row: 1 },
    terrace: { x: 13.45, yF: -11.0, yB: 7.7, gap: 2.2 } };
  const v157On = () => V157.on && typeof v150Fay === 'function' && v150Fay();
  const v157W = () => Math.sqrt(3) * HEX_RADIUS;

  // ---------- straight hedge / fence runs ----------
  function v157DP(P, tol) {
    if (P.length < 3) return P.slice();
    const a = P[0], b = P[P.length - 1], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    let iM = 0, dM = -1;
    for (let i = 1; i < P.length - 1; i++) { const d = Math.abs(dx * (P[i][1] - a[1]) - dy * (P[i][0] - a[0])) / L; if (d > dM) { dM = d; iM = i; } }
    if (dM <= tol) return [a, b];
    return v157DP(P.slice(0, iM + 1), tol).slice(0, -1).concat(v157DP(P.slice(iM), tol));
  }
  { 
    /* v153Build: layer moved to js/chains/v153Build.js */ }

  // ---------- villa terrace balustrade ----------
  // a mesh point of a baked map sprite → flat map coords, through the same projection the sprite was baked with
  function v157MeshFlat(sp, mx, my, mz) {
    TANK_SPR.ensureView();
    const yaw = TANK_SPR.yaw(TANK_SPR.idx(sp.ang)), S = V134.S, k = (v157W() / 7) / S, h = (sp.z || 0) * LIFT, base = v99Proj(sp.fx, sp.fy, h);
    const a = TankBaker.projectPoint(TANK_SPR.view, yaw, 0, S, mx, my, mz || 0), x = base[0] + a[0] * k - OFFX, y = (base[1] + a[1] * k - OFFY + h * HZ) / TILT;
    return [x * COSA + y * SINA, -x * SINA + y * COSA];
  }
  function v157Terrace() {
    const sp = (V146.spots || []).find(s => s.kind === 'villa' && s.fp), villa = (V147.structs || []).find(s => s.kind === 'villa');
    if (!sp || !villa) return;
    const w = v157W(), P = (mx, my) => v157MeshFlat(sp, mx, my, 0);
    // old yard balustrade around the villa
    V151.runs = V151.runs.filter(run => {
      if (run.kind !== 'balustrade' || !run.pts.some(p => Math.hypot(p[0] - sp.fx, p[1] - sp.fy) < w * 2.8)) return true;
      run.keys.forEach(k => { const e = EDGES.get(k); if (e && e.kind === 'balustrade') { EDGES.delete(k); V151.runEdges.delete(k); } }); return false;
    });
    const T = V157.terrace, n0 = V151.runs.length;
    [[P(-T.x, T.yB), P(-T.x, T.yF), P(-T.gap, T.yF)], [P(T.x, T.yB), P(T.x, T.yF), P(T.gap, T.yF)]].forEach(L => {
      const before = new Set(EDGES.keys()); v146LineEdges('balustrade', L.map(p => v152RefOf(p[0], p[1])));
      EDGES.forEach((e, k) => { if (before.has(k)) return; const [a, b] = v152EdgeCells(k);
        if (v152IsRoad(a[0], a[1]) || v152IsRoad(b[0], b[1]) || (v147StructAt(a[0], a[1]) && v147StructAt(b[0], b[1]))) { EDGES.delete(k); V151.runEdges.delete(k); } });
    });
    V151.runs.slice(n0).forEach(run => { run.terrace = sp; });
    EDGE_VER++; V151.pieces = null;
  }
  { 
    /* v151Pieces: layer moved to js/chains/v151Pieces.js */ }

  // ---------- gate pillars ----------
  const V157M = (() => {
    function make(kind, v) {
      let seed = 41 + (v | 0) * 7919; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      const M = new TankBaker.Mesh(), m = (c, o) => M.mat(c, Object.assign({ noise: 2.4, dirt: .4, spec: .03 }, o || {}));
      const st = m([150, 142, 128]), stL = m([182, 176, 164], { noise: 1.6 }), stD = m([118, 112, 102]), wood = m([104, 80, 58], { noise: 3 }), woodD = m([80, 62, 46], { noise: 3 }), iron = m([60, 58, 56], { spec: .2 });
      const pillar = (x, y, h) => {
        M.box(x - .48, x + .48, y - .48, y + .48, 0, .3, stD);                         // plinth
        for (let z = .3, k = 0; z < h - .05; k++) { const t = Math.min(.36 + rnd() * .12, h - z);   // coursed stones
          const s = .38 + (k % 2) * .015; M.box(x - s, x + s, y - s, y + s, z, z + t - .025, rnd() < .5 ? st : stD); z += t; }
        M.box(x - .5, x + .5, y - .5, y + .5, h, h + .14, stL);                        // cap
        M.lathe('z', [x, y, h + .14], [[0, .26], [.16, .24], [.32, .15], [.4, 0]], 8, stL);   // ball finial
      };
      if (kind === 'gatepost') {
        const h = 2.05 + rnd() * .25; pillar(0, 0, h);
        if (v % 3 === 1) {   // an open wooden gate leaf, swung inward
          const a = 1.25 + rnd() * .35, L = 1.9, ca = Math.cos(a), sa = Math.sin(a);
          for (let i = 0; i < 7; i++) { const t = (i + .5) / 7, x = .46 + ca * L * t, y = sa * L * t; M.box(x - .07, x + .07, y - .07, y + .07, .12, 1.6 + (i % 2) * .06, i % 2 ? wood : woodD); }
          [.4, 1.3].forEach(z => { for (let i = 0; i < 4; i++) { const t0 = i / 4, t1 = (i + 1) / 4; const x = .46 + ca * L * (t0 + t1) / 2, y = sa * L * (t0 + t1) / 2; M.box(x - .2, x + .2, y - .2, y + .2, z, z + .1, woodD); } });
          M.box(.4, .52, -.05, .05, .4, .5, iron); M.box(.4, .52, -.05, .05, 1.3, 1.4, iron);
        }
      }
      return M;
    }
    return { has: k => k === 'gatepost', make };
  })();
  { const o_make157 = V146M.make; V146M.make = function (kind, v) { return V157M.has(kind) ? V157M.make(kind, v) : o_make157.apply(this, arguments); }; }
  function v157Gates() {
    const out = [], w = v157W(), mpx = w / 7, pcs = v151Pieces() || [];
    (V146.spots || []).forEach((sp, j) => {
      const Y = V152.yard[sp.kind]; if (!sp.fp || !Y || sp.kind === 'villa') return;
      const hx = Y[0] * mpx, hy = Y[1] * mpx, X = [Math.cos(sp.ang), Math.sin(sp.ang)], D = [-Math.sin(sp.ang), Math.cos(sp.ang)];
      [-.45, .45].forEach((sx, k) => {
        const fx = sp.fx + X[0] * hx * sx + D[0] * hy, fy = sp.fy + X[1] * hx * sx + D[1] * hy;
        if (v152RoadDist(fx, fy) < 11) return;
        if (!pcs.some(p => p.kind === 'wallseg_low' && Math.hypot(p.fx - fx, p.fy - fy) < w * .42)) return;
        const vh = sp.z || 0;
        out.push({ kind: 'gatepost', v: j * 2 + k, fx, fy, ang: sp.ang + (sx < 0 ? Math.PI : 0), deco: true, gate: true,
          get z() { return V137.grid ? v137H(this.fx, this.fy) : vh; } });
      });
    });
    return out;
  }
  { 
    /* loadHistoricalMap: layer moved to js/chains/loadHistoricalMap.js */ }

  // fences drawn at the scale of the walls and the men (posts ~1.3 m, two rails)
  { 
    /* v99Uprights: layer moved to js/chains/v99Uprights.js */ }

  // ---------- infantry leans toward its cover ----------
  function v157CoverPoint(c, r, k, kind) {   // nearest visible point of the cover line drawn for this edge
    const [a, b] = [[c, r], v152EdgeCells(k).find(q => q[0] !== c || q[1] !== r) || [c, r]];
    const A = v146CellFlat(a[0], a[1]), B = v146CellFlat(b[0], b[1]), mid = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
    let pts = null;
    if (kind === 'hedge' || kind === 'fence') { if (V153.ver !== EDGE_VER) v153Build(); pts = V153.own.get(k); }
    else { const pc = v151Pieces() || []; pts = pc.filter(p => Math.hypot(p.fx - mid[0], p.fy - mid[1]) < v157W() * .7).map(p => [p.fx, p.fy]); }
    if (!pts || !pts.length) return mid;
    let best = mid, bd = 1e9; pts.forEach(p => { const d = Math.hypot(p[0] - A[0], p[1] - A[1]); if (d < bd) { bd = d; best = p; } });
    return Math.hypot(best[0] - mid[0], best[1] - mid[1]) < v157W() * .75 ? best : mid;
  }
  function v157Lean(u) {
    if (!v157On() || !u || u.armorType !== 'soft' || u.empl || u.hp <= 0) return null;
    const C = v146CellFlat(u.c, u.r), w = v157W();
    // enemy direction: nearest enemy unit, else the enemy HQ
    let ex = 0, ey = 0, bd = 1e9;
    units.forEach(o => { if (o.team === u.team || o.hp <= 0 || o.isLoaded) return; const d = getDistance(u.c, u.r, o.c, o.r); if (d < bd) { bd = d; const f = v146CellFlat(o.c, o.r); ex = f[0] - C[0]; ey = f[1] - C[1]; } });
    if (bd > 30) { const hq = buildings.find(b => b.type === 'hq' && b.team !== u.team); if (hq) { const f = v146CellFlat(hq.c, hq.r); ex = f[0] - C[0]; ey = f[1] - C[1]; } }
    const eL = Math.hypot(ex, ey) || 1; ex /= eL; ey /= eL;
    let best = null, bs = -1e9;
    for (let e = 0; e < 6; e++) {
      const n = getNeighborByEdge(u.c, u.r, e); if (!n) continue;
      const ed = getEdge(u.c, u.r, n.c, n.r), N = v146CellFlat(n.c, n.r), dx = N[0] - C[0], dy = N[1] - C[1], L = Math.hypot(dx, dy) || 1;
      let wgt = 0, tgt = null;
      if (ed && V157.cover[ed.kind] && (ed.st || 0) < 2) { wgt = V157.cover[ed.kind]; tgt = v157CoverPoint(u.c, u.r, edgeKey(u.c, u.r, n.c, n.r), ed.kind); }
      else if (typeof v147StructAt === 'function' && v147StructAt(n.c, n.r) && !(typeof v147GarrisonOf === 'function' && v147GarrisonOf(u))) { wgt = .55; tgt = [C[0] + dx * .5, C[1] + dy * .5]; }
      if (!wgt) continue;
      const s = wgt + (dx * ex + dy * ey) / L * .8;
      if (s > bs) { bs = s; best = tgt; }
    }
    if (!best) return null;
    const vx = best[0] - C[0], vy = best[1] - C[1], L = Math.hypot(vx, vy); if (L < 1) return null;
    const d = Math.max(0, Math.min(V157.lean * w, L - 5));
    const tx = C[0] + vx / L * d, ty = C[1] + vy / L * d;
    const P2 = (x, y) => (typeof v137On === 'function' && v137On()) ? v137P(x, y) : v99Proj(x, y, 0);
    const s0 = P2(C[0], C[1]), s1 = P2(tx, ty); return [s1[0] - s0[0], s1[1] - s0[1]];
  }
  { 
    /* drawUnitArt: layer moved to js/chains/drawUnitArt.js */ }


