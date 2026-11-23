  // [chain:v173Begin] 3 layers over v173Begin__base ([v173]).
  //   Call order, outermost first: v173Begin → v173Begin__v194 → v173Begin__v183 → v173Begin__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v173Begin: from [19], calls v173Begin__v194
  function v173Begin(u, P) { return shWithClass(u, () => v173Begin__v194.call(this, u, P)); }

  // v173Begin__v194: from [v194], calls v173Begin__v183
  function v173Begin__v194(u, P) {
      if (!(P && P.mc && P.mc.rev)) return v173Begin__v183.apply(this, arguments);
      V196.uid = null;
      if (v183On(u) && u._tur && !u.engaged) { if (!reduceMotion()) { V183.re.set(u, { from: u._tur.a, t0: v174Now(), dur: 350 }); v174Kick(); } delete u._tur; }
      const path = P.path, n = path.length - 1, F = u.facingAngle, kind = v173Kind(u);
      if (reduceMotion() || n < 1) return;
      const ph = [];
      ph.push({ k: 'm', s0: 0, s1: n, fa: F, dur: n * V173.msHex[kind] });
      let T = ph.reduce((a, x) => a + x.dur, 0); const sc = T > V173.maxMs ? V173.maxMs / T : 1;
      let t = performance.now(); const t0 = t; ph.forEach(x => { x.t0 = t; t += x.dur * sc; x.t1 = t; });
      V173.anim = { u, pts: path.map(h => getHexCenter(h.c, h.r)), H: Array(n).fill(F), ph, kind, fixed: null, fa0: F, t0, tEnd: t, seen0: P.seen0 };
      requestAnimationFrame(v173Tick);
    }

  // v173Begin__v183: from [v183], calls v173Begin__base
  function v173Begin__v183(u, P) {   // a path move starts: the aimed turret swings back to the hull heading
      if (v183On(u) && u._tur && !u.engaged) { if (!reduceMotion()) { V183.re.set(u, { from: u._tur.a, t0: v174Now(), dur: 350 }); v174Kick(); } delete u._tur; }   // v194: only an engaged unit keeps its turret direction while moving
      return v173Begin__base.apply(this, arguments);
    }


