  // [chain:retreatMove] 1 layer; the original in [v128] and older layers were dead code and are removed.
  //   Call order, outermost first: retreatMove
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // retreatMove: from [17*], does NOT call the layer below
  function retreatMove(u) {
    const budget = Math.ceil((u.hasMoved ? u.remainingMove : u.moveDist) * V140.retMove);
    const s = v140RetStep(u, budget); if (!s) { toast('집결지가 없습니다.'); return false; }
    if (selectedUnit === u) { validMoves = []; validAttacks = []; }
    return `${v140RpName(s.rp)} 방향 ${s.moved}칸 퇴각 (이동력 ${budget})${s.done ? ' — 집결 완료' : ` — 집결지까지 ${s.left}칸, 매 턴 자동 이동`} · 피격 명중 −50% · 반격 없음`;
  }


