  // [chain:v185Confirm] 1 layer over v185Confirm__base ([v185]).
  //   Call order, outermost first: v185Confirm → v185Confirm__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v185Confirm: from [19], calls v185Confirm__base
  function v185Confirm() {
      const u = V185.pend && V185.pend.u, pre = u ? shUndoTake(u, 'turn', false) : null, r = v185Confirm__base.apply(this, arguments);
      if (pre && u.facingAngle !== pre.s.facingAngle) SHELL.undo = pre;
      return r;
    }


