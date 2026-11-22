  // [chain:mgCanCover] 1 layer over mgCanCover__base ([11]).
  //   Call order, outermost first: mgCanCover → mgCanCover__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // mgCanCover: from [11], calls mgCanCover__base
  function mgCanCover(u, t) { return !inSmoke(t) && mgCanCover__base(u, t); }


