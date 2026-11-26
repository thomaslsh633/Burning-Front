  // [chain:tglBtns] 2 layers over tglBtns__base ([17b]).
  //   Call order, outermost first: tglBtns → tglBtns__v189 → tglBtns__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // tglBtns: from [v194], calls tglBtns__v189
  function tglBtns(u) { return tglBtns__v189.apply(this, arguments) + v196Btn(u); }

  // tglBtns__v189: from [v189], calls tglBtns__base
  function tglBtns__v189(u) { return tglBtns__base.apply(this, arguments) + v188TurnBtn(u); }


