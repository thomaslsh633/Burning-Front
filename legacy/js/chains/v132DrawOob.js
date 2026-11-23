  // [chain:v132DrawOob] 1 layer; the original in [17u] and older layers were dead code and are removed.
  //   Call order, outermost first: v132DrawOob
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v132DrawOob: from [v170], does NOT call the layer below
  function v132DrawOob() {
    if (!sectors.length || !v132P2D) return;
    const G = v135Geo(), f1 = G.fills.get(-2), f2 = G.fills.get(-5), px = 1 / zoom;
    if (!f1 && !f2) return;
    const wp = typeof v136WaterPath === 'function' ? v136WaterPath() : null;
    ctx.save();
    if (wp) { const big = new Path2D(); big.rect(-1e5, -1e5, 2e5, 2e5); big.addPath(wp); ctx.clip(big, 'evenodd'); }   // keep rivers / lakes untouched
    ctx.fillStyle = 'rgba(10,14,10,' + V170.tint + ')';
    if (f1) ctx.fill(f1, 'evenodd'); if (f2) ctx.fill(f2, 'evenodd');
    ctx.restore();
    // border: out-of-bounds land against the combat area (rivers keep their natural shoreline; no line across the bridge)
    if (!G._v171) {
      const wid = Math.hypot(getHexCenter(1, 0).x - getHexCenter(0, 0).x, getHexCenter(1, 0).y - getHexCenter(0, 0).y), tol = 2.3 * wid;
      const br = []; for (const k in terrainMap) { if (terrainMap[k].bridge) { const [c, r] = k.split(',').map(Number); br.push(getHexCenter(c, r)); } }
      const near = (x, y) => br.some(q => Math.hypot(q.x - x, q.y - y) < tol), segs = [];
      G.runs.filter(rn => rn.id === -2 && (rn.nb >= 0 || rn.nb === -4)).forEach(rn => {
        let cur = null;
        for (let i = 0; i + 1 < rn.pts.length; i++) {
          const A = rn.pts[i], B = rn.pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(B.x - A.x, B.y - A.y) / (wid * .4)));
          for (let k = 0; k < n; k++) {
            const x0 = A.x + (B.x - A.x) * k / n, y0 = A.y + (B.y - A.y) * k / n, x1 = A.x + (B.x - A.x) * (k + 1) / n, y1 = A.y + (B.y - A.y) * (k + 1) / n;
            if (br.length && near((x0 + x1) / 2, (y0 + y1) / 2)) { cur = null; continue; }
            if (!cur) segs.push(cur = [[x0, y0]]); cur.push([x1, y1]);
          }
        }
      });
      G._v171 = segs;
    }
    const segs = G._v171; if (!segs.length) return;
    const draw = (col, w) => { ctx.beginPath(); segs.forEach(sg => sg.forEach((q, k) => k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.strokeStyle = col; ctx.lineWidth = w * px; ctx.stroke(); };
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    draw('rgba(190,192,190,.12)', 7); draw('rgba(196,198,196,.24)', 3.2); draw('rgba(212,213,212,' + V170.line + ')', 1.4);
    ctx.restore();
  }


