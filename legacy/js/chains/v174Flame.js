  // [chain:v174Flame] 1 layer; the original in [v174] and older layers were dead code and are removed.
  //   Call order, outermost first: v174Flame
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v174Flame: from [v177], does NOT call the layer below
  function v174Flame(t, a, b, dur) {
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, N = Math.max(6, Math.round(12 * v178K())), life = 230;
    v174Add(t, dur + life, (k, now) => {
      const T = now - t;
      for (let i = 0; i < N; i++) {
        const s = ((T / life) + i / N) % 1, e = T - s * life; if (e < 0 || e > dur) continue;
        const w = Math.sin(i * 7.3 + e / 55) * 4.5 * s, x = a.x + dx * s + nx * w, y = a.y + dy * s + ny * w - 7 * s * (1 - s) - 3 * s;
        v176Soft(x, y, 3 + 8 * s, s < .25 ? '255,244,190' : s < .6 ? '255,170,50' : '226,84,28', .9 * (1 - s * .55));
      }
    });
  }


