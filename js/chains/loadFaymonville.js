  // [chain:loadFaymonville] 9 layers; the original in [17u] and older layers were dead code and are removed.
  //   Call order, outermost first: loadFaymonville → loadFaymonville__v156 → loadFaymonville__v152 → loadFaymonville__v150 → loadFaymonville__v146 → loadFaymonville__v138 → loadFaymonville__v137 → loadFaymonville__v136 → loadFaymonville__v135
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // loadFaymonville: from [v168], calls loadFaymonville__v156
  function loadFaymonville() {
      const r = loadFaymonville__v156.apply(this, arguments);
      try { ['blue', 'red'].forEach(v168LayoutBase); } catch (err) { console.warn('v168 fay base', err); }
      return r;
    }

  // loadFaymonville__v156: from [17+3], calls loadFaymonville__v152
  function loadFaymonville__v156() { const r = loadFaymonville__v152.apply(this, arguments); try { if (V156.on && V156.move) v156Relocate(); } catch (err) { console.warn('v156 relocate', err); } return r; }

  // loadFaymonville__v152: from [17_], calls loadFaymonville__v150
  function loadFaymonville__v152() { const r = loadFaymonville__v150.apply(this, arguments); try { v152Villa(); } catch (err) { console.warn('v152 villa', err); } return r; }

  // loadFaymonville__v150: from [17(], calls loadFaymonville__v146
  function loadFaymonville__v150() {
      const res = loadFaymonville__v146.apply(this, arguments);
      try {
        (V146.spots || []).forEach((sp, i) => { if (!sp.fp || sp.kind === 'villa') return;
          const a = v150RoadYaw(sp); if (a === null) return;
          sp.ang = a + (v99h(i, 7, 3) - .5) * 2 * V150.jitter * Math.PI / 180; });
      } catch (err) { console.warn('v150 yaw', err); }
      return res;
    }

  // loadFaymonville__v146: from [17%], calls loadFaymonville__v138
  function loadFaymonville__v146() {
      const res = loadFaymonville__v138.apply(this, arguments);
      V146.spots = []; V146.fpCells = new Set(); V146.key = null;
      const SHAPE = { 1: [[0, 0]], 2: [[0, 0], [1, 0]], 3: [[0, 0], [1, 0], [0, 1]], 6: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]] };
      FAY2.houses.forEach(([x, y, n, label], i) => {
        const [c0, r0] = v146RefCell(x, y), cells = (SHAPE[n] || SHAPE[1]).map(([dc, dr]) => [c0 + dc, r0 + dr]).filter(([c, r]) => (terrainMap[c + ',' + r] || {}).terrainType === 'building');
        if (!cells.length) return;
        cells.forEach(([c, r]) => V146.fpCells.add(c + ',' + r));
        let fx = 0, fy = 0; cells.forEach(([c, r]) => { const f = v146CellFlat(c, r); fx += f[0] / cells.length; fy += f[1] / cells.length; });
        let [kind, yaw] = V146_HOUSES[label] || ['farm', 0]; if (kind === 'farm' && i === 3) kind = 'farm2';
        V146.spots.push({ kind, v: i, fx, fy, ang: yaw * Math.PI / 180, z: Math.max(...cells.map(([c, r]) => v146Z(c, r))), fp: cells });
      });
      V146_PROPS.forEach(([kind, x, y, yaw], i) => { const [fx, fy] = v146Flat(x, y), [c, r] = v146RefCell(x, y); V146.spots.push({ kind, v: i, fx, fy, ang: yaw * Math.PI / 180, z: v146Z(c, r) }); });
      V146.lineEdges = 0; V146_LINES.forEach(([kind, pts]) => { V146.lineEdges += v146LineEdges(kind, pts); });
      return res;
    }

  // loadFaymonville__v138: from [17-], calls loadFaymonville__v137
  function loadFaymonville__v138() {
      const res = loadFaymonville__v137.apply(this, arguments);
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const t = terrainMap[c + ',' + r]; if (t && t.bridge) t.vh = V138.deck; }
      const w = Math.sqrt(3) * HEX_RADIUS, x = 486, y = 958; V138.jetty = { map: 'faymonville', fx: ORIGIN_X + (FS.c0 + (x - 120) * FS.kx) * w, fy: ORIGIN_Y + (FS.r0 + (y - 15) * FS.ky) * 1.5 * HEX_RADIUS, ang: Math.atan2(1.98, .3) };
      return res;
    }

  // loadFaymonville__v137: from [17z], calls loadFaymonville__v136
  function loadFaymonville__v137() {
      const res = loadFaymonville__v136.apply(this, arguments), tmpW = {};
      const I = (x, y) => { const r = Math.round(FS.r0 + (y - 15) * FS.ky); return [Math.round(FS.c0 + (x - 120) * FS.kx - (r % 2) * .5), r]; };
      const hill = (x, y, rad, lv) => { rad = Math.max(1, Math.round(rad * FS.s)); const [c0, r0] = I(x, y); for (let r = r0 - rad; r <= r0 + rad; r++) for (let c = c0 - rad; c <= c0 + rad; c++) { const t = terrainMap[c + ',' + r]; if (!t || getDistance(c0, r0, c, r) > rad || t.terrainType === 'deep_water' || t.terrainType === 'shallow_water') continue; t.elevation = Math.max(t.elevation | 0, lv); } };
      // playable hills (gameplay levels): north-west rise, south-west ridge with a level-2 knoll, east hill with a level-2 crown, villa terrace
      hill(410, 270, 3, 1); hill(300, 720, 3, 1); hill(285, 705, 1, 2); hill(740, 300, 3, 1); hill(745, 310, 1, 2); hill(420, 860, 1, 1); hill(640, 640, 1, 1);
      // out-of-bounds relief (visual only): wooded hills on the flanks
      hill(60, 420, 4, 1); hill(960, 330, 4, 1); hill(980, 820, 4, 2); hill(80, 900, 4, 1);
      // rocky banks either side of the bridge: steep, rock-strewn
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const t = terrainMap[c + ',' + r]; if (!t || !t.oob || t.terrainType === 'deep_water' || t.terrainType === 'shallow_water') continue;
        const x = 120 + (c + (r % 2) * .5 - FS.c0) / FS.kx, y = 15 + (r - FS.r0) / FS.ky;
        if (y < 230 && x > 360 && x < 800 && (x < 588 || x > 630) && fayWaterImg(x, y, tmpW).d < 26) {
          const D = TERRAIN_DEFS.rock; setTerrain(c, r, 'rock', 0, D.cover, D.name, D.code, 0); Object.assign(terrainMap[c + ',' + r], { oob: true, vh: 1.4 });
        }
      }
      const B = FAY2.bridge; for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const x = 120 + (c + (r % 2) * .5 - FS.c0) / FS.kx, y = 15 + (r - FS.r0) / FS.ky; if (x >= B[0] && x <= B[2] && y >= B[1] && y <= B[3]) Object.assign(terrainMap[c + ',' + r], { vh: 0, vfix: true, bridge: true }); }
      return res;
    }

  // loadFaymonville__v136: from [17y], calls loadFaymonville__v135
  function loadFaymonville__v136() {
      const res = loadFaymonville__v135.apply(this, arguments), w = Math.sqrt(3) * HEX_RADIUS, R = HEX_RADIUS, tmp = {};
      // hexes follow the same water shapes the painter uses (the bridge stays a road)
      const B = FAY2.bridge;
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const x = 120 + (c + (r % 2) * .5 - FS.c0) / FS.kx, y = 15 + (r - FS.r0) / FS.ky, t = terrainMap[c + ',' + r]; if (!t) continue;
        if (x >= B[0] && x <= B[2] && y >= B[1] && y <= B[3]) continue;
        const sd = fayWaterImg(x, y, tmp).d, wasW = t.terrainType === 'deep_water' || t.terrainType === 'shallow_water';
        if (sd < 0) { const ty = sd < -10 ? 'deep_water' : 'shallow_water', D = TERRAIN_DEFS[ty]; if (t.terrainType !== ty || !t.oob) { setTerrain(c, r, ty, 0, D.cover, D.name, D.code, 0); terrainMap[c + ',' + r].oob = true; } }
        else if (wasW) { const D = TERRAIN_DEFS.forest; setTerrain(c, r, 'forest', 0, D.cover, D.name, D.code, 0); terrainMap[c + ',' + r].oob = true; }
      }
      // painter: flat coordinates ↔ reference-map pixels
      const toImg = (fx, fy) => [120 + ((fx - ORIGIN_X) / w - FS.c0) / FS.kx, 15 + ((fy - ORIGIN_Y) / (1.5 * R) - FS.r0) / FS.ky], kx = FS.kx * w, ky = FS.ky * 1.5 * R;
      V136.water = { map: 'faymonville', cols: COLS, at(fx, fy) { const p = toImg(fx, fy); fayWaterImg(p[0], p[1], tmp); this._d = tmp.d * 1.52; this._a = tmp.a > 9 ? 99 : Math.atan2(Math.sin(tmp.a) * ky, Math.cos(tmp.a) * kx); } };
      return res;
    }

  // loadFaymonville__v135: from [17x], does NOT call the layer below
  function loadFaymonville__v135() {
    terrainMap = {}; mines = []; bunkers = []; capturePoints = []; buildings = [];
    COLS = 48; ROWS = 48; initProjection(); MAP_PALETTE = {};
    const F = FAY2, put = (c, r, t, oob) => { if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return; const d = TERRAIN_DEFS[t] || TERRAIN_DEFS.plains; setTerrain(c, r, t, 0, d.cover, d.name, d.code, 0); if (oob) terrainMap[c + ',' + r].oob = true; };
    const X = (c, r) => 120 + (c + (r % 2) * .5 - FS.c0) / FS.kx, Y = r => 15 + (r - FS.r0) / FS.ky;
    const I = (x, y) => { const r = Math.round(FS.r0 + (y - 15) * FS.ky); return [Math.round(FS.c0 + (x - 120) * FS.kx - (r % 2) * .5), r]; };
    const inPoly = (x, y, pts) => { let k = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) k = !k; } return k; };
    const segD = (x, y, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy))); return Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy); };
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const x = X(c, r), y = Y(r), b = F.bridge;
      if (x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3]) { put(c, r, 'road'); continue; }
      if (inPoly(x, y, F.area)) { put(c, r, 'plains'); continue; }
      let dr = Infinity; for (let i = 0; i + 1 < F.river.length; i++) dr = Math.min(dr, segD(x, y, F.river[i], F.river[i + 1]));
      const dl = Math.hypot(x - F.lake[0], y - F.lake[1]) - F.lake[2];
      put(c, r, dr < 30 || dl < 0 ? 'deep_water' : dr < 48 || dl < 16 ? 'shallow_water' : 'forest', true);
    }
    const free = (c, r) => { const t = terrainMap[c + ',' + r]; return t && !t.oob; };
    const blob = (x, y, rad, t) => { const [c0, r0] = I(x, y); for (let r = r0 - rad; r <= r0 + rad; r++) for (let c = c0 - rad; c <= c0 + rad; c++) if (getDistance(c0, r0, c, r) <= rad && free(c, r) && getTerrain(c, r).terrainType === 'plains') put(c, r, t); };
    const line = (t, pts) => { pts = pts.map(([x, y]) => I(x, y)); for (let i = 0; i + 1 < pts.length; i++) hexLine(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]).forEach(([c, r]) => { if (free(c, r) && (t === 'road' || getTerrain(c, r).terrainType === 'plains')) put(c, r, t); }); };
    // fields and vineyards, copses, garden hedges, fences
    [[660, 330, 1], [700, 640, 1], [360, 410, 1], [580, 760, 1], [250, 560, 1], [760, 470, 1]].forEach(([x, y, n]) => blob(x, y, n, 'field'));
    [[420, 560, 1], [690, 560, 1], [300, 840, 1], [780, 420, 1]].forEach(([x, y, n]) => blob(x, y, n, 'forest'));
    [[350, 300, 1], [470, 380, 1], [640, 680, 1], [240, 720, 1]].forEach(([x, y, n]) => blob(x, y, n, 'bush'));
    F.roads.forEach(p => line('road', p));
    [[[420, 250], [470, 330]], [[540, 330], [640, 320]], [[380, 760], [470, 760]], [[700, 600], [760, 650]], [[260, 600], [260, 680]]].forEach(p => line('hedge', p));
    [[[520, 640], [560, 700]], [[600, 210], [650, 230]], [[460, 870], [520, 900]], [[340, 450], [380, 470]]].forEach(p => line('fence', p));
    // buildings: 1 hex · 2 in a row · 3 in a triangle · 6 in two rows of three
    const SHAPE = { 1: [[0, 0]], 2: [[0, 0], [1, 0]], 3: [[0, 0], [1, 0], [0, 1]], 6: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]] };
    F.houses.forEach(([x, y, n]) => { const [c, r] = I(x, y); (SHAPE[n] || SHAPE[1]).forEach(([dc, dr]) => { const cc = c + dc, rr = r + dr; if (free(cc, rr)) put(cc, rr, 'building'); }); });
    // HQs
    ['blue', 'red'].forEach(tm => {
      const [c0, r0] = I(...F.hq[tm]); for (let r = r0 - 2; r <= r0 + 2; r++) for (let c = c0 - 2; c <= c0 + 2; c++) if (getDistance(c0, r0, c, r) <= 2 && free(c, r) && getTerrain(c, r).terrainType !== 'road') put(c, r, 'plains');
      buildings.push({ id: 'base_' + tm, type: 'hq', team: tm, className: tm === 'blue' ? '연합군 사령부' : '추축군 사령부', name: tm === 'blue' ? 'Faymonville Allied HQ' : 'Faymonville Axis HQ', c: c0, r: r0, hp: 690, maxHp: 690, armor: 0, sight: 5 });
    });
    // points
    F.points.forEach(d => { const [c, r] = I(d.x, d.y); if (getTerrain(c, r).terrainType !== 'road') put(c, r, d.cls === 'vp' ? 'cobblestone' : 'plains'); const cp = addPoint(Object.assign({}, d, { c, r })); if (d.ownSector) cp.ownSector = true; });
    // cover: scattered on open ground, and every zone gets some (VP zones hard cover)
    let seed = 1944; const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const open = (c, r) => free(c, r) && getTerrain(c, r).terrainType === 'plains' && !capturePoints.some(p => p.zone.has(c + ',' + r)) && !buildings.some(b => getDistance(b.c, b.r, c, r) <= 3)
      && getHexNeighbors(c, r).every(n => getTerrain(n.c, n.r).terrainType !== 'road');
    const scatter = (t, n) => { let k = 0, g = 0; while (k < n && g++ < 6000) { const c = Math.floor(rnd() * COLS), r = Math.floor(rnd() * ROWS); if (!open(c, r)) continue; put(c, r, t); k++; } };
    scatter('crater', 16); scatter('fence', 12); scatter('rubble', 8); scatter('rock', 6);
    capturePoints.forEach(cp => {
      const isCov = k => { const t = terrainMap[k]; return t && (t.cover === 'yellow' || t.cover === 'hard'); };
      let have = cp.zoneList.filter(([c, r]) => isCov(c + ',' + r)).length;
      const cand = cp.zoneList.filter(([c, r]) => !cp.cores.some(k => k[0] === c && k[1] === r) && free(c, r) && getTerrain(c, r).terrainType === 'plains');
      for (let i = 0; have < Math.max(1, cp.radius) && i < cand.length; i += 3) { put(cand[i][0], cand[i][1], 'crater'); have++; }
      if (cp.cls === 'vp') { let hard = cp.zoneList.filter(([c, r]) => getTerrain(c, r).cover === 'hard').length;
        for (let i = 1; hard < cp.radius && i < cand.length; i += 2) { const [c, r] = cand[i]; if (getTerrain(c, r).terrainType !== 'plains') continue; put(c, r, i % 4 === 1 ? 'rubble' : 'rock'); hard++; } }
    });
  }


