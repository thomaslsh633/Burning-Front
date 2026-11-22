  // [chain:v167CrewMarks] 1 layer; the original in [v167] and older layers were dead code and are removed.
  //   Call order, outermost first: v167CrewMarks
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v167CrewMarks: from [19], does NOT call the layer below
  function v167CrewMarks(u, W, H, k) {
    if (!u || u.hp <= 0 || !v159Crew(u)) return;
    const emp = v159Emplaced(u), setting = emp && u.empT === turnNo; if (emp && !setting) return;
    const y = -H - .6 * k, x = W / 2 + .2 * k;
    ctx.save(); ctx.globalAlpha = 1;
    v167Badge(x, y, k, '#fbbf24'); if (setting) v167Tripod(x, y, k, '#fbbf24'); else v167Packed(x, y, k, '#fbbf24');
    ctx.restore();
  }


