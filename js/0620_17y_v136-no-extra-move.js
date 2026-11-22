  // ══════════════════════════════════════════════════════════════
  // [17y] v136 — no extra move cost uphill · water from vector shapes (smooth banks, teal water, foam, wet pebble band) ·
  //              softer terrain edges
  //   · a map may publish V136.water = { map, cols, at(fx, fy) → _d (signed distance, flat units), _a (flow angle) }; the ground
  //     painter then draws water from the signed distance to those shapes instead of from the hexes, so the banks follow the
  //     river's curve. Rules still read the hexes (a water hex stays impassable).
  //   · terrain edges: the colour is the average of the hex under the pixel and three jittered neighbours (±7 units) on top of the
  //     existing domain warp, so borders fade over a short distance instead of switching per hex
  // ══════════════════════════════════════════════════════════════
  var V136 = { water: null };
  function v136Water() {
    const W = V136.water; if (!W || W.map !== (typeof mapSelect !== 'undefined' ? mapSelect.value : '') || W.cols !== COLS) return null;
    return W;
  }
  const V136_WCOL = { sh: [84, 124, 120], dp: [32, 64, 80], fo: [222, 228, 222], bank: [100, 94, 80], depth: 52, foam: 5, band: 14 };
  // Faymonville water in reference-map pixels: river polyline with a half width per vertex, lake as a half ellipse on the south edge
  const FAY_W = { river: [[0, 290, 46], [150, 250, 46], [280, 190, 44], [380, 120, 40], [460, 62, 30], [540, 40, 24], [610, 50, 24], [700, 105, 30], [820, 160, 40], [1000, 210, 46]],
    lake: [512, 1004, 130, 64] };
  function fayWaterImg(x, y, out) {
    const S = FAY_W.river; let best = 1e9, ang = 99;
    for (let i = 0; i + 1 < S.length; i++) {
      const a = S[i], b = S[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy)));
      const d = Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy) - (a[2] + (b[2] - a[2]) * t); if (d < best) { best = d; ang = Math.atan2(dy, dx); }
    }
    const L = FAY_W.lake, ex = (x - L[0]) / L[2], ey = (y - L[1]) / L[3], k = Math.hypot(ex, ey), dl = (k - 1) * L[3]; if (dl < best) { best = dl; ang = 99; }
    out.d = best; out.a = ang; return out;
  }
  { 
    /* loadFaymonville: layer moved to js/chains/loadFaymonville.js */ }
  // out-of-bounds hatch: forest only — clipped off the water (river outline + lake ellipse), so the hatch stops at the shore
  function v136WaterPath() {
    const W = v136Water(); if (!W || !v132P2D) return null; const hv = typeof V137 !== 'undefined' ? V137.ver : 0; if (W.path && W.pathV === hv) return W.path; W.pathV = hv; const wl = typeof v137On === 'function' && v137On() ? .45 * LIFT * HZ : 0;
    const w = Math.sqrt(3) * HEX_RADIUS, R = HEX_RADIUS, scr = (x, y) => { const fx = ORIGIN_X + (FS.c0 + (x - 120) * FS.kx) * w, fy = ORIGIN_Y + (FS.r0 + (y - 15) * FS.ky) * 1.5 * R; return [fx * COSA - fy * SINA + OFFX, (fx * SINA + fy * COSA) * TILT + OFFY + wl]; };
    const S = FAY_W.river, L = [], Rt = [];
    for (let i = 0; i + 1 < S.length; i++) { const a = S[i], b = S[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(len / 12)), nx = -(b[1] - a[1]) / len, ny = (b[0] - a[0]) / len;
      for (let k = 0; k <= n; k++) { const t = k / n, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t, hw = a[2] + (b[2] - a[2]) * t; L.push(scr(x + nx * hw, y + ny * hw)); Rt.push(scr(x - nx * hw, y - ny * hw)); } }
    const p = new Path2D(); L.concat(Rt.reverse()).forEach((q, k) => k ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); p.closePath();
    const E = FAY_W.lake; for (let k = 0; k <= 48; k++) { const a = k / 48 * Math.PI * 2, q = scr(E[0] + Math.cos(a) * E[2], E[1] + Math.sin(a) * E[3]); k ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1]); } p.closePath();
    return (W.path = p);
  }
  { 
    /* v132DrawOob: layer moved to js/chains/v132DrawOob.js */ }
  /* v99Paint: layer moved to js/chains/v99Paint.js */

