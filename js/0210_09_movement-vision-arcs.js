  // ══════════════════════════════════════════════════════════════
  // [09] 이동 · 시야 · 사격각
  //     · getTileMovementCost, calculateReachableHexes, updateVision(+위장/연막 래핑), isInFiringArc
  // ══════════════════════════════════════════════════════════════


  function getTileMovementCost__base(unit, fromC, fromR, toC, toR) {
    if (getBuildingAt(toC, toR)) return Infinity;
    const toTer = getTerrain(toC, toR);
    const fromTer = getTerrain(fromC, fromR);
    const isVehicle = unit.armorType === 'hard';
    const def = TERRAIN_DEFS[toTer.terrainType] || TERRAIN_DEFS.plains;


    let baseCost = isVehicle ? def.veh : def.inf;
    if (baseCost === Infinity) return Infinity;


    // v136: climbing costs no extra movement (the high-ground combat rule still applies)
    return baseCost;
  }


  function calculateReachableHexes(unit) {
    const startKey = `${unit.c},${unit.r}`;
    const dists = { [startKey]: 0 };
    const queue = [{ c: unit.c, r: unit.r, cost: 0 }];
    const reachable = [];
    const maxMP = unit.remainingMove;


    while (queue.length > 0) {
      queue.sort((a, b) => a.cost - b.cost);
      const curr = queue.shift();
      if (curr.cost > dists[`${curr.c},${curr.r}`]) continue;


      const neighbors = getHexNeighbors(curr.c, curr.r);
      for (const n of neighbors) {
        const costToAdd = getTileMovementCost(unit, curr.c, curr.r, n.c, n.r);
        if (costToAdd === Infinity) continue;


        const occupant = getUnitAt(n.c, n.r);
        if (occupant && occupant.team !== unit.team) continue;
        if (occupant && occupant.team === unit.team) {
          if (occupant.armorType === 'hard' || occupant.isHeavy) continue;
        }


        const newCost = curr.cost + costToAdd;
        const nKey = `${n.c},${n.r}`;


        if (newCost <= maxMP && (!unit.hasFuel || newCost <= unit.fuel)) {
          if (dists[nKey] === undefined || newCost < dists[nKey]) {
            dists[nKey] = newCost;
            queue.push({ c: n.c, r: n.r, cost: newCost });


            if (!occupant && !reachable.some(r => r.c === n.c && r.r === n.r)) {
              reachable.push({ c: n.c, r: n.r, cost: newCost });
            }
          }
        }
      }
    }
    return reachable;
  }


  function updateVision__base() {
    visibleHexes.clear();
    const friendlies = units.filter(u => u.team === currentTurn && u.hp > 0 && !u.isLoaded);
    const myBuildings = buildings.filter(b => b.team === currentTurn && b.hp > 0);
    const myBunkers = bunkers.filter(b => b.team === currentTurn && b.hp > 0);


    const visionSources = [...friendlies, ...myBuildings, ...myBunkers];
    visionSources.forEach(source => {
      const ter = getTerrain(source.c, source.r);
      const totalSight = Math.max(1, (source.baseSight || source.sight || 3) + (ter.elevation || 0) - (suppState(source) >= 2 ? 1 : 0));


      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const dist = getDistance(source.c, source.r, c, r);
          if (dist <= totalSight && (dist <= 1 || !LAYERS.sight || !sightLine(source.c, source.r, c, r, eyeOf(source)).block)) {   // v144: sight lines
            visibleHexes.add(`${c},${r}`);
          }
        }
      }
    });
    // v144: units in bush / trees / buildings are seen only by enemies close enough
    if (LAYERS.sight && LAYERS.conceal) units.forEach(u => {
      if (u.team === currentTurn || u.hp <= 0 || u.isLoaded) return;
      const k = concealOf(u.c, u.r);
      if (k && !visionSources.some(s => getDistance(s.c, s.r, u.c, u.r) <= k)) visibleHexes.delete(`${u.c},${u.r}`);
    });
  }


  function nearFacingUnit(e) {
    const rc = canvas.getBoundingClientRect(), q = getHexCenter(facingUnit.c, facingUnit.r);
    return Math.hypot(e.clientX - rc.left - (q.x - camX) * zoom, e.clientY - rc.top - (q.y - camY) * zoom) <= 3.2 * HEX_RADIUS * zoom;
  }
  function isInFiringArc(attacker, targetC, targetR) {
    if (!attacker.isHeavy || attacker.isNebel) return typeof v184Fixed === 'function' && v184Fixed(attacker) ? v184InArc(attacker, targetC, targetR) : true;   // v185: fixed-gun tanks have a firing arc
    const from = getHexCenter(attacker.c, attacker.r);
    const to = getHexCenter(targetC, targetR);
    const fv = unproj(to.x - from.x, to.y - from.y), targetAngle = Math.atan2(fv.y, fv.x);
    let diff = targetAngle - attacker.facingAngle;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    return Math.abs(diff) <= (attacker.arcAngle / 2) + 1e-4;
  }
  
  /* updateVision: layer moved to js/chains/updateVision.js */

  // ---------- 위장: 인접한 적에게만 보임 / 이동 시 해제 ----------
  
  /* updateVision: layer moved to js/chains/updateVision.js */

