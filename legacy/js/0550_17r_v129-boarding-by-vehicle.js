  // ══════════════════════════════════════════════════════════════
  // [17r] v129 — boarding by vehicle size, bail-out, skill ranges x 5/6, idle blink
  //   capacity is counted in squads: infantry and small crew weapons (HMG, mortar) take one seat, a medium crew weapon
  //   (AT guns, LG 40, pack howitzer, Flak 30, Nebelwerfer, M5) fills the vehicle, large guns cannot board.
  // ══════════════════════════════════════════════════════════════
  const V129_HW = { S: '소형 중화기 — 1분대분', M: '중형 중화기 — 차량 1대 전체', L: '대형 — 탑승 불가' };
  function v129CargoUsed(v) { return v.cargo.reduce((a, c) => a + (c.hw === 'M' ? v.cargoCap : 1), 0); }
  function v129BoardRefusal(p, v) {
    if (p.empl) return '진지는 옮길 수 없습니다.';   // v134
    if (!(v.cargoCap > 0)) return '탑승할 수 없는 차량입니다.';
    if (p.hw === 'L') return '대형 중화기는 차량에 실을 수 없습니다.';
    if (p.hw && !v.tow) return `${v.className}에는 중화기를 실을 수 없습니다.`;
    if (v.cargo.some(c => c.hw === 'M')) return '중형 중화기를 실은 차량에는 더 탈 수 없습니다.';
    if (p.hw === 'M' && v.cargo.length) return '중형 중화기는 빈 차량에만 실을 수 있습니다.';
    if (v129CargoUsed(v) >= v.cargoCap) return `수송 정원 초과! (${v129CargoUsed(v)}/${v.cargoCap}분대)`;
    return '';
  }
  function v129CargoHtml(u) {
    if (!(u.cargoCap > 0) || !u.cargo) return '';
    let h = `<div class="action-subpanel"><strong>[탑승] ${v129CargoUsed(u)}/${u.cargoCap}분대${u.tow ? ' · 중화기 가능' : ''}</strong> `;
    if (u.cargo.length) h += `<span style="font-size:9px; color:#38bdf8;">${u.cargo.map(c => c.className).join(', ')}</span> <button class="btn-action" style="display:inline-block; padding:2px 5px;" onclick="startTargetedDismount(selectedUnit)">하차 지정</button>`;
    else h += `<span style="font-size:9px; color:#94a3b8;">인접한 아군 보병·중화기를 선택한 뒤 이 차량을 탭하면 탑승</span>`;
    return h + '</div>';
  }
  // passengers of a destroyed vehicle bail out next to the wreck with a quarter of their health lost; no room = lost
  function v129Eject__base() {
    for (const v of units) {
      if (v.hp > 0 || !v.cargo || !v.cargo.length) continue;
      for (const p of v.cargo.splice(0)) {
        const spot = [{ c: v.c, r: v.r }].concat(getHexNeighbors(v.c, v.r)).find(n => !getUnitAt(n.c, n.r) && !getBuildingAt(n.c, n.r) && (n.c === v.c && n.r === v.r || getTileMovementCost(p, v.c, v.r, n.c, n.r) !== Infinity));
        p.isLoaded = false;
        if (!spot) { p.hp = 0; addLog(`💀 [탑승 중 손실] ${p.className} — ${v.className} 격파`, 'crit'); continue; }
        p.c = spot.c; p.r = spot.r; p.remainingMove = 0; p.hasMoved = true;
        p.hp = Math.max(1, Math.round(p.hp * 0.75));
        addLog(`🚪 [긴급 하차] ${p.className} — ${v.className} 격파 (체력 −25%)`, 'crit');
      }
    }
  }
  
  /* render: layer moved to js/chains/render.js */
  const v129Idle = u => endArmed && u.team === currentTurn && u.hp > 0 && !u.isLoaded && !u.hasMoved && !u.hasAttacked;
  // skill ranges follow the range scale (1 hex = 7 m): x 5/6, rounded; unit-range skills already scale with the unit
  Object.values(USK).forEach(d => { if (typeof d.rng === 'number' && d.rng > 1) d.rng = Math.round(d.rng * 5 / 6); });

