  // ══════════════════════════════════════════════════════════════
  // [13] 교리 · 패키지 · 스킬 · 포격 · 배틀그룹
  //     · DOC, PKG(buyPkg/applyPkg), 유닛 스킬(useSkill), 포격(impact/strike/runStrikes), BG(useBG), 고유 스킬(USK/UNIT_SK/useUsk)
  // ══════════════════════════════════════════════════════════════
  // --- 교리 ---
  const DOC = {
    inf: { n: { blue: '보병 중대', red: '돌격 전투단' }, d: '충원비 −25% · 보병 HP +10% · 수류탄/연막 사거리 +1' },
    mech: { n: { blue: '기갑 중대', red: '기갑 전투단' }, d: 'HP 수리 ×1.5 · 전차/경차량 이동 +1 · 셔먼·4호 주포 관통 +5' },
    air: { n: { blue: '공수 중대', red: '공군 지원 전투단' }, d: 'MUN +15/턴 · 정찰기/폭격 비용 −30% · 명중 감쇄 −0.03/칸' }
  };
  function applyDoctrine(u) {
    const d = doctrine[u.team]; if (!d || u.docDone === d) return; u.docDone = d;
    const cat = UNIT_ROSTER[u.team][u.key].cat;
    if (d === 'inf' && cat === 'infantry') { const b = Math.round(u.maxHp * 0.1); u.maxHp += b; u.hp += b; }
    if (d === 'mech') {
      if (cat === 'tank' || ['vehicle', 'weasel', 'puma', 'kettenkrad', 'truck'].includes(u.key)) { u.moveDist += 1; u.remainingMove += 1; }
      if (u.key === 'sherman' || u.key === 'panzer4') { addPenBonus(u, 5); }   // v127: flat +5 on the unified pen scale
    }
  }
  /* chooseDoc: original body removed — replaced by a later layer (js/chains/chooseDoc.js) */
  // --- 패키지 / 유닛 스킬 ---
  const PKG = {
    bar: { n: 'BAR 자동소총', mun: 50, keys: { blue: ['infantry'], red: [] }, sk: { id: 'volley', n: '일제 사격', mun: 15, cd: 3, dur: 2 } },
    lmg: { n: 'MG42 경기관총', mun: 50, keys: { blue: [], red: ['infantry'] }, sk: { id: 'hold', n: '저지 사격', mun: 20, cd: 2, dur: 1 } },
    flame_kit: { n: '화염방사 키트', mun: 40, keys: { blue: ['engineer'], red: ['engineer'] } },
    schreck: { n: '대전차 로켓', mun: 60, keys: { blue: ['ranger'], red: ['jager'] }, sk: { id: 'pierce', n: '장갑 관통 일격', mun: 25, cd: 3, dur: 1 } }
  };
  function applyPkg__base(u, id) {
    u.pkg = id;
    if (u.raw && (id === 'bar' || id === 'lmg') && equipKit(u, id)) return;   // v162: CoH3 kit weapons
    if (u.raw && id === 'flame_kit' && equipKit(u, 'flame_' + u.team)) return;
    if (u.raw && id === 'schreck' && equipKit(u, 'rocket_' + u.team)) return;
    if (id === 'bar') { u.atk += 6; u.rof += 2; }
    if (id === 'lmg') { u.range += 2; u.rof += 3; u.suppressBonus = 15; }
    if (id === 'flame_kit') { u.atk += 22; u.ignoreCover = true; }
    if (id === 'schreck') equipSub(u, AT_ROCKET[u.team]);   // v127: one launcher on the secondary slot; rifles keep firing
  }
  function buyPkg(uid, pid) {
    const u = uById(uid), P = PKG[pid]; if (!u || u.pkg || u.team !== currentTurn) return;
    if (mun[u.team] < P.mun) { toast('뮤니션이 부족합니다.'); return; }
    mun[u.team] -= P.mun; applyPkg(u, pid); addLog(`🔫 [무장 패키지] ${u.className} — ${P.n} 장착 (-${P.mun} MUN)`, 'supply');
    updateGoldUI(); updateUnitInfoPanel(u, getTerrain(u.c, u.r)); render();
  }
  const cdOf = (u, id) => (u.skillCd && u.skillCd[id]) || 0;
  const setCd = (u, id, cd) => { (u.skillCd = u.skillCd || {})[id] = turnNo + 2 * cd; };
  const SK = { cur: null };
  function useSkill__base(uid, id) {
    const u = uById(uid); if (!u || u.team !== currentTurn || mun[u.team] < 0) return;
    const P = u.pkg && PKG[u.pkg] && PKG[u.pkg].sk;
    if (P && P.id === id) {
      if (mun[u.team] < P.mun) { toast('뮤니션이 부족합니다.'); return; }
      if (cdOf(u, id) > turnNo) { toast('쿨다운 중입니다.'); return; }
      mun[u.team] -= P.mun; setCd(u, id, P.cd); (u.buff = u.buff || {})[id] = P.dur;
      addLog(`✨ [${P.n}] ${u.className} (-${P.mun} MUN)`, 'supply'); updateGoldUI(); updateUnitInfoPanel(u, getTerrain(u.c, u.r)); render(); return;
    }
    const D = { gren: { mun: 40, cd: 3, rng: 3, n: '파편 수류탄' }, smoke: { mun: 30, cd: 2, rng: 3, n: '연막 차폐' } }[id];
    if (mun[u.team] < D.mun) { toast('뮤니션이 부족합니다.'); return; }
    if (cdOf(u, id) > turnNo) { toast('쿨다운 중입니다.'); return; }
    if (u.hasAttacked) { toast('이미 공격 행동을 사용했습니다.'); return; }
    if (id === 'gren' && suppState(u) >= 1) { toast('제압 상태에서는 수류탄을 던질 수 없습니다.'); return; }
    const same = actionMode === 'sk' && SK.cur && SK.cur.kind === 'unit' && SK.cur.id === id;
    if (actionMode === 'sk') skEnd(); else if (actionMode === 'usk') uskEnd();
    if (same) return;
    SK.cur = { kind: 'unit', id, D, rng: D.rng + (doctrine[u.team] === 'inf' ? 1 : 0) };
    actionMode = 'sk'; activeActor = u; hint2(`💥 ${D.n}: 대상 칸을 탭하세요 (사거리 ${SK.cur.rng}) · 시전자 탭=취소`);
    updateUnitInfoPanel(u, getTerrain(u.c, u.r)); render();
  }
  function skEnd__base() { actionMode = null; activeActor = null; SK.cur = null; guideBanner.style.display = 'none'; updateUnitInfoPanel(selectedUnit, selectedUnit ? getTerrain(selectedUnit.c, selectedUnit.r) : null); render(); renderCP(); }
  // --- 포격 ---
  // v127: virtual attackers for strikes and thrown / fired skills. P scales with the x1.8 HP pools; A keeps its
  //       v126 meaning and is mapped onto the unified pen scale.
  //       v161: (P, A, dmgA) are only the skill tables' shell figures — they become one attack, a hit area and a pen
  //       (see v161Shell); a unit profile ({ atk, area, pen }) can be passed in place of P (the mortar shell call-in).
  const ART_DMGA_K = 0.55, ART_P_K = 1.75, ART_A_K = 0.56;
  const artAtt = (team, c, r, P, A, rof, dmgA) => Object.assign({ team, isArtillery: true, c, r, rof: rof || 1, accDrop: 0, suppression: 0 }, v161Shell(P, A, dmgA));
  const throwAtt = (a, P, A, dmgA) => Object.assign({ team: a.team, c: a.c, r: a.r, rof: 1, accDrop: .05, deflectDmgPct: .3, suppression: 0 }, v161Shell(P, A, dmgA));
  function impact(team, c, r, P, A, rof, splash, dmgA) {
    const list = [];
    [...units.filter(u => u.hp > 0 && !u.isLoaded), ...buildings.filter(b => b.hp > 0), ...bunkers.filter(b => b.hp > 0)].forEach(d => {
      const dd = getDistance(d.c, d.r, c, r); if (dd === 0) list.push([d, 1]); else if (dd === 1 && splash) list.push([d, 0.5]);
    });
    list.forEach(([d, k]) => {
      const att = artAtt(team, d.c, d.r, P, A, rof, dmgA);
      const res = calcDamage(att, d), dmg = Math.max(1, Math.round(aoeCap(d, Math.max(1, Math.round(res.damage * k))))); d.hp -= dmg;
      if (!V212.quiet) addLog(`💥 [포격] ${d.className || d.name || '구조물'} [-${dmg} HP]${res.specialNote}`, 'crit');
      applyHitEffects(att, d, res); if (d.hp <= 0) d.hp = 0;
    });
  }
  function strike(team, c, r, shells, rad, P, A, rof, dmgA) {
    const hx = ring(c, r, rad);
    for (let i = 0; i < shells; i++) { const h = hx[Math.floor(Math.random() * hx.length)]; impact(team, h.c, h.r, P, A, rof, true, dmgA); }
    checkVictory(); updateVision();
  }
  function lineStrike(team, s, d, len, P, A) {
    const S = getHexCenter(s.c, s.r), D = getHexCenter(d.c, d.r), w = Math.sqrt(3) * HEX_RADIUS;
    let vx = D.x - S.x, vy = D.y - S.y; const n = Math.hypot(vx, vy) || 1; vx /= n; vy /= n;
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const q = getHexCenter(x, y), t = (q.x - S.x) * vx + (q.y - S.y) * vy, pp = Math.abs((q.x - S.x) * vy - (q.y - S.y) * vx);
      if (t >= -w * 0.3 && t <= w * (len - 0.7) && pp <= w * 0.55) impact(team, x, y, P, A, 1, false);
    }
    checkVictory(); updateVision();
  }
  function runStrikes__base(tm) {
    const due = pendingStrikes.filter(x => x.team === tm); pendingStrikes = pendingStrikes.filter(x => x.team !== tm);
    due.forEach(x => { addLog(`🛩 [${x.n}] 착탄! (${x.c},${x.r})`, 'crit'); strike(x.team, x.c, x.r, x.shells, x.rad, 110, 90, 1); });
  }
  // --- 배틀그룹 ---
  const SCOUT = { id: 's0', cp: 0, mun: 20, cd: 2, n: { blue: '정찰기', red: '정찰기' }, t: 'scout' };
  const OFF = { id: 'off', cp: 0, mun: 120, cd: 4, n: { blue: '오프맵 긴급 포격', red: '오프맵 긴급 포격' }, t: 'off' };
  const BG = {
    air: [{ id: 'a1', cp: 1, mun: 30, cd: 3, n: { blue: '패스파인더 낙하', red: '팔슈름예거 낙하' }, t: 'drop', key: { blue: 'pathfinder', red: 'fj' } },
      { id: 'a2', cp: 2, mun: 0, cd: 5, n: { blue: '보급 투하', red: '보급 투하' }, t: 'supply' },
      { id: 'a3', cp: 3, mun: 40, cd: 4, n: { blue: '57mm 대전차포 낙하', red: 'Pak 40 낙하' }, t: 'drop', key: { blue: 'at_gun', red: 'at_gun' }, face: 1 },
      { id: 'a4', cp: 4, mun: 80, cd: 5, n: { blue: 'P-47 로켓 폭격', red: '슈투카 급강하 폭격' }, t: 'line' }],
    inf: [{ id: 'i1', cp: 1, mun: 30, cd: 2, n: { blue: '정찰 사격', red: '정찰 사격' }, t: 'shell' },
      { id: 'i2', cp: 2, mun: 0, cd: 3, n: { blue: '보병 증원', red: '그레나디어 증원' }, t: 'spawn', key: 'infantry' },
      { id: 'i3', cp: 3, mun: 40, cd: 3, n: { blue: '돌격 구령', red: '돌격 구령' }, t: 'charge' },
      { id: 'i4', cp: 4, mun: 90, cd: 5, n: { blue: '집중 포격', red: '집중 포격' }, t: 'barrage' }],
    mech: [{ id: 'm1', cp: 1, mun: 20, cd: 3, n: { blue: '응급 수리 지시', red: '응급 수리 지시' }, t: 'fix' },
      { id: 'm2', cp: 2, mun: 0, cd: 4, n: { blue: '차량 증원', red: 'Sd.Kfz.221 증원' }, t: 'spawn', key: 'vehicle' },
      { id: 'm3', cp: 3, mun: 30, cd: 3, n: { blue: '전진 기동', red: '전진 기동' }, t: 'adv' },
      { id: 'm4', cp: 4, mun: 60, cd: 5, n: { blue: '기갑 돌격', red: '기갑 돌격' }, t: 'assault' }]
  };
  const munCost = (tm, d) => Math.round(d.mun * (doctrine[tm] === 'air' && (d.t === 'scout' || d.id === 'a4') ? 0.7 : 1));
  const bgList = tm => [SCOUT, OFF, ...(docAlive(tm) ? BG[doctrine[tm]] : [])];   // v53: 교리 지원소 생존 시에만
  function bgReady(tm, d) {
    if (tm !== currentTurn) return '상대 턴'; if (cpOf(tm) < d.cp) return `CP ${d.cp} 필요`;
    if ((bgCd[tm][d.id] || 0) > turnNo) return `쿨 ${Math.ceil(((bgCd[tm][d.id]) - turnNo) / 2)}턴`;
    if (bgTurn[tm] === turnNo) return '이번 턴 사용함'; if (mun[tm] < munCost(tm, d)) return 'MUN 부족'; return '';
  }
  function useBG(id) {
    const tm = currentTurn, d = bgList(tm).find(x => x.id === id); if (!d) return;
    const why = bgReady(tm, d); if (why) { toast(why); return; }
    if (actionMode) { if (actionMode === 'sk') skEnd(); else { toast('진행 중인 모드를 먼저 종료하세요.'); return; } }
    if (d.t === 'supply') { return toastAsk('보급 투하 — 무엇을 받을까요?', [['💣 MUN +80', () => { mun[tm] = Math.min(400, mun[tm] + 80); bgDone(tm, d, '보급 투하 (MUN +80)'); }], ['⛽ 연료 +40', () => { fuel[tm] += 40; bgDone(tm, d, '보급 투하 (연료 +40)'); }]]); }
    const H = hq(tm); if (!H) return;
    SK.cur = { kind: 'team', d, step: 0 }; actionMode = 'sk'; activeActor = H;
    hint2(`🎯 ${d.n[tm]}: ` + ({ line: '시작 칸을 탭하세요', spawn: '사령부 인접 빈 칸을 탭하세요', fix: '아군 차량을 탭하세요', adv: '아군 기갑을 탭하세요' }[d.t] || '대상 칸을 탭하세요') + ' · 사령부 탭=취소');
    renderCP(); render();
  }
  function bgDone(tm, d, msg) {
    mun[tm] = Math.max(0, mun[tm] - munCost(tm, d)); bgCd[tm][d.id] = turnNo + 2 * d.cd; bgTurn[tm] = turnNo;
    addLog(`🎖 [${d.n[tm]}] ${msg}`, 'bounty'); skEnd(); updateGoldUI(); updateVision(); render();
  }
  function spawnAt(tm, key, h, face) {
    const u = createUnitFromKey(nextUnitId++, tm, key, h.c, h.r); units.push(u);
    if (face) { const e = units.filter(x => x.team !== tm && x.hp > 0).sort((a, b) => getDistance(h.c, h.r, a.c, a.r) - getDistance(h.c, h.r, b.c, b.r))[0]; if (e) faceToward(u, e.c, e.r); }
    return u;
  }

  // ---------- ④ 무장 패키지 확장 ----------
  Object.assign(PKG, {
    thompson: { n: '톰슨 기관단총', mun: 40, keys: { blue: ['captain', 'paratrooper', 'ranger'], red: [] } },
    bazooka: { n: 'M1 바주카 증설', mun: 55, keys: { blue: ['infantry', 'paratrooper'], red: [] }, sk: { id: 'pierce', n: '장갑 관통 일격', mun: 25, cd: 3, dur: 1 } },
    stg44: { n: 'StG44 돌격소총', mun: 45, keys: { blue: [], red: ['infantry', 'panzergren'] } },
    fg42: { n: 'FG42 자동소총', mun: 45, keys: { blue: [], red: ['fj'] } },
    panzerfaust: { n: '판저파우스트 ×2', mun: 45, keys: { blue: [], red: ['fp_pioneer', 'panzergren', 'engineer'] } }   // v129: grenadiers carry a Panzerfaust as a base skill
  });
  PKG.flame_kit.keys.blue = ['engineer', 'assault_eng'];
  PKG.lmg.keys.red = ['infantry', 'fp_pioneer'];
  PKG.schreck.keys.red = ['jager', 'fj'];
  PKG.thompson.keys.blue = PKG.thompson.keys.blue.concat(['scout', 'pathfinder', 'commando', 'at_inf']);   // v58: 보조무기 슬롯 없던 보병 추가
  PKG.stg44.keys.red = PKG.stg44.keys.red.concat(['sturmtruppen', 'at_inf']);
  PKG.panzerfaust.keys.red.push('sturmtruppen');
  
  /* applyPkg: layer moved to js/chains/applyPkg.js */

  // ---------- ⑤ 고유 스킬 ----------
  const USK = {};
  const mkSk = (id, o) => { USK[id] = Object.assign({ id, mun: 20, cd: 2, t: 'self', dur: 1 }, o); };
  const nm3 = (d, tm) => typeof d.n === 'string' ? d.n : d.n[tm];
  const munFor = (u, d) => d.mun;   // v45: 모든 스킬 공통 ★3 비용 −20% 폐지 (클래스 표 방식으로 전환)
  const cdFor = (u, d) => { const v = vetV(u); let r = v.cdAll; if (v.cdGren && (d.id === 'rgren' || d.id === 'gammon')) r += v.cdGren; if (v.cdSniper && d.id === 'steady') r += v.cdSniper; return Math.max(d.kind === 'free' ? Math.min(d.cd, 3) : 1, d.cd - r); };   // v47: 무료 스킬 쿨 하한 3턴 / v45: 클래스가 지정한 스킬만 단축
  const rngOf = (u, d) => typeof d.rng === 'function' ? d.rng(u) : d.rng;
  let fires = [];

  // 화기·투척 공용: 가상 공격자로 피해 계산 (측/후면·관통 규칙 그대로 적용)
  function throwAt__base(a, t, P, A, supp, label, dmgA) {
    const att = throwAtt(a, P, A, dmgA);
    const res = calcDamage(att, t);
    res.damage = aoeCap(t, res.damage); // 소프트 목표는 최대 3모델분
    t.hp -= res.damage;
    addLog(`${label} ${a.className} ➔ ${t.className} [-${res.damage} HP]${res.specialNote}`, 'crit');
    applyHitEffects(att, t, Object.assign({}, res, { suppress: supp || 0 }));
    addVeterancyExp(a, 2, 'atk');
    if (t.hp <= 0) { t.hp = 0; claimKillBounty(a, t); addVeterancyExp(a, 8, t); }
  }
  // 구조물 타격: 건물 · 벙커 · 참호/샌드백 · 지뢰
  function structHit(u, hex, bd, kd, opt) {
    opt = opt || {};
    const key = `${hex.c},${hex.r}`, tm = u.team, b = bldAt(hex), ter = terrainMap[key];
    const bk = bunkers.find(x => x.c === hex.c && x.r === hex.r && x.hp > 0 && x.team !== tm);
    const mn = mines.find(x => x.c === hex.c && x.r === hex.r && x.team !== tm);
    if (b && b.team !== tm && !opt.noBld) {
      const bdv = opt.frac ? Math.max(1, Math.round(b.maxHp * opt.frac)) : bd;
      b.hp = Math.max(0, b.hp - bdv); if (b.hp === 0) addVeterancyExp(u, 8);
      return `${b.className || b.name} −${bdv} HP${b.hp === 0 ? ' (파괴!)' : ''}`;
    }
    if (bk) { const kdv = opt.frac ? Math.max(1, Math.round(bk.maxHp * opt.frac)) : kd; bk.hp = Math.max(0, bk.hp - kdv); if (bk.hp === 0) addVeterancyExp(u, 8); return `벙커 −${kdv} HP${bk.hp === 0 ? ' (파괴!)' : ''}`; }
    if (ter && ter.fort && ter.fort.team !== tm) { terrainMap[key] = ter.fort.orig; return `${ter.name || '방어 시설'} 파괴`; }
    if (mn) { mines.splice(mines.indexOf(mn), 1); return '지뢰 제거'; }
    return false;
  }
  const noStruct = () => { hint2('❌ 인접한 적 구조물(건물·벙커·참호·지뢰)을 지정하세요'); return false; };

  // --- 정찰 · 은신 · 지정 ---
  mkSk('recon', { n: '정찰 신호', ico: '📡', mun: 10, cd: 2, d: '주변 3칸 시야 확보 (내 다음 턴까지)', run: u => { reveals.push({ team: u.team, c: u.c, r: u.r, expire: turnNo + 3 }); return '주변 3칸 시야 확보'; } });
  mkSk('camo', { n: '위장 은신', ico: '🫥', mun: 15, cd: 3, b: 'camo', dur: 3, d: '인접한 적에게만 노출 · 이동/사격 시 해제', run: u => { u.camoPos = [u.c, u.r]; return '은신 — 이동하거나 사격하면 해제'; } });
  mkSk('mark', { n: '표적 지정', ico: '🎯', mun: 20, cd: 2, t: 'tgt', who: 'enemy', rng: u => u.baseSight, vis: true, d: '적 지정: 2턴간 아군 전체 피해 +25% · 시야 공유', run: (u, h, tu) => { tu.marked = turnNo + 4; reveals.push({ team: u.team, c: tu.c, r: tu.r, expire: turnNo + 3 }); return `${tu.className} 표적 지정`; } });
  mkSk('flare', { n: '조명탄', ico: '🎆', mun: 15, cd: 2, t: 'tgt', who: 'hex', rng: 8, d: '지정 칸 주변 3칸 시야 공유 (이번 턴)', run: (u, h) => { reveals.push({ team: u.team, c: h.c, r: h.r, expire: turnNo + 2 }); return `(${h.c},${h.r}) 조명탄 전개`; } });
  // --- 지휘 · 의무 · 정비 ---
  mkSk('rally', { n: '집결 구령', ico: '📣', mun: 25, cd: 3, d: '반경 3 아군 보병: 제압 −45 · 이동 +1', run: u => { const g = units.filter(a => a.team === u.team && a.hp > 0 && !a.isLoaded && a.armorType === 'soft' && getDistance(a.c, a.r, u.c, u.r) <= 3); g.forEach(a => { a.suppression = Math.max(0, (a.suppression || 0) - 45); a.remainingMove += 1; }); return `${g.length}개 분대 사기 회복`; } });
  mkSk('fo_barrage', { n: '전방 관측 포격', ico: '🛰', mun: 70, cd: 4, t: 'tgt', who: 'hex', rng: 8, vis: true, d: '지정 지점 3발 포격 — 다음 내 턴 시작 시 착탄', run: (u, h) => { pendingStrikes.push({ team: u.team, c: h.c, r: h.r, shells: 3, rad: 1, P: 60, A: 42, custom: true, n: '전방 관측 포격' }); return `(${h.c},${h.r}) 포격 요청 — 다음 턴 착탄`; } });
  mkSk('triage', { n: '응급 처치', ico: '🏥', mun: 20, cd: 2, d: '인접 아군 보병 HP +54 · 제압 −40', run: u => { const g = units.filter(a => a.team === u.team && a.hp > 0 && !a.isLoaded && a.armorType === 'soft' && getDistance(a.c, a.r, u.c, u.r) <= 1); if (!g.length) { toast('인접한 아군 보병이 없습니다.'); return false; } g.forEach(a => { a.hp = Math.min(hpCap(a), a.hp + 54); a.suppression = Math.max(0, (a.suppression || 0) - 40); }); return `${g.length}개 분대 치료`; } });
  mkSk('field_fix', { n: '야전 응급 정비', ico: '🔧', mun: 15, cd: 1, t: 'tgt', who: 'ally', rng: 1, d: '인접 아군 차량의 궤도·주포·화재 즉시 복구', run: (u, h, tu) => { if (tu.armorType !== 'hard') { hint2('❌ 아군 차량/기갑을 지정하세요'); return false; } if (!(tu.trackDamaged || tu.gunDisabled || tu.fireTurns > 0)) { hint2('❌ 복구할 손상이 없습니다'); return false; } tu.trackDamaged = false; tu.gunDisabled = false; tu.fireTurns = 0; return `${tu.className} 궤도·주포·화재 복구`; } });
  // --- 폭파 · 투척 · 대전차 ---
  mkSk('demo', { n: '폭파 장약', ico: '🧨', mun: 40, cd: 3, t: 'tgt', who: 'any', rng: 1, vis: true, act: true, d: '인접 적 건물·벙커 최대 체력의 40% · 참호/샌드백 파괴 · 지뢰 제거', run: (u, h) => structHit(u, h, 0, 0, { frac: 0.4 }) || noStruct() });
  mkSk('satchel', { n: '폭파 가방', ico: '🧨', mun: 55, cd: 3, t: 'tgt', who: 'any', rng: 1, vis: true, act: true, d: '건물 최대 체력의 70% · 인접 적 차량 최대 체력의 45%', run: (u, h, tu) => { if (tu && tu.team !== u.team && tu.armorType === 'hard') { throwAt(u, tu, 18, 1000, 0, '🧨 [폭파 가방]', Math.round(tu.maxHp * 0.45)); return `${tu.className} 폭파`; } return structHit(u, h, 0, 0, { frac: 0.7 }) || noStruct(); } });
  mkSk('bulldoze', { n: '도저 블레이드', ico: '🚜', mun: 20, cd: 1, t: 'tgt', who: 'any', rng: 1, vis: true, d: '인접 적 참호·샌드백·지뢰 제거 · 벙커 −90', run: (u, h) => structHit(u, h, 0, 90, { noBld: true }) || noStruct() });
  mkSk('rgren', { n: { blue: 'M9 소총 유탄', red: 'GG/P40 소총 유탄' }, ico: '🧨', mun: 30, cd: 2, t: 'tgt', who: 'enemy', rng: 4, vis: true, act: true, d: '원거리 유탄 투사 (공격력 13 · 범위 4명 · 제압 +30)', run: (u, h, tu) => { throwAt(u, tu, 30, 24, 30, '🧨 [소총 유탄]'); return `${tu.className} 유탄 명중 시도`; } });
  mkSk('gammon', { n: '감마 폭탄', ico: '💣', mun: 35, cd: 3, t: 'tgt', who: 'enemy', rng: 3, vis: true, act: true, d: '근거리 대전차 투척 (공격력 40 · 범위 2명 · 관통 34 · 제압 +35)', run: (u, h, tu) => { throwAt(u, tu, 45, 60, 35, '💣 [감마 폭탄]', 40); return `${tu.className} 투척`; } });
  mkSk('pfaust', { n: '판저파우스트', ico: '🚀', mun: 0, cd: 1, t: 'tgt', who: 'enemy', rng: 3, vis: true, act: true, d: '일회용 대전차 로켓 (공격력 40 · 관통 확정)', ok: u => u.pfCharges > 0 ? '' : '판저파우스트를 모두 사용했습니다.', run: (u, h, tu) => { throwAt(u, tu, 28, 1000, 25, '🚀 [판저파우스트]', 40); u.pfCharges--; return `${tu.className} 발사 (잔여 ${u.pfCharges})`; } });
  // --- 화염 ---
  mkSk('scorch', { n: '화염 지대', ico: '🔥', mun: 40, cd: 3, t: 'tgt', who: 'hex', rng: 3, vis: true, act: true, d: '반경 1 화염 지대 2턴 — 적 턴 시작 시 보병 1모델분 · 차량 최대 체력 5% · 제압 +35', run: (u, h) => { fires.push({ team: u.team, c: h.c, r: h.r, expire: turnNo + 4, hexes: ring(h.c, h.r, 1), zm: vetV(u).flameZone }); return `(${h.c},${h.r}) 화염 지대 전개`; } });
  // --- 기동 · 연막 · 위압 ---
  mkSk('run', { n: '정찰 질주', ico: '💨', mun: 15, cd: 2, d: '이동력 +3', run: u => { u.remainingMove += 3; u.noFuel = true; return `이동력 +3 (잔여 ${u.remainingMove})`; } });
  mkSk('turbo', { n: '터보 가속', ico: '🏎', mun: 20, cd: 2, d: '이동력 +3 (헬캣)', run: u => { u.remainingMove += 3; u.noFuel = true; return `이동력 +3 (잔여 ${u.remainingMove})`; } });
  mkSk('blitz', { n: '기습 돌격', ico: '⚡', mun: 30, cd: 3, b: 'blitz', d: '제압 해제 · 이동 +3 · 근접 화력 +30%', run: u => { u.suppression = 0; u.remainingMove += 3; return '제압 해제 · 이동 +3'; } });
  mkSk('charge', { n: '돌격 사격', ico: '⚔', mun: 25, cd: 2, b: 'charge', d: '근접(≤2칸) 화력 +35% · 이동 +1', run: u => { u.remainingMove += 1; return '돌격 태세'; } });
  mkSk('stormcharge', { n: '슈투름 돌격', ico: '⚔', mun: 35, cd: 3, b: 'charge', d: '제압 해제 · 이동 +2 · 근접 화력 +35%', run: u => { u.suppression = 0; u.remainingMove += 2; return '제압 해제 · 이동 +2'; } });
  mkSk('smoke_self', { n: '연막 투사', ico: '🌫', mun: 20, cd: 2, d: '자신 주변 반경 1 연막', run: u => { smokes.push({ c: u.c, r: u.r, team: u.team, expire: turnNo + 2, hexes: ring(u.c, u.r, 1) }); return '연막 전개'; } });
  mkSk('terror', { n: '티거 위압', ico: '😨', mun: 40, cd: 4, d: '반경 4 시야 내 적 보병 제압 +35', run: u => { const g = units.filter(e => e.team !== u.team && e.hp > 0 && !e.isLoaded && e.armorType === 'soft' && getDistance(e.c, e.r, u.c, u.r) <= 4 && visH(e)); if (!g.length) { toast('반경 4칸 내 시야에 적 보병이 없습니다.'); return false; } g.forEach(e => addSuppression(e, 35)); return `${g.length}개 분대 제압`; } });
  // --- 사격 강화 버프 ---
  const bf = (n, ico, mun, cd, b, dur, d) => ({ n, ico, mun, cd, b, dur, d, run: () => '다음 사격 강화' });
  mkSk('burst', bf('점사 사격', '🔫', 25, 2, 'burst', 1, '연사 +40% · 제압 +30 (이번 턴)'));
  mkSk('quad', bf('쿼드 소사', '🔫', 25, 2, 'burst', 1, '연사 +40% · 제압 +30 (이번 턴)'));
  mkSk('flakburst', bf('대공포 연속 사격', '🔫', 25, 2, 'burst', 1, '연사 +40% · 제압 +30 (이번 턴)'));
  mkSk('apbelt', bf('철갑탄 벨트', '🛡', 25, 3, 'apbelt', 2, '2턴간 관통 +50%'));
  mkSk('aim', bf('철갑 조준', '🎯', 25, 3, 'ap1', 1, '다음 사격 관통·공격력 +30% · 관통 시 궤도 손상 확정'));
  mkSk('ap_tank', bf('AP 집중 사격', '🎯', 30, 3, 'ap1', 1, '다음 사격 관통·공격력 +30% · 관통 시 궤도 손상 확정'));
  mkSk('apcr', bf('텅스텐 철갑탄', '🎯', 35, 3, 'ap2', 1, '다음 사격 관통·공격력 +45% · 관통 시 궤도 손상 확정'));
  mkSk('hvap', bf('고속 철갑탄', '🎯', 35, 3, 'ap2', 1, '다음 사격 관통·공격력 +45% · 관통 시 궤도 손상 확정'));
  mkSk('canister', bf('산탄', '💥', 25, 2, 'canister', 1, '다음 사격 타격 범위 +70% · 제압 +25'));
  mkSk('bb', bf('벙커 버스터', '🏚', 40, 3, 'bb', 1, '다음 사격: 타격 범위 +25% · 엄폐 무시 · 건물/벙커 ×2'));
  mkSk('steady', bf('정조준', '🔭', 20, 2, 'steady', 1, '다음 사격 피해 +40%'));
  mkSk('grit', { n: '불굴', ico: '🛡', mun: 35, cd: 4, b: 'grit', dur: 2, d: '2턴간 받는 피해 −25% · 제압 누적 70% 감소 · 제압 −30', run: u => { u.suppression = Math.max(0, (u.suppression || 0) - 30); return '불굴 — 2턴간 방어 강화'; } });
  // --- 포병 (연막 · 포격) ---
  const smk3 = rad => (u, h) => { smokes.push({ c: h.c, r: h.r, team: u.team, expire: turnNo + 2, hexes: ring(h.c, h.r, rad) }); return `(${h.c},${h.r}) 연막 전개`; };
  mkSk('smk_m', { n: '연막탄 사격', ico: '🌫', mun: 30, cd: 2, t: 'tgt', who: 'hex', rng: u => u.range, useMin: true, vis: true, act: true, d: '지정 칸 반경 1 연막', run: smk3(1) });
  mkSk('smk_h', { n: '연막 포격', ico: '🌫', mun: 40, cd: 2, t: 'tgt', who: 'hex', rng: u => u.range, useMin: true, vis: true, act: true, d: '지정 칸 반경 2 연막', run: smk3(2) });
  const barr3 = (n, shells, rad, P, A, mun, cd) => ({ n, ico: '💥', mun, cd, t: 'tgt', who: 'hex', rng: u => u.range, useMin: true, vis: true, act: true, still: true, am: 1, d: `${shells}발 · 반경 ${rad} 포격 — 다음 내 턴 시작 시 착탄 (설치 필요 · 탄약 1)`, run: (u, h) => { pendingStrikes.push({ team: u.team, c: h.c, r: h.r, shells, rad, P, A, custom: true, n }); return `(${h.c},${h.r}) 포격 요청 — 다음 턴 착탄`; } });
  mkSk('bar_m', barr3('박격포 집중 포격', 3, 1, 40, 28, 45, 3));
  mkSk('bar_sp', barr3('자주포 집중 포격', 3, 1, 55, 38, 50, 3));
  mkSk('bar_h', barr3('105mm 집중 포격', 4, 1, 72, 52, 70, 4));
  mkSk('bar_h2', barr3('150mm 집중 포격', 4, 1, 82, 58, 80, 4));
  // rocket volley: all 5 rockets are fired and land in the same turn (no pending strike)
  mkSk('rocket', Object.assign(barr3('로켓 일제 사격', 5, 2, 28, 20, 80, 4), {
    d: '5발 · 반경 2 일제 사격 — 발사한 같은 턴에 전부 착탄 (설치 필요 · 탄약 1)',
    run: (u, h) => { addLog(`🚀 [로켓 일제 사격] 착탄! (${h.c},${h.r})`, 'crit'); strike(u.team, h.c, h.r, 5, 2, 28, 20, 1); return `(${h.c},${h.r}) 일제 사격 — 즉시 착탄`; }
  }));

  // 병종 → 고유 스킬
  const UNIT_SK = {
    blue: {
      infantry: ['rgren'], truck: ['run'], scout: ['recon'], engineer: ['demo'], captain: ['rally', 'fo_barrage'], at_inf: ['aim'], sniper: ['camo', 'steady'],
      pathfinder: ['camo', 'mark'], paratrooper: ['gammon'], assault_eng: ['satchel'], commando: ['blitz', 'camo'], ranger: ['grit'], flamer: ['scorch'],
      hmg: ['burst'], hmg_50: ['apbelt', 'burst'], mortar: ['smk_m', 'bar_m'], at_gun: ['camo', 'apcr'], m5gun: ['camo', 'apcr'], pack75: ['smk_m', 'bar_m'],
      howitzer: ['smk_h', 'bar_h'], scott: ['smk_m', 'bar_sp'], priest: ['bar_h'], whizbang: ['rocket'],
      ambulance: ['triage'], recovery: ['field_fix'], weasel: ['run'], transport: ['smoke_self'],
      m16: ['quad'], m3gmc: ['aim'], vehicle: ['run'], chaffee: ['run', 'smoke_self'], grant: ['ap_tank', 'smoke_self'], stuart: ['canister'],
      tank_dest: ['turbo', 'aim'], sherman: ['ap_tank', 'smoke_self'], bulldozer: ['bulldoze', 'smoke_self'],
      easyeight: ['hvap', 'smoke_self'], pershing: ['hvap', 'smoke_self']
    },
    red: {
      infantry: ['rgren'], engineer: ['demo'], sniper: ['camo', 'steady'], fp_pioneer: ['demo'], jager: ['camo'],
      panzergren: ['charge'], fj: ['flare'], sturmtruppen: ['stormcharge'], flamer: ['scorch'],
      hmg: ['burst'], mortar: ['smk_m', 'bar_m'], at_gun: ['camo', 'apcr'], lg40: ['camo', 'aim'], flak: ['flakburst', 'camo'], flak38: ['flakburst', 'camo'], flak36: ['apcr', 'aim'], obice210: ['bar_h2'],
      nebel: ['rocket'], howitzer: ['smk_h', 'bar_h2'], wespe: ['bar_sp'], wanze: ['aim', 'camo'], pzb221: ['run', 'aim'], pz4cmd: ['fo_barrage', 'rally'], stummel: ['bb', 'smoke_self'], amb251: ['triage'], hummel: ['bar_h2', 'smk_h'], pz3l: ['ap_tank', 'smoke_self'],
      ambulance: ['triage'], bergepanzer: ['field_fix'], kettenkrad: ['run'], transport: ['smoke_self'],
      vehicle: ['run'], puma: ['run', 'aim'], wirbelwind: ['flakburst'], tank_dest: ['camo', 'aim'],
      stug: ['ap_tank', 'smoke_self'], panzer4: ['ap_tank', 'smoke_self'], brummbar: ['bb'],
      panther: ['ap_tank', 'smoke_self'], tiger: ['hvap', 'terror']
    }
  };
  const uskList = u => {
    if (u.empl) return [];   // v134: emplacements have no skills
    const ids = ((UNIT_SK[u.team] || {})[u.key] || []).slice();
    if (u.pkg === 'panzerfaust') ids.push('pfaust');
    if (u.pkg2 === 'cmdr') ids.push('mark'); if (u.pkg2 === 'surv') ids.push('smoke_self');   // v48
    return ids.filter(id => USK[id]);
  };
  const uskCd = (u, id) => { const x = cdOf(u, 'u_' + id) - turnNo; return x > 0 ? Math.ceil(x / 2) : 0; };
  function uskBlock__base(u, d, id) {
    if (!u || u.hp <= 0 || u.isLoaded || u.team !== currentTurn) return '지금은 사용할 수 없습니다.';
    if (suppState(u) === 2 && !d.retreat) return '고착 상태에서는 사용할 수 없습니다.';   // v128: retreat works while pinned
    if (uskCd(u, id) > 0) return `쿨다운 ${uskCd(u, id)}턴 남음`;
    if (mun[u.team] < munFor(u, d)) return '뮤니션이 부족합니다.';
    if (d.act && u.hasAttacked) return '이미 공격 행동을 사용했습니다.';
    if (d.act && u.gunDisabled) return '주포 고장 상태입니다.';
    if (d.still && u.hasMoved) return '이동한 턴에는 설치가 안 되어 사용할 수 없습니다.';
    if (d.am && u.ammo < d.am) return '탄약이 부족합니다.';
    if (d.ok) { const e = d.ok(u); if (e) return e; }
    return '';
  }
  const USKC = { cur: null };
  function uskEnd__base() {
    actionMode = null; activeActor = null; USKC.cur = null; guideBanner.style.display = 'none';
    updateUnitInfoPanel(selectedUnit, selectedUnit ? getTerrain(selectedUnit.c, selectedUnit.r) : null); render();
  }
  function uskPay__base(u, d, id, msg) {
    mun[u.team] -= munFor(u, d); setCd(u, 'u_' + id, cdFor(u, d));
    if (d.act) u.hasAttacked = true;
    if (d.am) u.ammo -= d.am;
    if (d.b) (u.buff = u.buff || {})[d.b] = d.dur + (d.b === 'camo' ? vetV(u).camoDur : 0);
    addLog(`${d.ico} [${nm3(d, u.team)}] ${u.className} — ${msg}`, 'supply');
    addVeterancyExp(u, 2);
    uskEnd(); updateGoldUI(); updateVision(); render();
  }
  function useUsk(uid, id) {
    const u = uById(uid), d = USK[id]; if (!u || !d) return;
    if (actionMode === 'usk' && USKC.cur && USKC.cur.id === id && USKC.cur.u === u) { uskEnd(); return; }
    if (actionMode === 'sk') skEnd(); else if (actionMode === 'usk') uskEnd();
    const why = uskBlock(u, d, id); if (why) { toast(why); return; }
    if (d.t === 'self') {
      const msg = d.run(u); if (!msg) return;
      uskPay(u, d, id, msg); return;
    }
    const rng = rngOf(u, d);
    USKC.cur = { u, id, d, rng }; actionMode = 'usk'; activeActor = u;
    hint2(`${d.ico} ${nm3(d, u.team)}: 대상을 탭하세요 (사거리 ${rng}) · 시전자 탭=취소`);
    updateUnitInfoPanel(u, getTerrain(u.c, u.r)); render();
  }

  // ---------- 포격 착탄 (스킬 포격은 자체 위력) ----------
  
  /* runStrikes: layer moved to js/chains/runStrikes.js */

