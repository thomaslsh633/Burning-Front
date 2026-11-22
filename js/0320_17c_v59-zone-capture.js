  // ══════════════════════════════════════════════════════════════
  // [17c] v59 — Zone capture · Victory Meter · HQ Crippled · Langres Winter (v128: 48×48)
  //   · Points are captured by HOLDING their zone (radius 1 / 2) through a turn-start tick, never by stepping on a hex.
  //   · Win = opponent's Victory-Meter tickets reach 0. No turn limit, no HQ-kill win, no resource-exhaustion win.
  //   · Turn-start order: strikes → processTurnStartStatus → captureTick(team) → settleVictory → income   (zoneTurnStart)
  // ══════════════════════════════════════════════════════════════
  let VM_START = 350;                   // tickets per side
  const VM_BLEED = [0, 2, 5, 10];       // base bleed per settlement for a VP lead of 0 / 1 / 2 / 3+
  const VM_MOM_N = 6;                   // +1 bleed per 6 consecutive settlements with the same leader
  const VM_TIE_GAP = 4;                 // parity tiebreak: resource-control gap needed to bleed 1 ticket
  const HQ_PENALTY = 10, HQ_RECOVER = 0.25, HQ_REPAIR = 16;   // v127: HQ 430 -> 690, repair scaled with it
  const foeOf = tm => tm === 'blue' ? 'red' : 'blue';
  const TEAM_NAME = { blue: 'Allied', red: 'Axis' }, TEAM_COL = { blue: '#38bdf8', red: '#f87171' };
  const CLS_ICO = { vp: '★', manpower: '💰', fuel: '⛽', fuel_minor: '⛽', mun: '💣' };
  const CLS_NAME = { vp: 'Victory Point', manpower: 'Manpower', fuel: 'Fuel', fuel_minor: 'Minor Fuel', mun: 'Munitions' };
  const LEGACY_KIND = { vp: 'vp', manpower: 'money', fuel: 'oil', fuel_minor: 'oil', mun: 'mun' };

  function newVm() { return { tickets: { blue: VM_START, red: VM_START }, leader: null, streak: 0, prevLead: 0, winner: null, hqPaid: { blue: false, red: false }, last: null, settled: 0 }; }
  let vm = newVm();

  // ---------- zone data model ----------
  let zoneIndex = new Map();
  const zoneAt = (c, r) => zoneIndex.get(c + ',' + r) || null;
  // v166: ammo points pay ~20 % less ammo, and every ammo / fuel point also pays manpower (+10; minor fuel +5)
  function v166Yield(cls, y) {
    const b = Object.assign({}, y || YIELD[cls] || {});
    if (cls === 'mun') { b.m = Math.round((b.m || 0) * 0.8); b.g = (b.g || 0) + 10; }
    else if (cls === 'fuel') b.g = (b.g || 0) + 10;
    else if (cls === 'fuel_minor') b.g = (b.g || 0) + 5;
    else return y || null;
    return b;
  }
  function addPoint(def) {
    const cls = def.cls, radius = def.radius !== undefined ? def.radius : (COLS >= 40 ? ZONE_R : ZONE_R_SMALL)[cls], cores = def.cores || [[def.c, def.r]];
    const cp = { id: 'cp_' + capturePoints.length, name: def.name, code: def.code || ({ vp: 'VP', manpower: 'MAN', fuel: 'FUEL', fuel_minor: 'FUEL-', mun: 'MUN' })[cls],
      cls, kind: LEGACY_KIND[cls], c: cores[0][0], r: cores[0][1], cores, radius, owner: def.home || null, zone: new Set(), zoneList: [], yield: v166Yield(cls, def.yield) };   // v131: per-point yield
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (cores.some(k => getDistance(k[0], k[1], c, r) <= radius)) { cp.zone.add(c + ',' + r); cp.zoneList.push([c, r]); }
    capturePoints.push(cp); return cp;
  }
  function buildZoneIndex() { zoneIndex = new Map(); capturePoints.forEach(cp => cp.zone.forEach(k => { if (!zoneIndex.has(k)) zoneIndex.set(k, cp); })); }
  const cpIcon = cp => CLS_ICO[cp.cls] || '•';
  function cpYieldText(cp) {
    const y = cp.yield || YIELD[cp.cls] || {};
    if (cp.cls === 'vp') return '★ 1 Victory Point';
    return [y.g ? '✊ +' + y.g + 'G' : '', y.f ? '⛽ +' + y.f + 'F' : '', y.m ? '▮ +' + y.m + 'M' : ''].filter(Boolean).join(' ');
  }
  function cpTipText(cp) {
    const f = forecast(cp), st = ({ contested: 'CONTESTED', capture: 'capturing → ' + TEAM_NAME[f.tm], neutralize: 'neutralizing → ' + TEAM_NAME[f.tm], held: 'held', blocked: 'blocked (no capturing infantry)', idle: 'idle' })[f.st];
    return `[${cp.code}] ${cp.name} · ${cpYieldText(cp)} · zone R${cp.radius} · ${cp.owner ? TEAM_NAME[cp.owner] : 'Neutral'} · ${st}${cp.owner && !v131Supplied(cp, cp.owner) ? ' · CUT OFF (no income)' : ''}`;
  }

  // ---------- presence rules ----------
  // capture: armed, un-pinned infantry/crew.  contest only: pinned infantry, armed vehicles.  ignored: unarmed vehicles, loaded passengers.
  const VEH_NONCOMBAT = new Set(['supply', 'transport', 'medic_vehicle', 'repair_vehicle']);
  const isArmed = u => (u.atk || 0) > 0;
  function isCapturer(u) { return !!u && u.hp > 0 && !u.isLoaded && (u.armorType === 'soft' || u.capt) && isArmed(u) && suppState(u) < 2; }   // v129: + jeep, Weasel, Kettenkrad
  function isContester(u) { return !!u && u.hp > 0 && !u.isLoaded && isArmed(u) && (u.armorType === 'soft' || !VEH_NONCOMBAT.has(u.class)); }
  function presence(cp) {
    const p = { blue: { cap: 0, con: 0 }, red: { cap: 0, con: 0 } };
    for (const u of units) { if (!isContester(u) || !cp.zone.has(u.c + ',' + u.r)) continue; const s = p[u.team]; s.con++; if (isCapturer(u)) s.cap++; }
    return p;
  }
  // What WOULD happen at the next tick of the side that is capturing. Both sides present (any armed unit) → contested, state frozen.
  function forecast(cp) {
    const p = presence(cp);
    if (p.blue.con && p.red.con) return { st: 'contested', p };
    for (const tm of ['blue', 'red']) if (p[tm].cap) return { st: cp.owner === tm ? 'held' : (cp.owner ? 'neutralize' : 'capture'), tm, p };
    const only = p.blue.con ? 'blue' : (p.red.con ? 'red' : null);
    return { st: only ? 'blocked' : 'idle', tm: only, p };
  }
  /* captureTick: original body removed — replaced by a later layer (js/chains/captureTick.js) */
  function pushFx(cp, text, color) { const k = cp.cores[0]; fxList.push({ c: k[0], r: k[1], text, color, dy: -26, t0: performance.now() }); }

  // ---------- Victory Meter ----------
  const vpCount = tm => capturePoints.filter(c => c.cls === 'vp' && c.owner === tm).length;
  const ctrlScore = tm => capturePoints.filter(c => c.owner === tm).reduce((s, c) => s + (CTRL_W[c.cls] || 0), 0);
  // Pure planner: what the NEXT settlement would do from the current state (used by settleVictory and by the HUD preview).
  function settlePlan() {
    const b = vpCount('blue'), r = vpCount('red'), lead = Math.abs(b - r), vpLeader = b > r ? 'blue' : (r > b ? 'red' : null);
    const plan = { b, r, lead, vpLeader, sb: ctrlScore('blue'), sr: ctrlScore('red'), bleed: 0, loser: null, streak: 0, mom: 0, tie: false };
    if (vpLeader) {
      let st = vm.leader === vpLeader ? (lead < vm.prevLead ? Math.floor(vm.streak / 2) : vm.streak) : 0;   // lead shrank → momentum halves; leader change → resets
      st += 1; plan.streak = st; plan.mom = Math.floor((st - 1) / VM_MOM_N);
      plan.bleed = VM_BLEED[Math.min(lead, 3)] + plan.mom; plan.loser = foeOf(vpLeader);
    } else if (Math.abs(plan.sb - plan.sr) >= VM_TIE_GAP) {
      plan.tie = true; plan.loser = plan.sb > plan.sr ? 'red' : 'blue'; plan.bleed = 1;
    }
    return plan;
  }
  function settleVictory__base() {
    if (vm.winner) return null;
    const p = settlePlan();
    if (p.vpLeader) { vm.leader = p.vpLeader; vm.streak = p.streak; vm.prevLead = p.lead; } else { vm.leader = null; vm.streak = 0; vm.prevLead = 0; }
    if (p.loser && p.bleed) {
      vm.tickets[p.loser] = Math.max(0, vm.tickets[p.loser] - p.bleed);
      addLog(p.tie
        ? `📊 [Victory Meter] VP ${p.b}–${p.r} parity, resource control ${p.sb}–${p.sr}: ${TEAM_NAME[p.loser]} −${p.bleed} ticket (${vm.tickets[p.loser]} left)`
        : `📊 [Victory Meter] ${TEAM_NAME[p.vpLeader]} leads ${p.b}–${p.r}${p.mom ? ' (+' + p.mom + ' momentum)' : ''}: ${TEAM_NAME[p.loser]} −${p.bleed} tickets (${vm.tickets[p.loser]} left)`, 'crit');
    }
    vm.last = p; vm.settled++;
    vmCheckWinner(); return p;
  }
  function vmCheckWinner__base() {
    if (vm.winner) return;
    const b = vm.tickets.blue, r = vm.tickets.red; if (b > 0 && r > 0) return;
    vm.winner = (b <= 0 && r <= 0) ? (vpCount('blue') >= vpCount('red') ? 'blue' : 'red') : (r <= 0 ? 'blue' : 'red');
    addLog(`🏆 [VICTORY] ${TEAM_NAME[vm.winner]} wins — ${TEAM_NAME[foeOf(vm.winner)]} Victory Meter reached 0`, 'bounty');
    toast(`${TEAM_NAME[vm.winner]} VICTORY — enemy Victory Meter depleted.`, 8000);
    const eb = document.getElementById('end-turn-btn'); if (eb) eb.disabled = true;
    vmRefreshHud(); openVmSheet();
  }
  function zoneTurnStart(team) {
    if (vm.winner) return;
    hqUpkeep(team);
    captureTick(team);
    settleVictory();
    const inc = incomeOf(team); gold[team] += inc.g; fuel[team] += inc.f; mun[team] = Math.min(400, mun[team] + inc.m);
    addLog(`== [${team === 'blue' ? '연합군' : '국방군'}] 턴 개시 (💰+${inc.gross}G −${inc.upkeep}유지비 ⛽+${inc.f}F 💣+${inc.m}) ==`);
    vmRefreshHud();
  }
  function zoneMoveHint(u) {   // after a move: tell the player when the unit stands in a zone (the capture itself happens at the next tick)
    if (!u || u.team !== currentTurn) return;
    const cp = zoneAt(u.c, u.r); if (!cp) return;
    const f = forecast(cp);
    if (f.st === 'capture' || f.st === 'neutralize') toast(`${cp.name}: hold this zone for ${v139CapLeft(cp, f)} more turn start(s) to ${f.st === 'capture' ? 'capture' : 'neutralize'} it.`, 2200);
    else if (f.st === 'contested') toast(`${cp.name}: CONTESTED — enemy units are in the zone, state frozen.`, 2200);
    else if (f.st === 'blocked') toast(`${cp.name}: only armed vehicles / pinned squads here — infantry must hold the zone.`, 2200);
  }

  // ---------- HQ cannot be destroyed: Crippled state ----------
  function armHq(b) {
    let hp = b.hp;
    Object.defineProperty(b, 'hp', { configurable: true, enumerable: true, get: () => hp, set: v => { if (v <= 0) { v = 1; hp = 1; hqCripple(b); } else hp = v; } });
  }
  function hqCripple(b) {
    if (b.crippled) return;
    b.crippled = true;
    if (!vm.hqPaid[b.team]) { vm.hqPaid[b.team] = true; vm.tickets[b.team] = Math.max(0, vm.tickets[b.team] - HQ_PENALTY); }
    addLog(`💥 [HQ crippled] ${TEAM_NAME[b.team]} HQ — production & reinforcement offline, −${HQ_PENALTY} tickets (once)`, 'crit');
    toast(`${TEAM_NAME[b.team]} HQ CRIPPLED — it cannot be destroyed, but production stops until repaired.`, 4000);
    vmRefreshHud(); vmCheckWinner();
  }
  function hqUpkeep(team) {
    const b = buildings.find(x => x.team === team && x.type === 'hq'); if (!b) return;
    const threat = units.some(u => u.team !== team && u.hp > 0 && !u.isLoaded && isArmed(u) && getDistance(b.c, b.r, u.c, u.r) <= 3);
    if (b.hp < b.maxHp && !threat) b.hp = Math.min(b.maxHp, b.hp + HQ_REPAIR);
    if (b.crippled && b.hp >= b.maxHp * HQ_RECOVER) { b.crippled = false; addLog(`🔧 [HQ restored] ${TEAM_NAME[team]} HQ back online (${hpD(b.hp)}/${hpD(b.maxHp)})`, 'supply'); }
  }

  // ---------- maps ----------
  function hexLine(c1, r1, c2, r2) {   // odd-r offset line via cube lerp
    const a = offsetToCube(c1, r1), b = offsetToCube(c2, r2), n = Math.round(getDistance(c1, r1, c2, r2)), out = [];
    for (let i = 0; i <= n; i++) {
      const t = n ? i / n : 0, q = a.q + (b.q - a.q) * t + 1e-6, r = a.r + (b.r - a.r) * t + 1e-6, s = -q - r;
      let rq = Math.round(q), rr = Math.round(r), rs = Math.round(s);
      const dq = Math.abs(rq - q), dr = Math.abs(rr - r), ds = Math.abs(rs - s);
      if (dq > dr && dq > ds) rq = -rr - rs; else if (dr > ds) rr = -rq - rs;
      out.push([rq + (rr - (rr & 1)) / 2, rr]);
    }
    return out;
  }
  
  /* loadHistoricalMap: layer moved to js/chains/loadHistoricalMap.js */

  // ---------- rendering: zone rings + flag poles (inspired by the CoH3 screenshots) ----------
  const zoneRgb = o => o === 'blue' ? '56,189,248' : (o === 'red' ? '248,113,113' : '203,213,225');
  /* drawZones: original body removed — replaced by a later layer (js/chains/drawZones.js) */
  // ground disc(s) + capture flash: drawn UNDER the units
  function drawCapturePoint__base(cp) {
    const cs = cp.cores.map(k => getHexCenter(k[0], k[1])), x = cs.reduce((s, q) => s + q.x, 0) / cs.length, y = cs.reduce((s, q) => s + q.y, 0) / cs.length;
    if (x < camX - 50 || x > camX + VIEW_W + 50 || y < camY - 70 || y > camY + VIEW_H + 50) return;
    const now = performance.now(), rm = reduceMotion(), col = cp.owner ? TEAM_COL[cp.owner] : '#94a3b8';
    ctx.save();
    cs.forEach(q => { hexPath(q.x, q.y, HEX_RADIUS * .5); ctx.fillStyle = 'rgba(11,16,22,.55)'; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 1.4; ctx.stroke(); });
    const ft = cp.flashT ? (now - cp.flashT) / 1200 : 1;
    if (ft < 1 && !rm) { ctx.globalAlpha = 1 - ft; ctx.strokeStyle = col; ctx.lineWidth = 3 - ft * 2; ctx.beginPath(); ctx.arc(x, y, 9 + ft * 22, 0, 6.3); ctx.stroke(); }
    ctx.restore();
  }
  // pole + flag + income badge + tick-state badge: drawn ABOVE the units so objectives stay readable (CoH3 style)
  function drawCapturePointFlag(cp) {
    const cs = cp.cores.map(k => getHexCenter(k[0], k[1])), x = cs.reduce((s, q) => s + q.x, 0) / cs.length, y = cs.reduce((s, q) => s + q.y, 0) / cs.length;
    if (x < camX - 50 || x > camX + VIEW_W + 50 || y < camY - 70 || y > camY + VIEW_H + 50) return;
    const f = forecast(cp), now = performance.now(), rm = reduceMotion();
    const col = cp.owner ? TEAM_COL[cp.owner] : '#94a3b8', flag = cp.owner === 'blue' ? '#2f7fd8' : (cp.owner === 'red' ? '#d1453b' : '#8b97a6');
    ctx.save();
    const occ98 = units.some(u => u.hp > 0 && !u.isLoaded && cp.cores.some(k => k[0] === u.c && k[1] === u.r) && (u.team === currentTurn || visibleHexes.has(`${u.c},${u.r}`)));
    const m155 = typeof v155Top === 'function' ? v155Top(cp) : null;   // v155: 3D mast → cloth at its top
    const k98 = Math.min(1, 1.35 / zoom) * (occ98 ? .8 : 1), poleT = m155 ? () => { ctx.translate(m155.x - x, m155.y - (y - (cp.cls === 'vp' ? 34 : 27))); } : () => { ctx.translate(x - HEX_RADIUS * .38, y - HEX_RADIUS * .2); ctx.scale(k98, k98); ctx.translate(-x, -y); };
    poleT();                                                                     // v98: pole on the back corner of the hex, size capped on screen
    // pole
    const top = y - (cp.cls === 'vp' ? 34 : 27);
    if (!m155) { ctx.strokeStyle = '#d6dbe0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, top); ctx.stroke(); }
    // flag (waving)
    const fw = cp.cls === 'vp' ? 17 : 14, fh = cp.cls === 'vp' ? 11 : 9, wv = rm ? 0 : Math.sin(now / 260 + cp.c) * 1.6;
    if (!(typeof v100CpFlag === 'function' && typeof V100 !== 'undefined' && V100 && v100CpFlag(cp, x, top, fw, fh))) {   // v100: national flag cloth
    ctx.fillStyle = flag; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = .8;
    ctx.beginPath(); ctx.moveTo(x, top); ctx.quadraticCurveTo(x + fw * .5, top + wv - 1, x + fw, top + wv * .6); ctx.lineTo(x + fw, top + fh + wv * .6); ctx.quadraticCurveTo(x + fw * .5, top + fh + wv + 1, x, top + fh); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(cp.cls === 'vp' ? '★' : (cp.owner ? '' : '·'), x + fw / 2, top + fh / 2 + .5); }
    ctx.restore(); ctx.save(); ctx.translate(x + HEX_RADIUS * .46, y + HEX_RADIUS * .28); ctx.scale(k98, k98); ctx.translate(-x - 12, -y + 7);   // v98: income marker on the front corner
    // income badge (circle + "+N"), like the CoH3 resource markers
    const bx = x + 12, by = y - 7, y0 = cp.yield || YIELD[cp.cls] || {}, cut131 = cp.owner && !v131Supplied(cp, cp.owner);
    ctx.fillStyle = 'rgba(10,14,18,.92)'; ctx.strokeStyle = cp.owner ? col : 'rgba(148,163,184,.9)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(bx, by, 7.5, 0, 6.3); ctx.fill(); ctx.stroke();
    ctx.font = '8px sans-serif';
    ctx.fillStyle = { manpower: '#e0b24a', fuel: '#e0863a', fuel_minor: '#e0863a', mun: '#a8c45a', vp: '#f0c75a' }[cp.cls] || '#cdd2d7';
    ctx.fillText(CLS_ICO[cp.cls], bx, by + .5);   // v61: drawn from the shared icon set via the fillText wrapper
    const txt = cp.cls === 'vp' ? 'VP' : cut131 ? '단절' : (cp.cls === 'manpower' ? '+' + (y0.g || 0) : (y0.f ? '+' + y0.f : '+' + (y0.m || y0.g || 0)));
    if (!occ98) { ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'left'; ctx.lineWidth = 2.2; ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.strokeText(txt, bx + 10, by + .5); ctx.fillStyle = cut131 ? '#94a3b8' : cp.owner ? '#fff' : '#cbd5e1'; ctx.fillText(txt, bx + 10, by + .5); }
    ctx.restore(); ctx.save(); poleT();
    // tick state badge: ⚔ contested · number = ticks of the capturing side until the flag changes (1 = at its next turn start)
    const sb = (txt2, bcol) => { ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(10,14,18,.94)'; ctx.strokeStyle = bcol; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(x - 11, top + 3, 6.5, 0, 6.3); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.font = 'bold 8.5px sans-serif'; ctx.fillText(txt2, x - 11, top + 3.5); };
    if (f.st === 'contested') sb('⚔', '#fb923c');
    else if (f.st === 'capture') sb(String(v139CapLeft(cp, f)), TEAM_COL[f.tm]);
    else if (f.st === 'neutralize') sb(String(v139CapLeft(cp, f)), TEAM_COL[f.tm]);
    else if (f.st === 'blocked') sb('!', '#94a3b8');
    ctx.restore();
  }

  // ---------- HUD: ONE top plate = resources (funds / fuel / munitions) + Victory Meter (tickets · VP pips · next bleed) ----------
  const HUD_ICO = {   // angular single-colour glyphs (currentColor)
    g: '<svg class="ic" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 3h10v6H1z" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M4 6h4" stroke="currentColor" stroke-width="1.3"/></svg>',
    f: '<svg class="ic" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4h6l2 2v5H2z" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M4 4V1.5h3V4" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>',
    m: '<svg class="ic" viewBox="0 0 12 12" aria-hidden="true"><path d="M1.5 11V5L3 3l1.5 2v6zM5.2 11V5L6.7 3l1.5 2v6zM8.9 11V5L10.4 3l1.5 2v6z" fill="currentColor" transform="translate(-.9 0) scale(.92 1)"/></svg>' };
  function vmRefreshHud__base() {
    const box = document.getElementById('gold-display'); if (!box) return;
    const i = incomeOf(currentTurn), b = vm.tickets.blue, r = vm.tickets.red, p = vm.winner ? null : settlePlan();
    const bl = vm.winner ? 'WIN' : (p && p.loser && p.bleed ? (p.loser === 'red' ? '►' : '◄') + p.bleed : '—');
    const res = (k, v, inc, t) => `<span class="rs" title="${t}">${HUD_ICO[k]}<b>${v}</b><i>+${inc}</i></span>`;
    box.innerHTML = `<span class="rsg">${res('g', gold[currentTurn], i.g, 'Funds')}${res('f', fuel[currentTurn], i.f, 'Fuel')}${res('m', mun[currentTurn], i.m, 'Munitions')}</span>` +
      `<span class="vmx" role="button" tabindex="0" aria-label="Victory Meter details"><b class="n b">${b}</b><span class="vs b"><i style="width:${100 * b / VM_START}%"></i></span>` +
      `<span class="pips">${capturePoints.filter(c => c.cls === 'vp').map(c => `<span class="pip ${c.owner || ''}" title="${c.name}"></span>`).join('')}</span>` +
      `<span class="vs r"><i style="width:${100 * r / VM_START}%"></i></span><b class="n r">${r}</b><span class="bl">${bl}</span></span>`;
    goldBoxEl.title = 'Tap resources: income details · tap Victory Meter: points & tickets';
  }
  goldBoxEl.addEventListener('click', e => { if (e.target.closest && e.target.closest('.vmx')) { e.stopImmediatePropagation(); openVmSheet(); } }, true);
  goldBoxEl.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest && e.target.closest('.vmx')) { e.stopImmediatePropagation(); e.preventDefault(); openVmSheet(); } }, true);
  function openVmSheet__base() {
    const p = vm.winner ? (vm.last || settlePlan()) : settlePlan(), el = document.getElementById('vm-body'); if (!el) return;
    const rows = capturePoints.filter(c => c.cls === 'vp').concat(capturePoints.filter(c => c.cls !== 'vp')).map(c => {
      const f = forecast(c), st = ({ contested: '⚔ contested', capture: '▲ capturing', neutralize: '▲ neutralizing', held: 'held', blocked: '! blocked', idle: '' })[f.st] || '';
      return `<tr><td>${cpIcon(c)} ${c.name}</td><td style="color:${c.owner ? TEAM_COL[c.owner] : '#94a3b8'}">${c.owner ? TEAM_NAME[c.owner] : 'Neutral'}</td><td style="color:#94a3b8">${st}</td></tr>`;
    }).join('');
    const hq = tm => { const b = buildings.find(x => x.team === tm && x.type === 'hq'); return b ? (b.crippled ? '<span style="color:#f87171">CRIPPLED</span>' : 'online') + ` ${hpD(b.hp)}/${hpD(b.maxHp)}` : '—'; };
    el.innerHTML =
      (vm.winner ? `<div class="set-group"><h3>🏆 ${TEAM_NAME[vm.winner]} victory</h3><div class="sheet-note">The enemy Victory Meter reached 0.</div><div class="set-row"><button onclick="resetGame()">New game</button></div></div>` : '') +
      `<div class="set-group"><h3>Victory Meter</h3><dl class="kv">${kvRow('Allied tickets', vm.tickets.blue, 'pos')}${kvRow('Axis tickets', vm.tickets.red, 'neg')}${kvRow('Victory Points', `${vpCount('blue')} – ${vpCount('red')}`, 'tot')}` +
      `${vm.winner ? '' : kvRow('Next settlement', p.loser && p.bleed ? `${TEAM_NAME[p.loser]} −${p.bleed}${p.tie ? ' (resource tiebreak)' : ''}` : 'no bleed')}${!vm.winner && p.vpLeader ? kvRow('Momentum', `+${p.mom} (streak ${p.streak})`) : ''}${kvRow('Resource control', `${p.sb} – ${p.sr}`)}</dl>` +
      `<div class="sheet-note">Hold more Victory Points than the enemy and they bleed tickets every turn (lead 1/2/3 = 2/5/10, +1 per 6 consecutive turns). At parity a resource-control gap of 4+ bleeds 1. Reach 0 tickets and you lose. There is no turn limit, and HQs cannot be destroyed.</div></div>` +
      `<div class="set-group"><h3>Points</h3><table class="vm-tab">${rows}</table><div class="sheet-note">Sectors: a captured point takes its whole sector; resources pay only while the sector links back to your HQ sector through your own sectors (VPs always count). Tier buildings go inside the HQ sector. Zones: VP radius 3, resources radius 2. Armed, un-pinned infantry and the jeep / Weasel / Kettenkrad capture; other armed vehicles and pinned squads only contest. A neutral point flips at your next turn start; an enemy point is neutralized first, then captured one turn later.</div></div>` +
      `<div class="set-group"><h3>Headquarters</h3><dl class="kv">${kvRow('Allied HQ', hq('blue'))}${kvRow('Axis HQ', hq('red'))}</dl><div class="sheet-note">A crippled HQ (HP floor 1) cannot produce or reinforce, costs −${HQ_PENALTY} tickets once, and recovers at 25% HP (+${HQ_REPAIR} HP/turn when no enemy armed unit is within 3 hexes).</div></div>`;
    openSheet('vm-sheet');
  }
  
  /* render: layer moved to js/chains/render.js */
  
  /* updateGoldUI: layer moved to js/chains/updateGoldUI.js */
  
  /* resetGame: layer moved to js/chains/resetGame.js */


