  // ══════════════════════════════════════════════════════════════
  // [01] DOM 참조 · 전역 핸들
  //     · canvas/ctx, 턴·자원·로그 요소, 건설 버튼·안내/예측 배너·맵 선택
  // ══════════════════════════════════════════════════════════════


  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const turnText = document.getElementById("turn-text");
  const turnRound = document.getElementById("turn-round");
  const turnIndicator = document.getElementById("turn-indicator");
  const goldDisplay = document.getElementById("gold-display");
  const unitInfoEl = document.getElementById("unit-info");
  const specialActionsEl = document.getElementById("special-actions");
  const logEl = document.getElementById("log");
  const endTurnBtn = document.getElementById("end-turn-btn");

  const buildButtonsContainer = document.getElementById("build-buttons");
  const guideBanner = document.getElementById("guide-banner");
  const initGoldSelect = document.getElementById("init-gold-select");
  const mapSelect = document.getElementById("map-select");


  const combatPreviewBanner = document.getElementById("combat-preview-banner");
  const previewText = document.getElementById("preview-text");

