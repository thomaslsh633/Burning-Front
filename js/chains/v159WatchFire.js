  // [chain:v159WatchFire] 1 layer over v159WatchFire__base ([17+6]).
  //   Call order, outermost first: v159WatchFire → v159WatchFire__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v159WatchFire: from [v174], calls v159WatchFire__base
  function v159WatchFire(m) {
      if (reduceMotion() || !m) return v159WatchFire__base.apply(this, arguments);
      const pre = v174Snap(), n0 = fxList.length, r = v159WatchFire__base.apply(this, arguments);
      const ws = units.filter(w => { const q = pre.get(w); return q && w.ammo < q.ammo && w !== m; });
      if (!ws.length) return r;
      let t = v174Start();
      ws.forEach(w => { t = v174Attack(w, m, t, { miss: false }) + 120; });
      const q = pre.get(m); if (q && (q.hp !== m.hp || q.sup !== m.suppression)) v174Hold(m, q, t);
      v174FxShift(n0, () => t); V174.busyUntil = t + 80 + V176.tail; v174Kick(); return r;
    }


