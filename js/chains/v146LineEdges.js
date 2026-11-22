  // [chain:v146LineEdges] 1 layer over v146LineEdges__base ([17%]).
  //   Call order, outermost first: v146LineEdges → v146LineEdges__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v146LineEdges: from [v168], calls v146LineEdges__base
  function v146LineEdges(kind, pts) {
      const before = new Set(EDGES.keys()), n = v146LineEdges__base.apply(this, arguments);
      try { const keys = []; EDGES.forEach((e, k) => { if (!before.has(k) && e.kind === kind) keys.push(k); });
        if (keys.length) { V151.runs.push({ kind, pts: pts.map(([x, y]) => v146Flat(x, y)), keys }); keys.forEach(k => V151.runEdges.add(k)); } } catch (err) { }
      return n;
    }


