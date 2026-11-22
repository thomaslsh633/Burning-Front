  // [v200] Longer engagements: sight +1 for every unit, range +1 for direct-fire weapons only (heavy-weapon teams and indirect fire keep their range).
  //   Near / mid / far bands are one third of the range each (range 6 = 1-2 / 3-4 / 5-6, range 7 = 1-3 / 4-5 / 6-7). Movement is untouched.
  const V200 = { RANGE_BONUS: 1, SIGHT_BONUS: 1, THIRDS: true, FLAT: { blue: ['bulldozer'], red: ['brummbar', 'stummel'] } };   // v201: FLAT = lobbed-HE vehicles whose main gun uses the near-band values over its whole range
  const v200Ends = R => [Math.max(1, Math.ceil(R / 3 - 1e-9)), Math.max(1, Math.ceil(R * 2 / 3 - 1e-9))];
  // v167: every HP / damage / armour number the player sees is on the CoH3 scale (engine values / HPK, / PENK)
  const hpD = x => Math.round((+x || 0) / RAW.HPK);
  // unit max / current HP on the CoH3 scale; snaps to the data value when the internal rounding is a point or two off
  const hpMaxD = u => { const v = hpD(u.maxHp), d = u.rawD, raw = d ? (d.N ? d.N * d.hp : d.hp) : 0; return raw && Math.abs(v - raw) <= 2 ? raw : v; };
  const hpCurD = u => u.hp >= u.maxHp ? hpMaxD(u) : Math.min(hpMaxD(u), hpD(u.hp));
  const armD = u => u && u.rawD && u.rawD.arm ? u.rawD.arm[0] : Math.round((+(u && u.armor) || 0) / RAW.PENK);
  function rawWeapon(dst, w, noRangeBonus) {
    dst.raw = true; dst.rawW = w;
    dst.atk = rawR2(w.d * RAW.HPK); dst.overkill = !!w.ok; dst.area = 1; dst.aoe = w.aoe || 0;
    dst.acc = w.acc.slice(); dst.pen = w.pen.map(p => rawR2(p * RAW.PENK));
    dst.range = Math.max(1, Math.round(w.max / RAW.HEX_M)) + (noRangeBonus ? 0 : V200.RANGE_BONUS);   // v162: whole hexes for range and band edges (v200: +1 for direct-fire weapons)
    dst.closeEnd = Math.round(w.rM[0] / RAW.HEX_M); dst.midEnd = Math.max(dst.closeEnd, Math.round(w.rM[1] / RAW.HEX_M));
    if (V200.THIRDS) { const e = v200Ends(dst.range); dst.closeEnd = e[0]; dst.midEnd = e[1]; }   // v200: three equal bands
    dst.rofB = w.spt.slice(); dst.rof = rawR2(w.spt[1]);
    dst.deflectDmgPct = w.defl || 0;
    return dst;
  }
  function applyCoh3Raw(t, R) {
    const indirect = !!(t.isMortar || t.isArtillery || t.isNebel);
    const hard = t.armorType === 'hard';
    const D = { sbp: R.sbp, N: 0, hp: 0, arm: null, spd: 0 };
    if (hard ? R.vhp > 0 : R.N > 0) {   // roster and data agree on what takes the hits (emplacements keep their crew model)
      if (hard) {
        t.maxHp = Math.max(1, Math.round(R.vhp * RAW.HPK));
        t.armor = rawR2(R.arm[0] * RAW.PENK); t.armorS = rawR2(R.arm[1] * RAW.PENK); t.armorR = rawR2(R.arm[2] * RAW.PENK);
        t.rearMul = R.rm || 1; D.hp = R.vhp; D.arm = R.arm.slice();
      } else {
        t.N = R.N; t.maxHp = Math.max(1, Math.round(R.N * R.hp * RAW.HPK)); t.armor = rawR2(R.arm[0] * RAW.PENK);
        D.N = R.N; D.hp = R.hp; D.arm = [R.arm[0]]; t.crewed = !!R.crew;
      }
      t.tsize = R.ts;
      if (!R.crew && R.spd > 0) { t.move = Math.max(1, Math.round(R.spd / RAW.INF_SPD * RAW.INF_MOVE)); D.spd = R.spd; }
      if (R.sm > 0) t.sight = Math.max(1, Math.round(R.sm / RAW.HEX_M));
    }
    if (R.w && !indirect) {
      rawWeapon(t, R.w, !!t.isHeavy);   // v200: heavy-weapon teams keep their range
      if (R.w.min > 0) t.minR = Math.max(t.minR || 0, Math.round(R.w.min / RAW.HEX_M));
      D.w = R.w;
    }
    if (R.s) {   // coaxial + hull machine guns fire as one secondary weapon
      const old = t.sub || {};
      t.sub = rawWeapon(Object.assign({ n: old.n || '기관총', arc: old.arc || 360, supp: old.supp !== undefined ? old.supp : 10 }, old), R.s, !!t.isHeavy);
      t.sub.sa = Math.max(...R.s.pen) < 10;
      D.s = R.s;
    }
    t.rawD = D; if (R.vet) t.rawVet = R.vet;
  }
  ['blue', 'red'].forEach(tm => Object.keys(COH3_RAW[tm]).forEach(k => { if (UNIT_ROSTER[tm][k]) applyCoh3Raw(UNIT_ROSTER[tm][k], COH3_RAW[tm][k]); }));

