  // ══════════════════════════════════════════════════════════════
  // [v181] Scripted moves get the walking animation too: retreat, unloading, deploying a new unit out of its building,
  //   boarding a vehicle, bailing out of a destroyed one. Each is the usual path animation (turns, pivots, camera follow);
  //   a unit stepping out of a building / vehicle fades in, a boarding one fades out at the door. Crew-served weapons that
  //   are set up / packed up get a short plant / lift motion (dip or hop, dust, tripod legs).
  // ══════════════════════════════════════════════════════════════
  var V181 = { board: new Set(), emerge: new Map(), plant: new Map() };
  function v181Path(u, a, b) {
    const sc = u.c, sr = u.r, rm = u.remainingMove, hf = u.hasFuel; u.c = a.c; u.r = a.r; u.remainingMove = 99; u.hasFuel = false;
    let p = null; try { p = v173Path(u, b); } finally { u.c = sc; u.r = sr; u.remainingMove = rm; u.hasFuel = hf; }
    return p && p.length >= 2 ? p : [{ c: a.c, r: a.r, cost: 0 }, { c: b.c, r: b.r, cost: 1 }];
  }
  // u already stands on its final hex; animate it from `from`
  function v181Walk(u, from, opt) {
    opt = opt || {};
    if (reduceMotion() || !u || !from || (from.c === u.c && from.r === u.r) || V173.anim) return false;
    const to = { c: u.c, r: u.r }, seen0 = new Set(units.filter(e => e.team !== u.team && e.hp > 0 && !e.isLoaded && visibleHexes.has(e.c + ',' + e.r)).map(e => e.id));
    const path = v181Path(u, from, to), fa0 = opt.fa0 !== undefined ? opt.fa0 : u.facingAngle;
    v173Begin(u, { path, fa0, seen0, keep: !!opt.keep });
    if (!V173.anim || V173.anim.u !== u) return false;
    if (opt.emerge) V181.emerge.set(u, performance.now());
    if (opt.board) V181.board.add(u);
    return true;
  }
  {  /* v140RetStep: layer moved to js/chains/v140RetStep.js */ }
  {  /* boardUnit: layer moved to js/chains/boardUnit.js */ }
  {  /* v129Eject: layer moved to js/chains/v129Eject.js */ }
  {  /* v173End: layer moved to js/chains/v173End.js */ }
  // fades: stepping out (0.16 s in) / boarding (the last 0.14 s out)
  {  /* drawUnitArt: layer moved to js/chains/drawUnitArt.js */ }
  function v181Plant(u, on) {
    const t = v174Now(), P = getHexCenter(u.c, u.r), sf = v176Surface(u.c, u.r), rgb = sf === 'snow' ? '226,233,240' : sf === 'dirt' ? '150,128,96' : '150,146,140';
    V181.plant.set(u, { t0: t, on });
    [-1, 1].forEach(sd => v174Add(t + 30, 520, (k) => v176Soft(P.x + sd * (6 + 9 * k), P.y + 1, 3.2 + 4 * k, rgb, .5 * (1 - k))));
    v174Kick();
  }
  {  /* v159SetEmpl: layer moved to js/chains/v159SetEmpl.js */ }

