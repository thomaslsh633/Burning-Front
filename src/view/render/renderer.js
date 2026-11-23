// Board canvas: sizes itself to the window at device pixel ratio and draws the frame.
// Phase 0 draws only the backdrop; render passes (terrain, overlays, units, fx) arrive in Phase 4.
export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let w = 0;
  let h = 0;
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const draw = () => {
    ctx.fillStyle = getComputedStyle(canvas).getPropertyValue('--board-bg').trim() || '#11161d';
    ctx.fillRect(0, 0, w, h);
  };
  resize();
  return { resize, draw };
}
