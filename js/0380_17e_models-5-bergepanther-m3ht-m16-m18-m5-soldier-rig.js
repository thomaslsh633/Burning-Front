    // ---------- Bergepanther Ausf. A (Sd.Kfz. 179), late version — from the supplied 1:48 4-view (37.5 px/m) and the colour painting ----------
    // Panther A chassis (hull, glacis, rear, engine deck and running gear shared with the calibrated Panther G model, no side skirts), turret replaced by an open
    // recovery compartment: 16 mm steel box (X 1.55 → -1.55, ±1.28) topped by removable wooden plank sides, grating over the winch, 2 cm KwK 38 on a shielded
    // pedestal on the front deck, A-frame jib crane erected on the left rear corner, large earth spade lowered at the rear.
    function buildBergepanther(paint) {
      const P = PAINT[paint] || PAINT.grey, M = new Mesh();
      const hull = M.mat(P.hull, { spec: .08 }), dark = M.mat(P.dark, { spec: .05 }), gun = M.mat(P.gun, { spec: .22, noise: .5 });
      const trk = M.mat([58, 54, 48], { spec: .06, noise: 1.4 }), trkR = M.mat([70, 64, 56], { shadow: false, noise: 1.4 }), tyre = M.mat([30, 31, 33], { noise: .6 }), wheel = M.mat(P.wheel, { spec: .12 });
      const rack = M.mat([62, 58, 52], { shadow: false, noise: 1.2 }), grille = M.mat([34, 36, 38], { shadow: false, noise: .5 }), glass = M.mat([20, 26, 30], { spec: .8, shadow: false, noise: 0 });
      const wood = M.mat([118, 90, 60], { spec: .03, noise: 1.4 }), innerM = M.mat([78, 81, 84], { spec: .03, noise: .8 }), canvas = M.mat([96, 92, 70], { spec: .03, noise: 1.2 }), chain = M.mat([58, 56, 54], { spec: .3, noise: .4 });
      const L = (ax, o, prof, seg, m) => M.lathe(ax, o, prof, seg, m);
      const DZ = 1.90, SKT = 1.46;
      const glZ = x => 1.0 + (3.20 - x) * .719;
      // ---- hull ----
      M.hex8([[-2.85, -.90, .52], [2.88, -.90, .52], [2.88, .90, .52], [-2.85, .90, .52],                       // lower tub between the tracks + sloped lower nose
              [-2.95, -.90, 1.05], [3.20, -.90, 1.00], [3.20, .90, 1.00], [-2.95, .90, 1.05]], hull);
      M.box(-2.92, 2.56, -1.50, 1.50, .96, SKT, hull);                                                         // sponson (no skirts on the Bergepanther)
      loftXY(M, [[-2.95, -1.47], [2.56, -1.47], [2.56, 1.47], [-2.95, 1.47]], [[-2.95, -1.26], [1.94, -1.26], [1.94, 1.26], [-2.95, 1.26]], SKT, DZ, hull);   // superstructure: sloped sides, 36° upper front plate
      { const q = [[3.20, -.88], [3.20, .88], [2.56, 1.47], [2.56, -1.47]];                                      // glacis (lower nose → upper front plate)
        M.hex8(q.map(([x, y]) => [x, y, glZ(x) - .07]).concat(q.map(([x, y]) => [x, y, glZ(x) + .012])), hull); }
      // rear: vertical lower plate, overhanging sloped rear plate, exhaust armour boxes with tail pipes
      M.box(-3.00, -2.90, -1.50, 1.50, .55, SKT, hull);
      M.box(-3.02, -3.00, -1.30, 1.30, .60, 1.40, dark);                                                    // rear-plate frame
      extrudeXZ(M, [[-2.95, SKT], [-3.27, 1.77], [-3.29, DZ], [-2.90, DZ], [-2.90, SKT]], -1.34, 1.34, hull);
      for (const sy of [-1, 1]) {
        extrudeXZ(M, [[-3.04, 1.30], [-3.29, 1.23], [-3.55, 1.71], [-3.18, 1.71]], sy * .40 - .15, sy * .40 + .15, dark);
        L('x', [-3.69, sy * .40, 1.77], [[0, 0], [0, .06], [.30, .06], [.30, 0]], 10, dark);
        L('x', [-3.69, sy * .40, 1.77], [[0, 0], [0, .035], [.04, .035], [.04, 0]], 8, grille);
        L('x', [-3.14, sy * 1.12, .98], [[0, 0], [0, .055], [.14, .055], [.14, 0]], 10, dark);                      // tow hooks
        L('x', [-3.06, sy * 1.30, .74], [[0, 0], [0, .115], [.05, .115], [.05, .07], [.08, .07], [.08, 0]], 14, dark);   // idler adjuster covers
      }
      // front mudguards (curved nose, flat top at Z 1.49) with ribbed cover strips
      const fend = [[3.44, .90], [3.40, 1.12], [3.29, 1.31], [3.14, 1.42], [2.99, 1.48], [2.56, 1.49], [2.56, .90]];
      extrudeXZ(M, fend, .86, 1.60, hull); extrudeXZ(M, fend, -1.60, -.86, hull);
      for (const sy of [-1, 1]) {
        for (const yy of [1.03, 1.22, 1.41]) M.box(2.62, 3.02, sy > 0 ? yy - .015 : -yy - .015, sy > 0 ? yy + .015 : -yy + .015, 1.49, 1.515, dark);
        L('z', [2.40, sy * 1.17, 1.56], [[0, 0], [0, .075], [.07, .075], [.07, .04], [.09, .04], [.09, 0]], 10, dark);   // lifting / towing eyes on the hull-front corners
      }
      // ---- front deck: hatches, driver's vision port, bow MG ----
      for (const sy of [-1, 1]) {
        pnOct(M, 1.36, sy * .58, .25, .36, .10, DZ, DZ + .035, dark);
        pnOct(M, 1.36, sy * .58, .21, .31, .09, DZ + .035, DZ + .06, hull);
        M.box(1.28, 1.44, sy * .58 - .03, sy * .58 + .03, DZ + .06, DZ + .075, dark);
      }
      { const xa = 2.18, xb = 2.42, ya = .26, yb = .66, zt = 1.78;                                                // driver's vision port housing on the glacis
        M.hex8([[xb, ya, glZ(xb) - .03], [xb, yb, glZ(xb) - .03], [xa, yb, glZ(xa) - .03], [xa, ya, glZ(xa) - .03], [xb - .02, ya, zt], [xb - .02, yb, zt], [xa + .02, yb, zt], [xa + .02, ya, zt]], hull);
        M.box(xb - .03, xb - .005, .30, .62, 1.66, 1.71, glass); }
      L('x', [2.48, -.42, glZ(2.48) + .06], [[-.10, 0], [-.10, .09], [-.03, .125], [.05, .125], [.09, .09], [.10, .035], [.34, .025], [.34, 0]], 16, hull);   // bow MG ball + barrel
      // ---- engine deck: 4 louvred intakes, 2 fan covers, filler plate, exhaust pots ----
      for (const sy of [-1, 1]) {
        for (const [x0, x1] of [[-3.26, -2.85], [-1.79, -1.38]]) {
          const ya = sy > 0 ? .57 : -1.27, yb = sy > 0 ? 1.27 : -.57;
          M.box(x0, x1, ya, yb, DZ, DZ + .02, hull);
          M.box(x0 + .02, x1 - .02, ya + .02, yb - .02, DZ + .02, DZ + .045, grille);
          for (let k = 0; k < 4; k++) { const xx = x0 + .05 + k * .1; M.box(xx, xx + .025, ya + .02, yb - .02, DZ + .045, DZ + .062, dark); }
        }
        L('z', [-2.32, sy * .87, DZ], [[0, 0], [0, .35], [.07, .35], [.07, .31], [.03, .31], [.03, 0]], 28, hull);   // fan cover ring
        L('z', [-2.32, sy * .87, DZ + .02], [[0, 0], [0, .31], [.012, .31], [.012, 0]], 28, grille);
        for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + .2; M.rectZ(-2.32 + .21 * Math.cos(a), sy * .87 + .21 * Math.sin(a), a, .22, .028, DZ + .03, DZ + .06, hull); }
        L('z', [-2.32, sy * .87, DZ + .03], [[0, 0], [0, .12], [.04, .12], [.05, .08], [.05, 0]], 14, hull);        // fan hub
        // exhaust pots on the rear deck
        L('z', [-2.88, sy * .29, DZ], [[0, 0], [0, .14], [.03, .14], [.03, .075], [.26, .075], [.28, .06], [.28, 0]], 14, dark);
      }
      pnOct(M, -2.10, 0, .52, .39, .10, DZ, DZ + .022, dark);                                                      // raised filler plate between the fans
      for (const sy of [-1, 1]) L('z', [-2.21, sy * .185, DZ + .022], [[0, 0], [0, .165], [.035, .165], [.035, .125], [.06, .125], [.06, 0]], 18, hull);   // coolant / oil filler caps
      L('z', [-2.79, 0, DZ], [[0, 0], [0, .13], [.02, .13], [.02, .06], [.04, .06], [.04, 0]], 14, dark);        // starter-crank cover
      // ---- hull sides: spare track links in holders, tow cable, tool clamps ----
      for (const sy of [-1, 1]) {
        for (const [x0, x1] of [[1.72, 2.30], [-.02, 1.02]]) { pnSlopeRow(M, sy, x0, x1, 1.72, 1.92, .03, dark);
          for (let r = 0; Math.round((x1 - x0) / .27) > r; r++) { const xs = x0 + .02 + r * .27; pnSlopeRow(M, sy, xs, xs + .23, 1.74, 1.90, .08, rack); pnSlopeRow(M, sy, xs + .07, xs + .16, 1.78, 1.86, .10, dark); } }
        pnSlopeRow(M, sy, -2.80, 1.60, 1.55, 1.58, .05, dark);
        for (const px of [-2.45, -1.40, -.35, .70]) pnSlopeRow(M, sy, px - .03, px + .03, 1.50, 1.64, .07, dark);
        for (const px of [-2.55, -1.85, -.95, .15, 1.15]) M.box(px - .03, px + .03, sy > 0 ? 1.50 : -1.52, sy > 0 ? 1.52 : -1.50, 1.12, 1.30, dark);   // bolt pairs on the sponson side
        // front-fender stowage bins
        M.box(2.62, 3.30, sy > 0 ? 1.02 : -1.60, sy > 0 ? 1.60 : -1.02, 1.49, 1.72, hull); M.box(2.60, 3.32, sy > 0 ? 1.00 : -1.62, sy > 0 ? 1.62 : -1.00, 1.72, 1.745, dark);
      }
      // ---- recovery compartment: steel box, wooden plank sides, grating over the winch, crew seats ----
      const BX0 = 1.55, BX1 = -1.55, BY = 1.28, BZ = 2.47, PX0 = .98, PX1 = -1.45, PZ = 2.95, T = .02;
      for (const sy of [-1, 1]) { M.box(BX1, BX0, sy > 0 ? BY - T : -BY, sy > 0 ? BY : -BY + T, DZ, BZ, hull); M.box(BX1 + .02, BX0 - .02, sy > 0 ? BY - T - .004 : -BY + T, sy > 0 ? BY - T : -BY + T + .004, DZ + .01, BZ - .01, innerM); }
      M.box(BX0 - T, BX0, -BY, BY, DZ, BZ, hull); M.box(BX1, BX1 + T, -BY, BY, DZ, BZ, hull);
      M.box(BX1 + T, BX0 - T, -BY + T, BY - T, DZ, DZ + .015, innerM);
      for (const [xx, yy] of [[BX0, BY], [BX0, -BY], [BX1, BY], [BX1, -BY]]) M.box(xx - .035, xx + .035, yy - .035, yy + .035, DZ, BZ + .02, dark);   // corner angles
      for (let k = 0; k < 9; k++) { const xx = BX1 + .15 + k * .36; for (const sy of [-1, 1]) M.box(xx - .01, xx + .01, sy * BY - .012, sy * BY + .012, BZ - .06, BZ - .04, dark); }   // rivets
      // wooden plank sides (sides up): 4 boards per side between steel uprights, front & rear boards
      const board = (x0, x1, y0, y1, z0, z1) => M.box(x0, x1, y0, y1, z0, z1, wood);
      for (let b = 0; b < 4; b++) { const z0 = BZ + .02 + b * .118, z1 = z0 + .108;
        for (const sy of [-1, 1]) board(PX1, PX0, sy > 0 ? BY - .055 : -BY, sy > 0 ? BY : -BY + .055, z0, z1);
        board(PX0 - .055, PX0, -BY + .055, BY - .055, z0, z1); board(PX1, PX1 + .055, -BY + .055, BY - .055, z0, z1); }
      for (const xx of [PX0 - .02, -.24, PX1 + .02]) for (const sy of [-1, 1]) M.box(xx - .025, xx + .025, sy > 0 ? BY - .005 : -BY - .03, sy > 0 ? BY + .03 : -BY + .005, BZ - .30, PZ + .02, dark);   // steel uprights
      for (const yy of [-.42, .42]) M.box(PX0 - .07, PX0 + .005, yy - .025, yy + .025, BZ - .02, PZ + .02, dark);
      M.box(PX1 + .08, PX0 - .08, -BY + .08, BY - .08, DZ + .015, DZ + .18, wood);                                            // stacked planks on the floor
      for (let k = 0; k < 9; k++) { const yy = -BY + .14 + k * .29; M.box(PX1 + .08, PX0 - .08, yy - .005, yy + .005, DZ + .18, DZ + .19, dark); }
      M.box(PX0, BX0 - .02, -1.06, 1.12, DZ + .44, DZ + .46, dark); M.box(PX0 + .02, BX0 - .04, -1.04, 1.10, DZ + .46, DZ + .47, grille);   // grating over the winch
      for (let k = 0; k < 6; k++) { const xx = PX0 + .06 + k * .09; M.box(xx - .006, xx + .006, -1.04, 1.10, DZ + .46, DZ + .475, dark); }
      M.box(-1.30, -.30, -.40, .40, DZ + .19, DZ + .42, canvas);                                                                 // tarpaulin roll
      // ---- 2 cm KwK 38 on a pedestal with a folded shield, front deck ----
      { const gx = 2.55, gz = 2.45;
        L('z', [gx, 0, glZ(gx) - .02], [[0, 0], [0, .16], [.10, .14], [gz - glZ(gx) - .06, .10], [gz - glZ(gx) - .06, 0]], 14, dark);
        const sh = (y0, y1, xa, xb) => v5Slab(M, [[xa, y0, 2.12], [xb, y1, 2.12], [xb - .10, y1, 2.62], [xa - .10, y0, 2.62]], [-.012, 0, 0], hull);
        sh(-.18, .18, 2.82, 2.82); for (const sy of [-1, 1]) sh(sy * .18, sy * .52, 2.82, 2.42);
        M.box(gx - .25, gx + .25, -.08, .08, gz - .07, gz + .07, gun); M.box(gx - .10, gx + .05, .08, .20, gz - .14, gz + .02, dark);   // receiver + magazine
        L('x', [gx + .25, 0, gz], [[0, 0], [0, .035], [.22, .035], [.22, .025], [1.20, .022], [1.24, .03], [1.30, .03], [1.30, 0]], 12, gun);
        M.box(gx - .05, gx + .08, -.20, -.10, gz + .04, gz + .14, dark); }                                                   // sight
      L('z', [1.10, -1.10, DZ], [[0, 0], [0, .03], [.40, .03], [.40, 0]], 8, dark); L('x', [1.10, -1.10, 2.36], [[0, 0], [0, .025], [.55, .022], [.55, 0]], 8, gun);   // MG 34 on a post
      // ---- A-frame jib crane on the left rear corner: mast, jib, chain, hook block, back stays ----
      { const mx = -1.60, my = 1.42, mzt = 4.35, tip = [1.62, .20, 3.62], base = [mx, my, 2.50];
        v5Rod(M, [mx, my, DZ], [mx, my, mzt], .055, dark, 8); M.box(mx - .10, mx + .10, my - .10, my + .10, DZ, DZ + .16, dark);
        M.box(mx - .14, mx + .14, 1.18, my + .10, DZ - .02, DZ + .04, dark); extrudeXZ(M, [[mx - .12, DZ - .02], [mx + .12, DZ - .02], [mx + .04, 1.60], [mx - .04, 1.60]], my - .02, my + .04, dark);   // mast foot bracket on the hull side
        v5Rod(M, [mx, my, 1.62], [mx, 1.30, 1.62], .03, dark, 4);
        v5Rod(M, [mx - .08, my, DZ + .05], [mx - .08, my, mzt - .08], .03, dark, 6);
        v5Rod(M, base, tip, .05, dark, 8); v5Rod(M, [mx, my - .14, 2.40], [tip[0] - .03, tip[1] - .10, tip[2] - .02], .035, dark, 6);   // jib (twin tubes)
        v5Rod(M, [mx, my, mzt - .05], [tip[0], tip[1], tip[2]], .014, chain, 5); const nl = 18; for (let k = 0; k < nl; k++) { const t0 = k / nl, t1 = (k + .8) / nl, a = [mx + (tip[0] - mx) * t0, my + (tip[1] - my) * t0, mzt - .05 + (tip[2] - mzt + .05) * t0], b = [mx + (tip[0] - mx) * t1, my + (tip[1] - my) * t1, mzt - .05 + (tip[2] - mzt + .05) * t1]; v5Rod(M, a, b, .028, chain, 6); }
        v5Rod(M, [tip[0], tip[1], tip[2]], [tip[0], tip[1], 2.75], .012, chain, 5);                                          // hook rope + block + hook
        L('z', [tip[0], tip[1], 2.95], [[0, 0], [0, .07], [.20, .07], [.20, 0]], 10, dark); L('z', [tip[0], tip[1], 2.68], [[0, 0], [0, .03], [.14, .05], [.27, .03], [.27, 0]], 10, chain);
        v5Rod(M, [mx, my, mzt - .05], [-3.05, 1.15, DZ + .04], .015, chain, 5); v5Rod(M, [mx, my, mzt - .05], [-3.05, .60, DZ + .04], .015, chain, 5);   // back stays
        for (const yy of [1.15, .60]) { M.box(-3.10, -3.00, yy - .04, yy + .04, DZ, DZ + .05, dark); }
        L('z', [mx, my, mzt], [[0, 0], [0, .07], [.06, .07], [.06, 0]], 10, dark); }
      // ---- rear: spade mounts, lowered earth spade (two arms + V-shaped blade), tow coupling ----
      { const sz = (x) => .88 - (-3.05 - x) * .07;
        for (const sy of [-1, 1]) {
          extrudeXZ(M, [[-2.95, 1.10], [-3.20, 1.18], [-3.25, .62], [-3.00, .55]], sy * .95 - .07, sy * .95 + .07, dark);    // hinge bracket
          v5Rod(M, [-3.10, sy * .95, .90], [-4.48, sy * .82, .72], .07, dark, 8);                                             // spade arm
          v5Rod(M, [-3.10, sy * .95, .90], [-3.60, sy * .30, .82], .045, dark, 6);
          L('z', [-3.08, sy * .95, DZ], [[0, 0], [0, .05], [.40, .05], [.40, 0]], 8, dark); M.box(-3.14, -3.02, sy * .95 - .07, sy * .95 + .07, DZ, DZ + .03, dark);   // travel-lock post on the rear deck
        }
        // blade: lower plate digging down to the ground, upper plate leaning back up
        v5Slab(M, [[-4.45, -1.30, .80], [-4.45, 1.30, .80], [-5.10, 1.30, .02], [-5.10, -1.30, .02]], [-.03, 0, .02], hull);
        v5Slab(M, [[-4.45, -1.30, .80], [-4.45, 1.30, .80], [-5.00, 1.30, 1.42], [-5.00, -1.30, 1.42]], [-.03, 0, -.02], hull);
        for (const yy of [-.95, -.32, .32, .95]) v5Slab(M, [[-4.45, yy - .02, .80], [-4.85, yy - .02, .40], [-4.80, yy - .02, 1.12]], [0, .04, 0], dark);   // stiffener ribs
        L('y', [-4.45, -1.30, .80], [[0, 0], [0, .06], [2.60, .06], [2.60, 0]], 10, dark);
        L('x', [-3.00, 0, .70], [[0, 0], [0, .10], [-.12, .10], [-.12, .05], [-.30, .05], [-.30, 0]], 12, dark); }
      // ---- tracks & running gear ----
      const C1 = [2.82, .86], R1 = .50, C2 = [-2.51, .74], R2 = .42, pts = [];
      const arc = (c, r, a0, a1, n) => { for (let k = 0; k <= n; k++) { const a = a0 + (a1 - a0) * k / n; pts.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]); } };
      arc(C1, R1, Math.PI / 2, -1.12, 14);                    // sprocket: over the top and the front
      pts.push([2.24, .03], [-2.10, .03]);                     // inclined run to the ground, flat ground run
      arc(C2, R2, -Math.PI * .44, -Math.PI * 1.5, 12);        // idler: up around the rear
      pts.push([-.20, 1.18], [2.00, 1.30]);                    // top run (hidden behind the skirts)
      const n = pts.length, cen = [(C1[0] + C2[0]) / 2, .62], thick = .10, outer = pts, inner = pts.map((p, i) => {
        const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n]; let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
        let nx = -tz, nz = tx; if (nx * (cen[0] - p[0]) + nz * (cen[1] - p[1]) < 0) { nx = -nx; nz = -nz; } return [p[0] + nx * thick, p[1] + nz * thick];
      });
      for (const sy of [-1, 1]) {
        const ya = sy > 0 ? .96 : -1.63, yb = sy > 0 ? 1.63 : -.96, f = sy > 0 ? 1 : -1;
        M.belt(outer, inner, ya, yb, trk);
        for (let i = 0; i < n; i++) {                       // link ridges along the outer surface
          const a = outer[i], b = outer[(i + 1) % n], seg = Math.hypot(b[0] - a[0], b[1] - a[1]); if (seg < 1e-6) continue;
          let nx = (b[1] - a[1]) / seg, nz = -(b[0] - a[0]) / seg; if (nx * ((a[0] + b[0]) / 2 - cen[0]) + nz * ((a[1] + b[1]) / 2 - cen[1]) < 0) { nx = -nx; nz = -nz; }
          const cnt = Math.max(1, Math.round(seg / .15)), h = .035;
          for (let q = 0; q < cnt; q++) {
            const t0 = (q + .15) / cnt, t1 = (q + .62) / cnt, p0 = [a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0], p1 = [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1];
            M.hex8([[p0[0], ya, p0[1]], [p1[0], ya, p1[1]], [p1[0], yb, p1[1]], [p0[0], yb, p0[1]], [p0[0] + nx * h, ya, p0[1] + nz * h], [p1[0] + nx * h, ya, p1[1] + nz * h], [p1[0] + nx * h, yb, p1[1] + nz * h], [p0[0] + nx * h, yb, p0[1] + nz * h]], trkR);
          }
        }
        M.box(-2.25, 2.20, ya, yb, .02, .24, trk);
        // 8 interleaved road-wheel stations, 0.565 m pitch: odd stations carry the outer wheel row, even stations the inner row
        const RW = .40, WZ = .535;
        for (let k = 0; k < 8; k++) {
          const x = 2.05 - .565 * k, yc = sy * (k % 2 === 1 ? 1.40 : 1.20);
          L('y', [x, yc, WZ], [[-.07 * f, 0], [-.07 * f, RW, wheel], [.04 * f, RW, tyre], [.04 * f, RW - .08, tyre], [.06 * f, RW - .09, wheel], [.035 * f, .22, wheel], [.035 * f, .10, wheel], [.075 * f, .10, wheel], [.075 * f, 0, wheel]], 24, wheel);
          for (let b = 0; b < 8; b++) { const a = b * Math.PI / 4 + .2; L('y', [x + .155 * Math.cos(a), yc + .075 * f, WZ + .155 * Math.sin(a)], [[0, 0], [0, .017], [.016 * f, .017], [.016 * f, 0]], 6, dark); }   // hub bolt ring
          L('y', [x, yc + .075 * f, WZ], [[0, 0], [0, .06], [.02 * f, .06], [.02 * f, 0]], 10, dark);   // hub cap
        }
        // drive sprocket (front): disc, 10 lightening holes, 16 teeth, hub cap
        L('y', [C1[0], sy * 1.30, C1[1]], [[-.08 * f, 0], [-.08 * f, .43, wheel], [.05 * f, .43, wheel], [.05 * f, .37, dark], [.07 * f, .37, wheel], [.07 * f, .15, wheel], [.10 * f, .15, wheel], [.10 * f, 0, wheel]], 24, wheel);
        for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5; L('y', [C1[0] + .27 * Math.cos(a), sy * 1.30 + .06 * f, C1[1] + .27 * Math.sin(a)], [[0, 0], [0, .055], [.015 * f, .055], [.015 * f, 0]], 8, dark); }
        for (let k = 0; k < 16; k++) pnRadial(M, C1[0], C1[1], k * Math.PI / 8 + .1, .40, .50, .10, .06, sy * 1.30 - .08, sy * 1.30 + .08, wheel);
        L('y', [C1[0], sy * 1.30 + .10 * f, C1[1]], [[0, 0], [0, .10], [.03 * f, .10], [.03 * f, .05], [.05 * f, .05], [.05 * f, 0]], 14, dark);
        // idler (rear) with hub cap
        L('y', [C2[0], sy * 1.30, C2[1]], [[-.08 * f, 0], [-.08 * f, .34, wheel], [.04 * f, .34, wheel], [.04 * f, .28, dark], [.06 * f, .28, wheel], [.06 * f, .10, wheel], [.09 * f, .10, wheel], [.09 * f, 0, wheel]], 22, wheel);
        L('y', [C2[0], sy * 1.30 + .09 * f, C2[1]], [[0, 0], [0, .12], [.025 * f, .12], [.025 * f, .06], [.05 * f, .06], [.05 * f, 0]], 14, dark);
      }
      return M;
    }

    // ---------- M3 half-track family: M3 personnel carrier, M16 MGMC (M45 quad .50), M3 75 mm GMC (M1897A4 on M2A3) ----------
    // Shared chassis measured on the supplied side / top / front / rear drawings (GMC 81.7 px/m, M16 75.3 px/m; wheelbase 3.44 m, body 1.96 m wide):
    // front roller, 8.25-20 front wheels (R .47) under arched fenders, hood with armoured radiator louvres, cab with windshield armour, armoured rear body
    // (X .06 → -2.75, ±.98, Z 1.07 → 1.87), rubber-band track: front sprocket, 2 bogies × 2 road wheels with volute springs, return roller, rear idler.
    function buildM3HT(paint, variant) {
      const P = PAINT[paint] || PAINT.olive, M = new Mesh();
      const hull = M.mat(P.hull, { spec: .08 }), dark = M.mat(P.dark, { spec: .05 }), gun = M.mat(P.gun, { spec: .22, noise: .5 });
      const trk = M.mat([44, 44, 42], { spec: .05, noise: 1.0 }), trkR = M.mat([56, 55, 52], { shadow: false, noise: 1.2 }), tyre = M.mat([30, 31, 33], { noise: .6 }), wheel = M.mat(P.wheel, { spec: .12 });
      const grille = M.mat([34, 36, 38], { shadow: false, noise: .5 }), glass = M.mat([200, 205, 190], { spec: .9, shadow: false, noise: 0 }), black = M.mat([22, 24, 26], { shadow: false, noise: 0 });
      const inner = M.mat([88, 94, 62], { spec: .03, noise: .8 }), seat = M.mat([72, 66, 50], { spec: .03, noise: 1.0 }), canvas = M.mat([112, 108, 80], { spec: .03, noise: 1.2 }), steel = M.mat([60, 62, 58], { spec: .3, noise: .5 });
      const L = (ax, o, prof, seg, m) => M.lathe(ax, o, prof, seg, m);
      const BW = .98, BT = 1.87, BB = 1.07, BXF = .06, BXR = -2.75, T = .02;          // body half-width, top, bottom edge, front, rear, plate thickness
      const ZT = variant === 'm16' ? 1.98 : BT;

      // ---- chassis frame, front axle, front roller ----
      for (const sy of [-1, 1]) M.box(-2.80, 2.78, sy * .42 - .05, sy * .42 + .05, .52, .70, dark);
      M.box(2.70, 2.80, -.55, .55, .55, .80, dark);                                                                     // front bumper
      if (variant !== 'm16') L('y', [2.94, -.40, .73], [[0, 0], [0, .14], [.80, .14], [.80, 0]], 18, steel);           // front roller drum
      if (variant !== 'm16') for (const sy of [-1, 1]) { M.box(2.76, 3.02, sy * .44 - .03, sy * .44 + .03, .62, .84, dark); L('y', [2.94, sy * .44, .73], [[0, 0], [0, .05], [.03 * sy, .05], [.03 * sy, 0]], 10, dark); }
      L('y', [2.08, -.80, .47], [[0, 0], [0, .05], [1.60, .05], [1.60, 0]], 10, dark); M.box(1.95, 2.21, -.62, .62, .50, .58, dark);   // front axle + leaf springs
      for (const sy of [-1, 1]) { v5Tyre(M, 2.08, sy * .82, .47, .47, .24, sy, tyre, wheel, dark, 26); for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5; L('y', [2.08 + .30 * Math.cos(a), sy * .935, .47 + .30 * Math.sin(a)], [[0, 0], [0, .012], [.01 * sy, .012], [.01 * sy, 0]], 5, dark); } }
      // ---- hood (armoured), radiator louvres, headlights with brush guards ----
      v5Loft(M, [[2.42, [[-.42, .62], [-.44, 1.30], [-.38, 1.39], [.38, 1.39], [.44, 1.30], [.42, .62]]], [1.14, [[-.50, .62], [-.52, 1.44], [-.45, 1.53], [.45, 1.53], [.52, 1.44], [.50, .62]]]], hull);
      M.box(2.42, 2.46, -.42, .42, .64, 1.36, dark); for (let k = 0; k < 9; k++) { const zz = .70 + k * .072; M.box(2.45, 2.48, -.39, .39, zz, zz + .03, hull); }
      for (const sy of [-1, 1]) {
        M.box(1.15, 1.45, sy > 0 ? .50 : -.535, sy > 0 ? .535 : -.50, 1.08, 1.47, hull);                                 // hood side armour door with X brace
        v5Rod(M, [1.17, sy * .54, 1.10], [1.43, sy * .54, 1.45], .012, dark, 5); v5Rod(M, [1.17, sy * .54, 1.45], [1.43, sy * .54, 1.10], .012, dark, 5);
        L('x', [2.42, sy * .62, 1.02], [[0, 0], [0, .075], [.04, .09], [.12, .09], [.14, .075], [.14, 0]], 14, dark); L('x', [2.56, sy * .62, 1.02], [[0, 0], [0, .078], [.006, .075], [.006, 0]], 14, glass);
        v5Poly(M, [[2.40, sy * .52, .92], [2.62, sy * .52, .95], [2.62, sy * .52, 1.10], [2.48, sy * .52, 1.16]], .01, dark); v5Poly(M, [[2.40, sy * .72, .92], [2.62, sy * .72, .95], [2.62, sy * .72, 1.10], [2.48, sy * .72, 1.16]], .01, dark);
        M.box(2.38, 2.44, sy * .62 - .02, sy * .62 + .02, .80, .95, dark);
      }
      // ---- front fenders (arched over the wheel, sweeping down to the running boards), running boards ----
      for (const sy of [-1, 1]) {
        const prof = [[2.58, .90], [2.50, 1.04], [2.36, 1.12], [2.12, 1.16], [1.88, 1.14], [1.68, 1.04], [1.52, .86], [1.42, .66], [1.36, .60]];
        for (let i = 0; i + 1 < prof.length; i++) { const [xa, za] = prof[i], [xb, zb] = prof[i + 1], ya = sy > 0 ? .50 : -.98, yb = sy > 0 ? .98 : -.50;
          M.hex8([[xa, ya, za], [xb, ya, zb], [xb, yb, zb], [xa, yb, za], [xa, ya, za - .025], [xb, ya, zb - .025], [xb, yb, zb - .025], [xa, yb, za - .025]], hull); }
        for (let i = 0; i + 1 < prof.length; i++) { const [xa, za] = prof[i], [xb, zb] = prof[i + 1];                    // rolled outer lip
          v5Rod(M, [xa, sy * .97, za - .012], [xb, sy * .97, zb - .012], .016, hull, 6); }
        M.box(BXF - .02, 1.40, sy > 0 ? .62 : -1.0, sy > 0 ? 1.0 : -.62, .57, .60, hull);                               // running board
        M.box(1.36, 1.42, sy > 0 ? .55 : -1.0, sy > 0 ? 1.0 : -.55, .57, .66, hull);
        M.box(.95, 1.25, sy > 0 ? .80 : -.97, sy > 0 ? .97 : -.80, .60, .72, dark);                                       // tool box on the running board
      }
      // ---- cab: sides with doors, windshield armour with two vision slits, folded canvas top, rear-view mirrors ----
      const CX0 = 1.14, CXW = .92, CZ = 1.53;
      for (const sy of [-1, 1]) {
        M.box(BXF, CX0, sy > 0 ? BW - T : -BW, sy > 0 ? BW : -BW + T, .60, CZ, hull);                                      // cab side
        M.hex8([[CX0, sy * .52, .62], [CX0, sy * BW, .62], [CX0, sy * BW, CZ], [CX0, sy * .52, CZ], [CX0 - T, sy * .52, .62], [CX0 - T, sy * BW, .62], [CX0 - T, sy * BW, CZ], [CX0 - T, sy * .52, CZ]], hull);
        M.box(.14, .80, sy > 0 ? BW : -BW - .006, sy > 0 ? BW + .006 : -BW, .66, 1.48, dark);                             // door outline
        M.box(.20, .74, sy > 0 ? BW + .006 : -BW - .012, sy > 0 ? BW + .012 : -BW - .006, .70, 1.44, hull);
        L('y', [.65, sy * (BW + .01), 1.12], [[0, 0], [0, .02], [.03 * sy, .02], [.03 * sy, 0]], 6, dark);
        for (const zz of [.80, 1.30]) M.box(.12, .20, sy > 0 ? BW : -BW - .02, sy > 0 ? BW + .02 : -BW, zz - .05, zz + .05, dark);   // hinges
        L('z', [1.10, sy * .97, CZ], [[0, 0], [0, .012], [.30, .012], [.30, 0]], 6, dark); M.box(1.08, 1.12, sy * .97 - .05, sy * .97 + .05, CZ + .26, CZ + .38, glass);   // mirror
      }
      // windshield armour (leaning back slightly), raised for vision, frame
      v5Slab(M, [[CXW, -BW + .02, CZ], [CXW, BW - .02, CZ], [CXW - .06, BW - .02, ZT - .02], [CXW - .06, -BW + .02, ZT - .02]], [-.02, 0, 0], hull);
      for (const yc of [-.42, .42]) M.box(CXW - .01, CXW + .015, yc - .20, yc + .20, CZ + .14, CZ + .17, black);
      M.box(CXW - .08, CXW, -BW + .02, BW - .02, CZ - .02, CZ + .01, dark);
      // cab side frame (both sides): windshield side post, top rail back to the body pillar, door-top capping rail, intermediate post, diagonal brace, corner gusset
      for (const sy of [-1, 1]) {
        const y = sy * (BW - .018), fb = [CXW - .01, y, CZ], ft = [CXW - .07, y, ZT - .02], rt = [BXF + .05, y, ZT - .01], rb = [BXF + .05, y, CZ + .01], r = .026;
        v5Rod(M, fb, ft, r, dark, 4); v5Rod(M, ft, rt, r, dark, 4); v5Rod(M, [CXW, y, CZ + .012], rb, r, dark, 4);
        v5Rod(M, [.50, y, CZ + .01], [.50, y, ZT - .015], r * .85, dark, 4); v5Rod(M, [CXW - .05, y, ZT - .05], [.53, y, CZ + .03], r * .85, dark, 4); v5Rod(M, [.47, y, ZT - .04], [BXF + .08, y, CZ + .03], r * .85, dark, 4);
        v5Slab(M, [[CXW, sy * (BW - .004), CZ], [CXW - .30, sy * (BW - .004), CZ], [CXW - .04, sy * (BW - .004), CZ + .30]], [0, -sy * .016, 0], hull);
        v5Slab(M, [[BXF + .02, sy * (BW - .004), CZ], [BXF + .28, sy * (BW - .004), CZ], [BXF + .02, sy * (BW - .004), CZ + .26]], [0, -sy * .016, 0], hull);
      }
      v5Rod(M, [CXW - .07, -BW + .02, ZT - .02], [CXW - .07, BW - .02, ZT - .02], .026, dark, 4);                       // windshield top bar
      M.box(CXW - .10, CX0, -.52, .52, 1.42, CZ, hull);                                                                  // cowl / dash
      for (const yc of [-.40, .40]) { M.box(.30, .60, yc - .22, yc + .22, .62, 1.05, seat); M.box(.22, .30, yc - .22, yc + .22, 1.05, 1.42, seat); }   // front seats
      v5Rod(M, [CXW - .06, .40, 1.47], [.70, .40, 1.29], .022, dark, 6); L('z', [.70, .40, 1.28], [[0, .16], [0, .19], [.02, .19], [.02, .16]], 18, black);   // steering column (from the dash) + wheel
      for (let k = 0; k < 3; k++) { const a = k * 2 * Math.PI / 3; v5Rod(M, [.70, .40, 1.29], [.70 + .17 * Math.cos(a), .40 + .17 * Math.sin(a), 1.29], .008, black, 4); }
      // ---- armoured rear body: sides, rear plate with door, floor, bulkhead posts, stowage ----
      for (const sy of [-1, 1]) {
        M.box(BXR, BXF, sy > 0 ? BW - T : -BW, sy > 0 ? BW : -BW + T, BB, ZT, hull);
        M.box(BXR + .02, BXF - .02, sy > 0 ? BW - T - .004 : -BW + T, sy > 0 ? BW - T : -BW + T + .004, BB + .1, ZT - .01, inner);
        M.box(BXF, BXF + .08, sy > 0 ? BW - .04 : -BW, sy > 0 ? BW : -BW + .04, .60, ZT, hull);                          // pillar at the cab / body joint
        for (let k = 0; k < 14; k++) { const xx = BXF - .12 - k * .20; for (const zz of [BB + .04, ZT - .04]) M.box(xx - .01, xx + .01, sy * BW - .012, sy * BW + .012, zz - .01, zz + .01, dark); }   // rivets
        for (const xx of [-.95, -2.05]) M.box(xx - .006, xx + .006, sy * BW - .008, sy * BW + .008, BB, ZT, dark);      // plate seams
        M.box(BXR + .05, BXF - .05, sy > 0 ? BW - .01 : -BW - .03, sy > 0 ? BW + .03 : -BW + .01, BB - .03, BB, dark);  // lower lip
        L('x', [-2.55, sy * (BW + .03), ZT - .12], [[0, 0], [0, .012], [2.30, .012], [2.30, 0]], 6, dark);               // grab rail
        for (const xx of [-.30, -1.30, -2.40]) M.box(xx - .02, xx + .02, sy > 0 ? BW : -BW - .04, sy > 0 ? BW + .04 : -BW, ZT - .14, ZT - .10, dark);
      }
      M.box(BXR - T, BXR, -BW, BW, BB - .45, ZT, hull);                                                                  // rear plate
      M.box(BXR - T - .01, BXR - T, -.36, .36, BB - .40, ZT - .12, dark); M.box(BXR - T - .02, BXR - T - .01, -.32, .32, BB - .36, ZT - .16, hull);   // rear door
      L('x', [BXR - .03, -.20, 1.50], [[0, 0], [0, .02], [-.05, .02], [-.05, 0]], 6, dark);
      for (const sy of [-1, 1]) { L('x', [BXR - .02, sy * .80, 1.05], [[0, 0], [0, .045], [-.05, .045], [-.05, 0]], 10, M.mat([120, 40, 34], { shadow: false })); M.box(BXR - .10, BXR, sy * .80 - .05, sy * .80 + .05, .60, .72, dark); }
      L('x', [BXR - .02, 0, .66], [[0, 0], [0, .06], [-.10, .06], [-.10, .03], [-.18, .03], [-.18, 0]], 12, dark);       // pintle
      M.box(BXR + .02, BXF - .02, -BW + .02, BW - .02, .95, .98, inner);                                                  // floor
      M.box(BXR + .02, BXF - .02, -.55, .55, .55, .95, dark);                                                             // lower hull between the tracks
      // ---- tracks: sprocket (front), 2 volute-spring bogies × 2 road wheels, return roller, idler (rear) ----
      const S1 = [-.33, .655], S2 = [-2.35, .655], RWX = [-.75, -1.12, -1.55, -1.92], RWZ = .22, YT = .80;
      const out = [];
      v5Arc(out, S1, .31, Math.PI / 2, -2.05, 14);
      out.push([-.68, .0], [-2.00, .0]);
      v5Arc(out, S2, .31, -1.15, -Math.PI * 1.5, 12);
      for (const sy of [-1, 1]) {
        const ya = sy * YT - .15, yb = sy * YT + .15, f = sy, yc = sy * YT;
        v5Track(M, out, ya, yb, .035, .11, trk, trkR, false);
        for (const x of RWX) { L('y', [x, yc, RWZ], [[-.12 * f, 0], [-.12 * f, .17, wheel], [-.04 * f, .17, wheel], [-.04 * f, .12, dark], [.04 * f, .12, dark], [.04 * f, .17, wheel], [.12 * f, .17, wheel], [.12 * f, 0, wheel]], 18, wheel);
          L('y', [x, yc + .12 * f, RWZ], [[0, 0], [0, .05], [.02 * f, .04], [.02 * f, 0]], 10, dark); }
        for (const [a, b] of [[0, 1], [2, 3]]) { const xc = (RWX[a] + RWX[b]) / 2;                                         // bogie: arms, volute spring, bracket to the frame
          M.hex8([[RWX[a], yc + .13 * f, RWZ - .02], [xc, yc + .13 * f, RWZ + .14], [xc, yc + .13 * f, RWZ + .20], [RWX[a], yc + .13 * f, RWZ + .04], [RWX[a], yc + .17 * f, RWZ - .02], [xc, yc + .17 * f, RWZ + .14], [xc, yc + .17 * f, RWZ + .20], [RWX[a], yc + .17 * f, RWZ + .04]], dark);
          M.hex8([[RWX[b], yc + .13 * f, RWZ - .02], [xc, yc + .13 * f, RWZ + .14], [xc, yc + .13 * f, RWZ + .20], [RWX[b], yc + .13 * f, RWZ + .04], [RWX[b], yc + .17 * f, RWZ - .02], [xc, yc + .17 * f, RWZ + .14], [xc, yc + .17 * f, RWZ + .20], [RWX[b], yc + .17 * f, RWZ + .04]], dark); }
        { const xc = -1.335; M.box(xc - .14, xc + .14, sy > 0 ? .62 : -.98, sy > 0 ? .98 : -.62, .36, .62, dark); L('z', [xc, yc, .36], [[0, .07], [0, .11], [.16, .11], [.16, .07]], 14, steel);
          L('y', [xc, yc, .80], [[-.06 * f, 0], [-.06 * f, .09, tyre], [.06 * f, .09, tyre], [.06 * f, .06, wheel], [.08 * f, .06, wheel], [.08 * f, 0, wheel]], 14, tyre);
          L('x', [-1.62, yc, .62], [[0, 0], [0, .06], [.28, .06], [.28, 0]], 12, steel); }                                  // return roller + volute / track-tension spring
        L('y', [S1[0], yc, S1[1]], [[-.13 * f, 0], [-.13 * f, .26, wheel], [-.06 * f, .26, wheel], [-.06 * f, .20, dark], [.06 * f, .20, dark], [.06 * f, .26, wheel], [.13 * f, .26, wheel], [.13 * f, .10, wheel], [.15 * f, .09, wheel], [.15 * f, 0, wheel]], 22, wheel);
        for (let k = 0; k < 18; k++) pnRadial(M, S1[0], S1[1], k * Math.PI / 9, .25, .31, .05, .03, yc - .04, yc + .04, wheel);
        for (let k = 0; k < 8; k++) pnRadial(M, S1[0], S1[1], k * Math.PI / 4 + .2, .08, .20, .06, .04, yc + .12 * f - .012, yc + .12 * f + .012, dark);
        L('y', [S2[0], yc, S2[1]], [[-.12 * f, 0], [-.12 * f, .27, wheel], [.12 * f, .27, wheel], [.12 * f, .21, wheel], [.06 * f, .19, dark], [.06 * f, .07, dark], [.12 * f, .07, wheel], [.12 * f, 0, wheel]], 22, wheel);
        for (let k = 0; k < 10; k++) pnRadial(M, S2[0], S2[1], k * Math.PI / 5 + .1, .07, .20, .045, .03, yc + .06 * f - .01, yc + .06 * f + .01, dark);
      }

      // ---- variants ----
      if (variant !== 'm3') { M.box(BXR - .30, BXR - .02, -.55, .55, 1.05, 1.08, dark); for (const sy of [-1, 1]) M.box(BXR - .30, BXR - .02, sy * .55 - .02, sy * .55 + .02, 1.05, 1.62, dark);   // rear stowage rack
        M.box(BXR - .28, BXR - .04, -.53, .53, 1.08, 1.50, canvas); }
      if (variant === 'm16') { M.box(2.78, 3.30, -.45, .45, .62, 1.02, dark); L('y', [3.08, -.38, .82], [[0, 0], [0, .16], [.76, .16], [.76, 0]], 16, steel); }   // front winch
      if (variant === 'gmc') {
        // 75 mm M1897A4 on the M2A3 mount: gabled box shield over the front of the body, gun over the cab, ammo racks
        const SX = -.24, SZ0 = 1.88, gz = 2.12;
        const top = y => 2.38 - Math.abs(y) / BW * .08;
        for (let i = 0; i < 6; i++) { const y0 = -BW + i * BW / 3, y1 = y0 + BW / 3;
          v5Slab(M, [[SX, y0, SZ0], [SX, y1, SZ0], [SX - .05, y1, top(y1)], [SX - .05, y0, top(y0)]], [-.012, 0, 0], hull); }
        for (const sy of [-1, 1]) v5Slab(M, [[SX, sy * BW, SZ0], [-.82, sy * BW, SZ0], [-.82, sy * BW, 2.30], [SX - .05, sy * BW, top(BW)]], [0, -sy * .012, 0], hull);   // side wings
        M.box(SX - .015, SX + .005, -.13, .13, gz - .14, gz + .14, black);                                                // gun port
        for (const sy of [-1, 1]) { M.box(SX - .02, SX + .004, sy * .55 - .10, sy * .55 + .10, 2.22, 2.27, black); v5Rod(M, [SX + .01, sy * .30, 2.33], [SX + .35, sy * .70, 2.05], .01, dark, 5); }
        M.box(-.90, -.30, -.30, .30, .98, 1.80, dark);                                                                    // pedestal / carriage
        M.box(-.70, -.20, -.18, .18, 1.80, gz - .06, gun);                                                                // cradle
        L('x', [-.62, 0, gz], [[0, 0], [0, .12], [.40, .12], [.40, 0]], 16, gun);                                          // breech
        L('x', [-.22, 0, gz], [[0, 0], [0, .07], [.42, .065], [.42, .055], [2.10, .05], [2.12, .06], [2.18, .06], [2.18, 0]], 16, gun);   // barrel
        L('x', [-.22, 0, gz - .14], [[0, 0], [0, .055], [1.45, .055], [1.45, 0]], 14, gun);                               // recuperator below
        M.box(.10, 1.20, -.05, .05, gz - .14, gz - .05, dark);
        for (const sy of [-1, 1]) for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++) L('x', [-2.55 + k * .26, sy * (BW - .14 - r * .10), 1.30], [[0, 0], [0, .04], [.22, .04], [.22, 0]], 8, gun);   // ammo racks
        M.box(-2.70, -1.0, -BW + .04, -BW + .34, .98, 1.26, dark); M.box(-2.70, -1.0, BW - .34, BW - .04, .98, 1.26, dark);
      } else if (variant === 'm16') {
        // M45 quadmount: armoured box turret with two pairs of .50 cal M2HB and four ammunition chests, gunner's shield; guns in the forward travel position
        const TX = -1.68, TZ = ZT + .02;
        M.grp = 1;   // v195: the whole M45 quadmount (base ring, carriage, shields, guns, seat) is the rotating turret part
        L('z', [TX, 0, .98], [[0, 0], [0, .52], [.04, .52], [.04, .40], [ZT - 1.04, .36], [ZT - 1.02, .58], [ZT - .96, .62], [ZT - .96, 0]], 28, dark);   // M45 base: floor plate, conical pedestal, turret ring
        for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + .3; v5Rod(M, [TX + .48 * Math.cos(a), .48 * Math.sin(a), 1.0], [TX + .38 * Math.cos(a), .38 * Math.sin(a), ZT - .08], .03, dark, 4); }   // pedestal ribs
        M.box(TX - .45, TX + .40, -.42, .42, TZ, TZ + .32, hull);                                                         // carriage body
        v5Slab(M, [[TX + .40, -.42, TZ], [TX + .40, .42, TZ], [TX + .30, .30, TZ + .62], [TX + .30, -.30, TZ + .62]], [-.012, 0, 0], hull);   // front shield
        for (const sy of [-1, 1]) {
          v5Slab(M, [[TX + .40, sy * .42, TZ], [TX + .55, sy * .80, TZ + .05], [TX + .45, sy * .80, TZ + .55], [TX + .30, sy * .30, TZ + .62]], [-.012, 0, 0], hull);   // angled wing shields
          M.box(TX - .40, TX + .12, sy > 0 ? .42 : -.70, sy > 0 ? .70 : -.42, TZ + .10, TZ + .62, gun);                  // ammunition chests (outboard)
          M.box(TX - .42, TX + .14, sy > 0 ? .30 : -.72, sy > 0 ? .72 : -.30, TZ + .04, TZ + .10, dark);                // chest cradle on the carriage
          M.box(TX - .38, TX + .10, sy > 0 ? .695 : -.705, sy > 0 ? .705 : -.695, TZ + .14, TZ + .58, dark);
          for (const dz of [TZ + .22, TZ + .48]) {                                                                       // a vertical pair of M2HB per side
            const y = sy * .36;
            L('x', [TX - .34, y, dz], [[0, 0], [0, .055], [.62, .055], [.62, .028], [1.42, .026], [1.44, .034], [1.50, .034], [1.50, 0]], 10, gun);
            M.box(TX - .36, TX + .20, y - .065, y + .065, dz - .065, dz + .065, gun); L('y', [TX - .05, y, dz], [[0, .075], [0, .09], [.02 * sy, .09], [.02 * sy, .075]], 12, dark);
          }
          M.box(TX - .30, TX + .05, sy * .36 - .03, sy * .36 + .03, TZ + .28, TZ + .42, dark);
          L('y', [TX - .12, sy * .24, TZ + .35], [[0, 0], [0, .13], [-sy * .03, .13], [-sy * .03, 0]], 16, dark);       // elevation drum
        }
        M.box(TX - .55, TX - .25, -.20, .20, TZ, TZ + .55, seat);                                                          // gunner's seat + back
        M.box(TX + .05, TX + .15, -.08, .08, TZ + .32, TZ + .62, dark); M.box(TX + .08, TX + .12, -.06, .06, TZ + .62, TZ + .72, glass);   // reflector sight
        M.grp = 0;   // v195: hull-mounted pieces again
        for (const sy of [-1, 1]) for (const xx of [-2.60, -2.45, -.30, -.15]) M.box(xx - .06, xx + .06, sy > 0 ? BW - .30 : -BW + .04, sy > 0 ? BW - .04 : -BW + .30, .98, 1.40, gun);   // spare chests
        for (const sy of [-1, 1]) { M.box(BXR + .02, BXF - .02, sy > 0 ? BW : -BW - .015, sy > 0 ? BW + .015 : -BW, ZT - .40, ZT - .37, dark); }   // fold-down upper-armour hinges
      } else {
        // M3 personnel carrier: .50 cal M2HB on the pedestal behind the cab, bench seats, rifle racks, canvas bows
        const PX = -.58;
        if (variant !== 'amb') L('z', [PX, 0, .98], [[0, 0], [0, .09], [.10, .07], [1.10, .055], [1.25, .07], [1.30, .07], [1.30, 0]], 12, dark);
        if (variant !== 'amb') { const gz = 2.32; M.box(PX - .20, PX + .20, -.06, .06, gz - .07, gz + .07, gun); M.box(PX - .32, PX - .20, -.04, .04, gz - .10, gz + .03, dark);
          L('x', [PX + .20, 0, gz], [[0, 0], [0, .03], [.30, .03], [.30, .022], [1.02, .02], [1.04, .03], [1.10, .03], [1.10, 0]], 10, gun); M.box(PX - .05, PX + .10, .06, .22, gz - .16, gz - .02, gun); }
        for (const sy of [-1, 1]) {
          M.box(-2.60, -.30, sy > 0 ? BW - .42 : -BW + .02, sy > 0 ? BW - .02 : -BW + .42, .98, 1.40, seat);              // benches
          M.box(-2.60, -.30, sy > 0 ? BW - .10 : -BW + .02, sy > 0 ? BW - .02 : -BW + .10, 1.40, 1.80, seat);
          for (let k = 0; k < 5; k++) L('z', [-2.45 + k * .52, sy * (BW - .06), 1.42], [[0, 0], [0, .012], [.40, .012], [.40, 0]], 5, gun);
        }
        for (const xx of [-.40, -1.40, -2.50]) { L('y', [xx, -BW + .02, ZT], [[0, 0], [0, .012], [1.92, .012], [1.92, 0]], 6, dark); }
        M.box(-2.55, -1.85, -.30, .30, .98, 1.25, canvas);                                                                 // rolled tarpaulin / packs
        M.box(-1.50, -1.10, -.45, -.15, .98, 1.22, dark);
      }
      return M;
    }
    function buildM3Halftrack(paint) { return buildM3HT(paint, 'm3'); }
    function buildM16(paint) { return buildM3HT(paint, 'm16'); }
    function buildM3GMC(paint) { return buildM3HT(paint, 'gmc'); }

    // radial profile of a convex outline: distance from the origin to the outline along angle a (outline = convex polygon around the origin)
    function v5Ray(poly, a) {
      const dx = Math.cos(a), dy = Math.sin(a); let best = 1e9;
      for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length], ex = q[0] - p[0], ey = q[1] - p[1], den = dx * ey - dy * ex; if (Math.abs(den) < 1e-12) continue;
        const t = (p[0] * ey - p[1] * ex) / den, s = (p[0] * dy - p[1] * dx) / den; if (t > 0 && s >= -1e-9 && s <= 1 + 1e-9) best = Math.min(best, t); }
      return best;
    }
    function v5Hull2(pts) {   // convex hull (monotone chain), counter-clockwise
      const P = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
      for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
      for (const p of P.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
      return lo.slice(0, -1).concat(up.slice(0, -1));
    }
    // rounded turret body: plan outline (convex, around cx,cy) swept up through levels [[z, scale]], closed top
    function v5Turret(M, cx, cy, outline, levels, m, N = 40) {
      const ring = s => Array.from({ length: N }, (_, k) => { const a = k * 2 * Math.PI / N, r = v5Ray(outline, a) * s; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });
      v5Stack(M, levels.map(([z, s]) => [z, ring(s)]), m);
    }

    // ---------- M18 76 mm GMC "Hellcat" — from the supplied 4-view (132.7 px/m: hull 5.44 × 2.87 m) and the photo ----------
    // Hull between the tracks (±.92) with sloped sponsons over the fenders (±1.44 at Z 1.20 → ±1.28 at the deck, Z 1.53), glacis, raised engine deck with intakes,
    // open-topped wedge turret (round front, sides converging to the rear), cast pill mantlet + 76 mm M1A1, .50 cal on a ring mount at the turret rear;
    // front sprocket, 5 torsion-bar road wheels (R .33), 4 return rollers, rear idler; fender skirt boxes front and rear.
    function buildM18(paint) {
      const P = PAINT[paint] || PAINT.olive, M = new Mesh();
      const hull = M.mat(P.hull, { spec: .08 }), dark = M.mat(P.dark, { spec: .05 }), gun = M.mat(P.gun, { spec: .22, noise: .5 });
      const trk = M.mat([58, 54, 48], { spec: .06, noise: 1.4 }), trkR = M.mat([70, 64, 56], { shadow: false, noise: 1.4 }), tyre = M.mat([30, 31, 33], { noise: .6 }), wheel = M.mat(P.wheel, { spec: .12 });
      const grille = M.mat([34, 36, 38], { shadow: false, noise: .5 }), glass = M.mat([200, 205, 190], { spec: .9, shadow: false, noise: 0 }), inner = M.mat([88, 94, 62], { spec: .03, noise: .8 });
      const canvas = M.mat([112, 108, 80], { spec: .03, noise: 1.2 }), wood = M.mat([112, 84, 56], { spec: .03, noise: 1.3 }), black = M.mat([22, 24, 26], { shadow: false, noise: 0 });
      const L = (ax, o, prof, seg, m) => M.lathe(ax, o, prof, seg, m);
      const HW = .92, FZ = 1.20, FW = 1.44, DZ = 1.53, DW = 1.28;

      // ---- lower hull between the tracks, nose, glacis ----
      extrudeXZ(M, [[2.62, .48], [2.67, .95], [2.48, FZ], [-2.66, FZ], [-2.66, .55], [-2.40, .42], [2.20, .42]], -HW, HW, hull);
      // upper hull: sponson section (fender level ±1.44 → deck ±1.28), glacis front, raised engine deck at the rear
      const up = (x, zr) => [x, [[-FW, FZ], [-DW, zr], [DW, zr], [FW, FZ]]];
      v5Loft(M, [up(1.78, DZ), up(-.95, DZ), up(-1.43, 1.68), up(-2.15, 1.63), up(-2.66, DZ)], hull);
      M.hex8([[2.48, -FW, FZ], [2.48, FW, FZ], [1.78, FW, FZ], [1.78, -FW, FZ], [2.48, -HW, FZ + .01], [2.48, HW, FZ + .01], [1.78, DW, DZ], [1.78, -DW, DZ]], hull);   // glacis
      // ---- fenders: flat at Z 1.20 with front & rear skirt boxes, curved front guards ----
      for (const sy of [-1, 1]) {
        const ya = sy > 0 ? HW : -FW, yb = sy > 0 ? FW : -HW;
        M.box(-2.66, 2.48, ya, yb, FZ - .02, FZ, hull);
        for (const [xa, xb] of [[1.06, 2.13], [-2.62, -1.80]]) {                                          // skirt boxes (with the lightening cut-outs drawn in)
          M.box(xa, xb, sy > 0 ? FW - .03 : -FW, sy > 0 ? FW : -FW + .03, .81, FZ, hull);
          M.box(xa, xb, sy > 0 ? HW + .02 : -FW, sy > 0 ? FW : -HW - .02, .81, .84, hull);
          for (let k = 0; k < 2; k++) { const w = (xb - xa) / 2, x0 = xa + k * w + .06, x1 = xa + (k + 1) * w - .06; M.box(x0, x1, sy > 0 ? FW : -FW - .006, sy > 0 ? FW + .006 : -FW, .88, FZ - .06, dark); }
        }
        // front guard: curved plate from the skirt box down over the sprocket nose
        const g = [[2.13, FZ], [2.40, FZ - .02], [2.58, 1.10], [2.68, .96], [2.70, .86]];
        for (let i = 0; i + 1 < g.length; i++) M.hex8([[g[i][0], ya, g[i][1]], [g[i + 1][0], ya, g[i + 1][1]], [g[i + 1][0], yb, g[i + 1][1]], [g[i][0], yb, g[i][1]], [g[i][0], ya, g[i][1] - .025], [g[i + 1][0], ya, g[i + 1][1] - .025], [g[i + 1][0], yb, g[i + 1][1] - .025], [g[i][0], yb, g[i][1] - .025]], hull);
        M.hex8([[2.13, sy * FW, FZ], [2.70, sy * FW, .86], [2.70, sy * FW, .84], [2.13, sy * FW, .81], [2.13, sy * (FW - .03), FZ], [2.70, sy * (FW - .03), .86], [2.70, sy * (FW - .03), .84], [2.13, sy * (FW - .03), .81]], hull);
        // head lights with guards on the glacis corners, siren / tools
        const hx = 2.18, hz = FZ + (2.48 - hx) / .70 * (DZ - FZ);
        L('z', [hx, sy * .77, hz], [[0, 0], [0, .02], [.06, .02], [.06, 0]], 6, dark);
        L('x', [hx - .06, sy * .77, hz + .13], [[0, 0], [0, .06], [.04, .075], [.10, .075], [.12, .06], [.12, 0]], 14, dark); L('x', [hx + .06, sy * .77, hz + .13], [[0, 0], [0, .062], [.006, .06], [.006, 0]], 14, glass);
        v5Poly(M, [[hx - .10, sy * .66, hz], [hx + .12, sy * .66, hz + .02], [hx + .12, sy * .66, hz + .22], [hx - .05, sy * .66, hz + .25]], .01, dark); v5Poly(M, [[hx - .10, sy * .88, hz], [hx + .12, sy * .88, hz + .02], [hx + .12, sy * .88, hz + .22], [hx - .05, sy * .88, hz + .25]], .01, dark);
        M.box(2.60, 2.70, sy * .70 - .05, sy * .70 + .05, .80, .92, dark); L('y', [2.69, sy * .70 - .05, .86], [[0, 0], [0, .035], [.10, .035], [.10, 0]], 10, dark);   // tow eyes
        // tools & rails on the sponson side
        const sp = (x, z, o) => [x, sy * (FW - (z - FZ) / (DZ - FZ) * (FW - DW) + o), z];
        for (const [x0, x1, z] of [[1.55, -.10, 1.40], [-.80, -2.40, 1.45]]) v5Rod(M, sp(x0, z, .03), sp(x1, z, .03), .025, wood, 6);
        for (const x of [1.40, .20, -.95, -2.25]) { const a = sp(x, 1.30, 0), b = sp(x, 1.50, 0); v5Rod(M, a, [b[0], b[1], b[2]], .02, dark, 5); }
        v5Rod(M, sp(1.30, 1.36, .02), sp(-2.50, 1.36, .02), .012, dark, 5);
        // stowage bags at the rear corners of the deck
      }
      // ---- deck: driver's & assistant driver's hatches with periscopes, bow ventilator, engine-deck intakes and the rear grille ----
      for (const yc of [-.67, .67]) { M.box(1.15, 1.75, yc - .25, yc + .25, DZ, DZ + .02, dark); M.box(1.18, 1.72, yc - .22, yc + .22, DZ + .02, DZ + .035, hull);
        L('z', [1.47, yc, DZ + .035], [[0, 0], [0, .17], [.03, .17], [.03, .13], [.045, .13], [.045, 0]], 18, hull); M.box(1.62, 1.72, yc - .06, yc + .06, DZ + .035, DZ + .10, dark); M.box(1.715, 1.722, yc - .05, yc + .05, DZ + .05, DZ + .09, glass); }
      L('z', [1.00, 0, DZ], [[0, 0], [0, .09], [.05, .09], [.07, .06], [.07, 0]], 14, dark);
      const ez = x => x > -1.43 ? DZ + (-.95 - x) / .48 * .15 : x > -2.15 ? 1.68 - (-1.43 - x) / .72 * .05 : 1.63;
      for (const sy of [-1, 1]) for (const [x0, x1] of [[-1.48, -1.75], [-1.80, -2.08]]) { const ya = sy > 0 ? .25 : -1.12, yb = sy > 0 ? 1.12 : -.25;
        M.box(x1, x0, ya, yb, ez(x0) - .01, ez(x0) + .02, dark); M.box(x1 + .02, x0 - .02, ya + .02, yb - .02, ez(x0) + .02, ez(x0) + .03, grille);
        for (let k = 0; k < 4; k++) { const xx = x1 + .05 + k * .055; M.box(xx, xx + .015, ya + .02, yb - .02, ez(x0) + .025, ez(x0) + .04, hull); } }
      for (const [xx, yy] of [[-1.62, 0], [-1.95, 0]]) L('z', [xx, yy, ez(xx)], [[0, 0], [0, .10], [.02, .10], [.02, .05], [.04, .05], [.04, 0]], 14, hull);
      M.box(-2.66, -2.17, -1.25, 1.25, 1.62, 1.64, dark); M.box(-2.64, -2.19, -1.22, 1.22, 1.64, 1.65, grille);
      for (let k = 0; k < 8; k++) { const xx = -2.62 + k * .057; M.box(xx, xx + .015, -1.22, 1.22, 1.645, 1.66, dark); }
      // rear plate: tow pintle, lights, jerrycans
      M.box(-2.70, -2.66, -.90, .90, .55, 1.50, dark);
      L('x', [-2.70, 0, .66], [[0, 0], [0, .07], [-.10, .07], [-.10, .035], [-.20, .035], [-.20, 0]], 12, dark);
      for (const sy of [-1, 1]) { L('x', [-2.66, sy * 1.05, 1.32], [[0, 0], [0, .05], [-.05, .05], [-.05, 0]], 10, M.mat([120, 40, 34], { shadow: false })); M.box(-2.80, -2.70, sy * .55 - .17, sy * .55 + .17, .90, 1.35, dark); }
      M.grp = 1;   // v192: turret part (rotates on its own)
      // ---- open-topped turret (wedge plan, walls leaning in), cast pill mantlet, 76 mm M1A1, .50 cal on the rear ring mount ----
      const TZ0 = DZ + .01, TZ1 = 2.22;
      const half = [[1.15, 0], [1.10, .58], [.85, .88], [.30, 1.09], [-.20, 1.12], [-1.70, .47], [-1.70, 0]], halfT = [[.98, 0], [.94, .52], [.72, .78], [.25, .98], [-.20, 1.00], [-1.66, .42], [-1.66, 0]];
      const full = h => h.slice(0, -1).map(([x, y]) => [x, -y]).concat(h.slice(1, -1).reverse()).filter((p, i, a) => i === 0 || Math.abs(p[0] - a[i - 1][0]) + Math.abs(p[1] - a[i - 1][1]) > 1e-6);
      const OB = v5Hull2(full(half).concat([[-1.70, -.47], [-1.70, .47]])), OT = v5Hull2(full(halfT).concat([[-1.66, -.42], [-1.66, .42]]));
      const n = 48, ringAt = (ol, s, d) => Array.from({ length: n }, (_, k) => { const a = k * 2 * Math.PI / n, r = v5Ray(ol, a) * s - d; return [r * Math.cos(a), r * Math.sin(a)]; });
      const cx = -.15, cent = ol => ol.map(([x, y]) => [x - cx, y]);
      const OBc = cent(OB), OTc = cent(OT), sh = A => A.map(([x, y]) => [x + cx, y]);
      v5LoftZ(M, sh(ringAt(OBc, 1, 0)), sh(ringAt(OTc, 1, 0)), TZ0, TZ1, hull, false);
      v5LoftZ(M, sh(ringAt(OTc, 1, .03)), sh(ringAt(OBc, 1, .04)), TZ1, TZ0 + .14, inner, false);
      { const A = sh(ringAt(OTc, 1, 0)), B = sh(ringAt(OTc, 1, .03)); for (let i = 0; i < n; i++) { const j = (i + 1) % n; M.quad([A[i][0], A[i][1], TZ1], [A[j][0], A[j][1], TZ1], [B[j][0], B[j][1], TZ1], [B[i][0], B[i][1], TZ1], hull, [cx, 0, 0]); } }
      M.prismXY(sh(ringAt(OBc, 1, .05)), TZ0 + .12, TZ0 + .14, inner);                                                         // turret floor
      for (let k = 0; k < 10; k++) { const a = (k / 10 - .5) * 2.4, r = v5Ray(OTc, a); M.box(cx + r * Math.cos(a) - .012, cx + r * Math.cos(a) + .012, r * Math.sin(a) - .012, r * Math.sin(a) + .012, TZ1 - .06, TZ1 - .04, dark); }   // rivets
      // stowage on the turret flanks (front boxes, rear lattice racks), vision box
      for (const sy of [-1, 1]) {
        M.box(.55, .95, sy > 0 ? .78 : -1.08, sy > 0 ? 1.08 : -.78, 1.75, 1.96, hull);                                      // ammo boxes on the front flanks
        M.box(.57, .93, sy > 0 ? 1.075 : -1.085, sy > 0 ? 1.085 : -1.075, 1.80, 1.92, dark);
        v5Rod(M, [.20, sy * 1.14, 2.02], [-1.60, sy * .52, 2.02], .018, dark, 5); v5Rod(M, [.20, sy * 1.14, 1.84], [-1.60, sy * .52, 1.84], .018, dark, 5);   // bustle rails
        for (const x of [-.10, -.60, -1.10]) { const t = (.20 - x) / 1.80; v5Rod(M, [x, sy * (1.14 - .62 * t), 1.84], [x, sy * (1.14 - .62 * t), 2.02], .015, dark, 5); }
        M.box(-1.40, -.20, sy > 0 ? .62 : -1.0, sy > 0 ? 1.0 : -.62, 1.86, 2.00, canvas);
      }
      // mantlet (pill-shaped cast shield) and gun
      const GX = 1.02, GZ = 1.95, GY = -.03;
      { const a = .22, b = .24, hw = .50, pts = []; for (let k = 0; k <= 16; k++) { const t = -Math.PI / 2 + Math.PI * k / 16; pts.push([GX + a * Math.cos(t), GZ + b * Math.sin(t)]); } pts.push([GX - .10, GZ + b], [GX - .10, GZ - b]);
        extrudeXZ(M, pts, GY - hw, GY + hw, hull);
        L('y', [GX - .02, GY - hw, GZ], [[0, 0], [0, b], [.02, b], [.02, 0]], 18, hull); L('y', [GX - .02, GY + hw - .02, GZ], [[0, 0], [0, b], [.02, b], [.02, 0]], 18, hull); }
      L('x', [GX + .20, GY, GZ], [[0, 0], [0, .13], [.06, .12], [.12, .10], [.12, 0]], 18, hull);                           // gun boss
      L('x', [GX + .30, GY, GZ], [[0, 0], [0, .075], [1.20, .065], [2.79, .055], [2.79, 0]], 18, gun);                     // 76 mm M1A1
      L('x', [GX + 2.93, GY, GZ], [[0, 0], [0, .062], [.16, .062], [.16, 0]], 14, gun);                                     // muzzle thread protector
      M.box(GX + .18, GX + .22, GY + .27, GY + .35, GZ + .04, GZ + .10, glass);
      L('x', [GX + .16, GY + .25, GZ - .02], [[0, 0], [0, .03], [.06, .03], [.06, 0]], 8, dark);
      M.box(-.10, .70, GY - .16, GY + .16, TZ0 + .14, GZ - .05, gun); L('x', [-.30, GY, GZ], [[0, 0], [0, .14], [.40, .14], [.40, 0]], 16, gun);   // cradle + breech
      for (let k = 0; k < 6; k++) L('y', [-1.30 + k * .13, -.70, TZ0 + .40], [[0, 0], [0, .045], [.40, .045], [.40, 0]], 10, gun);                // ready rounds
      // .50 cal M2HB on the ring mount (rear right), pointing aft in travel
      { const rx = -.46, ry = .65, rz = 2.32, rr = .42;
        L('z', [rx, ry, rz], [[0, rr - .03], [0, rr], [.04, rr], [.04, rr - .03]], 32, dark);
        for (const a of [Math.PI * .25, Math.PI * .85, Math.PI * 1.45]) M.box(rx + rr * Math.cos(a) - .02, rx + rr * Math.cos(a) + .02, ry + rr * Math.sin(a) - .02, ry + rr * Math.sin(a) + .02, TZ1 - .05, rz, dark);
        const mx = rx - .40, my = ry - .05, mz = 2.53;
        M.box(mx - .04, mx + .04, my - .04, my + .04, rz, mz - .05, dark);
        M.box(mx - .05, mx + .45, my - .06, my + .06, mz - .07, mz + .06, gun); M.box(mx + .30, mx + .45, my - .06, my + .06, mz - .02, mz + .08, dark);
        L('x', [mx - .05, my, mz], [[0, 0], [0, .03], [-.40, .03], [-.40, .02], [-1.10, .018], [-1.14, .026], [-1.20, .026], [-1.20, 0]], 10, gun);
        M.box(mx + .05, mx + .20, my + .06, my + .20, mz - .14, mz + .0, dark); }
      M.box(-1.06, -.94, -.72, -.62, TZ1 - .10, TZ1 - .02, dark); L('z', [-1.00, -.67, TZ1 - .02], [[0, 0], [0, .04], [.06, .04], [.06, .025], [.12, .025], [.12, 0]], 10, dark);   // antenna base on the turret rim (right rear)
      M.grp = 0;
      // ---- running gear: front sprocket, 5 road wheels (torsion bars), 4 return rollers, rear idler; track ±1.22, .40 wide ----
      const S1 = [2.24, .62], S2 = [-2.13, .72], WX = [1.60, .85, .09, -.68, -1.43], WZ = .40, WR = .33, YT = 1.22;
      const out = [];
      v5Arc(out, S1, .33, Math.PI / 2, -2.0, 14);
      out.push([1.65, .02], [-1.50, .02]);
      v5Arc(out, S2, .33, -1.1, -Math.PI * 1.5, 12);
      out.push([-1.07, 1.08], [1.20, 1.08]);
      for (const sy of [-1, 1]) {
        const ya = sy * YT - .20, yb = sy * YT + .20, f = sy, yc = sy * YT;
        v5Track(M, out, ya, yb, .07, .12, trk, trkR);
        for (const x of WX) {
          L('y', [x, yc, WZ], [[-.19 * f, 0], [-.19 * f, WR * .80, wheel], [-.19 * f, WR * .85, tyre], [-.15 * f, WR, tyre], [-.04 * f, WR, tyre], [-.03 * f, WR * .85, wheel], [.03 * f, WR * .85, wheel], [.04 * f, WR, tyre], [.15 * f, WR, tyre], [.19 * f, WR * .85, tyre], [.19 * f, WR * .80, wheel], [.15 * f, WR * .45, wheel], [.15 * f, 0, wheel]], 24, tyre);
          L('y', [x, yc + .15 * f, WZ], [[0, 0], [0, .09], [.03 * f, .07], [.05 * f, .04], [.05 * f, 0]], 14, dark);
          for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; L('y', [x + .16 * Math.cos(a), yc + .15 * f, WZ + .16 * Math.sin(a)], [[0, 0], [0, .014], [.012 * f, .014], [.012 * f, 0]], 5, dark); }
          extrudeXZ(M, [[x - .03, WZ + .05], [x + .05, WZ - .03], [x + .40, .62], [x + .33, .70]], sy > 0 ? HW - .01 : -HW - .08, sy > 0 ? HW + .08 : -HW + .01, dark);   // torsion-bar arm
          M.box(x + .30, x + .42, sy > 0 ? HW - .01 : -HW - .06, sy > 0 ? HW + .06 : -HW + .01, .58, .76, dark);
        }
        for (const x of [1.20, .45, -.30, -1.07]) { L('y', [x, sy * HW, .93], [[0, 0], [0, .04], [sy * .14, .04], [sy * .14, 0]], 8, dark); L('y', [x, yc, .93], [[-.13 * f, 0], [-.13 * f, .12, tyre], [.13 * f, .12, tyre], [.13 * f, .09, wheel], [.15 * f, .09, wheel], [.15 * f, 0, wheel]], 16, tyre); }
        L('y', [S1[0], yc, S1[1]], [[-.14 * f, 0], [-.14 * f, .26, wheel], [-.07 * f, .26, wheel], [-.07 * f, .20, dark], [.07 * f, .20, dark], [.07 * f, .26, wheel], [.14 * f, .26, wheel], [.14 * f, .11, wheel], [.16 * f, .10, wheel], [.16 * f, 0, wheel]], 24, wheel);
        for (let k = 0; k < 13; k++) pnRadial(M, S1[0], S1[1], k * 2 * Math.PI / 13, .25, .34, .08, .04, yc - .12, yc + .12, wheel);
        for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; L('y', [S1[0] + .15 * Math.cos(a), yc + .15 * f, S1[1] + .15 * Math.sin(a)], [[0, 0], [0, .018], [.012 * f, .018], [.012 * f, 0]], 6, dark); }
        L('y', [S2[0], yc, S2[1]], [[-.17 * f, 0], [-.17 * f, .27, wheel], [-.04 * f, .27, tyre], [-.04 * f, .29, tyre], [.04 * f, .29, tyre], [.04 * f, .27, wheel], [.17 * f, .27, wheel], [.17 * f, .10, wheel], [.18 * f, 0, wheel]], 24, wheel);
        for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; L('y', [S2[0] + .17 * Math.cos(a), yc + .17 * f, S2[1] + .17 * Math.sin(a)], [[0, 0], [0, .04], [.01 * f, .04], [.01 * f, 0]], 8, dark); }
        extrudeXZ(M, [[2.55, 1.05], [2.62, .80], [2.30, .52], [2.05, .90]], sy > 0 ? HW - .01 : -HW - .08, sy > 0 ? HW + .08 : -HW + .01, dark);   // final drive
        extrudeXZ(M, [[-1.85, .95], [-2.25, .85], [-2.20, .60], [-1.80, .75]], sy > 0 ? HW - .01 : -HW - .08, sy > 0 ? HW + .08 : -HW + .01, dark);   // idler arm
      }
      return M;
    }

    // shared M5 / M8 HMC chassis (numbers in G come from each vehicle's own drawing)
    function v5M5Chassis(M, P, G) {
      const hull = M.mat(P.hull, { spec: .08 }), dark = M.mat(P.dark, { spec: .05 }), gun = M.mat(P.gun, { spec: .22, noise: .5 });
      const trk = M.mat([58, 54, 48], { spec: .06, noise: 1.4 }), trkR = M.mat([70, 64, 56], { shadow: false, noise: 1.4 }), tyre = M.mat([30, 31, 33], { noise: .6 }), wheel = M.mat(P.wheel, { spec: .12 });
      const grille = M.mat([34, 36, 38], { shadow: false, noise: .5 }), glass = M.mat([200, 205, 190], { spec: .9, shadow: false, noise: 0 }), steel = M.mat([60, 62, 58], { spec: .3, noise: .5 });
      const L = (ax, o, prof, seg, m) => M.lathe(ax, o, prof, seg, m);
      const HW = .72, SW = 1.10, FZ = G.FZ, DZ = G.DZ, EZ = G.EZ, XF = G.XF, XB = G.XB, ZB = G.ZB, XG = G.XG, ZG = G.ZG, XT = G.XT, XE0 = G.XE0;

      // ---- lower hull between the tracks ----
      extrudeXZ(M, [[XF, .42], [XF, G.ZN], [XB, ZB], [XG, ZG], [XT, DZ], [-1.86, DZ], [-1.86, .50], [-1.55, .38], [1.90, .38]], -HW, HW, hull);
      // ---- upper hull / sponsons (±1.10), chamfered front corners, engine deck rising to 1.83 ----
      const sec = (x, zt, w) => [x, [[-w, FZ], [-w, zt], [w, zt], [w, FZ]]];
      v5Loft(M, [sec(XG - .20, ZG + .08, .78), sec(XT, DZ, .92), sec(XT - .29, DZ, SW), sec(XE0, DZ, SW), sec(-.98, EZ, SW), sec(-1.84, EZ - .03, SW)], hull);
      for (const sy of [-1, 1]) M.hex8([[XB, sy * HW, ZB], [XB, sy * .78, ZB], [XG - .20, sy * .78, ZG - .01], [XG, sy * HW, ZG], [XB, sy * HW, ZB + .02], [XB, sy * .78, ZB + .02], [XG - .20, sy * .78, ZG + .08], [XG, sy * HW, ZG + .02]], hull);
      // ---- fenders: front fenders (rising to the sponson), side edges, rear fenders to the rear stowage ----
      for (const sy of [-1, 1]) {
        const ya = sy > 0 ? HW : -1.13, yb = sy > 0 ? 1.13 : -HW;
        M.hex8([[XB + .02, ya, ZB - .03], [G.XFF, ya, FZ], [G.XFF, yb, FZ], [XB + .02, yb, ZB - .03], [XB + .02, ya, ZB], [G.XFF, ya, FZ + .025], [G.XFF, yb, FZ + .025], [XB + .02, yb, ZB]], hull);
        M.box(XB, XF, ya, yb, ZB - .16, ZB, hull);                                                              // fender front lip
        M.box(-2.28, G.XFF, sy > 0 ? SW : -1.13, sy > 0 ? 1.13 : -SW, FZ - .06, FZ + .02, hull);                  // side edge strip
        M.box(-2.28, -1.84, ya, yb, FZ - .02, FZ, hull);
        M.hex8([[-2.28, ya, FZ], [-2.30, ya, 1.10], [-2.30, yb, 1.10], [-2.28, yb, FZ], [-2.25, ya, FZ], [-2.27, ya, 1.10], [-2.27, yb, 1.10], [-2.25, yb, FZ]], hull);
        for (const xx of [1.80, 1.10, .30, -.50, -1.30]) M.box(xx - .015, xx + .015, sy > 0 ? 1.13 : -1.145, sy > 0 ? 1.145 : -1.13, FZ - .06, FZ + .02, dark);
      }
      // ---- front: bolt rows, hood periscopes, headlights / siren with guards, tow shackles, hull hatches ----
      const gz = x => ZB + (XB - x) / (XB - XG) * (ZG - ZB);
      for (let k = 0; k < 9; k++) L('z', [XB - .05, -.80 + k * .20, gz(XB - .05)], [[0, 0], [0, .015], [.012, .015], [.012, 0]], 6, dark);
      const sg = x => ZG + (XG - x) / (XG - XT) * (DZ - ZG);                                                  // steep glacis height
      if (!G.glacisHatches) for (const yc of [-.43, .43]) { L('x', [1.58, yc, sg(1.58) - .02], [[0, 0], [0, .07], [.06, .07], [.06, 0]], 12, dark); M.box(1.55, 1.66, yc - .06, yc + .06, sg(1.60), sg(1.60) + .10, dark); M.box(1.655, 1.665, yc - .05, yc + .05, sg(1.60) + .03, sg(1.60) + .08, glass); }
      if (G.glacisHatches) for (const [y0, y1] of [[-.64, -.10], [.32, .70]]) {                                 // M8 HMC: driver's hatches moved onto the glacis, periscope domes on the hull roof
        const pa = [XG - .02, y0, sg(XG - .02)], pb = [XG - .26, y0, sg(XG - .26)]; v5FacePlate(M, [pa, [pa[0], y1, pa[2]], [pb[0], y1, pb[2]], pb], .03, [0, 0, 0], dark);
        v5FacePlate(M, [[XG - .05, y0 + .03, sg(XG - .05)], [XG - .05, y1 - .03, sg(XG - .05)], [XG - .23, y1 - .03, sg(XG - .23)], [XG - .23, y0 + .03, sg(XG - .23)]], .045, [0, 0, 0], hull);
        M.box(XG - .20, XG - .10, (y0 + y1) / 2 - .05, (y0 + y1) / 2 + .05, sg(XG - .10), sg(XG - .20) + .08, dark); }
      for (const [yc, big] of [[-.59, 0], [-.40, 1], [.51, 0], [.69, 0]]) {
        const r = big ? .085 : .055, hx = G.HX || XB - .19; L('z', [hx, yc, gz(hx)], [[0, 0], [0, .015], [.08, .015], [.08, 0]], 6, dark);
        L('x', [hx - .05, yc, gz(hx) + .14], [[0, 0], [0, r], [.04, r + .015], [.10, r + .015], [.12, r], [.12, 0]], 14, dark); L('x', [hx + .07, yc, gz(hx) + .14], [[0, 0], [0, r], [.006, r - .003], [.006, 0]], 14, big ? dark : glass);
        for (const dy of [-r - .03, r + .03]) v5Poly(M, [[hx - .07, yc + dy, gz(hx - .07)], [hx + .13, yc + dy, gz(hx + .13) + .03], [hx + .13, yc + dy, gz(hx) + .26], [hx - .05, yc + dy, gz(hx) + .28]], .008, dark); }
      for (const yc of [-.40, .47]) { M.box(XF, XF + .07, yc - .05, yc + .05, .50, .64, dark); L('y', [XF + .05, yc - .05, .57], [[0, 0], [0, .035], [.10, .035], [.10, 0]], 10, dark); }
      M.box(XF, XF + .02, -.62, .70, .80, .84, dark); M.box(XF, XF + .02, -.70, .78, .58, .62, dark);
      if (!G.glacisHatches) for (const yc of [-.45, .45]) { L('z', [1.15, yc, DZ], [[0, 0], [0, .20], [.03, .20], [.03, .17], [.045, .17], [.045, 0]], 22, hull); M.box(1.08, 1.22, yc - .06, yc + .06, DZ + .045, DZ + .10, dark); }   // driver / assistant hatches
      else for (const yc of [-.75, .75]) { L('z', [XT, yc, DZ], [[0, 0], [0, .15], [.05, .14], [.09, .10], [.10, .05], [.10, 0]], 18, hull); M.box(XT - .10, XT + .10, yc - .025, yc + .025, DZ + .09, DZ + .105, dark); }
      if (!G.glacisHatches) for (const sy of [-1, 1]) M.hex8([[1.02, sy * .85, DZ], [.92, sy * 1.00, DZ], [.85, sy * .95, DZ], [.95, sy * .80, DZ], [1.02, sy * .85, DZ + .05], [.92, sy * 1.00, DZ + .05], [.85, sy * .95, DZ + .05], [.95, sy * .80, DZ + .05]], dark);   // lifting eyes
      // ---- engine deck: grilles, hatches with handles, filler caps, side intake boxes; rear plate, stowage rack, lights, tools ----
      const ez = x => x > XE0 ? DZ : x > -.98 ? DZ + (XE0 - x) / (XE0 + .98) * (EZ - DZ) : EZ - (-.98 - x) / .86 * .03;
      M.box(-.91, -.74, -.71, .71, ez(-.82) - .02, ez(-.82) + .03, dark); M.box(-.89, -.76, -.69, .69, ez(-.82) + .03, ez(-.82) + .04, grille);
      M.box(-1.75, -1.58, -.71, .71, ez(-1.66), ez(-1.66) + .025, dark); M.box(-1.73, -1.60, -.69, .69, ez(-1.66) + .025, ez(-1.66) + .035, grille);
      for (const [x0, x1, m] of [[-.94, -1.56, hull]]) { M.box(x1, x0, -.65, .65, EZ - .01, EZ + .015, dark); M.box(x1 + .02, x0 - .02, -.63, .63, EZ + .015, EZ + .025, m); }
      for (const yy of [-.50, 0, .50]) M.box(-1.32, -1.26, yy - .05, yy + .05, EZ + .025, EZ + .05, dark);
      for (const yy of [-.40, .40]) L('z', [-1.50, yy, EZ + .02], [[0, 0], [0, .09], [.03, .09], [.03, .05], [.05, .05], [.05, 0]], 14, hull);
      for (const sy of [-1, 1]) { M.box(-1.78, -.57, sy > 0 ? .74 : -1.13, sy > 0 ? 1.13 : -.74, ez(-1.0), ez(-1.0) + .03, hull); for (const [xx] of [[-.70], [-1.65]]) M.box(xx - .03, xx + .03, sy * .93 - .03, sy * .93 + .03, ez(-1.0) + .03, ez(-1.0) + .06, dark); }
      M.box(-1.89, -1.84, -.95, .95, 1.10, 1.80, dark);
      for (const sy of [-1, 1]) { M.box(-2.26, -1.88, sy > 0 ? .80 : -1.08, sy > 0 ? 1.08 : -.80, FZ, 1.52, hull); L('z', [-2.08, sy * .94, 1.52], [[0, 0], [0, .09], [.04, .10], [.08, .08], [.08, 0]], 12, dark);   // rear lights / jerrycan holders
        L('x', [-2.26, sy * .94, 1.42], [[0, 0], [0, .035], [-.04, .035], [-.04, 0]], 10, M.mat([120, 40, 34], { shadow: false })); }
      M.box(-2.28, -1.88, -.70, .70, FZ, FZ + .03, dark); for (const xx of [-1.92, -2.24]) M.box(xx - .02, xx + .02, -.70, .70, FZ, 1.62, dark);   // rear stowage rack
      L('y', [-2.05, -.55, FZ + .12], [[0, 0], [0, .11], [.04, .12], [.42, .12], [.46, .11], [.46, 0]], 14, M.mat([112, 108, 80], { spec: .03 }));
      L('y', [-2.10, .20, FZ + .052], [[0, 0], [0, .025], [.55, .025], [.55, 0]], 6, M.mat([112, 84, 56], { spec: .03 }));
      L('x', [-1.86, 0, .55], [[0, 0], [0, .06], [-.10, .06], [-.10, .03], [-.18, .03], [-.18, 0]], 12, dark);
      // ---- running gear: front sprocket, 2 vertical-volute bogies × 2 road wheels, 3 return rollers, trailing idler ----
      const S1 = G.S1, S2 = G.S2, WX = G.WX, WZ = G.WZ, WR = .27, YT = .94, RX = G.RX, RZ = G.RZ;
      const out = [];
      v5Arc(out, S1, .36, Math.PI / 2, -2.0, 14);
      out.push([WX[0] + .02, .02], [WX[3] - .63, .02]);
      v5Arc(out, S2, .42, -1.2, -Math.PI * 1.5, 14);
      out.push([RX[2], RZ + .09], [RX[0], RZ + .12]);
      for (const sy of [-1, 1]) {
        const ya = sy * YT - .175, yb = sy * YT + .175, f = sy, yc = sy * YT;
        v5Track(M, out, ya, yb, .06, .10, trk, trkR);
        for (const x of WX) {
          L('y', [x, yc, WZ], [[-.15 * f, 0], [-.15 * f, WR * .82, wheel], [-.15 * f, WR * .86, tyre], [-.12 * f, WR, tyre], [-.03 * f, WR, tyre], [-.02 * f, WR * .86, wheel], [.02 * f, WR * .86, wheel], [.03 * f, WR, tyre], [.12 * f, WR, tyre], [.15 * f, WR * .86, tyre], [.15 * f, WR * .82, wheel], [.12 * f, WR * .45, wheel], [.12 * f, 0, wheel]], 22, tyre);
          for (let k = 0; k < 5; k++) { const a = k * 2 * Math.PI / 5 + .3; L('y', [x + .14 * Math.cos(a), yc + .12 * f, WZ + .14 * Math.sin(a)], [[0, 0], [0, .03], [.006 * f, .03], [.006 * f, 0]], 8, dark); }
          L('y', [x, yc + .12 * f, WZ], [[0, 0], [0, .05], [.025 * f, .04], [.025 * f, 0]], 10, dark);
        }
        for (const [a, b] of [[0, 1], [2, 3]]) { const xc = (WX[a] + WX[b]) / 2, yo = sy > 0 ? HW : -HW - .16;              // vertical-volute bogie: housing, spring, arms, track skid
          M.box(xc - .11, xc + .11, Math.min(yo, yo + .16), Math.max(yo, yo + .16), .48, 1.0, dark);
          L('z', [xc, sy * (HW + .17), .56], [[0, .03], [0, .08], [.30, .08], [.30, .03]], 14, steel);
          for (const x of [WX[a], WX[b]]) M.hex8([[xc, yc - .10 * f, .52], [x, yc - .10 * f, WZ + .03], [x, yc - .10 * f, WZ - .03], [xc, yc - .10 * f, .46], [xc, yc - .06 * f, .52], [x, yc - .06 * f, WZ + .03], [x, yc - .06 * f, WZ - .03], [xc, yc - .06 * f, .46]], dark);
          L('y', [xc, yc - .08 * f, .50], [[0, 0], [0, .06], [.04 * f, .06], [.04 * f, 0]], 10, dark); }
        for (const x of RX) { L('y', [x, sy * HW, RZ], [[0, 0], [0, .03], [sy * .16, .03], [sy * .16, 0]], 8, dark); L('y', [x, yc, RZ], [[-.09 * f, 0], [-.09 * f, .11, tyre], [.09 * f, .11, tyre], [.09 * f, .08, wheel], [.11 * f, .08, wheel], [.11 * f, 0, wheel]], 16, tyre); }
        // sprocket (8 spokes)
        L('y', [S1[0], yc, S1[1]], [[-.12 * f, 0], [-.12 * f, .25, wheel], [-.06 * f, .25, wheel], [-.06 * f, .20, dark], [.06 * f, .20, dark], [.06 * f, .25, wheel], [.12 * f, .25, wheel], [.12 * f, .21, wheel], [.03 * f, .19, dark], [.03 * f, .06, dark], [.10 * f, .06, wheel], [.10 * f, 0, wheel]], 22, wheel);
        for (let k = 0; k < 13; k++) pnRadial(M, S1[0], S1[1], k * 2 * Math.PI / 13, .245, .36, .08, .04, yc - .10, yc + .10, wheel);
        for (let k = 0; k < 8; k++) pnRadial(M, S1[0], S1[1], k * Math.PI / 4 + .2, .06, .20, .035, .03, yc + .06 * f - .01, yc + .06 * f + .01, wheel);
        // trailing idler: rim + 8 spokes
        L('y', [S2[0], yc, S2[1]], [[-.11 * f, .31], [-.11 * f, .37, wheel], [.11 * f, .37, wheel], [.11 * f, .31, wheel], [-.11 * f, .31, wheel]], 30, wheel);
        for (let k = 0; k < 8; k++) pnRadial(M, S2[0], S2[1], k * Math.PI / 4 + .2, .07, .32, .05, .035, yc - .025, yc + .025, wheel);
        L('y', [S2[0], yc - .06 * f, S2[1]], [[0, 0], [0, .08], [.16 * f, .08], [.16 * f, 0]], 14, dark);
        extrudeXZ(M, [[S2[0] + .57, S2[1] + .20], [S2[0] - .04, S2[1] + .04], [S2[0] + .02, S2[1] - .06], [S2[0] + .62, S2[1] + .10]], sy > 0 ? HW - .01 : -HW - .07, sy > 0 ? HW + .07 : -HW + .01, dark);   // idler arm
        extrudeXZ(M, [[S1[0] + .29, S1[1] + .28], [S1[0] + .32, S1[1] - .02], [S1[0] - .06, S1[1] - .20], [S1[0] - .24, S1[1] + .14]], sy > 0 ? HW - .01 : -HW - .07, sy > 0 ? HW + .07 : -HW + .01, dark);   // final drive
      }
      return { hull, dark, gun, glass, steel, grille, L, HW, DZ };
    }
    // ---------- M5A1 Stuart light tank — from the supplied 4-view (side / top / front / rear, 116.2 px/m) and the colour profile ----------
    // Hull with sponsons over the tracks (±1.10), shallow front deck + steep glacis to the driver's roof (Z 1.70), raised engine deck (1.83), front fenders,
    // turret with angled front cheeks, sloped roof front, radio bustle, 37 mm M6 in a box mantlet, .30 cal AA on the right turret side;
    // front sprocket, 4 road wheels on 2 vertical-volute bogies, 3 return rollers, large trailing idler.
    function buildM5(paint) {
      const P = PAINT[paint] || PAINT.olive, M = new Mesh(), K = v5M5Chassis(M, P, { FZ: 1.27, DZ: 1.70, EZ: 1.83, XF: 2.29, ZN: 1.05, XB: 2.24, ZB: 1.20, XG: 1.67, ZG: 1.32, XT: 1.28, XE0: -.70, XFF: 1.00, S1: [1.96, .72], S2: [-1.62, .46], WX: [1.50, .77, .15, -.57], WZ: .30, RX: [.90, 0, -.77], RZ: .94 });
      const { hull, dark, gun, glass, steel, L, DZ } = K;
      M.grp = 1;   // v192: turret part (rotates on its own)
      // ---- turret: angled front cheeks, sloped front roof, radio bustle; box mantlet + 37 mm M6 + coaxial .30; AA .30 on the right side ----
      const TZ0 = DZ + .02, ck = (fx, s) => Math.min(fx - .03, .70 * s + (fx - .86) * .2), poly = (fx, s) => [[fx, -.25 * s], [ck(fx, s), -.50 * s], [.28, -.60 * s], [-.30, -.60 * s], [-.78, -.51 * s], [-.78, .51 * s], [-.30, .60 * s], [.28, .60 * s], [ck(fx, s), .50 * s], [fx, .25 * s]];
      v5Stack(M, [[TZ0, poly(1.00, 1.06)], [2.29, poly(.80, 1.0)], [2.40, poly(.42, .96)]], hull);
      L('z', [.05, 0, DZ - .01], [[0, 0], [0, .78], [.05, .78], [.05, .70], [.10, .70], [.10, 0]], 32, dark);                        // ring guard
      M.box(-.98, -.76, -.20, .20, 1.98, 2.33, hull); M.box(-.99, -.97, -.16, .16, 2.02, 2.29, dark);                                   // radio bustle
      M.box(.78, 1.18, -.26, .26, 1.83, 2.21, hull); M.box(1.17, 1.20, -.22, .22, 1.87, 2.17, dark);                                   // mantlet
      for (const sy of [-1, 1]) M.box(.78, 1.10, sy * .26 - .02, sy * .26 + .02, 1.85, 2.19, dark);
      const GZ = 2.07;
      L('x', [1.18, 0, GZ], [[0, 0], [0, .07], [.06, .06], [.23, .055], [.25, .045], [.25, 0]], 16, gun);
      L('x', [1.43, 0, GZ], [[0, 0], [0, .032], [.96, .028], [.96, 0]], 12, gun);
      L('x', [1.18, .17, GZ - .02], [[0, 0], [0, .03], [.10, .03], [.10, .015], [.20, .013], [.20, 0]], 8, gun);
      M.box(1.17, 1.21, -.19, -.11, GZ + .05, GZ + .11, glass);
      for (const sy of [-1, 1]) for (const x0 of [.50, -.15]) {                                                                        // grouser stowage racks on the turret sides
        const yw = x => (x > .28 ? .60 + (.28 - x) * .4 : .60) * 1.03 + .02;
        M.box(x0 - .30, x0, sy > 0 ? yw(x0) - .02 : -yw(x0), sy > 0 ? yw(x0) : -yw(x0) + .02, 1.98, 2.32, dark);
        for (let k = 0; k < 4; k++) { const xx = x0 - .03 - k * .08; M.box(xx - .02, xx + .02, sy > 0 ? yw(x0) : -yw(x0) - .04, sy > 0 ? yw(x0) + .04 : -yw(x0), 1.96, 2.34, steel); }
      }
      // roof: commander's hatch (left, rounded rectangle), gunner's periscope, loader's hatch (right rear), ventilator
      M.prismXY([[.48, .25], [.48, .55], [.18, .55], [.18, .25]], 2.40, 2.43, dark); M.prismXY([[.45, .28], [.45, .52], [.21, .52], [.21, .28]], 2.43, 2.45, hull);
      L('z', [.32, -.31, 2.40], [[0, 0], [0, .13], [.02, .13], [.02, .11], [.05, .11], [.05, 0]], 18, hull); M.box(.28, .38, -.36, -.26, 2.45, 2.52, dark);
      L('z', [-.21, -.12, 2.40], [[0, 0], [0, .15], [.02, .15], [.02, .13], [.04, .13], [.04, 0]], 18, hull);
      L('z', [.08, .05, 2.40], [[0, 0], [0, .09], [.02, .09], [.04, .06], [.04, 0]], 12, dark);
      // .30 cal M1919 on the right-side pintle
      { const px = -.05, py = -.66, pz = 2.58; M.box(px - .05, px + .05, py - .04, py + .04, 1.95, 2.30, dark); L('z', [px, py, 2.30], [[0, 0], [0, .02], [pz - 2.33, .02], [pz - 2.33, 0]], 6, dark);
        M.box(px - .30, px + .15, py - .04, py + .04, pz - .04, pz + .05, gun); L('x', [px + .15, py, pz], [[0, 0], [0, .03], [.20, .03], [.20, .012], [.65, .012], [.65, 0]], 8, gun); M.box(px - .10, px + .02, py + .04, py + .14, pz - .10, pz + .02, dark); }
      L('z', [-.92, 0, 2.33], [[0, 0], [0, .05], [.06, .05], [.06, .03], [.12, .03], [.12, 0]], 10, dark);                             // antenna base on the bustle
      M.grp = 0;
      return M;
    }

    // ---------- M8 75 mm Howitzer Motor Carriage "Scott" — from the supplied 4-view (102.5 px/m) and the photo ----------
    // M5 chassis (driver's hatches moved onto the glacis, periscope domes on the hull roof) with a large open-topped rounded turret,
    // 75 mm M2/M3 howitzer behind a horseshoe-shaped mantlet, .50 cal M2HB on the rear ring mount.
    function buildM8HMC(paint) {
      const P = PAINT[paint] || PAINT.olive, M = new Mesh();
      const K = v5M5Chassis(M, P, { FZ: 1.20, DZ: 1.61, EZ: 1.76, XF: 2.27, ZN: .98, XB: 2.21, ZB: 1.10, XG: 1.65, ZG: 1.21, XT: 1.06, XE0: -.65, XFF: .83, glacisHatches: true, HX: 1.85,
        S1: [1.90, .59], S2: [-1.64, .44], WX: [1.43, .71, .07, -.63], WZ: .29, RX: [.89, -.03, -.81], RZ: .87 });
      const { hull, dark, gun, glass, steel, L, DZ } = K, inner = M.mat([88, 94, 62], { spec: .03, noise: .8 }), canvas = M.mat([112, 108, 80], { spec: .03, noise: 1.2 });
      // ---- open-topped turret: rounded rectangle in plan (X .89 → -.85, ±.87), walls leaning in slightly ----
      const TZ0 = DZ + .02, TZ1 = 2.21, n = 48;
      const rr = (x0, x1, w, rf, rb, d) => { const pts = []; const arc = (cx, cy, r, a0, a1) => { for (let k = 0; k <= 6; k++) { const a = a0 + (a1 - a0) * k / 6; pts.push([cx + (r - d) * Math.cos(a), cy + (r - d) * Math.sin(a)]); } };
        arc(x0 - rf, -w + rf, rf, 0, -Math.PI / 2); arc(x1 + rb, -w + rb, rb, -Math.PI / 2, -Math.PI); arc(x1 + rb, w - rb, rb, Math.PI, Math.PI / 2); arc(x0 - rf, w - rf, rf, Math.PI / 2, 0); return v5Hull2(pts); };
      const cx = .02, ring = (ol, d) => Array.from({ length: n }, (_, k) => { const a = k * 2 * Math.PI / n, r = v5Ray(ol.map(([x, y]) => [x - cx, y]), a) - d; return [cx + r * Math.cos(a), r * Math.sin(a)]; });
      const OB = rr(.89, -.85, .87, .36, .46, 0), OT = rr(.85, -.82, .83, .34, .44, 0);
      v5LoftZ(M, ring(OB, 0), ring(OT, 0), TZ0, TZ1, hull, false);
      v5LoftZ(M, ring(OT, .025), ring(OB, .03), TZ1, TZ0 + .12, inner, false);
      { const A = ring(OT, 0), B = ring(OT, .025); for (let i = 0; i < n; i++) { const j = (i + 1) % n; M.quad([A[i][0], A[i][1], TZ1], [A[j][0], A[j][1], TZ1], [B[j][0], B[j][1], TZ1], [B[i][0], B[i][1], TZ1], hull, [cx, 0, 0]); } }
      { const A = ring(OT, -.012), B = ring(OT, .01); for (let i = 0; i < n; i++) { const j = (i + 1) % n;                 // rolled top lip
        M.hex8([[A[i][0], A[i][1], TZ1 - .07], [A[j][0], A[j][1], TZ1 - .07], [B[j][0], B[j][1], TZ1 - .07], [B[i][0], B[i][1], TZ1 - .07], [A[i][0], A[i][1], TZ1 + .005], [A[j][0], A[j][1], TZ1 + .005], [B[j][0], B[j][1], TZ1 + .005], [B[i][0], B[i][1], TZ1 + .005]], hull); } }
      M.prismXY(ring(OB, .04), TZ0 + .10, TZ0 + .12, inner);
      L('z', [.02, 0, DZ - .01], [[0, 0], [0, .80], [.04, .80], [.04, 0]], 32, dark);
      for (const sy of [-1, 1]) { for (let k = 0; k < 5; k++) L('x', [-.65 + k * .22, sy * .66, TZ0 + .465], [[0, 0], [0, .045], [.18, .045], [.18, 0]], 10, gun); M.box(-.70, .40, sy > 0 ? .55 : -.78, sy > 0 ? .78 : -.55, TZ0 + .12, TZ0 + .42, dark); }   // ammunition racks
      M.box(-.62, -.30, -.25, .10, TZ0 + .12, TZ0 + .55, canvas);
      // ---- 75 mm howitzer: horseshoe mantlet, cradle, barrel with muzzle ring; breech inside ----
      extrudeXZ(M, [[.69, 1.65], [1.06, 1.62], [1.22, 1.82], [1.27, 2.00], [1.21, 2.20], [1.06, 2.31], [.69, 2.30]], -.30, .30, hull);
      for (const sy of [-1, 1]) extrudeXZ(M, [[.80, 1.70], [1.10, 1.70], [1.20, 1.90], [1.12, 2.18], [.80, 2.22]], sy > 0 ? .30 : -.34, sy > 0 ? .34 : -.30, hull);   // side cheeks of the shield
      const GZ = 1.95;
      L('x', [1.20, 0, GZ], [[0, 0], [0, .11], [.06, .10], [.06, .09], [.46, .085], [.46, .10], [.59, .10], [.59, 0]], 18, gun);
      L('x', [1.10, 0, GZ - .16], [[0, 0], [0, .05], [.22, .05], [.22, 0]], 12, gun);
      M.box(-.05, .70, -.14, .14, GZ - .14, GZ + .12, gun); L('x', [-.25, 0, GZ], [[0, 0], [0, .13], [.25, .13], [.25, 0]], 14, gun);   // cradle + breech
      M.box(.40, .60, .32, .40, GZ + .10, GZ + .22, dark); M.box(.44, .56, .13, .33, GZ + .10, GZ + .14, dark); M.box(.59, .61, .33, .39, GZ + .13, GZ + .19, glass);                      // sight
      // ---- .50 cal M2HB on the rear ring mount, trained forward ----
      { const rx = -.38, ry = -.09, rz = TZ1 + .03, r = .37;
        L('z', [rx, ry, rz - .03], [[0, r - .03], [0, r], [.04, r], [.04, r - .03]], 32, dark);
        v5Rod(M, [rx - r + .02, ry, rz], [rx + r - .02, ry, rz], .03, dark, 4); v5Rod(M, [rx, ry - r + .02, rz], [rx, ry + r - .02, rz], .025, dark, 4);   // carriage beams across the ring
        v5Rod(M, [rx, ry - r, rz - .01], [rx, -.80, TZ1 - .01], .03, dark, 4); v5Rod(M, [rx - r, ry, rz - .01], [-.81, ry, TZ1 - .01], .03, dark, 4);   // brackets to the right and rear walls
        v5Rod(M, [rx - r * .7, ry - r * .7, rz - .01], [-.74, -.62, TZ1 - .01], .03, dark, 4);
        v5Rod(M, [rx + r * .7, ry + r * .7, rz - .02], [rx + r * .7, ry + r * .7, TZ0 + .12], .035, dark, 6);           // support post down to the turret floor
        const px = -.10, pz = 2.46;
        M.box(px - .03, px + .03, ry - .03, ry + .03, rz, pz - .05, dark);
        M.box(px - .48, px + .20, ry - .06, ry + .06, pz - .07, pz + .06, gun); M.box(px - .52, px - .44, ry - .05, ry + .05, pz - .04, pz + .04, dark);
        L('x', [px + .20, ry, pz], [[0, 0], [0, .03], [.30, .03], [.30, .02], [.92, .018], [.94, .026], [.98, .026], [.98, 0]], 10, gun);
        M.box(px - .20, px - .05, ry + .06, ry + .20, pz - .14, pz + .0, dark); }
      L('z', [-.80, -.52, TZ1 - .10], [[0, 0], [0, .04], [.05, .04], [.05, .025], [.10, .025], [.10, 0]], 10, dark);              // antenna base
      return M;
    }

    // ---------- v96 infantry: procedural soldier figures (one man per mesh; squads are composed at draw time) ----------
    // Body frame: X forward, Y left, Z up, origin on the ground between the feet. Height ≈ 1.78 m to the helmet top; head slightly enlarged for readability.
    const v7 = {
      add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
      dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
      len: a => Math.hypot(a[0], a[1], a[2]), nrm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
      rz: t => [Math.cos(t), -Math.sin(t), 0, Math.sin(t), Math.cos(t), 0, 0, 0, 1],
      ry: t => [Math.cos(t), 0, Math.sin(t), 0, 1, 0, -Math.sin(t), 0, Math.cos(t)],
      rx: t => [1, 0, 0, 0, Math.cos(t), -Math.sin(t), 0, Math.sin(t), Math.cos(t)],
      mm: (A, B) => { const C = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) C.push(A[i * 3] * B[j] + A[i * 3 + 1] * B[3 + j] + A[i * 3 + 2] * B[6 + j]); return C; },
      mv: (R, p) => [R[0] * p[0] + R[1] * p[1] + R[2] * p[2], R[3] * p[0] + R[4] * p[1] + R[5] * p[2], R[6] * p[0] + R[7] * p[1] + R[8] * p[2]],
      basis(ex, up) { ex = this.nrm(ex); let ez = this.nrm(this.sub(up, this.mul(ex, this.dot(up, ex)))); const ey = this.cross(ez, ex); return [ex[0], ey[0], ez[0], ex[1], ey[1], ez[1], ex[2], ey[2], ez[2]]; }
    };
    // rotate + translate every triangle added since triangle index t0
    function v7Xf(M, t0, R, t) {
      for (let i = t0 * 9; i < M.P.length; i += 3) {
        const p = v7.mv(R, [M.P[i], M.P[i + 1], M.P[i + 2]]), n = v7.mv(R, [M.N[i], M.N[i + 1], M.N[i + 2]]);
        M.P[i] = p[0] + t[0]; M.P[i + 1] = p[1] + t[1]; M.P[i + 2] = p[2] + t[2]; M.N[i] = n[0]; M.N[i + 1] = n[1]; M.N[i + 2] = n[2];
      }
    }
    function v7Limb(M, a, b, r0, r1, m, n = 8) {                                  // tapered closed tube a → b
      const ax = v7.sub(b, a), L = v7.len(ax); if (L < 1e-6) return;
      const t0 = M.M.length; M.lathe('x', [0, 0, 0], [[0, 0], [0, r0], [L, r1], [L, 0]], n, m);
      v7Xf(M, t0, v7.basis(ax, Math.abs(ax[2]) / L > .9 ? [1, 0, 0] : [0, 0, 1]), a);
    }
    function v7Ball(M, c, r, m, n = 10) {
      const prof = []; for (let k = 0; k <= 6; k++) { const t = -Math.PI / 2 + Math.PI * k / 6; prof.push([r + r * Math.sin(t), r * Math.cos(t)]); }
      M.lathe('z', [c[0], c[1], c[2] - r], prof, n, m);
    }
    function v7Polyline(M, pts, r, m, n = 4) { for (let i = 0; i + 1 < pts.length; i++) v7Limb(M, pts[i], pts[i + 1], r, r, m, n); }
    // surface of revolution whose profile depends on the azimuth: prof(a) → [[r, z], ...] (same count for every a, last point near the axis)
    function v7Radial(M, n, prof, m) {
      const ring = k => { const a = k * 2 * Math.PI / n; return prof(a).map(([r, z]) => [r * Math.cos(a), r * Math.sin(a), z]); };
      const R = Array.from({ length: n }, (_, k) => ring(k)), np = R[0].length, top = [0, 0, R[0][np - 1][2] + .004];
      for (let k = 0; k < n; k++) { const A = R[k], B = R[(k + 1) % n]; for (let j = 0; j + 1 < np; j++) M.quad(A[j], B[j], B[j + 1], A[j + 1], m, [0, 0, -.05]); M.tri(top, A[np - 1], B[np - 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], m); }
    }
    function v7IK(a, c, l1, l2, hint) {                                            // two-bone IK: returns the middle joint and the (reach-clamped) end
      let d = v7.sub(c, a), D = v7.len(d); const mx = (l1 + l2) * .995;
      if (D > mx) { c = v7.add(a, v7.mul(d, mx / D)); d = v7.sub(c, a); D = mx; }
      const u = v7.mul(d, 1 / D), x = (l1 * l1 - l2 * l2 + D * D) / (2 * D), h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
      const p = v7.nrm(v7.sub(hint, v7.mul(u, v7.dot(hint, u))));
      return { j: v7.add(v7.add(a, v7.mul(u, x)), v7.mul(p, h)), c };
    }

