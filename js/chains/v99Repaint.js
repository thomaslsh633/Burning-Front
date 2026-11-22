  // [chain:v99Repaint] 1 layer over v99Repaint__base ([17g]).
  //   Call order, outermost first: v99Repaint → v99Repaint__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v99Repaint: from [17z], calls v99Repaint__base
  function v99Repaint(px0, py0, px1, py1) {
      if (!v137On()) return v99Repaint__base(px0, py0, px1, py1);
      const G = v99G, gs = G.gs, info = G.info, P = info.pal, W = px1 - px0, H = py1 - py0; if (W <= 0 || H <= 0) return;
      const g = G.cv.getContext('2d'), rx0 = px0 / gs, ry0 = py0 / gs, rx1 = px1 / gs, ry1 = py1 / gs;
      const img = g.createImageData(W, H); v99Paint(img, W, H, rx0, ry0, gs, 0, info); g.putImageData(img, px0, py0);
      g.save(); g.beginPath(); g.rect(px0, py0, W, H); g.clip(); g.setTransform(gs, 0, 0, gs, 0, 0);
      const near = []; for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const q = getHexCenter(c, r); if (q.x > rx0 - 44 && q.x < rx1 + 44 && q.y > ry0 - 26 && q.y < ry1 + 52) near.push([c, r, q]); }
      v99Flats(g, info, near, 0);
      const items = []; near.forEach(n => v99Uprights(info, n[0], n[1], n[2], items));
      v99DrawItems(g, items, P);
      g.restore();
    }


