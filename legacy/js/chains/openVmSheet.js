  // [chain:openVmSheet] 1 layer over openVmSheet__base ([17c]).
  //   Call order, outermost first: openVmSheet → openVmSheet__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // openVmSheet: from [19], calls openVmSheet__base
  function openVmSheet() {
      if (shMode() !== 'annihilation') return openVmSheet__base.apply(this, arguments);
      const el = shEl('vm-body'), cap = SHELL.cfg.roundCap | 0; if (!el) return;
      el.innerHTML = `<p><b>섬멸전</b> — 상대 부대를 모두 없애고, 상대가 새 부대를 투입할 수 없게 되면 승리합니다. 승리 거점은 점수가 없고 자원 거점은 수입을 계속 냅니다.</p>
        <p>연합군: 생존 ${shAlive('blue').length}개 부대 · 가치 ${shValue('blue')}${shCanField('blue') ? '' : ' · 투입 불가'}<br>추축군: 생존 ${shAlive('red').length}개 부대 · 가치 ${shValue('red')}${shCanField('red') ? '' : ' · 투입 불가'}</p>
        <p>${cap ? `라운드 제한 ${cap} — 끝나면 생존 부대 가치가 높은 쪽이 승리, 같으면 무승부 (현재 R${roundCount})` : '라운드 제한 없음'}</p>`;
      shEl('vm-sheet').classList.add('open');
    }


