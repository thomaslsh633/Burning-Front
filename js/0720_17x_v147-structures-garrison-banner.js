  // ══════════════════════════════════════════════════════════════
  // [17&] v147 — structures: garrison banner, entering, destruction in three stages
  //   · every house (Faymonville footprint, or a connected group of building hexes elsewhere) is one structure with HP
  //   · tap a structure → grey HP bar + "can be entered" shield above it; a garrison turns bar and shield its team colour and
  //     the garrison's unit banners sit to the right of the building banner (the unit models go inside)
  //   · capacity: 1 squad (1–2 hexes), 2 (3–5 hexes), 3 (6+ hexes); an enemy-held or full building cannot be entered
  //   · stages: intact → damaged (≤ 50 % HP: light cover, half the roof caved in) → ruined (0 HP: rubble, no sight block,
  //     the garrison takes 20 % HP and is pinned)
  //   · cover edges (walls, balustrades, hedges, fences, sandbags) have HP too: damaged at ≤ 50 % (heavy → light, no crossing
  //     cost), destroyed at 0. Flamethrowers burn a hedge on the shot's entry edge outright.
  //   · structural damage: artillery / rocket ×1.2 of its damage, mortar ×1.0, tank gun ×0.9 (HE ×1.5, AP ×0.6), AT gun ×0.5,
  //     flamer 6; small arms none. Hits on a garrison damage the building; direct shots also hit the entry edge; indirect fire
  //     and strikes chip every edge of the hex. Tanks, guns and mortars may also target an empty building directly.
  // ══════════════════════════════════════════════════════════════
  var V147 = { on: true, structs: [], cellStruct: new Map(), sel: null, selTap: 0, att: new Set(), drawing: false };
  const V147_TOP = { mill: 9.4, farm: 6.4, farm2: 9.2, cottage: 5.6, town: 13, barn: 5.9, shed: 4, boathouse: 4, villa: 14.4 };
  const V147_NAME = { mill: '석조 제분소', farm: '농가', farm2: '2층 농가', cottage: '오두막', town: '3층 타운하우스', barn: '헛간', shed: '창고', boathouse: '보트하우스', villa: '별장' };
  const STAGE_KO = ['온전', '손상', '폐허'];
  function v147Build() {
    V147.structs = []; V147.cellStruct = new Map(); V147.sel = null;
    const add = (cells, o) => {
      const n = cells.length, hp = n >= 6 ? 640 : n >= 3 ? 420 : n >= 2 ? 300 : 200;
      let fx = 0, fy = 0; cells.forEach(([c, r]) => { const f = v146CellFlat(c, r); fx += f[0] / n; fy += f[1] / n; });
      const st = Object.assign({ id: 'st' + V147.structs.length, cells, hp, maxHp: hp, stage: 0, cap: n >= 6 ? 3 : n >= 3 ? 2 : 1, fx, fy, z: 0, topM: 6, name: '석조 가옥' }, o);
      V147.structs.push(st); cells.forEach(([c, r]) => V147.cellStruct.set(c + ',' + r, st)); return st;
    };
    (V146.spots || []).forEach(sp => { if (!sp.fp) return; sp.struct = add(sp.fp, { fx: sp.fx, fy: sp.fy, z: sp.z || 0, topM: V147_TOP[sp.kind] || 7, name: V147_NAME[sp.kind] || '건물', kind: sp.kind }); });
    const seen = new Set(V147.cellStruct.keys());
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const k = c + ',' + r, t = terrainMap[k]; if (!t || t.oob || t.terrainType !== 'building' || seen.has(k)) continue;
      const comp = [], q = [[c, r]]; seen.add(k);
      while (q.length) { const [a, b] = q.pop(); comp.push([a, b]); getHexNeighbors(a, b).forEach(n => { const nk = n.c + ',' + n.r, nt = terrainMap[nk]; if (nt && !nt.oob && nt.terrainType === 'building' && !seen.has(nk)) { seen.add(nk); q.push([n.c, n.r]); } }); }
      add(comp, { z: Math.max(...comp.map(([a, b]) => v146Z(a, b))) });
    }
  }
  const v147StructAt = (c, r) => V147.cellStruct.get(c + ',' + r) || null;
  const v147Garrison = st => st.stage >= 2 ? [] : units.filter(u => u.hp > 0 && !u.isLoaded && st.cells.some(([c, r]) => c === u.c && r === u.r));
  const v147GarrisonOf = u => { if (!u || u.hp <= 0 || u.isLoaded) return null; const st = v147StructAt(u.c, u.r); return st && st.stage < 2 ? st : null; };
  function structDmg(u) {
    if (!u || u.hp <= 0) return 0;
    if (u.isArtillery || u.isNebel) return Math.round(Math.max(u.atk || 0, 50) * 1.2);
    if (u.isMortar) return 24;
    if (u.isFlamer) return 6;
    if (u.armorType === 'hard' && (u.atk || 0) >= 20) return Math.round(u.atk * 1.18 * (u.shell === 'he' ? 1.5 : u.shell === 'ap' ? .6 : 1));   // v150: 0.9 → 1.18 (Sherman 50)
    if (u.isHeavy && (u.atk || 0) >= 30 && u.pen) return Math.round(u.atk * .5);
    return 0;
  }
  function v147SetStage(st, ns) {
    if (ns <= st.stage) return; st.stage = ns;
    if (ns === 1) {
      st.cells.forEach(([c, r]) => { const t = terrainMap[c + ',' + r]; if (t && t.terrainType === 'building') { t.cover = 'yellow'; t.name = '파손된 ' + st.name; } });
      addLog(`🏚 [건물 손상] ${st.name} — 경엄폐로 약화`, 'crit');
    } else {
      const g = units.filter(u => u.hp > 0 && !u.isLoaded && st.cells.some(([c, r]) => c === u.c && r === u.r));
      st.cells.forEach(([c, r]) => { const t = terrainMap[c + ',' + r] || {}, d = TERRAIN_DEFS.rubble, keep = { vh: t.vh };
        setTerrain(c, r, 'rubble', t.elevation | 0, d.cover, st.name + ' 잔해', d.code, 0); if (keep.vh !== undefined) terrainMap[c + ',' + r].vh = keep.vh; });
      addLog(`💥 [건물 붕괴] ${st.name} 폐허가 됨 — 시야 차단 해제`, 'crit');
      g.forEach(u => { const d = Math.max(1, Math.round(u.maxHp * .2)); u.hp -= d; addLog(`🧱 [붕괴 피해] ${u.className} [-${d} HP]`, 'crit');
        if (u.hp <= 0) { u.hp = 0; checkVictory(); } else if (u.armorType === 'soft') addSuppression(u, 100); });
    }
  }
  function v147DamageStruct(st, dmg) {
    if (!st || st.stage >= 2 || !(dmg > 0)) return;
    st.hp = Math.max(0, st.hp - dmg);
    addLog(`🏚 [건물 피격] ${st.name} [-${hpD(dmg)}] (${hpD(st.hp)}/${hpD(st.maxHp)})`, 'crit');
    const [c, r] = st.cells[0]; fxAdd({ c, r, team: null }, '-' + dmg, '#cbd5e1', -10);
    v147SetStage(st, st.hp <= 0 ? 2 : st.hp <= st.maxHp * .5 ? 1 : 0);
  }
  function v147HitEdge(c1, r1, c2, r2, dmg) {
    const e = getEdge(c1, r1, c2, r2); if (!e || (e.st || 0) >= 2 || !(dmg > 0)) return;
    const max = EDGE_HP[e.kind] || 50; e.hp = Math.max(0, (e.hp === undefined ? max : e.hp) - dmg);
    const ns = e.hp <= 0 ? 2 : e.hp <= max / 2 ? 1 : 0; if (ns <= (e.st || 0)) return;
    e.st = ns; EDGE_VER++;
    addLog(`🧱 [엄폐물 ${ns >= 2 ? '파괴' : '손상'}] ${EDGE_NAMES[e.kind] || e.kind}`, 'crit');
    try { if (v99G && v99G.cv) { const a = getHexCenter(c1, r1), b = getHexCenter(c2, r2), R = HEX_RADIUS; v99MarkDirty(...v99Rect(Math.min(a.x, b.x) - R * 2, Math.min(a.y, b.y) - R * 2 - 20, Math.max(a.x, b.x) + R * 2, Math.max(a.y, b.y) + R * 2)); v99G.ver++; } } catch (err) { }
  }
  const v147EdgesAround = (c, r, dmg) => getHexNeighbors(c, r).forEach(n => v147HitEdge(c, r, n.c, n.r, dmg));
  // every hit with a structural weapon: the building it lands in, the entry edge (direct) or the hex's edges (indirect)
  { 
    /* executeCombat: layer moved to js/chains/executeCombat.js */ }
  { const o_imp147 = impact;
    impact = function (team, c, r, P) {
      const res = o_imp147.apply(this, arguments);
      const pw = P && typeof P === 'object' ? structDmg(P) : (P || 80);   // P may be a unit profile
      try { const st = v147StructAt(c, r); if (st) v147DamageStruct(st, Math.round(pw * .8)); v147EdgesAround(c, r, Math.round(pw * .3)); } catch (err) { console.warn('v147 impact', err); }
      return res;
    }; }
  // entering: an enemy-held or full building is closed
  { 
    /* getTileMovementCost: layer moved to js/chains/getTileMovementCost.js */ }
  // direct fire at an empty building
  { 
    /* updateActionTiles: layer moved to js/chains/updateActionTiles.js */ }
  function v147StructTap(hex) {
    const u = selectedUnit, k = hex.c + ',' + hex.r; if (!u || u.team !== currentTurn || !V147.att.has(k) || getUnitAt(hex.c, hex.r)) return false;
    const st = v147StructAt(hex.c, hex.r); if (!st || st.stage >= 2) return false;
    const sd = structDmg(u) * (u.isMortar || u.isArtillery || u.isNebel ? 1 : .8) | 0;
    if (pendingAttackTarget && pendingAttackTarget.c === hex.c && pendingAttackTarget.r === hex.r) {
      clearAttackPreview(); const _fx = v186Begin(u, hex.c, hex.r, true); u.ammo -= 1; u.hasAttacked = true; addVeterancyExp(u, 2, 'atk');
      addLog(`[건물 포격] ${u.className} ➔ ${st.name}`, u.isMortar || u.isArtillery || u.isNebel ? 'artillery' : 'normal');
      v147DamageStruct(st, sd); if (u.isMortar || u.isArtillery || u.isNebel) v147EdgesAround(hex.c, hex.r, Math.round(structDmg(u) * .35));
      v186End(_fx, sd, st.stage >= 2);   // v186: shot + impact explosion
      updateVision(); updateActionTiles(u); updateUnitInfoPanel(u, getTerrain(u.c, u.r)); render(); return true;
    }
    pendingAttackTarget = { c: hex.c, r: hex.r }; V147.sel = st;
    previewText.innerHTML = `<div class="pb-head">🏚 건물 포격 — ${st.name}</div><div>예상 구조물 피해 ${hpD(sd)} · HP ${hpD(st.hp)}/${hpD(st.maxHp)} (${STAGE_KO[st.stage]})${st.hp - sd <= 0 ? ' → 붕괴' : st.hp - sd <= st.maxHp / 2 && st.stage < 1 ? ' → 손상' : ''}</div><div style="font-size:10px;opacity:.8">한 번 더 탭하면 사격</div>`;
    combatPreviewBanner.style.display = 'flex'; placeBalloon(); render(); return true;
  }
  // tapping an empty building hex selects the structure (grey bar); any other tap clears it
  { 
    /* showTileInfo: layer moved to js/chains/showTileInfo.js */ }
  canvas.addEventListener('click', () => { if (V147.sel && performance.now() - V147.selTap > 80 && !pendingAttackTarget) { V147.sel = null; render(); } });
  { 
    /* renderTileStrip: layer moved to js/chains/renderTileStrip.js */ }
  // garrisoned units: no model on the map, banner beside the building's
  {  /* drawUnitArt: layer moved to js/chains/drawUnitArt.js */ }
  {  /* drawBanner: layer moved to js/chains/drawBanner.js */ }
  function v147Glyph(col, stage) {
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1.3; ctx.lineJoin = 'round';
    if (stage >= 2) { [[-5, 2, 4, 3], [-1, 0, 4, 5], [3, 3, 3, 2]].forEach(([x, y, w, h]) => ctx.fillRect(x, y, w, h)); return; }
    ctx.beginPath(); ctx.moveTo(-6, -1); ctx.lineTo(0, -6.5); ctx.lineTo(6, -1); ctx.moveTo(-4.4, -2.3); ctx.lineTo(-4.4, 5); ctx.lineTo(4.4, 5); ctx.lineTo(4.4, -2.3); ctx.stroke();   // house
    ctx.beginPath(); ctx.moveTo(0, 3.6); ctx.lineTo(0, -2.2); ctx.moveTo(-2.3, .2); ctx.lineTo(0, -2.4); ctx.lineTo(2.3, .2); ctx.stroke();                                        // enter arrow
  }
  function v147DrawStructBanner(st) {
    const gAll = v147Garrison(st), g = gAll.filter(u => u.team === currentTurn || visibleHexes.has(u.c + ',' + u.r));
    if (!g.length && V147.sel !== st && !st.cells.some(([c, r]) => V147.att.has(c + ',' + r))) return;
    const team = g.length ? g[0].team : null, col = team ? (team === 'blue' ? '#38bdf8' : '#f87171') : '#9ca3af';
    const ce = Math.sqrt(1 - TILT * TILT), p = v99Proj(st.fx, st.fy, (st.z || 0) * LIFT), top = (st.stage >= 2 ? 2.5 : st.stage ? st.topM * .85 : st.topM) * ce * (v146W() / 7);
    const x = p[0], s = Math.max(.85, Math.min(1.4, 1 / zoom)), y = p[1] - top * .82, sh = 26 * Math.min(1.2, s);
    ctx.save(); ctx.translate(x, y - sh); ctx.scale(s, s);
    const hp = Math.max(0, st.hp / st.maxHp), sel = V147.sel === st;
    ctx.beginPath(); ctx.moveTo(-9, -10); ctx.lineTo(9, -10); ctx.lineTo(9, 4); ctx.quadraticCurveTo(9, 9, 0, 11); ctx.quadraticCurveTo(-9, 9, -9, 4); ctx.closePath();
    ctx.fillStyle = 'rgba(10,15,20,.94)'; ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = sel ? 1.8 : 1.3; ctx.stroke();
    // HP bar above the shield: grey while neutral, team colour when garrisoned, amber below half
    ctx.fillStyle = 'rgba(8,12,16,.92)'; ctx.fillRect(-13.5, -17.5, 27, 5); ctx.fillStyle = '#334155'; ctx.fillRect(-12.5, -16.5, 25, 3);
    ctx.fillStyle = team ? (hp > .5 ? col : '#fbbf24') : (hp > .5 ? '#cbd5e1' : '#a8a29e'); ctx.fillRect(-12.5, -16.5, 25 * hp, 3);
    ctx.save(); ctx.translate(0, 2); v147Glyph(team ? col : '#e5e7eb', st.stage); ctx.restore();
    if (st.stage === 1) { ctx.fillStyle = '#fb923c'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', 16, -15); }
    if (st.stage < 2 && st.cap > 1) { ctx.fillStyle = 'rgba(8,12,16,.96)'; ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(-11, -6, 4.6, 0, 6.3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e5e7eb'; ctx.font = 'bold 5.5px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(gAll.length + '/' + st.cap, -11, -5.8); }
    ctx.restore();
    V147.drawing = true;
    try { g.forEach((u, i) => { ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; drawBanner(u, x + (23 + 21 * i) * s, y); }); } finally { V147.drawing = false; }
  }
  { 
    /* render: layer moved to js/chains/render.js */ }
  { 
    /* loadHistoricalMap: layer moved to js/chains/loadHistoricalMap.js */ }

