  // ══════════════════════════════════════════════════════════════
  // [17_] v152 — Faymonville only: natural objects, wall clean-up and yard walls, zone radii, HQ build ground,
  //        village paving, villa facing the town
  //   · maps: only Faymonville is offered (sandbox / test maps removed from the list; to be rebuilt later)
  //   · natural objects (decoration, no rules): oak, pine clump, lilac, lavender, flower bed, planter wall, grass tuft,
  //     reeds, hay bales, boulder, log + stump, cypress rows along village roads, vine rows — seeded, same every game;
  //     switch in the settings
  //   · walls: wall runs that lie on a road and wall edges across a road are removed; houses get yard walls on three sides
  //     with a gate toward the road (villa: balustrade terrace), never across a road
  //   · capture zones: resource points radius 1, victory points radius 2
  //   · HQ sectors: open buildable ground painted as packed sand (as in the reference shot), blended at the border
  //   · village: the hexes in front of each door are pale cobble / flagstone; roads in a pale stone-gravel palette
  //   · villa: turned to face the town, height kept
  // ══════════════════════════════════════════════════════════════
  const V152 = { on: true, spots: [], sand: [198, 182, 148], cobble: [178, 173, 160],
    yard: { mill: [8, 5.6], farm: [8.4, 5.6], farm2: [8.2, 5.8], cottage: [7, 5], town: [8.2, 6.4], villa: [11.5, 9.5] } };
  Object.assign(ZONE_R, { vp: 2, manpower: 1, fuel: 1, fuel_minor: 1, mun: 1 });
  Object.assign(ZONE_R_SMALL, { vp: 2, manpower: 1, fuel: 1, fuel_minor: 1, mun: 1 });
  Object.assign(V149.gravel, { road: [184, 176, 158], roadEdge: [146, 136, 116], rut: [158, 148, 128], roadMid: [204, 198, 182] });
  Object.assign(V151.roadCol, V149.gravel);
  GROUND_VAR.flagstone.rgb = V152.cobble.slice();
  // maps: Faymonville + the v162 skirmish test map (the old test maps are gone)
  (function () { const sel = document.getElementById('map-select'); if (!sel) return;
    [...sel.options].forEach(o => { if (o.value !== 'faymonville' && o.value !== 'skirmish') o.remove(); }); sel.value = 'skirmish'; })();

  // ---------- natural object models (metres) ----------
  const V152M = (() => {
    let seed = 1; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const sph = (M, x, y, z, r, m, seg = 8) => M.lathe('z', [x, y, z - r], [[0, 0], [r * .25, r * .7], [r * .7, r], [r * 1.25, r * .9], [r * 1.7, r * .45], [r * 1.9, 0]], seg, m);
    const cyl = (M, x, y, z, h, r, m, seg = 6) => M.lathe('z', [x, y, z], [[0, 0], [0, r], [h, r * .8], [h, 0]], seg, m);
    const cone = (M, x, y, z, h, r, m, seg = 7) => M.lathe('z', [x, y, z], [[0, 0], [0, r], [h, 0]], seg, m);
    const K = {
      oak(M, P) { cyl(M, 0, 0, 0, 2.6, .24, P.bark); for (let i = 0; i < 5; i++) { const a = rnd() * 6.28, d = i ? .9 + rnd() * .6 : 0; sph(M, Math.cos(a) * d, Math.sin(a) * d, 3.4 + rnd() * 1.1 + (i ? 0 : .8), 1.15 + rnd() * .45, rnd() < .5 ? P.leaf : P.leafL, 9); } },
      pines(M, P) { for (let i = 0; i < 3; i++) { const x = (rnd() - .5) * 3.2, y = (rnd() - .5) * 3.2, h = 7 + rnd() * 3.5; cyl(M, x, y, 0, 1.2, .18, P.bark); cone(M, x, y, 1, h * .55, 1.6, P.pine); cone(M, x, y, h * .4, h * .6, 1.15, P.pine); } },
      lilac(M, P) { for (let i = 0; i < 3; i++) { const x = (rnd() - .5) * 1.2, y = (rnd() - .5) * 1.2; sph(M, x, y, .55 + rnd() * .3, .45 + rnd() * .15, P.leafD, 7); sph(M, x * .9, y * .9, 1.0 + rnd() * .25, .28, rnd() < .6 ? P.lilac : P.lilacL, 6); } },
      lavender(M, P) { for (let i = 0; i < 9; i++) { const x = (i % 3 - 1) * .7 + (rnd() - .5) * .2, y = ((i / 3 | 0) - 1) * .7; sph(M, x, y, .22, .24, P.leafD, 6); cone(M, x, y, .3, .45, .2, P.lav, 5); } },
      flowerbed(M, P) { M.box(-1.4, 1.4, -.7, .7, 0, .28, P.stone); M.box(-1.25, 1.25, -.55, .55, .2, .3, P.soil);
        for (let i = 0; i < 10; i++) sph(M, -1.05 + (i % 5) * .52, (i < 5 ? -.22 : .22), .42, .2, [P.red, P.yel, P.white, P.red, P.lilac][i % 5], 5); },
      planter(M, P) { M.box(-2.2, 2.2, -.45, .45, 0, .55, P.stone); M.box(-2.25, 2.25, -.5, .5, .5, .62, P.stoneL); for (let i = 0; i < 7; i++) sph(M, -1.8 + i * .6, 0, .78, .26, i % 2 ? P.leaf : P.red, 5); },
      tuft(M, P) { for (let i = 0; i < 7; i++) { const a = rnd() * 6.28, d = rnd() * .35; cone(M, Math.cos(a) * d, Math.sin(a) * d, 0, .45 + rnd() * .35, .07, rnd() < .5 ? P.grass : P.dry, 4); } },
      reeds(M, P) { for (let i = 0; i < 12; i++) { const a = rnd() * 6.28, d = rnd() * .8; cone(M, Math.cos(a) * d, Math.sin(a) * d, 0, 1.2 + rnd() * .7, .05, rnd() < .6 ? P.reed : P.grass, 4); } },
      hay(M, P) { for (let i = 0; i < 2; i++) M.lathe('x', [-.7, (i - .5) * 1.5, .62], [[0, 0], [0, .62], [1.4, .62], [1.4, 0]], 10, P.hay); },
      boulder(M, P) { for (let i = 0; i < 3; i++) { const r = .45 + rnd() * .5; M.lathe('z', [(rnd() - .5) * 1.2, (rnd() - .5) * 1, -r * .3], [[0, 0], [0, r * .9], [r * .9, r], [r * 1.4, r * .6], [r * 1.55, 0]], 5, rnd() < .5 ? P.rock : P.rockD); } },
      log(M, P) { M.lathe('x', [-1.9, 0, .28], [[0, 0], [0, .28], [3.8, .24], [3.8, 0]], 7, P.bark); cyl(M, 1.6, 1.1, 0, .45, .34, P.bark, 7); M.box(1.4, 1.8, .9, 1.3, .44, .47, P.wood); }
    };
    const make = (kind, v) => { seed = 11 + v * 7919 + kind.length * 131; const M = new TankBaker.Mesh(), m = (c, o) => M.mat(c, Object.assign({ noise: 1.2 }, o || {}));
      const P = { bark: m([82, 64, 48]), leaf: m([62, 88, 42]), leafL: m([84, 110, 52]), leafD: m([48, 70, 38]), pine: m([40, 62, 40]), lilac: m([160, 118, 196]), lilacL: m([196, 166, 220]),
        lav: m([128, 104, 182]), stone: m([150, 144, 132]), stoneL: m([176, 170, 158]), soil: m([92, 74, 54]), red: m([204, 64, 52]), yel: m([228, 196, 70]), white: m([236, 232, 222]),
        grass: m([104, 130, 62]), dry: m([166, 154, 96]), reed: m([150, 140, 90]), hay: m([206, 180, 108]), rock: m([138, 136, 128]), rockD: m([112, 110, 104]), wood: m([170, 140, 100]) };
      K[kind](M, P); return M; };
    return { make, has: k => !!K[k] };
  })();
  { const o_make152 = V146M.make; V146M.make = function (kind, v) { return V152M.has(kind) ? V152M.make(kind, v | 0) : o_make152.apply(this, arguments); }; }

  // ---------- helpers ----------
  const v152RefOf = (fx, fy) => { const w = Math.sqrt(3) * HEX_RADIUS; return [120 + ((fx - ORIGIN_X) / w - FS.c0) / FS.kx, 15 + ((fy - ORIGIN_Y) / (1.5 * HEX_RADIUS) - FS.r0) / FS.ky]; };
  function v152RoadDist(fx, fy) {
    const R = V152.roadPts || (V152.roadPts = (v151RoadPolys() || []).flatMap(p => p.flat)); let d = 1e9;
    for (let i = 0; i < R.length; i++) { const dx = R[i][0] - fx, dy = R[i][1] - fy, q = dx * dx + dy * dy; if (q < d) d = q; }
    return Math.sqrt(d);
  }
  const V152_WALLS = { low_wall: 1, stone_wall: 1, hedge: 1, fence: 1, balustrade: 1 };
  const v152EdgeCells = k => k.split('>').map(s => s.split(',').map(Number));
  const v152IsRoad = (c, r) => { const t = terrainMap[c + ',' + r]; return !!t && (t.terrainType === 'road' || t.terrainType === 'cobblestone' || !!t.bridge); };

  // ---------- walls: clean-up + yard walls ----------
  function v152Walls() {
    const w = Math.sqrt(3) * HEX_RADIUS, del = k => { EDGES.delete(k); V151.runEdges.delete(k); };
    let removed = 0, added = 0;
    const villa = (V147.structs || []).find(s => s.kind === 'villa');
    // runs lying on a road, and the old villa approaches
    V151.runs = V151.runs.filter(run => {
      const pts = v151Dense(run.pts, 6), onRoad = pts.filter(p => v152RoadDist(p[0], p[1]) < 13).length / pts.length;
      const nearVilla = villa && pts.some(p => Math.hypot(p[0] - villa.fx, p[1] - villa.fy) < w * 2.6);
      if (onRoad > .15 || nearVilla) { run.keys.forEach(k => { if (EDGES.has(k)) { del(k); removed++; } }); return false; }
      return true;
    });
    // any wall edge across a road
    [...EDGES.keys()].forEach(k => { const e = EDGES.get(k); if (!V152_WALLS[e.kind]) return; const [a, b] = v152EdgeCells(k); if (v152IsRoad(a[0], a[1]) && v152IsRoad(b[0], b[1])) { del(k); removed++; } });
    // yard walls: three sides + gate stubs on the door side
    const mpx = w / 7;
    (V146.spots || []).forEach(sp => {
      const Y = V152.yard[sp.kind]; if (!sp.fp || !Y) return;
      const hx = Y[0] * mpx, hy = Y[1] * mpx, X = [Math.cos(sp.ang), Math.sin(sp.ang)], D = [-Math.sin(sp.ang), Math.cos(sp.ang)], C = [sp.fx, sp.fy];
      const P = (sx, sy) => [C[0] + X[0] * hx * sx + D[0] * hy * sy, C[1] + X[1] * hx * sx + D[1] * hy * sy];
      const kind = sp.kind === 'villa' ? 'balustrade' : 'low_wall';
      const lines = [[P(-1, 1), P(-1, -1), P(1, -1), P(1, 1)], [P(-1, 1), P(-.45, 1)], [P(1, 1), P(.45, 1)]];
      lines.forEach(L => {
        const before = new Set(EDGES.keys()); v146LineEdges(kind, L.map(p => v152RefOf(p[0], p[1])));
        EDGES.forEach((e, k) => { if (before.has(k)) return; const [a, b] = v152EdgeCells(k);
          if (v152IsRoad(a[0], a[1]) || v152IsRoad(b[0], b[1]) || (v147StructAt(a[0], a[1]) && v147StructAt(b[0], b[1]))) del(k); else added++; });
      });
    });
    EDGE_VER++; V151.pieces = null;
    return { removed, added };
  }
  // pieces: not on a road, and only where a run edge still exists
  { 
    /* v151Pieces: layer moved to js/chains/v151Pieces.js */ }

  // ---------- villa faces the town ----------
  function v152Villa() {
    const sp = (V146.spots || []).find(s => s.kind === 'villa' && s.fp), town = (V146.spots || []).find(s => s.kind === 'town' && s.fp);
    if (!sp || !town) return; const dx = town.fx - sp.fx, dy = town.fy - sp.fy, L = Math.hypot(dx, dy) || 1;
    sp.ang = Math.atan2(-dx / L, dy / L);   // door (mesh −Y) toward the town
  }

  // ---------- natural objects ----------
  function v152Deco() {
    const out = [], w = Math.sqrt(3) * HEX_RADIUS, NN = COLS * ROWS, T = new Array(NN);
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const t = terrainMap[c + ',' + r]; T[r * COLS + c] = t ? t.terrainType : 'plains'; }
    const gv = v149Assign({ T }), G = i => gv[i] >= 0 ? GROUND_VAR_NAMES[gv[i]] : null;
    const isW = t => t === 'deep_water' || t === 'shallow_water';
    const put = (kind, c, r, k, spread = .34, ang = 0) => { const rnd = v99rng(c, r, 300 + k), f = v146CellFlat(c, r), fx = f[0] + (rnd() - .5) * 2 * spread * w, fy = f[1] + (rnd() - .5) * 2 * spread * w * .87;
      if (v152RoadDist(fx, fy) < 12) return; const sc = sectorAt.get(c + ',' + r); if (sc && sc.hq && kind !== 'tuft') return;   // HQ build ground stays clear
      out.push({ kind, v: (rnd() * 3) | 0, fx, fy, ang, z: v146Z(c, r), deco: true }); };
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c, t = terrainMap[c + ',' + r]; if (!t || t.oob || getCapturePointAt(c, r)) continue;
      const g = G(i), h = v99h(c, r, 77), nb = getHexNeighbors(c, r).map(n => T[n.r * COLS + n.c]);
      if (T[i] === 'plains' || T[i] === 'bush') {
        if (nb.some(isW)) { put('reeds', c, r, 1, .4); if (h < .5) put('reeds', c, r, 2, .4); continue; }
        if (g === 'moss_shade') { if (h < .14) put('oak', c, r, 3, .45); else if (h < .45) put('log', c, r, 4, .3, h * 40); else if (h < .55) put('boulder', c, r, 5); }
        else if (g === 'yard') { if (h < .18) put(h < .09 ? 'lilac' : 'lavender', c, r, 16, .44); else if (h > .9) put('flowerbed', c, r, 17, .35); }
        else if (g === 'garden_bed') { if (h < .6) put(h < .3 ? 'lilac' : 'lavender', c, r, 6, .4); if (h > .82) put('flowerbed', c, r, 7, .3); }
        else if (g === 'dry_grass') { if (h < .16) put('tuft', c, r, 8); if (h > .88) put('boulder', c, r, 9); if ((t.elevation | 0) >= 1 && h > .6 && h < .72) put('pines', c, r, 10, .4); }
        else if (g === 'meadow' || g === 'grass') { if (h < .1) put('tuft', c, r, 11); if (h > .975) put('oak', c, r, 12, .45); }
      } else if (T[i] === 'field') {
        if (g === 'stubble' && h < .55) { put('hay', c, r, 13, .3, h * 30); if (h < .2) put('hay', c, r, 14, .3, 1); }
        if (g === 'vineyard_rows' && h < .5) put('vineyard', c, r, 15, .2);
      }
    }
    // front of each house: planter wall + flower bed on the door side; cypress rows along roads near houses
    (V146.spots || []).forEach((sp, j) => { if (!sp.fp || !V152.yard[sp.kind]) return; const Y = V152.yard[sp.kind], m = w / 7, D = [-Math.sin(sp.ang), Math.cos(sp.ang)], X = [Math.cos(sp.ang), Math.sin(sp.ang)];
      const at = (sx, sy) => [sp.fx + X[0] * Y[0] * m * sx + D[0] * Y[1] * m * sy, sp.fy + X[1] * Y[0] * m * sx + D[1] * Y[1] * m * sy];
      [[-.62, .78, 'planter'], [.62, .78, 'flowerbed'], [-1.1, -1.1, 'lilac']].forEach(([sx, sy, k], q) => { const [fx, fy] = at(sx, sy); if (v152RoadDist(fx, fy) < 12) return; out.push({ kind: k, v: (j + q) % 3, fx, fy, ang: k === 'planter' || k === 'flowerbed' ? sp.ang : 0, z: sp.z || 0, deco: true }); }); });
    (v151RoadPolys() || []).forEach((rd, ri) => { const f = rd.flat; let last = -1e9;
      f.forEach((p, i) => { if (i - last < 4 || !(V147.structs || []).some(s => Math.hypot(s.fx - p[0], s.fy - p[1]) < w * 3.2)) return; last = i;
        const a = f[Math.max(0, i - 1)], b = f[Math.min(f.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, s = ri % 2 ? 1 : -1, fx = p[0] - dy / L * 17 * s, fy = p[1] + dx / L * 17 * s;
        const [c, r] = v137HexAt(fx, fy), t = terrainMap[c + ',' + r]; if (!t || t.terrainType !== 'plains' || v147StructAt(c, r) || v152RoadDist(fx, fy) < 13) return;
        if ((V147.structs || []).some(s => s.cells.some(([sc, sr]) => getDistance(sc, sr, c, r) <= 1)) || getCapturePointAt(c, r)) return;   // keep house fronts and points clear
        out.push({ kind: 'cypress', v: i % 3, fx, fy, ang: 0, z: v146Z(c, r), deco: true }); }); });
    return out;
  }
  // tall reference props (cypress, trees, lamps) standing in front of a door are dropped
  function v152ClearFronts() {
    const w = Math.sqrt(3) * HEX_RADIUS, tall = { cypress: 1, cypress2: 1, tree: 1, lamp: 1, cart: 1, pile: 1 };
    const houses = (V146.spots || []).filter(s => s.fp);
    V146.spots = (V146.spots || []).filter(sp => { if (sp.fp || sp.deco || !tall[sp.kind]) return true;
      return !houses.some(h => { const D = [-Math.sin(h.ang), Math.cos(h.ang)], vx = sp.fx - h.fx, vy = sp.fy - h.fy, L = Math.hypot(vx, vy); return L < w * 1.9 && (vx * D[0] + vy * D[1]) / (L || 1) > .2; }); });
  }
  function v152ApplyDeco__base() { V146.spots = (V146.spots || []).filter(s => !s.deco).concat(V152.on ? V152.spots : []); V146.key = null; }

  // ---------- load ----------
  {  /* loadFaymonville: layer moved to js/chains/loadFaymonville.js */ }
  { 
    /* loadHistoricalMap: layer moved to js/chains/loadHistoricalMap.js */ }

  // ---------- ground: HQ sand, cobble in front of doors ----------
  { 
    /* v149Assign: layer moved to js/chains/v149Assign.js */ }
  { 
    /* v99Info: layer moved to js/chains/v99Info.js */ }

  // settings: decoration switch
  (function () {
    const prev = document.getElementById('edgecov-opt'); if (!prev) return;
    const g = document.createElement('div'); g.className = 'set-group';
    g.innerHTML = '<h3>자연물 장식 (v152)</h3><div class="set-row"><select id="deco-opt"><option value="on" selected>켜짐 — 나무·꽃·풀·건초·바위</option><option value="off">꺼짐 — 성능 비교용</option></select></div>';
    prev.closest('.set-group').after(g);
    g.querySelector('select').addEventListener('change', e => { V152.on = e.target.value === 'on'; v152ApplyDeco(); render(); });
  })();


