  // ══════════════════════════════════════════════════════════════
  // [17i] v101 — illustrated icon set + rendered unit portraits
  //   · every object pictogram (units, weapons, equipment, structures, status) becomes a small painted illustration:
  //     gradient-lit from the upper left (same light as the map / sprites), dark rim instead of a line drawing.
  //     UI-control glyphs (x / check / info / arrows / plus …) stay as clean line glyphs on purpose.
  //   · the icons are built from a tiny part list (mode, path, colour) → one SVG <symbol> each, swapped into the shared sprite,
  //     so every DOM use updates; the canvas draws a raster of the same SVG (drawIco, v100)
  //   · recruit tiles, the recruit preview and the unit card show a portrait rendered from the unit's own 3D model
  //     (vehicles / infantry squads); weapons without a model keep their illustrated class icon
  // ══════════════════════════════════════════════════════════════
  {
    const V101C = { od: '#5f6b3a', od2: '#48522b', steel: '#868d95', gun: '#3e444b', dark: '#2a2e33', brass: '#c99a3e', bronze: '#a8743a', wood: '#8a6a44', khaki: '#ad9f72',
      canvas: '#cbc2a2', red: '#b2412c', white: '#ebe7dc', skin: '#d4a682', glass: '#2f4d6e', concrete: '#9d9d95', earth: '#7d6449', yellow: '#e8b830', fg: '#6d7263' };
    const v101mix = (h, t, k) => { const a = v98Rgb(h), b = t === 'w' ? [255, 255, 255] : [0, 0, 0]; return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * k).toString(16).padStart(2, '0')).join(''); };
    const C_ = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
    const E_ = (cx, cy, rx, ry) => `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;
    const BAG_ = (x, y, w, h) => `M${x + 1} ${y}H${x + w - 1}Q${x + w + .7} ${y + h / 2} ${x + w - 1} ${y + h}H${x + 1}Q${x - .7} ${y + h / 2} ${x + 1} ${y}Z`;
    const GEAR_ = (cx, cy, R, r, n) => { let d = ''; for (let i = 0; i < n * 4; i++) { const a = i / (n * 4) * Math.PI * 2, rr = (i % 4 < 2) ? R : r; d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(2) + ' ' + (cy + Math.sin(a) * rr).toFixed(2); } return d + 'Z'; };
    function v101Svg(name, parts) {
      let defs = '', body = '', gi = 0;
      const one = p => {
        if (p[0] === 'G') { body += `<g transform="${p[1]}">`; p[2].forEach(one); body += '</g>'; return; }
        const [m, d, col, opt = {}] = p, rim = opt.rim === undefined ? .5 : opt.rim, edge = rim ? ` stroke="${opt.ec || v101mix(Array.isArray(col) ? col[1] : col, 'b', .6)}" stroke-width="${rim}" stroke-linejoin="round"` : ' stroke="none"';
        if (m === 's') { body += `<path d="${d}" fill="none" stroke="${col}" stroke-width="${opt.w || 1}" stroke-linecap="${opt.cap || 'round'}" stroke-linejoin="round"${opt.dash ? ` stroke-dasharray="${opt.dash}"` : ''}${opt.op ? ` opacity="${opt.op}"` : ''}/>`; return; }
        if (m === 'n' || m === 'f') { body += `<path d="${d}" fill="${col}"${m === 'n' ? ' stroke="none"' : edge}${opt.op ? ` opacity="${opt.op}"` : ''}/>`; return; }
        const id = `v1${name}${gi++}`;
        if (m === 'g') defs += `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${v101mix(col, 'w', .28)}"/><stop offset=".5" stop-color="${col}"/><stop offset="1" stop-color="${v101mix(col, 'b', .32)}"/></linearGradient>`;
        else if (m === 'm') defs += `<linearGradient id="${id}" x1="0" y1="0" x2=".7" y2="1"><stop offset="0" stop-color="${v101mix(col, 'w', .42)}"/><stop offset=".34" stop-color="${v101mix(col, 'w', .08)}"/><stop offset=".55" stop-color="${v101mix(col, 'b', .2)}"/><stop offset=".74" stop-color="${v101mix(col, 'w', .18)}"/><stop offset="1" stop-color="${v101mix(col, 'b', .38)}"/></linearGradient>`;
        else if (m === 'v') defs += `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${col.map((c, i) => `<stop offset="${i / (col.length - 1)}" stop-color="${c}"/>`).join('')}</linearGradient>`;
        else if (m === 'r') defs += `<radialGradient id="${id}" cx=".38" cy=".34" r=".75"><stop offset="0" stop-color="${v101mix(col, 'w', .35)}"/><stop offset=".55" stop-color="${col}"/><stop offset="1" stop-color="${v101mix(col, 'b', .35)}"/></radialGradient>`;
        body += `<path d="${d}" fill="url(#${id})"${edge}${opt.op ? ` opacity="${opt.op}"` : ''}/>`;
      };
      parts.forEach(one);
      return (defs ? `<defs>${defs}</defs>` : '') + body;
    }
    const C = V101C, HL = (d, w = .8, op = .4) => ['s', d, '#ffffff', { w, op }];
    const V101_BUST = [['s', 'M4.5 21.2 L18.6 4.6', C.wood, { w: 1.7 }], ['s', 'M14.6 9.2 L18.9 4.2', C.gun, { w: 1 }],
      ['g', 'M3.4 22.6 Q4 15.4 12 14.8 Q20 15.4 20.6 22.6 Z', C.od], ['g', E_(12, 11.4, 3.2, 3.6), C.skin, { rim: .4 }],
      ['g', 'M6.1 10.6 Q6.4 3.5 12 3.3 Q17.6 3.5 17.9 10.6 L19.4 11 Q12 12.9 4.6 11 Z', C.od], HL('M8.6 6.4 Q10.4 4.5 13 4.4', .9, .35), ['s', 'M8.3 11.7 Q12 16.2 15.7 11.7', '#2b2a1e', { w: .55 }]];
    const V101_PARTS = {
      star: [['m', v100Star(12, 12.8, 10.6), C.brass], ['s', v100Star(12, 12.8, 6.2), '#fff2c4', { w: .6, op: .55 }]],
      medal: [['f', 'M8 1.8 H16 V9.6 L12 11.6 L8 9.6 Z', '#2c4f8e'], ['n', 'M10.4 1.8 H13.6 V10.4 L12 11.2 L10.4 10.4 Z', '#ebe7dc'], ['n', 'M11.4 1.8 H12.6 V11 L12 11.3 L11.4 11 Z', '#b22234'], ['m', v100Star(12, 16.2, 6.6), C.bronze]],
      inf: V101_BUST,
      squad: [['G', 'translate(-4.2 3.4) scale(.72)', V101_BUST], ['G', 'translate(10.6 3.4) scale(.72)', V101_BUST], ['G', 'translate(3.6 .6) scale(.78)', V101_BUST]],
      helmet: [['g', 'M3.5 15.4 Q3.8 4.8 12 4.4 Q20.2 4.8 20.5 15.4 Z', C.od], ['g', 'M1.8 15.4 Q12 19.4 22.2 15.4 Q22.6 17 21 17.7 Q12 21 3 17.7 Q1.4 17 1.8 15.4 Z', C.od2], HL('M6.4 10 Q7.6 6.6 11.6 6'), ['s', 'M5.4 17.6 Q9 22 12.8 21.4', C.khaki, { w: .9 }]],
      hammer: [['s', 'M4.2 6.2 L16.4 18.4', C.wood, { w: 1.6 }], ['s', 'M2.6 7.6 L5.6 4.6', C.wood, { w: 1.5 }], ['m', 'M14.6 15.6 L19.6 15.8 L21.2 20.6 L17.6 22 L13.8 19.6 Z', C.steel],
        ['s', 'M5.6 20.4 L16.8 7.2', C.wood, { w: 2.1 }], ['m', 'M13.4 4.6 L16.2 2.2 L21.8 8.6 L19 11 Z', C.gun]],
      pick: [['s', 'M6 20.6 L15.6 6.8', C.wood, { w: 1.9 }], ['m', 'M4.4 6.4 Q12 1.8 20.6 9.6 L19.4 10.4 Q12.6 5.2 5.2 7.6 Z', C.steel]],
      target: [['m', C_(12, 12, 9.8), C.gun], ['g', C_(12, 12, 7.5), C.glass, { rim: .4 }], ['s', 'M12 4.8 V10.2 M12 13.8 V19.2 M4.8 12 H10.2 M13.8 12 H19.2', '#0d0f12', { w: .8 }], ['n', C_(12, 12, .7), '#c0392b'], HL('M7.2 9.2 A5.6 5.6 0 0 1 10.4 6.4', 1.2, .35)],
      scope: [['g', 'M2.8 8.8 Q2.8 6.4 5.4 6.4 H8.8 Q11 6.4 11 8.8 V18.2 Q11 20.6 8.6 20.6 H5.2 Q2.8 20.6 2.8 18.2 Z', C.dark], ['g', 'M13 8.8 Q13 6.4 15.4 6.4 H18.8 Q21.2 6.4 21.2 8.8 V18.2 Q21.2 20.6 18.8 20.6 H15.4 Q13 20.6 13 18.2 Z', C.dark],
        ['m', 'M10.6 9.6 H13.4 V13 H10.6 Z', C.steel], ['g', E_(6.9, 19.4, 3.1, 1.3), C.glass, { rim: .3 }], ['g', E_(17.1, 19.4, 3.1, 1.3), C.glass, { rim: .3 }], ['f', E_(6.9, 6.6, 2.4, .9), '#55595e'], ['f', E_(17.1, 6.6, 2.4, .9), '#55595e'], HL('M4.2 9 V16.6', .9, .3), HL('M14.4 9 V16.6', .9, .3)],
      chute: [['s', 'M2.6 10 L11.2 19 M7.2 10 L11.6 18.6 M12 10 V18.4 M16.8 10 L12.4 18.6 M21.4 10 L12.8 19', '#3a3426', { w: .4 }],
        ['g', 'M2.4 10 Q12 -1.6 21.6 10 Q19.2 8.5 16.8 10 Q14.4 8.4 12 10 Q9.6 8.4 7.2 10 Q4.8 8.5 2.4 10 Z', C.canvas], ['g', 'M10.7 18.4 H13.3 V22.6 H10.7 Z', C.od, { rim: .4 }], ['g', C_(12, 17.6, 1.4), C.od2, { rim: .3 }]],
      flame: [['v', 'M12 22.4 C5.4 22.4 4.4 15.6 7.4 11.4 C7.8 14 9.6 14.6 9.6 14.6 C8.6 9.4 11.6 5 14.8 2.2 C14.2 6.8 18.8 9 18.8 14.8 C18.8 19.4 16 22.4 12 22.4 Z', ['#c0392b', '#f08a2a', '#f6b13d'], { rim: .4, ec: '#5a1a0c' }],
        ['v', 'M12 21.2 C9.2 21.2 8.6 17.8 10.4 15.4 C10.6 17 11.6 17.4 11.6 17.4 C11.4 14.6 13 12.6 14.4 11.4 C14.4 14.4 16 15.6 16 18.2 C16 20 14.6 21.2 12 21.2 Z', ['#ffd36a', '#fff3c4'], { rim: 0 }]],
      burst: [['s', 'M18.6 13.4 L16.6 20.6 M18.6 13.4 L20.6 20.6', C.steel, { w: .9 }], ['s', 'M12.8 14.2 Q12.2 18.4 8.8 19.8', C.brass, { w: 1.7, dash: '.8 .5', cap: 'butt' }],
        ['g', 'M1.8 12.4 L6 11 H8.2 V14.6 L5.2 14.9 L2.2 16 Z', C.dark], ['g', 'M9.6 14.2 H11.6 L11 17.6 H9.4 Z', C.dark, { rim: .4 }], ['m', 'M8 10.4 H14.8 V14.4 H8 Z', C.gun],
        ['m', 'M14.8 11 H21.2 V13.6 H14.8 Z', C.steel], ['n', 'M15.8 11.9 h1 v.8 h-1Z M17.6 11.9 h1 v.8 h-1Z M19.4 11.9 h1 v.8 h-1Z', '#1a1c1f'], ['f', 'M21.2 11.4 H22.8 V13.2 H21.2 Z', C.dark]],
      gunx: [['G', 'translate(0 -1)', [['g', 'M1.8 12.4 L6 11 H8.2 V14.6 L5.2 14.9 L2.2 16 Z', C.dark], ['m', 'M8 10.4 H14.8 V14.4 H8 Z', C.gun], ['m', 'M14.8 11 H21.2 V13.6 H14.8 Z', C.steel]]], ['s', 'M5 5 L19 19 M19 5 L5 19', '#c0392b', { w: 2.2 }]],
      mortar: [['g', 'M2.8 20.6 L9 17.8 L12.8 19.6 L6.6 22.6 Z', C.gun], ['s', 'M14.2 9.6 L11.4 21.2 M14.2 9.6 L18.8 20.8', C.steel, { w: 1 }], ['m', 'M6.9 18.6 L16.4 3.4 L18.8 4.9 L9.3 20.1 Z', C.od], ['f', 'M15.9 3.2 L17.1 2.4 L19.6 4 L18.4 4.8 Z', C.od2], ['f', 'M12.6 11.2 h2.4 v2 h-2.4Z', C.gun, { rim: .3 }]],
      atgun: [['s', 'M8 16.4 L2 21.6', C.od2, { w: 1.7 }], ['m', 'M11.6 10.4 H21.6 V12.2 H11.6 Z', C.steel], ['f', 'M21 9.8 H23.2 V12.8 H21 Z', C.gun], ['g', 'M9.4 9.6 H13.4 V12.9 H9.4 Z', C.od2, { rim: .4 }],
        ['g', 'M6.6 6.6 L12.6 5.6 L13.4 16.4 L6.2 17.2 Z', C.od], ['r', C_(9.6, 18.2, 3.4), C.dark], ['f', C_(9.6, 18.2, 1.2), C.steel, { rim: .3 }]],
      howitzer: [['s', 'M10 16 L2.4 22 M11.2 16.6 L5.6 22.6', C.od2, { w: 1.7 }], ['m', 'M8 13.6 L19.6 4.2 L21 5.8 L9.6 15.4 Z', C.gun], ['g', 'M6.2 12.6 L11.6 9.8 L13.2 14 L8 16.2 Z', C.od],
        ['r', C_(9.4, 17.4, 4.2), C.dark], ['s', 'M9.4 13.4 V21.4 M5.4 17.4 H13.4 M6.6 14.6 L12.2 20.2 M12.2 14.6 L6.6 20.2', '#5b6067', { w: .5 }], ['f', C_(9.4, 17.4, 1.3), C.steel, { rim: .3 }]],
      flak: [['g', 'M7.6 21.4 L10 15 H14 L16.4 21.4 Z', C.gun], ['s', 'M4 21.6 H20', C.od2, { w: 1.4 }], ['m', 'M11 12.8 L18.8 2.4 L19.9 3.2 L12.2 13.6 Z', C.steel], ['m', 'M12.8 13.6 L20.6 3.2 L21.7 4 L14 14.4 Z', C.steel],
        ['g', 'M9.2 15.2 L11.8 11 L15 12.4 L14.4 15.2 Z', C.od], ['g', 'M7.2 12.6 L10.4 10.4 L11.2 15.4 L8 15.6 Z', C.od2, { rim: .4 }]],
      jeep: [['r', C_(6.2, 17.4, 3.1), C.dark], ['r', C_(17.8, 17.4, 3.1), C.dark], ['g', 'M1.8 14.4 L4.2 12 H10 L11.4 9.6 H12.6 L13.4 12 H20.6 L21.8 13.4 V16.2 H1.8 Z', C.od],
        ['s', 'M11 12 L12.2 8.2', C.steel, { w: 1 }], ['f', C_(6.2, 17.4, 1.1), C.steel, { rim: .3 }], ['f', C_(17.8, 17.4, 1.1), C.steel, { rim: .3 }], ['n', v100Star(17, 14.1, 1.5), '#ebe7dc'], HL('M4.6 12.8 H10')],
      tank: [['g', 'M2.4 15.2 H21.6 Q23.2 17.6 21.2 20.6 H4.6 Q1.4 18.6 2.4 15.2 Z', C.dark], ...[5.4, 9.2, 13, 16.8].map(x => ['f', C_(x, 17.9, 1.75), '#5b6067', { rim: .3 }]),
        ['g', 'M2.8 15.2 L5 11.4 H19.6 L21.8 15.2 Z', C.od], ['g', 'M7.4 11.4 L8.6 7.6 H15.4 L16.6 11.4 Z', C.od], ['m', 'M17.2 8.8 H23.4 V10 H17.2 Z', C.od2], ['f', 'M15.4 8.4 H17.4 V10.6 H15.4 Z', C.od2, { rim: .3 }],
        ['n', v100Star(11.2, 9.6, 1.4), '#ebe7dc'], HL('M5.6 12 H19')],
      td: [['g', 'M2.4 15.2 H21.6 Q23.2 17.6 21.2 20.6 H4.6 Q1.4 18.6 2.4 15.2 Z', C.dark], ...[5.4, 9.2, 13, 16.8].map(x => ['f', C_(x, 17.9, 1.75), '#5b6067', { rim: .3 }]),
        ['g', 'M2.8 15.2 L5 11.4 H19.6 L21.8 15.2 Z', C.od], ['g', 'M6 11.4 L9.4 7.6 H15.6 L18.2 11.4 Z', C.od], ['m', 'M15.4 8.8 H23.2 V9.9 H15.4 Z', C.od2], ['f', 'M22.4 8.4 H23.6 V10.3 H22.4 Z', C.gun]],
      track: [['g', 'M10.4 15.2 H21.6 Q23 17.4 21.2 19.8 H11.6 Q9.4 17.8 10.4 15.2 Z', C.dark], ...[13, 16, 19].map(x => ['f', C_(x, 17.6, 1.4), '#5b6067', { rim: .3 }]), ['r', C_(5.6, 17.2, 2.8), C.dark],
        ['g', 'M2.2 14.6 L3.4 11.4 H8.4 L9.6 9.4 H21.8 V15.4 H2.2 Z', C.od], ['f', 'M8.6 9.4 L9.4 7 H12 V9.4 Z', C.od2, { rim: .3 }], ['s', 'M17.6 9.4 V6.4 M16.4 6.4 H21.6', C.gun, { w: .9 }], ['f', C_(5.6, 17.2, 1), C.steel, { rim: .3 }]],
      dozer: [['g', 'M7.6 15.4 H21.6 Q23 17.6 21.2 20.4 H8.8 Q6.6 18.2 7.6 15.4 Z', C.dark], ['g', 'M8.4 15.4 L9.6 10.6 H18.6 L20 15.4 Z', C.yellow], ['g', 'M11.6 10.6 V6.4 H17 V10.6 Z', C.yellow, { rim: .4 }],
        ['m', 'M2 9.6 L5.2 9.2 L5.6 21.2 L1.6 21.4 Z', C.steel], ['s', 'M5.4 14.4 L9 15.6', C.gun, { w: 1.2 }]],
      crate: [['g', 'M3 9 H15 V21 H3 Z', C.wood], ['g', 'M15 9 L20.8 6 V18 L15 21 Z', v101mix(C.wood, 'b', .25)], ['g', 'M3 9 L8.8 6 H20.8 L15 9 Z', v101mix(C.wood, 'w', .2)],
        ['s', 'M3 13 H15 M3 17 H15 M15 13 L20.8 10 M15 17 L20.8 14', '#4f3a22', { w: .5 }], ['n', 'M5.4 14.2 H12.6 V15.8 H5.4 Z', '#e8e0c4', { op: .55 }], ['s', 'M3.6 9.6 L14.4 20.4', '#4f3a22', { w: .7 }]],
      radar: [['s', 'M15.6 7.6 L17.2 .8', C.steel, { w: .8 }], ['g', 'M5 9 H17 V21.4 H5 Z', C.od], ['g', 'M17 9 L20 7.4 V19.8 L17 21.4 Z', C.od2], ['g', 'M5 9 L8 7.4 H20 L17 9 Z', v101mix(C.od, 'w', .2)],
        ['f', 'M7 11.2 H12.6 V14 H7 Z', '#c8c2a8', { rim: .3 }], ['f', C_(8.2, 17.4, 1.1), C.dark, { rim: 0 }], ['f', C_(12, 17.4, 1.1), C.dark, { rim: 0 }], ['f', C_(15, 12.6, .9), C.dark, { rim: 0 }]],
      plane: [['g', 'M1.4 11.4 L10.4 9.6 H13.6 L22.6 11.4 L22.6 13.4 L13.6 13.4 H10.4 L1.4 13.4 Z', '#6e7650'], ['g', 'M7.2 19 L10.6 18.2 H13.4 L16.8 19 L16.8 20.4 H7.2 Z', '#6e7650'],
        ['g', 'M12 2 Q13.7 2.6 13.7 6 L13.4 19.8 L12 22.2 L10.6 19.8 L10.3 6 Q10.3 2.6 12 2 Z', '#79815a'], ['s', 'M9.2 2.4 H14.8', '#c9ced3', { w: 1, op: .7 }], ['f', C_(5.4, 12.4, 1.35), '#2c4f8e', { rim: .3 }], ['n', v100Star(5.4, 12.5, 1.1), '#ebe7dc'], ['f', C_(18.6, 12.4, 1.35), '#2c4f8e', { rim: .3 }], ['n', v100Star(18.6, 12.5, 1.1), '#ebe7dc']],
      rocket: [['v', 'M4.8 19.2 L.8 23.2 L7 21.2 Z', ['#ffd36a', '#f08a2a'], { rim: 0 }], ['m', 'M4.4 19.6 L15.6 8.4 L17.6 10.4 L6.4 21.6 Z', C.steel], ['g', 'M15.6 8.4 L21.4 2.6 L17.6 10.4 Z', C.red],
        ['g', 'M4.4 19.6 L2 18.4 L6 15.8 Z', C.od, { rim: .4 }], ['g', 'M6.4 21.6 L7.6 24 L10.2 20 Z', C.od, { rim: .4 }]],
      smoke: [['r', C_(16.4, 9, 4.6), '#c9ced3', { rim: .3 }], ['r', C_(19.4, 5.2, 3.2), '#d8dce0', { rim: .3 }], ['r', C_(12.8, 5.6, 3), '#d8dce0', { rim: .3 }],
        ['m', 'M7.8 11 H14 V21.6 H7.8 Z', '#7b8270'], ['f', 'M9.6 8.6 H12.2 V11 H9.6 Z', C.gun], ['s', 'M12.2 9 Q15 9.8 14.2 14.4', C.steel, { w: .8 }], ['n', 'M7.8 15 H14 V16.6 H7.8 Z', '#e8e4d8', { op: .7 }]],
      blast: [['g', 'M3 15 Q1.4 9 7 8.2 Q8.6 2.4 13.6 4.4 Q18.8 2.4 20 8 Q23.8 10.6 21.4 15.4 Q22 20.6 16 20.4 Q12 23.4 8 20.6 Q2.4 20.6 3 15 Z', '#4a4440'],
        ['v', 'M12 4.6 L13.8 9.4 L18.6 7.4 L16 11.8 L20.4 14 L15.4 14.8 L16.4 19.6 L12.2 16.6 L8.6 20 L8.8 15 L3.8 14 L8.2 11.4 L5.6 7.4 L10.4 9.2 Z', ['#f6c33d', '#e2662a'], { rim: .4, ec: '#7a2a10' }], ['n', C_(12, 12.6, 2.6), '#fff3c4']],
      mine: [['g', 'M3 11.4 V15 Q12 20.8 21 15 V11.4 Z', '#565b42'], ['g', E_(12, 11.4, 9, 4.2), '#6c7353'], ['m', E_(12, 10.6, 3, 1.4), C.steel], ['s', 'M18.6 9.6 Q21.6 10.6 20.4 12.4', C.gun, { w: .8 }], ['s', 'M5 12.4 Q12 15.2 19 12.4', '#3d412e', { w: .5 }]],
      sandbag: [['g', BAG_(1.8, 15, 10.2, 6.4), C.khaki], ['g', BAG_(12, 15, 10.2, 6.4), C.khaki], ['g', BAG_(6.9, 8.8, 10.2, 6.4), v101mix(C.khaki, 'w', .1)], ['s', 'M4 15.4 V21 M14.2 15.4 V21 M9.1 9.2 V14.8', '#6a5c3a', { w: .5 }]],
      trench: [['g', 'M1.4 17.2 Q6 10.4 12 12.2 Q18 10.4 22.6 17.2 Z', C.earth], ['f', 'M5 17.2 Q12 14 19 17.2 Z', '#2b221a', { rim: 0 }], ['s', 'M7.6 15.4 V17.4 M10.2 14.8 V17.4 M12.8 14.8 V17.4 M15.4 15.2 V17.4', C.wood, { w: .7 }],
        ['g', BAG_(4.6, 10.6, 5.4, 3), C.khaki, { rim: .35 }], ['g', BAG_(14, 10.6, 5.4, 3), C.khaki, { rim: .35 }], ['s', 'M1 19.2 H23', '#4a3b2a', { w: .8 }]],
      bunker: [['g', 'M3 12 L6 9 H18 L21 12 V20.4 H3 Z', C.concrete], ['g', 'M6 9 L8 6.4 H16 L18 9 Z', v101mix(C.concrete, 'w', .2)], ['f', 'M7.2 13.4 H16.8 V15.4 H7.2 Z', '#141618', { rim: 0 }],
        ['g', BAG_(1.6, 18.4, 6.6, 3.4), C.khaki, { rim: .35 }], ['g', BAG_(15.8, 18.4, 6.6, 3.4), C.khaki, { rim: .35 }]],
      wrench: [['m', 'M5.6 21.2 L2.8 18.4 L13.4 7.8 Q12.6 4.4 15.4 2.8 L17.8 5.2 L16.6 7.6 L18.8 7.2 L21.2 9.6 Q19.6 12.4 16.2 11.4 Z', C.steel]],
      kit: [['s', 'M8.4 7.6 V4.8 H15.6 V7.6', C.steel, { w: 1.3 }], ['g', 'M3 10 H21 V20.8 H3 Z', '#8e3427'], ['g', 'M3 10 L4.4 7.6 H19.6 L21 10 Z', v101mix('#8e3427', 'w', .2)], ['f', 'M10.6 12.6 H13.4 V15.2 H10.6 Z', C.steel, { rim: .3 }], ['s', 'M3 14 H21', '#4a1a12', { w: .5 }]],
      medic: [['r', C_(12, 12, 9.8), C.white], ['f', 'M10 5.4 H14 V10 H18.6 V14 H14 V18.6 H10 V14 H5.4 V10 H10 Z', '#c0392b', { rim: .4 }]],
      hp: [['r', 'M12 21 C4.6 15.6 2.4 12.2 2.4 8.6 C2.4 5.4 4.8 3.2 7.6 3.2 C9.4 3.2 11 4.2 12 5.8 C13 4.2 14.6 3.2 16.4 3.2 C19.2 3.2 21.6 5.4 21.6 8.6 C21.6 12.2 19.4 15.6 12 21 Z', '#c0392b']],
      lock: [['s', 'M8 11 V7.6 Q8 3.4 12 3.4 Q16 3.4 16 7.6 V11', C.steel, { w: 2 }], ['m', 'M5.8 11 H18.2 V21.2 H5.8 Z', C.brass], ['f', 'M11.2 14.2 h1.6 v2 l.6 2.2 h-2.8 l.6 -2.2Z', '#2a1e0c', { rim: 0 }]],
      gear: [['m', GEAR_(12, 12, 10, 7.6, 8), C.steel], ['f', C_(12, 12, 3.2), '#1c1f23', { rim: .4 }]],
      warn: [['g', 'M12 2.4 L22.6 20.8 H1.4 Z', C.yellow], ['s', 'M12 5.6 L19.8 19 H4.2 Z', '#1c1f23', { w: .9 }], ['n', 'M11 9 H13 L12.6 15 H11.4 Z', '#1c1f23'], ['n', C_(12, 17, 1), '#1c1f23']],
      shield: [['m', 'M12 2.4 L20.4 5.4 V11.6 Q20.4 18 12 21.8 Q3.6 18 3.6 11.6 V5.4 Z', C.steel], ...[[6, 7], [18, 7], [6, 13], [18, 13], [12, 18.6]].map(([x, y]) => ['n', C_(x, y, .7), '#3a3f45']), HL('M6 8.4 L10.6 4.6', 1.4, .35)],
      swords: [['m', 'M3.4 2.8 L5 2.4 L17.8 15.2 L16.2 16.8 Z', C.steel], ['m', 'M20.6 2.8 L19 2.4 L6.2 15.2 L7.8 16.8 Z', C.steel], ['g', 'M15.2 17.8 L17.8 15.2 L21.6 19 L19 21.6 Z', C.wood, { rim: .4 }], ['g', 'M8.8 17.8 L6.2 15.2 L2.4 19 L5 21.6 Z', C.wood, { rim: .4 }],
        ['f', 'M14.2 17.4 L17.4 14.2 L18.4 15.2 L15.2 18.4 Z', C.gun, { rim: .3 }], ['f', 'M9.8 17.4 L6.6 14.2 L5.6 15.2 L8.8 18.4 Z', C.gun, { rim: .3 }]],
      charge: [['s', 'M14 6.4 Q16 2.4 19.6 3.6', '#3a3426', { w: .8 }], ['n', C_(19.8, 3.4, 1.3), '#ffd36a'], ...[5, 9.6, 14.2].map(x => ['g', `M${x} 8 H${x + 4.4} V21 H${x} Z`, '#8a3a2a']), ['n', 'M4.6 12 H19 V14 H4.6 Z', C.khaki], ['n', 'M4.6 17 H19 V19 H4.6 Z', C.khaki]],
      bolt: [['m', 'M14.4 1.8 L5 13.4 H11 L8.6 22.2 L19 9.6 H12.8 Z', C.yellow]],
      spark: [['m', 'M12 1.6 L14 10 L22.4 12 L14 14 L12 22.4 L10 14 L1.6 12 L10 10 Z', C.brass]],
      dash: [['g', 'M5.2 3.6 H11.2 V13.4 L18.8 15.2 Q21.6 15.8 21.2 19.4 H5.2 Z', '#6b4a2e'], ['f', 'M4.8 19.4 H21.4 V21.2 H4.8 Z', '#2b2118', { rim: 0 }], ['s', 'M5.6 7.6 H10.8 M5.6 10.4 H10.8', '#3d2a1a', { w: .6 }]],
      flask: [['g', 'M9.4 2.6 H14.6 V8.6 L20.4 19.4 Q21 21.6 18.6 21.6 H5.4 Q3 21.6 3.6 19.4 L9.4 8.6 Z', '#c9d6dc', { op: .9 }], ['v', 'M6.4 14 H17.6 L20.2 19.4 Q20.6 20.8 18.6 20.8 H5.4 Q3.4 20.8 3.8 19.4 Z', ['#62b07a', '#2f6e44'], { rim: 0 }], HL('M10.6 4 V9.6 L7.2 16', .9, .5)],
      flare: [['r', C_(17.2, 6.4, 4), '#e2412c', { rim: 0 }], ['n', C_(17.2, 6.4, 1.8), '#ffe0a0'], ['m', 'M3 13.4 H12.6 V16.4 H3 Z', C.gun], ['g', 'M4 16.4 H7.6 L6.6 22 H3.4 Z', C.wood, { rim: .4 }], ['s', 'M12.6 14 L15 9.4', '#e2412c', { w: .7, op: .6 }]],
      wheel: [['r', C_(12, 12, 10), C.dark], ['m', C_(12, 12, 5.4), C.steel], ['n', C_(12, 12, 1.6), '#2a2e33']],
      pin: [['r', 'M12 22.2 C12 22.2 4.4 14.2 4.4 9.4 A7.6 7.6 0 0 1 19.6 9.4 C19.6 14.2 12 22.2 12 22.2 Z', '#c0392b'], ['n', C_(12, 9.4, 2.6), '#f2efe6']],
      deny: [['r', C_(12, 12, 10), '#c0392b'], ['n', 'M5.2 10.2 H18.8 V13.8 H5.2 Z', '#f2efe6']],
      crane: [['m', 'M5 22 V4 H7.4 V22 Z', C.yellow], ['m', 'M5 4 L21 4 V6 L7.4 6 Z', C.yellow], ['s', 'M18.6 6 V13.2', C.gun, { w: .7 }], ['s', 'M17 13.2 Q18.6 16.6 20.2 13.2', C.gun, { w: 1 }], ['f', 'M2.6 20.6 H9.8 V22.6 H2.6 Z', C.gun]],
      flag: [['s', 'M4.6 2.4 V22.4', '#3a3c3e', { w: 1.3 }], ['g', 'M5.2 3.2 Q10 1.4 13 3.6 Q16.6 5.8 21 3.8 V12.8 Q16.6 14.8 13 12.6 Q10 10.4 5.2 12.2 Z', C.red]],
      trophy: [['m', 'M6.4 2.8 H17.6 V8.4 Q17.6 14.4 12 14.6 Q6.4 14.4 6.4 8.4 Z', C.brass], ['s', 'M6.4 5 H3.4 Q3.4 10 7.4 10.6 M17.6 5 H20.6 Q20.6 10 16.6 10.6', C.brass, { w: 1.1 }], ['m', 'M10.6 14.4 H13.4 V18 H10.6 Z', C.brass], ['m', 'M7 18 H17 V21.4 H7 Z', C.wood]],
      snow: [['s', 'M12 2 V22 M3.4 7 L20.6 17 M3.4 17 L20.6 7 M9.6 3.6 L12 6 L14.4 3.6 M9.6 20.4 L12 18 L14.4 20.4', '#dbe7ef', { w: 1.5 }]],
      pine: [['f', 'M11.2 19 H12.8 V22.6 H11.2 Z', '#4a3b2e', { rim: 0 }], ['g', 'M12 8.6 L19 19.4 H5 Z', C.od2], ['g', 'M12 5 L17.4 13.6 H6.6 Z', '#3e5a3a'], ['g', 'M12 1.6 L15.8 8.6 H8.2 Z', '#47664a']],
      house: [['g', 'M3.6 11.4 H14 V21 H3.6 Z', '#c7b994'], ['g', 'M14 11.4 L20.6 8.4 V18 L14 21 Z', '#a4976f'], ['g', 'M2.4 11.8 L8.8 4 L15.2 11.8 Z', '#8e3d2c'], ['g', 'M8.8 4 L15.4 1.2 L21.4 8.4 L15.2 11.8 Z', '#7a3022'], ['f', 'M7.4 15.6 H10.2 V21 H7.4 Z', '#3a2a1e', { rim: 0 }]],
      ruin: [['g', 'M3 21 V10 L5.6 12.6 L7.4 8.6 L9.6 11 V21 Z', '#a99f88'], ['g', 'M11 21 V6 L13.6 9 L15.6 5 L17.4 8.6 V21 Z', '#bdb39a'], ['g', BAG_(1.4, 19.4, 6.4, 3), '#7d7466', { rim: .35 }], ['g', BAG_(15.4, 19.2, 7, 3.2), '#857c6c', { rim: .35 }], ['f', 'M12.8 12 H15.4 V15 H12.8 Z', '#2b2622', { rim: 0 }]],
      door: [['g', 'M5.4 2.6 H18.6 V21.6 H5.4 Z', '#6b4a2e'], ['s', 'M7.6 5 V19.4 M12 5 V19.4 M16.4 5 V19.4', '#4a3220', { w: .6 }], ['f', C_(15.4, 12.4, .8), C.brass, { rim: 0 }]],
      horn: [['m', 'M3 9.4 H7.6 L17.6 3 V21 L7.6 14.6 H3 Z', C.brass], ['g', 'M17.6 3 Q21.4 12 17.6 21 Q19.4 12 17.6 3 Z', v101mix(C.brass, 'b', .3)], ['f', 'M5 14.6 H8 L9 19.4 H6.2 Z', C.gun]],
      hidden: [['g', 'M2 19.6 Q5 9.6 12 9 Q19 9.6 22 19.6 Z', '#56653a'], ['s', 'M4 16 L20 16 M5.6 12.8 L18.4 12.8 M6.6 19.4 L11 9.4 M12 19.4 L14.4 9.2 M17.4 19.4 L12.6 9.6 M3.4 19 L8.6 10.6', '#2f3a1e', { w: .55 }], ...[[7, 13.6], [14, 12], [17.6, 16.8], [10, 17.4]].map(([x, y]) => ['n', C_(x, y, 1.3), '#7c8a4c'])]
    };
    v100InstallIcons(Object.fromEntries(Object.entries(V101_PARTS).map(([n, p]) => [n, v101Svg(n, p)])));
  }

  // ---------- unit portraits from the 3D models (recruit tiles · recruit preview · unit card) ----------
  const V101_PORT = new Map();
  function v101Portrait__base(key, team) {
    const ck = key + '|' + team; if (V101_PORT.has(ck)) return V101_PORT.get(ck);
    let url = null;
    try {
      const S = 96, out = TankBaker.mkCanvas(S, S), g = out.getContext('2d'), fa = Math.PI * .78;   // nose toward the lower left: the 3/4 view
      const probe = { key, team, armorType: (UNIT_ROSTER[team][key] || {}).armorType };
      const R0 = UNIT_ROSTER[team][key] || {}, sq = INF_SPR.squads[team] || {}, mk = probe.armorType === 'hard' && TANK_SPR.mkey ? TANK_SPR.mkey(probe) : null;
      const figs = probe.armorType !== 'hard' ? (sq[key] || (!R0.isHeavy && !R0.isMortar && !R0.isArtillery && !R0.isFlamer ? sq.infantry : null)) : null;
      const crop = (src, n) => {   // tight crop of the opaque pixels, then fit into the frame
        const w = src.width, h = src.height, d = src.getContext('2d').getImageData(0, 0, w, h).data; let x0 = w, y0 = h, x1 = 0, y1 = 0;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 225) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        if (x1 <= x0) return false; const bw = x1 - x0 + 1, bh = y1 - y0 + 1, k = Math.min((S - 10) / bw, (S - 14) / bh) * (n || 1);
        g.drawImage(src, x0, y0, bw, bh, (S - bw * k) / 2, S - 6 - bh * k, bw * k, bh * k); return true;
      };
      if (mk) { if (!crop(TANK_SPR.get(mk, team, fa).hi)) return null; }
      else if (figs) {
        const tmp = TankBaker.mkCanvas(120, 90), tg = tmp.getContext('2d'), f2 = figs.slice(0, 3);
        (f2.length === 1 ? [[60, 72, 1]] : f2.length === 2 ? [[52, 66, .94], [70, 72, 1]] : [[49, 56, .88], [72, 58, .88], [60, 72, 1]]).forEach(([x, y, s], i) => { const e = INF_SPR.get(f2[i], fa).hi, w = e.width * .42 * s, h = e.height * .42 * s; tg.drawImage(e, x - w / 2, y - h * .86, w, h); });
        if (!crop(tmp, .96)) return null;
      } else return null;
      url = out.toDataURL();
    } catch (e) { url = null; }
    V101_PORT.set(ck, url); return url;
  }
  const v101Img = (key, team, cls) => { const u = v101Portrait(key, team); return u ? `<img class="v101-port${cls ? ' ' + cls : ''}" src="${u}" alt="">` : null; };
  
  /* updateBuildMenu: layer moved to js/chains/updateBuildMenu.js */
  
  /* previewUnit: layer moved to js/chains/previewUnit.js */
  new MutationObserver(() => {   // unit card: portrait before the name
    const nm = document.querySelector('#unit-card .us-nm'), u = selectedUnit; if (!nm || !u || nm.querySelector('.v101-port')) return;
    const im = v101Img(u.key, u.team, 'uc'); if (im) { const uc = nm.querySelector('.uc'); if (uc) uc.outerHTML = im; else nm.insertAdjacentHTML('afterbegin', im); }
  }).observe(document.getElementById('unit-card'), { childList: true, subtree: true });

