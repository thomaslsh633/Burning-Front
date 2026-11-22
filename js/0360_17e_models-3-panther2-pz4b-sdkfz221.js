    function buildPanther2(paint) {
      const P = PAINT[paint] || PAINT.grey, M = new Mesh();
      const hull = M.mat(P.hull, { spec: .08 }), dark = M.mat(P.dark, { spec: .05 }), gun = M.mat(P.gun, { spec: .22, noise: .5 });
      const trk = M.mat([58, 54, 48], { spec: .06, noise: 1.4 }), trkR = M.mat([70, 64, 56], { shadow: false, noise: 1.4 }), tyre = M.mat([30, 31, 33], { noise: .6 }), wheel = M.mat(P.wheel, { spec: .12 });
      const rack = M.mat([62, 58, 52], { shadow: false, noise: 1.2 }), grille = M.mat([34, 36, 38], { shadow: false, noise: .5 }), glass = M.mat([20, 26, 30], { spec: .8, shadow: false, noise: 0 });
      const L = (ax, o, prof, seg, m) => M.lathe(ax, o, prof, seg, m);
      const DZ = 1.90, SKY = 1.69, SKT = 1.46, SKB = .945;      // deck height, outer face of the skirts, skirt top / bottom
      const glZ = x => 1.0 + (3.20 - x) * .719;                   // glacis plane (≈36°): nose X 3.20 / Z 1.00 → deck edge X 1.94 / Z 1.91

      // ---- hull ----
      M.hex8([[-2.85, -.90, .52], [2.88, -.90, .52], [2.88, .90, .52], [-2.85, .90, .52],                       // lower tub between the tracks + sloped lower nose
              [-2.95, -.90, 1.05], [3.20, -.90, 1.00], [3.20, .90, 1.00], [-2.95, .90, 1.05]], hull);
      M.box(-2.92, 2.56, -1.50, 1.50, .96, SKT, dark);                                                         // sponson core (hidden behind the skirts)
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

      // ---- side skirts (Schürzen): 6 plates per side on a hanging rail ----
      const SX = [2.94, 1.89, .95, -.06, -1.04, -1.98, -2.96];
      for (const sy of [-1, 1]) {
        const ya = sy > 0 ? SKY - .04 : -SKY, yb = sy > 0 ? SKY : -SKY + .04, ye = sy > 0 ? SKY : -SKY - .025, yf = sy > 0 ? SKY + .025 : -SKY;
        M.box(-2.96, 2.94, sy > 0 ? 1.46 : -SKY, sy > 0 ? SKY : -1.46, SKT, SKT + .045, dark);                    // rail / shelf the skirts hang from
        for (let k = 0; k < 6; k++) {
          const a = SX[k + 1] + .008, b = SX[k] - .008;
          M.box(a, b, ya, yb, SKB, SKT, hull);
          for (const ox of [.14, .80]) M.box(b - ox - .06, b - ox + .06, sy > 0 ? SKY : -SKY - .028, sy > 0 ? SKY + .028 : -SKY, SKT - .07, SKT, dark);   // hanger lugs
        }
        for (let k = 0; k < 7; k++) for (const zz of [1.37, 1.17]) {                                              // hanger bolts at the plate joints
          if (k === 0 || k === 6) continue;
          L('y', [SX[k] - .04, sy * SKY, zz], [[0, 0], [0, .024], [.03 * sy, .024], [.03 * sy, 0]], 6, dark);
        }
        for (const px of [.47, -.75]) M.box(px - .02, px + .02, sy > 0 ? 1.40 : -1.62, sy > 0 ? 1.62 : -1.40, SKT, 1.71, dark);   // rail brackets
        pnSlopeRow(M, sy, -2.80, 2.30, 1.69, 1.73, .04, dark);                                                   // long rail on the sloped hull side
        // gun-cleaning rod tube + clamps on the hull side
        L('x', [-1.25, sy * 1.41, 1.80], [[0, 0], [0, .035], [2.80, .035], [2.80, 0]], 8, dark);
        for (const px of [-1.0, -.2, .6, 1.3]) pnSlopeRow(M, sy, px - .03, px + .03, 1.76, 1.84, .06, dark);
        // tool rack at the front of the hull side: panel + jack + clamps
        pnSlopeRow(M, sy, 1.00, 1.78, 1.60, 1.72, .03, dark);
        pnSlopeRow(M, sy, 1.12, 1.52, 1.64, 1.70, .08, hull);
        for (const px of [1.20, 1.60]) pnSlopeRow(M, sy, px - .04, px + .04, 1.60, 1.72, .07, dark);
        // spare track links on the rear hull sides: 3 racks × 2 rows
        for (let g = 0; g < 3; g++) {
          const x1 = -1.40 - g * .62, x0 = x1 - .52;
          pnSlopeRow(M, sy, x0, x1, 1.62, 1.96, .03, dark);
          for (const [z0, z1] of [[1.80, 1.94], [1.64, 1.78]]) {
            pnSlopeRow(M, sy, x0 + .01, x1 - .01, z0, z1, .085, rack);
            for (let r = 0; r < 6; r++) { const xs = x0 + .035 + r * .088; pnSlopeRow(M, sy, xs, xs + .026, z0 + .012, z1 - .012, .105, trk); }
          }
        }
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

      M.grp = 1;   // v192: turret part (rotates on its own)
      // ---- turret (Panther G): sloped sides, inclined front plate, rear plate sloped ----
      const zf = x => 2.64 + Math.max(0, Math.min(1, (.62 - x) / 1.8)) * .06;
      L('z', [-.10, 0, DZ - .02], [[0, 0], [0, 1.00], [.06, 1.00], [.06, 0]], 28, dark);                          // turret ring / shot trap
      loftZ(M, [[.77, -1.06], [-.89, -1.17], [-1.58, -.75], [-1.58, .75], [-.89, 1.17], [.77, 1.06]],
               [[.62, -.80], [-.85, -.86], [-1.18, -.56], [-1.18, .56], [-.85, .86], [.62, .80]], DZ, (x, y) => zf(x), hull);
      // half-cylinder gun mantlet (axis along Y, flat back on the turret front plate, D-shaped ends with a recessed ring) + conical barrel boss,
      // KwK 42 L/70 and double-baffle muzzle brake
      { const cx = .74, cz = 2.31, a = .43, b = .28, hw = .76, half = (a_, b_, x0) => { const p = []; for (let k = 0; k <= 18; k++) { const t = -Math.PI / 2 + Math.PI * k / 18; p.push([cx + a_ * Math.cos(t), cz + b_ * Math.sin(t)]); } p.push([x0, cz + b_], [x0, cz - b_]); return p; };
        extrudeXZ(M, half(a, b, .60), -hw, hw, hull);
        for (const sy of [-1, 1]) {
          extrudeXZ(M, half(a * .80, b * .78, .62), sy > 0 ? hw : -hw - .014, sy > 0 ? hw + .014 : -hw, dark);          // recessed ring on the D-shaped end faces
          extrudeXZ(M, half(a * .58, b * .55, .64), sy > 0 ? hw + .014 : -hw - .026, sy > 0 ? hw + .026 : -hw - .014, hull);
        }
        for (let k = 0; k < 18; k++) { const t0 = -Math.PI / 2 + Math.PI * k / 18, t1 = -Math.PI / 2 + Math.PI * (k + 1) / 18;      // two seam beads along the curved front
          for (const yy of [-.52, .52]) M.hex8([[cx + a * Math.cos(t0), yy - .012, cz + b * Math.sin(t0)], [cx + a * Math.cos(t1), yy - .012, cz + b * Math.sin(t1)], [cx + a * Math.cos(t1), yy + .012, cz + b * Math.sin(t1)], [cx + a * Math.cos(t0), yy + .012, cz + b * Math.sin(t0)],
            [cx + (a + .008) * Math.cos(t0), yy - .012, cz + (b + .008) * Math.sin(t0)], [cx + (a + .008) * Math.cos(t1), yy - .012, cz + (b + .008) * Math.sin(t1)], [cx + (a + .008) * Math.cos(t1), yy + .012, cz + (b + .008) * Math.sin(t1)], [cx + (a + .008) * Math.cos(t0), yy + .012, cz + (b + .008) * Math.sin(t0)]], dark); }
      }
      L('x', [1.10, 0, 2.33], [[0, 0], [0, .19], [.07, .19], [.17, .15], [.25, .125], [.25, 0]], 24, hull);          // conical barrel boss on the mantlet front
      L('x', [1.34, 0, 2.33], [[0, 0], [0, .128], [.03, .128], [.03, .10], [.10, .10], [.10, 0]], 20, gun);          // barrel seal ring
      L('x', [1.10, 0, 2.33], [[0, 0], [0, .10], [3.63, .078], [3.63, 0]], 20, gun);
      L('x', [4.73, 0, 2.33], [[0, 0], [0, .075], [.03, .112], [.15, .112], [.17, .088], [.23, .088], [.25, .113], [.50, .113], [.53, .085], [.53, 0]], 16, gun);
      for (const zz of [-1, 1]) M.box(4.80, 5.20, -.12, .12, 2.33 + zz * .095 - .006, 2.33 + zz * .095 + .006, dark);   // baffle slots
      M.box(1.12, 1.19, .24, .36, 2.29, 2.36, glass);                                                              // gunner's sight aperture
      L('x', [1.14, -.47, 2.33], [[0, 0], [0, .04], [.045, .04], [.045, .025], [.06, .025], [.06, 0]], 12, dark);                          // coaxial MG port
      // commander's cupola (left rear) with 8 vision slits, flange and hatch ring; loader's hatch (right front)
      L('z', [-.71, .35, 2.665], [[0, 0], [0, .46], [.04, .46], [.04, .415], [.22, .405], [.22, .435], [.275, .435], [.275, .36], [.29, .36], [.29, 0]], 28, hull);
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + .2; M.rectZ(-.71 + .405 * Math.cos(a), .35 + .405 * Math.sin(a), a, .035, .10, 2.745, 2.845, glass); }
      L('z', [-.71, .35, 2.955], [[0, 0], [0, .30], [.025, .30], [.025, .10], [.05, .10], [.05, 0]], 20, dark);
      M.rectZ(-.71, .35, .0, .50, .028, 2.955, 2.97, dark); M.rectZ(-.71, .35, 1.57, .50, .028, 2.955, 2.97, dark);   // MG ring cross
      L('z', [.10, -.37, 2.64], [[0, 0], [0, .26], [.035, .26], [.035, .22], [.05, .22], [.05, 0]], 24, hull);
      M.box(-.03, .06, -.37 - .02, -.37 + .02, 2.69, 2.71, dark);
      for (const sy of [-1, 1]) {
        L('y', [-.69, sy * 1.015, 2.23], [[0, 0], [0, .15], [.035 * sy, .15], [.035 * sy, 0]], 16, dark);          // crew escape hatches in the turret sides
        L('y', [-.21, sy * 1.065, 2.29], [[0, 0], [0, .03], [.03 * sy, .03], [.03 * sy, 0]], 8, dark);              // pistol ports
      }
      L('z', [-1.20, 0, 2.70], [[0, 0], [0, .07], [.02, .07], [.02, 0]], 10, dark);                              // rear roof port
      M.grp = 0;
      // antenna base on the right rear spare-track rack
      L('z', [-1.96, -1.40, 1.95], [[0, 0], [0, .055], [.03, .055], [.03, .03], [.10, .03], [.10, 0]], 10, dark);

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
        M.box(-2.25, 2.20, ya, yb, .02, .24, trk);          // lower track run seen between the wheels
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

    // ---------- Pz.Kpfw. IV Ausf. G (v89) — redrawn from the supplied 1:35 blueprint (side / top / front / rear views) ----------
    // Blueprint scale 178.4 px/m.  Side/top: X = (660.5-px)/178.4;  side Z = (494-py)/178.4;  top Y = (py-784)/178.4 (down = vehicle left).
    // The turret axis is offset 0.067 m to the vehicle left.  Metres; X forward, Y left, Z up; origin = hull centre on the ground.
    function p4NZ(x) { return 1.01 + (2.75 - x) * .3093; }                      // upper nose plate (~17 deg): Z 1.01 @ X 2.75 -> 1.31 @ X 1.78
    function p4OnNose(M, x0, x1, y0, y1, th, m) {                               // slab lying on the sloped upper nose plate
      const a = p4NZ(x0), b = p4NZ(x1);
      M.hex8([[x0, y0, a], [x1, y0, b], [x1, y1, b], [x0, y1, a], [x0, y0, a + th], [x1, y0, b + th], [x1, y1, b + th], [x0, y1, a + th]], m);
    }
    function p4Strip(M, TT, BB, zT, zB, th, sy, ty, m) {                         // thin inclined plate strip between a top polyline and a bottom polyline (plan coords X,|Y|)
      for (let i = 0; i + 1 < TT.length; i++) {
        const a = TT[i], b = TT[i + 1], c = BB[i + 1], d = BB[i];
        let nx = b[1] - a[1], ny = -(b[0] - a[0]); const l = Math.hypot(nx, ny) || 1; nx = nx / l * th; ny = ny / l * th; if (ny < 0) { nx = -nx; ny = -ny; }
        const P = (p, z, k) => [p[0] - nx * k, sy * (p[1] - ny * k) + ty, z];
        M.hex8([P(a, zT, 0), P(b, zT, 0), P(c, zB, 0), P(d, zB, 0), P(a, zT, 1), P(b, zT, 1), P(c, zB, 1), P(d, zB, 1)], m);
      }
    }
    function p4Wheel(M, x, yc, z, f, wheel, tyre, dark, L) {                     // double steel-tyred road wheel (two rubber bands, grooved centre, dished outer disc, 8 slots, hub cap)
      L('y', [x, yc, z], [[-.12 * f, 0], [-.12 * f, .20, wheel], [-.12 * f, .235, tyre], [-.045 * f, .235, tyre], [-.045 * f, .215, wheel], [.045 * f, .215, wheel], [.045 * f, .235, tyre],
        [.12 * f, .235, tyre], [.12 * f, .195, tyre], [.10 * f, .185, wheel], [.075 * f, .16, wheel], [.075 * f, .065, wheel], [.10 * f, .065, wheel], [.10 * f, 0, wheel]], 26, wheel);
      for (let k = 0; k < 8; k++) {
        const a = k * Math.PI / 4 + .2, y0 = yc + .097 * f, y1 = yc + .11 * f;
        pnRadial(M, x, z, a, .105, .17, .034, .05, Math.min(y0, y1), Math.max(y0, y1), dark);
        L('y', [x + .085 * Math.cos(a + Math.PI / 8), yc + .108 * f, z + .085 * Math.sin(a + Math.PI / 8)], [[0, 0], [0, .012], [.012 * f, .012], [.012 * f, 0]], 5, dark);
      }
      L('y', [x, yc + .10 * f, z], [[0, 0], [0, .05], [.025 * f, .05], [.025 * f, .025], [.04 * f, .025], [.04 * f, 0]], 10, dark);
    }
    function buildPanzer4b(paint, opt = {}) {   // v124: opt.cmd → Pz.Bef.Wg. IV (Ausf. F1 drawing: short 7.5 cm L/24, antennas)
      const P = PAINT[paint] || PAINT.grey, M = new Mesh();
      const hull = M.mat(P.hull, { spec: .08 }), dark = M.mat(P.dark, { spec: .05 }), gun = M.mat(P.gun, { spec: .22, noise: .5 });
      const trk = M.mat([58, 54, 48], { spec: .06, noise: 1.4 }), trkR = M.mat([70, 64, 56], { shadow: false, noise: 1.4 }), tyre = M.mat([30, 31, 33], { noise: .6 }), wheel = M.mat(P.wheel, { spec: .12 });
      const grille = M.mat([34, 36, 38], { shadow: false, noise: .5 }), glass = M.mat([20, 26, 30], { spec: .8, shadow: false, noise: 0 }), rust = M.mat([92, 70, 52], { shadow: false, noise: 1.0 });
      const L = (ax, o, prof, seg, m) => M.lathe(ax, o, prof, seg, m);
      const HW = .92, RZ = 1.67, FZ = 1.26, TY = .067, FW = 1.42;                    // hull half-width, roof height, fender height, turret axis offset, fender outer edge

      // ---- hull: tub + superstructure (one block), sloped upper nose plate, vertical lower nose ----
      extrudeXZ(M, [[-2.46, .44], [-2.46, 1.55], [-2.36, 1.605], [-2.20, 1.622], [-1.20, 1.668], [1.70, RZ], [1.78, 1.62], [1.78, .44]], -HW, HW, hull);
      extrudeXZ(M, [[1.78, .44], [1.78, 1.31], [2.75, 1.01], [2.75, .44]], -HW, HW, hull);
      M.box(1.70, 1.88, -HW - .02, HW + .02, 1.60, RZ, dark);                            // roof-front ledge
      for (const yy of [.62, -.62]) {                                                    // lower nose: tow shackle brackets
        M.box(2.74, 2.79, yy - .16, yy + .16, .58, .90, dark);
        L('x', [2.79, yy, .74], [[0, 0], [0, .045], [.05, .045], [.05, 0]], 10, dark);
        M.box(2.75, 2.80, yy + .09 - .02, yy + .09 + .02, .53, .74, dark);
      }
      for (const yy of [-.69, .69]) {                                                    // brake inspection hatches (frame + domed cover)
        p4OnNose(M, 2.05, 2.65, yy - .20, yy + .20, .020, dark);
        p4OnNose(M, 2.09, 2.60, yy - .16, yy + .16, .045, hull);
        p4OnNose(M, 2.20, 2.48, yy - .08, yy + .08, .075, hull);
      }
      p4OnNose(M, 1.92, 2.64, -.40, .24, .018, dark);                                  // transmission access hatch
      p4OnNose(M, 1.97, 2.59, -.35, .19, .036, hull);
      p4OnNose(M, 2.28, 2.58, -.30, .13, .048, dark);                                  // handle recess
      // superstructure front plate: driver's visor (left), bow MG ball mount (right)
      M.box(1.78, 1.90, .17, .65, 1.23, 1.45, hull);
      M.box(1.89, 1.905, .21, .61, 1.28, 1.345, glass);
      M.box(1.78, 1.91, .17, .19, 1.23, 1.45, dark); M.box(1.78, 1.91, .63, .65, 1.23, 1.45, dark);
      L('x', [1.78, -.50, 1.41], [[0, 0], [0, .155], [.03, .155], [.03, .12], [.075, .12], [.12, .085], [.12, 0]], 20, dark);
      L('x', [1.88, -.50, 1.41], [[0, 0], [0, .075], [.05, .075], [.07, .055], [.30, .028], [.30, 0]], 14, hull);
      for (const [yy, zz] of [[-.50 - .13, 1.51], [-.50 + .13, 1.51], [-.50 - .13, 1.31], [-.50 + .13, 1.31]]) L('x', [1.78, yy, zz], [[0, 0], [0, .014], [.012, .014], [.012, 0]], 6, dark);
      L('x', [1.78, -.10, 1.47], [[0, 0], [0, .03], [.02, .03], [.02, 0]], 8, dark);   // small port in the plate
      // roof hatches: driver (left) / radio operator (right): rounded cover, hinged hatch with periscope hood
      for (const yy of [-.62, .62]) {
        pnOct(M, 1.33, yy, .25, .29, .08, RZ, RZ + .02, dark);
        pnOct(M, 1.33, yy, .22, .26, .07, RZ + .02, RZ + .035, hull);
        L('z', [1.35, yy, RZ + .035], [[0, 0], [0, .115], [.027, .115], [.027, .085], [.039, .085], [.039, 0]], 16, hull);
        M.box(1.17, 1.25, yy - .04, yy + .04, RZ + .035, RZ + .062, dark);
      }
      // ---- fenders (diamond plate): flat top at Z 1.30, curved/sloped front mudguard, sloped rear ramp ----
      for (const sy of [-1, 1]) {
        const ya = sy > 0 ? HW : -FW, yb = sy > 0 ? FW : -HW;
        M.box(-2.46, 2.58, ya, yb, FZ - .035, FZ, hull);
        M.hex8([[2.58, ya, FZ], [2.74, ya, FZ - .035], [2.74, ya, FZ - .075], [2.58, ya, FZ - .035], [2.58, yb, FZ], [2.74, yb, FZ - .035], [2.74, yb, FZ - .075], [2.58, yb, FZ - .035]], hull);
        M.hex8([[2.74, ya, FZ - .035], [2.93, ya, .975], [2.90, ya, .945], [2.72, ya, FZ - .075], [2.74, yb, FZ - .035], [2.93, yb, .975], [2.90, yb, .945], [2.72, yb, FZ - .075]], hull);
        { const ra = sy > 0 ? .86 : -FW, rb = sy > 0 ? FW : -.86;
          M.hex8([[-2.46, ra, FZ], [-3.00, ra, .995], [-3.00, ra, .955], [-2.46, ra, FZ - .035], [-2.46, rb, FZ], [-3.00, rb, .995], [-3.00, rb, .955], [-2.46, rb, FZ - .035]], hull); }   // rear ramp plate
        for (const yy of [sy > 0 ? HW + .005 : -HW - .025, sy > 0 ? FW - .025 : -FW])                                                            // triangular end gussets
          extrudeXZ(M, [[-2.46, FZ], [-3.00, .99], [-2.96, .94], [-2.46, .94]], yy, yy + .025, dark);
        extrudeXZ(M, [[2.60, FZ + .03], [2.76, FZ - .01], [2.93, .975], [2.60, .94]], sy > 0 ? FW - .025 : -FW, sy > 0 ? FW : -FW + .025, dark);          // front gusset
      }
      // ---- front fenders: left Notek lamp (ball head on a stalk), right head-lamp box + conduit (both at |Y| ~1.07) ----
      L('z', [2.10, 1.07, FZ], [[0, 0], [0, .05], [.03, .05], [.03, .022], [.13, .022], [.13, 0]], 10, dark);
      L('y', [2.10, 1.07, FZ + .19], [[-.075, 0], [-.075, .06], [-.04, .088], [.04, .088], [.075, .06], [.075, 0]], 16, dark);
      L('x', [2.10 + .09, 1.07, FZ + .19], [[0, 0], [0, .07], [-.012, .075], [-.012, 0]], 14, glass);
      M.box(2.02, 2.20, 1.07 - .09, 1.07 + .09, FZ + .188, FZ + .193, dark);
      M.box(2.04, 2.20, -1.14, -1.00, FZ, FZ + .17, dark);
      M.box(2.195, 2.21, -1.12, -1.02, FZ + .04, FZ + .14, glass);
      M.box(2.06, 2.18, -1.09, -1.05, FZ + .17, FZ + .20, dark);
      L('x', [1.80, -1.20, FZ + .035], [[0, 0], [0, .022], [.60, .022], [.60, 0]], 8, dark);
      for (const px of [1.95, 2.25]) M.box(px - .015, px + .015, -1.225, -1.175, FZ, FZ + .06, dark);
      // ---- hull side details (both sides): X-braced vision cover, inspection plate, rivet rows, rear air louvres ----
      const bar = (y, y1, p, q, w, m) => {                                                // thin diagonal bar in the XZ plane, Y y..y1
        let dx = q[0] - p[0], dz = q[1] - p[1]; const l = Math.hypot(dx, dz); dx = dx / l * w / 2; dz = dz / l * w / 2;
        const A = [p[0] - dz, p[1] + dx], B = [p[0] + dz, p[1] - dx], C = [q[0] + dz, q[1] - dx], D = [q[0] - dz, q[1] + dx];
        M.hex8([[A[0], y, A[1]], [B[0], y, B[1]], [C[0], y, C[1]], [D[0], y, D[1]], [A[0], y1, A[1]], [B[0], y1, B[1]], [C[0], y1, C[1]], [D[0], y1, D[1]]], m);
      };
      for (const sy of [-1, 1]) {
        const SW = 1.17, e = sy * HW, o = (t) => sy * (HW + t), lo = (t) => Math.min(e, o(t)), hi = (t) => Math.max(e, o(t)), eS = sy * SW, oS = (t) => sy * (SW + t), loS = (t) => Math.min(eS, oS(t)), hiS = (t) => Math.max(eS, oS(t));   // front part: hull wall at HW, sponson wall (behind X=.87) at SW
        M.box(1.23, 1.55, lo(.03), hi(.03), 1.29, 1.47, hull);                               // raised frame of the front vision cover
        M.box(1.255, 1.525, lo(.036), hi(.036), 1.31, 1.45, dark);
        bar(Math.min(o(.036), o(.046)), Math.max(o(.036), o(.046)), [1.255, 1.31], [1.525, 1.45], .022, hull);
        bar(Math.min(o(.036), o(.046)), Math.max(o(.036), o(.046)), [1.255, 1.45], [1.525, 1.31], .022, hull);
        for (const [xx, zz] of [[1.30, 1.34], [1.48, 1.34], [1.30, 1.42], [1.48, 1.42]]) M.box(xx - .008, xx + .008, lo(.05), hi(.05), zz - .008, zz + .008, dark);
        M.box(.30, .83, loS(.014), hiS(.014), 1.44, 1.62, hull);                              // square inspection plate behind the front cover
        M.box(.315, .815, loS(.02), hiS(.02), 1.455, 1.605, dark);
        for (const zz of [1.29, 1.54]) { M.box(1.04 - .011, 1.04 + .011, lo(.012), hi(.012), zz - .011, zz + .011, dark); for (const xx of [.55, .12, -.39, -.74, -.92, -1.45, -1.95]) M.box(xx - .011, xx + .011, loS(.012), hiS(.012), zz - .011, zz + .011, dark); }   // rivets
        // rear engine-compartment air louvres: four framed cells with two slots each
        for (const [xa, xb] of [[-1.27, -1.07], [-1.64, -1.31], [-1.99, -1.67], [-2.37, -2.03]]) {
          M.box(xa, xb, loS(.012), hiS(.012), 1.265, 1.415, dark);
          M.box(xa + .012, xb - .012, loS(.02), hiS(.02), 1.335, 1.402, grille);
          M.box(xa + .012, xb - .012, loS(.02), hiS(.02), 1.277, 1.317, grille);
          for (let k = 1; k < 5; k++) { const zz = 1.335 + k * .0155; M.box(xa + .012, xb - .012, loS(.024), hiS(.024), zz - .003, zz + .003, hull); }
        }
        M.box(-1.03, -.98, loS(.016), hiS(.016), 1.265, 1.415, dark);
      }
      // ---- engine deck (ref. views): two louvre fields beside the turret-bin, access plates, round roof plates ----
      for (const [x0, x1, ya, yb] of [[-1.95, -1.35, -.92, -.41], [-2.02, -1.35, .55, .88]]) {
        M.box(x0, x1, ya, yb, 1.62, 1.68, dark);
        M.box(x0 + .02, x1 - .02, ya + .02, yb - .02, 1.68, 1.70, grille);
        const n = 4, bw = (x1 - x0 - .08) / n;
        for (let k = 0; k < n; k++) { const xx = x0 + .04 + k * bw; M.box(xx + bw * .22, xx + bw * .22 + .03, ya + .02, yb - .02, 1.70, 1.725, hull); M.box(xx + bw * .62, xx + bw * .62 + .03, ya + .02, yb - .02, 1.70, 1.725, hull); }
      }
      M.box(-2.33, -1.99, -.92, -.41, 1.60, 1.645, dark); M.box(-2.31, -2.01, -.90, -.43, 1.645, 1.66, hull);       // right access plate
      M.box(-2.34, -1.77, -.32, -.02, 1.60, 1.640, dark); M.box(-2.32, -1.79, -.30, -.04, 1.640, 1.655, hull);      // centre access plate + handle
      M.box(-2.12, -2.00, -.20, -.14, 1.655, 1.668, dark);
      pnOct(M, -1.87, .16, .10, .12, .03, 1.62, 1.665, dark); pnOct(M, -1.87, .16, .08, .10, .025, 1.665, 1.68, hull);   // small raised hatch
      for (const yy of [-.82, .81]) { L('z', [-1.20, yy, RZ + .002], [[0, 0], [0, .075], [.012, .075], [.012, 0]], 14, dark); }   // round bolted plates (antenna socket on the right)
      M.box(-2.40, -2.30, -.88, .88, 1.575, 1.62, dark);
      // ---- rear: plate, muffler, tail pipe, tow hooks, idler cranks ----
      M.box(-2.50, -2.46, -.90, .90, .62, 1.28, dark);
      for (const yy of [-.55, .55]) { M.box(-2.50, -2.46, yy - .2, yy + .2, .70, 1.05, hull); }
      for (const yy of [-.30, .30]) L('x', [-2.50, yy, .66], [[0, 0], [0, .04], [-.08, .04], [-.08, 0]], 8, dark);
      for (const yy of [-.70, .70]) { M.box(-2.60, -2.46, yy - .04, yy + .04, .66, .74, dark); L('x', [-2.60, yy, .70], [[0, 0], [0, .05], [-.06, .05], [-.06, 0]], 10, dark); }
      L('y', [-2.57, -.90, 1.04], [[0, 0], [0, .12], [.03, .14], [.10, .14], [1.10, .14], [1.17, .14], [1.20, .12], [1.20, 0]], 22, dark);   // muffler
      for (const yy of [-.60, -.10, .22]) M.box(-2.60, -2.56, yy - .02, yy + .02, .90, 1.20, dark);
      L('x', [-2.57, -.14, 1.20], [[0, 0], [0, .05], [-.08, .05], [-.16, .08], [-.20, .08], [-.20, 0]], 14, dark);        // tail pipe
      for (const sy of [-1, 1]) {
        M.box(-2.52, -2.40, sy * 1.0 - .06, sy * 1.0 + .06, .50, .85, dark);              // idler crank arm blocks
      }
      M.grp = 1;   // v182: turret group (hull-mounted antennas switch back below)
      // ---- turret (axis offset .067 to the left): ONE sloped hexagonal frustum (front, flanks and sides all lean inwards), bolted front plate + mantlet, gun, cupola, rear stowage bin ----
      const TB = [[.80, .80], [-.15, 1.025], [-.93, .90], [-1.15, .58]], TR = [[.66, .66], [-.15, .72], [-.93, .603], [-1.15, .57]];     // half plan (front corner -> rear), base at RZ / roof edge
      const zpts = [[.66, 2.24], [-.15, 2.36], [-.45, 2.372], [-.90, 2.335], [-1.76, 2.25], [-2.0, 2.235]];
      const zf = x => { if (x >= zpts[0][0]) return zpts[0][1]; for (let i = 0; i + 1 < zpts.length; i++) if (x >= zpts[i + 1][0]) { const t = (x - zpts[i][0]) / (zpts[i + 1][0] - zpts[i][0]); return zpts[i][1] + (zpts[i + 1][1] - zpts[i][1]) * t; } return zpts[zpts.length - 1][1]; };
      const tp = a => a.map(([x, y]) => [x, y + TY]);
      const full = h => h.map(([x, y]) => [x, -y]).concat(h.slice().reverse());
      L('z', [-.10, TY, RZ - .01], [[0, 0], [0, .86], [.04, .86], [.04, .80], [.10, .80], [.10, 0]], 30, dark);                  // turret ring / shot trap
      loftZ(M, tp(full(TB)), tp(full(TR)), RZ, (x, y) => zf(x), hull);
      // face helpers: point on half-plan face i at (s along, f up) ; plates / bars lying on it
      const fpt = (i, s, f) => {
        const b0 = TB[i], b1 = TB[i + 1], r0 = TR[i], r1 = TR[i + 1];
        const bx = b0[0] + (b1[0] - b0[0]) * s, by = b0[1] + (b1[1] - b0[1]) * s, rx = r0[0] + (r1[0] - r0[0]) * s, ry = r0[1] + (r1[1] - r0[1]) * s, zr = zf(r0[0]) + (zf(r1[0]) - zf(r0[0])) * s;
        return [bx + (rx - bx) * f, by + (ry - by) * f, RZ + (zr - RZ) * f];
      };
      const plateQ = (i, q, th, sy, m) => {                                               // q: four (s,f) corners in order
        const P = q.map(([s, f]) => fpt(i, s, f)), u = [P[1][0] - P[0][0], P[1][1] - P[0][1], P[1][2] - P[0][2]], v = [P[3][0] - P[0][0], P[3][1] - P[0][1], P[3][2] - P[0][2]];
        let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; const l = Math.hypot(n[0], n[1], n[2]) || 1; n = n.map(t => t / l); if (n[1] < 0) n = n.map(t => -t);
        const W = (p, k) => [p[0] + n[0] * th * k, sy * (p[1] + n[1] * th * k) + TY, p[2] + n[2] * th * k];
        M.hex8([...P.map(p => W(p, -.4)), ...P.map(p => W(p, 1))], m);
      };
      const plate = (i, s0, s1, f0, f1, th, sy, m) => plateQ(i, [[s0, f0], [s1, f0], [s1, f1], [s0, f1]], th, sy, m);
      const fbar = (i, sa, fa, sb, fb, w, Ls, Hf, th, sy, m) => {                          // thin diagonal bar in face space (Ls, Hf = face width / height in metres)
        let dx = (sb - sa) * Ls, dz = (fb - fa) * Hf; const l = Math.hypot(dx, dz); const px = -dz / l * w / 2 / Ls, pz = dx / l * w / 2 / Hf;
        plateQ(i, [[sa - px, fa - pz], [sa + px, fa + pz], [sb + px, fb + pz], [sb - px, fb - pz]], th, sy, m);
      };
      for (const sy of [-1, 1]) {
        // --- front flank (face 0): X-braced vision-flap cover, oval ventilator visor on the roof edge
        plate(0, .50, .90, .36, .66, .020, sy, hull); plate(0, .53, .87, .39, .63, .026, sy, dark); plate(0, .62, .78, .495, .525, .034, sy, dark);
        fbar(0, .53, .39, .87, .63, .016, .98, .65, .034, sy, hull); fbar(0, .53, .63, .87, .39, .016, .98, .65, .034, sy, hull);
        // --- side wall (face 1): door with two vision flaps, hinge rows, roof-edge cover strip
        plate(1, .115, .87, .13, .76, .016, sy, hull);
        plate(1, .455, .465, .13, .76, .022, sy, dark);
        plate(1, .17, .41, .36, .59, .024, sy, dark); plate(1, .18, .40, .375, .575, .030, sy, hull); plate(1, .22, .36, .445, .475, .036, sy, dark);
        plate(1, .58, .71, .40, .57, .024, sy, dark); plate(1, .595, .695, .415, .555, .030, sy, hull);
        plate(1, .04, .10, .15, .70, .022, sy, dark); plate(1, .88, .95, .15, .70, .022, sy, dark);
        plate(1, .06, .88, .865, .965, .030, sy, hull); plate(1, .06, .88, .865, .885, .036, sy, dark);
        for (const [ss, ff] of [[.13, .21], [.80, .21], [.13, .68], [.80, .68]]) plate(1, ss - .012, ss + .012, ff - .02, ff + .02, .030, sy, dark);
        // --- rear flank (face 2): small oval cover
        plate(2, .25, .55, .42, .60, .020, sy, dark);
        pnOct(M, .17, TY + sy * .70, .15, .04, .025, 2.295, 2.355, hull);                // oval vision visor on the roof edge
      }
      // front face (leans back): bolted front plate, mantlet surround, vision-flap octagons on the facets
      const fX = z => .80 - .14 * (z - RZ) / (2.24 - RZ);
      const fplate = (y0, y1, z0, z1, th, m) => M.hex8([[fX(z0) - .004, y0 + TY, z0], [fX(z0) - .004, y1 + TY, z0], [fX(z1) - .004, y1 + TY, z1], [fX(z1) - .004, y0 + TY, z1],
                                                       [fX(z0) + th, y0 + TY, z0], [fX(z0) + th, y1 + TY, z0], [fX(z1) + th, y1 + TY, z1], [fX(z1) + th, y0 + TY, z1]], m);
      fplate(-.38, .38, 1.78, 2.22, .030, dark); fplate(-.365, .365, 1.795, 2.205, .042, hull);
      for (const sy of [-1, 1]) {
        const ya = sy > 0 ? .47 : -.63, yb = sy > 0 ? .63 : -.47;
        fplate(ya, yb, 1.94, 2.17, .020, dark); fplate(ya + .015, yb - .015, 1.955, 2.155, .028, hull); fplate(ya + .04, yb - .04, 2.00, 2.11, .034, dark);
        fplate(sy * .405 - .012, sy * .405 + .012, 1.80, 2.22, .036, dark);               // chamfer posts beside the front plate
      }
      // roof plate edge lip over the front
      fplate(-.66, .66, 2.215, 2.255, .030, dark);
      if (!opt.cmd) {
      // mantlet block, cylindrical recoil guard, barrel
      M.box(.74, 1.34, TY - .20, TY + .20, 1.865, 2.15, hull);
      M.box(.76, 1.30, TY - .18, TY + .18, 2.15, 2.18, dark);
      L('x', [.83, TY, 2.06], [[0, 0], [0, .135], [.45, .135], [.47, .115], [.47, 0]], 22, hull);
      L('x', [1.28, TY, 2.06], [[0, 0], [0, .105], [.54, .105], [.56, .08], [.56, 0]], 20, gun);
      L('x', [1.84, TY, 2.06], [[0, 0], [0, .065], [1.28, .065], [1.28, 0]], 16, gun);
      L('x', [1.70, TY, 2.06], [[0, 0], [0, .108], [.04, .108], [.04, 0]], 18, dark);
      L('x', [3.02, TY, 2.06], [[0, 0], [0, .065], [.10, .075], [.19, .075], [.19, 0]], 14, gun);                // brake neck
      {                                                                                                  // muzzle brake: two octagonal baffle chambers joined by a bridge
        M.prismXY([[3.38, -.11], [3.34, -.135], [3.25, -.135], [3.20, -.09], [3.20, .09], [3.25, .135], [3.34, .135], [3.38, .11]].map(([x, y]) => [x, y + TY]), 1.95, 2.17, gun);
        M.prismXY([[3.44, -.11], [3.48, -.135], [3.57, -.135], [3.62, -.09], [3.62, .09], [3.57, .135], [3.48, .135], [3.44, .11]].map(([x, y]) => [x, y + TY]), 1.95, 2.17, gun);
        M.box(3.36, 3.46, TY - .10, TY + .10, 1.975, 2.145, gun);
        for (const sy of [-1, 1]) for (const [xa, xb] of [[3.23, 3.34], [3.48, 3.59]]) M.box(xa, xb, sy > 0 ? TY + .1355 : TY - .1385, sy > 0 ? TY + .1385 : TY - .1355, 1.99, 2.13, dark);
        M.box(3.605, 3.625, TY - .07, TY + .07, 1.99, 2.13, dark);
        M.box(3.20, 3.215, TY - .07, TY + .07, 1.99, 2.13, dark); }
      // mantlet front: bolted frame, coax MG (right), gunner's sight (left)
      for (const [dy, dz] of [[-.19, .08], [.19, .08], [-.19, -.08], [.19, -.08]]) L('x', [1.34, TY + dy, 2.06 + dz], [[0, 0], [0, .014], [.012, .014], [.012, 0]], 6, dark);
      L('x', [1.34, TY - .30 + .10, 2.06 + .005], [[0, 0], [0, .03], [.04, .03], [.04, 0]], 10, dark);
      L('x', [1.34, TY - .205, 2.06], [[0, 0], [0, .042], [.02, .042], [.02, .018], [.18, .018], [.18, 0]], 10, gun);
      } else {
        // F1 drawing: external box mantlet X .74 … 1.02, recoil sleeve to 1.60, L/24 barrel to the muzzle at X 2.03 (axis Z 2.06)
        M.box(.74, 1.02, TY - .24, TY + .24, 1.86, 2.20, hull); M.box(.76, 1.00, TY - .22, TY + .22, 2.20, 2.22, dark);
        L('x', [1.02, TY, 2.06], [[0, 0], [0, .105], [.58, .100], [.58, .072], [.60, .072], [.60, 0]], 20, gun);
        L('x', [1.60, TY, 2.06], [[0, 0], [0, .065], [.38, .062], [.38, .075], [.43, .075], [.43, 0]], 18, gun); v120Bore(M, { black: dark }, 2.03, TY, 2.06, .075);
        for (const [dy, dz] of [[-.19, .10], [.19, .10], [-.19, -.10], [.19, -.10]]) L('x', [1.02, TY + dy, 2.06 + dz], [[0, 0], [0, .014], [.012, .014], [.012, 0]], 6, dark);
        L('x', [1.02, TY - .17, 2.02], [[0, 0], [0, .04], [.03, .04], [.03, .018], [.16, .018], [.16, 0]], 10, gun);        // coax MG
        L('x', [1.02, TY + .15, 2.10], [[0, 0], [0, .03], [.02, .03], [.02, 0]], 10, dark);                                  // sight aperture
        // command antennas: star antenna on the rear deck (left), rod mast base front right (the rod itself is drawn live)
        M.grp = 0; v5Rod(M, [-2.10, .62, 1.67], [-2.10, .62, 2.55], .016, dark, 5);
        for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; v5Rod(M, [-2.10, .62, 2.55], [-2.10 + .16 * Math.cos(a), .62 + .16 * Math.sin(a), 2.70], .006, dark, 3); }
        L('z', [-2.10, .62, 1.67], [[0, 0], [0, .06], [.08, .06], [.08, 0]], 10, dark); L('z', [.62, -.70, 1.67], [[0, 0], [0, .05], [.10, .05], [.10, 0]], 10, dark); M.grp = 1;
      }
      // roof: loader's hatch (right front), commander's cupola, round roof plate, rear stowage bin
      { const hz = zf(.17);
        L('z', [.17, TY - .265, hz - .01], [[0, 0], [0, .15], [.03, .15], [.03, .125], [.05, .125], [.05, 0]], 18, hull);
        M.box(.04, .09, TY - .265 - .018, TY - .265 + .018, hz + .04, hz + .06, dark);
        for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + .3; L('z', [.17 + .135 * Math.cos(a), TY - .265 + .135 * Math.sin(a), hz - .01], [[0, 0], [0, .014], [.012, .014], [.012, 0]], 5, dark); } }
      L('z', [-.33, TY + .415, zf(-.33) - .01], [[0, 0], [0, .125], [.015, .125], [.035, .105], [.055, .085], [.055, 0]], 18, hull);
      { const cx = -.68, cz = zf(-.68);                                                                      // cupola: base ring, body, hood, hatch
        L('z', [cx, TY, cz - .01], [[0, 0], [0, .41], [.04, .41], [.04, .38], [.13, .38], [.13, .365], [.22, .365], [.22, .345], [.245, .345], [.245, .335], [.26, .335], [.26, 0]], 30, hull);
        for (let k = 0; k < 5; k++) { const a = Math.PI * (.62 + k * .19); M.rectZ(cx + .372 * Math.cos(a), TY + .372 * Math.sin(a), a, .035, .08, cz + .10, cz + .19, glass); }
        L('z', [cx, TY, cz + .25], [[0, 0], [0, .285], [.015, .285], [.015, .255], [.03, .255], [.03, 0]], 26, dark);
        M.rectZ(cx, TY, 0, .56, .022, cz + .28, cz + .29, dark);
        for (const yy of [-.30, .30]) M.box(cx - .05, cx + .05, TY + yy - .03, TY + yy + .03, cz + .28, cz + .31, dark);
        L('z', [cx + .12, TY, cz + .28], [[0, 0], [0, .06], [.016, .06], [.016, 0]], 10, hull); }
      { const bin = [[-1.15, -.57], [-1.50, -.545], [-1.67, -.41], [-1.76, -.21], [-1.78, 0], [-1.76, .21], [-1.67, .41], [-1.50, .545], [-1.15, .57]];
        loftZ(M, tp(bin), tp(bin), 1.76, (x, y) => zf(x), hull);
        M.box(-1.62, -1.20, TY - .40, TY + .40, 1.64, 1.765, dark);                                        // bin ledge
        for (const yy of [-.30, 0, .30]) M.box(-1.795, -1.765, TY + yy - .04, TY + yy + .04, 1.90, 2.10, dark);
        for (const sy of [-1, 1]) { M.box(-1.46, -1.17, TY + sy * .572 - .006 - (sy > 0 ? 0 : .0), TY + sy * .572 + .006, 2.10, 2.17, dark); M.box(-1.20, -1.00, TY + sy * .58 - .006, TY + sy * .58 + .006, 2.10, 2.17, dark); }
        for (const yy of [-.42, .42]) L('x', [-1.70, TY + yy, 2.12], [[0, 0], [0, .05], [-.03, .05], [-.03, 0]], 8, dark); }
      M.grp = 0;
      // ---- widened superstructure (sponson): behind X=.87 the upper hull flares out over the tracks to |Y| 1.17 (front corners cut diagonally), flat roof, vertical outer walls ----
      { const SW = 1.17, A = [[1.70, -HW], [.87, -SW], [-1.2, -SW], [-2.2, -SW], [-2.44, -SW], [-2.44, SW], [-2.2, SW], [-1.2, SW], [.87, SW], [1.70, HW]];
        const rz = x => x > -1.2 ? 1.668 : x > -2.2 ? 1.668 - (-1.2 - x) * .046 : 1.622 - (-2.2 - x) * .07;
        loftZ(M, A, A, FZ - .02, (x, y) => rz(x), hull);
        M.box(-2.44, -2.40, -SW, SW, 1.30, 1.58, dark);                                                    // rear edge strip
        // lower hull side filler: closes the gap between the hull tub and the track
        for (const sy of [-1, 1]) M.box(-2.30, 2.20, sy > 0 ? HW - .01 : -1.045, sy > 0 ? 1.045 : -HW + .01, .50, FZ, hull);
      }
      // antenna base on the right rear corner of the shelf
      L('z', [-1.20, -.82, RZ + .002], [[0, 0], [0, .04], [.025, .04], [.025, .026], [.055, .026], [.055, 0]], 10, dark);

      // ---- tracks & running gear ----
      const C1 = [2.39, .777], R1 = .41, C2 = [-2.40, .573], R2 = .40, pts = [];
      const arc = (c, r, a0, a1, n) => { for (let k = 0; k <= n; k++) { const a = a0 + (a1 - a0) * k / n; pts.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]); } };
      arc(C1, R1, Math.PI / 2, -1.85, 16);                      // sprocket: over the top and the nose
      pts.push([2.02, .02], [-2.05, .02]);                      // down to the ground, flat run
      arc(C2, R2, -Math.PI * .44, -Math.PI * 1.5, 12);          // idler: up around the rear
      pts.push([-2.00, 1.04], [-1.55, 1.10], [1.80, 1.12]);    // top run (well below the fender plate)
      const n = pts.length, cen = [0, .62], thick = .085, outer = pts, inner = pts.map((p, i) => {
        const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n]; let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
        let nx = -tz, nz = tx; if (nx * (cen[0] - p[0]) + nz * (cen[1] - p[1]) < 0) { nx = -nx; nz = -nz; } return [p[0] + nx * thick, p[1] + nz * thick];
      });
      const WX = [1.85, 1.355, .859, .352, -.164, -.670, -1.177, -1.677], WZ = .31, RZs = [.95, .95, .95, .90], RX = [1.43, .52, -.50, -1.53];
      for (const sy of [-1, 1]) {
        const ya = sy > 0 ? 1.04 : -1.44, yb = sy > 0 ? 1.44 : -1.04, f = sy > 0 ? 1 : -1;
        M.belt(outer, inner, ya, yb, trk);
        for (let i = 0; i < n; i++) {                           // link plates + guide horns along the outer surface (pitch 0.12)
          const a = outer[i], b = outer[(i + 1) % n], seg = Math.hypot(b[0] - a[0], b[1] - a[1]); if (seg < 1e-6) continue;
          let nx = (b[1] - a[1]) / seg, nz = -(b[0] - a[0]) / seg; if (nx * ((a[0] + b[0]) / 2 - cen[0]) + nz * ((a[1] + b[1]) / 2 - cen[1]) < 0) { nx = -nx; nz = -nz; }
          const cnt = Math.max(1, Math.round(seg / .12)), h = .03;
          for (let q = 0; q < cnt; q++) {
            const t0 = (q + .12) / cnt, t1 = (q + .62) / cnt, p0 = [a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0], p1 = [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1];
            M.hex8([[p0[0], ya, p0[1]], [p1[0], ya, p1[1]], [p1[0], yb, p1[1]], [p0[0], yb, p0[1]], [p0[0] + nx * h, ya, p0[1] + nz * h], [p1[0] + nx * h, ya, p1[1] + nz * h], [p1[0] + nx * h, yb, p1[1] + nz * h], [p0[0] + nx * h, yb, p0[1] + nz * h]], trkR);
            const tm = (t0 + t1) / 2 - .08 / cnt, pm = [a[0] + (b[0] - a[0]) * tm, a[1] + (b[1] - a[1]) * tm], yc2 = (ya + yb) / 2, hh = .055;       // central guide horn
            M.hex8([[pm[0] - .014 * (b[0] - a[0]) / seg, yc2 - .022, pm[1] - .014 * (b[1] - a[1]) / seg], [pm[0] + .014 * (b[0] - a[0]) / seg, yc2 - .022, pm[1] + .014 * (b[1] - a[1]) / seg],
                    [pm[0] + .014 * (b[0] - a[0]) / seg, yc2 + .022, pm[1] + .014 * (b[1] - a[1]) / seg], [pm[0] - .014 * (b[0] - a[0]) / seg, yc2 + .022, pm[1] - .014 * (b[1] - a[1]) / seg],
                    [pm[0] - .014 * (b[0] - a[0]) / seg + nx * hh, yc2 - .022, pm[1] - .014 * (b[1] - a[1]) / seg + nz * hh], [pm[0] + .014 * (b[0] - a[0]) / seg + nx * hh, yc2 - .022, pm[1] + .014 * (b[1] - a[1]) / seg + nz * hh],
                    [pm[0] + .014 * (b[0] - a[0]) / seg + nx * hh, yc2 + .022, pm[1] + .014 * (b[1] - a[1]) / seg + nz * hh], [pm[0] - .014 * (b[0] - a[0]) / seg + nx * hh, yc2 + .022, pm[1] - .014 * (b[1] - a[1]) / seg + nz * hh]], trk);
          }
        }
        // eight double road wheels
        for (let k = 0; k < 8; k++) p4Wheel(M, WX[k], sy * 1.24, WZ, f, wheel, tyre, dark, L);
        // bogie brackets (leaf-spring frames above each pair) + spring housings between the wheels
        for (let k = 0; k < 8; k += 2) {
          const xc = (WX[k] + WX[k + 1]) / 2;
          M.box(xc - .16, xc + .16, sy > 0 ? 1.04 : -1.14, sy > 0 ? 1.14 : -1.04, .56, .74, dark);
          M.box(xc - .13, xc + .13, sy * 1.15 - .015, sy * 1.15 + .015, .58, .72, wheel);
          for (const sx of [-.11, .11]) L('y', [xc + sx, sy * 1.14, .66], [[0, 0], [0, .03], [.012 * sy, .03], [.012 * sy, 0]], 6, dark);
          L('x', [xc - .25, sy * 1.13, .44], [[0, 0], [0, .06], [.50, .06], [.50, 0]], 10, dark);
          M.box(xc - .25, xc + .25, sy > 0 ? 1.05 : -1.17, sy > 0 ? 1.17 : -1.05, .40, .47, dark);
        }
        // four return rollers + two support stubs
        for (let k = 0; k < 4; k++) {
          const z = RZs[k], x = RX[k];
          L('y', [x, sy * 1.04, z], [[0, 0], [0, .06], [.20 * sy, .06], [.20 * sy, .045]], 10, dark);
          L('y', [x, sy * 1.14, z], [[-.05 * f, 0], [-.05 * f, .105, tyre], [.05 * f, .105, tyre], [.05 * f, .08, wheel], [.07 * f, .075, wheel], [.07 * f, 0, wheel]], 18, tyre);
          L('y', [x, sy * 1.14 + .06 * f, z], [[0, 0], [0, .04], [.02 * f, .04], [.02 * f, 0]], 8, dark);
        }
        for (const x of [.22, -.75]) L('y', [x, sy * 1.0, .92], [[0, 0], [0, .09], [.07 * sy, .09], [.07 * sy, 0]], 14, dark);
        // drive sprocket (front): two discs, 8 spokes, rim, 20 teeth, hub
        const ys = sy * 1.24;
        L('y', [C1[0], ys, C1[1]], [[-.12 * f, 0], [-.12 * f, .31, wheel], [-.10 * f, .335, wheel], [-.06 * f, .335, wheel], [-.06 * f, .30, dark], [.06 * f, .30, dark], [.06 * f, .335, wheel], [.10 * f, .335, wheel], [.12 * f, .31, wheel], [.12 * f, .17, wheel], [.15 * f, .156, wheel], [.15 * f, 0, wheel]], 28, wheel);
        for (let k = 0; k < 8; k++) pnRadial(M, C1[0], C1[1], k * Math.PI / 4 + .2, .16, .31, .07, .04, ys + .105 * f - .012, ys + .105 * f + .012, dark);
        for (let k = 0; k < 20; k++) { const a = k * Math.PI / 10 + .05; pnRadial(M, C1[0], C1[1], a, .335, .43, .075, .05, ys - .11, ys + .11, wheel); }
        for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5 + .1; L('y', [C1[0] + .125 * Math.cos(a), ys + .152 * f, C1[1] + .125 * Math.sin(a)], [[0, 0], [0, .014], [.012 * f, .014], [.012 * f, 0]], 5, dark); }
        L('y', [C1[0], ys + .15 * f, C1[1]], [[0, 0], [0, .085], [.03 * f, .085], [.03 * f, .04], [.05 * f, .04], [.05 * f, 0]], 14, dark);
        // idler (rear): rim + 10 spokes + hub cap + tension-arm bracket
        L('y', [C2[0], ys, C2[1]], [[-.11 * f, 0], [-.11 * f, .295, wheel], [-.06 * f, .31, wheel], [.06 * f, .31, wheel], [.11 * f, .295, wheel], [.11 * f, .20, wheel], [.07 * f, .17, dark], [.07 * f, .09, dark], [.13 * f, .09, wheel], [.13 * f, 0, wheel]], 26, wheel);
        for (let k = 0; k < 10; k++) pnRadial(M, C2[0], C2[1], k * Math.PI / 5 + .1, .09, .295, .05, .03, ys + .09 * f - .01, ys + .09 * f + .01, dark);
        L('y', [C2[0], ys + .13 * f, C2[1]], [[0, 0], [0, .09], [.03 * f, .09], [.03 * f, .05], [.05 * f, .05], [.05 * f, 0]], 14, dark);
        for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; L('y', [C2[0] + .13 * Math.cos(a), ys + .125 * f, C2[1] + .13 * Math.sin(a)], [[0, 0], [0, .012], [.012 * f, .012], [.012 * f, 0]], 5, dark); }
        extrudeXZ(M, [[-2.05, .95], [-2.38, .66], [-2.44, .52], [-2.12, .56]], sy > 0 ? 1.00 : -1.07, sy > 0 ? 1.07 : -1.00, dark);                // idler crank arm
        extrudeXZ(M, [[2.34, .95], [2.60, .70], [2.50, .60], [2.24, .86]], sy > 0 ? 1.00 : -1.07, sy > 0 ? 1.07 : -1.00, dark);                    // final-drive housing
      }
      return M;
    }

    // ---------- shared helpers for the v93 wheeled / light vehicles ----------
    // station loft along X: st = [[x, poly], ...], poly = closed list of [y, z] (same count, convex, any winding)
    function v5Loft(M, st, m, capF = true, capR = true) {
      for (let s = 0; s + 1 < st.length; s++) {
        const [xa, A] = st[s], [xb, B] = st[s + 1], n = A.length;
        const cA = A.reduce((q, p) => [q[0] + p[0] / n, q[1] + p[1] / n], [0, 0]), cB = B.reduce((q, p) => [q[0] + p[0] / n, q[1] + p[1] / n], [0, 0]);
        const inside = [(xa + xb) / 2, (cA[0] + cB[0]) / 2, (cA[1] + cB[1]) / 2];
        for (let i = 0; i < n; i++) { const j = (i + 1) % n; M.quad([xa, A[i][0], A[i][1]], [xa, A[j][0], A[j][1]], [xb, B[j][0], B[j][1]], [xb, B[i][0], B[i][1]], m, inside); }
      }
      const cap = (x, P, sx) => { const n = P.length, c = P.reduce((q, p) => [q[0] + p[0] / n, q[1] + p[1] / n], [0, 0]), nn = [sx, 0, 0];
        for (let i = 0; i < n; i++) { const j = (i + 1) % n; M.tri([x, c[0], c[1]], [x, P[i][0], P[i][1]], [x, P[j][0], P[j][1]], nn, nn, nn, m); } };
      if (capF) cap(st[0][0], st[0][1], st[0][0] > st[st.length - 1][0] ? 1 : -1);
      if (capR) cap(st[st.length - 1][0], st[st.length - 1][1], st[0][0] > st[st.length - 1][0] ? -1 : 1);
    }
    // symmetric hexagonal hull section: bottom (zb, ±bb), waist (zw, ±w), top (zr, ±r)
    function v5Hex(zb, bb, zw, w, zr, r) { return [[-bb, zb], [-w, zw], [-r, zr], [r, zr], [w, zw], [bb, zb]]; }
    // flat-faced frustum (n sides, vertex at angle a0) between z0 (circum-radius rb) and z1 (rt); closed top
    function v5Frustum(M, cx, cy, z0, z1, n, rb, rt, a0, m, top = true) {
      const P = (r, z, k) => { const a = a0 + k * 2 * Math.PI / n; return [cx + r * Math.cos(a), cy + r * Math.sin(a), z]; }, inside = [cx, cy, (z0 + z1) / 2];
      for (let k = 0; k < n; k++) M.quad(P(rb, z0, k), P(rb, z0, k + 1), P(rt, z1, k + 1), P(rt, z1, k), m, inside);
      if (top) for (let k = 0; k < n; k++) M.tri([cx, cy, z1], P(rt, z1, k), P(rt, z1, k + 1), [0, 0, 1], [0, 0, 1], [0, 0, 1], m);
    }
    // loft between two plan polygons A (at z0) and B (at z1); optional top cap
    function v5LoftZ(M, A, B, z0, z1, m, cap = true) {
      const n = A.length, c = A.reduce((q, p) => [q[0] + p[0] / n, q[1] + p[1] / n], [0, 0]), inside = [c[0], c[1], (z0 + z1) / 2];
      for (let i = 0; i < n; i++) { const j = (i + 1) % n; M.quad([A[i][0], A[i][1], z0], [A[j][0], A[j][1], z0], [B[j][0], B[j][1], z1], [B[i][0], B[i][1], z1], m, inside); }
      if (cap) { const cb = B.reduce((q, p) => [q[0] + p[0] / n, q[1] + p[1] / n], [0, 0]); for (let i = 0; i < n; i++) { const j = (i + 1) % n; M.tri([cb[0], cb[1], z1], [B[i][0], B[i][1], z1], [B[j][0], B[j][1], z1], [0, 0, 1], [0, 0, 1], [0, 0, 1], m); } }
    }
    // thin plate lying on an arbitrary planar face: Q = 4 corner points (in order), raised by th away from `inside`
    function v5FacePlate(M, Q, th, inside, m) {
      const u = [Q[1][0] - Q[0][0], Q[1][1] - Q[0][1], Q[1][2] - Q[0][2]], v = [Q[3][0] - Q[0][0], Q[3][1] - Q[0][1], Q[3][2] - Q[0][2]];
      let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; const l = Math.hypot(n[0], n[1], n[2]) || 1; n = n.map(t => t / l);
      if (n[0] * (Q[0][0] - inside[0]) + n[1] * (Q[0][1] - inside[1]) + n[2] * (Q[0][2] - inside[2]) < 0) n = n.map(t => -t);
      const W = (p, k) => [p[0] + n[0] * th * k, p[1] + n[1] * th * k, p[2] + n[2] * th * k];
      M.hex8([...Q.map(p => W(p, -.3)), ...Q.map(p => W(p, 1))], m);
    }
    // station table [[x, [zb, bb, zw, w, zr, r]], ...] -> interpolated params at x ; point on a hull face ('lo' bottom->waist, 'up' waist->roof) at (x, z), side sy
    function v5StAt(T, x) {
      if (x >= T[0][0]) return T[0][1]; for (let i = 0; i + 1 < T.length; i++) if (x >= T[i + 1][0]) { const t = (x - T[i][0]) / (T[i + 1][0] - T[i][0]); return T[i][1].map((a, k) => a + (T[i + 1][1][k] - a) * t); }
      return T[T.length - 1][1];
    }
    function v5HullPt(T, face, x, z, sy) {
      const [zb, bb, zw, w, zr, r] = v5StAt(T, x);
      const y = face === 'lo' ? bb + (z - zb) / (zw - zb) * (w - bb) : w + (z - zw) / (zr - zw) * (r - w);
      return [x, sy * y, z];
    }
    function v5HullPlate(M, T, face, x0, x1, z0, z1, th, sy, m) {
      v5FacePlate(M, [v5HullPt(T, face, x0, z0, sy), v5HullPt(T, face, x1, z0, sy), v5HullPt(T, face, x1, z1, sy), v5HullPt(T, face, x0, z1, sy)], th, [(x0 + x1) / 2, 0, .95], m);
    }
    // pneumatic road tyre with lugs, steel disc wheel with hub and nuts (axis along Y; f = +1 outer face toward +Y)
    function v5Tyre(M, x, y, z, R, w, f, tyre, wheel, dark, lugs = 22) {
      const L = (ax, o, prof, seg, m) => M.lathe(ax, o, prof, seg, m), h = w / 2;
      L('y', [x, y, z], [[-h * f, 0], [-h * f, R * .60, wheel], [-h * f, R * .66, tyre], [-(h - .02) * f, R * .93, tyre], [-(h - .05) * f, R, tyre], [(h - .05) * f, R, tyre], [(h - .02) * f, R * .93, tyre], [h * f, R * .66, tyre],
        [h * f, R * .60, wheel], [(h - .03) * f, R * .56, wheel], [(h - .05) * f, R * .30, wheel], [(h - .02) * f, R * .22, wheel], [(h - .02) * f, 0, wheel]], 28, tyre);
      for (let k = 0; k < lugs; k++) { const a = k * 2 * Math.PI / lugs; pnRadial(M, x, z, a, R - .012, R + .018, .055, .05, y - (h - .04), y + (h - .04), tyre); }
      L('y', [x, y + (h - .02) * f, z], [[0, 0], [0, R * .20], [.025 * f, R * .17], [.045 * f, R * .10], [.045 * f, 0]], 14, dark);
      for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + .3; L('y', [x + R * .26 * Math.cos(a), y + (h - .02) * f, z + R * .26 * Math.sin(a)], [[0, 0], [0, .013], [.014 * f, .013], [.014 * f, 0]], 5, dark); }
    }

    // ---------- Sd.Kfz. 221 leichter Panzerspähwagen (MG) — from the supplied 4-view blueprint (side / top / front / rear) ----------
    // Blueprint 70.9 px/m; wheelbase 2.80 m, track ±.855, wheel R .42; faceted armour hull: lower plates lean in below a waist at ~1.27 m, upper plates lean in to a flat roof at 1.585,
    // wedge nose (point at X 2.06 / Z .6), hood + leaning driver's plate, sloping engine deck; open-topped 7-sided turret with wire-mesh grenade screens and one MG 34.
    // X forward, Y left, Z up; origin midway between the axles.
    function buildSdKfz221(paint, opt = {}) {   // v125: opt.pzb → Sd.Kfz. 221 mit 2.8 cm sPzB 41 (shielded AT gun on the open turret)
      const P = PAINT[paint] || PAINT.grey, M = new Mesh();
      const hull = M.mat(P.hull, { spec: .08 }), dark = M.mat(P.dark, { spec: .05 }), gun = M.mat(P.gun, { spec: .22, noise: .5 });
      const tyre = M.mat([30, 31, 33], { noise: .6 }), wheel = M.mat(P.wheel, { spec: .12 }), grille = M.mat([34, 36, 38], { shadow: false, noise: .5 }), glass = M.mat([200, 205, 190], { spec: .9, shadow: false, noise: 0 });
      const mesh = M.mat([60, 63, 66], { shadow: false, noise: 1.6 }), canvas = M.mat([118, 112, 92], { spec: .03, noise: 1.2 }), black = M.mat([22, 24, 26], { shadow: false, noise: 0 }), red = M.mat([120, 40, 34], { shadow: false });
      const L = (ax, o, prof, seg, m) => M.lathe(ax, o, prof, seg, m);

      // ---- armoured body: hexagonal stations (zb, bb, zw, w, zr, r) lofted along X ----
      const T = [
        [2.06, [.52, .30, .60, .37, .64, .34]],
        [1.75, [.32, .42, 1.00, .445, 1.07, .40]],
        [1.02, [.32, .52, 1.20, .61, 1.29, .48]],
        [.87, [.32, .54, 1.22, .66, 1.585, .52]],
        [.25, [.32, .58, 1.27, .80, 1.585, .56]],
        [-.82, [.32, .58, 1.27, .80, 1.585, .56]],
        [-1.33, [.34, .58, 1.27, .78, 1.585, .55]],
        [-2.20, [.42, .52, 1.12, .62, 1.22, .45]],
        [-2.37, [.60, .46, .66, .48, .70, .42]]];
      v5Loft(M, T.map(([x, p]) => [x, v5Hex(...p)]), hull);
      for (const sy of [-1, 1]) for (let s = 1; s + 2 < T.length; s++) {           // bolted waist seam
        const a = T[s], b = T[s + 1];
        M.hex8([[a[0], sy * (a[1][3] - .006), a[1][2] - .014], [b[0], sy * (b[1][3] - .006), b[1][2] - .014], [b[0], sy * (b[1][3] + .016), b[1][2] - .014], [a[0], sy * (a[1][3] + .016), a[1][2] - .014],
                [a[0], sy * (a[1][3] - .006), a[1][2] + .014], [b[0], sy * (b[1][3] - .006), b[1][2] + .014], [b[0], sy * (b[1][3] + .016), b[1][2] + .014], [a[0], sy * (a[1][3] + .016), a[1][2] + .014]], dark);
      }
      // ---- hood access hatch, driver's plate with two visor blocks ----
      const hz = x => 1.07 + (1.75 - x) * .3014;                                         // hood plate height
      M.hex8([[1.68, -.34, hz(1.68)], [1.10, -.34, hz(1.10)], [1.10, .34, hz(1.10)], [1.68, .34, hz(1.68)], [1.68, -.34, hz(1.68) + .02], [1.10, -.34, hz(1.10) + .02], [1.10, .34, hz(1.10) + .02], [1.68, .34, hz(1.68) + .02]], hull);
      M.hex8([[1.66, -.31, hz(1.66) + .02], [1.12, -.31, hz(1.12) + .02], [1.12, .31, hz(1.12) + .02], [1.66, .31, hz(1.66) + .02], [1.66, -.31, hz(1.66) + .03], [1.12, -.31, hz(1.12) + .03], [1.12, .31, hz(1.12) + .03], [1.66, .31, hz(1.66) + .03]], dark);
      for (const yy of [-.20, .20]) M.box(1.36, 1.44, yy - .03, yy + .03, hz(1.40) + .02, hz(1.40) + .06, dark);
      const fpx = z => 1.02 - (z - 1.29) / .295 * .15;                                   // driver's plate X at height z
      const onFP = (y0, y1, z0, z1, th, m) => M.hex8([[fpx(z0) - .004, y0, z0], [fpx(z0) - .004, y1, z0], [fpx(z1) - .004, y1, z1], [fpx(z1) - .004, y0, z1],
                                                      [fpx(z0) + th, y0, z0], [fpx(z0) + th, y1, z0], [fpx(z1) + th, y1, z1], [fpx(z1) + th, y0, z1]], m);
      for (const yc of [-.15, .15]) { onFP(yc - .15, yc + .15, 1.33, 1.48, .045, hull); onFP(yc - .11, yc + .11, 1.385, 1.425, .055, black); for (const dy of [-.12, .12]) onFP(yc + dy - .012, yc + dy + .012, 1.47, 1.495, .05, dark); }
      onFP(-.42, .42, 1.53, 1.56, .02, dark);
      // ---- vision flaps on the cheek / upper side plates, rear side stowage lids ----
      for (const sy of [-1, 1]) {
        v5HullPlate(M, T, 'up', .82, .50, 1.33, 1.53, .03, sy, dark); v5HullPlate(M, T, 'up', .78, .54, 1.40, 1.45, .045, sy, black);
        for (const xx of [.76, .56]) v5HullPlate(M, T, 'up', xx + .015, xx - .015, 1.50, 1.55, .05, sy, dark);
        v5HullPlate(M, T, 'up', -.20, -.60, 1.35, 1.47, .025, sy, dark); v5HullPlate(M, T, 'up', -.25, -.55, 1.395, 1.425, .04, sy, black);
        v5HullPlate(M, T, 'up', -1.48, -1.98, 1.20, 1.36, .035, sy, hull); v5HullPlate(M, T, 'up', -1.52, -1.94, 1.215, 1.345, .045, sy, dark);
        for (const xx of [-1.56, -1.90]) v5HullPlate(M, T, 'up', xx + .03, xx - .03, 1.34, 1.38, .06, sy, dark);
      }
      const RZ = 1.585, TZ = 1.81;
      M.grp = 1;   // v192: turret part (rotates on its own)
      // ---- turret: open-topped heptagonal frustum (vertex forward), measured plan at the roof (Z 1.585) and the rim (Z 1.81) ----
      const TB = [[.35, 0], [.02, .54], [-.47, .54], [-.79, .35], [-.79, -.35], [-.47, -.54], [.02, -.54]];
      const TT = [[.175, 0], [0, .39], [-.257, .39], [-.425, .25], [-.425, -.25], [-.257, -.39], [0, -.39]];
      const shrink = (A, d) => { const c = A.reduce((q, p) => [q[0] + p[0] / A.length, q[1] + p[1] / A.length], [0, 0]); return A.map(([x, y]) => { const dx = x - c[0], dy = y - c[1], l = Math.hypot(dx, dy) || 1; return [x - dx / l * d, y - dy / l * d]; }); };
      v5LoftZ(M, TB, TT, RZ, TZ, hull, false);
      v5LoftZ(M, shrink(TT, .035), shrink(TT, .045), TZ, TZ - .14, dark, false);           // inner wall band
      M.prismXY(shrink(TT, .045), TZ - .15, TZ - .14, black);                              // dark interior
      { const A = TT, B = shrink(TT, .035); for (let i = 0; i < 7; i++) { const j = (i + 1) % 7; M.quad([A[i][0], A[i][1], TZ], [A[j][0], A[j][1], TZ], [B[j][0], B[j][1], TZ], [B[i][0], B[i][1], TZ], hull, [-.12, 0, TZ - 1]); } }
      const tq = (i, s0, s1, f0, f1) => { const j = (i + 1) % 7, P = (s, f) => { const b = [TB[i][0] + (TB[j][0] - TB[i][0]) * s, TB[i][1] + (TB[j][1] - TB[i][1]) * s], t = [TT[i][0] + (TT[j][0] - TT[i][0]) * s, TT[i][1] + (TT[j][1] - TT[i][1]) * s];
        return [b[0] + (t[0] - b[0]) * f, b[1] + (t[1] - b[1]) * f, RZ + (TZ - RZ) * f]; }; return [P(s0, f0), P(s1, f0), P(s1, f1), P(s0, f1)]; };
      const tin = [-.20, 0, 1.70];
      for (const i of [1, 5]) { v5FacePlate(M, tq(i, .25, .75, .38, .70), .02, tin, dark); v5FacePlate(M, tq(i, .32, .68, .50, .58), .03, tin, black); }   // side vision flaps
      for (const i of [0, 6]) { v5FacePlate(M, tq(i, .45, .80, .40, .62), .02, tin, dark); v5FacePlate(M, tq(i, .52, .74, .48, .54), .03, tin, black); }   // front flank flaps
      for (const i of [2, 4]) v5FacePlate(M, tq(i, .30, .70, .40, .60), .02, tin, dark);
      // wire-mesh grenade screens: two hinged halves lying on the rim, framed, hinge bar across
      { const HX = -.12, fr = [[.175, 0], [0, .39], [HX, .39], [HX, -.39], [0, -.39]], rr = [[HX, .39], [-.257, .39], [-.425, .25], [-.425, -.25], [-.257, -.39], [HX, -.39]];
        if (!opt.pzb) M.prismXY(fr, TZ + .012, TZ + .022, mesh); M.prismXY(rr, TZ + .012, TZ + .022, mesh);
        const frame = (A) => { for (let i = 0; i < A.length; i++) { const a = A[i], b = A[(i + 1) % A.length], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); M.rectZ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, Math.atan2(dy, dx), l + .02, .022, TZ + .008, TZ + .03, dark); } };
        if (!opt.pzb) frame(fr); frame(rr);
        if (opt.pzb) {   // sPzB 41 version: front screen half swung up about its front edge, leaning back (drawing: (.25, 1.72) → (−.01, 2.20))
          const up = (x, y) => { const t = (.175 - x) / .295; return [.175 - t * .21, y, TZ + .02 + t * .38]; };
          const pts = fr.map(([x, y]) => up(x, y)); v5Slab(M, pts, [-.006, 0, .002], mesh);
          for (let i = 0; i < pts.length; i++) v5Rod(M, pts[i], pts[(i + 1) % pts.length], .01, dark, 4); }
        L('y', [HX, -.40, TZ + .02], [[0, 0], [0, .016], [.80, .016], [.80, 0]], 8, dark);
        if (!opt.pzb) for (const yy of [-.13, .13]) M.rectZ(-.03, yy, 0, .36, .012, TZ + .02, TZ + .028, dark);   // mesh stiffeners
        for (const yy of [-.13, .13]) M.rectZ(-.27, yy, 0, .30, .012, TZ + .02, TZ + .028, dark); }
      if (!opt.pzb) {   // v125: MG 42 through the front faces (square jacket with the oval slots, muzzle booster), small mount block
        const mz = 1.69, my = .03; M.box(.10, .24, -.07, .07, mz - .06, mz + .05, dark);
        M.box(.20, .64, my - .023, my + .023, mz - .03, mz + .016, gun);
        for (let k = 0; k < 6; k++) { const x = .27 + k * .06; for (const sy of [-1, 1]) M.box(x, x + .04, my + sy * .0235 - .002, my + sy * .0235 + .002, mz - .012, mz + .006, black); }
        L('x', [.64, my, mz - .007], [[0, 0], [0, .021], [.05, .021], [.07, .012], [.10, .011], [.10, 0]], 10, gun);
        M.box(-.10, .16, -.01, .07, mz - .04, mz + .04, gun); L('y', [-.02, .07, mz - .01], [[0, 0], [0, .05], [.05, .05], [.05, 0]], 12, dark);
      } else {          // v125: 2.8 cm sPzB 41 (drawing 69.6 px/m: axis Z 2.00, muzzle brake X 2.19 … 2.02, band at 1.17, thick rear barrel 1.11 … .40, mount .47 … −.04)
        const gz = 2.00;
        v5Rod(M, [.05, 0, 1.10], [.05, 0, 1.80], .05, dark, 8); L('z', [.05, 0, 1.80], [[0, 0], [0, .16], [.05, .16], [.05, 0]], 18, dark);   // pedestal + traverse plate
        M.box(-.08, .47, -.09, .09, gz - .10, gz + .08, gun);                                                     // upper carriage / breech housing
        L('x', [.40, 0, gz], [[0, 0], [0, .057], [.71, .052], [.73, .062], [.81, .062], [.82, .033], [1.62, .028], [1.62, 0]], 14, gun);   // tapered barrel to the brake
        L('x', [2.02, 0, gz], [[0, 0], [0, .05], [.02, .085], [.17, .085], [.17, 0]], 14, gun); v120Bore(M, { black }, 2.19, 0, gz, .028);
        for (const k of [0, 1, 2]) for (const sy of [-1, 1]) M.box(2.05 + k * .045, 2.08 + k * .045, sy * .084 - .004, sy * .084 + .004, gz - .04, gz + .04, black);   // brake slots
        // under the shield: cradle with the recoil / recuperator tube below the barrel (X 1.30 … .18, axis Z 1.86), front band, elevating bracket + handwheel
        L('x', [.18, 0, 1.86], [[0, 0], [0, .045], [1.12, .045], [1.12, 0]], 12, gun); M.box(1.10, 1.24, -.06, .06, 1.80, 2.07, dark);
        M.box(.18, .62, -.07, .07, 1.80, 1.94, dark); M.box(.55, .72, -.05, .05, 1.78, 1.86, dark);
        L('y', [.10, .12, 1.88], [[0, 0], [0, .07], [.015, .07], [.015, 0]], 12, dark); L('y', [-.02, -.12, 1.92], [[0, 0], [0, .06], [-.015, .06], [-.015, 0]], 12, dark);
        // shield: sloped plate leaning back from (.83, 1.72) to (.61, 2.20), ±.37 with clipped upper corners, two plates .06 apart, barrel slot; sight box on the left
        const sx = z => .83 - (z - 1.72) / .48 * .22;
        for (const d of [0, .06]) { v5Slab(M, [[sx(1.72) - d, -.37, 1.72], [sx(1.72) - d, .37, 1.72], [sx(2.10) - d, .37, 2.10], [sx(2.20) - d, .27, 2.20], [sx(2.20) - d, -.27, 2.20], [sx(2.10) - d, -.37, 2.10]], [-.012, 0, -.004], hull); }
        for (const [y, z] of [[-.25, 1.80], [.25, 1.80], [-.25, 2.12], [.25, 2.12]]) M.box(sx(z) + .002, sx(z) + .014, y - .014, y + .014, z - .014, z + .014, dark);
        M.box(sx(1.72) - .06, sx(1.72), -.30, .30, 1.70, 1.74, dark);
        M.box(.12, .30, .12, .20, gz + .04, gz + .14, dark); M.box(.295, .305, .13, .19, gz + .07, gz + .12, glass);
      }
      M.grp = 0;
      // ---- front mudguards (sloped top, outer lip, rear splash plate), headlights, width-indicator rods, bumper, towing hooks ----
      // front mudguard (blueprint): flat top at Z 1.05 from X 1.78 back to 1.00, sloped front plate down to (1.98, .83), rear splash plate, bracing strut
      const MZ = 1.05;
      for (const sy of [-1, 1]) {
        const ya = sy > 0 ? .40 : -1.00, yb = sy > 0 ? 1.00 : -.40, yl0 = sy > 0 ? .975 : -1.00, yl1 = sy > 0 ? 1.00 : -.975;
        M.box(1.00, 1.78, ya, yb, MZ - .03, MZ, hull);
        M.box(1.00, 1.78, yl0, yl1, MZ - .11, MZ, hull);                                                                                   // outer lip
        M.hex8([[1.78, ya, MZ], [1.98, ya, .83], [1.96, ya, .81], [1.76, ya, MZ - .03], [1.78, yb, MZ], [1.98, yb, .83], [1.96, yb, .81], [1.76, yb, MZ - .03]], hull);       // sloped front plate
        M.hex8([[1.02, ya, MZ - .03], [.99, ya, MZ - .03], [.92, ya, .68], [.95, ya, .68], [1.02, yb, MZ - .03], [.99, yb, MZ - .03], [.92, yb, .68], [.95, yb, .68]], hull);   // rear splash plate
        M.hex8([[1.74, sy * .90 - .015, MZ - .03], [1.76, sy * .90 - .015, MZ - .03], [1.90, sy * .90 - .015, .62], [1.88, sy * .90 - .015, .62],
                [1.74, sy * .90 + .015, MZ - .03], [1.76, sy * .90 + .015, MZ - .03], [1.90, sy * .90 + .015, .62], [1.88, sy * .90 + .015, .62]], dark);                  // strut to the axle
        M.box(1.46, 1.50, sy * .90 - .015, sy * .90 + .015, .86, MZ - .03, dark);
        L('x', [1.92, sy * .59, .86], [[0, 0], [0, .06], [.04, .085], [.11, .085], [.13, .07], [.13, 0]], 16, dark);                               // headlight
        L('x', [2.05, sy * .59, .86], [[0, 0], [0, .07], [.008, .068], [.008, 0]], 16, glass);
        M.box(1.96, 2.02, sy * .59 - .015, sy * .59 + .015, .66, .78, dark);
        L('z', [1.74, sy * .97, MZ], [[0, 0], [0, .008], [.40, .008], [.40, 0]], 6, dark);                                                  // width-indicator rod + ball
        L('z', [1.74, sy * .97, MZ + .40], [[0, 0], [0, .018], [.02, .025], [.04, .018], [.05, 0]], 8, red);
        M.box(1.85, 2.16, sy * .40 - .04, sy * .40 + .04, .52, .63, dark);              // chassis horn
        L('x', [2.16, sy * .40, .55], [[0, 0], [0, .045], [.07, .045], [.07, 0]], 10, dark);   // towing eye
        L('y', [2.23, sy * .40 - .03, .55], [[0, 0], [0, .035], [.06, .035], [.06, 0]], 10, dark);
        // rear mudguards + stowage boxes
        const ra = sy > 0 ? .70 : -1.00, rb = sy > 0 ? 1.00 : -.70;
        M.box(-1.78, -.82, ra, rb, 1.02, 1.05, hull);
        M.hex8([[-.82, ra, 1.05], [-.72, ra, .62], [-.75, ra, .62], [-.85, ra, 1.02], [-.82, rb, 1.05], [-.72, rb, .62], [-.75, rb, .62], [-.85, rb, 1.02]], hull);
        M.box(-1.78, -.82, sy > 0 ? .975 : -1.00, sy > 0 ? 1.00 : -.975, .94, 1.05, hull);
        M.box(-2.10, -1.76, sy > 0 ? .68 : -.98, sy > 0 ? .98 : -.68, .64, 1.02, hull);
        M.box(-2.11, -1.75, sy > 0 ? .98 : -.995, sy > 0 ? .995 : -.98, .66, 1.00, dark);
        M.box(-2.08, -1.78, sy > 0 ? .69 : -.97, sy > 0 ? .97 : -.69, 1.02, 1.035, dark);
      }
      L('y', [2.08, -.84, .64], [[0, 0], [0, .03], [1.68, .03], [1.68, 0]], 10, dark);     // front bumper bar
      for (const sy of [-1, 1]) M.box(2.04, 2.10, sy * .62 - .02, sy * .62 + .02, .58, .70, dark);
      // ---- left side (+Y): tool box, big stowage box, extinguisher, spade ; right side (-Y): canvas bag, jerrycan rack ----
      v5HullPlate(M, T, 'lo', .87, .35, .62, 1.05, .07, 1, hull); v5HullPlate(M, T, 'lo', .84, .38, .64, .70, .085, 1, dark);
      v5HullPlate(M, T, 'lo', .02, -.62, .58, 1.20, .07, 1, hull); v5HullPlate(M, T, 'lo', 0, -.60, 1.16, 1.20, .085, 1, dark);
      for (const xx of [-.08, -.30, -.52]) v5HullPlate(M, T, 'lo', xx + .015, xx - .015, .80, .98, .09, 1, dark);
      { const p = v5HullPt(T, 'lo', -.66, .95, 1); L('z', [-.66, p[1] + .06, .70], [[0, 0], [0, .045], [.48, .045], [.50, .03], [.56, .015], [.56, 0]], 12, red); }
      { const a = v5HullPt(T, 'lo', -.76, .62, 1), b = v5HullPt(T, 'lo', -1.02, 1.12, 1);
        M.hex8([[a[0] - .02, a[1] + .02, a[2]], [a[0] + .02, a[1] + .02, a[2]], [b[0] + .02, b[1] + .02, b[2]], [b[0] - .02, b[1] + .02, b[2]], [a[0] - .02, a[1] + .06, a[2]], [a[0] + .02, a[1] + .06, a[2]], [b[0] + .02, b[1] + .06, b[2]], [b[0] - .02, b[1] + .06, b[2]]], dark); }
      { const p = v5HullPt(T, 'lo', -.30, .98, -1); L('x', [-.68, p[1] - .14, .98], [[0, 0], [0, .12], [.06, .15], [.70, .15], [.76, .12], [.76, 0]], 16, canvas); }
      v5HullPlate(M, T, 'lo', .62, .30, .62, 1.10, .10, -1, dark);
      // ---- roof grille behind the turret, sloping engine deck with access hatch, rear plate grille, lights, exhaust ----
      M.box(-1.16, -.84, -.50, .50, RZ - .005, RZ + .01, dark); M.box(-1.14, -.86, -.48, .48, RZ + .01, RZ + .018, grille);
      for (let k = 0; k < 6; k++) { const xx = -1.12 + k * .052; M.box(xx, xx + .018, -.48, .48, RZ + .012, RZ + .024, dark); }
      const dz = x => 1.585 - (-1.33 - x) / .87 * .365;                                    // deck height on the slope
      const onDeck = (x0, x1, ya, yb, th, m) => M.hex8([[x0, ya, dz(x0) - .005], [x1, ya, dz(x1) - .005], [x1, yb, dz(x1) - .005], [x0, yb, dz(x0) - .005], [x0, ya, dz(x0) + th], [x1, ya, dz(x1) + th], [x1, yb, dz(x1) + th], [x0, yb, dz(x0) + th]], m);
      onDeck(-1.36, -2.14, -.42, .42, .015, dark); onDeck(-1.46, -2.06, -.38, .22, .035, hull);
      for (const yy of [-.30, .14]) onDeck(-1.62, -1.72, yy - .03, yy + .03, .06, dark);
      { const rx = z => -2.20 - (1.22 - z) / .54 * .17, onR = (y0, y1, z0, z1, th, m) => M.hex8([[rx(z0) + .004, y0, z0], [rx(z0) + .004, y1, z0], [rx(z1) + .004, y1, z1], [rx(z1) + .004, y0, z1], [rx(z0) - th, y0, z0], [rx(z0) - th, y1, z0], [rx(z1) - th, y1, z1], [rx(z1) - th, y0, z1]], m);
        onR(-.37, .37, .72, 1.19, .025, dark); onR(-.34, .34, .75, 1.16, .03, grille); for (let k = 0; k < 7; k++) { const zz = .79 + k * .053; onR(-.34, .34, zz, zz + .012, .035, dark); } }
      for (const sy of [-1, 1]) {
        L('z', [-2.00, sy * .80, 1.04], [[0, 0], [0, .02], [.42, .02], [.42, 0]], 8, dark);             // rear marker / light posts
        L('x', [-2.04, sy * .80, 1.40], [[0, 0], [0, .035], [-.05, .035], [-.05, 0]], 10, red);
        L('x', [-1.80, sy * .62, .50], [[0, 0], [0, .07], [-.52, .07], [-.52, 0]], 14, dark);           // exhaust muffler under the rear
      }
      M.box(-2.44, -2.34, -.10, .10, .48, .58, dark);                                       // towing pintle
      M.box(-2.40, -2.36, -.16, .16, .44, .56, black);                                      // licence plate
      // ---- wheels (4), axles, chassis rails ----
      for (const sx of [1.40, -1.40]) for (const sy of [-1, 1]) { v5Tyre(M, sx, sy * .855, .42, .42, .24, sy, tyre, wheel, dark); L('y', [sx, sy * .45, .42], [[0, 0], [0, .05], [sy * .30, .05], [sy * .30, 0]], 10, dark); }
      for (const sx of [1.40, -1.40]) M.box(sx - .07, sx + .07, -.50, .50, .37, .47, dark);
      for (const sy of [-1, 1]) M.box(-2.10, 2.00, sy * .40 - .04, sy * .40 + .04, .40, .52, dark);
      return M;
    }

    // ---------- shared helpers for the v93 tracked vehicles ----------
    // convex planar polygon extruded by vector d (a plate of any orientation)
    function v5Slab(M, pts, d, m) {
      const n = pts.length, c = pts.reduce((q, p) => [q[0] + p[0] / n, q[1] + p[1] / n, q[2] + p[2] / n], [0, 0, 0]), inside = [c[0] + d[0] / 2, c[1] + d[1] / 2, c[2] + d[2] / 2];
      const Q = pts.map(p => [p[0] + d[0], p[1] + d[1], p[2] + d[2]]), cq = [c[0] + d[0], c[1] + d[1], c[2] + d[2]];
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n; M.quad(pts[i], pts[j], Q[j], Q[i], m, inside);
        const fan = (A, cc) => { const u = [A[i][0] - cc[0], A[i][1] - cc[1], A[i][2] - cc[2]], v = [A[j][0] - cc[0], A[j][1] - cc[1], A[j][2] - cc[2]];
          let nn = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; const l = Math.hypot(...nn) || 1; nn = nn.map(t => t / l);
          if (nn[0] * (cc[0] - inside[0]) + nn[1] * (cc[1] - inside[1]) + nn[2] * (cc[2] - inside[2]) < 0) nn = nn.map(t => -t); M.tri(cc, A[i], A[j], nn, nn, nn, m); };
        fan(pts, c); fan(Q, cq);
      }
    }
    // track belt + link plates + guide horns from an outer XZ polyline (closed, convex-ish), Y band ya..yb
    function v5Track(M, pts, ya, yb, thick, pitch, trk, trkR, horns = true) {
      const n = pts.length, cen = pts.reduce((q, p) => [q[0] + p[0] / n, q[1] + p[1] / n], [0, 0]);
      const inner = pts.map((p, i) => { const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n]; let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
        let nx = -tz, nz = tx; if (nx * (cen[0] - p[0]) + nz * (cen[1] - p[1]) < 0) { nx = -nx; nz = -nz; } return [p[0] + nx * thick, p[1] + nz * thick]; });
      M.belt(pts, inner, ya, yb, trk);
      for (let i = 0; i < n; i++) {
        const a = pts[i], b = pts[(i + 1) % n], seg = Math.hypot(b[0] - a[0], b[1] - a[1]); if (seg < 1e-6) continue;
        let nx = (b[1] - a[1]) / seg, nz = -(b[0] - a[0]) / seg; if (nx * ((a[0] + b[0]) / 2 - cen[0]) + nz * ((a[1] + b[1]) / 2 - cen[1]) < 0) { nx = -nx; nz = -nz; }
        const cnt = Math.max(1, Math.round(seg / pitch)), h = .025, tx = (b[0] - a[0]) / seg, tz = (b[1] - a[1]) / seg;
        for (let q = 0; q < cnt; q++) {
          const t0 = (q + .15) / cnt, t1 = (q + .70) / cnt, p0 = [a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0], p1 = [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1];
          M.hex8([[p0[0], ya, p0[1]], [p1[0], ya, p1[1]], [p1[0], yb, p1[1]], [p0[0], yb, p0[1]], [p0[0] + nx * h, ya, p0[1] + nz * h], [p1[0] + nx * h, ya, p1[1] + nz * h], [p1[0] + nx * h, yb, p1[1] + nz * h], [p0[0] + nx * h, yb, p0[1] + nz * h]], trkR);
          if (!horns) continue;
          const tm = (t0 + t1) / 2, pm = [a[0] + (b[0] - a[0]) * tm, a[1] + (b[1] - a[1]) * tm], yc = (ya + yb) / 2, hh = -(thick + .045), w = .014;
          M.hex8([[pm[0] - tx * w, yc - .02, pm[1] - tz * w], [pm[0] + tx * w, yc - .02, pm[1] + tz * w], [pm[0] + tx * w, yc + .02, pm[1] + tz * w], [pm[0] - tx * w, yc + .02, pm[1] - tz * w],
                  [pm[0] - tx * w + nx * hh, yc - .02, pm[1] - tz * w + nz * hh], [pm[0] + tx * w + nx * hh, yc - .02, pm[1] + tz * w + nz * hh], [pm[0] + tx * w + nx * hh, yc + .02, pm[1] + tz * w + nz * hh], [pm[0] - tx * w + nx * hh, yc + .02, pm[1] - tz * w + nz * hh]], trk);
        }
      }
    }
    function v5Arc(out, c, r, a0, a1, k) { for (let i = 0; i <= k; i++) { const a = a0 + (a1 - a0) * i / k; out.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]); } return out; }
    // large rubber-tyred road wheel (axis along Y, f = +1 when the outer face points to +Y): tyre, dished disc, hub cap, bolt ring
    function v5RoadWheel(M, x, y, z, R, w, f, tyre, wheel, dark) {
      const L = (ax, o, prof, seg, m) => M.lathe(ax, o, prof, seg, m), h = w / 2;
      L('y', [x, y, z], [[-h * f, 0], [-h * f, R * .86, wheel], [-h * f, R * .88, tyre], [-(h - .015) * f, R, tyre], [(h - .015) * f, R, tyre], [h * f, R * .88, tyre], [h * f, R * .86, wheel],
        [(h - .02) * f, R * .80, wheel], [(h - .04) * f, R * .42, wheel], [(h - .01) * f, R * .36, wheel], [(h - .01) * f, 0, wheel]], 26, tyre);
      L('y', [x, y + (h - .01) * f, z], [[0, 0], [0, R * .26], [.03 * f, R * .22], [.05 * f, R * .12], [.05 * f, 0]], 14, dark);
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + .2; L('y', [x + R * .31 * Math.cos(a), y + (h - .01) * f, z + R * .31 * Math.sin(a)], [[0, 0], [0, .012], [.012 * f, .012], [.012 * f, 0]], 5, dark); }
    }

