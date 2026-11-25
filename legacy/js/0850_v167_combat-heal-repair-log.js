  // [v167] combat / heal / repair log amounts ("-N HP", "+N HP", "N 피해") on the CoH3 scale
  { const o = addLog; addLog = function (msg, kind) {
      if (typeof msg === 'string') msg = msg.replace(/([+\-−]?)(\d+(?:\.\d+)?)( HP| 피해)/g, (m, sg, n, t) => sg + hpD(+n) + t);
      return o.call(this, msg, kind);
    }; }

