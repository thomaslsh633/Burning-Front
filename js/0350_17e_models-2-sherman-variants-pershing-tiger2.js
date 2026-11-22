    // curved panel following a surface: surf(x, z) → [x, y, z]
    function patchGrid(M, surf, x0, x1, z0, z1, nx, nz, ny, m) {
      for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
        const xa = x0 + (x1 - x0) * i / nx, xb = x0 + (x1 - x0) * (i + 1) / nx, za = z0 + (z1 - z0) * j / nz, zb = z0 + (z1 - z0) * (j + 1) / nz;
        const a = surf(xa, za), b = surf(xb, za), c = surf(xb, zb), d = surf(xa, zb), N = [0, ny, 0];
        M.tri(a, b, c, N, N, N, m); M.tri(a, c, d, N, N, N, m);
      }
    }
    function buildSherman(paint, opt) {      // opt.howitzer: M4(105) with the stout 105 mm howitzer + M52 mantlet; opt.dozer: adds the M1 bulldozer kit
      opt = opt || {}; const HOW = !!opt.howitzer, CAL = !!opt.calliope;   // CAL: T34 Calliope rocket launcher on the turret (Whizbang)
      const P = PAINT[paint] || PAINT.grey, M = new Mesh();
      const hull = M.mat(P.hull, { spec: .08 }), dark = M.mat(P.dark, { spec: .05 }), gun = M.mat(P.gun, { spec: .22, noise: .5 });
      const trk = M.mat([58, 54, 48], { spec: .06, noise: 1.4 }), trkR = M.mat([70, 64, 56], { shadow: false, noise: 1.4 }), tyre = M.mat([30, 31, 33], { noise: .6 }), wheel = M.mat(P.wheel, { spec: .12 });
      const glass = M.mat([20, 26, 30], { spec: .8, shadow: false, noise: 0 }), white = M.mat([252, 252, 244], { spec: .04, shadow: false, noise: 0 });
      const crate = M.mat([P.dark[0] + 16, P.dark[1] + 14, P.dark[2] + 6], { spec: .04 });
      const L = (ax, o, prof, seg, m) => M.lathe(ax, o, prof, seg, m);
      const HW = 1.31;                                                  // hull half-width (2.62 m over the tracks)
      const deckZ = x => x >= .82 ? 1.91 : 1.91 - .0915 * (.82 - x);   // top deck: flat over the turret ring, falling gently to the rear

      // ---- welded upper hull: one convex side profile (glacis ~32 deg, deck, sloped rear deck, vertical tail plate) extruded across the full width ----
      const G0 = [2.22, 1.16], G1 = [1.04, 1.91];
      extrudeXZ(M, [G0, G1, [.82, 1.91], [-2.81, 1.578], [-2.86, 1.52], [-2.86, 1.16]], -HW, HW, hull);
      M.box(-2.80, 2.30, -.83, .83, .38, 1.17, dark);                  // lower hull between the tracks
      // bolted 3-piece cast final-drive cover (centre piece + two side pieces + raised bolted ribs) — rounded casting bulging out of the lower glacis
      { const cov = d => [[1.55, 1.56], [2.00, 1.46], [2.40 - d * .5, 1.30], [2.66 - d, 1.14], [2.73 - d, .95], [2.68 - d, .70], [2.45 - d * .5, .48], [2.15, .40], [1.90, .40], [1.70, .90], [1.60, 1.40]];
        extrudeXZ(M, cov(0), -.34, .34, hull);
        for (const sy of [-1, 1]) { extrudeXZ(M, cov(.08), sy > 0 ? .34 : -.82, sy > 0 ? .82 : -.34, hull); extrudeXZ(M, cov(-.03), sy > 0 ? .31 : -.37, sy > 0 ? .37 : -.31, dark); }
        for (const sy of [-1, 1]) M.box(2.58, 2.76, sy * .45 - .035, sy * .45 + .035, .54, .60, dark); }                       // tow-eye lugs
      // front fenders / sprocket guards (thin wedge plates over the front track horns)
      for (const sy of [-1, 1]) loftXY(M, [[2.15, sy * .86], [2.62, sy * .86], [2.29, sy * HW], [2.15, sy * HW]], [[2.15, sy * .86], [2.62, sy * .86], [2.29, sy * HW], [2.15, sy * HW]], 1.12, 1.18, hull);

      // glacis fittings: driver / co-driver hatch hoods with periscope blocks, bow MG34-style ball mount (right), headlamps with guards at the corners, big star between the hoods
      for (const sy of [-1, 1]) {
        plateBlock(M, G0, G1, .62, sy * .52, .46, .34, .13, hull);                         // armoured hatch hood
        plateBlock(M, G0, G1, .55, sy * .52, .30, .06, .145, glass);                       // periscope face
        plateBlock(M, G0, G1, .70, sy * .52, .26, .20, .15, dark);                         // hatch lid
        plateBlock(M, G0, G1, .20, sy * .96, .17, .17, .055, dark);                       // headlamp bezel
        plateBlock(M, G0, G1, .20, sy * .96, .10, .10, .075, glass);                      // lens
        plateBlock(M, G0, G1, .27, sy * .96, .20, .03, .06, dark);                        // lamp guard bar
      }
      plateBlock(M, G0, G1, .28, -.53, .28, .28, .035, hull); mgBall(M, G0, G1, .28, -.53, dark, gun);
      starPlane(M, G0, G1, .68, 0, .26, white);
      // siren / lamp domes and lifting eyes on the front fender tops (side view detail)
      for (const sy of [-1, 1]) { L('z', [2.30, sy * 1.12, 1.20], [[0, 0], [0, .09], [.07, .09], [.12, .05], [.12, 0]], 14, dark); M.box(1.58, 1.68, sy * 1.00 - .02, sy * 1.00 + .02, 1.50, 1.62, dark); }

      // top deck details: engine deck panel (raised), fuel filler caps, side rails
      { const x0 = -1.06, x1 = -1.66; extrudeXZ(M, [[x0, 1.945], [x1, 1.845], [x1, deckZ(x1) - .05], [x0, deckZ(x0) - .05]], -.57, .57, dark); }
      for (let k = 0; k < 5; k++) { const x = -1.14 - k * .095, pz = 1.945 + (x + 1.06) * .1667; M.box(x - .022, x + .022, -.50, .50, pz - .005, pz + .02, glass); }   // engine deck louvres
      for (const [cx, cy, r] of [[-1.17, -.94, .15], [-1.17, .94, .15], [-1.25, -.56, .09], [-1.25, .56, .09]]) L('z', [cx, cy, deckZ(cx) - .03], [[0, 0], [0, r], [.06, r], [.06, r * .6], [.08, r * .6], [.08, 0]], 18, dark);
      for (const sy of [-1, 1]) extrudeXZ(M, [[-.60, deckZ(-.60) + .005], [-2.20, deckZ(-2.20) + .005], [-2.20, deckZ(-2.20) - .03], [-.60, deckZ(-.60) - .03]], sy > 0 ? HW - .07 : -HW, sy > 0 ? HW : -HW + .07, dark);
      // rear plate: exhaust shields, centre stowage bar, tow hooks
      for (const sy of [-1, 1]) { M.box(-2.94, -2.85, sy * .62 - .17, sy * .62 + .17, .95, 1.30, dark); M.box(-2.92, -2.76, sy * .52 - .035, sy * .52 + .035, .42, .52, dark); }
      M.box(-2.92, -2.76, -.07, .07, .38, 1.15, dark);

      M.grp = 1;   // v182: everything from here to the tracks is turret (hull-mounted pieces switch back below)
      // ---- cast turret: smooth rounded shell, sloped front, near-vertical rear with rounded top corners ----
      const zs = [1.88, 2.15, 2.40, 2.52, 2.60, 2.62], xf = [.82, .64, .44, .34, .25, .18], xr = [-1.16, -1.16, -1.16, -1.12, -.95, -.78], yw = [1.02, 1.01, .97, .92, .84, .70], EXP = .62;
      const lerpZ = (arr, z) => { if (z <= zs[0]) return arr[0]; for (let i = 0; i < zs.length - 1; i++) if (z <= zs[i + 1]) return arr[i] + (arr[i + 1] - arr[i]) * (z - zs[i]) / (zs[i + 1] - zs[i]); return arr[zs.length - 1]; };
      { const NZ = 14, NS = 36, rings = [];
        for (let i = 0; i <= NZ; i++) { const z = zs[0] + (zs[5] - zs[0]) * i / NZ, o = [];
          for (let k = 0; k < NS; k++) { const a = k * Math.PI * 2 / NS, c = Math.cos(a), s = Math.sin(a); o.push([(c >= 0 ? lerpZ(xf, z) : -lerpZ(xr, z)) * Math.sign(c) * Math.pow(Math.abs(c), EXP), lerpZ(yw, z) * Math.sign(s) * Math.pow(Math.abs(s), EXP), z]); }
          rings.push(o); }
        smoothGrid(M, rings, hull, [0, 0, -1], [0, 0, 1]); }
      const turretY = (x, z) => { const a = x >= 0 ? lerpZ(xf, z) : -lerpZ(xr, z), c = Math.min(1, Math.pow(Math.abs(x) / a, 1 / EXP)); return lerpZ(yw, z) * Math.pow(Math.sqrt(Math.max(0, 1 - c * c)), EXP); };
      L('z', [-.12, 0, 1.86], [[0, 0], [0, 1.05], [.07, 1.05], [.07, 0]], 40, dark);                  // turret ring
      // rear bustle (rounded box on the turret rear)
      { const rings = [[-1.08, .52, 2.44, 1.96], [-1.16, .51, 2.44, 1.96], [-1.20, .46, 2.41, 1.99]].map(([x, W, zT, zB]) => sqRing(x, W, zT, zB, 24, .6)); smoothGrid(M, rings, hull, [-1, 0, 0], [-1, 0, 0]); }
      // M34 rotor-shield mantlet: wide rounded outer shield + rotor shield with the gun aperture, gun sleeve, sight slot, M3 75 mm gun (long tapered tube)
      { const mw = HOW ? 1.12 : 1, mh = HOW ? 1.14 : 1;   // the M52 mantlet of the 105 mm howitzer is a bigger, boxier shield
        const rings = [[.55, .50, .24], [.80, .50, .24], [.95, .46, .22], [1.03, .36, .17]].map(([x, W, H]) => sqRing(x, W * mw, 2.16 + H * mh, 2.16 - H * mh, 28, .6));
        smoothGrid(M, rings, hull, [-1, 0, 0], [1, 0, 0]); }
      { const rings = [[.90, .21, .21], [1.04, .20, .20], [1.10, .16, .16]].map(([x, W, H]) => sqRing(x, W, 2.16 + H, 2.16 - H, 24, .7));
        smoothGrid(M, rings, hull, [-1, 0, 0], [1, 0, 0]); }
      if (HOW) {   // 105 mm M4 howitzer: short, thick tube (about 1.2 m beyond the mantlet), no muzzle brake, slight muzzle swell
        L('x', [1.09, 0, 2.16], [[0, 0], [0, .160], [.10, .160], [.10, .138], [.17, .134], [.17, 0]], 24, gun);
        L('x', [1.25, 0, 2.16], [[0, 0], [0, .135], [.28, .128], [.60, .118], [.95, .106], [1.07, .102], [1.10, .112], [1.19, .112], [1.19, 0]], 22, gun);
        L('x', [2.442, 0, 2.16], [[-.002, 0], [-.002, .066], [.008, .066], [.008, 0]], 14, dark);        // bore
      } else {
        L('x', [1.09, 0, 2.16], [[0, 0], [0, .135], [.10, .135], [.10, .115], [.17, .112], [.17, 0]], 22, gun);
        L('x', [1.25, 0, 2.16], [[0, 0], [0, .105], [.30, .100], [.55, .092], [1.39, .072], [1.44, .078], [1.47, .078], [1.47, 0]], 18, gun);
      }
      M.box(.98, 1.04, .22, .34, 2.20, 2.28, glass);                                                   // gunner's sight opening
      L('x', [1.04, -.13, 2.10], [[0, 0], [0, .03], [.05, .03], [.05, 0]], 10, dark);                  // co-axial MG muzzle
      // roof: commander's cupola with vision slits + .50 cal M2 on its pintle (right rear), loader's hatch (left), gunner's periscope guard, vent dome, antenna mount
      const zr = 2.60, ccx = -.38, ccy = -.50;
      L('z', [ccx, ccy, zr - .02], [[0, 0], [0, .44], [.05, .44], [.05, .38], [.12, .38], [.12, 0]], 36, hull);
      L('z', [ccx, ccy, zr + .10], [[0, 0], [0, .30], [.025, .30], [.025, 0]], 28, dark);
      for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + .3; M.box(ccx + Math.cos(a) * .38 - .05, ccx + Math.cos(a) * .38 + .05, ccy + Math.sin(a) * .38 - .05, ccy + Math.sin(a) * .38 + .05, zr + .05, zr + .12, glass); }
      if (!CAL) {   // no pintle .50 cal under the rocket launcher
      L('z', [ccx + .30, ccy, zr + .10], [[0, 0], [0, .035], [.23, .035], [.23, .05], [.26, .05], [.26, 0]], 12, dark);   // MG pintle post
      L('x', [-.52, ccy, 3.00], [[0, 0], [0, .045], [.45, .045], [.45, .036], [1.40, .034], [1.62, .028], [1.62, 0]], 14, gun);   // M2HB receiver + barrel jacket
      M.box(-.50, -.08, ccy - .06, ccy + .06, 2.95, 3.07, gun);
      M.box(-.10, .12, ccy + .06, ccy + .20, 2.84, 2.98, crate);                                       // ammo box
      }
      M.box(.04, .26, -.72, -.50, zr - .02, zr + .07, hull); M.box(.06, .24, -.69, -.53, zr + .05, zr + .08, glass);   // gunner's periscope + guard
      L('z', [.04, .56, zr - .02], [[0, 0], [0, .24], [.03, .24], [.03, .20], [.07, .20], [.07, 0]], 28, hull);       // loader's hatch
      L('z', [.04, .56, zr + .05], [[0, 0], [0, .18], [.02, .18], [.02, 0]], 20, dark);
      L('z', [.12, .04, zr - .02], [[0, 0], [0, .16], [.05, .16], [.08, .12], [.08, 0]], 20, dark);                    // ventilator dome
      if (CAL) { M.grp = 0; L('z', [-1.95, -.85, 1.62], [[0, 0], [0, .06], [.08, .06], [.08, .035], [.15, .035], [.15, 0]], 12, dark); M.grp = 1; }   // antenna mount on the rear deck (clear of the launcher)
      else L('z', [-.98, .39, 2.50], [[0, 0], [0, .06], [.08, .06], [.08, .035], [.15, .035], [.15, 0]], 12, dark);        // antenna mount
      // left turret side: rectangular hinged panel (framed) + lifting eye; stars on both turret sides and both hull sides
      patchGrid(M, (x, z) => [x, turretY(x, z) + .006, z], -.77, -.31, 2.00, 2.39, 6, 4, 1, dark);
      patchGrid(M, (x, z) => [x, turretY(x, z) + .011, z], -.74, -.34, 2.03, 2.36, 6, 4, 1, hull);
      for (const sy of [-1, 1]) {
        starPatch(M, (x, z) => [x, sy * (turretY(x, z) + .012), z], sy > 0 ? .12 : -.46, 2.22, .30, sy, white);
        M.grp = 0; starPatch(M, (x, z) => [x, sy * (HW + .008), z], -.15, 1.52, .24, sy, white); M.grp = 1;
      }
      M.grp = 0;

      // ---- tracks & running gear (VVSS): 6 road wheels in 3 bogies, 3 return rollers, front sprocket, rear idler ----
      const C1 = [2.40, .75], R1 = .38, C2 = [-2.49, .74], R2 = .33, pts = [];
      const arc = (c, r, a0, a1, n) => { for (let k = 0; k <= n; k++) { const a = a0 + (a1 - a0) * k / n; pts.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]); } };
      arc(C1, R1, Math.PI / 2, -Math.PI * .34, 12);
      pts.push([2.00, .03], [-1.95, .03]);
      arc(C2, R2, -Math.PI * .40, -Math.PI * 1.5, 10);
      pts.push([-1.0, 1.06], [1.0, 1.11]);
      const n = pts.length, cen = [(C1[0] + C2[0]) / 2, .6], thick = .06, outer = pts, inner = pts.map((p, i) => {
        const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n]; let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
        let nx = -tz, nz = tx; if (nx * (cen[0] - p[0]) + nz * (cen[1] - p[1]) < 0) { nx = -nx; nz = -nz; } return [p[0] + nx * thick, p[1] + nz * thick];
      });
      const YA = .86, YB = 1.31, YC = (YA + YB) / 2;                       // track y-extent (outer edge flush with the hull side)
      for (const sy of [-1, 1]) {
        const ya = sy > 0 ? YA : -YB, yb = sy > 0 ? YB : -YA, f = sy > 0 ? 1 : -1;
        M.belt(outer, inner, ya, yb, trk);
        for (let i = 0; i < n; i++) {
          const a = outer[i], b = outer[(i + 1) % n], seg = Math.hypot(b[0] - a[0], b[1] - a[1]); if (seg < 1e-6) continue;
          let nx = (b[1] - a[1]) / seg, nz = -(b[0] - a[0]) / seg; if (nx * ((a[0] + b[0]) / 2 - cen[0]) + nz * ((a[1] + b[1]) / 2 - cen[1]) < 0) { nx = -nx; nz = -nz; }
          const cnt = Math.max(1, Math.round(seg / .17)), h = .035;
          for (let q = 0; q < cnt; q++) {
            const t0 = (q + .15) / cnt, t1 = (q + .62) / cnt, p0 = [a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0], p1 = [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1];
            M.hex8([[p0[0], ya, p0[1]], [p1[0], ya, p1[1]], [p1[0], yb, p1[1]], [p0[0], yb, p0[1]], [p0[0] + nx * h, ya, p0[1] + nz * h], [p1[0] + nx * h, ya, p1[1] + nz * h], [p1[0] + nx * h, yb, p1[1] + nz * h], [p0[0] + nx * h, yb, p0[1] + nz * h]], trkR);
          }
        }
        const yIn = sy > 0 ? .80 : -.96, yOut = sy > 0 ? .96 : -.80;
        for (const bx of [1.455, .057, -1.32]) {
          M.box(bx - .17, bx + .17, yIn, yOut, .50, 1.02, dark);                                          // bogie spring housing
          for (const dx of [-.10, 0, .10]) M.box(bx + dx - .015, bx + dx + .015, sy > 0 ? .955 : -.975, sy > 0 ? .975 : -.955, .56, .96, hull);   // spring slots
          M.box(bx - .42, bx + .42, yIn, yOut, .29, .37, dark);                                           // equaliser arms
          for (const dx of [-.405, .405]) {
            const x = bx + dx, RW = .265;
            L('y', [x, sy * YC, .335], [[-.08 * f, 0], [-.08 * f, RW, tyre], [.08 * f, RW, tyre], [.08 * f, RW - .07, tyre], [.06 * f, RW - .07, wheel], [.06 * f, .10, wheel], [.11 * f, .10, wheel], [.11 * f, 0, wheel]], 22, wheel);
          }
          L('y', [bx - .405, sy * YC, .94], [[-.06 * f, 0], [-.06 * f, .09, tyre], [.06 * f, .09, tyre], [.06 * f, .045, wheel], [.08 * f, .045, wheel], [.08 * f, 0, wheel]], 14, wheel);   // return roller (above the rear wheel of each bogie)
        }
        for (const [C, Rr, ns] of [[C1, .30, 13], [C2, .27, 8]]) {
          L('y', [C[0], sy * YC, C[1]], [[-.07 * f, Rr - .05], [-.07 * f, Rr], [.07 * f, Rr], [.07 * f, Rr - .05]], 24, wheel);
          L('y', [C[0], sy * YC, C[1]], [[-.08 * f, 0], [-.08 * f, .10, wheel], [.10 * f, .10, wheel], [.10 * f, 0, dark]], 16, wheel);
          for (let q = 0; q < ns; q++) { const a = q * Math.PI * 2 / ns + .2, ca = Math.cos(a), sa = Math.sin(a), w = .022, r0 = .08, r1 = Rr - .03;
            extrudeXZ(M, [[C[0] + ca * r0 - sa * w, C[1] + sa * r0 + ca * w], [C[0] + ca * r1 - sa * w, C[1] + sa * r1 + ca * w], [C[0] + ca * r1 + sa * w, C[1] + sa * r1 - ca * w], [C[0] + ca * r0 + sa * w, C[1] + sa * r0 - ca * w]], sy * YC - .03, sy * YC + .03, wheel); }
        }
      }
      if (opt.dozer) addDozerBlade(M, P);
      if (CAL) addCalliope(M, P);
      return M;
    }

    // ---------- M4A3E8 "Easy Eight" (76 mm M1A2 with muzzle brake, HVSS, T23 cast turret, wide hull with track guards) (metres; X forward, Y left, Z up; origin = hull centre on the ground) ----------
    // v82: measured from the M4A3E8 3-view drawing (side/plan ~63.5 px/m: 6.27 m hull length; front ~65 px/m for the 2.99 m width) + Tamiya colour plan + photos.
    //      47-deg welded glacis with large hatch coamings, rounded cast nose, full-length fender shelves with side rails / angled braces / wedge flaps, 2-row rear grille,
    //      T23 teardrop turret with rear bustle, M62 mantlet, long 76 mm gun + T-slot muzzle brake, commander's cupola with the M2 on a tall pintle, HVSS dual road wheels (6 in 3 bogies,
    //      horizontal volute spring units), 2 big return rollers, wide 23 in. tracks, white stars (glacis, hull sides, turret sides).
    function bar(M, a, b, w, m) {          // square-section bar from a to b
      const d = nrm(sub(b, a)), ref = Math.abs(d[0]) < .9 ? [1, 0, 0] : [0, 1, 0], u = nrm(cross(d, ref)), v = nrm(cross(d, u)), h = w / 2, c = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      const mk = p => c.map(([s, t]) => [p[0] + (u[0] * s + v[0] * t) * h, p[1] + (u[1] * s + v[1] * t) * h, p[2] + (u[2] * s + v[2] * t) * h]);
      M.hex8(mk(a).concat(mk(b)), m);
    }
    function buildEasyEight(paint) {
      const P = PAINT[paint] || PAINT.grey, M = new Mesh();
      const hull = M.mat(P.hull, { spec: .08 }), dark = M.mat(P.dark, { spec: .05 }), gun = M.mat(P.gun, { spec: .22, noise: .5 });
      const trk = M.mat([58, 54, 48], { spec: .06, noise: 1.4 }), trkR = M.mat([70, 64, 56], { shadow: false, noise: 1.4 }), tyre = M.mat([30, 31, 33], { noise: .6 }), wheel = M.mat(P.wheel, { spec: .12 });
      const glass = M.mat([20, 26, 30], { spec: .8, shadow: false, noise: 0 }), white = M.mat([252, 252, 244], { spec: .04, shadow: false, noise: 0 });
      const crate = M.mat([P.dark[0] + 16, P.dark[1] + 14, P.dark[2] + 6], { spec: .04 });
      const L = (ax, o, prof, seg, m) => M.lathe(ax, o, prof, seg, m);
      const HW = 1.34, FW = 1.48;                                       // upper hull half-width / fender (track guard) outer half-width
      const deckZ = x => x >= -.58 ? 1.97 : 1.97 - .195 * (-.58 - x);   // flat deck over the turret ring, engine deck falling toward the rear

      // ---- welded upper hull: 44-deg glacis, flat deck, sloping engine deck, sloped rear plate (one convex profile extruded across the width) ----
      const G0 = [2.35, 1.22], G1 = [1.58, 1.97];
      extrudeXZ(M, [G0, G1, [-.58, 1.97], [-2.58, 1.58], [-2.92, 1.22]], -HW, HW, hull);
      M.box(-2.85, 2.20, -.84, .84, .36, 1.22, dark);                                                       // lower hull between the tracks
      for (const sy of [-1, 1]) M.box(-2.85, 2.35, sy > 0 ? .84 : -HW, sy > 0 ? HW : -.84, 1.08, 1.22, dark);   // sponson underside above the track
      // rounded one-piece cast nose (final-drive housing) bulging out under the glacis
      { const NS = [[2.00, .86, 1.22, .36], [2.40, .84, 1.22, .34], [2.68, .76, 1.14, .38], [2.86, .60, 1.00, .50], [2.95, .40, .86, .62]];
        const xs = []; for (let i = 0; i < NS.length - 1; i++) for (let q = 0; q < 3; q++) xs.push(NS[i][0] + (NS[i + 1][0] - NS[i][0]) * q / 3); xs.push(NS[NS.length - 1][0]);
        const at = x => { let i = 0; while (i < NS.length - 2 && x > NS[i + 1][0]) i++; const a = NS[i], b = NS[i + 1], t = Math.max(0, Math.min(1, (x - a[0]) / (b[0] - a[0]))); return [1, 2, 3].map(q => a[q] + (b[q] - a[q]) * t); };
        smoothGrid(M, xs.map(x => { const h = at(x); return sqRing(x, h[0], h[1], h[2], 28, .55); }), hull, [-1, 0, 0], [1, 0, 0]); }
      // track guards: fender shelf (plan: chamfered inner front corner), sloped wedge flaps front and rear, outer side rail, angled braces
      const FEN = sy => [[2.75, sy * .84], [3.06, sy * 1.05], [3.06, sy * FW], [-2.95, sy * FW], [-2.95, sy * .84]];
      for (const sy of [-1, 1]) {
        loftXY(M, FEN(sy), FEN(sy), 1.16, 1.20, hull);
        extrudeXZ(M, [[3.13, .77], [2.95, 1.04], [2.78, 1.19], [2.62, 1.19], [2.62, 1.12], [2.85, .92]], sy > 0 ? .84 : -FW, sy > 0 ? FW : -.84, hull);   // front flap
        extrudeXZ(M, [[-3.10, .77], [-2.92, 1.19], [-2.70, 1.19], [-2.70, 1.12], [-2.97, .92]], sy > 0 ? .84 : -FW, sy > 0 ? FW : -.84, hull);               // rear flap
        extrudeXZ(M, [[3.13, .77], [1.83, 1.03], [-1.95, 1.03], [-3.10, .77], [-2.92, 1.20], [2.78, 1.20]], sy > 0 ? FW - .04 : -FW, sy > 0 ? FW : -FW + .04, hull);   // outer rail
        for (const x of [1.70, 1.54, .99, .38, .06, -.25, -.57, -.80, -1.51, -1.81, -2.06, -2.19]) bar(M, [x, sy * (HW + .01), 1.40], [x, sy * (FW - .04), 1.20], .035, dark);   // angled fender braces
      }
      // glacis fittings: large hatch coamings with periscope blocks on the deck, bow MG ball (right), headlamp guards, tow lugs, white star
      for (const sy of [-1, 1]) {
        L('z', [1.32, sy * .52, 1.95], [[0, 0], [0, .30], [.05, .30], [.05, .24], [.10, .24], [.10, 0]], 28, hull);                   // hatch coaming ring
        L('z', [1.32, sy * .52, 2.00], [[0, 0], [0, .20], [.02, .20], [.02, 0]], 22, dark);                                              // hatch lid
        M.box(1.50, 1.58, sy * .52 - .08, sy * .52 + .08, 2.00, 2.07, glass);                                                           // periscope head
        plateBlock(M, G0, G1, .34, sy * .96, .17, .17, .055, dark); plateBlock(M, G0, G1, .34, sy * .96, .10, .10, .075, glass);        // headlamp + lens
        plateBlock(M, G0, G1, .41, sy * .96, .20, .03, .06, dark);                                                                      // lamp guard bar
        M.box(1.58, 1.66, sy * 1.36 - .05, sy * 1.36 + .05, 1.78, 1.88, dark);                                                          // clearance lamp
      }
      plateBlock(M, G0, G1, .21, -.50, .34, .34, .04, hull); mgBall(M, G0, G1, .21, -.50, dark, gun);
      starPlane(M, G0, G1, .60, .12, .22, white);
      for (const sy of [-1, 1]) bar(M, [2.50, sy * .40, .88], [2.84, sy * .40, .66], .07, dark);                                         // tow lugs on the nose
      // engine deck: sloping deck with a slatted radiator grille (4 louvred cells), filler caps, rear plate grille + stowage bar
      { const x0 = -1.32, x1 = -2.06; extrudeXZ(M, [[x0, deckZ(x0) + .05], [x1, deckZ(x1) + .05], [x1, deckZ(x1) - .03], [x0, deckZ(x0) - .03]], -.74, .74, dark);
        for (let k = 0; k < 8; k++) { const x = x0 - .045 - k * .09; M.box(x - .022, x + .022, -.72, .72, deckZ(x) + .045, deckZ(x) + .07, glass); }
        for (const y of [-.37, 0, .37]) M.box(x1 - .0, x0, y - .012, y + .012, deckZ(x0) + .02, deckZ(x1) + .08, hull); }
      for (const [cx, cy, r] of [[-.95, -1.00, .13], [-.95, 1.00, .13], [-2.30, -1.0, .10], [-2.30, 1.0, .10]]) L('z', [cx, cy, deckZ(cx) - .03], [[0, 0], [0, r], [.05, r], [.05, r * .6], [.07, r * .6], [.07, 0]], 16, dark);
      M.box(-2.99, -2.84, -.78, .78, .60, .98, dark); for (let k = 0; k < 5; k++) M.box(-3.02, -2.98, -.74, .74, .64 + k * .07, .68 + k * .07, glass);   // rear grille
      M.box(-2.96, -2.84, -.06, .06, .38, 1.12, dark);
      for (const sy of [-1, 1]) M.box(-2.98, -2.90, sy * 1.12 - .12, sy * 1.12 + .12, .80, 1.10, hull);                                    // rear fender boxes

      M.grp = 1;   // v192: turret part (rotates on its own)
      // ---- T23 cast turret: teardrop plan (round front, tapering rear bustle that overhangs the deck), rounded roof edge ----
      const XA = .30, R0 = 1.12, XF0 = 1.28, XR0 = -1.50;
      const Y0 = x => x >= XA ? R0 * Math.sqrt(Math.max(0, 1 - Math.pow((x - XA) / (XF0 - XA), 2))) : R0 - .30 * (Math.sqrt((XA - x) * (XA - x) + .09) - .3);
      const zsT = [1.90, 1.95, 2.15, 2.40, 2.55, 2.66, 2.70], XFt = [1.28, 1.28, 1.28, 1.25, .95, .65, .58], XRt = [-.60, -.70, -1.20, -1.52, -1.52, -1.50, -1.45], Wt = [1.0, 1.0, 1.0, 1.0, .97, .92, .88];
      const lerpT = (arr, z) => { if (z <= zsT[0]) return arr[0]; for (let i = 0; i < zsT.length - 1; i++) if (z <= zsT[i + 1]) return arr[i] + (arr[i + 1] - arr[i]) * (z - zsT[i]) / (zsT[i + 1] - zsT[i]); return arr[zsT.length - 1]; };
      const baseRing = () => { const NF = 14, NR = 12, half = [];
        for (let i = 1; i <= NF; i++) { const th = i / NF * Math.PI / 2; half.push([XA + (XF0 - XA) * Math.cos(th), R0 * Math.sin(th)]); }
        for (let j = 1; j <= NR; j++) { const x = XA - (XA - XR0) * j / NR; half.push([x, Y0(x)]); }
        const yr = Y0(XR0), ring = [[XF0, 0]].concat(half, [[XR0, yr * .5], [XR0, 0], [XR0, -yr * .5]]);
        for (let k = half.length - 1; k >= 0; k--) ring.push([half[k][0], -half[k][1]]);
        return ring; };
      const BR = baseRing();
      { const rings = []; for (let i = 0, NZ = 16; i <= NZ; i++) { const z = zsT[0] + (zsT[6] - zsT[0]) * i / NZ, xf = lerpT(XFt, z), xr = lerpT(XRt, z), w = lerpT(Wt, z);
          rings.push(BR.map(([x, y]) => [x >= XA ? XA + (x - XA) * (xf - XA) / (XF0 - XA) : XA + (x - XA) * (XA - xr) / (XA - XR0), y * w, z])); }
        smoothGrid(M, rings, hull, [0, 0, -1], [0, 0, 1]); }
      const turretY = (x, z) => { const xf = lerpT(XFt, z), xr = lerpT(XRt, z), x0 = x >= XA ? XA + (x - XA) * (XF0 - XA) / (xf - XA) : XA + (x - XA) * (XA - XR0) / (XA - xr); return lerpT(Wt, z) * Y0(x0); };
      L('z', [.05, 0, 1.92], [[0, 0], [0, 1.18], [.07, 1.18], [.07, 0]], 44, dark);                  // turret ring
      // M62 mantlet (wide cast shield with cloth-cover bulge), thick sleeve, 76 mm gun tube, T-slot muzzle brake
      { const rings = [[1.02, .70, .27], [1.22, .69, .27], [1.40, .62, .25], [1.50, .50, .21]].map(([x, W, H]) => sqRing(x, W, 2.30 + H, 2.30 - H, 28, .55));
        smoothGrid(M, rings, hull, [-1, 0, 0], [1, 0, 0]); }
      L('x', [1.48, 0, 2.30], [[0, 0], [0, .165], [.10, .165], [.10, .125], [.20, .122], [.20, 0]], 22, gun);
      L('x', [1.66, 0, 2.30], [[0, 0], [0, .092], [.45, .088], [2.25, .077], [2.29, .081], [2.29, 0]], 18, gun);
      { const mx = 3.95; L('x', [mx, 0, 2.30], [[0, 0], [0, .105], [.03, .125], [.47, .125], [.51, .105], [.51, 0]], 20, gun);
        for (const t of [.14, .30]) L('x', [mx + t, 0, 2.30], [[0, .120], [.045, .126, dark], [.045, .120]], 20, dark);                       // slot grooves
        L('x', [mx + .51, 0, 2.30], [[0, 0], [0, .06, dark], [.01, .06, dark], [.01, 0]], 12, dark); }                                      // bore
      M.box(1.38, 1.46, .28, .40, 2.38, 2.48, glass);                                                                                       // sight opening
      L('x', [1.46, -.22, 2.20], [[0, 0], [0, .03], [.05, .03], [.05, 0]], 10, dark);                                                       // co-axial MG
      // roof: commander's vision cupola + M2 .50 cal on a tall pintle (right rear), loader's big round hatch (left), vent, periscope guard, antenna base, lifting hooks
      const zr = 2.69, ccx = -.19, ccy = -.44;
      L('z', [ccx, ccy, zr - .02], [[0, 0], [0, .43], [.06, .43], [.06, .35], [.14, .35], [.14, 0]], 36, hull);
      L('z', [ccx, ccy, zr + .12], [[0, 0], [0, .27], [.03, .27], [.06, .22], [.06, 0]], 28, dark);
      for (let k = 0; k < 7; k++) { const a = k * Math.PI * 2 / 7 + .2; M.box(ccx + Math.cos(a) * .34 - .045, ccx + Math.cos(a) * .34 + .045, ccy + Math.sin(a) * .34 - .045, ccy + Math.sin(a) * .34 + .045, zr + .06, zr + .15, glass); }
      L('z', [-.70, ccy, zr - .04], [[0, 0], [0, .045], [.59, .045], [.59, .07], [.68, .07], [.68, 0]], 12, dark);                          // MG pintle mast
      L('x', [-.27, ccy, 3.34], [[0, 0], [0, .045], [.30, .045], [.30, .03], [.65, .03], [.65, 0]], 12, gun);                                // M2 barrel + jacket
      M.box(-1.32, -.27, ccy - .065, ccy + .065, 3.27, 3.41, gun);                                                                          // M2 receiver
      M.box(-.90, -.45, ccy + .065, ccy + .20, 3.14, 3.30, crate);                                                                          // ammo box
      L('z', [-.17, .39, zr - .02], [[0, 0], [0, .29], [.04, .29], [.04, .24], [.08, .24], [.08, 0]], 28, hull);
      L('z', [-.17, .39, zr + .05], [[0, 0], [0, .22], [.02, .22], [.02, 0]], 22, dark);
      L('z', [.28, .24, zr - .02], [[0, 0], [0, .12], [.05, .12], [.07, .09], [.07, 0]], 16, dark);                                          // vent dome
      M.box(.50, .70, -.72, -.46, zr - .02, zr + .07, hull); M.box(.54, .66, -.68, -.50, zr + .05, zr + .08, glass);                       // gunner's periscope + guard
      L('z', [-1.00, -.45, zr - .02], [[0, 0], [0, .06], [.08, .06], [.08, .035], [.15, .035], [.15, 0]], 12, dark);                       // antenna mount
      for (const sy of [-1, 1]) M.box(-1.45, -1.36, sy * .50 - .03, sy * .50 + .03, 2.38, 2.54, dark);                                      // rear lifting hooks
      // left turret side: framed rectangular panel + hook; stars on turret sides and hull sides
      patchGrid(M, (x, z) => [x, turretY(x, z) + .006, z], -.60, -.12, 2.08, 2.52, 6, 4, 1, dark);
      patchGrid(M, (x, z) => [x, turretY(x, z) + .011, z], -.57, -.15, 2.12, 2.48, 6, 4, 1, hull);
      for (const sy of [-1, 1]) {
        starPatch(M, (x, z) => [x, sy * (turretY(x, z) + .012), z], sy > 0 ? .32 : -.78, 2.33, .28, sy, white);
        M.grp = 0; starPatch(M, (x, z) => [x, sy * (HW + .008), z], -.40, 1.55, .25, sy, white); M.grp = 1;   // hull star
      }

      M.grp = 0;
      // ---- tracks & running gear (HVSS): 6 dual road wheels in 3 bogies with horizontal volute spring units, 2 return rollers, spoked front sprocket, rear idler, wide 23 in. tracks ----
      const C1 = [2.50, .76], R1 = .40, C2 = [-2.39, .70], R2 = .33, pts = [];
      const arc = (c, r, a0, a1, n) => { for (let k = 0; k <= n; k++) { const a = a0 + (a1 - a0) * k / n; pts.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]); } };
      arc(C1, R1, Math.PI / 2, -Math.PI * .31, 12);
      pts.push([2.00, .03], [-1.95, .03]);
      arc(C2, R2, -Math.PI * .40, -Math.PI * 1.5, 10);
      pts.push([-1.0, 1.05], [1.0, 1.06]);
      const n = pts.length, cen = [(C1[0] + C2[0]) / 2, .6], thick = .06, outer = pts, inner = pts.map((p, i) => {
        const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n]; let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
        let nx = -tz, nz = tx; if (nx * (cen[0] - p[0]) + nz * (cen[1] - p[1]) < 0) { nx = -nx; nz = -nz; } return [p[0] + nx * thick, p[1] + nz * thick];
      });
      const YA = .84, YB = 1.49, YC = (YA + YB) / 2;
      for (const sy of [-1, 1]) {
        const ya = sy > 0 ? YA : -YB, yb = sy > 0 ? YB : -YA, f = sy > 0 ? 1 : -1;
        M.belt(outer, inner, ya, yb, trk);
        for (let i = 0; i < n; i++) {
          const a = outer[i], b = outer[(i + 1) % n], seg = Math.hypot(b[0] - a[0], b[1] - a[1]); if (seg < 1e-6) continue;
          let nx = (b[1] - a[1]) / seg, nz = -(b[0] - a[0]) / seg; if (nx * ((a[0] + b[0]) / 2 - cen[0]) + nz * ((a[1] + b[1]) / 2 - cen[1]) < 0) { nx = -nx; nz = -nz; }
          const cnt = Math.max(1, Math.round(seg / .17)), h = .035;
          for (let q = 0; q < cnt; q++) {
            const t0 = (q + .15) / cnt, t1 = (q + .62) / cnt, p0 = [a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0], p1 = [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1];
            M.hex8([[p0[0], ya, p0[1]], [p1[0], ya, p1[1]], [p1[0], yb, p1[1]], [p0[0], yb, p0[1]], [p0[0] + nx * h, ya, p0[1] + nz * h], [p1[0] + nx * h, ya, p1[1] + nz * h], [p1[0] + nx * h, yb, p1[1] + nz * h], [p0[0] + nx * h, yb, p0[1] + nz * h]], trkR);
          }
        }
        for (const bx of [1.60, .12, -1.32]) {
          M.box(bx - .20, bx + .20, sy > 0 ? .70 : -.96, sy > 0 ? .96 : -.70, .60, 1.06, dark);                                              // bogie bracket on the hull side
          L('x', [bx - .34, sy * .86, .66], [[0, 0], [0, .085], [.68, .085], [.68, 0]], 14, dark);                                           // horizontal volute spring unit
          for (const dx of [-.2, .2]) L('x', [bx + dx - .06, sy * .86, .66], [[0, .095], [.12, .095, hull], [.12, .0]], 14, hull);
          M.box(bx - .43, bx + .43, sy > 0 ? .90 : -.96, sy > 0 ? .96 : -.90, .30, .38, dark);                                               // bogie arms
          for (const dx of [-.43, .43]) {
            const x = bx + dx, RW = .265;
            for (const o of [-.135, .135]) L('y', [x, sy * (YC + o), .335], [[-.065 * f, 0], [-.065 * f, RW, tyre], [.065 * f, RW, tyre], [.065 * f, RW - .075, tyre], [.05 * f, RW - .075, wheel], [.05 * f, .09, wheel], [.065 * f, .09, wheel], [.065 * f, 0, wheel]], 22, wheel);
            L('y', [x, sy * YC, .335], [[-.17 * f, 0], [-.17 * f, .10, wheel], [.17 * f, .10, wheel], [.17 * f, 0, dark]], 14, wheel);       // hub
          }
          L('y', [bx, sy * .93, .93], [[-.05 * f, 0], [-.05 * f, .08, tyre], [.05 * f, .08, tyre], [.05 * f, 0, wheel]], 12, wheel);        // roller carrier cap on the bogie top
        }
        for (const rx of [.87, -.61]) {
          M.box(rx - .06, rx + .06, sy > 0 ? .86 : -1.03, sy > 0 ? 1.03 : -.86, .86, 1.10, dark);                                           // return roller bracket
          L('y', [rx, sy * YC, .89], [[-.06 * f, 0], [-.06 * f, .16, tyre], [.06 * f, .16, tyre], [.06 * f, .08, wheel], [.09 * f, .08, wheel], [.09 * f, 0, wheel]], 18, wheel);
        }
        for (const [C, Rr, ns] of [[C1, .34, 13], [C2, .27, 8]]) {
          for (const o of [-.15, .15]) L('y', [C[0], sy * (YC + o), C[1]], [[-.04 * f, Rr - .05], [-.04 * f, Rr], [.04 * f, Rr], [.04 * f, Rr - .05]], 24, wheel);
          L('y', [C[0], sy * YC, C[1]], [[-.17 * f, 0], [-.17 * f, .10, wheel], [.17 * f, .10, wheel], [.17 * f, 0, dark]], 16, wheel);
          for (let q = 0; q < ns; q++) { const a = q * Math.PI * 2 / ns + .2, ca = Math.cos(a), sa = Math.sin(a), w = .022, r0 = .08, r1 = Rr - .03;
            extrudeXZ(M, [[C[0] + ca * r0 - sa * w, C[1] + sa * r0 + ca * w], [C[0] + ca * r1 - sa * w, C[1] + sa * r1 + ca * w], [C[0] + ca * r1 + sa * w, C[1] + sa * r1 - ca * w], [C[0] + ca * r0 + sa * w, C[1] + sa * r0 - ca * w]], sy * YC - .15, sy * YC + .15, wheel); }
        }
      }
      return M;
    }

    // ======================================================================
    // M1 bulldozer kit for the Sherman (124 in straight blade, push arms, lift frame + hydraulic jack under an armoured cover)
    // Dimensions follow the Britannica side view (scale ~193 px/m, sprocket hub at x = 2.40, z = .75): blade face at x = 4.07, cutting edge tip at x = 4.33,
    // push arms along the outside of the tracks (z .31-.51) pivoting at x = -0.24..0.69 on the hull sides.
    // ======================================================================
    function addDozerBlade(M, P) {
      const hull = M.mat(P.hull, { spec: .08, noise: .8 }), dark = M.mat(P.dark, { spec: .05 }), steel = M.mat([86, 84, 72], { spec: .22, noise: 1.2 });
      const BW = 1.575, T = .07;                                                          // blade half-width (124 in wide) and plate thickness
      const L = (ax, o, prof, seg, m) => M.lathe(ax, o, prof, seg, m);
      // ---- mouldboard: three slabs following the curved face (vertical lower face, leaning top, rolled-back lip) ----
      const F = [[4.07, .26], [4.07, .98], [4.03, 1.30], [3.94, 1.41]];
      for (let i = 0; i < F.length - 1; i++) extrudeXZ(M, [F[i], F[i + 1], [F[i + 1][0] - T, F[i + 1][1]], [F[i][0] - T, F[i][1]]], -BW, BW, hull);
      // cutting-edge shoe: plough lip sloping down-forward to the ground + steel edge strip + bolt row
      extrudeXZ(M, [[4.30, .015], [4.33, .06], [4.10, .30], [4.01, .22]], -BW, BW, hull);
      extrudeXZ(M, [[4.335, 0], [4.37, .05], [4.325, .098], [4.28, .045]], -BW, BW, steel);
      for (let k = -7; k <= 7; k++) M.box(4.135, 4.175, k * .2 - .022, k * .2 + .022, .235, .262, dark);
      // top roll bar + back-face stiffening ribs (triangular gussets) + lower cross beam
      L('y', [3.93, 0, 1.40], [[-BW, 0], [-BW, .045], [BW, .045], [BW, 0]], 10, dark);
      for (const y of [-1.05, -.52, 0, .52, 1.05]) extrudeXZ(M, [[3.52, .27], [4.00, .27], [3.95, 1.26]], y - .03, y + .03, dark);
      M.box(3.17, 3.30, -BW + .02, BW - .02, .32, .46, dark);
      // floor plate between the arms (triangular in plan, trapezoid here) behind the lip
      loftXY(M, [[4.03, -1.12], [4.03, 1.12], [3.30, .60], [3.30, -.60]], [[4.03, -1.12], [4.03, 1.12], [3.30, .60], [3.30, -.60]], .20, .25, hull);
      // ---- end plates (large triangular side plates with a lightening slot) ----
      const EP = [[4.07, .26], [4.07, 1.34], [3.90, 1.41], [3.19, .62], [3.19, .31], [3.45, .25]];
      for (const sy of [-1, 1]) {
        extrudeXZ(M, EP, sy > 0 ? BW - .075 : -BW, sy > 0 ? BW : -BW + .075, hull);
        M.box(3.55, 3.88, sy > 0 ? BW - .003 : -BW - .003, sy > 0 ? BW + .003 : -BW + .003, .52, .76, dark);
        M.box(3.58, 3.85, sy > 0 ? BW - .006 : -BW - .002, sy > 0 ? BW + .002 : -BW + .006, .55, .73, steel);
      }
      // ---- push arms (box beams outside the tracks) + pivot brackets on the hull sides ----
      const BR = [[.69, .51], [.69, .36], [-.22, .34], [-.26, .60], [-.12, .84], [.30, .84]];
      for (const sy of [-1, 1]) {
        const ya = sy > 0 ? 1.355 : -1.52, yb = sy > 0 ? 1.52 : -1.355;
        M.box(.40, 3.22, ya, yb, .31, .51, hull);
        M.box(.40, 3.22, sy > 0 ? 1.52 : -1.54, sy > 0 ? 1.54 : -1.52, .335, .485, dark);          // arm outer reinforcement strip
        extrudeXZ(M, BR, sy > 0 ? 1.335 : -1.54, sy > 0 ? 1.54 : -1.335, hull);
        L('y', [.06, sy * 1.545, .60], [[0, 0], [0, .075], [sy * .035, .075], [sy * .035, .045], [sy * .05, .045], [sy * .05, 0]], 14, dark);   // pivot pin + cap
        for (const [bx, bz] of [[-.08, .46], [.20, .46], [.40, .68]]) L('y', [bx, sy * 1.545, bz], [[0, 0], [0, .022], [sy * .02, .022], [sy * .02, 0]], 8, dark);   // bolt heads
        M.box(.70, .78, sy * 1.43 - .06, sy * 1.43 + .06, .38, .49, dark);                         // arm / bracket joint block
      }
      // ---- lift frame: armoured cover (wedge) over the hydraulic jack, jack cylinder with collars, drawbar, hull mounts ----
      extrudeXZ(M, [[3.57, 1.27], [3.18, 1.52], [2.87, .69], [3.23, .69]], -.36, .36, hull);        // armoured cover wedge
      M.box(2.96, 3.17, -.19, .19, 1.30, 1.56, dark);                                                // cover top box (jack head)
      M.box(3.01, 3.12, -.15, .15, 1.34, 1.52, hull);
      bar(M, [3.02, 0, 1.46], [2.70, 0, .84], .13, steel);                                          // hydraulic jack cylinder
      bar(M, [2.90, 0, 1.22], [2.84, 0, 1.08], .19, dark);                                           // jack collar
      bar(M, [2.80, 0, 1.02], [2.76, 0, .94], .17, dark);
      bar(M, [2.62, 0, .70], [3.78, 0, .62], .13, dark);                                             // central drawbar (blade A-frame stem)
      for (const sy of [-1, 1]) {
        bar(M, [2.62, sy * .34, .62], [3.30, sy * .34, .90], .10, dark);                            // frame struts from the hull nose up to the cover
        M.box(2.50, 2.72, sy * .92 - .07, sy * .92 + .07, .52, .66, dark);                          // front hull mounting brackets
      }
      M.box(2.62, 2.74, -.30, .30, .58, .74, dark);
    }
    function buildShermanDozer(paint) { return buildSherman(paint, { howitzer: true, dozer: true }); }

    // ======================================================================
    // M4 (welded hull) Sherman carrying the T34 "Calliope" 60-tube 4.5 in rocket launcher ("Whizbang")
    // Launcher geometry measured from the side view (~103 px/m): tube block 2.3 m long x 2.34 m wide, front up 5.7 deg, two rows x ten tube openings
    // behind a recessed grid, fish-tail cheek plates at the muzzle end, rear support posts + trunnion blocks, elevating arm clamped to the 75 mm gun barrel (M4 turret / M34 mantlet).
    // ======================================================================
    function addCalliope(M, P) {
      const hull = M.mat(P.hull, { spec: .08, noise: .8 }), dark = M.mat(P.dark, { spec: .05 }), steel = M.mat([86, 84, 72], { spec: .22, noise: 1.2 }), bore = M.mat([10, 12, 14], { shadow: false, noise: 0 });
      const L = (ax, o, prof, seg, m) => M.lathe(ax, o, prof, seg, m);
      const XB = .96, XF = 1.13, XR = -1.20, WY = 1.17, XG = .945;                           // recessed tube face, frame front, rear end, half-width, dark face
      const zt = x => 3.95 - .10 * (XF - x), zb = x => 3.29 - .047 * (XF - x), zm = x => (zt(x) + zb(x)) / 2;   // top / bottom / mid heights of the tilted block
      extrudeXZ(M, [[XB, zb(XB)], [XR, zb(XR)], [XR, zt(XR)], [XB, zt(XB)]], -WY, WY, hull);       // tube block
      M.box(XG, XB + .004, -WY + .06, WY - .06, zb(XB) + .06, zt(XB) - .06, bore);                  // dark tube openings face
      // front frame: top / bottom / middle bars, two end posts and nine tube dividers
      extrudeXZ(M, [[XG, zt(XG) - .07], [XF, zt(XF) - .07], [XF, zt(XF)], [XG, zt(XG)]], -WY, WY, hull);
      extrudeXZ(M, [[XG, zb(XG)], [XF, zb(XF)], [XF, zb(XF) + .07], [XG, zb(XG) + .07]], -WY, WY, hull);
      extrudeXZ(M, [[XG, zm(XG) - .018], [XF, zm(XF) - .018], [XF, zm(XF) + .018], [XG, zm(XG) + .018]], -WY + .05, WY - .05, hull);
      const vq = [[XG, zb(XG) + .07], [XF, zb(XF) + .07], [XF, zt(XF) - .07], [XG, zt(XG) - .07]], w = .1905, d = .035;
      extrudeXZ(M, vq, -WY, -WY + .06, hull); extrudeXZ(M, vq, WY - .06, WY, hull);
      for (let j = 1; j <= 9; j++) { const y0 = -WY + .06 + j * (w + d) - d; extrudeXZ(M, vq, y0, y0 + d, hull); }
      // top cover plate with three stiffener ribs, dark under-plate and the elevating rack strip
      extrudeXZ(M, [[XF, zt(XF)], [XR - .02, zt(XR - .02)], [XR - .02, zt(XR - .02) + .035], [XF, zt(XF) + .035]], -WY - .02, WY + .02, hull);
      for (const y of [-.80, 0, .80]) extrudeXZ(M, [[XF - .12, zt(XF - .12) + .035], [XR + .10, zt(XR + .10) + .035], [XR + .10, zt(XR + .10) + .062], [XF - .12, zt(XF - .12) + .062]], y - .045, y + .045, hull);
      extrudeXZ(M, [[XB, zb(XB) - .035], [XR, zb(XR) - .035], [XR, zb(XR)], [XB, zb(XB)]], -WY + .03, WY - .03, dark);
      extrudeXZ(M, [[.95, zb(.95) - .075], [-.40, zb(-.40) - .075], [-.40, zb(-.40) - .035], [.95, zb(.95) - .035]], -.05, .05, steel);
      // fish-tail cheek plates (two lobes) at the muzzle end of both sides
      for (const sy of [-1, 1]) {
        const ya = sy > 0 ? WY - .05 : -WY - .02, yb = sy > 0 ? WY + .02 : -WY + .05;
        extrudeXZ(M, [[XF - .02, zt(XF)], [1.50, 4.00], [1.50, 3.66], [1.30, 3.58], [XF - .02, 3.54]], ya, yb, hull);
        extrudeXZ(M, [[XF - .02, 3.49], [1.30, 3.45], [1.46, 3.37], [1.46, 3.27], [XF - .02, zb(XF)]], ya, yb, hull);
        // rear support post, trunnion block and pivot cap
        const pa = sy > 0 ? 1.00 : -1.14, pb = sy > 0 ? 1.14 : -1.00, ta = sy > 0 ? .98 : -1.22, tb = sy > 0 ? 1.22 : -.98;
        M.box(-.95, -.77, pa, pb, 1.66, 3.04, hull);
        extrudeXZ(M, [[-.57, 2.94], [-1.17, 2.94], [-1.17, zb(-1.17) + .01], [-.57, zb(-.57) + .01]], ta, tb, hull);
        L('y', [-.88, sy * (WY - .005), 3.49], [[0, 0], [0, .075], [sy * .035, .075], [sy * .035, 0]], 14, dark);
        M.box(-1.10, -.62, sy * 1.23 - .02, sy * 1.23 + .02, 3.02, 3.14, dark);
      }
      // elevating arm from the launcher cradle down to a clamp on the gun barrel
      extrudeXZ(M, [[.74, 3.30], [1.02, 3.30], [1.38, 2.28], [1.12, 2.28]], -.19, .19, hull);
      M.box(.68, 1.08, -.23, .23, 3.18, 3.33, dark);
      L('x', [1.28, 0, 2.16], [[0, 0], [0, .155], [.32, .155], [.32, 0]], 20, dark);
    }
    function buildWhizbang(paint) { return buildSherman(paint, { calliope: true }); }

    // ======================================================================
    // M26 Pershing (metres; X forward, Y left, Z up; origin = hull centre on the ground)
    // Measured from the T26E5 / M26 3-view drawing (side ~81.5 px/m, plan ~84.5 px/m, front ~85.5 px/m; hull 6.2 m, 8.5 m with the gun, width 3.51 m over the tracks):
    //   long cast "chin" nose with wide track-guard hoods, flat fender decks with five stowage bins per side, hull deck with a gently sloped engine deck and rear louvres,
    //   cast teardrop turret (ring centre 0.30 m ahead of the hull centre) with a big cast mantlet, 90 mm M3 gun with the double-baffle muzzle brake,
    //   commander's cupola (right) with the .50 cal M2, loader's hatch (left), spare-track rack on the left turret side,
    //   torsion-bar running gear: six dual 0.66 m road wheels, five return rollers, front idler, rear drive sprocket.
    // ======================================================================
    function buildPershing(paint) {
      const P = PAINT[paint] || PAINT.grey, M = new Mesh();
      const hull = M.mat(P.hull, { spec: .08 }), dark = M.mat(P.dark, { spec: .05 }), gun = M.mat(P.gun, { spec: .22, noise: .5 });
      const trk = M.mat([58, 54, 48], { spec: .06, noise: 1.4 }), trkR = M.mat([70, 64, 56], { shadow: false, noise: 1.4 }), tyre = M.mat([30, 31, 33], { noise: .6 }), wheel = M.mat(P.wheel, { spec: .12 });
      const glass = M.mat([20, 26, 30], { spec: .8, shadow: false, noise: 0 }), white = M.mat([252, 252, 244], { spec: .04, shadow: false, noise: 0 });
      const crate = M.mat([P.dark[0] + 16, P.dark[1] + 14, P.dark[2] + 6], { spec: .04 }), canvas = M.mat([P.hull[0] + 20, P.hull[1] + 16, P.hull[2] + 4], { spec: .02, noise: 1.3 });
      const steel = M.mat([84, 82, 72], { spec: .22, noise: 1.2 }), grille = M.mat([30, 32, 30], { shadow: false, noise: .6 });
      const L = (ax, o, prof, seg, m) => M.lathe(ax, o, prof, seg, m);
      const HW = 1.10, YA = 1.11, YB = 1.755, YC = (YA + YB) / 2;                   // hull half-width, track y-range (width .645) and its centre

      // ---- hull: central body (flat deck, gently rising glacis deck, sloped engine deck, rounded rear plate), cast "chin" nose, track-guard hoods ----
      extrudeXZ(M, [[2.39, 1.34], [2.02, 1.52], [1.47, 1.58], [-1.45, 1.58], [-2.15, 1.50], [-2.88, 1.33], [-3.03, 1.23], [-3.07, 1.10], [-2.98, .80], [-2.60, .48], [2.40, .48]], -HW, HW, hull);
      const N = [[3.09, .97], [3.04, 1.10], [2.94, 1.23], [2.82, 1.31], [2.76, 1.335], [1.50, 1.335], [1.53, 1.10], [1.72, 1.08], [1.96, 1.02], [2.27, .96], [2.58, .91], [2.88, .90]];
      for (const sy of [-1, 1]) extrudeXZ(M, N, sy > 0 ? HW - .02 : -YB, sy > 0 ? YB : -HW + .02, hull);                                  // hoods over the idlers
      extrudeXZ(M, [[2.95, .99], [2.92, 1.10], [2.86, 1.22], [2.80, 1.30], [2.76, 1.335], [1.50, 1.335], [1.53, 1.10], [1.72, 1.08], [1.96, 1.02], [2.27, .96], [2.58, .92], [2.80, .92]], -HW, HW, hull);   // central nose
      extrudeXZ(M, [[2.84, .92], [2.74, .60], [2.40, .48], [2.40, .94]], -HW, HW, dark);                                                   // lower front plate
      starPlane(M, [3.00, .995], [2.74, 1.335], .50, 0, .17, white);                                                                       // nose star
      for (const sy of [-1, 1]) {
        M.box(2.84, 3.00, sy * .56 - .045, sy * .56 + .045, .84, .96, dark);                                                                  // front tow lugs
        M.box(2.93, 3.02, sy * .56 - .06, sy * .56 + .06, .87, .93, steel);
      }
      // fender decks + side aprons + five stowage bins per side (tops at z 1.52), rolled canvas along the outer edge, jerry cans at the rear
      for (const sy of [-1, 1]) {
        const ya = sy > 0 ? HW : -YB, yb = sy > 0 ? YB : -HW, yo = sy > 0 ? YB - .03 : -YB;
        M.box(-2.80, 1.52, ya, yb, 1.285, 1.335, hull);                                                                                       // fender deck
        M.box(-2.62, 1.55, yo, yo + .03, 1.10, 1.335, hull);                                                                                  // side apron (visible band under the bins)
        M.box(-2.80, -2.62, ya, yb, 1.15, 1.335, hull);                                                                                       // rear fender end
        for (let k = 0; k < 5; k++) {                                                                                                         // stowage bins (ammunition / ration boxes)
          const x1 = 1.72 - k * .74, x0 = x1 - .70, y0 = sy > 0 ? 1.21 : -1.68, y1 = sy > 0 ? 1.68 : -1.21;
          M.box(x0, x1, y0, y1, 1.335, 1.50, crate);
          M.box(x0 + .02, x1 - .02, y0 + .02, y1 - .02, 1.50, 1.52, hull);                                                                   // lid
          M.box(x0 + .30, x0 + .40, (y0 + y1) / 2 - .06, (y0 + y1) / 2 + .06, 1.52, 1.545, dark);                                           // lid handle
        }
        L('x', [1.70, sy * 1.725, 1.405], [[0, 0], [0, .06], [-3.55, .06], [-3.55, 0]], 10, canvas);                                          // canvas roll along the outer edge
        M.box(-2.55, -2.17, sy * 1.45 - .10, sy * 1.45 + .10, 1.335, 1.62, crate); M.box(-2.52, -2.20, sy * 1.45 - .02, sy * 1.45 + .02, 1.62, 1.68, dark);   // jerry can
        L('z', [2.70, sy * 1.45, 1.335], [[0, 0], [0, .05], [.10, .05], [.10, .035], [.14, .035], [.14, 0]], 12, dark);                      // blackout lamp on the hood
      }
      // glacis deck: driver / co-driver hatches, bow MG ball (right), periscope blocks, tow cable bars
      for (const sy of [-1, 1]) {
        L('z', [2.06, sy * .78, 1.47], [[0, 0], [0, .20], [.04, .20], [.04, .16], [.10, .16], [.10, 0]], 24, hull);
        L('z', [2.06, sy * .78, 1.57], [[0, 0], [0, .13], [.025, .13], [.025, 0]], 20, dark);
        M.box(2.18, 2.30, sy * .78 - .09, sy * .78 + .09, 1.42, 1.52, glass);
      }
      mgBall(M, [2.76, 1.335], [2.39, 1.34], .50, -.30, dark, gun);
      M.box(2.30, 2.74, -.10, .10, 1.335, 1.375, dark);
      for (const sy of [-1, 1]) L('z', [1.62, sy * .86, 1.58], [[0, 0], [0, .09], [.05, .09], [.05, .06], [.075, .06], [.075, 0]], 14, dark);   // lifting eyes by the turret

      // ---- engine deck: rear louvres (sloped), filler caps, centre hump, tail plate: exhaust, tow lugs, tow pintle ----
      const deckZ = x => x >= -1.45 ? 1.58 : x >= -2.15 ? 1.58 - (-1.45 - x) * .08 / .70 : 1.50 - (-2.15 - x) * .17 / .73;
      for (const sy of [-1, 1]) {
        const y0 = sy > 0 ? .10 : -.98, y1 = sy > 0 ? .98 : -.10;
        extrudeXZ(M, [[-2.10, deckZ(-2.10) - .01], [-2.95, deckZ(-2.95) - .01], [-2.95, deckZ(-2.95) + .028], [-2.10, deckZ(-2.10) + .028]], y0, y1, dark);
        for (let k = 0; k < 14; k++) { const x = -2.16 - k * .058; M.box(x - .014, x + .014, y0 + .03, y1 - .03, deckZ(x) + .026, deckZ(x) + .036, grille); }
        L('z', [-1.70, sy * .62, 1.575], [[0, 0], [0, .085], [.035, .085], [.035, .055], [.05, .055], [.05, 0]], 14, dark);                    // filler caps
        extrudeXZ(M, [[-1.30, 1.58], [-1.98, deckZ(-1.98)], [-1.98, deckZ(-1.98) + .03], [-1.30, 1.61]], sy > 0 ? .30 : -1.00, sy > 0 ? 1.00 : -.30, dark);   // deck panel behind the turret
        M.box(-3.12, -2.98, sy * .62 - .10, sy * .62 + .10, .88, 1.14, dark);                                                                 // tow lugs
        L('x', [-3.03, sy * .34, 1.00], [[0, 0], [0, .06], [-.08, .06], [-.08, .045], [-.12, .045], [-.12, 0]], 12, dark);                  // exhaust tail pipes
      }
      extrudeXZ(M, [[-2.10, deckZ(-2.10)], [-2.98, deckZ(-2.98)], [-2.98, deckZ(-2.98) + .04], [-2.10, deckZ(-2.10) + .04]], -.10, .10, hull);   // centre spine between the louvres
      M.box(-3.10, -2.99, -.18, .18, .70, 1.02, dark);                                                                                         // tow pintle housing

      M.grp = 1;   // v192: turret part (rotates on its own)
      // ---- cast turret: teardrop built from superellipse rings (ring centre 0.30 m ahead of the hull centre; the lower rear sweeps in under the bustle) ----
      const zs = [1.62, 1.70, 1.78, 1.86, 2.10, 2.30, 2.40, 2.46], XFa = [1.53, 1.53, 1.52, 1.50, 1.40, 1.28, 1.14, .98], XRa = [-.45, -.55, -.85, -1.17, -1.18, -1.17, -1.10, -.98], Wa = [1.09, 1.10, 1.10, 1.10, 1.07, 1.00, .90, .75], XC = .30, EXP = .65;
      const lz = (arr, z) => { if (z <= zs[0]) return arr[0]; for (let i = 0; i < zs.length - 1; i++) if (z <= zs[i + 1]) return arr[i] + (arr[i + 1] - arr[i]) * (z - zs[i]) / (zs[i + 1] - zs[i]); return arr[zs.length - 1]; };
      { const NZ = 20, NS = 40, rings = [];
        for (let i = 0; i <= NZ; i++) { const z = zs[0] + (zs[zs.length - 1] - zs[0]) * i / NZ, af = lz(XFa, z) - XC, ar = XC - lz(XRa, z), o = [];
          for (let k = 0; k < NS; k++) { const a = k * Math.PI * 2 / NS, c = Math.cos(a), s = Math.sin(a); o.push([XC + (c >= 0 ? af : ar) * Math.sign(c) * Math.pow(Math.abs(c), EXP), lz(Wa, z) * Math.sign(s) * Math.pow(Math.abs(s), EXP), z]); }
          rings.push(o); }
        smoothGrid(M, rings, hull, [0, 0, -1], [0, 0, 1]); }
      const turretY = (x, z) => { const a = x >= XC ? lz(XFa, z) - XC : XC - lz(XRa, z), c = Math.min(1, Math.pow(Math.abs(x - XC) / a, 1 / EXP)); return lz(Wa, z) * Math.pow(Math.sqrt(Math.max(0, 1 - c * c)), EXP); };
      L('z', [XC, 0, 1.52], [[0, 0], [0, 1.15], [.11, 1.15], [.11, 0]], 44, dark);                                                             // turret ring / race
      // cast mantlet (T26E5 drawing: a wide flat-faced slab, 1.29 m across, z 1.65..2.28, front face at x 1.98 with rounded top/bottom/side shoulders),
      // standing proud of the sloped turret front; gun collar boss, trunnion caps on the sides, two round ports on the face, three lifting eyes on the rear lip
      { const rings = [[1.34, .640, 2.24, 1.67], [1.58, .645, 2.275, 1.645], [1.74, .645, 2.285, 1.665], [1.82, .642, 2.27, 1.685], [1.88, .636, 2.24, 1.705], [1.925, .626, 2.195, 1.73], [1.955, .612, 2.15, 1.76], [1.975, .590, 2.125, 1.78], [1.982, .575, 2.115, 1.79]].map(([x, W, zT, zB]) => sqRing(x, W, zT, zB, 56, .32));
        smoothGrid(M, rings, hull, [-1, 0, 0], [1, 0, 0]); }
      M.box(1.50, 1.62, -.60, .60, 2.262, 2.292, dark);                                                                                       // raised lip along the top rear edge
      for (const sy of [-1, 1]) {
        L('y', [1.575, sy * .64, 1.95], [[0, 0], [0, .185], [sy * .014, .185], [sy * .014, .150], [sy * .028, .150], [sy * .028, .105], [sy * .040, .105], [sy * .040, .036], [sy * .050, .036], [sy * .050, 0]], 28, steel);   // trunnion cap
        L('x', [1.90, sy * .405, 2.085], [[0, 0], [0, .054], [.10, .054], [.10, .042], [.135, .042], [.135, 0]], 18, dark);                  // round ports (co-axial MG left, sight right)
        L('x', [2.03, sy * .405, 2.085], [[0, 0], [0, .026], [.012, .026], [.012, 0]], 12, glass);
      }
      for (const [y, w, h] of [[-.52, .09, .08], [0, .12, .12], [.52, .09, .08]]) {                                                           // lifting eyes (rings standing in the YZ plane)
        const x0 = 1.545, x1 = 1.595, zb = 2.255, t = .02;
        M.box(x0, x1, y - w / 2, y - w / 2 + t, zb, zb + h, steel); M.box(x0, x1, y + w / 2 - t, y + w / 2, zb, zb + h, steel); M.box(x0, x1, y - w / 2, y + w / 2, zb + h - t, zb + h, steel);
      }
      L('x', [1.965, 0, 1.96], [[0, 0], [0, .160], [.040, .165], [.075, .150], [.100, .138], [.115, .134], [.115, 0]], 32, dark);                // gun collar boss
      L('x', [2.10, 0, 1.96], [[0, .096], [0, .150], [.018, .150], [.018, .096]], 28, steel);                                                  // collar clamp ring
      patchGrid(M, (x, z) => [x, turretY(x, z) + .02, z], 1.20, 1.34, 1.86, 1.94, 3, 2, 1, dark);                                              // small vision panel on the left front flank
      // 90 mm M3 gun: tapering tube, double-baffle muzzle brake
      L('x', [1.99, 0, 1.96], [[0, 0], [0, .098], [.45, .094], [1.45, .078], [2.35, .060], [2.93, .056], [2.93, 0]], 20, gun);
      L('x', [4.92, 0, 1.96], [[0, 0], [0, .085], [.48, .085], [.48, 0]], 16, gun);
      for (const x0 of [4.97, 5.26]) L('x', [x0, 0, 1.96], [[0, .05], [0, .145], [.04, .155], [.09, .155], [.12, .145], [.12, .05]], 22, gun);
      L('x', [5.395, 0, 1.96], [[-.004, 0], [-.004, .055], [.006, .055], [.006, 0]], 12, dark);

      // ---- roof: commander's cupola with vision blocks + M2 pintle (right), loader's hatch (left), gunner's periscope / vent hump, vent dome, antenna mount, cartridge-ejection hatch ----
      const zr = 2.44, ccx = .21, ccy = -.46;
      L('z', [ccx, ccy, zr - .08], [[0, 0], [0, .46], [.04, .46], [.04, .40], [.17, .40], [.17, 0]], 36, hull);
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + .2; M.box(ccx + Math.cos(a) * .40 - .05, ccx + Math.cos(a) * .40 + .05, ccy + Math.sin(a) * .40 - .05, ccy + Math.sin(a) * .40 + .05, zr + .04, zr + .13, glass); }
      L('z', [ccx, ccy, zr + .10], [[0, 0], [0, .32], [.03, .32], [.03, 0]], 28, dark);
      M.box(ccx - .10, ccx + .10, ccy - .03, ccy + .03, zr + .13, zr + .17, steel);                                                           // hatch handle
      L('z', [ccx - .26, ccy, zr + .10], [[0, 0], [0, .04], [.14, .04], [.14, .055], [.18, .055], [.18, 0]], 12, dark);                      // M2 pintle post
      L('x', [ccx - .58, ccy, zr + .30], [[0, 0], [0, .045], [.45, .045], [.45, .036], [1.50, .034], [1.72, .027], [1.72, 0]], 14, gun);      // M2HB receiver + barrel jacket
      M.box(ccx - .60, ccx - .20, ccy - .06, ccy + .06, zr + .24, zr + .36, gun);
      M.box(ccx - .38, ccx - .14, ccy + .06, ccy + .20, zr + .18, zr + .30, crate);                                                           // ammo box
      L('z', [.12, .45, zr - .04], [[0, 0], [0, .33], [.04, .33], [.04, .28], [.09, .28], [.09, 0]], 30, hull);                               // loader's hatch
      L('z', [.12, .45, zr + .05], [[0, 0], [0, .24], [.025, .24], [.025, 0]], 24, dark);
      M.box(.02, .22, .38, .52, zr + .07, zr + .10, steel);
      M.box(.68, 1.02, -.72, -.30, zr - .04, zr + .06, hull); M.box(.72, .98, -.68, -.34, zr + .04, zr + .08, glass);                       // gunner's periscope + guard
      M.box(.70, .88, .42, .70, zr - .04, zr + .05, hull);                                                                                    // left roof vent box
      L('z', [-.33, -.32, zr - .04], [[0, 0], [0, .10], [.05, .10], [.05, 0]], 14, dark);                                                    // vent / periscope
      L('z', [-.95, .10, zr - .10], [[0, 0], [0, .11], [.05, .11], [.08, .08], [.08, 0]], 16, dark);                                          // vent dome
      L('z', [-.96, .78, zr - .22], [[0, 0], [0, .10], [.04, .10], [.04, 0]], 14, dark);                                                      // cartridge-ejection hatch
      L('z', [-.98, -.40, zr - .06], [[0, 0], [0, .06], [.08, .06], [.08, .035], [.15, .035], [.15, 0]], 12, dark);                          // antenna mount
      for (const sy of [-1, 1]) { M.box(-1.12, -1.02, sy * .50 - .04, sy * .50 + .04, 1.90, 2.04, dark); }                                    // rear lifting hooks

      // ---- left turret side: spare-track rack (3 x 6 links on a frame); stars on both sides ----
      patchGrid(M, (x, z) => [x, turretY(x, z) + .022, z], .40, .94, 1.82, 2.34, 8, 9, 1, dark);                                              // rack backing plate (drawing: x .41..-.94 m, z 1.83 up to the roof edge)
      for (let c = 0; c < 3; c++) for (let r = 0; r < 6; r++) {
        const x = .50 + c * .17, z = 1.90 + r * .088, y0 = turretY(x, z) + .024;
        M.box(x - .068, x + .068, y0, y0 + .03, z - .030, z + .030, steel); M.box(x - .02, x + .02, y0 + .03, y0 + .045, z - .030, z + .030, dark);
      }
      for (const x of [.40, .94]) { const y0 = turretY(x, 2.10) + .02; M.box(x - .012, x + .012, y0, y0 + .05, 1.84, 2.36, dark); }                // rack side rails
      for (const [x, z0, z1] of [[.30, 1.90, 2.36], [.25, 1.98, 2.30]]) { const y0 = turretY(x, (z0 + z1) / 2) + .02; M.box(x - .012, x + .012, y0, y0 + .04, z0, z1, steel); M.box(x - .025, x + .025, y0, y0 + .035, z1 - .10, z1, crate); }   // stowed tools (shovel / axe)
      starPatch(M, (x, z) => [x, turretY(x, z) + .024, z], -.34, 2.15, .27, 1, white);
      starPatch(M, (x, z) => [x, -(turretY(x, z) + .024), z], -.34, 2.15, .27, -1, white);

      M.grp = 0;
      // ---- tracks & running gear: six dual road wheels (R .33), five return rollers, front idler, rear drive sprocket ----
      const C2 = [2.53, .86], R2 = .36, C1 = [-2.50, .74], R1 = .37, pts = [];
      const arc = (c, r, a0, a1, n) => { for (let k = 0; k <= n; k++) { const a = a0 + (a1 - a0) * k / n; pts.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]); } };
      arc(C2, R2, Math.PI / 2, -Math.PI * .30, 12);
      pts.push([2.00, .03], [-1.80, .03]);
      arc(C1, R1, -Math.PI * .36, -Math.PI * 1.5, 12);
      pts.push([-1.0, 1.15], [1.0, 1.19]);
      const n = pts.length, cen = [0, .6], thick = .06, outer = pts, inner = pts.map((p, i) => {
        const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n]; let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
        let nx = -tz, nz = tx; if (nx * (cen[0] - p[0]) + nz * (cen[1] - p[1]) < 0) { nx = -nx; nz = -nz; } return [p[0] + nx * thick, p[1] + nz * thick];
      });
      for (const sy of [-1, 1]) {
        const ya = sy > 0 ? YA : -YB, yb = sy > 0 ? YB : -YA, f = sy;
        M.belt(outer, inner, ya, yb, trk);
        for (let i = 0; i < n; i++) {                                                                                                         // track shoes with end connectors
          const a = outer[i], b = outer[(i + 1) % n], seg = Math.hypot(b[0] - a[0], b[1] - a[1]); if (seg < 1e-6) continue;
          let nx = (b[1] - a[1]) / seg, nz = -(b[0] - a[0]) / seg; if (nx * ((a[0] + b[0]) / 2 - cen[0]) + nz * ((a[1] + b[1]) / 2 - cen[1]) < 0) { nx = -nx; nz = -nz; }
          const cnt = Math.max(1, Math.round(seg / .18)), h = .035;
          for (let q = 0; q < cnt; q++) {
            const t0 = (q + .15) / cnt, t1 = (q + .62) / cnt, p0 = [a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0], p1 = [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1];
            M.hex8([[p0[0], ya, p0[1]], [p1[0], ya, p1[1]], [p1[0], yb, p1[1]], [p0[0], yb, p0[1]], [p0[0] + nx * h, ya, p0[1] + nz * h], [p1[0] + nx * h, ya, p1[1] + nz * h], [p1[0] + nx * h, yb, p1[1] + nz * h], [p0[0] + nx * h, yb, p0[1] + nz * h]], trkR);
          }
        }
        const dual = (cx, cz, R, hubR) => {                                                                                                  // dual-tyre road wheel / idler
          for (const d of [-1, 1]) L('y', [cx, sy * (YC + d * .125), cz], [[-.07 * f, 0], [-.07 * f, R, tyre], [.07 * f, R, tyre], [.07 * f, R - .07, tyre], [.055 * f, R - .07, wheel], [.055 * f, hubR, wheel], [.10 * f, hubR, wheel], [.10 * f, 0, wheel]], 24, wheel);
          L('y', [cx, sy * (YC + .0), cz], [[-.06 * f, 0], [-.06 * f, hubR * .8, dark], [.06 * f, hubR * .8, dark], [.06 * f, 0, dark]], 14, dark);
        };
        const wx = [1.975, 1.230, .485, -.260, -1.005, -1.750];
        for (const x of wx) {
          dual(x, .43, .33, .13);
          M.box(x - .10, x + .10, sy > 0 ? 1.10 : -1.20, sy > 0 ? 1.20 : -1.10, .78, 1.06, dark);                                           // swing-arm housing / bump-stop block on the hull side
          extrudeXZ(M, [[x - .10, 1.06], [x + .10, 1.06], [x + .04, 1.18], [x - .04, 1.18]], sy > 0 ? 1.12 : -1.18, sy > 0 ? 1.18 : -1.12, dark);   // bump-stop cone
        }
        for (const x of [1.51, .80, .06, -.64, -1.37]) L('y', [x, sy * YC, 1.0], [[-.07 * f, 0], [-.07 * f, .17, tyre], [.07 * f, .17, tyre], [.07 * f, .09, wheel], [.09 * f, .09, wheel], [.09 * f, 0, wheel]], 16, wheel);   // return rollers
        dual(C2[0], C2[1], .30, .12);                                                                                                         // front idler
        for (const dd of [-1, 1]) {                                                                                                           // rear drive sprocket: dual toothed rims + hub
          const yy = sy * (YC + dd * .125);
          L('y', [C1[0], yy, C1[1]], [[-.04 * f, .20], [-.04 * f, .31], [.04 * f, .31], [.04 * f, .20]], 28, wheel);
          for (let q = 0; q < 13; q++) { const a = q * Math.PI * 2 / 13 + .1, da = .12, p = (r, aa) => [C1[0] + r * Math.cos(aa), C1[1] + r * Math.sin(aa)];
            extrudeXZ(M, [p(.29, a - da), p(.405, a - da * .35), p(.405, a + da * .35), p(.29, a + da)], yy - .04, yy + .04, wheel); }
        }
        L('y', [C1[0], sy * YC, C1[1]], [[-.12 * f, 0], [-.12 * f, .12, wheel], [.14 * f, .12, wheel], [.14 * f, .07, dark], [.17 * f, .07, dark], [.17 * f, 0, dark]], 16, wheel);
      }
      return M;
    }

    // ======================================================================
    // PzKpfw VI Tiger Ausf. E (metres; X forward, Y left, Z up; origin = hull centre on the ground)
    // Measured from the 1:50 three-view drawing of the Tiger I (side / plan / front+rear views):
    //   side view: 241.7 px/m (hull 6.32 m, gun overhang 2.13 m, 800 mm road wheels, height 2.93 m); plan view: 242.5 px/m along X, 260 px/m across Y (3.55 m over the wings);
    //   front view: 256 px/m.   Hull: stepped nose shelf over the sprockets, vertical upper front plate, flat wings with aprons, raised engine-deck grilles, four rear mufflers;
    //   turret: teardrop plan with the cast mantlet, rear stowage bin, commander's cupola (left rear), loader's hatch (right), smoke dischargers on the front corners;
    //   running gear: front drive sprocket, rear idler, 8 axles x 3 overlapped 800 mm road wheels per side (outer + inner rows), 725 mm tracks.
    // Balkenkreuz (black cross with a white edge) painted on both turret flanks.
    // ======================================================================
    // Balkenkreuz decal with flared arms, hugging a surface: surf(x, z) → [x, y, z]; centre (cx, cz), R = half span, ny = outward normal sign along Y
    function crossPatch(M, surf, cx, cz, R, ny, m, hw) {   // v133: hw = arm half-width → straight Balkenkreuz arms
      const a = hw || .17, e = hw || .245, base = [[a, -a], [1, -e], [1, e], [a, a]], o = [];
      for (let k = 0; k < 4; k++) { const c = Math.cos(k * Math.PI / 2), s = Math.sin(k * Math.PI / 2); for (const [x, z] of base) o.push([R * (x * c - z * s), R * (x * s + z * c)]); }
      const N = [0, ny, 0], NR = 4, NT = 2;
      for (let k = 0; k < o.length; k++) { const A = o[k], B = o[(k + 1) % o.length];
        for (let i = 0; i < NR; i++) for (let j = 0; j < NT; j++) {
          const pt = (s, t) => { const ex = A[0] + (B[0] - A[0]) * t, ez = A[1] + (B[1] - A[1]) * t; return surf(cx + ex * s, cz + ez * s); };
          const s0 = i / NR, s1 = (i + 1) / NR, t0 = j / NT, t1 = (j + 1) / NT, p00 = pt(s0, t0), p10 = pt(s1, t0), p11 = pt(s1, t1), p01 = pt(s0, t1);
          M.tri(p00, p10, p11, N, N, N, m); M.tri(p00, p11, p01, N, N, N, m);
        } }
    }
    function buildTiger2(paint) {
      const P = PAINT[paint] || PAINT.grey, M = new Mesh();
      const hull = M.mat(P.hull, { spec: .08 }), dark = M.mat(P.dark, { spec: .05 }), gun = M.mat(P.gun, { spec: .22, noise: .5 });
      const trk = M.mat([58, 54, 48], { spec: .06, noise: 1.4 }), trkR = M.mat([70, 64, 56], { shadow: false, noise: 1.4 }), tyre = M.mat([30, 31, 33], { noise: .6 }), wheel = M.mat(P.wheel, { spec: .12 });
      const grille = M.mat([34, 36, 38], { shadow: false, noise: .5 }), glass = M.mat([20, 26, 30], { spec: .8, shadow: false, noise: 0 });
      const steel = M.mat([84, 82, 76], { spec: .22, noise: 1.2 }), cable = M.mat([62, 58, 50], { noise: 1.6 }), crate2 = M.mat([P.dark[0] + 18, P.dark[1] + 16, P.dark[2] + 10], { spec: .04 });
      const white = M.mat([240, 240, 232], { spec: .03, shadow: false, noise: 0 }), black = M.mat([16, 16, 18], { spec: .03, shadow: false, noise: 0 });
      const L = (ax, o, prof, seg, m) => M.lathe(ax, o, prof, seg, m);
      const DZ = 1.75, HW = 1.53, WY = 1.78, XFr = 2.38, XRr = -3.05;

      // ---- hull ----
      extrudeXZ(M, [[3.12, 1.22], [3.12, .90], [2.95, .66], [2.50, .45], [-2.85, .45], [-3.03, .62], [-3.05, 1.22]], -.98, .98, dark);           // lower tub + nose
      M.box(XRr, XFr, -HW, HW, 1.17, DZ, hull);                                                                                                    // superstructure (full deck width)
      extrudeXZ(M, [[XFr, 1.30], [3.14, 1.21], [3.14, 1.15], [XFr, 1.15]], -WY, WY, hull);                                                        // front shelf over the sprockets
      M.box(2.55, 3.14, -.98, .98, 1.00, 1.17, dark);                                                                                              // nose plate under the shelf
      for (const sy of [-1, 1]) {
        const y0 = sy > 0 ? HW : -WY, y1 = sy > 0 ? WY : -HW;
        M.box(XRr, XFr, y0, y1, 1.42, 1.47, hull);                                                                                                 // wing deck
        extrudeXZ(M, [[XFr, 1.47], [-3.15, 1.47], [-3.15, 1.05], [-2.75, 1.05], [XFr, 1.17]], sy > 0 ? WY - .035 : -WY, sy > 0 ? WY : -WY + .035, hull);        // side apron
        for (let k = 0; k < 4; k++) { const x = 2.0 - k * 1.28; M.box(x - .02, x + .02, sy > 0 ? WY - .036 : -WY - .004, sy > 0 ? WY + .004 : -WY + .036, 1.10, 1.47, dark); }   // apron joints
        M.box(-3.15, -2.75, y0, y1, 1.42, 1.47, hull);                                                                                              // rear wing extensions
        M.box(2.48, 2.52, sy > 0 ? .98 : -HW, sy > 0 ? HW : -.98, 1.17, 1.30, dark);                                                                // shelf stiffener
      }
      // front: driver's visor (left), bow MG ball (right), tow shackles, headlight, horn
      M.box(XFr - .07, XFr + .18, .23, .84, 1.40, 1.66, hull); M.box(XFr + .175, XFr + .19, .33, .74, 1.50, 1.56, glass); M.box(XFr + .02, XFr + .20, .23, .84, 1.64, 1.68, dark);
      for (const yy of [.42, .65]) M.box(XFr + .17, XFr + .20, yy - .01, yy + .01, 1.42, 1.64, dark);                                          // visor frame ribs
      L('x', [XFr, -.51, 1.52], [[0, 0], [0, .15], [.07, .15], [.07, .11], [.12, .11], [.12, 0]], 20, dark); L('x', [XFr + .12, -.51, 1.52], [[0, 0], [0, .026], [.36, .026], [.36, 0]], 8, gun);
      L('x', [XFr + .08, -.51, 1.52], [[0, 0], [0, .10], [.04, .10], [.04, 0]], 14, steel);
      for (const sy of [-1, 1]) { M.box(3.00, 3.14, sy * .86 - .035, sy * .86 + .035, .72, 1.20, dark); M.box(3.04, 3.18, sy * .86 - .06, sy * .86 + .06, .70, .78, steel); }
      for (const sy of [-1, 1]) { L('z', [2.30, sy * 1.39, 1.74], [[0, 0], [0, .06], [.07, .06], [.07, 0]], 12, steel); M.box(2.30, 2.40, sy * 1.74 - .02, sy * 1.74 + .02, 1.47, 1.53, dark); }   // wing lifting bolts / shelf brackets
      M.box(3.10, 3.17, .18, .45, .50, .68, dark);                                                                                               // jack block on the lower nose plate
      // wing tools: shovel + crowbar on the right wing, jack + pioneer tools on the left wing
      M.box(.55, 1.65, -1.70, -1.64, 1.47, 1.495, steel); M.box(1.65, 1.82, -1.72, -1.62, 1.47, 1.50, dark); M.box(.20, .50, -1.66, -1.58, 1.47, 1.52, crate2);
      M.box(-1.90, -1.30, 1.58, 1.74, 1.47, 1.60, dark); M.box(-1.86, -1.34, 1.60, 1.72, 1.60, 1.64, steel); M.box(-.6, .9, 1.68, 1.72, 1.47, 1.49, steel);
      for (const x of [.6, 1.1, 1.6, -1.6, -1.2]) for (const sy of [-1, 1]) M.box(x - .015, x + .015, sy * 1.665 - .035, sy * 1.665 + .035, 1.47, 1.53, dark);   // tool clamps
      // deck hatches: driver (left) and radio operator (right); tow cables along the superstructure sides; antenna base
      for (const [y, x] of [[.85, 1.77], [-.93, 1.75]]) {
        L('z', [x, y, DZ], [[0, 0], [0, .285], [.035, .285], [.035, .25], [.05, .25], [.05, 0]], 28, hull);
        L('z', [x, y, DZ + .05], [[0, 0], [0, .25], [.02, .25], [.02, 0]], 24, dark);
        M.rectZ(x + .02, y, .45, .17, .09, DZ + .07, DZ + .09, steel);
      }
      for (const sy of [-1, 1]) { M.box(-2.20, 1.90, sy * (HW + .010) - .010, sy * (HW + .010) + .010, 1.55, 1.575, cable); M.box(-2.20, 1.90, sy * (HW + .010) - .010, sy * (HW + .010) + .010, 1.63, 1.655, cable); }
      L('z', [-.92, -1.35, 1.47], [[0, 0], [0, .05], [.04, .05], [.07, .035], [.20, .03], [.20, 0]], 12, dark);
      // engine deck: louvred grille panels with fan covers, rear mesh panels (raised), centre filler, exhaust piping, four rear mufflers
      for (const sy of [-1, 1]) {
        const y0 = sy > 0 ? .64 : -1.45, y1 = sy > 0 ? 1.45 : -.64;
        M.box(-1.84, -1.00, y0, y1, DZ, DZ + .06, dark);
        for (let k = 0; k < 9; k++) { const x = -1.06 - k * .088; M.box(x - .028, x + .028, y0 + .05, y1 - .05, DZ + .06, DZ + .095, grille); }
        L('z', [-1.16, sy * 1.03, DZ + .06], [[0, 0], [0, .105], [.03, .105], [.03, 0]], 16, steel); M.box(-1.20, -1.12, sy * 1.03 - .095, sy * 1.03 + .095, DZ + .09, DZ + .105, dark); M.box(-1.20 + .035, -1.12 - .035, sy * 1.03 - .095, sy * 1.03 + .095, DZ + .09, DZ + .105, dark);   // fan cover cross
        M.box(-2.00, -1.78, sy * 1.045 - .10, sy * 1.045 + .10, DZ + .06, DZ + .095, steel); M.box(-1.94, -1.84, sy * 1.045 - .045, sy * 1.045 + .045, DZ + .095, DZ + .11, dark);
        M.box(-2.74, -2.24, y0, y1, DZ, DZ + .11, hull); M.box(-2.70, -2.28, y0 + .035, y1 - .035, DZ + .11, DZ + .125, grille);               // rear mesh air-outlet panels (raised frame)
        for (let k = 0; k < 5; k++) { const x = -2.33 - k * .085; M.box(x - .02, x + .02, y0 + .06, y1 - .06, DZ + .125, DZ + .135, dark); }
      }
      M.box(-2.24, -1.78, -.64, .64, DZ, DZ + .03, dark);                                                                                           // centre deck plate
      L('z', [-1.89, 0, DZ + .03], [[0, 0], [0, .17], [.05, .17], [.07, .13], [.07, 0]], 20, hull); M.box(-1.94, -1.84, -.03, .03, DZ + .08, DZ + .10, dark);   // filler dome
      L('z', [-2.50, 0, DZ - .15], [[0, 0], [0, .15], [.22, .15], [.22, 0]], 18, steel); L('z', [-2.02, .43, DZ + .03], [[0, 0], [0, .11], [.03, .11], [.03, 0]], 14, dark);
      for (const sy of [-1, 1]) {
        const xs = -2.88; for (const yy of [1.13, 1.40]) { L('z', [xs, sy * yy, 1.43], [[0, 0], [0, .05], [.15, .135], [.41, .135], [.43, .10], [.45, .10], [.45, 0]], 18, dark); L('z', [xs, sy * yy, 1.43 + .43], [[0, 0], [0, .15], [.02, .15], [.02, 0]], 18, steel); }
        const a = [-2.72, sy * 1.28], b = [-1.88, sy * .26], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), len = Math.hypot(b[0] - a[0], b[1] - a[1]);   // flexible exhaust pipes crossing towards the centre
        M.rectZ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, ang, len, .13, 1.78, 1.88, hull);
        L('z', [-2.78, sy * 1.27, 1.80], [[0, 0], [0, .09], [.13, .09], [.13, 0]], 14, dark);
        L('z', [-2.88, sy * .32, DZ], [[0, 0], [0, .14], [.03, .14], [.03, 0]], 20, hull);                                                            // round access plates with bolt rings (rear deck)
        for (let q = 0; q < 8; q++) { const a = q * Math.PI / 4; L('z', [-2.88 + .10 * Math.cos(a), sy * .32 + .10 * Math.sin(a), DZ + .03], [[0, 0], [0, .014], [.012, .014], [.012, 0]], 6, steel); }
      }
      M.box(-3.10, -3.04, -.16, .16, .85, 1.30, dark);                                                                                              // tow pintle plate

      M.grp = 1;   // v192: turret part (rotates on its own)
      // ---- turret ----
      // plan (right half, front -> rear; Y mirrored): flat front plate, flanks widening to the max width at X -0.12, rounded rear; roof rises 0.12 m towards the rear
      const half = [[1.27, .85], [.755, 1.05], [.144, 1.09], [-.115, 1.11], [-.34, 1.03], [-.60, .91], [-.82, .71], [-.95, .52], [-1.04, .32], [-1.105, .12], [-1.126, 0]];
      const tp = half.map(([x, y]) => [x, -y]).concat(half.slice(0, -1).reverse());
      const roofZ = x => 2.445 + (1.27 - x) * .050;
      L('z', [-.12, 0, DZ - .02], [[0, 0], [0, 1.05], [.12, 1.05], [.12, 0]], 36, dark);                                                          // turret ring
      loftZ(M, tp, tp, 1.80, (x, y) => roofZ(x), hull);
      M.prismXY([[-1.05, -.64], [-1.25, -.56], [-1.42, -.36], [-1.52, -.16], [-1.55, 0], [-1.52, .16], [-1.42, .36], [-1.25, .56], [-1.05, .64]], 1.92, roofZ(-1.5) - .004, hull);   // rear stowage bin
      M.box(-1.57, -1.52, -.40, .40, 2.00, 2.50, dark);                                                                                             // bin door seam
      const hwAt = x => { for (let i = 0; i < half.length - 1; i++) { const a = half[i], b = half[i + 1]; if (x <= a[0] && x >= b[0]) return a[1] + (b[1] - a[1]) * (a[0] - x) / (a[0] - b[0]); } return half[half.length - 1][1]; };
      // cast mantlet (trapezoid: 1.1 m wide on the front plate → 0.68 m wide at the front), gun collar, sleeve, stepped barrel
      M.hex8([[1.27, -.55, 1.86], [1.27, .55, 1.86], [1.27, .55, 2.445], [1.27, -.55, 2.445], [1.54, -.34, 1.93], [1.54, .34, 1.93], [1.54, .34, 2.375], [1.54, -.34, 2.375]], hull);
      for (const sy of [-1, 1]) { L('y', [1.38, sy * .47, 2.14], [[0, 0], [0, .075], [sy * .02, .075], [sy * .02, 0]], 14, steel); }                  // trunnion bolt caps
      const GZ = 2.135;
      L('x', [1.53, 0, GZ], [[0, 0], [0, .215], [.05, .22], [.14, .22], [.15, .165], [.84, .165], [.86, .15], [.90, .15], [.90, .125], [1.66, .125], [1.70, .0785], [3.31, .0785], [3.31, 0]], 22, gun);   // collar, sleeve (X 1.67–2.37), Ø .25 barrel, thin barrel
      L('x', [1.665, 0, GZ], [[0, .164], [0, .185], [.03, .185], [.03, .164]], 22, dark);                                                          // sleeve clamp ring
      L('x', [2.30, 0, GZ], [[0, .1245], [0, .145], [.05, .145], [.05, .1245]], 20, steel);                                                         // sleeve band
      L('x', [4.84, 0, GZ], [[0, .0785], [0, .12], [.07, .145], [.40, .145], [.46, .10], [.46, 0]], 18, gun);                                      // double-baffle muzzle brake
      for (const sy of [-1, 1]) for (const x of [5.00, 5.15]) M.box(x, x + .065, sy * .136, sy * .152, GZ - .055, GZ + .055, dark);              // brake ports
      L('x', [5.30, 0, GZ], [[-.004, 0], [-.004, .06], [.006, .06], [.006, 0]], 12, dark);
      // round bolt plugs on the front flanks, pistol port, escape hatch (left flank), smoke dischargers (3 per side on a bracket)
      for (const sy of [-1, 1]) {
        L('y', [1.15, sy * (hwAt(1.15) + .005), 2.12], [[0, 0], [0, .078], [sy * .02, .078], [sy * .02, .05], [sy * .028, .05], [sy * .028, 0]], 16, steel);
        M.box(.74, .84, sy * 1.00 - .02, sy * 1.00 + .02, 2.11, 2.50, dark);
        for (let k = 0; k < 3; k++) { const z = 2.46 - k * .14; L('y', [.79, sy * 1.02, z], [[0, 0], [0, .05], [sy * .13, .05], [sy * .13, .037], [sy * .15, .037], [sy * .15, 0]], 12, dark); }
      }
      L('y', [.59, hwAt(.59) + .004, 2.24], [[0, 0], [0, .10], [.025, .10], [.025, 0]], 20, steel); M.box(.555, .625, hwAt(.59) + .02, hwAt(.59) + .035, 2.232, 2.248, dark);   // pistol port plug
      L('y', [-.77, hwAt(-.77) + .004, 2.16], [[0, 0], [0, .14], [.03, .14], [.03, .12], [.045, .12], [.045, 0]], 22, hull); M.box(-.80, -.74, hwAt(-.77) + .04, hwAt(-.77) + .06, 2.12, 2.20, dark);   // escape hatch
      // roof: commander's cupola (left rear), loader's hatch (right), ventilator dome, sights
      const zr = roofZ(-.40), cx = -.40, cy = .45;
      L('z', [cx, cy, zr - .04], [[0, 0], [0, .50], [.05, .50], [.05, .455], [.20, .455], [.20, .45], [.24, .45], [.24, 0]], 36, hull);
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + .2; M.rectZ(cx + .455 * Math.cos(a), cy + .455 * Math.sin(a), a, .035, .10, zr + .09, zr + .16, glass); }
      L('z', [cx, cy, zr + .20], [[0, 0], [0, .38], [.02, .38], [.04, .34], [.04, 0]], 28, hull); L('z', [cx, cy, zr + .24], [[0, 0], [0, .30], [.02, .30], [.02, 0]], 24, dark);
      M.box(cx - .08, cx + .10, cy - .24, cy - .20, zr + .26, zr + .34, steel); M.box(cx + .02, cx + .06, cy - .26, cy - .12, zr + .26, zr + .30, steel);   // hatch handle / AA mount
      L('z', [cx + .36, cy - .02, zr - .04], [[0, 0], [0, .035], [.30, .035], [.30, 0]], 8, dark);                                                  // periscope
      const lhx = -.095, lhy = -.63;
      M.box(lhx - .24, lhx + .24, lhy - .31, lhy + .31, zr - .02, zr + .03, hull); M.box(lhx - .20, lhx + .20, lhy - .27, lhy + .27, zr + .03, zr + .05, dark);   // loader's hatch
      for (const sy of [-1, 1]) M.box(lhx - .02, lhx + .05, lhy + sy * .20 - .02, lhy + sy * .20 + .02, zr + .05, zr + .12, steel);
      L('z', [-.72, -.54, zr - .02], [[0, 0], [0, .17], [.04, .17], [.075, .11], [.10, .09], [.10, 0]], 20, hull);                                  // ventilator dome
      for (let k = 0; k < 2; k++) L('z', [-.55 - k * .16, 0, zr - .02], [[0, 0], [0, .05], [.05, .05], [.05, 0]], 10, dark);                        // lifting eyes / vents

      // ---- Balkenkreuz on both turret flanks (white edge under a black cross), centred between the pistol port and the escape hatch ----
      for (const sy of [-1, 1]) {
        const surf = off => (x, z) => [x, sy * (hwAt(x) + off), z];
        crossPatch(M, surf(.012), -.20, 2.15, .235, sy, white, .402);
        crossPatch(M, surf(.020), -.20, 2.15, .235, sy, black, .212);
      }

      M.grp = 0;
      // ---- tracks & running gear ----
      const C1 = [2.61, .69], R1 = .46, C2 = [-2.30, .567], R2 = .47, pts = [];
      const arc = (c, r, a0, a1, n) => { for (let k = 0; k <= n; k++) { const a = a0 + (a1 - a0) * k / n; pts.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]); } };
      pts.push([1.90, .955], [2.30, 1.02]);
      arc(C1, R1, Math.PI * .40, -Math.PI * .22, 14);              // sprocket, clockwise over the nose
      pts.push([1.98, .02], [-1.78, .02]);                           // down the diagonal, flat ground run
      arc(C2, R2, -Math.PI * .56, -Math.PI * 1.5, 14);             // idler, up around the rear
      pts.push([-1.7, .97]);
      const n = pts.length, cen = [.15, .55], thick = .075, outer = pts, inner = pts.map((p, i) => {
        const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n]; let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
        let nx = -tz, nz = tx; if (nx * (cen[0] - p[0]) + nz * (cen[1] - p[1]) < 0) { nx = -nx; nz = -nz; } return [p[0] + nx * thick, p[1] + nz * thick];
      });
      for (const sy of [-1, 1]) {
        const ya = sy > 0 ? .99 : -1.715, yb = sy > 0 ? 1.715 : -.99, f = sy;
        M.belt(outer, inner, ya, yb, trk);
        for (let i = 0; i < n; i++) {                                // track links with end connectors
          const a = outer[i], b = outer[(i + 1) % n], seg = Math.hypot(b[0] - a[0], b[1] - a[1]); if (seg < 1e-6) continue;
          let nx = (b[1] - a[1]) / seg, nz = -(b[0] - a[0]) / seg; if (nx * ((a[0] + b[0]) / 2 - cen[0]) + nz * ((a[1] + b[1]) / 2 - cen[1]) < 0) { nx = -nx; nz = -nz; }
          const cnt = Math.max(1, Math.round(seg / .13)), h = .032;
          for (let q = 0; q < cnt; q++) {
            const t0 = (q + .12) / cnt, t1 = (q + .66) / cnt, p0 = [a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0], p1 = [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1];
            M.hex8([[p0[0], ya, p0[1]], [p1[0], ya, p1[1]], [p1[0], yb, p1[1]], [p0[0], yb, p0[1]], [p0[0] + nx * h, ya, p0[1] + nz * h], [p1[0] + nx * h, ya, p1[1] + nz * h], [p1[0] + nx * h, yb, p1[1] + nz * h], [p0[0] + nx * h, yb, p0[1] + nz * h]], trkR);
          }
        }
        // 8 axles, 0.5135 m pitch: outer row on even axles, inner row on odd axles (Ø .77, rubber rim, steel disc, hub cap with cross)
        const RW = .385, WZ = .48;
        for (let k = 0; k < 8; k++) {
          const x = 1.941 - .5135 * k, yc = sy * (k % 2 === 0 ? 1.575 : 1.375), outerRow = k % 2 === 0;
          L('y', [x, yc, WZ], [[-.065 * f, 0], [-.065 * f, RW, tyre], [.065 * f, RW, tyre], [.065 * f, RW - .075, tyre], [.05 * f, RW - .08, wheel], [.05 * f, .30, wheel], [.03 * f, .27, dark], [.03 * f, .12, dark], [.075 * f, .12, wheel], [.075 * f, 0, wheel]], 26, wheel);
          if (outerRow) { M.box(x - .06, x + .06, yc + sy * .07, yc + sy * .085, WZ - .008, WZ + .008, dark); M.box(x - .008, x + .008, yc + sy * .07, yc + sy * .085, WZ - .06, WZ + .06, dark);
            for (let q = 0; q < 6; q++) { const a = q * Math.PI / 3; L('y', [x + .20 * Math.cos(a), yc, WZ + .20 * Math.sin(a)], [[.055 * f, 0], [.055 * f, .018, steel], [.068 * f, .018, steel], [.068 * f, 0]], 6, steel); } }
        }
        // drive sprocket (front): disc with ten radial spokes + toothed rim; hub with bolts
        L('y', [C1[0], sy * 1.36, C1[1]], [[-.07 * f, 0], [-.07 * f, .30, wheel], [.05 * f, .30, wheel], [.05 * f, .36, dark], [.09 * f, .36, wheel], [.09 * f, .13, wheel], [.12 * f, .13, wheel], [.12 * f, 0, wheel]], 24, wheel);
        for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5; L('y', [C1[0] + .21 * Math.cos(a), sy * 1.36, C1[1] + .21 * Math.sin(a)], [[.05 * f, 0], [.05 * f, .045, dark], [.062 * f, .045, dark], [.062 * f, 0]], 8, dark); }   // spoke windows
        for (let k = 0; k < 18; k++) { const a = k * Math.PI / 9; extrudeXZ(M, [[C1[0] + .30 * Math.cos(a - .09), C1[1] + .30 * Math.sin(a - .09)], [C1[0] + .395 * Math.cos(a - .05), C1[1] + .395 * Math.sin(a - .05)], [C1[0] + .395 * Math.cos(a + .05), C1[1] + .395 * Math.sin(a + .05)], [C1[0] + .30 * Math.cos(a + .09), C1[1] + .30 * Math.sin(a + .09)]], sy * 1.36 - .05, sy * 1.36 + .05, wheel); }
        // idler (rear): rimmed disc, eight holes, hub
        L('y', [C2[0], sy * 1.36, C2[1]], [[-.065 * f, 0], [-.065 * f, .36, wheel], [.05 * f, .36, wheel], [.05 * f, .31, dark], [.07 * f, .31, wheel], [.07 * f, .11, wheel], [.10 * f, .11, wheel], [.10 * f, 0, wheel]], 24, wheel);
        for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + .2; L('y', [C2[0] + .21 * Math.cos(a), sy * 1.36, C2[1] + .21 * Math.sin(a)], [[.06 * f, 0], [.06 * f, .05, dark], [.075 * f, .05, dark], [.075 * f, 0]], 8, dark); }
        M.box(C2[0] - .07, C2[0] + .07, sy * 1.36 + sy * .095, sy * 1.36 + sy * .11, C2[1] - .008, C2[1] + .008, dark); M.box(C2[0] - .008, C2[0] + .008, sy * 1.36 + sy * .095, sy * 1.36 + sy * .11, C2[1] - .07, C2[1] + .07, dark);
      }
      return M;
    }

    // ---------- Panther Ausf. G with side skirts (v87) — redrawn from the supplied blueprints ----------
    // Measured on the 68 px/m side+top drawing (skirted) and the 57 px/m three-view drawing (X = (377-px)/67.7, Y = (py-356)/67.7, Z = (216-py)/67.7).
    // Metres; X forward, Y left, Z up; origin = hull centre on the ground.
    function pnSlopeRow(M, sy, x0, x1, z0, z1, th, m) {   // block lying on the sloped hull side (deck edge ±1.26 @ Z1.90 -> ±1.47 @ Z1.46); th = thickness outward
      const yi = z => 1.26 + Math.max(0, 1.90 - z) * .477, f = (x, z, o) => [x, sy * (yi(z) + o), z];
      M.hex8([f(x0, z0, 0), f(x1, z0, 0), f(x1, z0, th), f(x0, z0, th), f(x0, z1, 0), f(x1, z1, 0), f(x1, z1, th), f(x0, z1, th)], m);
    }
    function pnRadial(M, cx, cz, a, r0, r1, w0, w1, y0, y1, m) {   // tapered tooth / spoke in the XZ plane, extruded along Y
      const dx = Math.cos(a), dz = Math.sin(a), tx = -dz, tz = dx, P = (r, w, y) => [cx + dx * r + tx * w, y, cz + dz * r + tz * w];
      M.hex8([P(r0, -w0 / 2, y0), P(r1, -w1 / 2, y0), P(r1, w1 / 2, y0), P(r0, w0 / 2, y0), P(r0, -w0 / 2, y1), P(r1, -w1 / 2, y1), P(r1, w1 / 2, y1), P(r0, w0 / 2, y1)], m);
    }
    function pnOct(M, cx, cy, hx, hy, c, z0, z1, m) {    // chamfered rectangle prism (hatch lids)
      M.prismXY([[hx - c, -hy], [hx, -hy + c], [hx, hy - c], [hx - c, hy], [-hx + c, hy], [-hx, hy - c], [-hx, -hy + c], [-hx + c, -hy]].map(([a, b]) => [cx + a, cy + b]), z0, z1, m);
    }
