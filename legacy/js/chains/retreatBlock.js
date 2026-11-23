  // [chain:retreatBlock] 1 layer; the original in [v128] and older layers were dead code and are removed.
  //   Call order, outermost first: retreatBlock
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // retreatBlock: from [17*], does NOT call the layer below
  function retreatBlock(u) {
    const rp = v140Rally(u.team); if (!rp) return '집결지(본부·전초기지)가 없어 퇴각할 수 없습니다.';
    if (u.retreating) return '이미 퇴각 중입니다.';
    if (u.hasAttacked) return '이번 턴에 공격한 유닛은 퇴각할 수 없습니다.';
    if (u.skT === turnNo) return '이번 턴에 능력을 사용한 유닛은 퇴각할 수 없습니다.';
    if (getDistance(u.c, u.r, rp.c, rp.r) <= V140.retNear) return `이미 집결지 ${V140.retNear}칸 안에 있습니다.`;
    return '';
  }


