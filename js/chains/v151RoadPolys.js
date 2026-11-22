  // [chain:v151RoadPolys] 1 layer over v151RoadPolys__base ([v168]).
  //   Call order, outermost first: v151RoadPolys → v151RoadPolys__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v151RoadPolys: from [17+1], calls v151RoadPolys__base
  function v151RoadPolys() {
      if (V154.polys && V154.pkey === mapSelect.value + COLS) return V154.polys;
      const base = v151RoadPolys__base.apply(this, arguments); if (!base) return base;
      const raw = base.map(p => p.flat);
      const out = base.map((rd, ri) => {
        const f = rd.flat, n = f.length, s = [0]; for (let i = 1; i < n; i++) s.push(s[i - 1] + Math.hypot(f[i][0] - f[i - 1][0], f[i][1] - f[i - 1][1]));
        const L = s[n - 1] || 1, sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
        const offs = f.map((p, i) => {
          let dj = 1e9; raw.forEach((q, k) => { if (k === ri) return; for (let j = 0; j < q.length; j += 2) { const d = Math.hypot(q[j][0] - p[0], q[j][1] - p[1]); if (d < dj) dj = d; } });
          const taper = sm(0, 60, s[i]) * sm(0, 60, L - s[i]) * sm(6, 55, dj);
          const mask = .25 + .75 * sm(.36, .56, v99N(s[i] * .0035 + ri * 3.7, ri * 1.3 + 5));                  // where the road bends at all
          const wave = Math.max(-1, Math.min(1, (v99N(s[i] * (rd.main ? .0052 : .0085) + ri * 11.3, ri * 2.1) - .5) * 3));        // which way, smoothly
          return V154.amp * (rd.main ? 1 : .8) * mask * wave * taper;
        });
        const flat = f.map((p, i) => { const a = f[Math.max(0, i - 1)], b = f[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [p[0] - dy / l * offs[i], p[1] + dx / l * offs[i]]; });
        return { main: rd.main, flat: v151Dense(v151Chaikin(flat, 1), 4) };
      });
      V154.polys = out; V154.pkey = mapSelect.value + COLS; return out;
    }


