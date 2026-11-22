  // [chain:v101Portrait] 1 layer over v101Portrait__base ([17i]).
  //   Call order, outermost first: v101Portrait → v101Portrait__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v101Portrait: from [17p], calls v101Portrait__base
  function v101Portrait(key, team) {
      const g = V115_GUN[team + ':' + key]; if (!g) return v101Portrait__base(key, team);
      const ck = 'v115|' + key + '|' + team; if (V101_PORT.has(ck)) return V101_PORT.get(ck);
      let url = null;
      try {
        const S = 96, out = TankBaker.mkCanvas(S, S), gg = out.getContext('2d'), src = GUN_SPR.get(g, g.n, Math.PI * .78).hi, w = src.width, h = src.height, d = src.getContext('2d').getImageData(0, 0, w, h).data;
        let x0 = w, y0 = h, x1 = 0, y1 = 0; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 200) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        if (x1 > x0) { const bw = x1 - x0 + 1, bh = y1 - y0 + 1, kk = Math.min((S - 8) / bw, (S - 12) / bh); gg.imageSmoothingEnabled = true; gg.imageSmoothingQuality = 'high'; gg.drawImage(src, x0, y0, bw, bh, (S - bw * kk) / 2, S - 6 - bh * kk, bw * kk, bh * kk); url = out.toDataURL(); }
      } catch (err) { url = null; }
      V101_PORT.set(ck, url); return url;
    }


