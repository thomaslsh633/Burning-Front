  // [chain:v185Drag] 2 layers over v185Drag__base ([v185]).
  //   Call order, outermost first: v185Drag → v185Drag__v189 → v185Drag__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v185Drag: from [v190], calls v185Drag__v189
  function v185Drag(u) { const r = v185Drag__v189.apply(this, arguments); if (v190Arc(u) && (V185.rot || V185.pend)) rangeTiles = null; return r; }

  // v185Drag__v189: from [v189], calls v185Drag__base
  function v185Drag__v189(u) {
      const r = v185Drag__base.apply(this, arguments);
      if (V185.rot && V185.rot.u === u && !v189Stage(u) && v189Can(u) && (u.isHeavy || u.remainingMove >= 1)) {
        V185.pend = { u, a: V185.rot.a, c: u.c, r: u.r, kind: 'turn' };
        if (selectedUnit !== u) { selectedUnit = u; updateActionTiles(u); }
        updateUnitInfoPanel(u, getTerrain(u.c, u.r));
      }
      return r;
    }


