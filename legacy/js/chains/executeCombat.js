  // [chain:executeCombat] 8 layers over executeCombat__base ([11]).
  //   Call order, outermost first: executeCombat → executeCombat__v150 → executeCombat__v147 → executeCombat__v140 → executeCombat__v139 → executeCombat__v130 → executeCombat__v47 → executeCombat__s11 → executeCombat__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // executeCombat: from [v174], calls executeCombat__v150
  function executeCombat(att, def) {
      if (reduceMotion() || !att || !def) return executeCombat__v150.apply(this, arguments);
      const pre = v174Snap(), n0 = fxList.length; V180.collect = []; let r, turns; try { r = executeCombat__v150.apply(this, arguments); } finally { turns = V180.collect; V180.collect = null; }
      const t0 = v174Start(), dmg = pre.get(def) ? pre.get(def).hp - def.hp : 0;
      const tr = turns.find(x => x.u === att), turnMs = tr ? v180TurnMs(att, tr.d, tr.tur) : 0; if (tr && turnMs > 0) v180TurnSet(att, tr.a, tr.d, t0, turnMs, tr.tur);   // v180: face the target first, then fire
      const t = t0 + turnMs;
      const hitT = v174Attack(att, def, t, { miss: dmg <= 0, dmg, kill: def.hp <= 0 });
      const p = pre.get(def); if (p && (p.hp !== def.hp || p.sup !== def.suppression)) v174Hold(def, p, hitT);
      let end = hitT;
      // splash victims
      units.forEach(u => { const q = pre.get(u); if (!q || u === att || u === def || (q.hp === u.hp && q.sup === u.suppression)) return; if (v174Vis(u) && v174Kind(att) === 'arc') v174Boom(hitT - 10, v174HitPt(u, 6), 10); v174Hold(u, q, hitT); });
      // counter fire
      const pa = pre.get(att);
      if (pa && (att.hp < pa.hp || (pa.sup || 0) < (att.suppression || 0))) { const ctr = turns.find(x => x.u === def), cms = ctr ? v180TurnMs(def, ctr.d, ctr.tur) : 0; if (ctr && cms > 0) v180TurnSet(def, ctr.a, ctr.d, hitT + V176.counterGap, cms, ctr.tur);   // v183: the counter-firing turret turns first
        const ct = v174Attack(def, att, hitT + V176.counterGap + cms, { miss: false }); v174Hold(att, pa, ct); end = ct; }
      v174FxShift(n0, f => { const u = units.find(x => x.c === f.c && x.r === f.r); const h = u && V174.hold.get(u); return h ? h.until : hitT; });
      V174.busyUntil = end + 80 + V176.tail; v174Kick(); return r;
    }

  // executeCombat__v150: from [17(], calls executeCombat__v147
  function executeCombat__v150(att, def) {
      const dc = def && def.c, dr = def && def.r, res = executeCombat__v147.apply(this, arguments);
      try { if (att && def && !(def.type && BLD[def.type])) {
        const p = (att.isArtillery || att.isNebel) ? V150.craterP.art : att.isMortar ? V150.craterP.mortar : (att.armorType === 'hard' && att.shell === 'he' && (att.atk || 0) >= 20) ? V150.craterP.he : 0;
        if (p) v150Crater(dc, dr, p); } } catch (err) { console.warn('v150 crater', err); }
      return res;
    }

  // executeCombat__v147: from [17&], calls executeCombat__v140
  function executeCombat__v147(att, def) {
      const dc = def && def.c, dr = def && def.r, ind = !!(att && (att.isMortar || att.isArtillery || att.isNebel)), sd = structDmg(att);
      let ent = null; if (sd > 0 && def && !ind) { const ln = hexLine(att.c, att.r, dc, dr); if (ln.length >= 2) ent = ln[ln.length - 2]; }
      const res = executeCombat__v140.apply(this, arguments);
      try {
        if (sd > 0 && def && !(def.type && BLD[def.type])) {
          let ch = false;
          const st = v147StructAt(dc, dr); if (st && st.stage < 2 && !att.isFlamer) { v147DamageStruct(st, Math.round(sd * (ind ? 1 : .8))); ch = true; }
          if (ent) { const e = getEdge(ent[0], ent[1], dc, dr); if (e) { v147HitEdge(ent[0], ent[1], dc, dr, att.isFlamer && e.kind === 'hedge' ? 999 : Math.round(sd * .6)); ch = true; } }
          if (ind) { v147EdgesAround(dc, dr, Math.round(sd * .35)); ch = true; }
          if (ch) updateVision();
        }
      } catch (err) { console.warn('v147 struct hit', err); }
      return res;
    }

  // executeCombat__v140: from [17*], calls executeCombat__v139
  function executeCombat__v140(att, def) { v158Engage(att); v214Fired(att); return executeCombat__v139.apply(this, arguments); }

  // executeCombat__v139: from [v172], calls executeCombat__v130
  function executeCombat__v139(att, def) {
      const h0 = def && def.hp, a0 = att && att.hp, r = executeCombat__v130.apply(this, arguments);
      try {
        if (def && def.maxHp && h0 > def.hp) { const n = Math.floor((h0 - Math.max(0, def.hp)) / def.maxHp * 10); if (n > 0 && att.hp > 0) addVeterancyExp(att, n, 'dmg'); if (def.hp > 0 && def.key) addVeterancyExp(def, 1, 'dmg'); }
        if (att && att.maxHp && a0 > att.hp && att.hp > 0) addVeterancyExp(att, 1, 'dmg');
      } catch (e) { console.warn('v139 xp', e); }
      return r;
    }

  // executeCombat__v130: from [17s], calls executeCombat__v47
  function executeCombat__v130(att, def) {
    const a0 = att.ammo, tc = def.c, tr = def.r, cone = att.cone ? v130ConeTargets(att, tc, tr) : [];
    const out = executeCombat__v47.apply(this, arguments);
    if (cone.length && att.ammo < a0) cone.forEach(o => {
      if (o.hp <= 0) return;
      const res = calcDamage(att, o);
      v130Hit(att, o, Math.max(0, Math.round(res.damage * V130.coneK)), res, '부채꼴 사격');
    });
    return out;
  }

  // executeCombat__v47: from [17b], calls executeCombat__s11
  function executeCombat__v47(att, def) {
    pasSync(att); pasSync(def);
    executeCombat__s11(att, def);
    if (att.hp > 0 && hasPas(att, 'scoot') && !att.scootUsed && !att.trackDamaged && suppState(att) < 2) {
      att.scootUsed = true; att.remainingMove += 2;
      addLog(`🏃 [Shoot and Scoot] ${att.className} 사격 후 이동력 +2 (잔여 ${att.remainingMove})`, 'move');
    }
  }

  // executeCombat__s11: from [11], calls executeCombat__base
  function executeCombat__s11(att, def) {
    const hadCamo = !!(att.buff && att.buff.camo);
    executeCombat__base(att, def);
    { const sv = vetV(att).ammoSave; if (sv && att.maxAmmo) att.ammo = Math.min(att.maxAmmo, att.ammo + vetSave(att, 'amm', sv)); }
    if (att.buff) {
      Object.keys(att.buff).forEach(k => { if (BUFF_FX[k] && BUFF_FX[k].once) delete att.buff[k]; });
      if (hadCamo) { delete att.buff.camo; addLog(`🫥 [위장 해제] ${att.className} — 사격으로 노출`, 'move'); updateVision(); }
    }
  }


