  // ══════════════════════════════════════════════════════════════
  // [17s] v130 — distance bands, HMG cone, vehicle reverse, HQ resupply, range arcs, multi-target HP preview
  // ══════════════════════════════════════════════════════════════
  // near = 1 .. ceil(0.4 R), far = the last ceil(0.2 R) hexes, mid in between (R 5: 1–2 / 3–4 / 5, R 4: 1–2 / 3 / 4)
  function bandEnds(R) { if (V200.THIRDS) return v200Ends(R); const c = Math.max(1, Math.ceil(R * 0.4 - 1e-9)); return [c, Math.max(c, R - Math.ceil(R * 0.2 - 1e-9))]; }

  // ---------- HMG cone: enemies within ±15° of the line to the target take half damage and full suppression ----------
  function v130Angle(a, b) { const A = getHexCenter(a.c, a.r), B = getHexCenter(b.c, b.r), v = unproj(B.x - A.x, B.y - A.y); return Math.atan2(v.y, v.x); }
  function v130InCone(src, tgt, o) { let d = v130Angle(src, o) - v130Angle(src, tgt); d = Math.abs(Math.atan2(Math.sin(d), Math.cos(d))); return d <= V130.cone + 1e-3; }
  function v130ConeTargets(att, tc, tr) {
    if (!att || !att.cone) return [];
    const tgt = { c: tc, r: tr };
    return units.filter(o => {
      if (o.team === att.team || o.hp <= 0 || o.isLoaded || (o.c === tc && o.r === tr)) return false;
      if (!visibleHexes.has(o.c + ',' + o.r) || (o.buff && o.buff.camo)) return false;
      const d = getDistance(att.c, att.r, o.c, o.r);
      if (d < 1 || d > att.range || d < (att.minRange || 0) || !isInFiringArc(att, o.c, o.r)) return false;
      return checkElevationCombatRule(att, o).allowed && v130InCone(att, tgt, o);
    });
  }
  function v130Hit(att, o, dmg, res, tag) {
    o.hp -= dmg;
    addLog(`🔫 [${tag}] ${o.className} [${dmg} 피해]`, 'normal');
    if (o.hp <= 0) { o.hp = 0; claimKillBounty(att, o); addVeterancyExp(att, 8, o); checkVictory(); }
    else applyHitEffects(att, o, res);
  }
  
  /* executeCombat: layer moved to js/chains/executeCombat.js */
  function v130BunkerCone(b, enemy) {
    units.filter(o => o !== enemy && o.team !== b.team && o.hp > 0 && !o.isLoaded && o.armorType === 'soft' && getDistance(b.c, b.r, o.c, o.r) <= 4
      && visibleHexes.has(`${o.c},${o.r}`) && !inSmoke(o) && losClear(b, o.c, o.r) && v130InCone(b, enemy, o)).forEach(o => {
      const dmg = Math.round(V130.bunkerDmg * V130.coneK); o.hp -= dmg;
      addLog(`[MG벙커 부채꼴] ${o.className} [-${dmg} HP]`, 'eng');
      if (o.hp > 0) addSuppression(o, 50); else { o.hp = 0; checkVictory(); }
    });
  }

  // ---------- vehicles: reverse inside the rear 120° (+1 move per hex, facing kept), turning costs 1 move per 60° ----------
  const v130Reverses = u => !!u && u.armorType === 'hard' && !u.isHeavy && u.facingAngle !== undefined && !!u.key && !(u.type && BLD[u.type]);
  
  
  // v131: reverse movement removed — vehicles turn in place with a long press (1 move, any angle)
  function v130RotStart(u) { if (typeof V185 !== 'undefined') { if (!(V185.pend && V185.pend.kind && V185.pend.u === u)) V185.pend = null; V185.rot = null; } if (v130Reverses(u)) { u._rot0 = u.facingAngle; u._mv0 = u.remainingMove; } }
  function v130RotClamp(u, a) {   // v131: any angle for a flat 1 move
    if (u._rot0 === undefined) return a;
    let d = a - u._rot0; d = Math.atan2(Math.sin(d), Math.cos(d));
    if (v183On(u) && Math.abs(d) > V183.rotMax) { d = Math.sign(d) * V183.rotMax; a = u._rot0 + d; }   // v183: ±60° per turn action
    u.remainingMove = Math.abs(d) > Math.PI / 180 ? u._mv0 - 1 : u._mv0;
    return a;
  }
  function v130RotEnd(u) {
    if (!u || u._rot0 === undefined) return;
    const spent = u._mv0 - u.remainingMove;
    if (spent > 0) addLog(`[선회] ${u.className} 제자리 회전 (이동력 −${spent}, 잔여 ${u.remainingMove})`, 'move');
    delete u._rot0; delete u._mv0; if (window.rotUnit === u) window.rotUnit = null;
  }

  // ---------- HQ: units within 3 hexes refill half their ammo at turn start ----------
  
  /* processTurnStartStatus: layer moved to js/chains/processTurnStartStatus.js */

  // ---------- heavy-weapon arcs and enemy MG fields of fire ----------
  function v130DrawArcs() {
    const sel = (isDraggingFacing && facingUnit) ? facingUnit : selectedUnit, far = zoom < V98.chipZoom, px = 1 / zoom;
    units.forEach(u => {
      if (!u.isHeavy || u.isNebel || u.hp <= 0 || u.isLoaded || u.armorType !== 'soft' || !u.arcAngle || u.arcAngle >= 6.28) return;
      if (u.team !== currentTurn && (!visibleHexes.has(`${u.c},${u.r}`) || (u.buff && u.buff.camo))) return;
      if (v159Crew(u) && !v159Emplaced(u)) return;   // v186: packed up (not set up) — no firing-arc lines (the turn preview draws its own)
      const isSel = u === sel && (V130.arc !== 'off' || isDraggingFacing);
      if (!isSel && (V130.arc === 'off' || far)) return;
      const tc0 = getHexCenter(u.c, u.r), tR = u.range * HEX_RADIUS * 1.8, a0 = u.facingAngle - u.arcAngle / 2, a1 = u.facingAngle + u.arcAngle / 2;
      const col = u.team === 'blue' ? '120,170,240' : '240,130,120';
      ctx.save(); ctx.translate(tc0.x, tc0.y); ctx.transform(COSA, TILT * SINA, -SINA, TILT * COSA, 0, 0);
      ctx.lineJoin = 'round'; ctx.setLineDash([]);   // v131: 3 px solid yellow
      if (isSel) {
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, tR, a0, a1); ctx.closePath();
        ctx.fillStyle = 'rgba(250,204,21,.07)'; ctx.fill(); ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2 * px; ctx.stroke();
      } else if (V130.arc === 'all') {
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, tR, a0, a1); ctx.closePath();
        ctx.strokeStyle = 'rgba(250,204,21,.5)'; ctx.lineWidth = 2 * px; ctx.stroke();
      } else {   // edge ticks only: the facing reads, the lines never cross the map
        const e = Math.min(.14, u.arcAngle / 4);
        ctx.strokeStyle = 'rgba(250,204,21,.5)'; ctx.lineWidth = 2 * px; ctx.beginPath();
        [a0, a1].forEach(a => { ctx.moveTo(Math.cos(a) * tR * .78, Math.sin(a) * tR * .78); ctx.lineTo(Math.cos(a) * tR, Math.sin(a) * tR); });
        ctx.moveTo(Math.cos(a0) * tR, Math.sin(a0) * tR); ctx.arc(0, 0, tR, a0, a0 + e);
        ctx.moveTo(Math.cos(a1 - e) * tR, Math.sin(a1 - e) * tR); ctx.arc(0, 0, tR, a1 - e, a1);
        ctx.stroke();
      }
      ctx.restore();
    });
  }
  function v130DangerSet() {
    const s = selectedUnit;
    if (!s || s.team !== currentTurn || s.armorType !== 'soft' || !validMoves.length) return null;
    const mgs = units.filter(m => m.team !== s.team && m.hp > 0 && !m.isLoaded && v159Watcher(m) && v159TargetOk(m, s) && visibleHexes.has(m.c + ',' + m.r) && !(m.buff && m.buff.camo));   // v159: watch fire zones
    const bks = bunkers.filter(b => b.team !== s.team && b.type === 'mg' && b.hp > 0 && visibleHexes.has(b.c + ',' + b.r));
    if (!mgs.length && !bks.length) return null;
    const set = new Set();
    validMoves.forEach(t => {
      if (mgs.some(m => { const d = getDistance(m.c, m.r, t.c, t.r); return d >= 1 && d <= m.range && isInFiringArc(m, t.c, t.r) && losClear(m, t.c, t.r); })
        || bks.some(b => getDistance(b.c, b.r, t.c, t.r) <= 4 && losClear(b, t.c, t.r))) set.add(t.c + ',' + t.r);
    });
    return set;
  }
  { const KEY = 'coh1944.arcs', b = document.getElementById('v130-arc-btn'), N = { sel: '선택만', all: '모두', off: '끄기' }, ORD = ['sel', 'all', 'off'];
    try { const v = localStorage.getItem(KEY); if (N[v]) V130.arc = v; } catch (e) { }
    if (b) { const lab = () => b.textContent = '중화기 사거리선: ' + N[V130.arc]; lab(); b.addEventListener('click', () => { V130.arc = ORD[(ORD.indexOf(V130.arc) + 1) % 3]; try { localStorage.setItem(KEY, V130.arc); } catch (e) { } lab(); render(); }); } }

  // ---------- attack preview: HP loss on every banner the attack would touch ----------
  function v130PreviewList(att, def) {
    const res = calcDamage(att, def, true), L = [{ ref: def, next: Math.max(0, def.hp - res.damage) }];
    if (L[0].next > 0 && def.range !== undefined && def.ammo > 0 && def.counterAttacksLeft > 0 && !(def.buff && def.buff.retreat > 0)
      && suppState(def) < 1 && !(def.armorType === 'soft' && ((def.suppression || 0) + (res.suppress || 0)) >= 50)) {
      const d = getDistance(def.c, def.r, att.c, att.r), m = mainReach(def, att.c, att.r, d), sb = subReach(def, att.c, att.r, d);
      if ((m || sb) && (checkElevationCombatRule(def, att).allowed || (sb && !m))) L.push({ ref: att, next: Math.max(0, att.hp - calcDamage(def, att, true).damage) });
    }
    v130ConeTargets(att, def.c, def.r).forEach(o => L.push({ ref: o, next: Math.max(0, o.hp - Math.round(calcDamage(att, o, true).damage * V130.coneK)), cone: true }));
    if (att.isMortar || att.isNebel) {
      const k = att.isNebel ? .6 : .5;
      getHexNeighbors(def.c, def.r).forEach(n => { const o = getUnitAt(n.c, n.r); if (o && o.hp > 0) L.push({ ref: o, next: Math.max(0, o.hp - Math.max(2, Math.floor(res.damage * k))) }); });
    }
    return L;
  }
  
  /* showAttackPreview: layer moved to js/chains/showAttackPreview.js */
  
  /* render: layer moved to js/chains/render.js */

