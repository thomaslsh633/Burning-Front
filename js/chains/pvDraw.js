  // [chain:pvDraw] 2 layers over pvDraw__base ([17b]).
  //   Call order, outermost first: pvDraw → pvDraw__v99 → pvDraw__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // pvDraw: from [v179], calls pvDraw__v99
  function pvDraw() { pvDraw__v99.apply(this, arguments); try { v179PreviewArc(); } catch (e) { } }

  // pvDraw__v99: from [17g], calls pvDraw__base
  function pvDraw__v99() { const r = pvDraw__base.apply(this, arguments); v99Flush(); return r; }


