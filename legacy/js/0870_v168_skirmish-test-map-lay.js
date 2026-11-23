  // [v168] skirmish test map: lay the base buildings out on their true-scale footprints (no overlaps, a lane between them)
  function v168LayoutBase(tm) {
    const own = buildings.filter(b => b.team === tm && BLD[b.type]); if (!own.length) return;
    const hq = own.find(b => b.type === 'hq') || own[0], foe = buildings.find(b => b.type === 'hq' && b.team !== tm) || hq;
    const taken = new Set(), near = new Set();
    buildings.forEach(b => { if (b.team !== tm || !BLD[b.type]) v151Cells(b).forEach(([c, r]) => taken.add(c + ',' + r)); });
    const okCell = (c, r, gap) => c >= 0 && r >= 0 && c < COLS && r < ROWS && !taken.has(c + ',' + r) && (!gap || !near.has(c + ',' + r))
      && !['road', 'deep_water', 'shallow_water', 'building', 'forest'].includes(getTerrain(c, r).terrainType)
      && !getCapturePointAt(c, r) && !bunkers.some(k => k.c === c && k.r === r) && !mines.some(k => k.c === c && k.r === r);
    const shapeAt = (c, r, n, gap) => {
      if (!okCell(c, r, gap)) return null; if (n <= 1) return [[c, r]];
      for (let e = 0; e < 6; e++) {
        const a = getNeighborByEdge(c, r, e); if (!a || !okCell(a.c, a.r, gap)) continue;
        if (n === 2) return [[c, r], [a.c, a.r]];
        const b = getNeighborByEdge(c, r, (e + 1) % 6); if (b && okCell(b.c, b.r, gap)) return [[c, r], [a.c, a.r], [b.c, b.r]];
      }
      return null;
    };
    const order = [hq, ...own.filter(b => b !== hq).sort((a, b) => v151Need(b) - v151Need(a))];
    order.forEach((b, i) => {
      const n = b.type === 'hq' ? 3 : v151Need(b), cand = [];
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const dh = i ? getDistance(hq.c, hq.r, c, r) : 0, df = getDistance(foe.c, foe.r, c, r);
        if (i && (dh > 6 || df < getDistance(foe.c, foe.r, hq.c, hq.r) - 3)) continue;
        cand.push({ c, r, s: (i ? dh * 3 : getDistance(hq.c, hq.r, c, r) * 5) - df * .5 });
      }
      cand.sort((a, b) => a.s - b.s);
      let cells = null;
      for (const gap of [true, false]) { for (const q of cand) { cells = shapeAt(q.c, q.r, n, gap); if (cells) break; } if (cells) break; }
      if (!cells) cells = [[b.c, b.r]];
      b.c = cells[0][0]; b.r = cells[0][1]; v151SetFootprint(b, cells);
      cells.forEach(([c, r]) => { taken.add(c + ',' + r); getHexNeighbors(c, r).forEach(h => near.add(h.c + ',' + h.r)); const t = getTerrain(c, r); if (t.terrainType !== 'plains') setTerrain(c, r, 'plains', t.elevation || 0, 'none', TERRAIN_DEFS.plains.name, TERRAIN_DEFS.plains.code, 0); });
    });
  }
  // Faymonville houses keep their real size on the 70 % map: a house whose footprint lands on or next to a capture point's
  //   flag hex (or on another house) is pushed away from it in small steps until it is clear (once, at start-up)
  (function v168Houses() {
    const I = (x, y) => { const r = Math.round(FS.r0 + (y - 15) * FS.ky); return [Math.round(FS.c0 + (x - 120) * FS.kx - (r % 2) * .5), r]; };
    const SH = { 1: [[0, 0]], 2: [[0, 0], [1, 0]], 3: [[0, 0], [1, 0], [0, 1]], 6: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]] };
    const cellsOf = (x, y, n) => { const [c, r] = I(x, y); return (SH[n] || SH[1]).map(([dc, dr]) => [c + dc, r + dr]); };
    const cores = FAY2.points.map(p => ({ x: p.x, y: p.y, cell: I(p.x, p.y), need: p.cls === 'vp' ? 2 : 2 }));
    const placed = [];
    FAY2.houses.forEach(h => { if (h[3] === 'boathouse') { h[0] = 500; h[1] = 925; } });   // the shrunken lake shore
    FAY2.houses = FAY2.houses.map(h => {
      let [x, y, n] = h; const x0 = x, y0 = y;
      for (let it = 0; it < 40; it++) {
        const cs = cellsOf(x, y, n);
        const hitP = cores.find(p => cs.some(([c, r]) => getDistance(c, r, p.cell[0], p.cell[1]) < (n > 1 ? p.need : 1)));   // a 1-hex shed may stand next to a flag
        const hitH = placed.find(q => q.cells.some(a => cs.some(b => getDistance(a[0], a[1], b[0], b[1]) < 2)));
        if (!hitP && !hitH) break;
        const from = hitP ? [hitP.x, hitP.y] : [hitH.x, hitH.y];
        let dx = x - from[0], dy = y - from[1]; const L = Math.hypot(dx, dy) || 1; if (L < 1) { dx = x0 - 500; dy = y0 - 500; }
        x += dx / (Math.hypot(dx, dy) || 1) * 8; y += dy / (Math.hypot(dx, dy) || 1) * 8;
      }
      placed.push({ x, y, cells: cellsOf(x, y, n) });
      return [Math.round(x), Math.round(y), n, h[3]];
    });
  })();
  // Faymonville: HQs a little inside the shrunken outline, then laid out on their 3-hex footprint
  FAY2.hq = { blue: [178, 500], red: [842, 556] };
  {  /* loadFaymonville: layer moved to js/chains/loadFaymonville.js */ }
  {  /* skirmishPoints: layer moved to js/chains/skirmishPoints.js */ }

