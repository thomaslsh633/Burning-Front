  // ══════════════════════════════════════════════════════════════
  // [03] 뷰포트 · 카메라 · 투영
  //     · COLS/ROWS, HEX_RADIUS, isoD/unproj, sizeCanvas/resizeCanvas, 전체화면, clampCam/setZoom/centerOnBase, 휠·키보드, initProjection
  // ══════════════════════════════════════════════════════════════


  // --- 동적 맵 크기 ---
  let COLS = 20, ROWS = 20;
  const HEX_RADIUS = 20, ORIGIN_X = 28, ORIGIN_Y = 28;


  // v108: camera elevation (degrees) — ?elev=NN in the URL wins, then the saved setting, else the classic 30°
  const V108_ELEVS = [30, 35, 40, 50, 55, 60];   // v110: + 35°
  const V108_ELEV = (() => { let e = NaN; try { e = +new URLSearchParams(location.search).get('elev'); } catch (x) { } return e >= 25 && e <= 70 ? e : 35; })();   // v111: fixed 35° (URL override for testing only)
  const V109 = { HEXK: 1.3, ZMAX: 2.4 * 1.3, TK: 1.2, IK: 1.3, FK: 1.12 };
  var sectors = [], sectorAt = new Map(), V131 = { sig: '', team: {}, hatch: {} }, V132 = { sig: '', geo: null, oob: null, oobSig: '' };   // v131 sectors (section [17t])
  var V130 = { arc: 'sel', pv: null, cone: 15 * Math.PI / 180, coneK: 0.5, bunkerDmg: 58, hqReinf: 3, hqAmmo: 0.5, revCost: 1 };   // v130 tuning (section [17s])   // v109: on-screen hex scale, max zoom, vehicle / infantry / formation scale
  // --- 모바일 세로 뷰포트 (DPR 대응) ---
  let showGrid = false; // v13: 격자는 기본 숨김, G 키로 디버그 토글
  let VIEW_W = 390, VIEW_H = 480, DPR = 1, dragDist = 0, zoom = 1.0, pinch = null, mapReady = false;   // v128: 1.0 so a range-6 fight (13 hexes across) fits a phone screen
  const ptrs = new Map(), TILT = Math.sin(V108_ELEV * Math.PI / 180), HZ = Math.cos(V108_ELEV * Math.PI / 180) / Math.cos(Math.PI / 6), LIFT = 9, ANG = Math.PI / 4, COSA = Math.cos(ANG), SINA = Math.sin(ANG);
  let WORLD_W = 1200, WORLD_H = 700, OFFX = 0, OFFY = 0, TILE_ORDER = [];
  const isoD = (dx, dy) => ({ x: dx * COSA - dy * SINA, y: (dx * SINA + dy * COSA) * TILT });
  const unproj = (dx, dy) => { const yr = dy / TILT; return { x: dx * COSA + yr * SINA, y: -dx * SINA + yr * COSA }; };


  const viewportBox = document.getElementById("viewport-container");
  function sizeCanvas() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    const cw = Math.max(200, viewportBox.clientWidth), ch = Math.max(200, viewportBox.clientHeight);
    if (mapReady) zoom = Math.max(zoom, zoomMin());
    VIEW_W = cw / zoom; VIEW_H = ch / zoom;
    canvas.width = Math.round(cw * DPR); canvas.height = Math.round(ch * DPR);
    canvas.style.width = cw + "px"; canvas.style.height = ch + "px";
  }
  // v23: 가로 고정. 세로 레이아웃은 폐기했고 #app은 항상 가로(.land) 배치를 쓴다.
  const appEl = document.getElementById("app");
  appEl.classList.add("land");
  // 전체화면 설정. 지원하지 않는 기기(예: iPhone Safari)는 버튼을 막고 안내만 한다.
  const fsBtn = document.getElementById("fs-btn"), fsRoot = document.documentElement;
  const fsReq = fsRoot.requestFullscreen || fsRoot.webkitRequestFullscreen;
  const fsExit = document.exitFullscreen || document.webkitExitFullscreen;
  const isFs = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  const syncFs = () => { fsBtn.textContent = "전체화면: " + (isFs() ? "켜짐" : "꺼짐"); };
  if (!fsReq) { fsBtn.disabled = true; fsBtn.textContent = "전체화면: 이 기기 미지원"; }
  fsBtn.addEventListener("click", async () => {
    try {
      if (isFs()) {
        try { screen.orientation.unlock(); } catch (e) {}
        await fsExit.call(document);
      } else {
        await fsReq.call(fsRoot, { navigationUI: "hide" });
        try { await screen.orientation.lock("landscape"); } catch (e) {}
      }
    } catch (e) { toast("전체화면을 켤 수 없습니다"); }
    syncFs();
  });
  document.addEventListener("fullscreenchange", syncFs);
  document.addEventListener("webkitfullscreenchange", syncFs);
  sizeCanvas();


  function resizeCanvas() {
    sizeCanvas();
    clampCam();
    render();
  }
  let _rzId = 0;
  new ResizeObserver(() => { cancelAnimationFrame(_rzId); _rzId = requestAnimationFrame(resizeCanvas); }).observe(viewportBox);


  function clampCam() {
    camX = Math.max(0, Math.min(Math.max(0, WORLD_W - VIEW_W + 60), camX));
    camY = Math.max(0, Math.min(Math.max(0, WORLD_H - VIEW_H + 60), camY));
  }
  function zoomMin() {
    const tw = WORLD_W + 90, th = WORLD_H + 90;
    return Math.max(viewportBox.clientWidth / tw, viewportBox.clientHeight / th);
  }
  function setZoom(z, fx, fy) {
    fx = fx ?? viewportBox.clientWidth / 2; fy = fy ?? viewportBox.clientHeight / 2;
    const wx = fx / zoom + camX, wy = fy / zoom + camY;
    zoom = Math.max(zoomMin(), Math.min(V109.ZMAX, z));
    camX = wx - fx / zoom; camY = wy - fy / zoom;
    resizeCanvas();
  }
  function centerOnBase(anim = true) {
    const hq = buildings.find(b => b.team === currentTurn && b.type === 'hq' && b.hp > 0);
    if (!hq) return;
    const c = getHexCenter(hq.c, hq.r), sx = camX, sy = camY, t0 = performance.now();
    const tx = Math.max(0, Math.min(WORLD_W - VIEW_W + 60, c.x - VIEW_W / 2));
    const ty = Math.max(0, Math.min(WORLD_H - VIEW_H + 60, c.y - VIEW_H / 2));
    (function step(now) {
      const k = anim && !reduceMotion() ? Math.min(1, (now - t0) / 400) : 1, e = k * (2 - k);
      camX = sx + (tx - sx) * e; camY = sy + (ty - sy) * e; clampCam(); render();
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }
  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const rc = canvas.getBoundingClientRect();
    setZoom(zoom * Math.exp(-e.deltaY * 0.0015), e.clientX - rc.left, e.clientY - rc.top);
  }, { passive: false });
  window.addEventListener("pointercancel", (e) => { ptrs.delete(e.pointerId); pinch = null; isPanning = false; });
  window.addEventListener("keydown", (e) => {
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
    const k = e.key, st = 48 / zoom;
    if (k === "ArrowLeft" || k === "a") camX -= st; else if (k === "ArrowRight" || k === "d") camX += st;
    else if (k === "ArrowUp" || k === "w") camY -= st; else if (k === "ArrowDown" || k === "s") camY += st;
    else if (k === "+" || k === "=") return setZoom(zoom * 1.2);
    else if (k === "-" || k === "_") return setZoom(zoom / 1.2);
    else if (k === "Home") return centerOnBase();
    else if (k === "g" || k === "G") showGrid = !showGrid;
    else return;
    e.preventDefault(); clampCam(); render();
  });


  function initProjection() {
    const w = Math.sqrt(3) * HEX_RADIUS, R = HEX_RADIUS, xs = [], ys = [];
    [[ORIGIN_X - w / 2, ORIGIN_Y - R], [ORIGIN_X + COLS * w, ORIGIN_Y - R], [ORIGIN_X + COLS * w, ORIGIN_Y + ROWS * 1.5 * R + R], [ORIGIN_X - w / 2, ORIGIN_Y + ROWS * 1.5 * R + R]]
      .forEach(([x, y]) => { xs.push(x * COSA - y * SINA); ys.push((x * SINA + y * COSA) * TILT); });
    const x0 = Math.min(...xs), y0 = Math.min(...ys);
    OFFX = 40 - x0; OFFY = 40 + 2 * LIFT * HZ - y0;
    WORLD_W = Math.max(...xs) - x0 + 80; WORLD_H = Math.max(...ys) - y0 + 80 + 2 * LIFT * HZ;
    TILE_ORDER = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const fx = ORIGIN_X + c * w + (r % 2) * w / 2, fy = ORIGIN_Y + r * 1.5 * R;
        TILE_ORDER.push([c, r, fx * SINA + fy * COSA]);
      }
    }
    TILE_ORDER.sort((a, b) => a[2] - b[2]);
  }

