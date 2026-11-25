  // [chain:updateUnitInfoPanel] 9 layers over updateUnitInfoPanel__base ([16]).
  //   Call order, outermost first: updateUnitInfoPanel → updateUnitInfoPanel__v158 → updateUnitInfoPanel__v140 → updateUnitInfoPanel__v47 → updateUnitInfoPanel__s16_5 → updateUnitInfoPanel__s16_4 → updateUnitInfoPanel__s16_3 → updateUnitInfoPanel__s16_2 → updateUnitInfoPanel__s16 → updateUnitInfoPanel__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // updateUnitInfoPanel: from [v189], calls updateUnitInfoPanel__v158
  function updateUnitInfoPanel(u) {
      const r = updateUnitInfoPanel__v158.apply(this, arguments);
      if (v189Stage(u) && u.team === currentTurn) { [...specialActionsEl.children].forEach(n => { if (!/v189Confirm/.test(n.getAttribute('onclick') || '')) n.remove(); }); pkgPicker.classList.remove('open'); }
      return r;
    }

  // updateUnitInfoPanel__v158: from [17+5], calls updateUnitInfoPanel__v140
  function updateUnitInfoPanel__v158(u, ter) {
      const r = updateUnitInfoPanel__v140.apply(this, arguments);
      try {
        if (u && u.key && !(u.type && BLD[u.type]) && unitInfoEl.style.display !== 'none') {
          if (u.engaged && !u.retreating) unitInfoEl.insertAdjacentHTML('beforeend', '<div class="ui-note">⊕ <b>교전 중</b> · 자동 회복·충원 불가 · 공격 없이 내 턴을 마치면 해제</div>');
          if (u.repairing) unitInfoEl.insertAdjacentHTML('beforeend', '<div class="ui-note">🔧 <b>수리 중</b> · 받는 명중률 ×2 · 받는 피해 ×2 · 다음 내 턴 시작에 해제</div>');
          if (v158Locked(u)) unitInfoEl.insertAdjacentHTML('beforeend', '<div class="ui-note">🔧 수리 작업 중 · 이번 턴 공격·능력 사용 불가</div>');
        }
      } catch (e) { console.warn('v158 panel', e); }
      return r;
    }

  // updateUnitInfoPanel__v140: from [17*], calls updateUnitInfoPanel__v47
  function updateUnitInfoPanel__v140(u, ter) {
      const r = updateUnitInfoPanel__v47.apply(this, arguments);
      try {
        if (u && u.type && BLD[u.type] && unitInfoEl.style.display !== 'none') {
          if (u.uc) unitInfoEl.insertAdjacentHTML('beforeend', `<div class="ui-note">🏗 <b>건설 중</b> · ${u.uc.left}턴 남음 · 인접한 공병이 있어야 진행 · 생산 불가</div>`);
          else if (u.team === currentTurn && (u.type === 'hq' || u.type === 'outpost') && u.hp > 0) {
            const on = v140Rally(u.team) === u;
            unitInfoEl.insertAdjacentHTML('beforeend', `<div class="ui-note">${on ? '🚩 <b>현재 집결지</b> · 퇴각 유닛이 이곳으로 모입니다' : `<button class="btn-action" style="display:inline-block" onclick="v140SetRally('${u.id}')">🚩 집결지 지정</button> 퇴각 유닛의 목적지`}</div>`);
          }
        }
        if (u && u.key && u.team === currentTurn && v140IsEng(u) && u.key !== 'engineer' && typeof specialActionsEl !== 'undefined' && !u.isLoaded) {
          const on = actionMode === 'repair' && activeActor === u;
          specialActionsEl.insertAdjacentHTML('beforeend', `<div class="action-subpanel"><button class="btn-action" style="display:inline-block" onclick="toggleMode(selectedUnit,'repair')">${on ? '🔧 수리 모드 ON (탭=종료)' : '🔧 수리'}</button> <span>잔여 ${u.repairsLeft || 0}회</span></div>`);
        }
        if (u && u.key && u.retreating) unitInfoEl.insertAdjacentHTML('beforeend', `<div class="ui-note">🏳 <b>퇴각 중</b> · 집결지 ${V140.retNear}칸 안에 들 때까지 매 턴 자동 이동</div>`);
      } catch (e) { console.warn('v140 panel', e); }
      return r;
    }

  // updateUnitInfoPanel__v47: from [17b], calls updateUnitInfoPanel__s16_5
  function updateUnitInfoPanel__v47(u, ter) {
    updateUnitInfoPanel__s16_5(u, ter);
    if (!u || !u.key || u.isLoaded || (u.type && BLD[u.type]) || unitInfoEl.style.display === 'none') return;
    const rows = pasRows(u); if (!rows.length) return;
    unitInfoEl.insertAdjacentHTML('beforeend', rows.map(({ P, on }) => `<div class="ui-note" data-pas="${P.n}">${P.ico} <b>패시브 ${P.n}</b> · ${P.d} <em style="color:${on ? '#4ade80' : '#94a3b8'};font-style:normal">${on ? '적용 중' : '대기'}</em></div>`).join(''));
  }

  // updateUnitInfoPanel__s16_5: from [16], calls updateUnitInfoPanel__s16_4
  function updateUnitInfoPanel__s16_5(u, ter) { updateUnitInfoPanel__s16_4(u, ter); rebuildHud(u); syncCard(); }

  // updateUnitInfoPanel__s16_4: from [16], calls updateUnitInfoPanel__s16_3
  function updateUnitInfoPanel__s16_4(u, ter) {
    updateUnitInfoPanel__s16_3(u, ter);
    if (!u || !u.key || u.isLoaded || (u.type && BLD[u.type])) return;
    const w = wpnOf(u);
    let info = `<div style="margin-top:4px;font-size:.82em;color:#cbd5e1">🔫 주무장 <b>${w ? w.n : u.uniqueName}</b>`;
    if (w && !(u.isMortar || u.isArtillery || u.isNebel)) info += ` · 근접 ×${w.b[0]} / 중거리 ×${w.b[1]} / 원거리 ×${w.b[2]}`;
    if (v159Crew(u)) info += ` · ${v159StateTxt(u)}`;   // v159
    if (u.pkg) info += ` · 장착 ${PKG[u.pkg].n}${u.pkg === 'panzerfaust' ? ' ×' + u.pfCharges : ''}`;
    info += '</div>';
    unitInfoEl.insertAdjacentHTML('beforeend', info);
    if (u.team !== currentTurn) return;
    let h = '';
    if (SHELL_KEYS.includes(u.key)) {
      const s = u.shell || 'std';
      h += `<button class="btn-action" onclick="cycleShell('${u.id}')"><span>🔁 탄종 전환<br><small>${SHELLS[s].n} · ${SHELL_HINT[s]}</small></span></button>`;
    }
    h += tglBtns(u);   // v46: 토글 스킬
    const ids = uskList(u);
    if (ids.length) {
      h += `<div class="action-subpanel"><strong>✨ 고유 스킬</strong><div class="btn-grid">` + ids.map(id => {
        const d = USK[id], why = uskBlock(u, d, id), on = actionMode === 'usk' && USKC.cur && USKC.cur.id === id;
        const label = nm3(d, u.team) + (id === 'pfaust' ? ` ×${u.pfCharges}` : '');
        return `<button class="btn-action${on ? ' busy' : ''}" ${why ? 'style="opacity:.55"' : ''} onclick="useUsk('${u.id}','${id}')" title="${d.d}"><span>${d.ico} <strong>${label}</strong><br><small>${why || d.d}</small></span>${munFor(u, d) > 0 ? `<span style="color:#fbbf24">💣${munFor(u, d)}</span>` : '<span style="color:#4ade80">무료</span>'}</button>`;
      }).join('') + '</div></div>';
    }
    if (h) specialActionsEl.insertAdjacentHTML('beforeend', h);
  }

  // updateUnitInfoPanel__s16_3: from [16], calls updateUnitInfoPanel__s16_2
  function updateUnitInfoPanel__s16_3(u, ter) {
    updateUnitInfoPanel__s16_2(u, ter);
    if (!u || u.team !== currentTurn || u.armorType !== 'soft' || !u.N) return;
    let h = '';
    if (!u.pkg) Object.keys(PKG).filter(k => PKG[k].keys[u.team].includes(u.key)).forEach(k => { h += `<button class="btn-action" onclick="buyPkg('${u.id}','${k}')">🔫 ${PKG[k].n} (💣${PKG[k].mun})</button>`; });
    else { const P = PKG[u.pkg]; h += `<div style="font-size:.8em;color:#fbbf24">장착: ${P.n}</div>`; if (P.sk) h += `<button class="btn-action" title="${(PKG_DESC[u.pkg] || P.sk.n).replace(/"/g, '')}" onclick="useSkill('${u.id}','${P.sk.id}')">✨ ${P.sk.n} (💣${P.sk.mun}${cdOf(u, P.sk.id) > turnNo ? ' · 쿨' + Math.ceil((cdOf(u, P.sk.id) - turnNo) / 2) : ''})</button>`; }
    if (UNIT_ROSTER[u.team][u.key].cat === 'infantry' && !u.isSniper) {
      h += `<button class="btn-action" title="적 분대 86 피해 · 제압 +40 · 재사용 3턴" onclick="useSkill('${u.id}','gren')">💣 파편 수류탄 (💣40)</button><button class="btn-action" title="지정 칸 반경 1 연막" onclick="useSkill('${u.id}','smoke')">🌫 연막 (💣30)</button>`;
    }
    specialActionsEl.insertAdjacentHTML('beforeend', h);
  }

  // updateUnitInfoPanel__s16_2: from [16], calls updateUnitInfoPanel__s16
  function updateUnitInfoPanel__s16_2(u, ter) {
    updateUnitInfoPanel__s16(u, ter);
    if (!u || !u.N) return;
    const hint = `<div style="margin-top:4px;font-size:.8em;color:#cbd5e1">분대원 ${u.models}/${u.N}명 · HP ${hpCurD(u)}/${hpMaxD(u)} (상한 ${hpD(hpCap(u))})</div>`;
    const btn = canReinforce(u) ? `<button class="btn-action" onclick="reinforce('${u.id}')">➕ 충원 (+1명 · ${reinfCost(u)}G)</button>`
      : (u.models < u.N && u.team === currentTurn ? `<div style="font-size:.75em;color:#94a3b8">충원: 본부 3칸 안 · 전초기지나 의무·보급·수송 차량 인접 (1명 ${reinfCost(u)}G)</div>` : '');
    specialActionsEl.insertAdjacentHTML('beforeend', hint + btn);
  }

  // updateUnitInfoPanel__s16: from [16], calls updateUnitInfoPanel__base
  function updateUnitInfoPanel__s16(u, t) {
    updateUnitInfoPanel__base(u, t); renderUnitStrip(u); syncBuildTray(u);
  }


