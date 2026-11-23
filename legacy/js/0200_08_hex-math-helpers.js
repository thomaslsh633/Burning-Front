  // ══════════════════════════════════════════════════════════════
  // [08] 헥스 수학 · 공용 헬퍼
  //     · getHexCenter/getDistance/getHexAtPixel/getHexNeighbors/getHexVertices, faceToward, ring/bldAt/hq/uById 등
  // ══════════════════════════════════════════════════════════════


  function getHexCenter__base(col, row) {
    const w = Math.sqrt(3) * HEX_RADIUS;
    const h = 2 * HEX_RADIUS;
    const fx = ORIGIN_X + col * w + (row % 2) * (w / 2), fy = ORIGIN_Y + row * (h * 0.75);
    const ter = terrainMap[`${col},${row}`];
    return { x: fx * COSA - fy * SINA + OFFX, y: (fx * SINA + fy * COSA) * TILT + OFFY - (ter ? ter.elevation * LIFT * HZ : 0) };
  }
  function offsetToCube(c, r) {
    const q = c - (r - (r & 1)) / 2;
    return { q, r, s: -q - r };
  }
  function getDistance(c1, r1, c2, r2) {
    const a = offsetToCube(c1, r1);
    const b = offsetToCube(c2, r2);
    return (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.s - b.s)) / 2;
  }
  function getHexAtPixel(px, py) {
    const worldX = px / zoom + camX;
    const worldY = py / zoom + camY;
    let closest = null;
    let minDist = HEX_RADIUS * 0.95;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const center = getHexCenter(c, r);
        const dist = Math.hypot(...Object.values(unproj(worldX - center.x, worldY - center.y)));
        if (dist < minDist) { minDist = dist; closest = { c, r }; }
      }
    }
    return closest;
  }
  function getUnitAt(c, r) { return units.find(u => u.hp > 0 && !u.isLoaded && ((u.c === c && u.r === r) || (u.cells && u.cells.some(q => q[0] === c && q[1] === r)))); }   // v212: large emplacement footprint
  function getCapturePointAt(c, r) { return capturePoints.find(p => p.c === c && p.r === r); }


  function getHexNeighbors(c, r) {
    const isOdd = r % 2 !== 0;
    const offsets = isOdd ? [
      [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 0]
    ] : [
      [-1, -1], [0, -1], [1, 0], [0, 1], [-1, 1], [-1, 0]
    ];
    const res = [];
    offsets.forEach(([dc, dr]) => {
      const nc = c + dc; const nr = r + dr;
      if (nc >= 0 && nc < COLS && nr >= 0 && nr < ROWS) res.push({ c: nc, r: nr });
    });
    return res;
  }


  function getNeighborByEdge(c, r, edgeIdx) {
    const isOdd = r % 2 !== 0;
    let dc = 0, dr = 0;
    if (edgeIdx === 0) { dc = 1; dr = 0; }
    else if (edgeIdx === 1) { dc = isOdd ? 1 : 0; dr = 1; }
    else if (edgeIdx === 2) { dc = isOdd ? 0 : -1; dr = 1; }
    else if (edgeIdx === 3) { dc = -1; dr = 0; }
    else if (edgeIdx === 4) { dc = isOdd ? 0 : -1; dr = -1; }
    else if (edgeIdx === 5) { dc = isOdd ? 1 : 0; dr = -1; }
    const nc = c + dc; const nr = r + dr;
    if (nc >= 0 && nc < COLS && nr >= 0 && nr < ROWS) return { c: nc, r: nr };
    return null;
  }


  function getHexVertices(cx, cy, radius) {
    const verts = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30);
      const o = isoD(radius * Math.cos(angle), radius * Math.sin(angle));
      verts.push({ x: cx + o.x, y: cy + o.y });
    }
    return verts;
  }
  function faceToward__base(u, c, r) {
    const a = getHexCenter(u.c, u.r), b = getHexCenter(c, r), v = unproj(b.x - a.x, b.y - a.y);
    if (v.x || v.y) u.facingAngle = Math.atan2(v.y, v.x);
  }

  // ===== 2차 적용: 패키지 · 스킬 · 연막 · 오프맵 · 교리 · 배틀그룹 =====
  const T2 = o => o[currentTurn];
  const ring = (c, r, rad) => { const a = []; for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (getDistance(c, r, x, y) <= rad) a.push({ c: x, r: y }); return a; };
  const visH = h => visibleHexes.has(`${h.c},${h.r}`);
  const bldAt = h => getBuildingAt(h.c, h.r);   // v151: footprint
  const emptyH = h => !getUnitAt(h.c, h.r) && !bldAt(h) && getTileMovementCost({ armorType: 'hard' }, h.c, h.r, h.c, h.r) !== Infinity;
  const hq = tm => buildings.find(b => b.team === tm && b.type === 'hq' && b.hp > 0);
  const inSmoke = u => smokes.some(x => x.hexes.some(h => h.c === u.c && h.r === u.r));
  const uById = id => units.find(x => String(x.id) === String(id));
  const hint2 = t => { if (/^[❌➡]/.test(t)) toast(t.replace(/^[❌➡]\s*/, '')); };

