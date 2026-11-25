  // [chain:v99Paint] 1 layer; the original in [17g] and older layers were dead code and are removed.
  //   Call order, outermost first: v99Paint
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v99Paint: from [17z], does NOT call the layer below
  function v99Paint(img, W, H, rx0, ry0, gs, L, info) {
    const d = img.data, R = HEX_RADIUS, w3 = Math.sqrt(3) * R, N = v99N, T = info.T, C = info.C, X = info.X, HH = info.H, pal = info.pal, win = info.winter;
    const fxA = ORIGIN_X - w3 / 2, fxB = ORIGIN_X + COLS * w3, fyA = ORIGIN_Y - R, fyB = ORIGIN_Y + (ROWS - 1) * 1.5 * R + R, FADE = 18;
    const ll = Math.hypot(V99L[0], V99L[1]), lx = V99L[0] / ll * 2.6, ly = V99L[1] / ll * 2.6, soil = pal.soil, grass = pal.grass;
    const hexAt = (x, y) => {
      const px = x - ORIGIN_X, py = y - ORIGIN_Y, q = (0.5773502691896258 * px - py / 3) / R, rr = (2 / 3) * py / R, s = -q - rr;
      let rq = Math.round(q), r2 = Math.round(rr); const rs = Math.round(s), dq = Math.abs(rq - q), dr = Math.abs(r2 - rr), ds = Math.abs(rs - s);
      if (dq > dr && dq > ds) rq = -r2 - rs; else if (dr > ds) r2 = -rq - rs;
      let col = rq + ((r2 - (r2 & 1)) >> 1), row = r2;
      if (row < 0) row = 0; else if (row >= ROWS) row = ROWS - 1;
      if (col < 0) col = 0; else if (col >= COLS) col = COLS - 1;
      return row * COLS + col;
    };
    // low-frequency fields on a 4 px grid (bilinear) — they only vary over tens of world units
    const S = 4, gw = Math.ceil(W / S) + 2, gh = Math.ceil(H / S) + 2, A1 = new Float32Array(gw * gh), A2 = new Float32Array(gw * gh), A3 = new Float32Array(gw * gh), WT = !win && v136Water(), A4 = WT ? new Float32Array(gw * gh) : null, A5 = WT ? new Float32Array(gw * gh) : null, WC = V136_WCOL, wcol = [0, 0, 0];
    const HV = v137On(), GX = new Float32Array(gw * gh), GY = new Float32Array(gw * gh), GSH = new Float32Array(gw * gh), GST = new Float32Array(gw * gh), Ln = Math.hypot(V99L[0], V99L[1], V99L[2]), lam0 = V99L[2] / Ln;
    for (let gj = 0; gj < gh; gj++) { const ry = ry0 + (gj * S + .5) / gs - OFFY; for (let gi = 0; gi < gw; gi++) { const dx = rx0 + (gi * S + .5) / gs - OFFX, q = gj * gw + gi; let h = HV ? 0 : L, fx = 0, fy = 0;
      for (let it = 0; it < (HV ? 5 : 1); it++) { const yr = (ry + h * LIFT * HZ) / TILT; fx = dx * COSA + yr * SINA; fy = -dx * SINA + yr * COSA; if (HV) h = v137H(fx, fy); }   // v137: where this screen point meets the raised ground
      GX[q] = fx; GY[q] = fy; let sh = 1, sl = 0;
      if (HV) { const e = 5, kx = (v137H(fx + e, fy) - v137H(fx - e, fy)) / (2 * e) * LIFT, ky = (v137H(fx, fy + e) - v137H(fx, fy - e)) / (2 * e) * LIFT, ex = kx * V137.shade, ey = ky * V137.shade, nl = Math.hypot(ex, ey, 1), lam = (-ex * V99L[0] - ey * V99L[1] + V99L[2]) / (nl * Ln); sh = 1 + (lam - lam0) * 1.6; sl = Math.hypot(kx, ky); }
      GSH[q] = Math.max(V137.shMin || 0, Math.min(V137.shMax || 9, sh)); GST[q] = sl;   // v154: clamped, no black slopes
      A1[q] = N(fx * .045, fy * .045); A2[q] = N(fx * .045 + 37.1, fy * .045 + 11.7); A3[q] = N(fx * .013 + 71, fy * .013 + 3); if (WT) { WT.at(fx, fy); A4[q] = WT._d; A5[q] = WT._a; } } }
    for (let j = 0; j < H; j++) {
      const gj = (j / S) | 0, v = (j - gj * S) / S;
      for (let i = 0; i < W; i++) {
        const gi = (i / S) | 0, u = (i - gi * S) / S, q0 = gj * gw + gi, q1 = q0 + gw, w00 = (1 - u) * (1 - v), w10 = u * (1 - v), w01 = (1 - u) * v, w11 = u * v, o = (j * W + i) * 4;
        const fx = GX[q0] * w00 + GX[q0 + 1] * w10 + GX[q1] * w01 + GX[q1 + 1] * w11, fy = GY[q0] * w00 + GY[q0 + 1] * w10 + GY[q1] * w01 + GY[q1 + 1] * w11;
        const n1 = A1[q0] * w00 + A1[q0 + 1] * w10 + A1[q1] * w01 + A1[q1 + 1] * w11, n2 = A2[q0] * w00 + A2[q0 + 1] * w10 + A2[q1] * w01 + A2[q1 + 1] * w11;
        const out0 = Math.max(fxA - fx, fx - fxB, fyA - fy, fy - fyB) + (n1 - .5) * 16;
        if (out0 > FADE) { d[o + 3] = 0; continue; }
        const m1 = N(fx * .17 + 5.3, fy * .17), m2 = N(fx * .17, fy * .17 + 9.1);
        const wx = fx + (n1 - .5) * 15 + (m1 - .5) * 5, wy = fy + (n2 - .5) * 15 + (m2 - .5) * 5;
        const h = hexAt(wx, wy), det = N(fx * .42, fy * .42 + 51); let tx = X[h];
        let r = C[h * 3], g = C[h * 3 + 1], b = C[h * 3 + 2];
        const big = A3[q0] * w00 + A3[q0 + 1] * w10 + A3[q1] * w01 + A3[q1 + 1] * w11;
        let wet = 0, wmix = 0;
        if (WT) {   // v136: water from the vector shapes
          const sd = A4[q0] * w00 + A4[q0 + 1] * w10 + A4[q1] * w01 + A4[q1 + 1] * w11 + (n1 - .5) * 14 + (m1 - .5) * 2.5;
          if (sd < 1.3) {
            const dep = Math.min(1, -sd / WC.depth), sm = dep * dep * (3 - 2 * dep), an = A5[q0];
            let wr = WC.sh[0] + (WC.dp[0] - WC.sh[0]) * sm, wg = WC.sh[1] + (WC.dp[1] - WC.sh[1]) * sm, wb = WC.sh[2] + (WC.dp[2] - WC.sh[2]) * sm, kk = 1 + (big - .5) * .06;
            if (an < 9) { const ca = Math.cos(an), sa = Math.sin(an), al = fx * ca + fy * sa, ac = -fx * sa + fy * ca, st = N(al * .045 + 3, ac * .32); if (st > .7) kk += (st - .7) * .32; kk += Math.sin(al * .25 + n1 * 6) * .018; }
            else kk += (N(fx * .06, fy * .06) - .5) * .05;
            const gl = N(fx * .23 + 17, fy * .23); if (gl > .86) kk += (gl - .86) * 1.1;
            if (sd > -WC.foam) { const f = (1 + sd / WC.foam) * (.3 + .5 * N(fx * .15, fy * .15)); wr += (WC.fo[0] - wr) * f; wg += (WC.fo[1] - wg) * f; wb += (WC.fo[2] - wb) * f; }
            kk += (v99h(i, j, L + 3) - .5) * .02;
            if (sd < -1.3) { d[o] = wr * kk; d[o + 1] = wg * kk; d[o + 2] = wb * kk; d[o + 3] = out0 > 0 ? 255 * (1 - out0 / FADE) : 255; continue; }
            wmix = (1.3 - sd) / 2.6; wcol[0] = wr * kk; wcol[1] = wg * kk; wcol[2] = wb * kk;   // anti-aliased shore: blended with the land colour below
          }
          if (T[h] === 'deep_water' || T[h] === 'shallow_water') { const lg = pal.g.plains; r = lg[0] * .8 + soil[0] * .2; g = lg[1] * .8 + soil[1] * .2; b = lg[2] * .8 + soil[2] * .2; tx = 0; }
          if (sd < WC.band) wet = 1 - sd / WC.band;
        }
        {   // v136: soft edges — average with three jittered neighbours
          let sr = r * .4, sg = g * .4, sb = b * .4; const a0 = det * 6.283;
          for (let t = 0; t < 3; t++) { const a = a0 + t * 2.094, hk = hexAt(wx + Math.cos(a) * 7, wy + Math.sin(a) * 7), wk = WT && (T[hk] === 'deep_water' || T[hk] === 'shallow_water');
            sr += (wk ? r : C[hk * 3]) * .2; sg += (wk ? g : C[hk * 3 + 1]) * .2; sb += (wk ? b : C[hk * 3 + 2]) * .2; }
          r = sr; g = sg; b = sb;
        }
        let k = 1 + (big - .5) * .2 + (det - .5) * V99TXA[tx];
        if (tx === 0) {                                                        // meadow: dry / trampled patches
          const p = N(fx * .021 + 9, fy * .021 + 4), t = p > .55 ? Math.min(1, (p - .55) * 3) * (win ? .28 : .45) : 0;
          if (t) { r += (grass[0] - r) * t; g += (grass[1] - g) * t; b += (grass[2] - b) * t; }
        } else if (tx === 1) {                                                 // ploughed field (furrows show through the snow in patches)
          const th = .78 + (N(fx * .0025 + 7, fy * .0025) - .5) * .5, sn = Math.sin((fx * Math.cos(th) + fy * Math.sin(th)) * 1.35 + (m2 - .5) * .35);
          if (win) { const t = sn > .62 ? (sn - .62) * .45 * Math.max(0, Math.min(1, (n2 - .28) * 2.6)) : 0; r += (soil[0] - r) * t; g += (soil[1] - g) * t; b += (soil[2] - b) * t; }
          else k *= 1 + sn * .06;
        } else if (tx === 2) {                                                 // cobbles
          const cy = fy / 2.3, rowi = Math.floor(cy), cx = fx / 2.6 + (rowi & 1) * .5, coli = Math.floor(cx), u = cx - coli, v = cy - rowi;
          k *= .92 + .14 * v99h(coli, rowi, 7); if (u < .12 || v < .15) k *= .84;
        } else if (tx === 3) {                                                 // deep water
          k += Math.sin(fx * .32 + n1 * 9) * .025 + (N(fx * .07, fy * .45) > .8 ? .07 : 0);
        } else if (tx === 4) {
          k += (det - .5) * .05 + (N(fx * .09, fy * .5) > .82 ? .06 : 0);
        } else if (tx === 5) {                                                 // ice: cracks + wind streaks
          if (Math.abs(N(fx * .06 + 13, fy * .06) - .5) < .017) k *= .84;
          k += (N(fx * .02, fy * .09) - .5) * .1;
        } else if (tx === 6) {
          k *= .9 + det * .14;
        } else if (tx === 7) {
          k = 1 + (big - .5) * .08 + (det - .5) * .03 + Math.sin(fx * .21 + fy * .07 + n1 * 5) * .012;
        } else if (tx === 8) {
          k += Math.sin(fx * .5 + fy * .2 + n1 * 6) * .04;
        } else if (tx === 9) {                                                 // churned track: wheel ruts + puddles
          k *= 1 + Math.sin((fx * .72 + fy * .69) * 1.1 + (m1 - .5) * 5) * .035; if (N(fx * .08 + 4, fy * .08) > .74) k *= .86;
        } else if (tx === 10) {                                                // v149 vineyard rows: leafy rows over bare soil, one direction map-wide
          const sn = Math.sin((fx * .62 + fy * .79) * .52 + (m2 - .5) * .6);
          if (sn > .25) { const t = Math.min(1, (sn - .25) * 2.2) * .6; r += (52 - r) * t; g += (78 - g) * t; b += (36 - b) * t; k *= .94 + det * .1; }
          else { r += (soil[0] - r) * .38; g += (soil[1] - g) * .38; b += (soil[2] - b) * .38; }
        } else if (tx === 11) {                                                // v149 garden bed: dark soil patches + flower speckles
          if (N(fx * .09 + 3, fy * .09 + 8) > .58) { r += (soil[0] - r) * .4; g += (soil[1] - g) * .4; b += (soil[2] - b) * .4; }
          const fl = N(fx * .55 + 17, fy * .55 + 4);
          if (fl > .7) { const pk = v99h(Math.floor(fx * .25), Math.floor(fy * .25), 9), col = pk < .3 ? [204, 70, 58] : pk < .55 ? [226, 196, 76] : pk < .8 ? [150, 108, 196] : [232, 228, 218], t = Math.min(1, (fl - .7) * 5) * .8;
            r += (col[0] - r) * t; g += (col[1] - g) * t; b += (col[2] - b) * t; k = 1; }
        }
        const h2 = hexAt(wx + lx, wy + ly); if (!WT) k -= (HH[h2] - HH[h]) * .07; else { const rel = q => (T[q] === 'deep_water' || T[q] === 'shallow_water') ? 0 : HH[q]; k -= (rel(h2) - rel(h)) * .07; }          // relief: banks shade toward the light
        k += (v99h(i, j, L + 3) - .5) * .035;
        if (HV) {   // v137: hillshade, bare rock / soil on steep slopes
          k *= GSH[q0] * w00 + GSH[q0 + 1] * w10 + GSH[q1] * w01 + GSH[q1 + 1] * w11;
          const sl = GST[q0] * w00 + GST[q0 + 1] * w10 + GST[q1] * w01 + GST[q1 + 1] * w11;
          if (sl > .22) { const t = Math.min(1, (sl - .22) * 2.2) * (.55 + .45 * det), cc = sl > .42 ? pal.cliff : soil; r += (cc[0] - r) * t; g += (cc[1] - g) * t; b += (cc[2] - b) * t; }
        }
        if (wet) { const t = wet * wet; r += (WC.bank[0] - r) * t * .85; g += (WC.bank[1] - g) * t * .85; b += (WC.bank[2] - b) * t * .85; k *= 1 - .12 * wet; }   // v136: wet pebble band
        d[o] = r * k; d[o + 1] = g * k; d[o + 2] = b * k; if (wmix) { d[o] += (wcol[0] - d[o]) * wmix; d[o + 1] += (wcol[1] - d[o + 1]) * wmix; d[o + 2] += (wcol[2] - d[o + 2]) * wmix; } d[o + 3] = out0 > 0 ? 255 * (1 - out0 / FADE) : 255;
      }
    }
  }


