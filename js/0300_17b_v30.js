  // ══════════════════════════════════════════════════════════════
  // [17b] v30: 스킬 사거리 헥스 표시 · 예상 효과 점멸 · 바깥 탭 취소
  // ══════════════════════════════════════════════════════════════
  const PV_ATK = new Set(['rgren', 'gammon', 'pfaust', 'atrg', 'faust', 'satchel', 'demo', 'bulldoze', 'scorch', 'fo_barrage', 'bar_m', 'bar_sp', 'bar_h', 'bar_h2', 'rocket']);
  const PV_BAR = { fo_barrage: [3, 1, 60, 42], bar_m: [3, 1, 40, 28], bar_sp: [3, 1, 55, 38], bar_h: [4, 1, 72, 52], bar_h2: [4, 1, 82, 58], rocket: [5, 2, 28, 20] };
  let PV = null, pvTimer = null;
  const hexAll = f => { const o = []; for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (f(c, r)) o.push({ c, r }); return o; };
  const hexArea = (h, rad) => hexAll((c, r) => getDistance(h.c, h.r, c, r) <= rad);
  function skCtx() {
    let a, atk, f;
    if (actionMode === 'sk' && SK.cur && activeActor) {
      a = activeActor; const x = SK.cur;
      if (x.kind === 'unit') { atk = true; f = (c, r) => { const d = getDistance(a.c, a.r, c, r); return d >= 1 && d <= x.rng && (x.id !== 'gren' || visH({ c, r })); }; }
      else {
        const t = x.d.t; atk = !['fix', 'adv', 'charge', 'assault'].includes(t);
        f = t === 'spawn' ? (c, r) => getDistance(a.c, a.r, c, r) === 1 && emptyH({ c, r })
          : (t === 'fix' || t === 'adv') ? (c, r) => { const u = getUnitAt(c, r); return !!(u && u.team === a.team && u.armorType === 'hard' && u.hp > 0); }
          : t === 'drop' ? (c, r) => visH({ c, r }) && emptyH({ c, r })
          : (t === 'charge' || t === 'assault') ? () => true : () => true;
      }
    } else if (actionMode === 'usk' && USKC.cur) {
      const { u, d, id, rng } = USKC.cur; a = u; atk = id !== 'field_fix';
      f = (c, r) => { const k = getDistance(u.c, u.r, c, r); return k >= 1 && k <= rng && (!d.useMin || k >= u.minRange) && (!d.vis || visH({ c, r })); };
    } else return null;
    const col = (actionMode === 'sk' && SK.cur.kind === 'team' && ['drop', 'spawn'].includes(SK.cur.d.t)) ? 'blue' : atk ? 'red' : 'yellow';
    const tiles = hexAll(f); return { a, atk, col, tiles, keys: new Set(tiles.map(t => t.c + ',' + t.r)) };
  }
  function skOn() { return actionMode === 'sk' || actionMode === 'usk'; }
  const SKRGB = { red: '239,68,68', yellow: '250,204,21', blue: '56,189,248' };
  function validActionTiles__base() {
    const m = actionMode, a = activeActor;
    if (!m || !a || m === 'sk' || m === 'usk' || m === 'deploy_unit') return null;
    const nb = getHexNeighbors(a.c, a.r), free = n => !getUnitAt(n.c, n.r) && !getBuildingAt(n.c, n.r);
    if (m === 'give_supply') return nb.filter(n => { const u = getUnitAt(n.c, n.r); return u && u !== a && u.team === a.team; });
    if (m === 'repair') return nb.filter(n => {
      const u = getUnitAt(n.c, n.r), b = getBuildingAt(n.c, n.r);
      if (u && u.team === a.team && u.armorType === 'hard') return u.hp < u.maxHp || u.trackDamaged || u.gunDisabled;
      return !!(b && b.team === a.team && b.hp < b.maxHp);
    });
    if (m === 'salvage') return nb.filter(n => {
      const b = getBuildingAt(n.c, n.r), ter = terrainMap[n.c + ',' + n.r];
      return (b && b.team === a.team && b.type !== 'hq') || bunkers.some(k => k.c === n.c && k.r === n.r && k.team === a.team && k.hp > 0) || mines.some(k => k.c === n.c && k.r === n.r && k.team === a.team) || !!(ter && ter.fort && ter.fort.team === a.team);
    });
    if (m === 'dismount') return nb.filter(n => free(n) && getTileMovementCost((a.cargo && a.cargo[a.cargo.length - 1]) || { armorType: 'soft' }, a.c, a.r, n.c, n.r) !== Infinity);
    if (m.startsWith('build_')) {
      const bt = m.slice(6), B = BLD[bt];
      return nb.filter(n => free(n) && TERRAIN_DEFS[getTerrain(n.c, n.r).terrainType].inf !== Infinity && !bunkers.some(k => k.hp > 0 && k.c === n.c && k.r === n.r) && canPlaceBuilding(n.c, n.r, !!B));
    }
    return null;
  }
  function cancelAction() {
    actionMode = null; activeActor = null; pendingDeployKey = null; guideBanner.style.display = 'none';
    if (selectedUnit) updateUnitInfoPanel(selectedUnit, getTerrain(selectedUnit.c, selectedUnit.r));
    render();
  }
  // 차량/중화기 회전 아이콘 (선택된 유닛 배너 옆)
  function canRotate(u) {
    return !!(u && u === selectedUnit && u.team === currentTurn && u.hp > 0 && !u.isLoaded && !actionMode && !(u.type && BLD[u.type]) && u.isHeavy && !u.empl && !(u.arcAngle >= 6.28) && !v159Emplaced(u));   // v131 · v134: emplacements keep their arc: vehicles turn with a long press instead of the rotate button
  }
  window.canRotate = canRotate;
  function drawRotBtn(u, x, y) {
    window.rotBtn = null; return;
    const s = Math.max(.85, Math.min(1.4, 1 / zoom)), by = y - 26 * Math.min(1.2, s), bx = x + 29 * s, live = window.rotUnit === u;
    window.rotBtn = { x: bx, y: by };
    const col = live ? '#facc15' : '#38bdf8';
    ctx.save(); ctx.translate(bx, by); ctx.scale(s * .78, s * .78);
    ctx.fillStyle = live ? 'rgba(90,70,8,.96)' : 'rgba(10,15,20,.94)'; ctx.strokeStyle = col; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(0, 0, 9, 0, 6.3); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = live ? '#facc15' : '#e5e7eb'; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = 1.7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, 0, 4.4, -2.4, 2.9); ctx.stroke();
    const th = 2.9, ex = 4.4 * Math.cos(th), ey = 4.4 * Math.sin(th), tx = -Math.sin(th), ty = Math.cos(th), nx = Math.cos(th), ny = Math.sin(th);
    ctx.beginPath(); ctx.moveTo(ex + tx * 3, ey + ty * 3); ctx.lineTo(ex + nx * 2.4, ey + ny * 2.4); ctx.lineTo(ex - nx * 2.4, ey - ny * 2.4); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function rotOn() { return !!(window.rotUnit && window.rotUnit === selectedUnit && canRotate(selectedUnit)); }
  function rotNear(u, e) { const rc = canvas.getBoundingClientRect(), q = getHexCenter(u.c, u.r); return Math.hypot(e.clientX - rc.left - (q.x - camX) * zoom, e.clientY - rc.top - (q.y - camY) * zoom) <= 3 * HEX_RADIUS * zoom; }
  function rotHit(e) {
    if (!window.rotBtn || !canRotate(selectedUnit)) return false;
    const rc = canvas.getBoundingClientRect();
    return Math.hypot(e.clientX - rc.left - (window.rotBtn.x - camX) * zoom, e.clientY - rc.top - (window.rotBtn.y - camY) * zoom) <= 20;
  }
  function blinkOutline(list) {
    const a = .35 + .65 * Math.abs(Math.sin(performance.now() / 380));
    list.forEach(t => { const { x, y } = getHexCenter(t.c, t.r); drawHexPolygon(x, y, HEX_RADIUS - 1, `rgba(250,204,21,${.08 + .14 * a})`, `rgba(250,204,21,${a})`, 3.5); });
  }
  function armTargets(u, id) {
    const rad = id === 'triage' ? 1 : id === 'rally' ? 2 : 0;
    if (!rad) return [{ c: u.c, r: u.r }];
    const g = units.filter(a => a.team === u.team && a.hp > 0 && !a.isLoaded && a.armorType === 'soft' && getDistance(a.c, a.r, u.c, u.r) <= rad);
    return (g.length ? g : [u]).map(a => ({ c: a.c, r: a.r }));
  }
  window.armTargets = armTargets;
  function needBlink() {
    if (window.ARM_PV) return true;
    if (!skOn()) return false;
    const c = skCtx(); return !!(c && !c.atk && c.col === 'yellow');
  }
  function drawSkTiles__base() {
    if (window.rotUnit && !rotOn()) window.rotUnit = null;
    if (window.ARM_PV) {
      if (!armedEl || selectedUnit !== window.ARM_PV.u) window.ARM_PV = null; else blinkOutline(window.ARM_PV.targets);
    }
    const cx = skCtx(); if (!cx) return;
    const isArea = actionMode === 'sk' && SK.cur.kind === 'team' && ['charge', 'assault'].includes(SK.cur.d.t);
    if (!cx.atk && cx.col === 'yellow' && !isArea) {
      blinkOutline(cx.tiles.filter(t => { const o = getUnitAt(t.c, t.r); return o && o.hp > 0 && o.team === cx.a.team && (!(actionMode === 'usk' && USKC.cur.id === 'field_fix') || o.armorType === 'hard'); }));
      return;
    }
    cx.tiles.forEach(t => { const { x, y } = getHexCenter(t.c, t.r); drawHexPolygon(x, y, HEX_RADIUS - 1, `rgba(${SKRGB[cx.col]},.32)`, `rgb(${SKRGB[cx.col]})`, 1.5); });
  }
  const pvAtt = (a, P, A, dmgA) => throwAtt(a, P, A, dmgA);   // v127: same virtual attacker as throwAt
  const pvDmg = (a, t, P, A, dmgA) => { try { return aoeCap(t, calcDamage(pvAtt(a, P, A, dmgA), t, true).damage); } catch (e) { return 0; } };
  const hpItem = (d, dmg) => ({ c: d.c, r: d.r, ref: d, next: Math.max(0, d.hp - dmg) });
  const seen = d => d.team === currentTurn || visH({ c: d.c, r: d.r });
  function pvShells(team, hex, shells, rad, P, A, rof, splash) {
    const hs = hexArea(hex, rad), N = hs.length, out = [];
    [...units.filter(u => u.hp > 0 && !u.isLoaded), ...buildings.filter(b => b.hp > 0), ...bunkers.filter(b => b.hp > 0)].forEach(d => {
      if (!seen(d)) return; let k = 0;
      hs.forEach(h => { const dd = getDistance(d.c, d.r, h.c, h.r); if (dd === 0) k += 1; else if (dd === 1 && splash) k += .5; });
      if (!k) return;
      try { const att = artAtt(team, d.c, d.r, P, A, rof); out.push(hpItem(d, Math.max(1, Math.round(aoeCap(d, calcDamage(att, d, true).damage * k / N) * shells)))); } catch (e) { }
    });
    return out;
  }
  function pvStruct(u, hex, bd, kd, noBld, frac) {
    const key = hex.c + ',' + hex.r, tm = u.team, b = bldAt(hex), ter = terrainMap[key];
    const bk = bunkers.find(x => x.c === hex.c && x.r === hex.r && x.hp > 0 && x.team !== tm), mn = mines.find(x => x.c === hex.c && x.r === hex.r && x.team !== tm);
    if (b && b.team !== tm && !noBld) return [hpItem(b, frac ? Math.max(1, Math.round(b.maxHp * frac)) : bd)];
    if (bk) return [hpItem(bk, frac ? Math.max(1, Math.round(bk.maxHp * frac)) : kd)];
    if (ter && ter.fort && ter.fort.team !== tm) return [{ c: hex.c, r: hex.r, cur: '시설', next: '파괴' }];
    if (mn) return [{ c: hex.c, r: hex.r, cur: '지뢰', next: '제거' }];
    return null;
  }
  function pvBuild(cx, hex, tu) {
    const a = cx.a, tm = a.team, p = { k: hex.c + ',' + hex.r, c: hex.c, r: hex.r, area: [hex], edge: [], items: [], col: cx.col, p: 0, t0: performance.now(), last: 0 };
    const shell = (n, rad, P, A, rof, sp, txt) => { p.area = hexArea(hex, rad); p.edge = sp ? hexArea(hex, rad + 1).filter(h => getDistance(hex.c, hex.r, h.c, h.r) > rad) : []; p.items = pvShells(tm, hex, n, rad, P, A, rof, sp); p.txt = txt; };
    if (actionMode === 'sk') {
      const x = SK.cur;
      if (x.kind === 'unit') { if (x.id === 'gren') p.items.push(hpItem(tu, 86)); else { p.area = hexArea(hex, 1); p.txt = '연막'; } return p; }
      const t = x.d.t;
      if (t === 'shell') { const m = UNIT_ROSTER[tm].mortar; shell(1, 0, m, 0, m.rof || 1, true, '즉시 착탄'); p.edge = hexArea(hex, 1).filter(h => h.c !== hex.c || h.r !== hex.r); }
      else if (t === 'off' || t === 'barrage') shell(t === 'off' ? 3 : 5, t === 'off' ? 1 : 2, 110, 90, 1, true, '다음 턴 착탄');
      else if (t === 'line') {
        const S = getHexCenter(x.start.c, x.start.r), D = getHexCenter(hex.c, hex.r), w = Math.sqrt(3) * HEX_RADIUS; let vx = D.x - S.x, vy = D.y - S.y; const n = Math.hypot(vx, vy) || 1; vx /= n; vy /= n;
        p.area = hexAll((c, r) => { const q = getHexCenter(c, r), tt = (q.x - S.x) * vx + (q.y - S.y) * vy, pp = Math.abs((q.x - S.x) * vy - (q.y - S.y) * vx); return tt >= -w * .3 && tt <= w * 4.3 && pp <= w * .55; });
        p.area.forEach(h => pvShells(tm, h, 1, 0, 45, 70, 1, false).forEach(i => p.items.push(i)));
      }
      else if (t === 'scout') { p.area = hexArea(hex, 3); p.txt = '정찰'; }
      else if (t === 'drop') p.txt = '낙하';
      else if (t === 'spawn') p.txt = '증원';
      else if (t === 'fix') p.items.push({ c: tu.c, r: tu.r, cur: '손상', next: '수리' });
      else if (t === 'adv') p.items.push({ c: tu.c, r: tu.r, cur: '이동 ' + tu.remainingMove, next: '이동 ' + (tu.remainingMove + 3) });
      else if (t === 'charge' || t === 'assault') {
        p.area = hexArea(hex, 2);
        units.filter(u => u.team === tm && u.hp > 0 && !u.isLoaded && getDistance(u.c, u.r, hex.c, hex.r) <= 2 && (t === 'charge' ? u.armorType === 'soft' && UNIT_ROSTER[tm][u.key].cat === 'infantry' : UNIT_ROSTER[tm][u.key].cat === 'tank')).forEach(u => p.items.push({ c: u.c, r: u.r, cur: '이동 ' + u.remainingMove, next: '이동 ' + (u.remainingMove + (t === 'charge' ? 1 : 2)) }));
      }
      return p;
    }
    const { u, d, id } = USKC.cur;
    const T = { rgren: [30, 24], gammon: [45, 60, 40], pfaust: [28, 1000, 40], sticky: [4, 1000, 34], bundle: [65, 40, 46], atrg: [6, 18, 34], faust: [28, 1000, 40] }[id];
    if (T) p.items.push(hpItem(tu, pvDmg(u, tu, T[0], T[1], T[2])));
    else if (id === 'satchel') p.items = (tu && tu.team !== tm && tu.armorType === 'hard') ? [hpItem(tu, pvDmg(u, tu, 18, 1000, Math.round(tu.maxHp * 0.45)))] : (pvStruct(u, hex, 0, 0, false, 0.7) || []);
    else if (id === 'demo') p.items = pvStruct(u, hex, 0, 0, false, 0.4) || [];
    else if (id === 'bulldoze') p.items = pvStruct(u, hex, 0, 90, true) || [];
    else if (id === 'scorch') { p.area = hexArea(hex, 1); p.txt = '턴 시작 1모델분'; units.filter(e => e.hp > 0 && !e.isLoaded && e.team !== tm && getDistance(e.c, e.r, hex.c, hex.r) <= 1 && seen(e)).forEach(e => p.items.push(hpItem(e, e.armorType === 'hard' ? Math.max(1, Math.round(e.maxHp * 0.05)) : Math.round(e.N ? perModel(e) : 20)))); }
    else if (PV_BAR[id]) { const b = PV_BAR[id]; shell(b[0], b[1], b[2], b[3], 1, true, '다음 턴 착탄'); }
    else if (id === 'smk_m' || id === 'smk_h') { p.area = hexArea(hex, id === 'smk_m' ? 1 : 2); p.txt = '연막'; }
    else if (id === 'flare') { p.area = hexArea(hex, 3); p.txt = '시야 공유'; }
    else if (id === 'mark') p.items.push({ c: tu.c, r: tu.r, cur: '피해 ×1', next: '×1.25' });
    else if (id === 'field_fix') p.items.push({ c: tu.c, r: tu.r, cur: '손상', next: '복구' });
    return p;
  }
  function pvCheck(cx, hex, tu, tb) {
    if (!cx.keys.has(hex.c + ',' + hex.r)) return 0;
    const tm = cx.a.team;
    if (actionMode === 'sk') {
      const x = SK.cur;
      if (x.kind === 'unit' && x.id === 'gren' && !(tu && tu.team !== tm && tu.armorType === 'soft')) return '적 소프트 유닛 칸을 지정하세요';
      return 1;
    }
    const w = USKC.cur.d.who, enemy = tu && tu.team !== tm && tu.hp > 0, ally = tu && tu.team === tm && tu.hp > 0;
    if (w === 'enemy' && !enemy) return '적 유닛이 있는 칸을 지정하세요';
    if (w === 'ally' && !ally) return '아군 유닛이 있는 칸을 지정하세요';
    if (w === 'any' && !enemy && !pvStruct(cx.a, hex, 1, 1, false)) return '적 구조물(건물·벙커·참호·지뢰)을 지정하세요';
    if (USKC.cur.id === 'field_fix' && !(tu.armorType === 'hard' && (tu.trackDamaged || tu.gunDisabled || tu.fireTurns > 0))) return '복구할 손상이 없습니다';
    return 1;
  }
  function pvClear(redraw) { if (pvTimer) cancelAnimationFrame(pvTimer); pvTimer = null; PV = null; if (redraw) render(); }
  function pvDraw__base() {
    ctx.save(); ctx.setTransform(DPR * zoom, 0, 0, DPR * zoom, 0, 0); ctx.translate(-camX, -camY);
    const p = PV.p, rgb = SKRGB[PV.col];
    PV.edge.forEach(h => { const { x, y } = getHexCenter(h.c, h.r); drawHexPolygon(x, y, HEX_RADIUS - 2, `rgba(${rgb},${.08 + .14 * p})`, `rgba(${rgb},.5)`, 1); });
    PV.area.forEach(h => { const { x, y } = getHexCenter(h.c, h.r); drawHexPolygon(x, y, HEX_RADIUS - 1, `rgba(${rgb},${.16 + .44 * p})`, `rgb(${rgb})`, 1.5 + 1.5 * p); });
    ctx.restore();
  }
  function pvPhase(ms) {
    if (reduceMotion()) return (ms % 1600) < 800 ? 0 : 1;
    const t = (ms % 1800) / 1800, q = t < .2 ? 0 : t < .45 ? (t - .2) / .25 : t < .7 ? 1 : t < .95 ? 1 - (t - .7) / .25 : 0;
    return q * q * (3 - 2 * q);
  }
  function pvLoop(now) {
    if (!PV || !skOn()) { pvClear(0); return; }
    if (now - PV.last >= 30) { PV.last = now; PV.p = pvPhase(now - PV.t0); render(); }
    pvTimer = requestAnimationFrame(pvLoop);
  }
  
  /* render: layer moved to js/chains/render.js */
  ['smk_m', 'smk_h', 'bar_m', 'bar_sp', 'bar_h', 'bar_h2', 'rocket', 'fo_barrage'].forEach(id => { if (USK[id]) USK[id].vis = false; });
   /* skEnd: layer moved to js/chains/skEnd.js */
   /* uskEnd: layer moved to js/chains/uskEnd.js */
  
  /* handleSpecialTap: layer moved to js/chains/handleSpecialTap.js */
  setInterval(() => { if (needBlink()) render(); }, 100);
  canvas.addEventListener('click', e => {
    if (hasDragged || !actionMode || actionMode === 'deploy_unit') return;
    const rc = canvas.getBoundingClientRect(), hex = getHexAtPixel(e.clientX - rc.left, e.clientY - rc.top), same = (o, h) => o && h && o.c === h.c && o.r === h.r;
    let ok;
    if (actionMode === 'sk' || actionMode === 'usk') { const cx = skCtx(); ok = !cx || !!PV || !!(hex && (cx.keys.has(hex.c + ',' + hex.r) || same(cx.a, hex))); }
    else { const l = validActionTiles(); ok = !l || !!(hex && (l.some(t => same(t, hex)) || same(activeActor, hex))); }
    if (ok) return;
    e.stopImmediatePropagation(); e.preventDefault();
    if (actionMode === 'sk') skEnd(); else if (actionMode === 'usk') uskEnd(); else cancelAction();
  }, true);
  canvas.addEventListener('click', e => {
    if (hasDragged || !rotOn()) return;
    e.stopImmediatePropagation(); e.preventDefault();
    if (!rotNear(selectedUnit, e)) { window.rotUnit = null; render(); }
  }, true);
  new MutationObserver(() => { if (guideBanner.style.display === 'block' && actionMode && (actionMode.startsWith('build_') || ['give_supply', 'repair', 'salvage'].includes(actionMode))) guideBanner.style.display = 'none'; }).observe(guideBanner, { attributes: true, attributeFilter: ['style'] });
  const noTgt = () => { if (actionMode && actionMode !== 'sk' && actionMode !== 'usk' && actionMode !== 'deploy_unit' && activeActor) { const l = validActionTiles(); if (l && !l.length) { toast('시전 가능한 대상이 없습니다'); cancelAction(); } } };
   /* toggleMode: layer moved to js/chains/toggleMode.js */
   /* startTargetedBuild: layer moved to js/chains/startTargetedBuild.js */
   /* startTargetedDismount: layer moved to js/chains/startTargetedDismount.js */
   /* startTargetedSupply: layer moved to js/chains/startTargetedSupply.js */
  // 징집 배치·스킬 조준 중 HUD 빈 곳을 눌러도 취소
  document.addEventListener('pointerdown', e => {
    if (!actionMode) return;
    if (e.target.closest('canvas, .tile, .btn-action, button, #tile-tip, #buy-preview, #pkg-picker, #cp-info, #sup-panel, #sup-tab, #pane-research')) return;
    if (actionMode === 'sk') skEnd(); else if (actionMode === 'usk') uskEnd(); else cancelAction();
  }, true);


  // ══════════════════════════════════════════════════════════════
  // [TGL-V46] 토글 스킬 엔진 + 스킬 분류(kind)  — COH3 이식 계획서 v46 단계
  //   · 토글: MUN 0, 상태 유지형(u.tgl[id]), 전환 후 쿨다운 1턴 (그동안 재전환 불가)
  //   · 5종: Hull Down(적 StuG·4호·브룸베어·비르벨빈트) / 포 고정(마르더) / 정찰 모드(채피) / 무기 전환(SSF) / 사격 보류(저격수)
  //   · 피해·명중 보정은 calcDamage 래퍼로 처리 (베테랑 재계산에 영향받지 않음), 사거리·시야는 가감식(베테랑 델타 방식과 호환)
  //   · kind: 'mun'(MUN>0) | 'free'(MUN 0) | 'tgl'(토글)
  // ══════════════════════════════════════════════════════════════
  const TGL = {
    hulldown: { n: 'Hull Down', ico: '⛏', d: '이동 불가 · 정면 피해 −25% · 사거리 +1', keys: { blue: [], red: ['stug', 'panzer4', 'brummbar', 'wirbelwind'] }, imm: true, rng: 1 },
    sitegun: { n: '포 고정', ico: '📐', d: '이동 불가 · 사거리 +1 · 명중 보정', keys: { blue: [], red: ['tank_dest'] }, imm: true, rng: 1, acc: 0.03 },
    recon: { n: '정찰 모드', ico: '🔭', d: '주포 사용 불가 · 시야 +2', keys: { blue: ['chaffee'], red: [] }, sight: 2, nofire: true },
    wswap: { n: '무기 전환', ico: '🔁', st: ['LMG', '바주카'], d: '바주카: 대전차 로켓 1발 (관통 24/15/13 · 공격력 32) · LMG가 기본', keys: { blue: ['commando'], red: [] }, p: 2 / 3, a: 1.857, r: 0.43 },
    holdfire: { n: '사격 보류', ico: '🤫', d: '반격하지 않아 위장 유지', keys: { blue: ['sniper'], red: ['sniper'] } }
  };
  Object.values(USK).forEach(d => { if (!d.kind) d.kind = d.mun > 0 ? 'mun' : 'free'; });
  const tglList = u => Object.keys(TGL).filter(id => (TGL[id].keys[u.team] || []).includes(u.key));
  const tglCdLeft = (u, id) => { const x = cdOf(u, 'tg_' + id) - turnNo; return x > 0 ? Math.ceil(x / 2) : 0; };
  function tglBlock__base(u, id) {
    if (!u || u.hp <= 0 || u.isLoaded || u.team !== currentTurn) return '지금은 사용할 수 없습니다.';
    if (suppState(u) === 2) return '고착 상태에서는 사용할 수 없습니다.';
    const c = tglCdLeft(u, id); if (c > 0) return `전환 쿨다운 ${c}턴 남음`;
    return '';
  }
  function tglBtns__base(u) {
    if (!u || !u.key || u.team !== currentTurn) return '';
    return tglList(u).map(id => {
      const D = TGL[id], on = !!(u.tgl && u.tgl[id]), why = tglBlock(u, id), cd = tglCdLeft(u, id), st = D.st || ['OFF', 'ON'];
      const head = st[on ? 1 : 0] + (cd > 0 ? ' 쿨' + cd : '');
      return `<button class="btn-action${on ? ' busy' : ''}" ${why ? 'style="opacity:.55"' : ''} onclick="useTgl('${u.id}','${id}')" title="${D.d}"><span>${D.ico} <strong>${D.n}</strong><br><small>${head} · ${why || D.d}</small></span></button>`;
    }).join('');
  }
  function useTgl(uid, id) {
    const u = uById(uid), D = TGL[id]; if (!u || !D) return;
    const why = tglBlock(u, id); if (why) { toast(why); return; }
    u.tgl = u.tgl || {}; const on = !u.tgl[id]; u.tgl[id] = on; const s = on ? 1 : -1;
    if (D.rng) u.range += s * D.rng;
    if (D.sight) u.baseSight += s * D.sight;
    if (D.imm && on) u.remainingMove = 0;
    if (D.nofire) { if (on) { u.reconPrevGd = !!u.gunDisabled; u.gunDisabled = true; } else { u.gunDisabled = !!u.reconPrevGd; } }
    setCd(u, 'tg_' + id, 1);
    addLog(`🔘 [${D.n}] ${u.className} — ${D.st ? D.st[on ? 1 : 0] : (on ? 'ON' : 'OFF')}`, 'supply');
    updateVision(); updateUnitInfoPanel(u, getTerrain(u.c, u.r)); render();
  }
  window.useTgl = useTgl;
  // 피해·명중 보정 (래퍼)
     // v127: weapon swap, site gun and Hull Down are handled inside calcDamage
  /* calcDamage: layer moved to js/chains/calcDamage.js */
  // 턴 시작: 이동 불가·주포 불가 유지
  
  /* processTurnStartStatus: layer moved to js/chains/processTurnStartStatus.js */


  // ══════════════════════════════════════════════════════════════
  // [V47] E3 패시브 훅 + 무료 스킬 5종  — COH3 이식 계획서 v47 단계
  //   · PAS: 조건부 상시 효과. 타일 없음, 정보창에만 표기. 사거리는 가감식(pasSync), 명중·피해는 calcDamage 래퍼
  //   · 패시브 5종: Take Aim(청 57mm) / 확장 광학·Shoot and Scoot(청 헬캣) / 완전 안정화(청 이지에이트) / 리드 바이 이그잼플(청 지휘관)
  //   · 무료 스킬: MUN 0 · 쿨 3턴 이상 · 대가 = 사용한 턴 공격 불가 (d.noatk, 이미 공격했으면 사용 불가)
  //     스프린트(청 소총병) / 메드킷(적 그레나디어) / 기동 질주(채피·판터) / 계속 사격(셔먼, 포탑 .50캘 필요) / 생산 감독(청 지휘관)
  // ══════════════════════════════════════════════════════════════
  const PAS = {
    takeaim: { n: 'Take Aim', ico: '🎯', keys: { blue: ['at_gun', 'm5gun'], red: [] }, d: '이동하지 않은 턴: 사거리 +1 · 명중 +5%p', still: true, rng: 1, acc: 0.05 },
    extoptic: { n: '확장 광학', ico: '🔭', keys: { blue: ['tank_dest'], red: [] }, d: '이동하지 않은 턴: 사거리 +1', still: true, rng: 1 },
    scoot: { n: 'Shoot and Scoot', ico: '🏃', keys: { blue: ['tank_dest'], red: [] }, d: '사격 후 남은 이동력 +2 (턴당 1회)', once: true },
    stab: { n: '완전 안정화', ico: '⚙', keys: { blue: ['easyeight'], red: [] }, d: '이동 후 사격 명중 패널티 없음' },
    lead: { n: '리드 바이 이그잼플', ico: '⭐', keys: { blue: ['captain'], red: [] }, d: '반경 3칸 아군 보병 명중 +10%p', acc: 0.10 }
  };
  const MF_PEN = 0;   // 이동 후 사격 패널티(전차). 현재 규칙에는 없어 0 — 값을 주면 안정화 없는 주포 차량에 적용
  const pasList = u => (u && u.key) ? Object.keys(PAS).filter(id => (PAS[id].keys[u.team] || []).includes(u.key)) : [];
  const hasPas = (u, id) => !!(u && u.key && (PAS[id].keys[u.team] || []).includes(u.key));
  function pasSync(u) {
    if (!u || !u.key || u.hp <= 0 || u.range === undefined) return;
    let want = 0; pasList(u).forEach(id => { const P = PAS[id]; if (P.still && P.rng && !u.hasMoved) want += P.rng; });
    const d = want - (u.pasRng || 0); if (d) { u.range += d; u.pasRng = want; }
  }
  const pasSyncAll = () => units.forEach(pasSync);
  const pasOn = (u, id) => PAS[id].still ? !u.hasMoved : (id === 'scoot' ? !u.scootUsed : true);
  const pasRows = u => pasList(u).map(id => { const P = PAS[id], on = pasOn(u, id); return { P, on }; });

  // 무료 스킬
  const supTargets = u => { const s = new Set(); buildings.filter(b => b.team === u.team && b.hp > 0 && getDistance(b.c, b.r, u.c, u.r) <= 1).forEach(b => { const q = queue[u.team][b.type]; if (q && q.left > 1) s.add(q); }); return [...s]; };
  mkSk('sprint', { n: '스프린트', ico: '🏃', mun: 0, cd: 3, kind: 'free', noatk: true, d: '이동 +2 · 이번 턴 공격 불가 · 쿨 3턴', run: u => { u.remainingMove += 2; return `이동력 +2 (잔여 ${u.remainingMove}) — 이번 턴 공격 불가`; } });
  mkSk('medkit', { n: '메드킷', ico: '🩹', mun: 0, cd: 4, kind: 'free', noatk: true, d: '자신+반경 1 아군 보병 HP +8% · 이번 턴 공격 불가 · 쿨 4턴', run: u => {
    const g = units.filter(a => a.team === u.team && a.hp > 0 && !a.isLoaded && a.armorType === 'soft' && getDistance(a.c, a.r, u.c, u.r) <= 1); let n = 0;
    g.forEach(a => { const b = a.hp; a.hp = Math.min(hpCap(a), a.hp + Math.max(1, Math.round(a.maxHp * 0.08))); if (a.hp > b) n++; });
    if (!n) { toast('치료할 아군 보병이 없습니다.'); return false; } return `${n}개 분대 HP +8%`; } });
  mkSk('dash', { n: '기동 질주', ico: '💨', mun: 0, cd: 3, kind: 'free', noatk: true, b: 'evade', dur: 1, d: '이동 +2 · 적 턴까지 피격 −10% · 이번 턴 공격 불가 · 쿨 3턴', run: u => { u.remainingMove += 2; return `이동력 +2 (잔여 ${u.remainingMove}) · 피격 −10%`; } });
  mkSk('contfire', { n: '계속 사격', ico: '🔫', mun: 0, cd: 3, kind: 'free', noatk: true, b: 'contfire', dur: 2, d: '다음 턴 기총 연사 +50%(보병 상대) · 이동 −15%(최소 −1) · 이번 턴 공격 불가 · 포탑 .50캘 필요', ok: u => u.pkg2 === 'cal50' ? '' : '포탑 .50캘 업그레이드 필요', run: () => '다음 턴 기총 연사 +50% · 이동 −15%' });
  mkSk('prodsup', { n: '생산 감독', ico: '📋', mun: 0, cd: 5, kind: 'free', noatk: true, d: '인접 아군 건물의 진행 중 연구 −1턴 · 이번 턴 공격 불가 · 쿨 5턴', ok: u => supTargets(u).length ? '' : '인접 건물에 2턴 이상 남은 연구가 없습니다.', run: u => { const t = supTargets(u); t.forEach(q => { q.left -= 1; }); return `연구 대기 −1턴 (${t.map(q => q.label).join(', ')})`; } });
  UNIT_SK.blue.infantry.push('sprint'); UNIT_SK.red.infantry.push('medkit');
  UNIT_SK.blue.chaffee.push('dash'); UNIT_SK.red.panther.push('dash');
  UNIT_SK.blue.sherman.push('contfire'); UNIT_SK.blue.captain.push('prodsup');

  // 무료 스킬 대가(공격 불가) 처리: 이미 공격했으면 사용 불가, 사용 시 이번 턴 공격 소모
  
  /* uskBlock: layer moved to js/chains/uskBlock.js */
  
  /* uskPay: layer moved to js/chains/uskPay.js */

  // 사거리 동기화 지점: 시야 갱신 · 행동 타일 계산 · 턴 시작 · 교전 직전
   /* updateVision: layer moved to js/chains/updateVision.js */
   /* updateActionTiles: layer moved to js/chains/updateActionTiles.js */

  // 명중·피해 보정 (래퍼): 계속 사격 연사, 기동 질주 피격 감소, Take Aim·리드 명중, 이동 후 사격 패널티
     // v127: contfire / evade / Take Aim / lead / MF_PEN live in calcOneWeapon
  /* calcDamage: layer moved to js/chains/calcDamage.js */
  // 교전: 직전 사거리 동기화 + Shoot and Scoot
  
  /* executeCombat: layer moved to js/chains/executeCombat.js */
  // 턴 시작: 사격 후 이동 초기화 · 계속 사격(다음 턴) 이동 −15% · 사거리 동기화
  
  /* processTurnStartStatus: layer moved to js/chains/processTurnStartStatus.js */
  // 정보창: 패시브 표기 (HUD 노트 + 상세 시트)
  
  /* updateUnitInfoPanel: layer moved to js/chains/updateUnitInfoPanel.js */
  
  /* openDetail: layer moved to js/chains/openDetail.js */


  // ══════════════════════════════════════════════════════════════
  // [V48] E4 차량 업그레이드 슬롯 pkg2 — COH3 이식 계획서 v48 단계
  //   · 차량 1대당 슬롯 1개(일시불·영구). 장착하면 다른 업그레이드는 모두 잠김 → 중복 불가 · 상호배타(.50캘 ↔ 스커트, 전차장 ↔ 생존)
  //   · 포탑 .50캘(셔먼) / 장갑 스커트(셔먼)·즉석 장갑(4호·판터·브룸베어) / 전차장 · 생존 패키지(스튜어트)
  // ══════════════════════════════════════════════════════════════
  const VPKG = {
    cal50: { n: '포탑 .50캘', ico: '🔫', mun: 50, keys: { blue: ['sherman'], red: [] }, d: '부무장에 ' + kitDesc('cal50') + ' 추가 · 계속 사격 해금' },
    skirt: { n: { blue: '장갑 스커트', red: '즉석 장갑' }, ico: '🛡', mun: { blue: 50, red: 40 }, keys: { blue: ['sherman'], red: ['panzer4', 'panther', 'brummbar'] }, d: '최대 HP +10%' },
    cmdr: { n: '전차장 패키지', ico: '🎖', mun: 60, keys: { blue: ['stuart'], red: [] }, d: '인접(1칸) 아군 보병 명중 +10%p · 표적 지정 해금' },
    surv: { n: '생존 패키지', ico: '🧰', mun: 40, keys: { blue: ['stuart'], red: [] }, d: '연막 해금 · 정지한 턴 다음 턴 시작에 HP +4%' }
  };
  const vpN = (id, tm) => { const n = VPKG[id].n; return typeof n === 'string' ? n : n[tm]; };
  const vpM = (id, tm) => { const m = VPKG[id].mun; return typeof m === 'number' ? m : m[tm]; };
  const vpList = u => (u && u.key && u.armorType === 'hard') ? Object.keys(VPKG).filter(id => (VPKG[id].keys[u.team] || []).includes(u.key)) : [];
  function vpBlock(u, id) {
    if (!u || u.hp <= 0 || u.isLoaded || u.team !== currentTurn) return '지금은 사용할 수 없습니다.';
    if (!vpList(u).includes(id)) return '장착할 수 없는 차량입니다.';
    if (u.pkg2) return `이미 ${vpN(u.pkg2, u.team)} 장착 — 슬롯 1개`;
    if (mun[u.team] < vpM(id, u.team)) return '뮤니션이 부족합니다.';
    return '';
  }
  function buyVpkg(uid, id) {
    const u = uById(uid), why = vpBlock(u, id); if (why) { toast(why); return; }
    const cost = vpM(id, u.team); mun[u.team] -= cost; u.pkg2 = id;
    if (id === 'cal50') { const k = kitProfile('cal50'); if (u.raw && k) equipSub(u, joinRaw(u.sub, k)); else equipSub(u, MG50_CAL); }   // v162: the .50cal joins the coax / hull pair
    if (id === 'skirt') { const d = Math.max(1, Math.round(u.maxHp * 0.1)); u.maxHp += d; u.hp += d; }
    addLog(`${VPKG[id].ico} [업그레이드] ${u.className} — ${vpN(id, u.team)} 장착 (💣${cost})`, 'supply');
    updateGoldUI(); updateVision(); updateUnitInfoPanel(u, getTerrain(u.c, u.r)); render();
  }
  window.buyVpkg = buyVpkg;
  // 버튼 주입: HUD 재구성 직전에 specialActionsEl에 추가 (타일은 '무장' 그룹)
  
  /* rebuildHud: layer moved to js/chains/rebuildHud.js */
  // 포탑 .50캘: 제압 +10
  
  /* suppressionOf: layer moved to js/chains/suppressionOf.js */   // v127: .50cal suppression comes from its secondary-weapon profile
  // 생존 패키지: 마지막 내 턴에 이동하지 않았으면 턴 시작에 HP +4%
  
  /* updateVision: layer moved to js/chains/updateVision.js */
  
  /* processTurnStartStatus: layer moved to js/chains/processTurnStartStatus.js */
  // 징집 미리보기에 업그레이드 안내
  
  /* previewUnit: layer moved to js/chains/previewUnit.js */


  // ══════════════════════════════════════════════════════════════
  // [V49] 뮤니 스킬 보강 — COH3 이식 계획서 v49 단계
  //   · 상한: 병종당 고유 스킬 중 뮤니(MUN>0) 2개 이하 (무료·패시브·토글·무장 제외). 초과하는 항목은 기존 스킬과 교체하거나 보류
  //   · 신규: 접착 대전차탄 · WP 로켓/WP 포탄 · 대전차 지뢰(청)/Teller 지뢰(적) · 충격 연막탄 · 뭉치수류탄 · 소총 연막 · 소이 연막 · 연속 포격
  //   · 기존 재배치: 점사 사격(소총병·그레나디어) · 철갑탄 벨트(MG 청·적, 25 MUN)
  // ══════════════════════════════════════════════════════════════
  // WP: 차량은 주포 1턴 불능 + 시야 −2 (적 다음 턴 동안), 보병은 제압 +30
  function wpApply(u, tu) {
    if (tu.armorType !== 'hard') { addSuppression(tu, 30); return `${tu.className} 제압 +30`; }
    if (!tu.wpGun) { tu.wpPrev = !!tu.gunDisabled; tu.wpSightD = Math.min(2, Math.max(0, tu.baseSight - 1)); tu.baseSight -= tu.wpSightD; }
    tu.wpGun = turnNo; tu.gunDisabled = true;
    updateVision(); return `${tu.className} 주포 1턴 불능 · 시야 −${tu.wpSightD}`;
  }
  const wpDef = (n, ico, mun, rng, d) => ({ n, ico, mun, cd: 3, t: 'tgt', who: 'enemy', rng, vis: true, act: true, d, run: (u, h, tu) => wpApply(u, tu) });
  mkSk('wp_rkt', wpDef('WP 로켓', '💨', 30, 4, '백린탄: 차량 주포 1턴 불능 · 시야 −2 / 보병 제압 +30'));
  mkSk('wp_shell', wpDef('WP 포탄', '💨', 30, u => u.range, '백린탄: 차량 주포 1턴 불능 · 시야 −2 / 보병 제압 +30'));
  
  /* processTurnStartStatus: layer moved to js/chains/processTurnStartStatus.js */
  // 접착 대전차탄 (HP ≤ 50% 이면 궤도 손상)
  mkSk('sticky', { n: '접착 대전차탄', ico: '💣', mun: 35, cd: 3, t: 'tgt', who: 'enemy', rng: 3, vis: true, act: true, d: '근접 투척 (공격력 34 · 관통 확정) · 대상 HP ≤ 50% 이면 궤도 손상', run: (u, h, tu) => {
    if (tu.armorType !== 'hard') { hint2('❌ 적 차량을 지정하세요'); return false; }
    throwAt(u, tu, 4, 1000, 0, '💣 [접착 대전차탄]', 34);
    if (tu.hp > 0 && tu.hp <= tu.maxHp * 0.5 && !tu.trackDamaged) { tu.trackDamaged = true; tu.trackTurns = 0; addLog(`⛓ [궤도 손상] ${tu.className} — 접착탄 폭발`, 'crit'); }
    return `${tu.className} 접착탄 부착`; } });
  // 대전차 지뢰 (청) / Teller 지뢰 (적 공병): 인접 빈 칸에 설치
  const mineSk = (n, mun, mul) => ({ n, ico: '⛔', mun, cd: 2, t: 'tgt', who: 'hex', rng: 1, d: `인접 빈 칸에 대전차 지뢰 매설 (피해 ×${mul})`, run: (u, h) => {
    const t = getTerrain(h.c, h.r);
    if (getUnitAt(h.c, h.r) || getBuildingAt(h.c, h.r) || mines.some(m => m.c === h.c && m.r === h.r) || !t || (TERRAIN_DEFS[t.terrainType] || {}).veh === Infinity) { hint2('❌ 지뢰를 매설할 수 없는 칸입니다'); return false; }
    mines.push({ c: h.c, r: h.r, team: u.team, cost: { g: 0, f: 0 }, dmgMul: (vetV(u).mineDmg || 1) * mul }); return `(${h.c},${h.r}) ${n} 매설`; } });
  mkSk('atmine', mineSk('대전차 지뢰', 30, 1.5));
  mkSk('tellermine', mineSk('Teller 지뢰', 40, 1.8));
  // 충격 연막탄 (반경 1 연막 + 제압 +25)
  mkSk('shocksmk', { n: '충격 연막탄', ico: '🌫', mun: 25, cd: 2, t: 'tgt', who: 'hex', rng: 4, vis: true, act: true, d: '반경 1 연막 · 범위 내 적 보병 제압 +25', run: (u, h) => {
    const hx = ring(h.c, h.r, 1); smokes.push({ c: h.c, r: h.r, team: u.team, expire: turnNo + 2, hexes: hx });
    const g = units.filter(e => e.team !== u.team && e.hp > 0 && !e.isLoaded && e.armorType === 'soft' && getDistance(e.c, e.r, h.c, h.r) <= 1); g.forEach(e => addSuppression(e, 25));
    return `(${h.c},${h.r}) 연막 · ${g.length}개 분대 제압`; } });
  // 뭉치수류탄 (넓은 범위 피해)
  mkSk('bundle', { n: '뭉치수류탄', ico: '💣', mun: 40, cd: 3, t: 'tgt', who: 'enemy', rng: 3, vis: true, act: true, d: '근접 투척 (공격력 46 · 범위 2.5명 · 제압 +35)', run: (u, h, tu) => { throwAt(u, tu, 65, 40, 35, '💣 [뭉치수류탄]', 46); return `${tu.className} 투척`; } });
  // 소총 연막 (예거)
  mkSk('rsmoke', { n: '소총 연막', ico: '🌫', mun: 20, cd: 2, t: 'tgt', who: 'hex', rng: 4, vis: true, act: true, d: '소총 연막탄: 지정 칸 반경 1 연막', run: smk3(1) });
  // 소이 연막 (네벨베르퍼): 연막 + 화염 지대
  mkSk('incsmk', { n: '소이 연막', ico: '🔥', mun: 25, cd: 3, t: 'tgt', who: 'hex', rng: u => u.range, useMin: true, vis: true, act: true, still: true, am: 1, d: '반경 1 연막 + 화염 지대 2턴', run: (u, h) => {
    smokes.push({ c: h.c, r: h.r, team: u.team, expire: turnNo + 2, hexes: ring(h.c, h.r, 1) });
    fires.push({ team: u.team, c: h.c, r: h.r, expire: turnNo + 4, hexes: ring(h.c, h.r, 1), zm: vetV(u).flameZone }); return `(${h.c},${h.r}) 소이 연막 전개`; } });
  // 연속 포격 (위즈뱅 · 프리스트): 2턴에 걸쳐 2발씩
  mkSk('contbar', { n: '연속 포격', ico: '💥', mun: 30, cd: 3, t: 'tgt', who: 'hex', rng: u => u.range, useMin: true, vis: true, act: true, still: true, am: 1, d: '2발씩 2턴 연속 착탄 (다음 내 턴 시작 · 그다음 턴 시작)', run: (u, h) => {
    pendingStrikes.push({ team: u.team, c: h.c, r: h.r, shells: 2, rad: 1, P: 50, A: 36, custom: true, n: '연속 포격 1차' });
    pendingStrikes.push({ team: u.team, c: h.c, r: h.r, shells: 2, rad: 1, P: 50, A: 36, custom: true, n: '연속 포격 2차', due: turnNo + 4 }); return `(${h.c},${h.r}) 연속 포격 요청`; } });
  // 병종 배치 (뮤니 2개 이하)
  // v129: base AT weapons of the mainline squads (CoH3: riflemen's M9 AT rifle grenade, grenadiers' Panzerfaust)
  mkSk('atrg', { n: 'AT 총류탄', ico: '🎯', mun: 35, cd: 3, t: 'tgt', who: 'enemy', rng: 4, vis: true, act: true, d: 'M9 대전차 총류탄 (공격력 34 · 관통 10) · 차량 전용', run: (u, h, tu) => {
    if (tu.armorType !== 'hard') { hint2('❌ 적 차량을 지정하세요'); return false; }
    throwAt(u, tu, 6, 18, 0, '🎯 [AT 총류탄]', 34); return `${tu.className} AT 총류탄 발사`; } });
  mkSk('faust', { n: '판저파우스트', ico: '🚀', mun: 45, cd: 3, t: 'tgt', who: 'enemy', rng: 3, vis: true, act: true, d: '대전차 로켓 (공격력 40 · 관통 확정)', run: (u, h, tu) => {
    throwAt(u, tu, 28, 1000, 25, '🚀 [판저파우스트]', 40); return `${tu.className} 판저파우스트 발사`; } });
  const SK49 = {
    blue: { infantry: ['burst', 'atrg', 'sprint'], engineer: ['demo', 'atmine'], at_inf: ['aim', 'wp_rkt'], hmg: ['burst', 'apbelt'], priest: ['bar_h', 'contbar'], whizbang: ['rocket', 'contbar'], transport: ['smoke_self', 'atmine'], sherman: ['smoke_self', 'wp_shell', 'contfire'] },
    red: { infantry: ['rgren', 'faust', 'burst', 'medkit'], engineer: ['demo', 'tellermine'], fp_pioneer: ['demo', 'tellermine'], sturmtruppen: ['stormcharge', 'shocksmk'], panzergren: ['charge', 'bundle'], jager: ['camo', 'rsmoke'], hmg: ['burst', 'apbelt'], nebel: ['rocket', 'incsmk'], transport: ['smoke_self', 'atmine'] }
  };
  Object.keys(SK49).forEach(tm => Object.keys(SK49[tm]).forEach(k => { UNIT_SK[tm][k] = SK49[tm][k]; }));


  // ══════════════════════════════════════════════════════════════
  // [V50] 보류 4건 반영 — 계획서 v50 단계
  //   · 박격포 공중 폭발탄 (뮤니 3개 허용) · Pak 40 약점 사격 (텅스텐 철갑탄과 교체) · 티거 S-마인 (뮤니 3개 허용) · 저격수 무력화 사격 (뮤니 3개 허용)
  //   · 상한 예외: mortar · tiger · sniper 만 뮤니 3개. 그 외 병종은 2개 이하 유지
  // ══════════════════════════════════════════════════════════════
  // 시야 감소 디버프 (2턴 · 만료 시 원복) — WP 와 별도 필드
  function sightDown50(tu, n) {
    if (!tu.slSight) { tu.slSightD = Math.min(n, Math.max(0, tu.baseSight - 1)); tu.baseSight -= tu.slSightD; }
    tu.slSight = turnNo; updateVision();
  }
  
  /* processTurnStartStatus: layer moved to js/chains/processTurnStartStatus.js */
  const trackHit50 = (tu, why) => { if (tu.hp > 0 && !tu.trackDamaged) { tu.trackDamaged = true; tu.trackTurns = 0; addLog(`⛓ [궤도 손상] ${tu.className} — ${why}`, 'crit'); } };
  // 박격포 공중 폭발탄: 2발 · 반경 1 · 엄폐 무시(포격 공통) · 제압 +20 — 다음 내 턴 시작 시 착탄
  mkSk('airburst', { n: '공중 폭발탄', ico: '✴️', mun: 20, cd: 3, t: 'tgt', who: 'hex', rng: u => u.range, useMin: true, vis: true, act: true, still: true, am: 1, d: '2발 · 반경 1 공중 폭발 (엄폐 무시) · 범위 내 적 보병 제압 +20 — 다음 내 턴 시작 시 착탄', run: (u, h) => {
    pendingStrikes.push({ team: u.team, c: h.c, r: h.r, shells: 2, rad: 1, P: 36, A: 24, supp: 20, custom: true, n: '공중 폭발탄' }); return `(${h.c},${h.r}) 공중 폭발탄 요청 — 다음 턴 착탄`; } });
  // Pak 40 약점 사격: 적 차량 (공격력 14 · 관통 확정) + 궤도 손상 + 시야 −1 (2턴)
  mkSk('weakpt', { n: '약점 사격', ico: '🎯', mun: 30, cd: 3, t: 'tgt', who: 'enemy', rng: u => u.range, vis: true, act: true, d: '적 차량 관절부 저격 (공격력 14 · 관통 확정) · 궤도 손상 + 시야 −1 (2턴)', run: (u, h, tu) => {
    if (tu.armorType !== 'hard') { hint2('❌ 적 차량을 지정하세요'); return false; }
    throwAt(u, tu, 4, 1000, 0, '🎯 [약점 사격]', 14);
    if (tu.hp > 0) { trackHit50(tu, '약점 사격'); sightDown50(tu, 1); }
    return `${tu.className} 약점 사격`; } });
  // 티거 S-마인: 자기 반경 1 적 보병 피해 + 제압 (공격 행동 소모 없음)
  mkSk('smine', { n: 'S-마인 발사', ico: '💥', mun: 30, cd: 3, d: '반경 1 적 보병 피해 (공격력 13 · 범위 4.8명) · 제압 +25', run: u => {
    const g = units.filter(e => e.team !== u.team && e.hp > 0 && !e.isLoaded && e.armorType === 'soft' && getDistance(e.c, e.r, u.c, u.r) <= 1);
    if (!g.length) { toast('반경 1칸 내에 적 보병이 없습니다.'); return false; }
    g.forEach(e => throwAt(u, e, 36, 24, 25, '💥 [S-마인]')); return `${g.length}개 분대 S-마인 피해`; } });
  // 저격수 무력화 사격: 차량 궤도 손상 + 시야 −1 (2턴) / 보병 1모델분 피해 + 제압 +20. 사격이므로 위장 해제
  mkSk('cripple', { n: '무력화 사격', ico: '🎯', mun: 30, cd: 3, t: 'tgt', who: 'enemy', rng: u => u.range, vis: true, act: true, d: '차량: 궤도 손상 + 시야 −1 (2턴) / 보병: 1모델분 피해 · 제압 +20 (사격 시 위장 해제)', run: (u, h, tu) => {
    if (tu.armorType === 'hard') { trackHit50(tu, '무력화 사격'); sightDown50(tu, 1); }
    else {
      const dmg = Math.min(tu.hp, Math.max(1, modelHit(tu)));
      tu.hp -= dmg; addLog(`🎯 [무력화 사격] ${u.className} ➔ ${tu.className} [-${dmg} HP]`, 'crit'); addSuppression(tu, 20);
      addVeterancyExp(u, 2, 'atk'); if (tu.hp <= 0) { tu.hp = 0; claimKillBounty(u, tu); addVeterancyExp(u, 8, tu); }
    }
    if (u.buff && u.buff.camo) { delete u.buff.camo; addLog(`🫥 [위장 해제] ${u.className} — 사격으로 노출`, 'move'); }
    return `${tu.className} 무력화 사격`; } });
  const SK50 = {
    blue: { mortar: ['smk_m', 'bar_m', 'airburst'], sniper: ['camo', 'steady', 'cripple'] },
    red: { mortar: ['smk_m', 'bar_m', 'airburst'], sniper: ['camo', 'steady', 'cripple'], at_gun: ['camo', 'weakpt'], tiger: ['hvap', 'terror', 'smine'] }
  };
  Object.keys(SK50).forEach(tm => Object.keys(SK50[tm]).forEach(k => { UNIT_SK[tm][k] = SK50[tm][k]; }));

