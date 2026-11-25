  // ══════════════════════════════════════════════════════════════
  // [17v] v133 — faction tier buildings as baked 3D models
  //   · Wehrmacht: poured-concrete blockhouses with battered walls, sandbag parapets, camouflage nets, steel gates,
  //     red banners and Balkenkreuz markings (HQ · infantry coy · Panzergrenadier coy · Luftwaffe coy · armour coy)
  //   · U.S. Army: canvas tents (ridge, hip and Quonset), sandbag walls, a steel-frame tank shed with ramps,
  //     an A-frame hoist and a watchtower, white stars (HQ · barracks · weapon support · motor pool · tank depot)
  //   · models are in metres (X front, Y left, Z up), baked once per team · type · facing with the unit baker,
  //     drawn at V133.S px/m so a building stays inside its hex; facing = 0° or 60° (front toward the camera),
  //     whichever is nearer the enemy HQ; bakes run one per idle tick, the old 2.5D art stands in meanwhile
  // ══════════════════════════════════════════════════════════════
  var V133 = { S: 3.5, B: 4, cache: new Map(), meshes: new Map(), sig: '', q: [], pend: new Set(), busy: false };
  const V133M = (() => {
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const cr = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const nrm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
    let seed = 1; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

    // ---------- decal shapes (star-shaped about the origin; fan-triangulated) ----------
    const STAR = Array.from({ length: 10 }, (_, k) => { const a = Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? .382 : 1; return [Math.cos(a) * r, Math.sin(a) * r]; });
    const PLUS = h => [[h, 1], [h, h], [1, h], [1, -h], [h, -h], [h, -1], [-h, -1], [-h, -h], [-1, -h], [-1, h], [-h, h], [-h, 1]];
    const DISC = Array.from({ length: 22 }, (_, k) => [Math.cos(k * Math.PI * 2 / 22), Math.sin(k * Math.PI * 2 / 22)]);
    const RECT = [[1, 1], [-1, 1], [-1, -1], [1, -1]];

    // ---------- primitives ----------
    function mats(M) {
      return {
        con: M.mat([150, 148, 140], { spec: .04, noise: 1.7, dirt: .8 }), conD: M.mat([118, 117, 111], { spec: .03, noise: 1.7 }), conL: M.mat([164, 162, 154], { spec: .04, noise: 1.5, dirt: .5 }),
        steel: M.mat([66, 68, 70], { spec: .25, noise: .6 }), dark: M.mat([26, 27, 29], { noise: .3, dirt: 0 }), wood: M.mat([118, 90, 62], { spec: .03, noise: 1.5 }),
        woodD: M.mat([92, 70, 50], { spec: .03, noise: 1.5 }), bag: M.mat([166, 152, 116], { spec: .02, noise: 2.0 }), red: M.mat([172, 34, 28], { spec: .05, noise: .5, dirt: .2 }),
        white: M.mat([228, 228, 220], { spec: .05, noise: .3, dirt: .1 }), black: M.mat([22, 24, 26], { noise: 0, dirt: 0 }), rust: M.mat([112, 70, 46], { spec: .12, noise: 1.6 }),
        tyre: M.mat([33, 34, 36], { noise: .6, dirt: .3 }), canvas: M.mat([106, 110, 76], { spec: .03, noise: 1.3 }), canvasD: M.mat([86, 90, 62], { spec: .03, noise: 1.3 }),
        canvasL: M.mat([138, 134, 98], { spec: .03, noise: 1.2 }), net1: M.mat([84, 92, 60], { noise: 2.2 }), net2: M.mat([108, 96, 66], { noise: 2.2 }), net3: M.mat([70, 74, 52], { noise: 2.2 }),
        drumG: M.mat([74, 84, 64], { spec: .15, noise: .8 }), drumR: M.mat([124, 46, 38], { spec: .15, noise: .8 }), pipe: M.mat([150, 44, 34], { spec: .2, noise: .5 }),
        olive: M.mat([88, 92, 64], { spec: .12, noise: .9 }), glass: M.mat([44, 52, 58], { spec: .7, noise: 0, dirt: 0 })
      };
    }
    // battered block: bottom rectangle, top inset per side k = [back (x0), front (x1), right (y0), left (y1)]
    function chBox(M, x0, x1, y0, y1, z0, z1, k, m) {
      M.hex8([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0 + k[0], y0 + k[2], z1], [x1 - k[1], y0 + k[2], z1], [x1 - k[1], y1 - k[3], z1], [x0 + k[0], y1 - k[3], z1]], m);
    }
    // oriented box: centre (cx, cy), base z0, yaw, half sizes, top bevel
    function obox(M, cx, cy, z0, yaw, L, W, H, ins, m) {
      const c = Math.cos(yaw), s = Math.sin(yaw), q = (a, b, z) => [cx + a * c - b * s, cy + a * s + b * c, z];
      M.hex8([q(-L, -W, z0), q(L, -W, z0), q(L, W, z0), q(-L, W, z0), q(-L + ins, -W + ins, z0 + H), q(L - ins, -W + ins, z0 + H), q(L - ins, W - ins, z0 + H), q(-L + ins, W - ins, z0 + H)], m);
    }
    // square-section beam between two points
    function beam(M, a, b, w, m) {
      const d = nrm(sub(b, a)), ref = Math.abs(d[2]) < .9 ? [0, 0, 1] : [1, 0, 0], u = nrm(cr(d, ref)), v = cr(d, u), h = w / 2, P = [];
      [a, b].forEach(p => [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([s, t]) => P.push([p[0] + (u[0] * s + v[0] * t) * h, p[1] + (u[1] * s + v[1] * t) * h, p[2] + (u[2] * s + v[2] * t) * h])));
      M.hex8(P, m);
    }
    const cylZ = (M, x, y, z0, z1, r, m, seg = 14) => M.lathe('z', [x, y, z0], [[0, 0], [0, r], [z1 - z0, r], [z1 - z0, 0]], seg, m);
    const cylX = (M, x0, x1, y, z, r, m, seg = 14) => M.lathe('x', [x0, y, z], [[0, 0], [0, r], [x1 - x0, r], [x1 - x0, 0]], seg, m);
    const cylY = (M, x, y0, y1, z, r, m, seg = 14) => M.lathe('y', [x, y0, z], [[0, 0], [0, r], [y1 - y0, r], [y1 - y0, 0]], seg, m);
    // convex (y, z) profile extruded along X; edges closer than ~37° share smooth normals (arched roofs)
    function extX(M, prof, x0, x1, m, capM) {
      const n = prof.length; let cy = 0, cz = 0; prof.forEach(p => { cy += p[0] / n; cz += p[1] / n; });
      const fn = prof.map((a, i) => { const b = prof[(i + 1) % n]; let ny = b[1] - a[1], nz = -(b[0] - a[0]); const l = Math.hypot(ny, nz) || 1; ny /= l; nz /= l; if (ny * ((a[0] + b[0]) / 2 - cy) + nz * ((a[1] + b[1]) / 2 - cz) < 0) { ny = -ny; nz = -nz; } return [ny, nz]; });
      const vn = (i, e) => { const f0 = fn[(i - 1 + n) % n], f1 = fn[i]; if (f0[0] * f1[0] + f0[1] * f1[1] > .8) { const y = f0[0] + f1[0], z = f0[1] + f1[1], l = Math.hypot(y, z); return [0, y / l, z / l]; } return [0, fn[e][0], fn[e][1]]; };
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n, a = prof[i], b = prof[j], na = vn(i, i), nb = vn(j, i);
        M.tri([x0, a[0], a[1]], [x1, a[0], a[1]], [x1, b[0], b[1]], na, na, nb, m); M.tri([x0, a[0], a[1]], [x1, b[0], b[1]], [x0, b[0], b[1]], na, nb, nb, m);
        M.tri([x1, cy, cz], [x1, a[0], a[1]], [x1, b[0], b[1]], [1, 0, 0], [1, 0, 0], [1, 0, 0], capM === undefined ? m : capM);
        M.tri([x0, cy, cz], [x0, a[0], a[1]], [x0, b[0], b[1]], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], capM === undefined ? m : capM);
      }
    }
    // flat decal: centre c, outward normal, world "up" hint, half sizes (Rr across, Ru up)
    function decal(M, c, out, up, sh, Rr, Ru, m, lift = .035) {
      const n = nrm(out), d = dot(up, n); let u = [up[0] - n[0] * d, up[1] - n[1] * d, up[2] - n[2] * d]; if (Math.hypot(...u) < 1e-3) u = [1, 0, 0]; u = nrm(u);
      const r = cr(u, n), P = ([a, b]) => [c[0] + r[0] * a * Rr + u[0] * b * Ru + n[0] * lift, c[1] + r[1] * a * Rr + u[1] * b * Ru + n[1] * lift, c[2] + r[2] * a * Rr + u[2] * b * Ru + n[2] * lift];
      const o = P([0, 0]); for (let k = 0; k < sh.length; k++) M.tri(o, P(sh[k]), P(sh[(k + 1) % sh.length]), n, n, n, m);
    }
    // Balkenkreuz: black straight-armed cross with white edges along the arms (ends left open)
    function balken(M, c, out, up, R, K, lift = .035) { decal(M, c, out, up, PLUS(.402), R, R, K.white, lift); decal(M, c, out, up, PLUS(.212), R, R, K.black, lift + .02); }
    // v134: U.S. mark — white star inside a broken ring, gaps at the star points
    const RING = (() => { const out = [], r0 = 1.11, r1 = 1.33, g = 7 * Math.PI / 180; for (let k = 0; k < 5; k++) { const a0 = Math.PI / 2 + k * 2 * Math.PI / 5 + g, a1 = Math.PI / 2 + (k + 1) * 2 * Math.PI / 5 - g;
      for (let t = 0; t < 3; t++) { const b0 = a0 + (a1 - a0) * t / 3, b1 = a0 + (a1 - a0) * (t + 1) / 3; out.push([[Math.cos(b0) * r0, Math.sin(b0) * r0], [Math.cos(b0) * r1, Math.sin(b0) * r1], [Math.cos(b1) * r1, Math.sin(b1) * r1], [Math.cos(b1) * r0, Math.sin(b1) * r0]]); } } return out; })();
    function qdecal(M, c, out, up, q, Rr, Ru, m, lift = .035) {   // convex polygon off the centre: fan from its first corner
      const n = nrm(out), d = dot(up, n); let u = [up[0] - n[0] * d, up[1] - n[1] * d, up[2] - n[2] * d]; if (Math.hypot(...u) < 1e-3) u = [1, 0, 0]; u = nrm(u);
      const r = cr(u, n), P = q.map(([a, b]) => [c[0] + r[0] * a * Rr + u[0] * b * Ru + n[0] * lift, c[1] + r[1] * a * Rr + u[1] * b * Ru + n[1] * lift, c[2] + r[2] * a * Rr + u[2] * b * Ru + n[2] * lift]);
      for (let k = 1; k + 1 < P.length; k++) M.tri(P[0], P[k], P[k + 1], n, n, n, m);
    }
    const star = (M, c, out, up, R, K, lift = .035) => { const k = .76; decal(M, c, out, up, STAR, R * k, R * k, K.white, lift); RING.forEach(q => qdecal(M, c, out, up, q, R * k, R * k, K.white, lift)); };
    // red banner (hangs from the top edge): white disc + Balkenkreuz
    function banner(M, c, out, w, h, K, lift = .05) {
      decal(M, c, out, [0, 0, 1], RECT, w / 2, h / 2, K.red, lift);
      const cc = [c[0], c[1], c[2] + h * .08]; decal(M, cc, out, [0, 0, 1], DISC, w * .36, w * .36, K.white, lift + .015); balken(M, cc, out, [0, 0, 1], w * .27, K, lift + .03);
    }
    // point on a battered wall: (along, z) on the face between the bottom edge e0 (z0) and the top edge (inset ins at z1)
    const onFront = (x1, z0, z1, ins, y, z) => [[x1 - ins * (z - z0) / (z1 - z0), y, z], [z1 - z0, 0, ins]];
    const onSide = (y1, z0, z1, ins, x, z, sd) => [[x, sd * (Math.abs(y1) - ins * (z - z0) / (z1 - z0)), z], [0, sd * (z1 - z0), ins]];
    // sandbag rows along a polyline
    function bags(M, pts, rows, m, z0 = 0, closed = false) {
      const P = closed ? pts.concat([pts[0]]) : pts;
      for (let r = 0; r < rows; r++) for (let i = 0; i + 1 < P.length; i++) {
        const a = P[i], b = P[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), ang = Math.atan2(b[1] - a[1], b[0] - a[0]), n = Math.max(1, Math.round(len / .62));
        for (let k = 0; k < n; k++) { const t = (k + .5 + (r % 2 ? .5 : 0)) / n; if (t > 1) continue; obox(M, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, z0 + r * .21, ang + (rnd() - .5) * .12, .31, .18, .24, .07, m); }
      }
    }
    const crate = (M, x, y, z, yaw, L, W, H, K) => { obox(M, x, y, z, yaw, L, W, H, .02, K.wood); obox(M, x, y, z + H * .45, yaw, L + .02, W + .02, H * .1, 0, K.woodD); };
    const drum = (M, x, y, K, red, z = 0) => { cylZ(M, x, y, z, z + .88, .29, red ? K.drumR : K.drumG, 12); cylZ(M, x, y, z + .3, z + .34, .3, K.steel, 12); cylZ(M, x, y, z + .58, z + .62, .3, K.steel, 12); };
    const tyre = (M, x, y, z, K) => M.lathe('z', [x, y, z], [[0, .2], [0, .44], [.05, .47], [.22, .47], [.27, .44], [.27, .2], [0, .2]], 14, K.tyre);
    // draped camouflage net: z(u, v) sags between the corner poles
    function net(M, x0, x1, y0, y1, z, sag, K, poles = true) {
      const nx = 7, ny = 6, h = (i, j) => z - sag * Math.sin(Math.PI * i / nx) * Math.sin(Math.PI * j / ny) + (rnd() - .5) * .18, Z = [];
      for (let i = 0; i <= nx; i++) { Z.push([]); for (let j = 0; j <= ny; j++) Z[i].push(h(i, j)); }
      const X = i => x0 + (x1 - x0) * i / nx, Y = j => y0 + (y1 - y0) * j / ny, ms = [K.net1, K.net2, K.net3];
      for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
        const a = [X(i), Y(j), Z[i][j]], b = [X(i + 1), Y(j), Z[i + 1][j]], c = [X(i + 1), Y(j + 1), Z[i + 1][j + 1]], d = [X(i), Y(j + 1), Z[i][j + 1]], m = ms[(rnd() * 3) | 0];
        let nn = nrm(cr(sub(b, a), sub(d, a))); if (nn[2] < 0) nn = [-nn[0], -nn[1], -nn[2]];
        M.tri(a, b, c, nn, nn, nn, m); M.tri(a, c, d, nn, nn, nn, m);
      }
      if (poles) [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].forEach(([x, y]) => cylZ(M, x, y, z - 4, z + .05, .07, K.woodD, 6));
    }
    // ridge tent along X (gable or hip ends) with a white star on both long slopes
    function tent(M, cx, cy, L, W, wh, rh, K, o = {}) {
      const hip = o.hip || 0, ov = .18;
      chBox(M, cx - L / 2, cx + L / 2, cy - W / 2, cy + W / 2, 0, wh, [.03, .03, .1, .1], o.wall === undefined ? K.canvasD : o.wall);
      chBox(M, cx - L / 2 - ov, cx + L / 2 + ov, cy - W / 2 - ov, cy + W / 2 + ov, wh, wh + rh, [hip, hip, W / 2 + ov - .03, W / 2 + ov - .03], o.roof === undefined ? K.canvas : o.roof);
      if (o.star) [-1, 1].forEach(sd => { const hw = W / 2 + ov; star(M, [cx + (o.sx || 0), cy + sd * hw * .5, wh + rh * .5], [0, sd * rh, hw], [1, 0, 0], o.star, K); });
      if (o.door) decal(M, [cx + L / 2 + .02, cy, wh * .55 + .05], [1, 0, 0], [0, 0, 1], RECT, Math.min(.7, W * .2), wh * .55, K.dark, .02);
    }
    // lattice watchtower (legs splay out), cabin with a pyramid roof
    function tower(M, x, y, H, K) {
      const b = 1.05, t = .72;
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([s, u]) => beam(M, [x + s * b, y + u * b, 0], [x + s * t, y + u * t, H], .16, K.woodD));
      for (let lv = 1; lv <= 3; lv++) { const z = H * lv / 4, e = b + (t - b) * lv / 4;
        [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]].forEach(([s0, u0, s1, u1]) => beam(M, [x + s0 * e, y + u0 * e, z], [x + s1 * e, y + u1 * e, z], .1, K.woodD)); }
      [[-1, -1, 1, 1], [1, -1, -1, 1]].forEach(([s0, u0, s1, u1]) => beam(M, [x + s0 * b * .96, y + u0 * b * .96, .3], [x + s1 * t * 1.02, y + u1 * t * 1.02, H * .74], .08, K.woodD));
      M.box(x - 1.0, x + 1.0, y - 1.0, y + 1.0, H, H + .16, K.wood);
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([s, u]) => beam(M, [x + s * .92, y + u * .92, H + .16], [x + s * .92, y + u * .92, H + 1.9], .1, K.woodD));
      chBox(M, x - 1.0, x + 1.0, y - 1.0, y + 1.0, H + .16, H + .95, [.02, .02, .02, .02], K.olive);
      chBox(M, x - 1.25, x + 1.25, y - 1.25, y + 1.25, H + 1.9, H + 2.6, [1.2, 1.2, 1.2, 1.2], K.steel);
      cylZ(M, x + .5, y - .5, H + 2.4, H + 4.2, .04, K.steel, 5);
    }

    // ================= Wehrmacht =================
    const DE = {
      hq(M, K) {
        M.box(-5.4, 5.0, -4.5, 4.5, 0, .25, K.conD);
        chBox(M, -5, 3.4, -4, 4, .25, 4.2, [.5, .9, .6, .6], K.con);
        M.lathe('z', [2.1, -2.75, .25], [[0, 0], [0, 1.85], [3.5, 1.85], [3.9, 1.45], [3.9, 0]], 18, K.con);              // round bastion, front right
        [-.65, -.2, .25].forEach(a => obox(M, 2.1 + 1.88 * Math.cos(a), -2.75 + 1.88 * Math.sin(a), 2.5, a, .07, .34, .22, 0, K.dark));   // embrasures
        chBox(M, -4.2, 1.2, -2.6, 3.0, 4.2, 6.2, [.25, .35, .25, .25], K.conL);                                                   // upper block
        M.box(-3.1, -2.0, .8, 1.9, 6.15, 6.45, K.steel); M.box(-1.0, -.2, -2.1, -1.4, 6.15, 6.6, K.conD);                           // hatch · vent
        // doorway with concrete pilasters and lintel
        const [dc, dn] = onFront(3.4, .25, 4.2, .9, 1.2, 1.6); decal(M, dc, dn, [0, 0, 1], RECT, 1.05, 1.35, K.dark, .03);
        decal(M, [dc[0] + .02, dc[1] + .5, dc[2] - .1], dn, [0, 0, 1], RECT, .45, 1.15, K.steel, .06);
        M.box(2.95, 3.8, 2.25, 2.7, .25, 3.15, K.conL); M.box(2.95, 3.8, -.3, .15, .25, 3.15, K.conL); M.box(2.85, 3.85, -.35, 2.75, 2.95, 3.4, K.conL);
        for (let k = 0; k < 3; k++) M.box(3.8 + k * .38, 4.2 + k * .38, -.2, 2.6, 0, .25 - k * .08 + .02, K.conD);
        // red banner on the upper block, Balkenkreuz on both flanks
        { const [c, n] = onFront(1.2, 4.2, 6.2, .35, .3, 5.15); banner(M, c, n, 1.3, 1.75, K); }
        [-1, 1].forEach(sd => { const [c, n] = onSide(4, .25, 4.2, .6, -2.3, 2.3, sd); balken(M, c, n, [0, 0, 1], 1.15, K); });
        bags(M, [[2.4, -.9], [2.4, 3.3], [-.4, 3.3]], 2, K.bag, 4.2);
        bags(M, [[4.6, -.6], [4.6, -2.0], [4.0, -2.6]], 3, K.bag, .25);
        // mast with yards, dish, kit
        cylZ(M, -3.4, -2.0, 6.2, 12.0, .07, K.steel, 6); beam(M, [-3.4, -2.75, 10.6], [-3.4, -1.25, 10.6], .06, K.steel); beam(M, [-3.4, -2.5, 9.4], [-3.4, -1.5, 9.4], .06, K.steel);
        cylZ(M, -1.7, 2.2, 6.2, 6.9, .08, K.steel, 6); M.lathe('x', [-1.85, 2.2, 7.1], [[0, 0], [0, .06], [.22, .62], [.27, .66], [.3, .66], [.08, 0]], 16, K.conL);
        crate(M, 4.3, -3.9, .25, .3, .55, .4, .55, K); crate(M, 4.6, -3.2, .25, -.2, .45, .35, .5, K); drum(M, -5.0, -3.9, K, true, .25); drum(M, -4.4, -4.1, K, false, .25);
        return { flag: [.6, 2.65, 6.2, 3.6] };
      },
      barracks(M, K) {
        M.box(-4.0, 3.6, -3.6, 3.6, 0, .2, K.conD);
        chBox(M, -3.6, 2.8, -3.2, 3.2, .2, 3.1, [.35, .55, .4, .4], K.con);
        bags(M, [[2.15, -2.7], [2.15, 2.7], [-3.15, 2.7], [-3.15, -2.7]], 2, K.bag, 3.1, true);
        net(M, -3.7, -.2, -3.4, 3.4, 4.25, .55, K);
        cylZ(M, 1.0, -1.2, 3.1, 3.85, .8, K.conL, 16); obox(M, 1.82, -1.2, 3.45, 0, .05, .45, .14, 0, K.dark);           // observation cupola
        const [dc, dn] = onFront(2.8, .2, 3.1, .55, .7, 1.25); decal(M, dc, dn, [0, 0, 1], RECT, .85, 1.05, K.dark, .03);
        M.box(2.5, 3.2, 1.6, 1.95, .2, 2.55, K.conL); M.box(2.5, 3.2, -.55, -.2, .2, 2.55, K.conL); M.box(2.45, 3.25, -.6, 2.0, 2.35, 2.75, K.conL);
        for (let k = 0; k < 2; k++) M.box(3.2 + k * .4, 3.6 + k * .4, -.3, 1.7, 0, .2 - k * .08 + .02, K.conD);
        chBox(M, -1.8, 1.2, -4.7, -3.2, .2, 1.8, [.15, .15, .35, .0], K.conD);                                                      // lean-to store
        { const [c, n] = onSide(3.2, .2, 3.1, .4, -1.2, 1.7, 1); balken(M, c, n, [0, 0, 1], 1.0, K); }
        { const [c, n] = onSide(3.2, .2, 3.1, .4, -.3, 2.45, -1); balken(M, c, n, [0, 0, 1], .52, K); }
        { const [c, n] = onFront(2.8, .2, 3.1, .55, -1.9, 1.9); banner(M, c, n, .95, 1.35, K); }
        crate(M, 3.5, -2.6, 0, .4, .5, .38, .5, K); crate(M, 3.1, -3.4, 0, -.3, .45, .32, .45, K); crate(M, 3.4, -2.55, .5, .2, .38, .3, .38, K);
        return { flag: [1.9, 2.45, 3.1, 3.4] };
      },
      motor_pool(M, K) {   // Panzergrenadier coy: gate, fuel tank, tyres
        M.box(-4.3, 3.6, -3.4, 3.8, 0, .2, K.conD);
        chBox(M, -4, 3.0, -3.0, 3.4, .2, 3.6, [.4, .42, .5, .5], K.con);
        chBox(M, -3.6, .6, -2.5, 1.4, 3.6, 4.45, [.12, .12, .12, .12], K.conL);
        [[-3.5, -2.4], [.5, -2.4], [.5, 1.3], [-3.5, 1.3]].forEach(([x, y]) => beam(M, [x, y, 4.45], [x, y, 5.3], .08, K.steel));
        beam(M, [-3.5, -2.4, 5.3], [.5, -2.4, 5.3], .08, K.steel); beam(M, [.5, -2.4, 5.3], [.5, 1.3, 5.3], .08, K.steel); beam(M, [-3.5, 1.3, 5.3], [.5, 1.3, 5.3], .08, K.steel);
        // steel cage gate
        const z0 = .2, z1 = 3.6, ins = .42, gy = .2, gw = 1.55;
        { const [c, n] = onFront(3.0, z0, z1, ins, gy, 1.55); decal(M, c, n, [0, 0, 1], RECT, gw, 1.35, K.dark, .03); }
        for (let y = gy - gw + .15; y <= gy + gw - .1; y += .32) beam(M, [3.05, y, z0], [3.05 - ins * 2.75 / 3.4, y, 2.95], .07, K.steel);
        [.75, 1.6, 2.45].forEach(z => beam(M, [3.05 - ins * (z - z0) / 3.4 + .02, gy - gw, z], [3.05 - ins * (z - z0) / 3.4 + .02, gy + gw, z], .07, K.steel));
        M.box(2.55, 3.25, gy + gw, gy + gw + .45, .2, 3.25, K.conL); M.box(2.55, 3.25, gy - gw - .45, gy - gw, .2, 3.25, K.conL);
        // fuel tank on cradles, tyre stacks, jerry cans
        cylX(M, -2.4, .4, -4.0, 1.05, .8, K.rust, 18); M.box(-2.0, -1.7, -4.6, -3.4, 0, .5, K.woodD); M.box(-.3, 0, -4.6, -3.4, 0, .5, K.woodD); cylZ(M, -1.0, -4.0, 1.8, 2.05, .16, K.steel, 8);
        for (let k = 0; k < 4; k++) tyre(M, 2.7, -3.7, k * .27, K); for (let k = 0; k < 2; k++) tyre(M, 3.6, -2.7, k * .27, K); tyre(M, 3.85, -3.55, 0, K);
        crate(M, 3.6, 3.0, 0, .3, .5, .4, .55, K); drum(M, -4.4, 3.2, K, true); drum(M, -4.6, 2.5, K, false);
        [-1, 1].forEach(sd => { const [c, n] = onSide(sd > 0 ? 3.4 : 3.0, .2, 3.6, .5, -1.7, 2.0, sd); balken(M, c, n, [0, 0, 1], .95, K); });
        { const [c, n] = onFront(.6, 3.6, 4.45, .12, -.55, 4.02); balken(M, c, n, [0, 0, 1], .36, K); }
        return { flag: [-3.25, .95, 4.45, 3.2] };
      },
      air_coy(M, K) {      // Luftwaffe coy: rounded wing, camouflage net, crane
        M.box(-4.0, 3.2, -3.6, 3.9, 0, .2, K.conD);
        chBox(M, -3.4, 2.6, -1.0, 3.4, .2, 3.4, [.3, .45, .0, .4], K.con);
        extX(M, [[-1, .2], [-3.1, .2], [-3.3, .9], [-3.2, 1.75], [-2.8, 2.45], [-2.1, 3.0], [-1.25, 3.3], [-1, 3.32]], -3.2, 2.3, K.con);
        net(M, -3.8, 1.4, -3.4, 3.8, 4.3, .5, K);
        const [dc, dn] = onFront(2.6, .2, 3.4, .45, 1.4, 1.2); decal(M, dc, dn, [0, 0, 1], RECT, .8, 1.0, K.dark, .03);
        M.box(2.3, 3.0, 2.35, 2.7, .2, 2.5, K.conL); M.box(2.3, 3.0, .1, .45, .2, 2.5, K.conL);
        // crane: mast, jib, cable, hanging crate
        cylZ(M, 2.2, -2.7, .2, 4.8, .14, K.steel, 8); beam(M, [2.2, -2.7, 4.55], [4.3, -1.35, 3.85], .14, K.steel); beam(M, [2.2, -2.7, 2.6], [3.25, -2.02, 4.2], .08, K.steel);
        beam(M, [4.3, -1.35, 3.85], [4.3, -1.35, 2.05], .03, K.black); crate(M, 4.3, -1.35, 1.35, .2, .45, .35, .65, K);
        crate(M, 3.3, 1.7, 0, .1, .55, .45, .6, K); crate(M, 3.25, 1.75, .6, .3, .42, .36, .5, K); crate(M, 3.6, 2.7, 0, -.4, .4, .35, .45, K);
        for (let k = 0; k < 3; k++) tyre(M, -3.9, -3.0, k * .27, K); drum(M, 3.2, -3.3, K, false); drum(M, 3.8, -2.9, K, true);
        { const [c, n] = onSide(3.4, .2, 3.4, .4, -1.0, 1.9, 1); balken(M, c, n, [0, 0, 1], 1.0, K); }
        { const [c, n] = onFront(2.6, .2, 3.4, .45, -.2, 2.2); banner(M, c, n, .85, 1.3, K); }
        balken(M, [-1.0, -3.22, 1.75], [0, -1, .2], [0, 0, 1], .62, K, .07);
        return { flag: [2.0, 3.0, 3.4, 3.2] };
      },
      tank_depot(M, K) {   // armour coy: loaf-section hall, big gate, red pipes, roof plant
        M.box(-5.2, 4.6, -4.6, 4.6, 0, .2, K.conD);
        extX(M, [[-4.2, .2], [4.2, .2], [4.2, 3.4], [3.8, 4.4], [2.8, 5.0], [-2.8, 5.0], [-3.8, 4.4], [-4.2, 3.4]], -4.8, 3.6, K.con);
        M.box(3.6, 4.35, -3.75, -2.65, .2, 4.75, K.conL); M.box(3.6, 4.35, 2.65, 3.75, .2, 4.75, K.conL); M.box(3.6, 4.35, -3.75, 3.75, 3.75, 4.75, K.conL);
        decal(M, [3.6, 0, 1.95], [1, 0, 0], [0, 0, 1], RECT, 2.65, 1.78, K.dark, .02);
        M.box(3.62, 3.82, .9, 2.62, .2, 3.72, K.steel); for (let y = 1.1; y < 2.6; y += .42) M.box(3.82, 3.88, y, y + .08, .3, 3.6, K.dark);
        beam(M, [4.4, -3.75, 3.6], [4.4, 3.75, 3.6], .1, K.steel);
        balken(M, [4.35, 0, 4.25], [1, 0, 0], [0, 0, 1], .42, K, .02);
        [-1, 1].forEach(sd => {
          cylX(M, -4.6, 3.3, sd * 4.32, 1.15, .12, K.pipe, 8); cylZ(M, -4.0, sd * 4.32, 1.15, 3.6, .12, K.pipe, 8); cylZ(M, 2.4, sd * 4.32, .2, 1.15, .1, K.pipe, 8);
          balken(M, [-1.1, sd * 4.2, 2.35], [0, sd, 0], [0, 0, 1], 1.15, K);
        });
        M.box(-3.4, -.6, -1.6, 1.6, 5.0, 5.95, K.conL); for (let k = 0; k < 3; k++) M.box(-3.1 + k * .9, -2.5 + k * .9, -1.62, -1.55, 5.2, 5.75, K.dark);
        cylZ(M, .6, 1.2, 5.0, 6.3, .3, K.steel, 10); cylZ(M, .6, 1.2, 6.3, 6.45, .38, K.steel, 10);
        M.box(-5.6, -4.8, -3.0, -1.6, 0, 1.4, K.olive); drum(M, -5.3, 1.8, K, true); drum(M, -5.6, 2.5, K, false); crate(M, 4.9, -4.0, 0, .2, .45, .35, .5, K);
        return { flag: [-3.7, 2.4, 5.0, 3.3] };
      },
      outpost(M, K) {
        M.lathe('z', [0, 0, 0], [[0, 0], [0, 2.1], [1.7, 2.1], [2.05, 1.6], [2.05, 0]], 8, K.con);
        [-.4, .4, 1.2].forEach(a => obox(M, 2.0 * Math.cos(a), 2.0 * Math.sin(a), 1.15, a, .1, .38, .2, 0, K.dark));
        bags(M, [[2.6, -2.0], [3.0, -.4], [3.0, 1.2], [2.4, 2.6]], 2, K.bag);
        balken(M, [-1.2, -1.7, 1.0], [-.5, -1, 0], [0, 0, 1], .55, K);
        return { flag: [-1.6, 1.6, 0, 4.4] };
      },
      doc_inf(M, K) {
        chBox(M, -2.6, 2.0, -2.2, 2.2, 0, 2.4, [.3, .4, .3, .3], K.con);
        const [dc, dn] = onFront(2.0, 0, 2.4, .4, .5, 1.0); decal(M, dc, dn, [0, 0, 1], RECT, .65, .95, K.dark, .03);
        bags(M, [[3.0, -2.4], [3.0, -.4]], 3, K.bag); bags(M, [[1.6, 2.2], [-1.0, 2.2]], 2, K.bag, 2.4);
        [-1, 1].forEach(sd => { const [c, n] = onSide(2.2, 0, 2.4, .3, -.6, 1.3, sd); balken(M, c, n, [0, 0, 1], .72, K); });
        crate(M, 2.9, 1.9, 0, .3, .45, .35, .5, K);
        return { flag: [-2.2, 2.3, 0, 5.2] };
      },
      doc_mech(M, K) {
        chBox(M, -3, 2.2, -2.4, 2.4, 0, 2.8, [.3, .4, .35, .35], K.con);
        const [dc, dn] = onFront(2.2, 0, 2.8, .4, 0, 1.15); decal(M, dc, dn, [0, 0, 1], RECT, 1.45, 1.15, K.dark, .03);
        for (let y = -1.3; y <= 1.3; y += .35) beam(M, [2.25, y, 0], [2.25 - .4 * 2.3 / 2.8, y, 2.3], .06, K.steel);
        [-1, 1].forEach(sd => { const [c, n] = onSide(2.4, 0, 2.8, .35, -.8, 1.5, sd); balken(M, c, n, [0, 0, 1], .78, K); });
        drum(M, 2.8, -2.4, K, true); drum(M, 3.3, -1.9, K, false); for (let k = 0; k < 3; k++) tyre(M, -3.4, -2.6, k * .27, K);
        return { flag: [-2.6, 2.6, 0, 5.2] };
      },
      doc_air(M, K) {
        chBox(M, -2.6, 2.0, -2.2, 2.2, 0, 2.5, [.3, .4, .3, .3], K.conD);
        net(M, -3.2, 2.6, -2.8, 2.8, 3.3, .45, K);
        cylZ(M, -2.3, -2.1, 0, 7.5, .06, K.steel, 6); beam(M, [-2.3, -2.7, 6.8], [-2.3, -1.5, 6.8], .05, K.steel);
        crate(M, 2.9, -1.6, 0, .2, .5, .4, .55, K); crate(M, 3.0, -.6, 0, -.2, .45, .35, .5, K);
        { const [c, n] = onSide(2.2, 0, 2.5, .3, -.4, 1.3, 1); balken(M, c, n, [0, 0, 1], .72, K); }
        return { flag: [2.2, 2.4, 0, 5.2] };
      }
    };
    DE.support_center = DE.barracks;

    // ================= U.S. Army =================
    const US = {
      hq(M, K) {
        // command tent (hip roof), porch, sandbag walls, side tent, watchtower
        tent(M, -.4, .3, 6.8, 6.4, 1.7, 3.5, K, { hip: 2.3, star: 1.05 });
        star(M, [-.4 + 3.4 + .18 - 2.3 * .5, .3, 1.7 + 3.5 * .5], [3.5, 0, 2.3], [0, 0, 1], .72, K);
        decal(M, [3.02, .3, 1.0], [1, 0, 0], [0, 0, 1], RECT, .75, .95, K.dark, .02);
        [[.9], [-.3]].forEach(([y]) => M.box(4.1, 4.3, y + .3 - .1, y + .3 + .1, 0, 2.4, K.wood)); M.box(3.0, 4.35, -.65 + .3, 1.15 + .3, 2.35, 2.5, K.canvasL);
        M.box(4.0, 4.4, -.8 + .3, 1.2 + .3, 0, .18, K.woodD);
        bags(M, [[-3.5, -3.6], [4.2, -3.6], [5.0, -2.8], [5.0, -1.0]], 3, K.bag);
        bags(M, [[5.0, 1.6], [5.0, 3.3], [3.8, 4.2]], 3, K.bag);
        tent(M, -4.6, -2.0, 2.4, 3.0, .9, 1.4, K, { door: true });
        tower(M, -4.4, 3.6, 6.2, K);
        crate(M, 3.6, -2.7, 0, .2, .5, .38, .5, K); crate(M, 3.0, -2.9, 0, -.3, .42, .34, .45, K);
        return { flag: [4.3, 2.6, 0, 7.0] };
      },
      barracks(M, K) {
        tent(M, .4, 1.7, 6.2, 3.4, 1.2, 2.0, K, { star: .7, door: true });
        tent(M, -.6, -2.1, 5.2, 3.0, 1.1, 1.8, K, { star: .62, door: true, roof: K.canvasL, wall: K.canvas });
        bags(M, [[4.3, -3.8], [4.3, -.4]], 2, K.bag); bags(M, [[4.3, .6], [4.3, 3.4]], 2, K.bag);
        crate(M, -3.6, -.1, 0, .1, .5, .4, .55, K); crate(M, -3.0, -.25, 0, -.2, .42, .34, .45, K); drum(M, 3.5, -.1, K, false);
        beam(M, [-3.4, 3.6, 1.6], [3.0, 3.8, 1.6], .03, K.black);   // washing line
        return { flag: [3.5, 3.9, 0, 6.0] };
      },
      support_center(M, K) {   // Quonset canvas hut
        const arc = Array.from({ length: 13 }, (_, k) => { const a = Math.PI * k / 12; return [-Math.cos(a) * 2.55, Math.sin(a) * 2.55 + .05]; });
        extX(M, arc, -3.6, 3.0, K.canvas, K.canvasD);
        decal(M, [3.0, 0, .95], [1, 0, 0], [0, 0, 1], RECT, .6, .95, K.dark, .02); star(M, [3.0, 0, 2.05], [1, 0, 0], [0, 0, 1], .38, K, .02);
        [-1, 1].forEach(sd => { const a = .9; star(M, [-.4, sd * Math.cos(a) * 2.55, Math.sin(a) * 2.55], [0, sd * Math.cos(a), Math.sin(a)], [0, 0, 1], .62, K, .1); });
        bags(M, [[-3.3, -2.85], [2.8, -2.85]], 2, K.bag); bags(M, [[-3.3, 2.85], [2.8, 2.85]], 2, K.bag);
        crate(M, 3.65, -.2, 0, 0, .55, .42, .58, K); crate(M, 3.6, .7, 0, .25, .42, .33, .45, K); crate(M, 3.6, .7, .45, .15, .36, .3, .38, K);
        crate(M, -4.1, 1.8, 0, .3, .5, .38, .5, K);
        return { flag: [3.4, -3.4, 0, 6.0] };
      },
      motor_pool(M, K) {   // tarp workshop + A-frame hoist
        // shed: posts + sloped tarp
        [[-3.4, -.4], [1.2, -.4], [1.2, 3.6], [-3.4, 3.6]].forEach(([x, y], i) => cylZ(M, x, y, 0, i === 1 || i === 2 ? 2.55 : 2.95, .08, K.woodD, 6));
        M.hex8([[-3.6, -.6, 2.95], [1.4, -.6, 2.5], [1.4, 3.8, 2.5], [-3.6, 3.8, 2.95], [-3.6, -.6, 3.04], [1.4, -.6, 2.59], [1.4, 3.8, 2.59], [-3.6, 3.8, 3.04]], K.canvas);
        star(M, [-1.1, 1.6, 2.82], [-.45, 0, 5], [1, 0, 0], .95, K, .06);
        M.box(-2.8, .2, 2.8, 3.4, 0, .9, K.wood); obox(M, -.6, 1.3, 0, .2, .2, .25, .6, .05, K.steel); M.box(-.85, -.3, 1.15, 1.45, .6, .78, K.steel);   // bench · anvil
        crate(M, -2.9, 1.0, 0, .1, .6, .45, .6, K);
        // A-frame hoist with an engine on the chain
        [-3.9, -1.3].forEach(y => { beam(M, [1.5, y, 0], [2.3, y, 4.1], .14, K.steel); beam(M, [3.1, y, 0], [2.3, y, 4.1], .14, K.steel); beam(M, [1.85, y, 1.6], [2.75, y, 1.6], .08, K.steel); });
        beam(M, [2.3, -4.05, 4.12], [2.3, -1.15, 4.12], .16, K.steel); beam(M, [2.3, -2.6, 4.0], [2.3, -2.6, 2.1], .03, K.black);
        M.box(1.9, 2.7, -2.95, -2.25, 1.3, 2.05, K.olive); cylY(M, 2.3, -3.05, -2.15, 1.5, .18, K.steel, 8);
        drum(M, 3.6, .4, K, false); drum(M, 3.9, 1.0, K, true); drum(M, 3.3, 1.1, K, false); drum(M, -3.9, -2.6, K, false); drum(M, -3.4, -3.1, K, false);
        chBox(M, -3.6, -1.6, -3.6, -1.4, 0, 1.2, [.25, .25, .25, .25], K.canvasD);   // tarp-covered stack
        return { flag: [-4.0, 3.9, 0, 6.0] };
      },
      tank_depot(M, K) {   // steel frame + arched canvas roof, ramps, mast
        const prof = [[-3.5, .0], [3.5, .0], [3.5, 2.7], [3.15, 3.6], [2.2, 4.25], [0, 4.55], [-2.2, 4.25], [-3.15, 3.6], [-3.5, 2.7]];
        extX(M, prof, -4.3, 2.4, K.canvas, K.canvasD);
        decal(M, [2.4, 0, 1.3], [1, 0, 0], [0, 0, 1], RECT, 2.85, 1.3, K.dark, .02);
        // front arch frame (ribs + posts), struts down the sides
        for (let k = 2; k < prof.length; k++) { const a = prof[k], b = prof[(k + 1) % prof.length]; if (b[1] < .1) continue; beam(M, [2.5, a[0] * 1.03, a[1] + .06], [2.5, b[0] * 1.03, b[1] + .06], .16, K.steel); }
        beam(M, [2.5, -3.6, 0], [2.5, -3.6, 2.75], .16, K.steel); beam(M, [2.5, 3.6, 0], [2.5, 3.6, 2.75], .16, K.steel);
        [-3.0, -1.4, .3].forEach(x => [-1, 1].forEach(sd => beam(M, [x, sd * 3.56, 0], [x, sd * 3.56, 2.75], .12, K.steel)));
        // ramps
        [-1.3, 1.3].forEach(y => { M.hex8([[2.4, y - .48, 1.0], [4.9, y - .48, 0], [4.9, y + .48, 0], [2.4, y + .48, 1.0], [2.4, y - .48, 1.1], [4.9, y - .48, .1], [4.9, y + .48, .1], [2.4, y + .48, 1.1]], K.steel);
          for (let t = .1; t < 1; t += .16) beam(M, [2.4 + 2.5 * t, y - .48, 1.12 - t], [2.4 + 2.5 * t, y + .48, 1.12 - t], .05, K.dark); });
        M.box(1.6, 2.4, -3.3, 3.3, 0, 1.0, K.woodD);
        star(M, [-1.0, 0, 4.55], [0, 0, 1], [1, 0, 0], 1.25, K, .06);
        [-1, 1].forEach(sd => star(M, [-1.0, sd * 3.5, 1.4], [0, sd, 0], [0, 0, 1], .85, K, .03));
        cylZ(M, -4.5, 3.3, 0, 9.0, .07, K.steel, 6); beam(M, [-4.5, 2.6, 8.2], [-4.5, 4.0, 8.2], .05, K.steel); cylZ(M, -4.5, 3.3, 0, .5, .22, K.steel, 8);
        crate(M, -4.9, -2.6, 0, .2, .5, .4, .55, K); crate(M, -4.85, -1.8, 0, -.1, .45, .35, .5, K); drum(M, -4.9, -3.4, K, false);
        return { flag: [2.6, 4.3, 0, 6.5] };
      },
      outpost(M, K) {
        tent(M, -.4, 0, 3.4, 2.6, .9, 1.4, K, { door: true, star: .42 });
        bags(M, [[2.0, -2.2], [2.6, -.8], [2.6, .8], [2.0, 2.2]], 2, K.bag); crate(M, -2.2, -1.4, 0, .2, .4, .32, .45, K);
        return { flag: [-1.8, 1.8, 0, 4.6] };
      },
      doc_inf(M, K) {
        tent(M, -.3, .2, 4.2, 3.2, 1.0, 1.7, K, { door: true, star: .55 });
        bags(M, [[2.5, -2.4], [2.5, -.6]], 3, K.bag); crate(M, 2.6, 1.6, 0, .2, .45, .35, .5, K); crate(M, -2.6, -2.1, 0, -.2, .45, .35, .5, K);
        return { flag: [-2.6, 2.3, 0, 5.2] };
      },
      doc_mech(M, K) {
        [[-2.6, -1.8], [1.6, -1.8], [1.6, 1.8], [-2.6, 1.8]].forEach(([x, y], i) => cylZ(M, x, y, 0, i === 1 || i === 2 ? 2.2 : 2.6, .08, K.woodD, 6));
        M.hex8([[-2.8, -2.0, 2.6], [1.8, -2.0, 2.2], [1.8, 2.0, 2.2], [-2.8, 2.0, 2.6], [-2.8, -2.0, 2.69], [1.8, -2.0, 2.29], [1.8, 2.0, 2.29], [-2.8, 2.0, 2.69]], K.canvas);
        star(M, [-.5, 0, 2.48], [-.4, 0, 4.6], [1, 0, 0], .8, K, .06);
        [[-1.8, -1.0, 0], [-1.2, -1.0, 1], [-1.5, -.4, 0], [.4, 1.0, 0], [1.0, 1.1, 0], [2.6, -2.2, 0], [3.1, -1.7, 1]].forEach(([x, y, r]) => drum(M, x, y, K, !!r));
        for (let k = 0; k < 6; k++) M.box(2.6 + (k % 3) * .3, 2.82 + (k % 3) * .3, .6 + (k / 3 | 0) * .4, .9 + (k / 3 | 0) * .4, 0, .5, K.olive);   // jerry cans
        return { flag: [-2.9, 2.4, 0, 5.2] };
      },
      doc_air(M, K) {
        tent(M, -.4, .2, 4.0, 3.0, 1.0, 1.6, K, { door: true, star: .52, roof: K.canvasL });
        cylZ(M, -2.9, -2.2, 0, 7.5, .06, K.steel, 6); beam(M, [-2.9, -2.8, 6.8], [-2.9, -1.6, 6.8], .05, K.steel);
        [[2.6, -1.6], [2.9, -.8]].forEach(([x, y]) => { crate(M, x, y, 0, .2, .45, .35, .5, K); decal(M, [x, y, 1.02], [0, 0, 1], [1, 0, 0], DISC, .22, .22, K.white, .005); });
        return { flag: [-2.6, 2.4, 0, 5.2] };
      }
    };
    US.air_coy = US.support_center;

    function make(key) {
      const [team, type] = key.split(':'), f = (team === 'blue' ? US : DE)[type]; if (!f) return null;
      const M = new TankBaker.Mesh(), K = mats(M); seed = 1 + type.length * 977 + (team === 'blue' ? 13 : 7);
      const o = f(M, K) || {}; M._flag = o.flag || null; return M;
    }
    return { make, has: key => { const [t, y] = key.split(':'); return !!(t === 'blue' ? US : DE)[y]; }, US, DE,
      H: { mats, chBox, obox, beam, cylZ, cylX, cylY, extX, decal, qdecal, balken, star, banner, bags, crate, drum, tyre, net, tent, tower, onFront, onSide, RECT, DISC, PLUS, STAR } };
  })();

  // facing: 0° or 60° (both show the front to the camera), whichever is nearer the enemy HQ → TANK_SPR direction index
  function v133Face(b) {
    if (b._v133f !== undefined) return b._v133f;
    const foe = buildings.find(o => o.type === 'hq' && o.team !== b.team); let a = 0;
    if (foe) { const p = getHexCenter(b.c, b.r), q = getHexCenter(foe.c, foe.r), v = unproj(q.x - p.x, q.y - p.y); a = Math.atan2(v.y, v.x); }
    const d = t => Math.abs(Math.atan2(Math.sin(a - t), Math.cos(a - t)));
    return (b._v133f = d(0) <= d(Math.PI / 3) ? 0 : TANK_SPR.idx(Math.PI / 3));
  }
  function v133Bake(key, fi) {
    let mesh = V133.meshes.get(key); if (!mesh) { mesh = V133M.make(key); V133.meshes.set(key, mesh); }
    if (!mesh) return null;
    // cell = screen bounds of the model and of its ground shadow
    const S = V133.S, B = V133.B, ce = Math.sqrt(1 - TILT * TILT), yaw = TANK_SPR.yaw(fi), v = TANK_SPR.view, L = TANK_SPR.light, c = Math.cos(yaw), sn = Math.sin(yaw), P = mesh.P;
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; const put = (wx, wy, z) => { const X = (v.a1 * wx + v.a2 * wy) * S, Y = (v.b1 * wx + v.b2 * wy - v.b3 * z) * S; x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y); };
    for (let i = 0; i < P.length; i += 3) { const lx = P[i], ly = -P[i + 1], z = P[i + 2], wx = lx * c - ly * sn, wy = lx * sn + ly * c, q = z / L[2]; put(wx, wy, z); put(wx - L[0] * q, wy - L[1] * q, 0); }
    const pad = 4, W = Math.ceil(x1 - x0 + 2 * pad), H = Math.ceil(y1 - y0 + 2 * pad), PX = -x0 + pad, PY = -y0 + pad;
    const hi = TankBaker.bakeCell(mesh, { yaw, X0: 0, S: S * B, ss: 2, W: W * B, H: H * B, px: PX * B, py: PY * B, view: v, L });
    const lo = TankBaker.mkCanvas(W * B / 2, H * B / 2), lc = lo.getContext('2d'); lc.imageSmoothingEnabled = true; lc.imageSmoothingQuality = 'high'; lc.drawImage(hi, 0, 0, lo.width, lo.height);
    let flag = null; if (mesh._flag) { const f = mesh._flag, a = TankBaker.projectPoint(TANK_SPR.view, yaw, 0, S, f[0], f[1], f[2]); flag = { dx: a[0], dy: a[1], h: f[3] * ce * S }; }
    let top = 0; for (let i = 0; i < P.length; i += 3) top = Math.max(top, P[i + 2]);
    return { hi, lo, W, H, PX, PY, top: Math.min(top, 7.5) * ce * S, flag };
  }
  function v133Spr(b) {
    const key = b.team + ':' + b.type; if (!V133M.has(key)) return null;
    TANK_SPR.ensureView(); if (V133.sig !== TANK_SPR.sig) { V133.sig = TANK_SPR.sig; V133.cache.clear(); V133.pend.clear(); }
    const fi = v133Face(b), ck = key + '|' + fi, e = V133.cache.get(ck); if (e) return e;
    if (!V133.pend.has(ck)) {
      V133.pend.add(ck); V133.q.push(() => { try { const r = v133Bake(key, fi); if (r) V133.cache.set(ck, r); } catch (err) { console.warn('v133 bake', key, err); } });
      if (!V133.busy) { V133.busy = true; const step = () => { const f = V133.q.shift(); if (f) f(); if (V133.q.length) setTimeout(step, 16); else { V133.busy = false; } if (typeof mapReady !== 'undefined' && mapReady) render(); }; setTimeout(step, 30); }
    }
    return null;
  }
  
  /* drawBuildingShape: layer moved to js/chains/drawBuildingShape.js */
  
  /* v99BldTop: layer moved to js/chains/v99BldTop.js */

