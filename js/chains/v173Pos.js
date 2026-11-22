  // [chain:v173Pos] 1 layer over v173Pos__base ([v173]).
  //   Call order, outermost first: v173Pos → v173Pos__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v173Pos: from [v178], calls v173Pos__base
  function v173Pos(u) { const st = v173Pos__base.apply(this, arguments); if (st && st.fa !== undefined) v178Dust(u, st); return st; }


