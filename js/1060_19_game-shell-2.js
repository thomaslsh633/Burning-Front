  shEl('aar-again').addEventListener('click', () => { aarEl.classList.remove('open'); shApplyCfg(); resetGame(); shFlash(); });
  // after a win the Victory Meter plate re-opens the report instead of the legacy "New game" sheet
  goldBoxEl.addEventListener('click', e => { if (vm.winner && SHELL.inGame && e.target.closest && e.target.closest('.vmx')) { e.stopImmediatePropagation(); shAarOpen(); } }, true);

  // ---------- field manual / info modal ----------
  const shModal = shEl('shell-modal');
  function shModalOpen(title, tabs, render0) {
    shEl('sm-title').textContent = title; const tb = shEl('sm-tabs');
    tb.style.display = tabs ? 'flex' : 'none'; tb.innerHTML = tabs ? tabs.map((t, i) => `<button data-i="${i}">${t[0]}</button>`).join('') : '';
    const show = i => { tb.querySelectorAll('button').forEach((b, j) => b.classList.toggle('on', j === i)); const body = shEl('sm-body'); body.innerHTML = tabs ? tabs[i][1]() : render0(); body.scrollTop = 0; };
    tb.onclick = e => { const b = e.target.closest('button'); if (b) show(+b.dataset.i); };
    show(0); shModal.classList.add('open');
  }
  shEl('sm-close').addEventListener('click', () => shModal.classList.remove('open'));
  shModal.addEventListener('click', e => { if (e.target === shModal) shModal.classList.remove('open'); });
  function shManualOpen() {
    const cv = { none: '—', yellow: '<span class="cv-y">엄폐 ×' + COVER_SOFT_YELLOW + '</span>', hard: '<span class="cv-h">강엄폐 ×' + COVER_SOFT_HARD + '</span>' };
    const mv = v => v === Infinity ? '불가' : v;
    shModalOpen('FIELD MANUAL · 야전 교범', [
      ['승리 · 구역', () => `${shMode() === 'annihilation' ? `<h4>현재 대전: 섬멸전</h4><p>상대의 <b>모든 부대</b>(차량에 탄 병력 포함)를 없애고, 상대가 <b>새 부대를 투입할 수 없게</b> 되면 승리합니다. 투입 불가 = 작동하는 생산 건물이 없거나, 생산 가능한 가장 싼 부대의 비용이 부족한 상태입니다.</p>
        <ul><li>승리 미터와 티켓은 쓰지 않습니다. 승리 거점은 점수가 없고, 자원 거점은 수입을 계속 냅니다.</li><li>양측이 동시에 전멸하면 그 순간 행동하지 않은 쪽이 승리합니다.</li><li>${SHELL.cfg.roundCap ? `라운드 제한 ${SHELL.cfg.roundCap}: 끝나면 생존 부대 가치가 높은 쪽이 승리, 같으면 무승부입니다.` : '라운드 제한이 없습니다.'}</li></ul><h4>점령전 규칙 (참고)</h4>` : '<h4>현재 대전: 점령전</h4>'}<p>점령전의 승리 조건은 <b>승리 미터</b>입니다. 양 진영은 티켓 ${VM_START}장으로 시작하며, 상대 티켓을 0으로 만들면 승리합니다. 턴 제한은 없고 사령부(HQ)는 파괴되지 않습니다.</p>
        <ul><li>승리 거점(★)을 적보다 많이 보유하면 매 턴 적 티켓이 줄어듭니다 — 우세 1 / 2 / 3곳 = −${VM_BLEED[1]} / −${VM_BLEED[2]} / −${VM_BLEED[3]}, ${VM_MOM_N}턴 연속 우세마다 +1.</li><li>승리 거점이 동수일 때는 자원 거점 보유 격차가 ${VM_TIE_GAP} 이상이면 뒤진 쪽이 −1.</li><li>HQ가 마비되면 티켓 −${HQ_PENALTY}(1회), 생산·충원이 멈추고 체력 25%에서 복구됩니다.</li></ul>
        <h4>구역 · 보급선</h4><ul><li>거점을 점령하면 그 구역 전체가 넘어옵니다. 자원 수입은 구역이 <b>아군 구역으로 HQ 구역까지 이어져 있을 때만</b> 들어옵니다(승리 거점은 항상 집계).</li><li>보급선이 끊긴 구역은 지도에 표시만 남고 수입이 0이 됩니다 — 적 후방의 연결 구역을 끊는 것이 유효한 전술입니다.</li><li>점령: 무장한(고착되지 않은) 보병과 지프 · 위즐 · 케텐크라트. 그 밖의 무장 차량과 고착된 분대는 <b>경합</b>만 시킵니다.</li><li>중립 거점은 다음 내 턴 시작에 넘어오고, 적 거점은 먼저 중립화된 뒤 한 턴 뒤에 점령됩니다.</li></ul>`],
      ['엄폐 · 지형', () => `<h4>엄폐</h4><p>보병이 받는 피해에 곱해지는 배율입니다. 화염 무기는 강엄폐 안의 적에게 오히려 ×${COVER_FLAME_HARD}.</p>
        <table><tr><th>지형</th><th>보병 이동</th><th>차량 이동</th><th>엄폐</th><th>시야</th></tr>${Object.values(TERRAIN_DEFS).map(t => `<tr><td><i style="background:${t.fill}"></i>${t.name}</td><td>${mv(t.inf)}</td><td>${mv(t.veh)}</td><td>${cv[t.cover] || '—'}</td><td>${t.sightBlock ? '차단' : ''}</td></tr>`).join('')}</table>`],
      ['제압 · 고착', () => `<h4>제압치 (보병 · 비장갑)</h4><table><tr><th>제압치</th><th>상태</th><th>효과</th></tr><tr><td>0 – 49</td><td>정상</td><td>—</td></tr><tr><td>50 – ${SUPP_MAX - 1}</td><td style="color:#fbbf24">제압</td><td>행동에 불이익을 받습니다</td></tr><tr><td>${SUPP_MAX}</td><td style="color:#f87171">고착</td><td>점령 불가(경합만) · 행동 크게 제한</td></tr></table>
        <ul><li>기관총 · 대공포 · 포격이 제압을 크게 쌓습니다. 거치한 MG는 사격각 안으로 들어오는 적 보병에게 반응 사격합니다 — 붉은 사거리선을 확인하세요.</li><li>매 턴 시작 시 제압치가 ${SUPP_RECOVER}씩 회복되고, 강엄폐 안에서는 2배로 회복됩니다.</li><li>연막 안의 유닛은 MG 벙커의 자동 사격 대상에서 빠집니다.</li></ul>`],
      ['장갑 · 관통', () => `<h4>방향 장갑</h4><ul><li>차량은 <b>정면 · 측면 · 후면</b> 장갑이 다릅니다. 유닛을 이동시킨 뒤 지정하는 방향이 곧 장갑 방향입니다.</li><li>탄의 관통력이 맞은 면의 장갑보다 낮으면 <b>도탄</b>되어 피해가 크게 줄어듭니다. 관통력은 거리가 멀수록 떨어집니다.</li><li>차량 피격은 궤도 손상 · 주포 고장 · 엔진 화재 같은 치명타로 이어질 수 있습니다. 수리는 공병과 구난 차량이 맡습니다.</li></ul>
        <h4>공격 예측</h4><ul><li>적을 한 번 탭하면 예상 피해 · 관통 여부가 말풍선으로 뜹니다. <b>같은 적을 다시 탭</b>해야 사격이 확정됩니다.</li><li>대전차포 · 중기관총 같은 중화기는 사격각이 고정됩니다. 거치 방향 밖의 적은 쏠 수 없습니다.</li></ul>`],
      ['조작', () => `<h4>지휘 콘솔</h4><ul><li><b>2탭 확정</b>: 공격(예측 말풍선 재탭), 스킬(무장 → 대상), 턴 종료(미행동 유닛 경고), 작전 재시작 · 나가기.</li><li><b>대기 ↺</b>: 아직 움직이지 않은 유닛으로 차례대로 화면을 옮기고 선택합니다.</li><li><b>부대 현황(왼쪽 탭)</b>: 모든 아군 유닛 · 건물의 체력과 행동 상태. 누르면 그 위치로 이동합니다.</li><li><b>전투 기록</b>: 관통 · 도탄 · 제압 · 포격 결과가 라운드별로 남습니다.</li><li><b>CP(오른쪽 탭)</b>: 지휘 포인트로 교리와 지원을 엽니다.</li><li>지도는 드래그로 이동, 두 손가락으로 확대 · 축소합니다.</li></ul>
        <h4>이동 되돌리기</h4><p>방금 이동하거나 제자리 선회한 유닛은 <b>↶ 이동 취소</b>로 한 번 되돌릴 수 있습니다. 이동 중 새 적을 발견했거나, 지뢰 · 반응 사격을 맞았거나, 그 뒤 다른 행동을 했거나, 다른 유닛을 선택했거나, 턴을 마치면 되돌릴 수 없습니다.</p>
        <h4>저장</h4><p>턴이 시작될 때와 앱을 나갈 때(다른 앱으로 전환 · 화면 끄기 · 탭 닫기) 자동으로 저장됩니다. 로비의 <b>이어하기</b>는 더 최근 저장을 불러옵니다. 패스 앤 플레이는 이어할 때 항상 가림막부터 엽니다.</p>
        <h4>패스 앤 플레이</h4><p>턴 종료를 확정하면 가림막이 화면 전체를 덮습니다. 기기를 넘긴 뒤 다음 지휘관이 <b>지휘권 인수</b>를 눌러야 자신의 시야가 열립니다.</p>`]
    ]);
  }
  function shInfoOpen() {
    shModalOpen('INFO · 정보', null, () => `<h4>BURNING FRONT ${SH_VERSION}</h4><p>단일 HTML 파일로 동작하는 가로 화면 전용 헥스 전술 게임입니다. 네트워크 연결이 필요 없습니다.</p>
      <h4>저장</h4><p>진행 중인 작전은 매 턴 시작 시 이 브라우저(localStorage)에 자동 저장되며, 로비의 <b>이어하기</b>로 복귀합니다. 승패가 결정되면 저장이 지워집니다.</p>
      <h4>글꼴</h4><p>Saira Stencil One (Omnibus-Type), Oswald (Vernon Adams 외), Black Han Sans (Zess Type), Do Hyeon (우아한형제들) — SIL Open Font License 1.1</p>`);
  }

  // ---------- auto-save / continue ----------
  // units and buildings are referenced from other objects (cargo, construction crews …): those references are stored as ids and re-linked on load
  function shEncode(state) {
    const uid = new Map(units.map(u => [u, u.id])), bid = new Map(buildings.map(b => [b, b.id]));
    const enc = (v, self, depth) => {
      if (typeof v === 'number') return isFinite(v) ? v : { $n: String(v) };
      if (v === null || typeof v === 'string' || typeof v === 'boolean') return v;
      if (typeof v !== 'object' || depth > 14) return undefined;
      if (!self && uid.has(v)) return { $u: uid.get(v) };
      if (!self && bid.has(v)) return { $b: bid.get(v) };
      if (v instanceof Set) return { $set: [...v].map(x => enc(x, false, depth + 1)) };
      if (v instanceof Map) return { $map: [...v].map(([k, x]) => [enc(k, false, depth + 1), enc(x, false, depth + 1)]) };
      if (Array.isArray(v)) return v.map(x => { const e = enc(x, false, depth + 1); return e === undefined ? null : e; });
      const pr = Object.getPrototypeOf(v); if (pr !== Object.prototype && pr !== null) return undefined;   // canvases, images, DOM nodes: rebuilt lazily
      // '_' keys are animation temporaries and are skipped, except the turret direction (_tur)
      const o = {}; for (const k in v) { if (k[0] === '_' && k !== '_tur') continue; const e = enc(v[k], false, depth + 1); if (e !== undefined) o[k] = e; } return o;
    };
    const out = {}; for (const k in state) out[k] = (k === 'units' || k === 'buildings') ? state[k].map(x => enc(x, true, 1)) : enc(state[k], false, 0);
    return out;
  }
  function shDecode(data) {
    const us = data.units.map(() => ({})), bs = data.buildings.map(() => ({}));
    const uById = new Map(data.units.map((u, i) => [String(u.id), us[i]])), bById = new Map(data.buildings.map((b, i) => [String(b.id), bs[i]]));
    const dec = v => {
      if (v === null || typeof v !== 'object') return v;
      if (Array.isArray(v)) return v.map(dec);
      if ('$n' in v) return Number(v.$n);
      if ('$u' in v) return uById.get(String(v.$u)) || null;
      if ('$b' in v) return bById.get(String(v.$b)) || null;
      if ('$set' in v) return new Set(v.$set.map(dec));
      if ('$map' in v) return new Map(v.$map.map(([k, x]) => [dec(k), dec(x)]));
      const o = {}; for (const k in v) o[k] = dec(v[k]); return o;
    };
    data.units.forEach((u, i) => Object.assign(us[i], dec(u))); data.buildings.forEach((b, i) => Object.assign(bs[i], dec(b)));
    const out = {}; for (const k in data) out[k] = k === 'units' ? us : k === 'buildings' ? bs : dec(data[k]);
    return out;
  }
  // two slots: 'save' is written at every turn start, 'suspend' when the page is hidden or closed mid-turn; Continue loads the newer one
  const SH_SAVE_V = 2;
  const SH_STRUCT_STATIC = { cells: 1, fx: 1, fy: 1, z: 1, topM: 1, name: 1, kind: 1, cap: 1, maxHp: 1 };   // rebuilt from the map; everything else is rule state
  function shSnapshot() {
    const structs = V147.structs.map(st => { const o = {}; for (const k in st) if (!SH_STRUCT_STATIC[k]) o[k] = st[k]; return o; });
    return shEncode({ currentTurn, roundCount, turnNo, nextUnitId, gold, fuel, mun, teamXp, doctrine, bgCd, bgTurn, smokes, pendingStrikes, reveals, fires, research, queue, upg, cpHold, vm, terrainMap, capturePoints, mines, bunkers, units, buildings,
      rally: V140.rally, structs, edges: [...EDGES], runEdges: [...(V151.runEdges || [])], win: SHELL.win || null });
  }
  function shWrite(slot, rec) {   // write a temporary key first, so a write cut short by the page closing never replaces a good save
    if (!shStore.set(slot + '.tmp', rec)) return false;
    const ok = shStore.set(slot, rec); shStore.del(slot + '.tmp'); return ok;
  }
  function shSave(slot = 'save') {
    if (!SHELL.inGame || SHELL.quiet || vm.winner) return false;
    try {
      const state = shSnapshot();
      const rec = { v: SH_SAVE_V, ver: GAME_VERSION, slot, when: Date.now(), mode: SHELL.mode, cfg: SHELL.cfg, mapName: (SH_MAPS.find(m => m.id === mapSelect.value) || {}).name || mapSelect.value, round: roundCount, turn: currentTurn, log: SHELL.log.slice(-200), seen: [...SHELL.seen], state };
      const ok = shWrite(slot, rec);
      if (ok && slot === 'save') shStore.del('suspend');   // a fresh turn-start save supersedes an older exit-save
      if (!ok && !SHELL.saveWarned) { SHELL.saveWarned = true; toast('자동 저장 실패 — 브라우저 저장 공간을 확인하세요', 4000); }
      return ok;
    } catch (e) { console.error('[shell] save failed', e); return false; }
  }
  function shClearSaves() { ['save', 'suspend', 'save.tmp', 'suspend.tmp'].forEach(k => shStore.del(k)); }
  function shSaveInfo() {
    const ok = s => s && s.v === SH_SAVE_V && s.state && s.cfg && shMapOk(s.cfg.map) ? s : null;
    const a = ok(shStore.get('save', null)), b = ok(shStore.get('suspend', null));
    return a && b ? (b.when > a.when ? b : a) : a || b;
  }
  // exit-save: the app going to the background or the page closing writes the current turn as it stands
  function shExitSave() { if (SHELL.inGame && !vm.winner && !curtainEl.classList.contains('open')) shSave('suspend'); }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') shExitSave(); });
  window.addEventListener('pagehide', shExitSave);
  function shLoad() {
    const s = shSaveInfo(); if (!s) return false;
    let S; try { S = shDecode(s.state); } catch (e) { return false; }
    try {
      SHELL.cfg = Object.assign({}, SHELL.cfg, s.cfg); SHELL.cfg.names = Object.assign({ blue: '', red: '' }, s.cfg.names || {}); SHELL.cfg.late = shLate(SHELL.cfg.late); SHELL.mode = s.mode === 'hotseat' ? 'hotseat' : 'skirmish';
      shApplyCfg(); shQuietReset();   // rebuilds the map and every derived index for this battlefield, then the saved state replaces the fresh one
      currentTurn = S.currentTurn; roundCount = S.roundCount; turnNo = S.turnNo; nextUnitId = S.nextUnitId;
      gold = S.gold; fuel = S.fuel; mun = S.mun; teamXp = S.teamXp; doctrine = S.doctrine; bgCd = S.bgCd; bgTurn = S.bgTurn;
      smokes = S.smokes; pendingStrikes = S.pendingStrikes; reveals = S.reveals; fires = S.fires; research = S.research; queue = S.queue; upg = S.upg; cpHold = S.cpHold; vm = S.vm;
      terrainMap = S.terrainMap; capturePoints = S.capturePoints; mines = S.mines; bunkers = S.bunkers; units = S.units; buildings = S.buildings; V140.rally = S.rally || { blue: null, red: null };
      // v202: structures are updated in place (map decorations hold references to them), edges replace the generated set
      const sById = new Map((S.structs || []).map(x => [String(x.id), x]));
      V147.structs.forEach(st => { const x = sById.get(String(st.id)); if (x) for (const k in x) st[k] = x[k]; });
      if (Array.isArray(S.edges)) { EDGES = new Map(S.edges); V151.runEdges = new Set(S.runEdges || []); EDGE_VER++; }
      try { LAYER_CACHE.clear(); } catch (e) { }
      SHELL.win = S.win || null; shClearPending(); SHELL.undo = null;
      buildZoneIndex(); v131BuildSectors();
      SHELL.log = Array.isArray(s.log) ? s.log : []; SHELL.seen = new Map(s.seen || []); shTrack();
      logEl.innerHTML = SHELL.log.map(e => `<div>> ${e.m}</div>`).join('');
      selectedUnit = null; selBld = null; validMoves = []; validAttacks = [];
      turnText.textContent = SH_TEAM[currentTurn]; turnIndicator.className = `turn-badge ${currentTurn === 'blue' ? 'turn-blue' : 'turn-red'}`; turnRound.textContent = shRound();
      endTurnBtn.disabled = false;
      shEnterGame();
      updateVision(); updateGoldUI(); updateBuildMenu(); renderResearch(); renderCP(); updateUnitInfoPanel(null, null); centerOnBase(false); render();
      if (SHELL.mode === 'hotseat') shCurtainOpen(foeOf(currentTurn), SHELL.log.length); else shFlash();
      shPrebake();
      return true;
    } catch (e) { console.error('[shell] load failed', e); shClearSaves(); try { shQuietReset(); } catch (e2) { } return false; }
  }

  // ---------- boot ----------
  function shellBoot() {
    shDispApply(); try { document.fonts.load('400 12px Pretendard').then(() => render()); } catch (e) { }
    shApp.classList.add('shell-out'); shSprRestore(); shApplyCfg(); shQuietReset(); shShowLobby();
  }

