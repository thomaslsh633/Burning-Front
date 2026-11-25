  // ══════════════════════════════════════════════════════════════
  // [17+6] v159 — heavy weapon emplace toggle · watch fire · concealment passive · MG cover fire removed
  //     · heavy weapon crews (MG, mortar, AT / AA guns, field guns, rocket launcher) are either packed or emplaced (toggle)
  //       packed: can move and turn the arc, cannot fire (attack, counter, watch fire, attack abilities)
  //       emplaced: cannot move or turn, can fire from the turn after it was emplaced · received damage −10 % · suppression −20 %
  //       emplacing spends the rest of the move; a crew that fired this turn cannot pack up; inside a building only MGs emplace
  //       crews on the map at the start of a game begin emplaced, new or unloaded crews begin packed
  //     · watch fire (toggle, on by default): an emplaced direct-fire crew with a limited arc fires once per enemy turn, without
  //       return fire, at an enemy that moves into its range and arc while its side can see that enemy
  //       AT weapons only fire at vehicles / tanks, MGs fire at everything · it breaks the crew's concealment
  //     · concealment passive: an emplaced crew in cover that spends a whole own turn without firing becomes concealed
  //       (same as the camo ability: seen only from 2 hexes, lost on moving or firing)
  // ══════════════════════════════════════════════════════════════
  var V159 = { dmg: .9, supp: .8 };
  const v159Crew = u => !!u && isCrew(u) && !u.empl && !(u.type && BLD[u.type]);
  const v159Emplaced = u => !!(u && u.tgl && u.tgl.emplace);
  const v159Ready = u => !v159Crew(u) || (v159Emplaced(u) && u.empT !== turnNo);
  const v159Indirect = u => !!(u.isMortar || u.isArtillery || u.isNebel);
  const v159Watcher = u => v159Crew(u) && !v159IsAT(u) && !v159Indirect(u) && (u.arcAngle || 0) < 6.28 && !!(u.tgl && u.tgl.watch) && v159Ready(u);
  const v159IsAT = u => !u.isHmg && (u.role === 'AT' || !!u.isAtGun || !!u.isTankDest);
  const v159TargetOk = (w, t) => !v159IsAT(w) || t.armorType === 'hard';
  function v159StateTxt(u) {
    if (!v159Emplaced(u)) return '<span style="color:#fbbf24">거치 해제 (이동 가능 · 사격 불가)</span>';
    if (u.empT === turnNo) return '<span style="color:#fbbf24">거치 중 (이번 턴 사격 불가)</span>';
    return '거치 완료 (사격 가능 · 피해 −10% · 제압 −20%)';
  }
  function v159SetEmpl__base(u, on) {
    u.tgl = u.tgl || {}; u.tgl.emplace = !!on;
    if (on) { u.empT = turnNo; u.remainingMove = 0; }
  }
  // which crew keys get which toggle (built from the rosters)
  (function () {
    const crewT = t => t.armorType !== 'hard' && !!(t.isHeavy || t.isMortar || t.isArtillery || t.isNebel);
    const keys = f => { const o = {}; ['blue', 'red'].forEach(tm => o[tm] = Object.keys(UNIT_ROSTER[tm]).filter(k => f(UNIT_ROSTER[tm][k]))); return o; };
    TGL.emplace = { n: '거치', ico: '⚓', st: ['거치 해제', '거치'], d: '거치 시에만 사격 (거치한 턴 제외) · 이동·사격각 변경 불가 · 받는 피해 −10% · 제압 −20% / 해제 시 이동·사격각 변경 가능', keys: keys(crewT) };
    TGL.watch = { n: '경계 사격', ico: '🎯', st: ['OFF', 'ON'], d: '적 턴에 사거리·사격각 안으로 이동해 오는 보이는 적을 1회 선제 사격 (반격 없음) · 기관총·보병포 등 (대전차 중화기는 경계 사격 없음)', keys: keys(t => crewT(t) && !(t.isMortar || t.isArtillery || t.isNebel) && (t.arc || 120) < 360 && !v159IsAT(t)) };   // v198: anti-tank crew weapons have no watch fire
  })();
  {  /* tglBlock: layer moved to js/chains/tglBlock.js */ }
  { const o = useTgl; useTgl = function (uid, id) {
      if (id !== 'emplace' && id !== 'watch') return o.apply(this, arguments);
      const u = uById(uid); if (!u) return;
      const why = tglBlock(u, id); if (why) { toast(why); return; }
      if (id === 'watch') { u.tgl = u.tgl || {}; u.tgl.watch = !u.tgl.watch; addLog(`🎯 [경계 사격] ${u.className} — ${u.tgl.watch ? 'ON' : 'OFF'}`, 'supply'); }
      else {
        const on = !v159Emplaced(u);
        if (!on && u.empT === turnNo) u.remainingMove = u.empMv || 0;   // undo an emplace made this turn
        if (on) u.empMv = u.remainingMove;
        v159SetEmpl(u, on);
        addLog(on ? `⚓ [거치] ${u.className} — 다음 턴부터 사격 가능` : `⚓ [거치 해제] ${u.className} — 이동·사격각 변경 가능, 사격 불가`, 'arc');
      }
      if (selectedUnit === u) updateActionTiles(u);
      updateUnitInfoPanel(u, getTerrain(u.c, u.r)); render();
    }; window.useTgl = useTgl; }
  // movement / attack tiles follow the state
  {  /* updateActionTiles: layer moved to js/chains/updateActionTiles.js */ }
  {  /* uskBlock: layer moved to js/chains/uskBlock.js */ }
  // emplaced protection
  {  /* calcDamage: layer moved to js/chains/calcDamage.js */ }
  {  /* addSuppression: layer moved to js/chains/addSuppression.js */ }
  // new crews start packed, the opening forces start emplaced; watch fire defaults to on
  {  /* createUnitFromKey: layer moved to js/chains/createUnitFromKey.js */ }
  {  /* resetGame: layer moved to js/chains/resetGame.js */ }

  // ---- watch fire ----
  function v159Sees(tm, t) {
    const near = d => units.some(u => u.team === tm && u.hp > 0 && !u.isLoaded && getDistance(u.c, u.r, t.c, t.r) <= d);
    if (t.buff && t.buff.camo && !near(2)) return false;
    if (smokes.some(sm => sm.team !== tm && sm.hexes.some(h => h.c === t.c && h.r === t.r)) && !near(1)) return false;
    if (reveals.some(x => x.team === tm && x.expire > turnNo && getDistance(x.c, x.r, t.c, t.r) <= 3)) return true;
    const k = LAYERS.sight && LAYERS.conceal ? concealOf(t.c, t.r) : 0;
    const src = [...units.filter(u => u.team === tm && u.hp > 0 && !u.isLoaded), ...buildings.filter(b => b.team === tm && b.hp > 0), ...bunkers.filter(b => b.team === tm && b.hp > 0)];
    return src.some(s => {
      const d = getDistance(s.c, s.r, t.c, t.r), sight = Math.max(1, (s.baseSight || s.sight || 3) + (getTerrain(s.c, s.r).elevation || 0) - (suppState(s) >= 2 ? 1 : 0));
      if (d > sight || (k && d > k)) return false;
      return d <= 1 || !LAYERS.sight || !sightLine(s.c, s.r, t.c, t.r, eyeOf(s)).block;
    });
  }
  function v159CanWatch(w, m) {
    if (!w || w.team === m.team || w.hp <= 0 || w.isLoaded || !v159Watcher(w)) return false;
    if (w.watchT === turnNo || !(w.ammo > 0) || suppState(w) > 0 || (w.buff && w.buff.retreat > 0) || !v159TargetOk(w, m)) return false;
    const d = getDistance(w.c, w.r, m.c, m.r);
    return mainReach(w, m.c, m.r, d) && checkElevationCombatRule(w, m).allowed && v159Sees(w.team, m);
  }
  function v159WatchFire__base(m) {
    if (!m || m.hp <= 0 || m.isLoaded || !m.key) return;
    const ws = units.filter(w => v159CanWatch(w, m)).sort((a, b) => getDistance(a.c, a.r, m.c, m.r) - getDistance(b.c, b.r, m.c, m.r));
    for (const w of ws) {
      if (m.hp <= 0) break;
      w.watchT = turnNo; w.ammo -= 1; v158Engage(w);
      if (w.buff && w.buff.camo) { delete w.buff.camo; addLog(`🫥 [은신 해제] ${w.className} — 경계 사격으로 노출`, 'move'); }
      const res = calcDamage(w, m);
      m.hp -= res.damage; addVeterancyExp(w, 2, 'atk');
      fxAdd(m, res.damage > 0 ? '경계 사격!' : (m.armorType === 'hard' ? '도탄!' : '빗나감!'), '#facc15', -12);
      addLog(`🎯 [경계 사격] ${w.className} ➔ ${m.className} [${res.damage} 피해]${res.specialNote}`, 'counter');
      if (m.hp <= 0) { m.hp = 0; claimKillBounty(w, m); addVeterancyExp(w, 8, m); checkVictory(); }
      else { applyHitEffects(w, m, res); if (m.N) syncModels(m); }
    }
    if (ws.length) updateVision();
  }

  // ---- concealment passive (checked at the end of the crew's own turn) ----
  v158EndOwnTurn = (o => function (tm) {
    o.apply(this, arguments);
    units.forEach(u => {
      if (u.team !== tm || u.hp <= 0 || u.isLoaded || !v159Crew(u) || !v159Emplaced(u) || u.empT === turnNo || u.atkT === turnNo) return;
      const cv = coverBest(u); if (!(cv === 'yellow' || cv === 'hard' || isGarrisoned(u))) return;
      u.buff = u.buff || {}; const had = u.buff.camo > 0;
      u.buff.camo = Math.max(u.buff.camo || 0, 2); u.camoPos = [u.c, u.r];
      if (!had) addLog(`🫥 [은신] ${u.className} — 엄폐물에 숨어 은신 (2칸 안의 적에게만 보임)`, 'move');
    });
  })(v158EndOwnTurn);



