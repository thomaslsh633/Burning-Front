  // [chain:v149Assign] 2 layers over v149Assign__base ([17']).
  //   Call order, outermost first: v149Assign → v149Assign__v152 → v149Assign__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v149Assign: from [17+1], calls v149Assign__v152
  function v149Assign(info) {
      const gv = v149Assign__v152.apply(this, arguments);
      try {
        const fl = GROUND_VAR_NAMES.indexOf('flagstone'), yd = GROUND_VAR_NAMES.indexOf('yard'), soft = { plains: 1, bush: 1, field: 1 };
        (V146.spots || []).forEach(sp => { if (!sp.fp || !sp.struct) return; const D = [-Math.sin(sp.ang), Math.cos(sp.ang)], ring1 = new Set();
          sp.struct.cells.forEach(([c, r]) => getHexNeighbors(c, r).forEach(n => { if (v147StructAt(n.c, n.r)) return; ring1.add(n.c + ',' + n.r); }));
          ring1.forEach(k => { const [c, r] = k.split(',').map(Number), j = r * COLS + c; if (!soft[info.T[j]]) return;
            const f = v146CellFlat(c, r), vx = f[0] - sp.fx, vy = f[1] - sp.fy, L = Math.hypot(vx, vy) || 1;
            gv[j] = (vx * D[0] + vy * D[1]) / L > .35 ? fl : yd; });
          ring1.forEach(k => { const [c, r] = k.split(',').map(Number); getHexNeighbors(c, r).forEach(n => { const kk = n.c + ',' + n.r, j = n.r * COLS + n.c;
            if (ring1.has(kk) || v147StructAt(n.c, n.r) || !soft[info.T[j]] || info.T[j] === 'field') return; if (v99h(n.c, n.r, 61) < .5) gv[j] = yd; }); });
        });
      } catch (err) { console.warn('v154 yards', err); }
      return gv;
    }

  // v149Assign__v152: from [17_], calls v149Assign__base
  function v149Assign__v152(info) {
      const gv = v149Assign__base.apply(this, arguments);
      try { const fl = GROUND_VAR_NAMES.indexOf('flagstone'), gd = GROUND_VAR_NAMES.indexOf('garden_bed');
        (V146.spots || []).forEach(sp => { if (!sp.fp || !sp.struct) return; const D = [-Math.sin(sp.ang), Math.cos(sp.ang)];
          sp.struct.cells.forEach(([c, r]) => getHexNeighbors(c, r).forEach(n => { const j = n.r * COLS + n.c, t = info.T[j]; if (v147StructAt(n.c, n.r) || !(t === 'plains' || t === 'bush')) return;
            const f = v146CellFlat(n.c, n.r), vx = f[0] - sp.fx, vy = f[1] - sp.fy, L = Math.hypot(vx, vy) || 1, dot = (vx * D[0] + vy * D[1]) / L;
            gv[j] = dot > .35 ? fl : (gv[j] === fl ? gd : gv[j]); })); });
      } catch (err) { }
      return gv;
    }


