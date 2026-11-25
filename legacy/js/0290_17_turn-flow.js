  // ══════════════════════════════════════════════════════════════
  // [17] 턴 · 게임 흐름
  //     · endTurnBtn 클릭 리스너 4개(순서 유지), resetGame(+래핑), checkVictory, 화염 지대
  // ══════════════════════════════════════════════════════════════
  endTurnBtn.addEventListener("click", e => {
    if (endArmed) { endDisarm(); return; }
    const idle = units.filter(u => u.team === currentTurn && u.hp > 0 && !u.isLoaded && !u.hasMoved && !u.hasAttacked).length;
    if (!idle) return;
    e.stopImmediatePropagation(); endArmed = true; v129Kick(); render();
    endTurnBtn.textContent = `${idle}기 미행동 — 한 번 더`; endTurnBtn.classList.add("armed");
    endArmTimer = setTimeout(endDisarm, 2500);
  });


  endTurnBtn.addEventListener("click", () => {
    clearAttackPreview();
    v158EndOwnTurn(currentTurn);   // v158: engaged marks of units that did not attack this turn


    bunkers.filter(b => b.team === currentTurn && b.type === 'mg' && b.hp > 0).forEach(b => {
      const enemy = units.find(u => u.team !== b.team && u.hp > 0 && !u.isLoaded && getDistance(b.c, b.r, u.c, u.r) <= 4 && u.armorType === 'soft' && visibleHexes.has(`${u.c},${u.r}`) && !inSmoke(u) && losClear(b, u.c, u.r));
      if (enemy) {
        enemy.hp -= V130.bunkerDmg;   // v130: 45 → 58 (+30 %)
        addLog(`[MG벙커 제압] ${enemy.className} [-${V130.bunkerDmg} HP]`, "eng");
        if (enemy.hp > 0) addSuppression(enemy, 50);
        if (enemy.hp <= 0) { enemy.hp = 0; checkVictory(); }
        v130BunkerCone(b, enemy);
      }
    });




    currentTurn = currentTurn === 'blue' ? 'red' : 'blue';
    if (currentTurn === 'blue') roundCount++;
    turnNo++; smokes = smokes.filter(x => x.expire > turnNo);
    units.filter(u => u.team === currentTurn && u.buff).forEach(u => { Object.keys(u.buff).forEach(k => { if (--u.buff[k] <= 0) delete u.buff[k]; }); });


    // v140: medic bunker / outpost heals moved to the out-of-combat auras (ambHeal, section [17*])


    runStrikes(currentTurn);
    // v59: income + capture tick + victory settlement now run after processTurnStartStatus (see zoneTurnStart, section [17c])
    units.forEach(u => { u.healedThisTurn = 0; u.repairedThisTurn = 0; u.reinfLeft = 2; u.noFuel = false; });
    ambHeal(currentTurn);


    units.forEach(u => { u.counterAttacksLeft = counterMax(u.team); });
    units.filter(u => u.team === currentTurn).forEach(u => {
      u.hasMoved = false;
      u.hasAttacked = false;
      u.repairsLeft = 2 + vetV(u).repairPlus;
      u.remainingMove = u.moveDist;
    });
    processTurnStartStatus(currentTurn);
    zoneTurnStart(currentTurn);   // v59: strikes → status → captureTick → settleVictory → income


    selectedUnit = null; selBld = null; facingUnit = null;
    actionMode = null; activeActor = null; pendingDeployKey = null;
    isAwaitingFacing = false; isDraggingFacing = false;
    guideBanner.style.display = "none";
    validMoves = []; validAttacks = [];
    updateUnitInfoPanel(null, null);


    turnText.textContent = currentTurn === 'blue' ? "연합군" : "추축군";
    turnIndicator.className = `turn-badge ${currentTurn === 'blue' ? 'turn-blue' : 'turn-red'}`;
    turnRound.textContent = `R${String(roundCount).padStart(2, '0')}`;
    buzz([20, 50, 20]);


    updateGoldUI(); updateBuildMenu(); updateVision();
    render();
  });


  function resetGame__base() {
    const selectedGold = parseInt(initGoldSelect.value);
    gold = { blue: selectedGold, red: selectedGold };
    const sf = Math.round(selectedGold * 0.07 / 10) * 10;
    fuel = { blue: sf, red: sf };
    currentTurn = 'blue'; currentTab = 'infantry'; roundCount = 1;
    selectedUnit = null; selBld = null; actionMode = null; activeActor = null; pendingDeployKey = null;
    clearAttackPreview(); isAwaitingFacing = false; isDraggingFacing = false;
    guideBanner.style.display = "none";
    validMoves = []; validAttacks = [];


    loadHistoricalMap();
    initUnits();
    updateGoldUI(); updateBuildMenu();
    updateUnitInfoPanel(null, null);
    updateVision();


    const myHq = buildings.find(b => b.team === 'blue' && b.type === 'hq');
    const hqCenter = getHexCenter(myHq.c, myHq.r);
    camX = Math.max(0, hqCenter.x - VIEW_W / 2);
    camY = Math.max(0, hqCenter.y - VIEW_H / 2);
    clampCam();


    addLog(`[작전 개시] ${mapSelect.options[mapSelect.selectedIndex].text} 활성화`);
    render();
  }


  // v59: the ONLY win condition is the Victory Meter (opponent tickets reach 0). No HQ-kill, no wipe-out, no resource-exhaustion win.
  // HQ hp is clamped at 1 by armHq() (section [17c]); checkVictory() just re-evaluates the meter.
  function checkVictory() { vmCheckWinner(); }
  
  /* resetGame: layer moved to js/chains/resetGame.js */
  endTurnBtn.addEventListener("click", () => {
    const tm = currentTurn;
    Object.keys(queue[tm]).forEach(bt => {  /* 큐 철거: 항상 비어 있음 */
      const q = queue[tm][bt];
      if (!buildings.some(b => b.team === tm && b.type === bt && b.hp > 0)) { delete queue[tm][bt]; addLog(`🔬 [연구 중단] ${q.label} — 연구 건물 상실`, "crit"); return; }
      if (--q.left > 0) return;
      delete queue[tm][bt];
      if (q.kind === 'tech') research[tm][q.id] = true;
      else {
        const cat = BLD[bt].make, k = q.tgt === '*' ? '*' + cat : q.tgt;
        (upg[tm][k] = upg[tm][k] || {})[q.st] = lvOf(tm, k, q.st) + 1;
        units.filter(u => u.team === tm && u.hp > 0 && (q.tgt === '*' ? UNIT_ROSTER[tm][u.key].cat === cat : u.key === q.tgt)).forEach(u => stepStat(u, q.st));
      }
      addLog(`🔬 [연구 완료] ${q.label}`, "bounty");
    });
    renderResearch(); updateBuildMenu(); centerOnBase();
  });

  // 화염 지대: 적 턴 시작 시 피해 (기존 턴 종료 처리 뒤에 실행)
  endTurnBtn.addEventListener('click', () => {
    fires = fires.filter(f => f.expire > turnNo);
    fires.forEach(f => {
      units.filter(x => x.team !== f.team && x.team === currentTurn && x.hp > 0 && !x.isLoaded && f.hexes.some(h => h.c === x.c && h.r === x.r)).forEach(x => {
        const hard = x.armorType === 'hard', dmg = Math.max(1, Math.round((hard ? Math.max(1, Math.round(x.maxHp * 0.05)) : modelHit(x)) * (f.zm || 1)));
        x.hp -= dmg; addLog(`🔥 [화염 지대] ${x.className} [-${dmg} HP]`, 'flame');
        if (hard) { if (!(x.fireTurns > 0) && Math.random() < .2) { x.fireTurns = 2; addLog(`🔥 [엔진 화재] ${x.className} — 화염에 휩싸임`, 'crit'); } }
        else addSuppression(x, 35);
        if (x.hp <= 0) { x.hp = 0; claimKillBounty({ team: f.team }, x); checkVictory(); }
      });
    });
    updateVision(); updateGoldUI(); render();
  });
  
  /* resetGame: layer moved to js/chains/resetGame.js */

