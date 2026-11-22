  // ══════════════════════════════════════════════════════════════
  // [19] v202 — game shell (out-of-game flow + command HUD additions), ported from the v143 shell onto v201
  //     · always the last section before [18] boot, so its wrappers are the outermost layer
  //     · title lobby → match setup → briefing → play → turn handoff curtain → after action report
  //     · combat log viewer, idle-unit cycling, unit/building roster drawer, tabbed pause menu, field manual
  //     · auto-save / continue (localStorage), synthesized Web Audio SFX
  //     · wrappers added here (outermost): addLog, resetGame, updateVision, vmCheckWinner, render
  //     · one extra endTurnBtn listener, registered last: runs only when the turn really changed hands
  // ══════════════════════════════════════════════════════════════
  const GAME_VERSION = 'v%%VERSION%%';   // filled in by build.js from VERSION
  const SH_VERSION = GAME_VERSION;
  const SH_TEAM = { blue: '연합군', red: '추축군' };
  // maps the v201 build ships with; `modes` lists the win modes each map supports (the first one is the default)
  const SH_MAPS = [
    { id: 'skirmish', name: '교전 1대1', sub: '소규모 교전 · 전 티어 건물', size: '22×14', grp: 'op', modes: ['capture', 'annihilation'] },
    { id: 'faymonville', name: 'Faymonville', sub: '영역 · 보급선', size: '48×48', grp: 'op', modes: ['capture'] }
    // reserved: one more 1v1 map card goes here
  ];
  const SH_FUNDS = [[600, '표준', '600'], [2000, '증강', '2,000'], [3500, '중무장', '3,500'], [6000, '총력전', '6,000']];
  const SH_TICKETS = [[250, '단기전'], [350, '표준'], [500, '장기전']];
  const SH_SEASON = { winter: '겨울', summer: '여름', autumn: '가을', fall: '가을', spring: '봄' };
  const SHELL = {
    canvasFloor: true, mode: 'skirmish', inGame: false, quiet: false, pre: null, idleLast: null, panRaf: 0, hudRaf: 0, pmTab: 'match', logFilter: 'all',
    cfg: { map: 'skirmish', mode: 'capture', roundCap: 0, funds: 600, tickets: 350, cpBonus: false, fog: true, late: { mp: 40, mun: 10, fuel: 0 }, names: { blue: '', red: '' } },
    log: [], seen: new Map()
  };
  const shStore = {
    get(k, d) { try { const v = localStorage.getItem('coh1944.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('coh1944.' + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem('coh1944.' + k); } catch (e) { } }
  };
  // second-mover bonus: paid once at game start to the side that moves second (v206 B2)
  const SH_LATE = { mp: { n: '맨파', step: 10, max: 200 }, mun: { n: '뮤니', step: 5, max: 100 }, fuel: { n: '기름', step: 5, max: 100 } };
  const shLate = o => { const r = {}, d = { mp: 40, mun: 10, fuel: 0 }; for (const k in SH_LATE) { const v = o && Number.isFinite(+o[k]) ? Math.round(+o[k]) : d[k]; r[k] = Math.max(0, Math.min(SH_LATE[k].max, v)); } return r; };
  const shEl = id => document.getElementById(id);
  const shEsc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const shText = html => { const d = document.createElement('div'); d.innerHTML = html; return d.textContent || ''; };
  const shName = tm => (SHELL.cfg.names[tm] || '').trim();
  
  const shRound = () => 'R' + String(roundCount).padStart(2, '0');
  { const c = shStore.get('cfg', null); if (c && typeof c === 'object') { Object.assign(SHELL.cfg, c); SHELL.cfg.names = Object.assign({ blue: '', red: '' }, c.names || {}); } SHELL.cfg.late = shLate(SHELL.cfg.late); }
  // a map is usable only when the game's own selector offers it (v201 removed langres, sector and the test maps)
  const shMapOk = id => SH_MAPS.some(m => m.id === id) && [...mapSelect.options].some(o => o.value === id);
  if (!shMapOk(SHELL.cfg.map)) SHELL.cfg.map = 'skirmish';

  // ---------- synthesized SFX (Web Audio; created on the first user gesture) ----------
  const SFX = { ctx: null, out: null, amb: null, ambGain: null, noise: null, last: 0, vol: Object.assign({ sfx: 70, amb: 30 }, shStore.get('audio', {})) };
  function sfxInit() {
    if (SFX.ctx) { if (SFX.ctx.state === 'suspended') SFX.ctx.resume(); return SFX.ctx; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    try {
      const a = SFX.ctx = new AC(); SFX.out = a.createGain(); SFX.out.connect(a.destination);
      const n = SFX.noise = a.createBuffer(1, a.sampleRate, a.sampleRate), d = n.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      // ambience: low wind, slow swell
      const src = a.createBufferSource(); src.buffer = n; src.loop = true;
      const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 320; lp.Q.value = .4;
      const g = SFX.ambGain = a.createGain(), lfo = a.createOscillator(), lg = a.createGain(); lfo.frequency.value = .07; lg.gain.value = 110;
      lfo.connect(lg); lg.connect(lp.frequency); src.connect(lp); lp.connect(g); g.connect(a.destination); src.start(); lfo.start();
      sfxVol(); return a;
    } catch (e) { SFX.ctx = null; return null; }
  }
  function sfxVol() { if (!SFX.ctx) return; SFX.out.gain.value = SFX.vol.sfx / 100; SFX.ambGain.gain.value = SFX.vol.amb / 100 * .22; }
  function sfxTone(type, f0, f1, dur, vol, delay = 0) {
    const a = SFX.ctx, t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain(); o.type = type;
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0008, t + dur); o.connect(g); g.connect(SFX.out); o.start(t); o.stop(t + dur + .02);
  }
  function sfxNoise(ftype, freq, dur, vol, delay = 0) {
    const a = SFX.ctx, t = a.currentTime + delay, s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); s.buffer = SFX.noise; f.type = ftype; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0008, t + dur); s.connect(f); f.connect(g); g.connect(SFX.out); s.start(t, Math.random() * .5, dur + .05);
  }
  function sfx(name) {
    if (!SFX.ctx || SFX.vol.sfx <= 0 || SFX.ctx.state !== 'running') return;
    const now = performance.now(); if (name !== 'click' && now - SFX.last < 70) return; if (name !== 'click') SFX.last = now;
    try {
      if (name === 'click') sfxTone('square', 880, 520, .045, .07);
      else if (name === 'shot') { sfxNoise('highpass', 1400, .11, .35); sfxNoise('bandpass', 700, .16, .2, .02); }
      else if (name === 'burst') { for (let i = 0; i < 4; i++) sfxNoise('highpass', 1600, .06, .26, i * .065); }
      else if (name === 'cannon') { sfxNoise('lowpass', 520, .38, .7); sfxTone('sine', 110, 38, .34, .6); }
      else if (name === 'boom') { sfxNoise('lowpass', 260, .85, .9); sfxTone('sine', 70, 28, .7, .7); sfxNoise('bandpass', 1200, .12, .18); }
      else if (name === 'flame') sfxNoise('bandpass', 900, .55, .28);
      else if (name === 'chime') { sfxTone('sine', 660, 660, .22, .22); sfxTone('sine', 990, 990, .34, .2, .12); }
      else if (name === 'turn') { sfxTone('sine', 150, 60, .2, .5); sfxTone('sine', 150, 60, .26, .5, .2); sfxNoise('lowpass', 300, .1, .2); }
      else if (name === 'win') [523, 659, 784, 1047].forEach((f, i) => sfxTone('triangle', f, f, .5, .2, i * .14));
    } catch (e) { }
  }
  function sfxFromLog(msg, kind) {
    if (SHELL.quiet || !SHELL.inGame) return;
    if (kind === 'artillery' || /포격|착탄|폭발|파편/.test(msg)) sfx('boom');
    else if (kind === 'flame') sfx('flame');
    else if (kind === 'crit' && /관통|격파|파괴|cripple/i.test(msg)) sfx('cannon');
    else if (/Point capt|거점 유|완공/.test(msg)) sfx('chime');
    else if (/MG|제압/.test(msg) && /\[-\d/.test(msg)) sfx('burst');
    else if (kind === 'sniper' || kind === 'counter' || /\[-\d/.test(msg)) sfx('shot');
  }
  document.addEventListener('pointerdown', () => sfxInit(), { capture: true, passive: true });
  document.addEventListener('click', e => { if (e.target.closest && e.target.closest('button,.tile,[role="button"]')) sfx('click'); }, true);

  // ---------- structured combat log + unit ledger (wraps addLog) ----------
  function shTrack() { for (const u of units) if (!SHELL.seen.has(u.id)) SHELL.seen.set(u.id, { team: u.team, key: u.key }); }
  { const o = addLog;
    addLog = function (msg, kind) {
      if (!SHELL.quiet) {
        SHELL.log.push({ r: roundCount, t: currentTurn, k: kind || 'normal', m: String(msg) });
        if (SHELL.log.length > 700) SHELL.log.splice(0, 150);
        shTrack(); sfxFromLog(String(msg), kind);
      }
      return o.apply(this, arguments);
    }; }
  const SH_COMBAT_KINDS = { crit: 1, flame: 1, sniper: 1, artillery: 1, counter: 1 };
  const shIsCombat = e => !!SH_COMBAT_KINDS[e.k] || /\[-\d|HP\]|착탄|폭발|파괴|격파|고착|capt|neutral|VICTORY|Victory Meter|cripple/i.test(e.m);
  // pass & play with fog: a commander sees everything logged on their own turns, but only combat results from the opponent's turns
  const shLogVisible = (e, viewer) => !(SHELL.mode === 'hotseat' && SHELL.cfg.fog && !vm.winner) || e.t === viewer || shIsCombat(e);
  function shLogRender() {
    const box = shEl('pm-log'); if (!box) return;
    const V = currentTurn, rows = SHELL.log.filter(e => shLogVisible(e, V) && (SHELL.logFilter === 'all' || shIsCombat(e)));
    let html = '', key = '';
    rows.forEach(e => {
      const k = e.r + e.t; if (k !== key) { key = k; html += `<div class="hd ${e.t}"><span>R${String(e.r).padStart(2, '0')}</span><span>${SH_TEAM[e.t]} 턴</span></div>`; }
      html += `<div class="${e.k !== 'normal' ? 'log-' + e.k : ''}">› ${e.m}</div>`;
    });
    box.innerHTML = html || '<div class="none">기록된 전투 내역이 없습니다.</div>';
    box.scrollTop = box.scrollHeight;
    document.querySelectorAll('#pm-logbar .sh-chip').forEach(b => b.classList.toggle('on', b.dataset.f === SHELL.logFilter));
  }

  // ---------- DOM ----------
  shEl('app').insertAdjacentHTML('beforeend', `
  <button id="idle-btn" aria-label="미행동 유닛으로 이동">${ico('cycle')}<span>대기</span><b>0</b></button>
  <div id="sh-pb" role="status" aria-live="polite"><i></i><span>전장 준비 중</span></div>
  <button id="undo-btn" aria-label="이동 되돌리기"><span class="ar">↶</span><span>이동 취소</span></button>
  <button id="roster-tab" aria-label="부대 목록">부대<b>0</b></button>
  <div id="roster-panel" role="dialog" aria-label="부대 목록"><div class="ro-head"><span>부대 현황</span><button aria-label="닫기" data-ro-close="1">✕</button></div><div class="ro-list" id="ro-list"></div></div>
  <div id="turn-flash" aria-hidden="true"></div>
  <div id="lobby-screen" role="dialog" aria-label="타이틀">
    <div class="lb-main">
      <div class="lb-emblem"><b>BURNING FRONT</b><i>TACTICAL CONSOLE</i></div>
      <button class="sh-btn brass" id="lb-skirmish">${ico('swords')}<span>교전 · 작전<small>한 화면에서 양 진영을 지휘</small></span></button>
      <button class="sh-btn" id="lb-hotseat">${ico('squad')}<span>패스 앤 플레이<small>기기를 넘겨 가며 2인 대전 · 턴 가림막</small></span></button>
      <button class="sh-btn" id="lb-continue" disabled>${ico('fwd')}<span>이어하기<small id="lb-continue-sub">저장된 작전 없음</small></span></button>
    </div>
    <div class="lb-util">
      <button class="sh-btn" id="lb-manual" aria-label="야전 교범">${ico('clip')}야전 교범</button>
      <button class="sh-btn sq" id="lb-settings" aria-label="설정">${ico('gear')}</button>
      <button class="sh-btn sq" id="lb-info" aria-label="정보">${ico('info')}</button>
    </div>
    <div class="lb-foot">${SH_VERSION} · 가로 화면 전용</div>
  </div>
  <div id="setup-screen" role="dialog" aria-label="작전 설정">
    <div class="su-head"><button class="sh-btn" id="su-back" aria-label="뒤로">‹</button><b>OPERATION SETUP · 작전 설정</b><small id="su-mode"></small></div>
    <div class="su-body">
      <div class="su-col scroll" id="su-maps"></div>
      <div class="su-col">
        <div class="su-prev"><canvas id="su-cv"></canvas><span class="stamp" id="su-stamp"></span></div>
        <div class="su-info"><b id="su-title"></b><small id="su-sub"></small><div class="su-tags" id="su-tags"></div></div>
      </div>
      <div class="su-col">
        <div class="su-scroll">
        <div class="su-vs">
          <div class="su-side blue"><span class="nm"><i class="sh-fl blue"></i><span id="su-nm-blue"></span></span><input id="su-name-blue" maxlength="14" placeholder="지휘관 이름" aria-label="연합군 지휘관 이름"></div>
          <i>VS</i>
          <div class="su-side red"><span class="nm"><i class="sh-fl red"></i><span id="su-nm-red"></span></span><input id="su-name-red" maxlength="14" placeholder="지휘관 이름" aria-label="추축군 지휘관 이름"></div>
        </div>
        <div class="su-rule"><label>시작 자원</label><div class="su-seg" id="su-funds"></div></div>
        <div class="su-rule"><label>승리 방식</label><div class="su-seg" id="su-win"></div></div>
        <div class="su-rule" id="su-row-tickets"><label>승리 티켓</label><div class="su-seg" id="su-tickets"></div></div>
        <div class="su-rule" id="su-row-cap"><label>라운드<br>제한</label><div class="su-seg" id="su-cap"></div></div>
        <div class="su-rule"><label>CP 거점<br>보너스</label><div class="su-seg" id="su-cp"><button class="sh-chip" data-v="off">꺼짐</button><button class="sh-chip" data-v="on">켜짐<small>5턴 보유 시 +1</small></button></div></div>
        <div class="su-rule"><label>전장의 안개</label><div class="su-seg" id="su-fog"><button class="sh-chip" data-v="on">켜짐</button><button class="sh-chip" data-v="off">꺼짐<small>전체 공개</small></button></div></div>
        <div class="su-rule su-late-row"><label>후공<br>보너스</label><div class="su-late" id="su-late">${Object.keys(SH_LATE).map(k => `<div class="st" data-k="${k}"><span>${SH_LATE[k].n}</span><button type="button" data-d="-1" aria-label="${SH_LATE[k].n} 감소">−</button><output></output><button type="button" data-d="1" aria-label="${SH_LATE[k].n} 증가">+</button></div>`).join('')}<small>후공 진영이 시작할 때 한 번 받습니다</small></div></div>
        </div>
        <button class="sh-btn brass su-go" id="su-go">브리핑으로 ▶</button>
      </div>
    </div>
  </div>
  <div id="turn-curtain" role="dialog" aria-label="턴 인계"><div class="tc-card" id="tc-card">
    <i class="sh-fl wave" id="tc-flag"></i>
    <div class="tc-pass" id="tc-pass"></div>
    <div class="tc-title" id="tc-title"></div>
    <div class="tc-digest" id="tc-digest"></div>
    <button class="sh-btn brass" id="tc-go">▶ 지휘권 인수 · 턴 시작</button>
  </div></div>
  <div id="aar-sheet" role="dialog" aria-label="작전 결과 보고"><div class="aar-card">
    <div class="aar-head"><i class="sh-fl wave" id="aar-flag"></i><div><b id="aar-title">VICTORY</b><small id="aar-sub"></small></div><div class="rd"><b id="aar-round"></b><br>ROUNDS</div></div>
    <div class="aar-body"><table class="aar-tab" id="aar-tab"></table><div class="aar-mvp" id="aar-mvp"></div></div>
    <div class="aar-foot"><button class="sh-btn" id="aar-map">전장 보기</button><button class="sh-btn" id="aar-lobby">로비로</button><button class="sh-btn brass" id="aar-again">다시 하기</button></div>
  </div></div>
  <div id="shell-modal" class="sheet-back" role="dialog"><div class="sheet-card"><div class="set-head"><span id="sm-title"></span><button class="icon-btn" aria-label="닫기" id="sm-close">✕</button></div><div class="fm-tabs" id="sm-tabs"></div><div class="set-body fm-body" id="sm-body"></div></div></div>`);
  shEl('brief-btn').insertAdjacentHTML('afterend', `<button id="log-btn" class="icon-btn" aria-label="전투 기록">${ico('clip')}</button>`);
  const lobbyEl = shEl('lobby-screen'), setupEl = shEl('setup-screen'), curtainEl = shEl('turn-curtain'), aarEl = shEl('aar-sheet'), rosterEl = shEl('roster-panel'), shApp = shEl('app');

  // ---------- camera / selection helpers ----------
  function shCamTo(c, r, anim = true) {
    const p = getHexCenter(c, r), sx = camX, sy = camY, t0 = performance.now(), tx = p.x - VIEW_W / 2, ty = p.y - VIEW_H / 2;
    (function step(now) {
      const k = anim && !reduceMotion() ? Math.min(1, (now - t0) / 320) : 1, e = k * (2 - k);
      camX = sx + (tx - sx) * e; camY = sy + (ty - sy) * e; clampCam(); render();
      if (k < 1) requestAnimationFrame(step);
    })(performance.now());
  }
  // ---------- animation sync (v173-v183 play moves and shots after the rules have already resolved them) ----------
  
  function shSettle() {   // jump every running move / shot animation to its end state; the game state is already final
    try { if (V173.anim) v173End(); } catch (e) { }
    try { v174Skip(); V174.busyUntil = 0; } catch (e) { }
  }
  function shClearPending() {   // two-tap move proposal (v175), turn proposal (v185) and the rotate handle
    try { V175.pend = null; } catch (e) { }
    try { V185.pend = null; V185.rot = null; } catch (e) { }
    window.rotUnit = null;
  }
  function shClearModes() {
    if (isAwaitingFacing) return false;   // a move is waiting for its facing: let the player finish it
    if (actionMode === 'sk') skEnd(); else if (actionMode === 'usk') uskEnd(); else if (actionMode) cancelAction();
    clearAttackPreview(); actionMode = null; activeActor = null; pendingDeployKey = null; guideBanner.style.display = 'none';
    return true;
  }
  function shFocusUnit(u) {
    if (!u) return;
    if (u.isLoaded) { const car = units.find(x => x.hp > 0 && x.cargo && x.cargo.includes(u)); if (car) u = car; }
    if (!shClearModes()) { toast('방향 지정을 먼저 끝내 주세요'); return; }
    shSettle(); shClearPending();
    selBld = null; validMoves = []; validAttacks = [];
    if (u.team === currentTurn) { selectedUnit = u; updateActionTiles(u); } else selectedUnit = null;
    updateUnitInfoPanel(u, getTerrain(u.c, u.r)); shCamTo(u.c, u.r);
  }
  function shFocusBuilding(b) {
    if (!b || !shClearModes()) return;
    shSettle(); shClearPending(); selectedUnit = null; validMoves = []; validAttacks = []; selBld = b;
    updateUnitInfoPanel(b, getTerrain(b.c, b.r)); shCamTo(b.c, b.r);
  }

  // ---------- idle-unit cycling + roster drawer ----------
  const shIdle = () => units.filter(u => u.team === currentTurn && u.hp > 0 && !u.isLoaded && !u.hasMoved && !u.hasAttacked);
  function shHudSync() {
    SHELL.hudRaf = 0; if (!SHELL.inGame) return;
    const n = vm.winner ? 0 : shIdle().length, ib = shEl('idle-btn');
    if (ib._n !== n) { ib._n = n; ib.lastElementChild.textContent = n; ib.classList.toggle('on', n > 0); }
    const m = units.filter(u => u.team === currentTurn && u.hp > 0).length, rt = shEl('roster-tab');
    if (rt._n !== m) { rt._n = m; rt.lastElementChild.textContent = m; }
    if (rosterEl.classList.contains('open')) shRosterRender();
    if (SHELL.undo && SHELL.undo.u !== selectedUnit) SHELL.undo = null;   // selecting another unit ends the undo window
    const uk = shUndoOk(), ub = shEl('undo-btn'); if (ub._on !== uk) { ub._on = uk; ub.classList.toggle('on', uk); }
  }
  {  /* render: layer moved to js/chains/render.js */ }

  // ---------- Undo Move: one step, only while nothing has been learned from the move ----------
  const shVisFoes = tm => new Set(units.filter(e => e.team !== tm && e.hp > 0 && !e.isLoaded && visibleHexes.has(e.c + ',' + e.r)).map(e => e.id));
  function shUndoTake(u, kind, stopped) {
    if (!u || u.team !== currentTurn) return null;
    return { u, kind, stopped: !!stopped, turnNo, logN: SHELL.log.length, mines: mines.length, foes: shVisFoes(u.team),
      s: { c: u.c, r: u.r, facingAngle: u.facingAngle, remainingMove: u.remainingMove, hasMoved: u.hasMoved, fuel: u.fuel, lastMoveTurn: u.lastMoveTurn, hp: u.hp, suppression: u.suppression, hasAttacked: u.hasAttacked,
        tur: u._tur ? Object.assign({}, u._tur) : null } };
  }
  function shUndoOk() {
    const U = SHELL.undo; if (!U || !SHELL.inGame || vm.winner) return false;
    const u = U.u, S = U.s;
    if (U.stopped || u.hp <= 0 || u.team !== currentTurn || U.turnNo !== turnNo || selectedUnit !== u) return false;
    if (u.hp !== S.hp || u.suppression !== S.suppression || u.hasAttacked !== S.hasAttacked || mines.length !== U.mines || u.isLoaded) return false;
    if (SHELL.log.length > U.logN + 1) return false;   // the move's own line only: reaction fire, a mine, an attack or a skill all write more
    for (const id of shVisFoes(u.team)) if (!U.foes.has(id)) return false;   // a newly seen enemy makes the move final
    return u.c !== S.c || u.r !== S.r || u.facingAngle !== S.facingAngle;
  }
  function shUndo() {
    if (!shUndoOk()) { SHELL.undo = null; shHudSync(); return; }
    shSettle(); shClearPending();
    const U = SHELL.undo, u = U.u, S = U.s; SHELL.undo = null;
    Object.assign(u, { c: S.c, r: S.r, facingAngle: S.facingAngle, remainingMove: S.remainingMove, hasMoved: S.hasMoved, fuel: S.fuel, lastMoveTurn: S.lastMoveTurn });
    if (S.tur) u._tur = S.tur; else delete u._tur;
    addLog(`↶ [이동 취소] ${u.className}`, 'move');
    validMoves = []; validAttacks = []; selectedUnit = u;
    updateVision(); updateActionTiles(u); updateUnitInfoPanel(u, getTerrain(u.c, u.r)); render(); buzz(12);
  }
  {    // called only for a player's path move, just before the move commits
    /* v173Plan: layer moved to js/chains/v173Plan.js */ }
  {    // the in-place turn (propose / confirm)
    /* v185Confirm: layer moved to js/chains/v185Confirm.js */ }
  shEl('undo-btn').addEventListener('click', shUndo);
  // end turn as one icon button: the aria-label carries the team, round and the "units still idle" warning
  { const sync = () => {
      endTurnBtn.dataset.team = currentTurn; endTurnBtn.dataset.round = turnRound.textContent;
      const armed = endTurnBtn.classList.contains('armed');
      endTurnBtn.setAttribute('aria-label', armed ? endTurnBtn.textContent : `턴 종료 — ${turnText.textContent} ${turnRound.textContent}`);
    };
    new MutationObserver(sync).observe(turnIndicator, { subtree: true, childList: true, characterData: true, attributes: true });
    new MutationObserver(sync).observe(endTurnBtn, { childList: true, attributes: true, attributeFilter: ['class'] });
    sync(); }
  shEl('idle-btn').addEventListener('click', () => {
    const l = shIdle(); if (!l.length) return;
    const i = l.findIndex(u => u.id === SHELL.idleLast), u = l[(i + 1) % l.length];
    SHELL.idleLast = u.id; shRosterOpen(false); shFocusUnit(u); buzz(12);
  });
  function shPortrait(u) { let url = null; try { url = v101Portrait(u.key, u.team); } catch (e) { } return url ? `<span class="pt" style="background-image:url('${url}')"></span>` : `<span class="pt">${shEsc(u.code || '')}</span>`; }
  function shRosterRender() {
    const tm = currentTurn, us = units.filter(u => u.team === tm && u.hp > 0), bs = buildings.filter(b => b.team === tm && b.hp > 0);
    const sig = us.map(u => [u.id, Math.round(u.hp), u.hasMoved ? 1 : 0, u.hasAttacked ? 1 : 0, u.suppression || 0, u.isLoaded ? 1 : 0, u.remainingMove].join(':')).join('|') + '#' + bs.map(b => b.id + ':' + Math.round(b.hp) + ':' + (b.uc ? 1 : 0)).join('|');
    const list = shEl('ro-list'); if (list._sig === sig) return; list._sig = sig;
    const hpBar = (hp, max) => { const p = Math.max(0, Math.min(100, 100 * hp / max)); return `<span class="hp"><i class="${p < 34 ? 'low' : p < 67 ? 'mid' : ''}" style="width:${p}%"></i></span>`; };
    const uRow = u => {
      const st = suppState(u), acted = u.hasMoved && u.hasAttacked, tags = [];
      if (u.isLoaded) tags.push('<span>탑승 중</span>');
      else if (!u.hasMoved && !u.hasAttacked) tags.push('<span class="rdy">대기</span>');
      else tags.push(`<span>${u.hasMoved ? '이동 ✓' : '이동 ' + (u.remainingMove || 0)}${u.hasAttacked ? ' · 사격 ✓' : ''}</span>`);
      if (st === 2) tags.push('<span class="pin">고착</span>'); else if (st === 1) tags.push('<span class="sup">제압</span>');
      return `<button class="ro-row${acted ? ' done' : ''}" data-u="${shEsc(u.id)}">${shPortrait(u)}<span><span class="nm">${shEsc(u.className)}${u.rank ? ' ' + '★'.repeat(u.rank) : ''}</span>${hpBar(u.hp, u.maxHp)}</span><span class="st">${tags.join('')}</span></button>`;
    };
    const bRow = b => `<button class="ro-row" data-b="${shEsc(b.id)}"><span class="pt">${shEsc((BLD[b.type] || {}).s || '■')}</span><span><span class="nm">${shEsc(b.className || b.name || b.type)}</span>${hpBar(b.hp, b.maxHp)}</span><span class="st">${b.uc ? '<span class="sup">건설 중</span>' : b.crippled ? '<span class="pin">마비</span>' : `<span>${Math.round(b.hp)}/${b.maxHp}</span>`}</span></button>`;
    list.innerHTML = `<div class="ro-sec">유닛 ${us.length}</div>` + (us.map(uRow).join('') || '<div class="ro-empty">배치된 유닛이 없습니다</div>') + `<div class="ro-sec">건물 ${bs.length}</div>` + bs.map(bRow).join('');
  }
  function shRosterOpen(on) { rosterEl.classList.toggle('open', on); shEl('roster-tab').style.left = on ? 'min(272px,46vw)' : '0'; if (on) { supOpen(false); shEl('ro-list')._sig = null; shRosterRender(); } }
  shEl('roster-tab').addEventListener('click', () => shRosterOpen(!rosterEl.classList.contains('open')));
  rosterEl.addEventListener('click', e => {
    if (e.target.closest('[data-ro-close]')) { shRosterOpen(false); return; }
    const row = e.target.closest('.ro-row'); if (!row) return;
    shRosterOpen(false);
    if (row.dataset.u !== undefined) shFocusUnit(units.find(u => String(u.id) === row.dataset.u)); else shFocusBuilding(buildings.find(b => String(b.id) === row.dataset.b));
  });
  canvas.addEventListener('pointerdown', () => shRosterOpen(false));
  supTab.addEventListener('click', () => shRosterOpen(false));

  // ---------- turn handoff: curtain (pass & play) / flash banner (skirmish) ----------
  function shTurnLabel() { return `ROUND ${String(roundCount).padStart(2, '0')} — ${SH_TEAM[currentTurn]} 턴`; }
  function shDigest(prev, logFrom) {
    const lines = [], mine = SHELL.log.slice(logFrom).filter(e => e.t === currentTurn);
    let i = SHELL.log.length - 1, hits = 0; for (i = logFrom - 1; i >= 0; i--) { const e = SHELL.log[i]; if (e.t !== prev) break; if (shIsCombat(e)) hits++; }
    lines.push(hits ? `지난 ${SH_TEAM[prev]} 턴: 교전 기록 ${hits}건 — 전투 기록에서 확인` : `지난 ${SH_TEAM[prev]} 턴: 포착된 교전 없음`);
    const ev = mine.filter(e => !/^== \[/.test(e.m)).slice(-1)[0]; if (ev) lines.push(shText(ev.m));
    const inc = mine.filter(e => /^== \[/.test(e.m)).slice(-1)[0]; if (inc) lines.push(shText(inc.m).replace(/^==\s*|\s*==$/g, ''));
    return lines.slice(0, 3);
  }
  function shCurtainOpen(prev, logFrom) {
    const tm = currentTurn, nm = shName(tm);
    shEl('tc-card').className = 'tc-card ' + tm; shEl('tc-flag').className = 'sh-fl wave ' + tm;
    shEl('tc-pass').textContent = `기기를 ${nm ? nm + ' (' + SH_TEAM[tm] + ')' : SH_TEAM[tm] + ' 지휘관'}에게 넘겨 주세요`;
    shEl('tc-title').textContent = shTurnLabel();
    shEl('tc-digest').innerHTML = '<b>LAST TURN DIGEST</b>' + shDigest(prev, logFrom).map(l => `<span>${shEsc(l)}</span>`).join('');
    shSettle(); shClearPending(); shRosterOpen(false); supOpen(false); toastWrap.innerHTML = '';
    document.querySelectorAll('.sheet-back.open').forEach(x => x.classList.remove('open')); menuSheet.classList.remove('open');
    curtainEl.classList.add('open');
  }
  shEl('tc-go').addEventListener('click', () => { curtainEl.classList.remove('open'); centerOnBase(false); sfx('turn'); buzz(25); });
  function shFlash() {
    const el = shEl('turn-flash'); el.innerHTML = `<i class="sh-fl ${currentTurn}"></i><span>${SH_TEAM[currentTurn]} 턴</span><small>ROUND ${String(roundCount).padStart(2, '0')}</small>`;
    el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  }
  shEl('turn-flash').addEventListener('animationend', e => e.currentTarget.classList.remove('on'));
  endTurnBtn.addEventListener('click', () => { shSettle(); shClearPending(); SHELL.undo = null; SHELL.pre = { turn: currentTurn, logN: SHELL.log.length }; }, true);   // capture phase: runs before the four game listeners
  endTurnBtn.addEventListener('click', () => {   // registered last: every other end-turn listener has already run
    const pre = SHELL.pre; SHELL.pre = null;
    if (!pre || pre.turn === currentTurn || !SHELL.inGame) return;
    SHELL.idleLast = null; shTrack();
    if (shMode() === 'annihilation') vmCheckWinner();   // kills that did not call checkVictory (fire, collapse) are caught here
    if (vm.winner) return;
    shSave();
    if (SHELL.mode === 'hotseat') shCurtainOpen(pre.turn, pre.logN); else { shFlash(); sfx('turn'); }
  });

  // ---------- v206 A1: the long-press range view only paints tiles the unit can really shoot at ----------
  //   direct fire needs a clear line (the same losClear test checkElevationCombatRule applies); mortars, howitzers and rocket artillery shoot over cover
  { 
    /* fillRangeTiles: layer moved to js/chains/fillRangeTiles.js */ }

  // ---------- v206 A2: one mark per crew-weapon state, and packed crews set up by themselves when the turn ends ----------
  //   packed: yellow "packed" badge · setting up this turn: yellow tripod · set up: no mark (the unit card still says so).
  //   The red "cannot fire" badge and the orange "nofire" status icon said the same thing a second and third time, so both are gone.
  /* v167CrewMarks: layer moved to js/chains/v167CrewMarks.js */
  {    // the status icon slot skips "nofire" for crews and falls through to the ammo / fuel checks that follow it
    /* v105Status: layer moved to js/chains/v105Status.js */ }
  { const o = v158EndOwnTurn;   // runs once when a turn really ends (the "N units idle" confirm click stops before it)
    v158EndOwnTurn = function (tm) {
      const r = o.apply(this, arguments); let n = 0;
      units.forEach(u => { if (u.team === tm && u.hp > 0 && !u.isLoaded && v159Crew(u) && !v159Emplaced(u)) { u.tgl = u.tgl || {}; u.tgl.emplace = true; u.empT = -9; n++; } });
      if (n) addLog(`[자동 거치] 중화기 ${n}문이 턴 종료와 함께 거치를 마쳤습니다`, 'eng');
      return r;
    }; }

  // ---------- fog-of-war rule (setup toggle) ----------
  {  /* updateVision: layer moved to js/chains/updateVision.js */ }



  // ---------- persistent sprite cache: baked unit sprites are kept in IndexedDB between sessions ----------
  //   Baking costs ~60 ms per sprite (about 12 s for a full skirmish roster); decoding a stored PNG costs ~1 ms.
  //   Only the full-size `hi` canvas is stored; `lo` is the same 2:1 downscale the bakers make.
  const SH_SPR = { db: null, saved: new Set(), ready: null, restored: 0, ms: 0, hold: false, held: [] };
  const shSprCaches = () => [['tank', TANK_SPR], ['inf', INF_SPR], ['gun', GUN_SPR]];
  function shSprDb() {
    if (SH_SPR.db) return Promise.resolve(SH_SPR.db);
    return new Promise(res => {
      try {
        const rq = indexedDB.open('coh1944-sprites', 1);
        rq.onupgradeneeded = () => rq.result.createObjectStore('s');
        rq.onsuccess = () => { SH_SPR.db = rq.result; res(rq.result); };
        rq.onerror = () => res(null);
      } catch (e) { res(null); }
    });
  }
  const shSprPrefix = () => { TANK_SPR.ensureView(); return GAME_VERSION + '|' + TANK_SPR.sig + '|'; };
  function shSprLo(hi) {
    const lo = TankBaker.mkCanvas(hi.width / 2, hi.height / 2), g = lo.getContext('2d');
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(hi, 0, 0, lo.width, lo.height); return lo;
  }
  function shSprRestore() {
    SH_SPR.hold = true;
    return SH_SPR.ready = (async () => {
      try { await shSprLoad(); } finally {   // release the held bake timers; most of them are now cache hits
        SH_SPR.hold = false; const h = SH_SPR.held.splice(0); h.forEach(([run, ms]) => window.setTimeout(run, ms));   // `run` is not named step, so it is not counted twice
      }
    })();
  }
  async function shSprLoad() {
    {
      const t0 = performance.now(), db = await shSprDb(); if (!db) return;
      const pre = shSprPrefix(), rows = await new Promise(res => {
        const out = []; try {
          const cur = db.transaction('s').objectStore('s').openCursor(IDBKeyRange.bound(pre, pre + '￿'));
          cur.onsuccess = () => { const c = cur.result; if (c) { out.push([c.key, c.value]); c.continue(); } else res(out); };
          cur.onerror = () => res(out);
        } catch (e) { res(out); }
      });
      const map = Object.fromEntries(shSprCaches());
      INF_SPR.sig = TANK_SPR.sig; GUN_SPR.sig = TANK_SPR.sig;   // the bakers clear their cache when this differs from the view signature
      for (let i = 0; i < rows.length; i += 32) {   // decode in parallel batches
        const bms = await Promise.all(rows.slice(i, i + 32).map(([, v]) => createImageBitmap(v.blob).catch(() => null)));
        rows.slice(i, i + 32).forEach(([key, v], j) => {
          const bm = bms[j]; if (!bm) return;
          const parts = key.split('|'), name = parts[2], ck = parts.slice(3).join('|');   // key: version | view sig | cache | sprite key (which has '|' inside)
          const C = map[name]; if (!C || C.cache.has(ck)) { bm.close && bm.close(); return; }
          const hi = TankBaker.mkCanvas(bm.width, bm.height); hi.getContext('2d').drawImage(bm, 0, 0); bm.close && bm.close();
          C.cache.set(ck, Object.assign({ hi, lo: shSprLo(hi) }, v.meta || {})); SH_SPR.saved.add(key); SH_SPR.restored++;
        });
      }
      SH_SPR.ms = Math.round(performance.now() - t0);
    }
  }
  async function shSprSave() {
    const db = await shSprDb(); if (!db) return;
    const pre = shSprPrefix(), todo = [];
    for (const [name, C] of shSprCaches()) for (const [ck, e] of C.cache) {
      const key = pre + name + '|' + ck; if (SH_SPR.saved.has(key) || !e || !e.hi || !e.hi.toBlob) continue;
      const meta = {}; for (const k in e) if (k !== 'hi' && k !== 'lo' && typeof e[k] !== 'object') meta[k] = e[k];
      todo.push([key, e.hi, meta]);
    }
    for (let i = 0; i < todo.length; i += 24) {   // small batches, so a phone never stalls on encoding
      const batch = await Promise.all(todo.slice(i, i + 24).map(([key, cv, meta]) => new Promise(res => cv.toBlob(b => res(b ? [key, { blob: b, meta }] : null), 'image/png'))));
      await new Promise(res => { try { const tx = db.transaction('s', 'readwrite'), st = tx.objectStore('s'); batch.forEach(x => { if (x) { st.put(x[1], x[0]); SH_SPR.saved.add(x[0]); } }); tx.oncomplete = tx.onerror = tx.onabort = () => res(); } catch (e) { res(); } });
    }
  }


  // ---------- D3 / D5 / F4: map UI colors from tokens, display presets, text size ----------
  // The map UI writes these literals on the main canvas; each one is routed through a token, so a preset recolors the map UI.
  // Terrain and baked sprites use other colors and other canvases, and are not touched.
  const SH_CV = { '#38bdf8': '--cv-ally', '#f87171': '--cv-axis', '#fbbf24': '--cv-warn', '#facc15': '--cv-buff', '#fb923c': '--cv-orange', '#ef4444': '--cv-danger',
    '#e5e7eb': '--cv-ink', '#94a3b8': '--cv-ink2', '#cbd5e1': '--cv-ink3', '#e2c47e': '--cv-brass', '#58a6f2': '--cv-bar-ally', '#e4573f': '--cv-bar-axis' };
  const SH_CVMAP = new Map();
  function shCvSync() {
    const cs = getComputedStyle(document.documentElement); SH_CVMAP.clear();
    for (const k in SH_CV) { const v = cs.getPropertyValue(SH_CV[k]).trim(); if (v && v.toLowerCase() !== k) { SH_CVMAP.set(k, v); SH_CVMAP.set(k.toUpperCase(), v); } }
    try { V105.bar.blue = cs.getPropertyValue('--cv-bar-ally').trim() || '#58a6f2'; V105.bar.red = cs.getPropertyValue('--cv-bar-axis').trim() || '#e4573f'; } catch (e) { }
  }
  { const P = CanvasRenderingContext2D.prototype;
    for (const prop of ['fillStyle', 'strokeStyle']) {
      const d = Object.getOwnPropertyDescriptor(P, prop);
      Object.defineProperty(ctx, prop, { configurable: true, get() { return d.get.call(this); }, set(v) { d.set.call(this, (typeof v === 'string' && SH_CVMAP.size && SH_CVMAP.get(v)) || v); } });
    }
    // F3: map text uses the UI family, and never lands below 9 CSS px on screen (sizes are in world px, scaled by zoom)
    const fd = Object.getOwnPropertyDescriptor(P, 'font'), fcache = new Map();
    Object.defineProperty(ctx, 'font', { configurable: true, get() { return fd.get.call(this); }, set(v) {
      if (typeof v === 'string') {
        const z = (this.getTransform().a / (DPR || 1)) || 1, key = v + '|' + z.toFixed(3); let o = fcache.get(key);
        if (!o) {
          o = v.replace(/(^|\s)sans-serif\b/, '$1Pretendard, sans-serif');
          if (SHELL.canvasFloor) o = o.replace(/([0-9.]+)px/, (m, n) => (+n * z < 9 ? (9 / z).toFixed(2) : n) + 'px');
          if (fcache.size > 400) fcache.clear(); fcache.set(key, o);
        }
        v = o;
      }
      fd.set.call(this, v);
    } }); }
  const SH_DISP = Object.assign({ theme: 'std', text: 'std', move: 'std' }, shStore.get('display', {}));
  function shDispApply() {
    const r = document.documentElement;
    r.classList.toggle('th-bright', SH_DISP.theme === 'bright'); r.classList.toggle('th-hc', SH_DISP.theme === 'hc'); r.classList.toggle('th-coh3', SH_DISP.theme === 'coh3'); r.classList.toggle('ts-lg', SH_DISP.text === 'lg');
    shCvSync();
    document.querySelectorAll('#pm-disp .sh-chip').forEach(b => b.classList.toggle('on', SH_DISP[b.dataset.k] === b.dataset.v));
    try { vmRefreshHud(); } catch (e) { } try { sizeCanvas(); render(); } catch (e) { }
  }

  // ---------- v208: conversion — promotion (squad -> elite squad) and refit (vehicle -> better-armed variant) ----------
  //   One function swaps a unit for another in place (same id, hex, facing, veterancy, HP ratio). SH_CONV lists every allowed pair.
  //   Price: promotion = manpower difference of the two unit costs; refit = 2 x the difference of manpower and of fuel; both rounded to 5.
  //   Needs: a building that can produce the target stands · promotion: full squad · both: near own HQ (3 hexes) or outpost (2) and out of combat.
  const SH_CONV = {
    blue: { infantry: ['ranger', 'paratrooper', 'commando'].map(to => ({ to, kind: 'promo' })), transport: [{ to: 'm3gmc', kind: 'refit' }] },
    red: { infantry: ['panzergren', 'sturmtruppen', 'jager', 'fj'].map(to => ({ to, kind: 'promo' })), vehicle: [{ to: 'pzb221', kind: 'refit' }], transport: [{ to: 'stummel', kind: 'refit' }] }
  };
  const SH_CONV_ICO = { ranger: '🎯', paratrooper: '🪂', commando: '🗡', panzergren: '🛡', sturmtruppen: '⚔', jager: '🌲', fj: '🪂', m3gmc: '🔧', pzb221: '🔧', stummel: '🔧' };
  const shR5 = x => Math.max(5, Math.round(x / 5) * 5);
  function shConvCost(u, to, kind) {
    const R = UNIT_ROSTER[u.team], a = R[u.key], b = R[to];
    if (kind === 'promo') return { mp: shR5(b.cost - a.cost), fuel: 0 };
    const df = (b.fcost || 0) - (a.fcost || 0); return { mp: shR5(2 * (b.cost - a.cost)), fuel: df > 0 ? shR5(2 * df) : 0 };
  }
  function shNearBase(u) {
    return buildings.some(b => b.team === u.team && (b.type === 'hq' || b.type === 'outpost') && b.hp > 0 && !b.crippled && getDistance(b.c, b.r, u.c, u.r) <= (b.type === 'hq' ? V130.hqReinf : 2));
  }
  function shConvRows(u) { return u && u.hp > 0 && !u.type ? ((SH_CONV[u.team] || {})[u.key] || []).filter(r => UNIT_ROSTER[u.team][r.to] && !UNIT_ROSTER[u.team][r.to].retired) : []; }
  function shConvCheck(u, row) {   // -> { ok, why }
    const R = UNIT_ROSTER[u.team][row.to], c = shConvCost(u, row.to, row.kind), why = [];
    if (!buildings.some(b => b.team === u.team && canProd(b, row.to))) why.push('생산 건물 필요');
    if (row.kind === 'promo' && u.N && u.models < u.N) why.push('분대원 충원 필요 (' + u.models + '/' + u.N + ')');
    if (row.kind === 'refit' && (u.hasMoved || u.hasAttacked)) why.push('행동 전에만 가능');
    if (row.kind === 'refit' && u.cargo && u.cargo.length) why.push('탑승 인원 하차 필요');
    if (!shNearBase(u)) why.push('본부 3칸 · 전초기지 2칸 안');
    if (v140InCombat(u)) why.push('교전 중 불가');
    if (gold[u.team] < c.mp) why.push('맨파 부족');
    if (fuel[u.team] < c.fuel) why.push('기름 부족');
    return { ok: !why.length, why, cost: c, R };
  }
  function convertUnit(u, to, kind) {
    const R = UNIT_ROSTER[u.team][to], f = createUnitFromKey(u.id, u.team, to, u.c, u.r, u.facingAngle);
    const hpR = u.hp / Math.max(1, u.maxHp), amR = u.maxAmmo > 0 ? u.ammo / u.maxAmmo : 1, pkg = u.pkg;
    f.rank = u.rank || 0; f.xp = u.xp || 0; f.kills = u.kills || 0; f.suppression = u.suppression || 0; f.hasMoved = u.hasMoved; f.hasAttacked = u.hasAttacked;
    f.remainingMove = Math.min(u.remainingMove, f.moveDist); f.counterAttacksLeft = Math.min(u.counterAttacksLeft, f.counterAttacksLeft); f.engaged = u.engaged; f.docDone = u.docDone;
    if (f.rank > 0) { const lg = addLog; addLog = function () { }; try { applyVeterancyBonus(f, f.rank); } finally { addLog = lg; } }   // same stars, no "promoted!" log line
    if (kind === 'promo') f.hp = hpCap(f); else f.hp = Math.max(1, Math.round(f.maxHp * hpR));
    if (f.maxAmmo > 0) f.ammo = Math.round(f.maxAmmo * amR);
    if (pkg && PKG[pkg] && ((PKG[pkg].keys[u.team] || []).includes(to))) applyPkg(f, pkg);   // equipment stays if the new unit can carry it
    if (kind === 'refit') { f.hasMoved = true; f.hasAttacked = true; f.remainingMove = 0; }
    Object.keys(u).forEach(k => { delete u[k]; }); Object.assign(u, f);
    try { SHELL.seen.set(u.id, { team: u.team, key: u.key }); SHELL.undo = null; } catch (e) { }
    return u;
  }
  function shConvert(id, to) {
    const u = units.find(x => String(x.id) === String(id)); if (!u || u.team !== currentTurn) return;
    const row = shConvRows(u).find(r => r.to === to); if (!row) return;
    const ck = shConvCheck(u, row); if (!ck.ok) { toast(ck.why[0]); return; }
    const from = u.uniqueName; gold[u.team] -= ck.cost.mp; fuel[u.team] -= ck.cost.fuel;
    convertUnit(u, to, row.kind);
    addLog(`${row.kind === 'promo' ? '⬆ [병종 승급]' : '🔧 [차량 개조]'} ${from} → ${u.uniqueName} (-${ck.cost.mp}G${ck.cost.fuel ? ' -' + ck.cost.fuel + '⛽' : ''})`, 'supply');
    try { v140IntAll(); } catch (e) { } updateGoldUI(); try { updateBuildMenu(); } catch (e) { } selectedUnit = u; updateUnitInfoPanel(u, getTerrain(u.c, u.r)); render();
  }
  {  /* rebuildHud: layer moved to js/chains/rebuildHud.js */ }
  function shConvInject(u, rows) {
      
      const cks = rows.map(r => [r, shConvCheck(u, r)]), live = cks.filter(([r]) => buildings.some(b => b.team === u.team && canProd(b, r.to)));
      const money = c => '💰' + c.mp + (c.fuel ? ' ⛽' + c.fuel : '');
      const html = (live.length ? live : cks.slice(0, 1)).map(([r, ck]) => {
        const nm = ck.R.uniqueName, tag = SH_CONV_ICO[r.to] || (r.kind === 'promo' ? '⬆' : '🔧'), verb = r.kind === 'promo' ? '승급' : '개조';
        const desc = (r.kind === 'promo' ? '베테랑 유지 · 분대 정예화' : '같은 차체 · 무장 강화 (행동 소모)') + ' · ' + money(ck.cost);
        return `<button class="btn-action" data-shc="${money(ck.cost)}" ${ck.ok ? '' : 'style="opacity:.55"'} onclick="shConvert('${u.id}','${r.to}')" title="${verb} ${nm} — ${desc}"><span>${tag} <strong>${verb} ${nm}</strong><br><small>${ck.ok ? desc : ck.why.join(' · ')}</small></span></button>`;
      }).join('');
      specialActionsEl.insertAdjacentHTML('beforeend', html);
  }

  {  /* tileOf: layer moved to js/chains/tileOf.js */ }

  // ---------- v207 C1/C2: weight classes. Every mover has an ms-per-hex, a turn rate and a total-time cap by weight:
  //   infantry (quick, pivots in place) · crew weapons by size (MG / mortar & AT gun / howitzer & flak) · wheeled light / medium · tank medium / heavy.
  //   The v173 animation reads V173.msHex[kind], turnDps* and maxMs when it starts, so the shell sets them per unit for the duration of the call.
  const SH_CLS = {
    inf:    { ms: 200, dps: 540, cap: 1500 },
    crewS:  { ms: 240, dps: 300, cap: 2000 }, crewM: { ms: 280, dps: 240, cap: 2200 }, crewL: { ms: 340, dps: 180, cap: 2400 },
    wheelL: { ms: 130, dps: 270, cap: 1500 }, wheelM: { ms: 170, dps: 220, cap: 1700 },
    trackM: { ms: 230, dps: 150, cap: 2200 }, trackH: { ms: 300, dps: 100, cap: 2600 }
  };
  function shClass(u) {
    const k = v173Kind(u);
    if (k === 'inf') return SH_CLS.inf;
    if (k === 'crew') return u.hw === 'L' ? SH_CLS.crewL : u.hw === 'M' ? SH_CLS.crewM : SH_CLS.crewS;
    if (k === 'wheel') return (u.maxHp || 0) <= 90 ? SH_CLS.wheelL : SH_CLS.wheelM;
    return (u.maxHp || 0) >= 288 ? SH_CLS.trackH : SH_CLS.trackM;
  }
  function shWithClass(u, fn) {
    const k = v173Kind(u), c = shClass(u), f = SH_DISP.move === 'fast' ? .6 : 1, keep = [V173.msHex[k], V173.turnDps, V173.turnDpsHeavy, V173.turnDpsCrew, V173.maxMs];
    V173.msHex[k] = c.ms * f; V173.turnDps = V173.turnDpsHeavy = V173.turnDpsCrew = c.dps / f; V173.maxMs = c.cap * f;
    try { return fn(); } finally { V173.msHex[k] = keep[0]; V173.turnDps = keep[1]; V173.turnDpsHeavy = keep[2]; V173.turnDpsCrew = keep[3]; V173.maxMs = keep[4]; }
  }
  {  /* v173Begin: layer moved to js/chains/v173Begin.js */ }
  {  /* v180TurnMs: layer moved to js/chains/v180TurnMs.js */ }
  // infantry sprites are baked per 15 deg on first use: while a squad pivots it draws on 30 deg steps so a turn bakes at most half as many frames
  {  /* v173Snap: layer moved to js/chains/v173Snap.js */ }

  // ---------- pre-bake: sprites, crew guns, houses and ground tiles are baked lazily, one per 16-40 ms timer.
  //   Behind the briefing the shell tours the map once (so every unit on it queues its bake) and runs those
  //   timers back to back, so the first turn is not played through the bake. Every bake timer is named `step`.
  const SH_PB = { on: false, pending: 0, max: 1, t0: 0, raf: 0, quiet: 0, ms: 0 };
  const shPbPost = (() => { const ch = new MessageChannel(), q = []; ch.port1.onmessage = () => { const f = q.shift(); if (f) f(); }; return f => { q.push(f); ch.port2.postMessage(0); }; })();   // a 0 ms task without the 4 ms timer clamp
  { const st = window.setTimeout.bind(window);
    window.setTimeout = function (fn, ms, ...a) {
      if (typeof fn !== 'function' || fn.name !== 'step') return st(fn, ms, ...a);
      SH_PB.pending++; const run = () => { SH_PB.pending--; fn(...a); };
      if (SH_SPR.hold) { SH_SPR.held.push([run, ms]); return 0; }   // restoring stored sprites: bakes wait, most become cache hits
      if (SH_PB.on) { shPbPost(run); return 0; }
      return st(run, ms);
    }; }
  const shPbLeft = () => { let n = SH_PB.pending; try { n += V133.q.length + V146.q.length; } catch (e) { } try { n += v99G.dirty ? v99G.dirty.reduce((s, x) => s + x, 0) : 0; } catch (e) { } return n; };
  function shPbTour() {   // draw the map at 9 camera spots so every unit, house and ground tile queues its bake, then put the camera back
    const cx = camX, cy = camY;
    for (const fy of [0, .5, 1]) for (const fx of [0, .5, 1]) { camX = Math.max(0, (WORLD_W - VIEW_W) * fx); camY = Math.max(0, (WORLD_H - VIEW_H) * fy); clampCam(); try { render(); } catch (e) { } }
    camX = cx; camY = cy; clampCam(); render();
  }
  async function shPrebake() {
    try { await document.fonts.ready; } catch (e) { }   // a sprite baked with a fallback font would keep it until the cache is cleared
    if (SH_SPR.ready) await SH_SPR.ready;   // stored sprites first: they turn most bakes into cache hits
    cancelAnimationFrame(SH_PB.raf); SH_PB.on = true; SH_PB.t0 = performance.now(); SH_PB.quiet = 0; SH_PB.toured = 0;
    shPbTour(); SH_PB.max = Math.max(1, shPbLeft());
    const bar = shEl('sh-pb'); bar.classList.add('on');
    const tick = () => {
      const left = shPbLeft(), el = performance.now() - SH_PB.t0; SH_PB.max = Math.max(SH_PB.max, left);
      bar.firstElementChild.style.width = Math.round(100 * (1 - left / SH_PB.max)) + '%';
      bar.lastElementChild.textContent = `전장 준비 중 · ${Math.round(100 * (1 - left / SH_PB.max))}%`;
      if (left === 0) { if (++SH_PB.quiet === 3 && !SH_PB.toured) { SH_PB.toured = 1; SH_PB.quiet = 0; shPbTour(); } }   // a second tour catches bakes queued by the first
      else SH_PB.quiet = 0;
      if ((SH_PB.quiet >= 3 && SH_PB.toured) || el > 30000) { SH_PB.on = false; SH_PB.ms = Math.round(el); bar.classList.remove('on'); render(); setTimeout(shSprSave, 1500); return; }
      SH_PB.raf = requestAnimationFrame(tick);
    };
    SH_PB.raf = requestAnimationFrame(tick);
  }

  // ---------- match lifecycle ----------
  function shApplyCfg() {
    const c = SHELL.cfg; if (!shMapOk(c.map)) c.map = 'skirmish'; mapSelect.value = c.map;
    if (![...initGoldSelect.options].some(o => +o.value === c.funds)) initGoldSelect.add(new Option(c.funds + ' G', String(c.funds)));
    initGoldSelect.value = String(c.funds); VM_START = c.tickets;
    const cp = shEl('cp-opt'); if (cp) cp.value = c.cpBonus ? 'on' : 'off';
  }
  { 
    /* resetGame: layer moved to js/chains/resetGame.js */ }
  // v206 B1/B2: one table for the start resources. Standard = 600 manpower / 10 munition / 20 fuel; larger test presets keep fuel 7 % of funds and munition 60.
  // The side that moves second (red) receives the editable bonus once; the hidden +90 / +15 of v140 is gone.
  function shStartBase(g0) { return g0 === 600 ? { mp: 600, mun: 10, fuel: 20 } : { mp: g0, mun: 60, fuel: Math.round(g0 * 0.07 / 10) * 10 }; }
  function shApplyStart() {
    const g0 = parseInt(initGoldSelect.value) || 600, b = shStartBase(g0), L = shLate(SHELL.cfg.late);
    gold = { blue: b.mp, red: b.mp + L.mp }; fuel = { blue: b.fuel, red: b.fuel + L.fuel }; mun = { blue: b.mun, red: b.mun + L.mun };
    try { v140IntAll(); } catch (e) { } try { updateGoldUI(); updateBuildMenu(); } catch (e) { }
  }
  function shQuietReset() {   // rebuild the battlefield without the briefing, sounds or a save (lobby backdrop, setup preview, load)
    const ab = V100.autoBrief; V100.autoBrief = false; SHELL.quiet = true;
    try { resetGame(); } finally { V100.autoBrief = ab; SHELL.quiet = false; }
    try { v100BriefClose(); } catch (e) { }
  }
  function shEnterGame() { SHELL.inGame = true; shApp.classList.remove('shell-out'); lobbyEl.classList.remove('open'); setupEl.classList.remove('open'); shPanStop(); shEl('idle-btn')._n = -1; shEl('roster-tab')._n = -1; render(); }
  function shDeploy() {
    shStore.set('cfg', SHELL.cfg); shApplyCfg(); shEnterGame(); resetGame();
    if (!V100.autoBrief) shFlash();   // with the briefing on, resetGame opens it (stage 3) and play starts from its 'start operation' button
  }
  function shShowLobby() {
    SHELL.inGame = false; shApp.classList.add('shell-out');
    [setupEl, curtainEl, aarEl, menuSheet, shEl('shell-modal')].forEach(x => x.classList.remove('open'));
    document.querySelectorAll('.sheet-back.open').forEach(x => x.classList.remove('open')); try { v100BriefClose(); } catch (e) { }
    shRosterOpen(false); shClearModes(); selectedUnit = null; selBld = null; validMoves = []; validAttacks = [];
    const sv = shSaveInfo(), cb = shEl('lb-continue'); cb.disabled = !sv;
    shEl('lb-continue-sub').textContent = sv ? `${sv.mapName} · R${String(sv.round).padStart(2, '0')} · ${SH_TEAM[sv.turn]} 턴${sv.mode === 'hotseat' ? ' · 패스 앤 플레이' : ''}${sv.slot === 'suspend' ? ' · 종료 시 저장' : ''}` : '저장된 작전 없음';
    lobbyEl.classList.add('open'); shPanStart(); render();
  }
  function shPanStart() {
    shPanStop(); if (reduceMotion()) return;
    let dir = 1, last = 0;
    const step = now => {
      SHELL.panRaf = requestAnimationFrame(step);
      if (now - last < 50 || !lobbyEl.classList.contains('open') || setupEl.classList.contains('open') || document.hidden) return; last = now;
      const before = camX; camX += dir * .6; camY += dir * .22; clampCam(); if (Math.abs(camX - before) < .05) dir = -dir; render();
    };
    SHELL.panRaf = requestAnimationFrame(step);
  }
  function shPanStop() { if (SHELL.panRaf) cancelAnimationFrame(SHELL.panRaf); SHELL.panRaf = 0; }

  // ---------- setup screen ----------
  function shSetupOpen(mode) {
    SHELL.mode = mode;
    shEl('su-mode').textContent = mode === 'hotseat' ? '패스 앤 플레이 · 턴마다 가림막으로 화면을 가립니다' : '교전 · 한 화면에서 양 진영 지휘';
    const grp = (g, t) => `<div class="su-h">${t}</div>` + SH_MAPS.filter(m => m.grp === g).map(m => `<button class="su-map" data-map="${m.id}"><b>${m.name}</b><small>${m.sub} · ${m.size}</small></button>`).join('');
    shEl('su-maps').innerHTML = grp('op', '작전 지도') + `<button class="su-map su-soon" disabled><b>추가 예정</b><small>두 번째 1대1 지도</small></button>`;
    shEl('su-funds').innerHTML = SH_FUNDS.map(([v, n, s]) => `<button class="sh-chip" data-v="${v}">${n}<small>${s}</small></button>`).join('');
    shEl('su-tickets').innerHTML = SH_TICKETS.map(([v, n]) => `<button class="sh-chip" data-v="${v}">${v}<small>${n}</small></button>`).join('');
    shEl('su-win').innerHTML = Object.keys(WIN_MODES).map(k => `<button class="sh-chip" data-v="${k}">${WIN_MODES[k].label}<small>${WIN_MODES[k].sub}</small></button>`).join('') + '<button class="sh-chip" disabled>추가 예정</button>';
    shEl('su-cap').innerHTML = SH_CAPS.map(([v, n]) => `<button class="sh-chip" data-v="${v}">${n}</button>`).join('');
    shEl('su-name-blue').value = SHELL.cfg.names.blue; shEl('su-name-red').value = SHELL.cfg.names.red;
    setupEl.classList.add('open'); shSetupSync(); shSetupMap(SHELL.cfg.map, true);
  }
  function shSetupSync() {
    const c = SHELL.cfg, on = (id, v) => shEl(id).querySelectorAll('.sh-chip').forEach(b => b.classList.toggle('on', b.dataset.v === String(v)));
    const m = SH_MAPS.find(x => x.id === c.map) || SH_MAPS[0];
    if (!m.modes.includes(c.mode)) c.mode = m.modes[0];
    shEl('su-win').querySelectorAll('.sh-chip[data-v]').forEach(b => { b.disabled = !m.modes.includes(b.dataset.v); });
    on('su-win', c.mode); on('su-cap', c.roundCap | 0);
    shEl('su-row-tickets').hidden = c.mode !== 'capture'; shEl('su-row-cap').hidden = c.mode === 'capture';
    on('su-funds', c.funds); on('su-tickets', c.tickets); on('su-cp', c.cpBonus ? 'on' : 'off'); on('su-fog', c.fog ? 'on' : 'off');
    document.querySelectorAll('#su-maps .su-map').forEach(b => b.classList.toggle('sel', b.dataset.map === c.map));
    c.late = shLate(c.late); document.querySelectorAll('#su-late .st').forEach(el => { el.querySelector('output').textContent = '+' + c.late[el.dataset.k]; });
    { const b = shStartBase(c.funds | 0 || 600), sm = document.querySelector('#su-late>small'); if (sm) sm.textContent = `시작 자원 ${b.mp} · 뮤니 ${b.mun} · 기름 ${b.fuel} — 후공은 위 값을 더 받음`; }
  }
  function shSetupMap(id, force) {
    if (!shMapOk(id)) return;
    if (!force && id === SHELL.cfg.map) return;
    SHELL.cfg.map = id; shApplyCfg(); shQuietReset(); shSetupSync();
    const th = v100Theme(), m = SH_MAPS.find(x => x.id === id), vp = capturePoints.filter(c => c.cls === 'vp').length, res = capturePoints.length - vp;
    shEl('su-title').textContent = `${m.name} — ${th.title}`; shEl('su-sub').textContent = `${th.place} · ${th.date} · ${m.sub}`;
    shEl('su-stamp').textContent = `항공 정찰 · ${th.date}`;
    shEl('su-nm-blue').textContent = th.sides.blue.name; shEl('su-nm-red').textContent = th.sides.red.name;
    const tags = [`${COLS}×${ROWS}`, SH_SEASON[th.season] || th.season, `승리 거점 ${vp}`, `자원 거점 ${res}`];
    if (Object.values(terrainMap).some(t => t && /bridge/.test(t.terrainType || ''))) tags.push('강 · 교량');
    if (m.grp === 'test') tags.push('테스트 맵');
    shEl('su-tags').innerHTML = tags.filter(Boolean).map(t => `<span>${shEsc(t)}</span>`).join('');
    requestAnimationFrame(() => requestAnimationFrame(shSetupDraw));
  }
  function shSetupDraw() {
    if (!setupEl.classList.contains('open')) return;
    const cv = shEl('su-cv'), box = cv.parentElement, dpr = Math.min(2, window.devicePixelRatio || 1), W = Math.max(50, Math.round(box.clientWidth * dpr)), H = Math.max(50, Math.round(box.clientHeight * dpr));
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    try {
      try { v99Ensure(); } catch (e) { }
      const P = v100BriefPhoto(W, H), g = cv.getContext('2d'), s = P.s, u = dpr / s;
      g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(P.cv, 0, 0); g.setTransform(s, 0, 0, s, P.ox, P.oy);
      capturePoints.forEach(cp => { const q = v100Ctr(cp), R = (cp.cls === 'vp' ? 5.5 : 3.2) * u; g.beginPath(); g.arc(q.x, q.y, R, 0, 7); g.fillStyle = cp.cls === 'vp' ? '#e2c47e' : 'rgba(241,233,210,.85)'; g.fill(); g.lineWidth = 1.2 * u; g.strokeStyle = '#0b0e12'; g.stroke(); });
      buildings.filter(b => b.type === 'hq').forEach(b => { const q = getHexCenter(b.c, b.r), R = 6 * u; g.fillStyle = b.team === 'blue' ? '#58a6f2' : '#e4573f'; g.fillRect(q.x - R, q.y - R, 2 * R, 2 * R); g.lineWidth = 1.4 * u; g.strokeStyle = '#fff'; g.strokeRect(q.x - R, q.y - R, 2 * R, 2 * R); });
      g.setTransform(1, 0, 0, 1, 0, 0);
    } catch (e) { }
  }
  window.addEventListener('resize', () => { if (setupEl.classList.contains('open')) requestAnimationFrame(shSetupDraw); });
  setupEl.addEventListener('click', e => {
    const sb = e.target.closest('#su-late .st button');
    if (sb) { const k = sb.parentElement.dataset.k, L = SH_LATE[k], c = SHELL.cfg; c.late = shLate(c.late); c.late[k] = Math.max(0, Math.min(L.max, c.late[k] + (+sb.dataset.d) * L.step)); c.late = shLate(c.late); shSetupSync(); return; }
    const mp = e.target.closest('.su-map'); if (mp) { shSetupMap(mp.dataset.map); return; }
    const ch = e.target.closest('.sh-chip'); if (!ch) return;
    const seg = ch.parentElement.id, v = ch.dataset.v, c = SHELL.cfg;
    if (seg === 'su-funds') c.funds = +v; else if (seg === 'su-tickets') c.tickets = +v; else if (seg === 'su-cp') c.cpBonus = v === 'on'; else if (seg === 'su-fog') c.fog = v === 'on'; else if (seg === 'su-win') c.mode = v; else if (seg === 'su-cap') c.roundCap = +v;
    shSetupSync();
  });
  ['blue', 'red'].forEach(tm => shEl('su-name-' + tm).addEventListener('input', e => { SHELL.cfg.names[tm] = e.target.value.slice(0, 14); }));
  shEl('su-back').addEventListener('click', () => { setupEl.classList.remove('open'); shStore.set('cfg', SHELL.cfg); render(); });
  shEl('su-go').addEventListener('click', shDeploy);
  shEl('lb-skirmish').addEventListener('click', () => shSetupOpen('skirmish'));
  shEl('lb-hotseat').addEventListener('click', () => shSetupOpen('hotseat'));
  shEl('lb-continue').addEventListener('click', () => { if (!shLoad()) { toast('저장 데이터를 불러오지 못했습니다'); shShowLobby(); } });
  shEl('lb-manual').addEventListener('click', () => shManualOpen());
  shEl('lb-settings').addEventListener('click', () => shPauseOpen('set'));
  shEl('lb-info').addEventListener('click', shInfoOpen);

  // ---------- pause menu: pinned objectives + 3 tabs + sandbox/debug accordion ----------
  { const head = menuSheet.querySelector('.set-head'), body = menuSheet.querySelector('.set-body');
    head.insertAdjacentHTML('afterend', `<div id="pm-obj" role="button" tabindex="0" aria-label="승리 목표 상세"></div>
      <div id="pm-tabs" role="tablist"><button data-pm="log">전투 기록</button><button data-pm="set">설정</button><button data-pm="match">작전 통제</button></div>`);
    const groups = [...body.children].filter(e => e.classList.contains('set-group'));
    body.insertAdjacentHTML('beforeend', `
      <div class="pm-pane" data-pm="log"><div id="pm-logbar"><button class="sh-chip" data-f="all">전체</button><button class="sh-chip" data-f="combat">교전만</button><small id="pm-lognote"></small></div><div id="pm-log" aria-live="off"></div></div>
      <div class="pm-pane" data-pm="set">
        <div class="pm-sec" id="pm-sec-disp"><h4>화면 · 소리</h4>
          <div class="set-group" id="pm-disp"><h3>화면 테마 · 글자</h3>
            <div class="su-rule"><label>테마</label><div class="su-seg"><button class="sh-chip" data-k="theme" data-v="std">표준<small>중간 톤</small></button><button class="sh-chip" data-k="theme" data-v="bright">밝게<small>버닝 브리지스</small></button><button class="sh-chip" data-k="theme" data-v="hc">고대비</button><button class="sh-chip" data-k="theme" data-v="coh3">CoH3<small>차콜 · 탠</small></button></div></div>
            <div class="su-rule"><label>글자 크기</label><div class="su-seg"><button class="sh-chip" data-k="text" data-v="std">보통</button><button class="sh-chip" data-k="text" data-v="lg">크게<small>×1.15</small></button></div></div>
            <div class="su-rule"><label>이동 속도</label><div class="su-seg"><button class="sh-chip" data-k="move" data-v="std">묵직하게<small>중량별</small></button><button class="sh-chip" data-k="move" data-v="fast">빠르게<small>×0.6</small></button></div></div>
          </div></div>
        <div class="pm-sec" id="pm-sec-rules"><h4>전술 규칙</h4><div class="sheet-note">대전 중 바꾸면 양 진영에 바로 적용됩니다.</div></div>
        <div class="set-group" id="pm-audio"><h3>오디오</h3>
          <div class="pm-slider"><label for="vol-sfx">효과음</label><input id="vol-sfx" type="range" min="0" max="100" step="5"><output id="vol-sfx-o"></output></div>
          <div class="pm-slider"><label for="vol-amb">환경음</label><input id="vol-amb" type="range" min="0" max="100" step="5"><output id="vol-amb-o"></output></div>
        </div>
      </div>
      <div class="pm-pane" data-pm="match">
        <div class="set-group"><h3>작전</h3>
          <div class="set-row"><button class="sh-btn" id="pm-resume">▶ 전장으로 복귀</button></div>
          <div class="set-row"><button class="sh-btn" id="pm-brief">작전 브리핑</button><button class="sh-btn" id="pm-manual">야전 교범</button></div>
          <div class="set-row"><button class="sh-btn danger" id="pm-restart" data-label="작전 재시작">작전 재시작</button><button class="sh-btn danger" id="pm-quit" data-label="로비로 나가기">로비로 나가기</button></div>
          <div class="sheet-note" id="pm-savenote"></div>
        </div>
        <details class="pm-debug"><summary>${ico('wrench')}샌드박스 · 디버그 도구</summary><div class="in" id="pm-debug-in"><div class="sheet-note">테스트용 도구입니다. 지도 · 자금 선택기는 즉시 전장을 다시 만듭니다.</div></div></details>
      </div>`);
    const setPane = body.querySelector('.pm-pane[data-pm="set"]'), dbg = shEl('pm-debug-in');
    // each setting lives in exactly one place: display, tactical rules, or the sandbox / debug accordion
    const disp = shEl('pm-sec-disp'), rules = shEl('pm-sec-rules');
    disp.appendChild(shEl('pm-audio'));
    shEl('pm-disp').addEventListener('click', e => { const b = e.target.closest('.sh-chip'); if (!b) return; SH_DISP[b.dataset.k] = b.dataset.v; shStore.set('display', SH_DISP); shDispApply(); });
    groups.forEach(g => {
      const h = (g.querySelector('h3') || {}).textContent || '';
      if (/화면|크레딧|피해 숫자|연출 품질|투척 경로|포탑 분리|자연물/.test(h)) disp.appendChild(g);
      else if (/시야 차단|적 발견 시 정지|이동 확인|방향 엄폐|CP 보너스/.test(h)) rules.appendChild(g);
      else dbg.appendChild(g);
    });
  }
  function shPauseTab(tab) {
    SHELL.pmTab = tab;
    menuSheet.querySelectorAll('#pm-tabs button').forEach(b => b.classList.toggle('on', b.dataset.pm === tab));
    menuSheet.querySelectorAll('.pm-pane').forEach(p => p.classList.toggle('on', p.dataset.pm === tab));
    if (tab === 'log') shLogRender();
    ['pm-restart', 'pm-quit'].forEach(shDisarm);
  }
  function shPauseOpen(tab) {
    const out = !SHELL.inGame; if (out) tab = 'set';
    menuSheet.querySelector('.set-head>span').textContent = out ? '⚙ 설정' : '⚙ 작전 일시정지';
    menuSheet.classList.add('open'); shRosterOpen(false);
    const vb = vpCount('blue'), vr = vpCount('red'), held = tm => capturePoints.filter(c => c.owner === tm).length;
    const ann = shMode() === 'annihilation', cap = SHELL.cfg.roundCap | 0;
    shEl('pm-obj').innerHTML = ann
      ? `<span class="sc"><i>${shAlive('blue').length}</i> – <u>${shAlive('red').length}</u></span><span class="tx"><b>PRIMARY OBJECTIVE · ${shRound()}${cap ? ' / ' + cap : ''}</b><span>섬멸전 — 적 부대를 모두 없애고 투입을 막으세요 · 생존 가치 ${shValue('blue')} : ${shValue('red')}</span></span><span class="go">›</span>`
      : `<span class="sc"><i>${vb}</i> – <u>${vr}</u></span><span class="tx"><b>PRIMARY OBJECTIVE · ${shRound()}</b><span>승리 거점을 더 많이 점령해 적 티켓을 0으로 — 티켓 ${vm.tickets.blue} : ${vm.tickets.red} · 거점 ${held('blue')} : ${held('red')}</span></span><span class="go">›</span>`;
    shEl('pm-lognote').textContent = SHELL.mode === 'hotseat' && SHELL.cfg.fog ? '상대 턴은 교전 결과만 표시' : '';
    const sv = shSaveInfo(); shEl('pm-savenote').textContent = sv ? `자동 저장: 턴 시작 · 앱을 나갈 때 · 마지막 저장 R${String(sv.round).padStart(2, '0')} ${SH_TEAM[sv.turn]} 턴${sv.slot === 'suspend' ? ' (나갈 때)' : ''}` : '자동 저장: 턴이 시작될 때와 앱을 나갈 때 기록됩니다.';
    ['sfx', 'amb'].forEach(k => { shEl('vol-' + k).value = SFX.vol[k]; shEl('vol-' + k + '-o').textContent = SFX.vol[k]; });
    shPauseTab(tab || SHELL.pmTab);
  }
  shEl('menu-btn').addEventListener('click', () => shPauseOpen('match'));
  shEl('log-btn').addEventListener('click', () => { shEl('menu-btn').click(); shPauseTab('log'); });
  shEl('pm-tabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) shPauseTab(b.dataset.pm); });
  shEl('pm-logbar').addEventListener('click', e => { const b = e.target.closest('.sh-chip'); if (b) { SHELL.logFilter = b.dataset.f; shLogRender(); } });
  shEl('pm-obj').addEventListener('click', () => { menuSheet.classList.remove('open'); openVmSheet(); });
  shEl('pm-resume').addEventListener('click', () => menuSheet.classList.remove('open'));
  shEl('pm-brief').addEventListener('click', () => v100BriefOpen());
  shEl('pm-manual').addEventListener('click', () => shManualOpen());
  ['sfx', 'amb'].forEach(k => shEl('vol-' + k).addEventListener('input', e => { SFX.vol[k] = +e.target.value; shEl('vol-' + k + '-o').textContent = SFX.vol[k]; sfxInit(); sfxVol(); shStore.set('audio', SFX.vol); if (k === 'sfx') sfx('shot'); }));
  // 2-step confirmation for destructive match controls
  function shDisarm(id) { const b = shEl(id); if (!b) return; clearTimeout(b._t); b.classList.remove('armed'); b.textContent = b.dataset.label; }
  function shTwoStep(id, fn) {
    const b = shEl(id);
    b.addEventListener('click', () => {
      if (b.classList.contains('armed')) { shDisarm(id); fn(); return; }
      b.classList.add('armed'); b.textContent = '한 번 더 눌러 확정'; buzz(15); b._t = setTimeout(() => shDisarm(id), 2800);
    });
  }
  shTwoStep('pm-restart', () => { menuSheet.classList.remove('open'); shApplyCfg(); resetGame(); shFlash(); });
  shTwoStep('pm-quit', () => { menuSheet.classList.remove('open'); shShowLobby(); });

  // ---------- win modes: Capture (Victory Meter, unchanged) and Annihilation ----------
  // a mode only decides when and why a match ends; combat, vision and economy are untouched
  const shUnitCost = u => { const t = (UNIT_ROSTER[u.team] || {})[u.key]; return t ? (t.cost || 0) + (t.fcost || 0) : (u.cost || 0); };
  const shAlive = tm => units.filter(u => u.team === tm && u.hp > 0);   // loaded passengers count: they stay in `units`
  const shValue = tm => shAlive(tm).reduce((s, u) => s + shUnitCost(u), 0);
  function shCanField(tm) {   // a production building that works, a unit it may build, and the funds for it
    const R = UNIT_ROSTER[tm] || {};
    return Object.keys(R).some(k => {
      const t = R[k]; if (t.req && !(research[tm] || {})[t.req]) return false;
      if (gold[tm] < (t.cost || 0) || fuel[tm] < (t.fcost || 0)) return false;
      return buildings.some(b => b.team === tm && b.hp > 0 && !b.crippled && canProd(b, k));
    });
  }
  const WIN_MODES = {
    capture: { label: '점령전', sub: '승리 미터', maps: null },
    annihilation: { label: '섬멸전', sub: '적 전멸', maps: ['skirmish'] }
    // reserved: one entry per future mode (label, sub, maps, plus a check in shModeCheck)
  };
  const SH_CAPS = [[0, '없음'], [20, '20'], [30, '30']];
  const shMode = () => (SHELL.cfg.mode === 'annihilation' && (SH_MAPS.find(m => m.id === SHELL.cfg.map) || {}).modes.includes('annihilation')) ? 'annihilation' : 'capture';
  function shDeclare(w, why) {   // w: 'blue' | 'red' | 'draw'
    if (vm.winner) return;
    vm.winner = w; SHELL.endWhy = why;
    addLog(w === 'draw' ? `🏁 [무승부] ${why}` : `🏆 [VICTORY] ${TEAM_NAME[w]} wins — ${why}`, 'bounty');
    const eb = document.getElementById('end-turn-btn'); if (eb) eb.disabled = true;
    try { vmRefreshHud(); } catch (e) { }
  }
  function shModeCheck(roundEnd) {   // annihilation: called after kills, at turn start and at the end of every turn
    if (vm.winner || shMode() !== 'annihilation') return;
    const out = tm => shAlive(tm).length === 0 && !shCanField(tm), b = out('blue'), r = out('red');
    if (b && r) { const w = foeOf(currentTurn); shDeclare(w, `양측 동시 전멸 · 행동하지 않은 ${SH_TEAM[w]} 승리`); return; }
    if (b || r) { const l = b ? 'blue' : 'red'; shDeclare(foeOf(l), `${SH_TEAM[l]} 전멸 — 남은 부대도, 새로 투입할 부대도 없습니다`); return; }
    const cap = SHELL.cfg.roundCap | 0;
    if (roundEnd && cap && roundCount > cap) {
      const vb = shValue('blue'), vr = shValue('red');
      shDeclare(vb === vr ? 'draw' : vb > vr ? 'blue' : 'red', `${cap}라운드 종료 · 생존 부대 가치 ${vb} 대 ${vr}`);
    }
  }
  { 
    /* vmCheckWinner: layer moved to js/chains/vmCheckWinner.js */ }
  {    // annihilation: no ticket bleed and no victory points; resource points still pay income (captureTick runs on its own)
    /* settleVictory: layer moved to js/chains/settleVictory.js */ }
  { 
    /* vmRefreshHud: layer moved to js/chains/vmRefreshHud.js */ }
  { 
    /* openVmSheet: layer moved to js/chains/openVmSheet.js */ }

  // ---------- after action report ----------
  { 
    /* vmCheckWinner: layer moved to js/chains/vmCheckWinner.js */ }
  function shAarOpen() {
    if (!vm.winner || !SHELL.inGame) return;
    shTrack(); const w = vm.winner, draw = w === 'draw', l = draw ? null : foeOf(w), wn = draw ? '' : shName(w), ann = shMode() === 'annihilation';
    const seen = tm => [...SHELL.seen.values()].filter(x => x.team === tm).length, alive = tm => units.filter(u => u.team === tm && u.hp > 0).length;
    const lost = tm => Math.max(0, seen(tm) - alive(tm)), held = tm => capturePoints.filter(c => c.owner === tm).length;
    const seenCost = tm => [...SHELL.seen.values()].filter(x => x.team === tm).reduce((s, x) => s + shUnitCost(x), 0), lostCost = tm => Math.max(0, seenCost(tm) - shValue(tm));
    const rows = ann
      ? [['생존 부대', alive('blue'), alive('red'), 1], ['생존 가치', shValue('blue'), shValue('red'), 1], ['투입 유닛', seen('blue'), seen('red'), 0],
        ['적 유닛 격파', lost('red'), lost('blue'), 1], ['아군 손실', lost('blue'), lost('red'), -1], ['격파 가치', lostCost('red'), lostCost('blue'), 1], ['손실 가치', lostCost('blue'), lostCost('red'), -1]]
      : [['잔여 티켓', vm.tickets.blue, vm.tickets.red, 1], ['승리 거점', vpCount('blue'), vpCount('red'), 1], ['점령 구역', held('blue'), held('red'), 1],
        ['투입 유닛', seen('blue'), seen('red'), 0], ['적 유닛 격파', lost('red'), lost('blue'), 1], ['아군 손실', lost('blue'), lost('red'), -1]];
    // reserved: a mode-specific row group for future modes goes here
    shEl('aar-tab').innerHTML = `<tr><th class="b">${SH_TEAM.blue}${shName('blue') ? ' · ' + shEsc(shName('blue')) : ''}</th><th></th><th class="r">${SH_TEAM.red}${shName('red') ? ' · ' + shEsc(shName('red')) : ''}</th></tr>` +
      rows.map(([k, b, r, d]) => `<tr><td class="b${d && (b - r) * d > 0 ? ' win' : ''}">${b}</td><td class="k">${k}</td><td class="r${d && (r - b) * d > 0 ? ' win' : ''}">${r}</td></tr>`).join('');
    const mvp = units.filter(u => (draw || u.team === w) && u.hp > 0).sort((a, b) => (b.rank || 0) - (a.rank || 0) || (b.xp || 0) - (a.xp || 0) || (b.kills || 0) - (a.kills || 0))[0];
    let port = null; if (mvp) { try { port = v101Portrait(mvp.key, mvp.team); } catch (e) { } }
    shEl('aar-mvp').innerHTML = mvp ? `<h4>MVP · 최고 수훈 부대</h4><span class="pt"${port ? ` style="background-image:url('${port}')"` : ''}></span><b>${shEsc(mvp.className)}${mvp.rank ? ' ' + '★'.repeat(mvp.rank) : ''}</b><small>${shEsc(mvp.uniqueName || '')}</small><small>경험치 ${Math.round(mvp.xp || 0)} · 격파 ${mvp.kills || 0}</small>` : '<h4>MVP</h4><small>생존한 부대가 없습니다</small>';
    shEl('aar-flag').className = 'sh-fl wave ' + (draw ? '' : w);
    shEl('aar-title').textContent = draw ? 'DRAW' : `${w === 'blue' ? 'ALLIED' : 'AXIS'} VICTORY`;
    shEl('aar-sub').textContent = draw ? `무승부 — ${SHELL.endWhy || ''}` : ann ? `${wn ? wn + ' · ' : ''}${SH_TEAM[w]} 승리 — ${SHELL.endWhy || '섬멸전'}` : `${wn ? wn + ' · ' : ''}${SH_TEAM[w]} 승리 — ${SH_TEAM[l]}의 승리 티켓 소진`;
    shEl('aar-round').textContent = roundCount;
    document.querySelectorAll('.sheet-back.open').forEach(x => x.classList.remove('open')); menuSheet.classList.remove('open'); curtainEl.classList.remove('open');
    aarEl.classList.add('open'); sfx('win'); buzz([30, 60, 30, 60, 80]);
  }
  shEl('aar-map').addEventListener('click', () => { aarEl.classList.remove('open'); toast('전장 열람 중 — 상단 승리 미터를 누르면 결과를 다시 볼 수 있습니다', 4000); });
  shEl('aar-lobby').addEventListener('click', shShowLobby);
