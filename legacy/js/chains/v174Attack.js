  // [chain:v174Attack] 3 layers; the original in [v174] and older layers were dead code and are removed.
  //   Call order, outermost first: v174Attack → v174Attack__v177 → v174Attack__v176
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v174Attack: from [v179], calls v174Attack__v177
  function v174Attack(att, def, t, res) {
      const key = att.id !== undefined && def.id !== undefined ? att.id + '>' + def.id : null, R = key ? V179.res.get(key) : null; if (key) V179.res.delete(key);
      const kind = v174Kind(att), defl = def.armorType === 'hard' && !!R && R.hits > 0 && R.pens === 0 && (kind === 'cannon' || kind === 'mg' || kind === 'rifle');
      const res2 = defl && kind === 'cannon' && res && res.dmg > 0 ? Object.assign({}, res, { dmg: 0, miss: false }) : res;   // a deflected shell gets the ricochet, not a penetrating blast
      const end = v174Attack__v177.call(this, att, def, t, res2);
      if (defl && v174Vis(def)) {
        const dist = getDistance(att.c, att.r, def.c, def.r), A0 = getHexCenter(att.c, att.r), P0 = getHexCenter(def.c, def.r), dir = v179Norm(P0.x - A0.x, P0.y - A0.y);
        if (kind === 'cannon') v179Ping(t + 250 + 40 * dist, v174HitPt(def, 5), dir, true);
        else { const n = kind === 'mg' ? 5 : 3; for (let i = 0; i < n; i++) v179Ping(t + 110 + Math.max(0, end - t - 160) * (i + .5) / n, v174HitPt(def, 8), dir, false); }
      }
      return end;
    }

  // v174Attack__v177: from [v177], calls v174Attack__v176
  function v174Attack__v177(att, def, t, res) {
      const dist = getDistance(att.c, att.r, def.c, def.r);
      if (!v177Kit(att) || !subReach(att, def.c, def.r, dist)) return v174Attack__v176.apply(this, arguments);
      const showA = v174Vis(att), showD = v174Vis(def), end0 = v174Attack__v176.call(this, att, def, t + 120, res);
      if (showA || showD) {
        const a = v174Muzzle(att, 'rifle'), P = getHexCenter(def.c, def.r), b = { x: P.x + v174Rand(-4, 4), y: P.y - 4 + v174Rand(-3, 3) };
        for (let i = 0; i < 5; i++) v174Flame(t + i * 190, a, b, 140);
        if (showD && !(res && res.dmg !== undefined && res.dmg <= 0)) v176Fire(t + 250, b, 1200);
      }
      return Math.max(end0, t + 950);
    }

  // v174Attack__v176: from [v176], does NOT call the layer below
  function v174Attack__v176(att, def, t, res) {
    const kind = v174Kind(att), showA = v174Vis(att), showD = v174Vis(def), hard = def.armorType === 'hard', dist = getDistance(att.c, att.r, def.c, def.r);
    const dmg = res && res.dmg !== undefined ? res.dmg : (res && res.miss ? 0 : 1), miss = dmg <= 0 && !hard, ric = dmg <= 0 && hard, kill = !!(res && res.kill);
    if (!showA && !showD) return t;
    const P0 = getHexCenter(def.c, def.r);
    // a miss lands beside the target: further along the line of fire plus a sideways slip
    const A0 = getHexCenter(att.c, att.r), ux = P0.x - A0.x, uy = P0.y - A0.y, ul = Math.hypot(ux, uy) || 1, nx = ux / ul, ny = uy / ul;
    const aim = (spread) => miss ? { x: P0.x + nx * v174Rand(14, 26) - ny * v174Rand(-12, 12), y: P0.y + ny * v174Rand(14, 26) * .7 + nx * v174Rand(-8, 8) * .7 } : v174HitPt(def, spread);
    const tint = (end) => { if (showD) v176Target(t, end + V176.tail, def.c, def.r); };
    if (kind === 'rifle' || kind === 'mg' || kind === 'sniper') {
      const n = kind === 'mg' ? 16 : kind === 'sniper' ? 1 : Math.min(8, Math.max(2, (att.models || 1) * 2)), span = kind === 'mg' ? 900 : kind === 'sniper' ? 0 : 450, trav = kind === 'sniper' ? 70 : 110, t0 = t + (kind === 'sniper' ? 120 : 0);
      for (let i = 0; i < n; i++) {
        const ts = t0 + (kind === 'mg' ? i * span / n + v174Rand(0, 25) : v174Rand(0, span)), a = v174Muzzle(att, kind), b = aim(hard ? 7 : 10), through = miss || (i % 3 === 0 && dmg < 3);
        const bb = through ? { x: b.x + nx * 10, y: b.y + ny * 6 } : b;
        if (showA) v174Flash(ts, a, kind === 'mg' ? 4 : 3);
        v174Tracer(ts, a, bb, trav, kind === 'sniper' ? 'rgba(255,245,210,.95)' : null, kind === 'sniper' ? 1.4 : 1, kind === 'sniper' ? 30 : 14);
        if (showD) (hard ? v174Spark : v174Puff)(ts + trav, bb, def.c, def.r);
      }
      const end = t0 + span + trav + 40; tint(end); return end;
    }
    if (kind === 'cannon') {
      const a = v174Muzzle(att, kind), b = ric ? v174HitPt(def, 4) : aim(4), trav = 250 + 40 * dist, big = /howitzer|obice|flak36/.test(att.key || '');
      if (showA) { v174Flash(t, a, 11); v176Muzzle(t, att, big); V174.recoil.set(att, t); }
      v174Shell(t, a, b, trav, 0);
      const hit = t + trav;
      if (showD) { if (ric) v174Spark(hit, b); else v174Boom(hit, b, hard ? 15 : 16, def.c, def.r);
        if (hard && !ric && !miss) { V176.flash.set(def, hit); for (let i = 0; i < 3; i++) v174Add(hit + i * 120, 800, (k) => v176Soft(b.x + 3 * k, b.y - 6 - 16 * k, 3 + 4 * k, '70,68,66', .5 * (1 - k))); }
        if (kill) { v174Boom(hit + 120, { x: b.x + 2, y: b.y - 3 }, 22); if (hard) v176Column(hit + 200, b, 2200); } }
      let end = hit + 30;
      if (att.sub && att.sub.rofB && showA) for (let i = 0; i < 8; i++) { const ts = end + 120 + i * 55, a2 = v174Muzzle(att, 'rifle'), b2 = v174HitPt(def, 10); v174Flash(ts, a2, 3); v174Tracer(ts, a2, b2, 100); if (showD) v174Puff(ts + 100, b2, def.c, def.r); }
      tint(end); return end;
    }
    if (kind === 'arc') {
      const a = v174Muzzle(att, kind), b = aim(3), trav = 450, H = Math.min(60, 18 + Math.hypot(b.x - a.x, b.y - a.y) * .2);
      if (showA) { v174Flash(t, { x: a.x, y: a.y - 3 }, 9); v176Muzzle(t, att, true); }
      if (showD) v176Ring(t, t + trav, P0);
      v174Shell(t, a, b, trav, H);
      const hit = t + trav, big = /howitzer|obice|wespe|hummel|priest|nebel/.test(att.key || '') ? 23 : 18;
      if (showD) { v174Boom(hit, b, big, def.c, def.r); if (kill && hard) v176Column(hit + 200, b, 2200); }
      tint(hit); return hit;
    }
    // flamethrower: five short pulses, the target keeps burning
    const a = v174Muzzle(att, 'rifle'), b = aim(4);
    for (let i = 0; i < 5; i++) v174Flame(t + i * 190, a, b, 140);
    const hit = t + 250; if (showD) v176Fire(hit, b, 1200);
    tint(t + 950); return hit;
  }


