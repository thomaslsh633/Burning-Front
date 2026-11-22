  // ══════════════════════════════════════════════════════════════
  // [17q] v117 — one human scale: infantry, gun crews and the small open vehicles (jeep, Weasel) share it, the other vehicles follow
  //       part of the way, so a man is about the same size wherever he stands. t = 0 at the closest zoom … 1 zoomed out
  // ══════════════════════════════════════════════════════════════
  function v117T() { return Math.max(0, Math.min(1, (v98InfScale() - 1) / .5)); }
  function v117Hs() { return 7.0 * (1 + .25 * v117T()); }   // v129: men 1.4x the map scale (7.0 … 8.75 px/m)          // px per metre: every man on foot / at a gun / in a small vehicle (was 5.2 … 7.8 for infantry)
  function v117Vs() { return 7.0 * (1 + .15 * v117T()); }   // v129: vehicles at the human scale — a 6 m tank covers 1.2–1.5 hexes          // px per metre: tanks, half-tracks, trucks (was a flat 4.8)
  function v117Small(mk) { return mk === 'jeep' || mk === 'm29' || mk === 'sdkfz2'; }   // v124: + Kettenkrad
  function v117VehS(mk) { return v117Small(mk) ? v117Hs() : v117Vs(); }

