  // ══════════════════════════════════════════════════════════════
  // [02] 공용 UI 유틸
  //     · 지원 패널 토글(supOpen) · 햅틱(buzz) · 모션감소 · 플로팅 텍스트(fx*) · 토스트(toast/toastAsk) · 턴종료 2단계 · addLog
  // ══════════════════════════════════════════════════════════════
  // --- v11: 지원 패널 토글 · 플로팅 텍스트 · 햅틱 ---
  const supPanel = document.getElementById("sup-panel"), supTab = document.getElementById("sup-tab");
  function supLabel() { const o = supPanel.classList.contains("open"); supTab.innerHTML = o ? "‹" : `CP<b>${typeof cpOf === "function" && typeof teamXp !== "undefined" ? cpOf(currentTurn) : 0}</b>`; }
  function supOpen(o) { supPanel.classList.toggle("open", o); supTab.style.right = o ? "min(250px,66%)" : "0"; supTab.style.left = "auto"; if (!o) { window.cpSel = null; const ci = document.getElementById("cp-info"); if (ci) ci.classList.remove("open"); } supLabel(); if (o) renderResearch(); }
  supTab.addEventListener("click", () => supOpen(!supPanel.classList.contains("open")));
  canvas.addEventListener("pointerdown", () => supOpen(false));
  let hapticOn = true; const hapBtn = document.getElementById("haptic-btn");
  hapBtn.addEventListener("click", () => { hapticOn = !hapticOn; hapBtn.textContent = "진동: " + (hapticOn ? "켜짐" : "꺼짐"); });
  const buzz = ms => { if (hapticOn && navigator.vibrate) navigator.vibrate(ms); };
  // v23: 시스템의 모션 감소 설정. 캔버스 효과는 이 값을 읽어 움직임을 없애고 정보만 남긴다.
  const rmQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reduceMotion = () => rmQuery.matches;
  let fanLbl = null;
  const fxList = [], fxPrev = new Map(); let fxRaf = 0;
  function fxAdd(u, text, color, dy = 0) {
    if (u.team !== currentTurn && !visibleHexes.has(`${u.c},${u.r}`)) return;
    fxList.push({ c: u.c, r: u.r, text, color, dy, t0: performance.now() });
  }
  // v59: a point "pulses" when the selected unit can step into its zone and would start (or continue) a capture there
  const capReady = cp => !!selectedUnit && selectedUnit.team === currentTurn && cp.owner !== selectedUnit.team && !!cp.zone && isCapturer(selectedUnit) && validMoves.some(t => cp.zone.has(t.c + ',' + t.r));
  const cpFlashing = () => !reduceMotion() && (endArmed || !!(V130.pv && pendingAttackTarget) || capturePoints.some(cp => (cp.flashT && performance.now() - cp.flashT < 1200) || capReady(cp)));   // v129: + idle blink
  function fxScan() {
    units.forEach(u => {
      const p = fxPrev.get(u.id), ss = suppState(u) || 0;
      if (p && p.ref === u) {
        if (u.hp < p.hp) { fxAdd(u, `-${hpD(p.hp - u.hp)}`, "#f87171"); if (u.hp <= 0) { fxAdd(u, "격파!", "#fbbf24", -10); buzz(60); } }
        else if (u.hp > p.hp + 0.5) fxAdd(u, `+${hpD(u.hp - p.hp)}`, "#4ade80");
        if (ss > p.ss) { fxAdd(u, ss === 2 ? "고착!" : "제압!", ss === 2 ? "#ef4444" : "#fbbf24", -10); buzz(30); }
        if (u.trackDamaged && !p.trk) fxAdd(u, "궤도 손상", "#fb923c", -10);
      }
      fxPrev.set(u.id, { ref: u, hp: u.hp, ss, trk: !!u.trackDamaged });
    });
    if ((fxList.length || cpFlashing()) && !fxRaf) fxRaf = requestAnimationFrame(fxTick);
  }
  function v129Kick() { if (!fxRaf && !reduceMotion()) fxRaf = requestAnimationFrame(fxTick); }   // v129: start the fx loop for the idle blink
  function fxTick() {
    fxRaf = 0; const now = performance.now();
    for (let i = fxList.length - 1; i >= 0; i--) if (now - fxList[i].t0 > 1100) fxList.splice(i, 1);
    if (fxList.length || cpFlashing()) fxRaf = requestAnimationFrame(fxTick);
    render();
  }
  function fxDraw__base() {
    const now = performance.now();
    ctx.save(); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = "bold 9px sans-serif"; ctx.lineWidth = 2.5; ctx.strokeStyle = "rgba(0,0,0,.85)";
    fxList.forEach(f => {
      const a = Math.min(1, (now - f.t0) / 1100), q = getHexCenter(f.c, f.r), rm = reduceMotion(), y = q.y - 20 + f.dy - (rm ? 0 : a * 14);
      ctx.globalAlpha = rm ? (a < .85 ? 1 : 0) : 1 - a * a; ctx.fillStyle = f.color; ctx.strokeText(f.text, q.x, y); ctx.fillText(f.text, q.x, y);
    });
    ctx.restore();
  }

  // --- v8 UI: 토스트 / 2단계 버튼 (alert·confirm 대체) ---
  const toastWrap = document.getElementById("toast-wrap");
  let toastTimer = null;
  function toast(msg, ms = 2500) {
    toastWrap.innerHTML = ""; clearTimeout(toastTimer);
    const t = document.createElement("div"); t.className = "toast"; t.textContent = msg;
    toastWrap.appendChild(t); toastTimer = setTimeout(() => t.remove(), ms);
  }
  function toastAsk(msg, opts) {
    toastWrap.innerHTML = ""; clearTimeout(toastTimer);
    const t = document.createElement("div"); t.className = "toast ask";
    const s = document.createElement("span"); s.textContent = msg; t.appendChild(s);
    opts.forEach(([label, fn]) => { const b = document.createElement("button"); b.textContent = label; b.onclick = () => { t.remove(); fn(); }; t.appendChild(b); });
    const x = document.createElement("button"); x.textContent = "취소"; x.className = "cancel"; x.onclick = () => t.remove(); t.appendChild(x);
    toastWrap.appendChild(t);
  }
  let endArmed = false, endArmTimer = null;
  function endDisarm() { endArmed = false; clearTimeout(endArmTimer); endTurnBtn.textContent = "턴 종료"; endTurnBtn.classList.remove("armed"); if (mapReady) render(); }


  function addLog(msg, type = "normal") {
    let cls = "";
    if (type === "crit") cls = "log-crit";
    else if (type === "flame") cls = "log-flame";
    else if (type === "sniper") cls = "log-sniper";
    else if (type === "artillery") cls = "log-artillery";
    else if (type === "counter") cls = "log-counter";
    else if (type === "supply") cls = "log-supply";
    else if (type === "bounty") cls = "log-bounty";
    else if (type === "eng") cls = "log-eng";
    else if (type === "move") cls = "log-move";
    else if (type === "rank") cls = "log-rank";
    logEl.innerHTML += `<div class="${cls}">> ${msg}</div>`;
    logEl.scrollTop = logEl.scrollHeight;
  }

