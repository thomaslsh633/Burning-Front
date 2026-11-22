  // ══════════════════════════════════════════════════════════════
  // [v180] Attack turn: a unit that has to face its target turns on the spot first (same speeds as moving), then fires.
  //   The logic facing already changes inside executeCombat; faceToward is watched there to learn the old facing and the angle,
  //   the drawn facing then runs old → new over the turn time (old facing until the turn starts), and the shot waits for it.
  // ══════════════════════════════════════════════════════════════
  var V180 = { collect: null, turn: new Map(), minDeg: 12, maxMs: 600 };
  {  /* faceToward: layer moved to js/chains/faceToward.js */ }
  function v180TurnMs__base(u, d, tur) {
    const kind = v173Kind(u), dps = tur ? 260 : kind === 'crew' ? V173.turnDpsCrew : kind === 'inf' ? V173.turnDps : (u.cost || 0) >= 400 ? V173.turnDpsHeavy : V173.turnDps;   // v183: a turret traverses at 260 °/s
    return Math.max(120, Math.min(V180.maxMs, Math.abs(d) * 180 / Math.PI / dps * 1000));
  }
  function v180TurnSet(u, a, d, t0, dur, tur) { V180.turn.set(u, { a, d, t0, dur, tur: !!tur }); }
  {  /* drawUnitArt: layer moved to js/chains/drawUnitArt.js */ }

