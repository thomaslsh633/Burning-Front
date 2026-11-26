  // ══════════════════════════════════════════════════════════════
  // [v189] Turning is its own stage with its own tray.
  //   · entering: drag a direction from a long press on the unit, or press the "선회" tile of the skill tray (vehicles, packed crew weapons)
  //   · while the stage is open the skill tray is replaced by a single "선회 확정" tile (dim until a new direction is picked); a ghost + arc preview
  //     show the proposed direction; a tap on any empty spot cancels, a tap on the unit itself does nothing
  //   · crews (HMG, AT / flak / infantry gun — no mortars, artillery, Nebelwerfer) turn for free while packed; the skill tray keeps 거치 / 거치 해제;
  //     vehicles pay 1 move (±60° for turret tanks and fixed guns)
  // ══════════════════════════════════════════════════════════════
  const v188Aimable = u => !!u && u.team === currentTurn && v159Crew(u) && !!u.isHeavy && !u.isNebel && !u.isMortar && !u.isArtillery && (u.arcAngle || 0) < 6.28;
  const v189Can = u => !!u && u.team === currentTurn && u.hp > 0 && !u.isLoaded && (v188Aimable(u) || (!u.isHeavy && v130Reverses(u)));
  const v189Stage = u => !!(u && V185.pend && V185.pend.kind === 'turn' && V185.pend.u === u);
  function v188Turn(uid) {   // entry tile
    const u = uById(uid); if (!u || !v189Can(u)) return;
    if (!u.isHeavy && !v131CanTurn(u)) { toast(u.remainingMove < 1 ? '이동력이 부족합니다.' : '지금은 선회할 수 없습니다.'); return; }
    if (v189Stage(u)) return;
    V185.rot = null; V185.pend = { u, a: u.facingAngle, c: u.c, r: u.r, kind: 'turn' };
    updateUnitInfoPanel(u, getTerrain(u.c, u.r)); render();
  }
  window.v188Turn = v188Turn;
  function v189Confirm(uid) {
    const u = uById(uid); if (!v189Stage(u)) return;
    if (Math.abs(v173Ang(V185.pend.a - u.facingAngle)) < 1e-3) return;   // no new direction yet
    v185Confirm();
  }
  window.v189Confirm = v189Confirm;
  function v188TurnBtn(u) {
    if (!v189Can(u) || (u.isHeavy && v159Emplaced(u))) return '';
    const ok = u.isHeavy || v131CanTurn(u);
    return `<button class="btn-action" ${ok ? '' : 'style="opacity:.55"'} onclick="v188Turn('${u.id}')"><span>🔄 <strong>선회</strong><br><small>선회 · ${u.isHeavy ? '이동력 0' : '이동력 1 · 120° 초과 2'}${ok ? '' : ' · 이동력 부족'}</small></span></button>`;
  }
  {  /* tglBtns: layer moved to js/chains/tglBtns.js */ }
  // the turn tray: while a turn is being proposed the skill tray holds only the confirm tile
  {  /* rebuildHud: layer moved to js/chains/rebuildHud.js */ }
  // later wrappers (vehicle kits, ...) add their tiles after rebuildHud: the open turn stage keeps only the confirm tile
  {  /* updateUnitInfoPanel: layer moved to js/chains/updateUnitInfoPanel.js */ }
  // dragging a direction from a long press opens the turn stage
  {  /* v185Drag: layer moved to js/chains/v185Drag.js */ }

