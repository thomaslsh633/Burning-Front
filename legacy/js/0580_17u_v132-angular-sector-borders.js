  // ══════════════════════════════════════════════════════════════
  // [17u] v132 — angular sector borders, round capture zones, out-of-bounds, Faymonville
  // ══════════════════════════════════════════════════════════════
  
  /* getTileMovementCost: layer moved to js/chains/getTileMovementCost.js */
  const v132P2D = typeof Path2D === 'function';
  
  // cached geometry: one hairline per shared hex edge, each team's outline along its territory edge, a fill path per sector
  
  
  /* v132DrawSectors: original body removed — replaced by a later layer (js/chains/v132DrawSectors.js) */
  // out-of-bounds hexes: darkened and hatched like the tactical map
  /* v132DrawOob: original body removed — replaced by a later layer (js/chains/v132DrawOob.js) */
  // capture zones: a true ground circle (ellipse on screen), one thin crisp line and a light fill
  function v132DrawZoneCircles() {
    const now = performance.now(), rm = reduceMotion(), px = 1 / zoom, step = v131FlatDist(getHexCenter(0, 0), getHexCenter(1, 0));
    capturePoints.forEach(cp => {
      const cs = cp.cores.map(k => getHexCenter(k[0], k[1])), x = cs.reduce((a, q) => a + q.x, 0) / cs.length, y = cs.reduce((a, q) => a + q.y, 0) / cs.length;
      const R = (cp.radius + .45) * step + Math.max(0, ...cs.map(q => v131FlatDist(q, { x, y })));
      if (x + R < camX - 20 || x - R > camX + VIEW_W + 20 || y + R < camY - 20 || y - R > camY + VIEW_H + 20) return;
      const f = forecast(cp), contested = f.st === 'contested', prog = (f.st === 'capture' || f.st === 'neutralize') ? f.tm : null;
      const rgb = contested ? '251,146,60' : prog ? zoneRgb(prog) : cp.owner ? zoneRgb(cp.owner) : '236,240,244';
      ctx.save(); ctx.beginPath(); ctx.ellipse(x, y, R, R * TILT, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${cp.owner || contested || prog ? rgb : '236,240,244'},${cp.owner ? .07 : .035})`; ctx.fill();
      ctx.lineWidth = (cp.owner && !contested && !prog ? 1.3 : 1.1) * px; ctx.strokeStyle = `rgba(${rgb},${cp.owner || contested || prog ? .9 : .6})`;
      if (contested || prog) { ctx.setLineDash([6 * px, 4 * px]); ctx.lineDashOffset = rm ? 0 : -(now / 50) % 20 * px; }
      else if (!cp.owner) ctx.setLineDash([3 * px, 4 * px]);
      ctx.stroke(); ctx.restore();
    });
  }
  /* drawZones: layer moved to js/chains/drawZones.js */
  // the older radius-based territory lines are replaced by the sectors
   /* v99Territory: layer moved to js/chains/v99Territory.js */
   /* drawTerritory: layer moved to js/chains/drawTerritory.js */

  // ---------- Faymonville (48×48): territory structure from the tactical-map reference, point-symmetric ----------
  // Reference sketch: 1000×1000 px, Allied HQ west, Axis HQ east. hex = 23.5 + (px − centre) × 0.05, centre (510, 528).
  // Points listed once; the twin is the 180° mirror (c, r) → (47 − c, 47 − r).
  const FAY_POINTS = [
    { cls: 'mun', yield: { m: 14 }, name: 'Bridge Dump', c: 25, r: 1, twin: 'Mill Dump' },
    { cls: 'mun', yield: { m: 14 }, name: 'Chapel Lane', c: 21, r: 10, twin: 'Orchard Lane' },
    { cls: 'mun', yield: { m: 14 }, name: 'North Farm', c: 35, r: 10, twin: 'South Farm' },
    { cls: 'mun', yield: { m: 14 }, name: 'Villa Garden', c: 27, r: 18, twin: 'Square Garden' },
    { cls: 'fuel', name: 'Sawmill', c: 16, r: 14, twin: 'Dairy' },
    { cls: 'fuel', name: 'Smithy', c: 27, r: 13, twin: 'Tannery' },
    { cls: 'manpower', yield: { g: 50 }, name: 'Calvary Cross', c: 33, r: 17, twin: 'Wayside Shrine' },
    { cls: 'manpower', yield: { g: 50 }, name: 'Gate House', c: 18, r: 20, twin: 'Well House' },
    { cls: 'vp', ownSector: true, name: 'Church', c: 28, r: 7, twin: 'Manor' }];
  /* loadFaymonville: original body removed — replaced by a later layer (js/chains/loadFaymonville.js) */

