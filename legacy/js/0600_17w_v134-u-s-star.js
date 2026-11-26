  // ══════════════════════════════════════════════════════════════
  // [17w] v134 — U.S. star mark (white star inside a broken ring) · U.S. HQ after the reference photo · refined tier buildings ·
  //              faction bunkers · emplacements
  //   · bunkers (MG / medical) keep their rules; each side gets its own model (German stepped concrete pillbox · U.S. sandbag
  //     fighting position under a tarp · concrete aid post · triage tent)
  //   · emplacements are static weapon units built by engineers: no movement, no skills, structure armour, immune to small arms.
  //     Wehrmacht: Pak bunker (60° arc) · 8.8 cm Flak 36 · 2 cm Flak 38 · 210 mm howitzer
  //     U.S. Army: 81 mm mortar pit · 105 mm howitzer pit
  //     The weapon comes from the roster entry of the matching gun team; the 360° ones turn toward their target when they fire.
  //   · drawn at the infantry / gun scale (v117Hs); gun pits are baked in two halves so the gun and crew sit between the back
  //     and the front sandbags
  // ══════════════════════════════════════════════════════════════
  var V134 = { S: 7, B: 2 };
  const V134_EMPL = {
    at_bunker:    { team: 'red', n: '대전차 벙커', s: '▷', key: 'at_gun', g: 320, f: 30, hp: 460, ar: [45, 42, 30], arc: 60, full: true },
    flak36_empl:  { team: 'red', n: '88mm 고사포 진지', s: '⌃▷', key: 'flak36', g: 320, f: 65, big: true, hp: 300, ar: [14, 12, 10], arc: 360 },
    flak38_empl:  { team: 'red', n: '20mm 대공포 진지', s: '⌃', key: 'flak38', g: 260, f: 15, hp: 200, ar: [10, 10, 8], arc: 360 },
    obice_empl:   { team: 'red', n: '210mm 포병 진지', s: '⌒', key: 'obice210', g: 360, f: 60, big: true, hp: 300, ar: [10, 10, 8], arc: 360 },
    mortar_pit:   { team: 'blue', n: '박격포 진지', s: '⌒', key: 'mortar', g: 220, f: 0, hp: 180, ar: [8, 8, 6], arc: 360 },
    howitzer_pit: { team: 'blue', n: '105mm 포병 진지', s: '⌒⌒', key: 'howitzer', g: 320, f: 60, big: true, hp: 260, ar: [10, 10, 8], arc: 360 }
  };
  Object.keys(V134_EMPL).forEach(k => { const E = V134_EMPL[k]; FORT[k] = { n: E.n, g: E.g, f: E.f, s: E.s, team: E.team, empl: true, big: !!E.big }; });
  function v134EmplList(tm) { return Object.keys(V134_EMPL).filter(k => V134_EMPL[k].team === tm && UNIT_ROSTER[tm] && UNIT_ROSTER[tm][V134_EMPL[k].key]); }

  const V134M = (() => {
    const H = V133M.H, { mats, chBox, obox, beam, cylZ, cylX, extX, decal, qdecal, balken, star, banner, bags, crate, drum, tyre, net, tent, tower, onFront, onSide, RECT, DISC, PLUS } = H;
    const ring = (r, a0, a1, n) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [Math.cos(a) * r, Math.sin(a) * r]; });
    const redCross = (M, c, out, up, R, K, lift = .035) => { decal(M, c, out, up, DISC, R, R, K.white, lift); decal(M, c, out, up, PLUS(.3), R * .78, R * .78, K.red, lift + .02); };

    // ---------- U.S. HQ (reference photo): command tent, timber porch with sandbags on the roof, plank ramp, sandbag walls ----------
    V133M.US.hq = (M, K) => {
      const T = M.mat([98, 112, 76], { spec: .03, noise: 1.2 }), TD = M.mat([80, 94, 62], { spec: .03, noise: 1.2 });
      chBox(M, -3.6, 3.2, -3.1, 3.1, 0, 2.0, [.05, .05, .05, .05], TD);
      chBox(M, -3.85, 3.45, -3.35, 3.35, 2.0, 4.6, [2.6, 2.6, 3.3, 3.3], T);
      chBox(M, -1.3, .9, -.06, .06, 4.55, 4.75, [0, 0, 0, 0], TD);
      star(M, [3.45 - 2.6 * .45, 0, 2.0 + 2.6 * .45], [2.6, 0, 2.6], [0, 0, 1], .95, K, .04);                                   // star on the front hip
      [-1, 1].forEach(sd => star(M, [-.4, sd * 1.68, 3.3], [0, sd * 2.6, 3.3], [1, 0, 0], .9, K, .05));
      decal(M, [-.6, -3.12, 1.25], [0, -1, 0], [0, 0, 1], RECT, .55, .4, K.glass, .02); decal(M, [-.6, 3.12, 1.25], [0, 1, 0], [0, 0, 1], RECT, .55, .4, K.glass, .02);
      decal(M, [3.22, 1.0, .95], [1, 0, 0], [0, 0, 1], RECT, .55, .9, K.dark, .02);
      // timber porch with sandbags on its roof (left of centre), plank ramp
      [[3.2, .1], [3.2, 1.9], [4.7, .1], [4.7, 1.9]].forEach(([x, y]) => M.box(x - .09, x + .09, y - .09, y + .09, 0, 2.15, K.wood));
      M.box(3.0, 4.85, -.05, 2.05, 2.15, 2.3, K.woodD); bags(M, [[3.2, .25], [4.7, .25]], 2, K.bag, 2.3); bags(M, [[3.2, 1.75], [4.7, 1.75]], 2, K.bag, 2.3); bags(M, [[3.3, 1.0], [4.6, 1.0]], 1, K.bag, 2.72);
      for (let k = 0; k < 6; k++) M.box(4.8, 6.0, .25 + k * .26, .48 + k * .26, 0, .1, K.wood);
      bags(M, [[4.9, -.1], [5.9, -.1], [5.9, -.7]], 3, K.bag); bags(M, [[4.9, 2.1], [5.9, 2.1], [5.9, 2.7]], 3, K.bag);
      bags(M, [[3.5, -1.0], [3.5, -3.3], [-3.0, -3.4]], 2, K.bag); bags(M, [[3.5, 2.6], [3.5, 3.4], [.5, 3.4]], 2, K.bag);
      // guy ropes · stakes
      [[3.45, -3.35, 6.0, -4.8], [-3.85, -3.35, -5.4, -4.8], [3.45, 3.35, 5.2, 4.7]].forEach(([x, y, gx, gy]) => beam(M, [x, y, 2.0], [gx, gy, 0], .03, K.black));
      // A-frame gantry with a small tarp (back left), watchtower (back right), field gun limber
      [-4.9, -3.3].forEach(x => { beam(M, [x, 3.6, 0], [x, 4.3, 3.0], .1, K.steel); beam(M, [x, 5.0, 0], [x, 4.3, 3.0], .1, K.steel); });
      beam(M, [-5.0, 4.3, 3.0], [-3.2, 4.3, 3.0], .12, K.steel); beam(M, [-4.1, 4.3, 3.0], [-4.1, 4.3, 1.6], .03, K.black); obox(M, -4.1, 4.3, 1.0, .3, .35, .3, .6, .05, K.olive);
      tower(M, -5.0, -3.2, 6.4, K);
      crate(M, 2.4, -4.2, 0, .2, .5, .38, .5, K); drum(M, 1.6, -4.4, K, false); crate(M, -2.0, 4.4, 0, -.3, .45, .35, .45, K);
      return { flag: [5.4, -1.6, 0, 7.2] };
    };
    // ---------- U.S. barracks: Quonset hut on a sandbag base with an entrance hood ----------
    V133M.US.barracks = (M, K) => {
      const arc = Array.from({ length: 13 }, (_, k) => { const a = Math.PI * k / 12; return [-Math.cos(a) * 2.6, Math.sin(a) * 2.6 + .05]; });
      extX(M, arc, -3.8, 3.0, K.canvas, K.canvasD);
      decal(M, [3.0, 0, .9], [1, 0, 0], [0, 0, 1], RECT, .55, .9, K.dark, .02);
      M.hex8([[3.0, -.9, 0], [4.0, -.9, 0], [4.0, .9, 0], [3.0, .9, 0], [3.0, -.95, 2.1], [4.0, -.95, 1.8], [4.0, .95, 1.8], [3.0, .95, 2.1]], K.canvasD);
      decal(M, [4.0, 0, .85], [1, 0, 0], [0, 0, 1], RECT, .5, .85, K.dark, .02);
      [-1, 1].forEach(sd => { const a = 1.0; star(M, [-.4, sd * Math.cos(a) * 2.6, Math.sin(a) * 2.6], [0, sd * Math.cos(a), Math.sin(a)], [0, 0, 1], .85, K, .1); });
      bags(M, [[-3.6, -2.8], [2.8, -2.8]], 2, K.bag); bags(M, [[-3.6, 2.8], [2.8, 2.8]], 2, K.bag); bags(M, [[4.1, -1.2], [4.1, -2.6]], 3, K.bag); bags(M, [[4.1, 1.2], [4.1, 2.6]], 3, K.bag);
      for (let k = 0; k < 5; k++) M.box(4.0, 5.1, -.6 + k * .26, -.38 + k * .26, 0, .1, K.wood);
      cylZ(M, -2.4, 1.0, 2.0, 3.4, .12, K.steel, 8);                                                                      // stove pipe
      crate(M, -4.3, -1.6, 0, .2, .45, .35, .5, K);
      return { flag: [3.6, 3.4, 0, 6.2] };
    };
    // ---------- U.S. weapon support center: low plank-and-sandbag house, canvas roof with the star, crates on the roof ----------
    V133M.US.support_center = (M, K) => {
      chBox(M, -3.2, 2.8, -2.6, 2.6, 0, 2.2, [.05, .05, .05, .05], K.woodD);
      bags(M, [[2.9, -2.7], [2.9, -.7]], 4, K.bag); bags(M, [[2.9, .9], [2.9, 2.7], [-3.3, 2.7]], 3, K.bag); bags(M, [[-3.3, -2.7], [2.9, -2.7]], 3, K.bag);
      M.hex8([[-3.4, -2.8, 2.2], [3.0, -2.8, 2.0], [3.0, 2.8, 2.0], [-3.4, 2.8, 2.2], [-3.4, -2.8, 2.36], [3.0, -2.8, 2.16], [3.0, 2.8, 2.16], [-3.4, 2.8, 2.36]], K.canvas);
      star(M, [.6, -.6, 2.27], [-.03, 0, 1], [1, 0, 0], 1.25, K, .03);
      decal(M, [2.82, .1, .95], [1, 0, 0], [0, 0, 1], RECT, .5, .95, K.dark, .02);
      crate(M, -2.4, 1.4, 2.3, .1, .55, .4, .45, K); crate(M, -1.5, 1.6, 2.3, -.1, .45, .35, .45, K); crate(M, -2.0, 1.5, 2.75, .2, .45, .33, .38, K); crate(M, -2.3, -1.9, 2.3, 0, .5, .35, .4, K);
      crate(M, 3.6, 2.0, 0, .2, .5, .38, .55, K); crate(M, 3.7, -1.9, 0, -.2, .45, .35, .5, K);
      return { flag: [3.4, -3.2, 0, 6.2] };
    };
    // ---------- Wehrmacht tier buildings: details after the in-game icons ----------
    { const b0 = V133M.DE.barracks; V133M.DE.barracks = (M, K) => { const o = b0(M, K);                                       // cage gate across the doorway
        for (let y = -.1; y <= 1.55; y += .27) beam(M, [2.86, y, .2], [2.86 - .55 * 2.15 / 2.9, y, 2.35], .06, K.steel);
        [.8, 1.6].forEach(z => beam(M, [2.86 - .55 * (z - .2) / 2.9 + .02, -.15, z], [2.86 - .55 * (z - .2) / 2.9 + .02, 1.6, z], .06, K.steel)); return o; }; }
    { const a0 = V133M.DE.air_coy; V133M.DE.air_coy = (M, K) => { const o = a0(M, K);                                         // roller shutter on the front block
        const [c, n] = onFront(2.6, .2, 3.4, .45, 2.65, 1.35); decal(M, c, n, [0, 0, 1], RECT, .55, 1.1, K.steel, .05);
        for (let z = .4; z < 2.4; z += .22) beam(M, [2.6 - .45 * (z - .2) / 3.2 + .06, 2.12, z], [2.6 - .45 * (z - .2) / 3.2 + .06, 3.18, z], .04, K.dark);
        cylZ(M, -3.6, 2.9, .2, 3.0, .45, K.steel, 12); cylZ(M, -3.6, 2.9, 3.0, 3.2, .3, K.steel, 12); return o; }; }
    { const p0 = V133M.DE.motor_pool; V133M.DE.motor_pool = (M, K) => { const o = p0(M, K);                                      // outside stair to the roof deck
        for (let k = 0; k < 8; k++) M.box(-3.9 + k * .42, -3.45 + k * .42, 3.35, 4.05, .2, .2 + (k + 1) * .53, K.conL);
        { const [c, n] = onFront(.6, 3.6, 4.45, .12, .6, 4.02); banner(M, c, n, .7, .75, K); } return o; }; }
    { const t0 = V133M.DE.tank_depot; V133M.DE.tank_depot = (M, K) => { const o = t0(M, K);                                    // open roof bay with a frame
        decal(M, [1.4, 0, 5.0], [0, 0, 1], [1, 0, 0], RECT, 1.6, 2.2, K.dark, .02);
        [[-.2, -2.3, -.2, 2.3], [3.0, -2.3, 3.0, 2.3], [-.2, -2.3, 3.0, -2.3], [-.2, 2.3, 3.0, 2.3]].forEach(([x0, y0, x1, y1]) => beam(M, [x0, y0, 5.12], [x1, y1, 5.12], .22, K.conL));
        [.6, 1.4, 2.2].forEach(x => beam(M, [x, -2.3, 5.25], [x, 2.3, 5.25], .1, K.steel)); return o; }; }

    // ---------- bunkers ----------
    const BK = {
      'red:bk_mg'(M, K) {   // stepped hexagonal pillbox, sandbags and hatches on the roof, side stair, MG slits
        M.lathe('z', [0, 0, 0], [[0, 0], [0, 2.3], [.95, 2.3], [1.1, 2.0], [1.7, 2.0], [1.85, 1.75], [1.85, 0]], 6, K.con);
        [-Math.PI / 6, Math.PI / 6].forEach(a => { obox(M, Math.cos(a) * 1.98, Math.sin(a) * 1.98, .55, a, .06, .55, .24, 0, K.dark); beam(M, [Math.cos(a) * 1.6, Math.sin(a) * 1.6, .66], [Math.cos(a) * 2.45, Math.sin(a) * 2.45, .68], .07, K.steel); });
        bags(M, [[.9, -.9], [.9, .9], [-.9, 1.1], [-1.2, 0], [-.9, -1.1], [.9, -.9]], 1, K.bag, 1.85);
        [[-.1, -.4], [-.2, .6]].forEach(([x, y]) => { M.lathe('z', [x, y, 1.85], [[0, .2], [0, .4], [.09, .4], [.09, .2], [0, .2]], 12, K.steel); decal(M, [x, y, 1.86], [0, 0, 1], [1, 0, 0], DISC, .2, .2, K.dark, .01); });
        for (let k = 0; k < 5; k++) M.box(-2.9 + k * .27, -1.75, -.55, .55, 0, .36 * (k + 1), K.conL);
        M.box(-2.9, -1.75, .55, .7, 0, 1.9, K.conL); M.box(-2.9, -1.75, -.7, -.55, 0, 1.9, K.conL);
        balken(M, [Math.cos(Math.PI / 2) * 1.62, -1.62, .95], [0, -1, 0], [0, 0, 1], .42, K);
        return { flag: [-1.0, 1.25, 1.85, 2.4] };
      },
      'red:bk_med'(M, K) {
        chBox(M, -2.0, 1.8, -1.8, 1.8, 0, 1.9, [.25, .35, .25, .25], K.con);
        const [dc, dn] = onFront(1.8, 0, 1.9, .35, 0, .8); decal(M, dc, dn, [0, 0, 1], RECT, .5, .8, K.dark, .03);
        redCross(M, [-.1, 0, 1.92], [0, 0, 1], [1, 0, 0], .9, K); { const [c, n] = onSide(1.8, 0, 1.9, .25, -.3, 1.0, -1); redCross(M, c, n, [0, 0, 1], .55, K); }
        bags(M, [[2.4, -1.8], [2.4, -.6]], 2, K.bag); bags(M, [[2.4, .6], [2.4, 1.8]], 2, K.bag); crate(M, -2.5, -1.4, 0, .2, .4, .3, .4, K);
        return { flag: [-1.6, 1.5, 1.9, 2.2] };
      },
      'blue:bk_mg'(M, K) {   // HMG fighting position: sandbag square under a tarp canopy (star), .50 cal out of the slot
        bags(M, [[1.55, -1.55], [-1.55, -1.55], [-1.55, 1.55], [1.55, 1.55]], 4, K.bag); bags(M, [[1.55, 1.55], [1.55, -1.55]], 2, K.bag);
        bags(M, [[1.9, -1.9], [2.4, -2.4]], 2, K.bag); bags(M, [[1.9, 1.9], [2.4, 2.4]], 2, K.bag); bags(M, [[-1.9, -1.9], [-2.3, -2.3]], 2, K.bag); bags(M, [[-1.9, 1.9], [-2.3, 2.3]], 2, K.bag);
        [[-1.4, -1.4], [1.4, -1.4], [1.4, 1.4], [-1.4, 1.4]].forEach(([x, y]) => cylZ(M, x, y, 0, 1.72, .06, K.woodD, 6));
        chBox(M, -1.9, 1.9, -1.9, 1.9, 1.7, 1.95, [.55, .55, .55, .55], K.canvas);
        star(M, [0, 0, 1.96], [0, 0, 1], [1, 0, 0], 1.0, K, .02);
        M.box(.2, .8, -.18, .18, .75, 1.0, K.steel); beam(M, [.7, 0, .92], [2.25, 0, .96], .07, K.steel);
        crate(M, -.8, -.8, 0, .2, .3, .2, .3, K);
        return { flag: [-1.4, 1.4, 0, 3.6] };
      },
      'blue:bk_med'(M, K) {   // triage tent
        tent(M, -.2, 0, 3.6, 3.0, 1.0, 1.6, K, { door: true, roof: M.mat([176, 172, 150], { spec: .03, noise: 1 }), wall: M.mat([150, 148, 128], { spec: .03, noise: 1 }) });
        [-1, 1].forEach(sd => { const hw = 1.68; redCross(M, [-.2, sd * hw * .5, 1.8], [0, sd * 1.6, hw], [1, 0, 0], .55, K, .05); });
        bags(M, [[2.2, -1.9], [2.2, -.7]], 2, K.bag); bags(M, [[2.2, .7], [2.2, 1.9]], 2, K.bag); crate(M, -2.4, 1.3, 0, .2, .4, .3, .4, K);
        return { flag: [-2.2, -1.6, 0, 3.6] };
      }
    };

    // ---------- emplacements (full models turn with the facing; gun pits are a base the gun team sits in) ----------
    const EM = {
      at_bunker(M, K) {   // low angular casemate, Pak barrel out of the front embrasure
        chBox(M, -2.4, 2.1, -2.3, 2.3, 0, 1.0, [.25, .45, .3, .3], K.con);
        chBox(M, -2.1, 1.6, -1.95, 1.95, 1.0, 1.85, [.3, .55, .35, .35], K.conL);
        { const [c, n] = onFront(1.65, 1.0, 1.85, .55, 0, 1.3); decal(M, c, n, [0, 0, 1], RECT, .75, .26, K.dark, .03); }
        M.box(1.2, 1.32, -.42, .42, 1.06, 1.55, K.steel); cylX(M, 1.0, 3.7, 0, 1.3, .07, K.steel, 10); cylX(M, 3.55, 3.8, 0, 1.3, .12, K.steel, 10);
        bags(M, [[-1.4, -1.3], [-1.4, 1.3]], 1, K.bag, 1.85); for (let k = 0; k < 4; k++) M.box(-3.4 + k * .26, -2.3, -.5, .5, 0, .25 * (k + 1), K.conL);
        balken(M, [-.2, -2.2, .55], [0, -1, .2], [0, 0, 1], .38, K); balken(M, [-.2, 2.2, .55], [0, 1, .2], [0, 0, 1], .38, K);
        crate(M, -2.6, 1.9, 0, .2, .35, .25, .3, K);
      },
      flak36_empl(M, K) { bags(M, ring(3.9, Math.PI * 1.18, Math.PI * 2.82, 14), 2, K.bag); crate(M, -2.6, -1.9, 0, .4, .5, .3, .35, K); crate(M, -3.0, 1.6, 0, -.3, .5, .3, .35, K); crate(M, -2.7, 1.7, .35, -.2, .45, .28, .3, K); },
      flak38_empl(M, K) { bags(M, ring(2.2, 0, Math.PI * 2, 12), 3, K.bag); crate(M, -1.5, .9, 0, .5, .3, .2, .25, K); },
      obice_empl(M, K) { bags(M, ring(4.6, Math.PI * 1.2, Math.PI * 2.8, 16), 3, K.bag); for (let k = 0; k < 4; k++) crate(M, -3.2 + (k % 2) * .5, -2.6 + (k >> 1) * 5.0, 0, .2, .5, .25, .3, K); },
      mortar_pit(M, K) { bags(M, ring(1.8, 0, Math.PI * 2, 10), 3, K.bag); chBox(M, -2.6, -1.6, 1.0, 2.2, 0, .9, [.25, .25, .25, .25], K.canvasD); crate(M, -1.0, -1.2, 0, .3, .3, .2, .25, K); },
      howitzer_pit(M, K) { bags(M, ring(3.9, Math.PI * 1.2, Math.PI * 2.8, 14), 3, K.bag); crate(M, -2.8, -1.8, 0, .2, .5, .3, .35, K); crate(M, -3.1, 1.7, 0, -.2, .5, .3, .35, K); crate(M, -2.9, 1.8, .35, -.1, .45, .28, .3, K); }
    };
    // mesh whose triangles carry a part id (one id per primitive) so a base can be split into the half behind and the half in front of the gun
    function partMesh() {
      const M = new TankBaker.Mesh(); M._pid = []; let part = 0; const t0 = M.tri.bind(M);
      M.tri = (...a) => { M._pid.push(part); t0(...a); };
      ['hex8', 'box', 'lathe', 'prismXY'].forEach(f => { const o = M[f].bind(M); M[f] = (...a) => { part++; const r = o(...a); part++; return r; }; });
      return M;
    }
    function split(M) {
      const sum = new Map(); M._pid.forEach((p, t) => { let s = sum.get(p); if (!s) sum.set(p, s = [0, 0, 0]); for (let k = 0; k < 3; k++) { s[0] += M.P[t * 9 + k * 3]; s[1] += M.P[t * 9 + k * 3 + 1]; } s[2] += 3; });
      const A = new TankBaker.Mesh(), B = new TankBaker.Mesh(); A.mats = M.mats; B.mats = M.mats;
      M._pid.forEach((p, t) => { const s = sum.get(p), X = s[0] / s[2], Y = s[1] / s[2], D = (X * SINA - Y * COSA) > .25 ? B : A;
        D.M.push(M.M[t]); for (let k = 0; k < 9; k++) { D.P.push(M.P[t * 9 + k]); D.N.push(M.N[t * 9 + k]); } });
      return { back: A, front: B };
    }
    const cache = new Map();
    function make(id, part) {   // id: 'red:bk_mg' · 'at_bunker' …; part: 'full' | 'back' | 'front'
      const ck = id + '|' + (part === 'full' ? 'full' : 'base'); let r = cache.get(ck);
      if (!r) {
        const f = BK[id] || EM[id]; if (!f) return null;
        const M = part === 'full' ? new TankBaker.Mesh() : partMesh(), K = mats(M); const o = f(M, K) || {}; M._flag = o.flag || null;
        r = part === 'full' ? { full: M } : split(M); cache.set(ck, r);
      }
      return r[part] || null;
    }
    return { make, has: id => !!(BK[id] || EM[id]) };
  })();

  // ---------- baking (shared queue with [17v]) ----------
  function v134Bake(mesh, fi) {
    const S = V134.S, B = V134.B, yaw = TANK_SPR.yaw(fi), v = TANK_SPR.view, L = TANK_SPR.light, c = Math.cos(yaw), sn = Math.sin(yaw), P = mesh.P, ce = Math.sqrt(1 - TILT * TILT);
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; const put = (wx, wy, z) => { const X = (v.a1 * wx + v.a2 * wy) * S, Y = (v.b1 * wx + v.b2 * wy - v.b3 * z) * S; x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y); };
    for (let i = 0; i < P.length; i += 3) { const lx = P[i], ly = -P[i + 1], z = P[i + 2], wx = lx * c - ly * sn, wy = lx * sn + ly * c, q = z / L[2]; put(wx, wy, z); put(wx - L[0] * q, wy - L[1] * q, 0); }
    if (!(x1 > x0)) return null;
    const pad = 4, W = Math.ceil(x1 - x0 + 2 * pad), H = Math.ceil(y1 - y0 + 2 * pad), PX = -x0 + pad, PY = -y0 + pad;
    const hi = TankBaker.bakeCell(mesh, { yaw, X0: 0, S: S * B, ss: 2, W: W * B, H: H * B, px: PX * B, py: PY * B, view: v, L });
    let top = 0; for (let i = 2; i < P.length; i += 3) top = Math.max(top, P[i]);
    let flag = null; if (mesh._flag) { const f = mesh._flag, a = TankBaker.projectPoint(v, yaw, 0, S, f[0], f[1], f[2]); flag = { dx: a[0], dy: a[1], h: f[3] * ce * S }; }
    return { hi, W, H, PX, PY, top: top * ce * S, flag };
  }
  function v134Get(id, part, fi) {
    if (!V134M.has(id)) return null;
    TANK_SPR.ensureView(); if (V133.sig !== TANK_SPR.sig) { V133.sig = TANK_SPR.sig; V133.cache.clear(); V133.pend.clear(); }
    const ck = 'v134|' + id + '|' + part + '|' + fi, e = V133.cache.get(ck); if (e) return e;
    if (!V133.pend.has(ck)) {
      V133.pend.add(ck); V133.q.push(() => { try { const m = V134M.make(id, part); const r = m && v134Bake(m, fi); V133.cache.set(ck, r || { none: true }); } catch (err) { console.warn('v134 bake', id, err); } });
      if (!V133.busy) { V133.busy = true; const step = () => { const f = V133.q.shift(); if (f) f(); if (V133.q.length) setTimeout(step, 16); else V133.busy = false; if (typeof mapReady !== 'undefined' && mapReady) render(); }; setTimeout(step, 30); }
    }
    return null;
  }
  const v134Draw = (e, x, y, k) => { if (!e || e.none) return; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(e.hi, x - e.PX * k, y - e.PY * k, e.W * k, e.H * k); };

  // ---------- bunkers ----------
  
  /* v99Bunker: layer moved to js/chains/v99Bunker.js */

  // ---------- emplacements ----------
  function v134PlaceEmpl(bt, tm, hex, cost) {
    const E = V134_EMPL[bt], foe = buildings.find(o => o.type === 'hq' && o.team !== tm); let a = tm === 'blue' ? 0 : Math.PI;
    if (foe) { const p = getHexCenter(hex.c, hex.r), q = getHexCenter(foe.c, foe.r), v = unproj(q.x - p.x, q.y - p.y); a = Math.atan2(v.y, v.x); }
    const u = createUnitFromKey(nextUnitId++, tm, E.key, hex.c, hex.r, TANK_SPR.yaw(TANK_SPR.idx(a)));
    Object.assign(u, { empl: bt, className: E.n, uniqueName: E.n, moveDist: 0, remainingMove: 0, armorType: 'hard', armor: E.ar[0], armorS: E.ar[1], armorR: E.ar[2], maxHp: E.hp, hp: E.hp,
      saImm: true, hw: '', tow: false, isHeavy: E.arc < 360, arcAngle: Math.min(360, E.arc) * Math.PI / 180, hasMoved: true, hasAttacked: true, cost: { g: cost.g, f: cost.f }, N: null, models: null });
    if (E.big) u.cells = v151Ring7(hex.c, hex.r);   // large emplacement: centre + 6 neighbours
    units.push(u); addLog(`🏗 [진지 구축] ${E.n}`, 'eng');
    return u;
  }
  
  /* drawUnitArt: layer moved to js/chains/drawUnitArt.js */

