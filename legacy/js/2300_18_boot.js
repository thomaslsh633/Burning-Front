  // [18] 부팅
  //     · renderCP → initProjection → mapReady → sizeCanvas → resetGame
  // ══════════════════════════════════════════════════════════════

  renderCP();

  initProjection();
  mapReady = true; sizeCanvas();
  shellBoot();   // v202: lobby first; resetGame() runs when a match is deployed


