  // [chain:processTurnStartStatus] 11 layers over processTurnStartStatus__base ([11]).
  //   Call order, outermost first: processTurnStartStatus → processTurnStartStatus__v140 → processTurnStartStatus__v139 → processTurnStartStatus__v130 → processTurnStartStatus__v57 → processTurnStartStatus__v54 → processTurnStartStatus__v50 → processTurnStartStatus__v49 → processTurnStartStatus__v48 → processTurnStartStatus__v47 → processTurnStartStatus__v46 → processTurnStartStatus__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // processTurnStartStatus: from [17+5], calls processTurnStartStatus__v140
  function processTurnStartStatus(team) {
      units.forEach(u => { if (u.team === team && u.repairing) { u.repairing = false; addLog(`🔧 [수리 완료] ${u.className} — 수리 중 표시 해제`, 'eng'); } });
      return processTurnStartStatus__v140.apply(this, arguments);
    }

  // processTurnStartStatus__v140: from [17*], calls processTurnStartStatus__v139
  function processTurnStartStatus__v140(team) {
      const r = processTurnStartStatus__v139.apply(this, arguments);
      units.forEach(u => {
        if (u.team !== team || u.hp <= 0 || u.isLoaded || !u.retreating) return;
        const s = v140RetStep(u, Math.ceil(u.moveDist * V140.retMove));
        if (s) addLog(`🏳 [퇴각] ${u.className} ${s.moved}칸 이동${s.done ? ' — 집결 완료' : ` (집결지까지 ${s.left}칸)`}`, 'move');
      });
      buildings.forEach(b => {
        if (b.team !== team || b.hp <= 0 || !b.uc) return;
        const e = v140Builder(b);
        if (!e) { addLog(`🏗 [건설 중단] ${b.className} — 인접한 공병이 없습니다`, 'eng'); return; }
        b.uc.eng = e.id; b.uc.left--;
        if (b.uc.left <= 0) { delete b.uc; b.hp = Math.min(b.maxHp, b.hp + Math.round(b.maxHp * .5)); addLog(`🔨 [완공] ${b.className}`, 'eng'); updateBuildMenu(); }
        else { e.hasMoved = true; e.hasAttacked = true; e.remainingMove = 0; addLog(`🏗 [건설 중] ${b.className} — ${b.uc.left}턴 남음 · ${e.className} 작업 중`, 'eng'); }
      });
      return r;
    }

  // processTurnStartStatus__v139: from [v172], calls processTurnStartStatus__v130
  function processTurnStartStatus__v139(team) {
      const r = processTurnStartStatus__v130.apply(this, arguments);
      units.forEach(u => { if (u.team === team && u.rlock) { u.rlock = false; u.hasMoved = true; u.hasAttacked = true; u.remainingMove = 0; addLog(`🏳 [재정비] ${u.className} — 이번 턴 행동 불가`, 'supply'); } });
      return r;
    }

  // processTurnStartStatus__v130: from [17s], calls processTurnStartStatus__v57
  function processTurnStartStatus__v130(team) {
    const out = processTurnStartStatus__v57.apply(this, arguments);
    const hq = buildings.find(b => b.team === team && b.type === 'hq' && b.hp > 0 && !b.crippled);
    if (hq) {
      let n = 0;
      units.forEach(u => { if (u.team === team && u.hp > 0 && !u.isLoaded && u.maxAmmo > 0 && u.ammo < u.maxAmmo && getDistance(hq.c, hq.r, u.c, u.r) <= V130.hqReinf) { u.ammo = Math.min(u.maxAmmo, u.ammo + Math.ceil(u.maxAmmo * V130.hqAmmo)); n++; } });
      if (n) addLog(`🏠 [본진 보급] ${n}기 탄약 보충 (+${Math.round(V130.hqAmmo * 100)}%)`, 'supply');
    }
    return out;
  }

  // processTurnStartStatus__v57: from [v128], calls processTurnStartStatus__v54
  function processTurnStartStatus__v57(team) {
    processTurnStartStatus__v54(team);
    if (!cpOptOn()) return;
    if (capturePoints.some(c => c.owner === team)) cpHold[team]++; else cpHold[team] = 0;
    if (cpHold[team] >= 5 && cpOf(team) < 8) { cpHold[team] = 0; teamXp[team] += 25; syncCP(team); addLog(`🏴 [거점 유지] 5턴 연속 거점 보유 — CP +1 (현재 CP ${cpOf(team)})`, 'bounty'); }
  }

  // processTurnStartStatus__v54: from [v128], calls processTurnStartStatus__v50
  function processTurnStartStatus__v54(team) {
    processTurnStartStatus__v50(team);
    if (doctrine[team] === 'inf' && cpOf(team) >= 6) units.filter(u => u.team === team && u.hp > 0 && !u.isLoaded && u.armorType === 'soft' && (u.suppression || 0) > 0).forEach(u => { u.suppression = Math.max(0, u.suppression - 20); });
  }

  // processTurnStartStatus__v50: from [17b], calls processTurnStartStatus__v49
  function processTurnStartStatus__v50(team) {
    processTurnStartStatus__v49(team);
    units.forEach(u => { if (u.slSight && turnNo >= u.slSight + 2) { u.baseSight += u.slSightD || 0; u.slSight = 0; u.slSightD = 0; updateVision(); } });
  }

  // processTurnStartStatus__v49: from [17b], calls processTurnStartStatus__v48
  function processTurnStartStatus__v49(team) {
    processTurnStartStatus__v48(team);
    units.forEach(u => {
      if (!u.wpGun || u.hp <= 0) return;
      if (turnNo >= u.wpGun + 2) {            // 만료: 원복
        u.gunDisabled = !!u.wpPrev || !!(u.tgl && u.tgl.recon); u.baseSight += u.wpSightD || 0; u.wpGun = 0; u.wpSightD = 0; updateVision();
      } else if (u.team === team) u.gunDisabled = true;   // 적 턴 시작: 수리로 풀려도 재적용
    });
  }

  // processTurnStartStatus__v48: from [17b], calls processTurnStartStatus__v47
  function processTurnStartStatus__v48(team) {
    processTurnStartStatus__v47(team);
    units.forEach(u => {
      if (u.team !== team || u.hp <= 0 || u.isLoaded || u.pkg2 !== 'surv' || u.lastMoveTurn === turnNo - 2) return;
      const b = u.hp; u.hp = Math.min(u.maxHp, u.hp + Math.max(1, Math.round(u.maxHp * 0.04)));
      if (u.hp > b) addLog(`🧰 [생존 패키지] ${u.className} 자가수리 +${Math.round(u.hp - b)} HP`, 'eng');
    });
  }

  // processTurnStartStatus__v47: from [17b], calls processTurnStartStatus__v46
  function processTurnStartStatus__v47(team) {
    processTurnStartStatus__v46(team);
    units.forEach(u => {
      if (u.team !== team || u.hp <= 0) return;
      u.scootUsed = false;
      if (u.buff && u.buff.contfire === 1 && !u.isLoaded) { const b = u.remainingMove; u.remainingMove = b > 0 ? Math.min(b - 1, Math.round(b * 0.85)) : 0; addLog(`🔫 [계속 사격] ${u.className} 기총 연사 +50% · 이동 ${b}→${u.remainingMove}`, 'move'); }
    });
    pasSyncAll();
  }

  // processTurnStartStatus__v46: from [17b], calls processTurnStartStatus__base
  function processTurnStartStatus__v46(team) {
    processTurnStartStatus__base(team);
    units.forEach(u => {
      if (u.team !== team || u.hp <= 0 || !u.tgl) return;
      if (u.tgl.hulldown || u.tgl.sitegun) u.remainingMove = 0;
      if (u.tgl.recon) u.gunDisabled = true;
    });
  }


