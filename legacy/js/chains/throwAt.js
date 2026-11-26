  // [chain:throwAt] 1 layer over throwAt__base ([13]).
  //   Call order, outermost first: throwAt → throwAt__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // throwAt: from [v179], calls throwAt__base
  function throwAt(a, t, P, A, supp, label, dmgA) {
      if (reduceMotion() || !a || !t) return throwAt__base.apply(this, arguments);
      const pre = v174Snap(), n0 = fxList.length, r = throwAt__base.apply(this, arguments), kind = v179Type(label), p = pre.get(t), dmg = p ? p.hp - t.hp : 0, now = v174Now();
      const t0 = kind === 'smine' && now - V179.sAt < 150 ? V179.sT : v174Start();
      if (kind === 'smine') { V179.sAt = now; V179.sT = t0; }
      const end = v179Throw(kind, a, t, t0, { dmg, kill: t.hp <= 0 });
      if (end <= t0) return r;
      if (p && (p.hp !== t.hp || p.sup !== t.suppression)) v174Hold(t, p, end);
      units.forEach(u => { const q = pre.get(u); if (!q || u === a || u === t || (q.hp === u.hp && q.sup === u.suppression)) return; v174Hold(u, q, end); });
      v174FxShift(n0, f => { const u = units.find(x => x.c === f.c && x.r === f.r); const h = u && V174.hold.get(u); return h ? h.until : end; });
      V174.busyUntil = Math.max(V174.busyUntil, end + 80 + V176.tail); v174Kick(); return r;
    }


