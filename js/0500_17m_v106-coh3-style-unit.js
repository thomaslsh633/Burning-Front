  // ══════════════════════════════════════════════════════════════
  // [17m] v106 — CoH3-style unit banners + one white class icon per unit (v105 sample, revised)
  //   · banner: dark pointed shield · HP bar along the top inside (team colour = the only faction cue; infantry bar is
  //     split into one cell per man) · white class icon · left round badge = move points left (own turn) ·
  //     right small badge = the single most urgent status · veterancy stars above · selected: larger + name
  //   · icons: infantry / crew weapons hand-drawn on a 24-unit grid; vehicles with a 3D model get an automatic side
  //     silhouette from the same mesh, the rest are hand-drawn on a 48×24 grid. All white, built once and cached.
  //   · no national flag, no move / counter-fire dots, no head-count number (the HP cells carry it)
  // ══════════════════════════════════════════════════════════════
  const V105 = { ico: new Map(), bar: { blue: '#58a6f2', red: '#e4573f' } };
  function v105Kit(g) {
    const K = {
      P(...p) { g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); g.fill(); return K; },
      R(x, y, w, h) { g.fillRect(x, y, w, h); return K; },
      C(x, y, r) { g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill(); return K; },
      E(x, y, rx, ry, a) { g.beginPath(); g.ellipse(x, y, rx, ry, a || 0, 0, 6.2832); g.fill(); return K; },
      O(x, y, r, w) { g.lineWidth = w; g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.stroke(); return K; },
      L(x1, y1, x2, y2, w) { g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); return K; },
      RR(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); g.fill(); return K; },
      D(d) { g.fill(new Path2D(d)); return K; },
      S(d, w) { g.lineWidth = w; g.lineCap = g.lineJoin = 'round'; g.stroke(new Path2D(d)); return K; },
      cut(fn) { g.save(); g.globalCompositeOperation = 'destination-out'; fn(K); g.restore(); return K; },
      sc(x, y, deg, f, fn) { g.save(); g.translate(x, y); g.rotate(deg * Math.PI / 180); g.scale(f, f); fn(K); g.restore(); return K; },
      at(x, y, deg, fn, sx) { g.save(); g.translate(x, y); if (deg) g.rotate(deg * Math.PI / 180); if (sx) g.scale(sx, 1); fn(K); g.restore(); return K; }
    };
    return K;
  }
  // ---- shared parts (local coordinates, pointing +x) ----
  const v105Rifle = K => K.P(0, -1.3, 6.5, -.75, 6.5, .95, 4.6, 1.15, 0, 2.4).R(6.3, -.85, 8.9, 1.7).R(15, -.5, 6.6, 1).R(8.6, .8, 1.3, 1.5);
  const v105Wheel = (K, x, y, r) => K.C(x, y, r).cut(k => k.C(x, y, r * .34));
  
  const v105Canopy = (K, cx, cy, r, n) => { K.at(cx, cy, 0, k => { g105Arc(k, r); }); K.cut(k => { const s = 2 * r / n; for (let i = 0; i < n; i++) k.C(cx - r + s * (i + .5), cy + s * .18, s * .5); }); };
  function g105Arc(K, r) { K.D(`M${-r} 0 A${r} ${r} 0 0 1 ${r} 0 Z`); }
  const v105Mortar = (K, ang, tw) => K.P(4, 21.5, 16, 21.5, 15, 19.6, 5, 19.6).at(9.5, 19.6, ang, k => k.R(0, -tw / 2, 15.5, tw).R(14.5, -tw / 2 - .5, 1.6, tw + 1)).L(15, 10, 13, 20.6, 1.1).L(15, 10, 19.5, 20.6, 1.1).L(13.6, 16.5, 18.2, 16.5, .9);

  // ---- 24-grid icons: infantry and crew-served weapons ----
  const V105_SQ = {
    // US infantry
    'blue:infantry': K => { K.at(12, 12, -45, k => k.at(-10.8, 0, 0, v105Rifle)); K.at(12, 12, 0, k => k.at(0, 0, -45, k2 => k2.at(-10.8, 0, 0, v105Rifle)), -1); },
    'blue:scout': K => K.RR(3, 5, 7.5, 15, 3).RR(13.5, 5, 7.5, 15, 3).R(9.5, 7.5, 5, 4.5).R(4.4, 2.6, 4.7, 3).R(14.9, 2.6, 4.7, 3).cut(k => k.C(6.75, 15.6, 2.3).C(17.25, 15.6, 2.3).R(11.2, 8.6, 1.6, 2.3)),
    'blue:engineer': K => K.R(3, 10, 18, 10.5).R(2.2, 4.5, 6.2, 16).R(15.6, 4.5, 6.2, 16).R(9.2, 8.2, 1.9, 2).R(12.9, 8.2, 1.9, 2)
      .cut(k => k.R(4.5, 4.5, 1.6, 1.7).R(17.9, 4.5, 1.6, 1.7).R(4.6, 9, 1.4, 2.6).R(18, 9, 1.4, 2.6).D('M10.2 20.5 L10.2 15.6 A1.8 1.8 0 0 1 13.8 15.6 L13.8 20.5 Z')),
    'blue:captain': K => K.R(5.5, 3.5, 4.4, 17).R(14.1, 3.5, 4.4, 17).R(5.5, 3.5, 13, 1.6).R(5.5, 18.9, 13, 1.6),
    'blue:at_inf': K => K.at(12, 12.5, -24, k => k.R(-11, -1.45, 22, 2.9).P(-11, -1.45, -12.8, -2.4, -12.8, 2.4, -11, 1.45).R(9.8, -1.95, 1.4, 3.9).R(4.6, -4, 1, 2.6).R(-1, 1.4, 1.6, 3.8).R(3, 1.4, 1.5, 2.8).R(-6.5, 1.4, 3.6, 1.9)),
    'blue:sniper': K => K.O(12, 12, 7.3, 2).L(12, 1.2, 12, 8.2, 1.7).L(12, 15.8, 12, 22.8, 1.7).L(1.2, 12, 8.2, 12, 1.7).L(15.8, 12, 22.8, 12, 1.7).C(12, 12, 1.15),
    'blue:pathfinder': K => K.P(10.6, 13.4, 13.4, 13.4, 12.7, 22, 11.3, 22).R(9.4, 11.2, 5.2, 2.4).D('M12 1.6 C16.4 5.8 15.8 9.4 14.2 11.2 L9.8 11.2 C8.2 9.4 7.6 5.8 12 1.6 Z')
      .cut(k => k.D('M12 5.6 C13.6 7.6 13.4 9.4 12.6 10.4 L11.4 10.4 C10.6 9.4 10.4 7.6 12 5.6 Z'))
      .P(9.4, 11.4, 1.4, 8.4, 3.2, 10.6, .8, 11.2, 3.4, 12.8, 1.8, 13.8, 9.4, 13.6).P(14.6, 11.4, 22.6, 8.4, 20.8, 10.6, 23.2, 11.2, 20.6, 12.8, 22.2, 13.8, 14.6, 13.6),
    'blue:paratrooper': K => { v105Canopy(K, 12, 10, 6.6, 4); K.L(6, 10.4, 12, 18.5, .9).L(9.6, 10.8, 12, 18.5, .9).L(14.4, 10.8, 12, 18.5, .9).L(18, 10.4, 12, 18.5, .9)
      .P(12, 21.5, 7, 20.8, 2.6, 17.4, .8, 12.6, 3.4, 15, 3, 12.6, 5.2, 15.4, 5.4, 13.4, 7.4, 16.6, 12, 18.6).P(12, 21.5, 17, 20.8, 21.4, 17.4, 23.2, 12.6, 20.6, 15, 21, 12.6, 18.8, 15.4, 18.6, 13.4, 16.6, 16.6, 12, 18.6); },
    'blue:assault_eng': K => K.R(6, 19.6, 12, 2).P(7.8, 20, 16.2, 20, 14.8, 9.4, 9.2, 9.4).R(6.6, 6.8, 10.8, 2.8).R(6.6, 2.6, 2.7, 4.4).R(10.65, 2.6, 2.7, 4.4).R(14.7, 2.6, 2.7, 4.4)
      .cut(k => k.D('M10.7 21.6 L10.7 17.8 A1.3 1.3 0 0 1 13.3 17.8 L13.3 21.6 Z').R(11.4, 11.6, 1.2, 3)),
    'blue:commando': K => K.P(12, .8, 13.6, 7.5, 13.3, 13.6, 10.7, 13.6, 10.4, 7.5).cut(k => k.R(11.6, 4.5, .8, 8.2)).RR(6.6, 13.6, 10.8, 1.9, .9).P(10.7, 15.5, 13.3, 15.5, 13.8, 20.3, 10.2, 20.3)
      .cut(k => k.R(10, 17.2, 4, .55).R(10, 18.7, 4, .55)).P(10, 20.3, 14, 20.3, 12, 23.4),
    'blue:ranger': K => K.P(12, 1.5, 22, 12, 12, 22.5, 2, 12).cut(k => k.P(12, 5.2, 18.4, 12, 12, 18.8, 5.6, 12)).P(12, 8.6, 15.2, 12, 12, 15.4, 8.8, 12),
    // US crew weapons
    'blue:hmg': K => K.R(5, 8, 6.6, 3.2).R(11.5, 8.5, 8.8, 2.2).cut(k => { for (let x = 12.8; x < 20; x += 1.9) k.C(x, 9.6, .5); }).R(20.2, 9, 2.2, 1.2).R(3.4, 8.2, 1.7, 3.6).R(6.8, 11.1, 3.8, 3).R(8.9, 11, 1.1, 2.8).L(9.4, 13.4, 3.8, 20.6, 1.25).L(9.4, 13.4, 17.4, 20.6, 1.25),
    'blue:hmg_50': K => K.R(4.2, 5.6, 7.4, 4.6).R(11.5, 6.9, 10.2, 2).R(21.4, 6.5, 1.8, 2.8).R(2.2, 5.6, 1.1, 4.6).R(3.3, 5.6, 1.4, 1).R(3.3, 9.2, 1.4, 1).R(9.6, 10.2, 3.6, 3.3).R(7.9, 10.1, 1.4, 3.4).L(8.6, 13.2, 2.6, 21.2, 1.4).L(8.6, 13.2, 18.4, 21.2, 1.4).L(8.6, 13.2, 10.6, 21.2, 1.2),
    'blue:mortar': K => v105Mortar(K, -62, 2.8),
    'blue:at_gun': K => K.R(9, 8.8, 14, 1.4).R(5.6, 9.4, 7.6, 1.6).P(8.2, 4.8, 10.4, 4.5, 11.8, 15, 9.6, 15.3).L(8, 12.2, 1.2, 20.4, 1.6).R(.4, 19.6, 2.2, 1.8).at(0, 0, 0, k => v105Wheel(k, 10.6, 16.6, 4)),
    'blue:howitzer': K => K.at(9.5, 11.5, -18, k => k.R(-2, -1.3, 15.5, 2.6).R(13, -1.6, 1.4, 3.2).R(-3, .9, 10, 1.6)).P(7, 6.4, 9, 6, 10, 13, 8, 13.4).L(8, 12.6, .8, 20.6, 1.7).R(.2, 19.6, 2.4, 1.9).at(0, 0, 0, k => v105Wheel(k, 10.2, 16.4, 4.7)),
    // German infantry
    'red:infantry': K => K.P(2.4, 3.4, 8.6, 3.4, 12, 15.4, 15.4, 3.4, 21.6, 3.4, 14, 21.4, 10, 21.4),
    'red:engineer': K => K.at(12, 12, -135, k => k.R(-9.2, -1.45, 14.4, 2.9).C(-9.2, 0, 1.9).C(7.4, 0, 4.6).cut(k2 => k2.R(7.6, -1.75, 6, 3.5).C(7.6, 0, 1.75))),
    'red:at_inf': K => K.at(12, 12.5, -20, k => k.R(-11, -1.6, 22, 3.2).R(-12, -2.1, 1.4, 4.2).R(9.6, -2.1, 1.6, 4.2).P(-4.8, -6.6, -1.2, -8.2, -1.2, 5, -4.8, 6.6).cut(k2 => k2.P(-4.1, -5.2, -2.4, -6, -2.4, -4.2, -4.1, -3.4)).R(1.2, 1.6, 1.6, 3.6).R(4.4, 1.6, 1.3, 2.6)),
    'red:sniper': K => { const g = K; for (let i = 0; i < 4; i++) K.at(12, 12, i * 90 + 45, k => k.S('M8.1 0 A8.1 8.1 0 0 1 2.1 7.82', 1.7).S('M7.82 -2.1 A8.1 8.1 0 0 1 8.1 0', 1.7));
      K.P(3.2, 11.2, 9.6, 11.6, 9.6, 12.4, 3.2, 12.8).P(20.8, 11.2, 14.4, 11.6, 14.4, 12.4, 20.8, 12.8).P(10.7, 21, 13.3, 21, 13.3, 16.4, 12, 13, 10.7, 16.4).L(12, 3, 12, 6.4, 1.1); },
    'red:fp_pioneer': K => { v105Canopy(K, 12, 7.4, 6.4, 4); K.L(6.2, 7.8, 12, 12.6, .9).L(17.8, 7.8, 12, 12.6, .9).L(9.8, 8.2, 12, 12.6, .9).L(14.2, 8.2, 12, 12.6, .9).R(11.15, 12, 1.7, 4.6).R(9.6, 11.4, 4.8, 1.3).P(8.8, 16.4, 15.2, 16.4, 15.2, 20.4, 12, 23.4, 8.8, 20.4); },
    'red:jager': K => {   // oak sprig: lobed leaves along a diagonal stem + an acorn
      const LEAF = 'M0 0 C-1 -.6 -2.2 -.4 -2 -1.6 C-2.8 -1.8 -2.6 -3 -1.8 -3.2 C-2.6 -3.8 -2.2 -5 -1.3 -5 C-1.8 -5.8 -1 -7 0 -8 C1 -7 1.8 -5.8 1.3 -5 C2.2 -5 2.6 -3.8 1.8 -3.2 C2.6 -3 2.8 -1.8 2 -1.6 C2.2 -.4 1 -.6 0 0 Z';
      const leaf = k => k.D(LEAF).cut(k2 => k2.S('M0 -.8 L0 -6.4', .42));
      K.L(4.6, 21.6, 16.6, 7.8, 1.25);
      [[16.6, 7.8, 41, 1.02], [13.4, 11.4, -21, .95], [13.4, 11.4, 103, .95], [9.6, 15.8, -21, .9], [9.6, 15.8, 103, .9]].forEach(([x, y, d, f]) => K.sc(x, y, d, f, leaf));
      K.E(7.6, 20.6, 1.5, 1.9, .7).at(7.6, 20.6, 40, k => k.R(-1.8, -2.4, 3.6, 1.4));
    },
    'red:panzergren': K => K.P(5, 10.2, 9.4, 10.2, 12, 18.2, 14.6, 10.2, 19, 10.2, 13.6, 22.6, 10.4, 22.6).R(7.6, 3.6, 8.8, 3.2).R(10.4, .8, 3.2, 8.8).cut(k => k.R(8.5, 4.8, 7, .8).R(11.6, 1.7, .8, 7)),
    'red:fj': K => K.C(7.8, 8.4, 3.5).C(12.2, 6.2, 4.6).C(16.6, 8.6, 3.3).RR(4.3, 7.6, 15.6, 4.3, 2.1)
      .P(12.8, 12.9, 9.2, 17.6, 12, 17.6, 9.4, 23.2, 16.2, 15.6, 13.2, 15.6, 15.8, 12.9),
    'red:sturmtruppen': K => K.at(12, 12, 42, k => k.P(.4, -11.6, 1.7, -9, 1.7, 3, -1.4, 3, -1.4, -10.2).cut(k2 => k2.R(.1, -8.4, .55, 10)).R(-3.6, 3, 6.8, 1.5).O(-3.1, 2.1, 1.2, .8).RR(-1.5, 4.4, 3.2, 6.4, .6).cut(k2 => k2.R(-.2, 5.4, .6, 4.4)).P(-1.5, 10.6, 2.6, 10.6, 2.6, 12.2, -1.5, 12.4)),
    // German crew weapons
    'red:hmg': K => K.P(1.6, 8.6, 6.2, 7.8, 6.2, 11.2, 1.6, 12).R(6, 7.6, 6.4, 3.4).R(12.3, 8, 8.4, 2.6).cut(k => { for (let x = 13.2; x < 20.2; x += 1.75) k.R(x, 8.6, .9, .9); }).R(20.6, 8.6, 2, 1.4).R(7.6, 11, 1.3, 2.4).L(18.8, 10.4, 16.4, 20.4, 1.1).L(18.8, 10.4, 21.6, 20.4, 1.1).R(9.4, 11, 3.4, 2.6),
    'red:mortar': K => v105Mortar(K, -70, 2.4).R(16.6, 9.6, 2.6, 2.2),
    'red:at_gun': K => K.R(10, 9, 11.6, 1.3).R(21.4, 8.1, 2.2, 3.1).cut(k => k.R(22.2, 8.1, .5, 3.1)).R(6.8, 9.5, 6.6, 1.7).D('M8.2 4.6 L9.6 4 L11 4.5 L12.4 15.6 L9.4 16 Z').L(8.4, 12.4, .6, 19.6, 1.5).L(8.4, 12.4, 2.6, 21.4, 1.5).at(0, 0, 0, k => v105Wheel(k, 11.2, 17, 3.8)),
    'red:lg40': K => K.R(10, 8, 10.4, 2.6).R(20.2, 7.6, 1.4, 3.4).P(10, 8, 3.6, 5.6, 3.6, 13, 10, 10.6).R(9, 6.8, 2.2, 4.9).L(11, 11.6, 6, 20.6, 1.2).L(11, 11.6, 16.6, 20.6, 1.2).at(0, 0, 0, k => v105Wheel(k, 11.2, 18, 2.8)),
    'red:flak': K => K.R(1.6, 20, 20.8, 1.6).R(8.6, 14.2, 6.8, 6).at(12, 13.4, -56, k => k.R(0, -.75, 11.5, 1.5).R(11, -1.1, 3, 2.2).R(-1.4, -2.8, 4.4, 2)).P(6.8, 8, 9.4, 7, 10.2, 14.2, 7.6, 14.8).R(13.4, 9.6, 2.4, 3.2),
    'red:nebel': K => { for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + Math.PI / 6; K.C(12 + Math.cos(a) * 4.9, 9.6 + Math.sin(a) * 4.9, 2.4); } K.C(12, 9.6, 1.6).cut(k => { for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + Math.PI / 6; k.C(12 + Math.cos(a) * 4.9, 9.6 + Math.sin(a) * 4.9, 1.15); } })
      .R(3.4, 16.2, 17.2, 1.6).RR(1.6, 12, 3, 9.4, 1.2).RR(19.4, 12, 3, 9.4, 1.2).L(12, 17, 12, 22.4, 1.4); },
    'red:howitzer': K => K.at(10.6, 11.2, -14, k => k.R(-3, -1.5, 16.2, 3).R(12.8, -1.8, 1.6, 3.6).R(-3.4, 1.1, 11, 1.8).R(-4.4, -2, 3, 4.4)).L(8.8, 12.6, .4, 20.8, 1.8).R(-.2, 19.8, 2.6, 1.9).at(0, 0, 0, k => v105Wheel(k, 10.6, 16.4, 5))
  };

  // ---- 48×24-grid icons: vehicles without a 3D model (side view, facing right, ground at y≈21.5) ----
  
  const V105_VEH = {
    // v116: 'blue:priest' now from the M7 mesh
    // v124: 'red:ambulance' now from its mesh
    // v124: 'red:supply' now from its mesh
    // v124: 'red:werfer' now from its mesh
    // v124: 'red:kettenkrad' now from its mesh
  };

  function v105Paint(w, h, fn) {
    const c = TankBaker.mkCanvas(w, h), g = c.getContext('2d'); g.scale(4, 4); g.fillStyle = g.strokeStyle = '#fff'; fn(v105Kit(g)); return c;
  }
  // automatic side silhouette from the unit's mesh: bake with no shadow, crop to the alpha bounds, fit 2:1, thicken thin
  // parts (barrels, MG) by a small dilation so they survive at banner size, flood white
  function v105MeshSil(mk, paint, OW = 192, OH = 96, S = 30) {   // v116: output size and bake scale (small weapons bake finer)
    let mesh = TANK_SPR.meshes.get(mk + paint + '|nc'); if (!mesh) { TankBaker.NC.on = true; try { mesh = TankBaker.build(mk, paint); } finally { TankBaker.NC.on = false; } TANK_SPR.meshes.set(mk + paint + '|nc', mesh); }   // v117: crew-less
    const view = TankBaker.viewFor(0, .01), L = TankBaker.lightFor(0), W = 360, H = 150;
    const src = TankBaker.bakeCell(mesh, { yaw: 0, X0: TankBaker.MODELS[mk].X0, S, ss: 1, W, H, px: W / 2, py: H * .82, view, L, shadow: false, outline: 0 });
    const d = src.getContext('2d').getImageData(0, 0, W, H).data; let x0 = W, y0 = H, x1 = 0, y1 = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 60) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 <= x0) return null;
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1, R = 1.9, sc = Math.min((OW - 2 * R - 4) / bw, (OH - 2 * R - 4) / bh);
    const m = TankBaker.mkCanvas(OW, OH), mg = m.getContext('2d'), dw = bw * sc, dh = bh * sc, ox = (OW - dw) / 2, oy = OH - R - 3 - dh;
    mg.imageSmoothingEnabled = true; mg.imageSmoothingQuality = 'high'; mg.drawImage(src, x0, y0, bw, bh, ox, oy, dw, dh);
    mg.globalCompositeOperation = 'source-in'; mg.fillStyle = '#fff'; mg.fillRect(0, 0, OW, OH);
    const out = TankBaker.mkCanvas(OW, OH), og = out.getContext('2d');
    for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; og.drawImage(m, Math.cos(a) * R, Math.sin(a) * R * .8); }
    og.drawImage(m, 0, 0);
    return out;
  }
  function v105Icon__base(team, key) {
    const id = team + ':' + key; if (V105.ico.has(id)) return V105.ico.get(id);
    let c = null;
    try {
      if (V105_SQ[id]) c = v105Paint(96, 96, V105_SQ[id]);
      else if (V105_VEH[id]) c = v105Paint(192, 96, V105_VEH[id]);
      else { const mk = TANK_SPR.mkey({ team, key }); if (mk) c = v105MeshSil(mk, TANK_SPR.paintOf(team)); }
    } catch (e) { c = null; }
    V105.ico.set(id, c); return c;
  }
  // build the icons in the background so the first frame with many vehicles never stalls
  function v105Warm() {
    const ids = []; ['blue', 'red'].forEach(t => Object.keys(UNIT_ROSTER[t]).forEach(k => ids.push([t, k])));
    let i = 0; const step = () => { if (i >= ids.length) return; v105Icon(ids[i][0], ids[i][1]); i++; setTimeout(step, 16); }; setTimeout(step, 400);
  }

  // ---- banner ----
  //   shield = body (HP bar on top, white mark centred) + a darker pointed tip that carries the move points left;
  //   left badge = head count (squads / crews), right badge = the single most urgent status, stars above   (v107: swapped)
  const v105Kind = u => u.armorType === 'hard' ? 'veh' : (u.isHeavy || u.isMortar || u.isArtillery || u.isHmg || u.isNebel) ? 'sup' : 'inf';
  function v105Shield(kind, w, h, tip) {
    const hw = w / 2, c = h * .1; ctx.beginPath();
    if (kind === 'veh') { ctx.moveTo(-hw + c, -h); ctx.lineTo(hw - c, -h); ctx.lineTo(hw, -h + c); ctx.lineTo(hw, -tip); ctx.lineTo(0, 0); ctx.lineTo(-hw, -tip); ctx.lineTo(-hw, -h + c); }
    else if (kind === 'sup') { ctx.moveTo(-hw, -h); ctx.lineTo(hw, -h); ctx.lineTo(hw, -tip); ctx.lineTo(hw * .3, 0); ctx.lineTo(-hw * .3, 0); ctx.lineTo(-hw, -tip); }   // blunt tip
    else { ctx.moveTo(-hw, -h); ctx.lineTo(hw, -h); ctx.lineTo(hw, -tip); ctx.lineTo(0, 0); ctx.lineTo(-hw, -tip); }
    ctx.closePath();
  }
  function v105Status__base(u, own) {
    if (u.armorType === 'soft' && (u.suppression || 0) > 0) { const st = suppState(u); if (st === 2) return ['pin', '#ef4444']; }
    if (u.fireTurns > 0) return ['fire', '#f87171'];
    if (u.armorType === 'soft' && (u.suppression || 0) > 0 && suppState(u) === 1) return ['supp', '#fbbf24'];
    if (u.trackDamaged) return ['trk', '#fb923c'];
    if (!v159Ready(u) && u.hp > 0) return ['nofire', '#fb923c'];
    if (own && u.maxAmmo > 0 && u.ammo / u.maxAmmo <= .2) return ['amm', u.ammo <= 0 ? '#ef4444' : '#fb923c'];
    if (own && u.hasFuel && u.maxFuel > 0 && u.fuel / u.maxFuel <= .2) return ['fue', u.fuel <= 0 ? '#ef4444' : '#fb923c'];
    return null;
  }
  /* drawBanner: layer moved to js/chains/drawBanner.js */
  // build menu: the same white icon on a small shield replaces the speciality badge, for every unit
  const V105_URL = new Map();
  function v105IconUrl(team, key) { const id = team + ':' + key; if (V105_URL.has(id)) return V105_URL.get(id); const c = v105Icon(team, key), u = c ? c.toDataURL() : null; V105_URL.set(id, u); return u; }
  document.head.insertAdjacentHTML('beforeend', `<style>
    .tile.rec .v105-cls{position:absolute;left:3px;bottom:3px;display:flex;align-items:flex-start;justify-content:center;width:18px;height:21px;padding-top:3px;box-sizing:border-box;
      background:linear-gradient(var(--c-n4),var(--c-n2));clip-path:polygon(0 0,100% 0,100% 76%,50% 100%,0 76%);filter:drop-shadow(0 1px 0 rgba(0,0,0,.6))}
    .tile.rec .v105-cls img{width:13px;height:13px;display:block}
    .tile.rec .v105-cls.w{width:25px;clip-path:polygon(12% 0,88% 0,100% 12%,100% 76%,50% 100%,0 76%,0 12%);padding-top:4px}
    .tile.rec .v105-cls.w img{width:21px;height:10.5px}
  </style>`);
  
  /* updateBuildMenu: layer moved to js/chains/updateBuildMenu.js */
  v105Warm();

