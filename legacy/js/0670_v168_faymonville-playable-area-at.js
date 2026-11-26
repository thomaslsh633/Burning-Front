  // [v168] Faymonville playable area at 70 %: the 48 × 48 grid stays, the reference map is drawn 0.7× around the centre
  //   (1 hex is still 7 m; the map covers 70 % of the distances), everything beyond its outline is out of bounds
  (function () { const s = .9, cx = 6 + 400 * .045, cy = 485 * .0495; Object.assign(FS, { s, kx: .045 * s, ky: .0495 * s, c0: cx - 400 * .045 * s, r0: cy - 485 * .0495 * s }); })();
  // roster tuning (before any unit is created at boot)
  ['blue', 'red'].forEach(tm => Object.keys(UNIT_ROSTER[tm] || {}).forEach(k => {
    const t = UNIT_ROSTER[tm][k];
    const rd = t.rawD || {};   // v162: units reset to CoH3 values skip the old play-test multipliers
    if (t.move > 0 && k !== 'tiger' && !rd.spd) t.move += 1;   // v140: +1 for all, Tiger stays 6
    if (!rd.hp && ((t.armorType !== 'hard' && (t.macro === 'INF' || t.macro === 'ELT')) || (t.armorType === 'hard' && t.macro === 'TNK'))) t.maxHp = Math.round(t.maxHp * 1.2);
  }));
