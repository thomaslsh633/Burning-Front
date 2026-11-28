// Raw pointer events → intents: tap → tapHex, mouse wheel and two-finger pinch → zoom. Panning is the page's own scrolling
// (the canvas sits in a scroll box). toHex(x, y) → { c, r } | null is the view's pixel-to-hex mapping; the input never
// decides what an intent means.

/** canvas: the element; toHex: view mapping; onIntent(intent). Returns a detach function. */
export function attach(canvas, toHex, onIntent) {
  const down = new Map();   // pointerId → position
  let pinch = null;          // { start distance, last factor } while two fingers are down
  const dist = () => { const [a, b] = [...down.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  const onDown = e => {
    down.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (down.size === 2) pinch = { d0: dist(), sent: 1 };
  };
  const onMove = e => {
    if (!down.has(e.pointerId)) return;
    down.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && down.size === 2) {
      const f = dist() / pinch.d0;
      if (Math.abs(Math.log(f / pinch.sent)) > Math.log(1.15)) { onIntent({ type: 'zoom', factor: f / pinch.sent }); pinch.sent = f; }
    }
  };
  const onUp = e => {
    const wasPinch = pinch != null;
    down.delete(e.pointerId);
    if (down.size < 2) pinch = down.size ? pinch : null;
    if (wasPinch || e.type === 'pointercancel') return;
    const box = canvas.getBoundingClientRect();
    const h = toHex((e.clientX - box.left) * (canvas.width / box.width), (e.clientY - box.top) * (canvas.height / box.height));
    if (h) onIntent({ type: 'tapHex', c: h.c, r: h.r });
  };
  const onWheel = e => { e.preventDefault(); onIntent({ type: 'zoom', factor: e.deltaY < 0 ? 1.15 : 1 / 1.15 }); };
  const events = { pointerdown: onDown, pointermove: onMove, pointerup: onUp, pointercancel: onUp, wheel: onWheel };
  for (const [k, f] of Object.entries(events)) canvas.addEventListener(k, f, k === 'wheel' ? { passive: false } : undefined);
  return () => { for (const [k, f] of Object.entries(events)) canvas.removeEventListener(k, f); };
}
