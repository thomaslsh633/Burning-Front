  // ══════════════════════════════════════════════════════════════
  // [v128] Retreat — infantry and crews fall back toward their HQ (CoH-style retreat, turn-based)
  //   · budget = movement left this turn (full move if the unit has not moved) + 50% of its move, ignoring suppression
  //   · the unit walks the cheapest reachable hex closest to its HQ; it cannot attack afterwards
  //   · until its next turn: 25% less damage taken and no return fire
  // ══════════════════════════════════════════════════════════════
  const RETREAT = { moveBonus: 0.5, dmgTaken: 0.75 };
  const hqOf = tm => buildings.find(b => b.team === tm && b.type === 'hq' && b.hp > 0);
  /* retreatBlock: original body removed — replaced by a later layer (js/chains/retreatBlock.js) */
  /* retreatMove: original body removed — replaced by a later layer (js/chains/retreatMove.js) */
  mkSk('retreat', { n: '퇴각', ico: '🏳', mun: 0, cd: 1, kind: 'free', retreat: true, b: 'retreat', dur: 1,
    d: '본부 방향 자동 후퇴 · 이동력 +50% · 고착 중에도 가능 · 다음 턴까지 피격 −25%·반격 없음 · 퇴각 후 공격 불가',
    ok: u => retreatBlock(u), run: u => retreatMove(u) });
  ['blue', 'red'].forEach(tm => Object.keys(UNIT_ROSTER[tm]).forEach(k => {
    if (UNIT_ROSTER[tm][k].armorType === 'soft') UNIT_SK[tm][k] = (UNIT_SK[tm][k] || []).filter(x => x !== 'retreat').concat('retreat');
  }));


  // ══════════════════════════════════════════════════════════════
  // [V53·V54] 교리 지원소 건물화 + CP6 패시브 / CP8 궁극
  //   · 교리 선택 = 공병이 교리 지원소 건설 (💰300 ⛽40). chooseDoc(CP 패널)은 안내만
  //   · CP6: 보병 전선 사기(제압 −20 추가 회복) / 기갑 정비 강화(수리 한도 ×2.0) / 공수 강습 낙하(낙하 직후 행동)
  //   · CP8: 연속 집중 포격 / 기갑 총돌격 / 공수 정예 낙하(2기)
  // ══════════════════════════════════════════════════════════════
  /* chooseDoc: layer moved to js/chains/chooseDoc.js */
  const DOC_PAS = {
    inf: { id: 'ps_inf', cp: 6, ico: '🪖', n: '전선 사기', d: '턴 시작 시 아군 보병 제압 −20 추가 회복' },
    mech: { id: 'ps_mech', cp: 6, ico: '🔧', n: '정비 강화', d: '수리 한도 ×1.5 → ×2.0' },
    air: { id: 'ps_air', cp: 6, ico: '🪂', n: '강습 낙하', d: '낙하 유닛이 낙하 직후 이동·공격 가능' }
  };
  const msAll = tm => CP_MS.concat(doctrine[tm] ? [DOC_PAS[doctrine[tm]]] : []);
  BG.inf.push({ id: 'i5', cp: 8, mun: 120, cd: 6, n: { blue: '연속 집중 포격', red: '연속 집중 포격' }, t: 'barrage', twice: true });
  BG.mech.push({ id: 'm5', cp: 8, mun: 90, cd: 6, n: { blue: '기갑 총돌격', red: '기갑 총돌격' }, t: 'assault', rad: 4, mv: 3 });
  BG.air.push({ id: 'a5', cp: 8, mun: 110, cd: 6, n: { blue: '공수 정예 낙하', red: '팔슈름 정예 낙하' }, t: 'drop', key: { blue: 'paratrooper', red: 'fj' }, pair: true });
  Object.assign(BG_DESC, { i5: '지정 칸 반경 2에 포탄 5발을 두 턴 연속 착탄(다음 내 턴 · 그다음 내 턴).', m5: '지정 칸 4칸 이내 아군 전차 이동 +3.', a5: '시야 내 빈 칸과 인접 빈 칸에 정예 낙하병 2기. (CP6 강습 낙하 적용)' });
  
  /* processTurnStartStatus: layer moved to js/chains/processTurnStartStatus.js */

  // ══════════════════════════════════════════════════════════════
  // [V56] 교리 지원소 중복 건설 방지 / [V55] 밸런스 로그 — 핫시트 플레이 중 턴별 자원·건물·첫 전차 도달 턴을 기록 (설정 ⚙ → 밸런스 로그에서 복사)
  //   · 턴 개시마다 한 줄: 라운드/진영/💰/⛽/💣/보유 티어 건물/인구/CP
  //   · 진영별 첫 전차(tank 분류) 징집 라운드, 첫 중전차(퍼싱·티거) 라운드
  // ══════════════════════════════════════════════════════════════
  let balLog = { rows: [], tank: {}, heavy: {}, armed: false };
  
  /* resetGame: layer moved to js/chains/resetGame.js */   // armed는 부팅 징집 이후에 켠다
  
  /* createUnitFromKey: layer moved to js/chains/createUnitFromKey.js */
  const o_addLog55 = addLog;
  addLog = function (msg, kind) {
    o_addLog55(msg, kind);
    if (typeof msg === 'string' && msg.startsWith('== [') && balLog.armed) {
      const tm = currentTurn, tiers = ['barracks', 'support_center', 'motor_pool', 'air_coy', 'tank_depot', 'doc_inf', 'doc_mech', 'doc_air'];
      const bl = tiers.filter(t => buildings.some(b => b.team === tm && b.type === t && b.hp > 0)).map(t => BLD[t].s).join('/') || '-';
      balLog.rows.push(`R${roundCount} ${tm === 'blue' ? '청' : '적'} | G${gold[tm]} F${fuel[tm]} M${mun[tm]} | 건물 ${bl} | 인구 ${units.filter(u => u.team === tm && u.hp > 0).length} | CP${cpOf(tm)}${doctrine[tm] ? ' ' + doctrine[tm] : ''}`);
    }
  };
  const balText = () => '[밸런스 로그 v55] 시작 💰' + initGoldSelect.value + '\n' + balLog.rows.join('\n') + '\n첫 전차: 청 ' + (balLog.tank.blue || '없음') + ' / 적 ' + (balLog.tank.red || '없음') + '\n첫 중전차: 청 ' + (balLog.heavy.blue || '없음') + ' / 적 ' + (balLog.heavy.red || '없음');
  (function () {
    const anchor = document.getElementById('res-team'); if (!anchor) return;
    const grp = document.createElement('div'); grp.className = 'set-group';
    grp.innerHTML = '<h3>밸런스 로그 (v55)</h3><pre id="bal-pre" style="font-size:10px;white-space:pre-wrap;max-height:160px;overflow:auto;user-select:text;-webkit-user-select:text"></pre><div class="set-row"><button id="bal-copy">로그 복사</button></div>';
    anchor.closest('.set-group').after(grp);
    const pre = grp.querySelector('#bal-pre');
    document.getElementById('menu-btn').addEventListener('click', () => { pre.textContent = balText(); });
    grp.querySelector('#bal-copy').addEventListener('click', () => { const t = balText(); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('로그를 복사했습니다.'), () => { pre.textContent = t; toast('복사 불가 — 위 텍스트를 길게 눌러 복사하세요.'); }); });
  })();

  // ══════════════════════════════════════════════════════════════
  // [V57] CP 획득 옵션 — 거점 1곳 이상을 연속 5턴 보유하면 CP +1(XP 25). 설정 ⚙ → CP 보너스에서 켜고 끈다 (기본: 꺼짐)
  //   · 거점을 모두 잃으면 연속 보유 턴이 0으로 돌아간다. 전장 초기화 시에도 0.
  // ══════════════════════════════════════════════════════════════
  let cpHold = { blue: 0, red: 0 };
  const cpOptOn = () => { const e = document.getElementById('cp-opt'); return !!e && e.value === 'on'; };
  
  /* resetGame: layer moved to js/chains/resetGame.js */
  
  /* processTurnStartStatus: layer moved to js/chains/processTurnStartStatus.js */
  (function () {
    const anchor = document.getElementById('res-team'); if (!anchor) return;
    const grp = document.createElement('div'); grp.className = 'set-group';
    grp.innerHTML = '<h3>CP 보너스 (v58)</h3><div class="set-row"><select id="cp-opt"><option value="off" selected>꺼짐 (전투 XP만)</option><option value="on">켜짐 — 거점 5턴 연속 보유 시 CP +1</option></select></div>';
    anchor.closest('.set-group').after(grp);
    // v144: sight-blocking switch for comparison tests
    const g2 = document.createElement('div'); g2.className = 'set-group';
    g2.innerHTML = '<h3>시야 차단 (v144)</h3><div class="set-row"><select id="sight-opt"><option value="full" selected>켜짐 — 시선 차단 + 은폐 + 가림</option><option value="los">시선 차단만 (은폐 없음)</option><option value="off">꺼짐 (v142 시야)</option></select></div>';
    grp.after(g2);
    g2.querySelector('select').addEventListener('change', e => {
      const v = e.target.value; LAYERS.sight = v !== 'off'; LAYERS.conceal = v === 'full'; LAYERS.obscure = v === 'full' ? 0.85 : 1;
      if (typeof updateVision === 'function') { updateVision(); render(); }
    });
  })();

