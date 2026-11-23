  // [chain:tglBlock] 1 layer over tglBlock__base ([17b]).
  //   Call order, outermost first: tglBlock → tglBlock__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // tglBlock: from [17+6], calls tglBlock__base
  function tglBlock(u, id) {
      const e = tglBlock__base.apply(this, arguments); if (e || id !== 'emplace') return e;
      if (!v159Emplaced(u)) { if (isGarrisoned(u) && !u.isHmg) return '건물 안에서는 기관총만 거치할 수 있습니다.'; }
      else if (u.hasAttacked && u.atkT === turnNo) return '사격한 턴에는 거치를 해제할 수 없습니다.';
      return '';
    }


