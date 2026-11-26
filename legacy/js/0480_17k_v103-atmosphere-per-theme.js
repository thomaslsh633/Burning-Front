  // ══════════════════════════════════════════════════════════════
  // [17k] v103 — atmosphere per theme: colour grade (soft-light tint) + vignette over the battlefield, falling snow for winter
  //   themes (two composited layers, transform-only animation), teletype paper toasts. Settings: weather effects on / off.
  // ══════════════════════════════════════════════════════════════
  V100_THEMES.ardennes44.weather = 'snow'; V100_THEMES.ardennes44.tint = 'rgba(80,118,178,.30)';
  V100_THEMES.normandy44.weather = null; V100_THEMES.normandy44.tint = 'rgba(214,170,96,.22)';
  var V103 = { fx: true };
  { const mk = (n, r0, r1, a0, seed) => { const S = 256, c = TankBaker.mkCanvas(S, S), g = c.getContext('2d');
      for (let i = 0; i < n; i++) { const x = v99h(i, seed, 1) * S, y = v99h(i, seed, 2) * S, r = r0 + v99h(i, seed, 3) * (r1 - r0), gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, `rgba(255,255,255,${a0})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.3); g.fill(); }
      return c.toDataURL(); };
    document.documentElement.style.setProperty('--snow', `url("${mk(46, .8, 2.1, .95, 7)}")`);
    { const S = 128, c = TankBaker.mkCanvas(S, S), g = c.getContext('2d'), id = g.createImageData(S, S), d = id.data;   // paper fibre for the toasts
      for (let i = 0; i < S * S; i++) { const n = v99h(i, 9, 5) * .6 + v99N((i % S) * .08, ((i / S) | 0) * .5) * .4; d[i * 4] = 90; d[i * 4 + 1] = 72; d[i * 4 + 2] = 40; d[i * 4 + 3] = n * 26; }
      g.putImageData(id, 0, 0); document.documentElement.style.setProperty('--paper', `url("${c.toDataURL()}")`); }
    document.getElementById('gameCanvas').insertAdjacentHTML('afterend', '<div id="v103-tint" aria-hidden="true"></div><div id="v103-fx" aria-hidden="true"><div class="snow"></div><div class="snow b"></div><div class="vig"></div></div>'); }
  function v103Apply() {
    const th = v100Theme(), fx = document.getElementById('v103-fx'), tn = document.getElementById('v103-tint'); if (!fx || !tn) return;
    fx.style.display = tn.style.display = V103.fx ? '' : 'none'; tn.style.setProperty('--grade', th.tint || 'transparent');
    fx.classList.toggle('nosnow', th.weather !== 'snow');
  }
  { const KEY = 'coh1944.fx', b = document.getElementById('v103-fx-btn');
    try { V103.fx = localStorage.getItem(KEY) !== 'off'; } catch (e) { }
    if (b) { const lab = () => b.textContent = '날씨·색감 효과: ' + (V103.fx ? '켜짐' : '꺼짐'); lab(); b.addEventListener('click', () => { V103.fx = !V103.fx; try { localStorage.setItem(KEY, V103.fx ? 'on' : 'off'); } catch (e) { } lab(); v103Apply(); }); } }
  {  /* resetGame: layer moved to js/chains/resetGame.js */ }
  v103Apply();


