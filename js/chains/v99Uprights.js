  // [chain:v99Uprights] 5 layers over v99Uprights__base ([17g]).
  //   Call order, outermost first: v99Uprights → v99Uprights__v156 → v99Uprights__v153 → v99Uprights__v146 → v99Uprights__v145 → v99Uprights__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v99Uprights: from [17+4], calls v99Uprights__v156
  function v99Uprights(info, c, r, q, items) { const n0 = items.length; v99Uprights__v156.apply(this, arguments); if (!v157On()) return; for (let i = n0; i < items.length; i++) if (items[i].kind === 'fence') items[i].big = true; }

  // v99Uprights__v156: from [17+3], calls v99Uprights__v153
  function v99Uprights__v156(info, c, r, q, items) {
      const n0 = items.length; v99Uprights__v153.apply(this, arguments);
      if (!v156On()) return;
      if (getCapturePointAt(c, r)) {   // clear the middle of the hex (edge hedges / fences stay)
        const keep = items.slice(n0).filter(it => !it.pts && Math.hypot(it.x - q.x, (it.y - q.y) / TILT) > HEX_RADIUS * .62 || it.kind === 'fence');
        items.length = n0; keep.forEach(it => items.push(it)); return; }
      if (info.T[r * COLS + c] === 'bush') {
        const keep = items.slice(n0).filter(it => it.kind !== 'dec' && it.kind !== 'con'); items.length = n0; keep.forEach(it => items.push(it));
        const rnd = v99rng(c, r, 156);
        for (let k = 0; k < 3; k++) { const a = rnd() * 6.283, d = Math.sqrt(rnd()) * HEX_RADIUS * .55, o = isoD(Math.cos(a) * d, Math.sin(a) * d);
          items.push({ x: q.x + o.x, y: q.y + o.y, h: 3, kind: 'bush', w: 1.5 + rnd() * 1, rs: rnd() * 1e6 | 0 }); }
      }
    }

  // v99Uprights__v153: from [17=], calls v99Uprights__v146
  function v99Uprights__v153(info, c, r, q, items) {
      v99Uprights__v146.apply(this, arguments);
      if (!v150Fay()) return;
      try {
        if (V153.ver !== EDGE_VER) v153Build();
        const rnd = v99rng(c, r, 53), P2 = p => v137On() ? v137P(p[0], p[1]) : v99Proj(p[0], p[1], 0);
        for (let e = 0; e < 3; e++) {
          const n = getNeighborByEdge(c, r, e), ed = n && getEdge(c, r, n.c, n.r); if (!ed || !(ed.kind === 'hedge' || ed.kind === 'fence')) continue;
          const pts = V153.own.get(edgeKey(c, r, n.c, n.r)); if (!pts || !pts.length) continue; const est = ed.st || 0;
          if (ed.kind === 'hedge') pts.forEach((p, k) => { if ((est === 1 && k % 2) || (est >= 2 && k % 4)) return; const s = P2(p);
            items.push({ x: s[0] + (rnd() - .5) * .7, y: s[1] + (rnd() - .5) * .4, h: 3.5, kind: 'bush', w: (2.2 + rnd() * .9) * (est >= 2 ? .5 : 1), rs: rnd() * 1e6 | 0 }); });
          else if (est < 2) { const sp = pts.map(P2); for (let i = 0; i + 1 < sp.length; i++) { if (est === 1 && i % 2) continue; const a = sp[i], b = sp[i + 1]; items.push({ x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2, h: 3, kind: 'fence', pts: [a, b] }); } }
        }
      } catch (err) { console.warn('v153 lines', err); }
    }

  // v99Uprights__v146: from [17%], calls v99Uprights__v145
  function v99Uprights__v146(info, c, r, q, items) {
      const n0 = items.length; v99Uprights__v145.apply(this, arguments);
      if (V146.on && V146.fpCells.has(c + ',' + r)) for (let i = items.length - 1; i >= n0; i--) if (items[i].kind === 'house') items.splice(i, 1);
    }

  // v99Uprights__v145: from [17#], calls v99Uprights__base
  function v99Uprights__v145(info, c, r, q, items) {
      v99Uprights__base.apply(this, arguments);
      const P = info.pal, rnd = v99rng(c, r, 41), v = getHexVertices(q.x, q.y, HEX_RADIUS);
      for (let e = 0; e < 3; e++) {
        const n = getNeighborByEdge(c, r, e), ed = n && getEdge(c, r, n.c, n.r); if (!ed) continue;
        if (typeof v153Owns === 'function' && v153Owns(ed)) continue;   // v153: hedges / fences drawn along smooth lines
        const a = [v[e].x, v[e].y], b = [v[(e + 1) % 6].x, v[(e + 1) % 6].y], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, fa = (60 * e + 90) * Math.PI / 180;
        const est = ed.st || 0;
        if (ed.kind === 'hedge') v99Sample([a, b], 1.7).forEach((s2, k) => { if ((est === 1 && k % 2) || (est >= 2 && k % 4)) return; items.push({ x: s2[0] + (rnd() - .5) * .8, y: s2[1] + (rnd() - .5) * .5, h: 3.5, kind: 'bush', w: (2.1 + rnd() * .9) * (est >= 2 ? .5 : 1), rs: rnd() * 1e6 | 0 }); });
        else if (ed.kind === 'fence') { if (est < 2) items.push({ x: mx, y: my, h: 3, kind: 'fence', pts: est ? [a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]] : [a, b] }); }
        else if (ed.kind === 'stone_wall') items.push({ x: mx, y: my, h: 3, kind: 'chunk', w: HEX_RADIUS * 1.02, hh: 2.6, fa });
        else if (ed.kind === 'sandbag_row') items.push({ x: mx, y: my, h: 2, kind: 'chunk', w: HEX_RADIUS * .95, hh: 1.4, fa });
      }
    }


