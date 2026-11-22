  // [chain:handleSpecialTap] 5 layers over handleSpecialTap__base ([14]).
  //   Call order, outermost first: handleSpecialTap → handleSpecialTap__v150 → handleSpecialTap__v30 → handleSpecialTap__s14_2 → handleSpecialTap__s14 → handleSpecialTap__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // handleSpecialTap: from [17+5], calls handleSpecialTap__v150
  function handleSpecialTap(hex, tu, tb) {
      const a = activeActor, rep = actionMode === 'repair' && a;
      if (rep) { const e = v158RepBlock(a); if (e) { actionMode = null; activeActor = null; guideBanner.style.display = 'none'; toast(e); render(); return true; } }
      const n0 = rep ? a.repairsLeft : 0, r = handleSpecialTap__v150.apply(this, arguments);
      if (rep && a.repairsLeft < n0) { v158Lock(a); updateUnitInfoPanel(a, getTerrain(a.c, a.r)); render(); }
      return r;
    }

  // handleSpecialTap__v150: from [17(], calls handleSpecialTap__v30
  function handleSpecialTap__v150(hex, tu, tb) {
      const a = activeActor;
      if (actionMode === 'repair' && a && hex && !(tu && tu.team === a.team && tu.armorType === 'hard') && !(tb && tb.team === a.team)) {
        const st = typeof v147StructAt === 'function' ? v147StructAt(hex.c, hex.r) : null;
        let out = null;
        if (st && v150Near(a, st)) out = v150RepairStruct(a, st);
        else if (getDistance(a.c, a.r, hex.c, hex.r) === 1) out = v150RepairEdge(a, hex.c, hex.r);
        if (out !== null) {
          if (out === true) { a.repairsLeft--; addVeterancyExp(a, 2); updateVision(); }
          guideBanner.textContent = out === true ? `🔧 완료 · 남은 횟수 ${a.repairsLeft}` : out; guideBanner.style.display = 'block';
          if (out === true && a.repairsLeft < 1) { actionMode = null; activeActor = null; guideBanner.style.display = 'none'; }
          updateUnitInfoPanel(a, getTerrain(a.c, a.r)); render(); return true;
        }
      }
      return handleSpecialTap__v30.apply(this, arguments);
    }

  // handleSpecialTap__v30: from [17b], calls handleSpecialTap__s14_2
  function handleSpecialTap__v30(hex, tu, tb) {
    const cx = skCtx(); if (!cx) return handleSpecialTap__s14_2(hex, tu, tb);
    const end = () => { actionMode === 'sk' ? skEnd() : uskEnd(); };
    if (tu === cx.a || tb === cx.a) { pvClear(0); return handleSpecialTap__s14_2(hex, tu, tb); }
    if (PV) { const same = PV.k === hex.c + ',' + hex.r; pvClear(0); if (same) return handleSpecialTap__s14_2(hex, tu, tb); end(); return true; }
    const ck = pvCheck(cx, hex, tu, tb);
    if (ck === 0) { end(); return true; }
    if (typeof ck === 'string') { toast(ck); return true; }
    if (actionMode === 'sk' && SK.cur.kind === 'team' && SK.cur.d.t === 'line' && SK.cur.step === 0) return handleSpecialTap__s14_2(hex, tu, tb);
    PV = pvBuild(cx, hex, tu);
    pvTimer = requestAnimationFrame(pvLoop);
    render(); return true;
  }

  // handleSpecialTap__s14_2: from [14], calls handleSpecialTap__s14
  function handleSpecialTap__s14_2(hex, tu, tb) {
    if (actionMode !== 'usk' || !USKC.cur) return handleSpecialTap__s14(hex, tu, tb);
    const { u, d, id, rng } = USKC.cur;
    if (tu === u) { uskEnd(); return true; }
    const dist = getDistance(u.c, u.r, hex.c, hex.r);
    if (dist > rng) { hint2(`❌ 사거리 밖입니다 (최대 ${rng}칸)`); return true; }
    if (d.useMin && dist < u.minRange) { hint2(`❌ 최소 사거리 ${u.minRange}칸 이내는 지정할 수 없습니다`); return true; }
    if (d.vis && !visH(hex)) { hint2('❌ 시야가 확보된 칸만 지정할 수 있습니다'); return true; }
    if (d.who === 'enemy' && !(tu && tu.team !== u.team && tu.hp > 0)) { hint2('❌ 적 유닛이 있는 칸을 지정하세요'); return true; }
    if (d.who === 'ally' && !(tu && tu.team === u.team && tu.hp > 0)) { hint2('❌ 아군 유닛이 있는 칸을 지정하세요'); return true; }
    const msg = d.run(u, hex, tu, tb);
    if (!msg) return true;
    uskPay(u, d, id, msg); checkVictory();
    return true;
  }

  // handleSpecialTap__s14: from [14], calls handleSpecialTap__base
  function handleSpecialTap__s14(hex, tu, tb) {
    if (actionMode !== 'sk' || !SK.cur) return handleSpecialTap__base(hex, tu, tb);
    const a = activeActor, x = SK.cur, tm = a.team;
    if (tu === a || tb === a) { skEnd(); return true; }
    if (x.kind === 'unit') {
      const dist = getDistance(a.c, a.r, hex.c, hex.r);
      if (dist > x.rng || (x.id === 'gren' && !visH(hex))) { hint2('❌ 사거리/시야 밖입니다'); return true; }
      if (x.id === 'gren') {
        if (!tu || tu.team === tm || tu.armorType !== 'soft') { hint2('❌ 적 소프트 유닛 칸을 지정하세요'); return true; }
        tu.hp -= 86; addSuppression(tu, 40); addLog(`💣 [파편 수류탄] ${a.className} ➔ ${tu.className} [-86 HP, 제압+40]`, 'crit');
        addVeterancyExp(a, 2); if (tu.hp <= 0) { tu.hp = 0; addVeterancyExp(a, 8, tu); checkVictory(); }
      } else {
        smokes.push({ c: hex.c, r: hex.r, team: tm, expire: turnNo + 2, hexes: ring(hex.c, hex.r, 1) });
        addLog(`🌫 [연막 차폐] (${hex.c},${hex.r}) 전개`, 'supply');
      }
      mun[tm] -= x.D.mun; setCd(a, x.id, x.id === 'gren' ? Math.max(1, x.D.cd - vetV(a).cdGren) : x.D.cd); a.hasAttacked = true; skEnd(); updateGoldUI(); updateVision(); return true;
    }
    const d = x.d;
    if (d.t === 'drop') {
      if (!visH(hex) || !emptyH(hex)) { hint2('❌ 시야 내 빈 칸을 지정하세요'); return true; }
      const dropOne = h => { const u = spawnAt(tm, d.key[tm], h, d.face); if (!(doctrine[tm] === 'air' && cpOf(tm) >= 6)) { u.hasMoved = u.hasAttacked = true; u.remainingMove = 0; } if (!d.face) u.baseSight = 5; return u; };   // v54: 공수 CP6 강습 낙하 = 낙하 직후 행동 가능
      const u = dropOne(hex); if (d.pair) { const nb = getHexNeighbors(hex.c, hex.r).find(n => emptyH(n) && visH(n)); if (nb) dropOne(nb); }
      return bgDone(tm, d, `${u.className} 낙하${d.pair ? ' ×2' : ''}`), true;
    }
    if (d.t === 'spawn') {
      const price = UNIT_ROSTER[tm][d.key], f = price.fcost || 0;
      if (getDistance(a.c, a.r, hex.c, hex.r) !== 1 || !emptyH(hex)) { hint2('❌ 사령부 인접 빈 칸을 지정하세요'); return true; }
      if (gold[tm] < price.cost || fuel[tm] < f) { toast('자금/연료가 부족합니다.'); return true; }
      gold[tm] -= price.cost; fuel[tm] -= f; const u = spawnAt(tm, d.key, hex, true); return bgDone(tm, d, `${u.className} 증원 (-${price.cost}G)`), true;
    }
    if (d.t === 'shell') { const m = UNIT_ROSTER[tm].mortar; strike(tm, hex.c, hex.r, 1, 0, m, 0, m.rof || 1); return bgDone(tm, d, '박격포탄 투하'), true; }
    if (d.t === 'off' || d.t === 'barrage') {
      pendingStrikes.push({ team: tm, c: hex.c, r: hex.r, shells: d.t === 'off' ? 3 : 5, rad: d.t === 'off' ? 1 : 2, n: d.n[tm] });
      if (d.twice) pendingStrikes.push({ team: tm, c: hex.c, r: hex.r, shells: 5, rad: 2, P: 110, A: 90, custom: true, due: turnNo + 4, n: d.n[tm] + ' 2차' });   // v54: 연속 집중 포격
      return bgDone(tm, d, `(${hex.c},${hex.r}) 포격 요청 — 다음 내 턴 시작 직전 착탄`), true;
    }
    if (d.t === 'scout') { reveals.push({ team: tm, c: hex.c, r: hex.r, expire: turnNo + 2 }); return bgDone(tm, d, `(${hex.c},${hex.r}) 정찰`), true; }
    if (d.t === 'charge' || d.t === 'assault') {
      const tg = units.filter(u => u.team === tm && u.hp > 0 && !u.isLoaded && getDistance(u.c, u.r, hex.c, hex.r) <= (d.rad || 2) && (d.t === 'charge' ? u.armorType === 'soft' && UNIT_ROSTER[tm][u.key].cat === 'infantry' : UNIT_ROSTER[tm][u.key].cat === 'tank'));
      tg.forEach(u => { if (d.t === 'charge') { u.suppression = 0; u.remainingMove += 1; } else u.remainingMove += (d.mv || 2); });
      return bgDone(tm, d, `${tg.length}개 유닛 강화`), true;
    }
    if (d.t === 'fix' || d.t === 'adv') {
      if (!tu || tu.team !== tm || tu.armorType !== 'hard') { hint2('❌ 아군 기갑/차량을 탭하세요'); return true; }
      if (d.t === 'fix') { if (tu.trackDamaged) tu.trackDamaged = false; else if (tu.gunDisabled) tu.gunDisabled = false; tu.fireTurns = 0; }
      else { tu.remainingMove += 3; tu.noFuel = true; }
      return bgDone(tm, d, `${tu.className}`), true;
    }
    if (d.t === 'line') {
      if (x.step === 0) { x.start = { c: hex.c, r: hex.r }; x.step = 1; hint2('➡ 방향 칸을 탭하세요 (직선 5칸 타격)'); return true; }
      lineStrike(tm, x.start, hex, 5, 45, 70); return bgDone(tm, d, '직선 폭격'), true;
    }
    return true;
  }


