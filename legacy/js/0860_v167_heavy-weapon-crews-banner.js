  // [v167] heavy weapon crews: banner-top marks
  //   top right: emplaced (green tripod, amber while setting up this turn) or packed (amber arrows)
  //   top left: cannot fire (red crossed sight) while packed or on the turn it emplaced
  function v167Badge(x, y, k, ring) {
    ctx.beginPath(); ctx.arc(x, y, 4.3 * k, 0, 6.2832); ctx.fillStyle = 'rgba(10,13,17,.94)'; ctx.fill();
    ctx.lineWidth = 1.1 * k; ctx.strokeStyle = ring; ctx.stroke();
  }
  function v167Tripod(x, y, k, col) {
    ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineCap = 'round'; ctx.lineWidth = .95 * k;
    ctx.beginPath(); ctx.moveTo(x - 2.6 * k, y + 2.4 * k); ctx.lineTo(x, y - .6 * k); ctx.lineTo(x + 2.6 * k, y + 2.4 * k);
    ctx.moveTo(x, y - .6 * k); ctx.lineTo(x, y + 2.6 * k); ctx.stroke();
    ctx.fillRect(x - 2.2 * k, y - 2.3 * k, 4.4 * k, 1.3 * k);   // gun on the mount
    ctx.restore();
  }
  function v167Packed(x, y, k, col) {
    ctx.save(); ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = .95 * k;
    ctx.beginPath(); ctx.moveTo(x - 2.7 * k, y); ctx.lineTo(x + 2.7 * k, y);
    ctx.moveTo(x - 1.3 * k, y - 1.4 * k); ctx.lineTo(x - 2.7 * k, y); ctx.lineTo(x - 1.3 * k, y + 1.4 * k);
    ctx.moveTo(x + 1.3 * k, y - 1.4 * k); ctx.lineTo(x + 2.7 * k, y); ctx.lineTo(x + 1.3 * k, y + 1.4 * k); ctx.stroke();
    ctx.restore();
  }
  
  /* v167CrewMarks: original body removed — replaced by a later layer (js/chains/v167CrewMarks.js) */

