  // [chain:vmCheckWinner] 2 layers over vmCheckWinner__base ([17c]).
  //   Call order, outermost first: vmCheckWinner → vmCheckWinner__v202 → vmCheckWinner__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // vmCheckWinner: from [19], calls vmCheckWinner__v202
  function vmCheckWinner() {
      const had = vm.winner, r = vmCheckWinner__v202.apply(this, arguments);
      if (!had && vm.winner && SHELL.inGame) { shClearSaves(); setTimeout(shAarOpen, 650); }
      return r;
    }

  // vmCheckWinner__v202: from [19], calls vmCheckWinner__base
  function vmCheckWinner__v202() { if (shMode() === 'annihilation') return shModeCheck(!!SHELL.atTurnStart); return vmCheckWinner__base.apply(this, arguments); }


