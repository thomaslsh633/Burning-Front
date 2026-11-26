  // ══════════════════════════════════════════════════════════════
  // [v185] Hull turn by long press = propose, then confirm; fixed-gun tanks get a firing arc.
  //   · dragging only moves a translucent ghost + arrow (the hull stays); releasing keeps the ghost, a second tap on the unit confirms:
  //     1 move, the hull pivots (v180 turn animation, the turret follows); a tap anywhere else, or dragging back onto the unit, cancels. No text prompt.
  //   · fixed-gun tanks (StuG III, Brummbar, Marder III): main gun only inside a 120° arc around the hull; attacking never turns the hull;
  //     turning is ±60° per action like the Sherman / Panzer IV. Counter fire follows the same arc.
  // ══════════════════════════════════════════════════════════════
  var V185 = { rot: null, pend: null, ghost: false };
  var V184 = { arc: Math.PI * 2 / 3, gate: true, keys: { red: { stug: 1, brummbar: 1, tank_dest: 1, wanze: 1, stummel: 1, pzb221: 1 }, blue: { m3gmc: 1 } } };   // v191: per team (the Allied tank_dest = M18 has a turret)   // v187: gate on again — fire only inside the 120° arc around the hull; the hull then aligns to the target for free (v186)
  function v184Fixed(u) { return !!u && u.armorType === 'hard' && !!(V184.keys[u.team] || {})[u.key] && !(u.type && BLD[u.type]); }
  function v184InArc(u, c, r) {
    if (!V184.gate) return true;
    const A = getHexCenter(u.c, u.r), B = getHexCenter(c, r), v = unproj(B.x - A.x, B.y - A.y); if (!v.x && !v.y) return true;
    return Math.abs(v173Ang(Math.atan2(v.y, v.x) - u.facingAngle)) <= V184.arc / 2 + 1e-4;
  }
  const v185Limited = u => v183On(u) || v184Fixed(u);
  var V197 = { free: Math.PI * 2 / 3 };   // v197: hull turns up to 120° cost 1 move, wider turns 2
  const v197Cost = (u, d) => !u || u.isHeavy ? 0 : (Math.abs(d) > V197.free + .01 ? 2 : 1);
  function v185Begin(u) { if (!(V185.pend && V185.pend.kind && V185.pend.u === u)) V185.pend = null; V185.rot = null; u._rot0 = u.facingAngle; }   // heavy weapons: same propose / confirm turn (no move cost)
  function v185Drag__base(u, ang, dist) {
    if (dist < HEX_RADIUS * .5) { V185.rot = null; return; }   // dead zone around the unit = cancel
    let d = v173Ang(ang - u._rot0);
    if (v185Limited(u) && Math.abs(d) > V183.rotMax) d = Math.sign(d) * V183.rotMax;
    V185.rot = { u, a: u._rot0 + d, d };
  }
  function v185Release(u) {
    const R = V185.rot; V185.rot = null; v130RotEnd(u);
    const K = V185.pend && V185.pend.kind && V185.pend.u === u ? V185.pend : null;
    if (K) { if (R && R.u === u) K.a = R.a; return; }   // v188: aim mode already open — the drag only moves the proposed direction
    if (!R || R.u !== u || Math.abs(R.d) <= 4 * Math.PI / 180) return;
    if (v188Aimable(u) || (!u.isHeavy && u.remainingMove >= 1)) V185.pend = { u, a: R.a, c: u.c, r: u.r, kind: 'turn' };
    if (V185.pend && V185.pend.u === u && selectedUnit !== u) { selectedUnit = u; updateActionTiles(u); }   // v188: the panel button confirms, so the unit gets selected
  }
  function v185Confirm__base() {
    const P = V185.pend; V185.pend = null; const u = P && P.u;
    const cost = u ? v197Cost(u, v173Ang(P.a - u.facingAngle)) : 0;
    if (u && u.hp > 0 && u.remainingMove < cost && u.c === P.c && u.r === P.r) { V185.pend = P; toast('이동력이 부족합니다 (120° 초과 선회는 이동력 2).'); render(); return; }   // v197: keep the proposal open
    if (!u || u.hp <= 0 || u.remainingMove < cost || u.c !== P.c || u.r !== P.r || (u.isHeavy && v159Emplaced(u))) { render(); return; }
    const old = u.facingAngle, d = v173Ang(P.a - old), now = v174Now();
    if (v183On(u) && u._tur && !u.engaged) { if (!reduceMotion()) V183.re.set(u, { from: u._tur.a, t0: now, dur: 350 }); delete u._tur; }   // v194: an engaged unit keeps the turret direction when the hull turns
    u.facingAngle = P.a; u.remainingMove = Math.max(0, u.remainingMove - cost);
    if (u.isHeavy) addLog(`[화망 방향] ${u.className} 사격 방향 회전 완료`, 'arc'); else addLog(`[선회] ${u.className} 제자리 회전 (이동력 −${cost}, 잔여 ${u.remainingMove})`, 'move');
    if (!reduceMotion()) { v180TurnSet(u, old, d, now, v180TurnMs(u, d, false)); v174Kick(); }
    updateActionTiles(u); updateUnitInfoPanel(u, getTerrain(u.c, u.r)); render();
  }
  function v185Ghost(u) {
    const R = V185.rot, P = V185.pend;
    if (R && R.u === u && isDraggingFacing) return R.a;
    if (P && P.u === u) { if (u.c !== P.c || u.r !== P.r || u.hp <= 0 || u.team !== currentTurn) { V185.pend = null; return null; } return P.a; }
    return null;
  }
  {  /* drawUnitArt: layer moved to js/chains/drawUnitArt.js */ }
  function v185DrawOverlay() {
    v190DrawAimTiles();   // v190
    const dragU = isDraggingFacing && facingUnit && facingUnit._rot0 !== undefined ? facingUnit : null, pendU = V185.pend ? V185.pend.u : null;
    const rU = dragU || pendU, fixU = rU && v184Fixed(rU) ? rU : (selectedUnit && selectedUnit.team === currentTurn && selectedUnit.hp > 0 && !selectedUnit.isLoaded && v184Fixed(selectedUnit) ? selectedUnit : null);
    if (!rU && !fixU) return;
    const u = rU || fixU, c0 = getHexCenter(u.c, u.r), R = HEX_RADIUS * 1.9, base = u._rot0 !== undefined ? u._rot0 : u.facingAngle, aim = rU ? v185Ghost(rU) : null, ctr = aim !== null ? aim : u.facingAngle;
    ctx.save(); ctx.translate(c0.x, c0.y); ctx.transform(COSA, TILT * SINA, -SINA, TILT * COSA, 0, 0);
    if (fixU && V184.gate) {   // firing arc of a fixed gun (around the direction it would have after the turn)
      const tR = (fixU.range || 6) * HEX_RADIUS * 1.8, a0 = ctr - V184.arc / 2, a1 = ctr + V184.arc / 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, tR, a0, a1); ctx.closePath(); ctx.fillStyle = 'rgba(250,204,21,.10)'; ctx.fill(); ctx.strokeStyle = 'rgba(250,204,21,.6)'; ctx.lineWidth = 1; ctx.stroke();
    }
    if (rU) {
      if (!rU.isHeavy) {   // v197: the 1-move zone of this turn action (±120°); beyond it costs 2
        const m = V197.free, a0 = base - m, a1 = base + m;
        ctx.beginPath(); ctx.moveTo(Math.cos(a0) * R * .3, Math.sin(a0) * R * .3); ctx.lineTo(Math.cos(a0) * R * 1.08, Math.sin(a0) * R * 1.08); ctx.arc(0, 0, R * 1.08, a0, a1); ctx.lineTo(Math.cos(a1) * R * .3, Math.sin(a1) * R * .3);
        ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.4; ctx.setLineDash([3, 2]); ctx.stroke(); ctx.setLineDash([]);
      }
      if (aim !== null && rU.isHeavy && rU.arcAngle && rU.arcAngle < 6.28) {   // the firing arc the weapon will have after the turn
        const tR = rU.range * HEX_RADIUS * 1.8, a0 = aim - rU.arcAngle / 2, a1 = aim + rU.arcAngle / 2;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, tR, a0, a1); ctx.closePath(); ctx.fillStyle = 'rgba(250,204,21,.07)'; ctx.fill(); ctx.strokeStyle = '#facc15'; ctx.lineWidth = 1.4; ctx.stroke();
      }
      if (aim !== null) {   // arrow to the proposed direction
        const ex = Math.cos(aim) * R * 1.0, ey = Math.sin(aim) * R * 1.0, hx = Math.cos(aim + 2.7) * 5, hy = Math.sin(aim + 2.7) * 5, gx = Math.cos(aim - 2.7) * 5, gy = Math.sin(aim - 2.7) * 5;
        ctx.beginPath(); ctx.moveTo(Math.cos(aim) * R * .35, Math.sin(aim) * R * .35); ctx.lineTo(ex, ey); ctx.moveTo(ex + hx, ey + hy); ctx.lineTo(ex, ey); ctx.lineTo(ex + gx, ey + gy);
        ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 1.8; ctx.lineCap = 'round'; ctx.stroke();
      }
    }
    ctx.restore();
  }

