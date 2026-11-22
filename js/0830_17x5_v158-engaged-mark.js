  // ══════════════════════════════════════════════════════════════
  // [17+5] v158 — engaged mark · repair mark
  //     · engaged: set when a unit attacks (or uses an attack skill); kept while it keeps attacking;
  //       cleared at the end of an own turn with no attack, and by retreat (which shows the retreat flag instead)
  //       taking damage no longer sets it · while engaged: no auto-heal, no reinforcing (v140 / v141 rules)
  //     · repair: full repair amount even when engaged · the repaired vehicle carries the repair mark until the
  //       start of its side's next turn — received hit chance ×2 (cap 100 %) and received damage ×2
  //     · the repairer (engineer / recovery vehicle) cannot attack or use other abilities in the turn it repairs,
  //       and cannot start repairing after attacking or using an ability
  // ══════════════════════════════════════════════════════════════
  var V158 = { repAcc: 2, repDmg: 2 };
  function v158Engage(u) { if (u && u.key && u.hp > 0) { u.engaged = true; u.atkT = turnNo; } }
  function v158EndOwnTurn(tm) {
    units.forEach(u => { if (u.team === tm && u.engaged && u.atkT !== turnNo) u.engaged = false; });
  }
  const v158Locked = u => !!u && u.repLockT === turnNo;
  function v158Lock(a) { if (!a) return; a.repLockT = turnNo; a.hasAttacked = true; }
  function v158RepBlock(a) {
    if (!a || v158Locked(a)) return '';
    if (a.atkT === turnNo || a.skT === turnNo || a.hasAttacked) return '이번 턴에 공격·능력을 사용해 수리할 수 없습니다.';
    return '';
  }
  // a successful vehicle repair marks the target and locks the repairer
  {  /* armorRepair: layer moved to js/chains/armorRepair.js */ }
  // repair mode cannot be entered after an attack / ability
  {  /* toggleMode: layer moved to js/chains/toggleMode.js */ }
  {  /* bergepanzerRepair: layer moved to js/chains/bergepanzerRepair.js */ }
  // any repair from repair mode (vehicles, buildings, structures, edges) locks the repairer
  {  /* handleSpecialTap: layer moved to js/chains/handleSpecialTap.js */ }
  {  /* uskBlock: layer moved to js/chains/uskBlock.js */ }
  {  /* startTargetedBuild: layer moved to js/chains/startTargetedBuild.js */ }
  // the repair mark lasts through the enemy turn and is lifted at the start of the side's next turn
  { 
    /* processTurnStartStatus: layer moved to js/chains/processTurnStartStatus.js */ }
  // unit panel notes
  { 
    /* updateUnitInfoPanel: layer moved to js/chains/updateUnitInfoPanel.js */ }
  // banner marks: retreat flag (replaces the engaged cross) and repair wrench
  function v158Flag(x, y, s) {
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(10,8,6,.9)'; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(x - 2.6 * s, y + 4.4 * s); ctx.lineTo(x - 2.6 * s, y - 4.4 * s); ctx.stroke();
    ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = .9 * s; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 2.2 * s, y - 4.2 * s); ctx.lineTo(x + 4 * s, y - 2.6 * s); ctx.lineTo(x - 2.2 * s, y - .6 * s); ctx.closePath();
    ctx.fillStyle = '#f8fafc'; ctx.fill(); ctx.lineWidth = .6 * s; ctx.strokeStyle = 'rgba(10,8,6,.9)'; ctx.stroke();
    ctx.restore();
  }
  function v158Wrench(x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-.785);
    ctx.beginPath(); ctx.arc(0, 0, 4.4 * s, 0, 6.2832); ctx.fillStyle = 'rgba(8,12,16,.92)'; ctx.fill(); ctx.lineWidth = .9 * s; ctx.strokeStyle = '#fbbf24'; ctx.stroke();
    ctx.fillStyle = '#fbbf24'; ctx.fillRect(-.8 * s, -1 * s, 1.6 * s, 4 * s);
    ctx.beginPath(); ctx.arc(0, -2 * s, 1.8 * s, 0, 6.2832); ctx.fill();
    ctx.fillStyle = 'rgba(8,12,16,.95)'; ctx.fillRect(-.6 * s, -4 * s, 1.2 * s, 2 * s);
    ctx.restore();
  }


