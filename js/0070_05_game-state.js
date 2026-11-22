  // ══════════════════════════════════════════════════════════════
  // [05] 게임 상태 변수
  //     · 카메라, currentTurn, selectedUnit, gold/fuel/mun, doctrine, terrainMap, capturePoints, buildings …
  // ══════════════════════════════════════════════════════════════


  let camX = 40, camY = 350;
  let isPanning = false, panStartX = 0, panStartY = 0, hasDragged = false;
  let currentTurn = 'blue', currentTab = 'infantry', roundCount = 1;
  let selBld = null, selectedUnit = null, validMoves = [], validAttacks = [];
  let pendingAttackTarget = null, actionMode = null, activeActor = null, pendingDeployKey = null;
  let isAwaitingFacing = false, isDraggingFacing = false, facingUnit = null;


  let mun = { blue: 60, red: 60 }, teamXp = { blue: 0, red: 0 };
  let doctrine = { blue: null, red: null }, bgCd = { blue: {}, red: {} }, bgTurn = { blue: -1, red: -1 }, smokes = [], pendingStrikes = [], reveals = [], turnNo = 1;
  let gold = { blue: 3500, red: 3500 }, fuel = { blue: 250, red: 250 };
  const BASE_INCOME = 60;   // v140: 150 → 60
  let terrainMap = {}, capturePoints = [], buildings = [], mines = [], bunkers = [], visibleHexes = new Set();

