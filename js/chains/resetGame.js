  // [chain:resetGame] 11 layers over resetGame__base ([17]).
  //   Call order, outermost first: resetGame → resetGame__v159 → resetGame__v151 → resetGame__v140 → resetGame__v103 → resetGame__v100 → resetGame__v59 → resetGame__v57 → resetGame__v55 → resetGame__s17_2 → resetGame__s17 → resetGame__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // resetGame: from [19], calls resetGame__v159
  function resetGame() {
      SHELL.log = []; SHELL.seen = new Map(); SHELL.endWhy = ''; SHELL.undo = null; SHELL.idleLast = null; SHELL.pre = null; logEl.innerHTML = '';
      curtainEl.classList.remove('open'); aarEl.classList.remove('open'); shRosterOpen(false);
      const r = resetGame__v159.apply(this, arguments); shApplyStart(); shTrack();
      if (SHELL.inGame && !SHELL.quiet) { SHELL.cfg.map = mapSelect.value; shSave(); shPrebake(); }   // also covers the sandbox map / funds selectors in the pause menu
      return r;
    }

  // resetGame__v159: from [17+6], calls resetGame__v151
  function resetGame__v159() {
      const r = resetGame__v151.apply(this, arguments);
      units.forEach(u => { if (v159Crew(u)) { u.tgl.emplace = true; u.empT = -9; } });
      return r;
    }

  // resetGame__v151: from [v168], calls resetGame__v140
  function resetGame__v151() { const r = resetGame__v140.apply(this, arguments); try { v151AssignAll(); render(); } catch (err) { console.warn('v151 fp', err); } return r; }

  // resetGame__v140: from [17*], calls resetGame__v103
  function resetGame__v140() {
      const r = resetGame__v103.apply(this, arguments);
      const g0 = parseInt(initGoldSelect.value) || 600; V140.startMP = g0;
      V140.rally = { blue: null, red: null };
      if (g0 === 600) { gold = { blue: 600, red: 690 }; fuel = { blue: 30, red: 45 }; }
      else { gold.red += 90; fuel.red += 15; }
      v140IntAll(); updateGoldUI(); updateBuildMenu();
      return r;
    }

  // resetGame__v103: from [17k], calls resetGame__v100
  function resetGame__v103() { const r = resetGame__v100.apply(this, arguments); v103Apply(); return r; }

  // resetGame__v100: from [17h], calls resetGame__v59
  function resetGame__v100() {
    const r = resetGame__v59.apply(this, arguments); v100FlagCss(); V100.brief.cache = null;
    if (V100.autoBrief && !navigator.webdriver) setTimeout(v100BriefOpen, 30);
    return r;
  }

  // resetGame__v59: from [17c], calls resetGame__v57
  function resetGame__v59() { toastWrap.innerHTML = ''; resetGame__v57(); vmRefreshHud(); }

  // resetGame__v57: from [v128], calls resetGame__v55
  function resetGame__v57() { cpHold = { blue: 0, red: 0 }; resetGame__v55(); }

  // resetGame__v55: from [v128], calls resetGame__s17_2
  function resetGame__v55() { balLog = { rows: [], tank: {}, heavy: {}, armed: false }; resetGame__s17_2(); balLog.armed = true; }

  // resetGame__s17_2: from [17], calls resetGame__s17
  function resetGame__s17_2() { fires = []; USKC.cur = null; resetGame__s17(); }

  // resetGame__s17: from [17], calls resetGame__base
  function resetGame__s17() { research = { blue: {}, red: {} }; queue = { blue: {}, red: {} }; upg = { blue: {}, red: {} }; resSel = {}; mun = { blue: 60, red: 60 }; teamXp = { blue: 0, red: 0 }; doctrine = { blue: null, red: null }; bgCd = { blue: {}, red: {} }; bgTurn = { blue: -1, red: -1 }; smokes = []; pendingStrikes = []; reveals = []; turnNo = 1; resetGame__base(); renderResearch(); }


