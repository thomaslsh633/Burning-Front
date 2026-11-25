  // [chain:captureTick] 1 layer; the original in [17c] and older layers were dead code and are removed.
  //   Call order, outermost first: captureTick
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // captureTick: from [v172], does NOT call the layer below
  function captureTick(team) {
    capturePoints.forEach(cp => {
      const f = forecast(cp);
      if (f.tm === team && (f.st === 'capture' || f.st === 'neutralize')) {
        const k = team + f.st; cp.cprog = cp.cprog && cp.cprog.k === k ? { k, n: cp.cprog.n + 1 } : { k, n: 1 };
        if (cp.cprog.n < V139.capT) { pushFx(cp, (f.st === 'capture' ? '점령 중 ' : '무력화 중 ') + cp.cprog.n + '/' + V139.capT, TEAM_COL[team]); return; }
        cp.cprog = null;
        if (f.st === 'capture') { cp.owner = team; cp.flashT = performance.now(); pushFx(cp, 'CAPTURED', TEAM_COL[team]); addLog(`🏴 [Point captured] ${cp.name} → ${TEAM_NAME[team]} (${cpYieldText(cp)})`, 'supply'); }
        else { const was = cp.owner; cp.owner = null; cp.flashT = performance.now(); pushFx(cp, 'NEUTRALIZED', '#e2e8f0'); addLog(`🏳 [Point neutralized] ${cp.name} (was ${TEAM_NAME[was]})`, 'supply'); }
      } else if (f.st !== 'contested' && cp.cprog && cp.cprog.k.startsWith(team)) cp.cprog = null;   // the side left the zone: progress lost (contested freezes it)
    });
  }


