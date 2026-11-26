  // [chain:toggleMode] 2 layers over toggleMode__base ([14]).
  //   Call order, outermost first: toggleMode → toggleMode__v30 → toggleMode__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // toggleMode: from [17+5], calls toggleMode__v30
  function toggleMode(u, m) {
      if (m === 'repair' && !(actionMode === m && activeActor === u)) { const e = v158RepBlock(u); if (e) { toast(e); return; } }
      return toggleMode__v30.apply(this, arguments);
    }

  // toggleMode__v30: from [17b], calls toggleMode__base
  function toggleMode__v30() { toggleMode__base.apply(this, arguments); noTgt(); }


