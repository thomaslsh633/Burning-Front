  // [chain:v173Tick] 1 layer over v173Tick__base ([v173]).
  //   Call order, outermost first: v173Tick → v173Tick__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v173Tick: from [v174], calls v173Tick__base
  function v173Tick() {
      const A = V173.anim;
      if (A && A.cur && viewportBox) { const W = viewportBox.clientWidth, H = viewportBox.clientHeight, sx = (A.cur.x - camX) * zoom, sy = (A.cur.y - camY) * zoom, mx = W * .18, my = H * .2;
        const dx = sx < mx ? sx - mx : sx > W - mx ? sx - (W - mx) : 0, dy = sy < my ? sy - my : sy > H - my ? sy - (H - my) : 0;
        if (dx || dy) { camX += dx / zoom * .2; camY += dy / zoom * .2; clampCam(); } }
      return v173Tick__base.apply(this, arguments);
    }


