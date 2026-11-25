  // ══════════════════════════════════════════════════════════════
  // [17%] v146 — Faymonville 3D set dressing from the reference shots (Italian-front village)
  //   · one baked model per house footprint instead of a small house per hex: stone mill, plastered farmhouses / cottage
  //     (terracotta roofs, shutters, flower pots), three-storey town house, open barn on stone pillars, plank shed, boathouse,
  //     the villa (three-storey dark stone block with quoins, hipped roof, banners, paved terrace with balustrades)
  //   · yellow cover lines from the reference map → light-cover edges: low dry-stone walls (village) and stone balustrades (villa)
  //   · decor without rules: cypresses, lamp posts, vine rows, orchard trees, carts, crate / sandbag piles, flower pots
  //   · all baked with the v133 software 3D baker at true scale (1 hex = 7 m) and drawn with the ground, under the units
  // ══════════════════════════════════════════════════════════════
  var V146 = { on: true, cache: new Map(), q: [], busy: false, sig: null, spots: [], fpCells: new Set() };
  EDGE_DEFS.low_wall = { h: 1, cover: 'light', sight: 'none', cross: { inf: 1, veh: 1 }, breaks: true };
  EDGE_DEFS.balustrade = { h: 1, cover: 'light', sight: 'none', cross: { inf: 1, veh: Infinity } };
  EDGE_NAMES.low_wall = '낮은 돌담'; EDGE_NAMES.balustrade = '돌 난간';

  const V146M = (() => {
    const H = V133M.H, { mats, chBox, obox, beam, cylZ, decal, banner, bags, crate, drum, RECT } = H;
    let seed = 7, DIMS = null; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const pal = M => ({
      K: mats(M),
      roof: M.mat([158, 86, 62], { spec: .04, noise: 2.6, dirt: .5 }), roofD: M.mat([128, 68, 50], { spec: .04, noise: 2.4, dirt: .4 }),
      plaster: M.mat([150, 164, 176], { spec: .03, noise: 1.8, dirt: .7 }), white: M.mat([216, 210, 196], { spec: .03, noise: 1.6, dirt: .7 }),
      cream: M.mat([206, 192, 160], { spec: .03, noise: 1.8, dirt: .7 }), stone: M.mat([92, 92, 96], { spec: .03, noise: 2.8, dirt: .4 }),
      stoneW: M.mat([140, 132, 118], { spec: .03, noise: 2.6, dirt: .5 }), stoneL: M.mat([182, 176, 164], { spec: .05, noise: 1.6, dirt: .3 }),
      field: M.mat([128, 122, 110], { spec: .02, noise: 3.2, dirt: .3 }), fieldD: M.mat([104, 100, 92], { spec: .02, noise: 3.2, dirt: .3 }),
      pave: M.mat([152, 152, 148], { spec: .03, noise: 3.4, dirt: .3 }), frame: M.mat([206, 202, 192], { noise: .6 }),
      shutter: M.mat([72, 96, 84], { noise: 1.0 }), door: M.mat([84, 60, 40], { noise: 1.2 }), plank: M.mat([112, 86, 60], { spec: .03, noise: 2.2 }),
      plankD: M.mat([78, 62, 46], { spec: .03, noise: 2.2 }), leaf: M.mat([58, 84, 52], { noise: 3.0, dirt: .2 }), leafD: M.mat([40, 62, 42], { noise: 3.0, dirt: .2 }),
      leafL: M.mat([92, 118, 64], { noise: 3.0, dirt: .2 }), pot: M.mat([170, 98, 64], { spec: .04, noise: 1.2 }), red: M.mat([196, 52, 56], { noise: 1.4 }),
      violet: M.mat([150, 112, 190], { noise: 1.4 }), yellow: M.mat([224, 198, 80], { noise: 1.4 }), hay: M.mat([196, 170, 104], { spec: .02, noise: 2.6 }),
      iron: M.mat([40, 42, 44], { spec: .3, noise: .4 }), lampG: M.mat([236, 214, 150], { spec: .6, noise: 0, dirt: 0 })
    });
    // ---------- parts ----------
    const blob = (M, x, y, z, r, m, seg = 8) => M.lathe('z', [x, y, z], [[0, 0], [0, r * .55], [r * .45, r], [r * 1.05, r * .85], [r * 1.45, r * .35], [r * 1.55, 0]], seg, m);
    function gableRoof(M, x0, x1, y0, y1, z, rise, ov, roof, wall) {
      const ym = (y0 + y1) / 2, t = .22, a = [x0 - ov, y0 - ov, z - ov * rise / ((y1 - y0) / 2)], b = [x1 + ov, y0 - ov, a[2]], cR = [x1 + ov, ym, z + rise], dR = [x0 - ov, ym, z + rise];
      const e = [x0 - ov, y1 + ov, a[2]], f = [x1 + ov, y1 + ov, a[2]], up = p => [p[0], p[1], p[2] + t];
      M.hex8([a, b, cR, dR, up(a), up(b), up(cR), up(dR)], roof); M.hex8([dR, cR, f, e, up(dR), up(cR), up(f), up(e)], roof);
      M.box(x0 - ov - .05, x1 + ov + .05, ym - .1, ym + .1, z + rise + t - .06, z + rise + t + .1, roof);                       // ridge tiles
      [[x0, -1], [x1, 1]].forEach(([x, s]) => M.tri([x, y0, z], [x, y1, z], [x, ym, z + rise], [s, 0, 0], [s, 0, 0], [s, 0, 0], wall));   // gable walls
    }
    const hipRoof = (M, x0, x1, y0, y1, z, rise, ov, roof) => {
      const W2 = (y1 - y0) / 2 + ov; chBox(M, x0 - ov, x1 + ov, y0 - ov, y1 + ov, z, z + rise, [W2 * .9, W2 * .9, W2 - .04, W2 - .04], roof);
      M.box(x0 - ov, x1 + ov, y0 - ov, y1 + ov, z - .14, z + .02, roof);   // eaves board
    };
    // windows / door on a wall face: face = 'S' (−y), 'N' (+y), 'E' (+x), 'W' (−x)
    function openings(M, p, o) {
      const L2 = o.L / 2, W2 = o.W / 2, fh = o.fh || 3.1, z0 = o.base || .3;
      const face = (f, a, z, hw, hh, m, lift) => {
        const c = f === 'S' ? [a, -W2, z] : f === 'N' ? [a, W2, z] : f === 'E' ? [L2, a, z] : [-L2, a, z], out = f === 'S' ? [0, -1, 0] : f === 'N' ? [0, 1, 0] : f === 'E' ? [1, 0, 0] : [-1, 0, 0];
        decal(M, c, out, [0, 0, 1], RECT, hw, hh, m, lift);
      };
      const win = (f, a, z) => {
        face(f, a, z, .5, .78, p.frame, .03); face(f, a, z, .38, .64, p.K.glass, .05);
        if (o.shutters) [-1, 1].forEach(s => face(f, a + s * .82, z, .3, .7, p.shutter, .04));
        if (o.sill) face(f, a, z - .78, .58, .08, p.stoneL, .06);
      };
      for (let fl = 0; fl < o.floors; fl++) {
        const z = z0 + fl * fh + fh * .56;
        ['S', 'N'].forEach(f => { for (let a = -L2 + o.edge; a <= L2 - o.edge + 1e-6; a += o.step) if (!(fl === 0 && f === o.doorFace && Math.abs(a - (o.doorAt || 0)) < o.step * .5)) win(f, a, z); });
        if (o.L > 6) ['E', 'W'].forEach(f => { const n = o.W > 8 ? 2 : 1; for (let k = 0; k < n; k++) win(f, n === 1 ? 0 : (k ? 1 : -1) * W2 * .45, z); });
      }
      if (o.doorFace) { face(o.doorFace, o.doorAt || 0, z0 + 1.15, .62, 1.15, p.frame, .03); face(o.doorFace, o.doorAt || 0, z0 + 1.1, .52, 1.08, p.door, .05); }
    }
    function quoins(M, L2, W2, z1, m) {
      for (let z = .3, k = 0; z < z1 - .2; z += .55, k++) [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => {
        const lx = k % 2 ? .75 : .45, ly = k % 2 ? .45 : .75;
        M.box(sx > 0 ? L2 - lx : -L2 - .06, sx > 0 ? L2 + .06 : -L2 + lx, sy > 0 ? W2 - ly : -W2 - .06, sy > 0 ? W2 + .06 : -W2 + ly, z, z + .5, m);
      });
    }
    const pots = (M, p, list) => list.forEach(([x, y, fl]) => {
      cylZ(M, x, y, 0, .42, .24, p.pot, 10); blob(M, x, y, .38, .3, p.leaf, 7);
      if (fl) for (let k = 0; k < 3; k++) blob(M, x + (rnd() - .5) * .3, y + (rnd() - .5) * .3, .62, .1, fl === 1 ? p.red : p.violet, 5);
    });
    const barrel = (M, p, x, y) => { M.lathe('z', [x, y, 0], [[0, 0], [0, .27], [.45, .33], [.9, .27], [.9, 0]], 10, p.plank); cylZ(M, x, y, .2, .25, .3, p.iron, 10); cylZ(M, x, y, .66, .71, .3, p.iron, 10); };
    // ---------- houses ----------
    function plasterHouse(M, p, o) {
      const L2 = o.L / 2, W2 = o.W / 2; DIMS = { L: o.L, W: o.W, eave: o.eave, rise: o.rise, wall: o.wall };
      M.box(-L2 - .08, L2 + .08, -W2 - .08, W2 + .08, 0, .32, p.stoneW);
      M.box(-L2, L2, -W2, W2, .3, o.eave, o.wall);
      gableRoof(M, -L2, L2, -W2, W2, o.eave, o.rise, .45, p.roof, o.wall);
      openings(M, p, { L: o.L, W: o.W, floors: o.floors || 1, step: 2.6, edge: 1.4, shutters: true, doorFace: 'S', doorAt: o.doorAt || -L2 * .25, fh: (o.eave - .3) / (o.floors || 1) });
      if (o.chim) M.box(L2 * .55 - .4, L2 * .55 + .4, W2 * .25 - .4, W2 * .25 + .4, o.eave + o.rise * .3, o.eave + o.rise + .9, p.stoneW);
      pots(M, p, [[(o.doorAt || -L2 * .25) - 1.1, -W2 - .45, 1], [(o.doorAt || -L2 * .25) + 1.1, -W2 - .45, 2], [L2 - .6, -W2 - .5, 2]]);
      barrel(M, p, -L2 - .6, -W2 + .6); barrel(M, p, -L2 - .65, -W2 + 1.35);
      for (let k = 0; k < 4; k++) blob(M, -L2 + 1 + rnd() * (o.L - 2), W2 + .5, 0, .5 + rnd() * .3, rnd() < .5 ? p.leaf : p.leafL, 7);   // shrubs at the back
    }
    function townHouse(M, p) {   // v148: one storey (was three); same three-hex footprint, HP 420 kept
      const L = 11, W = 8, L2 = L / 2, W2 = W / 2, eave = 3.6; DIMS = { L, W, eave, rise: 2.6, wall: p.stoneW };
      M.box(-L2 - .1, L2 + .1, -W2 - .1, W2 + .1, 0, .45, p.stoneL);
      M.box(-L2, L2, -W2, W2, .4, eave, p.stoneW);
      M.box(-L2 - .12, L2 + .12, -W2 - .12, W2 + .12, eave - .3, eave, p.stoneL);                                             // cornice
      quoins(M, L2, W2, eave - .3, p.stoneL);
      hipRoof(M, -L2, L2, -W2, W2, eave, 2.6, .5, p.roof);
      openings(M, p, { L, W, floors: 1, step: 2.4, edge: 1.5, shutters: true, sill: true, doorFace: 'S', doorAt: 0, fh: 3.0, base: .4 });
      [-1, 1].forEach(s => M.box(s * L2 * .55 - .4, s * L2 * .55 + .4, -.4, .4, eave + 1.0, eave + 3.0, p.stoneW));           // chimneys
      M.box(-1.7, 1.7, -W2 - 1.2, -W2, 2.75, 2.9, p.roofD); [-1.55, 1.55].forEach(x => beam(M, [x, -W2 - 1.1, 0], [x, -W2 - 1.1, 2.75], .07, p.plankD));   // porch canopy
      pots(M, p, [[-2.4, -W2 - .45, 1], [2.4, -W2 - .45, 2], [L2 - .6, -W2 - .5, 1]]);
    }
    function mill(M, p) {
      const L = 11, W = 7.5, L2 = L / 2, W2 = W / 2, eave = 6.2; DIMS = { L, W, eave, rise: 3, wall: p.stone };
      M.box(-L2 - .15, L2 + .15, -W2 - .15, W2 + .15, 0, .5, p.fieldD);
      M.box(-L2, L2, -W2, W2, .45, eave, p.stone);
      quoins(M, L2, W2, eave, p.field);
      gableRoof(M, -L2, L2, -W2, W2, eave, 3.0, .4, p.roof, p.stone);
      openings(M, p, { L, W, floors: 2, step: 3.0, edge: 1.8, sill: true, doorFace: 'S', doorAt: -1.5, fh: 2.8, base: .45 });
      decal(M, [2.2, -W2, 1.6], [0, -1, 0], [0, 0, 1], RECT, 1.0, 1.4, p.plankD, .05);                                       // loading doors
      // lean-to on the east end
      M.box(L2, L2 + 3.6, -W2 + .6, W2 - .6, 0, 3.0, p.stone);
      M.hex8([[L2, -W2 + .2, 4.0], [L2 + 4.0, -W2 + .2, 2.9], [L2 + 4.0, W2 - .2, 2.9], [L2, W2 - .2, 4.0], [L2, -W2 + .2, 4.2], [L2 + 4.0, -W2 + .2, 3.1], [L2 + 4.0, W2 - .2, 3.1], [L2, W2 - .2, 4.2]], p.roofD);
      M.box(-L2 * .5 - .45, -L2 * .5 + .45, -.45, .45, eave + 1.2, eave + 4.0, p.stone);
      for (let k = 0; k < 5; k++) blob(M, -L2 + rnd() * L, W2 + .6, 0, .55 + rnd() * .4, rnd() < .5 ? p.leaf : p.leafD, 7);
    }
    function barn(M, p) {
      const L = 12, W = 6.6, L2 = L / 2, W2 = W / 2, eave = 3.6; DIMS = { L, W, eave, rise: 2.2, wall: p.stoneW, open: true };
      M.box(-L2, L2, -W2, W2, 0, .12, p.fieldD);
      for (let x = -L2 + .3; x <= L2 - .3 + 1e-6; x += (L - .6) / 3) [-W2 + .3, W2 - .3].forEach(y => M.box(x - .3, x + .3, y - .3, y + .3, 0, eave, p.stoneW));
      [-W2 + .3, W2 - .3].forEach(y => M.box(-L2, L2, y - .25, y + .25, eave - .35, eave, p.plankD));
      gableRoof(M, -L2, L2, -W2, W2, eave, 2.2, .5, p.roof, p.plank);
      for (let k = 0; k < 6; k++) { const x = -L2 + 1.2 + (k % 3) * 1.4, y = -1.2 + Math.floor(k / 3) * 1.4; obox(M, x, y, 0, 0, .6, .55, .8, .06, p.hay); }
      obox(M, -L2 + 1.9, .2, .8, 0, .6, .55, .8, .06, p.hay);
      cart(M, p, 2.6, .2, .3);
    }
    function shed(M, p, L = 4.6, W = 3.4) {
      const L2 = L / 2, W2 = W / 2; DIMS = { L, W, eave: 2.5, rise: 1.4, wall: p.plank };
      M.box(-L2, L2, -W2, W2, 0, 2.5, p.plank);
      for (let x = -L2; x <= L2; x += .45) M.box(x - .03, x + .03, -W2 - .03, -W2, 0, 2.5, p.plankD);
      gableRoof(M, -L2, L2, -W2, W2, 2.5, 1.4, .3, p.plankD, p.plank);
      decal(M, [.6, -W2, 1.0], [0, -1, 0], [0, 0, 1], RECT, .5, 1.0, p.door, .05);
    }
    function boathouse(M, p) { shed(M, p, 6, 4.2); M.box(-3, 3, -2.1, 2.1, 0, .1, p.plankD); }
    let VILLA_RUIN = false;
    function villaTerrace(M, p, L2, W2) {
      // paved terrace with balustrades on three sides, steps in the middle of the front (−y)
      const tx = L2 + 4.2, ty0 = -W2 - 5.5, ty1 = W2 + 2.2;
      M.box(-tx, tx, ty0, ty1, 0, .3, p.pave);
      const KZ = (typeof V157 !== 'undefined' && V157.on && typeof v150Fay === 'function' && v150Fay()) ? 1.6 : 1;   // v157: railing as tall as the edge walls
      const balus = (x0, y0, x1, y1, gap) => { const len = Math.hypot(x1 - x0, y1 - y0), n = Math.round(len / .36);
        for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; if (gap && Math.abs(x) < gap) continue;
          M.lathe('z', [x, y, .3], [[0, 0], [0, .07], [.12, .09], [.3, .05], [.48, .1], [.62, .05], [.68, .07], [.68, 0]].map(q => [q[0] * KZ, q[1] * (KZ > 1 ? 1.25 : 1)]), 6, p.stoneL); }
        const seg = (a, b) => { M.box(Math.min(a[0], b[0]) - .14, Math.max(a[0], b[0]) + .14, Math.min(a[1], b[1]) - .14, Math.max(a[1], b[1]) + .14, .3 + .68 * KZ, .3 + .8 * KZ, p.stoneL); };
        if (gap) { seg([x0, y0], [-gap, y1]); seg([gap, y0], [x1, y1]); } else seg([x0, y0], [x1, y1]); };
      balus(-tx + .2, ty0 + .2, tx - .2, ty0 + .2, 1.6); balus(-tx + .2, ty0 + .2, -tx + .2, ty1 - .2); balus(tx - .2, ty0 + .2, tx - .2, ty1 - .2);
      for (let k = 0; k < 3; k++) M.box(-1.6, 1.6, ty0 - .45 * (k + 1), ty0 - .45 * k, 0, .3 - k * .1, p.pave);                 // steps
      [[-tx + .2, ty0 + .2], [tx - .2, ty0 + .2], [-1.75, ty0 + .2], [1.75, ty0 + .2]].forEach(([x, y]) => M.box(x - .22, x + .22, y - .22, y + .22, .3, .3 + 1.05 * KZ, p.stoneL));
      [[-tx - 1.2, ty0 + 2], [-tx - 1.2, 0], [-tx - 1.2, ty1 - 1], [tx + 1.2, ty0 + 2], [tx + 1.2, 0], [tx + 1.2, ty1 - 1]].forEach(([x, y]) => cypress(M, p, x, y, 6.5 + rnd() * 1.5));
      [[-2.6, ty0 + .9], [2.6, ty0 + .9], [-tx + .9, ty1 - 1.0], [tx - .9, ty1 - 1.0]].forEach(([x, y]) => lamp(M, p, x, y, .3));
    }
    function villa(M, p) {
      const L = 19, W = 11.5, L2 = L / 2, W2 = W / 2, eave = 10.6, K = p.K;
      villaTerrace(M, p, L2, W2); DIMS = { L, W, eave, rise: 3.6, wall: p.stone };
      if (VILLA_RUIN) return;
      // the house
      M.box(-L2 - .12, L2 + .12, -W2 - .12, W2 + .12, .3, .9, p.fieldD);
      M.box(-L2, L2, -W2, W2, .85, eave, p.stone);
      [4.0, 7.3].forEach(z => M.box(-L2 - .08, L2 + .08, -W2 - .08, W2 + .08, z, z + .2, p.stoneL));
      M.box(-L2 - .18, L2 + .18, -W2 - .18, W2 + .18, eave - .4, eave, p.stoneL);
      quoins(M, L2, W2, eave - .4, p.stoneL);
      hipRoof(M, -L2, L2, -W2, W2, eave, 3.6, .55, p.roof);
      openings(M, p, { L, W, floors: 3, step: 2.35, edge: 1.4, sill: true, doorFace: 'S', doorAt: 0, fh: 3.25, base: .85 });
      [-1, 1].forEach(s => M.box(s * L2 * .6 - .45, s * L2 * .6 + .45, -.45, .45, eave + 1.8, eave + 4.4, p.stone));
      // potted shrubs along the facade and the terrace, lamp posts at the steps
      pots(M, p, [[-7.5, -W2 - .7, 2], [-3.2, -W2 - .7, 1], [3.2, -W2 - .7, 2], [7.5, -W2 - .7, 1]]);
    }
    // ---------- props ----------
    function cypress(M, p, x = 0, y = 0, h = 7) {
      if (typeof V156 !== 'undefined' && V156.noCone && typeof v150Fay === 'function' && v150Fay()) return;   // v156: no cone trees outside forests
      cylZ(M, x, y, 0, .7, .12, p.plankD, 6);
      M.lathe('z', [x, y, .4], [[0, 0], [0, .3], [.5, .52], [h * .28, .72], [h * .55, .62], [h * .8, .36], [h * .95, .1], [h, 0]], 10, rnd() < .5 ? p.leafD : p.leaf);
    }
    function roundTree(M, p, x = 0, y = 0, s = 1) {
      cylZ(M, x, y, 0, 1.5 * s, .14 * s, p.plankD, 6);
      blob(M, x, y, 1.0 * s, 1.7 * s, rnd() < .5 ? p.leaf : p.leafL, 9); blob(M, x + .6 * s, y - .4 * s, 1.6 * s, 1.1 * s, p.leaf, 8);
    }
    function lamp(M, p, x = 0, y = 0, z = 0) {
      cylZ(M, x, y, z, z + .45, .14, p.iron, 8); cylZ(M, x, y, z + .45, z + 3.2, .05, p.iron, 6);
      M.box(x - .17, x + .17, y - .17, y + .17, z + 3.2, z + 3.6, p.lampG); M.box(x - .22, x + .22, y - .22, y + .22, z + 3.6, z + 3.72, p.iron);
    }
    function cart(M, p, x = 0, y = 0, yaw = 0) {
      const c = Math.cos(yaw), s = Math.sin(yaw), q = (a, b) => [x + a * c - b * s, y + a * s + b * c];
      obox(M, ...q(0, 0), .6, yaw, 1.15, .65, .22, .02, p.plank);
      [-1, 1].forEach(sd => { obox(M, ...q(0, sd * .62), .82, yaw, 1.15, .04, .3, 0, p.plankD); const w = q(-.1, sd * .78); M.lathe('y', [w[0], w[1] - .05, .55], [[0, 0], [0, .55], [.1, .55], [.1, 0]], 12, p.plankD); });
      [-1, 1].forEach(sd => { const a = q(1.1, sd * .4), b = q(2.6, sd * .3); beam(M, [a[0], a[1], .7], [b[0], b[1], .45], .08, p.plankD); });
      obox(M, ...q(-.3, 0), .82, yaw + .1, .5, .4, .45, .04, p.hay); crate(M, ...q(.5, .1), .82, yaw - .2, .3, .3, .4, p.K);
    }
    function pile(M, p) {
      const K = p.K; crate(M, 0, 0, 0, .1, .45, .45, .7, K); crate(M, .95, .1, 0, -.15, .45, .4, .6, K); crate(M, .4, .1, .7, .3, .4, .35, .55, K);
      drum(M, -.9, .5, K, false); drum(M, -.85, -.25, K, true);
      bags(M, [[-1.4, -1.0], [1.4, -1.0]], 2, K.bag); obox(M, 1.6, .9, 0, .4, .6, .55, .8, .06, p.hay);
    }
    function vineyard(M, p, rows = 5, len = 18, gap = 2.6) {
      for (let r = 0; r < rows; r++) { const y = (r - (rows - 1) / 2) * gap;
        for (let x = -len / 2; x <= len / 2 + 1e-6; x += 2.2) cylZ(M, x, y, 0, 1.45, .05, p.plankD, 5);
        for (let x = -len / 2; x < len / 2 - .2; x += 1.1) obox(M, x + .55, y + (rnd() - .5) * .08, .45 + rnd() * .1, (rnd() - .5) * .1, .58, .2 + rnd() * .06, .8 + rnd() * .25, .08, rnd() < .4 ? p.leafL : p.leaf); }
    }
    function orchard(M, p) { for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) roundTree(M, p, (i - 1) * 4.2 + (j ? 2 : 0), (j - .5) * 4.2, .75 + rnd() * .2); }
    // ---------- edge pieces (one hex side ≈ 4.04 m along X) ----------
    function lowWall(M, p, v, st = 0) {
      const L2 = 2.1;
      if (st >= 2) { for (let k = 0; k < 9; k++) obox(M, -L2 + rnd() * 4.2, (rnd() - .5) * 1.1, 0, rnd() * 3, .14 + rnd() * .16, .12 + rnd() * .12, .12 + rnd() * .14, .04, rnd() < .5 ? p.field : p.fieldD); return; }
      for (let crs = 0; crs < 2; crs++) for (let x = -L2 + (crs ? .3 : 0); x < L2; ) { const l = .45 + rnd() * .35, h = crs ? .3 + rnd() * .22 : .42 + rnd() * .08;
        if (st === 1 && (crs || Math.abs(x + l / 2 - .2) < .7)) { x += l + .03; if (rnd() < .5) obox(M, x - l / 2, (rnd() < .5 ? -1 : 1) * (.35 + rnd() * .3), 0, rnd() * 3, .16, .14, .16, .04, p.fieldD); continue; }
        obox(M, Math.min(L2 - l / 2, x + l / 2), (rnd() - .5) * .08, crs * .45, (rnd() - .5) * .14, l / 2, crs ? .24 : .3, h, .06, rnd() < .5 ? p.field : p.fieldD); x += l + .03; }
      const n = v % 3; for (let k = 0; k < n + 1; k++) blob(M, -1.5 + rnd() * 3, (rnd() < .5 ? -1 : 1) * .35, 0, .45 + rnd() * .3, rnd() < .5 ? p.leaf : p.leafL, 7);
    }
    function balustrade(M, p, st = 0) {
      const L2 = 2.05; M.box(-L2, L2, -.24, .24, 0, .2, p.stoneL);
      if (st >= 2) { for (let k = 0; k < 7; k++) obox(M, -L2 + rnd() * 4.1, (rnd() - .5) * 1.0, 0, rnd() * 3, .1 + rnd() * .2, .08 + rnd() * .1, .08 + rnd() * .1, .03, p.stoneL); return; }
      if (st === 1) { for (let x = -L2 + .2; x <= -.3; x += .34) M.lathe('z', [x, 0, .2], [[0, 0], [0, .07], [.12, .09], [.3, .05], [.48, .1], [.62, .05], [.68, .07], [.68, 0]], 6, p.stoneL);
        M.box(-L2, -.25, -.16, .16, .88, 1.0, p.stoneL); for (let k = 0; k < 5; k++) obox(M, .2 + rnd() * 1.6, (rnd() - .5) * .9, 0, rnd() * 3, .1 + rnd() * .15, .08, .1, .03, p.stoneL); return; }
      for (let x = -L2 + .2; x <= L2 - .19; x += .34) M.lathe('z', [x, 0, .2], [[0, 0], [0, .07], [.12, .09], [.3, .05], [.48, .1], [.62, .05], [.68, .07], [.68, 0]], 6, p.stoneL);
      M.box(-L2, L2, -.16, .16, .88, 1.0, p.stoneL); M.box(L2 - .22, L2 + .02, -.22, .22, 0, 1.12, p.stoneL);
    }
    // ---------- damage stages ----------
    const BREACH = Array.from({ length: 11 }, (_, k) => { const a = k / 11 * 6.283, r = .65 + ((k * 37) % 7) / 14; return [Math.cos(a) * r, Math.sin(a) * r]; });
    function damaged(M, p, D) {   // stage 1: part of the roof caved in, a breach in the front wall, rubble outside
      const L2 = D.L / 2, W2 = D.W / 2, roofs = new Set([p.roof, p.roofD, p.plankD]), C = [L2 * .35, -W2 * .15, D.eave + D.rise * .45], R = Math.max(D.L, D.W) * .36;
      const P = M.P, N = M.N, MM = M.M, P2 = [], N2 = [], M2 = [];
      for (let t = 0; t < MM.length; t++) { const i = t * 9, cx = (P[i] + P[i + 3] + P[i + 6]) / 3, cy = (P[i + 1] + P[i + 4] + P[i + 7]) / 3, cz = (P[i + 2] + P[i + 5] + P[i + 8]) / 3;
        if (roofs.has(MM[t]) && cz > D.eave - .3 && Math.hypot(cx - C[0], cy - C[1], (cz - C[2]) * .6) < R) continue;
        for (let k = 0; k < 9; k++) { P2.push(P[i + k]); N2.push(N[i + k]); } M2.push(MM[t]); }
      M.P = P2; M.N = N2; M.M = M2;
      if (!D.open) M.box(-L2 + .2, L2 - .2, -W2 + .2, W2 - .2, .35, D.eave - .05, p.K.dark);                                  // dark interior through the hole
      decal(M, [L2 * .45, -W2, Math.min(1.7, D.eave * .4)], [0, -1, 0], [0, 0, 1], BREACH, 1.0, Math.min(1.3, D.eave * .3), p.K.dark, .07);
      for (let k = 0; k < 3; k++) beam(M, [C[0] - 1.5 + k * 1.2, -W2 * .2, D.eave + .2], [C[0] - 1 + k * 1.3 + rnd(), W2 * .3, D.eave + D.rise * (.5 + rnd() * .3)], .14, p.plankD);   // broken rafters
      for (let k = 0; k < 10; k++) obox(M, L2 * .45 + (rnd() - .5) * 2.6, -W2 - .4 - rnd() * 1.2, 0, rnd() * 3, .15 + rnd() * .25, .12 + rnd() * .2, .1 + rnd() * .3, .04, rnd() < .6 ? D.wall : p.roofD);
    }
    function ruin(M, p, D, open) {   // stage 2: no roof, jagged wall stumps, rubble heaps, charred beams
      const L2 = D.L / 2, W2 = D.W / 2, top = Math.min(D.eave * .55, 4.2), t = .45, gap = rnd() * 4 | 0;
      M.box(-L2 - .1, L2 + .1, -W2 - .1, W2 + .1, 0, .3, p.fieldD);
      const side = (x0, y0, x1, y1, k) => { const len = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.round(len / .9));
        for (let i = 0; i < n; i++) { const u = (i + .5) / n, h = (k === gap ? .15 : .3) + top * Math.max(0, Math.sin(u * 3.1 + k) * .45 + .45 + (rnd() - .5) * .5); if (h < .2) continue;
          const x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u, hor = Math.abs(y1 - y0) < 1e-6; M.box(x - (hor ? len / n / 2 : t / 2), x + (hor ? len / n / 2 : t / 2), y - (hor ? t / 2 : len / n / 2), y + (hor ? t / 2 : len / n / 2), .3, .3 + h, D.wall); } };
      if (open) { for (let x = -L2 + .3; x <= L2 - .3 + 1e-6; x += (D.L - .6) / 3) [-W2 + .3, W2 - .3].forEach(y => M.box(x - .3, x + .3, y - .3, y + .3, 0, .4 + rnd() * 2.4, D.wall)); }
      else { side(-L2, -W2, L2, -W2, 0); side(L2, -W2, L2, W2, 1); side(L2, W2, -L2, W2, 2); side(-L2, W2, -L2, -W2, 3); }
      for (let k = 0; k < Math.round(D.L * D.W / 4); k++) obox(M, (rnd() - .5) * (D.L + 1.5), (rnd() - .5) * (D.W + 1.5), .2, rnd() * 3, .2 + rnd() * .35, .15 + rnd() * .3, .15 + rnd() * .45, .05, rnd() < .55 ? D.wall : rnd() < .6 ? p.roofD : p.fieldD);
      for (let k = 0; k < 4; k++) beam(M, [(rnd() - .5) * D.L * .8, (rnd() - .5) * D.W * .7, .3], [(rnd() - .5) * D.L * .8, (rnd() - .5) * D.W * .7, .6 + rnd() * 1.6], .16, p.K.dark);
    }
    const make = (kind, v, st = 0) => { seed = 7 + (v || 0) * 977 + st * 31; DIMS = null; VILLA_RUIN = st >= 2 && kind === 'villa'; const M = new TankBaker.Mesh(), p = pal(M);
      ({ mill: () => mill(M, p), farm: () => plasterHouse(M, p, { L: 12.5, W: 6.6, eave: 3.9, rise: 2.4, wall: v % 2 ? p.cream : p.plaster, chim: true }),
         farm2: () => plasterHouse(M, p, { L: 12, W: 7, eave: 6.4, rise: 2.6, floors: 2, wall: p.white, chim: true, doorAt: 1.5 }),
         cottage: () => plasterHouse(M, p, { L: 9, W: 6, eave: 3.3, rise: 2.2, wall: p.plaster, chim: true, doorAt: .8 }),
         town: () => townHouse(M, p), barn: () => barn(M, p), shed: () => shed(M, p), boathouse: () => boathouse(M, p), villa: () => villa(M, p),
         cypress: () => cypress(M, p, 0, 0, 6 + (v % 3)), cypress2: () => { cypress(M, p, -1, 0, 7); cypress(M, p, 1.1, .3, 6.2); }, tree: () => roundTree(M, p),
         lamp: () => lamp(M, p), cart: () => cart(M, p), pile: () => pile(M, p), vineyard: () => vineyard(M, p), orchard: () => orchard(M, p),
         pots: () => pots(M, p, [[0, 0, 1], [.7, .2, 2], [-.6, .3, 1]]),
         low_wall: () => lowWall(M, p, v, st), balustrade: () => balustrade(M, p, st) })[kind]();
      if (DIMS && kind !== 'low_wall' && kind !== 'balustrade') {
        if (st >= 2) { if (kind !== 'villa') { M.P = []; M.N = []; M.M = []; } ruin(M, p, DIMS, DIMS.open); }
        else if (st === 1) damaged(M, p, DIMS);
      }
      return M; };
    return { make };
  })();

  // ---------- placement ----------
  const v146W = () => Math.sqrt(3) * HEX_RADIUS;
  const v146Flat = (x, y) => [ORIGIN_X + (FS.c0 + (x - 120) * FS.kx) * v146W(), ORIGIN_Y + (FS.r0 + (y - 15) * FS.ky) * 1.5 * HEX_RADIUS];   // reference px → flat
  const v146CellFlat = (c, r) => [ORIGIN_X + c * v146W() + (r % 2) * v146W() / 2, ORIGIN_Y + r * 1.5 * HEX_RADIUS];
  const v146RefCell = (x, y) => { const r = Math.round(FS.r0 + (y - 15) * FS.ky); return [Math.round(FS.c0 + (x - 120) * FS.kx - (r % 2) * .5), r]; };
  const v146Z = (c, r) => { const t = terrainMap[c + ',' + r]; return !t ? 0 : t.vh !== undefined ? t.vh : (t.elevation | 0); };
  // reference labels → model; yaw in degrees (0 = ridge east–west)
  const V146_HOUSES = { 'stone mill house by the bridge': ['mill', 0], 'farmhouse': ['farm', 0], 'three-storey town house': ['town', 0], 'shed': ['shed', 30],
    'cottage': ['cottage', 0], 'open barn': ['barn', 0], 'villa': ['villa', 0], 'boathouse': ['boathouse', 15] };
  // yellow cover lines of the reference map (reference px) → light-cover edges
  const V146_LINES = [
    ['low_wall', [[493, 186], [596, 206]]], ['low_wall', [[602, 132], [602, 200]]],                                  // Mill Bridge: south and east of the mill
    ['low_wall', [[414, 362], [516, 338]]], ['low_wall', [[408, 392], [402, 452]]], ['low_wall', [[424, 498], [484, 532]]], ['low_wall', [[540, 354], [566, 440]]],   // ring round the town house
    ['low_wall', [[642, 540], [624, 608]]],                                                                              // east of the main road
    ['low_wall', [[414, 767], [426, 802]]], ['low_wall', [[460, 779], [472, 818]]], ['balustrade', [[384, 830], [454, 826]]], ['balustrade', [[372, 802], [377, 856]]]   // villa approaches
  ];
  // decor (reference px): kind, x, y, yaw°
  const V146_PROPS = [
    ['pile', 575, 142, 20], ['cart', 528, 152, 70], ['cypress2', 518, 108, 0],
    ['cart', 452, 302, 30], ['pots', 488, 300, 0], ['cypress', 455, 268, 0],
    ['lamp', 520, 446, 0], ['lamp', 484, 452, 0], ['pile', 532, 432, -15], ['cart', 532, 492, 100], ['cypress2', 470, 400, 0],
    ['pile', 790, 334, 10], ['tree', 748, 300, 0], ['tree', 796, 298, 0],
    ['cypress2', 405, 478, 0], ['cypress', 590, 558, 0],
    ['cypress', 258, 666, 0], ['cypress', 294, 668, 0], ['cart', 286, 702, 60],
    ['pile', 538, 712, 0], ['cypress2', 500, 684, 0], ['pots', 506, 712, 0],
    ['vineyard', 548, 766, 0], ['orchard', 486, 610, 0], ['cypress2', 564, 820, 0],
    ['pile', 398, 916, 30], ['cart', 470, 912, -40], ['shed', 238, 790, 20]
  ];
  // light-cover edges along a reference polyline: every edge whose two cells sit on opposite sides of the segment, next to it
  function v146LineEdges__base(kind, pts) {
    let n = 0; const w = v146W(), F = pts.map(([x, y]) => v146Flat(x, y));
    for (let i = 0; i + 1 < F.length; i++) {
      const [ax, ay] = F[i], [bx, by] = F[i + 1], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy); if (!L) continue;
      const side = (x, y) => (dx * (y - ay) - dy * (x - ax)) / L;
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) for (let e = 0; e < 3; e++) {
        const nb = getNeighborByEdge(c, r, e); if (!nb) continue;
        const t0 = terrainMap[c + ',' + r], t1 = terrainMap[nb.c + ',' + nb.r]; if (!t0 || !t1 || t0.oob || t1.oob || t0.terrainType === 'deep_water' || t1.terrainType === 'deep_water') continue;
        const A = v146CellFlat(c, r), B = v146CellFlat(nb.c, nb.r); if (side(A[0], A[1]) * side(B[0], B[1]) >= 0) continue;
        const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, t = ((mx - ax) * dx + (my - ay) * dy) / (L * L);
        if (t < -.05 || t > 1.05 || Math.abs(side(mx, my)) > w * .6) continue;
        if (!getEdge(c, r, nb.c, nb.r)) { setEdge(c, r, nb.c, nb.r, kind); n++; }
      }
    }
    return n;
  }
  { 
    /* loadFaymonville: layer moved to js/chains/loadFaymonville.js */ }
  { 
    /* loadHistoricalMap: layer moved to js/chains/loadHistoricalMap.js */ }
  // footprint hexes no longer get the small per-hex v99 house
  { 
    /* v99Uprights: layer moved to js/chains/v99Uprights.js */ }
  // ---------- baking (queued, a few per frame) and drawing ----------
  function v146Sprite(key, kind, v, ang, st = 0) {
    TANK_SPR.ensureView(); if (V146.sig !== TANK_SPR.sig) { V146.sig = TANK_SPR.sig; V146.cache.clear(); }
    const fi = TANK_SPR.idx(ang), ck = key + '|' + fi, e = V146.cache.get(ck); if (e) return e.none ? null : e;
    V146.cache.set(ck, { none: true });
    V146.q.push(() => { let res = null; try { res = v134Bake(V146M.make(kind, v, st), fi); } catch (err) { console.warn('v146 bake', kind, err); } V146.cache.set(ck, res || { none: true }); });
    if (!V146.busy) { V146.busy = true; const step = () => { const f = V146.q.shift(); if (f) f(); if (V146.q.length) setTimeout(step, 4); else { V146.busy = false; if (typeof mapReady !== 'undefined' && mapReady) render(); } }; setTimeout(step, 10); }
    return null;
  }
  function v146EdgeSpots__base() {
    if (V146.ekey === EDGE_VER && V146.eS) return V146.eS;
    const out = [], w = v146W();
    EDGES.forEach((ed, k) => { if (ed.kind !== 'low_wall' && ed.kind !== 'balustrade') return;
      const [a, b] = k.split('>').map(s => s.split(',').map(Number)), A = v146CellFlat(a[0], a[1]), B = v146CellFlat(b[0], b[1]);
      const ang = Math.atan2(B[1] - A[1], B[0] - A[0]) + Math.PI / 2;
      out.push({ kind: ed.kind, st: ed.st || 0, v: (a[0] * 7 + a[1] * 13) % 3, fx: (A[0] + B[0]) / 2, fy: (A[1] + B[1]) / 2, ang, z: Math.max(v146Z(a[0], a[1]), v146Z(b[0], b[1])) }); });
    V146.ekey = EDGE_VER; return (V146.eS = out);
  }
  { 
    /* v99Ground: layer moved to js/chains/v99Ground.js */ }


