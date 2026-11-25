  // [v162] Upgrade weapons from the CoH3 data. An infantry kit hands k members a new weapon: it fires as the
  //   secondary weapon and the main weapon loses those k carriers. A squad that already has a secondary swaps it out.
  //   Vehicle pintle guns join the coaxial / hull pair (shots add up, per-shot values are shot-weighted).
  const KIT_INFO = {
    bar: { n: 'M1918 BAR', supp: 6 }, lmg: { n: 'MG42 경기관총', supp: 12 }, thompson: { n: 'M1A1 톰슨', supp: 3 },
    stg44: { n: 'StG44', supp: 3 }, fg42: { n: 'FG42', supp: 5 }, flame_blue: { n: 'M2 화염방사기', supp: 20, noCover: true },
    flame_red: { n: 'Flammenwerfer 41', supp: 20, noCover: true }, rocket_blue: { n: 'M9A1 바주카', supp: 0, at: true },
    rocket_red: { n: 'RPzB 54 판저슈렉', supp: 0, at: true }, cal50: { n: '포탑 M2HB .50cal', supp: 15 }
  };
  function kitProfile(id) {
    const w = COH3_RAW.kit[id], I = KIT_INFO[id]; if (!w || !I) return null;
    const p = rawWeapon({ n: I.n, arc: 360, supp: I.supp, kit: id, k: w.k, at: !!I.at, noCover: !!I.noCover }, w);
    p.sa = Math.max(...w.pen) < 10; return p;
  }
  const kitDesc = id => { const w = COH3_RAW.kit[id]; if (!w) return ''; return `${KIT_INFO[id].n} ×${w.k} · 공격 ${w.d} · 관통 ${w.pen.join('/')} · 턴당 ${w.spt.join('/')}발 · 사거리 ${Math.round(w.max / RAW.HEX_M) + V200.RANGE_BONUS}칸`; };
  function equipKit(u, id) {
    const P = kitProfile(id); if (!P) return false;
    const kMain = (u.rawW && u.rawW.k) || u.N || 1;
    if (!u.sub && u.rofB && kMain > 1) {   // the kit carriers stop firing the main weapon
      const keep = Math.max(0, kMain - P.k) / kMain;
      u.rofB = u.rofB.map(x => Math.round(x * keep * 10) / 10); u.rof = u.rofB[1];
    }
    equipSub(u, P); return true;
  }
  // two raw weapons firing as one (vehicle MG pair + pintle .50cal)
  function joinRaw(a, b) {
    if (!a || !a.raw) return b;
    const tot = [0, 1, 2].map(i => Math.round((a.rofB[i] + b.rofB[i]) * 10) / 10), wav = (x, y) => [0, 1, 2].map(i => (x[i] * a.rofB[i] + y[i] * b.rofB[i]) / tot[i]);
    const o = Object.assign({}, b, { n: (a.n || '') + ' + ' + b.n, rofB: tot, rof: tot[1] });
    o.atk = Math.round((a.atk * a.rofB[1] + b.atk * b.rofB[1]) / tot[1] * 100) / 100;
    o.acc = wav(a.acc, b.acc).map(x => Math.round(x * 100) / 100);
    o.pen = wav(a.pen, b.pen).map(x => Math.round(x * 100) / 100);
    o.range = Math.max(a.range, b.range); o.closeEnd = Math.max(a.closeEnd, b.closeEnd); o.midEnd = Math.max(a.midEnd, b.midEnd);
    o.supp = (a.supp || 0) + (b.supp || 0);
    return o;
  }


  // [V52·V53] 유닛 → 생산 건물 (배열 = 복수 건물). 교리 전용 유닛은 해당 교리 지원소(doc_*)에서만 징집
  const BLD_OF = {
    blue: {
      hq: ['scout', 'engineer'], barracks: ['infantry', 'mortar', 'truck', 'weasel'],
      support_center: ['hmg', 'at_inf', 'sniper', 'transport', 'ambulance'],
      motor_pool: ['vehicle', 'at_gun', 'm5gun', 'chaffee', 'm3gmc', 'supply', 'recovery'],
      tank_depot: ['grant', 'sherman', 'tank_dest', 'bulldozer', 'easyeight', 'pershing'],
      doc_inf: ['captain', 'assault_eng', 'ranger', 'hmg_50', 'howitzer'],
      doc_mech: ['stuart', 'm16', 'whizbang', 'priest', 'scott'],
      doc_air: ['pathfinder', 'paratrooper', 'commando', 'pack75']
    },
    red: {
      hq: ['engineer', 'kettenkrad'], barracks: ['infantry', 'hmg', 'mortar', 'sniper', 'ambulance'],
      motor_pool: ['panzergren', 'at_gun', 'transport', 'stummel', 'amb251', 'supply', 'nebel', 'stug'],
      air_coy: ['jager', 'vehicle', 'pzb221', 'puma', 'flak', 'flak38', 'wirbelwind', 'tank_dest'],
      tank_depot: ['sturmtruppen', 'pz3l', 'panzer4', 'pz4cmd', 'brummbar', 'panther', 'tiger', 'bergepanzer', 'flak36'],
      doc_inf: ['fp_pioneer', 'howitzer', 'obice210'], doc_mech: ['wespe', 'hummel', 'wanze'], doc_air: ['fj', 'lg40']
    }
  };
  // 소총병·그레나디어는 HQ에서도 징집 가능 (초반 기본 병력 유지)
  // v140/v141: riflemen and grenadiers only from T1
  ['blue', 'red'].forEach(tm => { Object.keys(BLD_OF[tm]).forEach(b => BLD_OF[tm][b].forEach(k => { const t = UNIT_ROSTER[tm][k]; if (t) t.bld = (t.bld || []).concat(b); else console.warn('BLD_OF 미존재 유닛', tm, k); })); });
  ['blue', 'red'].forEach(tm => delete UNIT_ROSTER[tm].engineer.supplies);
  let nextUnitId = 10;
  let units = [];


  function initUnits() {
    nextUnitId = 10; units = [];
    const SKM = mapSelect.value === 'skirmish';   // v162: skirmish test map starts with a mixed company per side
    ['blue', 'red'].forEach(tm => {
      const hq = buildings.find(b => b.team === tm && b.type === 'hq'), spots = [];
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const d = getDistance(hq.c, hq.r, c, r);
          if (d >= 1 && d <= (SKM ? 3 : 2) && !getBuildingAt(c, r) && !units.some(u => u.c === c && u.r === r) && getTileMovementCost({ armorType: 'hard' }, c, r, c, r) !== Infinity && !(SKM && (terrainMap[c + ',' + r].fort || mines.some(m => m.c === c && m.r === r) || bunkers.some(b => b.c === c && b.r === r)))) {
            spots.push([d, c, r]);
          }
        }
      }
      spots.sort((a, b) => a[0] - b[0]);
      const startDeck = SKM ? (tm === 'blue' ? ['engineer', 'infantry', 'infantry', 'at_inf', 'hmg', 'at_gun', 'sherman'] : ['engineer', 'infantry', 'infantry', 'panzergren', 'hmg', 'at_gun', 'panzer4']) : ['engineer'];   // v140: one engineer squad


      startDeck.forEach((k, i) => {
        if (spots[i]) units.push(createUnitFromKey(nextUnitId++, tm, k, spots[i][1], spots[i][2]));
      });
    });
  }


  function createUnitFromKey__base(id, team, key, c, r, initialAngle = null) {
    const t = UNIT_ROSTER[team][key];
    const defaultAngle = team === 'blue' ? 0 : Math.PI;
    const isMechanized = t.armorType === 'hard';
    const consumesFuel = false && isMechanized;   // v130: units carry no fuel; the team's fuel resource stays for production
    return {
      id, team, key,
      className: t.className,
      uniqueName: t.uniqueName,
      code: t.code,
      class: t.class || 'combat',
      cost: t.cost, val: t.val || t.cost,
      isHeavy: !!t.isHeavy, isHmg: !!t.isHmg, isFlamer: !!t.isFlamer, isSniper: !!t.isSniper,
      isMortar: !!t.isMortar, isNebel: !!t.isNebel, isArtillery: !!t.isArtillery, isAtInf: !!t.isAtInf, isTankDest: !!t.isTankDest,
      facingAngle: initialAngle !== null ? initialAngle : defaultAngle,
      arcAngle: ((t.arc || 120) * Math.PI) / 180, suppBase: t.supp,
      armorType: t.armorType, armor: t.armor, armorS: t.armorS, armorR: t.armorR,
      maxHp: t.maxHp, hp: t.maxHp,
      macro: t.macro || 'INF', role: t.role || 'AI',
      atk: t.atk || 0, area: t.area !== undefined ? t.area : 1, persons: t.persons || 0, lob: !!t.lob, sniperPct: t.sniperPct || 0,   // v161: one attack value + hit area (models)
      pen: Array.isArray(t.pen) ? t.pen.slice() : (t.pen !== undefined ? t.pen : 0),
      penDrop: t.penDrop || 0, closeEnd: t.closeEnd || 0,
      sub: t.sub ? JSON.parse(JSON.stringify(t.sub)) : null,
      rof: t.rof || 1,
      accDrop: t.accDrop || 0.05,
      acc: t.acc ? t.acc.slice() : null, midEnd: t.midEnd || 0,
      deflectDmgPct: t.deflectDmgPct || 0,
      moveDist: t.move,
      remainingMove: t.move,
      minRange: t.minR || 0, range: t.range,
      maxAmmo: t.ammo, ammo: t.ammo,
      hasFuel: consumesFuel,
      maxFuel: consumesFuel ? t.maxFuel : 0,
      fuel: consumesFuel ? t.fuel : 0,
      counterAttacksLeft: 1,
      suppression: 0, trackDamaged: false, fireTurns: 0,
      baseSight: t.sight,
      supplies: t.supplies !== undefined ? t.supplies : 0,
      maxSupplies: t.maxSupplies || 0,
      cargoCap: t.cargoCap || 0,
      cargo: [],
      c, r, hasMoved: false, hasAttacked: false, isLoaded: false, kills: 0, rank: 0, repairsLeft: 2, xp: 0
    };
  }
  
  /* createUnitFromKey: layer moved to js/chains/createUnitFromKey.js */
  const SQUAD_N = u => {
    if (u.armorType === 'hard') return null;
    { const rn = UNIT_ROSTER[u.team][u.key].N; if (rn) return rn; } // v44: 로스터에 명시한 분대원 수 우선
    if (u.isSniper || u.isFlamer) return 2;
    if (u.isHmg || u.isMortar || u.isAtInf || u.isHeavy) return 3;
    if (u.isArtillery || u.isNebel) return 4;
    const cat = UNIT_ROSTER[u.team][u.key].cat, k = u.key;
    if (/eng|pioneer/.test(k)) return 4;
    if (/command|officer/.test(k)) return 3;
    if (UNIT_ROSTER[u.team][k].isElite || /ranger|commando|jager|fj/.test(k)) return 4;
    return cat === 'infantry' ? 5 : 3;
  };
  function initModels(u) { u.N = SQUAD_N(u); u.models = u.N; u.healedThisTurn = 0; u.repairedThisTurn = 0; u.reinfLeft = 2; u.gunDisabled = false; }
  const hpCap = u => u.N ? Math.round(u.maxHp * u.models / u.N) : u.maxHp;
  const perModel = u => u.maxHp / u.N;
  // v44: 곡사·광역 한 발이 한 분대에 줄 수 있는 피해는 최대 3개 모델분
  const AOE_MODEL_CAP = 3;
  const aoeCap = (d, x) => (d.N && d.armorType === 'soft') ? Math.min(x, Math.max(1, Math.ceil(AOE_MODEL_CAP * perModel(d)))) : x;
  const modelHit = (u, k = 1) => Math.ceil((u.N ? perModel(u) : 20) * k - 1e-9);   // v127: "n models" of damage, rounded up
  function syncModels(u) {
    if (!u.N || u.hp <= 0) return;
    u.models = Math.min(u.models, Math.max(1, Math.ceil(u.hp / perModel(u) - 1e-9)));
    u.hp = Math.min(u.hp, hpCap(u));
  }
  function healUnit(u, amt) {
    const cap = Math.round(Math.max(36, u.maxHp * 0.2)), room = Math.max(0, cap - (u.healedThisTurn || 0)), a = Math.min(amt, room);   // v127: 20 -> max(36, 20% HP)
    const before = u.hp; u.hp = Math.min(hpCap(u), u.hp + a); u.healedThisTurn = (u.healedThisTurn || 0) + (u.hp - before);
  }
  /* ambHeal: original body removed — replaced by a later layer (js/chains/ambHeal.js) */
  // v128: one model costs half of (unit cost / squad size), rounded to 5
  function reinfCost(u) {
    let c = Math.max(5, Math.round(u.cost / u.N / 2 / 5) * 5); if (doctrineInf(u.team)) c = Math.round(c * 0.75 / 5) * 5; return c;
  }
  const doctrineInf = tm => doctrine[tm] === 'inf';
  const REINF_VEH = ['medic_vehicle', 'supply', 'transport'];   // v128: ambulances, supply trucks, transport half-tracks
  function canReinforce__base(u) {
    if (!u.N || u.models >= u.N || u.reinfLeft < 1 || u.team !== currentTurn || u.isLoaded) return false;
    return buildings.some(b => b.team === u.team && (b.type === 'hq' || b.type === 'outpost') && b.hp > 0 && !b.crippled && getDistance(b.c, b.r, u.c, u.r) <= (b.type === 'hq' ? V130.hqReinf : 2))
      || units.some(v => v.team === u.team && v.hp > 0 && !v.isLoaded && REINF_VEH.includes(v.class) && getDistance(v.c, v.r, u.c, u.r) <= 1);   // v128: field reinforcement
  }
  function reinforce(id) {
    const u = units.find(x => String(x.id) === String(id)); if (!u || !canReinforce(u)) return;
    const c = reinfCost(u); if (gold[u.team] < c) { toast('군자금이 부족합니다.'); return; }
    gold[u.team] -= c; u.models++; u.reinfLeft--; u.hp = Math.min(hpCap(u), u.hp + perModel(u));
    addLog(`➕ [분대원 충원] ${u.className} ${u.models}/${u.N}명 (-${c}G)`, "supply");
    updateGoldUI(); updateUnitInfoPanel(u, getTerrain(u.c, u.r)); render();
  }
  /* armorRepair: original body removed — replaced by a later layer (js/chains/armorRepair.js) */

