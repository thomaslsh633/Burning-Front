  // [chain:armorRepair] 2 layers; the original in [v162] and older layers were dead code and are removed.
  //   Call order, outermost first: armorRepair → armorRepair__v140
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // armorRepair: from [17+5], calls armorRepair__v140
  function armorRepair(actor, t, kind) { const ok = armorRepair__v140.apply(this, arguments); if (ok && t) { t.repairing = true; v158Lock(actor); } return ok; }

  // armorRepair__v140: from [17*], does NOT call the layer below
  function armorRepair__v140(actor, t, kind) {
    const tm = actor.team;
    if (t.trackDamaged || t.gunDisabled) {
      if (kind === 'eng') { if (gold[tm] < 15 || mun[tm] < 5) return false; gold[tm] -= 15; mun[tm] -= 5; }
      else if (mun[tm] < 5) return false;
      if (t.trackDamaged) { t.trackDamaged = false; addLog(`🔧 [궤도 수리] ${t.className}`, 'eng'); }
      else { t.gunDisabled = false; addLog(`🔧 [주포 수리] ${t.className}`, 'eng'); }
      updateGoldUI(); return true;
    }
    if (t.hp >= t.maxHp) return false;
    const mm = doctrine[tm] === 'mech' ? (cpOf(tm) >= 6 ? 2 : 1.5) : 1;   // v158: no in-combat repair penalty
    const amt = Math.round(((kind === 'berge' ? V140.repBerge : V140.repEng) + (vetV(actor).repAmt || 0)) * mm * vetV(actor).effic);
    if (amt <= 0) return false;
    const b = t.hp; t.hp = Math.min(t.maxHp, t.hp + amt); t.repairedThisTurn = (t.repairedThisTurn || 0) + (t.hp - b);
    addLog(`🔧 [체력 수리] ${t.className} +${t.hp - b} HP`, 'eng'); return true;
  }


