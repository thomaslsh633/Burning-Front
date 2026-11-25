  // ══════════════════════════════════════════════════════════════
  // [v194] Turret direction hold:
  //   · the aim of a turreted vehicle is an absolute angle (u._tur.a); moving or turning the hull only changes the hull — while the unit is ENGAGED
  //     (v158: it attacked in its last own turn); an unengaged unit lets the turret follow the hull as before (blend back at the start of a move / turn)
  //   · at the end of the owner's turn the turret of every unit that is no longer engaged swings back to the hull direction (350 ms); units that
  //     retreated or are loaded drop the aim at once; there is no manual realign tile
  // ══════════════════════════════════════════════════════════════
  { const o = v158EndOwnTurn; v158EndOwnTurn = function (tm) {
      const r = o.apply(this, arguments), now = v174Now();
      units.forEach(u => {
        if (u.team !== tm || !u._tur) return;
        if (u.hp <= 0 || u.isLoaded) { delete u._tur; return; }
        if (!u.engaged) { if (v183On(u) && !reduceMotion()) V183.re.set(u, { from: u._tur.a, t0: now, dur: 350 }); delete u._tur; }
      });
      return r;
    }; }

  // ══════════════════════════════════════════════════════════════
  // [v196/v197] Reverse move ("후진" toggle) for every vehicle (v197: no threat gating — turn first with 선회, then reverse behind the hull)
  //   · every vehicle gets a "후진" tile in the skill tray (ON / OFF); the reference is the hull facing (set beforehand with 선회); while ON the move
  //     tiles are the hexes reachable inside ±60° around (facing + 180°) (every step) at terrain cost + 1 move per hex; the hull keeps its facing
  //     and slides backwards; the toggle switches itself off after one move (or when the unit is deselected / a turn stage opens)
  // ══════════════════════════════════════════════════════════════
  var V196 = { uid: null, lim: Math.PI / 3 + 1e-3, cost: 1 };
  const v196Has = u => !!u && u.team === currentTurn && u.hp > 0 && !u.isLoaded && v130Reverses(u);   // v197: every vehicle; the hull facing (set by 선회) is the reference
  const v196On = u => !!u && V196.uid === u.id && v196Has(u) && !v189Stage(u) && !V173.anim;
  function v196Reach(u) {
    const rear = u.facingAngle + Math.PI, k0 = u.c + ',' + u.r, dist = { [k0]: 0 }, prev = {}, q = [{ c: u.c, r: u.r, cost: 0 }], out = [];
    while (q.length) {
      q.sort((a, b) => a.cost - b.cost); const cur = q.shift(), ck = cur.c + ',' + cur.r;
      if (cur.cost > dist[ck]) continue;
      for (const n of getHexNeighbors(cur.c, cur.r)) {
        const A = getHexCenter(cur.c, cur.r), B = getHexCenter(n.c, n.r), v = unproj(B.x - A.x, B.y - A.y);
        if (Math.abs(v173Ang(Math.atan2(v.y, v.x) - rear)) > V196.lim) continue;
        const step = getTileMovementCost(u, cur.c, cur.r, n.c, n.r); if (step === Infinity) continue;
        const occ = getUnitAt(n.c, n.r); if (occ && occ !== u && (occ.team !== u.team || occ.armorType === 'hard' || occ.isHeavy)) continue;
        const cost = cur.cost + step + V196.cost, nk = n.c + ',' + n.r;
        if (cost > u.remainingMove || (u.hasFuel && cost > u.fuel)) continue;
        if (dist[nk] !== undefined && dist[nk] <= cost) continue;
        dist[nk] = cost; prev[nk] = ck; q.push({ c: n.c, r: n.r, cost });
      }
    }
    for (const k in dist) {
      if (k === k0) continue; const [c, r] = k.split(',').map(Number); if (getUnitAt(c, r)) continue;
      const path = []; for (let x = k; x !== undefined; x = prev[x]) { const [pc, pr] = x.split(',').map(Number); path.unshift({ c: pc, r: pr, cost: dist[x] }); }
      out.push({ c, r, cost: dist[k], rev: true, rpath: path });
    }
    return out;
  }
  const v196Why = u => !v196Has(u) ? '지금은 후진할 수 없습니다.' : v189Stage(u) ? '선회 중에는 후진할 수 없습니다.' : !v196Reach(u).length ? '후진할 수 있는 칸이 없습니다 (이동력·지형).' : '';
  function v196Rev(uid) {
    const u = uById(uid); if (!u) return;
    if (V196.uid === u.id) V196.uid = null;   // (the tile passes the id as a string: always compare with the unit's own id)
    else { const why = v196Why(u); if (why) { toast(why); return; } V196.uid = u.id; }
    V175.pend = null; updateActionTiles(u); updateUnitInfoPanel(u, getTerrain(u.c, u.r)); render();
  }
  window.v196Rev = v196Rev;
  function v196Btn(u) {
    if (!v196Has(u)) return '';
    const on = v196On(u), why = on ? '' : v196Why(u);
    return `<button class="btn-action${on ? ' busy' : ''}" ${why ? 'style="opacity:.55"' : ''} onclick="v196Rev('${u.id}')"><span>⏪ <strong>후진</strong><br><small>${on ? 'ON' : 'OFF'} · ${why || '차체 반대 ±60° · 칸당 이동력 +1'}</small></span></button>`;
  }
  {  /* tglBtns: layer moved to js/chains/tglBtns.js */ }
  // the toggle owns the move tiles while it is on
  {  /* updateActionTiles: layer moved to js/chains/updateActionTiles.js */ }
  {  /* render: layer moved to js/chains/render.js */ }
  { const o = v158EndOwnTurn; v158EndOwnTurn = function (tm) { const r = o.apply(this, arguments); V196.uid = null; return r; }; }
  // the reverse animation: turn to the threat (if needed), then slide backwards with the facing kept
  {  /* v173Begin: layer moved to js/chains/v173Begin.js */ }

  // ══════════════════════════════════════════════════════════════
  function v186Begin(u, c, r, anyAim) {
    if (reduceMotion()) { if (anyAim || v183On(u) || v184Fixed(u)) v183Aim(u, c, r); return null; }
    V180.collect = []; let turns;
    try { if (anyAim || v183On(u) || v184Fixed(u)) v183Aim(u, c, r); } finally { turns = V180.collect; V180.collect = null; }
    return { u, c, r, turns, n0: fxList.length };
  }
  function v186End(fx, dmg, down) {
    if (!fx) return;
    const u = fx.u, t0 = v174Start(), tr = fx.turns.find(x => x.u === u), ms = tr ? v180TurnMs(u, tr.d, tr.tur) : 0;
    if (tr && ms > 0) v180TurnSet(u, tr.a, tr.d, t0, ms, tr.tur);
    const pseudo = { c: fx.c, r: fx.r, armorType: 'hard', team: 'none', hp: 1, key: 'building' };
    const end = v174Attack(u, pseudo, t0 + ms, { dmg: Math.max(1, dmg | 0), kill: !!down, miss: false });
    v174FxShift(fx.n0, () => end - 20);   // the floating damage numbers wait for the impact
    V174.busyUntil = Math.max(V174.busyUntil || 0, end + 80 + V176.tail); v174Kick();
  }

