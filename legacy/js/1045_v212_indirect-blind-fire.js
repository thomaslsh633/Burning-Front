  // [v212] indirect fire outside own sight
  //   · mortars, howitzers, rocket launchers and SPG artillery may fire at any hex in range and arc, seen or not
  //   · a hex out of sight is a blind barrage: each shell lands on the aimed hex or a random neighbour (v214)
  //     and hits whatever stands there, friend or foe
  //   · targets in sight keep the aimed shot (calcDamage); blind fire gets no return fire and logs no target names
  var V212 = { rad: 1, quiet: false, pend: null };
  const v212Indirect = u => !!(u && (u.isMortar || u.isArtillery || u.isNebel));

  // hexes added to validAttacks: in range / arc, not visible, no own unit or building on them
  function v212BlindTiles(u) {
    const out = [];
    if (!v212Indirect(u) || u.hasAttacked || !(u.ammo > 0) || suppState(u) >= 2) return out;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const k = c + ',' + r; if (visibleHexes.has(k) || (terrainMap[k] || {}).oob) continue;
      if (!mainReach(u, c, r, getDistance(u.c, u.r, c, r))) continue;
      out.push({ c, r, blind: true });
    }
    return out;
  }
  const v212IsBlind = (c, r) => validAttacks.some(a => a.blind && a.c === c && a.r === r);

  // tap on a blind hex: first tap marks it, second tap on the same hex fires
  function v212BlindTap(hex) {
    const u = selectedUnit;
    if (!u || u.team !== currentTurn || !v212IsBlind(hex.c, hex.r)) { V212.pend = null; return false; }
    if (!V212.pend || V212.pend.c !== hex.c || V212.pend.r !== hex.r) {
      V212.pend = { c: hex.c, r: hex.r }; clearAttackPreview();
      const n = Math.max(1, Math.round(u.rof || 1));
      guideBanner.textContent = `🎯 시야 밖 포격 (${hex.c},${hex.r}) — ${n}발, 반경 ${V212.rad} 무작위 착탄 · 같은 칸을 다시 탭하면 발사`;
      guideBanner.style.display = 'block'; render(); return true;
    }
    V212.pend = null; guideBanner.style.display = 'none';
    v212BlindFire(u, hex.c, hex.r);
    if (u.hp > 0) { updateActionTiles(u); updateUnitInfoPanel(u, getTerrain(u.c, u.r)); }
    else { selectedUnit = null; validMoves = []; validAttacks = []; updateUnitInfoPanel(null, null); }
    render(); return true;
  }

  // v214: each shell lands on the aimed hex with the far-band hit chance, otherwise on a random neighbour;
  //   a unit there takes one shell as a direct hit (same raw HE rule as aimed fire); buildings / structures take an impact
  function v212BlindFire(u, c, r) {
    if (!u.isHeavy || u.arcAngle >= 6.28) v183Aim(u, c, r);
    const shells = Math.max(1, Math.round(u.rof || 1)), nb = getHexNeighbors(c, r), pAim = u.acc ? u.acc[2] : 0.3;
    const one = Object.assign({}, u, { rofB: [1, 1, 1], rof: 1, acc: [1, 1, 1] });
    u.ammo -= 1; u.hasAttacked = true; v158Engage(u); v214Fired(u); addVeterancyExp(u, 2, 'atk');
    addLog(`🎯 [시야 밖 포격] ${u.className} ➔ (${c},${r}) 일대 ${shells}발`, 'artillery');
    V212.quiet = true;
    try {
      for (let i = 0; i < shells; i++) {
        const h = Math.random() < pAim || !nb.length ? { c, r } : nb[Math.floor(Math.random() * nb.length)], d = getUnitAt(h.c, h.r);
        if (d && d.hp > 0) {
          const res = calcDamage(one, d); d.hp = Math.max(0, d.hp - res.damage); applyHitEffects(one, d, res);
          if (d.hp <= 0) addVeterancyExp(u, 8, d);
        } else impact(u.team, h.c, h.r, u, 0, 1, false);
      }
    } finally { V212.quiet = false; }
    checkVictory(); updateVision();
  }
