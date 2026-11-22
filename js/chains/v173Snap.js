  // [chain:v173Snap] 1 layer over v173Snap__base ([v173]).
  //   Call order, outermost first: v173Snap → v173Snap__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v173Snap: from [19], calls v173Snap__base
  function v173Snap(u, fa) {
      if (u && !u.isHeavy && u.armorType !== 'hard' && typeof TANK_SPR !== 'undefined' && TANK_SPR.on) { const i = Math.round(TANK_SPR.idx(fa) / 2) * 2; return TANK_SPR.yaw(i % TANK_SPR.N); }
      return v173Snap__base.apply(this, arguments);
    }


