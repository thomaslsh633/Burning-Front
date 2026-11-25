  // [v214] Indirect fire (mortars, howitzers, SPG artillery, rocket launchers) from the CoH3 weapon data (COH3_IND)
  //   · raw values with the usual scale: damage x RAW.HPK, penetration x RAW.PENK; range stays the game's current range
  //   · damage uses the raw HE rule: a direct hit lands on one man (never more than his HP), the AoE falloff (aoe)
  //     splashes the others up to maxM members; a miss splashes aoe x MISS_AOE
  //   · accuracy = chance a shell lands on the target's hex, from the CoH3 scatter at the middle of each range band
  //   · turn figures (shells per attack, reload turns, member cap in play) are balance values in V214.TURN
  var V214 = {
    HIT_R: 2.5,   // m: radius around the aimed point that counts as a direct hit
    TURN: {       // n shells per attack · r reload turns after firing · m max members hit per shell
      blue: { mortar: { n: 1, r: 0, m: 4 }, pack75: { n: 1, r: 0, m: 4 }, scott: { n: 1, r: 0, m: 3 }, howitzer: { n: 1, r: 1, m: 4 },
              priest: { n: 1, r: 1, m: 4 }, whizbang: { n: 2, r: 1, m: 4 } },
      red: { mortar: { n: 1, r: 0, m: 4 }, howitzer: { n: 1, r: 1, m: 5 }, hummel: { n: 1, r: 1, m: 5 }, wespe: { n: 1, r: 1, m: 4 },
             obice210: { n: 1, r: 2, m: 3 }, nebel: { n: 2, r: 2, m: 5 } }
    }
  };
  // direct-hit chance at a distance (m) from the scatter ellipse [angle deg, distance ratio, max m]
  function v214HitChance(sc, m) {
    const lat = Math.max(.3, Math.min(sc[2], m * Math.tan(sc[0] * Math.PI / 180)) / 2), lon = Math.max(.3, Math.min(sc[2], sc[1] * m) / 2);
    return Math.round(Math.min(.95, V214.HIT_R * V214.HIT_R / (lat * lon)) * 100) / 100;
  }
  function v214Apply(tm, key) {
    const t = UNIT_ROSTER[tm] && UNIT_ROSTER[tm][key], D = COH3_IND[tm][key], T = V214.TURN[tm][key];
    if (!t || !D || !T) return;
    const R = t.range, e = v200Ends(R), lo = Math.max(1, t.minR || 0);
    const mid = (a, b) => ((Math.max(a, lo) + Math.max(b, lo)) / 2) * RAW.HEX_M;
    t.raw = true; t.rawW = Object.assign({ ind: true }, D); t.overkill = false; t.area = 1;
    t.atk = rawR2(D.d * RAW.HPK); t.pen = [0, 0, 0].map(() => rawR2(D.pen * RAW.PENK)); t.aoe = D.aoe;
    t.closeEnd = e[0]; t.midEnd = e[1];
    t.acc = [mid(1, e[0]), mid(e[0] + 1, e[1]), mid(e[1] + 1, R)].map(m => v214HitChance(D.sc, m));
    t.rofB = [T.n, T.n, T.n]; t.rof = T.n; t.reload = T.r; t.maxM = T.m;
  }
  ['blue', 'red'].forEach(tm => Object.keys(V214.TURN[tm]).forEach(k => v214Apply(tm, k)));

  // reload: an indirect unit that fired waits t.reload own turns (turnNo counts both sides' turns)
  function v214Fired(u) { if (u && u.reload > 0) u.fireT = turnNo; }
  function v214ReloadLeft(u) {
    if (!u || !(u.reload > 0) || u.fireT === undefined) return 0;
    return Math.max(0, Math.floor((u.fireT + 2 * (u.reload + 1) - turnNo) / 2) - (u.fireT === turnNo ? 1 : 0));
  }
  const v214Reloading = u => u && u.fireT !== undefined && u.fireT !== turnNo && v214ReloadLeft(u) > 0;
