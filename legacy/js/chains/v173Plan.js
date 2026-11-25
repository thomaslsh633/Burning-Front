  // [chain:v173Plan] 1 layer over v173Plan__base ([v173]).
  //   Call order, outermost first: v173Plan → v173Plan__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v173Plan: from [19], calls v173Plan__base
  function v173Plan(u, mc) {
      const pre = shUndoTake(u, 'move', false), r = v173Plan__base.apply(this, arguments);
      if (pre) { pre.stopped = !!(r && r.mc && (r.mc.c !== mc.c || r.mc.r !== mc.r)); SHELL.undo = pre; }   // v173 stopped the route on a sighting
      return r;
    }


