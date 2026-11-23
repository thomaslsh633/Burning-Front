    // ---------- GMC CCKW-353 2½-ton 6×6 cargo with bows and tarpaulin — supplied line drawing + colour 5-view + 3D render (6.44 × 2.24 × 2.77 m, wheelbase 4.17, bogie 1.12) ----------
    function buildCCKW(paint) {
      const P = PAINT[paint] || PAINT.olive, M = new Mesh(), K = v112Mats(M, P), L = (ax, o, prof, seg, m) => M.lathe(ax, o, prof, seg, m);
      const FA = 2.42, R1 = -1.19, R2 = -2.31, WR = .47;
      for (const sy of [-1, 1]) M.box(-3.20, 3.05, sy * .45 - .05, sy * .45 + .05, .56, .78, K.dark);
      L('y', [FA, -.80, WR], [[0, 0], [0, .06], [1.60, .06], [1.60, 0]], 8, K.dark); M.box(FA - .12, FA + .12, -.30, .30, .40, .58, K.dark);
      for (const sy of [-1, 1]) v5Tyre(M, FA, sy * .82, WR, WR, .25, sy, K.tyre, K.wheel, K.dark, 22);
      for (const ax of [R1, R2]) { L('y', [ax, -.95, WR], [[0, 0], [0, .07], [1.90, .07], [1.90, 0]], 8, K.dark); M.box(ax - .16, ax + .16, -.32, .32, .34, .62, K.dark);
        for (const sy of [-1, 1]) { v5Tyre(M, ax, sy * .93, WR, WR, .24, sy, K.tyre, K.wheel, K.dark, 22); v5Tyre(M, ax, sy * .67, WR, WR, .24, -sy, K.tyre, K.wheel, K.dark, 22); } }
      for (const sy of [-1, 1]) M.box(R2 - .20, R1 + .20, sy * .78 - .06, sy * .78 + .06, .56, .66, K.dark);                 // bogie springs
      // front bumper, grille with brush guard, hood, front fenders with headlights, running boards
      M.box(3.08, 3.22, -1.0, 1.0, .58, .78, K.hull);
      M.box(2.94, 3.02, -.42, .42, .78, 1.55, K.dark); for (let k = 0; k < 10; k++) { const yy = -.36 + k * .08; M.box(3.02, 3.04, yy - .02, yy + .02, .82, 1.50, K.grille); }
      for (let k = 0; k < 4; k++) { const zz = .85 + k * .20; v5Rod(M, [3.08, -.44, zz], [3.08, .44, zz], .015, K.dark, 4); }
      v5Loft(M, [[2.98, [[-.44, 1.02], [-.44, 1.52], [-.36, 1.62], [.36, 1.62], [.44, 1.52], [.44, 1.02]]], [1.42, [[-.50, 1.02], [-.50, 1.62], [-.42, 1.72], [.42, 1.72], [.50, 1.62], [.50, 1.02]]]], K.hull);
      M.box(1.42, 2.94, -.44, .44, .72, 1.04, K.dark);                                                                       // engine bay
      for (const sy of [-1, 1]) { M.box(1.42, 2.94, sy > 0 ? .44 : -.52, sy > 0 ? .52 : -.44, .74, 1.10, K.hull);              // splash aprons under the hood
        M.box(1.40, 1.66, sy > 0 ? .50 : -1.08, sy > 0 ? 1.08 : -.50, .74, 1.10, K.hull); }                                // fender back panel behind the front wheel
      for (let k = 0; k < 10; k++) for (const sy of [-1, 1]) M.box(2.30 + k * .04, 2.32 + k * .04, sy > 0 ? .50 : -.505, sy > 0 ? .505 : -.50, 1.20, 1.50, K.dark);
      for (const sy of [-1, 1]) {
        const ya = sy > 0 ? .50 : -1.08, yb = sy > 0 ? 1.08 : -.50, prof = [[3.06, 1.02], [2.95, 1.18], [2.70, 1.24], [2.20, 1.24], [1.95, 1.14], [1.78, .95], [1.68, .76], [1.40, .74]];
        for (let i = 0; i + 1 < prof.length; i++) { const [xa, za] = prof[i], [xb, zb] = prof[i + 1]; M.hex8([[xa, ya, za], [xb, ya, zb], [xb, yb, zb], [xa, yb, za], [xa, ya, za - .03], [xb, ya, zb - .03], [xb, yb, zb - .03], [xa, yb, za - .03]], K.hull); }
        L('x', [2.86, sy * .75, 1.30], [[0, 0], [0, .09], [.06, .10], [.14, .10], [.16, .08], [.16, 0]], 14, K.dark); L('x', [3.02, sy * .75, 1.30], [[0, 0], [0, .08], [.006, .075], [.006, 0]], 14, K.glass);
        M.box(.30, 1.42, sy > 0 ? .60 : -1.08, sy > 0 ? 1.08 : -.60, .72, .75, K.hull);
      }
      // closed cab: cowl, windshield (two panes), doors with windows, roof, back with window; dash, wheel
      v5Loft(M, [[1.42, [[-1.0, .76], [-1.0, 1.70], [1.0, 1.70], [1.0, .76]]], [1.30, [[-1.0, .76], [-1.0, 1.74], [1.0, 1.74], [1.0, .76]]]], K.hull);
      for (const yy of [-.48, .48]) { v5Slab(M, [[1.30, yy - .42, 1.76], [1.30, yy + .42, 1.76], [1.18, yy + .42, 2.25], [1.18, yy - .42, 2.25]], [-.01, 0, 0], K.glass); }
      v5Rod(M, [1.30, 0, 1.74], [1.18, 0, 2.27], .03, K.hull, 5); for (const sy of [-1, 1]) v5Rod(M, [1.30, sy * .99, 1.74], [1.18, sy * .99, 2.27], .04, K.hull, 5);
      v5Loft(M, [[1.20, [[-1.0, 2.25], [-.92, 2.34], [.92, 2.34], [1.0, 2.25]]], [.32, [[-1.0, 2.25], [-.92, 2.36], [.92, 2.36], [1.0, 2.25]]]], K.hull);
      for (const sy of [-1, 1]) {
        M.box(.32, 1.30, sy > 0 ? .97 : -1.0, sy > 0 ? 1.0 : -.97, .76, 1.78, K.hull);
        M.box(.40, 1.12, sy > 0 ? .985 : -1.005, sy > 0 ? 1.005 : -.985, 1.80, 2.22, K.glass); v5Poly(M, [[.38, sy * .995, 1.78], [.38, sy * .995, 2.24], [1.16, sy * .995, 2.24]], .02, K.hull, 4);
        v5Poly(M, [[.40, sy * 1.005, .80], [1.16, sy * 1.005, .80], [1.16, sy * 1.005, 1.76]], .012, K.dark, 4); M.box(.90, 1.0, sy > 0 ? 1.0 : -1.03, sy > 0 ? 1.03 : -1.0, 1.40, 1.44, K.dark);
        L('z', [1.32, sy * 1.12, 1.95], [[0, 0], [0, .012], [.25, .012], [.25, 0]], 6, K.dark); M.box(1.30, 1.34, sy * 1.12 - .07, sy * 1.12 + .07, 2.12, 2.32, K.glass);
      }
      M.box(.30, .34, -1.0, 1.0, .76, 2.30, K.hull); M.box(.295, .30, -.40, .40, 1.85, 2.15, K.glass);
      v5Rod(M, [1.22, .45, 1.55], [.95, .45, 1.68], .02, K.black, 5); L('z', [.94, .45, 1.68], [[0, .18], [0, .20], [.02, .20], [.02, .18]], 18, K.black);
      // spare wheel behind the cab (left), fuel tank (right), tool box
      L('y', [.05, .78, 1.55], [[-.12, 0], [-.12, .47, K.tyre], [.12, .47, K.tyre], [.12, 0]], 22, K.tyre); L('y', [.05, .91, 1.55], [[0, 0], [0, .24], [.01, .22], [.01, 0]], 14, K.wheel);
      L('x', [-.10, -.86, .95], [[0, 0], [0, .22], [.70, .22], [.70, 0]], 16, K.dark); M.box(-.80, -.20, .85, 1.05, .78, 1.05, K.dark);
      // cargo bed: floor, slatted sides with stakes, fenders over the rear wheels, tail gate, tarpaulin over bows
      const B0 = .26, B1 = -3.22, BF = 1.22, BS = 1.82, BWd = 1.11;
      M.box(B1, B0, -BWd, BWd, BF - .08, BF, K.wood);
      for (const sy of [-1, 1]) { M.box(B1, B0, sy > 0 ? BWd - .04 : -BWd, sy > 0 ? BWd : -BWd + .04, BF, BS, K.hull); for (let k = 0; k < 6; k++) { const x = B0 - .10 - k * .66; M.box(x - .05, x + .05, sy > 0 ? BWd : -BWd - .03, sy > 0 ? BWd + .03 : -BWd, BF - .05, BS, K.dark); }
        M.box(R2 - .55, R1 + .55, sy > 0 ? .55 : -BWd, sy > 0 ? BWd : -.55, 1.05, 1.08, K.hull); }
      M.box(B0 - .04, B0, -BWd, BWd, BF, BS, K.hull); M.box(B1, B1 + .04, -BWd, BWd, BF - .10, BS - .25, K.hull);
      for (const sy of [-1, 1]) L('x', [B1, sy * .90, BF - .02], [[0, 0], [0, .05], [-.04, .05], [-.04, 0]], 10, K.lamp);
      const bow = (x, sag) => [x, [[-BWd - .02, BS - .05], [-BWd - .02, 2.40 - sag], [-.86, 2.66 - sag], [-.45, 2.76 - sag], [.45, 2.76 - sag], [.86, 2.66 - sag], [BWd + .02, 2.40 - sag], [BWd + .02, BS - .05]]];
      const tarp = [bow(B0 + .02, 0)]; for (let k = 1; k < 10; k++) { const x = B0 - (B0 - B1) * k / 10; tarp.push(bow(x, k % 2 ? .035 : 0)); } tarp.push(bow(B1 - .02, 0));
      v5Loft(M, tarp, K.canvas, true, false);
      M.box(B1 - .03, B1 - .01, -BWd, BWd, BS - .2, 2.40, K.canvas);                                                         // rear flap (rolled down)
      for (let k = 0; k < 5; k++) { const x = B0 - .30 - k * .80; v5Rod(M, [x, -BWd - .03, BS], [x, -BWd - .03, 2.30], .01, K.dark, 4); v5Rod(M, [x, BWd + .03, BS], [x, BWd + .03, 2.30], .01, K.dark, 4); }
      return M;
    }

    // ---------- M3 half-track ambulance: the M3 body under a tarpaulin on bows from the windshield back, red crosses on white panels ----------
    function buildM3Amb(paint) {
      const M = buildM3HT(paint, 'amb'), K = v112Mats(M, PAINT[paint] || PAINT.olive), BW = .98, ZT = 1.87, X0 = .86, X1 = -2.75;
      const sec = (x, s) => [x, [[-BW - .02, ZT - .02], [-BW - .02, 2.20 - s], [-.80, 2.33 - s], [.80, 2.33 - s], [BW + .02, 2.20 - s], [BW + .02, ZT - .02]]];
      const st = [sec(X0, 0)]; for (let k = 1; k < 8; k++) st.push(sec(X0 + (X1 - X0) * k / 8, k % 2 ? .03 : 0)); st.push(sec(X1 - .02, 0));
      v5Loft(M, st, K.canvas);
      for (let k = 0; k < 6; k++) { const x = X0 - .25 - k * .62; for (const sy of [-1, 1]) v5Rod(M, [x, sy * (BW + .035), ZT - .05], [x, sy * (BW + .035), 2.12], .01, K.dark, 4); }
      v112AmbMarks(M);
      return M;
    }
    // decals for the ambulance after the stars (both need the finished hull)
    function v112AmbMarks(M) {
      const nT = M.M.length;
      for (const sy of [-1, 1]) v112RedCross(M, nT, [-2.05, sy * 6, 2.08], [0, -sy, 0], .20, [0, 0, 1]);
      v112RedCross(M, nT, [-8, 0, 2.05], [1, 0, 0], .20, [0, 0, 1]);
      v112RedCross(M, nT, [1.85, 0, 6], [0, 0, -1], .26, [1, 0, 0]);
    }

    // ══════════════════════════════════════════════════════════════
    // v115 — U.S. crew-served weapons measured on the supplied drawings, with their crews, and the M7 Priest
    //   v116: full crews (MG / mortar 4, 57 mm and pack howitzer 5, 3-inch 6), 57 mm tube 3.0 m, 105 mm and 3-inch recoil system / split shield after the photos
    //   gun models: X forward, Y left, Z up, origin on the ground under the axle (towed guns), the tripod head (MGs) or the base plate (mortar)
    // ══════════════════════════════════════════════════════════════
    { const KN = V7POSES.kneel, EL = [[-.3, -.9, -1], [-.3, .9, -1]];
      const kn = (name, hands, pitch) => { V7POSES[name] = Object.assign({}, KN, { aim: false, twist: -.08, hands, el: EL, head: [.05, 0, .14], pitch: pitch == null ? .1 : pitch }); };
      const st = (name, hands, lean) => { V7POSES[name] = Object.assign({}, V7STAND, { lean: lean == null ? .06 : lean, twist: 0, hands, el: EL, head: [.04, 0, .14], pitch: .06 }); };
      kn('kgun', [[.30, -.09, .80], [.32, .09, .84]]);                 // kneeling layer: hands on the sight / handwheel
      kn('kload', [[.30, -.06, .92], [.30, .08, .92]], .02);            // kneeling, a round held across the chest
      kn('kdrop', [[.52, -.05, 1.12], [.52, .07, 1.14]], -.15);          // kneeling, hanging a bomb over the mortar muzzle
      kn('kfeed', [[.42, -.04, .44], [.42, .10, .44]], .3);             // kneeling beside an MG, feeding the belt
      st('sload', [[.30, -.06, 1.08], [.30, .08, 1.08]]);              // standing loader with a round
      st('sgun', [[.34, -.10, .98], [.36, .10, 1.02]], .1);             // standing layer (M7)
      v112SeatPose('sit19', .14, [[.44, -.03, .27], [.58, .09, .29]], .52, .14);   // seated behind the M1919A4: pistol grip + T&E wheel
      v112SeatPose('sit50', .14, [[.44, -.08, .37], [.44, .08, .37]], .52, .14);   // seated behind the M2HB spade grips
      v112GunPose('sgun50', .42, 1.20);                                 // standing at the pulpit .50 (M7)
    }
    const v115Pt = (c, hx, hy, hz) => { const a = c.yaw || 0; return [c.x + hx * Math.cos(a) - hy * Math.sin(a), c.y + hx * Math.sin(a) + hy * Math.cos(a), (c.z || 0) + hz]; };
    // crew: [{ f: figure id, x, y, z, yaw, round: [hx, hz, len, r] (held across the body), box: [hx, hy] (ammo box on the ground) }], first n placed
    function v115Crew(M, K, crew, n) {
      const brass = M.mat([176, 138, 64], { spec: .5, noise: .3 });
      crew.slice(0, n).forEach(c => {
        v112Crew(M, V118DE.on ? (c.de || c.f.replace('us_carbine_', 'de_k98_')) : c.f, c.x, c.y, c.z || 0, c.yaw || 0);
        if (c.round) { const [hx, hz, len, r] = c.round, a = c.yaw || 0, d = [-Math.sin(a), Math.cos(a), 0], p = v115Pt(c, hx, -len * .55, hz), q = [p[0] + d[0] * len, p[1] + d[1] * len, p[2]];
          v5Rod(M, p, q, r, brass, 8); v5Rod(M, q, [q[0] + d[0] * len * .4, q[1] + d[1] * len * .4, q[2]], r * .82, K.gun, 8); }
        if (c.box) { const p = v115Pt(c, c.box[0], c.box[1], 0); M.box(p[0] - .13, p[0] + .13, p[1] - .06, p[1] + .06, 0, .18, K.gun); }
      });
    }
    // tapered box beam from a to b (width w0 → w1 horizontally, height h0 → h1 vertically)
    function v115Beam(M, a, b, h0, h1, w0, w1, m) {
      const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, s = [-dy / l, dx / l];
      const C = (p, w, h, i, j) => [p[0] + s[0] * w / 2 * i, p[1] + s[1] * w / 2 * i, p[2] + h / 2 * j];
      M.hex8([C(a, w0, h0, -1, -1), C(b, w1, h1, -1, -1), C(b, w1, h1, 1, -1), C(a, w0, h0, 1, -1), C(a, w0, h0, -1, 1), C(b, w1, h1, -1, 1), C(b, w1, h1, 1, 1), C(a, w0, h0, 1, 1)], m);
    }
    // split trail: hinge (y = ±hy), length, end height, section, spade at sd along the trail; rate = half-spread (0 = closed, travel)
    function v115Trails(M, K, hx, hy, hz, len, ez, h0, h1, w, sd, spH, spW, sp, lunette) {
      for (const sy of [-1, 1]) {
        const d = [-Math.cos(sp), sy * Math.sin(sp)], s = [-d[1], d[0]], H = [hx, sy * hy, hz], E = [hx + d[0] * len, sy * hy + d[1] * len, ez];
        v115Beam(M, H, E, h0, h1, w, w * .85, K.hull);
        const zA = hz + (ez - hz) * sd / len, x = hx + d[0] * sd, y = sy * hy + d[1] * sd, b = .14;
        v5Slab(M, [[x + s[0] * spW, y + s[1] * spW, zA], [x - s[0] * spW, y - s[1] * spW, zA], [x - s[0] * spW + d[0] * b, y - s[1] * spW + d[1] * b, zA - spH], [x + s[0] * spW + d[0] * b, y + s[1] * spW + d[1] * b, zA - spH]], [-d[0] * .03, -d[1] * .03, 0], K.hull);
        v5Rod(M, [E[0] - d[0] * .15, E[1] - d[1] * .15, ez + .06], [E[0] + d[0] * .20, E[1] + d[1] * .20, ez + .16], .022, K.dark, 5);   // handspike
        if (lunette && sy > 0) { v5Rod(M, [E[0], E[1], ez], [E[0] + d[0] * lunette[0], E[1] + d[1] * lunette[0], lunette[1]], .035, K.dark, 6);
          M.lathe('y', [E[0] + d[0] * (lunette[0] + .06), E[1] + d[1] * (lunette[0] + .06), lunette[1]], [[-.02, .03], [-.02, .07], [.02, .07], [.02, .03], [-.02, .03]], 12, K.dark); }
      }
    }
    const v115Elev = (M, t0, th, T) => v7Xf(M, t0, v7.ry(-th), T);
    function v116Spring(M, K, x, y, z0, z1, r) {
      M.lathe('z', [x, y, z0], [[0, 0], [0, r * .55], [z1 - z0, r * .55], [z1 - z0, 0]], 10, K.dark);
      for (let z = z0 + .03; z < z1 - .02; z += .045) M.lathe('z', [x, y, z], [[0, 0], [0, r], [.02, r], [.02, 0]], 10, K.dark);
    }
    function v116Jack(M, K, x, y, zAxle) {
      M.hex8([[x - .15, y - .13, 0], [x + .15, y - .13, 0], [x + .15, y + .13, 0], [x - .15, y + .13, 0], [x - .05, y - .05, .24], [x + .05, y - .05, .24], [x + .05, y + .05, .24], [x - .05, y + .05, .24]], K.hull);
      v5Rod(M, [x, y, .22], [x, y, zAxle - .04], .03, K.dark, 6);
    }

    // ---------- 57 mm Gun M1 on Carriage M1A1 — kit painting guide side / front (side 260 px/m, front 318 px/m, from the 6.00-16 combat tyres R .37) ----------
    // axle Z .37, track ±.78; shield: front plate X −.12 (centre ±.56, Z .39 → 1.30) with wings swept back to X −.52 (±.87, Z .89 → 1.30), apron ±.30 below;
    // gun on its trunnion (−.30, .94) at 11.3° as drawn: tube 3.0 m to 2.60 m ahead of the trunnion, breech block .43 m behind; split trails 3.0 m from Z .40, spades at 2.55 m
    function buildG57(paint, o = {}) {
      const P = PAINT[paint] || PAINT.olive, M = new Mesh(), K = v112Mats(M, P), L = (ax, oo, prof, seg, m) => M.lathe(ax, oo, prof, seg, m);
      const sp = o.spread == null ? .36 : o.spread, th = o.elev == null ? .197 : o.elev;
      for (const sy of [-1, 1]) { v5Tyre(M, 0, sy * .78, .37, .37, .20, sy, K.tyre, K.wheel, K.dark, 20); M.box(-.08, .08, sy > 0 ? .30 : -.68, sy > 0 ? .68 : -.30, .33, .41, K.dark); }
      L('y', [0, -.68, .37], [[0, 0], [0, .045], [1.36, .045], [1.36, 0]], 10, K.dark);
      M.box(-.42, .12, -.30, .30, .34, .62, K.hull); M.box(-.36, .04, -.22, .22, .62, .80, K.hull);
      for (const sy of [-1, 1]) { M.box(-.36, -.02, sy * .17 - .03, sy * .17 + .03, .80, 1.02, K.hull); M.box(-.16, .10, sy * .30 - .04, sy * .30 + .04, .10, .36, K.dark); }   // trunnion cheeks · folded firing jacks
      const SX = -.12, T = .014;
      v5Slab(M, [[SX, -.56, .39], [SX, .56, .39], [SX, .56, 1.30], [SX, -.56, 1.30]], [-T, 0, 0], K.hull);
      for (const sy of [-1, 1]) v5Slab(M, [[SX, sy * .56, .89], [-.52, sy * .87, .89], [-.52, sy * .87, 1.30], [SX, sy * .56, 1.30]], [-T * .7, -sy * T * .7, 0], K.hull);
      v5Slab(M, [[-.05, -.30, .08], [-.05, .30, .08], [-.05, .30, .39], [-.05, -.30, .39]], [-T, 0, 0], K.hull);
      for (const sy of [-1, 1]) M.box(SX - .02, SX, sy * .30 - .08, sy * .30 + .08, 1.12, 1.20, K.dark);
      v115Trails(M, K, -.35, .20, .40, 3.0, .29, .18, .13, .13, 2.55, .32, .17, sp, [.18, .32]);
      const t0 = M.M.length;
      M.box(-.83, -.40, -.13, .13, -.13, .13, K.gun);                                                                   // breech ring + block
      L('x', [-.40, 0, 0], [[0, 0], [0, .075], [.40, .07], [.42, .062], [2.69, .045], [2.71, .052], [2.82, .052], [2.82, 0]], 16, K.gun); v120Bore(M, K, 2.42, 0, 0, .057);   // v120: L/50 tube 2.82 m
      L('x', [-.45, 0, -.13], [[0, 0], [0, .06], [1.55, .055], [1.55, 0]], 14, K.dark);                              // recoil cylinder
      M.box(-.50, .62, -.10, .10, -.20, -.07, K.hull);                                                                 // cradle
      M.box(-.62, -.30, .14, .22, -.08, .12, K.dark); L('y', [-.48, .22, -.12], [[0, 0], [0, .09], [.02, .09], [.02, 0]], 14, K.dark);   // elevating gear, handwheel (left)
      M.box(-.40, -.20, .12, .18, .10, .22, K.dark); M.box(-.205, -.195, .13, .17, .16, .20, K.glass);                 // telescope
      v115Elev(M, t0, th, [-.30, 0, .94]);
      v115Crew(M, K, [{ f: 'us_carbine_kgun_light', x: -1.00, y: .62 }, { f: 'us_carbine_kload_light', x: -1.05, y: -.60, yaw: .2, round: [.30, .92, .42, .03] },
        { f: 'us_carbine_kload_light', x: -1.80, y: .98, yaw: -.3, round: [.30, .92, .42, .03] }, { f: 'us_carbine_kload_light', x: -1.80, y: -.98, yaw: .3, round: [.30, .92, .42, .03] },
        { f: 'us_carbine_sload_light', x: -1.55, y: .02, yaw: .1, round: [.30, 1.08, .42, .03] }], o.crew == null ? 5 : o.crew);
      return M;
    }

    // ---------- 3-inch Gun M5 on Carriage M6 — line 4-view (48.5 px/m: 7.0 m long, track 1.90, shield top 1.61) + War'tist side + ACE box art for the structure ----------
    // wheels 9.00-20 (R .515) on ±.95; sloped shield (bottom X .45 Z .74 → top X .12 Z 1.61), one wide plate each side of a ±.22 U notch for the cradle, over the wheels (±1.03) from Z 1.0;
    // trunnion (−.45, .95), gun laid 2.6° down; one heavy recoil cylinder above the tube to 1.59 m with its front collar, recuperator + front bearing block below;
    // tube to X 2.68, breech housing back to X −1.30; equilibrator springs in front of the axle; panoramic sight above the left shield half; trails 3.4 m, spades at 2.68 m
    function buildG3in(paint, o = {}) {
      const P = PAINT[paint] || PAINT.olive, M = new Mesh(), K = v112Mats(M, P), L = (ax, oo, prof, seg, m) => M.lathe(ax, oo, prof, seg, m);
      const sp = o.spread == null ? .38 : o.spread, th = o.elev == null ? -.045 : o.elev;   // laid 2.6° down, as in the War'tist profile
      for (const sy of [-1, 1]) { v5Tyre(M, 0, sy * .95, .515, .515, .24, sy, K.tyre, K.wheel, K.dark, 26); M.box(-.10, .10, sy > 0 ? .30 : -.84, sy > 0 ? .84 : -.30, .47, .56, K.dark); }
      L('y', [0, -.84, .515], [[0, 0], [0, .05], [1.68, .05], [1.68, 0]], 10, K.dark);
      M.box(-.60, .12, -.32, .32, .44, .66, K.hull); M.box(-.62, -.10, -.22, .22, .66, .76, K.hull);
      for (const sy of [-1, 1]) M.box(-.62, -.22, sy * .19 - .03, sy * .19 + .03, .74, 1.06, K.hull);                    // trunnion cheeks
      const sx = z => .45 - (z - .74) / .87 * .33, T = .014;
      for (const sy of [-1, 1]) {                                                                                        // shield (front 4-view): one wide plate per side of the U notch
        v5Slab(M, [[sx(.74), sy * .22, .74], [sx(.74), sy * .62, .74], [sx(1.61), sy * .62, 1.61], [sx(1.61), sy * .22, 1.61]], [-T, 0, 0], K.hull);
        v5Slab(M, [[sx(.74), sy * .62, .74], [sx(1.0), sy * .76, 1.0], [sx(1.0), sy * .62, 1.0]], [-T, 0, 0], K.hull);                  // step down to the wheel
        v5Slab(M, [[sx(1.0), sy * .62, 1.0], [sx(1.0), sy * 1.03, 1.0], [sx(1.50), sy * 1.03, 1.50], [sx(1.61), sy * .92, 1.61], [sx(1.61), sy * .62, 1.61]], [-T, 0, 0], K.hull);   // over the wheel
        for (const z of [.95, 1.30]) M.box(sx(z) - .03, sx(z) - .01, sy * .40 - .05, sy * .40 + .05, z, z + .05, K.dark);   // shield brackets
        v116Spring(M, K, .16, sy * .24, .52, .80, .045);                                                                // equilibrator springs
      }
      v5Slab(M, [[.30, -.42, .20], [.30, .42, .20], [.30, .42, .74], [.30, -.42, .74]], [-T, 0, 0], K.hull);              // lower shield
      v115Trails(M, K, -.45, .25, .45, 3.35, .25, .26, .20, .15, 2.68, .34, .22, sp, [.30, .50]);
      const t0 = M.M.length;
      M.box(-.85, -.42, -.16, .16, -.18, .20, K.gun);                                                                   // breech housing
      M.box(-.45, .22, -.16, .16, -.24, .30, K.hull);                                                                  // cradle / sleigh
      L('x', [-.42, 0, 0], [[0, 0], [0, .10], [.60, .095], [.62, .078], [3.33, .060], [3.35, .066], [3.40, .066], [3.40, 0]], 16, K.gun); v120Bore(M, K, 2.98, 0, 0, .0762);   // v120: L/45 tube 3.40 m
      L('x', [-.45, 0, .20], [[0, 0], [0, .092], [1.80, .092], [1.81, .108], [1.98, .108], [2.00, .075], [2.04, .075], [2.04, 0]], 16, K.gun);   // recoil cylinder above, front collar
      L('x', [.20, 0, -.21], [[0, 0], [0, .065], [1.14, .065], [1.14, 0]], 14, K.dark);                                 // recuperator below the tube
      M.box(1.30, 1.56, -.10, .10, -.30, -.06, K.hull); M.box(1.31, 1.55, -.105, -.10, -.22, -.12, K.dark);             // front bearing block
      M.box(1.36, 1.50, -.09, .09, .07, .12, K.hull);                                                                  // collar strap over the tube
      M.box(-.70, -.30, .17, .25, -.14, .10, K.dark); L('y', [-.55, .25, -.16], [[0, 0], [0, .12], [.02, .12], [.02, 0]], 16, K.dark);   // elevating gear + handwheel
      L('y', [-.62, -.26, -.18], [[0, 0], [0, .11], [-.02, .11], [-.02, 0]], 16, K.dark);                                 // traversing handwheel (right)
      v115Elev(M, t0, th, [-.45, 0, .95]);
      v5Rod(M, [-.40, .30, 1.02], [-.40, .30, 1.56], .022, K.dark, 6); M.box(-.50, -.28, .25, .35, 1.56, 1.68, K.dark); M.box(-.285, -.275, .27, .33, 1.60, 1.65, K.glass);   // panoramic sight
      v115Crew(M, K, [{ f: 'us_carbine_kgun_light', x: -1.20, y: .80 }, { f: 'us_carbine_kgun_light', x: -1.20, y: -.80 },
        { f: 'us_carbine_sload_light', x: -1.85, y: .05, yaw: .1, round: [.30, 1.08, .62, .04] }, { f: 'us_carbine_kload_light', x: -2.20, y: 1.22, yaw: -.3, round: [.30, .92, .62, .04] },
        { f: 'us_carbine_kload_light', x: -2.20, y: -1.22, yaw: .3, round: [.30, .92, .62, .04] }, { f: 'us_carbine_kload_light', x: -.40, y: -1.45, yaw: .5, round: [.30, .92, .62, .04] }], o.crew == null ? 6 : o.crew);
      return M;
    }

    // ---------- 105 mm Howitzer M2A1 on Carriage M2A2 — colour 3-view (99 px/m from the 9.00-20 tyres R .52; shield top 1.71, width 2.30) + photos for the structure ----------
    // track ±.95; split shield at X .43: halves ±.17 → ±.66 and wings to ±1.15, the cradle between them, upper flaps hinged at Z 1.45 and folded back; lower shield slung forward;
    // howitzer elevated 16.6° as drawn on its trunnion (−.30, 1.18): tube to 2.38 m with its bearing ring, ONE recuperator cylinder above it (to 1.62 m, clamped to the tube),
    // box sleigh with the recoil cylinder inside below it (to 1.52 m); equilibrator springs and firing-jack pads under the axle; split trails 2.9 m to the spades, lunette to X −4.32 (Z .64)
    function buildG105(paint, o = {}) {
      const P = PAINT[paint] || PAINT.olive, M = new Mesh(), K = v112Mats(M, P), L = (ax, oo, prof, seg, m) => M.lathe(ax, oo, prof, seg, m);
      const sp = o.spread == null ? .40 : o.spread, th = o.elev == null ? .29 : o.elev;
      for (const sy of [-1, 1]) { v5Tyre(M, 0, sy * .95, .52, .52, .25, sy, K.tyre, K.wheel, K.dark, 26); M.box(-.12, .12, sy > 0 ? .30 : -.84, sy > 0 ? .84 : -.30, .48, .58, K.dark); }
      L('y', [0, -.84, .52], [[0, 0], [0, .055], [1.68, .055], [1.68, 0]], 10, K.dark);
      M.box(-.58, .28, -.34, .34, .44, .86, K.hull); M.box(-.58, -.02, -.24, .24, .86, 1.00, K.hull);
      for (const sy of [-1, 1]) M.box(-.52, -.08, sy * .21 - .035, sy * .21 + .035, .98, 1.26, K.hull);
      const SX = .43, T = .014, FH = .30, FA = .87;                       // upper flap: height, fold-back angle
      for (const sy of [-1, 1]) {
        v5Slab(M, [[SX, sy * .17, .41], [SX, sy * .66, .41], [SX - .03, sy * .66, 1.45], [SX - .03, sy * .17, 1.45]], [-T, 0, 0], K.hull);   // shield half
        v5Slab(M, [[SX - .02, sy * .66, 1.10], [SX - .02, sy * 1.15, 1.10], [SX - .03, sy * 1.15, 1.45], [SX - .03, sy * .66, 1.45]], [-T, 0, 0], K.hull);   // wing
        const fx = SX - .03 - FH * Math.sin(FA), fz = 1.45 + FH * Math.cos(FA);
        v5Slab(M, [[SX - .03, sy * .17, 1.45], [SX - .03, sy * 1.15, 1.45], [fx, sy * 1.12, fz], [fx, sy * .17, fz]], [-T, 0, 0], K.hull);   // upper flap, folded back
        L('y', [SX - .045, sy * .17, 1.45], [[0, 0], [0, .018], [sy * .98, .018], [sy * .98, 0]], 6, K.dark);           // hinge
        for (const z of [.80, 1.25]) M.box(SX - .05, SX - .02, sy * .90 - .06, sy * .90 + .06, z, z + .05, K.dark);
        v116Spring(M, K, .18, sy * .30, .56, 1.02, .05);                                                                // equilibrators
        v116Jack(M, K, -.05, sy * .45, .52);                                                                           // firing-jack pads
      }
      v5Slab(M, [[.34, -.62, .44], [.34, .62, .44], [.66, .62, .12], [.66, -.62, .12]], [-T, 0, -T], K.hull);              // lower shield, slung forward
      v115Trails(M, K, -.58, .28, .66, 2.90, .34, .24, .16, .17, 2.62, .40, .27, sp, [.85, .64]);
      const t0 = M.M.length;
      M.box(-.43, -.10, -.15, .15, -.16, .16, K.gun);                                                                   // breech ring + block
      L('x', [-.10, 0, 0], [[0, 0], [0, .09], [.50, .085], [.52, .074], [1.60, .070], [1.61, .082], [1.70, .082], [1.71, .070], [2.30, .066], [2.32, .076], [2.36, .076], [2.36, 0]], 16, K.gun); v120Bore(M, K, 2.26, 0, 0, .105);   // v120: L/22.5 tube 2.36 m · tube + bearing ring
      L('x', [-.36, 0, .175], [[0, 0], [0, .082], [1.80, .082], [1.81, .096], [1.92, .096], [1.94, .062], [1.98, .062], [1.98, 0]], 16, K.gun);   // recuperator above, front band + cap
      M.box(.92, 1.02, -.10, .10, -.09, .27, K.hull);                                                                  // clamp: tube + recuperator
      M.box(-.40, 1.50, -.12, .12, -.25, -.07, K.hull); M.box(1.44, 1.52, -.125, .125, -.26, -.06, K.dark);            // sleigh (recoil cylinder inside) under the tube, front cap
      for (const x of [.25, .70, 1.10]) M.box(x, x + .04, -.125, .125, -.255, -.065, K.dark);                           // sleigh straps
      M.box(-.40, .30, -.17, .17, -.14, .28, K.hull);                                                                  // cradle
      v115Elev(M, t0, th, [-.30, 0, 1.18]);
      v5Rod(M, [-.48, .31, 1.12], [-.48, .31, 1.66], .025, K.dark, 6); M.box(-.55, -.41, .26, .36, 1.66, 1.80, K.dark); M.box(-.415, -.405, .28, .34, 1.71, 1.77, K.glass);   // panoramic sight on its post (level)
      L('y', [-.84, .33, .86], [[0, 0], [0, .14], [.02, .14], [.02, 0]], 16, K.dark); L('y', [-.84, -.33, .86], [[0, 0], [0, .14], [-.02, .14], [-.02, 0]], 16, K.dark);   // handwheels
      v115Crew(M, K, [{ f: 'us_carbine_kgun_light', x: -1.05, y: .85 }, { f: 'us_carbine_kgun_light', x: -1.05, y: -.85 },
        { f: 'us_carbine_sload_light', x: -1.95, y: .05, yaw: .1, round: [.30, 1.08, .55, .055] }, { f: 'us_carbine_kload_light', x: -.35, y: 1.45, yaw: -.5, round: [.30, .92, .55, .055] }], o.crew == null ? 4 : o.crew);
      return M;
    }

    // ---------- 75 mm Pack Howitzer M1A1 on Carriage M8 — Elysium 3-view with the feet scale (193.6 px/m: 3.66 m, 1.19 m wide, 0.86 m high) ----------
    // wheels R .335 (.155 wide) on ±.545, axle Z .335; tube level at Z .69 from the breech X −.31 to the muzzle 1.09, recoil cylinder below (Z .50), sloped top housing;
    // box trail: front section (side plates ±.19, 4 lightening holes) to X −1.26, rear section sloping to the spade at −2.48, lunette at −2.86
    function buildG75p(paint, o = {}) {
      const P = PAINT[paint] || PAINT.olive, M = new Mesh(), K = v112Mats(M, P), L = (ax, oo, prof, seg, m) => M.lathe(ax, oo, prof, seg, m);
      for (const sy of [-1, 1]) { v5Tyre(M, 0, sy * .545, .335, .335, .155, sy, K.tyre, K.wheel, K.dark, 18); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + .5; L('y', [.20 * Math.cos(a), sy * (.545 + .06), .335 + .20 * Math.sin(a)], [[0, 0], [0, .035], [sy * .005, .035], [sy * .005, 0]], 8, K.black); } }
      L('y', [0, -.48, .335], [[0, 0], [0, .035], [.96, .035], [.96, 0]], 10, K.dark);
      L('y', [0, -.40, .335], [[0, 0], [0, .07], [.16, .07], [.16, 0]], 12, K.dark); for (let k = 0; k < 6; k++) L('y', [0, -.39 + k * .025, .335], [[0, 0], [0, .078], [.012, .078], [.012, 0]], 12, K.dark);   // traversing spring housing (right)
      for (const sy of [-1, 1]) {                                                                                       // carriage cheeks with the trunnions
        M.box(-.36, .16, sy * .13 - .02, sy * .13 + .02, .38, .70, K.hull);
        extrudeXZ(M, [[-.33, .45], [-.33, .22], [-1.26, .27], [-1.26, .45]], sy > 0 ? .17 : -.19, sy > 0 ? .19 : -.17, K.hull);
        for (const x of [-.56, -.74, -.92, -1.07]) L('y', [x, sy * .19, .35], [[0, 0], [0, .045], [sy * .006, .045], [sy * .006, 0]], 12, K.black);
        v115Beam(M, [-1.26, sy * .17, .38], [-2.40, sy * .14, .17], .13, .10, .03, .03, K.hull);
      }
      M.box(-1.26, -.33, -.19, .19, .22, .25, K.hull); M.box(-.36, .16, -.13, .13, .36, .40, K.hull);
      v115Beam(M, [-1.26, 0, .44], [-2.40, 0, .23], .02, .02, .34, .28, K.hull);
      v5Slab(M, [[-2.42, -.18, .26], [-2.42, .18, .26], [-2.56, .18, 0], [-2.56, -.18, 0]], [.03, 0, 0], K.hull);         // spade
      v5Rod(M, [-2.40, 0, .19], [-2.80, 0, .19], .035, K.dark, 6); L('y', [-2.86, -.02, .19], [[0, .03], [0, .06], [.04, .06], [.04, .03], [0, .03]], 12, K.dark);   // lunette
      for (const sy of [-1, 1]) v5Rod(M, [-1.70, sy * .10, .36], [-2.25, sy * .10, .28], .02, K.dark, 5);                  // handspikes
      // howitzer (level): tube, breech, recoil cylinder, cradle, sloped top housing, sight
      L('x', [-.31, 0, .69], [[0, 0], [0, .075], [.60, .07], [.62, .058], [1.34, .055], [1.36, .065], [1.38, .065], [1.38, 0]], 16, K.gun); v120Bore(M, K, 1.07, 0, .69, .075);   // v120: 1.38 m
      M.box(-.42, -.24, -.09, .09, .58, .80, K.gun);
      L('x', [-.22, 0, .50], [[0, 0], [0, .055], [1.14, .055], [1.14, 0]], 14, K.dark);
      M.box(-.30, .62, -.08, .08, .52, .64, K.hull);
      M.hex8([[-.25, -.07, .74], [.92, -.06, .74], [.92, .06, .74], [-.25, .07, .74], [-.25, -.07, .87], [.33, -.06, .86], [.33, .06, .86], [-.25, .07, .87]], K.hull);
      M.box(-.20, -.02, .10, .16, .74, .86, K.dark); M.box(-.025, -.015, .11, .15, .79, .83, K.glass);
      v115Crew(M, K, [{ f: 'us_carbine_kgun_light', x: -.80, y: .45 }, { f: 'us_carbine_kgun_light', x: -.80, y: -.45 },
        { f: 'us_carbine_kload_light', x: -1.45, y: .55, yaw: -.3, round: [.30, .92, .45, .04] }, { f: 'us_carbine_sload_light', x: -1.40, y: -.55, yaw: .3, round: [.30, 1.08, .45, .04] },
        { f: 'us_carbine_kload_light', x: -.10, y: .88, yaw: -.4, round: [.30, .92, .45, .04] }], o.crew == null ? 5 : o.crew);
      return M;
    }

    // ---------- 81 mm Mortar M1 (base plate M3, bipod M4) — photo + manual diagram; tube 1.26 m raised 65°, rectangular plate .52 × .40 ----------
    function buildM81(paint, o = {}) {
      const P = PAINT[paint] || PAINT.olive, M = new Mesh(), K = v112Mats(M, P), L = (ax, oo, prof, seg, m) => M.lathe(ax, oo, prof, seg, m);
      const el = 65 * Math.PI / 180, c = Math.cos(el), s = Math.sin(el), at = t => [c * t, 0, .07 + s * t];
      // base plate: dished rectangle with a raised rim, ribs, socket, carrying handle
      M.box(-.26, .26, -.20, .20, 0, .03, K.gun); for (const sy of [-1, 1]) M.box(-.26, .26, sy * .20 - .015, sy * .20 + .015, 0, .07, K.gun);
      M.box(-.26, -.24, -.20, .20, 0, .07, K.gun); M.box(.24, .26, -.20, .20, 0, .07, K.gun); L('z', [0, 0, .03], [[0, 0], [0, .09], [.05, .07], [.05, 0]], 14, K.dark);
      for (let k = 0; k < 3; k++) M.box(-.20, .20, -.16 + k * .16 - .01, -.16 + k * .16 + .01, .03, .045, K.gun);
      v5Poly(M, [[-.26, -.10, .05], [-.31, -.10, .09], [-.31, .10, .09], [-.26, .10, .05]], .012, K.dark, 4);
      // tube with the breech cap and the bipod collar, built along +X then raised about the socket
      const t0 = M.M.length;
      const TL = V118DE.on ? 1.14 : 1.26; L('x', [-.04, 0, 0], [[0, 0], [0, .062], [.10, .056], [TL, .048], [TL, 0]], 16, K.gun); v120Bore(M, K, TL - .04, 0, 0, .081);   // v120: M1 1.26 m · GrW 34 1.14 m L('x', [.86, 0, 0], [[0, 0], [0, .058], [.10, .058], [.10, 0]], 14, K.dark);
      v7Xf(M, t0, v7.ry(-el), [0, 0, .07]);
      // bipod: yoke under the collar, two legs to the feet, central elevating guide tube, traverse handwheel, sight on the left
      const C = at(.91), Y = [C[0] + .10, 0, C[2] - .10];
      M.box(Y[0] - .06, Y[0] + .06, -.12, .12, Y[2] - .05, Y[2] + .05, K.dark);
      for (const sy of [-1, 1]) { v5Rod(M, [Y[0], sy * .10, Y[2]], [.92, sy * .34, .02], .02, K.gun, 6); L('z', [.92, sy * .34, 0], [[0, 0], [0, .06], [.02, .06], [.02, 0]], 10, K.dark); }
      v5Rod(M, Y, [.70, 0, .22], .028, K.gun, 6); v5Rod(M, [.78, -.20, .22], [.78, .20, .22], .01, K.black, 4);
      L('y', [Y[0], -.13, Y[2]], [[0, 0], [0, .06], [-.015, .06], [-.015, 0]], 12, K.dark);
      M.box(Y[0] - .08, Y[0] + .04, .12, .20, Y[2] + .02, Y[2] + .14, K.dark); M.box(Y[0] + .035, Y[0] + .045, .13, .19, Y[2] + .07, Y[2] + .12, K.glass);
      // crew: gunner at the sight, assistant hanging a bomb over the muzzle, ammunition bearer
      v115Crew(M, K, [{ f: 'us_carbine_kgun_light', x: .02, y: .66, yaw: -.55 }, { f: 'us_carbine_kdrop_light', x: .56, y: -.70, yaw: Math.PI / 2 + .02 },
        { f: 'us_carbine_kload_light', x: -.78, y: -.42, yaw: .35, round: [.30, .92, .40, .04] },
        { f: 'us_carbine_kload_light', de: 'de_mp40_kneel_light', x: -.80, y: .55, yaw: -.35, round: [.30, .92, .40, .04] }], o.crew == null ? 4 : o.crew);
      if ((o.crew == null ? 4 : o.crew) >= 2) { const m = at((V118DE.on ? 1.14 : 1.26) - .04); v5Rod(M, [m[0], m[1], m[2] + .06], [m[0], m[1], m[2] + .32], .04, M.mat([176, 138, 64], { spec: .5 }), 8); }   // bomb over the muzzle
      return M;
    }

    // ---------- Browning M1919A4 on Tripod Mount M2 — side drawing (426 px/m from the 1.044 m gun): bore Z .32, tripod head X 0 Z .22 ----------
    function buildM1919(paint, o = {}) {
      const P = PAINT[paint] || PAINT.olive, M = new Mesh(), K = v112Mats(M, P), L = (ax, oo, prof, seg, m) => M.lathe(ax, oo, prof, seg, m), gun = M.mat([58, 60, 58], { spec: .3, noise: .4 });
      // tripod: two splayed front legs, one long rear leg with the T&E sleeve, pintle head
      L('z', [0, 0, .17], [[0, 0], [0, .05], [.08, .05], [.08, 0]], 10, K.dark);
      for (const sy of [-1, 1]) { v5Rod(M, [.02, sy * .03, .20], [.22, sy * .30, .02], .018, K.hull, 6); M.box(.18, .28, sy * .30 - .05, sy * .30 + .05, 0, .015, K.hull); }
      v5Rod(M, [-.02, 0, .20], [-.53, 0, .03], .02, K.hull, 6); M.box(-.60, -.48, -.06, .06, 0, .02, K.hull);
      M.box(-.30, -.24, -.02, .02, .10, .26, K.dark); L('z', [-.27, 0, .17], [[0, 0], [0, .05], [.012, .05], [.012, 0]], 12, K.dark);   // T&E screw + handwheel
      // gun: receiver, buffer, pistol grip, perforated jacket, front sight, rear sight, belt and box
      M.box(-.35, .03, -.045, .045, .26, .38, gun); M.box(-.43, -.35, -.03, .03, .29, .35, gun);
      M.hex8([[-.47, -.018, .21], [-.40, -.018, .21], [-.37, -.018, .29], [-.42, -.018, .29], [-.47, .018, .21], [-.40, .018, .21], [-.37, .018, .29], [-.42, .018, .29]], gun);
      L('x', [.03, 0, .32], [[0, 0], [0, .031], [.55, .031], [.55, 0]], 12, gun);
      for (let k = 0; k < 9; k++) for (const a of [0, 2.1, 4.2]) { const x = .07 + k * .055; L('x', [x, .032 * Math.cos(a), .32 + .032 * Math.sin(a)], [[0, 0], [0, .008], [.012, .008], [.012, 0]], 6, K.black); }
      L('x', [.58, 0, .32], [[0, 0], [0, .018], [.05, .018], [.05, 0]], 8, gun); M.box(.02, .03, -.006, .006, .35, .40, gun); M.box(-.33, -.30, -.012, .012, .38, .42, gun);
      M.box(-.20, -.08, .045, .07, .30, .34, M.mat([176, 138, 64], { spec: .5, noise: .3 }));                                // belt entering the feed
      v115Crew(M, K, [{ f: 'us_carbine_sit19_light', x: -.85, y: 0 }, { f: 'us_carbine_kfeed_light', x: -.15, y: .62, yaw: -Math.PI / 2, box: [.05, .30] },
        { f: 'us_carbine_kneel_light', x: .35, y: -.72, yaw: -.3 }, { f: 'us_carbine_kneel_light', x: -.75, y: -.78, yaw: -.65 }], o.crew == null ? 4 : o.crew);
      return M;
    }

    // ---------- Browning M2HB on Tripod Mount M3 — side drawing (248 px/m from the 1.654 m gun): bore Z .36, tripod head X 0 Z .29 ----------
    function buildM2HB(paint, o = {}) {
      const P = PAINT[paint] || PAINT.olive, M = new Mesh(), K = v112Mats(M, P), L = (ax, oo, prof, seg, m) => M.lathe(ax, oo, prof, seg, m), gun = M.mat([58, 60, 58], { spec: .3, noise: .4 });
      // tripod: front leg forward, two rear legs splayed back, traversing bar, T&E mechanism, head
      M.box(-.06, .06, -.07, .07, .24, .31, K.hull);
      v5Rod(M, [.03, 0, .27], [.38, 0, .02], .022, K.hull, 6); M.box(.34, .44, -.06, .06, 0, .02, K.hull);
      for (const sy of [-1, 1]) { v5Rod(M, [-.03, sy * .04, .27], [-.93, sy * .55, .02], .022, K.hull, 6); M.box(-.98, -.88, sy * .55 - .05, sy * .55 + .05, 0, .02, K.hull); }
      v5Rod(M, [-.40, -.24, .14], [-.40, .24, .14], .015, K.dark, 5);                                                     // traversing bar
      M.box(-.38, -.32, -.03, .03, .14, .28, K.dark); L('z', [-.35, 0, .19], [[0, 0], [0, .05], [.012, .05], [.012, 0]], 12, K.dark);
      // gun: receiver with backplate and spade grips, barrel support with the vent holes, carrying handle, heavy barrel, flash hider
      M.box(-.60, .02, -.06, .06, .28, .43, gun); M.box(-.66, -.60, -.08, .08, .30, .42, gun);
      for (const sy of [-1, 1]) v5Rod(M, [-.66, sy * .07, .32], [-.70, sy * .07, .40], .016, K.dark, 6);
      M.box(-.48, -.20, -.065, .065, .43, .46, gun);                                                                     // feed cover
      L('x', [.02, 0, .36], [[0, 0], [0, .05], [.26, .05], [.26, 0]], 12, gun);
      for (let k = 0; k < 4; k++) for (const a of [.3, 2.4, 4.5]) { const x = .05 + k * .055; L('x', [x, .051 * Math.cos(a), .36 + .051 * Math.sin(a)], [[0, 0], [0, .012], [.018, .012], [.018, 0]], 6, K.black); }
      L('x', [.28, 0, .36], [[0, 0], [0, .024], [.70, .022], [.70, .03], [.74, .03], [.74, 0]], 10, gun);
      v5Poly(M, [[.30, -.02, .38], [.32, -.02, .45], [.46, -.02, .45], [.48, -.02, .38]], .01, gun, 4);
      M.box(-.36, -.20, .06, .085, .38, .42, M.mat([176, 138, 64], { spec: .5, noise: .3 }));
      v115Crew(M, K, [{ f: 'us_carbine_sit50_light', x: -1.12, y: 0 }, { f: 'us_carbine_kfeed_light', x: -.36, y: .64, yaw: -Math.PI / 2, box: [.08, .32] },
        { f: 'us_carbine_kneel_light', x: .35, y: -.85, yaw: -.3 }, { f: 'us_carbine_kneel_light', x: -1.00, y: -.90, yaw: -.65 }], o.crew == null ? 4 : o.crew);
      return M;
    }

    // ---------- M7 Priest (105 mm HMC) on the M3 chassis — 4-view blueprint (144 px/m; sprocket X 2.48, idler −2.40, bogies 1.58 / .14 / −1.30) + cutaway render ----------
    // superstructure: walls ±1.26 to Z 1.81 (X 1.40 → −.92), front plate from the nose top (2.21, 1.20) to the pulpit (1.38, 2.00), side plates following it; pulpit ring R .53 at (.78, −.83) to Z 2.37 with the .50;
    // howitzer offset Y −.21, bore Z 1.83, muzzle X 2.86, M2A1 recoil system (recuperator above, sleigh below); ammunition bins along both walls (X .40 → −.95) to Z 2.03; engine deck 1.60, angled rear plate
    function buildM7(paint, o = {}) {
      const P = PAINT[paint] || PAINT.olive, M = new Mesh(), K = v112Mats(M, P), L = (ax, o, prof, seg, m) => M.lathe(ax, o, prof, seg, m), trv = false;
      const HW = 1.26, RZ = 2.10, BZ = 1.12;
      // ---- lower hull between the tracks; three-piece bolted transmission housing ----
      extrudeXZ(M, [[2.05, 1.16], [2.05, .60], [1.80, .46], [-2.45, .46], [-2.70, .62], [-2.70, 1.14]], -.88, .88, K.hull);
      const nose = [[2.05, 1.17], [2.50, 1.20], [2.68, 1.12], [2.79, .94], [2.80, .74], [2.70, .58], [2.45, .48], [2.05, .48]];
      for (const [y0, y1] of [[-.90, -.34], [-.32, .28], [.30, .90]]) extrudeXZ(M, nose, y0, y1, K.hull);
      for (const yy of [-.33, .29]) for (let k = 0; k < nose.length - 2; k++) v5Rod(M, [nose[k][0] + .02, yy, nose[k][1] + .02], [nose[k + 1][0] + .02, yy, nose[k + 1][1] + .02], .03, K.hull, 5);   // bolted flanges
      for (const sy of [-1, 1]) { M.box(2.70, 2.86, sy * .62 - .05, sy * .62 + .05, .66, .80, K.dark); L('y', [2.80, sy * .62 - .07, .73], [[0, 0], [0, .05], [.14, .05], [.14, 0]], 10, K.dark); }   // tow eyes
      // ---- fighting compartment: front plate, walls, floor; engine compartment; angled rear plate ----
      const fx = z => 2.21 - (z - 1.20) / .80 * .83;
      v5LoftZ(M, [[2.21, -.88], [2.21, .88], [1.80, HW], [-.92, HW], [-.92, -HW], [1.80, -HW]], [[1.45, -.95], [1.45, .95], [1.45, HW], [-.92, HW], [-.92, -HW], [1.45, -HW]], BZ, 1.20, K.hull, false);
      v5Slab(M, [[2.21, -HW + .02, 1.20], [2.21, HW - .02, 1.20], [1.38, HW - .02, 2.00], [1.38, -HW + .02, 2.00]], [-.03, 0, 0], K.hull);
      for (const sy of [-1, 1]) {
        v5Slab(M, [[2.21, sy * HW, 1.20], [1.38, sy * HW, 2.00], [1.38, sy * HW, BZ], [1.80, sy * HW, BZ]], [0, -sy * .03, 0], K.hull);
        M.box(-.92, 1.40, sy > 0 ? HW - .03 : -HW, sy > 0 ? HW : -HW + .03, BZ, 1.81, K.hull);
        for (let k = 0; k < 12; k++) { const x = 1.30 - k * .20; for (const z of [BZ + .05, 1.76]) M.box(x - .012, x + .012, sy * HW - .01, sy * HW + .01, z - .012, z + .012, K.dark); }
        M.box(-.30, .80, sy > 0 ? HW : -HW - .02, sy > 0 ? HW + .02 : -HW, 1.50, 1.53, K.dark);                             // grab rails
      }
      M.box(-.92, 1.45, -HW, HW, BZ - .03, BZ, K.inner);
      M.box(-.95, -.89, -HW, HW, BZ, 1.81, K.hull);                                                                       // bulkhead
      extrudeXZ(M, [[-.92, 1.60], [-.92, BZ], [-2.62, BZ], [-2.62, 1.05], [-2.35, 1.60]], -HW, HW, K.hull);               // engine compartment
      v5Slab(M, [[-2.35, -HW + .02, 1.62], [-2.35, HW - .02, 1.62], [-2.62, HW - .02, 1.05], [-2.62, -HW + .02, 1.05]], [.03, 0, 0], K.hull);
      for (let q = 0; q < 6; q++) { const x = -1.05 - q * .05; M.box(x - .03, x, -.42, .42, 1.60, 1.63, K.grille); }
      v5Slab(M, Array.from({ length: 24 }, (_, k) => { const a = k * Math.PI / 12; return [-1.95 + .55 * Math.cos(a), .02 + .42 * Math.sin(a), 1.605]; }), [0, 0, .02], K.hull);   // engine access plate
      for (const sy of [-1, 1]) { M.box(-2.72, -1.00, sy > 0 ? .96 : -HW + .02, sy > 0 ? HW - .02 : -.96, 1.60, 1.88, K.dark); M.box(-2.70, -1.02, sy > 0 ? .98 : -HW + .04, sy > 0 ? HW - .04 : -.98, 1.88, 1.90, K.hull); }
      for (const sy of [-1, 1]) { L('x', [-2.62, sy * 1.05, 1.30], [[0, 0], [0, .045], [-.04, .045], [-.04, 0]], 10, K.lamp); L('x', [-2.60, sy * .45, .72], [[0, 0], [0, .08], [-.18, .08], [-.18, 0]], 12, K.dark); }
      // ---- ammunition bins along both walls (tops above the walls), round ends on top ----
      for (const sy of [-1, 1]) { M.box(-.95, .40, sy > 0 ? .98 : -HW + .03, sy > 0 ? HW - .03 : -.98, BZ, 2.03, K.hull);
        for (let i = 0; i < 9; i++) for (let j = 0; j < 2; j++) L('z', [-.88 + i * .15, sy * (1.06 + j * .12), 2.03], [[0, 0], [0, .055], [.01, .055], [.01, 0]], 8, K.black); }
      // ---- pulpit ring mount (right front) with the .50 M2HB ----
      L('z', [.78, -.83, BZ], [[0, 0], [0, .53], [1.25, .53], [1.25, .50], [.30, .50], [.30, 0]], 30, K.hull);
      L('z', [.78, -.83, 2.37], [[0, .48], [0, .56], [.04, .56], [.04, .48], [0, .48]], 30, K.dark);
      { const gx = .30, gy = -.83, gz = 2.62; M.box(gx - .05, gx + .05, gy - .05, gy + .05, 2.37, gz - .07, K.dark);
        M.box(gx - .30, gx + .32, gy - .06, gy + .06, gz - .07, gz + .08, K.gun); L('x', [gx + .32, gy, gz], [[0, 0], [0, .045], [.24, .045], [.26, .022], [.95, .02], [.98, .03], [1.02, .03], [1.02, 0]], 10, K.gun);
        for (const s of [-1, 1]) v5Rod(M, [gx - .30, gy + s * .06, gz - .02], [gx - .36, gy + s * .06, gz + .05], .014, K.dark, 5); M.box(gx - .10, gx + .10, gy + .06, gy + .18, gz - .12, gz + .02, K.gun); }
      // ---- 105 mm howitzer: mantlet on the front plate, tube, recoil cylinders above, travel lock, breech in the compartment ----
      { const gy = -.21, gz = 1.83;
        M.hex8([[2.24, gy - .30, 1.22], [2.24, gy + .30, 1.22], [1.62, gy + .30, 1.70], [1.62, gy - .30, 1.70], [2.36, gy - .30, 1.40], [2.36, gy + .30, 1.40], [1.70, gy + .30, 1.86], [1.70, gy - .30, 1.86]], K.hull);   // lower mantlet / travel lock
        M.box(1.57, 2.21, gy - .22, gy + .22, 1.62, 2.04, K.hull);
        L('x', [2.21, gy, gz], [[0, 0], [0, .085], [.20, .082], [.21, .090], [.29, .090], [.30, .076], [.60, .070], [.62, .078], [.65, .078], [.65, 0]], 16, K.gun);   // v117: tube + bearing ring
        L('x', [1.57, gy, gz + .175], [[0, 0], [0, .082], [.80, .082], [.81, .096], [.93, .096], [.95, .062], [.99, .062], [.99, 0]], 16, K.gun);   // ONE recuperator above (to X 2.56)
        M.box(2.28, 2.38, gy - .10, gy + .10, gz - .09, gz + .27, K.hull);                                                // clamp: tube + recuperator
        M.box(1.57, 2.48, gy - .12, gy + .12, gz - .25, gz - .07, K.hull); M.box(2.42, 2.50, gy - .125, gy + .125, gz - .26, gz - .06, K.dark);   // sleigh under the tube
        M.box(.55, 1.57, gy - .17, gy + .17, 1.55, 2.0, K.gun); M.box(.40, .70, gy - .14, gy + .14, 1.62, 1.92, K.dark);
        L('y', [.95, gy + .30, 1.55], [[0, 0], [0, .12], [.02, .12], [.02, 0]], 14, K.dark); }
      // ---- driver's hood (left front), headlights ----
      M.box(1.55, 1.95, .35, .85, 1.85, 2.02, K.hull); M.box(1.94, 1.952, .45, .75, 1.92, 1.96, K.black);
      for (const sy of [-1, 1]) { L('x', [2.30, sy * .70, 1.30], [[0, 0], [0, .06], [.04, .07], [.10, .07], [.12, .05], [.12, 0]], 12, K.dark); L('x', [2.42, sy * .70, 1.30], [[0, 0], [0, .055], [.005, .05], [.005, 0]], 12, K.glass); }
      // ---- VVSS running gear ----
      for (const sy of [-1, 1]) {
        const yc = sy * 1.05, f = sy;
        v5Track(M, v112Belt({ c: [2.48, .68], r: .33 }, { c: [-2.39, .70], r: .32 }, 1.99, -1.79, 1.06), yc - .21, yc + .21, .045, .15, K.trk, K.trkR);
        for (const bx of [1.55, .10, -1.35]) {
          for (const dx of [-.44, .44]) { L('y', [bx + dx, yc, .27], [[-.11 * f, 0], [-.11 * f, .254, K.tyre], [-.04 * f, .254, K.tyre], [-.04 * f, .20, K.dark], [.04 * f, .20, K.dark], [.04 * f, .254, K.tyre], [.11 * f, .254, K.tyre], [.11 * f, .18, K.wheel], [.13 * f, .16, K.wheel], [.13 * f, 0, K.wheel]], 18, K.tyre);
            for (let k = 0; k < 6; k++) pnRadial(M, bx + dx, .27, k * Math.PI / 3 + .4, .04, .17, .04, .025, yc + .10 * f, yc + .13 * f, K.wheel); }
          M.box(bx - .20, bx + .20, sy > 0 ? .86 : -1.24, sy > 0 ? 1.24 : -.86, .30, .90, K.dark);                           // bracket + volute springs
          for (const dx of [-.10, .10]) L('z', [bx + dx, yc + .21 * f, .32], [[0, 0], [0, .07], [.34, .06], [.34, 0]], 10, K.steel);
          for (const dx of [-.44, .44]) v5Rod(M, [bx, yc + .14 * f, .44], [bx + dx, yc + .14 * f, .27], .05, K.dark, 6);
          L('y', [bx - .08, yc, .96], [[-.06 * f, 0], [-.06 * f, .085, K.tyre], [.06 * f, .085, K.tyre], [.06 * f, 0]], 12, K.tyre);   // return roller on the bracket
        }
        v112Sprocket(M, 2.48, yc, .68, .31, f, K);
        L('y', [-2.39, yc, .70], [[-.13 * f, 0], [-.13 * f, .30, K.wheel], [.13 * f, .30, K.wheel], [.13 * f, .12, K.dark], [.16 * f, .10, K.dark], [.16 * f, 0, K.dark]], 22, K.wheel);
        for (let k = 0; k < 6; k++) pnRadial(M, -2.39, .70, k * Math.PI / 3, .10, .27, .05, .04, yc + .12 * f, yc + .15 * f, K.dark);
      }
      // ---- crew (3, the gunners first): .50 gunner at the pulpit, layer beside the breech, one loader ----
      v115Crew(M, K, [{ f: 'us_carbine_sgun50_light', x: -.12, y: -.83, z: 1.40 }, { f: 'us_carbine_sgun_light', x: .45, y: .22, z: BZ - .17 },
        { f: 'us_carbine_sload_light', x: -.45, y: .05, z: BZ - .17, yaw: .1, round: [.30, 1.08, .55, .055] }], o.crew == null ? 3 : o.crew);   // v117: a little lower, walls at the chest
      return M;
    }

    // ══════════════════════════════════════════════════════════════
    // v118 — German crew-served weapons measured on the supplied drawings, with their crews:
    //   MG 42 on the Lafette 34 (CAD side 324 px/m), 2 cm Flak 30 on its Sd.Ah. 51 (3-view 112 px/m), 7.5 cm LG 40 (TTT drawing + photos,
    //   45 in / 29.5 in from TTT), 7.5 cm Pak 40 (J. L. Rue side with its foot scale 119.4 px/m + 4-view), 15 cm sFH 18 (side 55 px/m + 5-view)
    //   X forward, Y left, Z up; origin on the ground under the axle (guns) or under the tripod head (MG)
    // ══════════════════════════════════════════════════════════════
    const V118DE = { on: false };                                    // true while a US-built model is baked with a German crew (GrW 34)
    { const KN = V7POSES.kneel, EL = [[-.3, -.9, -1], [-.3, .9, -1]];
      V7POSES.kmg = Object.assign({}, KN, { aim: false, lean: .32, twist: -.05, hands: [[.52, -.05, .86], [.36, .07, .96]], el: EL, head: [.06, 0, .13], pitch: .2 });   // kneeling behind the MG 42 on the Lafette, shoulder on the stock
      V7POSES.kbelt = Object.assign({}, KN, { aim: false, lean: .15, twist: -.05, hands: [[.40, -.06, .80], [.40, .10, .84]], el: EL, head: [.05, 0, .14], pitch: .15 });  // kneeling, holding the belt up to the feed
      V7POSES.flsit = { hip: [0, 0, .40], lean: .08, twist: 0, feet: [{ at: [.40, .13, -.28], dir: [1, .1, 0], hint: [1, 0, .5] }, { at: [.40, -.13, -.28], dir: [1, -.1, 0], hint: [1, 0, .5] }],
        hands: [[.42, -.14, .72], [.42, .14, .72]], el: [[-.25, -.9, -1], [-.25, .9, -1]], head: [.04, 0, .14], pitch: .05 };                                       // Flak 30 gunner on the Richtsitz, feet on the foot rest
    }
    // spoked wheel: tyre, rim, n spokes, hub (Y outward = sy)
    function v118Spoked(M, K, x, y, z, R, w, sy, n, tyreT) {
      const L = (ax, o, p, s, m) => M.lathe(ax, o, p, s, m), tt = tyreT || .06;
      L('y', [x, y - w / 2, z], [[0, R - tt], [0, R - tt * .3], [w * .15, R], [w * .85, R], [w, R - tt * .3], [w, R - tt], [0, R - tt]], 28, K.tyre);
      L('y', [x, y - w * .45, z], [[0, R - tt - .03], [0, R - tt], [w * .9, R - tt], [w * .9, R - tt - .03], [0, R - tt - .03]], 24, K.wheel);
      for (let k = 0; k < n; k++) { const a = k * 2 * Math.PI / n, c = Math.cos(a), s = Math.sin(a), r0 = R * .16, r1 = R - tt - .02;
        v5Rod(M, [x + c * r0, y, z + s * r0], [x + c * r1, y, z + s * r1], Math.max(.012, R * .045), K.wheel, 5); }
      L('y', [x, y - sy * .02, z], [[0, 0], [0, R * .2], [sy * w * .9, R * .18], [sy * w * 1.05, R * .1], [sy * w * 1.05, 0]], 16, K.dark);
    }

    // ---------- MG 42 on the Lafette 34 — v119: gun to the drawings (side line drawing 508 px/m on the 1.22 m gun, 4-view 381 px/m from its 1 m bar),
    //   Lafette from the CAD side (324 px/m): bore Z .95 (legs extended), front leg foot X .39, rear feet X −.68 (±.42); MGZ 34 periscope sight on the left rear.
    //   Gun stations (X from the tripod head): muzzle .66, booster .615 … .57, jacket .562 … .093 (1 round hole + 6 oval slots), front sight .506,
    //   rear sight .164 … .067, receiver .093 … −.379, feed cover .034 … −.094, pistol grip −.11 … −.24, fishtail stock −.379 … −.56 ----------
    { const KN = V7POSES.kneel, EL = [[-.3, -.9, -1], [-.3, .9, -1]];
      // gunner (as the figure): kneeling, leaning over the gun, right hand on the Lafette trigger grip, left hand on the cradle, eye at the MGZ 34
      V7POSES.kmg = Object.assign({}, KN, { aim: false, lean: .50, twist: .02, hands: [[.53, -.10, .79], [.56, .05, .93]], el: [[-.2, -.9, -1], [-.3, .9, -.8]], head: [.08, 0, .12], pitch: -.05 });
      // assistant: kneeling at the gunner's left, right hand lifting the belt into the feed, left hand holding it lower
      V7POSES.kbelt = Object.assign({}, KN, { aim: false, lean: .30, twist: .05, hands: [[.50, -.25, .93], [.33, -.12, .74]], el: EL, head: [.06, 0, .13], pitch: .12 });
    }
    function buildMG42(paint, o = {}) {
      const P = PAINT[paint] || PAINT.grey, M = new Mesh(), K = v112Mats(M, P), L = (ax, oo, prof, seg, m) => M.lathe(ax, oo, prof, seg, m);
      const gun = M.mat([46, 48, 50], { spec: .35, noise: .4 }), wood = M.mat([104, 62, 36], { spec: .15, noise: .9 }), grip = M.mat([58, 40, 30], { spec: .25, noise: .5 });
      const pad = M.mat([60, 50, 40], { spec: .08, noise: 1 }), brass = M.mat([168, 132, 60], { spec: .5, noise: .3 }), BZ = .95;
      // --- Lafette 34: cradle rail, buffer, front head + leg with carrying pad, rear hub + two splayed legs, brace, diagonal with cushion, elevating post + handwheel
      M.box(-.42, .14, -.035, .035, .855, .885, K.hull); M.box(-.10, .12, -.03, .03, .80, .855, K.dark);
      v5Rod(M, [.14, 0, .86], [.17, 0, .73], .02, K.hull, 6);
      v5Rod(M, [.17, 0, .73], [.39, 0, .02], .017, K.hull, 6); M.box(.33, .46, -.05, .05, 0, .02, K.hull);
      M.box(.22, .31, -.05, .05, .36, .48, pad); M.box(.24, .32, -.048, .048, .30, .36, pad);
      L('y', [-.31, -.05, .56], [[0, 0], [0, .045], [.10, .045], [.10, 0]], 12, K.dark);
      for (const sy of [-1, 1]) { v5Rod(M, [-.31, sy * .04, .56], [-.68, sy * .42, .02], .017, K.hull, 6); M.box(-.74, -.62, sy * .42 - .05, sy * .42 + .05, 0, .02, K.hull); }
      v5Rod(M, [.23, 0, .52], [-.29, 0, .52], .012, K.hull, 5);
      v5Rod(M, [.17, 0, .73], [-.29, 0, .58], .015, K.hull, 5); M.box(-.22, -.05, -.045, .045, .62, .71, pad);
      M.box(-.40, -.31, -.04, .04, .56, .86, K.dark); M.box(-.42, -.30, -.045, .045, .62, .72, K.hull);
      L('y', [-.36, -.05, .66], [[0, 0], [0, .06], [-.015, .06], [-.015, 0]], 14, K.dark);
      M.box(-.46, -.40, -.02, .02, .70, .84, grip);                                                                       // Lafette trigger grip
      // MGZ 34 periscope sight on its bracket (left rear), eyepiece facing the gunner
      M.box(-.33, -.27, .05, .09, .86, 1.01, K.dark); M.box(-.42, -.24, .06, .13, 1.01, 1.09, K.dark);
      L('x', [-.42, .095, 1.05], [[0, 0], [0, .024], [-.05, .024], [-.05, 0]], 10, K.dark); M.box(-.24, -.23, .07, .12, 1.03, 1.07, K.glass);
      // --- MG 42
      L('x', [.562, 0, BZ], [[0, 0], [0, .016], [.008, .016], [.010, .022], [.053, .022], [.055, .012], [.098, .011], [.098, 0]], 14, gun);   // muzzle booster + cap
      for (let k = 0; k < 5; k++) L('x', [.578 + k * .008, 0, BZ], [[0, .0215], [0, .0235], [.003, .0235], [.003, .0215]], 14, K.black);   // booster ribs
      M.hex8([[.54, -.023, BZ - .030], [.562, -.016, BZ - .016], [.562, .016, BZ - .016], [.54, .023, BZ - .030], [.54, -.023, BZ + .016], [.562, -.016, BZ + .012], [.562, .016, BZ + .012], [.54, .023, BZ + .016]], gun);   // jacket nose
      M.box(.093, .54, -.023, .023, BZ - .030, BZ + .016, gun);                                                         // barrel jacket
      const slot = (x0, x1, h) => { for (const sy of [-1, 1]) M.box(x0, x1, sy * .0235 - .0015, sy * .0235 + .0015, BZ - .004 - h, BZ - .004 + h, K.black); };
      slot(.481, .497, .007);
      for (const [x0, x1] of [[.430, .473], [.377, .420], [.325, .369], [.270, .314], [.217, .260], [.162, .205]]) { slot(x0, x1, .008); M.box(x0 + .006, x1 - .006, -.009, .009, BZ + .0155, BZ + .0175, K.black); }
      M.box(.498, .514, -.006, .006, BZ + .016, BZ + .024, gun); M.box(.503, .509, -.003, .003, BZ + .024, BZ + .062, gun);   // front sight
      M.box(.067, .164, -.018, .018, BZ + .016, BZ + .032, gun); M.box(.070, .078, -.006, .006, BZ + .032, BZ + .056, gun);    // rear sight base + leaf
      M.box(-.379, .093, -.030, .030, BZ - .037, BZ + .022, gun);                                                      // receiver
      M.box(-.094, .034, -.034, .034, BZ + .022, BZ + .035, gun); M.box(-.060, .030, .030, .060, BZ - .018, BZ + .020, gun);   // feed cover · feed tray (left)
      M.box(-.06, -.01, -.048, -.030, BZ - .010, BZ + .010, gun);                                                       // cocking handle (right)
      M.box(-.242, -.094, -.020, .020, BZ - .052, BZ - .037, gun);                                                      // trigger housing
      M.hex8([[-.114, -.016, BZ - .045], [-.183, -.016, BZ - .045], [-.238, -.016, BZ - .157], [-.202, -.016, BZ - .157],
        [-.114, .016, BZ - .045], [-.183, .016, BZ - .045], [-.238, .016, BZ - .157], [-.202, .016, BZ - .157]], grip);   // pistol grip
      v5Poly(M, Array.from({ length: 9 }, (_, k) => { const a = Math.PI * (.15 + k * .19); return [-.124 + .026 * Math.cos(a), 0, BZ - .066 - .026 * Math.sin(a)]; }), .004, gun, 4);   // trigger guard
      extrudeXZ(M, [[-.379, BZ + .016], [-.44, BZ + .016], [-.53, BZ + .037], [-.555, BZ + .037], [-.56, BZ + .02], [-.56, BZ - .106], [-.529, BZ - .106], [-.454, BZ - .081], [-.454, BZ - .051], [-.379, BZ - .051]], -.022, .022, wood);   // fishtail stock
      for (const sy of [-1, 1]) v5Rod(M, [.53, sy * .016, BZ - .040], [.25, sy * .016, BZ - .046], .006, gun, 4);       // bipod folded back under the jacket
      M.box(.50, .545, -.02, .02, BZ - .046, BZ - .030, gun);                                                           // bipod hinge
      // --- belt from the ammunition boxes (left front) up to the feed, held by the assistant
      if ((o.crew == null ? 4 : o.crew) >= 2) {
        for (const [x, y] of [[.05, .50], [.24, .62]]) M.box(x - .13, x + .13, y - .055, y + .055, 0, .19, K.gun);
        v5Poly(M, [[.05, .50, .20], [-.08, .36, .44], [-.15, .25, .74], [-.02, .07, .93], [-.03, .045, BZ]], .011, brass, 4);
      }
      // --- crew: gunner on the Lafette, assistant on the belt (left), MP 40 cover (right front), rifleman (right rear) — spread round the gun
      v115Crew(M, K, [{ f: 'de_k98_kmg_light', x: -.95, y: .06 }, { f: 'de_k98_kbelt_light', x: -.42, y: .46, yaw: -.3 },
        { f: 'de_mp40_kneel_light', x: .32, y: -.74, yaw: -.35 }, { f: 'de_k98_kneel_light', x: -.82, y: -.72, yaw: -.65 }], o.crew == null ? 4 : o.crew);
      return M;
    }

    // ---------- 2 cm Flak 30 on the Sd.Ah. 51 — colour 3-view (112 px/m: 4.08 m, track 1.49, bore 1.11, sight arm 1.54) + manual drawing + photos ----------
    // axle X 0 Z .38 (R .38 tyres, ±.72) under boxy mudguards; U-frame from the axle round to the hoop apex X −1.31, tow bar to the eye at X −2.0, support jack at X −1.18;
    // upper carriage (round cheeks ±.22) on the base, gun trunnion (.29, 1.13): L/65 barrel to 2.05 with the flash hider, magazine on the left,
    // arched sight arm (Visierarm) back to the sight at X −.65, gunner's seat (Richtsitz) at X −1.1 and foot rest
    function buildFlak30(paint, o = {}) {
      const P = PAINT[paint] || PAINT.grey, M = new Mesh(), K = v112Mats(M, P), L = (ax, oo, prof, seg, m) => M.lathe(ax, oo, prof, seg, m);
      const seat = M.mat([150, 84, 50], { spec: .15, noise: .7 }), th = o.elev == null ? .14 : o.elev;
      for (const sy of [-1, 1]) {
        v5Tyre(M, 0, sy * .72, .38, .38, .16, sy, K.tyre, K.wheel, K.dark, 22);
        // mudguard: arched strip over the wheel + inner / outer skirts, front mud flap
        const N = 10; for (let i = 0; i < N; i++) { const a0 = Math.PI * (.15 + .7 * i / N), a1 = Math.PI * (.15 + .7 * (i + 1) / N), r = .47;
          M.hex8([[r * Math.cos(a0), sy * .62, .38 + r * Math.sin(a0)], [r * Math.cos(a1), sy * .62, .38 + r * Math.sin(a1)], [r * Math.cos(a1), sy * .84, .38 + r * Math.sin(a1)], [r * Math.cos(a0), sy * .84, .38 + r * Math.sin(a0)],
            [(r + .02) * Math.cos(a0), sy * .62, .38 + (r + .02) * Math.sin(a0)], [(r + .02) * Math.cos(a1), sy * .62, .38 + (r + .02) * Math.sin(a1)], [(r + .02) * Math.cos(a1), sy * .84, .38 + (r + .02) * Math.sin(a1)], [(r + .02) * Math.cos(a0), sy * .84, .38 + (r + .02) * Math.sin(a0)]], K.hull); }
        M.box(-.40, .40, sy > 0 ? .84 : -.86, sy > 0 ? .86 : -.84, .55, .86, K.hull);
        M.box(.36, .42, sy * .73 - .11, sy * .73 + .11, .20, .52, K.hull);                                           // mud flap
        // U-frame side rail from the axle back to the hoop
        v115Beam(M, [.25, sy * .52, .44], [-.64, sy * .56, .46], .06, .06, .05, .05, K.hull);
        const H = 8; for (let i = 0; i < H; i++) { const a0 = Math.PI / 2 * i / H, a1 = Math.PI / 2 * (i + 1) / H;
          v115Beam(M, [-.64 - .67 * Math.sin(a0), sy * .56 * Math.cos(a0), .46 + .04 * i / H], [-.64 - .67 * Math.sin(a1), sy * .56 * Math.cos(a1), .46 + .04 * (i + 1) / H], .055, .055, .045, .045, K.hull); }
      }
      L('y', [0, -.70, .38], [[0, 0], [0, .045], [1.40, .045], [1.40, 0]], 10, K.dark);
      v115Beam(M, [-1.31, 0, .50], [-1.92, 0, .63], .06, .05, .06, .05, K.hull); L('y', [-1.99, -.025, .63], [[0, .035], [0, .065], [.05, .065], [.05, .035], [0, .035]], 14, K.dark);
      v5Rod(M, [-1.28, 0, .50], [-1.28, 0, .14], .03, K.dark, 6); M.box(-1.36, -1.20, -.09, .09, .11, .14, K.dark);       // support jack (wound up for travel)
      // base + upper carriage
      L('z', [0, 0, .40], [[0, 0], [0, .42], [.06, .42], [.10, .34], [.16, .34], [.16, 0]], 28, K.hull);
      for (const sy of [-1, 1]) extrudeXZ(M, [[.38, .55], [.44, .86], [.34, 1.10], [.12, 1.21], [-.16, 1.19], [-.36, 1.02], [-.42, .75], [-.32, .55]], sy > 0 ? .16 : -.19, sy > 0 ? .19 : -.16, K.hull);   // upper-carriage cheeks
      M.box(-.30, .32, -.16, .16, .55, .92, K.hull); L('y', [.02, -.16, .80], [[0, 0], [0, .20], [.32, .20], [.32, 0]], 18, K.hull);   // body + elevating drum
      L('y', [-.10, .23, .85], [[0, 0], [0, .11], [.02, .11], [.02, 0]], 16, K.dark); L('y', [.15, -.23, .72], [[0, 0], [0, .10], [-.02, .10], [-.02, 0]], 16, K.dark);   // handwheels
      // seat arm, Richtsitz, foot rest
      v5Rod(M, [-.45, 0, .70], [-.95, 0, .72], .025, K.dark, 6); v5Rod(M, [-.95, 0, .72], [-1.05, 0, .98], .025, K.dark, 6);
      M.hex8([[-1.00, -.15, 1.00], [-1.20, -.15, 1.03], [-1.20, .15, 1.03], [-1.00, .15, 1.00], [-1.00, -.15, 1.04], [-1.20, -.15, 1.07], [-1.20, .15, 1.07], [-1.00, .15, 1.04]], seat);
      M.hex8([[-1.20, -.13, 1.04], [-1.24, -.13, 1.04], [-1.26, -.13, 1.12], [-1.22, -.13, 1.12], [-1.20, .13, 1.04], [-1.24, .13, 1.04], [-1.26, .13, 1.12], [-1.22, .13, 1.12]], seat);
      M.box(-.82, -.51, -.13, .13, .30, .34, seat); v5Rod(M, [-.51, 0, .32], [-.40, 0, .50], .02, K.dark, 5);
      // gun group (about the trunnion): receiver, barrel + flash hider, magazine (left), cradle, sight arm + sight
      const t0 = M.M.length;
      M.box(-.44, .33, -.07, .07, -.09, .07, K.gun); M.box(-.30, .10, -.09, .09, -.14, -.07, K.hull);
      L('x', [.26, 0, 0], [[0, 0], [0, .045], [.20, .042], [.22, .026], [1.30, .022], [1.32, .036], [1.46, .036], [1.46, 0]], 14, K.gun); v120Bore(M, K, 1.72, 0, 0, .020);   // v120: L/65 barrel 1.30 m + flash hider
      M.box(-.08, .14, .07, .17, -.10, .06, K.dark);
      for (const sy of [-1, 1]) v5Poly(M, [[-.09, sy * .16, .14], [-.58, sy * .16, .40], [-.98, sy * .16, .41], [-.93, sy * .16, .10]], .016, K.dark, 5);
      M.box(-1.04, -.84, -.10, .10, .26, .42, K.dark); M.box(-.845, -.835, -.06, .06, .30, .38, K.glass);
      v115Elev(M, t0, th, [.29, 0, 1.13]);
      // crew: gunner on the seat, loader with a magazine, range-taker, two ammunition numbers
      v115Crew(M, K, [{ f: 'de_k98_flsit_light', x: -1.10, y: 0, z: .63 }, { f: 'de_k98_sload_light', x: .25, y: .85, yaw: -.4, round: [.30, 1.08, .32, .055] },
        { f: 'de_mp40_binoc_light', x: -1.45, y: -1.00 }, { f: 'de_k98_kload_light', x: -1.65, y: .95, yaw: -.3, round: [.30, .92, .30, .05] },
        { f: 'de_k98_kload_light', x: .20, y: -1.05, yaw: .4, round: [.30, .92, .30, .05] }], o.crew == null ? 5 : o.crew);
      return M;
    }

    // ---------- 7.5 cm Leichtgeschütz 40 — TTT drawing + photos (45 in overall, 29.5 in barrel): spoked wheels on the axletree in front, tripod of a front leg
    //   and two rear legs on the base ring, pedestal, cradle on the trunnion (.0, .66): barrel to X .87, breech ring, Venturi tube back to X −.40 ----------
    function buildLG40(paint, o = {}) {
      const P = PAINT[paint] || PAINT.grey, M = new Mesh(), K = v112Mats(M, P), L = (ax, oo, prof, seg, m) => M.lathe(ax, oo, prof, seg, m), th = o.elev == null ? .17 : o.elev;
      for (const sy of [-1, 1]) v118Spoked(M, K, .18, sy * .44, .25, .25, .055, sy, 10, .035);
      L('y', [.18, -.42, .25], [[0, 0], [0, .03], [.84, .03], [.84, 0]], 10, K.dark);
      L('z', [0, 0, .24], [[0, 0], [0, .22], [.05, .22], [.07, .18], [.07, 0]], 24, K.hull);                            // base ring
      v5Rod(M, [.18, 0, .25], [.78, 0, .03], .024, K.hull, 6); M.box(.74, .86, -.05, .05, 0, .025, K.dark); M.box(.84, .87, -.06, .06, -.04, .06, K.dark);   // front leg + spade
      for (const sy of [-1, 1]) { v5Rod(M, [-.12, sy * .14, .28], [-.80, sy * .72, .03], .024, K.hull, 6); M.box(-.86, -.74, sy * .72 - .05, sy * .72 + .05, 0, .025, K.dark); }
      L('z', [0, 0, .31], [[0, 0], [0, .17], [.20, .14], [.26, .14], [.26, 0]], 22, K.hull);                            // pedestal
      for (const sy of [-1, 1]) extrudeXZ(M, [[.14, .54], [.10, .70], [-.10, .70], [-.14, .54]], sy > 0 ? .12 : -.15, sy > 0 ? .15 : -.12, K.hull);   // trunnion brackets
      L('y', [-.06, -.20, .44], [[0, 0], [0, .07], [-.015, .07], [-.015, 0]], 14, K.dark); L('y', [.06, -.21, .58], [[0, 0], [0, .075], [-.015, .075], [-.015, 0]], 14, K.dark);   // handwheels
      const t0 = M.M.length;
      M.box(-.12, .12, -.11, .11, -.11, .11, K.gun);                                                                     // breech ring
      L('x', [.12, 0, 0], [[0, 0], [0, .075], [.06, .068], [.70, .062], [.72, .072], [.75, .072], [.75, 0]], 18, K.gun); v120Bore(M, K, .87, 0, 0, .075);   // barrel .75 m (TTT)
      L('x', [-.12, 0, 0], [[0, 0], [0, .085], [-.18, .082], [-.24, .09], [-.28, .095], [-.28, 0]], 18, K.gun);           // Venturi tube
      M.box(-.20, -.12, -.10, .10, -.10, .10, K.dark);
      for (let k = 0; k < 9; k++) { const a = -Math.PI * (.62 + k * .06); M.box(.20 * Math.cos(a) - .012, .20 * Math.cos(a) + .012, -.16, -.13, .20 * Math.sin(a) - .012, .20 * Math.sin(a) + .012, K.dark); }   // elevating arc teeth
      M.box(-.06, .16, .11, .19, .08, .16, K.dark); L('x', [.16, .15, .12], [[0, 0], [0, .025], [.04, .025], [.04, 0]], 8, K.glass);   // sight
      v115Elev(M, t0, th, [0, 0, .66]);
      // crew (clear of the back-blast): gunner at the sight, loader, ammunition numbers, commander
      v115Crew(M, K, [{ f: 'de_k98_kgun_light', x: .05, y: .62, yaw: -.5 }, { f: 'de_k98_kload_light', x: -.20, y: -.70, yaw: .6, round: [.30, .92, .45, .05] },
        { f: 'de_k98_kload_light', x: -.70, y: 1.15, yaw: -.4, round: [.30, .92, .45, .05] }, { f: 'de_mp40_kneel_light', x: -.95, y: -1.20, yaw: -1.0 },
        { f: 'de_mp40_binoc_light', x: .55, y: 1.05 }], o.crew == null ? 5 : o.crew);
      return M;
    }

    // ---------- 7.5 cm Pak 40 — J. L. Rue side (119.4 px/m from its foot scale: 6.27 m, shield 1.26) + 4-view / 5-view + photos — v119 ----------
    // spoked wheels R .40 on ±.81, axle Z .40; shield: two spaced plates (outer + inner, 30 mm apart) meeting in a V that points FORWARD (top view),
    //   crease X .30 at the bottom, outer edges swept back .40, leaning back .22 to the top Z 1.25, outer top corners chamfered, ±.05 slot for the gun,
    //   sight window in the left half; lower apron hinged under it and slung forward to Z .14; L/46 barrel 3.50 m from the breech ring (X −.62) to the
    //   double-baffle muzzle brake (X 2.88), bore Z .96, cradle + recoil cylinders, breech ring X −1.08 … −.62, sight on the left; split trails 3.45 m
    function buildPak40(paint, o = {}) {
      const P = PAINT[paint] || PAINT.grey, M = new Mesh(), K = v112Mats(M, P), L = (ax, oo, prof, seg, m) => M.lathe(ax, oo, prof, seg, m);
      const sp = o.spread == null ? .40 : o.spread, th = o.elev == null ? 0 : o.elev;
      for (const sy of [-1, 1]) v118Spoked(M, K, 0, sy * .81, .40, .40, .13, sy, 10, .06);
      L('y', [0, -.74, .40], [[0, 0], [0, .05], [1.48, .05], [1.48, 0]], 10, K.dark);
      M.box(-.45, .25, -.30, .30, .38, .62, K.hull); for (const sy of [-1, 1]) M.box(-.50, .20, sy * .17 - .03, sy * .17 + .03, .60, .98, K.hull);   // lower / upper carriage cheeks
      // shield half: point at lateral fraction s (0 crease … 1 outer edge) and height z, pushed back by `back` for the inner plate
      const SP = (sy, s, z, back) => [.30 - s * .40 - (z - .52) * .30 - back, sy * (.05 + s * .65), z];
      const OUT = [[0, .52], [1, .52], [1, 1.12], [.84, 1.25], [0, 1.25]];
      for (const sy of [-1, 1]) {
        const a = SP(sy, 0, .52, 0), b = SP(sy, 1, .52, 0), c = SP(sy, 0, 1.25, 0), u = sub(b, a), v = sub(c, a);
        let n = nrm(cross(u, v)); if (n[0] < 0) n = neg(n);                                                              // outward (forward) normal
        const T = [-n[0] * .008, -n[1] * .008, -n[2] * .008];
        v5Slab(M, OUT.map(([s, z]) => SP(sy, s, z, 0)), T, K.hull);                                                       // outer plate
        v5Slab(M, OUT.map(([s, z]) => SP(sy, s, z, .035)), T, K.hull);                                                    // inner plate
        for (const [s, z] of [[1, .52], [1, 1.12], [0, .52]]) { const p = SP(sy, s, z, 0), q = SP(sy, s, z, .035); M.box(Math.min(p[0], q[0]) - .005, Math.max(p[0], q[0]) + .005, p[1] - .012, p[1] + .012, z, z + .03, K.hull); }   // spacer edges
        for (const [s, z] of [[.15, .60], [.5, .60], [.85, .60], [.15, 1.17], [.5, 1.19], [.9, .95], [.9, .75]]) { const p = SP(sy, s, z, -.004); M.box(p[0] - .012, p[0] + .012, p[1] - .012, p[1] + .012, z - .012, z + .012, K.dark); }   // bolts
        if (sy > 0) v5Slab(M, [[.45, 1.00], [.62, 1.00], [.62, 1.08], [.45, 1.08]].map(([s, z]) => SP(sy, s, z, -.004)), [n[0] * .004, n[1] * .004, n[2] * .004], K.black);   // sight window (left)
        M.box(.12, .26, sy * .52 - .03, sy * .52 + .03, .40, .60, K.dark);                                                // shield bracket to the axle
      }
      v5Slab(M, [[.30, -.62, .50], [.30, .62, .50], [.46, .62, .14], [.46, -.62, .14]], [-.012, 0, -.006], K.hull);       // lower apron, slung forward
      for (const sy of [-1, 1]) L('y', [.30, sy * .32, .50], [[0, 0], [0, .018], [sy * .18, .018], [sy * .18, 0]], 8, K.dark);   // apron hinges
      v115Trails(M, K, -.45, .22, .42, 3.08, .26, .22, .15, .15, 2.50, .40, .22, sp, null);   // v120: trail end X −3.53 as drawn (overall 6.36 m)
      const t0 = M.M.length;
      // (gun frame: u = X + .30 from the trunnion; parts placed at the drawing's X)
      M.box(-.78, -.32, -.13, .13, -.12, .14, K.gun);                                                                    // breech ring + block (X −1.08 … −.62)
      L('x', [-.32, 0, 0], [[0, 0], [0, .08], [.45, .075], [.47, .062], [3.20, .05], [3.22, .05], [3.22, 0]], 16, K.gun);   // v120: L/46 tube (X −.62 … 2.60)
      L('x', [2.90, 0, 0], [[0, 0], [0, .062], [.03, .075], [.09, .075], [.10, .05], [.13, .05], [.14, .075], [.22, .075], [.23, .062], [.23, 0]], 16, K.gun); v120Bore(M, K, 3.13, 0, 0, .075);   // muzzle brake to X 2.83 → 3.45 m
      M.box(-.30, .75, -.10, .10, -.17, -.06, K.hull); for (const sy of [-1, 1]) L('x', [-.25, sy * .06, -.11], [[0, 0], [0, .045], [1.25, .045], [1.25, 0]], 12, K.dark);   // cradle + recoil cylinders
      M.box(.70, 1.04, -.09, .09, -.22, .02, K.hull);                                                                     // spring housing (front, X .40 … .74)
      M.box(-.70, -.28, .16, .26, .02, .30, K.dark); M.box(-.285, -.275, .18, .24, .18, .26, K.glass);                    // sight (left, X −1.0 … −.58)
      M.box(-1.14, -.78, -.08, .08, -.08, .06, K.dark);                                                                   // firing box / guard (X −1.44 … −1.08)
      v115Elev(M, t0, th, [-.30, 0, .96]);
      // crew spread round the breech: layer (left), loader (right), two ammunition numbers outside the trails, MP 40 cover beside the left wheel
      v115Crew(M, K, [{ f: 'de_k98_kgun_light', x: -1.05, y: .68 }, { f: 'de_k98_kload_light', x: -1.12, y: -.60, yaw: .2, round: [.30, .92, .62, .045] },
        { f: 'de_k98_kload_light', x: -1.90, y: 1.02, yaw: -.3, round: [.30, .92, .62, .045] }, { f: 'de_k98_kload_light', x: -1.90, y: -1.02, yaw: .3, round: [.30, .92, .62, .045] },
        { f: 'de_mp40_kneel_light', x: -.15, y: 1.35, yaw: .35 }], o.crew == null ? 5 : o.crew);
      return M;
    }

    // ---------- 15 cm sFH 18 — firing side (55 px/m: 7.85 m, bore 1.46, top 1.71) + 5-view (track 1.80, wheels Ø1.2 × .28) + Voyager photo ----------
    // perforated disc wheels R .60 on ±.90, axle Z .60; box top carriage; howitzer on the trunnion (−.40, 1.25), bore 1.42: L/29.5 tube to X 3.47,
    // recuperator above the tube (X −.70 … .82), cradle below to X 1.38 with its rear extension to X −2.1, equilibrators; box split trails 4.1 m with the big spades; no shield
    function buildSFH18(paint, o = {}) {
      const P = PAINT[paint] || PAINT.grey, M = new Mesh(), K = v112Mats(M, P), L = (ax, oo, prof, seg, m) => M.lathe(ax, oo, prof, seg, m);
      const sp = o.spread == null ? .42 : o.spread, th = o.elev == null ? .06 : o.elev;
      for (const sy of [-1, 1]) {
        v5Tyre(M, 0, sy * .90, .60, .60, .28, sy, K.tyre, K.wheel, K.dark, 30);
        for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + .2; L('y', [.38 * Math.cos(a), sy * (.90 + .145), .60 + .38 * Math.sin(a)], [[0, 0], [0, .075], [sy * .006, .075], [sy * .006, 0]], 12, K.black); }
        L('y', [0, sy * .70, .60], [[0, 0], [0, .20], [sy * .06, .20], [sy * .06, 0]], 18, K.dark);                     // brake drum
      }
      L('y', [0, -.80, .60], [[0, 0], [0, .07], [1.60, .07], [1.60, 0]], 12, K.dark);
      M.box(-.80, .55, -.36, .36, .55, .82, K.hull);
      for (const sy of [-1, 1]) { extrudeXZ(M, [[.45, .80], [.30, 1.18], [-.25, 1.40], [-.62, 1.32], [-.80, .80]], sy > 0 ? .24 : -.29, sy > 0 ? .29 : -.24, K.hull);   // top-carriage cheeks
        v116Spring(M, K, .40, sy * .34, .80, 1.25, .07); }                                                              // equilibrators
      v115Trails(M, K, -.65, .30, .66, 4.10, .26, .32, .20, .20, 3.95, .55, .32, sp, null);
      const t0 = M.M.length;
      // (gun frame: u = X + .40 from the trunnion (−.40, 1.25), bore .17 above it)
      M.box(-.70, -.27, -.21, .21, -.03, .37, K.gun);                                                                    // breech ring + block (X −1.10 … −.67)
      L('x', [-.27, 0, .17], [[0, 0], [0, .15], [.60, .14], [.62, .125], [4.35, .115], [4.40, .13], [4.44, .13], [4.44, 0]], 18, K.gun); v120Bore(M, K, 4.17, 0, .17, .149);   // v120: L/29.5 tube 4.44 m to X 3.77
      L('x', [-.30, 0, .50], [[0, 0], [0, .15], [1.40, .15], [1.42, .165], [1.50, .165], [1.52, .10], [1.52, 0]], 18, K.gun);   // recuperator above the tube (X −.70 … .82)
      for (const x of [.10, .70]) M.box(x, x + .06, -.16, .16, .16, .55, K.dark);                                         // cradle bands round tube + recuperator
      M.box(-.20, 1.78, -.16, .16, -.25, .05, K.hull); M.box(1.74, 1.80, -.17, .17, -.26, .06, K.dark);                    // cradle under the tube (to X 1.38)
      M.box(-1.70, -.20, -.14, .14, -.29, -.01, K.hull);                                                                  // cradle rear extension (X −2.1 … −.6)
      M.box(-.62, -.32, .21, .31, .20, .48, K.dark); M.box(-.325, -.315, .23, .29, .34, .44, K.glass);                      // sight (left)
      v115Elev(M, t0, th, [-.40, 0, 1.25]);
      L('y', [-.55, .33, .95], [[0, 0], [0, .15], [.02, .15], [.02, 0]], 16, K.dark); L('y', [-.40, -.33, .95], [[0, 0], [0, .14], [-.02, .14], [-.02, 0]], 16, K.dark);   // handwheels
      v115Crew(M, K, [{ f: 'de_k98_kgun_light', x: -1.10, y: .92 }, { f: 'de_k98_sload_light', x: -1.95, y: .10, yaw: .1, round: [.30, 1.08, .65, .075] },
        { f: 'de_k98_kload_light', x: -2.10, y: -1.30, yaw: .3, round: [.30, .92, .65, .075] }, { f: 'de_mp40_binoc_light', x: -.20, y: -1.35 }], o.crew == null ? 4 : o.crew);
      return M;
    }

    // v120 bore: a black disc of the calibre on the muzzle face (axis X), so the calibres read at a glance
    function v120Bore(M, K, x, y, z, cal) { M.lathe('x', [x - .001, y, z], [[0, 0], [0, cal / 2], [.006, cal / 2], [.006, 0]], 16, K.black); }

    // ══════════════════════════════════════════════════════════════
    // v121 — four more German weapons from the supplied drawings: 15 cm Nebelwerfer (six tubes), 8.8 cm Flak 36 with shield on its two
    //   Sd.Anh. 202 bogies, 2 cm Flak 38 emplaced on its triangular platform with shield, 21 cm Obice da 210/22 (Italian, taken into German service)
    //   X forward, Y left, Z up; origin on the ground under the axle / pedestal centre
    // ══════════════════════════════════════════════════════════════
    { V7POSES.f38sit = { hip: [0, 0, .44], lean: .12, twist: 0, feet: [{ at: [.42, .16, .09], dir: [1, .1, 0], hint: [1, 0, .6] }, { at: [.42, -.16, .09], dir: [1, -.1, 0], hint: [1, 0, .6] }],
        hands: [[.40, -.16, .66], [.40, .16, .70]], el: [[-.25, -.9, -1], [-.25, .9, -1]], head: [.04, 0, .14], pitch: -.05 };   // Flak 38 gunner on the low seat, hands on the handwheels
    }
    // arched mudguard over a wheel (axis Y): strip of radius r from angle a0 to a1 (0 = forward), width w centred on y
    function v121Fender(M, x, y, z, r, w, a0, a1, m) {
      const N = 10; for (let i = 0; i < N; i++) { const b0 = a0 + (a1 - a0) * i / N, b1 = a0 + (a1 - a0) * (i + 1) / N, P = (b, rr, yy) => [x + rr * Math.cos(b), yy, z + rr * Math.sin(b)];
        M.hex8([P(b0, r, y - w / 2), P(b1, r, y - w / 2), P(b1, r, y + w / 2), P(b0, r, y + w / 2), P(b0, r + .02, y - w / 2), P(b1, r + .02, y - w / 2), P(b1, r + .02, y + w / 2), P(b0, r + .02, y + w / 2)], m); }
    }
    // perforated disc wheel with a solid tyre (axis Y, outward = sy)
    function v121Disc(M, K, x, y, z, R, w, sy, holes, hr) {
      v5Tyre(M, x, y, z, R, w, sy, K.tyre, K.wheel, K.dark, 0);
      for (let k = 0; k < holes; k++) { const a = k * 2 * Math.PI / holes + .2; M.lathe('y', [x + R * .58 * Math.cos(a), y + sy * (w / 2 + .005), z + R * .58 * Math.sin(a)], [[0, 0], [0, hr], [sy * .006, hr], [sy * .006, 0]], 12, K.black); }
    }

    // ---------- 15 cm Nebelwerfer (six tubes) — v122: traced on the 4-view side (72 px/m from the 1.30 m tubes; X = (x − 205)/72, Z = (253 − y)/72): wheel R .36,
    //   cluster axis 1.06 above the ground at the axle, 12.5° as drawn, tubes X −.48 … .79; trail end 1.34 m behind the axle (Z .20); front support foot .20 … .62
    //   ahead; front view (tube ring) + box art. Six 1.30 m tubes of 158.5 mm (Ø .18) in a ring R .21; retaining frames at the rear end and the MIDDLE of the tubes
    function buildNbW(paint, o = {}) {
      const P = PAINT[paint] || PAINT.grey, M = new Mesh(), K = v112Mats(M, P), L = (ax, oo, prof, seg, m) => M.lathe(ax, oo, prof, seg, m);
      const sp = o.spread == null ? .34 : o.spread, th = o.elev == null ? .30 : o.elev, RT = .21, TR = .09, CAL = .1585, AZ = .31;
      for (const sy of [-1, 1]) v121Disc(M, K, 0, sy * .66, .36, .36, .12, sy, 6, .033);
      L('y', [0, -.61, .36], [[0, 0], [0, .045], [1.22, .045], [1.22, 0]], 10, K.dark);
      M.box(-.25, .17, -.24, .24, .30, .47, K.hull);                                                                            // axle body / lower carriage
      for (const sy of [-1, 1]) extrudeXZ(M, [[.13, .45], [.08, .80], [-.10, .85], [-.27, .70], [-.27, .45]], sy > 0 ? .26 : -.30, sy > 0 ? .30 : -.26, K.hull);   // trunnion brackets
      L('y', [-.18, .31, .58], [[0, 0], [0, .09], [.02, .09], [.02, 0]], 14, K.dark);                                           // elevating handwheel (left)
      v5Rod(M, [.14, 0, .25], [.37, 0, .05], .03, K.dark, 6); M.box(.20, .62, -.09, .09, 0, .045, K.dark);                     // front support leg + foot plate (as drawn)
      v115Trails(M, K, -.20, .14, .28, 1.12, .20, .12, .09, .10, 1.00, .18, .13, sp, [.08, .20]);                            // trail end 1.34 m behind the axle
      const t0 = M.M.length;
      // tube ring about the cluster axis (gun frame: axis z = AZ above the trunnion; tubes from u −.40 to the muzzles u .90)
      for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3, y = RT * Math.cos(a), z = AZ + RT * Math.sin(a);
        L('x', [-.40, y, z], [[0, 0], [0, TR], [.05, TR], [.06, TR - .007], [1.24, TR - .007], [1.25, TR], [1.30, TR], [1.30, 0]], 18, K.gun);
        v120Bore(M, K, .90, y, z, CAL); }
      for (const u of [-.35, .21]) L('x', [u, 0, AZ], [[0, .29], [0, .32], [.08, .32], [.08, .29], [0, .29]], 28, K.hull);      // retaining frames: rear end + middle of the tubes
      L('x', [-.32, 0, AZ], [[0, 0], [0, .09], [1.0, .09], [1.0, 0]], 12, K.dark);                                               // centre spindle
      M.box(-.30, .40, -.14, .14, AZ - .38, AZ - .28, K.hull); M.box(-.09, .09, -.18, .18, -.05, AZ - .34, K.hull);             // cradle + trunnion block
      M.box(-.02, .24, .33, .48, AZ - .02, AZ + .20, K.dark); M.box(.08, .14, .29, .33, AZ + .02, AZ + .10, K.dark);            // firing box (left) + bracket
      v115Elev(M, t0, th, [-.08, 0, .75]);
      v115Crew(M, K, [{ f: 'de_k98_sload_light', x: -.85, y: .58, yaw: -.2, round: [.30, 1.08, .85, .079] }, { f: 'de_k98_kload_light', x: -1.10, y: -.72, yaw: .3, round: [.30, .92, .85, .079] },
        { f: 'de_k98_kgun_light', x: -.35, y: -.78, yaw: .4 }, { f: 'de_mp40_binoc_light', x: .45, y: 1.0 }], o.crew == null ? 4 : o.crew);
      return M;
    }

    // ---------- 8.8 cm Flak 36 with shield on the Sd.Anh. 202 — v122: lower part traced on the Trumpeter side (44 px/m from the 4.938 m barrel, ground y 255):
    //   bogies X +2.11 / −2.39, wheels R .49; cruciform main beam LOW between the bogies (Z .52 … .75) with the rear arm to X −3.1; cone pedestal from the platform
    //   (R .50 at Z .75) to the top carriage (R .27 at Z 1.82); upper part from the Flak 18 drawing + model photo: stepped barrel (thin L/56 tube, cone step, thick
    //   jacket, ring, cradle), recuperator above, two cylinders under the barrel; V shield on the top carriage, its lower edge (Z 1.12) clear of the bogies ----------
    function buildFlak36(paint, o = {}) {
      const P = PAINT[paint] || PAINT.grey, M = new Mesh(), K = v112Mats(M, P), L = (ax, oo, prof, seg, m) => M.lathe(ax, oo, prof, seg, m);
      const th = o.elev == null ? .10 : o.elev, wood = M.mat([118, 76, 44], { spec: .15, noise: .8 }), B0 = .52, B1 = .75;
      const drum = (x, y, z) => { const s = Math.sign(y); L('y', [x, y - s * .11, z], [[0, 0], [0, .25], [s * .22, .25], [s * .22, 0]], 22, K.dark); L('y', [x, y + s * .11, z], [[0, .20], [0, .24], [s * .03, .24], [s * .03, .20], [0, .20]], 20, wood);
        for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; v5Rod(M, [x, y + s * .125, z], [x + .21 * Math.cos(a), y + s * .125, z + .21 * Math.sin(a)], .01, K.dark, 4); } };
      // --- bogies: wheels, mudguards with side skirts, frame, two winch drums each, axle
      for (const [bx, front] of [[2.11, 1], [-2.39, 0]]) {
        for (const sy of [-1, 1]) { v121Disc(M, K, bx, sy * .86, .49, .49, .24, sy, 5, .045); v121Fender(M, bx, sy * .86, .49, .57, .30, -Math.PI * .02, Math.PI * 1.02, K.hull);
          M.box(bx - .58, bx + .58, sy > 0 ? 1.01 : -1.03, sy > 0 ? 1.03 : -1.01, .52, .74, K.hull); }
        L('y', [bx, -.76, .49], [[0, 0], [0, .06], [1.52, .06], [1.52, 0]], 10, K.dark);
        M.box(bx - .62, bx + .62, -.62, .62, .62, 1.02, K.hull);
        for (const sy of [-1, 1]) drum(bx, sy * .36, 1.35);                                                                  // winch drums above the wheels, both sides
      }
      v5Rod(M, [2.73, 0, .70], [5.45, 0, .70], .045, K.dark, 6); L('y', [5.53, -.03, .70], [[0, .05], [0, .09], [.06, .09], [.06, .05], [0, .05]], 14, K.dark);   // drawbar + eye
      // --- cruciform: low main beam between the bogies, rear arm end, centre plate, arm jacks (raised), side outriggers folded up
      M.box(-3.10, 2.75, -.18, .18, B0, B1, K.hull);
      for (const x of [-3.0, 2.68]) { M.box(x - .06, x + .06, -.05, .05, .30, B0, K.dark); L('z', [x, 0, .26], [[0, 0], [0, .12], [.04, .12], [.04, 0]], 14, K.dark); }
      L('z', [0, 0, B1], [[0, 0], [0, .58], [.06, .58], [.06, 0]], 30, K.hull);
      for (const sy of [-1, 1]) { v115Beam(M, [.02, sy * .48, B1 + .02], [.12, sy * .54, 1.95], .18, .13, .24, .18, K.hull);
        L('z', [.12, sy * .54, 1.95], [[0, 0], [0, .15], [.04, .15], [.04, 0]], 16, K.dark); }
      // --- cone pedestal + traverse ring + top carriage with its cheeks, handwheels, fuze setter
      L('z', [0, 0, B1 + .06], [[0, 0], [0, .50], [.10, .48], [1.01, .27], [1.01, 0]], 28, K.hull);
      L('z', [0, 0, 1.82], [[0, 0], [0, .44], [.07, .44], [.07, 0]], 28, K.dark);
      M.box(-.85, .45, -.36, .36, 1.89, 2.02, K.hull);
      for (const sy of [-1, 1]) extrudeXZ(M, [[.45, 1.95], [.30, 2.26], [-.20, 2.36], [-.66, 2.24], [-.85, 1.95]], sy > 0 ? .30 : -.36, sy > 0 ? .36 : -.30, K.hull);
      L('y', [-.10, .37, 1.98], [[0, 0], [0, .16], [.02, .16], [.02, 0]], 18, K.dark); L('y', [-.55, .37, 1.98], [[0, 0], [0, .14], [.02, .14], [.02, 0]], 18, K.dark);   // layers' handwheels (left)
      M.box(-1.20, -.86, -.70, -.40, 1.95, 2.42, K.dark); M.box(-1.17, -.89, -.68, -.42, 2.42, 2.46, K.hull);                    // fuze setter (rear right)
      // --- V shield carried on the top carriage (two panels creased forward, leaning back), centre piece under the gun slot, two support arms
      const SZ0 = 1.12, SZ1 = 2.88, cx = z => 1.00 - (z - SZ0) / (SZ1 - SZ0) * .40, hw = z => 1.22 - (z - SZ0) / (SZ1 - SZ0) * .12, T = .012;
      const sp = (sy, f, z) => [cx(z) - f * .20, sy * (.14 + f * (hw(z) - .14)), z];
      for (const sy of [-1, 1]) {
        v5Slab(M, [sp(sy, 0, SZ0), sp(sy, 1, SZ0), sp(sy, 1, SZ1 - .14), sp(sy, .82, SZ1), sp(sy, 0, SZ1)], [-T, -sy * T * .4, -T * .25], K.hull);
        for (const [f, z] of [[.3, 1.2], [.7, 1.2], [.3, 2.8], [.7, 2.8], [.95, 2.0], [.5, 2.0]]) { const q = sp(sy, f, z); M.box(q[0] + .002, q[0] + .016, q[1] - .015, q[1] + .015, z - .015, z + .015, K.dark); }
        v5Rod(M, [.30, sy * .33, 2.10], [cx(2.10) - .04, sy * .50, 2.10], .035, K.dark, 6);                                       // support arm to the cheek
      }
      v5Slab(M, [sp(-1, 0, SZ0), sp(1, 0, SZ0), sp(1, 0, 1.86), sp(-1, 0, 1.86)], [-T, 0, -T * .25], K.hull);                      // under the gun slot
      // --- gun group about the trunnion (−.28, 2.12), bore .04 above (muzzle X 3.87 as drawn): breech, cradle, stepped barrel, recuperator above, two cylinders below, loading tray, sight
      const t0 = M.M.length, BO = .04;
      M.box(-.80, -.40, -.17, .17, BO - .17, BO + .19, K.gun);                                                                   // breech ring
      M.box(-.40, 1.31, -.19, .19, BO - .21, BO + .21, K.hull);                                                                  // cradle
      L('x', [-.40, 0, BO], [[0, 0], [0, .14], [1.71, .14], [1.71, .158], [1.79, .158], [1.79, .125], [2.51, .125], [2.60, .088], [4.45, .085], [4.46, .093], [4.55, .093], [4.55, 0]], 20, K.gun);   // stepped barrel to X 3.70
      v120Bore(M, K, 4.15, 0, BO, .088);
      L('x', [-.62, 0, BO + .36], [[0, 0], [0, .12], [1.93, .12], [1.95, .09], [2.02, .09], [2.02, 0]], 16, K.gun);              // recuperator above
      L('x', [.10, 0, BO - .24], [[0, 0], [0, .085], [1.85, .085], [1.87, .065], [1.87, 0]], 14, K.gun);                         // two cylinders under the barrel
      L('x', [.10, 0, BO - .40], [[0, 0], [0, .10], [1.82, .10], [1.84, .075], [1.84, 0]], 14, K.gun);
      M.box(1.20, 1.30, -.12, .12, BO - .52, BO - .14, K.dark);                                                                 // front yoke round them
      M.box(-1.65, -.80, -.10, .10, BO - .29, BO - .21, K.dark); for (let k = 0; k < 8; k++) M.box(-1.60 + k * .10, -1.57 + k * .10, -.11, .11, BO - .21, BO - .18, K.dark);   // loading tray
      M.box(-.20, .12, .30, .44, BO + .08, BO + .26, K.dark); M.box(.115, .125, .32, .42, BO + .12, BO + .22, K.glass);           // sight (left)
      v115Elev(M, t0, th, [-.28, 0, 2.12]);
      // crew: two layers at the handwheels (left), loader on the platform with a round, fuze setter, ammunition number, commander (MP 40)
      v115Crew(M, K, [{ f: 'de_k98_sgun_light', x: -.10, y: 1.05, z: .75, yaw: -Math.PI / 2 }, { f: 'de_k98_sgun_light', x: -.55, y: 1.00, z: .75, yaw: -Math.PI / 2 },
        { f: 'de_k98_sload_light', x: -1.45, y: .10, z: .75, yaw: .1, round: [.30, 1.08, .85, .045] }, { f: 'de_k98_kload_light', x: -1.30, y: -1.25, yaw: .4, round: [.30, .92, .85, .045] },
        { f: 'de_k98_kload_light', x: -3.05, y: 1.15, yaw: -.3, round: [.30, .92, .85, .045] }, { f: 'de_mp40_binoc_light', x: 1.30, y: -1.55 }], o.crew == null ? 6 : o.crew);
      return M;
    }

