  // [chain:getHexCenter] 1 layer over getHexCenter__base ([08]).
  //   Call order, outermost first: getHexCenter → getHexCenter__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // getHexCenter: from [17z], calls getHexCenter__base
  function getHexCenter(c, r) {
      if (!v137On() || c < 0 || r < 0 || c >= COLS || r >= ROWS) return getHexCenter__base(c, r);
      const w = Math.sqrt(3) * HEX_RADIUS, fx = ORIGIN_X + c * w + (r % 2) * (w / 2), fy = ORIGIN_Y + r * HEX_RADIUS * 1.5;
      return { x: fx * COSA - fy * SINA + OFFX, y: (fx * SINA + fy * COSA) * TILT + OFFY - V137.hc[r * COLS + c] * LIFT * HZ };
    }


