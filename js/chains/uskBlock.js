  // [chain:uskBlock] 3 layers over uskBlock__base ([13]).
  //   Call order, outermost first: uskBlock → uskBlock__v158 → uskBlock__v47 → uskBlock__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // uskBlock: from [17+6], calls uskBlock__v158
  function uskBlock(u, d, id) {
      if (v159Crew(u) && d && d.act && !v159Ready(u)) return v159Emplaced(u) ? '거치한 턴에는 사용할 수 없습니다.' : '거치 상태에서만 사용할 수 있습니다.';
      return uskBlock__v158.apply(this, arguments);
    }

  // uskBlock__v158: from [17+5], calls uskBlock__v47
  function uskBlock__v158(u, d, id) { if (v158Locked(u)) return '수리한 턴에는 공격·능력을 사용할 수 없습니다.'; return uskBlock__v47.apply(this, arguments); }

  // uskBlock__v47: from [17b], calls uskBlock__base
  function uskBlock__v47(u, d, id) { const e = uskBlock__base(u, d, id); if (e) return e; if (d.noatk && u.hasAttacked) return '이미 공격 행동을 사용했습니다.'; return ''; }


