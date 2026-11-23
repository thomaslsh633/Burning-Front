  // [chain:v146EdgeSpots] 1 layer over v146EdgeSpots__base ([17%]).
  //   Call order, outermost first: v146EdgeSpots → v146EdgeSpots__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v146EdgeSpots: from [v168], calls v146EdgeSpots__base
  function v146EdgeSpots() {
      const base = v146EdgeSpots__base.apply(this, arguments);
      try { if (!V151.runs.length) return base;
        const own = base.filter(sp => { const k = sp.key; return true; });
        // drop the per-edge sprites of edges that belong to a run
        const keep = []; EDGES.forEach((ed, k) => { if ((ed.kind === 'low_wall' || ed.kind === 'balustrade') && !V151.runEdges.has(k)) keep.push(k); });
        const keepMid = new Set(keep.map(k => { const [a, b] = k.split('>').map(s => s.split(',').map(Number)), A = v146CellFlat(a[0], a[1]), B = v146CellFlat(b[0], b[1]); return Math.round((A[0] + B[0]) / 2) + ',' + Math.round((A[1] + B[1]) / 2); }));
        return own.filter(sp => keepMid.has(Math.round(sp.fx) + ',' + Math.round(sp.fy))).concat(v151Pieces());
      } catch (err) { console.warn('v151 runs', err); return base; }
    }


