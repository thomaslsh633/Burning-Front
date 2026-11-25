  // [chain:skirmishPoints] 1 layer over skirmishPoints__base ([v162]).
  //   Call order, outermost first: skirmishPoints → skirmishPoints__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // skirmishPoints: from [v168], calls skirmishPoints__base
  function skirmishPoints() {   // runs right after the skirmish terrain / building pass
      const r = skirmishPoints__base.apply(this, arguments);
      try { ['blue', 'red'].forEach(v168LayoutBase); } catch (err) { console.warn('v168 base layout', err); }
      return r;
    }


