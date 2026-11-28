// Raw pointer events → intents. Only taps for now (greybox); long press, drag, pan and pinch come with the real screen.
// toHex(x, y) → { c, r } | null is the view's pixel-to-hex mapping; the input never decides what a tap means.

/** canvas: the element; toHex: view mapping; onIntent({ type: 'tapHex', c, r }). Returns a detach function. */
export function attach(canvas, toHex, onIntent) {
  const onUp = e => {
    const box = canvas.getBoundingClientRect();
    const h = toHex((e.clientX - box.left) * (canvas.width / box.width), (e.clientY - box.top) * (canvas.height / box.height));
    if (h) onIntent({ type: 'tapHex', c: h.c, r: h.r });
  };
  canvas.addEventListener('pointerup', onUp);
  return () => canvas.removeEventListener('pointerup', onUp);
}
