  // [chain:v99HexLines] 1 layer over v99HexLines__base ([17g]).
  //   Call order, outermost first: v99HexLines → v99HexLines__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v99HexLines: from [17z], calls v99HexLines__base
  function v99HexLines(info, types, c, r, lift, single) {
      if (!v137On()) return v99HexLines__base(info, types, c, r, lift, single);
      const [fx, fy] = v99Flat(c, r), V = k => v99Vert(fx, fy, k % 6), mid = k => { const a = V(k), b = V(k + 1); return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }, C = [fx, fy], con = [], out = [];
      for (let e = 0; e < 6; e++) { const n = getNeighborByEdge(c, r, e); if (n && types[info.T[n.r * COLS + n.c]]) con.push(mid(e)); }
      const seg = (a, b, n) => Array.from({ length: n + 1 }, (_, t) => [a[0] + (b[0] - a[0]) * t / n, a[1] + (b[1] - a[1]) * t / n]);
      const lift2 = pts => pts.map(p => v137P(p[0], p[1]));
      if (!con.length) {
        if (!single) return out;
        const e = Math.floor(v99h(c, r, 5) * 3), a = mid(e), b = mid(e + 3), A = [a[0] * .8 + C[0] * .2, a[1] * .8 + C[1] * .2], Bp = [b[0] * .8 + C[0] * .2, b[1] * .8 + C[1] * .2];
        out.push(lift2(seg(A, C, 3).concat(seg(C, Bp, 3).slice(1)))); return out;
      }
      if (con.length === 2) { const q = []; for (let t = 0; t <= 8; t++) { const u = t / 8, a = (1 - u) * (1 - u), b = 2 * u * (1 - u), d = u * u; q.push([con[0][0] * a + C[0] * b + con[1][0] * d, con[0][1] * a + C[1] * b + con[1][1] * d]); } out.push(lift2(q)); }
      else con.forEach(m => out.push(lift2(seg(m, C, 4))));
      return out;
    }


