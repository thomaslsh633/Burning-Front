  // [chain:v152ApplyDeco] 1 layer over v152ApplyDeco__base ([17_]).
  //   Call order, outermost first: v152ApplyDeco → v152ApplyDeco__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v152ApplyDeco: from [17+3], calls v152ApplyDeco__base
  function v152ApplyDeco() {
      v152ApplyDeco__base.apply(this, arguments);
      if (!v156On()) return;
      const cps = v156CpFlats(), rr = HEX_RADIUS * .92;
      V146.spots = V146.spots.filter(s => {
        if (V156.noCone && V156.cone[s.kind]) return false;
        if (s.cp || s.fp || !s.deco) return true;
        return !cps.some(f => Math.hypot(s.fx - f[0], s.fy - f[1]) < rr);
      });
      V146.key = null;
    }


