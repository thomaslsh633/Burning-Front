  // [chain:v151Pieces] 2 layers over v151Pieces__base ([v168]).
  //   Call order, outermost first: v151Pieces → v151Pieces__v152 → v151Pieces__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v151Pieces: from [17+4], calls v151Pieces__v152
  function v151Pieces() {
      const fresh = !(V151.pieces && V151.pkey === EDGE_VER), out = v151Pieces__v152.apply(this, arguments); if (!fresh || !v157On()) return out;
      const tr = V151.runs.filter(r => r.terrace); if (!tr.length) return out;
      const on = p => tr.some(run => { for (let i = 0; i + 1 < run.pts.length; i++) { const [ax, ay] = run.pts[i], [bx, by] = run.pts[i + 1], dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1;
        const t = Math.max(0, Math.min(1, ((p.fx - ax) * dx + (p.fy - ay) * dy) / L2)); if (Math.hypot(ax + dx * t - p.fx, ay + dy * t - p.fy) < 2) return true; } return false; });
      const keep = out.filter(p => !on(p)); V151.pieces = keep; return keep;   // the villa mesh draws this railing (correct occlusion)
    }

  // v151Pieces__v152: from [17_], calls v151Pieces__base
  function v151Pieces__v152() {
      const fresh = !(V151.pieces && V151.pkey === EDGE_VER), out = v151Pieces__base.apply(this, arguments); if (!fresh || !v150Fay()) return out;
      const w = Math.sqrt(3) * HEX_RADIUS, mids = [];
      V151.runs.forEach(run => run.keys.forEach(k => { if (!EDGES.has(k)) return; const [a, b] = v152EdgeCells(k), A = v146CellFlat(a[0], a[1]), B = v146CellFlat(b[0], b[1]); mids.push([(A[0] + B[0]) / 2, (A[1] + B[1]) / 2]); }));
      const keep = out.filter(p => v152RoadDist(p.fx, p.fy) > 12 && mids.some(m => Math.hypot(m[0] - p.fx, m[1] - p.fy) < w * .75));
      V151.pieces = keep; return keep;
    }


