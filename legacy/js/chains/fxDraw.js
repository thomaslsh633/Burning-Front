  // [chain:fxDraw] 3 layers over fxDraw__base ([02]).
  //   Call order, outermost first: fxDraw → fxDraw__v174 → fxDraw__v173 → fxDraw__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // fxDraw: from [v176], calls fxDraw__v174
  function fxDraw() {
      if (V176.nums) return fxDraw__v174.apply(this, arguments);
      const keep = fxList.slice(); fxList.length = 0; try { return fxDraw__v174.apply(this, arguments); } finally { fxList.length = 0; keep.forEach(f => fxList.push(f)); }
    }

  // fxDraw__v174: from [v174], calls fxDraw__v173
  function fxDraw__v174() {
      const now = v174Now();
      if (V174.fx.length) { ctx.save(); V174.fx.forEach(f => { if (now < f.t0) return; const k = Math.min(1, (now - f.t0) / (f.t1 - f.t0)); f.draw(k, now); }); ctx.restore(); }
      if (!fxList.some(f => f.t0 > now)) return fxDraw__v173();
      const keep = fxList.slice(); fxList.length = 0; keep.forEach(f => { if (f.t0 <= now) fxList.push(f); });
      try { fxDraw__v173(); } finally { fxList.length = 0; keep.forEach(f => fxList.push(f)); }
    }

  // fxDraw__v173: from [v173], calls fxDraw__base
  function fxDraw__v173() {
      const A = V173.anim; if (!A) return fxDraw__base();
      const now = performance.now(); fxList.forEach(f => { if (!f._v173 && f.t0 >= A.t0 - 5) { f._v173 = 1; f.t0 = A.tEnd; } });
      if (!fxList.some(f => f.t0 > now)) return fxDraw__base();
      const keep = fxList.slice(); fxList.length = 0; keep.forEach(f => { if (f.t0 <= now) fxList.push(f); });
      try { fxDraw__base(); } finally { fxList.length = 0; keep.forEach(f => fxList.push(f)); } }


