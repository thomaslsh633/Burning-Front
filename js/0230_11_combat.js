  // ══════════════════════════════════════════════════════════════
  // [11] 전투
  //     · 제압/피격각/calcDamage(★피해 공식)/applyHitEffects, 주무장 프로필(WPN3)·탄종·버프, executeCombat, 킬 보상, MG 오버워치, 숙련도, 탑승
  // ══════════════════════════════════════════════════════════════



  function checkElevationCombatRule__base(att, def) {
    const attElev = getTerrain(att.c, att.r).elevation;
    const defElev = getTerrain(def.c, def.r).elevation;
    const elevDiff = defElev - attElev;


    if (elevDiff >= 2) {
      if (att.isMortar || att.isArtillery || att.isNebel) return { allowed: true, note: " [곡사 포격]" };
      return { allowed: false, reason: "고저차 2단계 이상: 저지대에서 고지대 직사 불가!" };
    }
    if (attElev - defElev >= 2) return { allowed: true, note: " [고지대 우위 포격]" };
    return { allowed: true, note: "" };
  }
  // v144: direct fire needs the shooter's own sight line (indirect fire only needs team vision)
  
  /* checkElevationCombatRule: layer moved to js/chains/checkElevationCombatRule.js */


  // ==========================================
  // 전투 및 데미지 계산 (Yellow 커버: 계수 0.8배, 피해 20% 감소)
  // ==========================================
  // [TACTICS-V5 BEGIN] 제압/고착 · 방호각 · 마스터 피해 파이프라인
  const SUPP_MAX = 100, SUPP_RECOVER = 35, AA_SUPPRESS_KEYS = ['m16', 'wirbelwind', 'flak', 'flak38', 'flak36'];

  // 0 = 정상(0~49) / 1 = 제압(50~99) / 2 = 고착(100). 보병·비장갑(soft) 한정
  function suppState(u) {
    if (!u || u.armorType !== 'soft') return 0;
    const v = u.suppression || 0;
    return v >= SUPP_MAX ? 2 : (v >= 50 ? 1 : 0);
  }
  const isCrew = u => !!u && u.armorType === 'soft' && !!(u.isHeavy || u.isMortar || u.isArtillery || u.isNebel);
  function isGarrisoned(u) {
    if (!u || u.isLoaded) return false;
    const t = getTerrain(u.c, u.r) || {};
    return t.terrainType === 'building' || bunkers.some(b => b.team === u.team && b.c === u.c && b.r === u.r && b.hp > 0);
  }
  function suppTerrainMul(def, att) {
    if (!def || def.armorType !== 'soft') return 1;
    if (isGarrisoned(def)) return 0;
    if (att && (att.isMortar || att.isArtillery || att.isNebel)) return 1;
    const cv = coverVs(def, att);   // v145
    return cv === 'hard' ? 0.3 : cv === 'yellow' ? 0.5 : 1;
  }
  

  // 화기별 1회 사격(폭격)당 제압치
  function suppressionOf__base(att) {
    if (att.isHmg) return att.suppBase || 50;
    if (AA_SUPPRESS_KEYS.includes(att.key)) return 35;
    if (att.isMortar || att.isArtillery || att.isNebel) return 25;
    return 0;
  }

  // 제압 상태에 따른 이동력 상한 (제압 -50%, 고착 0). 이미 쓴 이동력은 차감해서 계산
  function capSuppressedMove(u) {
    const s = suppState(u);
    if (s === 2) u.remainingMove = 0;
    else if (s === 1) {
      const spent = u.moveDist - u.remainingMove;
      u.remainingMove = Math.max(0, Math.min(u.remainingMove, Math.floor(u.moveDist * 0.5) - spent));
    }
  }

  function addSuppression__base(u, amt) {
    if (!u || u.hp <= 0 || u.armorType !== 'soft' || !(amt > 0)) return;
    if (isGarrisoned(u)) return;
    const before = suppState(u);
    u.suppression = Math.min(SUPP_MAX, (u.suppression || 0) + amt);
    const after = suppState(u);
    if (after >= 1) u.counterAttacksLeft = 0;
    if (after > before) {
      capSuppressedMove(u);
      if (after === 2) addLog(`📌 [고착] ${u.className} — 이동·공격 불가 / 받는 피해 -20% / 시야 -1`, "crit");
      else addLog(`⚠️ [제압] ${u.className} — 이동 -50% / 명중 -30% / 반격 불가`, "counter");
    }
  }

  // 공격자 ➔ 방어 차량의 피격 각도(차체 기준) 3분할: 전면 ≤45° / 측면 ≤135° / 후면 >135°
  function getHitZone(att, def) {
    if (def.facingAngle === undefined || def.armorType !== 'hard') return { zone: 'front', mod: 1.0, deg: 0 };
    const from = getHexCenter(def.c, def.r), to = getHexCenter(att.c, att.r);
    const fv = unproj(to.x - from.x, to.y - from.y);
    let diff = Math.atan2(fv.y, fv.x) - def.facingAngle;
    diff = Math.abs(Math.atan2(Math.sin(diff), Math.cos(diff)));
    const deg = diff * 180 / Math.PI;
    if (deg <= 45) return { zone: 'front', mod: 1.0, deg };
    if (deg <= 135) return { zone: 'side', mod: 0.7, deg };
    return { zone: 'rear', mod: 0.4, deg };
  }
  // v40: per-unit front/side/rear armor (armorS/armorR). Falls back to legacy ×0.7 / ×0.4 when a unit has no split values.
  function zoneArmor(def, zone) {
    if (zone === 'side') return def.armorS !== undefined ? def.armorS : (def.armor || 0) * 0.7;
    if (zone === 'rear') return def.armorR !== undefined ? def.armorR : (def.armor || 0) * 0.4;
    return def.armor || 0;
  }
  const ZONE_LABEL = { front: '전면', side: '측면', rear: '후면 약점' };
  // v127: one penetration scale for every weapon (CoH3 raw x 0.12), so pen / effective armor is the penetration chance.
  //       Below PEN_CUTOFF a shot cannot penetrate; weapons without deflection damage then do nothing ("도탄!").
  const K_PEN_UNIT = 1.0, K_PEN_BLD = 1.0, PEN_CUTOFF = 0.08;
  const COVER_SOFT_YELLOW = 0.5, COVER_SOFT_HARD = 0.25, COVER_FLAME_HARD = 1.25;
  const rnd2 = x => Math.round(x * 100) / 100;
  const penScale = (p, m) => Array.isArray(p) ? p.map(v => rnd2(v * m)) : rnd2(p * m);
  // v161: one attack value for every target. A weapon is atk (damage per hit / per penetrating hit), pen and area —
  //   area = how many squad members one hit reaches (HE 2–3; AP below 1: a solid shot rarely finds a man in a spread squad)
  //   vs squads: max(2, atk × area − 2 × body armour) (tank main guns still at most 3 members per shot)
  //   vs vehicles: penetration roll, atk on a penetration, atk × deflect share otherwise;
  //   small arms do 35 % to armoured vehicles (armour 1+), full damage to soft-skinned trucks / jeeps
  //   vs structures: atk × factor (small arms 0.1, heavy MG 0.3, guns 0.5, autocannons 0.3, indirect 1.5, flame 3.5)
  //   small arms = pen below 1.5 and area 1 or less (rifles, SMGs, MGs) — mortars and other HE have area above 1
  var V161 = { saVeh: .35 };
  const v161PenMax = p => Array.isArray(p) ? Math.max(0, ...p) : (+p || 0);
  function v161Small(w) { return v161PenMax(w && w.pen) < 1.5 && !(w && w.area > 1); }
  function v161Wpn(w, fx) {
    let atk = (w && w.atk) || 0, area = w && w.area !== undefined ? w.area : 1;
    const pmax = v161PenMax(w && w.pen), small = pmax < 1.5 && area <= 1;
    if (fx) { atk *= fx.atk; if (small) atk *= fx.area; else area *= fx.area; }
    return { atk, area, small, pmax };
  }
  // skill shell figures (P, A, dmgA) -> attack / area / pen; a unit profile may be passed as P
  function v161Shell(P, A, dmgA) {
    if (P && typeof P === 'object') return { atk: P.atk || 0, area: rnd2((P.area !== undefined ? P.area : 1) * ART_P_K), pen: v161PenMax(P.pen) };
    const pen = (A || 0) * ART_A_K, p = (P || 0) * ART_P_K;
    let atk = dmgA !== undefined ? dmgA : (A || 0) * ART_DMGA_K;
    if (!(atk > 0)) return { atk: p, area: p > 0 ? 1 : 0, pen };
    return { atk, pen, area: rnd2(p / atk) };
  }
  const areaTxt = u => u && u.persons > 0 ? u.persons + '명' + (u.lob ? ' 곡사' : '') : u && u.raw ? (u.aoe > 0 && u.rawW ? '파편 ' + u.rawW.aoeR + 'm' : '단일') : (Math.round((u && u.area !== undefined ? u.area : 1) * 100) / 100) + '명';
  // v162: raw CoH3 values for stat screens
  const atkTxt = u => u.raw ? String(+(u.atk / RAW.HPK).toFixed(1)) : String(+(+u.atk).toFixed(1));
  const hpTxt = u => u.rawD && u.rawD.N ? u.rawD.N + '×' + u.rawD.hp : (u.rawD && u.rawD.hp ? String(u.rawD.hp) : String(u.maxHp));
  const armTxt = u => u.rawD && u.rawD.arm ? u.rawD.arm.join('/') : (u.armorS !== undefined ? u.armor + '/' + u.armorS + '/' + u.armorR : String(u.armor));
  const rofTxt = u => u.rofB ? u.rofB.map(x => String(Math.max(1, (!(u.N > 1 && !u.crewed) && x < 3) ? Math.floor(x + 1e-9) : Math.round(x)))).join('/') + '발' : '×' + (+(u.rof || 1)).toFixed(1).replace(/\.0$/, '');   // v166: whole-shot rate; the decimal part is folded into attack power
  const rngTxt = u => u.raw ? (u.closeEnd >= u.range && u.midEnd >= u.range ? u.range + '칸 (전 구간 동일)' : [u.closeEnd, u.midEnd, u.range].join('/') + '칸') : String(u.range);
  const penFlat = (p, d) => Array.isArray(p) ? p.map(v => Math.max(0, rnd2(v + d))) : Math.max(0, rnd2(p + d));
  const penFmt = v => { v = +v; return String(v < 1 ? +v.toFixed(2) : +v.toFixed(1)); };
  const penTxt = u => { let p = u.pen !== undefined ? u.pen : 0; if (u.raw) p = Array.isArray(p) ? p.map(v => v / RAW.PENK) : p / RAW.PENK; return Array.isArray(p) ? p.map(penFmt).join('/') : penFmt(p); };
  function addPenBonus(u, flat) { if (u.pen !== undefined) u.pen = penFlat(u.pen, flat); }
  // penetration for the distance band (near / mid / far); band edges scale with the weapon's range
  function penAtDist(wpn, dist) {
    const p = wpn.pen !== undefined ? wpn.pen : 0;
    if (Array.isArray(p)) {
      const R = wpn.range || 6;
      const cEnd = wpn.closeEnd || bandEnds(R)[0];   // v130 bands
      const mEnd = wpn.midEnd || bandEnds(R)[1];
      return dist <= cEnd ? p[0] : (dist <= mEnd ? p[1] : p[2]);
    }
    return wpn.penDrop ? Math.max(0.05, p * Math.max(0.2, 1 - Math.max(0, dist - 1) * wpn.penDrop)) : p;
  }
  // firing arc of a weapon with its own traverse (360 = turret / pintle mount)
  function isInArcDeg(att, deg, c, r) {
    if (deg >= 360) return true;
    const from = getHexCenter(att.c, att.r), to = getHexCenter(c, r), fv = unproj(to.x - from.x, to.y - from.y);
    let diff = Math.atan2(fv.y, fv.x) - att.facingAngle;
    diff = Math.abs(Math.atan2(Math.sin(diff), Math.cos(diff)));
    return diff <= (deg * Math.PI / 360) + 1e-4;
  }
  function accByZone(att, dist, optics) {
    const R = att.range || 6, be = bandEnds(R), midMax = att.midEnd || be[1];   // v130 bands
    const i = dist <= (att.closeEnd || be[0]) ? 0 : (dist <= midMax ? 1 : 2);
    let v = att.acc[i]; if (optics && i > 0) v = Math.min(1, v + 0.05);
    return Math.max(0.05, v);
  }
  const accTxt = u => u.raw && u.acc ? u.acc.map(a => Math.round(a * 100)).join('/') + '%' : u.acc ? Math.round(u.acc[0] * 100) + '/' + Math.round(u.acc[1] * 100) + '/' + Math.round(u.acc[2] * 100) + '%' : '-' + Math.round((u.accDrop || 0.05) * 100) + '%/칸';
  const shiftAcc = (u, d) => { if (u.acc) { u.acc[1] = Math.max(0.05, Math.min(1, u.acc[1] - d)); u.acc[2] = Math.max(0.05, Math.min(1, u.acc[2] - 2 * d)); } };
  const bandIdx = (d, R = 6) => d <= bandEnds(R)[0] ? 0 : (d <= bandEnds(R)[1] ? 1 : 2);

  // One weapon's attack (main gun or secondary). Rapid-fire weapons roll hit then penetration per shot;
  // single-shot guns keep expected accuracy and roll only penetration, to keep turn-based RNG readable.
  
  function calcOneWeapon(att, wpn, def, preview, isSub, fx) {
    const isDefSoft = (def.armorType === 'soft');
    const isIndirect = !isSub && !!(att.isMortar || att.isArtillery || att.isNebel);
    const isMainGun = !isSub && wpn === att;          // false for a swapped-in launcher profile
    const persMode = isDefSoft && isMainGun && !isIndirect && !!wpn.raw && wpn.persons > 0;   // v199: persons model for tank main guns vs soft targets
    const canCrit = !isSub || !!wpn.at;               // launchers on the secondary slot may still break tracks
    const notes = [];
    const ter = Object.assign({}, getTerrain(def.c, def.r), { cover: coverVs(def, att) });   // v145: directional cover (cell objects + entry edge)
    const vA = vetV(att), vD = vetV(def);
    const dist = getDistance(att.c, att.r, def.c, def.r);

    const rawB = dist <= (wpn.closeEnd || 0) ? 0 : (dist <= (wpn.midEnd || 0) ? 1 : 2);   // v162: CoH3 near / mid / far band
    let rof = wpn.rofB ? wpn.rofB[rawB] * vA.rof : Math.max(1, (wpn.rof || 1) * vA.rof);   // v164: raw rates are exact (whole shots are taken below)
    if (!isSub && fx && fx.rof) rof = Math.max(1, rof * fx.rof);
    if (isSub && att.buff && att.buff.contfire === 1 && att.team === currentTurn && isDefSoft && !def.type) {
      rof *= 1.5; notes.push(' [계속 사격 기총 연사 ×1.5]');
    }

    // accuracy: distance band, veterancy, suppression, buffs, passives
    const optics = !!(research[att.team] && research[att.team].optics);
    const accDrop = Math.max(0, (wpn.accDrop || att.accDrop || 0.05) - (optics ? 0.03 : 0));
    let accuracy = wpn.acc ? accByZone(wpn, dist, optics) : Math.max(0.15, 1.0 - (Math.max(0, dist - 1) * accDrop));
    if (wpn.raw) {   // v162: CoH3 hit chance = weapon accuracy x target size (infantry ~1, vehicles ~20, buildings 26)
      const ts = def.tsize || (def.type ? 26 : (def.armorType === 'hard' ? 20 : 1));
      accuracy = Math.min(1, (persMode ? V199.ACC[rawB] : wpn.acc[rawB]) * ts + (optics && rawB > 0 ? 0.05 : 0));
    }
    {
      const _R = wpn.range || 6, _mid = wpn.midEnd || bandEnds(_R)[1], far = wpn.acc ? dist > _mid : dist >= 4;
      const m = vA.acc * (far ? vA.accFar : 1) * (vetU(att) ? 1 : 1 + VET_ACC_ALL * Math.min(3, att.rank || 0));   // v142: common accuracy per star (not for CoH3-table units)
      if (m !== 1) { const b0 = accuracy; accuracy = Math.min(1, accuracy * m); if (accuracy > b0 && !isSub) notes.push(` [★ 명중 +${Math.round((accuracy / b0 - 1) * 100)}%]`); }
    }
    if (!isSub && typeof TGL !== 'undefined' && att.tgl && att.tgl.sitegun) accuracy = Math.min(1, accuracy + 0.05);
    if (suppState(att) === 1) { accuracy *= 0.7; if (!isSub) notes.push(' [제압: 명중 -30%]'); }
    if (!isSub && att.buff && att.buff.volley > 0) { accuracy = Math.min(1, accuracy + 0.2); notes.push(' [일제사격 명중+20%]'); }
    if (isDefSoft && def.N > 1 && def.models < def.N) { const k140 = 1 - V140.sqAcc * (def.N - Math.max(1, def.models)) / (def.N - 1); accuracy *= k140; if (!isSub) notes.push(` [분대 ${def.models}/${def.N} 피격 명중 −${Math.round((1 - k140) * 100)}%]`); }   // v140
    if (def.buff && def.buff.retreat > 0) { accuracy *= V140.retAcc; if (!isSub) notes.push(' [퇴각 중 피격 명중 −50%]'); }   // v140
    if (!isIndirect && LAYERS.sight && LAYERS.obscure < 1 && sightLine(att.c, att.r, def.c, def.r, eyeOf(att)).obscured) { accuracy *= LAYERS.obscure; if (!isSub) notes.push(` [가림 피격 명중 −${Math.round((1 - LAYERS.obscure) * 100)}%]`); }   // v144
    if (isDefSoft && vD.recv !== 1) { accuracy *= vD.recv; if (!isSub) notes.push(` [★ 피격 명중 −${Math.round((1 - vD.recv) * 100)}%]`); }
    if (typeof PAS !== 'undefined' && att.key) {
      const R0 = UNIT_ROSTER[att.team] && UNIT_ROSTER[att.team][att.key];
      if (!isSub && hasPas(att, 'takeaim') && !att.hasMoved) { accuracy += PAS.takeaim.acc; notes.push(' [Take Aim 명중 +5%p]'); }
      if (R0 && R0.cat === 'infantry') {
        const near = (id, d) => units.some(c => c.team === att.team && c.hp > 0 && !c.isLoaded && c !== att && getDistance(c.c, c.r, att.c, att.r) <= d && (id === 'lead' ? hasPas(c, 'lead') : c.pkg2 === id));
        if (hasPas(att, 'lead') || near('lead', 3)) { accuracy += PAS.lead.acc; if (!isSub) notes.push(' [지휘 명중 +10%p]'); }
        else if (near('cmdr', 1)) { accuracy += 0.10; if (!isSub) notes.push(' [전차장 지원 명중 +10%p]'); }
      }
      if (!isSub && MF_PEN && att.hasMoved && att.armorType === 'hard' && !hasPas(att, 'stab') && R0 && R0.tab === 'armor' && !att.isAntiAir) { accuracy -= MF_PEN; notes.push(` [이동 후 사격 −${Math.round(MF_PEN * 100)}%p]`); }
    }
    if (def.repairing && att.team !== def.team) { accuracy = Math.min(1, accuracy * V158.repAcc); if (!isSub) notes.push(' [수리 중 피격 명중 +100%]'); }   // v158
    accuracy = Math.max(0.05, Math.min(1.0, accuracy));

    // cover x elevation
    let coverFactor = 1.0;
    const isSniperMain = isMainGun && !!att.isSniper && isDefSoft && def.N > 0;
    const isTankMain = isMainGun && att.armorType === 'hard' && isDefSoft && !isIndirect;
    if (def.armorType === 'hard' && !def.empl && !(def.type && BLD[def.type])) { /* v140: vehicles and tanks take no terrain cover */ }
    else if (ter.cover === 'yellow') coverFactor = isSniperMain ? 0.75 : (isTankMain ? 0.70 : (isDefSoft ? COVER_SOFT_YELLOW : 0.8));
    else if (ter.cover === 'hard') coverFactor = isSniperMain ? 0.50 : (isTankMain ? 0.45 : (isDefSoft ? COVER_SOFT_HARD : 0.5));
    let flameBonus = 0;
    if ((!isSub && (att.isFlamer || att.ignoreCover || (fx && fx.noCover))) || wpn.noCover) {
      coverFactor = 1.0;
      if (ter.cover === 'hard') {
        if (att.isFlamer) { coverFactor = vA.flameHard || COVER_FLAME_HARD; notes.push(` [참호/가옥 소탕 ×${coverFactor}]`); }
        else { flameBonus = 24; notes.push(' [참호/가옥 소탕 +24]'); }
      } else notes.push(' [엄폐무시 화염]');
    } else if (isIndirect) {
      coverFactor = 1.0; notes.push(' [곡사 엄폐무시]');
    }
    if (isDefSoft && suppState(def) === 2 && !isSniperMain) {
      if (att.isFlamer || isIndirect) notes.push(' [고착 노출: 포복 방호 무효]');
      else { coverFactor *= 0.8; if (!isSub) notes.push(' [고착 포복 -20%]'); }
    }
    const elevFactor = getTerrain(att.c, att.r).elevation > ter.elevation ? 1.15 : 1.0;
    if (elevFactor > 1 && !isSub) notes.push(' [고지대 ×1.15]');
    const coverMod = coverFactor * elevFactor;

    // surviving squad members: rapid-fire infantry lose shots, single-shot / crew weapons lose damage per shot
    const fpMod = att.N ? att.models / att.N : 1;
    if (fpMod < 1 && !isSub) notes.push(` [분대원 ${att.models}/${att.N} 화력 ${Math.round(fpMod * 100)}%]`);
    const scaleShots = wpn.raw ? !!(att.N > 1 && !att.crewed && !isSub) : !!(att.N && !att.isHeavy && !att.isMortar && !att.isArtillery && !att.isNebel && rof >= 2);
    let effRof = scaleShots ? (wpn.rofB ? rof * fpMod : Math.max(1, rof * fpMod)) : rof;
    if (wpn.rofB) effRof = Math.round(effRof * 10) / 10;   // v166: rates to one decimal place
    // v166: shots per turn are whole numbers; the fractional part of the CoH3 rate is folded into attack power
    //   (rate 0.4 -> 1 shot at x0.4 attack, rate 2.5 -> 3 shots at x0.83). Expected damage is unchanged, no carry-over needed.
    let rateMul = 1;
    if (wpn.rofB) {
      effRof = Math.round(effRof * 10) / 10;
      // vehicles / crewed guns (not scaled by squad size) with rate < 3 round DOWN: 1.5 -> 1 shot at x1.5 attack
      const n = Math.max(1, (!scaleShots && effRof < 3) ? Math.floor(effRof + 1e-9) : Math.round(effRof + 1e-9));
      rateMul = isSniperMain ? 1 : effRof / n;   // a sniper hit is one clean shot, never scaled
      effRof = n;
    }
    const dmgFp = (scaleShots || wpn.raw) ? 1 : fpMod;   // v162: raw weapons lose shots with every man lost; crews fire until the last one
    const holdMod = (!isSub && att.buff && att.buff.hold > 0) ? 0.5 : 1;

    // main-weapon range profile (WPN3) and attacker buffs
    let wpnMul = rateMul;
    if (rateMul < 0.995 || rateMul > 1.005) { if (!isSub) notes.push(` [연사 환산 공격력 ×${Math.round(rateMul * 100) / 100}]`); }
    if (isMainGun && att.key && !isIndirect && !wpn.raw && typeof wpnOf === 'function') {
      const w = wpnOf(att);
      if (w) { const bi = bandIdx(dist, att.range); const m = w.b[bi]; if (m !== 1) { wpnMul *= m; notes.push(` [${w.n} ${BAND_N[bi]} ×${m}]`); } }
    }
    if (!isSub && fx) {
      if (fx.mul !== 1) { wpnMul *= fx.mul; notes.push(` [정조준 ×${fx.mul}]`); }
      if (fx.near !== 1 && dist <= 2) { wpnMul *= fx.near; notes.push(` [돌격 근접 ×${fx.near}]`); }
      if (fx.struct !== 1 && def.type) { wpnMul *= fx.struct; notes.push(` [구조물 ×${fx.struct}]`); }
    }

    let total = 0, hits = 0, pens = 0, shots = 0, penChance = 100, zone = null, armorEff = def.armor || 0;
    let penVal = penAtDist(wpn, dist);
    if (!isSub && fx && fx.pen !== 1) penVal = penScale(penVal, fx.pen);
    const W = v161Wpn(wpn, isSub ? null : fx);   // v161: attack / hit area after buffs
    let penDmgOut = 0, deflDmgOut = 0, trackHit = false, fireHit = false, gunHit = false, preMul = false;

    if (isSniperMain) {
      // sniper: share of the squad, 1.2 models by default (120% / N), so one clean hit always drops a model
      const pct = wpn.sniperPct || 1.2;
      const armorMod = (def.armor || 0) >= 3 ? 0.85 : 1.0;
      const execMod = (vA.exec !== 1 && def.hp <= def.maxHp * 0.5) ? vA.exec : 1.0;
      if (execMod > 1) notes.push(` [★ 처형 ×${execMod}]`);
      const perModelBase = (def.maxHp / def.N) * pct * armorMod * execMod;
      total = perModelBase * accuracy;
      const capped = Math.min(def.maxHp, Math.max(1, Math.round(total * dmgFp * coverMod * holdMod * wpnMul)));
      notes.push(` [인원비례 ${Math.round(pct * 100 / def.N)}%]`);
      return {
        damage: capped, rawAtk: W.atk, defArmor: def.armor || 0, penVal,
        penDmgOut: capped, deflDmgOut: 0, shots: 1, hits: accuracy,
        accuracy: Math.round(accuracy * 100), coverFactor: coverMod, rof: 1,
        specialNote: notes.join(''), zone: null, zoneLabel: '', penChance: 100, pens: 1,
        trackHit: false, fireHit: false, gunHit: false, suppress: 0
      };
    }

    if (persMode) {
      // v199: one shell reaches `persons` men, each takes the weapon's attack (capped at his HP); cover cuts persons, not attack
      const pm = def.N ? perModel(def) : def.maxHp;
      const execMod = (vA.exec !== 1 && def.hp <= def.maxHp * 0.5) ? vA.exec : 1.0;
      if (execMod > 1) notes.push(` [★ 처형 ×${execMod}]`);
      const men = Math.max(1, Math.ceil(def.hp / pm - 1e-9));
      const cvP = att.lob ? 1 : coverFactor;
      let A = (wpn.persons || 0) * W.area;
      if (att.lob && att.hasMoved) A *= V199.LOB_MOVED_MUL;
      const k = Math.min(A * cvP, men);
      const hitD = W.atk * elevFactor * holdMod * wpnMul * execMod + flameBonus;
      let dmg = 0;
      for (let i = 0, rem = k; rem > 1e-9 && i < men; i++, rem -= 1) {
        const w = Math.min(1, rem), hpI = i === 0 ? Math.max(1, def.hp - (men - 1) * pm) : pm;
        dmg += w * Math.min(hitD, hpI);
      }
      preMul = true;
      shots = effRof < 2 ? 1 : effRof; hits = effRof * accuracy;
      total = Math.min(def.hp, effRof * accuracy * dmg);
      notes.push(` [피해 인원 ${+k.toFixed(1)}명${att.lob ? ' · 곡사 엄폐무시' : (cvP < 0.999 ? ' · 엄폐 ×' + +cvP.toFixed(2) : '')}]`);
      penDmgOut = Math.round(Math.min(hitD, pm));
    } else if (isDefSoft && wpn.raw) {
      // v162: a hit lands on one man (capped at his remaining HP unless the weapon allows overkill); HE splashes the others
      const pm = def.N ? perModel(def) : def.maxHp;
      const execMod = (vA.exec !== 1 && def.hp <= def.maxHp * 0.5) ? vA.exec : 1.0;
      if (execMod > 1 && !isSub) notes.push(` [★ 처형 ×${execMod}]`);
      const mul = coverMod * holdMod * wpnMul * execMod;
      const hitD = W.atk * mul + flameBonus, splash = W.atk * (wpn.aoe || 0) * mul;
      const menOf = hp => Math.max(1, Math.ceil(hp / pm - 1e-9));
      preMul = true;
      if (preview || effRof < 2) {
        const men = menOf(def.hp);
        shots = effRof < 2 ? 1 : effRof; hits = effRof * accuracy;
        const direct = wpn.overkill ? hitD : Math.min(hitD, pm);
        total = Math.min(def.hp, effRof * (accuracy * (direct + splash * (men - 1)) + (1 - accuracy) * splash * men * RAW.MISS_AOE));
      } else {
        let sim = def.hp;
        const whole = Math.max(1, Math.floor(effRof)), frac = Math.max(0, effRof - whole);
        shots = whole + (frac > 0 ? 1 : 0);
        for (let i = 0; i < shots && sim > 0; i++) {
          const w = i < whole ? 1 : frac, men = menOf(sim);
          let d;
          if (Math.random() < accuracy) {
            hits++;
            const front = sim - (men - 1) * pm;
            d = (wpn.overkill ? hitD : Math.min(hitD, front)) + splash * (men - 1);
          } else d = splash * men * RAW.MISS_AOE;
          d = Math.min(sim, d * w); sim -= d; total += d;
        }
        notes.push(` [${isSub ? wpn.n + ' ' : ''}명중 ${hits}/${shots}]`);
      }
      penDmgOut = Math.round(Math.min(hitD, pm));
    } else if (isDefSoft) {
      // v161: one hit = attack x hit area (squad members reached) minus body armour
      const base = Math.max(2, W.area * W.atk - (def.armor || 0) * 2) + flameBonus;
      const execMod = (vA.exec !== 1 && def.hp <= def.maxHp * 0.5) ? vA.exec : 1.0;
      if (execMod > 1 && !isSub) notes.push(` [★ 처형 ×${execMod}]`);
      const perHit = base * execMod;
      if (preview || effRof < 2) {
        shots = effRof < 2 ? 1 : effRof;
        hits = effRof * accuracy;
        total = perHit * effRof * accuracy;
      } else {
        const whole = Math.max(1, Math.floor(effRof)), frac = Math.max(0, effRof - whole);
        shots = whole + (frac > 0 ? 1 : 0);
        for (let i = 0; i < shots; i++) {
          const w = i < whole ? 1 : frac;
          if (Math.random() < accuracy) { hits++; total += w * perHit; }
        }
        notes.push(` [${isSub ? wpn.n + ' ' : ''}명중 ${hits}/${shots}]`);
      }
      penDmgOut = Math.round(perHit * dmgFp * coverMod * holdMod * wpnMul);
    } else if (def.type) {
      const dmgBase = W.atk;   // v161: small arms ×0.1 (heavy MG ×0.3), guns ×0.5, rapid autocannons ×0.3, indirect ×1.5
      const mul = att.isFlamer ? 3.5 : isIndirect ? 1.5 : (att.bldMul !== undefined ? att.bldMul : (W.small ? (W.pmax >= .5 ? 0.3 : 0.1) : (effRof >= 8 ? 0.3 : 0.5)));
      const per = Math.max(isSub ? 0 : 1, dmgBase * mul);
      shots = effRof; hits = effRof * accuracy;
      total = per * effRof * accuracy; armorEff = 0;
      penDmgOut = Math.round(per * dmgFp * coverMod * holdMod * wpnMul);
      if (!isSub) notes.push(` [구조물 ×${mul}]`);
    } else {
      const dir = isIndirect ? { zone: 'front', mod: 1.0, deg: 0 } : getHitZone(att, def);
      zone = (def.facingAngle !== undefined && !isIndirect) ? dir.zone : null;
      armorEff = (def.facingAngle !== undefined && !isIndirect) ? zoneArmor(def, dir.zone) : (def.armor || 0) * dir.mod;
      const rawP = armorEff <= 0 ? 1.0 : penVal / (armorEff * K_PEN_UNIT);
      const saBlock = !!(def.saImm && wpn.sa && !att.isFlamer);   // v129: armoured cars ignore rifle-calibre fire
      const P = saBlock ? 0 : (armorEff <= 0 ? 1.0 : (rawP < PEN_CUTOFF ? 0 : Math.min(1.0, rawP)));
      if (saBlock) notes.push(' [소화기 면역]');
      penChance = Math.round(P * 100);
      const rearCrit = dir.zone === 'rear' ? (wpn.raw && def.rearMul ? def.rearMul : 1.35) : 1.0;

      // v161: small arms do 35 % to armoured vehicles (armour 1 and up); soft-skinned trucks and jeeps take it in full
      const dmgK = W.small && !wpn.raw && (def.armor || 0) >= 1 ? V161.saVeh : 1;   // v162: raw weapons rely on pen / armour alone
      const dmgAVal = W.atk;

      const penDmg = P === 0 ? 0 : (dmgAVal * dmgK + flameBonus) * rearCrit;
      const dPct = wpn.deflectDmgPct !== undefined ? wpn.deflectDmgPct : (isSub ? 0 : (att.deflectDmgPct || 0));
      const deflDmg = dPct > 0 && !saBlock ? dmgAVal * dmgK * dPct + flameBonus : 0;   // no 1-HP floor: small calibres cannot chip heavy armour

      penDmgOut = Math.round(penDmg * dmgFp * coverMod * holdMod * wpnMul);
      deflDmgOut = Math.round(deflDmg * dmgFp * coverMod * holdMod * wpnMul);

      if (preview) {
        shots = effRof;
        hits = effRof >= 2 ? effRof * accuracy : 1;
        total = (P * penDmg + (1 - P) * deflDmg) * effRof * accuracy;
        pens = Math.round(P * (effRof >= 2 ? effRof * accuracy : effRof) * 10) / 10;
      } else {
        const whole = Math.max(1, Math.floor(effRof)), frac = Math.max(0, effRof - whole);
        shots = whole + (frac > 0 ? 1 : 0);
        for (let i = 0; i < shots; i++) {
          const w = i < whole ? 1 : frac;
          if (effRof >= 2) {
            if (Math.random() >= accuracy) continue;
            hits++;
            if (Math.random() < P) { pens++; total += w * penDmg; }
            else total += w * deflDmg;
          } else {
            hits++;
            if (Math.random() < P) { pens++; total += w * penDmg * accuracy; }
            else total += w * deflDmg * accuracy;
          }
        }
        if (pens > 0 && def.facingAngle !== undefined && canCrit) {
          if (att.buff && att.buff.pierce > 0) trackHit = true;
          if (!isSub && fx && fx.trk) trackHit = true;     // AP aim skills: a penetrating hit always breaks a track
          if (dir.zone === 'side' && Math.random() < 0.15 * vD.critRes) trackHit = true;
          if (dir.zone === 'rear' && Math.random() < 0.20 * vD.critRes) fireHit = true;
          if (Math.random() < 0.08) gunHit = true;
        }
      }
      if (!isSub || penDmgOut > 0 || deflDmgOut > 0) {
        if (zone) {
          const pk = wpn.raw ? 1 / RAW.PENK : 1;   // v162: raw CoH3 armour / penetration in the log
          let t = ` [${isSub ? wpn.n + ' ' : ''}${ZONE_LABEL[zone]} · 장갑 ${penFmt(armorEff * pk)} / 관통 ${penFmt(penVal * pk)}`;
          t += preview ? ` · 관통 ${penChance}%` : (effRof >= 2 ? ` · 명중 ${hits}/${shots} · 관통 ${pens}/${hits}` : ` · 관통 ${pens}/${shots}`);
          if (zone === 'rear') t += ' · 치명타×1.35';
          notes.push(t + ']');
        } else if (!preview) {
          notes.push(` [${isSub ? wpn.n + ' ' : ''}${effRof >= 2 ? `명중 ${hits}/${shots} · ` : ''}관통 ${pens}/${effRof >= 2 ? hits : shots}]`);
        }
        if (!isSub && P === 0 && deflDmgOut === 0) notes.push(' [무효: 장갑 미관통]');
        if (trackHit) notes.push(' ⛓궤도 손상!');
        if (fireHit) notes.push(' 🔥엔진 화재!');
        if (gunHit) notes.push(' 🔇주포 고장!');
      }
    }

    let rawFinal = Math.round(preMul ? total : total * dmgFp * coverMod * holdMod * wpnMul);
    if (isTankMain && def.N && !preview && !preMul) rawFinal = aoeCap(def, rawFinal);
    if (isTankMain && def.N && preview && !preMul) penDmgOut = aoeCap(def, penDmgOut);
    const damage = (isDefSoft || def.type)
      ? (preview || effRof < 2 ? (rawFinal > 0 ? rawFinal : (isSub ? 0 : 1)) : rawFinal)
      : (penDmgOut === 0 && deflDmgOut === 0 ? 0 : (rawFinal > 0 ? rawFinal : (deflDmgOut > 0 ? 1 : 0)));

    const baseSup = isSub ? (wpn.supp || 0) : suppressionOf(att);
    return {
      damage, rawAtk: W.atk,
      defArmor: armorEff, penVal, penDmgOut, deflDmgOut, shots, hits,
      accuracy: Math.round(accuracy * 100), coverFactor: coverMod, rof: effRof,
      specialNote: notes.join(''), zone, zoneLabel: zone ? ZONE_LABEL[zone] : '', penChance, pens,
      trackHit, fireHit, gunHit,
      suppress: isDefSoft ? Math.round(baseSup * suppTerrainMul(def, att)) : 0
    };
  }

  // Can this unit's main gun / secondary weapon reach (c, r)?
  const mainReach = (u, c, r, dist) => !u.gunDisabled && dist >= (u.minRange || 0) && dist <= u.range && isInFiringArc(u, c, r);
  const subReach = (u, c, r, dist) => !!u.sub && !(u.tgl && u.tgl.recon) && dist >= (u.sub.minR || 0) && dist <= u.sub.range && (!u.sub.arc || isInArcDeg(u, u.sub.arc, c, r)) && (!v184Fixed(u) || v184InArc(u, c, r));   // v185: fixed guns: the coax / hull MG obeys the arc too

  function calcDamage__base(att, def, preview = false) {
    if (typeof pasSync === 'function' && att.key) pasSync(att);
    if (typeof pasSync === 'function' && def.key) pasSync(def);
    const dist = getDistance(att.c, att.r, def.c, def.r);
    const fx = typeof fxOf === 'function' ? fxOf(att) : null;
    const isVirtual = !att.key;
    const canMain = isVirtual || mainReach(att, def.c, def.r, dist);
    const canSub = !isVirtual && subReach(att, def.c, def.r, dist);
    // SSF weapon swap: the bazooka replaces the LMG as the main weapon (explicit launcher profile, not multipliers)
    const mainW = (!isVirtual && att.tgl && att.tgl.wswap) ? Object.assign({}, AT_ROCKET.blue, { range: att.range }) : att;

    const mainRes = canMain ? calcOneWeapon(att, mainW, def, preview, false, fx) : null;
    const subRes = canSub ? calcOneWeapon(att, att.sub, def, preview, true, null) : null;

    // defender-side modifiers (grit, Hull Down, evasive dash, marked target)
    let defMul = 1; const dNotes = [];
    if (def.buff && def.buff.grit > 0) { defMul *= 0.75; dNotes.push(' [불굴 −25%]'); }
    { const rd = vetV(def).recvDmg || 1; if (rd !== 1) { defMul *= rd; dNotes.push(` [★ 받는 피해 ${vpct(rd)}]`); } }   // v162
    if (def.marked > turnNo && att.team !== def.team) { defMul *= 1.25; dNotes.push(' [표적 지정 +25%]'); }
    if (typeof TGL !== 'undefined' && def.tgl && def.tgl.hulldown && mainRes && mainRes.zone === 'front') { defMul *= 0.75; dNotes.push(' [Hull Down −25%]'); }
    if (def.buff && def.buff.evade > 0) { defMul *= 0.9; dNotes.push(' [기동 질주 −10%]'); }
    if (def.repairing && att.team !== def.team) { defMul *= V158.repDmg; dNotes.push(' [수리 중 피해 +100%]'); }   // v158
    // v140: retreat lowers received accuracy instead (calcOneWeapon)
    const applyMul = r => {
      if (!r || defMul === 1) return r;
      if (r.damage > 0) r.damage = Math.max(1, Math.round(r.damage * defMul));
      if (r.penDmgOut > 0) r.penDmgOut = Math.max(1, Math.round(r.penDmgOut * defMul));
      if (r.deflDmgOut > 0) r.deflDmgOut = Math.max(1, Math.round(r.deflDmgOut * defMul));
      return r;
    };
    applyMul(mainRes); applyMul(subRes);

    // the weapon that does the work is the one the preview describes (e.g. a squad's launcher against a tank)
    const pri = (subRes && (!mainRes || (mainRes.damage === 0 && subRes.damage > 0))) ? subRes : mainRes;
    if (!pri) {
      return { damage: 0, rawAtk: 0, defArmor: def.armor || 0, penVal: 0, penDmgOut: 0, deflDmgOut: 0, shots: 0, hits: 0, accuracy: 0, coverFactor: 1, rof: 0, specialNote: '', zone: null, zoneLabel: '', penChance: 0, pens: 0, trackHit: false, fireHit: false, gunHit: false, suppress: 0, mainDmg: 0, subDmg: 0 };
    }
    const mDmg = mainRes ? mainRes.damage : 0, sDmg = subRes ? subRes.damage : 0;
    const showSub = subRes && (subRes.damage > 0 || def.armorType === 'soft' || subRes.penChance > 0);
    return {
      damage: mDmg + sDmg, mainDmg: mDmg, subDmg: sDmg,
      subName: att.sub ? att.sub.n : '', subRof: subRes ? subRes.rof : 0, subPens: subRes ? subRes.pens : 0, priSub: pri === subRes,
      rawAtk: pri.rawAtk, defArmor: pri.defArmor, penVal: pri.penVal,
      penDmgOut: pri.penDmgOut, deflDmgOut: pri.deflDmgOut,
      shots: pri.shots, hits: pri.hits, accuracy: pri.accuracy, coverFactor: pri.coverFactor, rof: pri.rof,
      specialNote: (mainRes ? mainRes.specialNote : '') + (showSub ? subRes.specialNote : '') + dNotes.join(''),
      zone: pri.zone, zoneLabel: pri.zoneLabel, penChance: pri.penChance, pens: (mainRes ? mainRes.pens : 0) + (subRes ? subRes.pens : 0),
      trackHit: !!(mainRes && mainRes.trackHit) || !!(subRes && subRes.trackHit),
      fireHit: !!(mainRes && mainRes.fireHit) || !!(subRes && subRes.fireHit),
      gunHit: !!(mainRes && mainRes.gunHit) || !!(subRes && subRes.gunHit),
      suppress: (mainRes ? mainRes.suppress : 0) + (subRes ? subRes.suppress : 0)
    };
  }

  // v127: secondary-weapon veterancy uses the same delta scheme as unit stats (rate of fire is applied at fire time via vetV)
  function vetSub(s, od, e) {
    od = od || { atk: 0, pen: [0, 0, 0] };   // v161: attack and penetration (small-arms secondaries keep their attack)
    const bAtk = (s.atk || 0) - (od.atk || 0), bPen = (s.pen || [0, 0, 0]).map((x, i) => x - (od.pen[i] || 0));
    const am = v161Small(s) ? 1 : (e.atk || 1);
    const d = { atk: rnd2(bAtk * (am - 1)), pen: bPen.map(x => rnd2(x * ((e.pen || 1) - 1))) };
    s.atk = rnd2(bAtk + d.atk); s.pen = bPen.map((x, i) => rnd2(x + d.pen[i]));
    return d;
  }
  // Mount a new secondary weapon (package launcher, .50cal upgrade) and give it the unit's current veterancy.
  function equipSub(u, profile) {
    u.sub = JSON.parse(JSON.stringify(profile));
    if (u.vetD) u.vetD.sub = u.rank > 0 ? vetSub(u.sub, null, (((vetU(u) || {}).tbl || VET_TABLE[vetCls(u)]) || [])[u.rank] || {}) : null;
  }

  // 피격 후 부가효과: 제압치 누적 / 궤도 손상 / 엔진 화재
  function applyHitEffects(att, def, res) {
    if (res && res.zone && res.zone !== 'front') fxAdd(def, res.zone === 'rear' ? '후면 명중!' : '측면 명중!', res.zone === 'rear' ? '#f87171' : '#fb923c', -22);
    if (!res || def.hp <= 0) return;
    if (def.armorType === 'soft') addSuppression(def, res.suppress);
    else {
      if (res.trackHit && !def.trackDamaged) {
        def.trackDamaged = true;
        addLog(`⛓️ [궤도 파손] ${def.className} 측면 피격 — 다음 턴 이동 불가!`, "crit");
      }
      if (res.gunHit && !def.gunDisabled) { def.gunDisabled = true; def.gunTurns = 0; addLog(`🔇 [주포 고장] ${def.className} — 수리 전까지 공격 불가`, "crit"); }
      if (res.trackHit) def.trackTurns = 0;
      if (res.fireHit && !(def.fireTurns > 0)) {
        def.fireTurns = 2;
        addLog(`🔥 [엔진 화재] ${def.className} 후면 피격 — 2턴간 매 턴 화재 피해!`, "crit");
      }
    }
  }

  // 턴 개시: 제압 회복(-35, 하드 커버 -70) · 화재 피해 · 궤도 손상 · 이동력 상한
  function processTurnStartStatus__base(team) {
    units.filter(u => u.team === team && u.hp > 0).forEach(u => {
      if ((u.suppression || 0) > 0) {
        const inHard = !u.isLoaded && getTerrain(u.c, u.r).cover === 'hard';
        const before = suppState(u);
        u.suppression = Math.max(0, u.suppression - SUPP_RECOVER * (inHard ? 2 : 1));
        const after = suppState(u);
        if (after < before) addLog(after === 0 ? `✅ [제압 해제] ${u.className} 전열 복귀` : `↘️ [고착 → 제압] ${u.className} 부분 회복`, "move");
      }
      if (u.isLoaded) return;
      if (u.fireTurns > 0) {
        const d = Math.max(3, Math.round(u.maxHp * 0.06));
        u.hp -= d; u.fireTurns -= 1;
        addLog(`🔥 [엔진 화재] ${u.className} [-${d} HP]`, "crit");
        if (u.hp <= 0) { u.hp = 0; addLog(`💥 ${u.className} 화재로 폭발!`, "crit"); checkVictory(); return; }
      }
      capSuppressedMove(u);
      if (u.trackDamaged) {
        u.trackTurns = (u.trackTurns || 0) + 1;
        if (u.trackTurns >= 2) { u.trackDamaged = false; addLog(`🔧 [응급 자가수리] ${u.className} 궤도 복구`, "supply"); }
        else { u.remainingMove = Math.ceil(u.moveDist / 2); addLog(`⛓️ [궤도 손상] ${u.className} 이동력 절반`, "crit"); }
      }
      if (u.gunDisabled) { u.gunTurns = (u.gunTurns || 0) + 1; if (u.gunTurns >= 2) { u.gunDisabled = false; addLog(`🔧 [응급 자가수리] ${u.className} 주포 복구`, "supply"); } }
    });
    units.forEach(u => { if (suppState(u) >= 1) u.counterAttacksLeft = 0; });
  }

  function statusLineHtml__base(u) {
    const parts = [];
    if (u.armorType === 'soft') {
      const st = suppState(u);
      parts.push(`제압치: <strong style="color:${st === 2 ? '#f87171' : st === 1 ? '#fbbf24' : '#94a3b8'}">${u.suppression || 0}/${SUPP_MAX} [${['정상', '제압', '고착'][st]}]</strong>`);
      if (isGarrisoned(u)) parts.push('<span style=\"color:#34d399\">🏠 주둔: 제압 면역</span>');
    }
    if (u.trackDamaged) parts.push('<span style="color:#fb923c">⛓ 궤도 손상(다음 턴 이동 불가)</span>');
    if (u.fireTurns > 0) parts.push(`<span style="color:#f87171">🔥 엔진 화재(${u.fireTurns}턴)</span>`);
    return parts.length ? '<br>' + parts.join(' | ') : '';
  }
  function stripStatus__base(u) {
    const st = suppState(u), out = [];
    if (st === 2) out.push('<span style="color:#f87171">📌 고착</span>');
    else if (st === 1) out.push('<span style="color:#fbbf24">⚠ 제압</span>');
    if (u.trackDamaged) out.push('<span style="color:#fb923c">⛓ 궤도</span>');
    if (u.fireTurns > 0) out.push('<span style="color:#f87171">🔥 화재</span>');
    return out.join('');
  }
  // [TACTICS-V5 END]


    function executeCombat__base(attacker, defender) {
    if (!attacker.isHeavy || attacker.arcAngle >= 6.28) v183Aim(attacker, defender.c, defender.r);   // v183: Sherman / Panzer IV turn the turret only
    attacker.ammo -= 1;
    const res = calcDamage(attacker, defender);
    defender.hp -= res.damage;
    if (res.damage === 0) fxAdd(defender, defender.armorType === 'hard' ? '도탄!' : '빗나감!', '#94a3b8');
    attacker.hasAttacked = true;


    addVeterancyExp(attacker, 2, 'atk');


    let logType = attacker.isFlamer ? "flame" : (attacker.isSniper ? "sniper" : (attacker.isMortar || attacker.isArtillery || attacker.isNebel ? "artillery" : "normal"));
    addLog(`[교전] ${attacker.className} ➔ ${defender.className} [${res.damage} 피해 (${res.rof >= 2 ? Math.round(res.rof) + '발' : '연사×' + Math.round(res.rof * 10) / 10}, 명중 ${res.accuracy}%)]${res.specialNote}`, logType);


    applyHitEffects(attacker, defender, res);


    if (attacker.isMortar || attacker.isNebel) {
      const splashRatio = attacker.isNebel ? 0.6 : 0.5;
      const splashNeighbors = getHexNeighbors(defender.c, defender.r);
      splashNeighbors.forEach(n => {
        const splashTarget = getUnitAt(n.c, n.r);
        if (splashTarget && splashTarget.hp > 0) {
          const splashDmg = Math.max(2, Math.floor(res.damage * splashRatio));
          splashTarget.hp -= splashDmg;
          addLog(`💥 [광역 스플래시] ${splashTarget.className} [${splashDmg} 피해]`, "artillery");
          if (splashTarget.hp <= 0) {
            splashTarget.hp = 0;
            claimKillBounty(attacker, splashTarget);
            addVeterancyExp(attacker, 8, splashTarget);
          } else addSuppression(splashTarget, Math.round(suppressionOf(attacker) * suppTerrainMul(splashTarget, attacker)));
        }
      });
    }


    if (defender.hp <= 0) {
      defender.hp = 0;
      claimKillBounty(attacker, defender);
      addVeterancyExp(attacker, 8, defender);
      checkVictory();
      return;
    }


    if (defender.range !== undefined && defender.ammo > 0) {
      const dist = getDistance(defender.c, defender.r, attacker.c, attacker.r);
      const defCanMain = mainReach(defender, attacker.c, attacker.r, dist), defCanSub = subReach(defender, attacker.c, attacker.r, dist);
      const inArc = defCanMain || defCanSub || isInFiringArc(defender, attacker.c, attacker.r);
      const inRange = defCanMain || defCanSub || (dist >= defender.minRange && dist <= defender.range && !defender.gunDisabled);
      const counterElevCheck = checkElevationCombatRule(defender, attacker);


      if (inRange && (counterElevCheck.allowed || (defCanSub && !defCanMain))) {
        const ds = suppState(defender);
        if (ds >= 1) {
          addLog(`[${ds === 2 ? '고착' : '제압'}] ${defender.className} 화망에 묶여 반격 불가!`, "arc");
        } else if (defender.buff && defender.buff.retreat > 0) {
          addLog(`🏳 [퇴각 중] ${defender.className} 반격하지 않고 후퇴`, "arc");
        } else if (defender.tgl && defender.tgl.holdfire) {
          addLog(`🤫 [사격 보류] ${defender.className} 반격하지 않고 은신 유지`, "arc");
        } else if (!inArc) {
          addLog(`[사각지대] ${defender.className} 측후방 기습으로 반격 불가!`, "arc");
        } else if (!v159Ready(defender)) {   // v159
          addLog(`[거치 해제] ${defender.className} 거치 상태가 아니라 반격 불가`, "arc");
        } else if (defender.counterAttacksLeft > 0) {
          defender.counterAttacksLeft -= 1;
          defender.ammo -= 1;
          if (v183On(defender) || v184Fixed(defender)) v183Aim(defender, attacker.c, attacker.r);   // v183: the counter-firing turret aims at the attacker; v186: a fixed gun turns its hull
          const counterRes = calcDamage(defender, attacker);
          attacker.hp -= counterRes.damage;
          if (counterRes.damage === 0) fxAdd(attacker, attacker.armorType === 'hard' ? '도탄!' : '빗나감!', '#94a3b8');
          addVeterancyExp(defender, 2, 'atk');


          addLog(`↩️ [반격] ${defender.className} ➔ ${attacker.className} [${counterRes.damage} 피해 (명중 ${counterRes.accuracy}%)]${counterRes.specialNote}`, "counter");


          if (attacker.hp <= 0) {
            attacker.hp = 0;
            claimKillBounty(defender, attacker);
            addVeterancyExp(defender, 8, attacker);
            checkVictory();
          } else applyHitEffects(defender, attacker, counterRes);
        } else {
          addLog(`[반격 소진] ${defender.className}은 이번 턴 반격권을 이미 소진했습니다.`, "normal");
        }
      }
    }


    // v159: MG cover fire removed (watch fire replaces it, section [17+6])
  }


  function claimKillBounty(killer, victim) {
    const bounty = Math.max(40, Math.floor((victim.val || victim.cost || 200) / 5));
    gold[killer.team] += bounty;
    addLog(`💰 [격파 현상금] 적 ${victim.className} 무력화! (+${bounty}G)`, "bounty");
    updateGoldUI();
  }


  function mgCanCover__base(u, t) { return false; }   // v159: MG cover fire removed — kept so old previews show nothing


  // amount: 2 = 행동, 8 = 처치. ctx: 처치면 피해자(비용 비례 XP), 행동이면 'atk'(공격)
  function addVeterancyExp(unit, amount, ctx) {
    if (unit && unit.team) { teamXp[unit.team] += amount; syncCP(unit.team); }   // 팀 XP·CP 속도는 기존 그대로
    if (!unit || unit.rank === undefined || unit.rank >= 3) return;
    const cls = vetCls(unit); let gain = amount;
    if (amount === 8) { unit.kills = (unit.kills || 0) + 1; gain = killXp(ctx); }
    else if (ctx === 'atk') { if (cls === 'I') gain = 1; }                         // 곡사 공격 XP +1
    else if (cls === 'D' || cls === 'N') { if (unit.funcXpTurn === turnNo) return; unit.funcXpTurn = turnNo; }   // 기능 행동 XP는 턴당 1회
    unit.xp = (unit.xp || 0) + gain;

    while (unit.rank < 3 && unit.xp >= vetThr(unit)[unit.rank]) {
      unit.rank += 1;
      applyVeterancyBonus(unit, unit.rank);
    }
  }

  // 진급: 직전 별의 보정을 빼고(기본 스탯 복원) 클래스 표의 누적값을 통째로 다시 적용한다
  function applyVeterancyBonus(unit, rankLevel) {
    const VU = vetU(unit), cls = vetCls(unit), e = ((VU ? VU.tbl : VET_TABLE[cls]) || [])[rankLevel] || {}, v = Object.assign({}, VET_NONE, e);   // v162: CoH3 table first
    const old = unit.vetD || {}, nd = {};
    const base = f => (unit[f] || 0) - (old[f] || 0);
    const mul = (f, m) => m > 1 ? Math.max(1, Math.round(base(f) * (m - 1))) : 0;
    nd.maxHp = (e.hpPct ? Math.max(1, Math.round(base('maxHp') * e.hpPct)) : 0) + (e.hpModel ? Math.round(e.hpModel * (unit.N || 1)) : 0);
    nd.atk = e.atk ? Math.round(base('atk') * (e.atk - 1) * 10) / 10 : 0;     // v161: attack
    nd.area = e.area ? rnd2(base('area') * (e.area - 1)) : 0;                 // v161: hit area
    nd.armor = e.armorF || 0;
    nd.moveDist = e.move || 0; nd.range = e.range || 0; nd.baseSight = e.sight || 0;
    nd.maxAmmo = (e.ammoPct ? Math.max(1, Math.round(base('maxAmmo') * e.ammoPct)) : 0) + (e.ammoAdd || 0);

    ['maxHp', 'armor', 'moveDist', 'range', 'baseSight', 'maxAmmo'].forEach(f => { if (unit[f] !== undefined) unit[f] = base(f) + nd[f]; });
    unit.atk = Math.round((base('atk') + nd.atk) * 10) / 10; unit.area = rnd2(base('area') + nd.area);

    const dHp = nd.maxHp - (old.maxHp || 0); if (dHp > 0) unit.hp = Math.min(unit.maxHp, unit.hp + dHp);
    const dMv = nd.moveDist - (old.moveDist || 0); if (dMv > 0 && !unit.hasMoved) unit.remainingMove = Math.min(unit.moveDist, (unit.remainingMove || 0) + dMv);
    const dAm = nd.maxAmmo - (old.maxAmmo || 0); if (dAm > 0) unit.ammo = Math.min(unit.maxAmmo, (unit.ammo || 0) + dAm);
    const pv = unit.vet || VET_NONE; if (v.repairPlus > pv.repairPlus) unit.repairsLeft = (unit.repairsLeft || 0) + v.repairPlus - pv.repairPlus;
    // v127: penetration and the secondary weapon follow the delta scheme too
    if (Array.isArray(unit.pen)) {
      const od = old.pen || [0, 0, 0], bp = unit.pen.map((x, i) => x - (od[i] || 0));
      nd.pen = bp.map(x => rnd2(x * ((e.pen || 1) - 1)));
      unit.pen = bp.map((x, i) => rnd2(x + nd.pen[i]));
    }
    if (unit.sub) nd.sub = vetSub(unit.sub, old.sub, e);
    unit.vetD = nd; unit.vet = v;
    addLog(`${'⭐'.repeat(rankLevel)} [숙련도 진급] ${unit.className} ${rankLevel}성${rankLevel === 3 ? ' 엘리트' : ''}! (${VU ? VU.desc[rankLevel - 1] : VET_CLASS_NAME[cls] + ': ' + ((VET_DESC[cls] || [])[rankLevel - 1] || '')})`, "rank");
  }


  function boardUnit__base(passenger, transport) {
    const why = v129BoardRefusal(passenger, transport);   // v129: capacity in squads, crew weapons by size
    if (why) { toast(why); return; }


    passenger.isLoaded = true;
    passenger.c = transport.c;
    passenger.r = transport.r;
    transport.cargo.push(passenger);
    addLog(`[탑승] ${passenger.className} ➔ ${transport.className} 탑승 완료`, "supply");
    updateUnitInfoPanel(transport, getTerrain(transport.c, transport.r));
    render();
  }
  
  /* suppressionOf: layer moved to js/chains/suppressionOf.js */
  
  /* mgCanCover: layer moved to js/chains/mgCanCover.js */
  // =====================================================================
  // ===== 3차 적용: 병종별 고유 무장 시스템 · 고유 스킬 (CoH3식) =====
  //  ① 주무장 사거리 프로필 (근접/중거리/원거리 위력 차등)
  //  ② 크루 서브 화기 설치 규칙 (이동한 턴엔 화력·제압력 저하)
  //  ③ 전차 탄종 전환 (표준 / AP / HE)
  //  ④ 신규 무장 패키지 (톰슨·바주카·StG44·FG42·판저파우스트) + 기존 패키지 확장
  //  ⑤ 병종별 고유 스킬 (위장·표적지정·폭파·관측포격·응급치료·화염지대 등)
  // =====================================================================

  // ---------- ① 주무장 프로필 ----------
  const W3 = (n, c, m, f) => ({ n, b: [c, m, f] });   // [near, mid, far] damage multiplier; band edges scale with range (bandIdx)
  const WPN3 = {
    blue: {
      scout: W3('M1 카빈', 1.15, 1, .85), engineer: W3('M1 카빈 · 공구', 1.1, 1, .85),
      infantry: W3('M1 가랜드', 1.1, 1, .95), captain: W3('M1911 · 지휘 권총', 1.25, .9, .7),
      at_inf: W3('M9A1 바주카', 1, 1, 1), sniper: W3('M1903A4 스프링필드', 1, 1, 1),
      pathfinder: W3('M1 가랜드 (정밀)', 1, 1.05, 1.1), paratrooper: W3('M1A1 톰슨', 1.3, 1, .75),
      assault_eng: W3('M97 트렌치건', 1.4, .8, .5), commando: W3('소음 톰슨', 1.3, 1.05, .75),
      ranger: W3('가랜드 · BAR', 1.1, 1.1, .95), flamer: W3('M2-2 화염방사기', 1, 1, 1),
      hmg: W3('M1919A4', .8, 1, 1.1), hmg_50: W3('M2HB .50cal', .85, 1, 1.15), at_gun: W3('57mm M1', .9, 1, 1.1), m5gun: W3('M5 3인치', .9, 1, 1.15), pack75: W3('M1A1 75mm 곡사', 1, 1, 1),
      mortar: W3('M1 81mm 박격포', 1, 1, 1), howitzer: W3('M2A1 105mm', 1, 1, 1), scott: W3('M2A1 105mm (단포신)', 1, 1, 1),
      priest: W3('M2A1 105mm 곡사포', 1, 1, 1), whizbang: W3('T34 칼리오프 로켓', 1, 1, 1),
      m16: W3('M45 쿼드 .50cal', 1.1, 1, .85), m3gmc: W3('M1897 75mm', 1, 1, 1), vehicle: W3('M6 37mm · 동축 MG', 1.1, 1, .9),
      weasel: W3('M1919 장착', 1.1, 1, .85), transport: W3('M2HB 차량 장착', 1.1, 1, .85), truck: W3('M1919 장착', 1.1, 1, .85),
      chaffee: W3('M6 75mm', 1, 1, 1), grant: W3('M2 75mm · M6 37mm', 1.05, 1, .95), stuart: W3('M6 37mm', 1.1, 1, .9), tank_dest: W3('M1 76mm (고속)', .9, 1, 1.15),
      sherman: W3('M3 75mm', 1, 1, 1), bulldozer: W3('M4 105mm 곡사', 1.25, 1, .8),
      easyeight: W3('M1A2 76mm', .95, 1, 1.1), pershing: W3('M3 90mm', .95, 1, 1.1)
    },
    red: {
      engineer: W3('MP40 · 공구', 1.2, .9, .7), infantry: W3('Kar98k', .9, 1, 1.1), at_inf: W3('RPzB 54 판저슈렉', 1, 1, 1),
      sniper: W3('G43 ZF4 조준경', 1, 1, 1), fp_pioneer: W3('Kar98k · 공병', 1, 1, 1.05), jager: W3('Kar98k 정밀', .95, 1, 1.1),
      panzergren: W3('G43 · MP40', 1.2, 1, .85), fj: W3('G43 / FG42', 1, 1.1, 1.1), sturmtruppen: W3('MP40 · 수류탄', 1.35, 1, .75),
      flamer: W3('Flammenwerfer 41', 1, 1, 1), hmg: W3('MG42', .8, 1, 1.05), at_gun: W3('Pak 40 75mm', .85, 1, 1.12),
      lg40: W3('LG40 75mm', 1, 1, 1), flak: W3('Flak 30 20mm', 1.05, 1, .9), flak38: W3('Flak 38 20mm', 1.05, 1, .9), flak36: W3('8.8 cm Flak 36', 1, 1, 1.1), obice210: W3('Obice 210/22', 1, 1, 1), mortar: W3('Gr.W 34 81mm', 1, 1, 1),
      nebel: W3('Nebelwerfer 42 15cm', 1, 1, 1), howitzer: W3('sFH 18 150mm', 1, 1, 1), wespe: W3('leFH 18 105mm', 1, 1, 1), hummel: W3('15cm sFH 18/1', 1, 1, 1), stummel: W3('7.5cm KwK 37 L/24', 1.1, 1, .85), pz3l: W3('5cm KwK 39 L/60', .95, 1, 1.05),
      wanze: W3('8.8cm RPzB 54 ×6', 1, 1, 1.1), vehicle: W3('MG42', 1.1, 1, .9), pzb221: W3('2.8cm sPzB 41', .9, 1, 1.1), pz4cmd: W3('7.5cm KwK 37 L/24', 1, 1, .9), puma: W3('2cm KwK30 · MG34', 1, 1.05, 1),
      wirbelwind: W3('2cm Flakvierling 38', 1.1, 1, .85), kettenkrad: W3('MG34', 1.1, 1, .85), transport: W3('MG34 차량 장착', 1.1, 1, .85),
      tank_dest: W3('7.5cm Pak 40 L/46', .9, 1, 1.12),
      stug: W3('7.5cm StuK 40 L/48', .95, 1, 1.1), panzer4: W3('7.5cm KwK 40 L/43', .95, 1, 1.08),
      brummbar: W3('15cm StuH 43', 1.3, 1, .7), panther: W3('7.5cm KwK 42 L/70', .9, 1, 1.15), tiger: W3('8.8cm KwK 36', .9, 1, 1.15)
    }
  };
  const wpnOf = u => (WPN3[u.team] || {})[u.key] || null;
  const BAND_N = ['근접', '중거리', '원거리'];

  // ---------- ③ 탄종 ----------
  const SHELLS = {
    std: { n: '표준탄' },
    ap: { n: 'AP 철갑탄', pen: 1.2, atk: 1.2, area: .6 },
    he: { n: 'HE 고폭탄', area: 2, pen: .65, atk: .65, supp: 25 }
  };
  const SHELL_KEYS = ['chaffee', 'grant', 'stuart', 'sherman', 'easyeight', 'pershing', 'panzer4', 'stug', 'panther', 'tiger'];
  const SHELL_HINT = { std: '기본', ap: '관통·공격력 +20% · 범위 −40%', he: '범위 ×2 · 관통·공격력 −35% · 제압 +25' };

  // ---------- 스킬 버프 효과표 (u.buff[id] = 남은 지속) ----------
  const BUFF_FX = {
    burst: { n: '점사', rof: 1.4, supp: 30 },
    apbelt: { n: '철갑 벨트', pen: 1.5 },
    ap1: { n: '철갑 조준', pen: 1.3, atk: 1.3, trk: true, once: true },
    ap2: { n: '고속 철갑', pen: 1.45, atk: 1.45, trk: true, once: true },
    canister: { n: '산탄', area: 1.7, supp: 25, once: true },
    bb: { n: '벙커 버스터', area: 1.25, struct: 2, noCover: true, once: true },
    steady: { n: '정조준', mul: 1.4, once: true },
    charge: { n: '돌격', near: 1.35 },
    blitz: { n: '기습', near: 1.3 },
    grit: { n: '불굴' },
    retreat: { n: '퇴각' },
    camo: { n: '위장' }
  };
  function fxOf(a) {
    if (!a) return null;
    let fx = null;
    const add = o => {
      fx = fx || { atk: 1, area: 1, pen: 1, rof: 1, supp: 0, mul: 1, near: 1, struct: 1, trk: false, noCover: false };
      if (o.atk) fx.atk *= o.atk; if (o.area) fx.area *= o.area; if (o.pen) fx.pen *= o.pen; if (o.rof) fx.rof *= o.rof;
      if (o.supp) fx.supp += o.supp; if (o.mul) fx.mul *= o.mul; if (o.near) fx.near *= o.near;
      if (o.struct) fx.struct *= o.struct; if (o.trk) fx.trk = true; if (o.noCover) fx.noCover = true;
    };
    if (a.buff) Object.keys(a.buff).forEach(k => { if (a.buff[k] > 0 && BUFF_FX[k]) add(BUFF_FX[k]); });
    if (a.shell && a.shell !== 'std' && SHELLS[a.shell]) add(SHELLS[a.shell]);
    return fx;
  }

  // v127: buff / WPN3 / grit / mark modifiers moved into calcOneWeapon and calcDamage (no wrapper)
  
  /* suppressionOf: layer moved to js/chains/suppressionOf.js */
  
  /* addSuppression: layer moved to js/chains/addSuppression.js */
  // [VET-V45] 베테랑 제압 저항(받는 쪽) / 제압 부여(주는 쪽)
  
  /* addSuppression: layer moved to js/chains/addSuppression.js */
  
  /* suppressionOf: layer moved to js/chains/suppressionOf.js */

  // 사격 후: 1회성 버프 소모 · 위장 해제
  
  /* executeCombat: layer moved to js/chains/executeCombat.js */

  // ---------- UI: 상태 표시 ----------
  const buffTxt = u => {
    const a = u.buff ? Object.keys(u.buff).filter(k => BUFF_FX[k] && u.buff[k] > 0).map(k => BUFF_FX[k].n) : [];
    if (u.marked > turnNo) a.push('🎯표적');
    if (u.shell && u.shell !== 'std') a.push(SHELLS[u.shell].n);
    return a.join('·');
  };
  
  /* statusLineHtml: layer moved to js/chains/statusLineHtml.js */
  
  /* stripStatus: layer moved to js/chains/stripStatus.js */

