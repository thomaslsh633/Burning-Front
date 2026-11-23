  // [17'] v148–v149 — scale reference · one-storey town house · visual ground variants (Faymonville)
  //   Rules are untouched: terrainMap, movement, cover, sight and structure HP stay as they were.
  //   v148: SCALE_REF (1 hex = 7 m edge to edge, one hex side = 4.04 m); cover heights and trees rescaled to match the
  //         displayed men (units are drawn 1.4x the map scale); the town house is now one storey (HP 420, capacity 2 kept).
  //   v149: GROUND_VAR — per-hex visual ground variants (meadow, grass, dry grass, dirt yard, garden bed, flagstone,
  //         moss shade, stubble, vineyard rows) and wider gravel roads. Paint only; no movement-cost effect.
  const SCALE_REF = {
    hexM: 7, edgeM: 7 / Math.sqrt(3),
    mapPxM: () => Math.sqrt(3) * HEX_RADIUS / 7,          // px per metre of buildings and edge objects
    unitPxM: () => (typeof v117Hs === 'function' ? v117Hs() : 7),   // px per metre of men (exaggerated for readability)
    // per model kind: [horizontal, vertical] factor applied to the baked mesh
    model: { low_wall: [1, 1.65], balustrade: [1, 1.6], cypress: [1.15, 1.7], cypress2: [1.15, 1.7], tree: [2.0, 2.4] }   // walls reach the waist of a displayed man; trees 9 m
  };
  { const o_make148 = V146M.make;
    V146M.make = function (kind) {
      const M = o_make148.apply(this, arguments), s = SCALE_REF.model[kind];
      if (s && M && M.P) { const P = M.P; for (let i = 0; i < P.length; i += 3) { P[i] *= s[0]; P[i + 1] *= s[0]; P[i + 2] *= s[1]; } }
      return M;
    }; }
  V147_TOP.town = 6.8; V147_NAME.town = '타운하우스';

  // ---------- v149 ground variants ----------
  const GROUND_VAR_NAMES = ['grass', 'meadow', 'dry_grass', 'dirt', 'garden_bed', 'flagstone', 'moss_shade', 'stubble', 'vineyard_rows'];
  const GROUND_VAR = {   // summer colours; tx = per-pixel texture of v99Paint
    grass:         { rgb: [88, 106, 64],  tx: 0 },
    meadow:        { rgb: [106, 132, 66], tx: 0 },
    dry_grass:     { rgb: [146, 138, 86], tx: 0 },
    dirt:          { rgb: [128, 110, 82], tx: 9 },
    garden_bed:    { rgb: [98, 116, 62],  tx: 11 },
    flagstone:     { rgb: [150, 147, 138], tx: 2 },
    moss_shade:    { rgb: [64, 86, 50],   tx: 6 },
    stubble:       { rgb: [176, 160, 100], tx: 1 },
    vineyard_rows: { rgb: [96, 112, 60],  tx: 10 }
  };
  const V149 = { on: true, gv: null, roadW: 2.0, gravel: { road: [184, 176, 156], roadEdge: [138, 128, 106], rut: [156, 146, 124], roadMid: [206, 200, 184], dirt: [128, 110, 82] } };
  V99TXA[10] = .08; V99TXA[11] = .1;
  const v149Active = () => V149.on && typeof mapSelect !== 'undefined' && mapSelect.value === 'faymonville';
  function v149Assign__base(info) {
    const NN = COLS * ROWS, T = info.T, gv = new Int8Array(NN).fill(-1), idx = n => GROUND_VAR_NAMES.indexOf(n);
    const at = (c, r) => r * COLS + c, inStruct = (c, r) => typeof v147StructAt === 'function' ? v147StructAt(c, r) : null;
    const plainsLike = t => t === 'plains' || t === 'bush';
    // 1. natural ground by noise rank: 30 % grass · 40 % meadow · 20 % dry grass · 10 % dirt patches
    const cand = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const i = at(c, r); if (plainsLike(T[i])) cand.push([v99N(c * .23 + 3.1, r * .23 + 7.7) * .75 + v99N(c * .7 + 11, r * .7) * .25, i]); }
    cand.sort((a, b) => a[0] - b[0]);
    cand.forEach(([, i], k) => { const q = k / cand.length; gv[i] = idx(q < .3 ? 'grass' : q < .7 ? 'meadow' : q < .9 ? 'dry_grass' : 'dirt'); });
    // 2. fields: vineyard rows where the noise is high, stubble elsewhere
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const i = at(c, r); if (T[i] === 'field') gv[i] = idx(v99N(c * .3 + 5, r * .3 + 2) > .55 ? 'vineyard_rows' : 'stubble'); }
    // 3. forest edge → moss shade
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const i = at(c, r); if (!plainsLike(T[i])) continue;
      if (getHexNeighbors(c, r).some(n => T[at(n.c, n.r)] === 'forest')) gv[i] = idx('moss_shade'); }
    // 4. around buildings: door side (south) = dirt yard, other sides garden beds / meadow; town square = flagstone
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const s = inStruct(c, r); if (!s) continue;
      gv[at(c, r)] = idx('dirt');
      for (let e = 0; e < 6; e++) { const n = getNeighborByEdge(c, r, e); if (!n || inStruct(n.c, n.r)) continue; const j = at(n.c, n.r); if (!plainsLike(T[j])) continue;
        gv[j] = idx(s.kind === 'town' ? 'flagstone' : (e === 1 || e === 2) ? 'dirt' : (v99h(n.c, n.r, 5) < .55 ? 'garden_bed' : 'meadow')); } }
    return gv;
  }
  { 
    /* v99Info: layer moved to js/chains/v99Info.js */ }
  


