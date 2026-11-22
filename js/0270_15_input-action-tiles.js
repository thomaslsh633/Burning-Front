  // ══════════════════════════════════════════════════════════════
  // [15] 입력 · 행동 타일
  //     · updateActionTiles, 길게 누르기 사거리, canPlaceBuilding, pointerdown/move/up/click(★맵 탭 메인)
  // ══════════════════════════════════════════════════════════════


  function updateActionTiles__base(unit) {
    validMoves = [];
    validAttacks = [];


    if (unit.remainingMove > 0) {
      validMoves = calculateReachableHexes(unit);
    }


    if (!unit.hasAttacked && unit.ammo > 0 && suppState(unit) < 2) {
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const dist = getDistance(unit.c, unit.r, c, r);
          const canMain = mainReach(unit, c, r, dist), canSub = subReach(unit, c, r, dist);
          if (!canMain && !canSub) continue;
          if (!visibleHexes.has(`${c},${r}`)) continue;
          const occupant = getUnitAt(c, r), building = getBuildingAt(c, r);
          if (occupant && occupant.team !== unit.team) {
            if (checkElevationCombatRule(unit, occupant).allowed || (canSub && !canMain)) validAttacks.push({ c, r });
          } else if (building && building.team !== unit.team) {
            validAttacks.push({ c, r });
          }
        }
      }
      validAttacks = validAttacks.concat(v212BlindTiles(unit));   // v212: indirect fire into hexes out of sight
    }
  }


  let lpTimer = null, lpStart = null, rangeTiles = null;
  const cancelLP = () => { clearTimeout(lpTimer); lpTimer = null; };
  function startRangeView(u) {
    lpTimer = null; if (ptrs.size !== 1 || u.hp <= 0) return;
    hasDragged = true; isDraggingFacing = false; isPanning = false;
    if (u.team === currentTurn && u.isHeavy && !u.isNebel && u.armorType === 'soft' && !u.isLoaded && !v159Emplaced(u)) { facingUnit = u; isDraggingFacing = true; v185Begin(u); }   // v159: arc turns only while packed
    else if (v131CanTurn(u)) { facingUnit = u; isDraggingFacing = true; window.rotUnit = u; v130RotStart(u); buzz(15); }   // v131: long press turns a vehicle (1 move)
    fillRangeTiles(u);
    render();
  }
  function fillRangeTiles__base(u) {
    rangeTiles = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const d = getDistance(u.c, u.r, c, r);
      if (d >= Math.max(1, u.minRange) && d <= u.range && isInFiringArc(u, c, r)) rangeTiles.push({ c, r });
      else if (d >= 1 && subReach(u, c, r, d)) rangeTiles.push({ c, r, sub: true });
    }
  }
  canvas.addEventListener("contextmenu", e => e.preventDefault());
  // 설치 금지 규칙: 해당 칸에 건물·벙커·참호/샌드백·내 지뢰·거점·설치 금지 지형이 있으면 불가.
  // 티어 건물(tier=true)은 주변 1칸(6방향)에 건물·벙커·구조물·거점·설치 금지 지형이 있어도 불가.
  function placeBlock(c, r, mine) {
    const ter = terrainMap[c + ',' + r], d = TERRAIN_DEFS[(ter && ter.terrainType) || 'plains'] || {};
    if (getBuildingAt(c, r)) return '건물이 있는 칸';   // v151: footprint
    if (bunkers.some(b => b.hp > 0 && b.c === c && b.r === r)) return '벙커가 있는 칸';
    if (ter && ter.fort) return '참호/샌드백이 있는 칸';
    if (mine && mines.some(m => m.c === c && m.r === r && m.team === currentTurn)) return '지뢰가 있는 칸';
    if (getCapturePointAt(c, r)) return '거점';
    if (d.noBuild) return '설치 불가 지형(' + (d.name || '') + ')';
    return '';
  }
  function placeReason(c, r, tier) {
    if ((terrainMap[c + ',' + r] || {}).oob) return '설치할 수 없습니다: 맵 밖';   // v132
    const w = placeBlock(c, r, true);
    if (w) return '설치할 수 없습니다: ' + w;
    if (tier) {
      if (zoneAt(c, r)) return 'Tier buildings cannot be built inside a capture zone';   // v59
      if (sectors.length) { const sc = sectorAt.get(c + ',' + r); if (!sc || sc.hq !== currentTurn) return '티어 건물은 본진 영역 안에만 지을 수 있습니다'; }   // v131
      const n = getHexNeighbors(c, r).find(h => placeBlock(h.c, h.r, false));
      if (n) return '주변 1칸에 ' + placeBlock(n.c, n.r, false) + '이(가) 있어 티어 건물을 설치할 수 없습니다';
    }
    return '';
  }
  function canPlaceBuilding(c, r, tier) { return !placeReason(c, r, tier); }
  canvas.addEventListener("pointerdown", (e) => {
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, z: zoom }; isPanning = false; hasDragged = true; return; }
    if (!e.isPrimary) return;
    dragDist = 0; panStartX = e.clientX; panStartY = e.clientY;
    hasDragged = false; isPanning = true;


    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left, clickY = e.clientY - rect.top;
    const hex = getHexAtPixel(clickX, clickY);


    cancelLP(); lpStart = { x: e.clientX, y: e.clientY };
    const lpU = hex && getUnitAt(hex.c, hex.r);
    if (lpU && (lpU.team === currentTurn || visibleHexes.has(`${lpU.c},${lpU.r}`))) lpTimer = setTimeout(() => startRangeView(lpU), 450);
    if (facingUnit && isAwaitingFacing) {
      if (!facingUnit.isHeavy && nearFacingUnit(e)) { hasDragged = false; isDraggingFacing = true; isPanning = false; return; }
      isAwaitingFacing = false; guideBanner.style.display = "none";
    }
    if (rotHit(e)) { cancelLP(); hasDragged = true; isPanning = false; window.rotUnit = window.rotUnit === selectedUnit ? null : selectedUnit; render(); return; }
    if (rotOn() && rotNear(selectedUnit, e)) { cancelLP(); isDraggingFacing = true; facingUnit = selectedUnit; isPanning = false; v130RotStart(selectedUnit); return; }
  });


  window.addEventListener("pointermove", (e) => {
    if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (lpTimer && lpStart && Math.hypot(e.clientX - lpStart.x, e.clientY - lpStart.y) > 8) cancelLP();
    if (pinch && ptrs.size === 2) {
      const [a, b] = [...ptrs.values()], rc = canvas.getBoundingClientRect();
      setZoom(pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d, (a.x + b.x) / 2 - rc.left, (a.y + b.y) / 2 - rc.top);
      return;
    }
    if (isDraggingFacing && facingUnit) {
      const rect = canvas.getBoundingClientRect();
      const uCenter = getHexCenter(facingUnit.c, facingUnit.r);
      const worldMouseX = (e.clientX - rect.left) / zoom + camX;
      const worldMouseY = (e.clientY - rect.top) / zoom + camY;
      const fv = unproj(worldMouseX - uCenter.x, worldMouseY - uCenter.y);
      if (facingUnit._rot0 !== undefined) v185Drag(facingUnit, Math.atan2(fv.y, fv.x), Math.hypot(fv.x, fv.y)); else facingUnit.facingAngle = v130RotClamp(facingUnit, Math.atan2(fv.y, fv.x)); hasDragged = true;   // v185: vehicles only preview while dragging
      if (rangeTiles && facingUnit.isHeavy) fillRangeTiles(facingUnit);
      render();
      return;
    }


    if (isPanning) {
      const dx = e.clientX - panStartX, dy = e.clientY - panStartY;
      dragDist += Math.hypot(dx, dy);
      if (dragDist > (e.pointerType === "mouse" ? 4 : 10)) hasDragged = true;


      camX -= dx / zoom; camY -= dy / zoom;
      panStartX = e.clientX; panStartY = e.clientY;
      clampCam();
      render();
    }
  });


  window.addEventListener("pointerup", (e) => {
    ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null;
    cancelLP(); if (rangeTiles) { rangeTiles = null; render(); }
    isPanning = false;


    if (isDraggingFacing && facingUnit) {
      isDraggingFacing = false; isAwaitingFacing = false;
      guideBanner.style.display = "none";
      if (facingUnit._rot0 !== undefined) v185Release(facingUnit);   // v185: the drag only proposes a direction
      else if (hasDragged) addLog(facingUnit.isHeavy ? `[화망 고정] ${facingUnit.className} ${Math.round(facingUnit.arcAngle * 180 / Math.PI)}° 사격각 고정 완료` : `[차체 방향] ${facingUnit.className} 방향 확정`, "arc");
      v130RotEnd(facingUnit);
      updateActionTiles(facingUnit);
      updateUnitInfoPanel(facingUnit, getTerrain(facingUnit.c, facingUnit.r));
      render();
    }
  });


  canvas.addEventListener("click", (e) => {
    if (hasDragged) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left, clickY = e.clientY - rect.top;
    let hex = getHexAtPixel(clickX, clickY);
    if (!hex) return;
    if (!actionMode && typeof v151Anchor === 'function') hex = v151Anchor(hex);   // v151: any footprint hex = the building
    if (V185.pend) { const P = V185.pend; if (P.kind && hex.c === P.c && hex.r === P.r) return; if (!P.kind && hex.c === P.c && hex.r === P.r) { v185Confirm(); return; } V185.pend = null; { const su = selectedUnit; if (su) updateUnitInfoPanel(su, getTerrain(su.c, su.r)); } render(); }   // v188: a pending turn is confirmed with the panel button; a tap anywhere else cancels it   // v185: second tap on the unit confirms the turn, anything else cancels it


    const targetUnit = getUnitAt(hex.c, hex.r);
    const targetBuilding = getBuildingAt(hex.c, hex.r);
    const targetTerrain = getTerrain(hex.c, hex.r);
    const targetPoint = getCapturePointAt(hex.c, hex.r);


    if (actionMode === 'deploy_unit' && pendingDeployKey) {
      const prodBuildings = buildings.filter(b => b.team === currentTurn && b.hp > 0 && canProd(b, pendingDeployKey));
      const isNearProd = prodBuildings.some(pb => typeof v153NearProd === 'function' ? v153NearProd(pb, hex.c, hex.r) : getDistance(pb.c, pb.r, hex.c, hex.r) === 1);   // v153: around the whole footprint
      const uData = UNIT_ROSTER[currentTurn][pendingDeployKey];


      if (!isNearProd) { actionMode = null; pendingDeployKey = null; guideBanner.style.display = "none"; render(); return; }
      if (targetUnit || targetBuilding) { toast("빈 타일을 선택해야 합니다!"); return; }
      if (getTileMovementCost({ armorType: uData.armorType }, hex.c, hex.r, hex.c, hex.r) === Infinity) {
        toast("해당 지형에는 배치할 수 없습니다!"); return;
      }


      gold[currentTurn] -= uData.cost; fuel[currentTurn] -= uData.fcost;
      const newUnit = createUnitFromKey(nextUnitId++, currentTurn, pendingDeployKey, hex.c, hex.r);
      units.push(newUnit);
      { const pbs = prodBuildings.filter(pb => typeof v153NearProd === 'function' ? v153NearProd(pb, hex.c, hex.r) : getDistance(pb.c, pb.r, hex.c, hex.r) === 1);   // v181: walk out of the production building
        let src = null, sd = 1e9; pbs.forEach(pb => (typeof v151Cells === 'function' ? v151Cells(pb) : [[pb.c, pb.r]]).forEach(([c, r]) => { const d = getDistance(c, r, hex.c, hex.r); if (d < sd) { sd = d; src = { c, r }; } }));
        if (src) setTimeout(() => v181Walk(newUnit, src, { keep: true, emerge: true }), 0); }

      addLog(`[전진 배치] ${newUnit.className} (${newUnit.uniqueName}) 배치 완료!`);
      actionMode = null; pendingDeployKey = null;
      guideBanner.style.display = "none";


      updateGoldUI(); updateVision();
      selectedUnit = newUnit;
      updateActionTiles(newUnit);
      updateUnitInfoPanel(newUnit, targetTerrain);
      render();
      return;
    }


    if (actionMode && activeActor && handleSpecialTap(hex, targetUnit, targetBuilding)) return;


    if (actionMode && activeActor) {
      const dist = getDistance(activeActor.c, activeActor.r, hex.c, hex.r);
      if (dist !== 1 && !(typeof v153BuildDistOk === 'function' && v153BuildDistOk(dist))) { toast("반드시 인접한 1칸을 선택해야 합니다!"); return; }   // v153: multi-hex sites sit on the 2nd ring


      if (actionMode === 'give_supply') {
        if (!targetUnit || targetUnit.team !== activeActor.team) {
          toast("보급품을 받을 인접 아군 유닛을 탭하세요!"); return;
        }
        if (activeActor.supplies < 1) {
          toast("보급품이 부족합니다!");
          actionMode = null; guideBanner.style.display = "none"; render(); return;
        }


        activeActor.supplies -= 1; activeActor.supplies += vetSave(activeActor, 'sup', vetV(activeActor).ammoSave); const eff = vetV(activeActor).effic;
        if (targetUnit.armorType === 'soft') {
          targetUnit.hp = Math.min(targetUnit.maxHp, targetUnit.hp + Math.round(25 * eff));
          targetUnit.ammo = targetUnit.maxAmmo;
          addLog(`📦 [보급 완료] ${activeActor.className} ➔ ${targetUnit.className} 탄약 완충 & 회복`, "supply");
        } else {
          targetUnit.hp = Math.min(targetUnit.maxHp, targetUnit.hp + Math.round(20 * eff));
          targetUnit.ammo = Math.min(targetUnit.maxAmmo, targetUnit.ammo + Math.round(2 * eff));
          if (targetUnit.hasFuel) targetUnit.fuel = Math.min(targetUnit.maxFuel, targetUnit.fuel + Math.round(10 * eff));
          addLog(`📦 [보급 완료] ${activeActor.className} ➔ ${targetUnit.className} 차량 보급`, "supply");
        }


        actionMode = null; guideBanner.style.display = "none";
        updateUnitInfoPanel(activeActor, getTerrain(activeActor.c, activeActor.r));
        render();
        return;
      }


      if (actionMode === 'dismount') {
        if (targetUnit || targetBuilding) { toast("빈 타일을 선택해야 하차할 수 있습니다!"); return; }
        if (getTileMovementCost(activeActor.cargo[activeActor.cargo.length - 1] || { armorType: 'soft' }, activeActor.c, activeActor.r, hex.c, hex.r) === Infinity) {
          toast("진입할 수 없는 지형입니다!"); return;
        }


        const u = activeActor.cargo.pop(), _from = { c: activeActor.c, r: activeActor.r }, _fa = u.facingAngle;   // v181: walk out of the vehicle
        u.isLoaded = false; u.c = hex.c; u.r = hex.r; u.remainingMove = 0; setTimeout(() => v181Walk(u, _from, { fa0: _fa, emerge: true }), 0);
        if (u.hw) { u.hasMoved = true; u.hasAttacked = true; }   // v139: a heavy weapon needs this turn to set up
        if (v159Crew(u)) v159SetEmpl(u, false);   // v159: unloads packed
        addLog(`🚪 [지정 하차] ${u.className} 하차 완료${u.hw ? ' — 거치 해제 상태 (거치해야 사격 가능)' : ''}`, "supply");
        actionMode = null; guideBanner.style.display = "none";
        updateUnitInfoPanel(activeActor, getTerrain(activeActor.c, activeActor.r));
        render();
        return;
      }


      if (actionMode.startsWith('build_')) {
        if (targetUnit || targetBuilding) { toast("빈 타일에 설치해야 합니다!"); return; }
        const bt = actionMode.slice(6), B = BLD[bt] && bd(bt, activeActor.team), def = B || FORT[bt], tm = activeActor.team, ter = getTerrain(hex.c, hex.r);
        const dsc = 1 - vetV(activeActor).buildDisc, g = Math.round(def.g * (research[tm].cheap ? .85 : 1) * dsc), f = Math.round((def.f || 0) * dsc), cost = { g, f };
        if (TERRAIN_DEFS[ter.terrainType].inf === Infinity) { toast("건설할 수 없는 지형입니다!"); return; }
        if (B && B.doc && (doctrine[tm] && doctrine[tm] !== B.doc || buildings.some(b => b.team === tm && b.type === bt && b.hp > 0))) { toast('교리 지원소는 팀당 1개만 건설할 수 있습니다.'); actionMode = null; activeActor = null; guideBanner.style.display = "none"; render(); return; }
        { const why = placeReason(hex.c, hex.r, !!B); if (why) { toast(why); return; } }
        { const why = typeof v151PlaceCheck === 'function' ? v151PlaceCheck(bt, hex, activeActor) : ''; if (why) { toast(why); return; } }   // v151: ring 2 for multi-hex, never the engineer's hex
        if (gold[tm] < g || fuel[tm] < f) { toast(`자원 부족 (💰${g} ⛽${f})`); actionMode = null; activeActor = null; guideBanner.style.display = "none"; render(); return; }
        gold[tm] -= g; fuel[tm] -= f;
        
        if (bt === 'trench') {
          const o = { ...ter };
          setTerrain(hex.c, hex.r, 'trench', ter.elevation, 'hard', '방호 참호', '☲', 24);
          terrainMap[`${hex.c},${hex.r}`].fort = { team: tm, cost, orig: o };
        } else if (bt === 'sandbag') {
          const o = { ...ter };
          setTerrain(hex.c, hex.r, ter.terrainType, ter.elevation, 'hard', '샌드백 진지', '☲', 24);
          terrainMap[`${hex.c},${hex.r}`].fort = { team: tm, cost, orig: o };
        } else if (bt === 'mine') {
          mines.push({ c: hex.c, r: hex.r, team: tm, cost, dmgMul: vetV(activeActor).mineDmg });
        } else if (bt === 'mg_bunker' || bt === 'medic_bunker') {
          bunkers.push({ id: nextUnitId++, c: hex.c, r: hex.r, team: tm, type: bt === 'mg_bunker' ? 'mg' : 'medic', hp: 145, maxHp: 145, cost });
        } else if (FORT[bt] && FORT[bt].empl) {
          v134PlaceEmpl(bt, tm, hex, cost);   // v134: emplacement = static weapon unit
        } else {
          buildings.push({ id: 'b' + nextUnitId, type: bt, team: tm, className: B.n, name: B.n + ' #' + nextUnitId++, c: hex.c, r: hex.r, hp: Math.round(B.hp * .5), maxHp: B.hp, armor: B.armor, sight: 4, cost, uc: { left: B.tier >= 2 ? 2 : 1, eng: activeActor.id } });   // v140: construction site
          if (typeof v151AfterPlace === 'function') v151AfterPlace(buildings[buildings.length - 1]);   // v151: footprint
          activeActor.hasMoved = true; activeActor.hasAttacked = true; activeActor.remainingMove = 0;
          if (B.doc && !doctrine[tm]) { doctrine[tm] = B.doc; syncCP(tm); units.filter(u => u.team === tm && u.hp > 0).forEach(applyDoctrine); addLog(`🎖 [교리 확정] ${DOC[B.doc].n[tm]} — ${DOC[B.doc].d}`, 'bounty'); }
        }
        
        addVeterancyExp(activeActor, 2);
        addLog(`🔨 [공병 건설] ${def.n} ${B && !FORT[bt] ? '착공 — ' + (B.tier >= 2 ? 2 : 1) + '턴 뒤 완공 (공병이 옆에 있어야 진행)' : '완공'} (-${g}G${f ? ' -' + f + 'F' : ''})`, "eng");
        actionMode = null; guideBanner.style.display = "none"; updateGoldUI();
        updateUnitInfoPanel(activeActor, getTerrain(activeActor.c, activeActor.r));
        updateVision(); render(); return;
      }
    }


    if (selectedUnit) {
      let moveChoice = validMoves.find(m => m.c === hex.c && m.r === hex.r), v173P = null;
      if (moveChoice && V175.on && !v175Confirm(selectedUnit, moveChoice)) return;   // v175: first tap only previews the route, the second tap on the same hex moves
      if (moveChoice && typeof v173Plan === 'function') { v173P = v173Plan(selectedUnit, moveChoice); moveChoice = v173P.mc; hex = { c: moveChoice.c, r: moveChoice.r }; }   // v173: path + stop on first sighting
      if (moveChoice) {
        clearAttackPreview();
        const moveCostSpent = moveChoice.cost;
        if (!selectedUnit.isHeavy && !moveChoice.rev) faceToward(selectedUnit, hex.c, hex.r);   // v130: a reverse keeps the facing
        selectedUnit.c = hex.c; selectedUnit.r = hex.r;
        selectedUnit.remainingMove = Math.max(0, selectedUnit.remainingMove - moveCostSpent);
        if (selectedUnit.hasFuel && !selectedUnit.noFuel) selectedUnit.fuel = Math.max(0, selectedUnit.fuel - Math.max(0, moveCostSpent - vetSave(selectedUnit, 'fuel', moveCostSpent * (1 - vetV(selectedUnit).fuelUse))));
        selectedUnit.hasMoved = true;
        if (v173P && v173P.path) v173Begin(selectedUnit, v173P);   // v173: path animation (facing = last leg)


        addLog(`[기동] ${selectedUnit.className} ${moveChoice.rev ? '후진' : '이동'} (소모: ${moveCostSpent}, 잔여: ${selectedUnit.remainingMove})`, "move");


        const mineIdx = mines.findIndex(m => m.c === hex.c && m.r === hex.r && m.team !== selectedUnit.team);
        if (mineIdx !== -1) {
          const mineMul = (mines[mineIdx] && mines[mineIdx].dmgMul) || 1; mines.splice(mineIdx, 1);
          const dmg = Math.max(1, Math.round(mineMul * (selectedUnit.armorType === 'hard' ? Math.max(1, Math.round(selectedUnit.maxHp * 0.35)) : modelHit(selectedUnit, 2))));
          selectedUnit.hp -= dmg;
          if (selectedUnit.armorType === 'hard' && Math.random() < 0.4) { selectedUnit.trackDamaged = true; addLog(`⛓ [궤도 손상] ${selectedUnit.className}`, "crit"); }
          addLog(`[지뢰 폭발!] ${selectedUnit.className} [-${dmg} HP]`, "crit");
          if (selectedUnit.hp <= 0) { selectedUnit.hp = 0; checkVictory(); }
        }
        if (selectedUnit.hp > 0) v159WatchFire(selectedUnit);   // v159: enemy heavy weapons on watch fire at the arrival hex


        // v59: no step-on capture anymore. Points flip at the owner's next turn start (captureTick, section [17c]).
        zoneMoveHint(selectedUnit);


        guideBanner.style.display = "none";


        updateVision();
        updateActionTiles(selectedUnit);
        updateUnitInfoPanel(selectedUnit, getTerrain(selectedUnit.c, selectedUnit.r));
        render();
        return;
      }


      if (v212BlindTap(hex)) return;   // v212: blind barrage (checked first so a hidden unit is never previewed)
      if (typeof v147StructTap === 'function' && v147StructTap(hex)) return;   // v147: firing at an empty building
      if (validAttacks.some(a => a.c === hex.c && a.r === hex.r)) {
        if (pendingAttackTarget && pendingAttackTarget.c === hex.c && pendingAttackTarget.r === hex.r) {
          clearAttackPreview();
          if (targetUnit) executeCombat(selectedUnit, targetUnit);
          else if (targetBuilding) {
            const _fx = v186Begin(selectedUnit, targetBuilding.c, targetBuilding.r, false);   // v186: turn first, then shot + explosion
            selectedUnit.ammo -= 1;
            const res = calcDamage(selectedUnit, targetBuilding);
            targetBuilding.hp = Math.max(0, targetBuilding.hp - res.damage);
            selectedUnit.hasAttacked = true; v158Engage(selectedUnit);
            addVeterancyExp(selectedUnit, 2, 'atk');
            addLog(`[건물 포격] ${selectedUnit.className} ➔ ${targetBuilding.name} [-${res.damage} HP]`, "crit");
            if (targetBuilding.hp === 0) {
              addLog(`💥 [건물 파괴] ${targetBuilding.name} 완파!`, "crit");
              addVeterancyExp(selectedUnit, 8);
              checkVictory();
            }
            v186End(_fx, res.damage, targetBuilding.hp === 0);   // v186
          }


          if (selectedUnit.hp > 0) {
            updateActionTiles(selectedUnit);
            updateUnitInfoPanel(selectedUnit, getTerrain(selectedUnit.c, selectedUnit.r));
          } else {
            selectedUnit = null; validMoves = []; validAttacks = [];
            updateUnitInfoPanel(null, null);
          }
          render();
          return;
        }


        showAttackPreview(selectedUnit, targetUnit || targetBuilding, hex.c, hex.r);
        render();
        return;
      }
    }


    clearAttackPreview();
    guideBanner.style.display = "none";
    isAwaitingFacing = false;


    if (selectedUnit && (selectedUnit.armorType === 'soft') && targetUnit && targetUnit.cargoCap > 0 && targetUnit !== selectedUnit && targetUnit.team === currentTurn && getDistance(selectedUnit.c, selectedUnit.r, targetUnit.c, targetUnit.r) === 1) {
      boardUnit(selectedUnit, targetUnit);
      selectedUnit = null; validMoves = []; validAttacks = [];
      return;
    }


    selBld = (!targetUnit && targetBuilding) ? targetBuilding : null;
    if (targetUnit && targetUnit.team === currentTurn) {
      selectedUnit = targetUnit;
      updateActionTiles(selectedUnit);
      updateUnitInfoPanel(selectedUnit, targetTerrain);
    } else if (targetUnit || targetBuilding) {
      selectedUnit = null; validMoves = []; validAttacks = [];
      updateUnitInfoPanel(targetUnit || targetBuilding, targetTerrain);
    } else {
      selectedUnit = null; validMoves = []; validAttacks = [];
      showTileInfo(hex.c, hex.r, targetTerrain, targetPoint);
    }
    render();
  });

