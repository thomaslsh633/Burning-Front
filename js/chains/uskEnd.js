  // [chain:uskEnd] 1 layer over uskEnd__base ([13]).
  //   Call order, outermost first: uskEnd → uskEnd__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // uskEnd: from [17b], calls uskEnd__base
  function uskEnd() { pvClear(0); setTimeout(() => { if (!skOn()) hideTip(); }, 0); uskEnd__base(); }


