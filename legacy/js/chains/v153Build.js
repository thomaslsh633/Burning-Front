  // [chain:v153Build] 1 layer over v153Build__base ([17=]).
  //   Call order, outermost first: v153Build → v153Build__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v153Build: from [17+4], calls v153Build__base
  function v153Build() {
      if (!v157On()) return v153Build__base.apply(this, arguments);
      V153.own = new Map(); V153.ver = EDGE_VER;
      const w = v157W(), mid = k => { const [a, b] = v152EdgeCells(k), A = v146CellFlat(a[0], a[1]), B = v146CellFlat(b[0], b[1]); return [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2]; };
      ['hedge', 'fence'].forEach(kind => {
        const keys = []; EDGES.forEach((e, k) => { if (e.kind === kind) keys.push(k); }); if (!keys.length) return;
        const M = new Map(keys.map(k => [k, mid(k)])), used = new Set(), lim = w * .62;
        const nbr = k => keys.filter(o => o !== k && !used.has(o) && Math.hypot(M.get(o)[0] - M.get(k)[0], M.get(o)[1] - M.get(k)[1]) < lim);
        keys.forEach(k0 => {
          if (used.has(k0)) return; used.add(k0); const chain = [k0];
          for (let dir = 0; dir < 2; dir++) { let cur = dir ? chain[chain.length - 1] : chain[0];
            for (;;) { const n = nbr(cur); if (!n.length) break; const nx = n[0]; used.add(nx); if (dir) chain.push(nx); else chain.unshift(nx); cur = nx; } }
          let pts = chain.map(k => M.get(k));
          if (pts.length === 1) { const [a, b] = v152EdgeCells(chain[0]), A = v146CellFlat(a[0], a[1]), B = v146CellFlat(b[0], b[1]), dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy), h = HEX_RADIUS * .5;
            pts = [[pts[0][0] + dy / L * h, pts[0][1] - dx / L * h], [pts[0][0] - dy / L * h, pts[0][1] + dx / L * h]]; }
          else {
            pts = v157DP(pts, w * .3);
            const a = pts[0], b = pts[1], y = pts[pts.length - 1], z = pts[pts.length - 2], ab = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, yz = Math.hypot(y[0] - z[0], y[1] - z[1]) || 1, ext = w * .25;
            pts = [[a[0] + (a[0] - b[0]) / ab * ext, a[1] + (a[1] - b[1]) / ab * ext]].concat(pts.slice(1, -1), [[y[0] + (y[0] - z[0]) / yz * ext, y[1] + (y[1] - z[1]) / yz * ext]]);
          }
          const dense = v151Dense(pts, kind === 'hedge' ? 3.2 : 9.5);
          const owner = dense.map(p => { let best = chain[0], bd = 1e9; chain.forEach(k => { const m = M.get(k), d = Math.hypot(m[0] - p[0], m[1] - p[1]); if (d < bd) { bd = d; best = k; } }); return best; });
          if (kind === 'hedge') dense.forEach((p, i) => (V153.own.get(owner[i]) || V153.own.set(owner[i], []).get(owner[i])).push(p));
          else dense.forEach((p, i) => {   // fences: each edge owns a contiguous stretch including the next post, so the rails never break between edges
            const o = owner[i], L = V153.own.get(o) || V153.own.set(o, []).get(o); if (!L.length || L[L.length - 1] !== dense[i - 1]) { if (i > 0 && owner[i - 1] !== o) L.push(dense[i - 1]); } L.push(p);
            if (i + 1 < dense.length && owner[i + 1] !== o) L.push(dense[i + 1]); });
        });
      });
    }


