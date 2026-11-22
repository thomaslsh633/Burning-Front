  // [chain:boardUnit] 1 layer over boardUnit__base ([11]).
  //   Call order, outermost first: boardUnit → boardUnit__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // boardUnit: from [v181], calls boardUnit__base
  function boardUnit(passenger, transport) {
      const a = { c: passenger.c, r: passenger.r }, fa0 = passenger.facingAngle, r = boardUnit__base.apply(this, arguments);
      if (passenger.isLoaded && (a.c !== passenger.c || a.r !== passenger.r)) { V181.board.add(passenger); if (!v181Walk(passenger, a, { fa0, keep: true, board: true })) V181.board.delete(passenger); }
      return r;
    }


