    // ---------- Marder III Ausf. M (Sd.Kfz. 138) — from the supplied painting guide (side / top, 94.3 px/m) and line drawing (front / rear, 77 px/m) ----------
    // 38(t) chassis (front sprocket, 4 large road wheels on 2 leaf-spring bogies, rear idler), engine moved forward, open-topped rear fighting compartment:
    // riveted lower box over the fenders, inward-leaning side walls (±1.0 at Z 1.42 → ±.75 at the top), angled cheek plates and a leaning front shield carrying the 7.5 cm PaK 40/3.
    function buildMarder3M(paint) {
      const P = PAINT[paint] || PAINT.grey, M = new Mesh();
      const hull = M.mat(P.hull, { spec: .08 }), dark = M.mat(P.dark, { spec: .05 }), gun = M.mat(P.gun, { spec: .22, noise: .5 });
      const trk = M.mat([58, 54, 48], { spec: .06, noise: 1.4 }), trkR = M.mat([70, 64, 56], { shadow: false, noise: 1.4 }), tyre = M.mat([30, 31, 33], { noise: .6 }), wheel = M.mat(P.wheel, { spec: .12 });
      const grille = M.mat([34, 36, 38], { shadow: false, noise: .5 }), glass = M.mat([200, 205, 190], { spec: .9, shadow: false, noise: 0 }), wood = M.mat([112, 84, 56], { spec: .03, noise: 1.3 }), inner = M.mat([78, 81, 84], { spec: .03, noise: .8 });
      const L = (ax, o, prof, seg, m) => M.lathe(ax, o, prof, seg, m);
      const HW = .69, DZ = 1.40, FZ = 1.01;                                               // hull half-width, deck height, fender height

      // ---- hull: low front glacis, flat deck, vertical sides between the tracks ----
      extrudeXZ(M, [[2.05, .42], [2.22, .76], [2.22, 1.10], [1.47, DZ], [-2.32, DZ], [-2.32, .48], [-2.00, .42]], -HW, HW, hull);
      // fenders with down-turned front ends
      for (const sy of [-1, 1]) {
        const ya = sy > 0 ? HW : -1.04, yb = sy > 0 ? 1.04 : -HW;
        M.box(-.80, 2.30, ya, yb, FZ - .025, FZ, hull);
        M.hex8([[2.30, ya, FZ], [2.40, ya, FZ - .06], [2.40, ya, FZ - .09], [2.30, ya, FZ - .03], [2.30, yb, FZ], [2.40, yb, FZ - .06], [2.40, yb, FZ - .09], [2.30, yb, FZ - .03]], hull);
        M.box(-.80, 2.30, sy > 0 ? 1.02 : -1.04, sy > 0 ? 1.04 : -1.02, FZ - .06, FZ, dark);
      }
      // glacis: driver's hatch, vision slit, headlight ; deck: round access plate, engine plates, spare track links
      const gz = x => 1.10 + (2.22 - x) / .75 * .30;
      const onG = (x0, x1, y0, y1, th, m) => M.hex8([[x0, y0, gz(x0)], [x1, y0, gz(x1)], [x1, y1, gz(x1)], [x0, y1, gz(x0)], [x0, y0, gz(x0) + th], [x1, y0, gz(x1) + th], [x1, y1, gz(x1) + th], [x0, y1, gz(x0) + th]], m);
      onG(2.02, 1.70, -.34, .25, .025, hull); onG(1.99, 1.73, -.31, .22, .04, dark); onG(1.90, 1.82, -.05, .05, .055, hull);
      onG(2.18, 2.08, -.55, -.20, .03, dark); onG(2.17, 2.12, -.50, -.25, .045, glass);
      L('x', [2.16, .53, 1.16], [[0, 0], [0, .06], [.05, .07], [.10, .06], [.12, 0]], 14, dark); L('x', [2.28, .53, 1.16], [[0, 0], [0, .05], [.006, .05], [.006, 0]], 14, glass);
      L('z', [1.09, -.38, DZ], [[0, 0], [0, .27], [.02, .27], [.02, .24], [.035, .24], [.035, 0]], 26, hull);
      for (const yy of [-.20, .20]) M.box(1.05, 1.13, -.38 + yy - .02, -.38 + yy + .02, DZ + .035, DZ + .06, dark);
      for (const [x0, x1] of [[.80, .40], [.38, -.02]]) { M.box(x1, x0, -.58, .58, DZ, DZ + .018, hull); M.box(x1 + .02, x0 - .02, -.56, .56, DZ + .018, DZ + .024, dark); M.box(x1 + .15, x1 + .25, -.06, .06, DZ + .024, DZ + .05, dark); }
      for (let k = 0; k < 9; k++) { const xx = 2.06 - k * .125; M.box(xx - .055, xx + .055, .38, .68, DZ - .01 + (xx > 1.47 ? gz(xx) - DZ : 0), DZ + .035 + (xx > 1.47 ? gz(xx) - DZ : 0), trkR); }
      // ---- fender stowage: right slatted box + jack, left boxes, wooden box, air-intake mesh box; cleaning rods along the left deck edge ----
      M.box(1.52, 2.18, -1.00, -.72, FZ, FZ + .20, hull); for (let k = 0; k < 4; k++) M.box(1.56, 2.14, -1.005, -.995, FZ + .04 + k * .04, FZ + .055 + k * .04, dark);
      L('x', [1.18, -.88, FZ + .09], [[0, 0], [0, .08], [.28, .08], [.28, 0]], 12, dark);
      M.box(1.86, 2.18, .72, 1.00, FZ, FZ + .18, hull); M.box(1.52, 1.86, .74, .98, FZ, FZ + .20, wood);
      M.box(.70, 1.18, .82, 1.00, FZ, FZ + .26, dark); M.box(.72, 1.16, .995, 1.005, FZ + .03, FZ + .24, grille);
      for (const yy of [.66, .63]) L('x', [-.60, yy, DZ + .03], [[0, 0], [0, .018], [2.0, .018], [2.0, 0]], 6, wood);
      L('x', [-.40, -.66, DZ + .03], [[0, 0], [0, .02], [1.6, .02], [1.6, 0]], 6, wood);
      // engine air-intake louvres in the hull sides ahead of the fighting compartment
      for (const sy of [-1, 1]) { const y0 = sy > 0 ? HW : -HW - .02, y1 = sy > 0 ? HW + .02 : -HW;
        M.box(-.39, .33, y0, y1, 1.06, 1.24, dark); M.box(-.37, .31, sy > 0 ? HW + .005 : -HW - .025, sy > 0 ? HW + .025 : -HW - .005, 1.08, 1.22, grille);
        for (let k = 0; k < 4; k++) { const zz = 1.10 + k * .035; M.box(-.37, .31, sy > 0 ? HW + .01 : -HW - .04, sy > 0 ? HW + .04 : -HW - .01, zz, zz + .012, hull); } }
      // ---- fighting compartment: riveted lower box over the fenders, open casemate ----
      const BX0 = -.78, BX1 = -2.32, BZ = 1.42, WT = .028;
      M.box(BX1, BX0, -1.05, 1.05, FZ - .02, BZ, hull);
      M.box(BX1 + .03, BX0 - .03, -1.0, 1.0, BZ, BZ + .01, inner);                          // floor
      for (const sy of [-1, 1]) for (let k = 0; k < 13; k++) { const xx = BX0 - .06 - k * .12; for (const zz of [FZ + .05, BZ - .05]) M.box(xx - .01, xx + .01, sy * 1.05 - .01, sy * 1.05 + .01, zz - .01, zz + .01, dark); }
      const wy = z => 1.0 - (z - BZ) / (2.33 - BZ) * .25;                                   // side-wall half-width at height z
      const SWP = [[-.76, BZ], [-1.18, 2.33], [-2.00, 2.13], [-2.20, 1.95], [-2.31, BZ]];  // side-wall outline (X, Z)
      for (const sy of [-1, 1]) {
        const pts = SWP.map(([x, z]) => [x, sy * wy(z), z]), d = [0, -sy * WT, -WT * .27];
        v5Slab(M, pts, d, hull);
        v5Slab(M, SWP.map(([x, z]) => [x, sy * (wy(z) - WT - .002), z]), [0, -sy * .004, 0], inner);
        // cheek plate from the shield edge to the side wall's front edge
        v5Slab(M, [[-.33, sy * .61, 1.49], [-.76, sy * wy(BZ), BZ], [-1.18, sy * wy(2.33), 2.33], [-.55, sy * .36, 2.27]], [-WT * .5, -sy * WT * .8, 0], hull);
        // rivet rows on the walls, ammunition racks inside, vision slit on the cheek
        for (let k = 0; k < 9; k++) { const xx = -1.25 - k * .11, zz = 2.05; M.box(xx - .01, xx + .01, sy * (wy(zz) + .008) - .01, sy * (wy(zz) + .008) + .01, zz - .01, zz + .01, dark); }
        M.box(-1.95, -1.30, sy > 0 ? .62 : -.86, sy > 0 ? .86 : -.62, BZ, 1.80, dark);
        for (let k = 0; k < 5; k++) { const xx = -1.36 - k * .13; L('y', [xx, sy * .625, 1.70], [[0, 0], [0, .04], [sy * -.045, .04], [sy * -.045, 0]], 8, gun); }
      }
      // rear wall (leans in, top at 1.95), floor-level rear stowage
      v5Slab(M, [[-2.31, -wy(BZ), BZ], [-2.31, wy(BZ), BZ], [-2.20, wy(1.95), 1.95], [-2.20, -wy(1.95), 1.95]], [WT, 0, 0], hull);
      M.box(-2.22, -2.05, -.60, .40, BZ, 1.72, dark);
      // front shield (leans back) with the gun port, curved lower apron, sight hood
      v5Slab(M, [[-.33, -.61, 1.49], [-.33, .61, 1.49], [-.55, .36, 2.27], [-.55, -.36, 2.27]], [-WT, 0, -WT * .3], hull);
      { const ap = []; for (let k = 0; k <= 12; k++) { const a = -Math.PI / 2 + k * Math.PI / 12; ap.push([-.48 + .50 * Math.cos(a) * .9, .62 * Math.sin(a)]); }
        M.prismXY(ap, DZ - .01, 1.495, hull); }
      M.box(-.48, -.38, .36, .50, 1.92, 2.06, dark); M.box(-.39, -.37, .38, .48, 1.95, 2.02, glass);
      // hoop (canvas frame) over the front of the compartment
      for (const sy of [-1, 1]) L('z', [-1.10, sy * .72, 2.29], [[0, 0], [0, .016], [.21, .016], [.21, 0]], 6, dark);
      L('y', [-1.10, -.72, 2.50], [[0, 0], [0, .016], [1.44, .016], [1.44, 0]], 6, dark);
      // ---- 7.5 cm PaK 40/3: cradle / breech inside, recoil sleeve, recuperator, barrel, double-baffle muzzle brake ----
      const GZ = 1.98;
      M.box(-1.05, -.45, -.13, .13, 1.88, 2.06, gun);                                        // breech ring + cradle
      M.box(-1.45, -1.05, -.08, .08, 1.93, 2.03, dark);                                      // recoil guard
      M.box(-.90, -.55, -.22, .22, BZ, 1.85, dark);                                          // pedestal
      M.box(-.44, -.20, -.16, .16, 1.84, 2.10, gun);                                         // gun's own shield block behind the port
      L('x', [-.40, 0, GZ], [[0, 0], [0, .075], [.45, .075], [.47, .06], [.47, 0]], 18, gun);
      L('x', [-.30, 0, 1.79], [[0, 0], [0, .075], [.45, .075], [.47, .05], [.47, 0]], 16, gun);
      L('x', [.05, 0, GZ], [[0, 0], [0, .052], [1.80, .045], [1.80, 0]], 16, gun);
      L('x', [1.85, 0, GZ], [[0, 0], [0, .05], [.06, .065], [.10, .065], [.10, 0]], 14, gun);
      { const brake = (x0, x1) => { M.box(x0, x1, -.12, .12, GZ - .09, GZ + .09, gun); M.box(x0 + .015, x1 - .015, -.125, .125, GZ - .06, GZ + .06, dark); };
        brake(1.94, 2.03); brake(2.07, 2.16); M.box(2.03, 2.07, -.065, .065, GZ - .06, GZ + .06, gun); }
      // ---- rear: muffler across the lower box, exhaust pipe, tow coupling, lights ----
      L('y', [-2.42, -.37, 1.33], [[0, 0], [0, .10], [.04, .11], [.90, .11], [.94, .10], [.94, 0]], 18, dark);
      for (const yy of [-.25, .40]) M.box(-2.36, -2.32, yy - .02, yy + .02, 1.22, 1.44, dark);
      L('x', [-2.42, -.62, 1.15], [[0, 0], [0, .035], [.12, .035], [.12, 0]], 8, dark);
      L('x', [-2.32, 0, .86], [[0, 0], [0, .12], [-.04, .12], [-.04, .06], [-.10, .06], [-.10, 0]], 16, dark);
      for (const yy of [-.58, .58]) M.box(-2.36, -2.31, yy - .05, yy + .05, .52, .62, dark);
      // ---- running gear: front sprocket, 4 road wheels on 2 leaf-spring bogies, 2 return rollers, rear idler ----
      const S1 = [1.99, .735], R1 = .27, S2 = [-1.74, .56], R2 = .25, WX = [1.37, .56, -.345, -1.14], WZ = .40, WR = .35;
      const out = [];
      v5Arc(out, S1, R1 + .03, Math.PI / 2, -1.95, 14);
      out.push([1.38, 0], [-1.16, 0]);
      v5Arc(out, S2, R2 + .03, -2.25, -Math.PI * 1.5, 12);
      out.push([-1.0, .86], [.10, .905], [1.0, .97]);
      for (const sy of [-1, 1]) {
        const ya = sy > 0 ? .715 : -1.015, yb = sy > 0 ? 1.015 : -.715, yc = sy * .865, f = sy;
        v5Track(M, out, ya, yb, .06, .095, trk, trkR);
        for (const x of WX) v5RoadWheel(M, x, yc, WZ, WR, .24, f, tyre, wheel, dark);
        for (const [a, b] of [[0, 1], [2, 3]]) {                                         // bogie: bracket on the hull, leaf spring, swing arms
          const xc = (WX[a] + WX[b]) / 2;
          M.box(xc - .16, xc + .16, sy > 0 ? HW - .01 : -HW - .12, sy > 0 ? HW + .12 : -HW + .01, .50, .80, dark);
          for (let k = 0; k < 4; k++) M.box(xc - .36 + k * .04, xc + .36 - k * .04, sy * .80 - .04, sy * .80 + .04, .64 - k * .025, .66 - k * .025, wheel);
          for (const x of [WX[a], WX[b]]) M.hex8([[xc, sy * .70, .62], [x, sy * .70, WZ + .03], [x, sy * .70, WZ - .03], [xc, sy * .70, .56], [xc, sy * .74, .62], [x, sy * .74, WZ + .03], [x, sy * .74, WZ - .03], [xc, sy * .74, .56]], dark);
        }
        for (const x of [.95, .10]) { L('y', [x, sy * HW, .84], [[0, 0], [0, .03], [sy * .10, .03], [sy * .10, 0]], 8, dark); L('y', [x, sy * .82, .84], [[-.04 * f, 0], [-.04 * f, .065, tyre], [.04 * f, .065, tyre], [.04 * f, 0]], 14, tyre); }
        // sprocket: rim with teeth, spoked hub
        L('y', [S1[0], yc, S1[1]], [[-.10 * f, 0], [-.10 * f, .25, wheel], [-.06 * f, .25, wheel], [-.06 * f, .20, dark], [.06 * f, .20, dark], [.06 * f, .25, wheel], [.10 * f, .25, wheel], [.10 * f, .10, wheel], [.12 * f, .09, wheel], [.12 * f, 0, wheel]], 24, wheel);
        for (let k = 0; k < 19; k++) pnRadial(M, S1[0], S1[1], k * 2 * Math.PI / 19, .245, .31, .06, .035, yc - .09, yc + .09, wheel);
        for (let k = 0; k < 8; k++) pnRadial(M, S1[0], S1[1], k * Math.PI / 4, .09, .21, .05, .035, yc + .07 * f - .012, yc + .07 * f + .012, dark);
        L('y', [S1[0], yc + .12 * f, S1[1]], [[0, 0], [0, .07], [.03 * f, .05], [.03 * f, 0]], 12, dark);
        // idler: spoked wheel
        L('y', [S2[0], yc, S2[1]], [[-.09 * f, 0], [-.09 * f, .25, wheel], [.09 * f, .25, wheel], [.09 * f, .19, wheel], [.05 * f, .17, dark], [.05 * f, .08, dark], [.10 * f, .08, wheel], [.10 * f, 0, wheel]], 22, wheel);
        for (let k = 0; k < 8; k++) pnRadial(M, S2[0], S2[1], k * Math.PI / 4 + .2, .07, .19, .045, .03, yc + .05 * f - .01, yc + .05 * f + .01, dark);
        L('y', [S2[0], yc + .10 * f, S2[1]], [[0, 0], [0, .06], [.03 * f, .04], [.03 * f, 0]], 12, dark);
        extrudeXZ(M, [[-1.95, .74], [-2.05, .60], [-1.80, .48], [-1.68, .62]], sy > 0 ? HW - .01 : -HW - .07, sy > 0 ? HW + .07 : -HW + .01, dark);   // idler crank
        extrudeXZ(M, [[2.18, .92], [2.25, .70], [2.00, .60], [1.86, .82]], sy > 0 ? HW - .01 : -HW - .07, sy > 0 ? HW + .07 : -HW + .01, dark);     // final drive
      }
      return M;
    }

    // round rod (n-sided prism) between two arbitrary points
    function v5Rod(M, p, q, r, m, n = 6) {
      const d = [q[0] - p[0], q[1] - p[1], q[2] - p[2]], l = Math.hypot(...d) || 1, a = d.map(t => t / l);
      let u = Math.abs(a[2]) < .9 ? [0, 0, 1] : [1, 0, 0]; u = [a[1] * u[2] - a[2] * u[1], a[2] * u[0] - a[0] * u[2], a[0] * u[1] - a[1] * u[0]]; const lu = Math.hypot(...u); u = u.map(t => t / lu);
      const v = [a[1] * u[2] - a[2] * u[1], a[2] * u[0] - a[0] * u[2], a[0] * u[1] - a[1] * u[0]];
      const ring = (c) => Array.from({ length: n }, (_, k) => { const t = k * 2 * Math.PI / n, cs = Math.cos(t) * r, sn = Math.sin(t) * r; return [c[0] + u[0] * cs + v[0] * sn, c[1] + u[1] * cs + v[1] * sn, c[2] + u[2] * cs + v[2] * sn]; });
      const A = ring(p), B = ring(q), mid = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2];
      for (let k = 0; k < n; k++) { const j = (k + 1) % n; M.quad(A[k], A[j], B[j], B[k], m, mid); }
    }
    function v5Poly(M, pts, r, m, n = 6) { for (let i = 0; i + 1 < pts.length; i++) v5Rod(M, pts[i], pts[i + 1], r, m, n); }

    // ---------- Sd.Kfz. 231 (8-Rad) schwerer Panzerspähwagen — from the supplied dimensioned 3-view (585 × 220 × 235 cm, wheelbase 135 + 140 + 135 cm)
    // and the detailed 1:35 side / top drawing (details) and colour profile.  Faceted hull: lower plates lean in to the narrow belly, upper plates lean in to the roof;
    // the widest (waist) line rises from the nose ridge (Z 1.05) to the turret (Z 1.58) and falls to the rear ridge (Z .87). Six-sided turret with 2 cm KwK 30 + MG 34.
    function buildSdKfz231(paint) {
      const P = PAINT[paint] || PAINT.grey, M = new Mesh();
      const hull = M.mat(P.hull, { spec: .08 }), dark = M.mat(P.dark, { spec: .05 }), gun = M.mat(P.gun, { spec: .22, noise: .5 });
      const tyre = M.mat([30, 31, 33], { noise: .6 }), wheel = M.mat(P.wheel, { spec: .12 }), grille = M.mat([34, 36, 38], { shadow: false, noise: .5 }), glass = M.mat([200, 205, 190], { spec: .9, shadow: false, noise: 0 });
      const black = M.mat([22, 24, 26], { shadow: false, noise: 0 }), wood = M.mat([112, 84, 56], { spec: .03, noise: 1.3 }), red = M.mat([120, 40, 34], { shadow: false });
      const L = (ax, o, prof, seg, m) => M.lathe(ax, o, prof, seg, m);

      // ---- armoured hull: hexagonal stations [zb, bb, zw, w, zr, r] ----
      const T = [
        [2.92, [1.00, .44, 1.05, .46, 1.07, .44]],
        [2.80, [.85, .48, 1.08, .55, 1.17, .45]],
        [2.63, [.76, .50, 1.13, .68, 1.36, .45]],
        [2.58, [.73, .50, 1.15, .69, 1.39, .45]],
        [1.90, [.70, .50, 1.30, .81, 1.61, .53]],
        [1.76, [.70, .50, 1.33, .84, 1.83, .435]],
        [.75, [.70, .50, 1.58, 1.02, 1.83, .80]],
        [-.42, [.70, .50, 1.43, .91, 1.83, .59]],
        [-.52, [.70, .50, 1.42, .90, 1.65, .70]],
        [-2.53, [.70, .50, 1.16, .72, 1.40, .53]],
        [-2.68, [.78, .50, 1.14, .70, 1.38, .52]],
        [-2.86, [.85, .48, .87, .50, .90, .48]]];
      v5Loft(M, T.map(([x, p]) => [x, v5Hex(...p)]), hull);
      M.box(-2.50, 2.50, -.46, .46, .30, .72, dark);                                       // belly / chassis frame between the wheels
      for (const sy of [-1, 1]) for (let s = 2; s + 2 < T.length; s++) {                   // waist seam strip
        const a = T[s], b = T[s + 1];
        M.hex8([[a[0], sy * (a[1][3] - .006), a[1][2] - .012], [b[0], sy * (b[1][3] - .006), b[1][2] - .012], [b[0], sy * (b[1][3] + .014), b[1][2] - .012], [a[0], sy * (a[1][3] + .014), a[1][2] - .012],
                [a[0], sy * (a[1][3] - .006), a[1][2] + .012], [b[0], sy * (b[1][3] - .006), b[1][2] + .012], [b[0], sy * (b[1][3] + .014), b[1][2] + .012], [a[0], sy * (a[1][3] + .014), a[1][2] + .012]], dark);
      }
      // ---- front: driver's hatch on the glacis deck, visor in the front plate, headlights on stalks, front tow hooks ----
      const gz = x => 1.39 + (2.58 - x) / .68 * .22;                                       // front deck height
      const onD = (x0, x1, y0, y1, th, m) => M.hex8([[x0, y0, gz(x0) - .004], [x1, y0, gz(x1) - .004], [x1, y1, gz(x1) - .004], [x0, y1, gz(x0) - .004], [x0, y0, gz(x0) + th], [x1, y0, gz(x1) + th], [x1, y1, gz(x1) + th], [x0, y1, gz(x0) + th]], m);
      onD(2.46, 1.94, -.38, .38, .03, hull); onD(2.42, 1.98, -.34, .34, .045, dark); onD(2.30, 2.10, -.05, .05, .06, hull);
      for (const yy of [-.24, .24]) onD(2.22, 2.12, yy - .03, yy + .03, .07, dark);
      const fpx = z => 1.90 - (z - 1.61) / .22 * .14;
      for (const yc of [-.18, .18]) M.hex8([[fpx(1.66) + .002, yc - .12, 1.66], [fpx(1.66) + .002, yc + .12, 1.66], [fpx(1.76) + .002, yc + .12, 1.76], [fpx(1.76) + .002, yc - .12, 1.76],
                                             [fpx(1.66) + .04, yc - .12, 1.66], [fpx(1.66) + .04, yc + .12, 1.66], [fpx(1.76) + .04, yc + .12, 1.76], [fpx(1.76) + .04, yc - .12, 1.76]], dark);
      for (const yc of [-.18, .18]) M.hex8([[fpx(1.70) + .03, yc - .09, 1.70], [fpx(1.70) + .03, yc + .09, 1.70], [fpx(1.72) + .03, yc + .09, 1.72], [fpx(1.72) + .03, yc - .09, 1.72],
                                             [fpx(1.70) + .05, yc - .09, 1.70], [fpx(1.70) + .05, yc + .09, 1.70], [fpx(1.72) + .05, yc + .09, 1.72], [fpx(1.72) + .05, yc - .09, 1.72]], black);
      for (const sy of [-1, 1]) {
        L('z', [2.56, sy * .55, gz(2.56)], [[0, 0], [0, .02], [.13, .02], [.13, 0]], 8, dark);
        L('x', [2.53, sy * .55, gz(2.56) + .17], [[0, 0], [0, .05], [.03, .065], [.10, .065], [.12, .05], [.12, 0]], 14, dark);
        L('x', [2.65, sy * .55, gz(2.56) + .17], [[0, 0], [0, .055], [.006, .052], [.006, 0]], 14, glass);
        L('y', [2.94, sy * .30 - .04, .98], [[0, 0], [0, .035], [.08, .035], [.08, 0]], 10, dark);   // tow eyes on the nose ridge
      }
      M.hex8([[2.93, -.40, .99], [2.93, .40, .99], [2.93, .40, 1.035], [2.93, -.40, 1.035], [2.96, -.40, .99], [2.96, .40, .99], [2.96, .40, 1.035], [2.96, -.40, 1.035]], dark);   // nose ridge strip
      // ---- hull-side vision flaps (front & rear crew), grab-rail loop, side stowage box with lid ----
      const hp = (face, x, z, sy) => v5HullPt(T, face, x, z, sy);
      for (const sy of [-1, 1]) {
        for (const [xa, xb] of [[1.72, 1.40], [-.10, -.42]]) { v5HullPlate(M, T, 'up', xa, xb, 1.62, 1.76, .03, sy, dark); v5HullPlate(M, T, 'up', xa - .04, xb + .04, 1.68, 1.70, .045, sy, black); }
        for (const xx of [1.69, 1.43, -.13, -.39]) v5HullPlate(M, T, 'up', xx + .015, xx - .015, 1.75, 1.79, .05, sy, dark);
        const rp = [[1.13, 1.40], [1.00, 1.86], [.83, 1.86], [.27, 1.47]].map(([x, z]) => { const p = hp(z > T[0][1][2] && x < 1.76 ? 'up' : 'up', x, z, sy); return [p[0], p[1] + sy * .03, p[2]]; });
        v5Poly(M, rp, .016, dark);
        v5HullPlate(M, T, 'lo', .38, -.42, .95, 1.38, .05, sy, hull); v5HullPlate(M, T, 'lo', .34, -.38, .99, 1.34, .06, sy, dark);   // lower side door
        for (const [xx, zz] of [[.30, 1.30], [-.34, 1.30], [.30, 1.03], [-.34, 1.03]]) v5HullPlate(M, T, 'lo', xx + .02, xx - .02, zz - .02, zz + .02, .075, sy, dark);
        v5HullPlate(M, T, 'up', -.48, -1.10, 1.30, 1.36, .07, sy, hull);                  // long tool box on the rear upper side
        v5HullPlate(M, T, 'lo', 1.45, 1.10, 1.25, 1.36, .07, sy, wood);                   // pick / shovel handles
      }
      // ---- fenders: flat top at Z 1.13 (±.70…±.97), skirt sloping out to ±1.09 at Z .81 with trapezoid wheel arches ----
      const FZ = 1.13, sk = z => .97 + (FZ - z) / (FZ - .81) * .12;
      const skirtPieces = [[[2.74, .81], [2.49, .81], [2.29, .97], [2.29, FZ], [2.40, FZ]], [[2.29, .97], [1.81, .97], [1.81, FZ], [2.29, FZ]],
        [[1.81, .97], [1.63, .81], [1.13, .81], [.94, .97], [.94, FZ], [1.81, FZ]], [[.94, .97], [.46, .97], [.46, FZ], [.94, FZ]], [[.46, FZ], [.46, .97], [.27, .81], [.05, .81], [.40, FZ]]];
      for (const sy of [-1, 1]) for (const sx of [1, -1]) {
        for (const pc of skirtPieces) v5Slab(M, pc.map(([x, z]) => [sx * x, sy * sk(z), z]), [0, -sy * .02, 0], hull);
        M.box(sx > 0 ? .40 : -2.40, sx > 0 ? 2.40 : -.40, sy > 0 ? .70 : -.97, sy > 0 ? .97 : -.70, FZ - .025, FZ, hull);
        for (const [xa, xb] of [[2.40, 2.74], [.40, .05]]) { const a = sx * xa, b = sx * xb;
          M.hex8([[a, sy * .70, FZ], [b, sy * .70, .81], [b, sy * sk(.81), .81], [a, sy * .97, FZ], [a, sy * .70, FZ - .025], [b, sy * .70, .785], [b, sy * sk(.81), .785], [a, sy * .97, FZ - .025]], hull); }
        // fender stowage bins (lids hinged outboard)
        const bx = sx > 0 ? [1.62, 1.22] : [-1.10, -1.45];
        M.box(Math.min(...bx), Math.max(...bx), sy > 0 ? .72 : -.95, sy > 0 ? .95 : -.72, FZ, FZ + .22, hull);
        M.box(Math.min(...bx) - .01, Math.max(...bx) + .01, sy > 0 ? .71 : -.96, sy > 0 ? .96 : -.71, FZ + .22, FZ + .24, dark);
        M.box(Math.min(...bx) + .08, Math.max(...bx) - .08, sy > 0 ? .95 : -.965, sy > 0 ? .965 : -.95, FZ + .14, FZ + .18, dark);
      }
      for (const sy of [-1, 1]) { M.box(2.05, 2.38, sy > 0 ? .74 : -.95, sy > 0 ? .95 : -.74, FZ, FZ + .16, hull); M.box(-2.38, -1.82, sy > 0 ? .72 : -.95, sy > 0 ? .95 : -.72, FZ, FZ + .20, hull);
        M.box(-2.36, -1.84, sy > 0 ? .95 : -.962, sy > 0 ? .962 : -.95, FZ + .04, FZ + .16, dark); }
      M.box(.02, .38, .72, .96, FZ - .02, FZ + .06, grille);                                     // ventilator grating (left, between the fenders)
      M.box(.02, .38, -.96, -.72, FZ - .02, FZ + .06, grille);
      // ---- rear: engine deck hatches & louvres, rear driver's visors, radiator grille on the rear slope, lights, antenna base ----
      const dz = x => 1.65 - (-.52 - x) / 2.01 * .25;
      const onE = (x0, x1, y0, y1, th, m) => M.hex8([[x0, y0, dz(x0) - .004], [x1, y0, dz(x1) - .004], [x1, y1, dz(x1) - .004], [x0, y1, dz(x0) - .004], [x0, y0, dz(x0) + th], [x1, y0, dz(x1) + th], [x1, y1, dz(x1) + th], [x0, y1, dz(x0) + th]], m);
      onE(-1.10, -1.50, -.48, .48, .025, dark); for (let k = 0; k < 6; k++) { const xx = -1.14 - k * .062; onE(xx, xx - .03, -.45, .45, .045, hull); }
      onE(-1.74, -2.48, -.36, .36, .03, hull); onE(-1.78, -2.44, -.33, .33, .038, dark); M.box(-2.13, -2.09, -.36, .36, dz(-2.11), dz(-2.11) + .045, dark);
      for (const [xx, yy] of [[-1.80, -.28], [-1.80, .28], [-2.42, -.28], [-2.42, .28]]) onE(xx + .03, xx - .03, yy - .03, yy + .03, .06, dark);
      const rpx = z => -.42 - (1.83 - z) / .18 * .10;
      for (const yc of [-.20, .20]) M.hex8([[rpx(1.70) - .002, yc - .10, 1.70], [rpx(1.70) - .002, yc + .10, 1.70], [rpx(1.78) - .002, yc + .10, 1.78], [rpx(1.78) - .002, yc - .10, 1.78],
                                             [rpx(1.70) - .035, yc - .10, 1.70], [rpx(1.70) - .035, yc + .10, 1.70], [rpx(1.78) - .035, yc + .10, 1.78], [rpx(1.78) - .035, yc - .10, 1.78]], dark);
      { const rx = z => -2.68 - (1.38 - z) / .51 * .18, onR = (y0, y1, z0, z1, th, m) => M.hex8([[rx(z0) + .004, y0, z0], [rx(z0) + .004, y1, z0], [rx(z1) + .004, y1, z1], [rx(z1) + .004, y0, z1], [rx(z0) - th, y0, z0], [rx(z0) - th, y1, z0], [rx(z1) - th, y1, z1], [rx(z1) - th, y0, z1]], m);
        onR(-.40, .40, .95, 1.33, .02, dark); onR(-.37, .37, .98, 1.30, .028, grille); for (let k = 0; k < 6; k++) { const zz = 1.01 + k * .05; onR(-.37, .37, zz, zz + .014, .034, dark); } }
      for (const sy of [-1, 1]) { L('x', [-2.70, sy * .62, 1.24], [[0, 0], [0, .045], [-.06, .045], [-.06, 0]], 10, red); M.box(-2.92, -2.84, sy * .30 - .04, sy * .30 + .04, .80, .88, dark); }
      L('z', [-2.45, -.48, dz(-2.45)], [[0, 0], [0, .05], [.06, .05], [.06, .03], [.12, .03], [.12, 0]], 10, dark);
      M.grp = 1;   // v192: turret part (rotates on its own)
      // ---- turret: six-sided frustum, roof rising from the front (Z 2.19) to 2.32, split roof hatches, vision ports, 2 cm KwK 30 + MG 34 ----
      const TZ0 = 1.83, A = [[1.47, -.50], [.75, -.77], [-.04, -.55], [-.04, .55], [.75, .77], [1.47, .50]], B = [[1.36, -.37], [.75, -.52], [.20, -.37], [.20, .37], [.75, .52], [1.36, .37]];
      const tz = x => x >= .75 ? 2.32 - (x - .75) / .61 * .13 : 2.32 - (.75 - x) / .55 * .01;
      loftZ(M, A, B, TZ0, (x, y) => tz(x), hull);
      const tf = (i, s0, s1, f0, f1) => { const j = (i + 1) % 6, Pp = (s, f) => { const b = [A[i][0] + (A[j][0] - A[i][0]) * s, A[i][1] + (A[j][1] - A[i][1]) * s], t = [B[i][0] + (B[j][0] - B[i][0]) * s, B[i][1] + (B[j][1] - B[i][1]) * s];
        const zt = tz(t[0]); return [b[0] + (t[0] - b[0]) * f, b[1] + (t[1] - b[1]) * f, TZ0 + (zt - TZ0) * f]; }; return [Pp(s0, f0), Pp(s1, f0), Pp(s1, f1), Pp(s0, f1)]; };
      const tin = [.70, 0, 2.05];
      for (const i of [0, 4]) { v5FacePlate(M, tf(i, .30, .70, .30, .66), .025, tin, dark); v5FacePlate(M, tf(i, .38, .62, .44, .52), .035, tin, black); }   // front-flank visors
      for (const i of [1, 3]) { v5FacePlate(M, tf(i, .25, .60, .45, .62), .022, tin, dark); v5FacePlate(M, tf(i, .30, .55, .50, .56), .032, tin, black); }   // rear-flank visor slots
      v5FacePlate(M, tf(2, .30, .70, .35, .60), .025, tin, dark);                                                                                          // rear pistol-port plate
      M.box(.74, .76, -.50, .50, tz(.75), tz(.75) + .012, dark);
      for (const sy of [-1, 1]) { const ya = sy > 0 ? .03 : -.40, yb = sy > 0 ? .40 : -.03;                                                                       // split roof hatches
        M.prismXY([[.70, ya], [.30, ya], [.30, yb], [.70, yb]], tz(.5), tz(.5) + .025, dark);
        M.prismXY([[.67, ya + .03 * sy], [.33, ya + .03 * sy], [.33, yb - .03 * sy], [.67, yb - .03 * sy]], tz(.5) + .025, tz(.5) + .04, hull); }
      M.prismXY([[1.10, -.20], [.92, -.20], [.92, .20], [1.10, .20]], tz(1.0) - .01, tz(1.0) + .02, dark);                                                         // sight / periscope plate
      // mantlet plate + guns
      M.hex8([[1.47, -.24, 1.90], [1.47, .30, 1.90], [1.37, .30, 2.15], [1.37, -.24, 2.15], [1.53, -.24, 1.90], [1.53, .30, 1.90], [1.43, .30, 2.15], [1.43, -.24, 2.15]], hull);
      L('x', [1.45, -.02, 2.02], [[0, 0], [0, .07], [.08, .07], [.10, .05], [.10, 0]], 14, gun);
      L('x', [1.55, -.02, 2.02], [[0, 0], [0, .03], [.55, .025], [.55, 0]], 12, gun);
      L('x', [2.10, -.02, 2.02], [[0, 0], [0, .04], [.15, .04], [.15, 0]], 10, gun);                                                                              // flash hider
      L('x', [1.45, .22, 2.02], [[0, 0], [0, .045], [.06, .045], [.06, .022], [.22, .022], [.22, .012], [.32, .012], [.32, 0]], 10, gun);                       // coaxial MG 34
      M.grp = 0;
      // ---- running gear: 8 wheels (all driven & steered), axle beams, differentials ----
      const WX = [2.05, .70, -.70, -2.05], WR = .45, WY = .83;
      for (const x of WX) {
        for (const sy of [-1, 1]) v5Tyre(M, x, sy * WY, WR, WR, .22, sy, tyre, wheel, dark, 26);
        L('y', [x, -.72, WR], [[0, 0], [0, .055], [1.44, .055], [1.44, 0]], 10, dark);
        L('y', [x, -.16, WR], [[0, 0], [0, .10], [.32, .10], [.32, 0]], 14, dark);
        for (const sy of [-1, 1]) M.box(x - .30, x + .30, sy * .48 - .04, sy * .48 + .04, .50, .62, dark);   // leaf / coil spring housings
      }
      L('x', [-.40, 0, .40], [[0, 0], [0, .10], [.80, .10], [.80, 0]], 12, dark);                                                                                  // centre gearbox / transfer case
      return M;
    }

    // stacked plan-polygon lofts: levels = [[z, poly], ...] (same vertex count), closed bottom & top
    function v5Stack(M, levels, m) {
      for (let i = 0; i + 1 < levels.length; i++) v5LoftZ(M, levels[i][1], levels[i + 1][1], levels[i][0], levels[i + 1][0], m, i + 2 === levels.length);
      const [z0, A] = levels[0], n = A.length, c = A.reduce((q, p) => [q[0] + p[0] / n, q[1] + p[1] / n], [0, 0]);
      for (let i = 0; i < n; i++) { const j = (i + 1) % n; M.tri([c[0], c[1], z0], [A[j][0], A[j][1], z0], [A[i][0], A[i][1], z0], [0, 0, -1], [0, 0, -1], [0, 0, -1], m); }
    }
    const v5Mir = h => h.map(([x, y]) => [x, -y]).concat(h.slice().reverse());   // half plan (front→rear, +Y side) to a full symmetric polygon

    // ---------- Sturmgeschütz III Ausf. G (Sd.Kfz. 142/1) — from the supplied side / top / front / rear drawing (72.1 px/m) and photo ----------
    // Pz.Kpfw. III hull (vertical sides ±.98, front sprocket, 6 road wheels on torsion bars, 3 return rollers, rear idler), casemate overhanging the fenders
    // (±1.19) with angled cheek plates, raised gun housing, box mantlet with the 7.5 cm StuK 40 L/48 offset .13 m to the right, cupola rear-left, loader's MG shield.
    function buildStuG3G(paint) {
      const P = PAINT[paint] || PAINT.grey, M = new Mesh();
      const hull = M.mat(P.hull, { spec: .08 }), dark = M.mat(P.dark, { spec: .05 }), gun = M.mat(P.gun, { spec: .22, noise: .5 });
      const trk = M.mat([58, 54, 48], { spec: .06, noise: 1.4 }), trkR = M.mat([70, 64, 56], { shadow: false, noise: 1.4 }), tyre = M.mat([30, 31, 33], { noise: .6 }), wheel = M.mat(P.wheel, { spec: .12 });
      const grille = M.mat([34, 36, 38], { shadow: false, noise: .5 }), glass = M.mat([200, 205, 190], { spec: .9, shadow: false, noise: 0 }), black = M.mat([22, 24, 26], { shadow: false, noise: 0 }), wood = M.mat([112, 84, 56], { spec: .03, noise: 1.3 });
      const L = (ax, o, prof, seg, m) => M.lathe(ax, o, prof, seg, m);
      const HW = .98, FZ = 1.29, DZ = 1.60, GY = -.13, GZ = 1.60;

      // ---- hull: vertical nose plate, glacis, flat deck, sloped rear ----
      extrudeXZ(M, [[2.62, .98], [2.62, 1.20], [1.63, 1.33], [-.57, 1.33], [-.60, DZ], [-2.55, DZ], [-2.60, 1.30], [-2.60, .78], [-2.30, .45], [2.25, .45]], -HW, HW, hull);
      M.box(2.55, 2.66, -HW, HW, .98, 1.21, hull);                                           // bolted additional nose plate
      for (let k = 0; k < 7; k++) for (const zz of [1.02, 1.17]) L('x', [2.66, -.82 + k * .27, zz], [[0, 0], [0, .016], [.012, .016], [.012, 0]], 6, dark);
      const gz = x => 1.20 + (2.62 - x) / .99 * .13;
      const onG = (x0, x1, y0, y1, th, m) => M.hex8([[x0, y0, gz(x0) - .004], [x1, y0, gz(x1) - .004], [x1, y1, gz(x1) - .004], [x0, y1, gz(x0) - .004], [x0, y0, gz(x0) + th], [x1, y0, gz(x1) + th], [x1, y1, gz(x1) + th], [x0, y1, gz(x0) + th]], m);
      for (const [ya, yb] of [[-.85, -.51], [.14, .79]]) { onG(2.24, 1.85, ya, yb, .03, hull); onG(2.20, 1.89, ya + .03, yb - .03, .04, dark); onG(2.08, 2.00, (ya + yb) / 2 - .05, (ya + yb) / 2 + .05, .055, hull); }
      for (const yy of [-.70, .70]) { M.box(2.62, 2.72, yy - .06, yy + .06, .80, .96, dark); L('y', [2.70, yy - .07, .88], [[0, 0], [0, .045], [.14, .045], [.14, 0]], 10, dark); }
      // fenders (front ends turned down), stowage
      for (const sy of [-1, 1]) {
        const ya = sy > 0 ? HW : -1.46, yb = sy > 0 ? 1.46 : -HW;
        M.box(-2.62, 2.50, ya, yb, FZ - .025, FZ, hull);
        M.hex8([[2.50, ya, FZ], [2.66, ya, 1.18], [2.66, ya, 1.15], [2.50, ya, FZ - .03], [2.50, yb, FZ], [2.66, yb, 1.18], [2.66, yb, 1.15], [2.50, yb, FZ - .03]], hull);
        M.hex8([[-2.62, ya, FZ], [-2.72, ya, 1.20], [-2.72, ya, 1.17], [-2.62, ya, FZ - .03], [-2.62, yb, FZ], [-2.72, yb, 1.20], [-2.72, yb, 1.17], [-2.62, yb, FZ - .03]], hull);
        M.box(1.70, 2.45, sy > 0 ? 1.20 : -1.44, sy > 0 ? 1.44 : -1.20, FZ, FZ + .12, hull);                               // front fender bins
        L('x', [.60, sy * 1.33, FZ + .068], [[0, 0], [0, .07], [1.0, .07], [1.0, 0]], 12, wood);                              // jack block / tool rolls
        M.box(-2.50, -1.70, sy > 0 ? 1.19 : -1.45, sy > 0 ? 1.45 : -1.19, FZ, FZ + .16, hull);                              // rear fender boxes
      }
      // ---- casemate: stacked plan levels (bottom on the fenders, cheeks angled in plan & elevation, chamfered roof edge) ----
      v5Stack(M, [
        [FZ, v5Mir([[1.63, .98], [1.60, 1.19], [-.57, 1.19]])],
        [1.58, v5Mir([[1.63, .98], [1.40, 1.17], [-.57, 1.17]])],
        [1.85, v5Mir([[1.63, .64], [.95, 1.13], [-.57, 1.13]])],
        [1.92, v5Mir([[1.63, .60], [.80, .93], [-.52, .93]])]], hull);
      // raised gun housing on the roof front
      v5Stack(M, [[1.91, v5Mir([[1.63, .60], [.85, .62], [.80, .60]])], [1.99, v5Mir([[1.60, .58], [.88, .58], [.84, .56]])]], hull);
      // driver's visor (left) on the front plate, gun port plate
      M.box(1.63, 1.70, .40, .86, 1.35, 1.49, hull); M.box(1.69, 1.705, .48, .78, 1.40, 1.44, black);
      M.box(1.63, 1.67, -.37, .20, 1.36, 1.88, hull);
      for (let k = 0; k < 6; k++) for (const zz of [1.36, 1.55]) L('x', [1.63, -.85 + k * .34, zz], [[0, 0], [0, .016], [.012, .016], [.012, 0]], 6, dark);
      // box mantlet (cast cradle armour), recoil sleeve, StuK 40 L/48 with double-baffle muzzle brake
      M.box(1.66, 2.22, GY - .14, GY + .14, 1.44, 1.72, hull);
      M.box(1.64, 1.90, GY - .17, GY + .17, 1.42, 1.75, hull);
      L('x', [2.22, GY, GZ], [[0, 0], [0, .075], [.04, .062], [.04, 0]], 16, gun);
      L('x', [2.26, GY, GZ], [[0, 0], [0, .058], [1.50, .050], [1.50, 0]], 16, gun);
      L('x', [3.76, GY, GZ], [[0, 0], [0, .05], [.03, .07], [.26, .07], [.26, 0]], 16, gun);
      M.box(3.80, 3.92, GY - .11, GY + .11, GZ - .085, GZ + .085, gun); M.box(3.94, 4.04, GY - .11, GY + .11, GZ - .085, GZ + .085, gun);
      M.box(3.82, 3.90, GY - .115, GY + .115, GZ - .05, GZ + .05, dark); M.box(3.96, 4.02, GY - .115, GY + .115, GZ - .05, GZ + .05, dark);
      // ---- roof: gunner's sight slot, cupola (rear left) with periscopes, loader's hatch + MG shield (rear right), fan vent ----
      M.prismXY([[.66, .32], [.38, .58], [.42, .64], [.70, .38]], 1.915, 1.94, dark); M.box(.48, .60, .44, .54, 1.94, 2.05, dark);
      { const cx = -.14, cy = .53;
        L('z', [cx, cy, 1.91], [[0, 0], [0, .34], [.02, .34], [.02, .30], [.10, .30], [.10, .27], [.12, .27], [.12, 0]], 30, hull);
        for (let k = 0; k < 7; k++) { const a = Math.PI * (-.15 + k * .27); M.rectZ(cx + .29 * Math.cos(a), cy + .29 * Math.sin(a), a, .04, .09, 1.96, 2.00, glass); }
        L('z', [cx, cy, 2.03], [[0, 0], [0, .24], [.03, .23], [.04, .17], [.04, 0]], 22, dark); }
      { const hx = -.22, hy = -.62;                                                                          // loader's hatch + folding MG shield
        M.box(hx - .20, hx + .20, hy - .32, hy + .32, 1.92, 1.95, dark); M.box(hx - .18, hx + .18, hy - .30, hy + .30, 1.95, 1.965, hull);
        M.box(hx + .20, hx + .23, hy - .34, hy + .34, 1.92, 2.10, hull);
        for (const sy of [-1, 1]) M.box(hx + .08, hx + .21, hy + sy * .34 - .012, hy + sy * .34 + .012, 1.92, 2.07, hull);
        L('x', [hx + .23, hy + .05, 2.03], [[0, 0], [0, .015], [.45, .012], [.45, 0]], 8, gun); M.box(hx - .05, hx + .21, hy + .01, hy + .09, 1.99, 2.06, gun); }
      L('z', [-.16, 0, 1.92], [[0, 0], [0, .08], [.03, .07], [.03, 0]], 14, dark);
      for (const [xx, yy] of [[.70, -.80], [.70, .80], [-.45, -.85], [-.45, .85]]) M.box(xx - .03, xx + .03, yy - .02, yy + .02, 1.92, 1.95, dark);
      // ---- casemate sides: rivets, smoke dischargers, wire tow cables on the rear sides ----
      for (const sy of [-1, 1]) {
        for (let k = 0; k < 9; k++) { const xx = 1.20 - k * .21; M.box(xx - .01, xx + .01, sy * 1.19 - .01, sy * 1.19 + .01, FZ + .04, FZ + .06, dark); }
        L('y', [1.20, sy * 1.12, 1.88], [[0, 0], [0, .03], [sy * .10, .03], [sy * .10, 0]], 8, dark);
        for (let k = 0; k < 3; k++) L('z', [1.12 - k * .10, sy * 1.17, 1.80], [[0, 0], [0, .035], [.16, .035], [.16, 0]], 10, dark);
      }
      // ---- engine deck: two big hatches, side air louvres, rear hatches, spare road wheels lying flat, rear plate & muffler ----
      for (const [ya, yb] of [[-.85, -.12], [.10, .81]]) { M.box(-1.61, -.88, ya, yb, DZ, DZ + .025, hull); M.box(-1.58, -.91, ya + .03, yb - .03, DZ + .025, DZ + .035, dark); for (const xx of [-1.0, -1.49]) M.box(xx - .03, xx + .03, ya + .05, ya + .11, DZ + .035, DZ + .06, dark); }
      for (const sy of [-1, 1]) { M.box(-1.62, -.72, sy > 0 ? .84 : -1.0, sy > 0 ? 1.0 : -.84, DZ, DZ + .03, dark); M.box(-1.60, -.74, sy > 0 ? .86 : -.98, sy > 0 ? .98 : -.86, DZ + .03, DZ + .04, grille); }
      M.box(-2.10, -1.70, -.30, .30, DZ, DZ + .03, hull);
      for (const sy of [-1, 1]) for (const z of [DZ, DZ + .14]) {
        L('z', [-2.26, sy * .67, z], [[0, 0], [0, .25, tyre], [.12, .25, tyre], [.12, .20, wheel], [.12, 0, wheel]], 22, tyre);
        L('z', [-2.26, sy * .67, z + .12], [[0, 0], [0, .06], [.02, .05], [.02, 0]], 10, dark);
      }
      M.box(-2.64, -2.58, -.90, .90, .80, 1.25, dark);
      L('y', [-2.70, -.75, 1.05], [[0, 0], [0, .11], [.05, .12], [1.45, .12], [1.50, .11], [1.50, 0]], 18, dark);
      for (const yy of [-.55, .55]) L('x', [-2.72, yy, 1.12], [[0, 0], [0, .04], [-.14, .04], [-.14, 0]], 8, dark);
      for (const yy of [-.75, .75]) { M.box(-2.70, -2.60, yy - .05, yy + .05, .62, .72, dark); }
      L('x', [-2.60, 0, .66], [[0, 0], [0, .09], [-.08, .09], [-.08, 0]], 12, dark);
      // ---- running gear ----
      const S1 = [2.25, .77], R1 = .40, S2 = [-2.00, .77], R2 = .34, WX = [1.44, .92, .29, -.25, -.77, -1.37], WZ = .33, WR = .25;
      const out = [];
      v5Arc(out, S1, R1 + .02, Math.PI / 2, -1.9, 14);
      out.push([1.40, 0], [-1.40, 0]);
      v5Arc(out, S2, R2 + .04, -2.0, -Math.PI * 1.5, 12);
      out.push([-1.0, 1.10], [1.30, 1.11]);
      for (const sy of [-1, 1]) {
        const ya = sy > 0 ? 1.03 : -1.43, yb = sy > 0 ? 1.43 : -1.03, yc = sy * 1.23, f = sy;
        v5Track(M, out, ya, yb, .07, .12, trk, trkR);
        for (const x of WX) {
          L('y', [x, yc, WZ], [[-.15 * f, 0], [-.15 * f, WR * .80, wheel], [-.15 * f, WR * .84, tyre], [-.10 * f, WR, tyre], [-.03 * f, WR, tyre], [-.02 * f, WR * .84, tyre], [.02 * f, WR * .84, tyre], [.03 * f, WR, tyre], [.10 * f, WR, tyre], [.15 * f, WR * .84, tyre], [.15 * f, WR * .80, wheel], [.12 * f, WR * .6, wheel], [.12 * f, 0, wheel]], 24, tyre);
          L('y', [x, yc + .12 * f, WZ], [[0, 0], [0, .08], [.03 * f, .06], [.05 * f, .03], [.05 * f, 0]], 12, dark);
          for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; L('y', [x + .14 * Math.cos(a), yc + .12 * f, WZ + .14 * Math.sin(a)], [[0, 0], [0, .014], [.012 * f, .014], [.012 * f, 0]], 5, dark); }
          extrudeXZ(M, [[x - .05, WZ + .05], [x + .04, WZ - .02], [x + .30, .52], [x + .22, .60]], sy > 0 ? HW - .01 : -HW - .08, sy > 0 ? HW + .08 : -HW + .01, dark);   // swing arm
        }
        for (const x of [1.31, .06, -.96]) { L('y', [x, sy * HW, .97], [[0, 0], [0, .04], [sy * .12, .04], [sy * .12, 0]], 8, dark); L('y', [x, yc, .97], [[-.10 * f, 0], [-.10 * f, .13, tyre], [.10 * f, .13, tyre], [.10 * f, 0]], 18, tyre); L('y', [x, yc + .10 * f, .97], [[0, 0], [0, .05], [.02 * f, .05], [.02 * f, 0]], 10, dark); }
        for (const x of [1.70, -1.80]) M.box(x - .06, x + .06, sy > 0 ? HW - .01 : -HW - .08, sy > 0 ? HW + .08 : -HW + .01, .55, .80, dark);   // shock absorbers / bump stops
        // sprocket (two toothed rims + spoked hub)
        L('y', [S1[0], yc, S1[1]], [[-.12 * f, 0], [-.12 * f, .33, wheel], [-.08 * f, .33, wheel], [-.08 * f, .26, dark], [.08 * f, .26, dark], [.08 * f, .33, wheel], [.12 * f, .33, wheel], [.12 * f, .13, wheel], [.14 * f, .12, wheel], [.14 * f, 0, wheel]], 26, wheel);
        for (let k = 0; k < 21; k++) pnRadial(M, S1[0], S1[1], k * 2 * Math.PI / 21, .32, .41, .07, .04, yc - .11, yc + .11, wheel);
        for (let k = 0; k < 6; k++) pnRadial(M, S1[0], S1[1], k * Math.PI / 3 + .3, .12, .27, .07, .05, yc + .09 * f - .012, yc + .09 * f + .012, dark);
        L('y', [S1[0], yc + .14 * f, S1[1]], [[0, 0], [0, .09], [.03 * f, .07], [.03 * f, 0]], 12, dark);
        // idler: spoked wheel
        L('y', [S2[0], yc, S2[1]], [[-.10 * f, 0], [-.10 * f, .34, wheel], [.10 * f, .34, wheel], [.10 * f, .28, wheel], [.05 * f, .26, dark], [.05 * f, .09, dark], [.11 * f, .09, wheel], [.11 * f, 0, wheel]], 26, wheel);
        for (let k = 0; k < 10; k++) pnRadial(M, S2[0], S2[1], k * Math.PI / 5 + .1, .08, .27, .04, .03, yc + .05 * f - .01, yc + .05 * f + .01, dark);
        L('y', [S2[0], yc + .11 * f, S2[1]], [[0, 0], [0, .07], [.03 * f, .05], [.03 * f, 0]], 12, dark);
        extrudeXZ(M, [[-2.20, .98], [-2.40, .80], [-2.15, .62], [-1.95, .80]], sy > 0 ? HW - .01 : -HW - .07, sy > 0 ? HW + .07 : -HW + .01, dark);
        extrudeXZ(M, [[2.55, 1.05], [2.62, .80], [2.25, .62], [2.05, .90]], sy > 0 ? HW - .01 : -HW - .07, sy > 0 ? HW + .07 : -HW + .01, dark);
      }
      return M;
    }

    // ---------- Sd.Kfz. 251/1 Ausf. D mittlerer Schützenpanzerwagen — from the supplied side / top / front / rear drawing and colour render ----------
    // Faceted armour body: engine hood (narrow sloped top) and driver's plate in front, open-topped troop compartment whose upper side plates lean in from the
    // waist (±.98 at Z 1.0) to the rim (±.68 at Z 1.75), rear wedge with doors; steered front wheels (R .44, track ±.75), front sprocket, interleaved road wheels,
    // rear idler; side stowage lockers on the track guards; MG 34 with shield at the front of the compartment, rear AA MG mount.
    function buildSdKfz251(paint) {
      const P = PAINT[paint] || PAINT.grey, M = new Mesh();
      const hull = M.mat(P.hull, { spec: .08 }), dark = M.mat(P.dark, { spec: .05 }), gun = M.mat(P.gun, { spec: .22, noise: .5 });
      const trk = M.mat([58, 54, 48], { spec: .06, noise: 1.4 }), trkR = M.mat([70, 64, 56], { shadow: false, noise: 1.4 }), tyre = M.mat([30, 31, 33], { noise: .6 }), wheel = M.mat(P.wheel, { spec: .12 });
      const grille = M.mat([34, 36, 38], { shadow: false, noise: .5 }), glass = M.mat([200, 205, 190], { spec: .9, shadow: false, noise: 0 }), black = M.mat([22, 24, 26], { shadow: false, noise: 0 });
      const inner = M.mat([84, 87, 90], { spec: .03, noise: .8 }), wood = M.mat([112, 84, 56], { spec: .03, noise: 1.3 }), seat = M.mat([70, 62, 52], { spec: .03, noise: 1.0 });
      const L = (ax, o, prof, seg, m) => M.lathe(ax, o, prof, seg, m);
      const TZ = 1.82, TR = .68, WZ0 = 1.0, WW = .98;                                  // rim height / half-width, waist height / half-width

      // ---- closed front body: radiator nose, hood, driver's plate (stations [zb, bb, zw, w, zr, r]) ----
      const F = [
        [2.88, [.45, .40, .97, .50, 1.26, .30]],
        [2.54, [.47, .45, .99, .62, 1.32, .33]],
        [1.65, [.50, .55, 1.00, .80, 1.44, .42]],
        [.82, [.50, .58, 1.00, .95, 1.60, .55]],
        [.61, [.50, .60, 1.00, WW, TZ, TR]]];
      v5Loft(M, F.map(([x, p]) => [x, v5Hex(...p)]), hull);
      // ---- troop compartment: lower hull closed up to the floor, leaning upper side walls, rear wedge walls (open top) ----
      const lowerSec = (zb, bb, zw, w) => [[-bb, zb], [-w, zw], [w, zw], [bb, zb]];
      v5Loft(M, [[.62, lowerSec(.50, .60, WZ0, WW)], [-2.45, lowerSec(.55, .60, WZ0, WW)], [-2.88, lowerSec(1.30, .45, 1.40, .51)]], hull);
      for (const sy of [-1, 1]) {
        v5Slab(M, [[.61, sy * WW, WZ0], [-2.45, sy * WW, WZ0], [-2.55, sy * TR, TZ], [.61, sy * TR, TZ]], [0, -sy * .022, -.008], hull);                       // upper side plate
        v5Slab(M, [[.61, sy * (WW - .03), WZ0 + .02], [-2.45, sy * (WW - .03), WZ0 + .02], [-2.54, sy * (TR - .025), TZ - .01], [.61, sy * (TR - .025), TZ - .01]], [0, -sy * .004, 0], inner);
        v5Slab(M, [[-2.45, sy * WW, WZ0], [-2.88, sy * .51, 1.40], [-2.88, sy * .45, 1.44], [-2.55, sy * TR, TZ]], [sy * .01 * 0 + .015, -sy * .012, 0], hull);   // rear corner plate
      }
      v5Slab(M, [[-2.55, -TR, TZ], [-2.55, TR, TZ], [-2.88, .45, 1.44], [-2.88, -.45, 1.44]], [.02, 0, 0], hull);                                                 // upper rear plate (doors)
      M.box(-2.50, .55, -.92, .92, WZ0, WZ0 + .02, inner);                                                                                                        // floor
      for (const sy of [-1, 1]) {                                                                                                                                 // benches, backrests, rifle racks
        M.box(-2.30, -.30, sy > 0 ? .50 : -.88, sy > 0 ? .88 : -.50, WZ0 + .02, WZ0 + .40, seat);
        M.box(-2.30, -.30, sy > 0 ? .80 : -.86, sy > 0 ? .86 : -.80, WZ0 + .40, WZ0 + .62, seat);
        for (let k = 0; k < 4; k++) M.box(-2.10 + k * .48, -2.06 + k * .48, sy > 0 ? .70 : -.80, sy > 0 ? .80 : -.70, WZ0 + .45, WZ0 + .68, wood);
        M.box(.10, .48, sy > 0 ? .12 : -.52, sy > 0 ? .52 : -.12, WZ0 + .02, WZ0 + .30, seat); M.box(.06, .12, sy > 0 ? .12 : -.52, sy > 0 ? .52 : -.12, WZ0 + .30, WZ0 + .62, seat);   // driver / commander seats
      }
      M.box(.50, .62, -.60, .60, WZ0 + .30, WZ0 + .55, dark);                                                                                                      // dashboard
      // ---- driver's plate: two visors ; side visors ; hood top hatches, side louvres ; radiator grille, headlights, Notek, tow hooks ----
      const dp = z => .82 - (z - 1.60) / .22 * .21;
      for (const yc of [-.33, .33]) { M.hex8([[dp(1.58) + .002, yc - .17, 1.58], [dp(1.58) + .002, yc + .17, 1.58], [dp(1.70) + .002, yc + .17, 1.70], [dp(1.70) + .002, yc - .17, 1.70],
                                              [dp(1.58) + .045, yc - .17, 1.58], [dp(1.58) + .045, yc + .17, 1.58], [dp(1.70) + .045, yc + .17, 1.70], [dp(1.70) + .045, yc - .17, 1.70]], dark);
        M.hex8([[dp(1.625) + .04, yc - .12, 1.625], [dp(1.625) + .04, yc + .12, 1.625], [dp(1.645) + .04, yc + .12, 1.645], [dp(1.645) + .04, yc - .12, 1.645],
                [dp(1.625) + .055, yc - .12, 1.625], [dp(1.625) + .055, yc + .12, 1.625], [dp(1.645) + .055, yc + .12, 1.645], [dp(1.645) + .055, yc - .12, 1.645]], black); }
      for (const sy of [-1, 1]) {
        const p = (x, z) => { const t = (z - WZ0) / (TZ - WZ0); return [x, sy * (WW + (TR - WW) * t + .02), z]; };
        v5FacePlate(M, [p(.55, 1.58), p(.20, 1.58), p(.20, 1.70), p(.55, 1.70)], .02, [0, 0, 1.3], dark);
        v5FacePlate(M, [p(.50, 1.625), p(.25, 1.625), p(.25, 1.645), p(.50, 1.645)], .03, [0, 0, 1.3], black);
      }
      const hz = x => 1.26 + (2.88 - x) / 2.06 * .29, hw = x => .30 + (2.88 - x) / 2.06 * .25;
      for (const [x0, x1] of [[2.40, 1.75], [1.70, 1.05]]) { const w0 = hw(x0) - .04, w1 = hw(x1) - .04;
        M.hex8([[x0, -w0, hz(x0)], [x1, -w1, hz(x1)], [x1, w1, hz(x1)], [x0, w0, hz(x0)], [x0, -w0, hz(x0) + .02], [x1, -w1, hz(x1) + .02], [x1, w1, hz(x1) + .02], [x0, w0, hz(x0) + .02]], hull);
        M.box((x0 + x1) / 2 - .02, (x0 + x1) / 2 + .02, -.05, .05, hz((x0 + x1) / 2) + .02, hz((x0 + x1) / 2) + .05, dark); }
      L('z', [2.10, -.15, hz(2.10) + .02], [[0, 0], [0, .05], [.02, .05], [.02, 0]], 12, dark);
      for (const sy of [-1, 1]) {                                                                                                                                 // hood side louvres
        const sp = (x, f) => { const st = v5StAt(F, x); return [x, sy * (st[3] + (st[5] - st[3]) * f), st[2] + (st[4] - st[2]) * f]; };
        v5FacePlate(M, [sp(2.30, .25), sp(1.30, .25), sp(1.30, .70), sp(2.30, .70)], .015, [1.8, 0, .9], dark);
        for (let k = 0; k < 7; k++) { const xx = 2.24 - k * .14; v5FacePlate(M, [sp(xx, .30), sp(xx - .06, .30), sp(xx - .06, .65), sp(xx, .65)], .03, [1.8, 0, .9], grille); }
      }
      M.hex8([[2.89, -.44, .62], [2.89, .44, .62], [2.89, .30, 1.20], [2.89, -.30, 1.20], [2.91, -.44, .62], [2.91, .44, .62], [2.91, .30, 1.20], [2.91, -.30, 1.20]], dark);   // radiator armour flaps
      for (let k = 0; k < 5; k++) M.box(2.905, 2.93, -.36, .36, .72 + k * .10, .75 + k * .10, hull);
      for (const sy of [-1, 1]) {
        L('x', [2.70, sy * .55, 1.15], [[0, 0], [0, .08], [.05, .10], [.16, .10], [.18, .085], [.18, 0]], 16, dark);
        L('x', [2.88, sy * .55, 1.15], [[0, 0], [0, .085], [.008, .082], [.008, 0]], 16, glass);
        M.box(2.70, 2.80, sy * .55 - .02, sy * .55 + .02, .98, 1.06, dark);
        L('y', [2.95, sy * .30 - .04, .60], [[0, 0], [0, .04], [.08, .04], [.08, 0]], 10, dark);                                                                // tow hooks
        M.box(2.86, 2.96, sy * .30 - .05, sy * .30 + .05, .55, .66, dark);
      }
      L('z', [2.55, .62, 1.00], [[0, 0], [0, .02], [.20, .02], [.20, 0]], 6, dark); L('x', [2.50, .62, 1.24], [[0, 0], [0, .05], [.10, .05], [.10, 0]], 10, dark);   // Notek on the left
      L('y', [2.92, -.60, .70], [[0, 0], [0, .035], [1.20, .035], [1.20, 0]], 10, dark);                                                                          // front bumper
      // ---- front mudguards, track guards, side lockers ----
      for (const sy of [-1, 1]) {
        const ya = sy > 0 ? .55 : -1.0, yb = sy > 0 ? 1.0 : -.55;
        M.hex8([[2.86, ya, .78], [2.70, ya, 1.00], [2.70, yb, 1.00], [2.86, yb, .78], [2.86, ya, .76], [2.70, ya, .98], [2.70, yb, .98], [2.86, yb, .76]], hull);
        M.box(1.95, 2.70, ya, yb, .98, 1.00, hull);
        M.hex8([[1.95, ya, 1.00], [1.80, ya, .80], [1.80, yb, .80], [1.95, yb, 1.00], [1.93, ya, 1.00], [1.78, ya, .80], [1.78, yb, .80], [1.93, yb, 1.00]], hull);
        M.box(1.80, 2.86, sy > 0 ? .98 : -1.0, sy > 0 ? 1.0 : -.98, .80, 1.00, hull);                                                                           // outer valance
        M.box(-2.45, 1.70, sy > 0 ? .60 : -1.0, sy > 0 ? 1.0 : -.60, .905, .93, hull);                                                                          // track guard
        M.box(-2.45, 1.70, sy > 0 ? .985 : -1.0, sy > 0 ? 1.0 : -.985, .84, .93, hull);
        for (const [xa, xb] of [[-.13, -.80], [-.82, -1.50], [-1.52, -2.20]]) {                                                                                  // three side lockers
          const t = (1.25 - WZ0) / (TZ - WZ0), yin = WW + (TR - WW) * t - .02;
          M.box(xb, xa, sy > 0 ? Math.min(yin, .90) : -1.0, sy > 0 ? 1.0 : -Math.min(yin, .90), .93, 1.25, hull);
          M.box(xb + .02, xa - .02, sy > 0 ? 1.0 : -1.008, sy > 0 ? 1.008 : -1.0, .97, 1.21, dark);
          for (const xx of [xa - .10, xb + .10]) M.box(xx - .02, xx + .02, sy > 0 ? 1.0 : -1.02, sy > 0 ? 1.02 : -1.0, 1.15, 1.22, dark);
        }
        M.box(-.30, .30, sy > 0 ? .95 : -1.0, sy > 0 ? 1.0 : -.95, .93, 1.02, wood);                                                                            // pick / shovel
      }
      // ---- MG 34 with shield at the front of the compartment, rear MG 34 on its AA mount, rear door handles ----
      M.hex8([[.59, -.42, TZ - .03], [.59, .42, TZ - .03], [.57, .42, 2.22], [.57, -.42, 2.22], [.61, -.42, TZ - .03], [.61, .42, TZ - .03], [.59, .42, 2.22], [.59, -.42, 2.22]], hull);   // MG shield on the front rim
      M.box(.52, .62, -.05, .05, TZ - .06, TZ + .02, dark);
      L('x', [.40, 0, 2.02], [[0, 0], [0, .03], [.25, .03], [.25, .022], [.72, .022], [.72, .012], [.84, .012], [.86, .02], [.88, 0]], 10, gun);
      M.box(.25, .58, -.03, .04, 1.98, 2.06, gun); M.box(.54, .58, -.03, .03, TZ, 1.98, dark); L('y', [.38, .04, 2.00], [[0, 0], [0, .05], [.06, .05], [.06, 0]], 12, dark);
      L('z', [-2.56, 0, TZ - .04], [[0, 0], [0, .025], [.26, .025], [.26, 0]], 8, dark); M.box(-2.62, -2.50, -.06, .06, TZ - .06, TZ, dark);
      L('x', [-2.55, 0, 2.08], [[0, 0], [0, .025], [.22, .025], [.22, .02], [.52, .02], [.52, 0]], 10, gun); M.box(-2.70, -2.42, -.03, .04, 2.03, 2.11, gun);
      for (const yy of [-.10, .10]) L('x', [-2.80, yy, 1.58], [[0, 0], [0, .02], [-.06, .02], [-.06, 0]], 6, dark);
      M.box(-2.86, -2.80, -.012, .012, 1.42, 1.72, dark);
      for (const sy of [-1, 1]) L('x', [-2.70, sy * .60, 1.30], [[0, 0], [0, .04], [-.05, .04], [-.05, 0]], 10, M.mat([120, 40, 34], { shadow: false }));
      // ---- running gear: steered front wheels, front sprocket, interleaved road wheels, rear idler, track ----
      const YT = .74;
      for (const sy of [-1, 1]) { v5Tyre(M, 2.39, sy * .75, .44, .44, .20, sy, tyre, wheel, dark, 24); L('y', [2.39, sy * .30, .44], [[0, 0], [0, .05], [sy * .35, .05], [sy * .35, 0]], 10, dark); }
      M.box(2.15, 2.62, -.30, .30, .38, .50, dark);                                                                                                               // front axle leaf spring / beam
      const S1 = [1.20, .49], R1 = .28, S2 = [-1.73, .46], R2 = .29;
      const out = [];
      v5Arc(out, S1, R1 + .02, Math.PI / 2, -1.75, 12);
      out.push([.90, 0], [-1.50, 0]);
      v5Arc(out, S2, R2 + .04, -1.95, -Math.PI * 1.5, 12);
      out.push([.20, .78]);
      for (const sy of [-1, 1]) {
        const yc = sy * YT, f = sy, ya = sy > 0 ? YT - .14 : -YT - .14, yb = sy > 0 ? YT + .14 : -YT + .14;
        v5Track(M, out, ya, yb, .055, .10, trk, trkR, false);
        for (const [xs, dy] of [[[.18, -.54, -1.28], .06], [[.55, -.19, -.93], -.06]]) for (const x of xs) {
          const y = yc + sy * dy;
          L('y', [x, y, .34], [[-.05 * f, 0], [-.05 * f, .25, wheel], [-.05 * f, .26, tyre], [-.04 * f, .28, tyre], [.04 * f, .28, tyre], [.05 * f, .26, tyre], [.05 * f, .25, wheel], [.05 * f, 0, wheel]], 22, tyre);
          if (dy > 0) { for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; L('y', [x + .16 * Math.cos(a), y + .05 * f, .34 + .16 * Math.sin(a)], [[0, 0], [0, .035], [.006 * f, .035], [.006 * f, 0]], 8, dark); }
            L('y', [x, y + .05 * f, .34], [[0, 0], [0, .06], [.02 * f, .05], [.02 * f, 0]], 10, dark); }
        }
        for (const x of [.36, -.36, -1.10]) M.box(x - .20, x + .20, sy > 0 ? .55 : -.62, sy > 0 ? .62 : -.55, .38, .62, dark);                                   // torsion-bar arm housings
        L('y', [S1[0], yc, S1[1]], [[-.12 * f, 0], [-.12 * f, .24, wheel], [-.06 * f, .24, wheel], [-.06 * f, .18, dark], [.06 * f, .18, dark], [.06 * f, .24, wheel], [.12 * f, .24, wheel], [.12 * f, .10, wheel], [.14 * f, .09, wheel], [.14 * f, 0, wheel]], 22, wheel);
        for (let k = 0; k < 10; k++) pnRadial(M, S1[0], S1[1], k * Math.PI / 5, .235, .30, .07, .04, yc - .10, yc + .10, dark);
        for (let k = 0; k < 8; k++) pnRadial(M, S1[0], S1[1], k * Math.PI / 4 + .2, .08, .20, .04, .03, yc + .10 * f - .01, yc + .10 * f + .01, dark);
        L('y', [S2[0], yc, S2[1]], [[-.10 * f, 0], [-.10 * f, .29, wheel], [.10 * f, .29, wheel], [.10 * f, .22, wheel], [.05 * f, .20, dark], [.05 * f, .08, dark], [.11 * f, .08, wheel], [.11 * f, 0, wheel]], 24, wheel);
        for (let k = 0; k < 8; k++) pnRadial(M, S2[0], S2[1], k * Math.PI / 4 + .2, .07, .21, .045, .03, yc + .05 * f - .01, yc + .05 * f + .01, dark);
        L('y', [S2[0], yc + .11 * f, S2[1]], [[0, 0], [0, .06], [.02 * f, .05], [.02 * f, 0]], 10, dark);
        extrudeXZ(M, [[-1.95, .70], [-2.40, .76], [-2.40, .60], [-1.80, .40]], sy > 0 ? .55 : -.62, sy > 0 ? .62 : -.55, dark);
      }
      return M;
    }

    // ---------- M8 Light Armored Car "Greyhound" — from the supplied 1:25 4-view (5000 × 2530 mm, 87.8 px/m) and the detailed 4-view ----------
    // Hexagonal hull (deck ±.80 at 1.48, waist ±1.03 at 1.25, belly ±.85), raised driver's compartment (1.62) with the sloped glacis to a nose edge at Z .98,
    // flared front fenders (±1.24), flat rear fenders (±1.20), open-topped conical turret (centre X .11, R .74 → .66) with 37 mm M6 + coax, .50 cal on a ring mount.
    // Six 9.00-20 wheels (R .53, centre Y ±1.01) at X 1.69 / -.38 / -1.61.
    function buildM8Grey(paint) {
      const P = PAINT[paint] || PAINT.olive, M = new Mesh();
      const hull = M.mat(P.hull, { spec: .08 }), dark = M.mat(P.dark, { spec: .05 }), gun = M.mat(P.gun, { spec: .22, noise: .5 });
      const tyre = M.mat([30, 31, 33], { noise: .6 }), wheel = M.mat(P.wheel, { spec: .12 }), grille = M.mat([34, 36, 38], { shadow: false, noise: .5 }), glass = M.mat([200, 205, 190], { spec: .9, shadow: false, noise: 0 });
      const black = M.mat([22, 24, 26], { shadow: false, noise: 0 }), inner = M.mat([84, 90, 70], { spec: .03, noise: .8 }), canvas = M.mat([118, 112, 92], { spec: .03, noise: 1.2 });
      const L = (ax, o, prof, seg, m) => M.lathe(ax, o, prof, seg, m);
      const DZ = 1.48;

      // ---- hull core: hexagonal stations [zb, bb, zw, w, zr, r] ----
      const T = [
        [2.50, [.965, .84, .98, .86, .995, .84]],
        [2.05, [.64, .82, 1.12, 1.0, 1.22, .84]],
        [1.54, [.60, .85, 1.25, 1.03, 1.62, .76]],
        [1.02, [.60, .85, 1.25, 1.03, 1.62, .76]],
        [1.015, [.60, .85, 1.25, 1.03, DZ, .80]],
        [-2.13, [.66, .85, 1.25, 1.03, DZ, .80]],
        [-2.23, [.70, .80, 1.22, .95, 1.42, .74]]];
      v5Loft(M, T.map(([x, p]) => [x, v5Hex(...p)]), hull);
      for (const sy of [-1, 1]) for (let s = 1; s + 1 < T.length; s++) {           // waist seam
        const a = T[s], b = T[s + 1]; if (a[0] - b[0] < .01) continue;
        M.hex8([[a[0], sy * (a[1][3] - .004), a[1][2] - .012], [b[0], sy * (b[1][3] - .004), b[1][2] - .012], [b[0], sy * (b[1][3] + .014), b[1][2] - .012], [a[0], sy * (a[1][3] + .014), a[1][2] - .012],
                [a[0], sy * (a[1][3] - .004), a[1][2] + .012], [b[0], sy * (b[1][3] - .004), b[1][2] + .012], [b[0], sy * (b[1][3] + .014), b[1][2] + .012], [a[0], sy * (a[1][3] + .014), a[1][2] + .012]], dark);
      }
      // ---- front fenders (flared, sloping top), splash plates behind them ; rear fenders with outer skirt and front splash plate ----
      for (const sy of [-1, 1]) {
        const S = (y0, z0, y1, z1, zb) => [[sy * y0, z0], [sy * y1, z1], [sy * y1, zb], [sy * y0, zb]];
        v5Loft(M, [[2.36, S(.84, 1.06, .98, .99, .93)], [2.17, S(.96, 1.21, 1.24, 1.00, .94)], [1.30, S(1.0, 1.25, 1.24, 1.00, .94)], [1.18, S(1.02, 1.25, 1.20, 1.04, .98)]], hull);
        M.box(1.30, 2.17, sy > 0 ? 1.22 : -1.245, sy > 0 ? 1.245 : -1.22, .94, 1.00, hull);
        v5Slab(M, [[1.21, sy * .92, 1.24], [1.21, sy * 1.18, 1.04], [1.01, sy * 1.18, .62], [1.01, sy * .92, .62]], [-.02, 0, 0], hull);
        M.box(-2.15, .10, sy > 0 ? 1.0 : -1.20, sy > 0 ? 1.20 : -1.0, 1.205, 1.235, hull);                                    // rear fender top
        M.box(-2.15, .10, sy > 0 ? 1.18 : -1.20, sy > 0 ? 1.20 : -1.18, 1.06, 1.235, hull);                                  // outer skirt
        v5Slab(M, [[.10, sy * .92, 1.24], [.10, sy * 1.19, 1.24], [.13, sy * 1.19, .62], [.13, sy * .92, .62]], [.02, 0, 0], hull);
        L('x', [-2.12, sy * 1.205, 1.10], [[0, 0], [0, .012], [2.18, .012], [2.18, 0]], 6, dark);                            // stowage rail
        for (const xx of [-.20, -.80, -1.40, -2.00]) M.box(xx - .05, xx + .05, sy > 0 ? 1.20 : -1.215, sy > 0 ? 1.215 : -1.20, 1.15, 1.21, dark);
        M.hex8([[-2.15, sy * 1.0, 1.205], [-2.15, sy * 1.20, 1.205], [-2.26, sy * .62, 1.205], [-2.26, sy * .62, 1.205],
                [-2.15, sy * 1.0, 1.235], [-2.15, sy * 1.20, 1.235], [-2.26, sy * .62, 1.235], [-2.26, sy * .62, 1.235]], hull);
        // anti-tank mine rack on the middle hull side (three M1 mines)
        const ym = .95; M.box(.32, .98, sy > 0 ? ym : -ym - .03, sy > 0 ? ym + .03 : -ym, .75, .97, dark);
        for (const xx of [.43, .65, .87]) L('y', [xx, sy * (ym + .03), .86], [[0, 0], [0, .10], [.07 * sy, .10], [.07 * sy, 0]], 14, dark);
        // headlights with brush guards on the glacis, tow shackles on the nose
        const hx = 2.24, hy = sy * .52, hz = 1.08 + (2.50 - hx) / .45 * .24;
        L('x', [hx - .06, hy, hz + .07], [[0, 0], [0, .06], [.04, .075], [.10, .075], [.12, .06], [.12, 0]], 14, dark);
        L('x', [hx + .06, hy, hz + .07], [[0, 0], [0, .062], [.006, .06], [.006, 0]], 14, glass);
        v5Poly(M, [[hx - .10, hy - .10, hz - .02], [hx + .12, hy - .10, hz + .05], [hx + .12, hy - .10, hz + .20], [hx - .06, hy - .10, hz + .22]], .01, dark);
        v5Poly(M, [[hx - .10, hy + .10, hz - .02], [hx + .12, hy + .10, hz + .05], [hx + .12, hy + .10, hz + .20], [hx - .06, hy + .10, hz + .22]], .01, dark);
        L('x', [2.42, sy * .55, .80], [[0, 0], [0, .05], [.12, .05], [.12, 0]], 10, dark); L('y', [2.52, sy * .55 - .04, .80], [[0, 0], [0, .035], [.08, .035], [.08, 0]], 10, dark);
      }
      // ---- driver's compartment: two hatches with periscopes, visor flaps on the front plate ----
      for (const yc of [-.45, .45]) {
        M.box(1.20, 1.60, yc - .17, yc + .17, 1.62, 1.645, dark); M.box(1.23, 1.57, yc - .14, yc + .14, 1.645, 1.66, hull);
        M.box(1.47, 1.55, yc - .06, yc + .06, 1.66, 1.71, dark); M.box(1.545, 1.552, yc - .05, yc + .05, 1.67, 1.70, glass);
      }
      { const gx = z => 2.05 - (z - 1.22) / .40 * .51;                                                                       // glacis X at height z
        for (const yc of [-.38, .38]) M.hex8([[gx(1.36) + .005, yc - .26, 1.36], [gx(1.36) + .005, yc + .26, 1.36], [gx(1.55) + .005, yc + .22, 1.55], [gx(1.55) + .005, yc - .22, 1.55],
                                               [gx(1.36) + .04, yc - .26, 1.36], [gx(1.36) + .04, yc + .26, 1.36], [gx(1.55) + .04, yc + .22, 1.55], [gx(1.55) + .04, yc - .22, 1.55]], dark);
        for (const yc of [-.38, .38]) M.hex8([[gx(1.44) + .035, yc - .14, 1.44], [gx(1.44) + .035, yc + .14, 1.44], [gx(1.47) + .035, yc + .14, 1.47], [gx(1.47) + .035, yc - .14, 1.47],
                                               [gx(1.44) + .05, yc - .14, 1.44], [gx(1.44) + .05, yc + .14, 1.44], [gx(1.47) + .05, yc + .14, 1.47], [gx(1.47) + .05, yc - .14, 1.47]], black); }
      // ---- engine deck: two access hatches, cross bar, louvres ; rear plate grille, lights, tow pintle ----
      for (const sy of [-1, 1]) { M.box(-1.85, -1.05, sy > 0 ? .10 : -.56, sy > 0 ? .56 : -.10, DZ, DZ + .02, dark); M.box(-1.80, -1.10, sy > 0 ? .14 : -.52, sy > 0 ? .52 : -.14, DZ + .02, DZ + .035, hull);
        for (const xx of [-1.20, -1.70]) M.box(xx - .03, xx + .03, sy * .50 - .03, sy * .50 + .03, DZ + .035, DZ + .06, dark); }
      M.box(-.88, -.68, -.62, .62, DZ, DZ + .05, hull); M.box(-.86, -.70, -.58, .58, DZ + .05, DZ + .06, dark);
      M.box(-2.05, -1.92, -.70, .70, DZ, DZ + .02, grille);
      { const rx = z => -2.23 - (1.42 - z) * 0, onR = (y0, y1, z0, z1, th, m) => M.box(-2.23 - th, -2.225, y0, y1, z0, z1, m);
        onR(-.56, .56, .84, 1.30, .02, dark); onR(-.53, .53, .87, 1.27, .03, grille); for (let k = 0; k < 9; k++) onR(-.53, .53, .89 + k * .042, .90 + k * .042, .035, dark); }
      for (const sy of [-1, 1]) { L('x', [-2.23, sy * .78, 1.30], [[0, 0], [0, .04], [-.05, .04], [-.05, 0]], 10, M.mat([120, 40, 34], { shadow: false })); M.box(-2.30, -2.22, sy * .62 - .04, sy * .62 + .04, .72, .80, dark); }
      L('x', [-2.23, 0, .74], [[0, 0], [0, .05], [-.12, .05], [-.12, .03], [-.22, .03], [-.22, 0]], 12, dark);
      M.box(-1.55, -.95, .62, .80, DZ, DZ + .14, canvas);                                                                      // bedroll on the left rear deck
      L('z', [-.86, -.92, DZ], [[0, 0], [0, .05], [.08, .05], [.08, .03], [.16, .03], [.16, 0]], 10, dark);                     // antenna base
      M.grp = 1;   // v192: turret part (rotates on its own)
      // ---- open-topped turret (conical), 37 mm M6 + coax, gun shield, .50 cal on the ring mount ----
      const TX = .11;
      L('z', [TX, 0, DZ - .02], [[0, 0], [0, .76], [.02, .76], [.02, .74], [.55, .66], [.55, .62], [.12, .69], [.12, 0]], 36, hull);
      M.prismXY(Array.from({ length: 24 }, (_, k) => [TX + .69 * Math.cos(k * Math.PI / 12), .69 * Math.sin(k * Math.PI / 12)]), DZ + .10, DZ + .11, inner);
      for (let k = 0; k < 20; k++) { const a = k * Math.PI / 10, r = .705; M.box(TX + r * Math.cos(a) - .012, TX + r * Math.cos(a) + .012, r * Math.sin(a) - .012, r * Math.sin(a) + .012, DZ + .16, DZ + .18, dark); }
      for (const a of [Math.PI * .5, Math.PI * 1.5]) { const r = .70; M.rectZ(TX + r * Math.cos(a), r * Math.sin(a), a + Math.PI / 2, .16, .03, 1.86, 1.88, dark); }   // grab handles
      M.box(.30, .58, .05, .45, DZ + .11, DZ + .40, dark);                                                                     // ammunition rack inside
      M.box(-.40, -.10, -.45, -.05, DZ + .11, DZ + .38, dark);
      // gun shield / mantlet, 37 mm M6 and coaxial .30 cal
      M.box(.80, .98, -.22, .22, 1.58, 1.98, hull); L('x', [.98, 0, 1.79], [[0, 0], [0, .13], [.05, .11], [.05, 0]], 18, hull);
      L('x', [1.03, 0, 1.79], [[0, 0], [0, .055], [.38, .055], [.40, .04], [.40, 0]], 14, gun);
      L('x', [1.43, 0, 1.79], [[0, 0], [0, .036], [.87, .032], [.87, 0]], 12, gun);
      L('x', [1.03, -.13, 1.79], [[0, 0], [0, .016], [.30, .012], [.30, 0]], 8, gun);
      // ring mount on three posts with the .50 cal M2
      L('z', [TX - .05, 0, 2.20], [[0, .60], [0, .63], [.04, .63], [.04, .60]], 36, dark);
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; M.box(TX - .05 + .615 * Math.cos(a) - .02, TX - .05 + .615 * Math.cos(a) + .02, .615 * Math.sin(a) - .02, .615 * Math.sin(a) + .02, 2.0, 2.21, dark); }
      { const mx = .52, my = -.10, mz = 2.50; M.box(mx - .02, mx + .02, my - .02, my + .02, 2.22, mz - .05, dark);
        M.box(mx - .30, mx + .10, my - .05, my + .05, mz - .06, mz + .05, gun); L('x', [mx + .10, my, mz], [[0, 0], [0, .03], [.40, .03], [.40, .02], [1.10, .018], [1.10, 0]], 10, gun);
        M.box(mx - .12, mx - .02, my + .05, my + .17, mz - .10, mz + .02, dark); }
      M.grp = 0;
      // ---- wheels: 6 × 9.00-20 combat tyres, axles, differentials ----
      for (const x of [1.69, -.38, -1.61]) {
        for (const sy of [-1, 1]) v5Tyre(M, x, sy * 1.015, .53, .53, .30, sy, tyre, wheel, dark, 26);
        L('y', [x, -.86, .53], [[0, 0], [0, .055], [1.72, .055], [1.72, 0]], 10, dark);
        L('y', [x, -.18, .53], [[0, 0], [0, .12], [.36, .12], [.36, 0]], 14, dark);
      }
      for (const sy of [-1, 1]) M.box(-1.80, -.18, sy * .75 - .05, sy * .75 + .05, .60, .70, dark);                         // rear bogie leaf springs
      return M;
    }

    // ---------- Sd.Kfz. 124 Wespe — from the supplied 1:50 drawing (4810 mm, 85 px/m: side / top / front / rear) and the second 4-view ----------
    // Pz.Kpfw. II chassis (front sprocket, 5 road wheels on quarter-elliptic leaf springs, 3 return rollers, rear idler), driver's cab on the front left,
    // engine in the middle (side louvres), open-topped rear fighting compartment overhanging the fenders (base ±1.08, walls leaning in), 10.5 cm leFH 18/2 elevated ~31°.
    function buildWespe(paint) {
      const P = PAINT[paint] || PAINT.grey, M = new Mesh();
      const hull = M.mat(P.hull, { spec: .08 }), dark = M.mat(P.dark, { spec: .05 }), gun = M.mat(P.gun, { spec: .22, noise: .5 });
      const trk = M.mat([58, 54, 48], { spec: .06, noise: 1.4 }), trkR = M.mat([70, 64, 56], { shadow: false, noise: 1.4 }), tyre = M.mat([30, 31, 33], { noise: .6 }), wheel = M.mat(P.wheel, { spec: .12 });
      const grille = M.mat([34, 36, 38], { shadow: false, noise: .5 }), glass = M.mat([200, 205, 190], { spec: .9, shadow: false, noise: 0 }), black = M.mat([22, 24, 26], { shadow: false, noise: 0 });
      const inner = M.mat([78, 81, 84], { spec: .03, noise: .8 }), wood = M.mat([112, 84, 56], { spec: .03, noise: 1.3 });
      const L = (ax, o, prof, seg, m) => M.lathe(ax, o, prof, seg, m);
      const HW = .62, FZ = 1.08;

      // ---- hull: nose, front cab level (1.37-1.42), compartment floor level (1.10) at the rear ----
      extrudeXZ(M, [[2.28, .36], [2.40, .66], [2.32, 1.05], [1.64, 1.37], [.48, 1.42], [.30, 1.42], [-.25, 1.10], [-2.30, 1.10], [-2.30, .46], [-2.02, .36]], -HW, HW, hull);
      // fenders over the tracks, front mud flaps
      for (const sy of [-1, 1]) {
        const ya = sy > 0 ? HW : -1.08, yb = sy > 0 ? 1.08 : -HW;
        M.box(-2.30, 2.20, ya, yb, FZ - .03, FZ, hull);
        M.hex8([[2.20, ya, FZ], [2.42, ya, .92], [2.42, ya, .89], [2.20, ya, FZ - .03], [2.20, yb, FZ], [2.42, yb, .92], [2.42, yb, .89], [2.20, yb, FZ - .03]], hull);
        M.box(-2.30, 2.20, sy > 0 ? 1.06 : -1.08, sy > 0 ? 1.08 : -1.06, FZ - .05, FZ, dark);
        // side louvres on the engine compartment plates (front of the fighting compartment)
        const y0 = sy > 0 ? HW : -HW - .02, y1 = sy > 0 ? HW + .02 : -HW;
        for (const [xa, xb] of [[.45, .03], [-.14, -.32]]) { M.box(xb, xa, y0, y1, 1.13, 1.40, dark); for (let k = 0; k < 6; k++) { const zz = 1.16 + k * .042; M.box(xb + .01, xa - .01, sy > 0 ? HW + .01 : -HW - .035, sy > 0 ? HW + .035 : -HW - .01, zz, zz + .014, hull); } }
      }
      // ---- front: driver's cab with visor (front left), vision block, glacis hatch, headlight, Notek ----
      { const gz = x => 1.05 + (2.32 - x) / .68 * .32;
        M.prismXY([[1.80, -.05], [1.74, -.12], [1.58, -.12], [1.53, -.05], [1.53, .46], [1.58, .53], [1.74, .53], [1.80, .46]], gz(1.80) - .01, gz(1.80) + .025, dark);   // driver's hatch
        M.prismXY([[1.77, -.03], [1.72, -.09], [1.60, -.09], [1.56, -.03], [1.56, .44], [1.60, .50], [1.72, .50], [1.77, .44]], gz(1.80) + .025, gz(1.80) + .04, hull);
        L('x', [1.80, .30, 1.26], [[0, 0], [0, .07], [.05, .07], [.10, .06], [.14, .045], [.14, 0]], 14, dark); M.box(1.93, 1.95, .26, .34, 1.245, 1.275, glass);   // driver's visor block
        L('z', [2.08, -.32, gz(2.08)], [[0, 0], [0, .12], [.02, .12], [.02, .10], [.03, .10], [.03, 0]], 18, hull);         // round inspection plate on the glacis
        L('x', [2.18, -.48, gz(2.18) + .12], [[0, 0], [0, .06], [.04, .075], [.10, .075], [.12, .06], [.12, 0]], 14, dark); L('x', [2.30, -.48, gz(2.18) + .12], [[0, 0], [0, .062], [.006, .06], [.006, 0]], 14, glass);
        L('z', [2.20, .45, gz(2.20)], [[0, 0], [0, .045], [.12, .045], [.12, 0]], 10, dark);                                  // Notek
        for (const yy of [-.40, .40]) { M.box(2.36, 2.44, yy - .05, yy + .05, .58, .68, dark); L('y', [2.43, yy - .05, .63], [[0, 0], [0, .03], [.10, .03], [.10, 0]], 8, dark); } }
      // fender stowage: tool box + jack (right front), spare tracks, crowbar / shovel (left)
      M.box(1.55, 1.85, -1.06, -.70, FZ, FZ + .22, wood); M.box(1.70, 2.05, -1.04, -.80, FZ, FZ + .13, hull);
      L('x', [.40, -.95, FZ + .06], [[0, 0], [0, .06], [.70, .06], [.70, 0]], 12, dark);
      L('x', [.25, .95, FZ + .03], [[0, 0], [0, .02], [1.55, .02], [1.55, 0]], 6, wood); M.box(.26, .55, .86, 1.04, FZ, FZ + .05, dark);
      L('x', [-.10, .80, FZ + .10], [[0, 0], [0, .09], [.40, .09], [.40, 0]], 12, dark);                                   // fire extinguisher / can
      // ---- open fighting compartment: front plate, two flank plates, leaning side walls, rear wall ----
      const WT = .02;
      const Fb = [.30, .40, 1.42], Ft = [-.07, .36, 2.19], Sb = [-.20, 1.08, FZ], St = [-.18, .84, 2.17], Rb = [-2.30, 1.08, FZ], Rt = [-2.12, .86, 1.88];
      const sym = (p, sy) => [p[0], sy * p[1], p[2]];
      v5Slab(M, [sym(Fb, -1), sym(Fb, 1), sym(Ft, 1), sym(Ft, -1)], [-WT, 0, -WT * .5], hull);
      for (const sy of [-1, 1]) {
        v5Slab(M, [sym(Fb, sy), sym(Sb, sy), sym(St, sy), sym(Ft, sy)], [-WT * .7, -sy * WT * .7, 0], hull);
        v5Slab(M, [sym(Sb, sy), sym(Rb, sy), sym(Rt, sy), sym(St, sy)], [0, -sy * WT, -WT * .3], hull);
        v5Slab(M, [[Sb[0] - .03, sy * (Sb[1] - WT - .003), Sb[2] + .02], [Rb[0] + .03, sy * (Rb[1] - WT - .003), Rb[2] + .02], [Rt[0] + .03, sy * (Rt[1] - WT - .003), Rt[2] - .01], [St[0] - .03, sy * (St[1] - WT - .003), St[2] - .01]], [0, -sy * .004, 0], inner);
        for (let k = 0; k < 10; k++) { const t = (k + .5) / 10, x = Sb[0] + (Rb[0] - Sb[0]) * t, zt = St[2] + (Rt[2] - St[2]) * t - .05, yt = St[1] + (Rt[1] - St[1]) * t;   // rivet row under the top edge
          M.box(x - .01, x + .01, sy * (yt + .012) - .01, sy * (yt + .012) + .01, zt - .01, zt + .01, dark); }
        M.box(-1.95, -1.10, sy > 0 ? .70 : -1.0, sy > 0 ? 1.0 : -.70, FZ, 1.55, dark);                                       // ammunition bins
        for (let k = 0; k < 6; k++) { const xx = -1.88 + k * .14; L('y', [xx, sy * .70, 1.45], [[0, 0], [0, .045], [-sy * .05, .045], [-sy * .05, 0]], 10, gun); }
      }
      v5Slab(M, [sym(Rb, -1), sym(Rb, 1), sym(Rt, 1), sym(Rt, -1)], [WT, 0, 0], hull);
      M.box(-2.28, -.20, -1.05, 1.05, FZ, FZ + .01, inner);
      // rear: hinged rear plate lowered as a platform, lights, tow coupling
      M.box(-2.62, -2.30, -.70, .70, 1.36, 1.39, hull); for (const sy of [-1, 1]) M.box(-2.60, -2.32, sy * .68 - .015, sy * .68 + .015, 1.30, 1.39, dark);
      for (const sy of [-1, 1]) { L('x', [-2.28, sy * .95, FZ + .045], [[0, 0], [0, .045], [-.06, .045], [-.06, 0]], 10, dark); M.box(-2.30, -2.22, sy * .95 - .03, sy * .95 + .03, FZ, FZ + .02, dark); }
      L('x', [-2.30, 0, .70], [[0, 0], [0, .08], [-.08, .08], [-.08, .04], [-.20, .04], [-.20, 0]], 12, dark);
      L('z', [-.56, .84, 2.02], [[0, 0], [0, .03], [.10, .03], [.10, 0]], 8, dark);                                         // antenna base on the left wall
      // ---- 10.5 cm leFH 18/2 (elevated ~31°): pedestal, cradle, recuperator, barrel, muzzle brake, sight ----
      { const ang = 32.7 * Math.PI / 180, ca = Math.cos(ang), sa = Math.sin(ang), O = [-.62, 0, 1.86], at = t => [O[0] + ca * t, O[1], O[2] + sa * t];
        M.box(-1.05, -.35, -.30, .30, FZ, 1.60, dark);                                                                     // pedestal / top carriage
        for (const sy of [-1, 1]) v5Slab(M, [[-.95, sy * .20, 1.60], [-.30, sy * .20, 1.60], [-.40, sy * .20, 1.95], [-.80, sy * .20, 1.95]], [0, -sy * .04, 0], dark);   // trunnion cheeks
        v5Rod(M, at(-.60), at(.75), .11, gun, 12);                                                                          // cradle / breech
        v5Rod(M, at(-.80), at(-.55), .15, gun, 10);
        v5Rod(M, at(.75), at(1.86), .062, gun, 14);                                                                         // barrel
        v5Rod(M, [at(-.30)[0], 0, at(-.30)[2] - .14], [at(1.25)[0], 0, at(1.25)[2] - .14], .055, gun, 10);                   // recuperator below
        v5Rod(M, [at(-.50)[0], 0, at(-.50)[2] + .13], [at(1.00)[0], 0, at(1.00)[2] + .13], .045, gun, 10);                 // buffer above
        const mb0 = at(1.86), mb1 = at(2.12); v5Rod(M, mb0, mb1, .10, gun, 8);                                              // muzzle brake
        v5Rod(M, at(1.92), at(2.06), .106, dark, 8);
        M.box(-.50, -.36, .16, .24, 1.95, 2.15, dark); M.box(-.48, -.40, .17, .23, 2.15, 2.20, glass);                      // sight
        for (const sy of [-1, 1]) M.box(-.30, .10, sy * .30 - .015, sy * .30 + .015, 1.42, 1.80, hull); }                    // gun shield side plates behind the front plate
      // ---- running gear: sprocket, 5 road wheels on leaf springs, 3 return rollers, idler ----
      const S1 = [2.00, .60], S2 = [-1.71, .59], WX = [1.43, .91, .34, -.28, -.87], WZ = .30, WR = .27;
      const out = [];
      v5Arc(out, S1, .38, Math.PI / 2, -1.85, 14);
      out.push([1.40, 0], [-.95, 0]);
      v5Arc(out, S2, .33, -2.2, -Math.PI * 1.5, 12);
      out.push([-1.0, .965], [1.40, .98]);
      for (const sy of [-1, 1]) {
        const ya = sy > 0 ? .66 : -1.0, yb = sy > 0 ? 1.0 : -.66, yc = sy * .83, f = sy;
        v5Track(M, out, ya, yb, .055, .085, trk, trkR);
        for (const x of WX) {
          L('y', [x, yc, WZ], [[-.13 * f, 0], [-.13 * f, WR * .82, wheel], [-.13 * f, WR * .86, tyre], [-.09 * f, WR, tyre], [-.02 * f, WR, tyre], [-.01 * f, WR * .86, tyre], [.01 * f, WR * .86, tyre], [.02 * f, WR, tyre], [.09 * f, WR, tyre], [.13 * f, WR * .86, tyre], [.13 * f, WR * .82, wheel], [.10 * f, WR * .5, wheel], [.10 * f, 0, wheel]], 22, tyre);
          L('y', [x, yc + .10 * f, WZ], [[0, 0], [0, .07], [.03 * f, .05], [.04 * f, .02], [.04 * f, 0]], 12, dark);
          for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; L('y', [x + .12 * Math.cos(a), yc + .10 * f, WZ + .12 * Math.sin(a)], [[0, 0], [0, .012], [.01 * f, .012], [.01 * f, 0]], 5, dark); }
          extrudeXZ(M, [[x - .02, WZ + .04], [x + .04, WZ - .02], [x + .32, .62], [x + .26, .70]], sy > 0 ? HW - .01 : -HW - .06, sy > 0 ? HW + .06 : -HW + .01, dark);   // swing arm
          extrudeXZ(M, [[x + .20, .66], [x + .42, .72], [x + .42, .76], [x + .16, .72]], sy > 0 ? HW + .01 : -HW - .07, sy > 0 ? HW + .07 : -HW - .01, black);           // quarter-elliptic leaf spring
        }
        for (const x of [1.35, .30, -.75]) { L('y', [x, sy * HW, .86], [[0, 0], [0, .03], [sy * .12, .03], [sy * .12, 0]], 8, dark); L('y', [x, yc, .86], [[-.06 * f, 0], [-.06 * f, .085, tyre], [.06 * f, .085, tyre], [.06 * f, 0]], 14, tyre); }
        L('y', [S1[0], yc, S1[1]], [[-.11 * f, 0], [-.11 * f, .28, wheel], [-.06 * f, .28, wheel], [-.06 * f, .22, dark], [.06 * f, .22, dark], [.06 * f, .28, wheel], [.11 * f, .28, wheel], [.11 * f, .10, wheel], [.13 * f, .09, wheel], [.13 * f, 0, wheel]], 24, wheel);
        for (let k = 0; k < 20; k++) pnRadial(M, S1[0], S1[1], k * Math.PI / 10, .27, .35, .06, .035, yc - .09, yc + .09, wheel);
        L('y', [S1[0], yc + .13 * f, S1[1]], [[0, 0], [0, .08], [.03 * f, .06], [.03 * f, 0]], 12, dark);
        L('y', [S2[0], yc, S2[1]], [[-.09 * f, 0], [-.09 * f, .27, wheel], [.09 * f, .27, wheel], [.09 * f, .21, wheel], [.05 * f, .19, dark], [.05 * f, .07, dark], [.10 * f, .07, wheel], [.10 * f, 0, wheel]], 22, wheel);
        for (let k = 0; k < 8; k++) pnRadial(M, S2[0], S2[1], k * Math.PI / 4 + .2, .06, .20, .045, .03, yc + .05 * f - .01, yc + .05 * f + .01, dark);
        extrudeXZ(M, [[2.25, .95], [2.32, .72], [2.05, .48], [1.85, .80]], sy > 0 ? HW - .01 : -HW - .06, sy > 0 ? HW + .06 : -HW + .01, dark);
      }
      return M;
    }

