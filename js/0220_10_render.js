  // ══════════════════════════════════════════════════════════════
  // [10] 렌더링
  //     · 지형 · 유닛 아트(drawUnitArt) · 건물 · 배너/상태 아이콘 · 영역선/연막 해칭 · render()(+래핑 체인)
  // ══════════════════════════════════════════════════════════════


  function drawHexPolygon(cx, cy, radius, fillColor, strokeColor, lineWidth = 1) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30);
      const o = isoD(radius * Math.cos(angle), radius * Math.sin(angle));
      const px = cx + o.x, py = cy + o.y;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    if (fillColor) { ctx.fillStyle = fillColor; ctx.fill(); }
    if (strokeColor) { ctx.strokeStyle = strokeColor; ctx.lineWidth = lineWidth; ctx.stroke(); }
  }


  function drawTopographicTile(c, r) {
    const center = getHexCenter(c, r);
    if (center.x < camX - 40 || center.x > camX + VIEW_W + 40 ||
        center.y < camY - 40 || center.y > camY + VIEW_H + 40) return;


    const ter = getTerrain(c, r);
    const isVisible = visibleHexes.has(`${c},${r}`);
    const fillColor = getTerrainFillColor(ter);


    if (ter.elevation > 0 && ter.terrainType !== 'deep_water') {
      const d = ter.elevation * LIFT * HZ, v = getHexVertices(center.x, center.y, HEX_RADIUS);
      v.forEach((q, i) => {
        const n = v[(i + 1) % 6];
        if (q.y + n.y < 2 * center.y) return;
        ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(n.x, n.y); ctx.lineTo(n.x, n.y + d); ctx.lineTo(q.x, q.y + d); ctx.closePath();
        ctx.fillStyle = i % 2 ? '#1b242c' : '#2a3742'; ctx.fill();
      });
    }
    drawHexPolygon(center.x, center.y, HEX_RADIUS + .45, fillColor, null);
    if (showGrid) drawHexPolygon(center.x, center.y, HEX_RADIUS, null, 'rgba(148,163,184,.16)', .6);


    const curElev = ter.elevation;
    const vertices = getHexVertices(center.x, center.y, HEX_RADIUS);


    for (let edgeIdx = 0; edgeIdx < 6; edgeIdx++) {
      const nCoord = getNeighborByEdge(c, r, edgeIdx);
      let drawContour = false;
      let elevDiff = 0;


      if (!nCoord) {
        drawContour = true;
      } else {
        const nTer = getTerrain(nCoord.c, nCoord.r);
        if (nTer.elevation !== curElev) {
          drawContour = true;
          elevDiff = curElev - nTer.elevation;
        }
      }


      if (drawContour) {
        const v1 = vertices[edgeIdx];
        const v2 = vertices[(edgeIdx + 1) % 6];
        ctx.beginPath();
        ctx.moveTo(v1.x, v1.y);
        ctx.lineTo(v2.x, v2.y);
        if (elevDiff > 0) {
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2.0;
        } else if (elevDiff < 0) {
          ctx.strokeStyle = "#090d14";
          ctx.lineWidth = 1.5;
        } else {
          ctx.strokeStyle = "#334155";
          ctx.lineWidth = 1.0;
        }
        ctx.stroke();
      }
    }


    ctx.textAlign = "center";


    if (ter.elevation > 0) {
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 6px monospace";
      ctx.fillText(`▲${ter.elevation}`, center.x + 8, center.y + 6);
    }


    if (!isVisible) {
      drawHexPolygon(center.x, center.y, HEX_RADIUS + .45, "rgba(6, 9, 14, 0.78)", null);
    }
  }


  const SHC = {}, SH = (col, k) => { const key = col + k; if (SHC[key]) return SHC[key]; const n = parseInt(col.slice(1), 16), f = v => Math.max(0, Math.min(255, Math.round(v * k))); return SHC[key] = `rgb(${f(n >> 16)},${f(n >> 8 & 255)},${f(n & 255)})`; };
  function pr(cx, cy, fa, pts, h0, h1, col) {
    const c = Math.cos(fa), s = Math.sin(fa), P = (a, b, h) => { const px = a * c - b * s, py = a * s + b * c; return [cx + px * COSA - py * SINA, cy + (px * SINA + py * COSA) * TILT - h * HZ]; };
    let ar = 0; pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length]; ar += p[0] * q[1] - q[0] * p[1]; }); const sg = ar > 0 ? 1 : -1;
    pts.forEach((p, i) => {
      const q = pts[(i + 1) % pts.length], nx = (q[1] - p[1]) * sg, ny = -(q[0] - p[0]) * sg, l = Math.hypot(nx, ny) || 1, wx = (nx * c - ny * s) / l, wy = (nx * s + ny * c) / l;
      if (wx * SINA + wy * COSA <= 0.02) return;
      const a = P(p[0], p[1], h0), b = P(q[0], q[1], h0), d = P(q[0], q[1], h1), e = P(p[0], p[1], h1);
      ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.lineTo(...d); ctx.lineTo(...e); ctx.closePath();
      ctx.fillStyle = SH(col, .72 + .28 * (-wx * .707 + wy * .707)); ctx.fill();
    });
    ctx.beginPath(); pts.forEach((p, i) => { const a = P(p[0], p[1], h1); i ? ctx.lineTo(...a) : ctx.moveTo(...a); }); ctx.closePath();
    ctx.fillStyle = SH(col, 1.06); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = .5; ctx.stroke();
  }
  const bx = (cx, cy, fa, x0, x1, y0, y1, h0, h1, col) => pr(cx, cy, fa, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], h0, h1, col);
  const oct = (a0, r) => Array.from({ length: 8 }, (_, i) => [a0 + r * Math.cos(i * Math.PI / 4 + .39), r * Math.sin(i * Math.PI / 4 + .39)]);
  function drawUnitArt__base(u, x, y) {
    const blue = u.team === 'blue', fa = u.facingAngle, tc = blue ? '#38bdf8' : '#f87171', col = blue ? '#68783f' : '#6a6e76', hard = u.armorType === 'hard';
    const P = (a, b, h = 0) => { const c = Math.cos(fa), s = Math.sin(fa), px = a * c - b * s, py = a * s + b * c; return [x + px * COSA - py * SINA, y + (px * SINA + py * COSA) * TILT - h * HZ]; };
    v98Disc(x, y, tc, u.armor >= 30 ? '#fbbf24' : tc, 15, 15 * TILT * 1.07);   // v99: thin ground ring (v109: follows the camera tilt)
    const gunFirst = Math.cos(fa) * SINA + Math.sin(fa) * COSA < 0;
    const barrel = (a0, len, h, w = 1.5) => bx(x, y, fa, a0, a0 + len, -w / 2, w / 2, h, h + w, '#2d3238');
    const man = (sx, sy) => {
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(sx, sy, 3.5, 1.6, 0, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#2b2f2a'; ctx.fillRect(sx - 2, sy - 2, 1.7, 2); ctx.fillRect(sx + .3, sy - 2, 1.7, 2);
      ctx.fillStyle = col; ctx.fillRect(sx - 2.2, sy - 7, 4.4, 5.5);
      if (u.isFlamer) { ctx.fillStyle = '#c2410c'; ctx.fillRect(sx - 4.2, sy - 7, 2, 5); }
      ctx.fillStyle = '#d9b48c'; ctx.beginPath(); ctx.arc(sx, sy - 8.6, 1.8, 0, 6.3); ctx.fill();
      ctx.fillStyle = u.key === 'engineer' ? '#d4a017' : u.isElite || u.key === 'commando' || u.key === 'ranger' || u.key === 'jager' ? '#c9b458' : SH(col, .7); ctx.beginPath(); ctx.arc(sx, sy - 9, 2.3, 3.14, 6.3); ctx.fill();
      const f = P(0, 0), g = P(1, 0), L = (u.isAtInf ? 12 : u.isSniper ? 10 : 7);
      ctx.strokeStyle = u.isAtInf ? '#4b5320' : '#1c1c1c'; ctx.lineWidth = u.isAtInf ? 2 : 1.2; ctx.beginPath(); ctx.moveTo(sx, sy - 5); ctx.lineTo(sx + (g[0] - f[0]) * L, sy - 5 + (g[1] - f[1]) * L); ctx.stroke();
    };
    if (hard) {
      const L = 15 + u.maxHp / 18, W = L * .56, hh = 4 + u.armor / 9, truck = ['supply', 'transport', 'medic_vehicle', 'repair_vehicle'].includes(u.class);
      if (truck) {
        [-.3, .3].forEach(a => [-1, 1].forEach(sd => bx(x, y, fa, a * L - 2, a * L + 2, sd * W / 2 - 1, sd * W / 2 + 1, 0, 3.5, '#1f2328')));
        bx(x, y, fa, L * .1, L * .5, -W * .42, W * .42, 1, hh, col);
        const bc = u.class === 'medic_vehicle' ? '#e8e8e0' : u.class === 'transport' ? SH(col, .85) : '#8d8460';
        bx(x, y, fa, -L * .5, L * .08, -W * .45, W * .45, 1, hh + 2, bc);
        if (u.class === 'medic_vehicle') { bx(x, y, fa, -L * .3, -L * .1, -.9, .9, hh + 2, hh + 2.3, '#dc2626'); bx(x, y, fa, -L * .24, -L * .16, -2.4, 2.4, hh + 2, hh + 2.3, '#dc2626'); }
        if (u.cargo && u.cargo.length) for (let i = 0; i < u.cargo.length; i++) { const p = P(-L * .35 + i * 4, 0, hh + 3); ctx.fillStyle = '#d9b48c'; ctx.beginPath(); ctx.arc(p[0], p[1], 1.7, 0, 6.3); ctx.fill(); }
      } else {
        bx(x, y, fa, -L / 2, L / 2, -W / 2, -W * .3, 0, hh * .6, '#262a2e'); bx(x, y, fa, -L / 2, L / 2, W * .3, W / 2, 0, hh * .6, '#262a2e');
        bx(x, y, fa, -L / 2 + 1, L / 2 - 1, -W * .34, W * .34, 1, hh, col);
        const cas = u.isTankDest || u.isArtillery, gl = L * .42 + (u.range >= 4 ? 4 : 0), a0 = cas ? L * .26 : -L * .05 + W * .3;
        if (gunFirst) barrel(a0, gl, hh + 1.8);
        if (cas) bx(x, y, fa, -L * .3, L * .28, -W * .3, W * .3, hh, hh + 3.5, col); else pr(x, y, fa, oct(-L * .05, W * .34), hh, hh + 3.5, col);
        if (!gunFirst) barrel(a0, gl, hh + 1.8);
      }
      const q = P(-L / 2 + 1, 0, 1); ctx.strokeStyle = '#ddd'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(q[0], q[1] - 10); ctx.stroke();
      ctx.fillStyle = tc; ctx.beginPath(); ctx.moveTo(q[0], q[1] - 10); ctx.lineTo(q[0] + 5, q[1] - 8); ctx.lineTo(q[0], q[1] - 6); ctx.fill();
    } else if (u.isHeavy || u.isMortar || u.isArtillery) {
      const len = 8 + u.range * 1.6;
      [-1, 1].forEach(sd => bx(x, y, fa, -2, 2, sd * 4.5 - 1, sd * 4.5 + 1, 0, 4, '#1f2328'));
      if (gunFirst) barrel(1, len, 4); bx(x, y, fa, -5, 1, -2, 2, 1, 3, col); bx(x, y, fa, 1, 2.4, -4.5, 4.5, 1, 8, SH(col, 1.1));
      if (!gunFirst) barrel(1, len, 4);
      const p = P(-9, 0); man(p[0], p[1]);
    } else {
      const offs = u.isSniper ? [[2, 0]] : [[5, 0], [-3, -6], [-3, 6]];
      offs.map(([a, b]) => P(a, b)).sort((m, k) => m[1] - k[1]).forEach(p => man(p[0], p[1]));
    }
  }


  function drawBuildingShape__base(x, y, b) {
    const bh = 5 + (BLD[b.type].tier || 0) * 2, col = b.team === 'blue' ? '#4a6fa5' : '#a5524a', v = getHexVertices(x, y, HEX_RADIUS - 2);
    v.forEach((q, i) => { const n = v[(i + 1) % 6]; if (q.y + n.y < 2 * y) return; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(n.x, n.y); ctx.lineTo(n.x, n.y - bh); ctx.lineTo(q.x, q.y - bh); ctx.closePath(); ctx.fillStyle = SH(col, i % 2 ? .55 : .75); ctx.fill(); });
    ctx.beginPath(); v.forEach((q, i) => i ? ctx.lineTo(q.x, q.y - bh) : ctx.moveTo(q.x, q.y - bh)); ctx.closePath();
    ctx.fillStyle = SH(col, 1.1); ctx.fill(); ctx.strokeStyle = b.team === 'blue' ? '#60a5fa' : '#f87171'; ctx.lineWidth = 1.5; ctx.stroke();
  }


  function render__base() {
    ctx.setTransform(DPR * zoom, 0, 0, DPR * zoom, 0, 0);
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);


    ctx.save();
    ctx.translate(-camX, -camY);


    if (!(V99 && V99.on && v99Ground())) TILE_ORDER.forEach(([c, r]) => drawTopographicTile(c, r));   // v99: painted ground


    mines.forEach(m => {
      if (m.team === currentTurn) {
        const { x, y } = getHexCenter(m.c, m.r);
        v99Mine(x, y);   // v99: warning sign
      }
    });


    bunkers.forEach(b => {
      if (b.hp <= 0) return;
      if (!visibleHexes.has(`${b.c},${b.r}`) && b.team !== currentTurn) return;
      if (V99 && V99.on) return v99Bunker(b);   // v99: concrete pillbox model
      const { x, y } = getHexCenter(b.c, b.r);
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fillStyle = b.team === 'blue' ? "#1e3a5f" : "#4c1d24";
      ctx.fill();
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 1.3;
      ctx.stroke();


      ctx.fillStyle = "#ffffff"; ctx.font = "bold 7px monospace"; ctx.textAlign = "center";
      ctx.fillText(b.type === 'mg' ? 'B-MG' : 'B-MED', x, y + 1);
    });


    // v59: zone rings + flag poles are drawn by drawZones()/drawCapturePoint() (section [17c])
    drawZones();
    capturePoints.forEach(cp => drawCapturePoint(cp));   // flags are drawn later, above the units (render wrapper in [17c])


    const bannerQ = [];
    const drawBldBanner = (b, x, y) => v110BldBanner(b, x, y);   // v110: unit-banner style (section [17o])


    v130DrawArcs();   // v130: thin, translucent; the selected weapon in full, the others as edge ticks (section [17s])
    const activeUnit = isDraggingFacing ? facingUnit : selectedUnit;
    if (isDraggingFacing && activeUnit && activeUnit.isHeavy) {
      const center = getHexCenter(activeUnit.c, activeUnit.r);
      const arcRadius = activeUnit.range * HEX_RADIUS * 1.8;
      const startAngle = activeUnit.facingAngle - (activeUnit.arcAngle / 2);
      const endAngle = activeUnit.facingAngle + (activeUnit.arcAngle / 2);


      ctx.save();
      ctx.beginPath();
      ctx.translate(center.x, center.y);
      ctx.transform(COSA, TILT * SINA, -SINA, TILT * COSA, 0, 0);
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, arcRadius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = isDraggingFacing ? "rgba(250, 204, 21, 0.2)" : "rgba(168, 85, 247, 0.18)";
      ctx.fill();
      ctx.strokeStyle = isDraggingFacing ? "#facc15" : "#a855f7";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
    }


    fanLbl = null;
    const fanU = (isDraggingFacing || isAwaitingFacing) && facingUnit ? facingUnit : selectedUnit;
    if (fanU && window.rotUnit === fanU && fanU.key && !(fanU.type && BLD[fanU.type]) && fanU.hp > 0 && !fanU.isHeavy && !fanU.isLoaded && fanU.armorType === 'hard' && fanU.facingAngle !== undefined && (fanU.team === currentTurn || visibleHexes.has(`${fanU.c},${fanU.r}`))) {
      const c0 = getHexCenter(fanU.c, fanU.r), R = HEX_RADIUS * 1.9, fa = fanU.facingAngle, D = Math.PI / 4, live = isDraggingFacing || isAwaitingFacing;
      [[-1, 1, "34,197,94"], [1, 3, "250,204,21"], [3, 5, "248,113,113"], [5, 7, "250,204,21"]].forEach(([a, b, rgb]) => {
        ctx.save(); ctx.translate(c0.x, c0.y); ctx.transform(COSA, TILT * SINA, -SINA, TILT * COSA, 0, 0);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, fa + a * D, fa + b * D); ctx.closePath();
        ctx.fillStyle = `rgba(${rgb},${live ? .3 : .2})`; ctx.fill(); ctx.strokeStyle = `rgba(${rgb},.85)`; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
      });
    }

    if (typeof v185DrawOverlay === 'function') v185DrawOverlay();   // v185: rotation preview, ±60° limit, fixed-gun arc

    const dz130 = skOn() || window.ARM_PV || actionMode || rotOn() ? null : v130DangerSet();
    (skOn() || window.ARM_PV || actionMode || rotOn() ? [] : validMoves).forEach(tile => {
      const { x, y } = getHexCenter(tile.c, tile.r);
      if (tile.rev) drawHexPolygon(x, y, HEX_RADIUS - 1, "rgba(56, 189, 248, 0.30)", "#38bdf8", 1.5);   // v130: reverse (keeps the facing)
      else drawHexPolygon(x, y, HEX_RADIUS - 1, "rgba(34, 197, 94, 0.35)", "#22c55e", 1.5);
      if (dz130 && dz130.has(tile.c + ',' + tile.r)) drawHexPolygon(x, y, HEX_RADIUS - 5, "rgba(239, 68, 68, 0.22)", "rgba(239, 68, 68, 0.55)", 1);   // enemy MG field of fire
    });
    (skOn() || window.ARM_PV || actionMode ? [] : validAttacks).forEach(tile => {
      const { x, y } = getHexCenter(tile.c, tile.r);
      drawHexPolygon(x, y, HEX_RADIUS - 1, "rgba(239, 68, 68, 0.4)", "#ef4444", 1.5);
    });


    drawSkTiles();
    if (rangeTiles) rangeTiles.forEach(tile => {
      const { x, y } = getHexCenter(tile.c, tile.r);
      if (tile.sub) drawHexPolygon(x, y, HEX_RADIUS - 1, "rgba(245, 158, 11, 0.30)", "#f59e0b", 1.5);   // secondary weapon only
      else drawHexPolygon(x, y, HEX_RADIUS - 1, "rgba(239, 68, 68, 0.38)", "#ef4444", 1.5);
    });


    if (actionMode && actionMode !== 'sk' && actionMode !== 'usk') {
      let targets = [];
      if (actionMode === 'deploy_unit') {
        const prodBuildings = buildings.filter(b => b.team === currentTurn && canProd(b, pendingDeployKey) && b.hp > 0);
        prodBuildings.forEach(pb => {
          targets.push(...(typeof v153DeployTiles === 'function' ? v153DeployTiles(pb) : getHexNeighbors(pb.c, pb.r)));   // v153: around the whole footprint
        });
      } else if (activeActor) {
        targets = validActionTiles() || getHexNeighbors(activeActor.c, activeActor.r);
      }


      targets.forEach(n => {
        const { x, y } = getHexCenter(n.c, n.r);
        const bl = actionMode === 'deploy_unit' || actionMode === 'dismount'; drawHexPolygon(x, y, HEX_RADIUS - 2, bl ? 'rgba(56,189,248,.28)' : 'rgba(251,191,36,.22)', bl ? '#38bdf8' : '#fbbf24', 2);
      });
    }


    if (pendingAttackTarget) {
      const { x, y } = getHexCenter(pendingAttackTarget.c, pendingAttackTarget.r);
      v99Mark(x, y, 'tgt');
    }


    if (selectedUnit && !(V173.anim && V173.anim.u === selectedUnit)) {   // v174: no selection ring while the unit is moving
      const { x, y } = getHexCenter(selectedUnit.c, selectedUnit.r);
      v99Mark(x, y, 'sel');
    }


    v99Flush();   // v99: merged highlight regions go down before the units
    if (typeof v175Preview === 'function') v175Preview();   // v175: previewed route under the units
    // 건물·유닛을 깊이(화면 y) 순으로 합쳐 뒤→앞 순서로 그림. 배너/상태 표시는 마지막 패스에서 항상 최상단
    const dq = [];
    buildings.forEach(b => { if (b.hp <= 0) return; const p = getHexCenter(b.c, b.r); dq.push({ k: 'b', o: b, x: p.x, y: p.y, d: p.y, t: 0 }); });
    units.filter(u => u.hp > 0 && (!u.isLoaded || (V173.anim && V173.anim.u === u && V181.board.has(u)))).forEach(u => {
      if (!v178Show(u)) return;   // v178: visibility test (incl. the v173 'spotted on the way' rule) with a short fade in / out
      const p = v173Pos(u) || getHexCenter(u.c, u.r); dq.push({ k: 'u', o: u, x: p.x, y: p.y, d: p.y, t: 1 });
    });
    dq.sort((a, b) => a.d - b.d || a.t - b.t);
    dq.forEach(e => {
      if (e.k === 'b') { drawBuildingShape(e.x, e.y, e.o); return; }
      const u = e.o, x = e.x, y = e.y;
      const _ss = u.armorType === 'soft' ? suppState(u) : 0;
      if (_ss > 0) { ctx.save(); if ('filter' in ctx) ctx.filter = _ss === 2 ? 'saturate(.2) brightness(.85)' : 'saturate(.55)'; else ctx.globalAlpha = _ss === 2 ? .6 : .8; drawUnitArt(u, x, y); ctx.restore(); }
      else drawUnitArt(u, x, y);
    });
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    dq.forEach(e => { if (e.k === 'u' && V178.alpha.has(e.o)) return; bannerQ.push(e); });   // v178: no banner while a unit fades
    bannerQ.forEach(e => {
      if (e.k === 'b') drawBldBanner(e.o, e.x, e.y);
      else { ctx.textAlign = "center"; ctx.textBaseline = "middle"; drawBanner(e.o, e.x, e.y); drawRotBtn(e.o, e.x, e.y); }
    });

    if (fanLbl) {
      const L = fanLbl;
      ctx.save(); ctx.font = "bold 9px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#fff"; ctx.strokeStyle = "rgba(0,0,0,.8)"; ctx.lineWidth = 2.5;
      [[0, "전"], [2, "측"], [4, "후"], [6, "측"]].forEach(([k, t]) => { const o = isoD(L.R * .66 * Math.cos(L.fa + k * L.D), L.R * .66 * Math.sin(L.fa + k * L.D)); ctx.strokeText(t, L.x + o.x, L.y + o.y); ctx.fillText(t, L.x + o.x, L.y + o.y); });
      ctx.restore();
    }
    fxScan(); fxDraw();
    ctx.restore();
  }


  // v12: 방패형 배너 마커 + 줌 연동 LOD (0 점 / 1 배너 / 2 배너+배지). 선택 중에는 선택 유닛·공격 대상만 확장
  const unitKind = u => u.isArtillery ? 'art' : (u.isHeavy || u.isMortar) ? 'hvy' : u.armorType !== 'hard' ? 'inf' : ['supply', 'medic_vehicle', 'repair_vehicle'].includes(u.class) ? 'sup' : u.class === 'transport' ? 'veh' : u.isTankDest ? 'td' : 'tank';
  // v60: chamfered rectangle path centred on (x, y) — replaces round badges everywhere (angular steel look)
  function plate(x, y, w, h, c) { const l = x - w / 2, r = x + w / 2, t = y - h / 2, b = y + h / 2; ctx.beginPath(); ctx.moveTo(l + c, t); ctx.lineTo(r, t); ctx.lineTo(r, b - c); ctx.lineTo(r - c, b); ctx.lineTo(l, b); ctx.lineTo(l, t + c); ctx.closePath(); }
  function drawGlyph(k, c) {
    ctx.fillStyle = ctx.strokeStyle = c; ctx.lineWidth = 1.5; ctx.lineCap = 'round'; ctx.beginPath();
    if (k === 'inf') { ctx.arc(0, -3.6, 1.7, 0, 6.3); ctx.fill(); ctx.fillRect(-2.5, -1.4, 5, 6.4); }
    else if (k === 'hvy') { ctx.moveTo(-4, 4.5); ctx.lineTo(0, -.5); ctx.lineTo(4, 4.5); ctx.moveTo(0, -.5); ctx.lineTo(5.5, -3.5); ctx.stroke(); }
    else if (k === 'art') { ctx.arc(-1, 2.5, 2.6, 0, 6.3); ctx.moveTo(-1, 2.5); ctx.lineTo(5.5, -3.5); ctx.stroke(); }
    else if (k === 'tank') { ctx.fillRect(-5, 0, 10, 4); ctx.fillRect(-2.5, -3, 5, 3); ctx.moveTo(2, -1.5); ctx.lineTo(6, -1.5); ctx.stroke(); }
    else if (k === 'td') { ctx.moveTo(-5, 4); ctx.lineTo(5, 4); ctx.lineTo(5, 0); ctx.lineTo(-1, -3); ctx.lineTo(-5, 0); ctx.fill(); ctx.moveTo(1, -1); ctx.lineTo(6, -1); ctx.stroke(); }
    else if (k === 'veh') { ctx.fillRect(-5, -2.5, 10, 5); ctx.arc(-3, 4, 1.4, 0, 6.3); ctx.arc(3, 4, 1.4, 0, 6.3); ctx.fill(); }
    else { ctx.fillRect(-1.3, -4.5, 2.6, 9); ctx.fillRect(-4.5, -1.3, 9, 2.6); }
  }
  /* drawBanner: original body removed — replaced by a later layer (js/chains/drawBanner.js) */

  // 상태 아이콘(형태로 구분): 고착 X · 제압 쉐브론 · 궤도 손상 · 화재
  function drawStatusIcon__base(kind, x, y, col) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = "rgba(8,12,16,.9)"; ctx.strokeStyle = col; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(0, 0, 4.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = col; ctx.lineWidth = 1.2; ctx.beginPath();
    if (kind === 'pin') { ctx.moveTo(-2.2, -2.2); ctx.lineTo(2.2, 2.2); ctx.moveTo(2.2, -2.2); ctx.lineTo(-2.2, 2.2); ctx.stroke(); }
    else if (kind === 'supp') { ctx.moveTo(-2.4, -2.2); ctx.lineTo(0, -.2); ctx.lineTo(2.4, -2.2); ctx.moveTo(-2.4, .6); ctx.lineTo(0, 2.6); ctx.lineTo(2.4, .6); ctx.stroke(); }
    else if (kind === 'nofire') { ctx.arc(0, 0, 2.6, 0, Math.PI * 2); ctx.moveTo(-1.8, 1.8); ctx.lineTo(1.8, -1.8); ctx.stroke(); }
    else if (kind === 'trk') { ctx.rect(-2.8, -1.9, 2.3, 3.8); ctx.rect(.5, -1.1, 2.3, 3.8); ctx.fill(); }
    else if (kind === 'amm') { ctx.rect(-1.2, -2.6, 2.4, 4.2); ctx.moveTo(-1.2, -2.6); ctx.lineTo(0, -4); ctx.lineTo(1.2, -2.6); ctx.rect(-2, 2, 4, 1.1); ctx.fill(); }
    else if (kind === 'fue') { ctx.rect(-2.3, -2, 4.6, 5); ctx.rect(-1.2, -3.4, 2.4, 1.4); ctx.fill(); }
    else { ctx.moveTo(0, -3.2); ctx.quadraticCurveTo(3.4, .4, 0, 3.2); ctx.quadraticCurveTo(-3.4, .4, 0, -3.2); ctx.fill(); }
    ctx.restore();
  }


  
  /* render: layer moved to js/chains/render.js */
  
  /* render: layer moved to js/chains/render.js */
  // --- 지도 오버레이: 연막 · 착탄 예고 · 분대원 수 ---
  // v16: 영역 경계선 · 연막/포격 해칭
  function hexPath(cx, cy, radius) { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = (Math.PI / 180) * (60 * i - 30), o = isoD(radius * Math.cos(a), radius * Math.sin(a)); i ? ctx.lineTo(cx + o.x, cy + o.y) : ctx.moveTo(cx + o.x, cy + o.y); } ctx.closePath(); }
  const patCache = {};
  function hatchPat(key) {
    if (patCache[key]) return patCache[key];
    const c = document.createElement('canvas'); c.width = c.height = 8; const g = c.getContext('2d'); g.lineWidth = 1.3;
    if (key === 'smoke') { g.strokeStyle = 'rgba(241,245,249,.6)'; g.beginPath(); g.moveTo(-1, 9); g.lineTo(9, -1); g.moveTo(-5, 5); g.lineTo(5, -5); g.moveTo(3, 13); g.lineTo(13, 3); g.stroke(); }
    else { g.strokeStyle = 'rgba(248,113,113,.55)'; g.beginPath(); g.moveTo(-1, 9); g.lineTo(9, -1); g.moveTo(-5, 5); g.lineTo(5, -5); g.moveTo(3, 13); g.lineTo(13, 3); g.moveTo(-1, -1); g.lineTo(9, 9); g.moveTo(-5, 3); g.lineTo(5, 13); g.moveTo(3, -5); g.lineTo(13, 5); g.stroke(); }
    return patCache[key] = ctx.createPattern(c, 'repeat');
  }
  let terrSig = '', terrMap = new Map();
  function territoryOf() {
    const A = [];
    buildings.forEach(b => { if (b.hp > 0 && (b.type === 'hq' || b.type === 'outpost')) A.push([b.team, b.c, b.r, 3]); });
    capturePoints.forEach(cp => { if (cp.owner) (cp.cores || [[cp.c, cp.r]]).forEach(k => A.push([cp.owner, k[0], k[1], cp.radius + 1])); });   // v59: owned zones project territory (zone radius + 1)
    const sig = TILE_ORDER.length + '#' + A.map(a => a.join(',')).join('|');
    if (sig === terrSig) return terrMap;
    terrSig = sig; terrMap = new Map();
    TILE_ORDER.forEach(([c, r]) => {
      let best = 99, bt = null, tie = false;
      A.forEach(([t, ac, ar, R]) => { const d = getDistance(ac, ar, c, r); if (d > R) return; if (d < best) { best = d; bt = t; tie = false; } else if (d === best && t !== bt) tie = true; });
      if (bt && !tie) terrMap.set(`${c},${r}`, bt);
    });
    return terrMap;
  }
  function drawTerritory__base() {
    const T = territoryOf(); ctx.save(); ctx.lineCap = 'round'; ctx.lineWidth = 1.8;
    TILE_ORDER.forEach(([c, r]) => {
      const t = T.get(`${c},${r}`); if (!t || !visibleHexes.has(`${c},${r}`)) return;
      const q = getHexCenter(c, r);
      if (q.x < camX - 40 || q.x > camX + VIEW_W + 40 || q.y < camY - 40 || q.y > camY + VIEW_H + 40) return;
      let vs = null;
      for (let e = 0; e < 6; e++) {
        const n = getNeighborByEdge(c, r, e);
        if (!n || T.get(`${n.c},${n.r}`) === t) continue;
        vs = vs || getHexVertices(q.x, q.y, HEX_RADIUS);
        ctx.strokeStyle = t === 'blue' ? 'rgba(56,189,248,.85)' : 'rgba(248,113,113,.85)'; ctx.setLineDash(t === currentTurn ? [] : [5, 3]);
        ctx.beginPath(); ctx.moveTo(vs[e].x, vs[e].y); ctx.lineTo(vs[(e + 1) % 6].x, vs[(e + 1) % 6].y); ctx.stroke();
      }
    });
    ctx.restore();
  }
  // v24: 거점 링 점멸 · 연막/포격 카운트다운 (숫자 = 앞으로 넘어갈 턴 수)
  function drawV24Overlays() {
    const now = performance.now(), rm = reduceMotion();
    capturePoints.forEach(cp => { if (!capReady(cp)) return; const q = getHexCenter(cp.c, cp.r), p = rm ? .5 : (Math.sin(now / 220) + 1) / 2;
      ctx.save(); ctx.globalAlpha = .45 + .5 * p; ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(q.x, q.y, 11 + (rm ? 0 : p * 3), 0, 6.3); ctx.stroke(); ctx.restore(); });
    const badge = (x, y, n, col) => { ctx.save(); ctx.fillStyle = 'rgba(8,12,16,.92)'; ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 5.2, 0, 6.3); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.font = 'bold 7.5px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(n, x, y + .5); ctx.restore(); };
    smokes.forEach(sm => { const q = getHexCenter(sm.c, sm.r); badge(q.x, q.y, Math.max(1, sm.expire - turnNo), '#cbd5e1'); });
    pendingStrikes.forEach(st => { const q = getHexCenter(st.c, st.r); badge(q.x + 9, q.y - 9, st.team === currentTurn ? 2 : 1, '#f87171'); });
  }
  
  /* render: layer moved to js/chains/render.js */

  // ---------- 지도 오버레이: 화염 지대 · 스킬 사거리 · 위장/탄종 표식 ----------
  
  /* render: layer moved to js/chains/render.js */

