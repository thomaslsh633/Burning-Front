    // ---- small arms (local frame: origin at the right-hand grip, X along the bore, Z up); fore = support-hand point, butt = butt-plate X ----
    const V7W = {
      garand: { fore: [.27, 0, -.01], butt: -.36, build(M, k) {                // M1 Garand, 1.10 m
        M.hex8([[-.36, -.021, -.115], [-.06, -.021, -.05], [-.06, .021, -.05], [-.36, .021, -.115], [-.36, -.021, .02], [-.06, -.021, .015], [-.06, .021, .015], [-.36, .021, .02]], k.wood);
        M.box(-.08, .03, -.021, .021, -.05, .015, k.wood); M.box(.02, .48, -.02, .02, -.035, .015, k.wood); M.box(.22, .46, -.016, .016, .015, .04, k.wood);
        M.box(-.02, .21, -.018, .018, -.005, .045, k.steel); M.box(.0, .05, -.006, .006, -.075, -.035, k.steel);
        v7Limb(M, [.20, 0, .025], [.74, 0, .025], .011, .010, k.steel, 6); v7Limb(M, [.44, 0, .002], [.70, 0, .002], .011, .011, k.steel, 6);
        M.box(.715, .74, -.006, .006, .03, .058, k.steel); M.box(-.02, .02, -.008, .008, .045, .065, k.steel);
        M.box(.10, .16, -.03, -.018, .01, .03, k.steel); } },
      k98: { fore: [.29, 0, -.01], butt: -.36, build(M, k) {                   // Karabiner 98k, 1.11 m
        M.hex8([[-.36, -.021, -.12], [-.06, -.021, -.05], [-.06, .021, -.05], [-.36, .021, -.12], [-.36, -.021, .018], [-.06, -.021, .012], [-.06, .021, .012], [-.36, .021, .018]], k.wood);
        M.box(-.08, .03, -.021, .021, -.05, .012, k.wood); M.box(.02, .60, -.019, .019, -.032, .015, k.wood); M.box(.24, .52, -.015, .015, .015, .036, k.wood);
        M.box(-.03, .20, -.017, .017, -.002, .042, k.steel); M.box(.0, .05, -.006, .006, -.075, -.032, k.steel);
        v7Limb(M, [.20, 0, .024], [.75, 0, .024], .011, .009, k.steel, 6); M.box(.73, .75, -.006, .006, .028, .05, k.steel);
        for (const x of [.30, .52]) M.box(x - .012, x + .012, -.022, .022, -.036, .04, k.steel);                                        // barrel bands
        v7Limb(M, [.02, -.018, .035], [.02, -.065, .005], .007, .007, k.steel, 5); v7Ball(M, [.02, -.068, .0], .014, k.steel, 6); } },     // turned-down bolt handle
      bar: { fore: [.30, 0, -.01], butt: -.40, build(M, k) {                   // M1918A2 BAR, 1.21 m
        M.hex8([[-.40, -.023, -.12], [-.08, -.023, -.05], [-.08, .023, -.05], [-.40, .023, -.12], [-.40, -.023, .025], [-.08, -.023, .02], [-.08, .023, .02], [-.40, .023, .025]], k.wood);
        M.box(-.10, .02, -.022, .022, -.075, .02, k.wood); M.box(-.02, .32, -.024, .024, -.03, .05, k.steel); M.box(.06, .18, -.02, .02, -.17, -.03, k.steel);   // receiver, 20-rd magazine
        M.box(.32, .52, -.025, .025, -.035, .03, k.wood); v7Limb(M, [.30, 0, .02], [.80, 0, .02], .016, .014, k.steel, 6); v7Limb(M, [.32, 0, -.015], [.62, 0, -.015], .011, .011, k.steel, 6);
        v7Limb(M, [.76, 0, .02], [.82, 0, .02], .02, .018, k.steel, 6); for (const s of [-1, 1]) v7Limb(M, [.70, s * .012, .0], [.38, s * .02, -.03], .006, .006, k.steel, 4); } },   // flash hider, folded bipod
      mg42: { fore: [.26, .03, -.02], butt: -.38, build(M, k) {                // MG 42, 1.22 m
        M.hex8([[-.38, -.022, -.10], [-.12, -.022, -.03], [-.12, .022, -.03], [-.38, .022, -.10], [-.38, -.022, .03], [-.12, -.022, .04], [-.12, .022, .04], [-.38, .022, .03]], k.dark);
        M.box(-.06, .0, -.018, .018, -.11, -.02, k.dark); M.box(-.13, .30, -.026, .026, -.03, .06, k.steel); M.box(.02, .22, -.03, .03, .06, .075, k.steel);   // grip, receiver, feed cover
        v7Limb(M, [.28, 0, .02], [.72, 0, .02], .03, .03, k.steel, 10); for (let i = 0; i < 6; i++) { const x = .32 + i * .065; M.box(x, x + .03, -.031, .031, .0, .04, k.dark); }   // perforated barrel jacket
        v7Limb(M, [.72, 0, .02], [.84, 0, .02], .026, .02, k.steel, 8); for (const s of [-1, 1]) v7Limb(M, [.66, s * .015, -.01], [.40, s * .03, -.035], .007, .007, k.steel, 4);
        M.box(.15, .30, .026, .04, -.02, .05, k.steel);                                                                                  // carrying handle
        for (let i = 0; i < 5; i++) M.box(.06 + i * .02, .075 + i * .02, .026 + i * .012, .045 + i * .012, -.07 - i * .03, .0 - i * .03, k.brass); } },   // ammunition belt
      // ---- v104 additions ----
      carbine: { fore: [.20, 0, -.012], butt: -.30, build(M, k) {              // M1 carbine, 0.90 m
        M.hex8([[-.30, -.019, -.105], [-.06, -.019, -.045], [-.06, .019, -.045], [-.30, .019, -.105], [-.30, -.019, .018], [-.06, -.019, .012], [-.06, .019, .012], [-.30, .019, .018]], k.wood);
        M.box(-.07, .03, -.019, .019, -.045, .012, k.wood); M.box(.02, .36, -.017, .017, -.03, .012, k.wood); M.box(.16, .34, -.014, .014, .012, .03, k.wood);
        M.box(-.03, .14, -.015, .015, -.002, .036, k.steel); M.box(.02, .065, -.012, .012, -.11, -.03, k.steel);                                        // receiver, 15-rd magazine
        v7Limb(M, [.14, 0, .02], [.60, 0, .02], .009, .008, k.steel, 6); M.box(.34, .38, -.02, .02, -.034, .03, k.steel); M.box(.585, .60, -.005, .005, .026, .045, k.steel); } },
      thompson: { fore: [.17, 0, -.07], butt: -.34, build(M, k) {              // M1A1 Thompson, 0.81 m, 30-rd stick magazine, horizontal fore-grip
        M.hex8([[-.34, -.02, -.10], [-.08, -.02, -.035], [-.08, .02, -.035], [-.34, .02, -.10], [-.34, -.02, .02], [-.08, -.02, .02], [-.08, .02, .02], [-.34, .02, .02]], k.wood);
        M.box(-.06, .0, -.018, .018, -.11, -.02, k.wood); M.box(-.08, .20, -.024, .024, -.03, .05, k.steel); M.box(.10, .24, -.02, .02, -.085, -.03, k.wood);
        M.box(.03, .065, -.014, .014, -.24, -.03, k.steel); v7Limb(M, [.20, 0, .02], [.48, 0, .02], .013, .012, k.steel, 6); M.box(.46, .48, -.005, .005, .032, .05, k.steel);
        v7Limb(M, [.05, -.024, .03], [.05, -.05, .03], .006, .006, k.steel, 4); } },
      m1903: { fore: [.27, 0, -.01], butt: -.36, build(M, k) {                 // M1903A4 sniper rifle with its M73B1 scope
        M.hex8([[-.36, -.021, -.115], [-.06, -.021, -.05], [-.06, .021, -.05], [-.36, .021, -.115], [-.36, -.021, .02], [-.06, -.021, .015], [-.06, .021, .015], [-.36, .021, .02]], k.wood);
        M.box(-.08, .03, -.021, .021, -.05, .015, k.wood); M.box(.02, .56, -.019, .019, -.03, .015, k.wood); M.box(.24, .50, -.015, .015, .015, .034, k.wood);
        M.box(-.04, .20, -.017, .017, -.002, .042, k.steel); v7Limb(M, [.20, 0, .024], [.76, 0, .024], .011, .009, k.steel, 6);
        M.box(-.02, .01, -.01, .01, .04, .068, k.steel); M.box(.17, .20, -.01, .01, .04, .068, k.steel);                                                 // scope mounts
        v7Limb(M, [-.07, 0, .078], [-.03, 0, .078], .016, .013, k.dark, 8); v7Limb(M, [-.03, 0, .078], [.20, 0, .078], .012, .012, k.dark, 8); v7Limb(M, [.20, 0, .078], [.25, 0, .078], .013, .017, k.dark, 8);
        v7Limb(M, [.02, -.018, .035], [.02, -.06, .01], .007, .007, k.steel, 5); } },
      bazooka: { fore: [.24, 0, -.02], butt: -.18, aimZ: -.04, cheek: [-.08, .125, .10], tube: true, build(M, k) {   // M1A1 2.36 in rocket launcher, 1.37 m
        v7Limb(M, [-.62, 0, .10], [.75, 0, .10], .031, .031, k.metal, 10); v7Limb(M, [.68, 0, .10], [.76, 0, .10], .035, .035, k.metal, 10); v7Limb(M, [-.66, 0, .10], [-.58, 0, .10], .037, .034, k.metal, 10);
        M.box(-.30, -.08, -.018, .018, .02, .072, k.wood); M.box(-.04, .03, -.016, .016, -.10, .075, k.metal); M.box(.20, .27, -.016, .016, -.06, .075, k.metal);
        M.box(.10, .30, .028, .04, .10, .15, k.steel); M.box(-.42, -.30, -.04, -.028, .06, .12, k.steel); } },
      pschreck: { fore: [.26, 0, -.02], butt: -.22, aimZ: -.05, cheek: [-.10, .14, .11], tube: true, build(M, k) {   // RPzB 54 Panzerschreck, 1.64 m, 88 mm, blast shield left of the tube
        v7Limb(M, [-.82, 0, .11], [.82, 0, .11], .046, .046, k.metal, 10); v7Limb(M, [-.86, 0, .11], [-.78, 0, .11], .052, .048, k.metal, 10); v7Limb(M, [.76, 0, .11], [.84, 0, .11], .05, .05, k.metal, 10);
        M.box(-.34, -.14, -.02, .02, .03, .07, k.metal); M.box(-.03, .04, -.016, .016, -.10, .07, k.metal); M.box(.22, .29, -.016, .016, -.07, .07, k.metal);
        M.box(.30, .315, -.05, .30, -.04, .44, k.metal); M.box(.292, .322, .05, .13, .17, .24, k.dark); M.box(.05, .12, .04, .052, .15, .2, k.steel); } },
      mp40: { fore: [.085, 0, -.09], butt: -.30, build(M, k) {                 // MP 40, stock unfolded, 32-rd magazine
        v7Limb(M, [-.06, 0, .02], [.24, 0, .02], .018, .018, k.dark, 8); v7Limb(M, [.24, 0, .02], [.42, 0, .02], .009, .009, k.dark, 6); M.box(.27, .31, -.02, .02, -.02, .015, k.dark);
        M.box(-.05, .01, -.017, .017, -.11, .0, k.dark); M.box(.06, .105, -.018, .018, -.08, .0, k.dark); M.box(.065, .10, -.014, .014, -.30, -.08, k.dark);
        v7Polyline(M, [[-.06, .02, .01], [-.30, .02, -.04], [-.30, -.02, -.04], [-.06, -.02, .01]], .006, k.dark, 4); M.box(-.31, -.29, -.03, .03, -.07, -.01, k.dark);
        v7Limb(M, [.04, .004, .03], [.04, .05, .03], .006, .006, k.dark, 4); } },
      stg44: { fore: [.26, 0, -.02], butt: -.38, build(M, k) {                 // StG 44, 0.94 m, curved 30-rd magazine
        M.hex8([[-.38, -.02, -.11], [-.12, -.02, -.035], [-.12, .02, -.035], [-.38, .02, -.11], [-.38, -.02, .02], [-.12, -.02, .03], [-.12, .02, .03], [-.38, .02, .02]], k.wood);
        M.box(-.10, .0, -.017, .017, -.10, -.02, k.dark); M.box(-.14, .20, -.022, .022, -.03, .045, k.dark); M.box(.20, .33, -.018, .018, -.02, .03, k.dark);
        v7Limb(M, [.20, 0, .015], [.54, 0, .015], .01, .009, k.dark, 6); M.box(.50, .52, -.005, .005, .025, .05, k.dark);
        M.hex8([[.05, -.014, -.14], [.10, -.014, -.14], [.10, .014, -.14], [.05, .014, -.14], [.04, -.014, -.03], [.10, -.014, -.03], [.10, .014, -.03], [.04, .014, -.03]], k.dark);
        M.hex8([[.085, -.014, -.25], [.135, -.014, -.24], [.135, .014, -.24], [.085, .014, -.25], [.05, -.014, -.14], [.10, -.014, -.14], [.10, .014, -.14], [.05, .014, -.14]], k.dark); } },
      g43: { fore: [.29, 0, -.01], butt: -.36, build(M, k) {                   // Gewehr 43 with ZF 4 scope (right-side mount)
        M.hex8([[-.36, -.021, -.12], [-.06, -.021, -.05], [-.06, .021, -.05], [-.36, .021, -.12], [-.36, -.021, .018], [-.06, -.021, .012], [-.06, .021, .012], [-.36, .021, .018]], k.wood);
        M.box(-.08, .03, -.021, .021, -.05, .012, k.wood); M.box(.02, .58, -.019, .019, -.032, .015, k.wood); M.box(.24, .52, -.015, .015, .015, .036, k.wood);
        M.box(-.03, .22, -.017, .017, -.002, .044, k.steel); M.box(.04, .11, -.015, .015, -.09, -.03, k.steel); v7Limb(M, [.22, 0, .024], [.76, 0, .024], .011, .009, k.steel, 6);
        M.box(.0, .16, -.03, -.016, .03, .06, k.steel); v7Limb(M, [-.05, -.035, .075], [.17, -.035, .075], .011, .011, k.dark, 8); v7Limb(M, [.17, -.035, .075], [.21, -.035, .075], .012, .015, k.dark, 8); } },
      fg42: { fore: [.22, 0, -.03], butt: -.38, build(M, k) {                  // FG 42, 0.98 m, 20-rd side magazine on the left, folded bipod
        M.hex8([[-.38, -.018, -.07], [-.14, -.018, -.02], [-.14, .018, -.02], [-.38, .018, -.07], [-.38, -.018, .03], [-.14, -.018, .04], [-.14, .018, .04], [-.38, .018, .03]], k.dark);
        M.hex8([[-.08, -.017, -.12], [-.02, -.017, -.12], [-.02, .017, -.12], [-.08, .017, -.12], [-.04, -.017, -.02], [.02, -.017, -.02], [.02, .017, -.02], [-.04, .017, -.02]], k.dark);
        M.box(-.14, .20, -.022, .022, -.03, .05, k.dark); M.box(-.02, .05, .022, .17, -.025, .03, k.dark); M.box(.10, .27, -.02, .02, -.045, .015, k.wood);
        v7Limb(M, [.20, 0, .02], [.60, 0, .02], .011, .01, k.steel, 6); v7Limb(M, [.58, 0, .02], [.65, 0, .02], .017, .015, k.steel, 6);
        for (const s of [-1, 1]) v7Limb(M, [.50, s * .012, .0], [.28, s * .018, -.01], .006, .006, k.steel, 4); } },
      detector: { fore: [.40, 0, -.005], butt: -.24, flatEnd: 1.32, build(M, k) {   // SCR-625 mine detector: pole, grip, amplifier box (the search disc is added level with the ground)
        v7Limb(M, [-.24, 0, 0], [1.32, 0, 0], .012, .012, k.metal, 6); M.box(-.05, .05, -.02, .02, -.09, .01, k.metal); M.box(.24, .38, -.035, .035, -.06, .02, k.metal);
        v7Limb(M, [-.24, 0, 0], [-.24, 0, -.06], .02, .02, k.metal, 6); } }
    };
    // ---- low-poly body (v96b): continuous faceted sweeps through the joints, like a game base mesh (8-sided limbs, flat-fronted torso) ----
    // sweep: P = centre points, R = [half-width (side), front depth, back depth] per point, mats = material per segment; fwd = hint for the "front" axis
    function v7Sweep(M, P, R, mats, fwd, n = 8, capA = true, capB = true) {
      const N = P.length, T = P.map((p, i) => v7.nrm(v7.sub(P[Math.min(N - 1, i + 1)], P[Math.max(0, i - 1)])));
      let u = v7.nrm(v7.sub(fwd, v7.mul(T[0], v7.dot(fwd, T[0])))); const rings = [];
      for (let i = 0; i < N; i++) {
        if (i) { const v = v7.sub(u, v7.mul(T[i], v7.dot(u, T[i]))); if (v7.len(v) > 1e-6) u = v7.nrm(v); }
        const s = v7.cross(T[i], u), [w, f, b] = R[i], ring = [];
        for (let k = 0; k < n; k++) { const a = (k + .5) * 2 * Math.PI / n, c = Math.cos(a), sn = Math.sin(a); ring.push(v7.add(P[i], v7.add(v7.mul(u, c * (c >= 0 ? f : b)), v7.mul(s, sn * w)))); }
        rings.push(ring);
      }
      for (let i = 0; i + 1 < N; i++) { const c = v7.mul(v7.add(P[i], P[i + 1]), .5); for (let k = 0; k < n; k++) { const j = (k + 1) % n; M.quad(rings[i][k], rings[i][j], rings[i + 1][j], rings[i + 1][k], mats[Math.min(i, mats.length - 1)], c); } }
      const cap = (ring, p, m, t) => { for (let k = 0; k < n; k++) M.tri(p, ring[k], ring[(k + 1) % n], t, t, t, m); };
      if (capA) cap(rings[0], P[0], mats[0], v7.mul(T[0], -1)); if (capB) cap(rings[N - 1], P[N - 1], mats[mats.length - 1], T[N - 1]);
    }
    const V7TORSO = [[-.11, .085, .07, .075], [-.03, .165, .10, .12], [.06, .162, .102, .112], [.15, .152, .10, .10], [.27, .172, .118, .108], [.37, .19, .128, .11], [.45, .196, .105, .10], [.50, .135, .075, .085], [.545, .06, .055, .06]];
    const v7TorsoAt = z => { const T = V7TORSO; if (z <= T[0][0]) return T[0].slice(1); for (let i = 0; i + 1 < T.length; i++) if (z <= T[i + 1][0]) { const t = (z - T[i][0]) / (T[i + 1][0] - T[i][0]); return [1, 2, 3].map(k => T[i][k] + (T[i + 1][k] - T[i][k]) * t); } return T[T.length - 1].slice(1); };
    // poses: hip = pelvis centre; lean / twist of the torso; feet = ankle target, foot direction, knee hint; grip = right hand on the pistol grip, dir = bore direction;
    // el = elbow hints (right, left); head = offset of the head centre from the neck base (aiming poses put the cheek on the stock instead)
    const V7STAND = { hip: [0, 0, .955], lean: .05, twist: -.30, feet: [{ at: [.08, .135, .085], dir: [1, .30, 0], hint: [1, .2, .1] }, { at: [-.08, -.13, .085], dir: [1, -.45, 0], hint: [1, -.3, .1] }] };
    const V7POSES = {
      stand: Object.assign({}, V7STAND, { grip: [.14, -.12, 1.02], dir: [1, .55, .42], el: [[-.3, -.5, -1], [.1, .4, -1]], head: [.02, 0, .14], pitch: .03 }),           // port arms, relaxed
      walk: { hip: [.02, 0, .935], lean: .15, twist: -.22, feet: [{ at: [.30, .12, .085], dir: [1, .15, 0], hint: [1, 0, .2] }, { at: [-.26, -.11, .13], dir: [1, -.15, -.45], hint: [1, 0, -.1] }],
        grip: [.22, -.15, 1.10], dir: [1, .12, -.14], el: [[-.3, -.8, -1], [.2, .3, -1]], head: [.05, 0, .135], pitch: .06 },                                          // advancing at low ready
      kneel: { hip: [-.02, 0, .56], lean: .12, twist: -.55, feet: [{ at: [.36, .16, .085], dir: [1, .25, 0], hint: [1, 0, 1] }, { at: [-.40, -.10, .19], dir: [.55, 0, -.83], hint: [.5, 0, -1] }],
        aim: true, dir: [1, -.02, .02], el: [[-.2, -1, -.6], [.2, .5, -1]], pitch: .12 },                                                                            // kneeling, rifle shouldered
      carry: Object.assign({}, V7STAND, { twist: -.15, grip: [.10, -.14, 1.0], dir: [1, .12, .06], el: [[-.3, -.6, -1], [.2, .5, -1]], head: [.02, 0, .14], pitch: .03 })   // MG at the hip
    };
    V7POSES.ready = V7POSES.stand;
    Object.assign(V7POSES, {                                                                                                                   // v104 poses
      aim: { hip: [0, 0, .95], lean: .07, twist: -.55, feet: [{ at: [.14, .16, .085], dir: [1, .35, 0], hint: [1, .2, .1] }, { at: [-.14, -.15, .085], dir: [.8, -.6, 0], hint: [1, -.3, .1] }],
        aim: true, dir: [1, -.02, .01], el: [[-.2, -1, -.5], [.2, .6, -1]], pitch: .08 },                                                          // standing, weapon shouldered
      prone: { hip: [-.05, 0, .15], lean: 1.4, twist: -.04, feet: [{ at: [-.97, .22, .07], dir: [-.3, .4, -.85], hint: [0, 0, -1] }, { at: [-.95, -.12, .07], dir: [-.3, -.2, -.9], hint: [0, 0, -1] }],
        aim: true, dir: [1, 0, .03], el: [[-.1, -.4, -1], [.1, .4, -1]], pitch: -.06 },                                                           // lying, rifle on the elbows
      shoulder: Object.assign({}, V7POSES.kneel, { dir: [1, -.02, .03] }),                                                                       // kneeling, launcher on the shoulder
      point: Object.assign({}, V7STAND, { twist: -.1, grip: [.10, -.21, .90], dir: [1, .08, -.6], lhand: [.58, .30, 1.42], el: [[-.3, -.6, -1], [.3, 1, -.1]], head: [.03, 0, .14], pitch: -.04 }),   // officer: weapon low in the right hand, left arm pointing
      binoc: Object.assign({}, V7STAND, { twist: -.05, binoc: true, el: [[.3, -1, -.7], [.3, 1, -.7]], head: [.02, 0, .14], pitch: -.06 }),       // weapon slung, binoculars at the eyes
      sweep: { hip: [.02, 0, .93], lean: .18, twist: -.15, feet: [{ at: [.26, .12, .085], dir: [1, .15, 0], hint: [1, 0, .2] }, { at: [-.22, -.11, .12], dir: [1, -.15, -.4], hint: [1, 0, -.1] }],
        grip: [.20, -.13, .98], dir: [1, .05, -.8], el: [[-.3, -.8, -1], [.2, .3, -1]], head: [.06, 0, .13], pitch: .25 }                            // sweeping a mine detector
    });
    // figure id: nat_weapon_pose[_opt+opt…]
    //   outfits  us: para (M42 jump suit, jump boots, A-yoke chin strap) · cmd (knit watch cap) · off (officer stripe, no pack) · rgr (Ranger diamond) · light (no pack)
    //            de: fj (M38 jump helmet, long camouflage smock, bandolier, ankle boots + gaiters) · camo (camouflage smock + M43 cap) · jag (M43 cap)
    //   gear     radio (SCR-300) · rocket (US M6 bag / German Panzerschreck carrier) · satchel (demolition bag) · st (German assault pack + extra grenades)
    function buildSoldier(fig) {
      const [nat, wpn, pose, optS] = fig.split('_'), O = new Set((optS || '').split('+').filter(Boolean)), M = new Mesh(), us = nat === 'us';
      const para = us && O.has('para'), fj = !us && O.has('fj'), camo = !us && O.has('camo'), smock = fj || camo, cap43 = !us && (O.has('jag') || camo), knit = us && O.has('cmd');
      const off = O.has('off'), radio = O.has('radio'), rocket = O.has('rocket'), satchel = O.has('satchel'), st = !us && O.has('st'), light = O.has('light') || off || radio || rocket;
      const mt = (c, o) => M.mat(c, o || { spec: .04, noise: .7 });
      // v107 palette: US = one khaki family (jacket / trousers / webbing close in hue, OD helmet desaturated);
      //   German = cool blue field-grey, about one value step darker than the US khaki; smocks keep a muted pattern on a grey base
      const k = {
        skin: mt([204, 156, 124], { spec: .1, noise: .2, recv: false }), jacket: mt(para ? [158, 146, 114] : us ? [152, 140, 108] : smock ? [104, 108, 104] : [94, 100, 107], smock ? { spec: .03, noise: 1.5 } : undefined),
        collar: mt(para ? [142, 130, 100] : us ? [138, 126, 96] : [70, 76, 84]), trousers: mt(para ? [150, 138, 108] : us ? [124, 116, 90] : fj ? [100, 106, 114] : [86, 92, 99]),
        legging: mt(para ? [112, 78, 52] : us ? [170, 160, 128] : fj ? [92, 96, 92] : [46, 40, 36], { spec: us && !para ? .03 : .22, noise: .5 }), boot: mt(us ? [108, 74, 50] : [44, 38, 34], { spec: .22, noise: .3 }),
        helmet: mt(us ? [98, 102, 78] : fj ? [96, 102, 108] : [90, 96, 103], { spec: .14, noise: 1.0 }),
        web: mt(us ? [158, 148, 116] : [92, 70, 52], { spec: us ? .03 : .2, noise: .5 }), belt: mt(us ? [158, 148, 116] : [40, 34, 30], { spec: .2, noise: .3 }), pack: mt(us ? [142, 134, 104] : [108, 104, 92]),
        metal: mt(us ? [98, 102, 78] : [90, 96, 103], { spec: .25, noise: .4 }), button: mt([150, 150, 140], { spec: .5, noise: 0 }),
        wood: mt([130, 82, 46], { spec: .15, noise: .9 }), steel: mt([54, 56, 58], { spec: .4, noise: .3 }), dark: mt([30, 30, 30], { spec: .2, noise: .2 }), brass: mt([168, 132, 60], { spec: .5, noise: .3 }),
        cap: mt(knit ? [58, 60, 56] : [92, 98, 104], { spec: .03, noise: .9 }), patchA: mt(fj ? [84, 92, 80] : [86, 92, 78], { spec: .03, noise: 1.2 }), patchB: mt([98, 88, 74], { spec: .03, noise: 1.2 }),
        white: mt([226, 226, 218], { spec: .1, noise: .2 }), orange: mt([206, 116, 40], { spec: .1, noise: .3 }), bando: mt([90, 94, 86], { spec: .03, noise: .8 }), leather: mt([96, 64, 40], { spec: .25, noise: .4 })
      };
      const PO = V7POSES[pose] || V7POSES.stand, W = V7W[wpn] || V7W[us ? 'garand' : 'k98'], hip = PO.hip, Rt = v7.mm(v7.mm(v7.rz(PO.twist), v7.ry(PO.lean)), [1.18, 0, 0, 0, 1.12, 0, 0, 0, 1.1]), T = p => v7.add(hip, v7.mv(Rt, p)), UP = [0, 0, 1], FW = [1, 0, 0];
      const vert = (zs, grow, m) => v7Sweep(M, zs.map(z => [0, 0, z]), zs.map(z => v7TorsoAt(z).map(v => v + grow)), [m], FW, 8, true, true);
      const onSurf = (ang, z, grow) => { const [w, f, b] = v7TorsoAt(z), c = Math.cos(ang); return [c * ((c >= 0 ? f : b) + grow), Math.sin(ang) * (w + grow)]; };   // torso surface point at azimuth / height
      // ---- torso: trousers (crotch → belt), tunic / jacket / smock (hem → neck), collar ----
      let t0 = M.M.length;
      vert([-.11, -.03, .06, .12], .014, k.trousers);
      if (smock) v7Sweep(M, [[0, 0, -.25], [0, 0, -.12]], [[.172, .118, .122], [.168, .116, .12]], [k.jacket], FW, 8, true, false);                     // smock skirt over the thighs
      vert(us ? [-.02, .06, .15, .27, .37, .45, .50, .545] : [smock ? -.12 : -.085, -.03, .06, .15, .27, .37, .45, .50, .545], smock ? .016 : .008, k.jacket);
      v7Sweep(M, [[0, 0, .50], [0, 0, .58]], [[.072, .068, .075], [.064, .06, .066]], [k.collar], FW, 8);                                                   // collar
      v7Sweep(M, [[0, 0, .055], [0, 0, .11]], [v7TorsoAt(.055).map(v => v + (smock ? .024 : .016)), v7TorsoAt(.11).map(v => v + (smock ? .024 : .016))], [k.belt], FW, 8);   // belt
      const fz = z => v7TorsoAt(z)[1] + (smock ? .016 : .008);                                                                                    // jacket front depth at height z
      if (smock) {                                                                                                                                // splinter / water-pattern camouflage patches
        for (let i = 0; i < 26; i++) { const ang = (i * 2.399) % 6.283, z = -.2 + ((i * .618) % 1) * .62, sz = .03 + (i % 3) * .012, [cx, cy] = onSurf(ang, Math.max(-.11, z), .018), q = M.M.length;
          M.box(-.004, .004, -sz, sz, z - sz * .7, z + sz * .7, i % 2 ? k.patchA : k.patchB); v7Xf(M, q, v7.rz(ang), [cx, cy, 0]); }
      }
      if (us) {
        M.box(.112, .13, -.03, .03, .062, .104, k.metal);                                                                                          // belt buckle
        for (const a of [.55, .85, 1.15, 2.0, 2.3, 2.6]) for (const s of [-1, 1]) {                                                               // M1923 cartridge-belt pockets (front & sides)
          const ang = s * a, c = [Math.cos(ang) * (Math.cos(ang) > 0 ? .118 : .128), Math.sin(ang) * .178], q = M.M.length;
          M.box(-.024, .024, -.016, .016, .045, .13, k.web); v7Xf(M, q, v7.rz(ang), [c[0], c[1], 0]); }
        for (const s of [-1, 1]) v7Polyline(M, [[fz(.12) + .005, s * .085, .12], [fz(.30) + .006, s * .10, .30], [fz(.42) + .004, s * .12, .44], [0, s * .135, .505], [-.105, s * .12, .44], [-.118, s * .07, .30], [-.12, s * .03, .13]], .011, k.web);   // suspenders
        if (!light) { M.box(-.225, -.112, -.12, .12, .20, .47, k.pack); M.box(-.235, -.22, -.10, .10, .24, .45, k.web);                                  // M1928 haversack + straps
          M.box(-.26, -.225, -.065, .065, .05, .21, k.metal); v7Limb(M, [-.243, 0, .05], [-.243, 0, -.10], .012, .012, k.wood, 5); }                    // entrenching tool + handle
        M.lathe('z', [-.07, -.19, -.07], [[0, 0], [0, .05], [.15, .05], [.15, 0]], 10, k.pack);                                                          // canteen in its cover
        M.box(.0, .04, .175, .195, -.17, .08, k.web);                                                                                              // bayonet scabbard
        if (para) { for (const s of [-1, 1]) { M.box(fz(.33) - .004, fz(.33) + .022, Math.min(s * .03, s * .14), Math.max(s * .03, s * .14), .25, .37, k.jacket); M.box(fz(.37), fz(.37) + .026, Math.min(s * .03, s * .145), Math.max(s * .03, s * .145), .35, .38, k.collar); } }   // M42 slanted chest pockets
        else for (const s of [-1, 1]) M.box(.04, .12, s * .11 - .006, s * .11 + .006, -.01, .05, k.collar);                                           // slash-pocket flaps of the M41 jacket
        for (const s of [-1, 1]) M.box(-.06, .06, s * .19 - .02, s * .19 + .02, .445, .47, k.collar);                                                  // epaulettes
        if (off) { M.box(fz(.30) - .004, fz(.30) + .05, .03, .11, .22, .32, k.leather); v7Polyline(M, [[fz(.30) + .02, .07, .32], [0, -.135, .505]], .007, k.leather, 4); }   // binocular case on its strap
      } else {
        if (!smock) {
          for (let i = 0; i < 5; i++) { const z = .16 + i * .085; M.box(fz(z) - .002, fz(z) + .012, -.012, .012, z - .012, z + .012, k.button); }       // tunic buttons
          for (const s of [-1, 1]) {                                                                                                               // four pleated pockets with flaps
            M.box(fz(.32) - .004, fz(.32) + .012, Math.min(s * .04, s * .14), Math.max(s * .04, s * .14), .26, .37, k.jacket); M.box(fz(.37) - .002, fz(.37) + .02, Math.min(s * .04, s * .145), Math.max(s * .04, s * .145), .355, .39, k.collar);
            M.box(fz(.0) - .004, fz(.0) + .012, Math.min(s * .03, s * .15), Math.max(s * .03, s * .15), -.075, .045, k.jacket); M.box(fz(.0) - .002, fz(.0) + .02, Math.min(s * .03, s * .155), Math.max(s * .03, s * .155), .02, .05, k.collar); }
        }
        M.box(fz(.08) - .004, fz(.08) + .014, -.035, .035, .06, .105, k.metal);                                                                       // buckle
        if (!fj) for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const y = s * (.05 + i * .036); M.box(fz(.09) - .004, fz(.09) + .04, y - .016, y + .016, .045, .135, k.web); M.box(fz(.09) + .036, fz(.09) + .044, y - .012, y + .012, .1, .13, k.metal); }   // ammunition pouches
        if (fj) for (const s of [-1, 1]) {                                                                                                        // cloth bandolier around the neck, 2 × 6 pockets
          v7Polyline(M, [[0, s * .10, .52], [fz(.46) + .01, s * .09, .44], [fz(.30) + .02, s * .085, .30], [fz(.14) + .02, s * .08, .14]], .024, k.bando, 6);
          for (let i = 0; i < 4; i++) { const z = .18 + i * .07; M.box(fz(z) + .018, fz(z) + .04, s * .085 - .028, s * .085 + .028, z - .028, z + .028, k.bando); } }
        else for (const s of [-1, 1]) v7Polyline(M, [[fz(.13) + .02, s * .105, .13], [fz(.30) + .006, s * .105, .30], [fz(.42) + .004, s * .118, .44], [0, s * .128, .505], [-.105 - (smock ? .01 : 0), s * .08, .43], [-.12 - (smock ? .01 : 0), 0, .32]], .013, k.web);   // Y-straps
        if (!fj) v7Limb(M, [-.12 - (smock ? .01 : 0), 0, .32], [-.124 - (smock ? .01 : 0), 0, .12], .014, .014, k.web, 4);
        v7Limb(M, [fz(.17), .14, .17], [fz(.17) - .02, .17, -.16], .014, .014, k.wood, 6); v7Limb(M, [fz(.17), .14, .17], [fz(.17), .145, .26], .032, .032, k.metal, 8);   // M24 stick grenade in the belt
        if (st) for (const y of [-.06, .04]) { v7Limb(M, [fz(.17), y, .17], [fz(.17) - .01, y + .02, -.14], .014, .014, k.wood, 6); v7Limb(M, [fz(.17), y, .17], [fz(.17), y, .26], .032, .032, k.metal, 8); }
        M.box(-.15, -.02, -.21, -.17, -.14, .09, k.pack);                                                                                          // bread bag (right rear)
        M.lathe('z', [-.10, -.225, -.11], [[0, 0], [0, .045], [.13, .045], [.13, 0]], 10, k.pack); M.lathe('z', [-.10, -.225, .02], [[0, 0], [0, .03], [.04, .03], [.04, 0]], 10, k.metal);
        if (!fj) { const q = M.M.length; M.lathe('x', [0, 0, 0], [[0, 0], [0, .056], [.03, .056], [.03, .05], [.05, .05], [.05, .056], [.09, .056], [.09, .05], [.11, .05], [.11, .056], [.26, .056], [.26, 0]], 12, k.metal);   // ribbed gas-mask canister
          v7Xf(M, q, v7.basis([0, 1, -.35], [-1, 0, 0]), [-.18, -.13, .12]); }
        M.box(-.12, -.04, .165, .195, -.11, .09, k.metal); v7Limb(M, [-.08, .18, .09], [-.08, .18, .22], .011, .011, k.wood, 5);                       // entrenching tool + bayonet (left hip)
        if (st) { M.box(-.205, -.14, -.12, .12, .16, .44, k.web); v7Limb(M, [-.24, -.14, .44], [-.24, .14, .44], .045, .045, k.pack, 8); M.box(-.25, -.205, -.08, .08, .22, .36, k.metal); }   // assault pack frame, rolled shelter half, mess tin
      }
      // gear on the back / hip
      const bk = us ? -.112 : -.13;
      if (radio) { M.box(bk - .15, bk, -.13, .13, .14, .5, k.metal); M.box(bk - .155, bk - .14, -.06, .06, .5, .53, k.dark); }                        // SCR-300 (antenna added in world space below)
      if (rocket && us) { M.box(bk - .13, bk, -.12, .12, .14, .44, k.pack); for (const y of [-.06, .06]) v7Limb(M, [bk - .065, y, .44], [bk - .065, y, .55], .03, .012, k.metal, 8); }   // M6 rocket bag, two noses showing
      if (rocket && !us) { M.box(bk - .03, bk, -.13, .13, .05, .5, k.wood); for (const y of [-.07, .07]) { v7Limb(M, [bk - .08, y, .06], [bk - .08, y, .5], .044, .044, k.metal, 8); v7Limb(M, [bk - .08, y, .5], [bk - .08, y, .58], .044, .012, k.metal, 8); } }   // Panzerschreck rocket carrier
      if (satchel) { M.box(fz(.0) - .02, fz(.0) + .06, .07, .19, -.12, .08, us ? k.pack : k.patchB); v7Polyline(M, [[fz(.0) + .02, .13, .08], [fz(.30) + .02, .06, .30], [0, -.14, .51]], .009, k.web, 4); }   // demolition charge bag
      v7Xf(M, t0, Rt, hip);
      // ---- legs: one sweep hip → knee → ankle each (US: trousers bloused into leggings / jump boots; German: jack-boots, FJ: ankle boots + gaiters), boots ----
      PO.feet.forEach((f, i) => {
        const s = i === 0 ? 1 : -1, hj = T([0, s * .09, -.02]), ik = v7IK(hj, f.at, .44, .44, f.hint), kn = ik.j, an = ik.c;
        const L = (a, b, t) => v7.add(a, v7.mul(v7.sub(b, a), t));
        const top = para ? .52 : us ? .45 : fj ? .66 : .30;                                                                                     // legging / boot top as a fraction of the shin
        v7Sweep(M, [T([0, s * .05, .02]), hj, L(hj, kn, .30), L(hj, kn, .62), L(hj, kn, .88), kn, L(kn, an, .14), L(kn, an, top - .05), L(kn, an, top - .01), L(kn, an, top), L(kn, an, .72), an],
          [[.11, .12, .128], [.116, .12, .128], [.118, .124, .124], us ? [.105, .11, .108] : [.118, .124, .12], [.088, .094, .09], [.08, .088, .08], [.084, .09, .084], us || fj ? [.09, .094, .09] : [.088, .092, .088], [.08, .084, .08],
           [us || fj ? .068 : .074, us || fj ? .072 : .076, us || fj ? .07 : .074], [.061, .064, .064], [.054, .058, .06]],
          [k.trousers, k.trousers, k.trousers, k.trousers, k.trousers, k.trousers, k.trousers, k.trousers, k.legging, k.legging, k.legging], f.hint);
        if (para || fj) {                                                                                                                        // bellows thigh pocket on the outside of each thigh
          const ax = v7.sub(kn, hj), mid = L(hj, kn, .5), out = v7.nrm(v7.sub(v7.mv(Rt, [0, s, 0]), v7.mul(v7.nrm(ax), v7.dot(v7.mv(Rt, [0, s, 0]), v7.nrm(ax))))), q = M.M.length;
          M.box(-.08, .08, -.055, .055, 0, .03, para ? k.jacket : k.trousers); v7Xf(M, q, v7.basis(ax, out), v7.add(mid, v7.mul(out, .095)));
        }
        const q = M.M.length;                                                                                                                   // boot: heel block, tapered toe, sole
        M.hex8([[-.07, -.048, -.085], [.12, -.046, -.085], [.12, .046, -.085], [-.07, .048, -.085], [-.065, -.046, .035], [.06, -.044, .01], [.06, .044, .01], [-.065, .046, .035]], k.boot);
        M.hex8([[.10, -.046, -.085], [.20, -.034, -.085], [.20, .034, -.085], [.10, .046, -.085], [.10, -.044, -.0], [.19, -.03, -.045], [.19, .03, -.045], [.10, .044, -.0]], k.boot);
        M.box(-.075, .205, -.05, .05, -.098, -.082, k.dark);
        v7Xf(M, q, v7.basis(f.dir, UP), an);
      });
      // ---- weapon placement (slung across the back for the binocular pose) ----
      let grip, dir = v7.nrm(PO.dir || [1, 0, 0]), Rw;
      if (PO.binoc || PO.hands) { dir = v7.nrm(v7.mv(Rt, [-.12, .42, .9])); Rw = v7.basis(dir, v7.mv(Rt, [-1, 0, 0])); grip = T([-.19, -.12, .16]); }
      else {
        if (PO.aim) { const pocket = v7.add(T([0, -.19, .44]), v7.mul(v7.sub(T([0, .19, .44]), T([0, -.19, .44])), .14)); grip = v7.add(v7.add(pocket, v7.mul(dir, -W.butt)), [0, 0, -.015 + (W.aimZ || 0)]); }
        else grip = PO.grip;
        Rw = v7.basis(dir, UP);
      }
      t0 = M.M.length; W.build(M, k); v7Xf(M, t0, Rw, grip);
      if (W.flatEnd) { const e = v7.add(grip, v7.mv(Rw, [W.flatEnd, 0, 0])); M.lathe('z', [e[0], e[1], Math.max(.02, e[2] - .02)], [[0, 0], [0, .15], [.03, .15], [.03, 0]], 12, k.metal); }   // detector search disc, level
      const fore = v7.add(grip, v7.mv(Rw, W.fore));
      // head centre first (the binocular hands are placed relative to it)
      const nb = T([0, 0, .515]), Rh = v7.ry(PO.pitch || .05);
      const hc = PO.aim ? (W.cheek ? v7.add(grip, v7.mv(Rw, W.cheek)) : v7.add(v7.add(grip, v7.mv(Rw, [W.butt + .22, 0, 0])), [-.015, .05, .095])) : v7.add(nb, PO.head);
      // ---- arms: one sweep shoulder → elbow → wrist (sleeve with cuff), low-poly mitten hands ----
      const handR = PO.hands ? PO.hands[0] : PO.binoc ? v7.add(hc, v7.mv(Rh, [.12, -.05, -.012])) : v7.add(grip, v7.mv(Rw, [-.01, 0, -.03]));
      const handL = PO.hands ? PO.hands[1] : PO.binoc ? v7.add(hc, v7.mv(Rh, [.12, .05, -.012])) : PO.lhand ? PO.lhand : v7.add(fore, v7.mv(Rw, [0, 0, -.03]));
      [[-1, handR, PO.el[0]], [1, handL, PO.el[1]]].forEach(([s, hand, hint]) => {
        const sh = T([0, s * .18, .445]), ik = v7IK(sh, hand, .30, .33, hint), el = ik.j, h = ik.c, wr = v7.add(el, v7.mul(v7.sub(h, el), .78));
        const L = (a, b, t) => v7.add(a, v7.mul(v7.sub(b, a), t)), up = v7.mv(Rt, FW);
        v7Sweep(M, [T([0, s * .12, .47]), sh, L(sh, el, .5), el, L(el, wr, .5), L(el, wr, .93), wr],
          [[.068, .078, .078], [.076, .078, .078], [.068, .07, .068], [.058, .062, .058], [.058, .058, .054], [.054, .052, .05], [.04, .038, .038]], [k.jacket], up);
        const hd = v7.nrm(v7.sub(h, el)), q = M.M.length, hu = PO.binoc || PO.hands || (s > 0 && PO.lhand) ? UP : v7.mv(Rw, [0, 0, 1]);
        M.hex8([[-.01, -.04, -.027], [.095, -.047, -.024], [.095, .047, -.024], [-.01, .04, -.027], [-.01, -.04, .027], [.095, -.047, .022], [.095, .047, .022], [-.01, .04, .027]], k.skin);
        v7Limb(M, [.01, .035, 0], [.065, .066, -.012], .018, .014, k.skin, 6);                                                                     // thumb
        v7Xf(M, q, v7.basis(hd, Math.abs(v7.dot(hd, hu)) > .95 ? FW : hu), wr);
      });
      if (PO.binoc) { const q = M.M.length; for (const y of [-.034, .034]) v7Limb(M, [.075, y, -.012], [.2, y, -.012], .024, .026, k.dark, 8); M.box(.09, .16, -.012, .012, -.02, .006, k.dark); v7Xf(M, q, Rh, hc); }   // binoculars
      if (radio) { const b = T([bk - .12, .1, .5]); v7Limb(M, b, v7.add(b, [-.06, .02, .95]), .005, .003, k.dark, 4); }                         // whip antenna
      // ---- neck, low-poly head (8-ring), face details, headgear ----
      v7Sweep(M, [nb, v7.add(hc, v7.mv(Rh, [-.01, 0, -.075]))], [[.052, .05, .055], [.048, .046, .05]], [k.skin], FW);
      t0 = M.M.length;
      v7Sweep(M, [[.035, 0, -.13], [.015, 0, -.10], [0, 0, -.05], [0, 0, .0], [-.005, 0, .05], [-.01, 0, .095], [-.015, 0, .125]],
        [[.034, .045, .02], [.058, .078, .045], [.07, .092, .078], [.076, .096, .094], [.075, .09, .097], [.062, .07, .08], [.03, .03, .038]], [k.skin], FW);
      M.box(.082, .102, -.058, .058, .022, .038, k.skin);                                                                                          // brow ridge
      M.hex8([[.085, -.014, -.042], [.106, -.01, -.044], [.106, .01, -.044], [.085, .014, -.042], [.085, -.01, .0], [.094, -.007, -.016], [.094, .007, -.016], [.085, .01, .0]], k.skin);   // nose (small, same skin tone)
      for (const s of [-1, 1]) { M.hex8([[-.03, s * .07, -.05], [.012, s * .07, -.05], [.012, s * .09, -.035], [-.03, s * .09, -.035], [-.03, s * .07, .012], [.012, s * .07, .012], [.012, s * .088, .0], [-.03, s * .088, .0]], k.skin); }   // ears
      v7Xf(M, t0, Rh, hc);
      t0 = M.M.length;
      const ell = (A, B, a) => A * B / Math.hypot(B * Math.cos(a), A * Math.sin(a));                                                             // ellipse radius at azimuth a
      if (knit) {                                                                                                                                // wool watch cap, rolled brim
        v7Radial(M, 16, a => { const e = ell(.108, .098, a); return [[e * 1.06, -.005], [e * 1.07, .03], [e * 1.0, .035], [e * .97, .09], [e * .78, .13], [e * .4, .148], [e * .1, .15]]; }, k.cap);
      } else if (cap43) {                                                                                                                        // M43 field cap with its short visor
        v7Radial(M, 16, a => { const e = ell(.114, .102, a); return [[e * 1.04, -.012], [e * 1.05, .05], [e * 1.0, .10], [e * .92, .13], [e * .5, .148], [e * .1, .152]]; }, k.cap);
        M.hex8([[.09, -.075, -.012], [.165, -.06, -.03], [.165, .06, -.03], [.09, .075, -.012], [.09, -.075, .0], [.165, -.06, -.02], [.165, .06, -.02], [.09, .075, .0]], k.cap);
      } else if (fj) {                                                                                                                           // M38 paratrooper helmet: rimless, shallow, edge cut above the eyes, down over the ears
        v7Radial(M, 24, a => { const c = Math.cos(a), e = ell(.14, .124, a), zb = c > 0 ? -.035 + .06 * c * c : -.035 + .012 * -c;
          return [[e * 1.03, zb], [e * 1.02, zb + .012], [e * .99, Math.max(zb + .04, .045)], [e * .93, .1], [e * .79, .135], [e * .55, .156], [e * .2, .165]]; }, k.helmet);
        for (const s of [-1, 1]) v7Polyline(M, [[-.02, s * .12, -.01], [.02, s * .1, -.09], [.06, s * .05, -.135]], .007, k.leather, 4);
      } else if (us) {                                                                                                                           // M1: 29 × 24 cm shell, 17 cm high; rim on the brow, short front lip, flared rear lip
        v7Radial(M, 24, a => { const c = Math.cos(a), e = ell(.142, .118, a), zr = c > 0 ? .035 * c * c : .008 * -c, lip = c > 0 ? 1.03 + .05 * c * c * c : 1.03 + .04 * c * c;
          return [[e * lip, zr - .008], [e * 1.0, zr], [e * .995, zr + .03], [e * .96, .085], [e * .87, .115], [e * .70, .142], [e * .45, .16], [e * .15, .168]]; }, k.helmet);
        if (para) { for (const s of [-1, 1]) v7Polyline(M, [[-.03, s * .115, .01], [.0, s * .1, -.07], [.06, s * .05, -.135]], .008, k.leather, 4); M.box(.04, .08, -.03, .03, -.145, -.12, k.leather);   // A-yoke chin strap + cup
          M.box(.06, .13, .03, .085, .1, .14, k.pack); }                                                                                        // first-aid pouch on the helmet
        else for (const s of [-1, 1]) v7Limb(M, [.0, s * .112, .0], [.06, s * .05, -.135], .007, .007, k.web, 4);                                            // chin strap
        if (off) { M.box(-.15, -.128, -.012, .012, .03, .11, k.white); for (const y of [-.016, .016]) M.box(.128, .15, y - .006, y + .006, .05, .08, k.white); }   // officer's rear stripe, captain's bars
        if (O.has('rgr')) { const q = M.M.length; M.box(-.004, .004, -.024, .024, -.024, .024, k.orange); v7Xf(M, q, v7.rx(Math.PI / 4), [-.142, 0, .092]); }   // Ranger diamond on the back
      } else {                                                                                                                                   // M35/M40: 31 × 26 cm, short visor at the brow, side skirt over the ears stepping down to the neck guard
        v7Radial(M, 24, a => { const c = Math.cos(a), w = Math.max(0, c) ** 2, e = ell(.15, .126, a);
          const ze = c > 0 ? -.055 + .10 * w : -.055 - .035 * -c, flare = c > 0 ? 1.13 - .03 * w : 1.13 + .04 * -c, zk = ze + (c > 0 ? .04 - .022 * w : .045);
          return [[e * flare, ze], [e * 1.06, ze + .012], [e * 1.0, zk], [e * .985, Math.max(zk + .02, .05)], [e * .95, .09], [e * .86, .12], [e * .70, .145], [e * .45, .163], [e * .15, .172]]; }, k.helmet);
        for (const s of [-1, 1]) { v7Limb(M, [-.005, s * .118, -.02], [.06, s * .05, -.135], .007, .007, k.web, 4); M.lathe('y', [-.03, s * .125, .035], [[0, 0], [0, .012], [s * .008, .012], [s * .008, 0]], 8, k.metal); }   // chin strap, air-vent rivets
      }
      v7Xf(M, t0, Rh, v7.add(hc, v7.mv(Rh, [-.018, 0, 0])));
      return M;
    }

    // ---------- model registry: key → builder + sprite pivot shift + antenna base/tip (X, Y, Z0, Z1) ----------
    // ══════════════════════════════════════════════════════════════
    // v112 — seven new US models (measured on the supplied blueprints), seated / standing crews for open vehicles,
    //        white Allied stars (and red crosses) laid onto the hull surfaces by ray-casting
    // ══════════════════════════════════════════════════════════════
    // ---- crew: per-vehicle seated / standing poses (hands placed on the wheel, the knees or the gun grips) ----
    function v112SeatPose(name, hipZ, hands, footX, lean = -.08) {
      V7POSES[name] = { hip: [0, 0, hipZ], lean, twist: 0, feet: [{ at: [footX, .13, .09], dir: [1, .12, 0], hint: [1, 0, .5] }, { at: [footX, -.13, .09], dir: [1, -.12, 0], hint: [1, 0, .5] }],
        hands, el: [[-.25, -.9, -1], [-.25, .9, -1]], head: [.03, 0, .14], pitch: .05 };
    }
    function v112GunPose(name, hx, hz) {
      V7POSES[name] = Object.assign({}, V7STAND, { lean: .1, twist: 0, hands: [[hx, -.075, hz], [hx, .075, hz]], el: [[-.3, -.8, -1], [-.3, .8, -1]], head: [.05, 0, .14], pitch: .1 });
    }
    // jeep: low seats (floor .45); half-track cab (floor .62, seat 1.05); weasel (floor .80); riders on the half-track benches; gunners at the grips
    v112SeatPose('sitj', .42, [[.40, -.15, .66], [.40, .15, .66]], .50, -.12);
    v112SeatPose('ridej', .42, [[.34, -.13, .52], [.34, .13, .52]], .48, -.10);
    v112SeatPose('sith', .52, [[.40, -.15, .67], [.40, .15, .67]], .46, -.06);
    v112SeatPose('rideh', .52, [[.33, -.13, .60], [.33, .13, .60]], .44, -.06);
    v112SeatPose('rideb', .52, [[.30, -.12, .58], [.30, .12, .58]], .42, -.04);
    v112SeatPose('sitw', .40, [[.38, -.15, .64], [.38, .15, .64]], .46, -.10);
    v112SeatPose('ridew', .40, [[.32, -.13, .50], [.32, .13, .50]], .44, -.08);
    v112SeatPose('sitq', .40, [[.36, -.20, .62], [.36, .20, .62]], .40, .05);
    v112GunPose('gunj', .30, 1.13); v112GunPose('gunh', .34, 1.30);
    // append a soldier mesh (local metres, origin = floor point under the hips) at (x, y, z) turned by yaw
    const V117NC = { on: false };                                   // v117: true while baking crew-less icon meshes
    function v112Crew(M, fig, x, y, z, yaw = 0) {
      if (V117NC.on) return;
      const S = buildSoldier(fig), base = M.mats.length, c = Math.cos(yaw), s = Math.sin(yaw);
      S.mats.forEach(m => M.mats.push(m)); S.M.forEach(m => { M.M.push(m + base); M.G.push(M.grp ? 1 : 0); });
      for (let i = 0; i < S.P.length; i += 3) {
        const px = S.P[i], py = S.P[i + 1]; M.P.push(x + px * c - py * s, y + px * s + py * c, z + S.P[i + 2]);
        const nx = S.N[i], ny = S.N[i + 1]; M.N.push(nx * c - ny * s, nx * s + ny * c, S.N[i + 2]);
      }
    }
    // ---- decals: cast a ray onto the finished hull and lay a thin flat shape on the hit face ----
    function v112Ray(M, o, d, nTri) {
      let best = 1e9, bi = -1; const P = M.P;
      for (let t = 0; t < nTri; t++) {
        const i = t * 9, ax = P[i], ay = P[i + 1], az = P[i + 2], e1 = [P[i + 3] - ax, P[i + 4] - ay, P[i + 5] - az], e2 = [P[i + 6] - ax, P[i + 7] - ay, P[i + 8] - az];
        const p = cross(d, e2), det = dot(e1, p); if (Math.abs(det) < 1e-12) continue;
        const inv = 1 / det, tv = [o[0] - ax, o[1] - ay, o[2] - az], u = dot(tv, p) * inv; if (u < 0 || u > 1) continue;
        const q = cross(tv, e1), v = dot(d, q) * inv; if (v < 0 || u + v > 1) continue;
        const dist = dot(e2, q) * inv; if (dist > 1e-4 && dist < best) { best = dist; bi = t; }
      }
      if (bi < 0) return null;
      const i = bi * 9; let n = nrm(cross([P[i + 3] - P[i], P[i + 4] - P[i + 1], P[i + 5] - P[i + 2]], [P[i + 6] - P[i], P[i + 7] - P[i + 1], P[i + 8] - P[i + 2]]));
      if (dot(n, d) > 0) n = neg(n);
      return { p: [o[0] + d[0] * best, o[1] + d[1] * best, o[2] + d[2] * best], n };
    }
    const V112_STAR = Array.from({ length: 10 }, (_, k) => { const a = Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? .382 : 1; return [Math.cos(a) * r, Math.sin(a) * r]; });
    const V112_CROSS = [[.2, 1], [.2, .2], [1, .2], [1, -.2], [.2, -.2], [.2, -1], [-.2, -1], [-.2, -.2], [-1, -.2], [-1, .2], [-.2, .2], [-.2, 1]];
    const V112_SQ = [[1, 1], [1, -1], [-1, -1], [-1, 1]];
    // v134: U.S. mark — the star at .76 of the decal size inside a broken ring (five arcs, gaps at the star points)
    const V134_RING = (() => { const out = [], r0 = 1.11, r1 = 1.33, g = 7 * Math.PI / 180; for (let k = 0; k < 5; k++) { const a0 = Math.PI / 2 + k * 2 * Math.PI / 5 + g, a1 = Math.PI / 2 + (k + 1) * 2 * Math.PI / 5 - g;
      for (let t = 0; t < 3; t++) { const b0 = a0 + (a1 - a0) * t / 3, b1 = a0 + (a1 - a0) * (t + 1) / 3; out.push([[Math.cos(b0) * r0, Math.sin(b0) * r0], [Math.cos(b0) * r1, Math.sin(b0) * r1], [Math.cos(b1) * r1, Math.sin(b1) * r1], [Math.cos(b1) * r0, Math.sin(b1) * r0]]); } } return out; })();
    function v134Star(M, nT, o, d, R, shape, mat, up) { const k = .76; v112Decal(M, nT, o, d, R * k, shape, mat, up); V134_RING.forEach(q => v112Decal(M, nT, o, d, R * k, q, mat, up)); }
    // shape points are (right, up) in the face plane; `up` = the world direction that should read as "up" on the decal
    function v112Decal(M, nTri, o, d, R, shape, mat, up = [0, 0, 1], lift = .012) {
      const h = v112Ray(M, o, nrm(d), nTri); if (!h) return false;
      const n = h.n; let u = sub(up, [n[0] * dot(up, n), n[1] * dot(up, n), n[2] * dot(up, n)]); if (Math.hypot(...u) < 1e-3) u = Math.abs(n[0]) < .9 ? [1, 0, 0] : [0, 1, 0]; u = nrm(u);
      const r = nrm(cross(u, n)), c = [h.p[0] + n[0] * lift, h.p[1] + n[1] * lift, h.p[2] + n[2] * lift];
      v5Slab(M, shape.map(([a, b]) => [c[0] + (r[0] * a + u[0] * b) * R, c[1] + (r[1] * a + u[1] * b) * R, c[2] + (r[2] * a + u[2] * b) * R]), [n[0] * .006, n[1] * .006, n[2] * .006], mat);
      return true;
    }
    // stars: [x, z, R] on both sides (rays along ∓Y), [x, y, R, 'top'] from above (up = forward so a point faces the front), [y, z, R, 'front'|'rear']
    function v112Stars(M, spec) {
      const nT = M.M.length, white = M.mat([228, 228, 220], { spec: .05, noise: .3, dirt: .6 });
      (spec || []).forEach(s => {
        if (s[3] === 'top') v134Star(M, nT, [s[0], s[1], 8], [0, 0, -1], s[2], V112_STAR, white, [1, 0, 0]);
        else if (s[3] === 'front') v134Star(M, nT, [8, s[0], s[1]], [-1, 0, 0], s[2], V112_STAR, white);
        else if (s[3] === 'rear') v134Star(M, nT, [-8, s[0], s[1]], [1, 0, 0], s[2], V112_STAR, white);
        else for (const sy of [-1, 1]) v134Star(M, nT, [s[0], sy * 6, s[1]], [0, -sy, 0], s[2], V112_STAR, white);
      });
    }
    function v112RedCross(M, nT, o, d, R, up) {
      const white = M.mat([226, 226, 218], { spec: .05, noise: .3, dirt: .5 }), red = M.mat([176, 34, 30], { spec: .05, noise: .3, dirt: .5 });
      v112Decal(M, nT, o, d, R, V112_SQ, white, up, .012); v112Decal(M, nT, o, d, R * .82, V112_CROSS, red, up, .02);
    }
    const v112Mats = (M, P) => ({
      hull: M.mat(P.hull, { spec: .08 }), dark: M.mat(P.dark, { spec: .05 }), gun: M.mat(P.gun, { spec: .22, noise: .5 }), wheel: M.mat(P.wheel, { spec: .12 }),
      trk: M.mat([50, 48, 44], { spec: .06, noise: 1.3 }), trkR: M.mat([64, 60, 54], { shadow: false, noise: 1.3 }), tyre: M.mat([30, 31, 33], { noise: .6 }),
      steel: M.mat([60, 62, 58], { spec: .3, noise: .5 }), black: M.mat([22, 24, 26], { shadow: false, noise: 0 }), glass: M.mat([168, 182, 178], { spec: .9, shadow: false, noise: 0 }),
      canvas: M.mat([104, 106, 80], { spec: .03, noise: 1.3 }), wood: M.mat([108, 82, 56], { spec: .03, noise: 1.3 }), seat: M.mat([72, 66, 50], { spec: .03, noise: 1.0 }),
      inner: M.mat([88, 92, 66], { spec: .03, noise: .8 }), grille: M.mat([34, 36, 38], { shadow: false, noise: .5 }), lamp: M.mat([120, 40, 34], { shadow: false })
    });
    // closed track belt over sprocket (front) / idler (rear) with a straight ground run and a top run
    function v112Belt(S, I, x0, x1, topZ) {
      const out = []; v5Arc(out, S.c, S.r, Math.PI / 2, -Math.PI / 2 + .35, 12); out.push([x0, .0], [x1, .0]); v5Arc(out, I.c, I.r, -Math.PI / 2 - .35, -Math.PI * 1.5, 12);
      if (topZ) { out.push([I.c[0] + .3, topZ], [S.c[0] - .3, topZ]); }
      return out;
    }
    function v112Sprocket(M, x, yc, z, R, f, K) {
      const L = (ax, o, prof, seg, m) => M.lathe(ax, o, prof, seg, m);
      L('y', [x, yc, z], [[-.12 * f, 0], [-.12 * f, R * .86, K.wheel], [.12 * f, R * .86, K.wheel], [.12 * f, R * .35, K.dark], [.16 * f, R * .30, K.dark], [.16 * f, 0, K.dark]], 22, K.wheel);
      for (let k = 0; k < 13; k++) pnRadial(M, x, z, k * 2 * Math.PI / 13, R * .82, R * 1.04, .06, .03, yc - .10, yc + .10, K.wheel);
    }

    // ---------- M24 Chaffee light tank — supplied 4-view line drawing (139 px/m: hull 5.03, 5.56 with gun, 2.95 wide) + colour 4-view ----------
    // Front sprocket (X 2.14 Z .68), 5 dual road wheels R .325 on torsion arms (X 1.47 … -1.40), 3 return rollers, rear idler; hull with sloped sponson sides
    // (±1.04 @ Z1.15 → ±.89 @ Z1.50), fenders ±1.44, glacis, engine deck; pear-shaped turret widest ±.97, roof Z2.17, mantlet + 75 mm M6, cupola left, .50 AA on the rear right.
    function buildM24(paint) {
      const P = PAINT[paint] || PAINT.olive, M = new Mesh(), K = v112Mats(M, P), L = (ax, o, prof, seg, m) => M.lathe(ax, o, prof, seg, m);
      // lower hull between the tracks
      extrudeXZ(M, [[2.48, .96], [2.30, .50], [-2.05, .46], [-2.25, .62], [-2.25, 1.16], [2.25, 1.16]], -.98, .98, K.hull);
      // upper hull: sloped sponson sides, glacis, deck falling slightly to the rear
      const sec = (x, zr) => [x, [[-1.04, 1.15], [-.89, zr], [.89, zr], [1.04, 1.15]]];
      v5Loft(M, [sec(1.42, 1.47), sec(-.95, 1.47), sec(-2.25, 1.33)], K.hull);
      M.hex8([[2.24, -1.04, 1.15], [2.24, 1.04, 1.15], [1.42, 1.04, 1.15], [1.42, -1.04, 1.15], [2.24, -.98, 1.18], [2.24, .98, 1.18], [1.42, .89, 1.47], [1.42, -.89, 1.47]], K.hull);
      M.box(2.24, 2.50, -.98, .98, .95, 1.18, K.hull);                                                                        // nose cap
      for (const sy of [-1, 1]) {
        const ya = sy > 0 ? 1.0 : -1.44, yb = sy > 0 ? 1.44 : -1.0;
        M.box(-2.28, 2.20, ya, yb, 1.13, 1.155, K.hull);                                                                     // fender
        const g = [[2.20, 1.155], [2.42, 1.10], [2.55, .98], [2.60, .86]];
        for (let i = 0; i + 1 < g.length; i++) M.hex8([[g[i][0], ya, g[i][1]], [g[i + 1][0], ya, g[i + 1][1]], [g[i + 1][0], yb, g[i + 1][1]], [g[i][0], yb, g[i][1]], [g[i][0], ya, g[i][1] - .025], [g[i + 1][0], ya, g[i + 1][1] - .025], [g[i + 1][0], yb, g[i + 1][1] - .025], [g[i][0], yb, g[i][1] - .025]], K.hull);
        M.box(-1.9, 1.7, sy > 0 ? 1.20 : -1.40, sy > 0 ? 1.40 : -1.20, 1.155, 1.27, K.dark);                                  // fender stowage boxes
        for (const xx of [-1.10, -.15, .80]) M.box(xx - .02, xx + .02, sy > 0 ? 1.19 : -1.41, sy > 0 ? 1.41 : -1.19, 1.155, 1.275, K.hull);
        v5Rod(M, [1.55, sy * 1.06, 1.22], [-1.80, sy * 1.06, 1.22], .022, K.wood, 6);                                     // tools on the sponson
        L('x', [2.06, sy * .72, 1.30], [[0, 0], [0, .07], [.05, .08], [.11, .08], [.13, .06], [.13, 0]], 12, K.dark); L('x', [2.19, sy * .72, 1.30], [[0, 0], [0, .06], [.006, .055], [.006, 0]], 12, K.glass);
        M.box(2.44, 2.56, sy * .55 - .05, sy * .55 + .05, .62, .76, K.dark);                                                  // tow eyes
        // running gear
        const yc = sy * 1.22, f = sy;
        v5Track(M, v112Belt({ c: [2.14, .68], r: .30 }, { c: [-2.02, .68], r: .31 }, 1.47, -1.40, 1.07), yc - .21, yc + .21, .045, .14, K.trk, K.trkR);
        for (const x of [1.47, .76, .04, -.68, -1.40]) {
          v5RoadWheel(M, x, yc + .08 * f, .345, .325, .13, f, K.tyre, K.wheel, K.dark); v5RoadWheel(M, x, yc - .09 * f, .345, .325, .13, -f, K.tyre, K.wheel, K.dark);
          v5Rod(M, [x, yc - .22 * f, .345], [x + .30, sy * .99, .62], .05, K.dark, 6); M.box(x + .22, x + .40, sy > 0 ? .98 : -1.03, sy > 0 ? 1.03 : -.98, .54, .72, K.dark);   // torsion arm + housing
        }
        for (const x of [1.12, .36, -1.01]) L('y', [x, yc, .88], [[-.07 * f, 0], [-.07 * f, .135, K.tyre], [.07 * f, .135, K.tyre], [.07 * f, .06, K.wheel], [.09 * f, .05, K.dark], [.09 * f, 0, K.dark]], 16, K.tyre);
        v112Sprocket(M, 2.14, yc, .68, .29, f, K);
        L('y', [-2.02, yc, .68], [[-.15 * f, 0], [-.15 * f, .29, K.tyre], [.15 * f, .29, K.tyre], [.15 * f, .25, K.wheel], [.10 * f, .22, K.wheel], [.10 * f, .08, K.dark], [.17 * f, .07, K.dark], [.17 * f, 0, K.dark]], 22, K.tyre);
        M.box(-2.30, -1.85, sy > 0 ? .98 : -1.07, sy > 0 ? 1.07 : -.98, .55, .80, K.dark);                                  // idler arm
      }
      // deck: driver / co-driver hatches with periscopes, ventilator, engine louvres, rear plate, exhaust and stowage boxes
      for (const yc of [-.54, .54]) { L('z', [1.18, yc, 1.47], [[0, 0], [0, .26], [.03, .26], [.04, .23], [.04, 0]], 22, K.hull); M.box(1.32, 1.42, yc - .07, yc + .07, 1.47, 1.56, K.dark); M.box(1.415, 1.422, yc - .06, yc + .06, 1.49, 1.55, K.glass); }
      L('z', [1.05, 0, 1.49], [[0, 0], [0, .10], [.05, .10], [.07, .07], [.07, 0]], 14, K.dark);
      const dz = x => 1.47 - Math.max(0, (-.95 - x)) / 1.30 * .14;
      for (let k = 0; k < 9; k++) { const x = -1.25 - k * .11; M.box(x - .035, x + .035, -.70, .70, dz(x), dz(x) + .025, K.grille); }
      M.box(-2.20, -1.55, -.86, -.74, dz(-1.9), dz(-1.9) + .04, K.dark); M.box(-2.20, -1.55, .74, .86, dz(-1.9), dz(-1.9) + .04, K.dark);
      M.box(-2.50, -2.25, -.82, .82, .92, 1.30, K.dark); M.box(-2.52, -2.50, -.78, .78, .96, 1.26, K.hull);                // rear stowage / exhaust box
      for (const sy of [-1, 1]) { L('x', [-2.50, sy * .95, 1.10], [[0, 0], [0, .05], [-.04, .05], [-.04, 0]], 10, K.lamp); L('x', [-2.25, sy * .45, .70], [[0, 0], [0, .08], [-.20, .08], [-.20, 0]], 12, K.dark); }
      M.grp = 1;   // v192: turret part (rotates on its own)
      // ---- turret — overlaid on the side drawing (139 px/m, aligned on the road wheels): side bottom Z 1.60 from the cheek (X .86) to X −.65, bustle underside rising
      //      to the vertical rear face X −1.36 (Z 1.74…1.96), rear roof sloping up to the flat roof Z 2.22 (X .50 … −.65); plan ±.92 (top view) tapering to ±.44 ----
      { const cx = -.25, N = 44;
        const pl = (F, Rr, W, rw) => { const xs = Math.min(F - .46, Math.max(Rr + .45, -.35)), h = [[F, W * .46], [F - .17, W * .82], [F - .45, W], [xs, W], [Rr, rw]];
          return h.concat(h.slice().reverse().map(([x, y]) => [x, -y])).map(([x, y]) => [x - cx, y]); };
        const ring = ol => Array.from({ length: N }, (_, k) => { const a = k * 2 * Math.PI / N, r = v5Ray(ol, a); return [cx + r * Math.cos(a), r * Math.sin(a)]; });
        L('z', [cx, 0, 1.46], [[0, 0], [0, .86], [.16, .86], [.16, 0]], 36, K.dark);                                        // turret ring / basket collar
        v5Stack(M, [[1.60, ring(pl(.86, -.65, .90, .62))], [1.74, ring(pl(.90, -1.36, .92, .46))], [1.96, ring(pl(.90, -1.36, .92, .44))],
                    [2.10, ring(pl(.87, -.98, .89, .52))], [2.22, ring(pl(.50, -.65, .80, .60))]], K.hull); }
      // cast mantlet housing (cheek X .80 → 1.28, rounded), gun sleeve to 1.55, 75 mm M6 to the muzzle X 3.03, axis Z 1.77; coax MG, sight
      M.box(.80, 1.20, -.46, .46, 1.60, 2.04, K.hull); for (const sy of [-1, 1]) L('z', [1.00, sy * .46, 1.60], [[0, 0], [0, .14], [.44, .14], [.44, 0]], 12, K.hull);
      L('x', [1.20, 0, 1.77], [[0, 0], [0, .22], [.05, .21], [.10, .12], [.10, 0]], 18, K.hull);
      L('x', [1.28, 0, 1.77], [[0, 0], [0, .09], [.24, .085], [.27, .06], [1.70, .048], [1.72, .053], [1.75, .053], [1.75, 0]], 16, K.gun);
      L('x', [1.22, -.24, 1.80], [[0, 0], [0, .025], [.12, .025], [.12, 0]], 8, K.gun); M.box(1.0, 1.16, .28, .36, 1.96, 2.04, K.dark);
      // cupola (left), loader's hatch (right), periscopes, .50 AA on the rear-right pintle, rear stowage bin
      L('z', [-.06, .36, 2.20], [[0, 0], [0, .33], [.10, .33], [.12, .30], [.17, .27], [.20, .16], [.21, 0]], 26, K.hull);   // cupola (top Z 2.41)
      for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + .3; M.box(-.06 + .28 * Math.cos(a) - .04, -.06 + .28 * Math.cos(a) + .04, .36 + .28 * Math.sin(a) - .04, .36 + .28 * Math.sin(a) + .04, 2.26, 2.34, K.glass); }
      L('z', [.15, -.40, 2.20], [[0, 0], [0, .26], [.04, .26], [.05, .23], [.05, 0]], 20, K.hull); M.box(.36, .46, -.47, -.35, 2.20, 2.30, K.dark);
      { const px = -.47, py = -.52; L('z', [px, py, 2.20], [[0, 0], [0, .045], [.34, .04], [.34, 0]], 8, K.dark); M.box(px - .55, px - .08, py - .06, py + .06, 2.54, 2.66, K.gun);   // .50 on the pintle, receiver behind the post
        L('x', [px - .08, py, 2.60], [[0, 0], [0, .03], [.20, .03], [.20, .022], [.82, .02], [.84, .03], [.88, .03], [.88, 0]], 10, K.gun); M.box(px - .30, px - .15, py + .06, py + .22, 2.46, 2.56, K.gun); }
      M.grp = 0;
      return M;
    }

    // ---------- cylinder clipped by an inclined plane (M3 37 mm turret: front cut away; M31 turret: rear cut away) ----------
    // prof = [[z, r], …] (z rising, r = wall radius), top cap flat at the last z; cut: plane z = cut.z + (cut.x − x)·cut.s along the hull axis
    // (cut.s > 0 → the plane rises toward the rear, removing the front; cut.s < 0 → rises toward the front, removing the rear)
    function v113CutCyl(M, cx, cy, prof, cut, N, m) {
      const z0 = prof[0][0], zT = prof[prof.length - 1][0];
      const R = z => { if (z <= prof[0][0]) return prof[0][1]; for (let i = 0; i + 1 < prof.length; i++) if (z <= prof[i + 1][0]) { const t = (z - prof[i][0]) / (prof[i + 1][0] - prof[i][0]); return prof[i][1] + (prof[i + 1][1] - prof[i][1]) * t; } return prof[prof.length - 1][1]; };
      const Zp = x => cut.z + (cut.x - x) * cut.s;
      const ang = []; for (let k = 0; k < N; k++) ang.push(k * 2 * Math.PI / N);
      const rT = R(zT), xj = cut.x - (zT - cut.z) / cut.s, cj = (xj - cx) / rT;
      let tj = null; if (Math.abs(cj) < 1) { tj = Math.acos(cj); ang.push(tj, 2 * Math.PI - tj); }
      ang.sort((a, b) => a - b);
      const col = ang.map(a => { let z = zT; for (let it = 0; it < 12; it++) z = Math.max(z0 + .01, Math.min(zT, Zp(cx + R(z) * Math.cos(a)))); return { a, zt: z }; });
      const T = [0, .45, .7, .84, .92, .96, .985, 1];
      const P = col.map(({ a, zt }) => T.map(t => { const z = z0 + (zt - z0) * t, r = R(z); return [cx + r * Math.cos(a), cy + r * Math.sin(a), z]; }));
      const Nr = col.map(({ a, zt }) => T.map(t => { const z = z0 + (zt - z0) * t, dz = .02, dr = (R(z + dz) - R(z - dz)) / (2 * dz); return nrm([Math.cos(a), Math.sin(a), -dr]); }));
      for (let i = 0; i < col.length; i++) { const j = (i + 1) % col.length; for (let k = 0; k + 1 < T.length; k++) { M.tri(P[i][k], P[j][k], P[j][k + 1], Nr[i][k], Nr[j][k], Nr[j][k + 1], m); M.tri(P[i][k], P[j][k + 1], P[i][k + 1], Nr[i][k], Nr[j][k + 1], Nr[i][k + 1], m); } }
      const top = i => P[i][T.length - 1], flat = [], slope = [];
      col.forEach((c, i) => { if (c.zt >= zT - 1e-4) flat.push(i); if (c.zt <= Zp(top(i)[0]) + 1e-4) slope.push(i); });
      const fan = (idx, n) => { if (idx.length < 3) return; const pts = idx.map(top), c = pts.reduce((q, p) => [q[0] + p[0] / pts.length, q[1] + p[1] / pts.length, q[2] + p[2] / pts.length], [0, 0, 0]);
        const ord = pts.map(p => [Math.atan2(p[1] - c[1], p[0] - c[0]), p]).sort((a, b) => a[0] - b[0]).map(q => q[1]);
        for (let i = 0; i < ord.length; i++) M.tri(c, ord[i], ord[(i + 1) % ord.length], n, n, n, m); };
      fan(flat, [0, 0, 1]); fan(slope, nrm([cut.s, 0, 1]));
    }

    // ---------- M3 medium tank (Lee) and the M31 TRV on its chassis — overlaid on the 4-view line drawing (68.3 px/m, model X = (441 − px)/68.3, Z = (226 − py)/68.3) ----------
    // superstructure: vertical riveted sides ±1.26 from Z 1.12, roof 2.10; front plate from the nose top (X 2.05, Z 1.12) up to the roof (X 1.33); corner plates with the
    // side seam X 1.26 @ 1.12 → .53 @ roof; roof ends X −1.04; engine deck 1.80 → sloping to 1.48 at X −2.33, stowage boxes along both deck edges (top 1.89), rear block
    // (top 1.62, X −2.33 … −2.70). 75 mm M2 in a cast cylinder sponson R .49 at (1.05, −.81), axis Z 1.73, muzzle X 3.34. 37 mm turret: cylinder R .80 at (−.14, +.37),
    // front cut by a plane from the roof at X .60 up to the flat top Z 2.76 at X .05; cupola R .36 at (−.40, +.66), top 3.0. VVSS bogies X 1.55 / .10 / −1.35.
    // M31 (3-view 46.8 px/m + o5m6 painting): round cast turret R .76 at (−.25, +.31) to Z 2.76, its rear cut by a sloping face carrying the boom foot; dummy 37 mm and 75 mm;
    // rear superstructure box to Z 2.16 (X −1.09 … −2.45) and the angled back plate; spare bogie wheels on the front plate.
    function buildM3Lee(paint, variant) {
      const P = PAINT[paint] || PAINT.olive, M = new Mesh(), K = v112Mats(M, P), L = (ax, o, prof, seg, m) => M.lathe(ax, o, prof, seg, m), trv = variant === 'm31';
      const HW = 1.26, RZ = 2.10, BZ = 1.12;
      // ---- lower hull between the tracks; three-piece bolted transmission housing ----
      extrudeXZ(M, [[2.05, 1.16], [2.05, .60], [1.80, .46], [-2.45, .46], [-2.70, .62], [-2.70, 1.14]], -.88, .88, K.hull);
      const nose = [[2.05, 1.17], [2.50, 1.20], [2.68, 1.12], [2.79, .94], [2.80, .74], [2.70, .58], [2.45, .48], [2.05, .48]];
      for (const [y0, y1] of [[-.90, -.34], [-.32, .28], [.30, .90]]) extrudeXZ(M, nose, y0, y1, K.hull);
      for (const yy of [-.33, .29]) for (let k = 0; k < nose.length - 2; k++) v5Rod(M, [nose[k][0] + .02, yy, nose[k][1] + .02], [nose[k + 1][0] + .02, yy, nose[k + 1][1] + .02], .03, K.hull, 5);   // bolted flanges
      for (const sy of [-1, 1]) { M.box(2.70, 2.86, sy * .62 - .05, sy * .62 + .05, .66, .80, K.dark); L('y', [2.80, sy * .62 - .07, .73], [[0, 0], [0, .05], [.14, .05], [.14, 0]], 10, K.dark); }   // tow eyes
      // ---- superstructure: bottom outline (Z 1.12) lofted to the roof outline — sloping front plate, angled corner plates, vertical sides ----
      v5LoftZ(M, [[2.05, -.85], [2.05, .85], [1.26, HW], [-1.04, HW], [-1.04, -HW], [1.26, -HW]], [[1.33, -.80], [1.33, .80], [.53, HW], [-1.04, HW], [-1.04, -HW], [.53, -HW]], BZ, RZ, K.hull, true);
      M.box(-2.70, 1.26, -HW, HW, BZ - .03, BZ, K.hull);                                                                    // sponson floors over the tracks
      // ---- engine compartment: deck sloping from the roof step to the rear face; tail boxes on the rear corners ----
      const dz = x => x > -1.30 ? 1.80 - (-1.04 - x) * .15 : 1.76 - (-1.30 - x) * .272;
      extrudeXZ(M, [[-1.04, 1.80], [-1.04, BZ], [-2.70, BZ], [-2.70, dz(-2.70)], [-1.30, 1.76]], -HW, HW, K.hull);
      M.box(-2.72, -2.70, -1.10, 1.10, .62, 1.34, K.dark);
      for (const sy of [-1, 1]) { M.box(-2.70, -2.37, sy > 0 ? .84 : -HW + .02, sy > 0 ? HW - .02 : -.84, 1.36, 1.62, K.hull); for (let q = 0; q < 4; q++) M.box(-2.705, -2.70, sy > 0 ? .88 : -HW + .06, sy > 0 ? HW - .06 : -.88, 1.40 + q * .05, 1.42 + q * .05, K.dark); }
      // rivets along the seams (sides, corner-plate seams, roof edge) and the side doors
      for (const sy of [-1, 1]) {
        for (let k = 0; k < 19; k++) { const x = 1.10 - k * .20, zt = x > -1.04 ? RZ - .05 : dz(x) - .05; for (const z of [BZ + .05, zt, 1.62]) if (z <= zt && x <= 1.26 + (.53 - 1.26) * (z - BZ) / (RZ - BZ) - .02) M.box(x - .012, x + .012, sy * HW - .01, sy * HW + .01, z - .012, z + .012, K.dark); }
        for (let k = 0; k < 7; k++) { const t = (k + .5) / 7, x = 1.26 + (.53 - 1.26) * t, z = BZ + (RZ - BZ) * t; M.box(x - .02, x + .005, sy * HW - .01, sy * HW + .01, z - .012, z + .012, K.dark); }
        M.box(-.24, .38, sy > 0 ? HW : -HW - .02, sy > 0 ? HW + .02 : -HW, 1.26, 1.90, K.dark); M.box(-.18, .32, sy > 0 ? HW + .02 : -HW - .03, sy > 0 ? HW + .03 : -HW - .02, 1.32, 1.84, K.hull);   // side door
        M.box(-.06, .23, sy > 0 ? HW + .03 : -HW - .06, sy > 0 ? HW + .06 : -HW - .03, 1.70, 1.86, K.hull); M.box(-.02, .19, sy > 0 ? HW + .06 : -HW - .065, sy > 0 ? HW + .065 : -HW - .06, 1.76, 1.80, K.black);   // door vision block
      }
      // corner-plate vision port (left), driver's visor on the front plate, twin bow MGs, headlights with guards
      { const cp = t => [1.26 + (.53 - 1.26) * t, HW, BZ + (RZ - BZ) * t], sy = 1;
        const a = [1.15, .80 + (1.26 - .80) * .55, 1.75], fx = z => 2.05 - (z - BZ) / (RZ - BZ) * .72;
        M.box(1.04, 1.30, .90, 1.10, 1.70, 2.02, K.hull); M.box(1.10, 1.24, 1.10, 1.12, 1.82, 1.86, K.black);
        M.box(fx(2.06) - .10, fx(1.78), -.12, .30, 1.78, 2.06, K.hull); M.box(fx(1.92) + .01, fx(1.92) + .02, -.06, .24, 1.90, 1.94, K.black);
        for (const yy of [.50, .64]) L('x', [fx(1.40) - .02, yy, 1.40], [[0, 0], [0, .03], [.26, .025], [.26, 0]], 8, K.gun);
        for (const sy2 of [-1, 1]) { L('x', [2.20, sy2 * .68, 1.30], [[0, 0], [0, .06], [.04, .07], [.10, .07], [.12, .05], [.12, 0]], 12, K.dark); L('x', [2.32, sy2 * .68, 1.30], [[0, 0], [0, .055], [.005, .05], [.005, 0]], 12, K.glass);
          v5Poly(M, [[2.18, sy2 * .58, 1.22], [2.36, sy2 * .58, 1.24], [2.36, sy2 * .78, 1.24], [2.18, sy2 * .78, 1.22]], .01, K.dark); } }
      // ---- 75 mm cast cylinder sponson on the right front (R .49) with the rotor shield and the M2 gun ----
      L('z', [1.05, -.81, 1.26], [[0, 0], [0, .49], [RZ - 1.26 - .04, .49], [RZ - 1.26 + .02, .45], [RZ - 1.26 + .04, .38], [RZ - 1.26 + .04, 0]], 30, K.hull);
      L('x', [1.50, -.81, 1.73], [[0, 0], [0, .22], [.08, .21], [.16, .12], [.16, 0]], 18, K.hull);
      if (!trv) L('x', [1.64, -.81, 1.73], [[0, 0], [0, .075], [.25, .07], [.27, .055], [1.66, .05], [1.68, .057], [1.70, .057], [1.70, 0]], 14, K.gun);
      else { L('x', [1.64, -.81, 1.73], [[0, 0], [0, .075], [.18, .07], [.18, 0]], 14, K.gun); v5Rod(M, [1.80, -.81, 1.74], [2.75, -.81, 1.90], .048, K.gun, 10); }   // M31: dummy 75 mm, raised
      L('z', [.92, -.81, RZ + .04], [[0, 0], [0, .17], [.10, .17], [.12, .13], [.12, 0]], 16, K.hull); M.box(.98, 1.04, -.86, -.76, RZ + .10, RZ + .16, K.glass);   // sight hood on the sponson roof
      // ---- engine deck: grille, round access plate, stowage boxes along both edges, tools, rear lights, exhausts ----
      for (let q = 0; q < 6; q++) { const x = -1.06 - q * .05; M.box(x - .03, x, -.40, .44, dz(x), dz(x) + .03, K.grille); }
      v5Slab(M, Array.from({ length: 24 }, (_, k) => { const a = k * Math.PI / 12, x = -2.02 + .55 * Math.cos(a); return [x, .04 + .55 * Math.sin(a), dz(x) + .004]; }), [0, 0, .022], K.hull);   // engine access plate
      if (!trv) for (const sy of [-1, 1]) { M.box(-2.37, -1.33, sy > 0 ? .84 : -HW + .02, sy > 0 ? HW - .02 : -.80, 1.48, 1.89, K.dark); M.box(-2.35, -1.35, sy > 0 ? .86 : -HW + .04, sy > 0 ? HW - .04 : -.82, 1.89, 1.91, K.hull); }
      if (!trv) v5Rod(M, [-1.40, -.65, dz(-1.40) + .03], [-2.25, -.65, dz(-2.25) + .03], .025, K.wood, 6);
      for (const sy of [-1, 1]) { L('x', [-2.72, sy * 1.05, 1.40], [[0, 0], [0, .045], [-.04, .045], [-.04, 0]], 10, K.lamp); L('x', [-2.70, sy * .45, .72], [[0, 0], [0, .08], [-.18, .08], [-.18, 0]], 12, K.dark); }
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
      if (!trv) {
        // ---- 37 mm turret: cylinder with its front cut away by an inclined plane; rotor shield + M6 on the cut face; cupola with the .30 ----
        M.grp = 1;   // v191: the 37 mm turret (cylinder, mantlet, M6, cupola, roof hatch) is the turret part; the sponson 75 mm stays on the hull
        const TX = -.14, TY = .37;
        v113CutCyl(M, TX, TY, [[RZ, .80], [2.50, .78], [2.64, .74], [2.71, .69], [2.75, .62], [2.76, .56]], { x: .60, z: RZ, s: 1.20 }, 48, K.hull);
        const fz = 2.46, fx = .60 - (fz - RZ) / 1.20;                                                                      // gun axis on the cut face
        M.hex8([[fx - .02, TY - .30, fz - .17], [fx - .02, TY + .12, fz - .17], [fx + .16, TY + .12, fz - .14], [fx + .16, TY - .30, fz - .14], [fx - .14, TY - .30, fz + .17], [fx - .14, TY + .12, fz + .17], [fx + .06, TY + .12, fz + .17], [fx + .06, TY - .30, fz + .17]], K.hull);   // rotor shield
        L('x', [fx + .14, TY - .10, fz], [[0, 0], [0, .09], [.06, .08], [.09, .05], [.09, 0]], 14, K.hull);
        L('x', [fx + .20, TY - .10, fz], [[0, 0], [0, .045], [.12, .04], [.86, .032], [.88, .04], [.90, .04], [.90, 0]], 14, K.gun);   // M6 to X 1.70
        L('x', [fx + .14, TY + .05, fz], [[0, 0], [0, .02], [.16, .02], [.16, 0]], 8, K.gun);
        const CX = -.40, CY = .66;
        L('z', [CX, CY, 2.70], [[0, 0], [0, .37], [.06, .37], [.06, .34], [.26, .33], [.30, .29], [.30, 0]], 24, K.hull);    // cupola, top Z 3.0
        for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + .4; M.box(CX + .33 * Math.cos(a) - .04, CX + .33 * Math.cos(a) + .04, CY + .33 * Math.sin(a) - .04, CY + .33 * Math.sin(a) + .04, 2.84, 2.90, K.black); }
        L('x', [CX + .30, CY - .08, 2.88], [[0, 0], [0, .022], [.40, .018], [.40, 0]], 8, K.gun);                         // cupola .30
        L('z', [-.62, .10, 2.76], [[0, 0], [0, .20], [.03, .20], [.04, .17], [.04, 0]], 16, K.hull);                       // turret roof hatch / vent
        M.grp = 0;
      } else {
        // ---- M31 (overlaid on the 3-view, 46 px/m): round cast turret R .80 at (−.21, +.28), top Z 2.83 with a rounded front edge, the rear cut by the sloping face
        //      (from the top at X −.43 down to Z 2.33 at the rear) that carries the boom foot; dummy 37 mm at Z 2.62 ----
        const TX = -.21, TY = .28;
        v113CutCyl(M, TX, TY, [[RZ, .80], [2.58, .80], [2.70, .77], [2.77, .72], [2.81, .64], [2.83, .56]], { x: -.43, z: 2.83, s: -.84 }, 48, K.hull);
        L('x', [TX + .74, TY + .22, 2.62], [[0, 0], [0, .10], [.10, .08], [.10, .04], [1.0, .035], [1.0, 0]], 12, K.gun);   // dummy 37 mm (to X 1.73)
        L('z', [TX + .10, TY + .25, 2.83], [[0, 0], [0, .17], [.07, .16], [.09, 0]], 14, K.hull);                           // hatch
        M.box(.46, 1.07, -1.00, -.60, RZ, 2.39, K.hull); M.box(1.06, 1.072, -.90, -.70, 2.24, 2.30, K.black);              // box on the sponson roof
        // rear superstructure box: X −2.52 … −.49, top Z 2.34, full width, vertical rear face
        M.box(-2.52, -.49, -HW + .01, HW - .01, 1.40, 2.34, K.hull);
        for (const sy of [-1, 1]) { for (let k = 0; k < 11; k++) { const x = -.60 - k * .18; M.box(x - .012, x + .012, sy * (HW - .01) - .01, sy * (HW - .01) + .01, 2.29, 2.31, K.dark); }
          for (const x of [-1.15, -1.85]) M.box(x - .006, x + .006, sy * (HW - .01) - .008, sy * (HW - .01) + .008, 1.42, 2.34, K.dark); }
        M.box(-2.54, -2.52, -1.0, 1.0, 1.50, 2.20, K.dark);
        // boom: two channels from the pivot on the cut face (−.95, 2.60) to the head (−4.40, 4.18), lacing, sheave head, cables, hook
        const B0 = [-.95, 0, 2.80], B1 = [-4.40, 0, 4.18];
        M.hex8([[-.55, -.30, 2.34], [-.55, .30, 2.34], [-1.13, .30, 2.34], [-1.13, -.30, 2.34], [-.55, -.30, 3.02], [-.55, .30, 3.02], [-1.13, .30, 2.86], [-1.13, -.30, 2.86]], K.hull);   // boom foot bracket (top Z 3.0)
        for (const yy of [-.17, .17]) v5Rod(M, [B0[0], yy, B0[2]], [B1[0], yy * .55, B1[2]], .07, K.hull, 4);
        for (let k = 1; k < 9; k++) { const t = k / 9, a = [B0[0] + (B1[0] - B0[0]) * t, B0[2] + (B1[2] - B0[2]) * t], t2 = (k + .5) / 9, b = [B0[0] + (B1[0] - B0[0]) * t2, B0[2] + (B1[2] - B0[2]) * t2];
          v5Rod(M, [a[0], -.17 + t * .08, a[1]], [b[0], .17 - t2 * .08, b[1]], .02, K.dark, 4); }
        M.hex8([[-4.14, -.16, 4.00], [-4.14, .16, 4.00], [-4.59, .16, 4.20], [-4.59, -.16, 4.20], [-4.09, -.16, 4.20], [-4.09, .16, 4.20], [-4.54, .16, 4.40], [-4.54, -.16, 4.40]], K.hull);   // head
        L('y', [-4.45, -.10, 4.14], [[0, 0], [0, .16], [.20, .16], [.20, 0]], 14, K.dark);
        for (const yy of [-.06, .06]) v5Rod(M, [-4.39, yy, 4.34], [-1.05, yy, 2.86], .012, K.black, 4);                    // hoist cables
        v5Rod(M, [-4.51, 0, 4.02], [-4.51, 0, 3.27], .012, K.black, 4); M.box(-4.59, -4.43, -.08, .08, 3.07, 3.27, K.dark);
        for (const sy of [-1, 1]) v5Rod(M, [-2.58, sy * .62, 1.62], [-3.85, sy * .12, 3.72], .055, K.hull, 6);              // boom jacks (A-frame)
        v5Rod(M, [-2.58, -.62, 1.62], [-2.58, .62, 1.62], .04, K.dark, 6);
        for (const [x, y, z] of [[1.90, .74, 1.62], [2.50, .22, 1.40], [2.42, -.33, 1.42]]) {                                // three spare bogie wheels on the nose (top view)
          M.lathe('x', [x - .12, y, z], [[0, 0], [0, .254], [.12, .254], [.12, 0]], 18, K.tyre); M.lathe('x', [x, y, z], [[0, 0], [0, .17], [.015, .15], [.015, 0]], 14, K.wheel); }
      }
      return M;
    }
    function buildM31(paint) { return buildM3Lee(paint, 'm31'); }

    // ---------- 1/4-ton 4×4 truck (Willys MB) with the .50 cal on the M31 pedestal — supplied blueprint (293 px/m: 3.35 × 1.57 m, wheelbase 2.03, track 1.245) ----------
    function buildJeep(paint) {
      const P = PAINT[paint] || PAINT.olive, M = new Mesh(), K = v112Mats(M, P), L = (ax, o, prof, seg, m) => M.lathe(ax, o, prof, seg, m);
      const FA = 1.015, RA = -1.015, WR = .37, TY = .62, FL = .45;
      // frame, axles, wheels
      for (const sy of [-1, 1]) M.box(-1.62, 1.52, sy * .40 - .04, sy * .40 + .04, .36, .46, K.dark);
      for (const ax of [FA, RA]) { L('y', [ax, -.60, WR], [[0, 0], [0, .045], [1.20, .045], [1.20, 0]], 8, K.dark); M.box(ax - .09, ax + .09, -.12, .12, .28, .44, K.dark);
        for (const sy of [-1, 1]) v5Tyre(M, ax, sy * TY, WR, WR, .17, sy, K.tyre, K.wheel, K.dark, 22); }
      // body tub: floor, sides with the door cut-outs, rear panel, rear fenders / wheel housings
      M.box(-1.58, .48, -.66, .66, FL, FL + .03, K.hull);
      for (const sy of [-1, 1]) {
        const y0 = sy > 0 ? .63 : -.66, y1 = sy > 0 ? .66 : -.63;
        extrudeXZ(M, [[-.56, 1.01], [-1.58, 1.01], [-1.58, .47], [-.56, .47]], y0, y1, K.hull);                      // rear block of the side
        extrudeXZ(M, [[.48, .98], [.20, .98], [.20, .47], [.48, .47]], y0, y1, K.hull); extrudeXZ(M, [[.20, .78], [-.56, .78], [-.56, .47], [.20, .47]], y0, y1, K.hull);   // cowl side + sill under the door cut-out
        v5Poly(M, [[.22, sy * .665, .98], [.12, sy * .665, .80], [-.40, sy * .665, .80], [-.56, sy * .665, 1.0]], .012, K.hull, 5);
        M.box(-1.40, -.62, sy > 0 ? .30 : -.66, sy > 0 ? .66 : -.30, .45, .80, K.hull);                                   // rear wheel housings
      }
      M.box(-1.62, -1.58, -.66, .66, .47, 1.01, K.hull); M.box(-1.58, -.56, -.66, .66, .98, 1.01, K.hull);
      // hood, grille with the vertical slots, headlights, flat front fenders, bumper with the wire-cutter post
      M.box(.48, 1.30, -.38, .38, .86, 1.06, K.hull); M.box(1.28, 1.34, -.40, .40, .50, 1.05, K.hull);
      for (let k = 0; k < 9; k++) { const yy = -.30 + k * .075; M.box(1.335, 1.345, yy - .018, yy + .018, .62, .98, K.black); }
      for (const sy of [-1, 1]) { L('x', [1.30, sy * .28, .88], [[0, 0], [0, .07], [.04, .07], [.04, 0]], 12, K.dark); L('x', [1.34, sy * .28, .88], [[0, 0], [0, .055], [.004, .05], [.004, 0]], 12, K.glass);
        M.box(.48, 1.40, sy > 0 ? .38 : -.80, sy > 0 ? .80 : -.38, .84, .87, K.hull); v5Slab(M, [[1.40, sy * .38, .87], [1.40, sy * .80, .87], [1.52, sy * .80, .62], [1.52, sy * .38, .62]], [0, 0, -.025], K.hull);
        M.box(.20, .48, sy > 0 ? .66 : -.80, sy > 0 ? .80 : -.66, .55, .58, K.hull); }                                  // running step
      M.box(1.46, 1.56, -.78, .78, .40, .52, K.hull); v5Rod(M, [1.50, .55, .52], [1.42, .55, 1.95], .025, K.dark, 5);
      M.box(.50, 1.28, -.36, .36, .46, .86, K.dark);                                                                       // engine bay (block, radiator shroud)
      for (const sy of [-1, 1]) { M.box(.48, 1.30, sy > 0 ? .36 : -.40, sy > 0 ? .40 : -.36, .50, .86, K.hull);               // hood side / inner fender panels
        v5Slab(M, [[.48, sy * .40, .84], [1.40, sy * .40, .84], [1.40, sy * .80, .84], [.48, sy * .80, .84]], [0, 0, -.02], K.hull);
        M.box(.40, .50, sy > 0 ? .40 : -.80, sy > 0 ? .80 : -.40, .55, .86, K.hull); }                                    // splash panel behind the front wheel
      // windshield (up), dash, steering wheel (left = +Y), seats, spare wheel and jerrycan on the rear panel
      for (const sy of [-1, 1]) v5Rod(M, [.48, sy * .64, .98], [.40, sy * .64, 1.72], .025, K.dark, 5);
      v5Rod(M, [.40, -.64, 1.72], [.40, .64, 1.72], .025, K.dark, 5); v5Rod(M, [.45, -.64, 1.30], [.45, .64, 1.30], .02, K.dark, 5); v5Rod(M, [.44, 0, .98], [.42, 0, 1.72], .02, K.dark, 5);
      for (const yy of [-.32, .32]) v5Slab(M, [[.46, yy - .29, 1.32], [.46, yy + .29, 1.32], [.41, yy + .29, 1.68], [.41, yy - .29, 1.68]], [-.008, 0, 0], K.glass);
      M.box(.36, .48, -.64, .64, .80, 1.0, K.hull);
      v5Rod(M, [.40, .33, .95], [.12, .33, 1.08], .02, K.black, 5); L('z', [.10, .33, 1.08], [[0, .17], [0, .19], [.02, .19], [.02, .17]], 18, K.black);
      for (const yy of [-.32, .32]) { M.box(-.38, .02, yy - .22, yy + .22, FL, .74, K.seat); M.box(-.44, -.36, yy - .22, yy + .22, .74, 1.06, K.seat); }
      M.box(-1.45, -.95, -.55, .55, FL, .72, K.seat);
      L('x', [-1.62, -.30, .98], [[0, 0], [0, .37, K.tyre], [-.17, .37, K.tyre], [-.17, 0]], 22, K.tyre); L('x', [-1.80, -.30, .98], [[0, 0], [0, .20], [-.01, .18], [-.01, 0]], 14, K.wheel);
      M.box(-1.80, -1.62, .18, .52, .70, 1.12, K.dark);
      // .50 cal M2HB on the M31 pedestal between the front seats, ammunition box
      const GX = -.62, GZ = 1.70; L('z', [GX, 0, FL], [[0, 0], [0, .12], [.08, .07], [1.10, .055], [1.18, .07], [1.22, .07], [1.22, 0]], 12, K.dark);
      M.box(GX - .28, GX + .30, -.07, .07, GZ - .08, GZ + .08, K.gun); M.box(GX - .40, GX - .28, -.08, .08, GZ - .10, GZ + .04, K.dark);
      L('x', [GX + .30, 0, GZ], [[0, 0], [0, .045], [.40, .04], [.40, .028], [1.30, .026], [1.32, .036], [1.40, .036], [1.40, 0]], 10, K.gun);
      M.box(GX - .12, GX + .16, -.26, -.07, GZ - .18, GZ + .02, K.gun);
      // crew: driver (left), passenger, gunner standing behind the gun
      v112Crew(M, 'us_carbine_sitj_light', -.30, .32, FL, 0);
      v112Crew(M, 'us_carbine_ridej_light', -.30, -.32, FL, 0);
      v112Crew(M, 'us_carbine_gunj_light', GX - .78, 0, FL, 0);
      return M;
    }

    // ---------- M29 Weasel — War'tist side (256 px/m: 3.20 × 1.68 m, body top Z1.31) + 4-view line drawing ----------
    function buildM29(paint) {
      const P = PAINT[paint] || PAINT.olive, M = new Mesh(), K = v112Mats(M, P), L = (ax, o, prof, seg, m) => M.lathe(ax, o, prof, seg, m);
      const BW = .84, BT = 1.31, BB = .78, FL = .82;
      // body: open steel tub, sloped rear-lower plate, lower hull between the tracks
      extrudeXZ(M, [[1.56, BT], [1.56, BB], [-1.40, BB], [-1.56, .95], [-1.56, BT]], -BW, -BW + .03, K.hull); extrudeXZ(M, [[1.56, BT], [1.56, BB], [-1.40, BB], [-1.56, .95], [-1.56, BT]], BW - .03, BW, K.hull);
      M.box(1.53, 1.56, -BW, BW, BB, BT, K.hull); M.box(-1.56, -1.53, -BW, BW, .95, BT, K.hull); v5Slab(M, [[-1.40, -BW, BB], [-1.40, BW, BB], [-1.56, BW, .95], [-1.56, -BW, .95]], [0, 0, .03], K.hull);
      M.box(-1.40, 1.53, -BW, BW, FL - .03, FL, K.inner);
      M.box(-1.30, 1.40, -.34, .34, .30, BB, K.hull);
      for (const sy of [-1, 1]) { M.box(-1.50, 1.50, sy > 0 ? BW : -BW - .025, sy > 0 ? BW + .025 : -BW, BT - .03, BT, K.hull); for (let k = 0; k < 12; k++) { const x = 1.40 - k * .25; M.box(x - .012, x + .012, sy * BW - .01, sy * BW + .01, BT - .06, BT - .04, K.dark); } }
      // engine cover (front right), dash, windscreen frame with two panes, seats, steering wheel (driver front left)
      M.box(.50, 1.50, -.80, -.06, FL, 1.42, K.hull); for (let k = 0; k < 5; k++) M.box(.70 + k * .14, .76 + k * .14, -.75, -.11, 1.42, 1.43, K.grille);
      for (const sy of [-1, 1]) v5Rod(M, [1.18, sy * .80, BT], [1.12, sy * .80, 1.80], .022, K.dark, 5);
      v5Rod(M, [1.12, -.80, 1.80], [1.12, .80, 1.80], .022, K.dark, 5); v5Rod(M, [1.16, -.80, 1.55], [1.16, .80, 1.55], .018, K.dark, 5);
      for (const yy of [-.40, .40]) v5Slab(M, [[1.17, yy - .37, 1.33], [1.17, yy + .37, 1.33], [1.13, yy + .37, 1.78], [1.13, yy - .37, 1.78]], [-.008, 0, 0], K.glass);
      v5Rod(M, [1.10, .40, 1.25], [.88, .40, 1.32], .02, K.black, 5); L('z', [.86, .40, 1.32], [[0, .15], [0, .17], [.02, .17], [.02, .15]], 16, K.black);
      M.box(.20, .58, .18, .68, FL, 1.05, K.seat); M.box(.12, .22, .18, .68, 1.05, 1.40, K.seat);
      for (const yy of [-.40, .40]) { M.box(-.75, -.30, yy - .24, yy + .24, FL, 1.05, K.seat); M.box(-.82, -.72, yy - .24, yy + .24, 1.05, 1.40, K.seat); }
      // canvas bow posts, rear rack and cable reel, headlight box, tow pintle, antenna mount
      for (const sy of [-1, 1]) v5Rod(M, [-.05, sy * (BW - .02), BT], [-.05, sy * (BW - .02), 1.84], .018, K.dark, 5);
      for (const sy of [-1, 1]) { v5Rod(M, [-1.52, sy * .60, BT], [-1.52, sy * .60, 1.82], .02, K.dark, 5); v5Rod(M, [-1.52, sy * .60, 1.80], [-1.20, sy * .60, BT + .02], .02, K.dark, 5); }
      L('y', [-1.45, .20, 1.50], [[0, 0], [0, .12], [.40, .12], [.40, 0]], 16, K.dark);
      M.box(1.38, 1.56, -.78, -.56, BT, 1.52, K.dark); L('x', [1.56, -.67, 1.42], [[0, 0], [0, .06], [.01, .055], [.01, 0]], 12, K.glass);
      L('x', [1.56, 0, .95], [[0, 0], [0, .05], [.12, .05], [.12, .08], [.20, .08], [.20, 0]], 12, K.dark);
      // tracks: front sprocket (X 1.37 Z .53), rear idler (X −1.39 Z .37), 8 small road wheels in 4 bogies, wide band track
      for (const sy of [-1, 1]) {
        const yc = sy * .585, f = sy;
        v5Track(M, v112Belt({ c: [1.37, .53], r: .23 }, { c: [-1.39, .37], r: .24 }, 1.02, -1.04, .74), yc - .25, yc + .25, .04, .11, K.trk, K.trkR);
        const RW = [-1.04, -.72, -.43, -.14, .14, .45, .72, 1.02];
        for (const x of RW) L('y', [x, yc, .19], [[-.09 * f, 0], [-.09 * f, .14, K.tyre], [.09 * f, .14, K.tyre], [.09 * f, .10, K.wheel], [.11 * f, .08, K.wheel], [.11 * f, 0, K.wheel]], 14, K.tyre);
        for (let b = 0; b < 4; b++) { const xc = (RW[b * 2] + RW[b * 2 + 1]) / 2; M.box(xc - .08, xc + .08, sy > 0 ? .30 : -.36, sy > 0 ? .36 : -.30, .19, .62, K.dark); v5Rod(M, [RW[b * 2], yc - .10 * f, .19], [RW[b * 2 + 1], yc - .10 * f, .19], .03, K.dark, 5); }
        v112Sprocket(M, 1.37, yc, .53, .22, f, K);
        L('y', [-1.39, yc, .37], [[-.12 * f, 0], [-.12 * f, .24, K.wheel], [.12 * f, .24, K.wheel], [.12 * f, .08, K.dark], [.14 * f, .06, K.dark], [.14 * f, 0]], 18, K.wheel);
        for (let k = 0; k < 6; k++) pnRadial(M, -1.39, .37, k * Math.PI / 3, .07, .21, .04, .03, yc + .10 * f, yc + .13 * f, K.dark);
      }
      // crew: driver + two passengers
      v112Crew(M, 'us_carbine_sitw_light', .40, .43, FL, 0);
      v112Crew(M, 'us_garand_ridew_light', -.55, .40, FL, 0);
      v112Crew(M, 'us_carbine_ridew_light', -.55, -.40, FL, 0);
      return M;
    }

