  // ══════════════════════════════════════════════════════════════
  // [17=] v153 — village finishing: hedges and fences follow smooth lines · finer oaks and grass · a prop set per house ·
  //        fixes: multi-hex construction tap, unit deployment around the whole footprint
  //   · hedges / fences: chains of edges of one kind are joined through their edge midpoints, smoothed and resampled; each
  //     edge draws its own stretch of that line (state per edge as before), so no zig-zag along the hex sides
  //   · construction: a multi-hex building is placed by tapping the engineer's 2nd ring (the old "adjacent hex only" check
  //     rejected it); deployment: a new unit can appear on every empty hex next to any hex of the producing building
  //   · the villa keeps its height (visual ridge only, rules unchanged)
  // ══════════════════════════════════════════════════════════════
  const V153 = { own: new Map(), ver: -1 };
  // ---------- multi-hex helpers used by the patched click / deploy code ----------
  function v153BuildDistOk(dist) {
    const m = actionMode || ''; if (!m.startsWith('build_')) return false;
    const bt = m.slice(6); return !!(BLD[bt] && (V151.FP[bt] || 1) > 1 && dist === 2);
  }
  function v153DeployTiles(b) {
    const cells = v151Cells(b), out = [], seen = new Set(cells.map(q => q[0] + ',' + q[1]));
    cells.forEach(([c, r]) => getHexNeighbors(c, r).forEach(n => { const k = n.c + ',' + n.r; if (seen.has(k)) return; seen.add(k); out.push(n); }));
    return out;
  }
  const v153NearProd = (b, c, r) => v153DeployTiles(b).some(n => n.c === c && n.r === r);

  // ---------- hedge / fence lines ----------
  function v153Build__base() {
    V153.own = new Map(); V153.ver = EDGE_VER;
    const mid = k => { const [a, b] = v152EdgeCells(k), A = v146CellFlat(a[0], a[1]), B = v146CellFlat(b[0], b[1]); return [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2]; };
    ['hedge', 'fence'].forEach(kind => {
      const keys = []; EDGES.forEach((e, k) => { if (e.kind === kind) keys.push(k); }); if (!keys.length) return;
      const M = new Map(keys.map(k => [k, mid(k)])), used = new Set(), lim = Math.sqrt(3) * HEX_RADIUS * .62;   // neighbouring edges of one line: midpoints ≈ 0.5 hex apart
      const nbr = k => keys.filter(o => o !== k && !used.has(o) && Math.hypot(M.get(o)[0] - M.get(k)[0], M.get(o)[1] - M.get(k)[1]) < lim);
      keys.forEach(k0 => {
        if (used.has(k0)) return; used.add(k0); let chain = [k0];
        for (let dir = 0; dir < 2; dir++) { let cur = dir ? chain[chain.length - 1] : chain[0];
          for (;;) { const n = nbr(cur); if (!n.length) break; const nx = n[0]; used.add(nx); if (dir) chain.push(nx); else chain.unshift(nx); cur = nx; } }
        let pts = chain.map(k => M.get(k));
        if (pts.length === 1) { const [a, b] = v152EdgeCells(chain[0]), A = v146CellFlat(a[0], a[1]), B = v146CellFlat(b[0], b[1]), dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy), h = HEX_RADIUS * .5;
          pts = [[pts[0][0] + dy / L * h, pts[0][1] - dx / L * h], [pts[0][0] - dy / L * h, pts[0][1] + dx / L * h]]; }
        else { const a = pts[0], b = pts[1], y = pts[pts.length - 1], z = pts[pts.length - 2];      // extend half an edge at both ends
          pts = [[a[0] + (a[0] - b[0]) * .5, a[1] + (a[1] - b[1]) * .5]].concat(pts, [[y[0] + (y[0] - z[0]) * .5, y[1] + (y[1] - z[1]) * .5]]); }
        const dense = v151Dense(v151Chaikin(pts, 3), kind === 'hedge' ? 3.2 : 9);
        dense.forEach(p => { let best = chain[0], bd = 1e9; chain.forEach(k => { const m = M.get(k), d = Math.hypot(m[0] - p[0], m[1] - p[1]); if (d < bd) { bd = d; best = k; } });
          (V153.own.get(best) || V153.own.set(best, []).get(best)).push(p); });
      });
    });
  }
  function v153Owns(ed) { if (!v150Fay() || !(ed.kind === 'hedge' || ed.kind === 'fence')) return false; if (V153.ver !== EDGE_VER) v153Build(); return true; }
  { 
    /* v99Uprights: layer moved to js/chains/v99Uprights.js */ }

  // ---------- finer oaks and grass ----------
  { const o_make153 = V146M.make;
    V146M.make = function (kind, v) {
      if (kind !== 'oak' && kind !== 'tuft') return o_make153.apply(this, arguments);
      let seed = 23 + (v | 0) * 6007 + kind.length; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      const M = new TankBaker.Mesh(), m = c => M.mat(c, { noise: 1.4 });
      const sph = (x, y, z, r, mt) => M.lathe('z', [x, y, z - r], [[0, 0], [r * .2, r * .62], [r * .55, r * .94], [r, r], [r * 1.45, r * .9], [r * 1.8, r * .5], [r * 2, 0]], 12, mt);
      if (kind === 'oak') {
        const bark = m([78, 62, 48]), L = [m([58, 84, 40]), m([74, 100, 48]), m([92, 118, 56]), m([50, 72, 38])];
        M.lathe('z', [0, 0, 0], [[0, 0], [0, .3], [.4, .26], [2.4, .2], [2.6, 0]], 7, bark);
        [[.8, 0, 3.3], [-.7, .4, 3.5], [.1, -.7, 3.1]].forEach(([x, y, z]) => M.lathe('z', [x * .4, y * .4, 2.2], [[0, .1], [z - 2.2, .06]], 5, bark));
        for (let i = 0; i < 9; i++) { const a = rnd() * 6.28, d = i < 2 ? rnd() * .3 : .7 + rnd() * .8, z = 3.1 + rnd() * 1.4 + (i < 2 ? .6 : 0), r = .7 + rnd() * .45;
          sph(Math.cos(a) * d, Math.sin(a) * d, z, r, L[(i + (z > 4 ? 1 : 0) + (a > 3 ? 1 : 0)) % 4]); }
      } else {
        const G = [m([140, 164, 84]), m([168, 174, 100]), m([196, 184, 124])];   // v154: lighter
        for (let i = 0; i < 14; i++) { const a = rnd() * 6.28, d = rnd() * .5, h = .6 + rnd() * .5, lean = (rnd() - .5) * .3;
          M.lathe('z', [Math.cos(a) * d, Math.sin(a) * d, 0], [[0, 0], [0, .08], [h, .01 + Math.abs(lean) * .02]], 4, G[i % 3]); }
      }
      return M;
    }; }

  // ---------- a prop set per house (back yard): wood pile, cart or barrels; pots by the door ----------
  { 
    /* loadHistoricalMap: layer moved to js/chains/loadHistoricalMap.js */ }


