  // ══════════════════════════════════════════════════════════════
  // [14] 특수 행동 · 보급 · 수리
  //     · startTargeted*, toggleMode, handleSpecialTap(+래핑), refillSupplyTruck, bergepanzerRepair, cycleShell
  // ══════════════════════════════════════════════════════════════


  function startTargetedSupply__base(u) {
    actionMode = 'give_supply'; activeActor = u;
    guideBanner.textContent = "보급 대상 선택 // 인접 1칸의 아군 유닛을 탭하세요";
    guideBanner.style.display = "block"; render();
  }
  function startTargetedDismount__base(u) {
    actionMode = 'dismount'; activeActor = u;
    guideBanner.textContent = "하차 지점 선택 // 인접 1칸의 빈 타일을 탭하세요";
    guideBanner.style.display = "block"; render();
  }
  function startTargetedBuild__base(eng, bt) {
    const B = BLD[bt] && bd(bt, eng.team);
    if (actionMode === 'build_' + bt && activeActor === eng) { actionMode = null; activeActor = null; guideBanner.style.display = "none"; updateUnitInfoPanel(eng, getTerrain(eng.c, eng.r)); render(); return; }
    if (B && B.only && B.only !== eng.team) { toast('이 진영은 건설할 수 없는 건물입니다.'); return; }
    if (!B && FORT[bt] && FORT[bt].team && FORT[bt].team !== eng.team) { toast('이 진영은 건설할 수 없는 진지입니다.'); return; }   // v134
    if (B && B.doc) {
      if (doctrine[eng.team] && doctrine[eng.team] !== B.doc) { toast('이미 다른 교리를 선택했습니다.'); return; }
      if (buildings.some(b => b.team === eng.team && b.type === bt && b.hp > 0)) { toast('이미 교리 지원소가 있습니다.'); return; }
    }
    if (B && !reqOk(eng.team, bt)) { toast(`선행 건물 필요: ${reqName(eng.team, bt)}`); return; }
    { const d0 = B || FORT[bt], g0 = Math.round(d0.g * (research[eng.team].cheap ? .85 : 1) * (1 - vetV(eng).buildDisc)), f0 = Math.round((d0.f || 0) * (1 - vetV(eng).buildDisc)); if (isLack(g0, f0)) { toast(`자원 부족 (💰${g0} ⛽${f0})`); return; } }
    actionMode = 'build_' + bt; activeActor = eng;
    guideBanner.textContent = `건설 지점 선택 // [${(B || FORT[bt]).n}] 공병 주변 2칸 이내를 탭하세요`; guideBanner.style.display = "block"; updateUnitInfoPanel(eng, getTerrain(eng.c, eng.r)); render();
  }
  function toggleMode__base(u, m) {
    if (actionMode === m && activeActor === u) { actionMode = null; activeActor = null; guideBanner.style.display = "none"; }
    else {
      if (m === 'give_supply' && u.supplies < 1) { toast("보급품이 부족합니다!"); return; }
      if (m === 'repair' && u.repairsLeft < 1) { toast("이번 턴 수리 횟수를 모두 사용했습니다."); return; }
      if (m === 'salvage' && !u.rank) { toast("해체·회수는 공병 숙련 ★1부터 해금됩니다."); return; }
      actionMode = m; activeActor = u;
      guideBanner.textContent = { give_supply: '📦 보급 모드 ON // 인접 아군을 탭하세요', repair: '🔧 수리 모드 // 인접 차량/건물을 탭하세요', salvage: '♻ 해체 모드 // 인접 아군 구조물을 탭하세요' }[m];
      guideBanner.style.display = "block";
    }
    updateUnitInfoPanel(u, getTerrain(u.c, u.r)); render();
  }


  function handleSpecialTap__base(hex, tu, tb) {
    const a = activeActor, m = actionMode;
    if (!['give_supply', 'repair', 'salvage'].includes(m)) return false;
    const hint = t => { guideBanner.textContent = t; guideBanner.style.display = 'block'; };
    const stop = () => { actionMode = null; activeActor = null; guideBanner.style.display = 'none'; updateUnitInfoPanel(a, getTerrain(a.c, a.r)); render(); };
    const cont = t => { hint(t); updateUnitInfoPanel(a, getTerrain(a.c, a.r)); render(); };
    if (tu === a) { stop(); return true; }
    const adj = getDistance(a.c, a.r, hex.c, hex.r) === 1;


    if (m === 'give_supply') {
      if (!tu || tu.team !== a.team) { hint('📦 보급 모드: 아군 유닛을 탭하세요'); return true; }
      if (!adj) { hint('📦 인접한 1칸의 아군만 보급할 수 있습니다'); return true; }
      a.supplies--;
      if (tu.armorType === 'soft') { tu.ammo = tu.maxAmmo; }
      else { tu.ammo = Math.min(tu.maxAmmo, tu.ammo + 4); if (tu.hasFuel) tu.fuel = Math.min(tu.maxFuel, tu.fuel + 25); }   // v127: ammo +4 · fuel +25
      addLog(`📦 [보급] ${a.className} ➔ ${tu.className} (잔여 ${a.supplies})`, 'supply');
      if (a.supplies < 1) { addLog('📦 보급품 소진 — 보급 모드 종료', 'supply'); stop(); } else cont(`📦 ${tu.className} 보급 완료 · 잔여 ${a.supplies}`);
      return true;
    }
    if (m === 'repair') {
      const t = tu && tu.team === a.team && tu.armorType === 'hard' ? tu : (tb && tb.team === a.team ? tb : null);
      if (!t || !adj) { hint('🔧 인접한 아군 차량/건물을 탭하세요'); return true; }
      if (t.hp >= t.maxHp && !t.trackDamaged && !t.gunDisabled) { hint('🔧 이미 수리가 필요 없는 상태입니다'); return true; }
      if (t === tu) { if (!armorRepair(a, t, 'eng')) { hint('🔧 수리 불가 (자금 15G·MUN 5 필요)'); return true; } } else t.hp = Math.min(t.maxHp, t.hp + 100);
      a.repairsLeft--; 
      addVeterancyExp(a, 2);
      addLog(`🔧 [수리] ${a.className} ➔ ${t.className || t.name} (무료, 잔여 ${a.repairsLeft}회)`, 'eng');
      if (a.repairsLeft < 1) stop(); else cont(`🔧 수리 완료 · 남은 횟수 ${a.repairsLeft}`);
      return true;
    }
    const key = `${hex.c},${hex.r}`, ter = terrainMap[key]; let st = null;
    const bk = bunkers.find(b => b.c === hex.c && b.r === hex.r && b.team === a.team && b.hp > 0), mn = mines.find(x => x.c === hex.c && x.r === hex.r && x.team === a.team);
    if (tb && tb.team === a.team && tb.type !== 'hq') st = { need: BLD[tb.type].tier >= 3 ? 3 : 2, cost: tb.cost || { g: 150, f: 0 }, del: () => { tb.hp = 0; }, n: tb.className };
    else if (bk) st = { need: 1, cost: bk.cost || { g: 150, f: 0 }, del: () => { bk.hp = 0; }, n: '벙커' };
    else if (mn) st = { need: 1, cost: mn.cost || { g: 90, f: 0 }, del: () => mines.splice(mines.indexOf(mn), 1), n: '지뢰' };
    else if (ter && ter.fort && ter.fort.team === a.team) st = { need: 1, cost: ter.fort.cost, del: () => { terrainMap[key] = ter.fort.orig; }, n: ter.name };
    if (!st || !adj) { hint('♻ 인접한 아군 구조물을 탭하세요'); return true; }
    if (a.rank < st.need) { hint(`♻ 이 구조물은 숙련 ★${st.need} 이상 필요`); return true; }
    const rt = [0, .5, .65, .8][a.rank], g = Math.floor(st.cost.g * rt), f = Math.floor((st.cost.f || 0) * rt);
    st.del(); gold[a.team] += g; fuel[a.team] += f; updateGoldUI();
    addLog(`♻ [해체] ${st.n} 회수 (+${g}G${f ? ' +' + f + 'F' : ''})`, 'eng'); stop(); updateVision(); return true;
  }


  function refillSupplyTruck(supplyTruck) {
    const myBase = buildings.find(b => b.team === supplyTruck.team && b.type === 'hq');
    if (getDistance(supplyTruck.c, supplyTruck.r, myBase.c, myBase.r) <= 1) {
      supplyTruck.supplies = supplyTruck.maxSupplies;
      addLog(`[재충전] ${supplyTruck.className} 보급품 20개 완충`, "supply");
      updateUnitInfoPanel(supplyTruck, getTerrain(supplyTruck.c, supplyTruck.r));
      render();
    } else {
      toast("사령부와 1칸 인접해야 합니다.");
    }
  }


  function bergepanzerRepair__base(berge) {
    if (berge.supplies < 1) { toast("구난 자재 부족!"); return; }
    let repaired = false;
    units.filter(u => u.team === berge.team && u.armorType === 'hard' && (u.hp < u.maxHp || u.trackDamaged || u.gunDisabled)).forEach(target => {
      if (!repaired && getDistance(berge.c, berge.r, target.c, target.r) === 1) {
        berge.supplies -= 1; berge.supplies += vetSave(berge, 'sup', vetV(berge).ammoSave);
        target.fireTurns = 0;
        if (mun[berge.team] >= 5) mun[berge.team] -= 5;
        if (!armorRepair(berge, target, 'berge')) berge.supplies += 1;
        addVeterancyExp(berge, 2);
        addLog(`🔧 [구난 수리] ${berge.className} ➔ ${target.className} 긴급 수리`, "eng");
        repaired = true;
      }
    });
    if (!repaired) toast("주변 1칸에 손상된 아군 기갑이 없습니다.");
    updateUnitInfoPanel(berge, getTerrain(berge.c, berge.r));
    render();
  }
  
  /* handleSpecialTap: layer moved to js/chains/handleSpecialTap.js */
  
  /* handleSpecialTap: layer moved to js/chains/handleSpecialTap.js */

  // 전차 탄종 전환
  function cycleShell(uid) {
    const u = uById(uid); if (!u || u.team !== currentTurn || !SHELL_KEYS.includes(u.key)) return;
    const order = ['std', 'ap', 'he']; u.shell = order[(order.indexOf(u.shell || 'std') + 1) % 3];
    addLog(`🔁 [탄종 전환] ${u.className} → ${SHELLS[u.shell].n}`, 'supply');
    updateUnitInfoPanel(u, getTerrain(u.c, u.r)); render();
  }

