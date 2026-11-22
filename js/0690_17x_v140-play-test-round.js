  // ══════════════════════════════════════════════════════════════
  // [17*] v140 — play-test round 2
  //   · retreat: no teleport — ×1.6 movement toward the team's rally point, received accuracy ×0.5, no return fire;
  //     not after attacking / using an ability this turn; the unit walks on by itself every turn start until it is within
  //     3 hexes of the rally point and takes no other action meanwhile. Rally point = HQ (default) or an outpost the
  //     player designates from the building panel; a newer designation replaces the old one, a lost outpost falls back to the HQ
  //   · squads: received accuracy −30 % × (lost men / (N − 1)) on top of the existing per-man firepower loss
  //   · cover: vehicles take no terrain cover · banner shows a shield under the head count (yellow light / green heavy)
  //   · HP is stored as an integer (accessor on every unit / building / bunker)
  //   · combat state: attacking or losing HP marks a unit; it leaves combat after two own turns without either.
  //     Out-of-combat infantry heal at turn start: HQ +20 within 3, medical vehicles / medic bunkers +15 within 3
  //   · repair: every engineer-type unit; engineer +30 (vet +10 / +20), recovery vehicle +60; half on a unit in combat
  //   · economy: start 600 MP / 30 F and one engineer squad, the second side +90 / +15; HQ base 60; fuel points 12;
  //     upkeep (v141) = 4 % of each unit's price, at most 40 MP per unit; the excess / 3 is paid in fuel; no reinforcing in combat
  //   · buildings (CoH3 prices): T1 80/15 · T2 150/50 (infantry tier −10 F) · T3 300/135; construction T1 1 turn,
  //     T2 / T3 2 turns with an engineer-type unit staying adjacent; a site starts at 50 % HP and produces nothing
  // ══════════════════════════════════════════════════════════════
  var V140 = { retMove: 1.6, retAcc: .5, retNear: 3, rally: { blue: null, red: null }, startMP: 600, upPct: .04, upMax: 40, sqAcc: .3,
    healHq: 20, healMed: 15, healR: 3, repEng: 30, repBerge: 60, cbtK: .5, ENG: ['engineer', 'assault_eng', 'fp_pioneer'] };

  // ---- integer HP ----
  function v140IntHp(o) {
    if (!o || o._v140) return;
    let v = Math.round(+o.hp || 0);
    Object.defineProperty(o, '_v140', { value: true, enumerable: false });
    Object.defineProperty(o, 'hp', { configurable: true, enumerable: true,
      get() { return v; },
      set(n) { v = Math.round(+n || 0); } });   // v158: taking damage no longer sets the engaged mark
    if (o.maxHp) o.maxHp = Math.round(o.maxHp);
  }
  function v140IntAll() { units.forEach(v140IntHp); buildings.forEach(v140IntHp); bunkers.forEach(v140IntHp); }
  {  /* createUnitFromKey: layer moved to js/chains/createUnitFromKey.js */ }
  {  /* render: layer moved to js/chains/render.js */ }
  // floating rally button above the production tray when an own HQ / outpost is selected
  document.head.insertAdjacentHTML('beforeend', `<style>
    #v140-rally{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom,0px) + 128px);z-index:40;display:none;
      font:600 var(--fs-3)/1 Oswald,sans-serif;letter-spacing:0;color:var(--c-n11);padding:8px 14px;border-radius:2px;border:1px solid var(--c-au1);
      background:linear-gradient(var(--c-n5),var(--c-n2));box-shadow:0 2px 6px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.12)}
    #v140-rally.on{color:var(--c-gn15);border-color:var(--c-ol1)}
  </style>`);
  document.body.insertAdjacentHTML('beforeend', '<button id="v140-rally" type="button"></button>');
  function v140RallyBtn() {
    const el = document.getElementById('v140-rally'); if (!el) return;
    const b = !selectedUnit && selBld && selBld.team === currentTurn && selBld.hp > 0 && !selBld.uc && (selBld.type === 'hq' || selBld.type === 'outpost') ? selBld : null;
    if (!b) { if (el.style.display !== 'none') el.style.display = 'none'; return; }
    const on = v140Rally(b.team) === b, t = on ? '🚩 현재 집결지' : '🚩 집결지 지정';
    if (el.textContent !== t) el.textContent = t; el.classList.toggle('on', on); el.style.display = 'block';
    el.onclick = on ? null : () => v140SetRally(b.id);
  }

  // ---- combat state ----
  const v140InCombat = u => !!(u && u.engaged);   // v158: set by attacking only, cleared at the end of an own turn without an attack (section [17+5])
  {  /* executeCombat: layer moved to js/chains/executeCombat.js */ }
  {  /* uskPay: layer moved to js/chains/uskPay.js */ }
  {  /* useSkill: layer moved to js/chains/useSkill.js */ }

  // ---- auto-heal auras (replaces the old 1-hex +27 from outposts / medic bunkers and the ambulance +27) ----
  /* ambHeal: layer moved to js/chains/ambHeal.js */

  // ---- repair ----
  /* armorRepair: layer moved to js/chains/armorRepair.js */
  const v140IsEng = u => !!u && V140.ENG.includes(u.key);

  // ---- rally point and retreat ----
  function v140Rally(tm) {
    const id = V140.rally[tm], b = id && buildings.find(x => x.id === id && x.team === tm && x.hp > 0 && !x.uc && (x.type === 'hq' || (x.type === 'outpost' && !x.crippled)));
    if (b) return b;
    V140.rally[tm] = null; return hqOf(tm);
  }
  function v140SetRally(id) {
    const b = buildings.find(x => x.id === id); if (!b || b.team !== currentTurn || b.hp <= 0 || b.uc || !(b.type === 'hq' || b.type === 'outpost')) return;
    V140.rally[b.team] = b.type === 'hq' ? null : b.id;
    addLog(`🚩 [집결지 지정] ${b.type === 'hq' ? '본부' : b.className || '전초기지'} (${b.c},${b.r})`, 'supply');
    toast('🚩 집결지가 지정되었습니다'); updateUnitInfoPanel(b, getTerrain(b.c, b.r)); render();
  }
  function v140RetStep__base(u, budget) {
    const rp = v140Rally(u.team); if (!rp) return null;
    const d0 = getDistance(u.c, u.r, rp.c, rp.r);
    const keep = u.remainingMove; u.remainingMove = budget;
    const reach = calculateReachableHexes(u); u.remainingMove = keep;
    let best = null, bd = d0;
    reach.forEach(t => { const d = getDistance(t.c, t.r, rp.c, rp.r); if (d >= 1 && (d < bd || (best && d === bd && t.cost < best.cost))) { best = t; bd = d; } });
    if (best) {
      if (!u.isHeavy) faceToward(u, best.c, best.r);
      u.c = best.c; u.r = best.r;
      const mi = mines.findIndex(m => m.c === u.c && m.r === u.r && m.team !== u.team);
      if (mi !== -1) { const mul = mines[mi].dmgMul || 1; mines.splice(mi, 1); const dmg = Math.max(1, Math.round(mul * modelHit(u, 2))); u.hp -= dmg; addLog(`[지뢰 폭발!] ${u.className} [-${dmg} HP]`, 'crit'); if (u.hp <= 0) { u.hp = 0; checkVictory(); } else syncModels(u); }
      if (u.hp > 0) v159WatchFire(u);   // v159
    }
    u.hasMoved = true; u.remainingMove = 0; u.hasAttacked = true; u.counterAttacksLeft = 0; u.engaged = false;   // v158: retreat drops the engaged mark
    if (getDistance(u.c, u.r, rp.c, rp.r) <= V140.retNear) { u.retreating = false; if (u.buff) delete u.buff.retreat; return { rp, moved: d0 - bd, done: true, left: bd }; }
    u.retreating = true; (u.buff = u.buff || {}).retreat = 1;
    return { rp, moved: d0 - bd, done: false, left: bd };
  }
  const v140RpName = rp => rp.type === 'hq' ? '본부' : '전초기지';
  /* retreatBlock: layer moved to js/chains/retreatBlock.js */
  /* retreatMove: layer moved to js/chains/retreatMove.js */
  if (USK.retreat) { USK.retreat.d = '집결지(본부 또는 지정한 전초기지)로 자동 후퇴 · 이동력 ×1.6 · 피격 명중 −50% · 반격 없음 · 집결지 3칸 안에 들 때까지 매 턴 자동 이동하며 다른 행동 불가 · 이번 턴 공격·능력 사용 후에는 불가'; USK.retreat.b = null; }

  // ---- construction sites ----
  function v140Builder(b) {
    const near = u => u && u.team === b.team && u.hp > 0 && !u.isLoaded && v140IsEng(u) && (typeof v151EngNear === 'function' ? v151EngNear(u, b) : getDistance(u.c, u.r, b.c, b.r) <= 1);   // v151: 2 hexes for multi-hex sites
    const pref = units.find(u => u.id === b.uc.eng);
    return near(pref) ? pref : units.find(near) || null;
  }
  {  /* canReinforce: layer moved to js/chains/canReinforce.js */ }   // v141: no reinforcing in combat
  {  /* canProd: layer moved to js/chains/canProd.js */ }

  // ---- turn start: retreat walk, construction progress ----
  { 
    /* processTurnStartStatus: layer moved to js/chains/processTurnStartStatus.js */ }

  // ---- economy ----
  incomeOf = (o => function (tm) {
    const i = o.apply(this, arguments);
    let g = 0, fx = 0;   // v141: each unit 4 % of its price (rounded); above 40 the excess / 3 is paid in fuel
    units.forEach(u => { if (u.team !== tm || u.hp <= 0 || u.empl) return; const c = Math.round((u.val || u.cost || 0) * V140.upPct); g += Math.min(V140.upMax, c); fx += Math.max(0, c - V140.upMax) / 3; });
    i.upkeep = g; i.fu = Math.round(fx);
    i.g = Math.max(Math.floor(i.gross * .25), i.gross - i.upkeep);
    i.f = Math.max(-(fuel[tm] || 0), i.f - i.fu);
    return i;
  })(incomeOf);
  { 
    /* resetGame: layer moved to js/chains/resetGame.js */ }

  // ---- building panel: rally point button ----
  { 
    /* updateUnitInfoPanel: layer moved to js/chains/updateUnitInfoPanel.js */ }

  // ---- drawing: construction scaffold, rally flag, banner marks ----
  { 
    /* drawBuildingShape: layer moved to js/chains/drawBuildingShape.js */ }
  function v140Flag(x, y) {
    const R = HEX_RADIUS, px = x + R * .55, py = y - R * .55, h = R * .9;
    ctx.save(); ctx.lineWidth = Math.max(1, R * .05); ctx.strokeStyle = '#1b1b1b'; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py - h); ctx.stroke();
    ctx.fillStyle = currentTurn === 'blue' ? '#4a86e0' : '#d9584b'; ctx.beginPath(); ctx.moveTo(px, py - h); ctx.lineTo(px + h * .5, py - h * .82); ctx.lineTo(px, py - h * .64); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = Math.max(.6, R * .025); ctx.stroke(); ctx.restore();
  }
  function v140Shield(x, y, s, fill) {
    ctx.beginPath(); ctx.moveTo(x - 3.6 * s, y - 4 * s); ctx.lineTo(x + 3.6 * s, y - 4 * s); ctx.lineTo(x + 3.6 * s, y + .4 * s); ctx.quadraticCurveTo(x + 3.2 * s, y + 3.2 * s, x, y + 4.6 * s); ctx.quadraticCurveTo(x - 3.2 * s, y + 3.2 * s, x - 3.6 * s, y + .4 * s); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = .8 * s; ctx.strokeStyle = 'rgba(10,12,14,.9)'; ctx.stroke();
  }
  function v140Cross(x, y, s) {
    const col = '#ff5a1f', tick = () => { ctx.beginPath(); [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([a, b]) => { ctx.moveTo(x + a * 1.5 * s, y + b * 1.5 * s); ctx.lineTo(x + a * 4.6 * s, y + b * 4.6 * s); }); };
    ctx.save(); ctx.lineCap = 'butt';
    ctx.strokeStyle = 'rgba(10,8,6,.85)'; ctx.lineWidth = 2.2 * s; ctx.beginPath(); ctx.arc(x, y, 3.2 * s, 0, 6.2832); ctx.stroke(); tick(); ctx.stroke();   // dark outline
    ctx.strokeStyle = col; ctx.lineWidth = 1.1 * s; ctx.beginPath(); ctx.arc(x, y, 3.2 * s, 0, 6.2832); ctx.stroke(); tick(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, .85 * s, 0, 6.2832); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = .5 * s; ctx.strokeStyle = 'rgba(10,8,6,.85)'; ctx.stroke();
    ctx.restore();
  }
  function v140BannerMarks(u, W, k, bY) {
    const yy = bY + 8.6 * k;
    if (u.armorType === 'soft') { const f = selectedUnit, c = (f && f.team !== u.team && f.hp > 0 && !f.isLoaded) ? coverVs(u, f) : coverBest(u); if (c === 'yellow' || c === 'hard') v140Shield(-W / 2 - .2 * k, yy, .85 * k, c === 'yellow' ? '#f2c230' : '#3fbf6a'); }
    if (u.retreating) v158Flag(W / 2 + .2 * k, yy, k); else if (v140InCombat(u)) v140Cross(W / 2 + .2 * k, yy, k);   // v158: retreat replaces the engaged mark
    if (u.repairing) v158Wrench(W / 2 + .2 * k, yy + 9 * k, k);
  }

