  // ══════════════════════════════════════════════════════════════
  // [17t] v131 — sectors and supply lines, and the Sector Front map
  //   One sector per HQ and per resource point (VPs stand alone inside a sector). A point's owner owns its sector; a sector pays
  //   only while a chain of the owner's sectors links it to the owner's HQ sector. Sector shapes: weighted nearest-seed cells
  //   (the HQ cells are bigger), mirrored on the symmetric 48×48 maps.
  // ══════════════════════════════════════════════════════════════
  const v131Owner = s => s.hq || (s.cp ? s.cp.owner : null);
  function v131FlatDist(a, b) { const v = unproj(b.x - a.x, b.y - a.y); return Math.hypot(v.x, v.y); }
  function v131BuildSectors() {
    sectors = []; sectorAt = new Map();
    const seeds = [];
    buildings.filter(b => b.type === 'hq').forEach(b => seeds.push({ c: b.c, r: b.r, hq: b.team, w: COLS >= 40 ? 3.5 : 1 }));
    capturePoints.filter(cp => cp.cls !== 'vp' || cp.ownSector).forEach(cp => seeds.push({ c: cp.c, r: cp.r, cp, w: 0 }));   // v132: + VPs that own a sector
    if (seeds.length < 2) return;
    const wc = seeds.map(q => { if (!q.cp || q.cp.cores.length < 2) return getHexCenter(q.c, q.r); const cs = q.cp.cores.map(k => getHexCenter(k[0], k[1])); return { x: cs.reduce((a, v) => a + v.x, 0) / cs.length, y: cs.reduce((a, v) => a + v.y, 0) / cs.length }; }), unit = v131FlatDist(getHexCenter(0, 0), getHexCenter(1, 0));   // v132: core centroid
    const pick = (c, r) => { const q = getHexCenter(c, r); let best = 0, bd = Infinity; seeds.forEach((sd, i) => { const d = v131FlatDist(wc[i], q) / unit - sd.w; if (d < bd - 1e-9) { bd = d; best = i; } }); return best; };
    const W = COLS - 1, H = ROWS - 1, at = new Int16Array(COLS * ROWS);
    const twin = seeds.map(sd => seeds.findIndex(o => (o.c === W - sd.c && o.r === H - sd.r) || (o.cp && o.cp === sd.cp && o.cp.cores.some(k => k[0] === W - sd.c && k[1] === H - sd.r))));   // v132: a centred VP is its own twin
    const mirror = COLS === ROWS && twin.every(i => i >= 0);
    const oob = (c, r) => { const t = terrainMap[c + ',' + r]; return !!(t && t.oob); };   // v132: out-of-bounds hexes belong to no sector
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) at[r * COLS + c] = oob(c, r) ? -2 : (mirror && r > H / 2) ? -1 : pick(c, r);
    if (mirror) for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (at[r * COLS + c] === -1) at[r * COLS + c] = twin[at[(H - r) * COLS + (W - c)]];
    // keep every sector in one piece: stray hexes join the neighbouring sector they touch most
    for (let pass = 0; pass < 6; pass++) {
      let moved = 0;
      seeds.forEach((sd, i) => {
        const seen = new Set([sd.c + ',' + sd.r]), q = [[sd.c, sd.r]];
        while (q.length) { const [c, r] = q.pop(); getHexNeighbors(c, r).forEach(n => { const k = n.c + ',' + n.r; if (!seen.has(k) && at[n.r * COLS + n.c] === i) { seen.add(k); q.push([n.c, n.r]); } }); }
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
          if (at[r * COLS + c] !== i || seen.has(c + ',' + r)) continue;
          const cnt = {}; getHexNeighbors(c, r).forEach(n => { const o = at[n.r * COLS + n.c]; if (o !== i && o >= 0) cnt[o] = (cnt[o] || 0) + 1; });
          const best = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a] || a - b)[0]; if (best !== undefined) { at[r * COLS + c] = +best; moved++; }
        }
      });
      if (!moved) break;
    }
    sectors = seeds.map((sd, i) => ({ id: i, c: sd.c, r: sd.r, hq: sd.hq || null, cp: sd.cp || null, name: sd.cp ? sd.cp.name : (sd.hq === 'blue' ? 'Allied HQ' : 'Axis HQ'), hexes: new Set(), adj: new Set() }));
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { if (at[r * COLS + c] < 0) continue; const sc = sectors[at[r * COLS + c]], k = c + ',' + r; sc.hexes.add(k); sectorAt.set(k, sc); }
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const a = at[r * COLS + c]; if (a < 0) continue; getHexNeighbors(c, r).forEach(n => { const b = at[n.r * COLS + n.c]; if (b >= 0 && b !== a) { sectors[a].adj.add(b); sectors[b].adj.add(a); } }); }
    V132.sig = ''; V132.oobSig = '';
    sectors.forEach(sc => { if (sc.cp) sc.cp.sector = sc; });
    V131.sig = '';
  }
  function v131Linked(team) {
    const start = sectors.find(sc => sc.hq === team), out = new Set(); if (!start) return out;
    const q = [start]; out.add(start.id);
    while (q.length) { const sc = q.shift(); sc.adj.forEach(id => { const t = sectors[id]; if (!out.has(id) && v131Owner(t) === team) { out.add(id); q.push(t); } }); }
    return out;
  }
  function v131Supplied(cp, team) { return !sectors.length || !cp.sector || v131Linked(team).has(cp.sector.id); }

  // ---------- drawing: thin borders, team territory outline, cut-off hatching ----------
  
  
  function v131Hatch(team) {
    if (V131.hatch[team]) return V131.hatch[team];
    try { const cv = document.createElement('canvas'); cv.width = cv.height = 10; const g = cv.getContext('2d'); g.strokeStyle = `rgba(${zoneRgb(team)},.32)`; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(-2, 12); g.lineTo(12, -2); g.moveTo(8, 12); g.lineTo(12, 8); g.moveTo(-2, 2); g.lineTo(2, -2); g.stroke(); V131.hatch[team] = ctx.createPattern(cv, 'repeat'); } catch (e) { V131.hatch[team] = `rgba(${zoneRgb(team)},.05)`; }
    return V131.hatch[team];
  }
  
  
  /* drawZones: layer moved to js/chains/drawZones.js */

  // ---------- vehicles: long-press turning ----------
  function v131CanTurn(u) { return !!u && u.team === currentTurn && u.hp > 0 && !u.isLoaded && v130Reverses(u) && u.remainingMove >= 1 && !actionMode; }   // v191: turning is allowed after attacking


