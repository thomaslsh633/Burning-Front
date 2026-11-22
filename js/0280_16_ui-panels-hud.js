  // ══════════════════════════════════════════════════════════════
  // [16] UI 패널 · HUD · 시트 · 미리보기
  //     · 전투 예측(showAttackPreview), 정보 패널(updateUnitInfoPanel 래핑 체인), 유닛/타일 스트립, 시트/메뉴, CP 패널(renderCP), 하단 HUD(rebuildHud)
  // ══════════════════════════════════════════════════════════════


  function terrChips(att, def) {
    const ter = Object.assign({}, getTerrain(def.c, def.r), { cover: coverVs(def, att) }), ig = !!(att.isFlamer || att.ignoreCover || att.isMortar || att.isArtillery || att.isNebel), out = [];   // v145
    { const e = LAYERS.edgeCover && def.armorType === 'soft' && entryEdge(att, def), d = edgeDef(e); if (d && d.cover !== 'none' && ter.cover === COV_LEGACY[d.cover] && ter.cover !== (getTerrain(def.c, def.r).cover || 'none')) out.push(`<b class="pb-cv">⟋ ${EDGE_NAMES[e.kind]}</b>`); }
    if (!ig && ter.cover === 'yellow') out.push('<b class="pb-cv">🛡 엄폐 ×0.5</b>');
    else if (!ig && ter.cover === 'hard') out.push('<b class="pb-cv">🛡 강엄폐 ×0.25</b>');
    if (getTerrain(att.c, att.r).elevation > ter.elevation) out.push('<b class="pb-hi">▲ 고지 ×1.15</b>');
    return out.join('');
  }
  function showAttackPreview__base(att, def, c, r) {
    pendingAttackTarget = { c, r };
    const res = calcDamage(att, def, true);
    const predictedDefHp = Math.max(0, def.hp - res.damage);


    let predictedAttHp = att.hp;
    let counterText = "적 반격 없음";
    const defSuppressedAfter = def.armorType === 'soft' && ((def.suppression || 0) + (res.suppress || 0)) >= 50;


    if (def.range !== undefined && def.ammo > 0 && def.counterAttacksLeft > 0 && !(def.buff && def.buff.retreat > 0)) {
      const dist = getDistance(def.c, def.r, att.c, att.r);
      const cMain = mainReach(def, att.c, att.r, dist), cSub = subReach(def, att.c, att.r, dist);
      const elevRule = checkElevationCombatRule(def, att);


      if ((cMain || cSub) && (elevRule.allowed || (cSub && !cMain)) && predictedDefHp > 0) {
        if (suppState(def) >= 1) counterText = "🔻 적 제압 상태 — 반격 불가";
        else if (defSuppressedAfter) counterText = "🔻 이 공격으로 적 제압 → 반격 불가";
        else {
          const counterRes = calcDamage(def, att, true);
          predictedAttHp = Math.max(0, att.hp - counterRes.damage);
          counterText = `적 반격 피해 -${hpD(counterRes.damage)} (아군 HP: ${hpD(att.hp)} ➔ ${hpD(predictedAttHp)})`;
        }
      }
    }


    const mgCover = units.find(u => u.team === def.team && u.id !== def.id && mgCanCover(u, att));
    if (mgCover) counterText += ` | 🛡️ ${mgCover.className} 원호사격 예정`;
    const hitText = res.zone ? ` | ${res.zoneLabel} · 관통 ${res.penChance}%` : '';
    const suppText = res.suppress > 0 ? ` | 제압 +${res.suppress}` : '';
    const zn = { front: '전면', side: '측면', rear: '후면' }[res.zone], mx = def.maxHp || def.hp || 1, hp = x => Math.max(0, Math.min(100, x / mx * 100));
    const cLbl = counterText.includes('반격 피해') ? `<span class="pb-ctr pb-warn">↩ 반격 -${hpD(att.hp - predictedAttHp)} · 아군 HP ${hpD(att.hp)} ➔ ${hpD(predictedAttHp)}</span>` : `<span class="pb-ctr pb-ok">✕ 반격 불가·없음</span>`;
    const vsArmor = def.armorType === 'hard' && !def.type, rofR = Math.round(res.rof * 10) / 10;
    const penChip = vsArmor ? `<b class="pb-${res.zone ? res.zone[0] : 's'}">${zn ? zn + ' · ' : ''}${res.priSub ? res.subName + ' ' : ''}관통 ${res.penChance}% (${penFmt(res.penVal)})</b>` : '';
    const rofChip = res.rof >= 2 && vsArmor ? `<b>연사 ×${rofR} (기대관통 ${res.pens})</b>` : `<b>연사 ×${rofR}</b>`;
    const subTag = res.priSub ? (res.mainDmg > 0 ? ` + 주무장 ${res.mainDmg}` : '') : (res.subDmg > 0 ? ` + ${res.subName || '기총'} ${res.subDmg}` : '');
    const dmgNote = att.isSniper && def.armorType === 'soft' && def.N ? `인원비례 ${Math.round((att.sniperPct || 1.2) * 100 / def.N)}%`
      : vsArmor ? `발당 관통 ${res.penDmgOut} / 도탄 ${res.deflDmgOut}${subTag}` : `기댓값${subTag}`;
    previewText.innerHTML = `<div class="pb-head">⚔ ${att.className} ➔ ${def.className || def.name}</div>
      <div class="pb-chips"><b>🎯 ${res.accuracy}%</b>${rofChip}${penChip}${res.suppress > 0 ? `<b class="pb-sup">⇩ 제압 +${res.suppress}</b>` : ''}${terrChips(att, def)}${mgCover ? `<b>🛡 원호 ${mgCover.className}</b>` : ''}</div>
      <div class="pb-hp"><i style="width:${hp(predictedDefHp)}%"></i><u style="width:${hp(def.hp) - hp(predictedDefHp)}%"></u></div>
      <div class="pb-hpt">적 HP ${hpD(def.hp)} ➔ ${hpD(predictedDefHp)} (-${hpD(res.damage)} · ${dmgNote})</div>${cLbl}`;
    combatPreviewBanner.style.display = "flex"; placeBalloon();
  }
  function placeBalloon() {
    const b = combatPreviewBanner;
    if (!pendingAttackTarget || b.style.display === "none") return;
    const cr = b.parentElement.getBoundingClientRect(), kr = canvas.getBoundingClientRect(), q = getHexCenter(pendingAttackTarget.c, pendingAttackTarget.r);
    const tx = kr.left - cr.left + (q.x - camX) * zoom, ty = kr.top - cr.top + (q.y - camY) * zoom;
    b.classList.add("balloon"); b.style.width = Math.min(232, cr.width - 12) + "px";
    const w = b.offsetWidth, h = b.offsetHeight, above = ty - 34 - h >= 52, left = Math.max(6, Math.min(cr.width - w - 6, tx - w / 2));
    b.classList.toggle("below", !above);
    b.style.left = left + "px"; b.style.right = "auto"; b.style.transform = "none"; b.style.top = (above ? ty - 34 - h : ty + 20) + "px";
    b.style.setProperty("--tail", Math.max(16, Math.min(w - 16, tx - left)) + "px");
  }
  function clearAttackPreview() {
    pendingAttackTarget = null;
    combatPreviewBanner.style.display = "none";
  }


  // ==========================================
  // 타일 상세 정보 표시 (Yellow 커버 0.8배 명시)
  // ==========================================
  function showTileInfo__base(c, r, ter, point) {
    specialActionsEl.innerHTML = "";
    const def = TERRAIN_DEFS[ter.terrainType] || TERRAIN_DEFS.plains;
    let coverBadge = `<span class="mil-tag tag-cover-none">무엄폐 (1.0배 피해)</span>`;
    if (ter.cover === 'hard') coverBadge = `<span class="mil-tag tag-cover-hard">하드 커버 (0.25배 피해)</span>`;
    if (ter.cover === 'yellow') coverBadge = `<span class="mil-tag tag-cover-yellow">옐로우 커버 (0.5배 피해)</span>`;


    const elevBadge = `<span class="mil-tag tag-elev">고도 Lv.${ter.elevation}</span>`;
    let pointText = point ? `<br><span style="color:#38bdf8; font-weight:bold;">${cpTipText(point)}</span>` : "";


    unitInfoEl.innerHTML = `
      좌표: <strong>(${c}, ${r})</strong> | 지형: <strong>${ter.name}</strong><br>
      이동력 소모: 보병 <strong>${def.inf}</strong> / 기갑 <strong>${def.veh === Infinity ? '진입불가' : def.veh}</strong><br>
      방호: ${elevBadge} ${coverBadge}
      ${pointText}
    `;
  }


  function updateUnitInfoPanel__base(u, ter) {
    specialActionsEl.innerHTML = "";
    if (!u) {
      unitInfoEl.innerHTML = "선택된 대상이 없습니다. (화면을 드래그하여 시점을 이동하세요)";
      return;
    }
    if (u.type && BLD[u.type]) {
      unitInfoEl.innerHTML = `
        <strong>[${u.className}] ${u.name}</strong><br>
        방호 내구도: <strong>${hpCurD(u)}</strong> / ${hpMaxD(u)}<br>
        장갑: 🛡️ ${armD(u)} (거점 시설)
      `;
      return;
    }


    const armorBadge = u.armorType === 'hard'
      ? `<span class="mil-tag tag-hard">장갑 차량</span>`
      : `<span class="mil-tag tag-soft">보병·포반</span>`;


    let fuelText = u.hasFuel ? ` | 연료: <span class="mil-tag tag-fuel">${u.fuel}/${u.maxFuel}</span>` : "";
    const elev = ter ? ter.elevation : 0;
    const deflectText = u.deflectDmgPct > 0 ? ` | 도탄보장: <span style="color:#fbbf24;">${Math.round(u.deflectDmgPct * 100)}%</span>` : "";
    const nextXp = u.rank < 3 ? vetThr(u)[u.rank] : 'MAX';


    unitInfoEl.innerHTML = `
      <strong>[${u.className}] ${u.uniqueName}</strong> [${u.rank > 0 ? "★".repeat(u.rank) : "일반"} (${u.xp || 0}/${nextXp} XP)] ${armorBadge}<button type="button" class="info-btn" onclick="openDetail()" aria-label="유닛 상세">ⓘ</button><br>
      체력: <strong>${hpCurD(u)}</strong>/${hpMaxD(u)} | 장갑: <strong>${u.rawD && u.rawD.arm ? armTxt(u) : (u.armorS !== undefined ? [u.armor, u.armorS, u.armorR].map(x => Math.round(x / RAW.PENK)).join('/') : armD(u))}</strong> | 탄약: <strong>${u.ammo}/${u.maxAmmo}</strong>${fuelText}<br>
      화력: 공격력 <strong>${atkTxt(u)}</strong>${u.sniperPct ? '' : ` / 범위 <strong>${areaTxt(u)}</strong>`} | 관통: <strong>${penTxt(u)}</strong> | 턴당 발사: <strong>${rofTxt(u)}</strong>${u.sub ? ` | 부무장: <strong>${u.sub.n}</strong>` : ''} | 명중: <strong>${accTxt(u)}</strong>${deflectText}<br>
      기동: <strong>${u.remainingMove}/${u.moveDist}칸</strong> | 사거리: <strong>${u.minRange > 0 ? u.minRange + '~' : ''}${u.range}칸</strong> | 고도: <strong>Lv.${elev}</strong> | 반격: <strong>${u.counterAttacksLeft}/${counterMax(u.team)}</strong>${statusLineHtml(u)}
    `;


    if (u.team === currentTurn) {
      if (u.cargoCap > 0 && u.class !== 'supply') {
        specialActionsEl.innerHTML = v129CargoHtml(u);   // v129: every vehicle with seats (half-tracks, ambulances, Weasel)
      } else if (u.class === 'supply') {
        specialActionsEl.innerHTML = `
          <div class="action-subpanel">
            <strong>[보급] 상자: ${u.supplies}/${u.maxSupplies}</strong>
            <button class="btn-action" style="display:inline-block; margin-left:4px;" onclick="toggleMode(selectedUnit,'give_supply')">${actionMode === 'give_supply' ? '📦 보급 모드 ON (탭=종료)' : '📦 보급 모드 시작'}</button>
            <button class="btn-action" style="display:inline-block; margin-left:2px;" onclick="refillSupplyTruck(selectedUnit)">사령부 완충</button>
          </div>
        ` + v129CargoHtml(u);   // v129: supply trucks carry two squads
      } else if (u.key === 'engineer') {
        const EI = { trench: '〰', sandbag: '▦', mine: '✸', mg_bunker: '⛫', medic_bunker: '✚' };
        const bb = t => {
          const d = BLD[t] ? bd(t, u.team) : FORT[t], g = Math.round(d.g * (research[u.team].cheap ? .85 : 1) * (1 - vetV(u).buildDisc)), lock = BLD[t] && !reqOk(u.team, t), on = actionMode === 'build_' + t && activeActor === u;
          return `<button class="et${on ? ' busy' : ''}${lock ? ' locked' : ''}" onclick="startTargetedBuild(selectedUnit,'${t}')" aria-label="${d.n}${lock ? ' (선행 건물 필요: ' + reqName(u.team, t) + ')' : ''}"><i>${lock ? '🔒' : (d.s || EI[t])}</i><span>${d.n}</span><small ${lock ? '' : chipAttr(g, d.f)}>${lock ? '요구: ' + reqName(u.team, t) : g + 'G' + (d.f ? ' ⛽' + d.f : '')}</small></button>`;
        };
        const wk = (m, ico, name, sub, lock) => `<button class="et${actionMode === m && activeActor === u ? ' busy' : ''}${lock ? ' locked' : ''}" onclick="toggleMode(selectedUnit,'${m}')" aria-label="${name}"><i>${lock ? '🔒' : ico}</i><span>${name}</span><small>${sub}</small></button>`;
        specialActionsEl.innerHTML = `<div class="action-subpanel eng-tray"><div class="et-head"><strong>⚒ 공병 ★${u.rank}</strong><span>XP ${u.xp || 0}/${nextXp}</span><span>🔧 ${u.repairsLeft}/${2 + vetV(u).repairPlus}</span></div>
          <div class="et-row">${['trench', 'sandbag', 'mine', 'mg_bunker', 'medic_bunker'].concat(typeof v134EmplList === 'function' ? v134EmplList(u.team) : []).map(bb).join('')}<b class="et-sep"></b>${BLD_LIST[u.team].concat(docList(u.team)).map(bb).join('')}<b class="et-sep"></b>${wk('repair', '🔧', '수리', '무료')}${wk('salvage', '♻', '해체·회수', u.rank ? '회수' : '★1 필요', !u.rank)}</div></div>`;
      } else if (u.class === 'repair_vehicle') {
        specialActionsEl.innerHTML = `
          <div class="action-subpanel">
            <strong>[구난 정비]</strong>
            <button class="btn-action" onclick="bergepanzerRepair(selectedUnit)">기갑 긴급수리 (1 자재 / +50 HP)</button>
          </div>
        `;
      }
    }
  }


  // v25: 제원·명령/통신 탭 제거 — 유닛 정보는 하단 HUD 카드로 통합


  
  const unitStrip = document.getElementById("unit-strip");
  unitStrip.addEventListener("click", () => { if (selectedUnit) openDetail(); });
  new MutationObserver(() => { specialActionsEl.style.display = (specialActionsEl.children.length || specialActionsEl.textContent.trim()) ? "flex" : "none"; })
    .observe(specialActionsEl, { childList: true, subtree: true, characterData: true });
  function syncBuildTray(u) {
    const tray = document.getElementById("pane-build"), R = UNIT_ROSTER[currentTurn];
    const own = u && u.type && BLD[u.type] && u.team === currentTurn && u.hp > 0 && Object.keys(R).some(k => canProd(u, k));
    buildSel = own ? u : null;
    if (!own) { tray.style.display = "none"; return; }
    const tab = ["infantry", "support", "tank"].find(t => Object.keys(R).some(k => UI_TAB[R[k].cat] === t && canProd(u, k)));
    document.querySelectorAll(".tab-btn").forEach(b => { b.style.display = Object.keys(R).some(k => UI_TAB[R[k].cat] === b.dataset.tab && canProd(u, k)) ? "" : "none"; });
    currentTab = tab; updateBuildMenu(); tray.style.display = "flex";
  }
  const hpCls = p => p > 60 ? "" : p > 30 ? "mid" : "low";
  unitStrip.addEventListener("animationend", () => unitStrip.classList.remove("uc-anim"));
  function renderUnitStrip(u) {
    if (!u) { unitStrip.classList.remove("show"); return; }
    if (!unitStrip.classList.contains("show")) unitStrip.classList.add("uc-anim");
    const hpP = Math.max(0, Math.min(100, u.hp / u.maxHp * 100)), hpBar = `<div class="us-hp"><i class="${hpCls(hpP)}" style="width:${hpP}%"></i></div><span>❤ ${hpCurD(u)}/${hpMaxD(u)}</span>`;
    if (u.type && BLD[u.type]) {
      unitStrip.innerHTML = `<div class="us-head"><span class="us-nm">${u.className}${u.name ? " · " + u.name : ""}</span></div><div class="us-row"><span>🛡 ${armD(u)}</span>${hpBar}</div>`;
    } else {
      const star = u.rank ? " " + "★".repeat(Math.min(u.rank, 5)) : "", rk = u.rank || 0, nx = rk < 3 ? vetThr(u)[rk] : 0, xpP = rk < 3 ? (u.xp || 0) / nx * 100 : 100;
      const bar = (cls, p, label) => `<span class="uc-bar ${cls}" role="img" aria-label="${label}"><i style="width:${Math.max(0, Math.min(100, p))}%"></i><b>${label}</b></span>`;
      const cap = typeof hpCap === "function" && hpCap(u) < u.maxHp ? ` (≤${Math.round(hpCap(u))})` : "";
      const squad = u.N && u.models != null ? `<span title="분대원">👥 ${u.models}/${u.N}</span>` : "";
      const hpTxt = `<div class="us-hp"><i class="${hpCls(hpP)}" style="width:${hpP}%"></i></div><span>❤${hpCurD(u)}/${hpMaxD(u)}${cap}</span>`;
      unitStrip.innerHTML = `<div class="us-head"><span class="us-nm">${unitIco(u.code)} ${u.uniqueName}${star}</span><button type="button" class="info-btn uc-info" onclick="event.stopPropagation();openDetail()" aria-label="유닛 상세">ⓘ</button></div>
        <div class="us-row">${hpTxt}</div>
        <div class="uc-bars">${bar("xp", xpP, rk < 3 ? `XP ${u.xp || 0}/${nx}` : "XP MAX")}${bar("am", u.maxAmmo ? u.ammo / u.maxAmmo * 100 : 0, `🔫 ${u.ammo}/${u.maxAmmo}`)}${u.hasFuel ? bar("fu", u.maxFuel ? u.fuel / u.maxFuel * 100 : 0, `⛽ ${Math.round(u.fuel)}/${u.maxFuel}`) : ""}</div>
        <div class="us-row"><span>👣 ${u.remainingMove}/${u.moveDist}</span><span>🛡 ${armD(u)}</span>${squad}${stripStatus(u)}${u.supplies ? `<span>📦 ${u.supplies}</span>` : ""}</div>`;
    }
    unitStrip.classList.add("show");
  }
  function renderTileStrip__base(ter, c, r) {
    unitStrip.innerHTML = `<div class="us-head"><span>(${c}, ${r}) ${ter.name}</span></div><div class="us-row"><span>고도 ${ter.elevation}</span><span>👣 보병 ${(d => d.inf)(TERRAIN_DEFS[ter.terrainType] || TERRAIN_DEFS.plains)} · 기갑 ${(d => d.veh === Infinity ? "✕" : d.veh)(TERRAIN_DEFS[ter.terrainType] || TERRAIN_DEFS.plains)}</span><span>${ter.cover === "hard" ? "하드 커버" : ter.cover === "yellow" ? "옐로우 커버" : "무엄폐"}</span>${edgeStripText(c, r)}</div>`;
    unitStrip.classList.add("show");
  }
  /* updateUnitInfoPanel: layer moved to js/chains/updateUnitInfoPanel.js */
  /* showTileInfo: layer moved to js/chains/showTileInfo.js */

  /* startUnitDeployment: layer moved to js/chains/startUnitDeployment.js */


  const menuSheet = document.getElementById("menu-sheet");
  // v18: 수입 시트 · 유닛 상세 시트 · 범례
  const kvRow = (k, v, cls = '') => `<dt>${k}</dt><dd class="${cls}">${v}</dd>`;
  const f1 = x => +(+x).toFixed(1);
  function openSheet(id) { document.getElementById(id).classList.add('open'); }
  document.querySelectorAll('.sheet-back').forEach(el => el.addEventListener('click', e => { if (e.target === el || e.target.dataset.close) el.classList.remove('open'); }));
  window.addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelectorAll('.sheet-back.open').forEach(x => x.classList.remove('open')); });
  const goldBoxEl = document.getElementById('gold-box');
  goldBoxEl.addEventListener('click', () => openIncome());
  goldBoxEl.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openIncome(); } });
  function openIncome() {
    const tm = currentTurn, i = incomeOf(tm), mine = capturePoints.filter(c => c.owner === tm);
    const by = cls => mine.filter(c => c.cls === cls);
    const pop = units.filter(u => u.team === tm && u.hp > 0).length, floorG = Math.floor(i.gross * 0.25);
    const g = i.g >= 0 ? '+' + i.g : '' + i.g;
    const rows = (cls, key, label) => { const all = by(cls), ok = all.filter(c => v131Supplied(c, tm)), v = ok.reduce((s, c) => s + ((c.yield || YIELD[cls])[key] || 0), 0); return all.length ? kvRow(`${label} ${ok.length}${all.length > ok.length ? ' (cut off ' + (all.length - ok.length) + ')' : ''}`, '+' + v, 'pos') : ''; };   // v131
    document.getElementById('income-body').innerHTML =
      `<div class="set-group"><h3>💰 Funds · ${gold[tm]}</h3><dl class="kv">${kvRow('Base income', '+' + BASE_INCOME, 'pos')}${rows('manpower', 'g', 'Manpower points')}${rows('fuel', 'g', 'Fuel point manpower')}${rows('fuel_minor', 'g', 'Minor fuel manpower')}${rows('mun', 'g', 'Ammo point manpower')}${kvRow('Gross', i.gross, 'tot')}${kvRow(`Upkeep (${pop} units · 4% of price, max 40 · fuel −${i.fu || 0})`, i.upkeep ? '−' + i.upkeep : '0', i.upkeep ? 'neg' : '')}${kvRow('Net / turn', g, 'tot pos')}</dl>${i.gross - i.upkeep < floorG ? '<div class="sheet-note">Net income never drops below 25% of gross.</div>' : ''}</div>` +
      `<div class="set-group"><h3>⛽ Fuel · ${fuel[tm]}</h3><dl class="kv">${kvRow('Base', '+' + BASE_FUEL, 'pos')}${rows('fuel', 'f', 'Fuel points')}${rows('fuel_minor', 'f', 'Minor fuel points')}${kvRow('Total / turn', '+' + i.f, 'tot pos')}</dl></div>` +
      `<div class="set-group"><h3>💣 Munitions · ${mun[tm]}</h3><dl class="kv">${kvRow('Base', '+' + BASE_MUN, 'pos')}${rows('mun', 'm', 'Munitions points')}${doctrine[tm] === 'air' ? kvRow('Airborne doctrine', '+15', 'pos') : ''}${kvRow('Total / turn', '+' + i.m, 'tot pos')}</dl></div>` +
      `<div class="set-group"><h3>Points held ${mine.length} / ${capturePoints.length} · CP ${cpOf(tm)}</h3><div class="sheet-note">${mine.length ? mine.map(c => cpIcon(c) + ' ' + c.name).join('<br>') : 'No points held.'}</div></div>`;
    openSheet('income-sheet');
  }
  function openDetail__base() {
    const u = selectedUnit; if (!u || (u.type && BLD[u.type])) return;
    const ter = getTerrain(u.c, u.r), tdef = TERRAIN_DEFS[ter.terrainType] || {}, ally = u.team === 'blue', st = u.armorType === 'soft' ? suppState(u) : 0;
    const hpP = Math.max(0, Math.min(100, u.hp / u.maxHp * 100)), nextXp = u.rank < 3 ? vetThr(u)[u.rank] : 'MAX';
    const cov = ter.cover === 'hard' ? '하드 커버 (피해 ×0.25)' : ter.cover === 'yellow' ? '옐로우 커버 (피해 ×0.5)' : '엄폐 없음';
    const stat = [];
    if (u.armorType === 'soft') stat.push(`제압치 ${u.suppression || 0}/${SUPP_MAX} [${['정상', '제압', '고착'][st]}]`);
    if (u.trackDamaged) stat.push('⛓ 궤도 손상 (다음 턴 이동 불가)');
    if (u.fireTurns > 0) stat.push(`🔥 엔진 화재 ${u.fireTurns}턴`);
    if (u.gunDisabled) stat.push(u.tgl && u.tgl.recon ? '🔭 정찰 모드 (주포 사용 불가)' : '🔇 주포 고장 (수리 전 공격 불가)');
    if (u.tgl) Object.keys(u.tgl).filter(k => u.tgl[k] && TGL[k]).forEach(k => stat.push('🔘 ' + TGL[k].n + ' ' + (TGL[k].st ? TGL[k].st[1] : 'ON')));
    document.getElementById('detail-title').textContent = `ⓘ ${u.uniqueName || u.className}`;
    document.getElementById('detail-body').innerHTML =
      `<div class="set-group"><h3>${ally ? '연합군' : '독일군'} · ${u.className} · ${MACRO_CAT[u.macro] || (u.armorType === 'hard' ? '중장갑' : '경장갑')} · ${ROLE_CODE[u.role] || ''}</h3><div class="hp-bar" role="img" aria-label="체력 ${Math.round(hpP)}%"><i style="width:${hpP}%;background:${hpP > 40 ? (ally ? '#38bdf8' : '#f87171') : '#fbbf24'}"></i></div><dl class="kv">${kvRow('체력', `${hpCurD(u)} / ${hpMaxD(u)}`)}${u.N ? kvRow('분대원', `${u.models} / ${u.N}`, u.models < u.N ? 'neg' : '') : ''}${u.N && u.models < u.N ? kvRow('현재 체력 상한', hpD(hpCap(u))) : ''}${u.armorS !== undefined ? kvRow('장갑 (전/측/후)', f1(u.armor) + ' / ' + f1(u.armorS) + ' / ' + f1(u.armorR)) : kvRow('장갑', f1(u.armor))}${kvRow('베테랑', `${u.rank > 0 ? '★'.repeat(u.rank) : '일반'} (${u.xp || 0} / ${nextXp} XP)`)}</dl></div>` +
      `${vetTraitsHtml(u)}<div class="set-group"><h3>화력</h3><dl class="kv">${kvRow('공격력', atkTxt(u) + (u.raw ? ' (1명당 피해)' : ''))}${kvRow('체력', hpTxt(u) + (u.rawD && u.rawD.N ? ' (인원×1인 체력)' : ''))}${kvRow('타격 범위', areaTxt(u))}${kvRow('관통 (근/중/원)', penTxt(u))}${u.sub ? kvRow('부무장', `${u.sub.n} (${rofTxt(u.sub)}, 공격 ${atkTxt(u.sub)}, 사거리 ${u.sub.range}, 관통 ${penTxt(u.sub)})`) : ''}${kvRow('턴당 발사 (근/중/원)', rofTxt(u))}${kvRow('사거리', `${u.minRange > 0 ? u.minRange + '~' : ''}${u.range}칸` + (u.raw ? ` (구간 ${rngTxt(u)})` : ''))}${kvRow('명중', accTxt(u))}${u.deflectDmgPct > 0 ? kvRow('도탄 보장', Math.round(u.deflectDmgPct * 100) + '%') : ''}${kvRow('탄약', `${u.ammo} / ${u.maxAmmo}`)}${u.hasFuel ? kvRow('연료', `${u.fuel} / ${u.maxFuel}`) : ''}</dl></div>` +
      `<div class="set-group"><h3>기동 · 시야 · 상태</h3><dl class="kv">${kvRow('기동', `${u.remainingMove} / ${u.moveDist}칸`)}${kvRow('시야', u.baseSight + '칸')}${u.cargoCap > 0 ? kvRow('탑승', v129CargoUsed(u) + ' / ' + u.cargoCap + '분대' + (u.tow ? ' · 중화기 가능' : '')) : ''}${u.hw ? kvRow('차량 탑승', V129_HW[u.hw]) : ''}${u.capt && u.armorType === 'hard' ? kvRow('거점 점령', '가능') : ''}${u.saImm ? kvRow('장갑', '소화기 면역') : ''}${kvRow('반격', `${u.counterAttacksLeft} / ${counterMax(u.team)}`)}${kvRow('이번 턴 공격', u.hasAttacked ? '사용함' : '가능')}${kvRow('위치', `(${u.c}, ${u.r}) ${tdef.name || ter.name || ''}`)}${kvRow('고도 · 엄폐', `Lv.${ter.elevation} · ${cov}`)}</dl>${stat.length ? '<div class="sheet-note" style="color:#fbbf24">' + stat.join('<br>') + '</div>' : ''}</div>` +
      `<div class="set-group"><h3>마커 범례</h3><dl class="legend">` +
      `<dt>⛉</dt><dd>아군은 아래가 뾰족, 적군은 윗변에 홈이 있고 아래가 평평합니다. 위쪽 막대가 체력입니다.</dd>` +
      `<dt style="color:#fbbf24">★</dt><dd>베테랑 단계</dd>` +
      `<dt><span style="color:#fde047">◇</span> <span style="color:#4ade80">◆</span></dt><dd>우하단: 윤곽만 노랑 = 옐로우 커버(×0.8), 채움 초록 = 하드 커버(×0.5)</dd>` +
      `<dt style="color:#a5b4fc">▲</dt><dd>좌하단: 고지(고도 1 이상)</dd>` +
      `<dt>⑤</dt><dd>좌상단 숫자: 현재 분대원 수 (줄면 노랑)</dd>` +
      `<dt><span style="color:#38bdf8">●</span><span style="color:#fb923c">●</span></dt><dd>아래 점: 파랑 = 이동 가능, 주황 = 공격 가능, 초록 점 = 반격 가능 (내 턴 아군만)</dd>` +
      `<dt style="color:#ef4444">✕</dt><dd>우측 배지: 고착 (이동·공격 불가, 받는 피해 −20%, 시야 −1)</dd>` +
      `<dt style="color:#fbbf24">⌄⌄</dt><dd>제압 (이동 −50%, 명중 −30%, 반격 불가, 턴마다 회복)</dd>` +
      `<dt style="color:#fb923c">▮▮</dt><dd>궤도 손상 (다음 턴 이동 불가)</dd>` +
      `<dt style="color:#f87171">🔥</dt><dd>엔진 화재 (매 턴 피해)</dd></dl></div>`;
    openSheet('detail-sheet');
  }
  document.getElementById("menu-close").addEventListener("click", () => menuSheet.classList.remove("open"));
  document.getElementById("menu-btn").addEventListener("click", () => {
    menuSheet.classList.add("open");
    document.getElementById("res-team").value = currentTurn;
    document.getElementById("res-g").value = gold[currentTurn]; document.getElementById("res-f").value = fuel[currentTurn]; document.getElementById("res-m").value = mun[currentTurn]; document.getElementById("res-cp").value = cpOf(currentTurn);
  });
  document.getElementById("res-team").addEventListener("change", e => {
    document.getElementById("res-g").value = gold[e.target.value]; document.getElementById("res-f").value = fuel[e.target.value]; document.getElementById("res-m").value = mun[e.target.value]; document.getElementById("res-cp").value = cpOf(e.target.value);
  });
  document.getElementById("res-apply").addEventListener("click", () => {
    const tm = document.getElementById("res-team").value, g = parseInt(document.getElementById("res-g").value), f = parseInt(document.getElementById("res-f").value);
    if (!isNaN(g)) gold[tm] = Math.max(0, g);
    if (!isNaN(f)) fuel[tm] = Math.max(0, f);
    const mv = parseInt(document.getElementById("res-m").value); if (!isNaN(mv)) mun[tm] = Math.max(0, Math.min(400, mv));
    const cv = parseInt(document.getElementById("res-cp").value); if (!isNaN(cv)) { const c8 = Math.max(0, Math.min(8, cv)); if (c8 !== cpOf(tm)) { teamXp[tm] = c8 * 25; syncCP(tm); } }   // v58: CP 직접 입력 (XP = CP×25, 변경 시에만 적용)
    updateGoldUI(); updateBuildMenu(); renderResearch(); renderCP();
    addLog(`🛠 [자원 직접 입력] ${tm === 'blue' ? '연합군' : '추축군'} 💰${gold[tm]} ⛽${fuel[tm]} 💣${mun[tm]} 🎖CP${cpOf(tm)}`);
  });
  document.getElementById("menu-reset").addEventListener("click", () => { menuSheet.classList.remove("open"); resetGame(); });
  
  /* updateUnitInfoPanel: layer moved to js/chains/updateUnitInfoPanel.js */
  // ---- CP 패널: 아이콘 그리드 + 옆 정보창 ----
  window.cpSel = null;
  const CP_MS = [{ id: 'ms2', cp: 2, ico: '🏗', n: '야전 축성술', d: '건설 비용 −15%' }, { id: 'ms3', cp: 3, ico: '🛡', n: '탄력 방어', d: '유닛당 반격 2회' }, { id: 'ms5', cp: 5, ico: '🚜', n: '중전차 해금', d: '중전차 징집 가능' }];
  const DOC_ICO = { inf: '🪖', mech: '🚜', air: '✈️' };
  const BG_ICO = { scout: '🛩', off: '🎯', drop: '🪂', supply: '📦', line: '✈️', shell: '💥', charge: '🚩', barrage: '🎆', fix: '🔧', adv: '⏩', assault: '🛞' };
  const BG_DESC = { s0: '지정 칸 일대의 시야를 2턴간 공개합니다.', off: '지정 칸 반경 1에 포탄 3발(착탄 대기).', a1: '시야 내 빈 칸에 패스파인더 낙하. 낙하 직후 이동·공격 불가.', a2: 'MUN +80 또는 연료 +40 중 선택.', a3: '시야 내 빈 칸에 대전차포 낙하(가까운 적을 향함).', a4: '시작 칸과 방향을 찍어 직선 5칸을 폭격.', i1: '시야 내 지정 칸에 박격포탄 1회.', i2: '사령부 인접 빈 칸에 보병 분대를 징집(골드 지불).', i3: '지정 칸 2칸 이내 아군 보병: 제압 해제 · 이동 +1.', i4: '지정 칸 반경 2에 포탄 5발(착탄 대기).', m1: '아군 차량의 궤도/주포 파손 1개를 수리.', m2: '사령부 인접 빈 칸에 경차량 증원(골드/연료 지불).', m3: '아군 기갑 이동 +3 (연료 소모 없음).', m4: '지정 칸 2칸 이내 아군 전차 이동 +2.' };
  const bgIcon = d => d.t === 'spawn' ? (d.key === 'infantry' ? '🪖' : '🚙') : (BG_ICO[d.t] || '🎖');
  window.cpPick = (kind, id) => { window.cpSel = kind ? { kind, id } : null; renderCP(); };
  window.cpUse = (kind, id) => {
    if (kind === 'doc') { chooseDoc(id); window.cpSel = null; renderCP(); return; }
    window.cpSel = null; useBG(id); if (actionMode === 'sk') supOpen(false); else renderCP();
  };
  function renderCP() {
    const tm = currentTurn, c = cpOf(tm), el = document.getElementById('pane-research'), sel = window.cpSel; let h = '', info = '';
    const T = (kind, id, ico, top, bot, cls) => `<button type="button" class="cp-t2 ${cls || ''}${sel && sel.kind === kind && sel.id === id ? ' sel' : ''}" onclick="cpPick('${kind}','${id}')"><i>${ico}</i>${top ? `<b class="a">${top}</b>` : ''}${bot ? `<b class="b">${bot}</b>` : ''}</button>`;
    h += `<div class="cp-h"><b>CP ${c}/8</b><span>XP ${teamXp[tm]}<small>(+${25 - teamXp[tm] % 25})</small></span><span>💣${mun[tm]}</span></div>`;
    h += '<div class="cp-lb">CP 루트</div><div class="cp-grid">' + msAll(tm).map(m => T('ms', m.id, m.cp <= c ? m.ico : '🔒', 'CP' + m.cp, m.cp <= c ? '✔' : '', m.cp <= c ? 'on' : 'off')).join('') + '</div>';
    h += '<div class="cp-lb">교리</div><div class="cp-grid">' + Object.keys(DOC).map(k => T('doc', k, DOC_ICO[k], '', doctrine[tm] === k ? '✔' : '', doctrine[tm] && doctrine[tm] !== k ? 'off' : (doctrine[tm] === k ? 'on' : ''))).join('') + '</div>';
    h += '<div class="cp-lb">배틀그룹 <small>턴당 1개</small></div><div class="cp-grid">' + bgList(tm).map(d => { const w = bgReady(tm, d); return T('bg', d.id, bgIcon(d), d.cp ? 'CP' + d.cp : '', '💣' + munCost(tm, d), w ? 'off' : 'on'); }).join('') + '</div>';
    el.innerHTML = h;
    if (sel) {
      const ms = sel.kind === 'ms' && msAll(tm).find(m => m.id === sel.id), dc = sel.kind === 'doc' && DOC[sel.id], bg = sel.kind === 'bg' && bgList(tm).find(d => d.id === sel.id);
      if (ms) info = `<b>${ms.ico} ${ms.n}</b><p>${ms.d}</p><p class="rq">CP ${ms.cp} 달성 시 자동 적용 · ${ms.cp <= c ? '<em class="ok">적용 중</em>' : `<em class="no">CP ${ms.cp - c} 부족</em>`}</p>`;
      else if (dc) info = `<b>${DOC_ICO[sel.id]} ${dc.n[tm]}</b><p>${dc.d}</p><p class="rq">💰300 ⛽40 · 공병이 교리 지원소를 건설하면 확정 · 변경 불가</p>` + (doctrine[tm] ? `<p class="rq">${doctrine[tm] === sel.id ? '<em class="ok">선택됨</em>' : '이미 다른 교리를 선택함'}</p>` : `<button type="button" class="tip-ok" onclick="cpUse('doc','${sel.id}')">건설 안내</button>`);
      else if (bg) { const w = bgReady(tm, bg); info = `<b>${bgIcon(bg)} ${bg.n[tm]}</b><p>${BG_DESC[bg.id] || ''}</p><p class="rq">${bg.cp ? 'CP ' + bg.cp + ' · ' : ''}💣${munCost(tm, bg)} · 쿨 ${bg.cd}턴</p>` + (w ? `<p class="rq"><em class="no">${w}</em></p>` : `<button type="button" class="tip-ok" onclick="cpUse('bg','${bg.id}')">사용</button>`); }
    }
    const ci = document.getElementById('cp-info'); ci.innerHTML = info ? `<button type="button" class="x" onclick="cpPick(null)">✕</button>${info}` : ''; ci.classList.toggle('open', !!info && supPanel.classList.contains('open'));
  }
  // --- 패널 확장: 패키지/스킬 버튼 ---
  
  /* updateUnitInfoPanel: layer moved to js/chains/updateUnitInfoPanel.js */

  // ---------- UI: 제원·명령 패널 (주무장 · 탄종 · 고유 스킬) ----------
  
  /* updateUnitInfoPanel: layer moved to js/chains/updateUnitInfoPanel.js */

  // ---------- v25: 하단 HUD — 정사각형 능력 트레이 + 유닛 능력치 카드 ----------
  const unitCard = document.getElementById('unit-card');
  const syncCard = () => unitCard.classList.toggle('show', unitStrip.classList.contains('show') && !buildSel);
  const iconOf = s => { const m = (s || '').match(/^\s*(\p{Extended_Pictographic}\uFE0F?|[^\s\p{L}\p{N}(\[])/u); return m ? m[1] : null; };
  const ICO_BY_FN = [[/Dismount/, '⬇'], [/give_supply|refillSupply/, '📦'], [/bergepanzer|repair/, '🔧'], [/salvage/, '♻'], [/reinforce/, '➕']];
  const DS_FB = [[/bergepanzer/, '손상된 아군 기갑을 긴급 수리 (자재 1 · 최대 +90 HP)'], [/refillSupplyTruck/, '사령부에서 보급을 가득 채움'], [/'repair'/, '인접 차량·건물 수리'], [/'salvage'/, '인접 아군 구조물 해체 · 자재 회수'], [/'trench'/, '인접 칸에 참호 설치'], [/'sandbag'/, '인접 칸에 샌드백(노란 엄폐) 설치'], [/'mine'/, '인접 칸에 지뢰 매설'], [/'mg_bunker'/, 'MG 벙커 건설'], [/'medic_bunker'/, '메딕 벙커 건설 · 야전 보충'], [/'barracks'/, '병영 건설 · 보병 징집'], [/'support_cent/, '중화기 지원소 건설 · 중화기 징집'], [/'motor_pool'/, '차량 정비소 건설 · 차량 징집'], [/'tank_depot'/, '전차 공창 건설 · 전차 징집']];
  function tileOf__base(b) {
    const oc = b.getAttribute('onclick') || '';
    if (b.classList.contains('et')) {
      const g = /startTargetedBuild/.test(oc) ? 'bld' : 'tgl'; b.classList.add('tile', g);
      const sp = b.querySelector('span'), sm = b.querySelector('small'), ic0 = b.querySelector('i');
      b.dataset.two = '1'; b.dataset.nm = ((sp || {}).textContent || b.getAttribute('aria-label') || '').trim(); b.dataset.ds = b.title || (DS_FB.find(([re]) => re.test(oc)) || [0, ''])[1]; b.dataset.cost = ((sm || {}).textContent || '').trim(); b.dataset.ic = (ic0 || {}).textContent || '';
      return [g, b];
    }
    const first = b.innerHTML.split(/<br\s*\/?>/i)[0].replace(/<small[\s\S]*?<\/small>/gi, '').replace(/<[^>]+>/g, '');
    const txt = b.textContent.replace(/\s+/g, ' ').trim();
    const mun = (txt.match(/💣\s*(\d+)/) || [])[1], cd = (txt.match(/쿨\s*(\d+)/) || [])[1];
    let ic = iconOf(first) || iconOf(txt); if (!ic) { const f = ICO_BY_FN.find(([re]) => re.test(oc)); ic = f ? f[1] : '▣'; }
    const label = first.replace(ic, '').replace(/\(?\s*💣\s*\d+[^)]*\)?/g, '').replace(/\s+/g, ' ').trim() || txt;
    const g = /buyPkg\(|buyVpkg\(/.test(oc) ? 'wpn' : /cycleShell\(|toggleMode\(|useTgl\(|v188Turn\(|v189Confirm\(|v196Rev\(/.test(oc) ? 'tgl' : mun ? 'mun' : 'act';
    const sub = /cycleShell|useTgl|v188Turn|v189Confirm|v196Rev/.test(oc) ? ((b.querySelector('small') || {}).textContent || '').split(' · ')[0] : (cd ? '쿨' + cd : '');
    const t = document.createElement('button'); t.type = 'button';
    ['onclick', 'style'].forEach(a => b.hasAttribute(a) && t.setAttribute(a, b.getAttribute(a)));
    t.className = 'tile ' + g + (b.classList.contains('busy') ? ' busy' : ''); t.title = b.title || txt;
    t.innerHTML = `<i>${ic}</i><span>${label}</span>${mun ? `<b class="tc">💣${mun}</b>` : (/무료/.test(txt) ? '<b class="tc free">무료</b>' : '')}${sub ? `<small>${sub}</small>` : ''}`;
    const sm0 = ((b.querySelector('small') || {}).textContent || '').trim(), dim = /opacity/.test(b.getAttribute('style') || '');
    t.dataset.nm = label; t.dataset.ic = ic; t.dataset.mun = mun || ''; t.dataset.cd = cd || '';
    t.dataset.ds = b.title && b.title !== txt ? b.title : (dim ? '' : sm0); t.dataset.why = dim ? sm0 : '';
    if (!t.dataset.ds) t.dataset.ds = (DS_FB.find(([re]) => re.test(oc)) || [0, ''])[1];
    if (g !== 'tgl' && g !== 'wpn') t.dataset.two = '1';
    return [g, t];
  }
  const PKG_ICO = { flame_kit: '🔥', schreck: '🚀', bazooka: '🚀', panzerfaust: '🚀' };
  const pkgIco = id => PKG_ICO[id] || '🔫';
  const pkgPicker = document.getElementById('pkg-picker');
  function togglePkgPicker() { pkgPicker.classList.toggle('open'); const sl = specialActionsEl.querySelector('.slot.empty'); if (sl) sl.classList.toggle('on', pkgPicker.classList.contains('open')); }
  window.togglePkgPicker = togglePkgPicker;
  const PKG_DESC_OLD = { bar: '공격력 +6 · 연사 +2', lmg: '사거리 +2 · 연사 +3 · 제압 보너스', flame_kit: '공격력 +22 · 엄폐 무시', schreck: '부무장 대전차 로켓 1문 (소총 사격 유지)', thompson: '공격력 +5 · 연사 +1 · 명중감쇄 +3%', bazooka: '부무장 바주카 1문 (소총 사격 유지)', stg44: '공격력 +3 · 연사 +2 · 명중감쇄 −2%', fg42: '공격력 +4 · 연사 +1 · 사거리 +1', panzerfaust: '일회용 대전차 ×2' };
  // v162: kit descriptions come from the CoH3 data
  const PKG_DESC = Object.assign({}, PKG_DESC_OLD, { bar: kitDesc('bar'), lmg: kitDesc('lmg'), flame_kit: kitDesc('flame_blue'), schreck: kitDesc('rocket_red') + ' (연합: ' + kitDesc('rocket_blue') + ')', thompson: kitDesc('thompson'), bazooka: kitDesc('rocket_blue'), stg44: kitDesc('stg44'), fg42: kitDesc('fg42') });
  const tip = document.getElementById('tile-tip');
  function hideTip() { tip.classList.remove('open'); tip.style.left = ''; }
  function showTip(html) { tip.style.left = ''; tip.innerHTML = html; tip.classList.toggle('hi', pkgPicker.classList.contains('open')); tip.classList.add('open'); }
  window.showPkgTip = (uid, id) => { const P = PKG[id], u = uById(uid); showTip(`<b>${P.n}</b><br><small>${PKG_DESC[id] || ''}${P.sk ? ' · 스킬 ' + P.sk.n + ' (💣' + P.sk.mun + ')' : ''}</small><br><button type="button" class="tip-ok" onclick="hideTipNow();buyPkg('${uid}','${id}')">장착 💣${P.mun}</button>`); };
  window.hideTipNow = hideTip;
  // 1탭 = 간략 정보, 같은 타일 2탭 = 실행. 바깥 화면 탭 = 취소.
  let armedEl = null;
  function clearArm() { if (armedEl) armedEl.classList.remove('armed'); armedEl = null; if (window.ARM_PV) { window.ARM_PV = null; render(); } }
  function clearAll() {
    clearArm(); hideTip(); pkgPicker.classList.remove('open');
    const sl = specialActionsEl.querySelector('.slot.empty'); if (sl) sl.classList.remove('on');
    const bp = document.getElementById('buy-preview'); if (bp) bp.style.display = 'none';
    document.querySelectorAll('#build-buttons .rec.sel').forEach(x => x.classList.remove('sel'));
    if (window.cpSel) { window.cpSel = null; renderCP(); }
  }
  window.clearAllSel = clearAll;
  specialActionsEl.addEventListener('click', e => {
    const t = e.target.closest('.tile'); if (!t) return;
    if (t.classList.contains('slot')) { hideTip(); clearArm(); return; }
    if (!t.dataset.two) { hideTip(); clearArm(); return; }
    if (armedEl === t) { clearArm(); hideTip(); return; }
    const oc = t.getAttribute('onclick') || '', mu = oc.match(/useUsk\('[^']*','([^']+)'\)/), tg = !!((mu && USK[mu[1]] && USK[mu[1]].t === 'tgt') || /useSkill\('[^']*','(gren|smoke)'\)/.test(oc) || /startTargeted(Build|Dismount|Supply)|toggleMode\(/.test(oc));
    if (!tg) { e.stopPropagation(); e.preventDefault(); } clearArm(); pkgPicker.classList.remove('open');
    if (!tg) {
      armedEl = t; t.classList.add('armed');
      const mm = oc.match(/use(Usk|Skill)\('([^']*)','([^']+)'\)/), uu = mm && uById(mm[2]);
      if (uu && (mm[1] === 'Skill' || (USK[mm[3]] && USK[mm[3]].t === 'self'))) { window.ARM_PV = { u: uu, targets: armTargets(uu, mm[3]) }; render(); }
      else if (selectedUnit && /bergepanzerRepair|refillSupplyTruck/.test(oc)) {
        const su = selectedUnit, hq = buildings.find(b => b.team === su.team && b.type === 'hq');
        const tg2 = /bergepanzerRepair/.test(oc) ? units.filter(x => x.team === su.team && x.hp > 0 && !x.isLoaded && x.armorType === 'hard' && x !== su && getDistance(su.c, su.r, x.c, x.r) === 1 && (x.hp < x.maxHp || x.trackDamaged || x.gunDisabled)).map(x => ({ c: x.c, r: x.r })) : (hq ? [{ c: hq.c, r: hq.r }] : []);
        window.ARM_PV = { u: su, targets: tg2 }; render();
      }
    }
    let rg = ''; const mr = oc.match(/useUsk\('([^']*)','([^']+)'\)/), ms = oc.match(/useSkill\('([^']*)','(gren|smoke)'\)/);
    if (mr && USK[mr[2]] && USK[mr[2]].t === 'tgt') { const uu = uById(mr[1]), d = USK[mr[2]]; if (uu) rg = '사거리 ' + ((d.useMin && uu.minRange > 1) ? uu.minRange + '~' : '') + rngOf(uu, d); }
    if (ms) { const uu = uById(ms[1]); if (uu) rg = '사거리 ' + ({ gren: 2, smoke: 3 }[ms[2]] + (doctrine[uu.team] === 'inf' ? 1 : 0)); }
    const tr = t.getBoundingClientRect();
    const cost = t.dataset.mun ? `💣${t.dataset.mun}` : (t.dataset.cost || ''), cd = t.dataset.cd ? ` · 쿨 ${t.dataset.cd}턴` : '';
    showTip(`<b>${t.dataset.ic || ''} ${t.dataset.nm || t.title}</b>${cost || cd ? `<span class="tp-c">${cost}${cd}</span>` : ''}${(rg || t.dataset.ds) ? `<div class="tp-d">${rg ? '<b>' + rg + '</b>' + (t.dataset.ds ? ' · ' : '') : ''}${t.dataset.ds}</div>` : ''}${t.dataset.why ? `<div class="tp-w">${t.dataset.why}</div>` : ''}`);
    if (tg && tip.offsetParent) { const pr = tip.offsetParent.getBoundingClientRect(), w = tip.offsetWidth; tip.style.left = Math.max(w / 2 + 4, Math.min(pr.width - w / 2 - 4, tr.left + tr.width / 2 - pr.left)) + 'px'; }
  }, true);
  document.addEventListener('pointerdown', e => {
    if (e.target.closest('.tile, #tile-tip, #buy-preview, #pkg-picker, #cp-info, #sup-panel, #sup-tab, #pane-research') || skOn()) return;
    if (armedEl || tip.classList.contains('open') || pkgPicker.classList.contains('open') || window.cpSel || document.getElementById('buy-preview').style.display === 'block') clearAll();
  }, true);
  // 보조무기 슬롯: 주무기 칸 없음. 비어 있으면 + 로 표시하고 탭해서 패키지를 고른다.
  function slotTiles(u, choices) {
    if (u.pkg && PKG[u.pkg]) return `<div class="tile wpn slot" title="장착 패키지: ${PKG[u.pkg].n}"><i>${pkgIco(u.pkg)}</i><span>${PKG[u.pkg].n}</span>${u.pkg === 'panzerfaust' ? `<small>×${u.pfCharges}</small>` : ''}</div>`;
    if (u.team === currentTurn && choices.length) return `<button type="button" class="tile wpn slot empty" onclick="togglePkgPicker()" title="보조무기 선택"><i>＋</i><span>보조무기</span></button>`;
    return '';
  }
  function rebuildHud__base(u) {
    const btns = [], notes = [];
    [...specialActionsEl.children].forEach(n => {
      if (n.tagName === 'BUTTON') { btns.push(n); return; }
      n.querySelectorAll('button').forEach(b => btns.push(b));
      const c = n.cloneNode(true); c.querySelectorAll('button,.btn-grid,.et-row').forEach(x => x.remove());
      const t = c.textContent.replace(/\s+/g, ' ').trim(); if (t && !/고유 스킬|구난 정비|분대원/.test(t)) notes.push(t);
    });
    const isUnit = !!(u && u.key && !u.isLoaded && !(u.type && BLD[u.type]));
    const choices = [];
    for (let k = btns.length - 1; k >= 0; k--) {
      const m = (btns[k].getAttribute('onclick') || '').match(/buyPkg\('([^']+)','([^']+)'\)/);
      if (m) { choices.unshift({ uid: m[1], id: m[2] }); btns.splice(k, 1); }
    }
    pkgPicker.classList.remove('open'); pkgPicker.innerHTML = ''; clearArm(); if (!skOn()) hideTip();
    const G = { wpn: [], act: [], tgl: [], mun: [], bld: [] };
    if (isUnit) { const tpl = document.createElement('template'); tpl.innerHTML = slotTiles(u, choices); G.wpn.push(...tpl.content.children); }
    if (isUnit && !u.pkg && choices.length && u.team === currentTurn) {
      pkgPicker.innerHTML = choices.map(c => { const P = PKG[c.id], lack = mun[u.team] < P.mun; return `<button type="button" class="tile wpn${lack ? ' lack' : ''}" onclick="showPkgTip('${c.uid}','${c.id}')" title="${P.n}"><i>${pkgIco(c.id)}</i><b class="tc">💣${P.mun}</b></button>`; }).join('');
    }
    btns.forEach(b => { const [g, el] = tileOf(b); G[g].push(el); });
    specialActionsEl.textContent = '';
    let first = true;
    Object.keys(G).forEach(k => {
      if (!G[k].length) return;
      if (!first) { const s = document.createElement('b'); s.className = 'tile-sep'; specialActionsEl.appendChild(s); }
      first = false; G[k].forEach(el => specialActionsEl.appendChild(el));
    });
    if (!isUnit) { unitInfoEl.style.display = 'none'; return; }
    const ter = getTerrain(u.c, u.r), r1 = x => Math.round(x * 10) / 10, ch = (k, v, t) => `<span title="${t}">${k} <b>${v}</b></span>`;
    if (v159Crew(u)) notes.push(v159StateTxt(u).replace(/<[^>]+>/g, ''));   // v159
    if (u.sub) notes.push(`🔸 부무장 ${u.sub.n} (${rofTxt(u.sub)}, 사거리 ${u.sub.range})`);
    unitInfoEl.innerHTML = '<div class="ui-grid">' + ch('분류', (MACRO_CAT[u.macro] || '') + '/' + (ROLE_CODE[u.role] || ''), '대범주 / 역할') + ch('⚔', atkTxt(u) + ' · ' + areaTxt(u), '공격력 · 타격 범위') + ch('관통', penTxt(u), '관통력 근/중/원') + ch('발사', rofTxt(u), '턴당 발사 수 근/중/원') + ch('명중', accTxt(u), '근/중/원거리 명중') + ch('사거리', (u.minRange > 0 ? u.minRange + '~' : '') + u.range, '사거리') + ch('반격', u.counterAttacksLeft + '/' + counterMax(u.team), '반격 횟수') + ch('고도', 'Lv.' + ter.elevation, '현재 칸 고도') + (u.deflectDmgPct > 0 ? ch('도탄', Math.round(u.deflectDmgPct * 100) + '%', '도탄 보장') : '') + '</div>' + notes.map(t => `<div class="ui-note">${t}</div>`).join('');
    unitInfoEl.style.display = '';
  }
  
  /* updateUnitInfoPanel: layer moved to js/chains/updateUnitInfoPanel.js */
  
  /* showTileInfo: layer moved to js/chains/showTileInfo.js */

  // ---------- UI: 징집 미리보기에 무장·스킬 안내 ----------
  
  /* previewUnit: layer moved to js/chains/previewUnit.js */

