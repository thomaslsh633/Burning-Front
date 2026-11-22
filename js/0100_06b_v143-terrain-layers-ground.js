  // ══════════════════════════════════════════════════════════════
  // [06b] v143 — terrain layers: ground / cell objects / edge objects (data only, no rule change)
  //     · GROUND_DEFS, OBJ_DEFS, EDGE_DEFS — catalog: height 0–3, cover, sight, movement
  //     · encodeCell(ter) legacy terrainMap entry → layered cell { ground, elev, objects, edges }
  //     · decodeCell(cell) layered cell → legacy shape { terrainType, elevation, cover, name, code, defense, inf, veh, sightBlock }
  //     · getCell(c, r) cached layered view, cellTop(c, r) ground + tallest object (for v144 sight lines)
  //     · layerProbe() parity check against terrainMap / TERRAIN_DEFS on every cell
  //   terrainMap stays the source of truth in v143; every existing reader is untouched.
  //   hedge / fence / sandbag are still whole-cell objects here and move to edges in v145.
  // ══════════════════════════════════════════════════════════════
  const LAYERS = { ver: 147, sight: true, conceal: true, obscure: 0.85, elevH: 2, edgeCover: true };   // v144: sight / conceal switches (settings), obscured hit ×0.85, one elevation step = 2 height units
  // cover grades: none / light (= legacy 'yellow') / heavy (= legacy 'hard')
  const COV_RANK = { none: 0, light: 1, heavy: 2 }, COV_LEGACY = { none: 'none', light: 'yellow', heavy: 'hard' }, COV_NEW = { none: 'none', yellow: 'light', hard: 'heavy' };
  // ground: movement and colour only — never cover or sight
  const GROUND_DEFS = {
    plains: { inf: 1, veh: 2 }, road: { inf: 1, veh: 1 }, cobblestone: { inf: 1, veh: 1 }, field: { inf: 1, veh: 2 },
    snow: { inf: 2, veh: 2 }, ice: { inf: 2, veh: 1 }, desert: { inf: 2, veh: 2 },
    shallow_water: { inf: 2, veh: 3, water: true }, deep_water: { inf: Infinity, veh: Infinity, water: true }
  };
  // cell objects — h: 0 floor · 1 below knee · 2 man height · 3 above a man
  //   sight: none / partial (v144: "obscured") / block;  inf / veh: absolute movement cost (omitted = keep the ground's)
  //   tt: legacy terrainType the object stands for (compat adapter); top: replaces every object below it (legacy whole-cell types)
  const OBJ_DEFS = {
    crater:     { h: 0, cover: 'light', sight: 'none',    inf: 1, veh: 2, tt: 'crater', top: true },
    trench:     { h: 0, cover: 'heavy', sight: 'none',    inf: 1, veh: 3, tt: 'trench', top: true },
    bush:       { h: 1, cover: 'light', sight: 'none',    inf: 1, veh: 2, tt: 'bush', top: true },
    dune:       { h: 1, cover: 'light', sight: 'none',    inf: 2, veh: 3, tt: 'dune', top: true, ground: 'desert' },
    rubble:     { h: 2, cover: 'light', sight: 'partial', inf: 1, veh: 3, tt: 'rubble', top: true },
    tree_stand: { h: 3, tt: 'forest', top: true,   // by density 1–3; legacy forest = density 2
      dens: { 1: { cover: 'light', sight: 'partial', inf: 2, veh: 2 }, 2: { cover: 'light', sight: 'block', inf: 2, veh: 3 }, 3: { cover: 'heavy', sight: 'block', inf: 2, veh: Infinity } } },
    rock:       { h: 3, cover: 'heavy', sight: 'block',   inf: 3, veh: Infinity, tt: 'rock', top: true },
    building:   { h: 3, cover: 'heavy', sight: 'block',   inf: 1, veh: Infinity, tt: 'building', top: true },   // v146: footprint roles core / annex / yard
    // legacy whole-cell linear objects (→ EDGE_DEFS in v145)
    hedge:      { h: 2, cover: 'light', sight: 'partial', inf: 2, veh: 2, tt: 'hedge', top: true, edge: 'hedge' },
    fence:      { h: 1, cover: 'light', sight: 'none',    inf: 2, veh: 1, tt: 'fence', top: true, edge: 'fence' },   // v145 edge fence: no cover
    sandbag:    { h: 1, cover: 'heavy', sight: 'none', name: '샌드백 진지', code: '☲', edge: 'sandbag_row' }   // keeps the cell's terrain and movement
  };
  // edge objects (between two cells) — catalog only in v143; placed and read from v145
  //   cross: extra movement to step over the edge (veh Infinity = vehicles cannot cross)
  const EDGE_DEFS = {
    hedge:       { h: 2, cover: 'light', sight: 'partial', cross: { inf: 1, veh: 1 }, burns: true },
    fence:       { h: 1, cover: 'none',  sight: 'none',    cross: { inf: 0, veh: 0 }, breaks: true },
    stone_wall:  { h: 2, cover: 'heavy', sight: 'block',   cross: { inf: 1, veh: Infinity }, breaks: true },
    sandbag_row: { h: 1, cover: 'heavy', sight: 'none',    cross: { inf: 1, veh: 1 } },
    wire:        { h: 1, cover: 'none',  sight: 'none',    cross: { inf: 2, veh: 0 }, breaks: true }
  };
  const HEX_EDGE_DIRS = ['e', 'se', 'sw', 'w', 'nw', 'ne'];   // index = getNeighborByEdge edge index
  const objDef = o => { const d = OBJ_DEFS[o.kind] || {}; return d.dens ? Object.assign({}, d, d.dens[o.density || 2]) : d; };
  const TT_TO_OBJ = {}; Object.keys(OBJ_DEFS).forEach(k => { const d = OBJ_DEFS[k]; if (d.tt) TT_TO_OBJ[d.tt] = k; });
  let layerSeq = 0;

  // legacy terrainMap entry → layered cell
  function encodeCell(ter) {
    ter = ter || { terrainType: 'plains', elevation: 0, cover: 'none', defense: 0 };
    const tt = ter.terrainType, cell = { ground: 'plains', elev: ter.elevation || 0, objects: [], edges: {} };
    const add = (kind, extra) => cell.objects.push(Object.assign({ id: 'o' + (++layerSeq), kind }, extra));
    if (GROUND_DEFS[tt]) cell.ground = tt;
    else if (TT_TO_OBJ[tt]) {
      const k = TT_TO_OBJ[tt], d = OBJ_DEFS[k], orig = ter.fort && ter.fort.orig;
      // ground under a legacy object: what the fort replaced, else the object's own ground, else plains
      cell.ground = orig && GROUND_DEFS[orig.terrainType] ? orig.terrainType : (d.ground || 'plains');
      add(k, Object.assign(k === 'tree_stand' ? { density: 2 } : {}, ter.fort && k === 'trench' ? { fort: true, team: ter.fort.team } : {}));
    } else cell.ground = 'plains';
    // sandbag position: legacy keeps terrainType and raises cover to hard
    if (ter.fort && tt !== 'trench') add('sandbag', { fort: true, team: ter.fort.team });
    return cell;
  }

  // layered cell → legacy shape (what getTerrain returns today, plus movement and sight)
  function decodeCell(cell) {
    const g = GROUND_DEFS[cell.ground] || GROUND_DEFS.plains;
    let tt = cell.ground, inf = g.inf, veh = g.veh, cov = 'none', sight = 'none', name = null, code = null, defense = 0;
    cell.objects.forEach(o => {
      const d = objDef(o);
      if (d.top) { tt = d.tt; cov = 'none'; sight = 'none'; }
      if (d.inf !== undefined) inf = d.inf;
      if (d.veh !== undefined) veh = d.veh;
      if (COV_RANK[d.cover] > COV_RANK[cov]) cov = d.cover;
      if (d.sight === 'block' || (d.sight === 'partial' && sight === 'none')) sight = d.sight;
      if (d.name) { name = d.name; code = d.code; }
      if (o.fort) defense = 24;
    });
    const td = TERRAIN_DEFS[tt] || TERRAIN_DEFS.plains;
    return { terrainType: tt, elevation: cell.elev, cover: COV_LEGACY[cov], name: name || td.name, code: code !== null ? code : td.code, defense,
      inf, veh, sightBlock: sight === 'block', sight };
  }

  // cached layered view of terrainMap (re-encoded when the entry object or its key fields change)
  const LAYER_CACHE = new Map();
  function getCell(c, r) {
    const key = c + ',' + r, t = terrainMap[key];
    if (!t) return encodeCell(null);
    const sig = t.terrainType + '|' + t.cover + '|' + t.elevation + '|' + t.name + '|' + (t.fort ? t.fort.team : '');
    let e = LAYER_CACHE.get(key);
    if (!e || e.src !== t || e.sig !== sig) { e = { src: t, sig, cell: encodeCell(t), ev: -1 }; LAYER_CACHE.set(key, e); }
    if (e.ev !== EDGE_VER) { e.cell.edges = edgesOf(c, r); e.ev = EDGE_VER; }   // v145
    return e.cell;
  }
  // height of the tallest thing in a cell, in elevation steps (object h 3 ≈ one elevation step)
  function cellTop(c, r) {
    const cell = getCell(c, r); let h = 0;
    cell.objects.forEach(o => { h = Math.max(h, objDef(o).h || 0); });
    return { elev: cell.elev, objH: h };
  }



  // ---------- v145: edge objects (between two cells) ----------
  //   EDGES: canonical pair key → { kind }; cell.edges (getCell) mirrors them by direction (e, se, sw, w, nw, ne)
  let EDGES = new Map(), EDGE_VER = 0;
  const edgeKey = (c1, r1, c2, r2) => (r1 < r2 || (r1 === r2 && c1 < c2)) ? c1 + ',' + r1 + '>' + c2 + ',' + r2 : c2 + ',' + r2 + '>' + c1 + ',' + r1;
  const getEdge = (c1, r1, c2, r2) => EDGES.get(edgeKey(c1, r1, c2, r2)) || null;
  function setEdge(c1, r1, c2, r2, kind) { const k = edgeKey(c1, r1, c2, r2); if (kind) EDGES.set(k, { kind }); else EDGES.delete(k); EDGE_VER++; }
  function edgesOf(c, r) {
    const out = {};
    for (let e = 0; e < 6; e++) { const n = getNeighborByEdge(c, r, e); const x = n && getEdge(c, r, n.c, n.r); if (x) out[HEX_EDGE_DIRS[e]] = x; }
    return out;
  }
  // v147: effective edge by damage stage — 0 intact · 1 damaged (heavy → light, no crossing cost, sight one class lower) · 2 destroyed (nothing)
  const EDGE_HP = { hedge: 40, fence: 25, stone_wall: 120, sandbag_row: 80, wire: 30, low_wall: 50, balustrade: 50 };
  function edgeDef(e) {
    const d = e && EDGE_DEFS[e.kind]; if (!d) return null; const st = e.st || 0; if (!st) return d;
    if (st >= 2) return { h: 0, cover: 'none', sight: 'none', cross: { inf: 0, veh: 0 } };
    return { h: Math.max(0, d.h - 1), cover: d.cover === 'heavy' ? 'light' : d.cover, sight: d.sight === 'block' ? 'partial' : 'none', cross: { inf: 0, veh: d.cross.veh === Infinity ? 1 : 0 } };
  }
  // the edge a shot crosses last before reaching def (adjacent fire: the shared edge)
  function entryEdge(att, def) {
    const line = hexLine(att.c, att.r, def.c, def.r); if (line.length < 2) return null;
    const [pc, pr] = line[line.length - 2]; return getEdge(pc, pr, def.c, def.r);
  }
  const covMax = (a, b) => COV_RANK[COV_NEW[b] || 'none'] > COV_RANK[COV_NEW[a] || 'none'] ? b : a;
  // cover (legacy grades none / yellow / hard) a unit has against one shooter:
  //   cell objects + building (any direction) and the edge object on the shot's entry edge — the higher one
  function coverVs(def, att) {
    const cell = (getTerrain(def.c, def.r) || {}).cover || 'none';
    if (!att || !LAYERS.edgeCover || (att.c === def.c && att.r === def.r)) return cell;
    const e = entryEdge(att, def), d = edgeDef(e);
    return d ? covMax(cell, COV_LEGACY[d.cover]) : cell;
  }
  // best cover around a unit over all six directions (banner shield when no shooter is in focus)
  function coverBest(u) {
    let cv = (getTerrain(u.c, u.r) || {}).cover || 'none';
    if (LAYERS.edgeCover) Object.values(edgesOf(u.c, u.r)).forEach(e => { const d = edgeDef(e); if (d) cv = covMax(cv, COV_LEGACY[d.cover]); });
    return cv;
  }
  // map load: legacy whole-cell hedge / fence lines → one run of edges along the line's left side; the cells become plain ground
  function linearCellsToEdges() {
    const done = new Set(), made = { hedge: 0, fence: 0 }, cells = { hedge: 0, fence: 0 };
    ['hedge', 'fence'].forEach(kind => {
      for (const key in terrainMap) {
        const t0 = terrainMap[key]; if (t0.terrainType !== kind || t0.oob || done.has(key)) continue;
        const comp = [], st = [key]; done.add(key);
        while (st.length) { const k = st.pop(); comp.push(k.split(',').map(Number)); const [c, r] = comp[comp.length - 1];
          getHexNeighbors(c, r).forEach(n => { const nk = n.c + ',' + n.r, nt = terrainMap[nk]; if (nt && nt.terrainType === kind && !nt.oob && !done.has(nk)) { done.add(nk); st.push(nk); } }); }
        const inComp = (c, r) => comp.some(x => x[0] === c && x[1] === r), P = comp.map(([c, r]) => getHexCenter(c, r));
        let a = 0, b = 0, best = -1;
        for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) { const d = Math.hypot(P[i].x - P[j].x, P[i].y - P[j].y); if (d > best) { best = d; a = i; b = j; } }
        comp.forEach(([c, r], i) => {
          if (comp.length === 1) {   // a lone piece: two adjacent edges
            const e0 = Math.floor(((c * 73856093) ^ (r * 19349663)) >>> 0) % 6;
            [e0, (e0 + 1) % 6].forEach(e => { const n = getNeighborByEdge(c, r, e); if (n && !(terrainMap[n.c + ',' + n.r] || {}).oob) { setEdge(c, r, n.c, n.r, kind); made[kind]++; } });
            return;
          }
          const vx = P[b].x - P[a].x, vy = P[b].y - P[a].y, vl = Math.hypot(vx, vy) || 1;
          for (let e = 0; e < 6; e++) {
            const n = getNeighborByEdge(c, r, e); if (!n || inComp(n.c, n.r) || (terrainMap[n.c + ',' + n.r] || {}).oob) continue;
            const q = getHexCenter(n.c, n.r), dx = q.x - P[i].x, dy = q.y - P[i].y;
            if ((vx * dy - vy * dx) / (vl * (Math.hypot(dx, dy) || 1)) > 0.3 && !getEdge(c, r, n.c, n.r)) { setEdge(c, r, n.c, n.r, kind); made[kind]++; }
          }
        });
        comp.forEach(([c, r]) => { const t = terrainMap[c + ',' + r], d = TERRAIN_DEFS.plains; setTerrain(c, r, 'plains', t.elevation, d.cover, d.name, d.code, 0); cells[kind]++; });
      }
    });
    return { cells, edges: made };
  }

  // ---------- v144: sight lines ----------
  // eye height (object-height units): infantry 1.5, vehicle 2, building 3; the target is aimed at 1 above its ground
  const eyeOf = s => (s && s.type && BLD[s.type]) ? 3 : (s && s.armorType === 'hard' ? 2 : 1.5);
  // what stands in a cell: tallest object height and its strongest sight class
  function cellSight(c, r) {
    const cell = getCell(c, r); let h = 0, sight = 'none';
    cell.objects.forEach(o => { const d = objDef(o); h = Math.max(h, d.h || 0); if (d.sight === 'block' || (d.sight === 'partial' && sight === 'none')) sight = d.sight; });
    return { elev: cell.elev, h, sight };
  }
  // straight line a → b: { block, obscured, at }; the two end cells never block
  //   height of the line = observer ground + eye → target ground + 1 (linear); a cell blocks when its ground (ridge)
  //   or ground + object top rises above it; sight 'partial' objects only obscure; low objects (h ≤ 2) next to the observer are ignored
  function sightLine(ac, ar, bc, br, eye) {
    const line = hexLine(ac, ar, bc, br), n = line.length - 1, E = LAYERS.elevH;
    if (n <= 1) return { block: false, obscured: false };
    const z0 = getCell(ac, ar).elev * E + (eye || 1.5), z1 = getCell(bc, br).elev * E + 1;
    let obscured = false;
    for (let i = 1; i < n; i++) {
      const [c, r] = line[i], cs = cellSight(c, r), z = z0 + (z1 - z0) * i / n, g = cs.elev * E;
      if (i >= 2) {   // v145: edge crossed between line[i-1] and line[i] (the observer's own edge and the target's entry edge never count)
        const ed = getEdge(line[i - 1][0], line[i - 1][1], c, r), dd = edgeDef(ed);
        if (dd && dd.sight !== 'none') { const ze = z0 + (z1 - z0) * (i - .5) / n, ge = Math.max(cs.elev, getCell(line[i - 1][0], line[i - 1][1]).elev) * E;
          if (ge + dd.h > ze) { if (dd.sight === 'block') return { block: true, obscured, at: line[i - 1].join(',') + '>' + c + ',' + r, why: 'edge' }; obscured = true; } }
      }
      if (g > z) return { block: true, obscured, at: c + ',' + r, why: 'ridge' };
      if (cs.sight === 'none' || g + cs.h <= z || (i === 1 && cs.h <= 2)) continue;
      if (cs.sight === 'block') return { block: true, obscured, at: c + ',' + r, why: 'object' };
      obscured = true;
    }
    return { block: false, obscured };
  }
  // direct line of fire from a unit / building to a hex (always true with sight blocking off)
  const losClear = (a, c, r) => !LAYERS.sight || !sightLine(a.c, a.r, c, r, eyeOf(a)).block;
  // concealment: a unit in bush / trees / a building is seen by enemies only this close (0 = not concealed)
  function concealOf(c, r) {
    let k = 0;
    getCell(c, r).objects.forEach(o => { const v = o.kind === 'bush' ? 2 : o.kind === 'tree_stand' ? (o.density >= 3 ? 1 : 2) : o.kind === 'building' ? 1 : 0; if (v) k = k ? Math.min(k, v) : v; });
    return k;
  }

  // parity check: every cell decodes back to the same terrainType / cover / elevation / name / code / defense,
  // and the catalog's movement and sight match TERRAIN_DEFS. Returns { cells, combat, bad, ground, objects }.
  function layerProbe() {
    LAYER_CACHE.clear();
    const res = { cells: 0, combat: 0, bad: [], ground: {}, objects: {} };
    for (const key in terrainMap) {
      const t = terrainMap[key], [c, r] = key.split(',').map(Number), cell = getCell(c, r), d = decodeCell(cell), td = TERRAIN_DEFS[t.terrainType] || {};
      res.cells++; if (!t.oob) res.combat++;
      if (!t.oob) { res.ground[cell.ground] = (res.ground[cell.ground] || 0) + 1; cell.objects.forEach(o => { res.objects[o.kind] = (res.objects[o.kind] || 0) + 1; }); }
      const diff = [];
      ['terrainType', 'elevation', 'cover', 'name', 'code', 'defense'].forEach(f => { if ((d[f] || 0) !== (t[f] || 0)) diff.push(f + ': ' + t[f] + ' → ' + d[f]); });
      if (d.inf !== td.inf) diff.push('inf: ' + td.inf + ' → ' + d.inf);
      if (d.veh !== td.veh) diff.push('veh: ' + td.veh + ' → ' + d.veh);
      if (d.sightBlock !== !!td.sightBlock) diff.push('sightBlock: ' + td.sightBlock + ' → ' + d.sightBlock);
      if (diff.length) res.bad.push(key + ' ' + diff.join(', '));
    }
    return res;
  }

