  // [chain:loadHistoricalMap] 11 layers over loadHistoricalMap__base ([v162]).
  //   Call order, outermost first: loadHistoricalMap → loadHistoricalMap__v155 → loadHistoricalMap__v154 → loadHistoricalMap__v153 → loadHistoricalMap__v152 → loadHistoricalMap__v151 → loadHistoricalMap__v150 → loadHistoricalMap__v147 → loadHistoricalMap__v146 → loadHistoricalMap__v145 → loadHistoricalMap__v59 → loadHistoricalMap__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // loadHistoricalMap: from [17+4], calls loadHistoricalMap__v155
  function loadHistoricalMap() {
      const res = loadHistoricalMap__v155.apply(this, arguments);
      try { if (v157On()) {
        if (V157.terraceEdges) v157Terrace();
        V152.spots = V152.spots.filter(s => !s.gate).concat(v157Gates()); v152ApplyDeco();
      } } catch (err) { console.warn('v157 load', err); }
      return res;
    }

  // loadHistoricalMap__v155: from [17+2], calls loadHistoricalMap__v154
  function loadHistoricalMap__v155() {
      const res = loadHistoricalMap__v154.apply(this, arguments);
      try { if (v150Fay()) { V152.spots = V152.spots.filter(s => !s.cp).concat(v155Spots()); v152ApplyDeco(); } } catch (err) { console.warn('v155 masts', err); }
      return res;
    }

  // loadHistoricalMap__v154: from [17+1], calls loadHistoricalMap__v153
  function loadHistoricalMap__v154() { V154.polys = null; if (typeof V152 !== 'undefined') V152.roadPts = null; return loadHistoricalMap__v153.apply(this, arguments); }

  // loadHistoricalMap__v153: from [17=], calls loadHistoricalMap__v152
  function loadHistoricalMap__v153() {
      const res = loadHistoricalMap__v152.apply(this, arguments);
      try { if (v150Fay()) {
        const w = Math.sqrt(3) * HEX_RADIUS, m = w / 7, add = [];
        (V146.spots || []).forEach((sp, j) => { const Y = V152.yard[sp.kind]; if (!sp.fp || !Y || sp.kind === 'villa') return;
          const D = [-Math.sin(sp.ang), Math.cos(sp.ang)], X = [Math.cos(sp.ang), Math.sin(sp.ang)];
          const at = (sx, sy) => [sp.fx + X[0] * Y[0] * m * sx + D[0] * Y[1] * m * sy, sp.fy + X[1] * Y[0] * m * sx + D[1] * Y[1] * m * sy];
          [[.62, -.72, j % 2 ? 'pile' : 'cart', sp.ang + Math.PI / 2], [-.62, -.72, 'pile', sp.ang], [.25, .62, 'pots', sp.ang]].forEach(([sx, sy, k, a], q) => {
            const [fx, fy] = at(sx, sy); if (v152RoadDist(fx, fy) < 12) return; add.push({ kind: k, v: 40 + j * 3 + q, fx, fy, ang: a, z: sp.z || 0, deco: true }); }); });
        V152.spots = V152.spots.concat(add);
        // keep the view of each door clear: no tall trees within 2.6 hexes on the door side
        const tall = { cypress: 1, cypress2: 1, tree: 1, oak: 1, pines: 1, lamp: 1 }, houses = (V146.spots || []).filter(h => h.fp);
        const blocks = sp => tall[sp.kind] && houses.some(h => { const D = [-Math.sin(h.ang), Math.cos(h.ang)], vx = sp.fx - h.fx, vy = sp.fy - h.fy, L = Math.hypot(vx, vy); return L < w * 2.6 && (vx * D[0] + vy * D[1]) / (L || 1) > .2; });
        V152.spots = V152.spots.filter(sp => !blocks(sp)); V146.spots = (V146.spots || []).filter(sp => sp.deco || !blocks(sp));
        v152ApplyDeco(); V153.ver = -1;
      } } catch (err) { console.warn('v153 props', err); }
      return res;
    }

  // loadHistoricalMap__v152: from [17_], calls loadHistoricalMap__v151
  function loadHistoricalMap__v152() {
      V152.roadPts = null; const res = loadHistoricalMap__v151.apply(this, arguments);
      try { if (v150Fay()) { V152.walls = v152Walls(); v152ClearFronts(); V152.spots = v152Deco(); v152ApplyDeco(); } } catch (err) { console.warn('v152 load', err); }
      return res;
    }

  // loadHistoricalMap__v151: from [v168], calls loadHistoricalMap__v150
  function loadHistoricalMap__v151() { V151.runs = []; V151.runEdges = new Set(); V151.pieces = null; return loadHistoricalMap__v150.apply(this, arguments); }

  // loadHistoricalMap__v150: from [17(], calls loadHistoricalMap__v147
  function loadHistoricalMap__v150() {
      const res = loadHistoricalMap__v147.apply(this, arguments);
      try { if (V150.shade0 === undefined) V150.shade0 = V137.shade; V137.shade = v150Fay() ? V150.shade : V150.shade0;
        if (v150Fay()) { V150.cleared = v150ClearCraters(); V150.relief = v150Relief(); if (typeof v99G !== 'undefined') v99G.key = null; } }
      catch (err) { console.warn('v150 load', err); }
      return res;
    }

  // loadHistoricalMap__v147: from [17&], calls loadHistoricalMap__v146
  function loadHistoricalMap__v147() { const res = loadHistoricalMap__v146.apply(this, arguments); v147Build(); return res; }

  // loadHistoricalMap__v146: from [17%], calls loadHistoricalMap__v145
  function loadHistoricalMap__v146() { V146.spots = []; V146.fpCells = new Set(); return loadHistoricalMap__v145.apply(this, arguments); }

  // loadHistoricalMap__v145: from [17#], calls loadHistoricalMap__v59
  function loadHistoricalMap__v145() { EDGES = new Map(); EDGE_VER++; const res = loadHistoricalMap__v59.apply(this, arguments); LAYERS.lastEdges = linearCellsToEdges(); return res; }

  // loadHistoricalMap__v59: from [17c], calls loadHistoricalMap__base
  function loadHistoricalMap__v59() {
    MAP_PALETTE = {}; vm = newVm();
    if (mapSelect.value === 'faymonville') loadFaymonville(); else { loadHistoricalMap__base(); skirmishPoints(); }
    buildings.filter(b => b.type === 'hq').forEach(armHq);
    buildZoneIndex();
    v131BuildSectors();   // v131
    const eb = document.getElementById('end-turn-btn'); if (eb) eb.disabled = false;
    const sh = document.getElementById('vm-sheet'); if (sh) sh.classList.remove('open');
  }


