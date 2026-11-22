  // ══════════════════════════════════════════════════════════════
  // [17n] v108 — camera elevation setting: trees / rocks follow HZ like the solids; the button cycles the angle and reloads
  // ══════════════════════════════════════════════════════════════
  { 
    /* v99Conifer: layer moved to js/chains/v99Conifer.js */
    /* v99Decid: layer moved to js/chains/v99Decid.js */
    /* v99Rock: layer moved to js/chains/v99Rock.js */
    const b = document.getElementById('v108-cam-btn');
    if (b) { b.textContent = '카메라 각도: ' + V108_ELEV + '°';
      b.addEventListener('click', () => { const i = V108_ELEVS.indexOf(V108_ELEV), n = V108_ELEVS[(i + 1) % V108_ELEVS.length];
        if (!confirm('카메라 각도를 ' + n + '°로 바꿉니다. 화면을 다시 불러오며 진행 중인 게임은 처음부터 시작됩니다.')) return;
        try { localStorage.setItem('coh1944.elev', String(n)); } catch (e) { }
        const u = new URL(location.href); u.searchParams.delete('elev'); location.href = u.toString(); }); } }
