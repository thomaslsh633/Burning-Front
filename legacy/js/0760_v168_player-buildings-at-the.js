  // [v168] player buildings at the true map scale (model metres x map px/m, no stretching to the footprint);
  //   footprint from the model's longest side (either faction): up to 7.5 m 1 hex, up to 11 m 2 hexes, longer 3 hexes; HQ 3
  var V168 = { trueScale: true };
  V151.FP.tank_depot = 3;   // Axis armour company 11.3 m
  const V151_OPEN = { plains: 1, field: 1, bush: 1, crater: 1, snow: 1, desert: 1 };   // never on roads: vehicle routes stay open
  const v151Cells = b => b.cells || [[b.c, b.r]];
  const v151OnB = (b, c, r) => (b.c === c && b.r === r) || !!(b.cells && b.cells.some(q => q[0] === c && q[1] === r));
  const v151Need = b => (b && V151.FP[b.type]) || 1;

  // ---------- roads ----------
  function v151Chaikin(pts, it) { let p = pts; for (let k = 0; k < it; k++) { const q = [p[0]]; for (let i = 0; i + 1 < p.length; i++) { const a = p[i], b = p[i + 1]; q.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25], [a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75]); } q.push(p[p.length - 1]); p = q; } return p; }
  function v151Dense(p, step) { const o = [p[0]]; for (let i = 0; i + 1 < p.length; i++) { const a = p[i], b = p[i + 1], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step)); for (let t = 1; t <= n; t++) o.push([a[0] + (b[0] - a[0]) * t / n, a[1] + (b[1] - a[1]) * t / n]); } return o; }
  function v151RoadPolys__base() {
    if (!v150Fay() || typeof FAY2 === 'undefined' || !FAY2.roads) return null;
    return FAY2.roads.map((line, i) => ({ main: i < 2, flat: v151Dense(v151Chaikin(line.map(([x, y]) => v146Flat(x, y)), 3), 4) }));
  }
  function v151Offset(pts, d) {   // flat polyline offset sideways
    return pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; return [p[0] - dy / L * d, p[1] + dx / L * d]; });
  }
  function v151DrawRoads(g, info) {
    const P = info.pal, cache = info.roadLift || (info.roadLift = new Map()), vk = v137On() ? V137.ver : -1;
    if (info.roadLiftV !== vk) { cache.clear(); info.roadLiftV = vk; }
    const lift = pts => { let q = cache.get(pts); if (!q) { q = pts.map(p => vk >= 0 ? v137P(p[0], p[1]) : v99Proj(p[0], p[1], 0)); cache.set(pts, q); } return q; };
    // only the roads whose bounds meet the clip rect
    const st = (pts, w, col) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); v99PathOn(g, lift(pts), false); g.stroke(); };
    info.roadPolys.forEach(rd => {
      const k = rd.main ? 1 : .78, f = rd.flat;
      st(f, 30 * k, v99rgb(P.dirt, 1, .07)); st(f, 24 * k, v99rgb(P.dirt, 1, .12));                 // feathered dirt shoulder
      st(f, 18.5 * k, v99rgb(P.roadEdge, 1, .5)); st(f, 15.5 * k, v99rgb(P.road, .97, .96));          // gravel bed
      if (!rd.ruts) rd.ruts = [-1, 1].map(s => v151Offset(f, s * 3.6 * k));
      rd.ruts.forEach(o => { st(o, 2.6 * k, v99rgb(P.rut, 1, .45)); st(o, 1.1 * k, v99rgb(P.rut, .85, .3)); });   // wheel ruts
      st(f, 2.2 * k, rd.main ? v99rgb(P.roadMid, 1, .35) : v99rgb(V151.roadCol.crown, 1, .5));        // crown: pale gravel / grass strip
    });
  }
  { 
    /* v99Info: layer moved to js/chains/v99Info.js */ }
  { 
    /* v99Flats: layer moved to js/chains/v99Flats.js */ }

  // ---------- straight wall runs ----------
  { 
    /* v146LineEdges: layer moved to js/chains/v146LineEdges.js */ }
  { 
    /* loadHistoricalMap: layer moved to js/chains/loadHistoricalMap.js */ }
  function v151Pieces__base() {
    if (V151.pieces && V151.pkey === EDGE_VER) return V151.pieces;
    const out = [], step = Math.sqrt(3) * HEX_RADIUS / 7 * 4.0;   // 4 m
    V151.runs.forEach((run, ri) => {
      const mids = run.keys.map(k => { const [a, b] = k.split('>').map(s => s.split(',').map(Number)), A = v146CellFlat(a[0], a[1]), B = v146CellFlat(b[0], b[1]); return { k, x: (A[0] + B[0]) / 2, y: (A[1] + B[1]) / 2 }; });
      for (let i = 0; i + 1 < run.pts.length; i++) {
        const [ax, ay] = run.pts[i], [bx, by] = run.pts[i + 1], L = Math.hypot(bx - ax, by - ay); if (L < 1) continue;
        const n = Math.max(1, Math.round(L / step)), ang = Math.atan2(by - ay, bx - ax), fi = TANK_SPR.idx(ang), res = Math.round(Math.atan2(Math.sin(ang - TANK_SPR.yaw(fi)), Math.cos(ang - TANK_SPR.yaw(fi))) * 180 / Math.PI);   // wrapped to ±7.5°
        for (let j = 0; j < n; j++) {
          const t = (j + .5) / n, fx = ax + (bx - ax) * t, fy = ay + (by - ay) * t;
          let best = null, bd = 1e9; mids.forEach(m => { const d = Math.hypot(m.x - fx, m.y - fy); if (d < bd) { bd = d; best = m; } });
          const e = best && EDGES.get(best.k), vv = (ri * 7 + j) % 3;
          out.push({ kind: run.kind === 'balustrade' ? 'wallseg_bal' : 'wallseg_low', v: vv * 100 + res + 50, st: e ? (e.st || 0) : 0, fx, fy, ang: TANK_SPR.yaw(fi),
            z: V137.grid ? v137H(fx, fy) : 0, run: true });
        }
      }
    });
    V151.pieces = out; V151.pkey = EDGE_VER; return out;
  }
  { 
    /* v146EdgeSpots: layer moved to js/chains/v146EdgeSpots.js */ }
  { const o_make151 = V146M.make;
    V146M.make = function (kind, v, st) {
      if (kind !== 'wallseg_low' && kind !== 'wallseg_bal') return o_make151.apply(this, arguments);
      const vv = Math.floor(v / 100), res = (v % 100) - 50, M = V146M.make(kind === 'wallseg_bal' ? 'balustrade' : 'low_wall', vv, st);
      const phi = -res * Math.PI / 180, c = Math.cos(phi), s = Math.sin(phi), rot = A => { for (let i = 0; i < A.length; i += 3) { const x = A[i], y = A[i + 1]; A[i] = x * c - y * s; A[i + 1] = x * s + y * c; } };
      rot(M.P); rot(M.N); return M;
    }; }

  // ---------- player buildings: footprint ----------
  function v151FreeFor(c, r, b) {
    const t = terrainMap[c + ',' + r]; if (!t || t.oob || t.fort || t.bridge || !V151_OPEN[t.terrainType]) return false;   // open ground only
    if (buildings.some(o => o !== b && o.hp > 0 && v151OnB(o, c, r))) return false;
    if (getUnitAt(c, r)) return false;   // v212: includes emplacement footprints
    if (bunkers.some(k => k.hp > 0 && k.c === c && k.r === r) || getCapturePointAt(c, r)) return false;
    return true;
  }
  // pick n cells: anchor + neighbours; avoid: cells too close to `away` (engineer), keep compact (triangle for 3)
  function v151Pick(b, c0, r0, n, away) {
    const ok = (c, r) => v151FreeFor(c, r, b) && (!away || c !== away.c || r !== away.r);   // v212: only the engineer's own hex is excluded
    const cells = [[c0, r0]]; if (n <= 1) return cells;
    for (let e = 0; e < 6 && cells.length < n; e++) {
      const a = getNeighborByEdge(c0, r0, e); if (!a || !ok(a.c, a.r)) continue;
      if (n === 2) { cells.push([a.c, a.r]); break; }
      const bb = getNeighborByEdge(c0, r0, (e + 1) % 6); if (bb && ok(bb.c, bb.r)) { cells.push([a.c, a.r], [bb.c, bb.r]); break; }
    }
    if (cells.length < n) for (let e = 0; e < 6 && cells.length < n; e++) { const a = getNeighborByEdge(c0, r0, e); if (a && ok(a.c, a.r) && !cells.some(q => q[0] === a.c && q[1] === a.r)) cells.push([a.c, a.r]); }
    return cells;
  }
  function v151SetFootprint(b, cells) {
    b.cells = cells; delete b._v133f; delete b._v151;
    if (cells.length === 2) { const A = v146CellFlat(...cells[0]), B = v146CellFlat(...cells[1]); let a = Math.atan2(B[1] - A[1], B[0] - A[0]); if (a > Math.PI / 2) a -= Math.PI; if (a <= -Math.PI / 2) a += Math.PI; b._v133f = TANK_SPR.idx(a); }
  }
  function v151AssignAll() { buildings.forEach(b => { if (b.hp > 0 && !b.cells && V151.FP[b.type]) v151SetFootprint(b, v151Pick(b, b.c, b.r, v151Need(b), null)); }); }
  {  /* resetGame: layer moved to js/chains/resetGame.js */ }

  // placement check (click) and highlighted tiles: multi-hex = engineer's 2nd ring, whole footprint ≥ 2 hexes from the engineer
  // v212: centre + 6 neighbours (only when all 7 are on the map)
  function v151Ring7(c, r) { const n = getHexNeighbors(c, r); return n.length === 6 ? [[c, r]].concat(n.map(h => [h.c, h.r])) : [[c, r]]; }
  // placement check (click) and highlighted tiles: everything within 2 hexes of the engineer, never on the engineer's hex
  function v151PlaceCheck(bt, hex, eng) {
    V151.pend = null;
    if (!eng || (hex.c === eng.c && hex.r === eng.r)) return '공병이 있는 칸에는 설치할 수 없습니다';
    const big = !!(FORT[bt] && FORT[bt].big), n = big ? 7 : BLD[bt] ? (V151.FP[bt] || 1) : 1, d = getDistance(eng.c, eng.r, hex.c, hex.r);
    if (d < 1 || d > 2) return '공병 주변 2칸 이내에 설치하세요';
    if (n <= 1) return '';
    const cells = big ? v151Ring7(hex.c, hex.r) : v151Pick(null, hex.c, hex.r, n, eng);
    if (cells.length < n) return `${n}칸이 비어 있어야 합니다`;
    for (const [c, r] of cells) {
      if (c === eng.c && r === eng.r) return `${FORT[bt] ? FORT[bt].n : BLD[bt].n}의 ${n}칸 안에 공병이 있습니다`;
      if (big && !v151FreeFor(c, r, null)) return `대형 진지는 주변 7칸이 모두 빈 개활지여야 합니다 (${c},${r})`;
      const why = placeReason(c, r, !big); if (why) return why;
    }
    V151.pend = { c: hex.c, r: hex.r, cells }; return '';
  }
  function v151AfterPlace(b) {
    if (!b || !V151.FP[b.type]) return;
    const p = V151.pend; v151SetFootprint(b, p && p.c === b.c && p.r === b.r ? p.cells : v151Pick(b, b.c, b.r, v151Need(b), null)); V151.pend = null;
  }
  { 
    /* validActionTiles: layer moved to js/chains/validActionTiles.js */ }
  // engineers within 2 hexes of the footprint keep the construction going
  function v151EngNear(u, b) { return v151Cells(b).some(([c, r]) => getDistance(u.c, u.r, c, r) <= 2); }   // v212: always 2 hexes
  // tapping any footprint hex = tapping the building
  function v151Anchor(hex) { if (!hex || getUnitAt(hex.c, hex.r)) return hex; const b = getBuildingAt(hex.c, hex.r); return b && (b.c !== hex.c || b.r !== hex.r) ? { c: b.c, r: b.r } : hex; }

  // ---------- drawing at the map scale over the footprint ----------
  function v151Geo(b) {
    const cells = v151Cells(b); let x = 0, y = 0; cells.forEach(([c, r]) => { const q = getHexCenter(c, r); x += q.x / cells.length; y += q.y / cells.length; });
    let k = 1; const mesh = typeof V133 !== 'undefined' && V133.meshes.get(b.team + ':' + b.type);
    if (mesh) { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (let i = 0; i < mesh.P.length; i += 3) { x0 = Math.min(x0, mesh.P[i]); x1 = Math.max(x1, mesh.P[i]); y0 = Math.min(y0, mesh.P[i + 1]); y1 = Math.max(y1, mesh.P[i + 1]); }
      k = V168.trueScale ? SCALE_REF.mapPxM() / V133.S : SCALE_REF.mapPxM() * (V151.LEN[cells.length] || 6.4) / Math.max(x1 - x0, y1 - y0, 3) / V133.S; }   // v168: true scale (1 hex = 7 m)
    return { x, y, k };
  }
  { 
    /* drawBuildingShape: layer moved to js/chains/drawBuildingShape.js */ }
  {  /* v99BldTop: layer moved to js/chains/v99BldTop.js */ }
  {  /* v110BldBanner: layer moved to js/chains/v110BldBanner.js */ }

  // ---------- bunkers and emplacements: one hex wide ----------
  function v151Fit(id, part, fi, fn) {
    const e = v134Get(id, part, fi); if (!e || e.none) return fn();
    const lim = Math.sqrt(3) * HEX_RADIUS * (V134_EMPL[id] && V134_EMPL[id].big ? V151.emplBigPx : V151.emplPx) * V134.S / e.W, o = v117Hs, cur = o();
    if (cur <= lim) return fn();
    v117Hs = () => lim; try { return fn(); } finally { v117Hs = o; }
  }
  {  /* v99Bunker: layer moved to js/chains/v99Bunker.js */ }
  { 
    /* drawUnitArt: layer moved to js/chains/drawUnitArt.js */ }


