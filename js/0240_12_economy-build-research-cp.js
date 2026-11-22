  // ══════════════════════════════════════════════════════════════
  // [12] 경제 · 징집/건설 · 연구 · CP
  //     · incomeOf/updateGoldUI/isLack, 징집 메뉴(updateBuildMenu/previewUnit/startUnitDeployment), UPG/연구/업그레이드, cpOf/syncCP
  // ══════════════════════════════════════════════════════════════


  const UI_TAB = { infantry: 'infantry', heavy: 'support', support: 'support', tank: 'tank' };
  function switchBuildTab(tab) { currentTab = tab; updateBuildMenu(); }
  let buildSel = null;
  function updateBuildMenu__base() {
    buildButtonsContainer.innerHTML = "";
    document.getElementById('buy-preview').style.display = 'none';
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === currentTab));
    const R = UNIT_ROSTER[currentTurn], TABS = ['infantry', 'support', 'tank'];
    const keys = Object.keys(R).filter(k => (buildSel ? true : UI_TAB[R[k].cat] === currentTab) && (!buildSel || canProd(buildSel, k)))
      .sort((a, b) => (buildSel ? TABS.indexOf(UI_TAB[R[a].cat]) - TABS.indexOf(UI_TAB[R[b].cat]) : 0) || R[a].cost - R[b].cost);
    let prevTab = null;
    keys.forEach(key => {
      const u = R[key], tab = UI_TAB[u.cat], hasProd = buildings.some(b => b.team === currentTurn && canProd(b, key));
      if (buildSel && prevTab && prevTab !== tab) { const sp = document.createElement('b'); sp.className = 'tile-sep'; buildButtonsContainer.appendChild(sp); }
      prevTab = tab;
      const lock = u.req && !research[currentTurn][u.req], lack = gold[currentTurn] < u.cost || fuel[currentTurn] < (u.fcost || 0);
      const btn = document.createElement("button"); btn.type = 'button';
      btn.className = "tile rec " + (tab === 'infantry' ? 'act' : tab === 'support' ? 'tgl' : 'wpn') + (lack ? ' lack' : '');
      btn.dataset.key = key; btn.title = `${u.uniqueName} · ${u.className}`;
      btn.innerHTML = `<i>${lock ? '🔒' : unitIco(u.code)}</i><b class="tg">${u.cost}</b>${u.fcost ? `<small>⛽${u.fcost}</small>` : (hasProd ? '' : '<small>🏗</small>')}`;
      btn.onclick = () => {
        if (btn.classList.contains('sel')) { if (lack) { toast(`자원이 부족합니다. (💰${u.cost} ⛽${u.fcost || 0})`); return; } buyUnit(key); return; }
        buildButtonsContainer.querySelectorAll('.rec.sel').forEach(x => x.classList.remove('sel')); btn.classList.add('sel'); previewUnit(key);
      };
      buildButtonsContainer.appendChild(btn);
    });
  }
  function previewUnit__base(key) {
    const t = UNIT_ROSTER[currentTurn][key], u = createUnitFromKey(0, currentTurn, key, 0, 0), f = x => +(+x).toFixed(1), box = document.getElementById('buy-preview');
    const hard = u.armorType === 'hard', lack = isLack(t.cost, t.fcost);
    const C = (l, v) => `<div class="pv-c"><small>${l}</small><b>${v}</b></div>`;
    box.style.display = 'block';
    box.innerHTML = `<div class="pv-h"><i>${unitIco(t.code)}</i><b>${t.uniqueName}</b><em class="${hard ? 'hd' : 'sf'}">${MACRO_CAT[u.macro] || (hard ? '중장갑' : '경장갑')} · ${ROLE_CODE[u.role] || ''}</em><span class="pv-p${lack ? ' lack' : ''}">💰${t.cost}${t.fcost ? ' ⛽' + t.fcost : ''}</span></div>
      <div class="pv-g">${C('체력', hpTxt(u))}${C('장갑', armTxt(u))}${C('공격력', atkTxt(u))}${u.sniperPct ? '' : C('범위', areaTxt(u))}${C('관통', penTxt(u))}${C('턴당 발사', rofTxt(u))}${C('사거리', (u.minRange ? u.minRange + '~' : '') + (u.raw ? rngTxt(u) : u.range))}${C('명중', accTxt(u))}${C('이동', u.moveDist)}${C('시야', u.baseSight)}${C('탄약', u.maxAmmo)}${u.hasFuel ? C('연료', u.maxFuel) : ''}${u.deflectDmgPct ? C('반사', Math.round(u.deflectDmgPct * 100) + '%') : ''}</div>
      <div class="pv-ex"></div><div class="pv-ft">${lack ? '자원이 부족합니다' : ''}</div>`;
  }
  function buyUnit(key) { document.getElementById('pane-build').style.display = 'none'; document.getElementById('buy-preview').style.display = 'none'; startUnitDeployment(key); }


  function startUnitDeployment__base(key) {
    const uData = UNIT_ROSTER[currentTurn][key];
    if (gold[currentTurn] < uData.cost || fuel[currentTurn] < uData.fcost) { toast(`자원이 부족합니다. (💰${uData.cost} ⛽${uData.fcost})`); return; }


    const prodBuildings = buildings.filter(b => b.team === currentTurn && b.hp > 0 && canProd(b, key));
    if (prodBuildings.length === 0) { toast("생산 건물이 없습니다! 공병으로 건설하세요."); return; }


    actionMode = 'deploy_unit';
    pendingDeployKey = key;
    guideBanner.textContent = `[배치] 사령부 또는 배럭 인접 1칸의 빈 타일을 탭하세요.`;
    guideBanner.style.display = "none";
    render();
  }


  function incomeOf(tm) {
    // v59: yields come from the point class (YIELD table, section [17c]); base income gets +5 fuel
    const p = capturePoints.filter(c => c.owner === tm && v131Supplied(c, tm));   // v131: only sectors linked to the HQ pay
    const sum = k => p.reduce((s, c) => s + ((c.yield || YIELD[c.cls] || {})[k] || 0), 0);
    const gross = BASE_INCOME + sum('g');
    const pop = units.filter(u => u.team === tm && u.hp > 0).length;
    const upkeep = Math.max(0, pop - 7) * 6;   // v127: more units survive long fights
    return { g: Math.max(Math.floor(gross * 0.25), gross - upkeep), gross, upkeep, f: BASE_FUEL + sum('f'), m: BASE_MUN + sum('m') + (doctrine[tm] === 'air' ? 15 : 0) };
  }
  function updateGoldUI__base() {
    const i = incomeOf(currentTurn);
    goldDisplay.innerHTML = `💰 ${gold[currentTurn]}<i>+${i.g}</i> · ⛽ ${fuel[currentTurn]}<i>+${i.f}</i> · 💣 ${mun[currentTurn]}<i>+${i.m}</i>`; goldDisplay.title = `유지비 -${i.upkeep}G`; refreshAfford();
  }
  function isLack(g, f) { return gold[currentTurn] < g || fuel[currentTurn] < (f || 0); }
  function chipAttr(g, f) { return `class="price-chip${isLack(g, f) ? ' lack' : ''}" data-g="${g}" data-f="${f || 0}"`; }
  function refreshAfford() { document.querySelectorAll('.price-chip').forEach(el => el.classList.toggle('lack', isLack(+el.dataset.g, +el.dataset.f))); }


  const UPG = { atk: ['공격력', 10], hp: ['체력', 10], acc: ['명중', 12], armor: ['장갑', 8], sight: ['시야', 10], reflect: ['반사피해', 12], rof: ['연사', 10], move: ['이동', 10] };
  const UPG_BY_CAT = { infantry: ['atk', 'hp', 'acc', 'armor', 'sight', 'move'], heavy: ['atk', 'hp', 'acc', 'armor', 'sight', 'rof'], support: ['atk', 'hp', 'acc', 'armor', 'sight', 'rof', 'move'], tank: ['atk', 'hp', 'acc', 'armor', 'sight', 'reflect', 'rof', 'move'] };
  const CAT_NAME = { infantry: '보병', heavy: '중화기', support: '지원', tank: '전차' }, MAX_LV = 3, r1 = x => Math.round(x * 10) / 10;
  let upg = { blue: {}, red: {} }, resSel = {};
  const lvOf = (tm, k, st) => (upg[tm][k] || {})[st] || 0;
  function stepStat(u, st) {
    const p = UPG[st][1] / 100;
    if (st === 'atk') { u.atk = r1(u.atk * (1 + p)); if (u.pen !== undefined) u.pen = penScale(u.pen, 1 + p); if (u.sub) { u.sub.atk = r1(u.sub.atk * (1 + p)); u.sub.pen = penScale(u.sub.pen, 1 + p); } }   // v161
    else if (st === 'hp') { const d = Math.max(1, Math.round(u.maxHp * p)); u.maxHp += d; u.hp += d; }
    else if (st === 'acc') { if (u.acc) { u.acc[1] = Math.min(1, 1 - (1 - u.acc[1]) * (1 - p)); u.acc[2] = Math.min(1, 1 - (1 - u.acc[2]) * (1 - p)); } u.accDrop = Math.max(0.01, Math.round(u.accDrop * (1 - p) * 1000) / 1000); }
    else if (st === 'armor') { const o = u.armor; u.armor = r1(u.armor + Math.max(0.5, u.armor * p)); const k = o > 0 ? u.armor / o : 1; if (u.armorS !== undefined) u.armorS = r1(u.armorS * k); if (u.armorR !== undefined) u.armorR = r1(u.armorR * k); }
    else if (st === 'sight') u.baseSight += 1;
    else if (st === 'reflect') u.deflectDmgPct = Math.min(0.6, Math.round((u.deflectDmgPct + Math.max(0.03, u.deflectDmgPct * p)) * 100) / 100);
    else if (st === 'rof') u.rof = r1(u.rof * (1 + p));
    else if (st === 'move') { const d = Math.max(1, Math.round(u.moveDist * p)); u.moveDist += d; u.remainingMove += d; }
  }

  
  function renderResearch() { renderCP(); return; }
  
  
  


  // ===== CoH3식 개편: 분대원 · 치료/충원 · 기갑 수리 · CP =====
  const cpOf = tm => Math.min(8, Math.floor(teamXp[tm] / 25));
  function syncCP(tm) { const c = cpOf(tm); research[tm].cheap = c >= 2; research[tm].counter = c >= 3; research[tm].heavy = c >= 5; research[tm].optics = doctrine[tm] === 'air'; }
  [..."blue,red".split(',')].forEach(syncCP);
   /* updateGoldUI: layer moved to js/chains/updateGoldUI.js */

