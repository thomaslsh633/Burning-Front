  // [chain:settleVictory] 1 layer over settleVictory__base ([17c]).
  //   Call order, outermost first: settleVictory → settleVictory__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // settleVictory: from [19], calls settleVictory__base
  function settleVictory() {
      if (shMode() !== 'annihilation') return settleVictory__base.apply(this, arguments);
      SHELL.atTurnStart = true; try { vmCheckWinner(); } finally { SHELL.atTurnStart = false; }   // through the outer wrapper, so the report opens
      return null;
    }


