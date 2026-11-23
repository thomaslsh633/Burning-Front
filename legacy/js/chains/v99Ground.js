  // [chain:v99Ground] 2 layers over v99Ground__base ([17g]).
  //   Call order, outermost first: v99Ground → v99Ground__v138 → v99Ground__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v99Ground: from [17%], calls v99Ground__v138
  function v99Ground() {
      const res = v99Ground__v138.apply(this, arguments); if (!res || !V146.on) return res;
      try {
        const k = (v146W() / 7) / V134.S, list = V146.spots.concat(v146EdgeSpots()).map(sp => ({ sp, p: v99Proj(sp.fx, sp.fy, (sp.z || 0) * LIFT) }))
          .filter(o => o.p[0] > camX - 500 && o.p[0] < camX + VIEW_W + 500 && o.p[1] > camY - 400 && o.p[1] < camY + VIEW_H + 400).sort((a, b) => a.p[1] - b.p[1]);
        ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
        list.forEach(({ sp, p }) => {
          const st = sp.struct ? sp.struct.stage : (sp.st || 0);
          const key = (sp.kind === 'low_wall' ? 'low_wall' + sp.v : sp.kind === 'balustrade' ? 'balustrade' : sp.kind + '#' + sp.v) + 's' + st;
          const e = v146Sprite(key, sp.kind, sp.v, sp.ang, st); if (!e) return;
          ctx.drawImage(e.hi, p[0] - e.PX * k, p[1] - e.PY * k, e.W * k, e.H * k);
        });
        ctx.restore();
      } catch (err) { console.warn('v146 draw', err); }
      return res;
    }

  // v99Ground__v138: from [17-], calls v99Ground__base
  function v99Ground__v138() {
      const r = v99Ground__base.apply(this, arguments); if (!r) return r;
      try {
        const k = (Math.sqrt(3) * HEX_RADIUS / 7) / V134.S;   // true map scale: flat units per metre (1 hex = 7 m)
        v138Spots().forEach(sp => {
          const e = v138Sprite(sp); if (!e || e.none) return;
          const p = v99Proj(sp.fx, sp.fy, (sp.z || 0) * LIFT);
          if (p[0] < camX - 400 || p[0] > camX + VIEW_W + 400 || p[1] < camY - 300 || p[1] > camY + VIEW_H + 300) return;
          ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(e.hi, p[0] - e.PX * k, p[1] - e.PY * k, e.W * k, e.H * k); ctx.restore();
        });
      } catch (err) { console.warn('v138 draw', err); }
      return r;
    }


