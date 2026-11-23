  // [chain:v174Puff] 1 layer; the original in [v174] and older layers were dead code and are removed.
  //   Call order, outermost first: v174Puff
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v174Puff: from [v176], does NOT call the layer below
  function v174Puff(t, pt, c, r) { const kind = c === undefined ? 'dirt' : v176Surface(c, r); const col = kind === 'snow' ? '240,246,252' : '190,170,130'; for (let i = 0; i < 2; i++) { const q = { x: pt.x + v174Rand(-3, 3), y: pt.y + v174Rand(-2, 2) }; v174Add(t, 300, (k) => v176Soft(q.x, q.y - 4 * k, 1.5 + 3.5 * k, col, .42 * (1 - k))); } }


