    // ---------- 2 cm Flak 38, emplaced — v122: side outline traced on the DAK guide (91 px/m from the 1.30 m barrel; X = (x − 115)/91, Z = (152 − y)/91):
    //   platform (v123: two front arms to X .85, one rear to −.80, after the photo / CAD), top Z .11; cradle ring centre (0, .54) R .27 = bore; barrel with collar,
    //   slotted flash hider and cone to X 1.30; angular shield (v123: flat plates creased at (.56, .50), wings swept back); seat behind on the left: backrest X −.77 … −.63
    //   (Z .19 … .65), pan to −.20 at Z .30; reflector sight on its arm (−.38 … −.22, Z .79 … .90); handwheel (−.24, .52) ----------
    function buildFlak38(paint, o = {}) {
      const P = PAINT[paint] || PAINT.grey, M = new Mesh(), K = v112Mats(M, P), L = (ax, oo, prof, seg, m) => M.lathe(ax, oo, prof, seg, m);
      const th = o.elev == null ? .18 : o.elev, seat = M.mat([60, 50, 42], { spec: .1, noise: .8 });
      // v123 platform (AWM photo + CAD): three flat box arms — two forward (front pads X .85, ±.72) and one rear (X −.80) — with lightening slots, tall screw jacks
      //   with a handwheel on top and big round pads; frame box under the seat, big traverse ring
      for (const [ex, ey] of [[.85, .72], [.85, -.72], [-.80, 0]]) { const l = Math.hypot(ex, ey), ux = ex / l, uy = ey / l;
        v115Beam(M, [0, 0, .07], [ex - ux * .06, ey - uy * .06, .07], .12, .08, .22, .14, K.hull);
        for (const t of [.35, .60]) M.box(ux * t * l - .03, ux * t * l + .03, uy * t * l - .03, uy * t * l + .03, .105, .118, K.black);
        M.box(ex - .07, ex + .07, ey - .07, ey + .07, .05, .12, K.hull);                                                          // arm end block
        L('z', [ex, ey, 0], [[0, 0], [0, .13], [.025, .13], [.035, .06], [.035, 0]], 18, K.dark); v5Rod(M, [ex, ey, .03], [ex, ey, .26], .028, K.dark, 8);   // pad + screw
        L('z', [ex, ey, .26], [[0, 0], [0, .055], [.025, .055], [.025, 0]], 12, K.dark); }                                          // handwheel cap
      M.box(-.62, -.18, -.30, .30, .02, .14, K.hull); M.box(-.58, -.22, -.26, .26, .14, .145, K.black);                          // frame box under the seat
      L('z', [0, 0, .11], [[0, 0], [0, .46], [.04, .46], [.04, .42], [.10, .42], [.10, 0]], 32, K.hull);                        // traverse ring
      M.box(-.60, .33, -.20, .20, .16, .24, K.hull);                                                                             // upper-carriage base
      // seat on the left behind the cradle: backrest, pan, foot rest
      for (const yy of [.16, .40]) v5Rod(M, [-.62, yy, .26], [-.70, yy, .62], .012, K.dark, 5); M.box(-.74, -.66, .12, .44, .56, .66, seat);   // v123: backrest pad on a thin frame (photo)
      M.box(-.60, -.24, .14, .42, .26, .30, seat); M.box(-.62, -.22, .16, .40, .22, .26, K.dark); M.box(-.10, .05, .14, .42, .14, .17, K.dark);
      // cradle ring housings (both sides), handwheels
      for (const sy of [-1, 1]) L('y', [0, sy * (sy > 0 ? .15 : .21), .54], [[0, 0], [0, .27], [.06, .27], [.06, 0]], 28, K.hull);
      L('y', [-.24, .25, .52], [[0, 0], [0, .08], [.02, .08], [.02, 0]], 14, K.dark); L('y', [-.30, -.25, .44], [[0, 0], [0, .08], [-.02, .08], [-.02, 0]], 14, K.dark);
      // v123 angular shield (photo + CAD): flat plates — per half a lower plate (bottom (.46, .14) → crease (.56, .48)) and an upper plate leaning back to the top
      //   (.36, .90); each half has an inner panel (±.07 … ±.44) and an outer wing swept back .26 to ±.70; a gap round the barrel above Z .40; bolts
      const T = .010, PR = [[.46, .14], [.56, .48], [.36, .90]];
      for (const sy of [-1, 1]) for (let i = 0; i < 2; i++) { const [x0, z0] = PR[i], [x1, z1] = PR[i + 1], z1c = z1, x1c = (sy > 0 && i === 1) ? x0 + (x1 - x0) * (z1c - z0) / (z1 - z0) : x1;
        v5Slab(M, [[x0, sy * .07, z0], [x0 - .04, sy * .44, z0], [x1c - .04, sy * .44, z1c], [x1c, sy * .07, z1c]], [-T, -sy * T * .1, 0], K.hull);              // inner panel
        v5Slab(M, [[x0 - .04, sy * .44, z0], [x0 - .30, sy * .70, z0], [x1 - .30, sy * .70, z1 - .04], [x1 - .04, sy * .44, z1]], [-T * .7, -sy * T * .7, 0], K.hull); }   // wing
      v5Slab(M, [[.46, -.07, .14], [.46, .07, .14], [.54, .07, .40], [.54, -.07, .40]], [-T, 0, 0], K.hull);                     // centre plate under the barrel gap
      for (const sy of [-1, 1]) for (const [f, z] of [[.3, .22], [.3, .44], [.3, .62], [.9, .30], [.9, .66]]) { const x = z < .48 ? .46 + (z - .14) / .34 * .10 : .56 - (z - .48) / .42 * .20;
        M.box(x + .002, x + .014, sy * (.07 + f * .37) - .012, sy * (.07 + f * .37) + .012, z - .012, z + .012, K.dark); }
      for (const sy of [-1, 1]) v5Rod(M, [.10, sy * .20, .54], [.50, sy * .30, .50], .02, K.dark, 5);                          // shield brackets on the cradle
      // gun group about the cradle centre (0, .54) = bore: receiver, barrel + flash hider to X 1.30, magazine (left), reflector sight on its arm
      const t0 = M.M.length;
      M.box(-.48, .10, -.065, .065, -.07, .08, K.gun);
      // v123 barrel (photo): collar where it leaves the shield, slim barrel, slotted flash-hider sleeve, cone opening to the muzzle at X 1.30
      L('x', [.05, 0, 0], [[0, 0], [0, .052], [.13, .052], [.14, .036], [.20, .030], [.97, .026], [.98, .031], [1.06, .031], [1.25, .046], [1.25, 0]], 16, K.gun);
      for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; M.box(1.0, 1.04, .0315 * Math.cos(a) - .006, .0315 * Math.cos(a) + .006, .0315 * Math.sin(a) - .006, .0315 * Math.sin(a) + .006, K.black); }   // flash-hider slots
      v120Bore(M, K, 1.30, 0, 0, .020);
      M.box(-.08, .22, .07, .19, -.13, .08, K.dark);
      v5Poly(M, [[-.05, .20, .10], [-.25, .27, .30], [-.30, .27, .36]], .015, K.dark, 4);
      M.box(-.38, -.22, .21, .33, .25, .36, K.dark); M.box(-.385, -.375, .23, .31, .28, .33, K.glass);
      v115Elev(M, t0, th, [0, 0, .54]);
      // crew: gunner on the seat, loader with a magazine, range-taker (MP 40), ammunition number
      v115Crew(M, K, [{ f: 'de_k98_f38sit_light', x: -.58, y: .28, z: -.10 }, { f: 'de_k98_sload_light', x: -.25, y: -.85, yaw: .5, round: [.30, 1.08, .30, .05] },
        { f: 'de_mp40_binoc_light', x: -1.25, y: -.45 }, { f: 'de_k98_kload_light', x: -.20, y: 1.05, yaw: -.5, round: [.30, .92, .30, .05] }], o.crew == null ? 4 : o.crew);
      return M;
    }

    // ---------- 21 cm Obice da 210/22 (German 21 cm H 520(i)) — v122: side outline traced on the illustration (94 px/m from the 5.0 m barrel; X = (x − 535)/94,
    //   Z = (218 − y)/94): tandem wheels R .50 at X −.55 / +.56 (axle Z .53) on walking beams round the pivot (0, .72), front mudguard; base block X −1.86 … −1.01
    //   on its firing plate; riveted rear beam X −2.61 … −1.22 (Z .94 … 1.31); top-carriage cheek; big toothed elevating sector (−1.65, 1.20) R .43;
    //   trunnion (−1.72, 1.40): breech block u −.59 … −.30, cradle to u 1.72, front yoke, barrel R .15 to the muzzle X 2.68, two recuperators above (Z 2.06 / 1.87);
    //   box trails from (−1.40, Z .45, depth .55) to X −4.70 (depth .23), spade box to −5.58 with two rows of pointed blades (X −4.90 / −5.35, to Z .86);
    //   v123: ③ two cylinders side by side under the barrel reaching past the front yoke, the yoke down round them (annotated drawing + model render) ----------
    function buildObice210(paint, o = {}) {
      const P = PAINT[paint] || PAINT.grey, M = new Mesh(), K = v112Mats(M, P), L = (ax, oo, prof, seg, m) => M.lathe(ax, oo, prof, seg, m);
      const sp = o.spread == null ? .40 : o.spread, th = o.elev == null ? .35 : o.elev;
      for (const sy of [-1, 1]) {
        for (const x of [-.55, .56]) { v121Disc(M, K, x, sy * .80, .50, .50, .28, sy, 8, .06); L('y', [x, sy * .64, .53], [[0, 0], [0, .08], [sy * .05, .08], [sy * .05, 0]], 14, K.dark); }
        extrudeXZ(M, [[-.62, .45], [.63, .45], [.63, .60], [.12, .86], [-.12, .86], [-.62, .60]], sy > 0 ? .56 : -.64, sy > 0 ? .64 : -.56, K.hull);   // walking beam plate
        L('y', [0, sy * .64, .72], [[0, 0], [0, .13], [sy * .05, .13], [sy * .05, 0]], 16, K.dark);                               // pivot boss
        v121Fender(M, .56, sy * .80, .53, .58, .34, -.75, Math.PI * .52, K.hull);                                                  // front mudguard
        M.box(-.62, .45, sy > 0 ? .66 : -.95, sy > 0 ? .95 : -.66, 1.04, 1.08, K.hull); v121Fender(M, -.55, sy * .80, .53, .55, .29, Math.PI * .5, Math.PI * .78, K.hull);   // guard over the tandem pair (top just above the tyres, as the in-game model) + rear lip
      }
      M.box(-.15, .15, -.60, .60, .62, .82, K.hull);                                                                               // cross beam at the pivot
      M.box(-1.05, -.10, -.30, .30, .62, .88, K.hull);                                                                             // beam to the base
      M.box(-1.86, -1.01, -.45, .45, .03, .94, K.hull); M.box(-2.10, -.90, -.60, .60, 0, .10, K.dark);                            // base block · firing plate
      M.box(-2.61, -1.22, -.42, .42, .94, 1.31, K.hull);                                                                           // riveted rear beam
      for (const sy of [-1, 1]) for (let k = 0; k < 12; k++) { const x = -2.55 + k * .11; for (const z of [1.00, 1.25]) M.box(x - .012, x + .012, sy * .425 - .01, sy * .425 + .01, z - .012, z + .012, K.dark); }
      for (const sy of [-1, 1]) extrudeXZ(M, [[-2.18, .94], [-2.18, 1.31], [-1.91, 1.47], [-1.49, 1.66], [-1.01, 1.70], [-.69, 1.57], [-.48, 1.31], [-.59, .99], [-1.01, .88]], sy > 0 ? .34 : -.42, sy > 0 ? .42 : -.34, K.hull);   // top-carriage cheeks
      L('y', [-1.65, .43, 1.20], [[0, .38], [0, .43], [.05, .43], [.05, .38], [0, .38]], 40, K.dark);                              // elevating sector rim
      for (let k = 0; k < 14; k++) { const a = Math.PI * (1.08 + k * .055); M.box(-1.65 + .45 * Math.cos(a) - .02, -1.65 + .45 * Math.cos(a) + .02, .43, .48, 1.20 + .45 * Math.sin(a) - .02, 1.20 + .45 * Math.sin(a) + .02, K.dark); }   // teeth
      for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; v5Rod(M, [-1.65, .45, 1.20], [-1.65 + .38 * Math.cos(a), .45, 1.20 + .38 * Math.sin(a)], .02, K.dark, 4); }
      L('y', [-1.65, .43, 1.20], [[0, 0], [0, .10], [.07, .10], [.07, 0]], 14, K.dark); L('y', [-1.05, .45, 1.10], [[0, 0], [0, .12], [.04, .12], [.04, 0]], 16, K.dark);
      // box trails as traced, end boxes, two tall spades per trail
      for (const sy of [-1, 1]) { const d = [-Math.cos(sp), sy * Math.sin(sp)], H = [-1.40, sy * .36, .45], at = (t, z) => [H[0] + d[0] * t, H[1] + d[1] * t, z];
        v115Beam(M, H, at(3.30, .14), .55, .23, .28, .25, K.hull);
        // v123 spade box (model render): wide box across the trail end with two rows of tall pointed spade blades, two each side of the trail
        const n = [-d[1], d[0]], Q = (t, a, z) => [H[0] + d[0] * t + n[0] * a, H[1] + d[1] * t + n[1] * a, z];
        M.hex8([Q(3.28, -.55, .02), Q(4.18, -.55, .02), Q(4.18, .55, .02), Q(3.28, .55, .02), Q(3.28, -.55, .26), Q(4.18, -.55, .26), Q(4.18, .55, .26), Q(3.28, .55, .26)], K.hull);
        M.hex8([Q(3.24, -.58, -.02), Q(4.22, -.58, -.02), Q(4.22, .58, -.02), Q(3.24, .58, -.02), Q(3.24, -.58, .03), Q(4.22, -.58, .03), Q(4.22, .58, .03), Q(3.24, .58, .03)], K.dark);
        for (const a of [-.42, -.28, .28, .42]) M.box(Math.min(Q(3.8, a, 0)[0], Q(3.8, a, 0)[0]) - .03, Q(3.8, a, 0)[0] + .03, Q(3.8, a, 0)[1] - .03, Q(3.8, a, 0)[1] + .03, .26, .275, K.black);   // bolt heads
        for (const t of [3.50, 3.95]) for (const a of [-.40, -.20, .20, .40]) { const c = Q(t, a, 0), w = .07, th = .035, P8 = (da, dt, z) => [c[0] + n[0] * da + d[0] * dt, c[1] + n[1] * da + d[1] * dt, z];
          M.hex8([P8(-w, -th, .26), P8(-w, th, .26), P8(w, th, .26), P8(w, -th, .26), P8(-w * .6, -th, .76), P8(-w * .6, th, .76), P8(w * .6, th, .76), P8(w * .6, -th, .76)], K.hull);
          M.hex8([P8(-w * .6, -th, .76), P8(-w * .6, th, .76), P8(w * .6, th, .76), P8(w * .6, -th, .76), P8(0, -th * .5, .86), P8(0, th * .5, .86), P8(0, th * .5, .86), P8(0, -th * .5, .86)], K.hull);   // pointed tip
          M.hex8([P8(-w, -th, -.16), P8(-w, th, -.16), P8(w, th, -.16), P8(w, -th, -.16), P8(-w, -th, .02), P8(-w, th, .02), P8(w, th, .02), P8(w, -th, .02)], K.dark); } }   // blade below the box
      // gun group about the trunnion (−1.72, 1.40): breech block, cradle, lower cylinder + block, front yoke, barrel, two recuperators
      const t0 = M.M.length;
      M.box(-.59, -.30, -.27, .27, -.14, .39, K.gun);
      M.box(-.30, 1.72, -.26, .26, -.09, .37, K.hull); L('x', [-.30, 0, .26], [[0, 0], [0, .25], [2.02, .25], [2.02, 0]], 22, K.hull);
      for (const sy of [-1, 1]) { L('x', [.40, sy * .14, -.18], [[0, 0], [0, .11], [1.70, .11], [1.72, .085], [1.80, .085], [1.80, 0]], 16, K.gun); }   // ③ two cylinders under the barrel
      M.box(.30, .62, -.26, .26, -.30, -.06, K.hull);                                                                           // their rear bracket under the cradle
      M.box(1.72, 1.99, -.28, .28, -.32, .76, K.dark);                                                                         // front yoke round ② ① ③
      L('x', [-.30, 0, .26], [[0, 0], [0, .15], [4.50, .15], [4.51, .172], [4.70, .172], [4.70, 0]], 20, K.gun);                   // barrel to u 4.40, muzzle ring
      v120Bore(M, K, 4.40, 0, .26, .21);
      L('x', [-.46, 0, .66], [[0, 0], [0, .11], [2.21, .11], [2.22, .07], [2.45, .07], [2.45, 0]], 16, K.gun);
      L('x', [-.46, 0, .47], [[0, 0], [0, .10], [2.18, .10], [2.18, 0]], 16, K.gun);
      v115Elev(M, t0, th, [-1.72, 0, 1.40]);
      v115Crew(M, K, [{ f: 'de_k98_sgun_light', x: -1.35, y: 1.10, yaw: -.4 }, { f: 'de_k98_sload_light', x: -3.20, y: .30, yaw: .1, round: [.30, 1.08, .75, .105] },
        { f: 'de_k98_sload_light', x: -3.20, y: -.40, yaw: -.1, round: [.30, 1.08, .75, .105] }, { f: 'de_k98_kload_light', x: -2.55, y: -1.35, yaw: .4, round: [.30, .92, .75, .105] },
        { f: 'de_k98_kload_light', x: -2.55, y: 1.45, yaw: -.4, round: [.30, .92, .75, .105] }, { f: 'de_mp40_binoc_light', x: .90, y: 1.45 }], o.crew == null ? 6 : o.crew);
      return M;
    }

    // ══════════════════════════════════════════════════════════════
    // v124 — German vehicles from the supplied drawings: Sd.Kfz. 2 Kettenkrad, Borgward B IV Ausf. C "Wanze" (6 × 8.8 cm RPzB), Opel Blitz 3.6-36S
    //   cargo (tarp) and ambulance; the Sd.Kfz. 221 sPzB 41 version and the Pz.Bef.Wg. IV (F1, L/24) are variants of the measured 221 / Pz IV builders.
    //   X forward, Y left, Z up; origin on the ground between the axles / track ends.
    // ══════════════════════════════════════════════════════════════
    v112SeatPose('sitk', .42, [[.41, -.30, .59], [.41, .30, .59]], .38, .02);          // Kettenkrad rider: astride the saddle, hands on the grips
    v112GunPose('pzbgun', .32, 1.02);                                                    // Sd.Kfz. 221 (sPzB 41) gunner at the gun
    // extrude a YZ profile along X (covers, tarps): side quads + flat end caps
    function v124ExtX(M, prof, x0, x1, m) {
      const n = prof.length, cy = prof.reduce((q, p) => q + p[0] / n, 0), cz = prof.reduce((q, p) => q + p[1] / n, 0), c = [(x0 + x1) / 2, cy, cz];
      for (let i = 0; i < n; i++) { const j = (i + 1) % n, a = prof[i], b = prof[j]; M.quad([x0, a[0], a[1]], [x0, b[0], b[1]], [x1, b[0], b[1]], [x1, a[0], a[1]], m, c); }
      for (const [x, nx] of [[x0, -1], [x1, 1]]) for (let i = 0; i < n; i++) { const j = (i + 1) % n; M.tri([x, cy, cz], [x, prof[i][0], prof[i][1]], [x, prof[j][0], prof[j][1]], [nx, 0, 0], [nx, 0, 0], [nx, 0, 0], m); }
    }
    // toothed drive sprocket (axis Y): disc, hub, n teeth on the rim
    function v124Sprocket(M, K, x, y, z, R, w, sy, n) {
      M.lathe('y', [x, y - w / 2, z], [[0, 0], [0, R * .80], [w, R * .80], [w, 0]], 22, K.wheel);
      M.lathe('y', [x, y + sy * w / 2, z], [[0, 0], [0, R * .32], [sy * .04, R * .28], [sy * .04, 0]], 14, K.dark);
      for (let k = 0; k < n; k++) { const a = k * 2 * Math.PI / n; v5Rod(M, [x + R * .72 * Math.cos(a), y, z + R * .72 * Math.sin(a)], [x + R * Math.cos(a), y, z + R * Math.sin(a)], R * .09, K.dark, 4); }
    }

    // ---------- Sd.Kfz. 2 Kettenkrad — 5-view (154 px/m from the 3.0 m length; side: X = (290 − x)/154, Z = (255 − y)/154; front view 1.0 m wide) + photos ----------
    // front wheel R .36 at X 1.44 under a raked girder fork, steering head (1.20, 1.03), swept-back bars to the grips (.84, ±.32, 1.14), lamp on the fork crown;
    // drive sprocket (.95, .38) R .34, interleaved road wheels R .24 at X .42 / .14 / −.14 / −.42 (Z .31), idler (−.78, .33) R .30; tracks ±.39 (.18 wide);
    // narrow hull tub ±.29 between the tracks, track covers ±.28 … ±.50 at Z .64 … .80, engine cover with the saddle (.58 … .28, Z 1.0), rear bench for two
    // facing aft with its backrest against the engine, side grab rails, rear stowage box and tow bracket
    function buildSdKfz2(paint) {
      const P = PAINT[paint] || PAINT.grey, M = new Mesh(), K = v112Mats(M, P), L = (ax, o, prof, seg, m) => M.lathe(ax, o, prof, seg, m);
      // --- running gear
      const out = []; v5Arc(out, [.95, .38], .34, Math.PI / 2, -2.2, 12); out.push([.55, .02], [-.62, .02]); v5Arc(out, [-.78, .33], .33, -1.25, -Math.PI * 1.5, 10); out.push([-.40, .68], [.62, .71]);
      for (const sy of [-1, 1]) {
        v5Track(M, out, sy > 0 ? .30 : -.48, sy > 0 ? .48 : -.30, .04, .07, K.trk, K.trkR);
        v124Sprocket(M, K, .95, sy * .39, .38, .32, .12, sy, 12);
        [.42, .14, -.14, -.42].forEach((x, i) => v118Spoked(M, K, x, sy * (i % 2 ? .34 : .44), .31, .24, .055, sy, 8, .035));
        v118Spoked(M, K, -.78, sy * .39, .33, .29, .08, sy, 8, .04);                                                     // idler
        M.box(-1.15, .97, sy > 0 ? .28 : -.50, sy > 0 ? .50 : -.28, .76, .80, K.hull);                                    // track cover (top)
        M.box(-1.15, .97, sy > 0 ? .48 : -.50, sy > 0 ? .50 : -.48, .62, .80, K.hull);                                    // outer skirt
        M.hex8([[.97, sy * .28, .80], [1.18, sy * .28, .62], [1.18, sy * .50, .62], [.97, sy * .50, .80], [.97, sy * .28, .76], [1.15, sy * .28, .60], [1.15, sy * .50, .60], [.97, sy * .50, .76]], K.hull);   // front slope
        L('z', [.77, sy * .40, .80], [[0, 0], [0, .045], [.03, .045], [.03, 0]], 12, K.dark);                              // filler cap
      }
      // --- hull tub, engine cover + saddle, rear bench, stowage box, rear plate, tow bracket
      extrudeXZ(M, [[1.12, .78], [1.04, .40], [.80, .22], [-1.05, .22], [-1.16, .36], [-1.16, .80]], -.29, .29, K.hull);
      extrudeXZ(M, [[1.12, .78], [1.06, .92], [.90, .96], [.30, .96], [.30, .78]], -.24, .24, K.hull);                 // engine cover
      for (let k = 0; k < 5; k++) M.box(.52 - k * .05, .54 - k * .05, -.18, .18, .955, .968, K.grille);                  // cover louvres
      M.hex8([[.58, -.08, .96], [.28, -.14, .96], [.28, .14, .96], [.58, .08, .96], [.58, -.07, 1.0], [.28, -.13, 1.02], [.28, .13, 1.02], [.58, .07, 1.0]], K.seat);   // saddle
      M.box(.18, .26, -.44, .44, .80, 1.10, K.seat); M.box(.26, .29, -.44, .44, .80, 1.12, K.hull);                    // rear bench backrest (faces aft)
      M.box(-.48, .18, -.44, .44, .80, .90, K.seat);                                                                    // bench cushion
      M.box(-1.14, -.48, -.46, .46, .80, .88, K.hull); M.box(-1.10, -.52, -.42, .42, .88, .90, K.dark);                 // rear stowage box + lid
      for (const sy of [-1, 1]) { v5Poly(M, [[.24, sy * .47, .80], [.20, sy * .47, 1.12], [-.24, sy * .47, 1.14], [-.40, sy * .47, .90]], .014, K.dark, 5);   // side grab rails
        v5Poly(M, [[-1.10, sy * .44, .88], [-1.08, sy * .44, 1.02], [-.95, sy * .44, 1.04]], .012, K.dark, 5); }
      M.box(-1.19, -1.15, -.30, .30, .30, .80, K.hull); M.box(-1.30, -1.18, -.05, .05, .38, .46, K.dark);                // rear plate + tow bracket
      L('x', [-1.30, 0, .42], [[0, .03], [0, .05], [-.04, .05], [-.04, .03]], 12, K.dark);
      // --- front fork, wheel, mudguard, lamp, bars
      v118Spoked(M, K, 1.44, 0, .36, .36, .10, 1, 12, .07);
      v121Fender(M, 1.44, 0, .36, .42, .14, .30, Math.PI * .92, K.hull);
      for (const sy of [-1, 1]) { v5Rod(M, [1.44, sy * .075, .36], [1.24, sy * .075, .94], .02, K.dark, 6); v5Rod(M, [1.40, sy * .075, .40], [1.12, sy * .06, .80], .015, K.dark, 5); }   // girder fork + link
      v5Rod(M, [1.24, 0, .92], [1.19, 0, 1.04], .035, K.dark, 8);                                                         // steering head
      M.box(1.14, 1.26, -.10, .10, .90, .96, K.dark);                                                                    // fork crown
      L('x', [1.30, 0, .96], [[0, 0], [0, .075], [.06, .075], [.10, .06], [.10, 0]], 14, K.dark); L('x', [1.40, 0, .96], [[0, 0], [0, .06], [.006, .06], [.006, 0]], 14, K.glass);   // headlamp
      v5Poly(M, [[.84, -.32, 1.14], [1.05, -.20, 1.10], [1.19, 0, 1.05], [1.05, .20, 1.10], [.84, .32, 1.14]], .014, K.dark, 6);   // handlebar
      for (const sy of [-1, 1]) v5Rod(M, [.84, sy * .32, 1.14], [.78, sy * .34, 1.15], .022, K.black, 6);                // grips
      // --- rider
      v112Crew(M, 'de_k98_sitk_light', .45, 0, .55, 0);
      return M;
    }

    // ---------- Borgward B IV Ausf. C "Wanze" — 4-view (170 px/m: 4.10 m long, 1.83 m wide; side X = (370 − x)/170, Z = (300 − y)/170; front Y = (x − 955)/170) + photo ----------
    // front drive sprocket (1.64, .50) R .27, five spoked road wheels R .22 at X 1.12 / .62 / .12 / −.41 / −.90 (Z .25), idler (−1.35, .35) R .21, tracks ±.77 (.29 wide);
    // hull ±.55: nose plate to Z .89, long front deck rising to 1.13, open driver's box (left, walls to 1.38), rear deck 1.25, leaning rear plate; chequered fenders to ±1.0;
    // launcher on the right: two rows of three RPzB tubes (Y −.82 / −.56 / −.30, Z 1.64 / 1.47) from X 1.18 to −.47 (1.65 m) in three square frames on a post + strut and a rear bracket
    function buildWanze(paint) {
      const P = PAINT[paint] || PAINT.grey, M = new Mesh(), K = v112Mats(M, P), L = (ax, o, prof, seg, m) => M.lathe(ax, o, prof, seg, m), plate = M.mat(P.hull, { spec: .1, noise: 1.6 });
      const out = []; v5Arc(out, [1.64, .50], .29, Math.PI / 2, -2.3, 12); out.push([1.25, .02], [-.95, .02]); v5Arc(out, [-1.35, .35], .25, -1.1, -Math.PI * 1.5, 10); out.push([-1.0, .58], [1.20, .64]);
      for (const sy of [-1, 1]) {
        v5Track(M, out, sy > 0 ? .63 : -.92, sy > 0 ? .92 : -.63, .05, .10, K.trk, K.trkR);
        v124Sprocket(M, K, 1.64, sy * .78, .50, .27, .20, sy, 12);
        for (const x of [1.12, .62, .12, -.41, -.90]) v118Spoked(M, K, x, sy * .78, .25, .22, .12, sy, 6, .04);
        v118Spoked(M, K, -1.35, sy * .78, .35, .21, .12, sy, 6, .035);
        for (const x of [1.02, -.18]) L('y', [x, sy * .70, .53], [[0, 0], [0, .06], [sy * .14, .06], [sy * .14, 0]], 10, K.wheel);   // return rollers
        // chequered fender: sloping front, flat run, rear lip
        const ya = sy > 0 ? .55 : -1.0, yb = sy > 0 ? 1.0 : -.55;
        M.hex8([[2.02, ya, .70], [1.60, ya, .86], [1.60, yb, .86], [2.02, yb, .70], [2.02, ya, .73], [1.60, ya, .89], [1.60, yb, .89], [2.02, yb, .73]], plate);
        M.box(-1.95, 1.60, ya, yb, .82, .86, plate); M.box(-1.95, 1.60, sy > 0 ? .98 : -1.0, sy > 0 ? 1.0 : -.98, .76, .86, plate);
        M.hex8([[-1.95, ya, .82], [-2.08, ya, .72], [-2.08, yb, .72], [-1.95, yb, .82], [-1.95, ya, .86], [-2.08, ya, .76], [-2.08, yb, .76], [-1.95, yb, .86]], plate);
      }
      // --- hull: lower tub + upper body in one profile (nose, front deck, middle deck, rear deck, leaning rear plate)
      extrudeXZ(M, [[1.70, .30], [1.92, .55], [1.92, .88], [1.59, 1.03], [.76, 1.13], [-.06, 1.16], [-.72, 1.16], [-.74, 1.25], [-2.10, 1.27], [-2.00, .95], [-2.06, .62], [-1.65, .42], [-1.20, .30]], -.55, .55, K.hull);
      for (const [x0, x1] of [[1.40, 1.00], [.90, .45]]) M.box(x1, x0, -.40, .40, 1.06 + (1.40 - x0) * .08, 1.08 + (1.40 - x0) * .08, K.dark);   // front deck access plates
      for (const sy of [-1, 1]) { L('x', [1.92, sy * .42, .80], [[0, 0], [0, .06], [.10, .06], [.10, 0]], 12, K.dark); L('x', [2.02, sy * .42, .80], [[0, 0], [0, .05], [.005, .05], [.005, 0]], 12, K.glass);   // headlights
        v5Poly(M, [[1.93, sy * .30, .58], [2.02, sy * .30, .58], [2.02, sy * .30, .66]], .02, K.dark, 5); }                 // tow hooks
      L('x', [1.92, 0, .74], [[0, 0], [0, .04], [.12, .04], [.12, 0]], 10, K.dark);
      // --- open driver's box (left), with a visor in the front wall
      const BZ0 = 1.16, BZ1 = 1.38;
      M.box(-.12, -.08, .02, .58, BZ0, BZ1, K.hull); M.box(-.74, -.70, .02, .58, BZ0, BZ1, K.hull);
      for (const yy of [[.02, .06], [.54, .58]]) M.box(-.74, -.08, yy[0], yy[1], BZ0, BZ1, K.hull);
      M.box(-.70, -.12, .06, .54, BZ0 - .02, BZ0, K.black);
      M.box(-.10, -.07, .18, .42, 1.28, 1.31, K.black);                                                                 // vision slit
      // --- rear deck details: transverse stowage tube, grille plates, antenna base
      for (const sy of [-1, 1]) M.box(-1.70, -1.00, sy > 0 ? .08 : -.48, sy > 0 ? .48 : -.08, 1.25, 1.27, K.dark);
      L('z', [-1.60, .62, 1.25], [[0, 0], [0, .05], [.06, .05], [.06, 0]], 10, K.dark);
      // --- launcher (right): post + strut + base box, rear bracket, two frames, six tubes
      const TY = [-.82, -.56, -.30], TZ = [1.64, 1.47];
      v5Rod(M, [.70, -.45, 1.12], [.70, -.45, 1.38], .04, K.dark, 6); v5Rod(M, [.80, -.45, 1.12], [.55, -.45, 1.40], .025, K.dark, 5);
      M.box(-.44, -.38, -.50, -.40, 1.16, 1.40, K.dark);
      for (const x of [.72, .05, -.37]) { for (const z of [1.37, 1.76]) M.box(x - .03, x + .03, -.94, -.18, z - .02, z + .02, K.hull); for (const y of [-.94, -.18]) M.box(x - .03, x + .03, y - .02, y + .02, 1.37, 1.76, K.hull); }
      for (const y of TY) for (const z of TZ) { L('x', [-.47, y, z], [[0, 0], [0, .055], [1.65, .055], [1.65, 0]], 14, K.gun); v120Bore(M, K, 1.18, y, z, .088); L('x', [-.48, y, z], [[0, .035], [0, .05], [.01, .05], [.01, .035]], 12, K.dark); }
      // --- crew: commander with binoculars and the launcher gunner standing in the open box
      v112Crew(M, 'de_mp40_binoc_light+jag', -.45, .36, .42, 0); v112Crew(M, 'de_k98_hatch_light+jag', -.40, .14, .40, -.4);
      return M;
    }

    // ---------- Opel Blitz 3.6-36S — 5-view with its metre bar (78.5 px/m; side X = (222.5 − x)/78.5, Z = (219 − y)/78.5; front view width 2.27 m) + MiniArt box art
    //   + ambulance 4-view: wheels R .46 at X ±1.90 (rear dual), front track ±.79; grille X 2.47, hood top 1.55 (±.49), cab X 1.24 … .29 (±.78, roof 2.18);
    //   bed X .29 … −3.37 (±1.13, floor 1.10, sides to 1.55) under a tarp to Z 2.62; grille X 2.47; amb: white-square red crosses on the tarp sides and top (three) ----------
    function buildOpelBlitz(paint, amb) {
      const P = PAINT[paint] || PAINT.grey, M = new Mesh(), K = v112Mats(M, P), L = (ax, o, prof, seg, m) => M.lathe(ax, o, prof, seg, m);
      const tarp = M.mat(paint === 'grey' ? [118, 116, 96] : [112, 110, 84], { spec: .03, noise: 1.4 }), wood = K.wood;
      // --- chassis, axles, wheels
      for (const sy of [-1, 1]) M.box(-3.30, 2.55, sy * .40 - .05, sy * .40 + .05, .58, .74, K.dark);
      for (const x of [1.90, -1.91]) L('y', [x, -.70, .46], [[0, 0], [0, .06], [1.40, .06], [1.40, 0]], 10, K.dark);
      L('y', [-1.91, -.20, .46], [[0, 0], [0, .20], [.40, .20], [.40, 0]], 16, K.dark);                                     // differential
      for (const sy of [-1, 1]) { v5Tyre(M, 1.90, sy * .79, .46, .46, .22, sy, K.tyre, K.wheel, K.dark, 22);
        v5Tyre(M, -1.91, sy * .56, .46, .46, .21, sy, K.tyre, K.wheel, K.dark, 22); v5Tyre(M, -1.91, sy * .80, .46, .46, .21, sy, K.tyre, K.wheel, K.dark, 22); }
      M.box(2.65, 2.73, -.98, .98, .56, .70, K.dark);                                                                     // front bumper
      for (const sy of [-1, 1]) v5Poly(M, [[2.70, sy * .55, .60], [2.82, sy * .55, .60], [2.82, sy * .55, .68]], .02, K.dark, 5);   // tow hooks
      // --- front wings (over the wheels, down to the running boards), hood, grille, headlights
      for (const sy of [-1, 1]) {
        v121Fender(M, 1.90, sy * .80, .46, .60, .42, .05, Math.PI * .98, K.hull);
        M.hex8([[2.58, sy * .55, .72], [2.58, sy * 1.01, .72], [2.30, sy * 1.01, 1.02], [2.30, sy * .55, 1.02], [2.58, sy * .55, .76], [2.58, sy * 1.01, .76], [2.30, sy * 1.01, 1.06], [2.30, sy * .55, 1.06]], K.hull);   // wing front
        M.box(.30, 1.32, sy > 0 ? .62 : -1.01, sy > 0 ? 1.01 : -.62, .68, .72, K.dark);                                   // running board
        M.box(1.24, 2.44, sy > 0 ? .49 : -.60, sy > 0 ? .60 : -.49, .72, 1.02, K.hull);                                   // valance between hood and wing
        L('x', [2.22, sy * .71, 1.12], [[0, 0], [0, .11], [.10, .11], [.14, .08], [.14, 0]], 16, K.dark); L('x', [2.36, sy * .71, 1.12], [[0, 0], [0, .09], [.005, .09], [.005, 0]], 14, K.glass);   // headlight
      }
      extrudeXZ(M, [[2.44, .74], [2.47, 1.46], [2.40, 1.53], [1.24, 1.56], [1.24, .74]], -.49, .49, K.hull);             // hood (side profile)
      for (const sy of [-1, 1]) for (let k = 0; k < 12; k++) M.box(1.45 + k * .075, 1.53 + k * .07, sy > 0 ? .49 : -.50, sy > 0 ? .50 : -.49, 1.18, 1.42, K.grille);   // hood side louvres
      M.box(2.47, 2.50, -.27, .27, .62, 1.46, K.dark); for (let k = -6; k <= 6; k++) M.box(2.50, 2.515, k * .04 - .008, k * .04 + .008, .66, 1.42, K.grille);   // grille + bars
      // --- cab (side profile with the sloped windscreen), windows, door lines, mirror
      extrudeXZ(M, [[1.24, .82], [1.24, 1.60], [1.08, 2.12], [.96, 2.18], [.36, 2.18], [.29, 2.10], [.29, .82]], -.78, .78, K.hull);
      for (const sy of [-1, 1]) { M.box(.45, 1.02, sy > 0 ? .78 : -.79, sy > 0 ? .79 : -.78, 1.64, 2.04, K.glass); M.box(1.14, 1.16, sy > 0 ? .66 : -.67, sy > 0 ? .67 : -.66, .90, 1.60, K.dark);
        M.box(.33, .35, sy > 0 ? .78 : -.79, sy > 0 ? .79 : -.78, .86, 2.08, K.dark); v5Rod(M, [1.18, sy * .80, 1.62], [1.26, sy * .98, 1.80], .012, K.dark, 4); M.box(1.24, 1.27, sy * .98 - .05, sy * .98 + .05, 1.76, 1.86, K.glass); }
      for (const sy of [-1, 1]) { const ws = [[1.24, sy * .05, 1.62], [1.24, sy * .70, 1.62], [1.09, sy * .70, 2.08], [1.09, sy * .05, 2.08]]; v5Slab(M, ws.map(p => [p[0] + .004, p[1], p[2]]), [.006, 0, .002], K.glass); }   // two-pane windscreen
      M.box(.27, .29, -.40, .40, 1.70, 1.98, K.glass);                                                                   // rear window
      // --- bed: floor, side / front boards with stakes, tailgate, mudguards over the rear wheels, fuel tank
      M.box(-3.37, .25, -1.13, 1.13, .98, 1.10, K.wood); for (const x of [-3.1, -2.3, -1.5, -.7, .05]) M.box(x - .04, x + .04, -1.0, 1.0, .74, .98, K.dark);   // floor + cross members
      for (const sy of [-1, 1]) { M.box(-3.37, .25, sy > 0 ? 1.10 : -1.13, sy > 0 ? 1.13 : -1.10, 1.10, 1.55, wood);
        for (const z of [1.25, 1.40]) M.box(-3.37, .25, sy > 0 ? 1.13 : -1.14, sy > 0 ? 1.14 : -1.13, z, z + .015, K.dark);
        for (const x of [-3.0, -2.1, -1.2, -.3]) M.box(x - .03, x + .03, sy > 0 ? 1.13 : -1.16, sy > 0 ? 1.16 : -1.13, .98, 1.52, K.dark);
        v121Fender(M, -1.91, sy * .68, .46, .58, .60, .18, Math.PI * .82, K.hull); }
      M.box(.20, .25, -1.13, 1.13, 1.10, 1.58, wood); M.box(-3.40, -3.36, -1.13, 1.13, 1.10, 1.55, wood);
      for (const sy of [-1, 1]) { M.box(-3.42, -3.38, sy * .70 - .05, sy * .70 + .05, .80, .95, K.lamp); }                   // tail lights
      M.box(-.45, .15, -1.00, -.55, .82, 1.00, K.dark);                                                                  // fuel tank (right)
      M.box(-1.20, -.60, .55, 1.00, .80, .98, K.dark);                                                                   // tool box (left)
      // --- tarp over the bows (rounded top edges), rope line, rear flap
      v124ExtX(M, [[-1.13, 1.55], [1.13, 1.55], [1.13, 2.42], [1.06, 2.56], [.92, 2.62], [-.92, 2.62], [-1.06, 2.56], [-1.13, 2.42]], -3.37, .25, tarp);
      for (const x of [-3.0, -2.1, -1.2, -.3]) for (const sy of [-1, 1]) M.box(x - .02, x + .02, sy > 0 ? 1.13 : -1.145, sy > 0 ? 1.145 : -1.13, 1.55, 2.40, K.dark);   // bow ribs under the canvas
      for (const sy of [-1, 1]) M.box(-3.37, .25, sy > 0 ? 1.13 : -1.142, sy > 0 ? 1.142 : -1.13, 1.57, 1.585, K.dark);   // tie-down rope line
      // --- red crosses (ambulance)
      if (amb) { const nT = M.M.length;
        for (const sy of [-1, 1]) v112RedCross(M, nT, [-1.56, sy * 4, 2.08], [0, -sy, 0], .40, [0, 0, 1]);           // v125: one on each tarp side
        v112RedCross(M, nT, [-1.56, 0, 5], [0, 0, -1], .50, [1, 0, 0]); }                                            //        and one on the top
      return M;
    }


    // ══════════════════════════════════════════════════════════════
    // v126 — four German vehicles from the supplied drawings: Sd.Kfz. 251/9 "Stummel" and 251/8 ambulance (Ausf. D, from the 251/9 4-view),
    //   Hummel (15 cm sFH 18 on the Geschützwagen III/IV, 4-view + colour profile), Pz.Kpfw. III Ausf. L (Ausf. G hull drawing with its 3 m scale bar,
    //   L 4-views + render for the 5 cm KwK 39 L/60, the spaced mantlet and the hull front Vorpanzer)
    //   X forward, Y left, Z up; origin on the ground under the hull centre
    // ══════════════════════════════════════════════════════════════
    const V126_DISC = Array.from({ length: 20 }, (_, k) => [Math.cos(k * Math.PI / 10), Math.sin(k * Math.PI / 10)]);

    // ---------- Hummel (Sd.Kfz. 165) — side 4-view (46.9 px/m: muzzle X 3.66, casemate top 2.70 → 2.28, fender 1.30), top / front / rear, colour profile ----------
    // Pz IV running gear: sprocket (2.50, .72), idler (−2.56, .58), eight road wheels in four bogies, four return rollers; low driver's superstructure (Z 1.77) in front;
    // open fighting compartment over the fenders: side walls leaning in (±1.485 → ±1.12), angled cheek plates, sloped front plate, rear plate with door;
    // 15 cm sFH 18/1 (bore 2.40, recuperator above, recoil brake below, armoured cradle housing), travel lock A-frame on the nose, side air louvres, exhausts
    function buildHummel(paint) {
      const P = PAINT[paint] || PAINT.grey, M = new Mesh(), K = v112Mats(M, P), L = (ax, o, prof, seg, m) => M.lathe(ax, o, prof, seg, m);
      const { hull, dark, gun, wheel, trk, trkR, tyre, black, grille, inner, glass } = K;
      const HW = .98, FZ = 1.30, FW = 1.485, YT = 1.26, LEAN = .2607, Yw = z => FW - (z - FZ) * LEAN;   // side wall half-width at height z
      // ---- hull: nose plate, glacis, driver's superstructure, deck under the fighting compartment, rear plate ----
      extrudeXZ(M, [[2.82, .50], [2.82, 1.05], [2.15, 1.30], [1.98, 1.77], [.80, 1.77], [.80, FZ], [-3.0, FZ], [-3.0, .62], [-2.78, .45], [2.55, .45]], -HW, HW, hull);
      M.box(2.15, 2.86, -HW, HW, 1.02, 1.06, dark);                                                                                   // nose / glacis seam
      for (const yy of [-.62, .62]) { M.box(2.80, 2.90, yy - .07, yy + .07, .62, .80, dark); L('y', [2.88, yy - .08, .71], [[0, 0], [0, .045], [.16, .045], [.16, 0]], 10, dark); }   // tow shackles
      const gx = z => 2.82 - (z - 1.05) / .25 * .67, fp = z => 2.15 - (z - 1.30) / .47 * .17;
      for (const sy of [-1, 1]) {                                                                                                     // final-drive covers on the glacis
        const y0 = sy * .30, y1 = sy * .80; M.hex8([[gx(1.10), y0, 1.10], [gx(1.10), y1, 1.10], [gx(1.25), y1, 1.25], [gx(1.25), y0, 1.25], [gx(1.10) + .03, y0, 1.12], [gx(1.10) + .03, y1, 1.12], [gx(1.25) + .03, y1, 1.27], [gx(1.25) + .03, y0, 1.27]], hull); }
      // driver's visor (left) + periscope ports, small visor right, headlights, Notek
      M.hex8([[fp(1.48) + .005, .30, 1.48], [fp(1.48) + .005, .70, 1.48], [fp(1.64) + .005, .70, 1.64], [fp(1.64) + .005, .30, 1.64], [fp(1.48) + .06, .30, 1.48], [fp(1.48) + .06, .70, 1.48], [fp(1.64) + .06, .70, 1.64], [fp(1.64) + .06, .30, 1.64]], hull);
      M.box(fp(1.56) + .055, fp(1.56) + .065, .38, .62, 1.55, 1.58, black);
      M.box(fp(1.56) + .005, fp(1.56) + .04, -.62, -.40, 1.50, 1.62, hull); M.box(fp(1.56) + .035, fp(1.56) + .045, -.58, -.44, 1.55, 1.57, black);
      for (const sy of [-1, 1]) { L('x', [2.18, sy * .82, 1.47], [[0, 0], [0, .07], [.04, .085], [.13, .085], [.14, .07], [.14, 0]], 14, dark); L('x', [2.32, sy * .82, 1.47], [[0, 0], [0, .072], [.006, .07], [.006, 0]], 14, glass); M.box(2.16, 2.26, sy * .82 - .02, sy * .82 + .02, 1.30, 1.40, dark); }
      L('z', [2.10, .55, 1.77], [[0, 0], [0, .05], [.06, .05], [.06, 0]], 10, dark);
      // superstructure roof: two round hatches (driver / radio operator), periscopes
      for (const yy of [.52, -.50]) { L('z', [1.62, yy, 1.77], [[0, 0], [0, .24], [.03, .24], [.03, .20], [.045, .20], [.045, 0]], 22, hull); M.box(1.50, 1.74, yy - .015, yy + .015, 1.815, 1.83, dark); }
      M.box(1.10, 1.30, -.90, -.62, 1.77, 1.83, dark);
      // ---- fenders (track guards ±HW … FW at FZ), front mudguards sloping to the tip, rear mudguards sloping down, outer lips, stowage ----
      for (const sy of [-1, 1]) {
        const ya = sy > 0 ? HW : -FW, yb = sy > 0 ? FW : -HW;
        M.box(-2.52, 2.88, ya, yb, FZ - .03, FZ, hull);
        M.box(-2.52, 2.88, sy > 0 ? FW - .015 : -FW, sy > 0 ? FW : -FW + .015, FZ - .09, FZ, hull);
        M.hex8([[2.88, ya, FZ], [3.05, ya, .92], [3.05, yb, .92], [2.88, yb, FZ], [2.86, ya, FZ - .03], [3.02, ya, .90], [3.02, yb, .90], [2.86, yb, FZ - .03]], hull);
        M.hex8([[-2.52, ya, FZ], [-3.40, ya, .80], [-3.40, yb, .80], [-2.52, yb, FZ], [-2.50, ya, FZ - .03], [-3.37, ya, .78], [-3.37, yb, .78], [-2.50, yb, FZ - .03]], hull);
        L('x', [-3.25, sy * 1.53, 1.17], [[0, 0], [0, .055], [2.05, .055], [2.05, 0]], 12, dark);                                     // exhaust pipe along the side to the rear
        for (const x of [-1.5, -2.5]) M.box(x - .03, x + .03, sy > 0 ? FW - .02 : -1.56, sy > 0 ? 1.56 : -FW + .02, 1.12, 1.22, dark);
        L('x', [2.05, sy * 1.25, FZ + .06], [[0, 0], [0, .06], [.65, .06], [.65, 0]], 10, M.mat([112, 84, 56], { spec: .03, noise: 1.3 }));   // jack block / tool roll
      }
      // ---- fighting compartment (open top): side walls on the fenders, cheek plates, front plate, rear plate with door; inner faces, floor, ammunition racks ----
      for (const sy of [-1, 1]) {
        const S = (x, z) => [x, sy * Yw(z), z];
        v5Slab(M, [S(.76, FZ), S(-3.15, FZ), S(-2.97, 2.28), S(-.10, 2.70)], [0, -sy * .025, -.007], hull);                              // side wall
        v5Slab(M, [[.70, sy * (Yw(FZ) - .03), FZ + .01], [-3.10, sy * (Yw(FZ) - .03), FZ + .01], [-2.94, sy * (Yw(2.28) - .03), 2.27], [-.08, sy * (Yw(2.69) - .03), 2.68]], [0, -sy * .004, 0], inner);
        v5Slab(M, [[1.14, sy * 1.0, FZ], S(.76, FZ), S(-.10, 2.70), [.27, sy * 1.0, 2.67]], [-.018, -sy * .012, 0], hull);            // cheek plate
        L('x', [-2.97, sy * (Yw(2.28) - .01), 2.28], [[0, 0], [0, .012], [2.87, .012], [2.87, 0]], 6, dark);
        // air louvres (engine intake) on the lower front of the side wall: frame + 4 slats
        const W = (x, z, o = 0) => [x, sy * (Yw(z) + o), z];
        v5FacePlate(M, [W(.48, 1.33), W(-.80, 1.33), W(-.80, 1.71), W(.48, 1.71)], .03, [-.2, 0, 1.6], dark);
        for (let k = 0; k < 4; k++) { const z = 1.37 + k * .085; v5FacePlate(M, [W(.44, z, .028), W(-.76, z, .028), W(-.76, z + .05, .018), W(.44, z + .05, .018)], .012, [-.2, 0, 1.6], grille); }
        for (const x of [.30, -.15, -.60]) v5FacePlate(M, [W(x + .015, 1.34, .03), W(x - .015, 1.34, .03), W(x - .015, 1.70, .03), W(x + .015, 1.70, .03)], .012, [-.2, 0, 1.6], dark);
        for (let k = 0; k < 10; k++) { const x = .55 - k * .37; v5FacePlate(M, [W(x + .012, 2.18 - k * .01), W(x - .012, 2.18 - k * .01), W(x - .012, 2.21 - k * .01), W(x + .012, 2.21 - k * .01)], .012, [-.2, 0, 1.6], dark); }   // rivet line
        M.box(-2.90, -1.10, sy > 0 ? 1.08 : -1.42, sy > 0 ? 1.42 : -1.08, FZ, FZ + .42, inner);                                         // ammunition racks
        for (let k = 0; k < 7; k++) L('z', [-1.25 - k * .25, sy * 1.25, FZ + .42], [[0, 0], [0, .075], [.012, .075], [.012, 0]], 12, M.mat([168, 132, 60], { spec: .5, noise: .3 }));
      }
      v5Slab(M, [[.84, -1.0, 1.77], [.84, 1.0, 1.77], [.27, 1.0, 2.67], [.27, -1.0, 2.67]], [-.025, 0, -.016], hull);                    // front plate
      v5Slab(M, [[-2.97, -Yw(2.28), 2.28], [-2.97, Yw(2.28), 2.28], [-3.15, FW, FZ], [-3.15, -FW, FZ]], [.025, 0, -.005], hull);           // rear plate
      { const R = (y, z) => [-2.97 - (2.28 - z) / .98 * .18 - .004, y, z];                                                                 // rear door (two leaves) + hinges
        for (const [y0, y1] of [[-.40, -.01], [.01, .40]]) { v5FacePlate(M, [R(y0, 1.45), R(y1, 1.45), R(y1, 2.15), R(y0, 2.15)], .014, [-2.5, 0, 1.8], hull);
          const ye = Math.abs(y0) > Math.abs(y1) ? y0 : y1; for (const z of [1.60, 2.00]) { const p = R(ye, z); M.box(p[0] - .04, p[0], ye - .05, ye + .05, z - .03, z + .03, dark); } } }
      M.box(-3.0, .80, -1.45, 1.45, FZ, FZ + .02, inner);                                                                              // floor
      // ---- rear: muffler across the plate, tow brackets, idler housings ----
      L('y', [-3.20, -.95, 1.08], [[0, 0], [0, .10], [1.90, .10], [1.90, 0]], 14, dark);
      for (const yy of [-.70, .70]) { M.box(-3.12, -3.00, yy - .06, yy + .06, .70, .90, dark); L('y', [-3.10, yy - .07, .80], [[0, 0], [0, .045], [.14, .045], [.14, 0]], 10, dark); }
      // ---- 15 cm sFH 18/1: trunnion (−.51, 2.23), bore .17 above → Z 2.40: L/29.5 tube 4.44 m to the muzzle X 3.66 (thick to X 1.59), recuperator above
      //   (X −.81 … .71, Z 2.73), recoil brake below (X .59 … 1.33), armoured cradle housing in the front plate (X .69 … .99), breech, sight, handwheels ----
      { const TX = -.51, TZr = 2.23, BZ = TZr + .17;
        M.box(TX - .70, TX - .27, -.21, .21, TZr - .03, TZr + .37, gun);                                                                 // breech ring + block
        L('x', [TX - .27, 0, BZ], [[0, 0], [0, .15], [.62, .145], [2.37, .145], [2.39, .112], [4.38, .108], [4.40, .122], [4.44, .122], [4.44, 0]], 18, gun);
        v120Bore(M, K, 3.66, 0, BZ, .149);
        L('x', [-.14, 0, 2.72], [[0, 0], [0, .12], [.86, .12], [.88, .13], [.94, .13], [.96, .08], [.96, 0]], 18, gun);                       // recuperator above (drawing: X −.12 … .80)
        M.box(-.40, -.10, -.10, .10, 2.55, 2.66, gun);
        L('x', [.59, 0, 2.03], [[0, 0], [0, .105], [.66, .105], [.70, .085], [.74, .04], [.74, 0]], 16, gun);                              // recoil brake below
        M.box(TX - .20, .62, -.16, .16, TZr - .25, TZr + .05, hull);                                                                     // cradle
        for (const x of [-.05, .45]) M.box(x, x + .06, -.17, .17, TZr - .02, TZr + .58, dark);                                          // cradle bands
        M.box(.69, .99, -.21, .21, 2.15, 2.58, hull); M.box(.97, 1.00, -.17, .17, 2.19, 2.54, dark);                                   // armoured cradle housing
        M.box(TX - .55, TX - .20, .21, .31, TZr + .10, TZr + .40, dark); M.box(TX - .555, TX - .545, .23, .29, TZr + .25, TZr + .34, glass);   // sight (left)
        L('y', [TX - .35, .30, TZr - .05], [[0, 0], [0, .14], [.02, .14], [.02, 0]], 16, dark); L('y', [TX - .15, -.30, TZr - .05], [[0, 0], [0, .13], [-.02, .13], [-.02, 0]], 16, dark);
        M.box(TX - .30, TX + .30, -.50, .50, FZ, TZr - .25, hull);                                                                      // mount / top carriage on the floor
        // travel lock: A-frame on the nose, clamp round the tube
        for (const sy of [-1, 1]) v5Rod(M, [2.64, sy * .90, 1.12], [2.64, sy * .06, BZ - .17], .035, dark, 6);
        v5Rod(M, [2.64, -.62, 1.70], [2.64, .62, 1.70], .025, dark, 6);
        M.box(2.58, 2.70, -.19, .19, BZ - .19, BZ - .13, dark); for (const sy of [-1, 1]) M.box(2.58, 2.70, sy * .165 - .025, sy * .165 + .025, BZ - .19, BZ + .12, dark); M.box(2.58, 2.70, -.19, .19, BZ + .12, BZ + .16, dark); }
      // ---- running gear: Pz IV double road wheels in four leaf-spring bogies, four return rollers, front sprocket, rear idler, track ----
      const C1 = [2.50, .72], R1 = .40, C2 = [-2.56, .58], R2 = .36, WX = [1.82, 1.33, .80, .30, -.25, -.74, -1.32, -1.78], WZ = .29, RX = [1.64, .57, -.47, -1.46], RZ = .97;
      const out = [];
      v5Arc(out, C1, R1 + .03, Math.PI / 2, -1.85, 14);
      out.push([2.05, 0], [-2.05, 0]);
      v5Arc(out, C2, R2 + .05, -2.05, -Math.PI * 1.5, 12);
      out.push([-1.70, 1.08], [1.90, 1.10]);
      for (const sy of [-1, 1]) {
        const ys = sy * YT, f = sy;
        v5Track(M, out, ys - .20, ys + .20, .07, .12, trk, trkR);
        for (let k = 0; k < 8; k++) p4Wheel(M, WX[k], ys, WZ, f, wheel, tyre, dark, L);
        for (let k = 0; k < 8; k += 2) {
          const xc = (WX[k] + WX[k + 1]) / 2;
          M.box(xc - .16, xc + .16, sy > 0 ? 1.04 : -1.14, sy > 0 ? 1.14 : -1.04, .56, .74, dark);
          M.box(xc - .13, xc + .13, sy * 1.15 - .015, sy * 1.15 + .015, .58, .72, wheel);
          L('x', [xc - .25, sy * 1.13, .44], [[0, 0], [0, .06], [.50, .06], [.50, 0]], 10, dark);
          M.box(xc - .25, xc + .25, sy > 0 ? 1.05 : -1.17, sy > 0 ? 1.17 : -1.05, .40, .47, dark);
        }
        for (let k = 0; k < 4; k++) {
          const x = RX[k];
          L('y', [x, sy * HW, RZ], [[0, 0], [0, .06], [.22 * sy, .06], [.22 * sy, .045]], 10, dark);
          L('y', [x, ys, RZ], [[-.05 * f, 0], [-.05 * f, .105, tyre], [.05 * f, .105, tyre], [.05 * f, .08, wheel], [.07 * f, .075, wheel], [.07 * f, 0, wheel]], 18, tyre);
        }
        L('y', [C1[0], ys, C1[1]], [[-.12 * f, 0], [-.12 * f, .31, wheel], [-.10 * f, .335, wheel], [-.06 * f, .335, wheel], [-.06 * f, .30, dark], [.06 * f, .30, dark], [.06 * f, .335, wheel], [.10 * f, .335, wheel], [.12 * f, .31, wheel], [.12 * f, .17, wheel], [.15 * f, .156, wheel], [.15 * f, 0, wheel]], 28, wheel);
        for (let k = 0; k < 8; k++) pnRadial(M, C1[0], C1[1], k * Math.PI / 4 + .2, .16, .31, .07, .04, ys + .105 * f - .012, ys + .105 * f + .012, dark);
        for (let k = 0; k < 20; k++) { const a = k * Math.PI / 10 + .05; pnRadial(M, C1[0], C1[1], a, .335, .43, .075, .05, ys - .11, ys + .11, wheel); }
        L('y', [C1[0], ys + .15 * f, C1[1]], [[0, 0], [0, .085], [.03 * f, .085], [.03 * f, .04], [.05 * f, .04], [.05 * f, 0]], 14, dark);
        L('y', [C2[0], ys, C2[1]], [[-.11 * f, 0], [-.11 * f, .295, wheel], [-.06 * f, .31, wheel], [.06 * f, .31, wheel], [.11 * f, .295, wheel], [.11 * f, .20, wheel], [.07 * f, .17, dark], [.07 * f, .09, dark], [.13 * f, .09, wheel], [.13 * f, 0, wheel]], 26, wheel);
        for (let k = 0; k < 8; k++) pnRadial(M, C2[0], C2[1], k * Math.PI / 4 + .1, .09, .295, .05, .03, ys + .09 * f - .01, ys + .09 * f + .01, dark);
        L('y', [C2[0], ys + .13 * f, C2[1]], [[0, 0], [0, .09], [.03 * f, .09], [.03 * f, .05], [.05 * f, .05], [.05 * f, 0]], 14, dark);
        extrudeXZ(M, [[-2.15, .95], [-2.48, .66], [-2.62, .50], [-2.26, .56]], sy > 0 ? 1.00 : -1.07, sy > 0 ? 1.07 : -1.00, dark);
        extrudeXZ(M, [[2.45, 1.0], [2.72, .76], [2.62, .62], [2.34, .90]], sy > 0 ? 1.00 : -1.07, sy > 0 ? 1.07 : -1.00, dark);
      }
      return M;
    }

    // ---------- v126 Sd.Kfz. 251 Ausf. D — 251/9 4-view (56.4 px/m; running gear and nose as the 251/1 model): kind 'stummel' (251/9, 7.5 cm L/24) | 'amb' (251/8) ----------
    function buildSdKfz251D(paint, kind) {
      const P = PAINT[paint] || PAINT.grey, M = new Mesh();
      const hull = M.mat(P.hull, { spec: .08 }), dark = M.mat(P.dark, { spec: .05 }), gun = M.mat(P.gun, { spec: .22, noise: .5 });
      const trk = M.mat([58, 54, 48], { spec: .06, noise: 1.4 }), trkR = M.mat([70, 64, 56], { shadow: false, noise: 1.4 }), tyre = M.mat([30, 31, 33], { noise: .6 }), wheel = M.mat(P.wheel, { spec: .12 });
      const grille = M.mat([34, 36, 38], { shadow: false, noise: .5 }), glass = M.mat([200, 205, 190], { spec: .9, shadow: false, noise: 0 }), black = M.mat([22, 24, 26], { shadow: false, noise: 0 });
      const inner = M.mat([84, 87, 90], { spec: .03, noise: .8 }), wood = M.mat([112, 84, 56], { spec: .03, noise: 1.3 }), seat = M.mat([70, 62, 52], { spec: .03, noise: 1.0 });
      const L = (ax, o, prof, seg, m) => M.lathe(ax, o, prof, seg, m);
      const TZ = 1.826, TR = .70, WZ0 = 1.37, WW = 1.0, FL = 1.0;              // rim, waist (top of the built-in lockers), floor                                  // rim height / half-width, waist height / half-width

      // ---- closed front body: radiator nose, hood, driver's plate (stations [zb, bb, zw, w, zr, r]) ----
      const F = [
        [2.88, [.45, .40, .97, .50, 1.26, .30]],
        [2.54, [.47, .45, .99, .62, 1.32, .33]],
        [1.65, [.50, .55, 1.17, .80, 1.44, .42]],
        [.82, [.50, .58, 1.36, .95, 1.60, .55]],
        [.61, [.50, .60, WZ0, WW, TZ, TR]]];
      v5Loft(M, F.map(([x, p]) => [x, v5Hex(...p)]), hull);
      // ---- v126 Ausf. D troop compartment (251/9 drawing, 56.4 px/m): tub closed at the floor FL, stowage lockers built into vertical lower sides (±WW from the
      //   track guard to the waist WZ0 1.37), upper side plates leaning in to the rim (±TR at TZ), rear: upper plate from the rim (X XR) out to the kink (XK at the
      //   waist), lower plate back in to the bottom corner (XB, ZB) — the "<" of the drawing; open top ----
      const XR = -2.335, XK = -2.71, XB = -2.33, ZB = .77, BB = .55, XG = XK + (WZ0 - .93) / (WZ0 - ZB) * (XB - XK);   // XG: rear plate at the track-guard height
      const tub = (zb, bb, w) => [[-bb, zb], [-w, FL], [w, FL], [bb, zb]];
      v5Loft(M, [[.62, tub(.50, .60, .86)], [-2.30, tub(.55, .60, .86)], [-2.45, tub(.80, .58, .86)]], hull);
      for (const sy of [-1, 1]) {
        extrudeXZ(M, [[.60, .93], [.60, WZ0], [XK, WZ0], [XG, .93]], sy > 0 ? WW - .14 : -WW, sy > 0 ? WW : -WW + .14, hull);                    // lockers (built in)
        M.box(XG + .30, .58, sy > 0 ? WW - .16 : -WW + .14, sy > 0 ? WW - .14 : -WW + .16, FL, WZ0, inner);                                         // their inner face
        M.box(XG + .30, .58, sy > 0 ? WW - .16 : -WW + .02, sy > 0 ? WW - .02 : -WW + .16, WZ0 - .015, WZ0 + .005, inner);                          // ledge at the waist
        v5Slab(M, [[.61, sy * WW, WZ0], [XK, sy * WW, WZ0], [XR, sy * TR, TZ], [.61, sy * TR, TZ]], [0, -sy * .022, -.008], hull);                // upper side plate
        v5Slab(M, [[.61, sy * (WW - .03), WZ0 + .02], [XK + .06, sy * (WW - .03), WZ0 + .02], [XR + .03, sy * (TR - .025), TZ - .01], [.61, sy * (TR - .025), TZ - .01]], [0, -sy * .004, 0], inner);
        L('x', [XK + .02, sy * (WW - .005), WZ0], [[0, 0], [0, .012], [.61 - XK, .012], [.61 - XK, 0]], 6, dark);                                   // waist seam
      }
      v5Slab(M, [[XR, -TR, TZ], [XR, TR, TZ], [XK, WW, WZ0], [XK, -WW, WZ0]], [.02, 0, .008], hull);                                                // upper rear plate
      v5Slab(M, [[XK, -WW, WZ0], [XK, WW, WZ0], [XG, WW, .93], [XB, BB, ZB], [XB, -BB, ZB], [XG, -WW, .93]], [.02, 0, .012], hull);                // lower rear plate
      v5Slab(M, [[XR + .03, -TR + .03, TZ - .02], [XR + .03, TR - .03, TZ - .02], [XK + .05, WW - .06, WZ0 + .02], [XK + .05, -WW + .06, WZ0 + .02]], [.004, 0, 0], inner);
      M.box(XG + .05, .55, -.84, .84, FL, FL + .02, inner);                                                                                          // floor
      M.box(XK + .04, XG + .05, -.84, .84, WZ0 - .02, WZ0, inner);                                                                                   // rear shelf at the waist
      for (const sy of [-1, 1]) {                                                                                                                   // benches, backrests, rifle racks (rear) ; driver / commander seats
        if (kind !== 'stummel' || sy > 0) { M.box(-2.20, -.95, sy > 0 ? .50 : -.84, sy > 0 ? .84 : -.50, FL + .02, FL + .40, seat); M.box(-2.20, -.95, sy > 0 ? .78 : -.84, sy > 0 ? .84 : -.78, FL + .40, FL + .62, seat); }
        for (let k = 0; k < 3; k++) M.box(-2.05 + k * .40, -2.01 + k * .40, sy > 0 ? .70 : -.80, sy > 0 ? .80 : -.70, FL + .45, FL + .68, wood);
        M.box(.10, .48, sy > 0 ? .12 : -.52, sy > 0 ? .52 : -.12, FL + .02, FL + .30, seat); M.box(.06, .12, sy > 0 ? .12 : -.52, sy > 0 ? .52 : -.12, FL + .30, FL + .62, seat);
      }
      M.box(.50, .62, -.60, .60, FL + .30, FL + .55, dark);                                                                                          // dashboard
      // rear doors: two leaves bent over the kink (upper + lower rear plates), hinges, handles, tail lights
      { const PU = (y, t) => [XR + (XK - XR) * t, y, TZ + (WZ0 - TZ) * t], PL = (y, t) => [XK + (XB - XK) * t, y, WZ0 + (ZB - WZ0) * t];
        for (const [y0, y1] of [[-.51, -.01], [.01, .51]]) {
          v5FacePlate(M, [PU(y0, .06), PU(y1, .06), PU(y1, 1), PU(y0, 1)], .012, [0, 0, 1.3], hull);
          v5FacePlate(M, [PL(y0, 0), PL(y1, 0), PL(y1, .82), PL(y0, .82)], .012, [0, 0, 1.3], hull);
          const ye = Math.abs(y0) > Math.abs(y1) ? y0 : y1;
          for (const t of [.25, .80]) { const p = PU(ye, t); M.box(p[0] - .035, p[0] + .01, ye - .05, ye + .05, p[2] - .03, p[2] + .03, dark); }
          for (const t of [.20, .65]) { const p = PL(ye, t); M.box(p[0] - .035, p[0] + .01, ye - .05, ye + .05, p[2] - .03, p[2] + .03, dark); }
          const h = PU((y0 + y1) / 2 + (y1 > 0 ? -.16 : .16), .85); M.box(h[0] - .05, h[0], h[1] - .06, h[1] + .06, h[2] - .015, h[2] + .015, dark);
        }
        for (const sy of [-1, 1]) { const p = PL(sy * .70, .55); L('x', [p[0] - .01, p[1], p[2]], [[0, 0], [0, .035], [-.04, .035], [-.04, 0]], 10, M.mat([120, 40, 34], { shadow: false })); } }
      // ---- driver's plate: two visors ; side visors ; hood top hatches, side louvres ; radiator grille, headlights, Notek, tow hooks ----
      const dp = z => .82 - (z - 1.60) / .22 * .21;
      for (const yc of kind === 'stummel' ? [.33] : [-.33, .33]) { M.hex8([[dp(1.58) + .002, yc - .17, 1.58], [dp(1.58) + .002, yc + .17, 1.58], [dp(1.70) + .002, yc + .17, 1.70], [dp(1.70) + .002, yc - .17, 1.70],
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
        for (const [xa, xb] of [[-.02, -.67], [-.68, -1.32], [-1.35, -1.97]]) {                                                                                  // v126: three locker doors flush in the side
          M.box(xb, xa, sy > 0 ? WW : -WW - .008, sy > 0 ? WW + .008 : -WW, .98, 1.27, dark); M.box(xb + .02, xa - .02, sy > 0 ? WW : -WW - .012, sy > 0 ? WW + .012 : -WW, 1.00, 1.25, hull);
          for (const xx of [xa - .10, xb + .10]) M.box(xx - .02, xx + .02, sy > 0 ? WW : -WW - .02, sy > 0 ? WW + .02 : -WW, 1.17, 1.24, dark);
        }
        M.box(-1.95, -1.10, sy > 0 ? WW : -WW - .04, sy > 0 ? WW + .04 : -WW, 1.29, 1.35, wood);                                                                   // pick / shovel
      }
      if (kind === 'stummel') {
        // ---- 251/9: 7.5 cm KwK 37 L/24 offset to the right (Y −.24), bore Z 1.72 — box mount in the right half of the driver's plate, recoil sleeve Ø .16
        //   (X .74 … 1.07), tube to the muzzle at X 1.335; breech, cradle and pedestal inside; shield leaning back on the rim above it (drawing: X .35 → .235,
        //   top Z 2.01, gussets back to X .11); MG 42 behind the shield; AA bracket on the rear rim ----
        const GY = -.24, GZ = 1.72;
        M.hex8([[dp(1.58) - .04, GY - .17, 1.58], [dp(1.58) - .04, GY + .17, 1.58], [dp(1.84) - .04, GY + .17, 1.84], [dp(1.84) - .04, GY - .17, 1.84],
                [dp(1.58) + .07, GY - .17, 1.58], [dp(1.58) + .07, GY + .17, 1.58], [dp(1.84) + .07, GY + .17, 1.84], [dp(1.84) + .07, GY - .17, 1.84]], hull);   // mount box
        L('x', [dp(GZ) + .03, GY, GZ], [[0, 0], [0, .095], [.04, .095], [.05, .08], [.33, .075], [.34, .055], [.60, .05], [.60, .056], [.62, .056], [.62, 0]], 18, gun);
        v120Bore(M, { black }, dp(GZ) + .65, GY, GZ, .075);
        M.box(-.47, -.12, GY - .13, GY + .13, GZ - .12, GZ + .12, gun); L('x', [-.12, GY, GZ], [[0, 0], [0, .07], [.70, .07], [.70, 0]], 14, gun);   // breech, tube inside
        M.box(-.25, .55, GY - .10, GY + .10, GZ - .21, GZ - .07, hull); for (const sy of [-1, 1]) L('x', [-.20, GY + sy * .07, GZ - .14], [[0, 0], [0, .035], [.70, .035], [.70, 0]], 10, dark);
        v5Rod(M, [.15, GY, FL], [.15, GY, GZ - .21], .06, dark, 8); M.box(-.05, .35, GY - .22, GY + .22, FL, FL + .05, dark);                        // pedestal
        M.box(-.32, -.05, GY + .13, GY + .23, GZ - .02, GZ + .12, dark); M.box(-.33, -.32, GY + .15, GY + .21, GZ + .02, GZ + .09, glass);          // sight
        L('y', [-.20, GY - .14, GZ - .10], [[0, 0], [0, .09], [-.02, .09], [-.02, 0]], 14, dark);                                                   // handwheel
        v5Slab(M, [[.35, -TR + .02, TZ], [.35, TR - .02, TZ], [.235, TR - .06, 2.01], [.235, -TR + .06, 2.01]], [-.018, 0, -.004], hull);          // shield
        for (const sy of [-1, 1]) v5Slab(M, [[.35, sy * (TR - .03), TZ], [.235, sy * (TR - .07), 2.01], [.11, sy * (TR - .03), TZ]], [0, -sy * .015, 0], hull);
        M.hex8([[.30, GY - .10, 1.87], [.30, GY + .10, 1.87], [.262, GY + .10, 1.95], [.262, GY - .10, 1.95], [.312, GY - .10, 1.87], [.312, GY + .10, 1.87], [.274, GY + .10, 1.95], [.274, GY - .10, 1.95]], black);   // sight slit
        { const my = .32, mz = 1.94;                                                                                                                // MG 42 on the pintle behind the shield
          v5Rod(M, [-.05, my, TZ - .02], [-.05, my, mz - .03], .02, dark, 6);
          M.box(-.10, .30, my - .022, my + .022, mz - .03, mz + .016, gun); for (let k = 0; k < 5; k++) M.box(-.04 + k * .07, -.01 + k * .07, my - .024, my + .024, mz - .012, mz + .004, black);
          L('x', [.30, my, mz - .007], [[0, 0], [0, .02], [.05, .02], [.07, .012], [.10, .011], [.10, 0]], 10, gun);
          M.box(-.42, -.10, my - .03, my + .03, mz - .035, mz + .02, gun); M.box(-.42, -.35, my - .02, my + .02, mz - .09, mz - .035, M.mat([104, 62, 36], { spec: .15 })); }
      } else if (kind === 'amb') {
        // ---- 251/8: canvas cover on bows over the compartment (from just behind the driver's plate to the rear plate), lashed to the rim; white discs with red crosses
        //   on the hood and the cover roof (icon) ----
        const canvas = M.mat([158, 140, 100], { spec: .03, noise: 1.3 }), X0 = .50, X1 = XR - .02;
        const sec = (x, s) => { const w = TR + .02; return [x, [[-w, TZ - .03], [-w, TZ + .06 - s], [-.62, TZ + .16 - s], [-.40, TZ + .23 - s], [-.14, TZ + .26 - s], [.14, TZ + .26 - s], [.40, TZ + .23 - s], [.62, TZ + .16 - s], [w, TZ + .06 - s], [w, TZ - .03]]]; };
        const st = [sec(X0 + .06, .14), sec(X0, .02)]; for (let k = 1; k < 8; k++) st.push(sec(X0 + (X1 - X0) * k / 8, k % 2 ? .03 : 0)); st.push(sec(X1, .02)); st.push(sec(X1 - .05, .12));
        v5Loft(M, st, canvas);
        for (let k = 0; k < 6; k++) { const x = X0 - .25 - k * .48; for (const sy of [-1, 1]) v5Rod(M, [x, sy * (TR + .035), TZ - .02], [x, sy * (TR + .035), TZ + .10], .008, dark, 4); }
        L('x', [X1, 0, TZ + .02], [[0, 0], [0, .01], [X0 - X1, .01], [X0 - X1, 0]], 4, dark);
        const nT = M.M.length, white = M.mat([226, 226, 218], { spec: .05, noise: .3, dirt: .5 }), red = M.mat([176, 34, 30], { spec: .05, noise: .3, dirt: .5 });
        for (const [o, R] of [[[2.02, 0, 4], .25], [[-1.60, 0, 5], .34]]) { v112Decal(M, nT, o, [0, 0, -1], R, V126_DISC, white, [1, 0, 0], .012); v112Decal(M, nT, o, [0, 0, -1], R * .78, V112_CROSS, red, [1, 0, 0], .02); }
      }
      if (kind === 'stummel') {                                                                                                                     // AA bracket + MG on the rear rim
        L('z', [XR + .04, 0, TZ - .04], [[0, 0], [0, .025], [.26, .025], [.26, 0]], 8, dark); M.box(XR - .02, XR + .10, -.06, .06, TZ - .06, TZ, dark);
        L('x', [XR + .02, 0, 2.08], [[0, 0], [0, .025], [-.22, .025], [-.22, .02], [-.50, .02], [-.50, 0]], 10, gun); M.box(XR - .02, XR + .28, -.03, .04, 2.03, 2.11, gun);   // pointing aft
      }
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


    // ---------- v126 Pz.Kpfw. III Ausf. L — Ausf. G drawing (286 px/m from its 3 m bar; chassis = the StuG III model, checked on it), L 4-views + render:
    //   5 cm KwK 39 L/60 (muzzle X 3.65), external mantlet with the 20 mm spaced plate, hull-front Vorpanzer, cupola, side doors, turret stowage bin ----------
    function buildPanzer3L(paint) {
      const P = PAINT[paint] || PAINT.grey, M = new Mesh();
      const hull = M.mat(P.hull, { spec: .08 }), dark = M.mat(P.dark, { spec: .05 }), gun = M.mat(P.gun, { spec: .22, noise: .5 });
      const trk = M.mat([58, 54, 48], { spec: .06, noise: 1.4 }), trkR = M.mat([70, 64, 56], { shadow: false, noise: 1.4 }), tyre = M.mat([30, 31, 33], { noise: .6 }), wheel = M.mat(P.wheel, { spec: .12 });
      const grille = M.mat([34, 36, 38], { shadow: false, noise: .5 }), glass = M.mat([200, 205, 190], { spec: .9, shadow: false, noise: 0 }), black = M.mat([22, 24, 26], { shadow: false, noise: 0 }), wood = M.mat([112, 84, 56], { spec: .03, noise: 1.3 });
      const L = (ax, o, prof, seg, m) => M.lathe(ax, o, prof, seg, m);
      const HW = .98, FZ = 1.29, DZ = 1.60;

      // ---- hull: vertical nose plate, glacis, superstructure (front plate, roof), engine deck, sloped rear ----
      extrudeXZ(M, [[2.62, .98], [2.62, 1.20], [1.73, 1.31], [1.69, 1.635], [-.45, 1.635], [-.48, DZ], [-2.55, DZ], [-2.60, 1.30], [-2.60, .78], [-2.30, .45], [2.25, .45]], -HW, HW, hull);
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
        if (sy > 0) { L('x', [2.02, 1.28, FZ + .14], [[0, 0], [0, .07], [.04, .08], [.12, .08], [.13, .065], [.13, 0]], 14, dark); L('x', [2.15, 1.28, FZ + .14], [[0, 0], [0, .072], [.006, .07], [.006, 0]], 14, glass); M.box(2.04, 2.10, 1.26, 1.30, FZ, FZ + .08, dark); }   // headlight (left)
        L('x', [.60, sy * 1.33, FZ + .068], [[0, 0], [0, .07], [1.0, .07], [1.0, 0]], 12, wood);                              // jack block / tool rolls
        M.box(-2.50, -1.70, sy > 0 ? 1.19 : -1.45, sy > 0 ? 1.45 : -1.19, FZ, FZ + .16, hull);                              // rear fender boxes
      }
      // ---- v126 Pz.Kpfw. III superstructure (Ausf. G drawing, 286 px/m): front plate X 1.73 → 1.69 (Z 1.31 … 1.635), roof 1.635 back to the engine deck ----
      const FPx = z => 1.73 - (z - 1.31) / .325 * .04, RZ = 1.635;
      M.box(1.62, 1.72, -HW, HW, RZ - .03, RZ, hull);                                                                                // rounded roof-front edge
      // driver's visor (Fahrersehklappe 50, left) + KFF periscope ports above; MG 34 in the ball mount (Kugelblende 50, right)
      M.box(FPx(1.42), FPx(1.42) + .06, .26, .66, 1.40, 1.56, hull); M.box(FPx(1.42) + .055, FPx(1.42) + .065, .33, .59, 1.465, 1.495, black);
      for (const yy of [.37, .55]) L('x', [FPx(1.59), yy, 1.595], [[0, 0], [0, .022], [.02, .022], [.02, 0]], 10, black);
      L('x', [FPx(1.47), -.45, 1.47], [[0, 0], [0, .15], [.05, .145], [.10, .12], [.12, .075], [.12, 0]], 18, hull);
      L('x', [FPx(1.47) + .11, -.45, 1.47], [[0, 0], [0, .03], [.05, .03], [.05, .02], [.42, .015], [.42, 0]], 10, gun);
      // Ausf. L: 20 mm spaced plate (Vorpanzer) .13 ahead of the front plate on four brackets, open round the ball mount, visor slot cut through
      { const VX = 1.86;
        M.box(VX, VX + .025, -.28, HW - .04, 1.32, 1.625, hull); M.box(VX, VX + .025, -HW + .04, -.63, 1.32, 1.625, hull);
        M.box(VX, VX + .025, -.63, -.28, 1.60, 1.625, hull); M.box(VX, VX + .025, -.63, -.28, 1.32, 1.335, hull);
        M.box(VX + .022, VX + .028, .33, .59, 1.465, 1.495, black);
        for (const yy of [-.85, -.10, .40, .85]) for (const zz of [1.36, 1.58]) M.box(FPx(zz), VX, yy - .025, yy + .025, zz - .02, zz + .02, dark);
        for (let k = 0; k < 7; k++) for (const zz of [1.37, 1.57]) L('x', [VX + .025, -.85 + k * .28 + (k > 1 && k < 4 ? .02 : 0), zz], [[0, 0], [0, .014], [.01, .014], [.01, 0]], 6, dark); }
      // spare track links across the nose plate (render)
      for (let k = 0; k < 4; k++) { const y0 = -.86 + k * .435; M.box(2.665, 2.69, y0, y0 + .40, 1.03, 1.15, trk); M.box(2.69, 2.71, y0 + .17, y0 + .23, 1.05, 1.13, trkR);
        for (const yy of [y0 + .04, y0 + .36]) L('y', [2.69, yy - .015, 1.09], [[0, 0], [0, .018], [.03, .018], [.03, 0]], 6, dark); }
      // side vision ports (front of the superstructure sides), escape hatches between the running gear, side roof edge
      for (const sy of [-1, 1]) {
        M.box(1.20, 1.46, sy > 0 ? HW : -HW - .035, sy > 0 ? HW + .035 : -HW, 1.40, 1.58, hull); M.box(1.25, 1.41, sy > 0 ? HW + .03 : -HW - .04, sy > 0 ? HW + .04 : -HW - .03, 1.475, 1.50, black);
        M.box(.15, .72, sy > 0 ? HW : -HW - .02, sy > 0 ? HW + .02 : -HW, .56, .80, hull); for (const x of [.25, .62]) M.box(x - .04, x + .04, sy > 0 ? HW + .015 : -HW - .03, sy > 0 ? HW + .03 : -HW - .015, .74, .78, dark);
        L('x', [-.40, sy * (HW + .01), RZ - .03], [[0, 0], [0, .012], [2.02, .012], [2.02, 0]], 6, dark);
      }
      // roof: turret ring, ventilator, driver's / radio operator's roof hatches were on the glacis (kept above)
      L('z', [.30, 0, RZ], [[0, 0], [0, .86], [.06, .86], [.06, 0]], 40, dark);
      L('z', [1.10, -.55, RZ], [[0, 0], [0, .09], [.04, .085], [.05, .05], [.05, 0]], 14, dark);
      M.grp = 1;   // v192: turret part (rotates on its own)
      // ---- turret (G drawing: front plate X 1.29, sides out to ±.88, rear plate −.58, base Z 1.70, roof 2.15; front view: roof edge ±.71) ----
      const TB0 = 1.695, TT = 2.15;
      v5LoftZ(M, v5Mir([[1.29, .63], [1.17, .80], [.40, .88], [-.25, .86], [-.58, .68]]), v5Mir([[1.25, .58], [1.13, .69], [.40, .72], [-.25, .70], [-.53, .56]]), TB0, TT, hull);
      M.prismXY(v5Mir([[1.27, .60], [1.16, .76], [.40, .84], [-.25, .82], [-.56, .65]]), TB0 - .02, TB0 + .02, dark);
      // turret side: two-piece side doors (visor in the front leaf), vision port ahead of them — on the leaning side faces
      for (const sy of [-1, 1]) {
        const SD = (x, z, o = 0) => { const t = (z - TB0) / (TT - TB0), yb = x > .40 ? .80 + (.88 - .80) * (1.17 - x) / .77 : .88 - (.88 - .86) * (.40 - x) / .65, yt = x > .40 ? .69 + (.72 - .69) * (1.13 - x) / .73 : .72 - (.72 - .70) * (.40 - x) / .65;
          return [x, sy * (yb + (yt - yb) * t + o), z]; };
        for (const [x0, x1] of [[.30, .06], [.04, -.22]]) { v5FacePlate(M, [SD(x0, 1.76), SD(x1, 1.76), SD(x1, 2.08), SD(x0, 2.08)], .016, [.3, 0, 1.9], hull);
          for (const z of [1.82, 2.02]) v5FacePlate(M, [SD(x0 - .005, z - .02, .016), SD(x0 - .04, z - .02, .016), SD(x0 - .04, z + .02, .016), SD(x0 - .005, z + .02, .016)], .012, [.3, 0, 1.9], dark); }
        v5FacePlate(M, [SD(.24, 1.93, .02), SD(.11, 1.93, .02), SD(.11, 1.95, .02), SD(.24, 1.95, .02)], .01, [.3, 0, 1.9], black);
        v5FacePlate(M, [SD(.70, 1.86), SD(.46, 1.86), SD(.46, 2.02), SD(.70, 2.02)], .02, [.3, 0, 1.9], hull);
        v5FacePlate(M, [SD(.66, 1.935, .02), SD(.50, 1.935, .02), SD(.50, 1.955, .02), SD(.66, 1.955, .02)], .01, [.3, 0, 1.9], black);
      }
      // turret front: vision ports either side of the mantlet; external mantlet (Außenblende); Ausf. L spaced plate on the mantlet; 5 cm KwK 39 L/60, coaxial MG 34 (right)
      for (const sy of [-1, 1]) { M.box(1.27, 1.31, sy * .47 - .07, sy * .47 + .07, 1.88, 2.02, hull); M.box(1.305, 1.315, sy * .47 - .05, sy * .47 + .05, 1.945, 1.96, black); }
      const GZ = 1.90;
      M.hex8([[1.27, -.25, 1.75], [1.27, .25, 1.75], [1.27, .25, 2.05], [1.27, -.25, 2.05], [1.54, -.21, 1.78], [1.54, .21, 1.78], [1.54, .21, 2.02], [1.54, -.21, 2.02]], hull);
      M.box(1.54, 1.57, -.20, .20, 1.79, 2.01, hull);
      M.hex8([[1.635, -.31, 1.73], [1.635, .31, 1.73], [1.635, .31, 2.07], [1.635, -.31, 2.07], [1.665, -.29, 1.75], [1.665, .29, 1.75], [1.665, .29, 2.05], [1.665, -.29, 2.05]], hull);
      for (const [yy, zz] of [[-.24, 1.78], [.24, 1.78], [-.24, 2.02], [.24, 2.02]]) M.box(1.56, 1.64, yy - .02, yy + .02, zz - .02, zz + .02, dark);
      for (const [yy, zz] of [[-.24, 1.78], [.24, 1.78], [-.24, 2.02], [.24, 2.02], [0, 2.045], [0, 1.755]]) L('x', [1.665, yy, zz], [[0, 0], [0, .013], [.008, .013], [.008, 0]], 6, dark);
      M.box(1.664, 1.668, .12, .20, 1.93, 1.95, black);                                                                             // sight aperture (left)
      L('x', [1.57, -.17, GZ], [[0, 0], [0, .028], [.14, .028], [.14, .014], [.18, .014], [.18, 0]], 10, gun);                       // coaxial MG 34 (right)
      L('x', [1.57, 0, GZ], [[0, 0], [0, .092], [.10, .09], [.10, .082], [.45, .074], [.47, .052], [2.03, .044], [2.03, .047], [2.08, .047], [2.08, 0]], 18, gun);   // sleeve + L/60 tube to X 3.65
      v120Bore(M, { black }, 3.65, 0, GZ, .05);
      // roof: cupola (rear centre) with five armoured visors and the two-piece hatch, signal port, ventilator, loader's / gunner's roof ports, lifting hooks
      { const cx = -.23;
        L('z', [cx, 0, TT], [[0, 0], [0, .33], [.03, .33], [.03, .30], [.19, .30], [.19, .32], [.21, .32], [.21, 0]], 30, hull);
        for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + k * Math.PI / 4; M.rectZ(cx + .31 * Math.cos(a), .31 * Math.sin(a), a, .05, .11, TT + .06, TT + .15, dark); M.rectZ(cx + .315 * Math.cos(a), .315 * Math.sin(a), a, .045, .07, TT + .09, TT + .12, black); }
        for (const sy of [-1, 1]) v5Slab(M, [[cx - .26, 0, TT + .21], [cx + .26, 0, TT + .21], [cx + .22, sy * .14, TT + .21], [cx, sy * .26, TT + .21], [cx - .22, sy * .14, TT + .21]], [0, 0, .03], dark);
        for (const sy of [-1, 1]) M.box(cx - .02, cx + .02, sy * .02 - .01, sy * .02 + .01, TT + .24, TT + .29, dark); }
      L('z', [.62, .36, TT], [[0, 0], [0, .07], [.06, .06], [.08, .03], [.08, 0]], 12, dark);
      L('z', [.62, -.36, TT], [[0, 0], [0, .09], [.03, .09], [.035, .05], [.035, 0]], 14, dark);
      for (const sy of [-1, 1]) { L('z', [.17, sy * .40, TT], [[0, 0], [0, .07], [.025, .06], [.035, 0]], 10, dark); M.box(1.0, 1.08, sy * .52 - .02, sy * .52 + .02, TT, TT + .05, dark); }
      // turret stowage bin (Rommelkiste) on the rear plate: rounded rear, bottom chamfered, lid hinges
      { const BIN = v5Mir([[-.52, .49], [-1.05, .49], [-1.19, .42], [-1.26, .26], [-1.27, .10]]), BIN2 = v5Mir([[-.52, .47], [-1.02, .47], [-1.13, .40], [-1.18, .25], [-1.19, .10]]);
        v5LoftZ(M, BIN2, BIN, 1.79, 1.88, hull, false); v5LoftZ(M, BIN, BIN, 1.88, 2.13, hull);
        for (const yy of [-.25, .25]) M.box(-.62, -.56, yy - .05, yy + .05, 2.13, 2.15, dark);
        M.box(-1.27, -1.25, -.10, .10, 1.95, 2.03, dark); }
      M.grp = 0;
      // ---- engine deck: two big hatches, side air louvres, rear hatches, spare road wheels lying flat, rear plate & muffler ----
      for (const [ya, yb] of [[-.85, -.12], [.10, .81]]) { M.box(-1.61, -.88, ya, yb, DZ, DZ + .025, hull); M.box(-1.58, -.91, ya + .03, yb - .03, DZ + .025, DZ + .035, dark); for (const xx of [-1.0, -1.49]) M.box(xx - .03, xx + .03, ya + .05, ya + .11, DZ + .035, DZ + .06, dark); }
      for (const sy of [-1, 1]) { M.box(-1.62, -.72, sy > 0 ? .84 : -1.0, sy > 0 ? 1.0 : -.84, DZ, DZ + .03, dark); M.box(-1.60, -.74, sy > 0 ? .86 : -.98, sy > 0 ? .98 : -.86, DZ + .03, DZ + .04, grille); }
      M.box(-2.10, -1.70, -.30, .30, DZ, DZ + .03, hull);
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



    const MODELS = {
      tiger: { build: buildTiger2, X0: .90, ant: [-.92, -1.35, 1.75, 3.80], tp: [-.12, 0, 1.80] },   // v192: tp = turret ring centre (x, y, z) for the split turret
      panther: { build: buildPanther2, X0: .80, ant: [-1.96, -1.40, 1.98, 3.55], tp: [-.10, 0, 1.88] },
      panzer4: { build: buildPanzer4b, X0: .35, ant: [-1.20, -.82, 1.76, 3.62], tp: [-.10, .067, 1.66] },   // v182: turret ring centre (split pilot)
      brummbar: { build: buildBrummbar, X0: .05, ant: [-.66, -1.00, 2.55, 3.85] },
      wirbelwind: { build: buildWirbelwind, X0: .05, ant: [-2.16, 1.20, 1.70, 3.50], tp: [-.15, 0, 1.76] },
      sherman: { build: buildSherman, X0: .0, ant: [-.98, .39, 2.55, 3.55], tp: [-.12, 0, 1.86], turAnt: true },   // v182: tp = turret ring centre (split pilot); turAnt = antenna sits on the turret
      easyeight: { build: buildEasyEight, X0: .5, ant: [-1.00, -.45, 2.75, 4.00], tp: [.30, 0, 1.90] },
      bulldozer: { build: buildShermanDozer, X0: .55, ant: [-.98, .39, 2.55, 3.55], tp: [-.12, 0, 1.86], turAnt: true },
      whizbang: { build: buildWhizbang, X0: .15, ant: [-1.95, -.85, 1.62, 3.85] },
      pershing: { build: buildPershing, X0: .9, ant: [-.98, -.40, 2.45, 3.65], tp: [.30, 0, 1.62] },
      sdkfz221: { build: buildSdKfz221, X0: .0, ant: [-2.00, .80, 1.46, 2.35], tp: [-.22, 0, 1.585] },
      marder3m: { build: buildMarder3M, X0: -.40, ant: [-1.95, .80, 1.95, 3.10] },
      sdkfz231: { build: buildSdKfz231, X0: .0, ant: [-2.45, -.48, 1.72, 3.10], tp: [.55, 0, 1.83] },
      stug3g: { build: buildStuG3G, X0: .45, ant: [-.40, -1.05, 1.92, 3.30] },
      sdkfz251: { build: buildSdKfz251, X0: .0, ant: [-2.30, -.62, 1.82, 2.95] },
      m8grey: { build: buildM8Grey, X0: .0, ant: [-.86, -.92, 1.64, 3.20], tp: [.11, 0, 1.48] },
      wespe: { build: buildWespe, X0: -.10, ant: [-.56, .84, 2.12, 3.20] },
      bergepanther: { build: buildBergepanther, X0: -.80, ant: [-1.30, -1.20, 2.47, 3.70] },
      m3ht: { build: buildM3Halftrack, X0: .10, ant: [-2.50, -.85, 1.87, 3.30] },
      m16: { build: buildM16, X0: -.10, ant: [-2.55, -.85, 1.98, 3.30], tp: [-1.68, 0, 1.98] },   // v195: tp = M45 quadmount ring centre
      m3gmc: { build: buildM3GMC, X0: .25, ant: [-2.50, -.85, 1.87, 3.20] },
      m18: { build: buildM18, X0: .0, ant: [-1.00, -.85, 2.24, 3.70], tp: [-.35, 0, 1.53] },
      m5: { build: buildM5, X0: .0, ant: [-.92, 0, 2.45, 3.40], tp: [.05, 0, 1.70] },
      m8hmc: { build: buildM8HMC, X0: .0, ant: [-.80, -.52, 2.21, 3.40] },
      m24: { build: buildM24, X0: .0, ant: [-1.05, .68, 2.17, 3.55], tp: [-.25, 0, 1.60] },                 // v112
      m3lee: { build: p => buildM3Lee(p), X0: .0, ant: [-.98, -1.10, 2.10, 3.40], tp: [-.14, .37, 2.10] },   // v191: turret ring centre of the 37 mm turret
      m31: { build: buildM31, X0: -.55, ant: [-1.60, -1.0, 2.16, 3.30] },
      jeep: { build: buildJeep, X0: -.15, ant: [-1.55, .55, 1.0, 2.55] },
      m29: { build: buildM29, X0: .0, ant: [1.47, -.67, 1.52, 2.55] },
      cckw: { build: buildCCKW, X0: .0, ant: [.33, -.90, 2.36, 3.0] },
      m3amb: { build: buildM3Amb, X0: .10, ant: [-2.50, -.85, 2.30, 3.30] }
    };
    function build(key, paint) { return MODELS[key].build(paint); }
