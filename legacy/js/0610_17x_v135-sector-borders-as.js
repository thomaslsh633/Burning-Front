  // ══════════════════════════════════════════════════════════════
  // [17x] v135 — sector borders as straight lines through the hex-edge midpoints · Faymonville 64×64
  //   · borders: every region (sector or out-of-bounds) is traced into closed loops of hex edges; each loop becomes a polyline
  //     through the edge midpoints, keeping the corner vertex where three regions meet, and each run between two such corners
  //     is straightened (Douglas–Peucker, tolerance 1 hex radius) so a staircase of hex edges reads as one straight line. Both
  //     sides of a border use the same points, so fills, white hairlines, team outlines and the hatched out-of-bounds agree.
  //   · map: 64×64 hexes; the playable area spans 48 columns × 64 rows (≈ 7.8 : 9 on the ground, like the reference tactical map).
  //     River with a stone bridge along the north edge, lake south of the villa, both outside the playable area.
  //     Layout read off the reference tactical map: HQs west / east, 3 VPs north–south, 8 munition · 4 fuel · 4 manpower points;
  //     not mirrored. Buildings are placed at the map's building marks with estimated footprints (1–6 hexes).
  // ══════════════════════════════════════════════════════════════
  var V135 = { tol: 1.0 };
  function v135Geo() {
    const hv = typeof V137 !== 'undefined' ? V137.ver : 0; if (sectors._v135 && sectors._v135.hv === hv) return sectors._v135;
    const w = Math.sqrt(3) * HEX_RADIUS, R = HEX_RADIUS;
    const rid = (c, r) => { if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return -3; const t = terrainMap[c + ',' + r]; if (t && t.oob) return t.terrainType === 'deep_water' || t.terrainType === 'shallow_water' ? -5 : -2; const sc = sectorAt.get(c + ',' + r); return sc ? sc.id : -4; };
    const vtx = (c, r, i) => { const fx = ORIGIN_X + c * w + (r % 2) * (w / 2), fy = ORIGIN_Y + r * R * 1.5, a = (60 * i - 30) * Math.PI / 180; return [fx + R * Math.cos(a), fy + R * Math.sin(a)]; };
    const key = p => Math.round(p[0] * 10) + ',' + Math.round(p[1] * 10);
    const lift = typeof v137On === 'function' && v137On(), scr = p => ({ x: p[0] * COSA - p[1] * SINA + OFFX, y: (p[0] * SINA + p[1] * COSA) * TILT + OFFY - (lift ? v137H(p[0], p[1]) * LIFT * HZ : 0) });
    const dens = pts => { if (!lift) return pts; const o = [pts[0]]; for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 10)); for (let k = 1; k <= n; k++) o.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); } return o; };   // v137: points follow the slopes
    const regions = new Map();   // region id → directed boundary edges
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const id = rid(c, r); if (id === -4) continue;
      for (let e = 0; e < 6; e++) {
        const n = getNeighborByEdge(c, r, e), nb = n ? rid(n.c, n.r) : -3; if (nb === id) continue;
        const a = vtx(c, r, e), b = vtx(c, r, (e + 1) % 6); let L = regions.get(id); if (!L) regions.set(id, L = []);
        L.push({ a, b, ka: key(a), kb: key(b), nb });
      }
    }
    // Douglas–Peucker on flat points, endpoints kept
    const dp = (pts, tol) => {
      if (pts.length < 3) return pts.slice();
      const A = pts[0], B = pts[pts.length - 1], dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1; let mi = 0, md = -1;
      for (let i = 1; i < pts.length - 1; i++) { const d = Math.abs((pts[i][0] - A[0]) * dy - (pts[i][1] - A[1]) * dx) / L; if (d > md) { md = d; mi = i; } }
      if (md <= tol) return [A, B];
      const l = dp(pts.slice(0, mi + 1), tol), r = dp(pts.slice(mi), tol); return l.slice(0, -1).concat(r);
    };
    const tol = V135.tol * R, out = { runs: [], fills: new Map(), hv };
    regions.forEach((E, id) => {
      const from = new Map(); E.forEach((ed, i) => { const l = from.get(ed.ka); if (l) l.push(i); else from.set(ed.ka, [i]); });
      const used = new Uint8Array(E.length), path = v132P2D ? new Path2D() : null;
      for (let s = 0; s < E.length; s++) {
        if (used[s]) continue;
        const loop = []; let i = s;
        while (i !== undefined && !used[i]) { used[i] = 1; loop.push(E[i]); const nx = (from.get(E[i].kb) || []).find(j => !used[j]); i = nx; }
        // runs of edges with the same neighbour region; each run starts / ends at the corner vertex where the neighbour changes
        let st = 0; for (let k = 0; k < loop.length; k++) if (loop[k].nb !== loop[(k - 1 + loop.length) % loop.length].nb) { st = k; break; }
        const rot = loop.slice(st).concat(loop.slice(0, st)), runs = [];
        let cur = null; rot.forEach(ed => { if (!cur || cur.nb !== ed.nb) { cur = { nb: ed.nb, pts: [ed.a] }; runs.push(cur); } cur.pts.push([(ed.a[0] + ed.b[0]) / 2, (ed.a[1] + ed.b[1]) / 2]); cur.end = ed.b; });
        let poly = [];
        if (runs.length === 1) {   // closed border with a single neighbour: midpoints only, anchored on two fixed points
          const m = runs[0].pts.slice(1); let ai = 0; m.forEach((p, k) => { if (p[0] < m[ai][0] || (p[0] === m[ai][0] && p[1] < m[ai][1])) ai = k; });
          const ring = m.slice(ai).concat(m.slice(0, ai)); let bi = 0, bd = -1; ring.forEach((p, k) => { const d = Math.hypot(p[0] - ring[0][0], p[1] - ring[0][1]); if (d > bd) { bd = d; bi = k; } });
          const h1 = dp(ring.slice(0, bi + 1), tol), h2 = dp(ring.slice(bi).concat([ring[0]]), tol); poly = h1.slice(0, -1).concat(h2.slice(0, -1));
          out.runs.push({ id, nb: runs[0].nb, pts: dens(poly.concat([poly[0]])).map(scr) });
        } else runs.forEach(rn => { const p = dp(rn.pts.concat([rn.end]), tol); poly = poly.concat(p.slice(0, -1)); out.runs.push({ id, nb: rn.nb, pts: dens(p).map(scr) }); });
        if (path && poly.length > 2) { dens(poly.concat([poly[0]])).map(scr).forEach((q, k) => k ? path.lineTo(q.x, q.y) : path.moveTo(q.x, q.y)); path.closePath(); }
      }
      if (path) out.fills.set(id, path);
    });
    sectors._v135 = out; return out;
  }
  const v135Lines = runs => { ctx.beginPath(); runs.forEach(rn => rn.pts.forEach((q, k) => k ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); };
  /* v132DrawSectors: layer moved to js/chains/v132DrawSectors.js */
  { 
    /* v132DrawOob: layer moved to js/chains/v132DrawOob.js */ }

  // ---------- Faymonville 64×64 (playable 48 × 64) ----------
  // reference tactical map (1000 px): x 120…920 → columns 8…56, y 15…985 → rows 0…64
  const FAY2 = {
    points: [
      { cls: 'vp', ownSector: true, name: 'Mill Bridge', x: 558, y: 178 }, { cls: 'vp', ownSector: true, name: 'Town Square', x: 508, y: 476 }, { cls: 'vp', ownSector: true, name: 'Villa', x: 430, y: 810 },
      { cls: 'mun', yield: { m: 14 }, name: 'Bridge Dump', x: 565, y: 85 }, { cls: 'mun', yield: { m: 14 }, name: 'Chapel Lane', x: 462, y: 210 }, { cls: 'mun', yield: { m: 14 }, name: 'Well House', x: 560, y: 370 },
      { cls: 'mun', yield: { m: 14 }, name: 'North Farm', x: 740, y: 250 }, { cls: 'mun', yield: { m: 14 }, name: 'Orchard', x: 478, y: 598 }, { cls: 'mun', yield: { m: 14 }, name: 'Sawmill', x: 290, y: 775 },
      { cls: 'mun', yield: { m: 14 }, name: 'Vineyard', x: 540, y: 770 }, { cls: 'mun', yield: { m: 14 }, name: 'Boathouse', x: 470, y: 930 },
      { cls: 'fuel', name: 'Smithy', x: 380, y: 325 }, { cls: 'fuel', name: 'Dairy', x: 578, y: 293 }, { cls: 'fuel', name: 'Tannery', x: 430, y: 675 }, { cls: 'fuel', name: 'Garage', x: 680, y: 722 },
      { cls: 'manpower', yield: { g: 50 }, name: 'Calvary Cross', x: 405, y: 488 }, { cls: 'manpower', yield: { g: 50 }, name: 'Gate House', x: 708, y: 382 },
      { cls: 'manpower', yield: { g: 50 }, name: 'Wayside Shrine', x: 598, y: 570 }, { cls: 'manpower', yield: { g: 50 }, name: 'Cart Track', x: 318, y: 632 }],
    // buildings at the map's marks — [x, y, hexes, label]; estimated footprints (1 hex = 7 m)
    houses: [[548, 122, 3, 'stone mill house by the bridge'], [473, 287, 2, 'farmhouse'], [497, 420, 3, 'three-storey town house'], [770, 318, 2, 'farmhouse'],
      [275, 682, 2, 'farmhouse'], [220, 775, 1, 'shed'], [518, 700, 2, 'cottage'], [548, 838, 2, 'open barn'], [430, 883, 6, 'villa'], [447, 945, 1, 'boathouse']],
    area: [[500, 70], [588, 70], [628, 70], [640, 100], [760, 175], [812, 250], [812, 415], [920, 425], [920, 650], [800, 705], [750, 760], [640, 870], [560, 935],
      [470, 962], [390, 962], [300, 880], [165, 790], [162, 650], [125, 600], [123, 330], [250, 298], [330, 230], [410, 195], [470, 120]],
    bridge: [597, 0, 619, 110],
    river: [[0, 290], [150, 250], [280, 190], [380, 120], [460, 62], [540, 40], [610, 50], [700, 105], [820, 160], [1000, 210]],
    lake: [510, 1010, 125],
    roads: [[[0, 690], [160, 640], [330, 560], [510, 500], [700, 445], [1000, 425]], [[608, 20], [608, 110], [640, 260], [625, 440], [600, 580], [590, 720], [620, 1000]],
      [[500, 95], [500, 300], [505, 470]], [[153, 493], [240, 520], [330, 560]], [[866, 563], [800, 540], [700, 520], [625, 500]], [[330, 560], [380, 700], [420, 820], [440, 960]], [[165, 780], [300, 760], [420, 820]]],
    hq: { blue: [153, 493], red: [866, 563] }
  };
  /* loadFaymonville: layer moved to js/chains/loadFaymonville.js */

