  // ══════════════════════════════════════════════════════════════
  // [17g] v99 — realistic map pass
  //   · painted ground: one cached world canvas per map — organic terrain borders (domain-warped hex lookup), per-type
  //     surface texture, relief shading, roads, trees, hedges, fences, trenches, craters, rubble, rocks, stone houses,
  //     plateau cliffs with cast shadows. Repainted locally when a hex changes type.
  //   · soft fog of war (blurred mask, desaturate + darken) instead of per-hex dark plates
  //   · game overlays kept but de-hexed: merged move/attack regions, smooth territory and zone lines on the ground,
  //     ellipse selection rings, soft smoke clouds, fire glow
  //   · structures as 2.5D models (HQ, depots, tents, pillboxes) with national flags; no team rims on unit sprites
  // ══════════════════════════════════════════════════════════════
  var V99 = { on: true, fogA: .6, maxPx: 6.8e6 };   // v109: 5.6e6 → 6.8e6 (taller 55° world, closer zoom; ~8e6 hits a raster-cache cliff: 25 ms frames)
  const v99G = { cv: null, gs: 2, key: '', tsig: null, info: null, fog: null, fogGrey: null, fogSig: '', ver: 0, cidx: null, cidxVer: -1, loops: null };

  // ---------- value noise + hashes ----------
  const v99N = (() => {
    const P = new Uint16Array(512), R = new Float32Array(256); let s = 0x2f6b1d;
    const rnd = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1000003) / 1000003; };
    for (let i = 0; i < 256; i++) { P[i] = i; R[i] = rnd(); }
    for (let i = 255; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)), t = P[i]; P[i] = P[j]; P[j] = t; }
    for (let i = 0; i < 256; i++) P[i + 256] = P[i];
    return (x, y) => {
      const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, X = xi & 255, Y = yi & 255;
      const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      const a = R[P[P[X] + Y]], b = R[P[P[X + 1] + Y]], c = R[P[P[X] + Y + 1]], d = R[P[P[X + 1] + Y + 1]];
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    };
  })();
  const v99h = (a, b, k) => { let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(k | 0, 1274126177)) | 0; h = Math.imul(h ^ (h >>> 13), 1103515245); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
  const v99rng = (a, b, k) => { let i = 0; return () => v99h(a, b, k * 131 + (i++)); };
  const v99rgb = (c, k = 1, a) => { const f = v => Math.max(0, Math.min(255, Math.round(v * k))); return a === undefined ? `rgb(${f(c[0])},${f(c[1])},${f(c[2])})` : `rgba(${f(c[0])},${f(c[1])},${f(c[2])},${a})`; };
  const v99mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  // light: from the upper left and slightly toward the viewer (same as the baked vehicle / soldier sprites)
  const V99L = [-.62 * COSA + .26 * SINA, .62 * SINA + .26 * COSA, .74], V99V = [SINA, COSA, TILT / HZ];
  const v99Sh = h => [-V99L[0] / V99L[2] * h, -V99L[1] / V99L[2] * h];        // flat-space shadow offset of a point at height h
  const v99Proj = (fx, fy, h) => [fx * COSA - fy * SINA + OFFX, (fx * SINA + fy * COSA) * TILT + OFFY - h * HZ];

  // ---------- palettes (winter = Langres, summer = the test maps) ----------
  const V99PAL = {
    winter: {
      g: { plains: [203, 210, 214], field: [192, 197, 194], snow: [229, 235, 239], forest: [158, 166, 166], bush: [186, 193, 192], hedge: [182, 189, 188], fence: null,
        cobblestone: [150, 151, 154], ice: [184, 210, 222], shallow_water: [80, 121, 141], deep_water: [31, 60, 86], desert: [214, 210, 200], dune: [206, 200, 188] },
      tint: { crater: [[112, 100, 86], .3], rubble: [[122, 119, 114], .3], rock: [[160, 164, 168], .12], building: [[156, 152, 146], .3], trench: [[140, 128, 112], .2] },
      soil: [112, 101, 86], grass: [150, 152, 138], road: [132, 122, 108], roadEdge: [92, 86, 78], rut: [96, 86, 74], roadMid: [196, 200, 202],
      cliff: [128, 124, 118], rim: 'rgba(245,248,250,.75)', shade: [22, 38, 58], shA: .26,
      conLit: [46, 70, 52], conDark: [24, 42, 34], decLit: [104, 92, 80], leaf: null, bush: [64, 74, 58], snow: true,
      wall: [[176, 168, 152], [158, 148, 132], [188, 182, 170]], roof: [[224, 230, 234], [214, 221, 227]], wood: [96, 80, 64], stone: [132, 130, 126], dirt: [124, 110, 92] },
    summer: {
      g: { plains: [88, 106, 64], field: [120, 122, 74], snow: [219, 231, 239], forest: [50, 66, 40], bush: [74, 98, 58], hedge: [66, 90, 54], fence: null,
        cobblestone: [112, 112, 114], ice: [158, 196, 213], shallow_water: [62, 106, 120], deep_water: [26, 52, 74], desert: [201, 159, 94], dune: [184, 137, 66] },
      tint: { crater: [[74, 60, 44], .4], rubble: [[100, 98, 92], .4], rock: [[110, 112, 106], .2], building: [[118, 108, 88], .35], trench: [[96, 82, 60], .3] },
      soil: [104, 86, 60], grass: [128, 122, 72], road: [150, 128, 90], roadEdge: [104, 92, 68], rut: [110, 92, 64], roadMid: [168, 148, 106],
      cliff: [112, 104, 90], rim: 'rgba(200,214,160,.55)', shade: [0, 0, 0], shA: .3,
      conLit: [56, 82, 48], conDark: [30, 48, 30], decLit: [84, 112, 60], leaf: [52, 74, 40], bush: [62, 86, 48], snow: false,
      wall: [[198, 188, 166], [164, 152, 134], [182, 172, 154]], roof: [[132, 68, 52], [92, 94, 100]], wood: [104, 84, 62], stone: [118, 116, 110], dirt: [112, 96, 70] }
  };
  const V99TEX = { plains: 0, bush: 0, hedge: 0, field: 1, cobblestone: 2, deep_water: 3, shallow_water: 4, ice: 5, forest: 6, snow: 7, desert: 8, dune: 8 };
  const V99TXA = [.16, .1, .05, .05, .07, .06, .16, .04, .08, .12];
  const V99REL = { deep_water: -1.7, shallow_water: -1.05, ice: -.55, cobblestone: -.12, forest: .18 };
  const V99NAT = { plains: 1, field: 1, snow: 1, bush: 1, desert: 1, dune: 1 };
  const v99Biome = () => (typeof v100Theme === 'function' && typeof V100 !== 'undefined' && V100) ? v100Theme().biome : (false ? 'winter' : 'summer');   // v100: from the map theme

  // ---------- per-hex info ----------
  function v99Info__base() {
    const N = COLS * ROWS, pal = V99PAL[v99Biome()], T = new Array(N), E = new Int8Array(N), C = new Float32Array(N * 3), X = new Uint8Array(N), H = new Float32Array(N);
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const i = r * COLS + c, t = terrainMap[c + ',' + r]; T[i] = t ? t.terrainType : 'plains'; E[i] = t ? (t.elevation | 0) : 0; }
    let maxE = 0; const wide = new Uint8Array(N), isR = i => T[i] === 'road' || T[i] === 'cobblestone';
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (T[r * COLS + c] === 'road') for (let e = 0; e < 6; e++) {   // road hex touching two adjacent road hexes = part of a wide track
      const a = getNeighborByEdge(c, r, e), b = getNeighborByEdge(c, r, (e + 1) % 6); if (a && b && isR(a.r * COLS + a.c) && isR(b.r * COLS + b.c)) { wide[r * COLS + c] = 1; break; } }
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c, t = T[i]; let base = pal.g[t], tx = V99TEX[t];
      if (!base) {   // props, roads, buildings: natural ground of the neighbours underneath
        const cnt = {}; getHexNeighbors(c, r).forEach(n => { const q = T[n.r * COLS + n.c]; if (V99NAT[q]) cnt[q] = (cnt[q] || 0) + 1; });
        let g = 'plains', best = 0; for (const k in cnt) if (cnt[k] > best) { best = cnt[k]; g = k; }
        base = pal.g[g]; tx = V99TEX[g];
      }
      const tint = pal.tint[t]; let rgb = tint ? v99mix(base, tint[0], tint[1]) : base;
      if (wide[i]) { rgb = v99mix(base, pal.road, .52); tx = 9; }
      C[i * 3] = rgb[0]; C[i * 3 + 1] = rgb[1]; C[i * 3 + 2] = rgb[2]; X[i] = tx || 0; H[i] = V99REL[t] || 0; maxE = Math.max(maxE, E[i]);
    }
    return { N, pal, T, E, C, X, H, wide, maxE, winter: v99Biome() === 'winter' };
  }
  const v99Flat = (c, r) => { const w = Math.sqrt(3) * HEX_RADIUS; return [ORIGIN_X + c * w + (r % 2) * w / 2, ORIGIN_Y + r * 1.5 * HEX_RADIUS]; };
  const v99Vert = (fx, fy, e, R = HEX_RADIUS) => { const a = (Math.PI / 180) * (60 * e - 30); return [fx + R * Math.cos(a), fy + R * Math.sin(a)]; };

  // ---------- per-pixel ground (one layer = one elevation level) ----------
  /* v99Paint: original body removed — replaced by a later layer (js/chains/v99Paint.js) */

  // ---------- boundary loops of a hex set (flat coords, Chaikin-smoothed; points carry a height) ----------
  function v99Edges(pred, liftOf) {
    const segs = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (!pred(c, r)) continue; const [fx, fy] = v99Flat(c, r), h = liftOf ? liftOf(c, r) : 0;
      for (let e = 0; e < 6; e++) { const n = getNeighborByEdge(c, r, e); if (n && pred(n.c, n.r)) continue; segs.push({ a: v99Vert(fx, fy, e), b: v99Vert(fx, fy, e + 1), h, c, r, e, edge: !n }); }
    }
    return segs;
  }
  function v99Chain(segs) {   // → [{ pts:[[x,y,h]], closed }]
    const K = p => Math.round(p[0] * 4) + ',' + Math.round(p[1] * 4), from = new Map(), used = new Set(), out = [];
    segs.forEach((s, i) => { const k = K(s.a); (from.get(k) || from.set(k, []).get(k)).push(i); });
    const hasIn = new Set(segs.map(s => K(s.b)));
    const run = i0 => {
      const pts = [[...segs[i0].a, segs[i0].h]]; let i = i0, closed = false;
      while (true) {
        used.add(i); const s = segs[i]; pts.push([...s.b, s.h]);
        const nx = (from.get(K(s.b)) || []).find(j => !used.has(j));
        if (nx === undefined) { closed = K(s.b) === K(segs[i0].a); break; }
        i = nx;
      }
      if (closed) pts.pop();
      out.push({ pts, closed });
    };
    segs.forEach((s, i) => { if (!used.has(i) && !hasIn.has(K(s.a))) run(i); });   // open chains first (start where nothing ends)
    segs.forEach((s, i) => { if (!used.has(i)) run(i); });
    return out;
  }
  function v99Chaikin(pts, closed, it = 3) {
    for (let n = 0; n < it; n++) {
      const o = [], m = pts.length; if (m < 3) return pts;
      if (!closed) o.push(pts[0]);
      for (let i = 0; i < (closed ? m : m - 1); i++) {
        const a = pts[i], b = pts[(i + 1) % m];
        o.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25, a[2] * .75 + b[2] * .25], [a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75, a[2] * .25 + b[2] * .75]);
      }
      if (!closed) o.push(pts[m - 1]);
      pts = o;
    }
    return pts;
  }
  function v99Lap(pts, closed, it) {
    const m = pts.length; if (m < 3) return pts;
    const area = q => { let a = 0; for (let i = 0; i < q.length; i++) { const p = q[i], n = q[(i + 1) % q.length]; a += p[0] * n[1] - n[0] * p[1]; } return a / 2; }, a0 = closed ? area(pts) : 0;
    for (let n = 0; n < it; n++) pts = pts.map((p, i) => { if (!closed && (i === 0 || i === m - 1)) return p; const a = pts[(i - 1 + m) % m], b = pts[(i + 1) % m]; return [(a[0] + 2 * p[0] + b[0]) / 4, (a[1] + 2 * p[1] + b[1]) / 4, (a[2] + 2 * p[2] + b[2]) / 4]; });
    if (closed && a0) { const a1 = area(pts), k = Math.sqrt(Math.abs(a0 / (a1 || a0))); let cx = 0, cy = 0; pts.forEach(p => { cx += p[0]; cy += p[1]; }); cx /= m; cy /= m; pts = pts.map(p => [cx + (p[0] - cx) * k, cy + (p[1] - cy) * k, p[2]]); }
    return pts;
  }
  const v99Scr = pts => pts.map(p => v99Proj(p[0], p[1], p[2]));
  function v99PathOn(g, sp, closed) { g.moveTo(sp[0][0], sp[0][1]); for (let i = 1; i < sp.length; i++) g.lineTo(sp[i][0], sp[i][1]); if (closed) g.closePath(); }
  function v99Inside(sp, x, y) { let ins = false; for (let i = 0, j = sp.length - 1; i < sp.length; j = i++) { const a = sp[i], b = sp[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) ins = !ins; } return ins; }

  // ---------- 2.5D solids (convex, back-face culled, lit like the sprites) ----------
  function v99Solid(g, x, y, fa, faces, col, edge = .32) {
    const c = Math.cos(fa), s = Math.sin(fa); let mx = 0, my = 0, mz = 0, n = 0;
    faces.forEach(f => f.forEach(p => { mx += p[0]; my += p[1]; mz += p[2]; n++; })); mx /= n; my /= n; mz /= n;
    const out = [];
    faces.forEach((f, k) => {
      const a = f[0], b = f[1], d = f[f.length - 1];
      let nx = (b[1] - a[1]) * (d[2] - a[2]) - (b[2] - a[2]) * (d[1] - a[1]), ny = (b[2] - a[2]) * (d[0] - a[0]) - (b[0] - a[0]) * (d[2] - a[2]), nz = (b[0] - a[0]) * (d[1] - a[1]) - (b[1] - a[1]) * (d[0] - a[0]);
      let cx = 0, cy = 0, cz = 0; f.forEach(p => { cx += p[0]; cy += p[1]; cz += p[2]; }); cx /= f.length; cy /= f.length; cz /= f.length;
      if (nx * (cx - mx) + ny * (cy - my) + nz * (cz - mz) < 0) { nx = -nx; ny = -ny; nz = -nz; }
      const l = Math.hypot(nx, ny, nz); if (!l) return; nx /= l; ny /= l; nz /= l;
      const wx = nx * c - ny * s, wy = nx * s + ny * c;
      if (wx * V99V[0] + wy * V99V[1] + nz * V99V[2] <= .002) return;
      const lam = Math.max(0, wx * V99L[0] + wy * V99L[1] + nz * V99L[2]);
      out.push({ f, k, sh: .56 + .5 * lam, dep: (cx * c - cy * s) * V99V[0] + (cx * s + cy * c) * V99V[1] + cz * V99V[2] });
    });
    out.sort((p, q) => p.dep - q.dep);
    out.forEach(o => {
      const cc = Array.isArray(col[0]) ? col[o.k] || col[0] : col;
      g.beginPath(); o.f.forEach((p, i) => { const fx = p[0] * c - p[1] * s, fy = p[0] * s + p[1] * c, X = x + fx * COSA - fy * SINA, Y = y + (fx * SINA + fy * COSA) * TILT - p[2] * HZ; i ? g.lineTo(X, Y) : g.moveTo(X, Y); });
      g.closePath(); g.fillStyle = v99rgb(cc, o.sh); g.fill();
      if (edge) { g.strokeStyle = `rgba(16,14,12,${edge})`; g.lineWidth = .3; g.stroke(); }
    });
    return out;
  }
  const v99Box = (a0, a1, b0, b1, h0, h1) => [
    [[a0, b0, h1], [a1, b0, h1], [a1, b1, h1], [a0, b1, h1]], [[a0, b0, h0], [a1, b0, h0], [a1, b0, h1], [a0, b0, h1]], [[a1, b1, h0], [a0, b1, h0], [a0, b1, h1], [a1, b1, h1]],
    [[a1, b0, h0], [a1, b1, h0], [a1, b1, h1], [a1, b0, h1]], [[a0, b1, h0], [a0, b0, h0], [a0, b0, h1], [a0, b1, h1]]];
  const v99Gable = (L, W, H, RH) => { const a = L / 2, b = W / 2; return [
    [[-a, -b, 0], [a, -b, 0], [a, -b, H], [-a, -b, H]], [[a, b, 0], [-a, b, 0], [-a, b, H], [a, b, H]],
    [[a, -b, 0], [a, b, 0], [a, b, H], [a, 0, H + RH], [a, -b, H]], [[-a, b, 0], [-a, -b, 0], [-a, -b, H], [-a, 0, H + RH], [-a, b, H]],
    [[-a, -b, H], [a, -b, H], [a, 0, H + RH], [-a, 0, H + RH]], [[a, b, H], [-a, b, H], [-a, 0, H + RH], [a, 0, H + RH]]]; };
  const v99Prism = (poly, h0, h1, k = 1) => { const f = [poly.map(p => [p[0] * k, p[1] * k, h1])]; poly.forEach((p, i) => { const q = poly[(i + 1) % poly.length]; f.push([[p[0], p[1], h0], [q[0], q[1], h0], [q[0] * k, q[1] * k, h1], [p[0] * k, p[1] * k, h1]]); }); return f; };
  function v99Quad(g, x, y, fa, pts, nrm, fill) {   // decal on a face: drawn only if its normal faces the camera
    const c = Math.cos(fa), s = Math.sin(fa), wx = nrm[0] * c - nrm[1] * s, wy = nrm[0] * s + nrm[1] * c;
    if (wx * V99V[0] + wy * V99V[1] + nrm[2] * V99V[2] <= .01) return false;
    g.beginPath(); pts.forEach((p, i) => { const fx = p[0] * c - p[1] * s, fy = p[0] * s + p[1] * c, X = x + fx * COSA - fy * SINA, Y = y + (fx * SINA + fy * COSA) * TILT - p[2] * HZ; i ? g.lineTo(X, Y) : g.moveTo(X, Y); });
    g.closePath(); g.fillStyle = fill; g.fill(); return true;
  }
  function v99CastShadow(g, x, y, fa, pts, alpha, rgb = [0, 0, 0]) {   // convex hull of the footprint + the shadows of the given 3D points
    const c = Math.cos(fa), s = Math.sin(fa), P = [];
    pts.forEach(p => { const fx = p[0] * c - p[1] * s, fy = p[0] * s + p[1] * c, sh = v99Sh(p[2]); [[fx, fy], [fx + sh[0], fy + sh[1]]].forEach(([a, b]) => P.push([x + a * COSA - b * SINA, y + (a * SINA + b * COSA) * TILT])); });
    P.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
    P.forEach(p => { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); });
    for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    const hull = lo.slice(0, -1).concat(up.slice(0, -1));
    g.beginPath(); hull.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fillStyle = v99rgb(rgb, 1, alpha); g.fill();
  }

  // ---------- props (drawn into the ground canvas in world coords) ----------
  function v99Conifer__base(g, x, y, h, w, P) {
    g.fillStyle = '#4a3b2e'; g.fillRect(x - .45, y - 2.4, .9, 2.6);
    for (let t = 0; t < 3; t++) {
      const yb = y - 1.6 - t * h * .23, yt = yb - h * .44, ww = w * (1 - t * .25);
      g.beginPath(); g.moveTo(x, yt); g.lineTo(x - ww, yb); g.quadraticCurveTo(x - ww * .35, yb + 1.1, x, yb + .8); g.closePath(); g.fillStyle = v99rgb(P.conLit); g.fill();
      g.beginPath(); g.moveTo(x, yt); g.lineTo(x + ww, yb); g.quadraticCurveTo(x + ww * .35, yb + 1.1, x, yb + .8); g.closePath(); g.fillStyle = v99rgb(P.conDark); g.fill();
      if (P.snow) {
        g.beginPath(); g.moveTo(x, yt + .2); g.lineTo(x - ww * .78, yb - .5); g.quadraticCurveTo(x - ww * .4, yb - .2, x - ww * .15, yb - (yb - yt) * .3); g.lineTo(x + ww * .25, yt + (yb - yt) * .45); g.closePath();
        g.fillStyle = 'rgba(236,241,244,.92)'; g.fill();
      }
    }
  }
  function v99Decid__base(g, x, y, h, w, P, rnd) {
    if (!P.leaf) {   // winter: bare crown
      g.strokeStyle = v99rgb(P.decLit, .62); g.lineCap = 'round'; g.lineWidth = .9; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - h * .55); g.stroke();
      g.lineWidth = .45; g.beginPath();
      for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (rnd() - .5) * 2.2, l = h * (.25 + rnd() * .3), y0 = y - h * (.3 + rnd() * .3); g.moveTo(x, y0); g.lineTo(x + Math.cos(a) * l * .8, y0 + Math.sin(a) * l); }
      g.stroke(); g.fillStyle = v99rgb(P.decLit, .75, .35); g.beginPath(); g.ellipse(x, y - h * .62, w * .9, h * .3, 0, 0, 6.3); g.fill(); return;
    }
    g.fillStyle = '#4a3b2e'; g.fillRect(x - .5, y - h * .45, 1, h * .45 + .2);
    const cx = x, cy = y - h * .62;
    g.fillStyle = v99rgb(P.leaf, .78); g.beginPath(); g.ellipse(cx + .6, cy + .6, w, w * .82, 0, 0, 6.3); g.fill();
    for (let i = 0; i < 5; i++) { const a = rnd() * 6.3, rr = w * (.35 + rnd() * .3), ox = Math.cos(a) * w * .45 - .6, oy = Math.sin(a) * w * .35 - .5; g.fillStyle = v99rgb(P.decLit, .82 + rnd() * .3); g.beginPath(); g.arc(cx + ox, cy + oy, rr, 0, 6.3); g.fill(); }
  }
  function v99Bush(g, x, y, r, P, rnd) {
    for (let i = 0; i < 3; i++) { const ox = (rnd() - .5) * r * 1.4, oy = (rnd() - .5) * r * .5, rr = r * (.55 + rnd() * .35); g.fillStyle = v99rgb(P.bush, .75 + i * .15); g.beginPath(); g.ellipse(x + ox, y - rr * .7 + oy, rr, rr * .8, 0, 0, 6.3); g.fill(); }
    if (P.snow) { g.fillStyle = 'rgba(236,241,244,.85)'; g.beginPath(); g.ellipse(x - r * .2, y - r * 1.05, r * .55, r * .25, 0, 0, 6.3); g.fill(); }
  }
  function v99Rock__base(g, x, y, r, hh, P, rnd, fa) {
    const n = 6 + (rnd() * 2 | 0), poly = []; for (let i = 0; i < n; i++) { const a = i / n * 6.283, rr = r * (.7 + rnd() * .35); poly.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
    const f = v99Prism(poly, 0, hh, .62); v99CastShadow(g, x, y, fa, poly.map(p => [p[0] * .7, p[1] * .7, hh]), P.shA * .8, P.shade);
    const cols = f.map((_, i) => i === 0 && P.snow ? [230, 235, 238] : P.stone); v99Solid(g, x, y, fa, f, cols, .25);
  }
  function v99Crater(g, x, y, rc, P) {
    g.save(); g.translate(x, y); g.scale(1, TILT);
    const ej = g.createRadialGradient(0, 0, rc * .7, 0, 0, rc * 1.7); ej.addColorStop(0, v99rgb(P.dirt, .9, .55)); ej.addColorStop(1, v99rgb(P.dirt, .9, 0));
    g.fillStyle = ej; g.beginPath(); g.arc(0, 0, rc * 1.7, 0, 6.3); g.fill();
    g.fillStyle = v99rgb(P.dirt, 1.12); g.beginPath(); g.arc(0, 0, rc * 1.06, 0, 6.3); g.fill();
    const bw = g.createLinearGradient(-rc, -rc, rc, rc); bw.addColorStop(0, v99rgb(P.dirt, .38)); bw.addColorStop(1, v99rgb(P.dirt, .8));
    g.fillStyle = bw; g.beginPath(); g.arc(0, 0, rc * .86, 0, 6.3); g.fill();
    g.fillStyle = v99rgb(P.dirt, .5); g.beginPath(); g.arc(rc * .12, rc * .12, rc * .4, 0, 6.3); g.fill();
    g.restore();
  }
  function v99House(g, x, y, fa, o, P) {
    const L = o.L, W = o.W, H = o.H, RH = o.R, L2 = L / 2, W2 = W / 2;
    v99CastShadow(g, x, y, fa, [[-L2, -W2, H], [L2, -W2, H], [L2, W2, H], [-L2, W2, H], [-L2, 0, H + RH], [L2, 0, H + RH]], P.shA, P.shade);
    v99Solid(g, x, y, fa, v99Gable(L, W, H, RH), [o.wall, o.wall, o.wall, o.wall, o.roof, o.roof], .35);
    const glass = 'rgba(34,38,44,.9)', fl = H > 8 ? [[2.2, 3.9], [5.6, 7.3]] : [[2.4, 4.4]];
    [-1, 1].forEach(sd => { const b = sd * (W2 + .03); for (let a = -L2 + 2.2; a + 1.4 <= L2 - 1.2; a += 3.6) fl.forEach(([h0, h1]) => v99Quad(g, x, y, fa, [[a, b, h0], [a + 1.4, b, h0], [a + 1.4, b, h1], [a, b, h1]], [0, sd, 0], glass)); });
    [-1, 1].forEach(sd => { const a = sd * (L2 + .03); v99Quad(g, x, y, fa, [[a, -1, 0], [a, 1, 0], [a, 1, 3.4], [a, -1, 3.4]], [sd, 0, 0], 'rgba(58,44,34,.95)'); });
    if (o.chim) v99Solid(g, x, y, fa, v99Box(L2 * .45, L2 * .45 + 1.6, -W2 * .45, -W2 * .45 + 1.6, H + RH * .4, H + RH + 1.6), [o.wall[0] * .8, o.wall[1] * .76, o.wall[2] * .72]);
  }
  function v99Line(g, pts, w, col) { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); v99PathOn(g, pts, false); g.stroke(); }
  const v99Sample = (pts, step) => {   // evenly spaced points + tangents along a polyline
    const out = []; let acc = 0;
    for (let i = 0; i + 1 < pts.length; i++) { const a = pts[i], b = pts[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (!l) continue; while (acc <= l) { const t = acc / l; out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, (b[0] - a[0]) / l, (b[1] - a[1]) / l]); acc += step; } acc -= l; }
    return out;
  };

  // line props (roads, hedges, fences, trenches): per hex, edge-midpoint → centre curves toward same-type neighbours
  function v99HexLines__base(info, types, c, r, lift, single) {
    const i = r * COLS + c, ctr = getHexCenter(c, r), v = getHexVertices(ctr.x, ctr.y, HEX_RADIUS), con = [];
    for (let e = 0; e < 6; e++) { const n = getNeighborByEdge(c, r, e); if (n && types[info.T[n.r * COLS + n.c]]) con.push([(v[e].x + v[(e + 1) % 6].x) / 2, (v[e].y + v[(e + 1) % 6].y) / 2]); }
    const C = [ctr.x, ctr.y], out = [];
    if (!con.length) {
      if (!single) return out;
      const e = Math.floor(v99h(c, r, 5) * 3), m = k => [(v[k % 6].x + v[(k + 1) % 6].x) / 2, (v[k % 6].y + v[(k + 1) % 6].y) / 2], a = m(e), b = m(e + 3);
      out.push([[a[0] * .8 + C[0] * .2, a[1] * .8 + C[1] * .2], C, [b[0] * .8 + C[0] * .2, b[1] * .8 + C[1] * .2]]); return out;
    }
    if (con.length === 2) { const q = []; for (let t = 0; t <= 8; t++) { const u = t / 8, a = (1 - u) * (1 - u), b = 2 * u * (1 - u), d = u * u; q.push([con[0][0] * a + C[0] * b + con[1][0] * d, con[0][1] * a + C[1] * b + con[1][1] * d]); } out.push(q); }
    else con.forEach(m => out.push([m, C]));
    return out;
  }

  // ---------- ground canvas: full / regional repaint ----------
  function v99Rect(x0, y0, x1, y1) { const g = v99G, gs = g.gs; return [Math.max(0, Math.floor(x0 * gs)), Math.max(0, Math.floor(y0 * gs)), Math.min(g.cv.width, Math.ceil(x1 * gs)), Math.min(g.cv.height, Math.ceil(y1 * gs))]; }
  function v99Repaint__base(px0, py0, px1, py1) {
    const G = v99G, gs = G.gs, info = G.info, P = info.pal, W = px1 - px0, H = py1 - py0; if (W <= 0 || H <= 0) return;
    const g = G.cv.getContext('2d'), rx0 = px0 / gs, ry0 = py0 / gs, rx1 = px1 / gs, ry1 = py1 / gs;
    const img = g.createImageData(W, H); v99Paint(img, W, H, rx0, ry0, gs, 0, info); g.putImageData(img, px0, py0);
    g.save(); g.beginPath(); g.rect(px0, py0, W, H); g.clip(); g.setTransform(gs, 0, 0, gs, 0, 0);
    // hexes whose props can reach into the rect
    const near = []; for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const q = getHexCenter(c, r); if (q.x > rx0 - 44 && q.x < rx1 + 44 && q.y > ry0 - 26 && q.y < ry1 + 52) near.push([c, r, q]); }
    const loops = G.loops;   // per level ≥ 1: screen-space top outlines (for hidden-behind tests)
    const behind = (L, x, y) => { for (let l = L + 1; l <= info.maxE; l++) if ((loops[l] || []).some(sp => v99Inside(sp.top, x, y))) return true; return false; };
    const ups = [];
    for (let L = 0; L <= info.maxE; L++) {
      if (L > 0) v99Plateau(g, L, rx0, ry0, rx1, ry1);
      v99Flats(g, info, near.filter(n => info.E[n[1] * COLS + n[0]] === L), L);
      const items = []; near.forEach(n => { if (info.E[n[1] * COLS + n[0]] === L) v99Uprights(info, n[0], n[1], n[2], items); });
      const now = items.filter(it => L < info.maxE && behind(L, it.x, it.y));
      v99DrawItems(g, now, P);
      items.forEach(it => { if (!now.includes(it)) ups.push(it); });
    }
    v99DrawItems(g, ups, P);
    g.restore();
  }
  function v99Plateau(g, L, rx0, ry0, rx1, ry1) {
    const G = v99G, info = G.info, P = info.pal, gs = G.gs, lps = G.loops[L] || [];
    if (!lps.length) return;
    // cast shadow onto the lower ground (soft), then the front cliff faces, then the lifted top surface
    g.save(); g.shadowColor = info.winter ? 'rgba(20,34,52,.42)' : 'rgba(0,0,0,.45)'; g.shadowBlur = 5 * gs; const sh = v99Sh(LIFT);
    const so = [(sh[0] * COSA - sh[1] * SINA), (sh[0] * SINA + sh[1] * COSA) * TILT];
    g.shadowOffsetX = (so[0] + 4000) * gs; g.shadowOffsetY = so[1] * gs; g.fillStyle = '#000';
    g.beginPath(); lps.forEach(lp => { const sp = lp.pts.map(p => v99Proj(p[0], p[1], (L - 1) * LIFT)); v99PathOn(g, sp.map(p => [p[0] - 4000, p[1]]), true); }); g.fill('evenodd'); g.restore();
    const quads = [];
    lps.forEach(lp => { const p = lp.pts; for (let i = 0; i < p.length; i++) {
      const a = p[i], b = p[(i + 1) % p.length], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); if (!l) continue;
      const nx = dy / l, ny = -dx / l, tw = nx * SINA + ny * COSA; if (tw <= 0) continue;
      const lam = Math.max(0, nx * V99L[0] + ny * V99L[1]) / Math.hypot(V99L[0], V99L[1]);
      quads.push({ d: (a[0] + b[0]) * SINA + (a[1] + b[1]) * COSA, a, b, k: .55 + .42 * lam + (v99h(Math.round(a[0]), Math.round(a[1]), 3) - .5) * .12 });
    } });
    quads.sort((p, q) => p.d - q.d);
    quads.forEach(q => {
      const t0 = v99Proj(q.a[0], q.a[1], L * LIFT), t1 = v99Proj(q.b[0], q.b[1], L * LIFT), b0 = v99Proj(q.a[0], q.a[1], (L - 1) * LIFT), b1 = v99Proj(q.b[0], q.b[1], (L - 1) * LIFT);
      const gr = g.createLinearGradient(0, t0[1], 0, b0[1]); gr.addColorStop(0, v99rgb(P.cliff, q.k * 1.08)); gr.addColorStop(1, v99rgb(P.cliff, q.k * .7));
      g.beginPath(); g.moveTo(t0[0], t0[1]); g.lineTo(t1[0], t1[1]); g.lineTo(b1[0] + .05, b1[1] + .05); g.lineTo(b0[0] - .05, b0[1] + .05); g.closePath(); g.fillStyle = gr; g.fill();
      g.strokeStyle = gr; g.lineWidth = .25; g.stroke();
    });
    // top surface: paint level L for the outline bbox (∩ rect), clip to the lifted outline
    let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9; lps.forEach(lp => lp.top.forEach(p => { bx0 = Math.min(bx0, p[0]); by0 = Math.min(by0, p[1]); bx1 = Math.max(bx1, p[0]); by1 = Math.max(by1, p[1]); }));
    bx0 = Math.max(bx0 - 2, rx0); by0 = Math.max(by0 - 2, ry0); bx1 = Math.min(bx1 + 2, rx1); by1 = Math.min(by1 + 2, ry1);
    if (bx1 <= bx0 || by1 <= by0) return;
    const px0 = Math.floor(bx0 * gs), py0 = Math.floor(by0 * gs), W = Math.ceil(bx1 * gs) - px0, H = Math.ceil(by1 * gs) - py0, tmp = TankBaker.mkCanvas(W, H), tg = tmp.getContext('2d'), img = tg.createImageData(W, H);
    v99Paint(img, W, H, px0 / gs, py0 / gs, gs, L, info); tg.putImageData(img, 0, 0);
    g.save(); g.beginPath(); lps.forEach(lp => v99PathOn(g, lp.top, true)); g.clip('evenodd');
    g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(tmp, px0, py0); g.restore();
    g.save(); g.strokeStyle = P.rim; g.lineWidth = .7; g.beginPath(); lps.forEach(lp => v99PathOn(g, lp.top, true)); g.stroke(); g.restore();
  }
  function v99Flats__base(g, info, hexes, L) {
    const P = info.pal, isRoad = { road: 1, cobblestone: 1 };
    // roads: centre→edge half-edges, curved through two-way hexes. Wide tracks are painted per pixel (churned mud) and only get faint wheel ruts here.
    const roads = [], ruts = [];
    hexes.forEach(([c, r]) => { const i = r * COLS + c; if (info.T[i] !== 'road' || info.roadPolys) return; v99HexLines(info, isRoad, c, r, L, true).forEach(p => (info.wide[i] ? ruts : roads).push(p)); });
    const st = (L2, w, col) => { if (!L2.length) return; g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); L2.forEach(p => v99PathOn(g, p, false)); g.stroke(); };
    const RW = info.rw || 1; if (RW > 1) st(roads, 15 * RW, v99rgb(P.dirt, 1, .16));   // v149: wider gravel road with a dirt shoulder
    st(roads, 12 * RW, v99rgb(P.roadEdge, 1, .24)); st(roads, 9 * RW, v99rgb(P.road, .96)); st(roads, 6.6 * RW, v99rgb(P.rut, 1, .28)); st(roads, 4.4 * RW, v99rgb(P.road, 1.02)); st(roads, 1.4 * RW, v99rgb(P.roadMid, 1, .3));
    st(ruts, 6.4, v99rgb(P.rut, 1, .16)); st(ruts, 4.2, v99rgb(P.road, 1, .16));
    // craters + trenches (dug into the ground)
    hexes.forEach(([c, r, q]) => {
      const t = info.T[r * COLS + c], rnd = v99rng(c, r, 11);
      if (t === 'crater') { const n = 1 + (rnd() * 2 | 0); for (let k = 0; k < n; k++) v99Crater(g, q.x + (rnd() - .5) * 14, q.y + (rnd() - .5) * 6, 4 + rnd() * 2.6 - k * .8, P); }
      if (t === 'trench') v99HexLines(info, { trench: 1 }, c, r, L, true).forEach(p => {
        const sm = v99Sample(p, 2.2); if (sm.length < 2) return;
        v99Line(g, p, 7.5, v99rgb(P.dirt, 1.05, .9));
        const zz = sm.map((s, k) => [s[0] - s[3] * (k % 2 ? 1.1 : -1.1), s[1] + s[2] * (k % 2 ? 1.1 : -1.1) * TILT]);
        v99Line(g, zz, 2.6, v99rgb(P.dirt, .45)); v99Line(g, zz.map(z => [z[0] + .45, z[1] + .35]), .8, v99rgb(P.dirt, .72));
        sm.forEach((s, k) => { if (k % 2) return; g.fillStyle = v99rgb([176, 162, 128], .95 + v99h(c, k, 4) * .1); g.beginPath(); g.ellipse(s[0] + s[3] * 3.2, s[1] - s[2] * 3.2 * TILT, 1.3, .8, 0, 0, 6.3); g.fill(); });
      });
    });
  }
  function v99Uprights__base(info, c, r, q, items) {   // collect y-sortable props of one hex
    const t = info.T[r * COLS + c], P = info.pal, rnd = v99rng(c, r, 23), win = info.winter, R = HEX_RADIUS;
    const spot = (k, rad) => { const a = rnd() * 6.283, d = Math.sqrt(rnd()) * rad; const o = isoD(Math.cos(a) * d, Math.sin(a) * d); return [q.x + o.x, q.y + o.y]; };
    if (t === 'forest') {
      const n = 8 + (rnd() * 3 | 0);
      for (let k = 0; k < n; k++) { const [x, y] = spot(k, R * .95), h = 13 + rnd() * 6, w = 3.6 + rnd() * 1.6, dec = !win ? rnd() < .3 : rnd() < .22, rs = rnd() * 1e6 | 0;
        items.push({ x, y, h, kind: dec ? 'dec' : 'con', w, rs }); }
    } else if (t === 'bush') {
      for (let k = 0; k < 5; k++) { const [x, y] = spot(k, R * .8); items.push({ x, y, h: 3, kind: 'bush', w: 1.8 + rnd() * 1.2, rs: rnd() * 1e6 | 0 }); }
      if (rnd() < .6) { const [x, y] = spot(9, R * .5); items.push({ x, y, h: 11, kind: win ? 'con' : 'dec', w: 3.4, rs: rnd() * 1e6 | 0 }); }
    } else if (t === 'hedge') {
      v99HexLines(info, { hedge: 1 }, c, r, 0, true).forEach(p => v99Sample(p, 1.7).forEach((s, k) => items.push({ x: s[0] + (rnd() - .5), y: s[1] + (rnd() - .5) * .6, h: 3.5, kind: 'bush', w: 2.1 + rnd() * .9, rs: rnd() * 1e6 | 0 })));
    } else if (t === 'fence') {
      v99HexLines(info, { fence: 1 }, c, r, 0, true).forEach(p => items.push({ x: q.x, y: q.y, h: 3, kind: 'fence', pts: p }));
    } else if (t === 'rock') {
      const n = 2 + (rnd() * 3 | 0); for (let k = 0; k < n; k++) { const [x, y] = spot(k, R * .55); items.push({ x, y, h: 3, kind: 'rock', w: 2.4 + rnd() * 2.8, hh: 2 + rnd() * 3.2, fa: rnd() * 6.3, rs: rnd() * 1e6 | 0 }); }
    } else if (t === 'rubble') {
      for (let k = 0; k < 9; k++) { const [x, y] = spot(k, R * .7); items.push({ x, y, h: 2, kind: 'chunk', w: .8 + rnd() * 1.6, hh: .5 + rnd() * 1.5, fa: rnd() * 6.3 }); }
      for (let k = 0; k < 2; k++) { const [x, y] = spot(k + 9, R * .45); items.push({ x, y, h: 5, kind: 'wall', w: 5 + rnd() * 3, hh: 2.2 + rnd() * 3, fa: Math.floor(rnd() * 3) * Math.PI / 3 }); }
    } else if (t === 'building') {
      let fa = Math.floor(v99h(c, r, 2) * 3) * Math.PI / 3;
      for (let e = 0; e < 6; e++) { const n = getNeighborByEdge(c, r, e); if (n && info.T[n.r * COLS + n.c] === 'road') { fa = (e * 60 + 90) * Math.PI / 180; break; } }
      const big = rnd() < .35, wl = P.wall[(rnd() * P.wall.length) | 0], rf = P.roof[(rnd() * P.roof.length) | 0];
      items.push({ x: q.x, y: q.y, h: 14, kind: 'house', fa, o: big ? { L: 17, W: 11, H: 9.5, R: 5.5, wall: wl, roof: rf, chim: true } : { L: 14, W: 9.5, H: 6.5, R: 4.8, wall: wl, roof: rf, chim: rnd() < .6 } });
      if (rnd() < .5) { const o = isoD(-9, 8); items.push({ x: q.x + o.x, y: q.y + o.y, h: 5, kind: 'house', fa: fa + Math.PI / 2, o: { L: 6.5, W: 5, H: 3.6, R: 2.4, wall: P.wood, roof: rf } }); }
    } else if (t === 'plains' || t === 'field' || t === 'snow') {
      const u = rnd(); if (u < .07) { const [x, y] = spot(0, R * .6); for (let k = 0; k < 3; k++) items.push({ x: x + (rnd() - .5) * 6, y: y + (rnd() - .5) * 3, h: 3, kind: 'bush', w: 1.4 + rnd() * 1, rs: rnd() * 1e6 | 0 }); }
      else if (u < .1 && t !== 'field') { const [x, y] = spot(0, R * .5); items.push({ x, y, h: 2, kind: 'rock', w: 1.6 + rnd() * 1.4, hh: 1.2 + rnd(), fa: rnd() * 6.3, rs: rnd() * 1e6 | 0 }); }
    }
  }
  function v99DrawItems(g, items, P) {
    if (!items.length) return;
    items.sort((a, b) => a.y - b.y);
    // shadows first (trees / bushes / walls), then the props back to front
    items.forEach(it => {
      if (it.kind === 'con' || it.kind === 'dec') { const s = v99Sh(it.h * .5), o = isoD(s[0], s[1]); g.fillStyle = v99rgb(P.shade, 1, P.shA); g.beginPath(); g.ellipse(it.x + o.x, it.y + o.y, it.h * .45, it.w * .5, -.21, 0, 6.3); g.fill(); }
      else if (it.kind === 'bush') { g.fillStyle = v99rgb(P.shade, 1, P.shA * .8); g.beginPath(); g.ellipse(it.x + it.w * .9, it.y - .2, it.w * 1.2, it.w * .45, -.2, 0, 6.3); g.fill(); }
      else if (it.kind === 'fence') { g.strokeStyle = v99rgb(P.shade, 1, P.shA * (it.big ? .85 : .7)); g.lineWidth = it.big ? 1.6 : .7; g.beginPath(); v99PathOn(g, it.pts.map(p => [p[0] + (it.big ? 3.2 : 1.6), p[1] - .3]), false); g.stroke(); }
    });
    items.forEach(it => {
      const rnd = v99rng(it.rs || 1, 7, 3);
      if (it.kind === 'con') v99Conifer(g, it.x, it.y, it.h, it.w, P);
      else if (it.kind === 'dec') v99Decid(g, it.x, it.y, it.h, it.w, P, rnd);
      else if (it.kind === 'bush') v99Bush(g, it.x, it.y, it.w, P, rnd);
      else if (it.kind === 'rock') v99Rock(g, it.x, it.y, it.w, it.hh, P, rnd, it.fa);
      else if (it.kind === 'chunk') v99Solid(g, it.x, it.y, it.fa, v99Box(-it.w / 2, it.w / 2, -it.w * .35, it.w * .35, 0, it.hh), P.snow ? [[226, 231, 234], P.stone, P.stone, P.stone, P.stone] : P.stone, .25);
      else if (it.kind === 'wall') { v99CastShadow(g, it.x, it.y, it.fa, [[-it.w / 2, -.6, it.hh], [it.w / 2, -.6, it.hh * .6], [it.w / 2, .6, it.hh * .6], [-it.w / 2, .6, it.hh]], P.shA, P.shade);
        v99Solid(g, it.x, it.y, it.fa, [[[-it.w / 2, -.6, 0], [it.w / 2, -.6, 0], [it.w / 2, -.6, it.hh * .6], [it.w * .1, -.6, it.hh * .85], [-it.w / 2, -.6, it.hh]], [[it.w / 2, .6, 0], [-it.w / 2, .6, 0], [-it.w / 2, .6, it.hh], [it.w * .1, .6, it.hh * .85], [it.w / 2, .6, it.hh * .6]],
          [[-it.w / 2, -.6, it.hh], [it.w * .1, -.6, it.hh * .85], [it.w * .1, .6, it.hh * .85], [-it.w / 2, .6, it.hh]], [[it.w * .1, -.6, it.hh * .85], [it.w / 2, -.6, it.hh * .6], [it.w / 2, .6, it.hh * .6], [it.w * .1, .6, it.hh * .85]],
          [[it.w / 2, -.6, 0], [it.w / 2, .6, 0], [it.w / 2, .6, it.hh * .6], [it.w / 2, -.6, it.hh * .6]], [[-it.w / 2, .6, 0], [-it.w / 2, -.6, 0], [-it.w / 2, -.6, it.hh], [-it.w / 2, .6, it.hh]]], P.wall[0], .3); }
      else if (it.kind === 'fence' && it.big) {   // v157: posts at the run points, split rails, wall scale
        const [a, b2] = it.pts, wd = v99rgb(P.wood, .62), wl = v99rgb(P.wood, 1.08), H = 6.4;
        g.lineCap = 'round'; g.strokeStyle = wd; g.lineWidth = .95; g.beginPath(); [a, b2].forEach(s => { g.moveTo(s[0], s[1] + .3); g.lineTo(s[0], s[1] - H); }); g.stroke();
        g.strokeStyle = wl; g.lineWidth = .75; [2.4, 4.9].forEach(hh => { g.beginPath(); g.moveTo(a[0], a[1] - hh); g.lineTo(b2[0], b2[1] - hh + (rnd() - .5) * .5); g.stroke(); });
        g.strokeStyle = v99rgb(P.wood, .45, .5); g.lineWidth = .35; [2.4, 4.9].forEach(hh => { g.beginPath(); g.moveTo(a[0], a[1] - hh + .45); g.lineTo(b2[0], b2[1] - hh + .45); g.stroke(); });
      }
      else if (it.kind === 'fence') {
        const sm = v99Sample(it.pts, 3); g.strokeStyle = v99rgb(P.wood, .7); g.lineWidth = .55; g.lineCap = 'round'; g.beginPath(); sm.forEach(s => { g.moveTo(s[0], s[1]); g.lineTo(s[0], s[1] - 3.2); }); g.stroke();
        g.strokeStyle = v99rgb(P.wood, 1.05); g.lineWidth = .4; [1.3, 2.6].forEach(hh => { g.beginPath(); v99PathOn(g, it.pts.map(p => [p[0], p[1] - hh]), false); g.stroke(); });
      }
      else if (it.kind === 'house') v99House(g, it.x, it.y, it.fa, it.o, P);
    });
  }

  function v99Build__base() {   // (re)build the whole ground canvas for the current map
    const G = v99G, t0 = performance.now();
    G.info = v99Info(); const info = G.info;
    const area = WORLD_W * WORLD_H; G.gs = Math.max(1.5, Math.min(3, Math.sqrt(V99.maxPx / area)));
    const W = Math.ceil(WORLD_W * G.gs), H = Math.ceil(WORLD_H * G.gs);
    if (!G.cv || G.cv.width !== W || G.cv.height !== H) { G.cv = TankBaker.mkCanvas(W, H); }
    else G.cv.getContext('2d').clearRect(0, 0, W, H);
    // elevation outlines (flat coords smoothed, + screen top outline per level)
    G.loops = [];
    for (let L = 1; L <= info.maxE; L++) {
      const ch = v99Chain(v99Edges((c, r) => info.E[r * COLS + c] >= L)).filter(l => l.closed || l.pts.length > 2);
      G.loops[L] = ch.map(l => { const pts = v99Chaikin(l.pts, true, 3); return { pts, top: pts.map(p => v99Proj(p[0], p[1], L * LIFT)) }; });
    }
    G.TS = 384; G.tw = Math.ceil(W / G.TS); G.th = Math.ceil(H / G.TS); G.dirty = new Uint8Array(G.tw * G.th).fill(1);
    G.ver++; G.ms = performance.now() - t0;
  }
  function v99MarkDirty(px0, py0, px1, py1) { const G = v99G, T = G.TS; for (let ty = Math.max(0, Math.floor(py0 / T)); ty <= Math.min(G.th - 1, Math.floor((py1 - 1) / T)); ty++) for (let tx = Math.max(0, Math.floor(px0 / T)); tx <= Math.min(G.tw - 1, Math.floor((px1 - 1) / T)); tx++) G.dirty[ty * G.tw + tx] = 1; }
  function v99PaintTile(k) { const G = v99G, T = G.TS, tx = k % G.tw, ty = (k / G.tw) | 0; G.dirty[k] = 0; v99Repaint(tx * T, ty * T, Math.min(G.cv.width, (tx + 1) * T), Math.min(G.cv.height, (ty + 1) * T)); }
  function v99PaintVisible() {   // tiles under the camera now; the rest a few at a time in the background
    const G = v99G, T = G.TS, gs = G.gs, x0 = Math.floor(Math.max(0, camX - 8) * gs / T), y0 = Math.floor(Math.max(0, camY - 8) * gs / T), x1 = Math.floor(Math.min(WORLD_W, camX + VIEW_W + 8) * gs / T), y1 = Math.floor(Math.min(WORLD_H, camY + VIEW_H + 8) * gs / T);
    for (let ty = Math.max(0, y0); ty <= Math.min(G.th - 1, y1); ty++) for (let tx = Math.max(0, x0); tx <= Math.min(G.tw - 1, x1); tx++) if (G.dirty[ty * G.tw + tx]) v99PaintTile(ty * G.tw + tx);
    if (!G.bg && G.dirty.some(v => v)) { G.bg = setTimeout(function step() { const t = performance.now(); let k; while ((k = G.dirty.indexOf(1)) >= 0 && performance.now() - t < 24) v99PaintTile(k); G.bg = k >= 0 ? setTimeout(step, 30) : 0; }, 60); }
  }
  function v99TerrSig() { const a = []; for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const t = terrainMap[c + ',' + r]; a.push(t ? t.terrainType + (t.elevation | 0) : 'plains0'); } return a; }
  function v99Ensure() {
    const G = v99G, key = [COLS, ROWS, OFFX, OFFY, WORLD_W, WORLD_H, v99Biome()].join('|'), sig = v99TerrSig();
    if (!G.cv || G.key !== key || !G.tsig || G.tsig.length !== sig.length) { G.key = key; G.tsig = sig; v99Build(); return; }
    const ch = []; for (let i = 0; i < sig.length; i++) if (sig[i] !== G.tsig[i]) ch.push(i);
    if (!ch.length) return;
    const elev = ch.some(i => sig[i].slice(-1) !== G.tsig[i].slice(-1)); G.tsig = sig;
    if (elev) { v99Build(); return; }
    G.info = v99Info();
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    ch.forEach(i => { const q = getHexCenter(i % COLS, (i / COLS) | 0); x0 = Math.min(x0, q.x); y0 = Math.min(y0, q.y); x1 = Math.max(x1, q.x); y1 = Math.max(y1, q.y); });
    const R = HEX_RADIUS, rc = v99Rect(x0 - R * 2.4, y0 - R * 2 - 20, x1 + R * 2.4, y1 + R * 1.6);
    v99MarkDirty(...rc); G.ver++;
  }

  // ---------- fog of war: blurred mask (desaturate + darken) ----------
  function v99FogEnsure() {
    const G = v99G; let hs = visibleHexes.size * 7919 + G.ver * 31; visibleHexes.forEach(k => { let h = 0; for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) | 0; hs = (hs + Math.imul(h, 2654435761)) | 0; });
    const sig = hs + '|' + currentTurn + '|' + G.key; if (G.fog && G.fogSig === sig) return; G.fogSig = sig;
    const FS = .25, W = Math.ceil(WORLD_W * FS), H = Math.ceil(WORLD_H * FS), m = TankBaker.mkCanvas(W, H), g = m.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.setTransform(FS, 0, 0, FS, 0, 0); g.globalCompositeOperation = 'destination-out'; g.beginPath();
    TILE_ORDER.forEach(([c, r]) => { if (!visibleHexes.has(c + ',' + r)) return; const q = getHexCenter(c, r), v = getHexVertices(q.x, q.y, HEX_RADIUS - .6); g.moveTo(v[0].x, v[0].y); for (let i = 1; i < 6; i++) g.lineTo(v[i].x, v[i].y); g.closePath(); });
    g.fill(); g.globalCompositeOperation = 'source-over';
    const half = TankBaker.mkCanvas(Math.ceil(W / 2), Math.ceil(H / 2)), hg = half.getContext('2d'); hg.imageSmoothingEnabled = true; hg.drawImage(m, 0, 0, half.width, half.height);
    const mk = col => { const o = TankBaker.mkCanvas(W, H), og = o.getContext('2d'); og.imageSmoothingEnabled = true; og.drawImage(half, 0, 0, W, H); og.globalCompositeOperation = 'source-in'; og.fillStyle = col; og.fillRect(0, 0, W, H); return o; };
    G.fog = mk('#0b1016');
  }

  // ---------- smooth territory lines (on the ground, under the units) ----------
  function v99Territory__base() {
    const T = territoryOf(), R = HEX_RADIUS;
    ['blue', 'red'].forEach(tm => {
      const segs = [];
      TILE_ORDER.forEach(([c, r]) => {
        if (T.get(c + ',' + r) !== tm || !visibleHexes.has(c + ',' + r)) return;
        const [fx, fy] = v99Flat(c, r), t = terrainMap[c + ',' + r], h = t ? t.elevation * LIFT : 0;
        for (let e = 0; e < 6; e++) { const n = getNeighborByEdge(c, r, e); if (!n || T.get(n.c + ',' + n.r) === tm) continue; segs.push({ a: v99Vert(fx, fy, e), b: v99Vert(fx, fy, e + 1), h }); }
      });
      if (!segs.length) return;
      const own = tm === currentTurn, rgb = tm === 'blue' ? '56,189,248' : '248,113,113';
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const paths = v99Chain(segs).map(l => { const sp = v99Scr(v99Chaikin(v99Lap(l.pts, l.closed, 5), l.closed, 2)); const o = [];
        for (let i = 0; i < sp.length; i++) { const a = sp[l.closed ? (i - 1 + sp.length) % sp.length : Math.max(0, i - 1)], b = sp[l.closed ? (i + 1) % sp.length : Math.min(sp.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], ln = Math.hypot(dx, dy) || 1; o.push([sp[i][0] - dy / ln * 1.6, sp[i][1] + dx / ln * 1.6]); }
        return { o, closed: l.closed }; });
      ctx.strokeStyle = `rgba(${rgb},.2)`; ctx.lineWidth = 3.6; ctx.beginPath(); paths.forEach(p => v99PathOn(ctx, p.o, p.closed)); ctx.stroke();
      ctx.strokeStyle = `rgba(${rgb},.9)`; ctx.lineWidth = 1.25; ctx.setLineDash(own ? [] : [5, 3]); ctx.beginPath(); paths.forEach(p => v99PathOn(ctx, p.o, p.closed)); ctx.stroke();
      ctx.restore();
    });
  }

  // ---------- ground pass (replaces the per-hex tile loop) ----------
  function v99Ground__base() {
    if (!V99.on) return false;
    try { v99Ensure(); v99PaintVisible(); v99FogEnsure(); } catch (e) { console.error('v99 ground', e); V99.on = false; return false; }
    const G = v99G, gs = G.gs, x0 = Math.max(0, camX - 4), y0 = Math.max(0, camY - 4), x1 = Math.min(WORLD_W, camX + VIEW_W + 4), y1 = Math.min(WORLD_H, camY + VIEW_H + 4);
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    if (x1 > x0 && y1 > y0) ctx.drawImage(G.cv, x0 * gs, y0 * gs, (x1 - x0) * gs, (y1 - y0) * gs, x0, y0, x1 - x0, y1 - y0);
    if (showGrid) TILE_ORDER.forEach(([c, r]) => { const q = getHexCenter(c, r); if (q.x > camX - 30 && q.x < camX + VIEW_W + 30 && q.y > camY - 30 && q.y < camY + VIEW_H + 30) o_dhp99(q.x, q.y, HEX_RADIUS, null, 'rgba(20,24,28,.22)', .5); });
    ctx.globalCompositeOperation = 'source-atop'; ctx.globalAlpha = V99.fogA; ctx.drawImage(G.fog, 0, 0, WORLD_W, WORLD_H); ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
    v99Territory();
    return true;
  }

  
  /* drawTerritory: layer moved to js/chains/drawTerritory.js */   // v99: drawn on the ground pass instead (under the units)

  // ---------- highlight regions: consecutive same-style hex highlights are merged (fill once, faint inner lines, bright perimeter) ----------
  const o_dhp99 = drawHexPolygon, v99Q = { key: null, list: [], st: null, tf: null };
  function v99Col(col, k) {
    if (!col) return null;
    if (col[0] === '#') { const [r, g, b] = v98Rgb(col); return `rgba(${r},${g},${b},${k})`; }
    const m = /rgba?\(([^)]+)\)/.exec(col); if (!m) return col; const p = m[1].split(',').map(Number);
    return `rgba(${p[0]},${p[1]},${p[2]},${(p.length > 3 ? p[3] : 1) * k})`;
  }
  drawHexPolygon = function (cx, cy, radius, fill, stroke, lw = 1) {
    if (!V99.on || !stroke || radius > HEX_RADIUS + .5) return o_dhp99(cx, cy, radius, fill, stroke, lw);
    const key = fill + '|' + stroke + '|' + lw;
    if (v99Q.key !== key) { v99Flush(); v99Q.key = key; v99Q.st = { fill, stroke, lw }; v99Q.tf = ctx.getTransform(); }
    v99Q.list.push([cx, cy]);
  };
  function v99CenterIdx() {
    const k = v99G.ver + '|' + COLS + '|' + ROWS + '|' + OFFX + '|' + OFFY;
    if (v99G.cidx && v99G.cidxVer === k) return v99G.cidx;
    const m = new Map(); for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const q = getHexCenter(c, r); m.set(Math.round(q.x * 2) + '|' + Math.round(q.y * 2), [c, r]); }
    v99G.cidx = m; v99G.cidxVer = k; return m;
  }
  function v99Flush() {
    const Q = v99Q; if (!Q.list.length) { Q.key = null; return; }
    const st = Q.st, list = Q.list, tf = Q.tf, idx = v99CenterIdx(); Q.list = []; Q.key = null;
    const cells = new Map(); list.forEach(([x, y]) => { const h = idx.get(Math.round(x * 2) + '|' + Math.round(y * 2)); if (h) cells.set(h[0] + ',' + h[1], { c: h[0], r: h[1], x, y }); });
    if (!cells.size) return;
    const R = HEX_RADIUS, inner = [], outer = [];
    ctx.save(); ctx.setTransform(tf); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash([]); ctx.globalAlpha = 1;
    ctx.beginPath();
    cells.forEach((h, key) => {
      const v = getHexVertices(h.x, h.y, R + .3); ctx.moveTo(v[0].x, v[0].y); for (let i = 1; i < 6; i++) ctx.lineTo(v[i].x, v[i].y); ctx.closePath();
      const w = getHexVertices(h.x, h.y, R);
      for (let e = 0; e < 6; e++) { const n = getNeighborByEdge(h.c, h.r, e), nk = n && n.c + ',' + n.r, seg = [w[e], w[(e + 1) % 6]]; if (nk && cells.has(nk)) { if (key < nk) inner.push(seg); } else outer.push(seg); }
    });
    if (st.fill) { ctx.fillStyle = v99Col(st.fill, .62); ctx.fill(); }
    const segs = L => { ctx.beginPath(); L.forEach(([a, b]) => { ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); }); };
    segs(inner); ctx.strokeStyle = v99Col(st.stroke, .3); ctx.lineWidth = .55; ctx.stroke();
    segs(outer); ctx.strokeStyle = v99Col(st.stroke, .2); ctx.lineWidth = st.lw * 2.8; ctx.stroke();
    ctx.strokeStyle = v99Col(st.stroke, .95); ctx.lineWidth = Math.max(1, st.lw * .85); ctx.stroke();
    ctx.restore();
  }
  {  /* drawSkTiles: layer moved to js/chains/drawSkTiles.js */ }
  {  /* pvDraw: layer moved to js/chains/pvDraw.js */ }

  // selection / attack-target rings (under the unit)
  function v99Mark(x, y, kind) {
    if (!V99.on) return kind === 'sel' ? o_dhp99(x, y, HEX_RADIUS, null, '#facc15', 2) : o_dhp99(x, y, HEX_RADIUS + 2, 'rgba(239, 68, 68, 0.3)', '#ef4444', 2.5);
    v99Flush(); ctx.save(); ctx.setLineDash([]);
    if (kind === 'sel') {
      ctx.beginPath(); ctx.ellipse(x, y + 1, 18, 9.6, 0, 0, 6.3); ctx.fillStyle = 'rgba(250,204,21,.12)'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(250,204,21,.22)'; ctx.stroke(); ctx.lineWidth = 1.2; ctx.strokeStyle = '#facc15'; ctx.stroke();
    } else {
      ctx.beginPath(); ctx.ellipse(x, y + 1, 19, 10, 0, 0, 6.3); ctx.fillStyle = 'rgba(239,68,68,.16)'; ctx.fill(); ctx.lineWidth = 1.3; ctx.strokeStyle = '#ef4444'; ctx.stroke();
      ctx.lineWidth = 1.8; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; ctx.beginPath(); ctx.ellipse(x, y + 1, 23.5, 12.5, 0, a - .3, a + .3); ctx.stroke(); }
    }
    ctx.restore();
  }

  // ---------- capture zones: smooth loops + a small plinth under the flag ----------
  const v99Lift = (c, r) => { const t = terrainMap[c + ',' + r]; return t ? t.elevation * LIFT : 0; };
  function v99Loops2(set) { return v99Chain(v99Edges((c, r) => set.has(c + ',' + r), v99Lift)).map(l => ({ sp: v99Scr(v99Chaikin(v99Lap(l.pts, l.closed, 14), l.closed, 2)), closed: l.closed })); }
  
  /* drawZones: layer moved to js/chains/drawZones.js */
  
  /* drawCapturePoint: layer moved to js/chains/drawCapturePoint.js */

  // ---------- smoke clouds · strike zones · fire glow ----------
  function v99Smoke() {
    const t = reduceMotion() ? 0 : performance.now() / 5000;
    smokes.forEach(sm => sm.hexes.forEach(h => {
      const q = getHexCenter(h.c, h.r);
      for (let k = 0; k < 6; k++) {
        const a = v99h(h.c, h.r, k) * 6.28 + t * (k % 2 ? 1 : -1), d = 3 + v99h(h.c, h.r, k + 9) * 10, o = isoD(Math.cos(a) * d, Math.sin(a) * d), rr = 9 + v99h(h.c, h.r, k + 3) * 6, px = q.x + o.x, py = q.y + o.y - 5 - k * 1.6;
        const gr = ctx.createRadialGradient(px - rr * .3, py - rr * .35, rr * .1, px, py, rr);
        gr.addColorStop(0, 'rgba(238,240,242,.5)'); gr.addColorStop(.55, 'rgba(208,212,216,.3)'); gr.addColorStop(1, 'rgba(190,195,200,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(px, py, rr, 0, 6.3); ctx.fill();
      }
    }));
  }
  function v99Strike() {
    pendingStrikes.forEach(st => {
      const k = v99G.ver + '|' + st.c + ',' + st.r + ',' + st.rad;
      if (!st._v99 || st._v99.k !== k) { const set = new Set(ring(st.c, st.r, st.rad).map(h => h.c + ',' + h.r)); st._v99 = { k, loops: v99Loops2(set) }; }
      ctx.save(); ctx.beginPath(); st._v99.loops.forEach(l => v99PathOn(ctx, l.sp, l.closed));
      ctx.fillStyle = 'rgba(239,68,68,.1)'; ctx.fill('evenodd'); ctx.globalAlpha = .45; ctx.fillStyle = hatchPat('strike'); ctx.fill('evenodd'); ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(248,113,113,.9)'; ctx.lineWidth = 1.3; ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);
      const q = getHexCenter(st.c, st.r); ctx.strokeStyle = 'rgba(254,202,202,.95)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(q.x, q.y, 7, 3.8, 0, 0, 6.3); ctx.moveTo(q.x - 11, q.y); ctx.lineTo(q.x - 4, q.y); ctx.moveTo(q.x + 4, q.y); ctx.lineTo(q.x + 11, q.y); ctx.moveTo(q.x, q.y - 6); ctx.lineTo(q.x, q.y - 2); ctx.moveTo(q.x, q.y + 2); ctx.lineTo(q.x, q.y + 6); ctx.stroke();
      ctx.restore();
    });
  }
  function v99Fire() {
    const t = performance.now(), rm = reduceMotion();
    fires.forEach(f => f.hexes.forEach(h => {
      const q = getHexCenter(h.c, h.r), fl = rm ? 1 : .85 + .15 * Math.sin(t / 90 + h.c * 3 + h.r);
      ctx.save(); ctx.translate(q.x, q.y); ctx.scale(1, .56);
      const gr = ctx.createRadialGradient(0, 0, 1, 0, 0, HEX_RADIUS * .95); gr.addColorStop(0, `rgba(255,176,70,${.6 * fl})`); gr.addColorStop(.45, `rgba(236,96,32,${.32 * fl})`); gr.addColorStop(1, 'rgba(110,30,10,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, HEX_RADIUS * .95, 0, 6.3); ctx.fill(); ctx.restore();
      for (let k = 0; k < 4; k++) { const o = isoD((v99h(h.c, h.r, k) - .5) * 20, (v99h(h.c, h.r, k + 5) - .5) * 20), x = q.x + o.x, y = q.y + o.y, hh = (5 + v99h(h.c, h.r, k + 2) * 5) * fl;
        ctx.fillStyle = `rgba(255,${150 + k * 20},60,.7)`; ctx.beginPath(); ctx.moveTo(x - 1.6, y); ctx.quadraticCurveTo(x - 1.4, y - hh * .6, x, y - hh); ctx.quadraticCurveTo(x + 1.4, y - hh * .6, x + 1.6, y); ctx.closePath(); ctx.fill(); }
    }));
  }

  // ---------- units: no rims; a thin ground ring instead of the team disc ----------
  /* v98Disc: layer moved to js/chains/v98Disc.js */

  // ---------- structures: 2.5D models + national flags ----------
  const V99BH = { hq: 21, outpost: 10, barracks: 11, support_center: 9, motor_pool: 12, air_coy: 12, tank_depot: 17, doc_inf: 11, doc_mech: 12, doc_air: 11 };
  function v99BldTop__base(b) { return V99 && V99.on ? (V99BH[b.type] || 12) : 5 + (BLD[b.type].tier || 0) * 2; }
  function v99Flag__base(px, py, top, team, sc = 1) {
    const rm = reduceMotion(), wv = rm ? 0 : Math.sin(performance.now() / 300 + px * .1) * 1.1, fw = 9 * sc, fh = 6 * sc, t = py - top;
    ctx.strokeStyle = '#3a3c3e'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, t - .5); ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.moveTo(px, t); ctx.quadraticCurveTo(px + fw * .5, t + wv - .6, px + fw, t + wv * .6); ctx.lineTo(px + fw, t + fh + wv * .6); ctx.quadraticCurveTo(px + fw * .5, t + fh + wv + .6, px, t + fh); ctx.closePath();
    ctx.fillStyle = team === 'blue' ? '#2d5fae' : '#b3352c'; ctx.fill(); ctx.clip();
    const cx = px + fw * .5, cy = t + fh * .5 + wv * .5;
    if (team === 'blue') {   // white star
      ctx.fillStyle = '#f4f6f8'; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = (i % 2 ? .95 : 2.3) * sc; ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } ctx.closePath(); ctx.fill();
    } else {                 // black Balkenkreuz, thin white edge (reads as a dark cross, never as a medical sign)
      const a = 2.4 * sc, b = .95 * sc; ctx.fillStyle = '#f4f6f8'; ctx.fillRect(cx - a - .25, cy - b - .25, 2 * a + .5, 2 * b + .5); ctx.fillRect(cx - b - .25, cy - a - .25, 2 * b + .5, 2 * a + .5);
      ctx.fillStyle = '#16181a'; ctx.fillRect(cx - a, cy - b, 2 * a, 2 * b); ctx.fillRect(cx - b, cy - a, 2 * b, 2 * a);
    }
    ctx.restore(); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = .3; ctx.stroke();
  }
  function v99Sandbags(x, y, rad, a0, a1, rows = 2) {
    const n = Math.max(2, Math.round(Math.abs(a1 - a0) * rad / 2.3)), parts = [];
    for (let rI = 0; rI < rows; rI++) for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * (i + (rI % 2) * .5) / n; if (rI % 2 && i === n) continue; const o = isoD(Math.cos(a) * rad, Math.sin(a) * rad); parts.push({ x: x + o.x, y: y + o.y, a, h: rI }); }
    parts.sort((p, q) => p.y - q.y || p.h - q.h).forEach(p => v99Solid(ctx, p.x, p.y, p.a + Math.PI / 2, v99Box(-1.15, 1.15, -.6, .6, p.h * .95, p.h * .95 + .95), [168, 154, 118], .35));
  }
  function v99Drums(x, y, n) { for (let i = 0; i < n; i++) { const o = isoD((i % 2) * 2.2, Math.floor(i / 2) * 2.2); const oct = Array.from({ length: 8 }, (_, k) => [Math.cos(k * Math.PI / 4) * .95, Math.sin(k * Math.PI / 4) * .95]); v99Solid(ctx, x + o.x, y + o.y, 0, v99Prism(oct, 0, 2.6), i % 3 ? [72, 82, 64] : [120, 42, 36], .3); } }
  function v99Crates(x, y, n, rnd) { for (let i = 0; i < n; i++) { const o = isoD((rnd() - .5) * 6, (rnd() - .5) * 4); v99Solid(ctx, x + o.x, y + o.y, rnd() * .8, v99Box(-1.4, 1.4, -1, 1, 0, 1.6 + (i % 2) * .4), [118, 98, 66], .35); } }
  function v99Quonset(x, y, fa, L, r, col) {
    const n = 7, L2 = L / 2, pts = Array.from({ length: n + 1 }, (_, i) => { const t = i / n * Math.PI; return [-r * Math.cos(t), r * Math.sin(t)]; }), f = [];
    for (let i = 0; i < n; i++) f.push([[-L2, pts[i][0], pts[i][1]], [L2, pts[i][0], pts[i][1]], [L2, pts[i + 1][0], pts[i + 1][1]], [-L2, pts[i + 1][0], pts[i + 1][1]]]);
    f.push(pts.map(p => [L2, p[0], p[1]])); f.push(pts.map(p => [-L2, p[0], p[1]]).reverse());
    v99CastShadow(ctx, x, y, fa, pts.map(p => [-L2, p[0], p[1]]).concat(pts.map(p => [L2, p[0], p[1]])), .3);
    v99Solid(ctx, x, y, fa, f, col, .25);
    [-1, 1].forEach(sd => v99Quad(ctx, x, y, fa, Array.from({ length: 6 }, (_, i) => { const t = (i / 5) * Math.PI; return [sd * (L2 + .05), -r * .55 * Math.cos(t), r * .7 * Math.sin(t)]; }), [sd, 0, 0], 'rgba(30,32,30,.92)'));
  }
  function v99Bld(x, y, b) {
    const info = v99G.info, P = info ? info.pal : V99PAL.summer, win = !!(info && info.winter), us = b.team === 'blue', rnd = v99rng(b.c, b.r, 61);
    const canvasC = us ? [112, 114, 80] : [126, 122, 102], roofS = win ? [222, 228, 233] : [88, 92, 98], tin = win ? [214, 221, 227] : [110, 116, 106];
    const yd = ctx.createRadialGradient(x, y, 2, x, y, 20); yd.addColorStop(0, v99rgb(P.dirt, 1, .5)); yd.addColorStop(1, v99rgb(P.dirt, 1, 0));
    ctx.fillStyle = yd; ctx.beginPath(); ctx.ellipse(x, y, 22, 12, 0, 0, 6.3); ctx.fill();
    const at = (dx, dy) => { const o = isoD(dx, dy); return [x + o.x, y + o.y]; };
    let flag = at(9, -9), ftop = 17;
    const tent = (dx, dy, fa, L, W, R, col) => { const [px, py] = at(dx, dy); v99CastShadow(ctx, px, py, fa, [[-L / 2, 0, R + 1], [L / 2, 0, R + 1]].concat([[-L / 2, -W / 2, 0], [L / 2, W / 2, 0]]), .25);
      v99Solid(ctx, px, py, fa, v99Gable(L, W, 1, R), col, .3); v99Quad(ctx, px, py, fa, [[L / 2 + .05, -1.2, 0], [L / 2 + .05, 1.2, 0], [L / 2 + .05, 0, R * .8]], [1, 0, 0], 'rgba(30,28,24,.85)'); };
    switch (b.type) {
      case 'hq': {
        v99Sandbags(...at(0, 0), 15, .2, 1.45);
        const [hx, hy] = at(-2, -2); v99House(ctx, hx, hy, 0, { L: 21, W: 14, H: 10, R: 6.5, wall: P.wall[0], roof: roofS, chim: true }, P);
        const [ax, ay] = at(-4, 1); ctx.strokeStyle = '#2c2e30'; ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(ax, ay - 12); ctx.lineTo(ax, ay - 27); ctx.moveTo(ax, ay - 27); ctx.lineTo(ax - 5, ay - 10); ctx.moveTo(ax, ay - 27); ctx.lineTo(ax + 5, ay - 12); ctx.stroke();
        flag = at(10, -9); ftop = 20; break;
      }
      case 'outpost': {
        tent(-1, -1, .3, 9, 7, 5, canvasC); v99Sandbags(...at(0, 0), 10, -.5, 2.4, 2); v99Crates(...at(5, 5), 2, rnd); flag = at(-7, 6); ftop = 15; break;
      }
      case 'barracks': {
        const [hx, hy] = at(-1, -5); v99House(ctx, hx, hy, 0, { L: 22, W: 8.5, H: 4.6, R: 3.2, wall: P.wood, roof: win ? [214, 220, 226] : [64, 66, 64] }, P);
        tent(1, 9, 0, 9, 6.5, 4.6, canvasC); flag = at(12, 4); break;
      }
      case 'support_center': {
        const [hx, hy] = at(-2, -3); v99CastShadow(ctx, hx, hy, 0, [[-7, -5.5, 4.5], [7, -5.5, 4.5], [7, 5.5, 4.5], [-7, 5.5, 4.5]], .3);
        v99Solid(ctx, hx, hy, 0, v99Box(-7, 7, -5.5, 5.5, 0, 4.5), win ? [[226, 231, 235], [150, 150, 144]] : [150, 150, 144], .35);
        v99Quad(ctx, hx, hy, 0, [[7.05, -3, 1.2], [7.05, 3, 1.2], [7.05, 3, 2.4], [7.05, -3, 2.4]], [1, 0, 0], 'rgba(20,22,24,.9)');
        v99Sandbags(...at(0, 0), 12, .1, 1.5, 2); v99Crates(...at(-9, 8), 3, rnd); flag = at(10, -6); ftop = 14; break;
      }
      case 'motor_pool': {
        const [hx, hy] = at(-2, -3); v99House(ctx, hx, hy, 0, { L: 20, W: 14, H: 7, R: 2.4, wall: [124, 128, 116], roof: tin }, P);
        v99Quad(ctx, hx, hy, 0, [[-6, 7.05, 0], [6, 7.05, 0], [6, 7.05, 5.2], [-6, 7.05, 5.2]], [0, 1, 0], 'rgba(26,28,26,.92)');
        v99Drums(...at(9, 7), 3); flag = at(-10, 8); break;
      }
      case 'air_coy': {
        tent(-1, -2, 0, 16, 13, 7.5, canvasC); v99Crates(...at(8, 8), 3, rnd); flag = at(-10, 8); break;
      }
      case 'tank_depot': {
        const [hx, hy] = at(-2, -3); v99Quonset(hx, hy, 0, 24, 8.5, win ? [[216, 222, 228], [120, 124, 118]] : [118, 124, 114]);
        v99Drums(...at(11, 6), 4); flag = at(-12, 8); ftop = 19; break;
      }
      default: {   // doctrine sites
        const mech = b.type === 'doc_mech';
        if (mech) { const [hx, hy] = at(-2, -2); v99House(ctx, hx, hy, 0, { L: 15, W: 11, H: 5.5, R: 3, wall: P.wood, roof: tin }, P); }
        else tent(-2, -2, .2, 11, 8, 5.6, canvasC);
        v99Crates(...at(7, 6), 3, rnd); flag = at(-9, 7); break;
      }
    }
    v99Flag(flag[0], flag[1], ftop, b.team);
    if (b.hp / b.maxHp < .5) for (let k = 0; k < 3; k++) { const px = x + (v99h(b.c, b.r, k) - .5) * 10, py = y - 12 - k * 5, rr = 4 + k * 1.5; const gr = ctx.createRadialGradient(px, py, 1, px, py, rr); gr.addColorStop(0, 'rgba(40,40,42,.5)'); gr.addColorStop(1, 'rgba(40,40,42,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(px, py, rr, 0, 6.3); ctx.fill(); }
  }
  
  /* drawBuildingShape: layer moved to js/chains/drawBuildingShape.js */
  function v99Bunker__base(b) {
    const { x, y } = getHexCenter(b.c, b.r), win = !!(v99G.info && v99G.info.winter), mg = b.type === 'mg';
    ctx.save();
    v99Sandbags(x, y, 11, .3, 2.9, 2);
    const oct = Array.from({ length: 8 }, (_, k) => [Math.cos(k * Math.PI / 4 + .39) * 7, Math.sin(k * Math.PI / 4 + .39) * 7]);
    v99CastShadow(ctx, x, y, 0, oct.map(p => [p[0] * .85, p[1] * .85, 4.5]), .3);
    v99Solid(ctx, x, y, 0, v99Prism(oct, 0, 4.5, .85), win ? [[224, 229, 233], [146, 146, 140]] : [146, 146, 140], .35);
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + .39 + Math.PI / 8, n = [Math.cos(a), Math.sin(a), .1], p0 = [Math.cos(a - .22) * 6.6, Math.sin(a - .22) * 6.6], p1 = [Math.cos(a + .22) * 6.6, Math.sin(a + .22) * 6.6];
      if (mg) v99Quad(ctx, x, y, 0, [[p0[0], p0[1], 2.6], [p1[0], p1[1], 2.6], [p1[0], p1[1], 3.3], [p0[0], p0[1], 3.3]], n, 'rgba(14,16,18,.95)'); }
    if (!mg) { ctx.fillStyle = '#f2f2ee'; ctx.fillRect(x - 2.4, y - 6.4, 4.8, 3.2); ctx.fillStyle = '#c62828'; ctx.fillRect(x - .6, y - 6.2, 1.2, 2.8); ctx.fillRect(x - 1.9, y - 5.4, 3.8, 1.2); }
    v99Flag(...(() => { const o = isoD(-6, 6); return [x + o.x, y + o.y]; })(), 12, b.team, .8);
    ctx.save(); ctx.translate(x, y + 7); ctx.scale(1 / Math.max(1, zoom), 1 / Math.max(1, zoom)); plate(0, 0, 18, 7, 1.5); ctx.fillStyle = 'rgba(10,15,20,.82)'; ctx.fill(); ctx.strokeStyle = b.team === 'blue' ? '#38bdf8' : '#f87171'; ctx.lineWidth = .8; ctx.stroke();
    ctx.fillStyle = '#e5e7eb'; ctx.font = 'bold 5.5px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(mg ? 'MG' : 'MED', 0, .3); ctx.restore();
    ctx.restore();
  }
  function v99Mine(x, y) {
    if (!V99.on) { ctx.fillStyle = '#f87171'; ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center'; ctx.fillText('✕MN', x - 7, y - 7); return; }
    const px = x - 7, py = y - 2; ctx.save(); ctx.strokeStyle = '#4a3b2e'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py - 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px - 3.2, py - 7.5); ctx.lineTo(px + 3.2, py - 7.5); ctx.lineTo(px, py - 12.4); ctx.closePath(); ctx.fillStyle = '#f4f1e6'; ctx.fill(); ctx.strokeStyle = '#c62828'; ctx.lineWidth = .8; ctx.stroke();
    ctx.fillStyle = '#c62828'; ctx.font = 'bold 3.4px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('M', px, py - 9); ctx.restore();
  }

  // outermost render wrapper: flush any pending highlight batch
  {  /* render: layer moved to js/chains/render.js */ }

  // settings: realistic map on/off · hex grid on/off
  { const tb = document.getElementById('v99-ter-btn'), gb = document.getElementById('v99-grid-btn');
    if (tb) tb.addEventListener('click', () => { V99.on = !V99.on; tb.textContent = '지형 표현: ' + (V99.on ? '사실적' : '헥스 타일'); render(); });
    if (gb) gb.addEventListener('click', () => { showGrid = !showGrid; gb.textContent = '헥스 격자: ' + (showGrid ? '표시' : '숨김'); render(); }); }

