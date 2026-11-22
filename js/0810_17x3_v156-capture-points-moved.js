  // ══════════════════════════════════════════════════════════════
  // [17+3] v156 — capture points moved off the road, no cone trees outside forests (Faymonville)
  //     · (off by decision, V156.move = false) a capture point standing on a road hex moves to the best neighbouring hex
  //       (plains > field > rock > bush > rubble; fewer road neighbours, farther from houses), so the mast no longer cuts the road
  //     · cypresses (reference props, road rows, villa flanks) and pine clumps are removed; forest conifers stay
  //     · bush terrain: no tall tree any more, only low shrubs (cover rules unchanged)
  //     · the mast hex draws no ground props (rocks, shrubs, deco) under the mast
  // ══════════════════════════════════════════════════════════════
  var V156 = { on: true, move: false, noCone: true, cone: { cypress: 1, cypress2: 1, pines: 1 }, moved: [] };
  const v156On = () => V156.on && typeof v150Fay === 'function' && v150Fay();

  // ---------- capture points: off the road ----------
  function v156Relocate() {
    V156.moved = [];
    const T = (c, r) => (terrainMap[c + ',' + r] ? getTerrain(c, r).terrainType : null);
    const rank = { plains: 0, field: 1, rock: 2, bush: 3, rubble: 4 };
    const houses = []; for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (T(c, r) === 'building') houses.push([c, r]);
    capturePoints.forEach(cp => {
      if (T(cp.c, cp.r) !== 'road') return;
      let best = null, bs = 1e9;
      getHexNeighbors(cp.c, cp.r).forEach(n => {
        const t = T(n.c, n.r); if (!(t in rank) || getCapturePointAt(n.c, n.r)) return;
        const roads = getHexNeighbors(n.c, n.r).filter(m => T(m.c, m.r) === 'road').length;
        const dh = houses.reduce((m, h) => Math.min(m, getDistance(n.c, n.r, h[0], h[1])), 99);
        const s = rank[t] * 10 + roads - Math.min(dh, 4) * 1.5;
        if (s < bs) { bs = s; best = n; }
      });
      if (best) { V156.moved.push({ id: cp.id, from: [cp.c, cp.r], to: [best.c, best.r] }); cp.c = best.c; cp.r = best.r; }
    });
  }
  { 
    /* loadFaymonville: layer moved to js/chains/loadFaymonville.js */ }

  // ---------- cone trees out, nothing under a mast ----------
  function v156CpFlats() { return capturePoints.map(cp => v146CellFlat(cp.c, cp.r)); }
  { 
    /* v152ApplyDeco: layer moved to js/chains/v152ApplyDeco.js */ }
  { 
    /* v99Uprights: layer moved to js/chains/v99Uprights.js */ }


