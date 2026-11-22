  // ══════════════════════════════════════════════════════════════
  // [v190] While a direction is being picked (drag or open turn stage) the red range tiles follow the proposed firing arc
  //   (crew weapons and fixed-gun tanks; the amber tiles are the secondary weapon). The static range view of the long press is switched off meanwhile.
  // ══════════════════════════════════════════════════════════════
  var V190 = { key: '', tiles: [] };
  const v190Arc = u => !!u && (v188Aimable(u) || v184Fixed(u));
  function v190Tiles(u, a) {
    const key = [u.id, u.c, u.r, Math.round(a * 400), u.range, u.minRange || 0].join('|');
    if (V190.key === key) return V190.tiles;
    const save = u.facingAngle, out = []; u.facingAngle = a;
    try {
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const d = getDistance(u.c, u.r, c, r);
        if (d >= Math.max(1, u.minRange || 0) && d <= u.range && isInFiringArc(u, c, r)) out.push({ c, r });
        else if (d >= 1 && subReach(u, c, r, d)) out.push({ c, r, sub: true });
      }
    } finally { u.facingAngle = save; }
    V190.key = key; V190.tiles = out; return out;
  }
  function v190DrawAimTiles() {
    const u = V185.rot && isDraggingFacing ? V185.rot.u : (V185.pend && V185.pend.kind === 'turn' ? V185.pend.u : null);
    if (!v190Arc(u) || u.hp <= 0) return;
    const a = v185Ghost(u); if (a === null) return;
    v190Tiles(u, a).forEach(t => { const { x, y } = getHexCenter(t.c, t.r);
      if (t.sub) drawHexPolygon(x, y, HEX_RADIUS - 1, 'rgba(245, 158, 11, 0.30)', '#f59e0b', 1.5);
      else drawHexPolygon(x, y, HEX_RADIUS - 1, 'rgba(239, 68, 68, 0.38)', '#ef4444', 1.5); });
  }
  {  /* v185Drag: layer moved to js/chains/v185Drag.js */ }

