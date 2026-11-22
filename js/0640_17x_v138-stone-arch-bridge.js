  // ══════════════════════════════════════════════════════════════
  // [17-] v138 — stone arch bridge and a lake jetty as baked 3D models
  //   · the bridge is laid along the hexes flagged `bridge` (axis = first → last hex), three segmental arches on two piers with
  //     cutwaters, voussoir ring, parapets with copings, the deck ramping down to the banks; units walk on the deck (the bridge
  //     hexes sit at deck height) and the bridge is drawn with the ground, under the units
  //   · jetty: plank deck on posts with two rowboats, at the map's `jetty` spot
  //   · both drawn at the true map scale (1 hex = 7 m)
  // ══════════════════════════════════════════════════════════════
  var V138 = { deck: .6, cache: new Map() };
  const V138M = (() => {
    const H = V133M.H, { mats, chBox, obox, beam, cylZ, decal, RECT } = H;
    function bridge(len) {   // metres; X along the bridge, Y across, Z up; z = 0 is the bank level
      const M = new TankBaker.Mesh(), K = mats(M), stone = M.mat([150, 142, 128], { spec: .04, noise: 2.2, dirt: .5 }), stoneD = M.mat([118, 112, 102], { spec: .04, noise: 2.2, dirt: .3 }), stoneL = M.mat([168, 160, 146], { spec: .05, noise: 1.8, dirt: .2 }), cob = M.mat([108, 104, 98], { spec: .03, noise: 2.6, dirt: .2 });
      const L2 = len / 2, W = 3.0, top = V138.deck * 2.1, span = 7.2, pier = 2.0, n = 3, wet = -1.6, spring = -1.0, rise = 1.75, arches = [];
      const total = n * span + (n - 1) * pier; for (let i = 0; i < n; i++) arches.push(-total / 2 + i * (span + pier) + span / 2);
      const zTop = x => { const a = Math.abs(x), flat = total / 2 + 1.5; return a <= flat ? top : Math.max(.15, top - (a - flat) / (L2 - flat) * (top - .15)); };
      const zBot = x => { for (const c of arches) { const u = (x - c) / (span / 2); if (Math.abs(u) < 1) return spring + rise * Math.sqrt(1 - u * u); } return Math.abs(x) <= total / 2 ? wet : -.45; };
      const dx = .32;
      for (let x = -L2; x < L2 - 1e-6; x += dx) {
        const xm = x + dx / 2, zt = zTop(xm), zb = zBot(xm), inArch = arches.some(c => Math.abs(xm - c) < span / 2);
        if (inArch) { M.box(x, x + dx + .01, -W, W, zb, zb + .38, stoneD); M.box(x, x + dx + .01, -W, W, zb + .38, zt - .3, stone); }
        else M.box(x, x + dx + .01, -W, W, zb, zt - .3, stone);
        M.box(x, x + dx + .01, -W - .12, W + .12, zt - .3, zt - .12, stoneL);                                   // string course
        M.box(x, x + dx + .01, -W + .55, W - .55, zt - .12, zt, cob);                                           // carriageway
        [-1, 1].forEach(sd => { M.box(x, x + dx + .01, sd > 0 ? W - .55 : -W, sd > 0 ? W : -W + .55, zt - .12, zt + .62, stone); M.box(x, x + dx + .01, sd > 0 ? W - .62 : -W - .07, sd > 0 ? W + .07 : -W + .62, zt + .62, zt + .74, stoneL); });
      }
      // piers with pointed cutwaters on both faces, end posts
      for (let i = 0; i + 1 < n; i++) { const xc = arches[i] + span / 2 + pier / 2;
        [-1, 1].forEach(sd => M.hex8([[xc - pier / 2, sd * W, wet], [xc + pier / 2, sd * W, wet], [xc, sd * (W + 1.4), wet], [xc, sd * (W + 1.4), wet], [xc - pier / 2, sd * W, spring + .3], [xc + pier / 2, sd * W, spring + .3], [xc, sd * (W + .2), spring + .9], [xc, sd * (W + .2), spring + .9]], stoneD)); }
      [-1, 1].forEach(e => [-1, 1].forEach(sd => { const x = e * (L2 - .4); M.box(x - .4, x + .4, sd > 0 ? W - .7 : -W - .1, sd > 0 ? W + .1 : -W + .7, zTop(x) - .1, zTop(x) + 1.0, stoneL); }));
      return M;
    }
    function jetty() {   // deck along +X into the water, posts, two rowboats
      const M = new TankBaker.Mesh(), K = mats(M), plank = M.mat([128, 104, 76], { spec: .03, noise: 2.0, dirt: .2 }), post = M.mat([86, 68, 50], { noise: 1.5 }), hullR = M.mat([150, 70, 50], { spec: .05 }), hullB = M.mat([70, 110, 140], { spec: .05 }), inner = M.mat([150, 132, 100]);
      for (let x = 0; x < 12; x += .5) M.box(x, x + .46, -1.2, 1.2, .55, .68, plank);
      for (let x = .5; x < 12; x += 2.4) [-1.1, 1.1].forEach(y => cylZ(M, x, y, -1.4, .9, .12, post, 7));
      M.box(8, 12, 1.2, 4.2, .55, .68, plank);
      const boat = (x, y, a, mh) => { const c = Math.cos(a), s = Math.sin(a), q = (u, v, z) => [x + u * c - v * s, y + u * s + v * c, z];
        M.hex8([q(-1.6, -.45, -.1), q(1.6, -.25, -.1), q(1.6, .25, -.1), q(-1.6, .45, -.1), q(-2.0, -.75, .45), q(2.1, -.1, .5), q(2.1, .1, .5), q(-2.0, .75, .45)], mh);
        M.hex8([q(-1.7, -.6, .2), q(1.7, -.12, .2), q(1.7, .12, .2), q(-1.7, .6, .2), q(-1.75, -.62, .46), q(1.8, -.12, .48), q(1.8, .12, .48), q(-1.75, .62, .46)], inner); };
      boat(5, -2.4, .15, hullR); boat(10.5, -2.6, -.25, hullB); boat(13.4, 1.6, 1.3, hullR);
      return M;
    }
    return { bridge, jetty };
  })();
  // placement: bridge along its hexes; jetty from V138.jetty = [fx, fy, angle]
  function v138Spots() {
    const key = COLS + 'x' + ROWS + '|' + OFFX + '|' + OFFY + '|' + (typeof V137 !== 'undefined' ? V137.ver : 0); if (V138.key === key) return V138.spots; V138.key = key;
    const w = Math.sqrt(3) * HEX_RADIUS, br = []; for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const t = terrainMap[c + ',' + r]; if (t && t.bridge) br.push([ORIGIN_X + c * w + (r % 2) * w / 2, ORIGIN_Y + r * 1.5 * HEX_RADIUS]); }
    const spots = [];
    if (br.length >= 2) {
      let cx = 0, cy = 0; br.forEach(p => { cx += p[0] / br.length; cy += p[1] / br.length; });
      let sxx = 0, sxy = 0, syy = 0; br.forEach(p => { const a = p[0] - cx, b = p[1] - cy; sxx += a * a; sxy += a * b; syy += b * b; });
      const ang = .5 * Math.atan2(2 * sxy, sxx - syy); let lo = 1e9, hi = -1e9; br.forEach(p => { const t = (p[0] - cx) * Math.cos(ang) + (p[1] - cy) * Math.sin(ang); lo = Math.min(lo, t); hi = Math.max(hi, t); });
      const mid = (lo + hi) / 2, len = (hi - lo + HEX_RADIUS * 2.6) / (w / 7);   // flat units → metres (1 hex = 7 m)
      spots.push({ kind: 'bridge', fx: cx + Math.cos(ang) * mid, fy: cy + Math.sin(ang) * mid, ang, len: Math.round(len) });
    }
    if (V138.jetty && V138.jetty.map === mapSelect.value) spots.push({ kind: 'jetty', fx: V138.jetty.fx, fy: V138.jetty.fy, ang: V138.jetty.ang, z: -.45 });
    return (V138.spots = spots);
  }
  function v138Sprite(sp) {
    TANK_SPR.ensureView(); const fi = TANK_SPR.idx(sp.ang), ck = sp.kind + '|' + (sp.len || 0) + '|' + fi + '|' + TANK_SPR.sig;
    let e = V138.cache.get(ck); if (e) return e;
    try { const M = sp.kind === 'bridge' ? V138M.bridge(sp.len) : V138M.jetty(); e = v134Bake(M, fi) || { none: true }; } catch (err) { console.warn('v138', err); e = { none: true }; }
    V138.cache.set(ck, e); return e;
  }
  { 
    /* v99Ground: layer moved to js/chains/v99Ground.js */ }
  // Faymonville: bridge deck height for the units, jetty below the boathouse
  { 
    /* loadFaymonville: layer moved to js/chains/loadFaymonville.js */ }
