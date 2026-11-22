  // [chain:faceToward] 1 layer over faceToward__base ([08]).
  //   Call order, outermost first: faceToward → faceToward__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // faceToward: from [v180], calls faceToward__base
  function faceToward(u, c, r) {
      const a = u && u.facingAngle, res = faceToward__base.apply(this, arguments);
      if (V180.collect && u && a !== undefined && u.facingAngle !== undefined) { const d = v173Ang(u.facingAngle - a); if (Math.abs(d) * 180 / Math.PI >= V180.minDeg && !V180.collect.some(x => x.u === u)) V180.collect.push({ u, a, d }); }
      return res;
    }


