  // [chain:v99Info] 3 layers over v99Info__base ([17g]).
  //   Call order, outermost first: v99Info → v99Info__v151 → v99Info__v149 → v99Info__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v99Info: from [17_], calls v99Info__v151
  function v99Info() {
      const info = v99Info__v151.apply(this, arguments);
      try { if (!info || info.winter || !v150Fay() || !sectors.length) return info;
        const open = { plains: 1, field: 1, bush: 1, crater: 1 }, C = info.C, sand = V152.sand;
        const hqAt = (c, r) => { const t = terrainMap[c + ',' + r], sc = sectorAt.get(c + ',' + r); return !!(sc && sc.hq && t && !t.oob && open[t.terrainType] && !zoneAt(c, r)); };
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { if (!hqAt(c, r)) continue; const i = r * COLS + c;
          const inner = getHexNeighbors(c, r).every(n => hqAt(n.c, n.r)), k = (inner ? .82 : .48) + (v99h(c, r, 41) - .5) * .12;
          C[i * 3] += (sand[0] - C[i * 3]) * k; C[i * 3 + 1] += (sand[1] - C[i * 3 + 1]) * k; C[i * 3 + 2] += (sand[2] - C[i * 3 + 2]) * k; if (inner) info.X[i] = 9; }
      } catch (err) { console.warn('v152 hq ground', err); }
      return info;
    }

  // v99Info__v151: from [v168], calls v99Info__v149
  function v99Info__v151() {
      const info = v99Info__v149.apply(this, arguments);
      try {
        const polys = info && !info.winter && V149.on ? v151RoadPolys() : null; if (!polys) return info;
        info.roadPolys = polys; info.rw = 1;
        // ground under road cells: the natural colour of the non-road neighbours, plain grass texture
        const C = info.C, T = info.T, isR = t => t === 'road' || t === 'cobblestone';
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const i = r * COLS + c; if (!isR(T[i]) && !info.wide[i]) continue;
          let n = 0, s = [0, 0, 0]; getHexNeighbors(c, r).forEach(q => { const j = q.r * COLS + q.c; if (isR(T[j]) || info.wide[j]) return; s[0] += C[j * 3]; s[1] += C[j * 3 + 1]; s[2] += C[j * 3 + 2]; n++; });
          if (n) { C[i * 3] = s[0] / n; C[i * 3 + 1] = s[1] / n; C[i * 3 + 2] = s[2] / n; } info.X[i] = 0; info.wide[i] = 0; }
      } catch (err) { console.warn('v151 roads', err); }
      return info;
    }

  // v99Info__v149: from [17'], calls v99Info__base
  function v99Info__v149() {
      const info = v99Info__base.apply(this, arguments);
      try {
        if (!info || info.winter || !v149Active()) return info;
        const gv = v149Assign(info), C = info.C, X = info.X, T = info.T, gr = V149.gravel; V149.gv = gv;
        info.pal = Object.assign({}, info.pal, gr); info.rw = V149.roadW;
        for (let i = 0; i < gv.length; i++) {
          let def = gv[i] >= 0 ? GROUND_VAR[GROUND_VAR_NAMES[gv[i]]] : null, rgb;
          if (def) { rgb = def.rgb; const tint = info.pal.tint[T[i]]; if (tint) rgb = v99mix(rgb, tint[0], tint[1]); X[i] = def.tx; }
          else if (T[i] === 'road' || T[i] === 'cobblestone' || info.wide[i]) { rgb = v99mix([C[i * 3], C[i * 3 + 1], C[i * 3 + 2]], gr.road, info.wide[i] ? .35 : .18); }
          else continue;
          // plains beside a road: dirt shoulder
          if (def && (def.tx === 0 || def.tx === 11)) { const c = i % COLS, r = (i / COLS) | 0; if (getHexNeighbors(c, r).some(n => T[n.r * COLS + n.c] === 'road')) rgb = v99mix(rgb, gr.dirt, .3); }
          C[i * 3] = rgb[0]; C[i * 3 + 1] = rgb[1]; C[i * 3 + 2] = rgb[2];
        }
      } catch (err) { console.warn('v149 ground', err); }
      return info;
    }


