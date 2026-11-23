  // ══════════════════════════════════════════════════════════════
  // [17z] v137 — continuous ground height: slopes instead of cliff steps, hillshade, varied relief
  //   · every hex has a visual height (its elevation level; water sits lower, rock banks higher); the heights are laid on a
  //     half-hex grid in flat coordinates and blurred, so a one-level step becomes a slope about one hex wide. Rules keep
  //     reading the integer elevation (sight, high-ground fire); climbing costs nothing extra since v136.
  //   · ground painter: every 4 px node solves where its screen point meets the raised surface (fixed-point, 4 steps), pixels
  //     interpolate between nodes; the slope normal gives the hillshade. No plateau layers and no cliff faces any more.
  //   · hex centres (units, buildings, zones), road / hedge / fence lines and sector borders sit on the same surface
  // ══════════════════════════════════════════════════════════════
  var V137 = { grid: null, hc: null, ver: 0, key: '', step: HEX_RADIUS / 2, blur: 3, shade: 3.2 };
  function v137HexAt(fx, fy) {
    const R = HEX_RADIUS, px = fx - ORIGIN_X, py = fy - ORIGIN_Y, q = (0.5773502691896258 * px - py / 3) / R, rr = (2 / 3) * py / R, s = -q - rr;
    let rq = Math.round(q), r2 = Math.round(rr); const rs = Math.round(s), dq = Math.abs(rq - q), dr = Math.abs(r2 - rr), ds = Math.abs(rs - s);
    if (dq > dr && dq > ds) rq = -r2 - rs; else if (dr > ds) r2 = -rq - rs;
    return [rq + ((r2 - (r2 & 1)) >> 1), r2];
  }
  function v137HexH(c, r) {
    c = Math.max(0, Math.min(COLS - 1, c)); r = Math.max(0, Math.min(ROWS - 1, r));
    const t = terrainMap[c + ',' + r]; if (!t) return 0; if (t.vh !== undefined) return t.vh;
    if (t.terrainType === 'deep_water') return -.6; if (t.terrainType === 'shallow_water') return -.42;
    return t.elevation | 0;
  }
  function v137Build() {
    const R = HEX_RADIUS, w = Math.sqrt(3) * R, st = V137.step, x0 = ORIGIN_X - w * 1.5, y0 = ORIGIN_Y - R * 2, nx = Math.ceil((COLS + 2) * w / st) + 2, ny = Math.ceil((ROWS * 1.5 + 4) * R / st) + 2;
    let g = new Float32Array(nx * ny);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const [c, r] = v137HexAt(x0 + i * st, y0 + j * st); g[j * nx + i] = v137HexH(c, r); }
    // separable box blur ×2 ≈ gaussian, radius V137.blur nodes
    const B = V137.blur, tmp = new Float32Array(nx * ny);
    for (let pass = 0; pass < 2; pass++) {
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { let s = 0, n = 0; for (let k = -B; k <= B; k++) { const ii = i + k; if (ii < 0 || ii >= nx) continue; s += g[j * nx + ii]; n++; } tmp[j * nx + i] = s / n; }
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { let s = 0, n = 0; for (let k = -B; k <= B; k++) { const jj = j + k; if (jj < 0 || jj >= ny) continue; s += tmp[jj * nx + i]; n++; } g[j * nx + i] = s / n; }
    }
    V137.grid = { g, nx, ny, x0, y0, st };
    const hc = new Float32Array(COLS * ROWS);
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const t = terrainMap[c + ',' + r]; hc[r * COLS + c] = t && t.vfix ? v137HexH(c, r) : v137H(ORIGIN_X + c * w + (r % 2) * w / 2, ORIGIN_Y + r * 1.5 * R); }
    V137.hc = hc; V137.key = COLS + 'x' + ROWS + '|' + OFFX + '|' + OFFY; V137.ver++;
  }
  function v137H(fx, fy) {
    const G = V137.grid; if (!G) return 0;
    let u = (fx - G.x0) / G.st, v = (fy - G.y0) / G.st; u = Math.max(0, Math.min(G.nx - 1.001, u)); v = Math.max(0, Math.min(G.ny - 1.001, v));
    const i = u | 0, j = v | 0, a = u - i, b = v - j, k = j * G.nx + i, g = G.g;
    return (g[k] * (1 - a) + g[k + 1] * a) * (1 - b) + (g[k + G.nx] * (1 - a) + g[k + G.nx + 1] * a) * b;
  }
  const v137On = () => !!(V137.grid && V99 && V99.on && V137.key === COLS + 'x' + ROWS + '|' + OFFX + '|' + OFFY);
  const v137P = (fx, fy) => v99Proj(fx, fy, v137H(fx, fy) * LIFT);

  // hex centres on the surface
  { 
    /* getHexCenter: layer moved to js/chains/getHexCenter.js */ }
  // the height grid is rebuilt with the ground canvas
  {  /* v99Build: layer moved to js/chains/v99Build.js */ }

  // road / hedge / fence lines in flat coordinates, every point raised to the surface
  { 
    /* v99HexLines: layer moved to js/chains/v99HexLines.js */ }

  // repaint: one surface, all props, no plateau layers
  { 
    /* v99Repaint: layer moved to js/chains/v99Repaint.js */ }

  // Faymonville relief: hills and ridges (levels 1–2), the river below its banks, rocky banks beside the bridge, a flat bridge deck
  { 
    /* loadFaymonville: layer moved to js/chains/loadFaymonville.js */ }
  /* v99Paint: layer moved to js/chains/v99Paint.js */
