  // ══════════════════════════════════════════════════════════════
  // [04] 규칙 데이터
  //     · TERRAIN_DEFS(지형 효과) · TECH · BLD · FORT · VET_THRESHOLDS · HUB_G/HUB_F · canProd
  // ══════════════════════════════════════════════════════════════


  // ==========================================
  // 지형 타일 세부 정의
  // cover: none(1.0배), yellow(보병 0.5배/차량 0.8배), hard(보병 0.25배/차량 0.5배)
  // [신규] 참호(trench), 포탄 구덩이(crater), 건물 잔해(rubble) 명확 반영
  // ==========================================
  const TERRAIN_DEFS = {
    plains:       { fill: '#4d6342', inf: 1, veh: 2, cover: 'none',   sightBlock: false, name: '평지', code: '' },
    road:         { fill: '#a08544', inf: 1, veh: 1, cover: 'none',   sightBlock: false, name: '포장도로', code: '═' },
    cobblestone:  { fill: '#5b5f66', inf: 1, veh: 1, cover: 'none',   sightBlock: false, name: '도시 벽돌길', code: '☷' },
    snow:         { fill: '#dbe7ef', inf: 2, veh: 2, cover: 'none',   sightBlock: false, name: '설원', code: '❄' },
    ice:          { fill: '#9ec4d5', inf: 2, veh: 1, cover: 'none',   sightBlock: false, name: '얼음 빙판', code: '◇' },
    desert:       { fill: '#c99f5e', inf: 2, veh: 2, cover: 'none',   sightBlock: false, name: '모래 사막', code: '〜' },
    dune:         { fill: '#b88942', inf: 2, veh: 3, cover: 'yellow', sightBlock: false, name: '사막 모래언덕', code: '▲' },
    field:        { fill: '#6e7a46', inf: 1, veh: 2, cover: 'none',   sightBlock: false, name: '경작지', code: '⁞' },
    bush:         { fill: '#3d6132', inf: 1, veh: 2, cover: 'yellow', sightBlock: false, name: '수풀림', code: '░' },
    forest:       { fill: '#1b3b19', inf: 2, veh: 3, cover: 'yellow', sightBlock: true,  name: '울창한 숲', code: '🌲' },
    hedge:        { fill: '#274b24', noBuild: true, inf: 2, veh: 2, cover: 'yellow', sightBlock: false, name: '산울타리(보카쥬)', code: '▓' },
    fence:        { fill: '#735738', noBuild: true, inf: 2, veh: 1, cover: 'yellow', sightBlock: false, name: '목재 울타리', code: '☲' },
    rubble:       { fill: '#45433e', inf: 1, veh: 3, cover: 'yellow', sightBlock: false, name: '건물 잔해', code: '∴' },
    crater:       { fill: '#372a1e', inf: 1, veh: 2, cover: 'yellow', sightBlock: false, name: '포탄 구덩이', code: '◌' },
    trench:       { fill: '#3a2d21', noBuild: true, inf: 1, veh: 3, cover: 'hard',   sightBlock: false, name: '방호 참호', code: '☲' },
    rock:         { fill: '#374151', noBuild: true, inf: 3, veh: Infinity, cover: 'hard', sightBlock: true, name: '바위 암벽', code: '▲▲' },
    building:     { fill: '#252930', noBuild: true, inf: 1, veh: Infinity, cover: 'hard', sightBlock: true, name: '석조 가옥', code: '⛊' },
    shallow_water:{ fill: '#3a7fa8', noBuild: true, inf: 2, veh: 3, cover: 'none',   sightBlock: false, name: '얕은 물/여울목', code: '≈' },
    deep_water:   { fill: '#143d66', noBuild: true, inf: Infinity, veh: Infinity, cover: 'none', sightBlock: false, name: '깊은 물(도하 불가)', code: '≋' }
  };


  // --- 연구 / 생산 규칙 ---
  const TECH = {
    cheap:   ['야전 축성술', '[스킬] 공병 건설 비용 -15%', 300, 1, 'hq'],
    heavy:   ['중전차 설계', '중전차 징집 해금 🔒', 700, 3, 'tank_depot']
  };
  let research = { blue: {}, red: {} }, queue = { blue: {}, red: {} };
  const counterMax = () => 1;
  // [V52] 분기형 티어: 청 T1a 병영 / T1b 중화기 지원소 → T2 차량 정비소 → T3 전차 공창
  //                    적 T1 보병 중대 → T2a 판처그레나디어 중대 / T2b 공군 중대 → T3 기갑 중대 (지원 요소 업그레이드 없음: 건설 즉시 징집)
  const BLD = { hq: { n: '사령부', s: 'HQ', tier: 0 }, outpost: { n: '전초 기지', s: 'OUT', tier: 0 },
    barracks: { n: '병영', s: 'T1', tier: 1, g: 80, f: 15, hp: 320, armor: 0, req: ['hq'], make: 'infantry' },
    support_center: { n: '중화기 지원소', s: 'T1b', tier: 1, g: 80, f: 15, hp: 350, armor: 0, req: ['hq'], make: 'heavy', only: 'blue' },
    motor_pool: { n: '차량 정비소', s: 'T2', tier: 2, g: 150, f: 50, hp: 400, armor: 0, req: ['barracks', 'support_center'], make: 'support' },
    air_coy: { n: '공군 중대', s: 'T2b', tier: 2, g: 150, f: 50, hp: 380, armor: 0, req: ['barracks'], make: 'heavy', only: 'red' },
    tank_depot: { n: '전차 공창', s: 'T3', tier: 3, g: 300, f: 135, hp: 480, armor: 0, req: ['motor_pool'], make: 'tank' },
    // [V53] 교리 지원소: 건설 = 교리 확정 (팀당 1종). 파괴되면 배틀그룹 능력·전용 유닛 징집 정지 (재건설 가능)
    doc_inf: { n: '보병 지원소', s: 'DI', tier: 0, g: 150, f: 40, hp: 350, armor: 0, req: ['hq'], make: 'infantry', doc: 'inf' },
    doc_mech: { n: '기갑 지원소', s: 'DM', tier: 0, g: 150, f: 40, hp: 350, armor: 0, req: ['hq'], make: 'tank', doc: 'mech' },
    doc_air: { n: '공수 지원소', s: 'DA', tier: 0, g: 150, f: 40, hp: 350, armor: 0, req: ['hq'], make: 'infantry', doc: 'air' } };
  const BLD_T = { red: { barracks: { n: '보병 중대' }, motor_pool: { n: '판처그레나디어 중대', s: 'T2a', g: 150, f: 40, hp: 370, req: ['barracks'] }, tank_depot: { n: '기갑 중대', g: 300, req: ['motor_pool', 'air_coy'] }, doc_inf: { n: '돌격 지원소' }, doc_air: { n: '공군 지원소' } } };
  const bd = (t, tm) => Object.assign({}, BLD[t], (BLD_T[tm] || {})[t]);
  const BLD_LIST = { blue: ['barracks', 'support_center', 'motor_pool', 'tank_depot'], red: ['barracks', 'motor_pool', 'air_coy', 'tank_depot'] };
  const reqOk = (tm, t) => { const r = bd(t, tm).req; return !r || r.some(x => buildings.some(b => b.team === tm && b.type === x && b.hp > 0 && !b.uc)); };
  const docList = tm => doctrine[tm] ? ['doc_' + doctrine[tm]] : ['doc_inf', 'doc_mech', 'doc_air'];
  const docAlive = tm => !!doctrine[tm] && buildings.some(b => b.team === tm && b.hp > 0 && b.type === 'doc_' + doctrine[tm]);
  const reqName = (tm, t) => (bd(t, tm).req || []).map(x => bd(x, tm).n).join(' 또는 ');
  const FORT = { trench: { n: '참호', g: 60 }, sandbag: { n: '샌드백', g: 60 }, mine: { n: '지뢰', g: 90 }, mg_bunker: { n: 'MG 벙커', g: 150 }, medic_bunker: { n: '메딕 벙커', g: 150 } };
  
  const VET_THRESHOLDS = [8, 25, 50];   // v139: −30 %

  // [VET-V45 BEGIN] 클래스별 베테랑 (베테랑 시스템 개선 계획서 4~8절)
  // VET_TABLE[클래스][별] = 해당 별까지의 "누적" 보너스. 진급 때마다 기본 스탯에서 다시 계산해 덮어쓴다 (반올림 오차 누적 없음).
  // 스탯: hpPct hpModel move sight range ammoPct ammoAdd atk(공격력) area(타격 범위) pen(관통) armorF(정면 장갑)   — v161
  // 훅  : recv(피격 명중) acc(명중) accFar(원거리 명중) rof supRes(제압 저항) supGive(제압 부여) critRes(궤도·화재 확률)
  //       cdAll cdGren cdSniper(재사용 −턴) camoDur repairPlus buildDisc mineDmg effic(수리·치료·보급) fuelUse ammoSave exec flameHard flameZone
  const VET_NONE = { recvDmg: 1, recv: 1, acc: 1, accFar: 1, rof: 1, supRes: 1, supGive: 1, critRes: 1, fuelUse: 1, ammoSave: 0, effic: 1, buildDisc: 0, mineDmg: 1, repairPlus: 0, camoDur: 0, cdAll: 0, cdGren: 0, cdSniper: 0, exec: 1, flameHard: 0, flameZone: 1 };
  const VET_CLASS_NAME = { A: '라인 보병', B: '정찰', C: '정예 보병', D: '공병', E: '대전차 보병', F: '저격수', G: '화염방사', H: '기관총', I: '곡사·로켓', J: '고정 대전차·대공', K: '주력·돌격 전차', L: '구축전차·돌격포', M: '경장갑·정찰 차량', N: '지원 차량' };
  const VET_TABLE = {
    A: [null, { recv: .9 }, { recv: .9, acc: 1.15, cdGren: 1 }, { recv: .8, acc: 1.15, cdGren: 1, hpModel: 3 }],
    B: [null, { sight: 1, camoDur: 1 }, { sight: 1, camoDur: 1, move: 1, recv: .9 }, { sight: 1, camoDur: 1, move: 1, recv: .9, hpPct: .15, acc: 1.1 }],
    C: [null, { supRes: .75 }, { supRes: .75, rof: 1.2, cdAll: 1 }, { supRes: .75, rof: 1.2, cdAll: 1, hpPct: .15, recv: .9 }],
    D: [null, { repairPlus: 1 }, { repairPlus: 1, repAmt: 10, buildDisc: .1 }, { repairPlus: 2, repAmt: 20, buildDisc: .2, hpPct: .15, mineDmg: 1.1 }],   // v139: repair amount
    E: [null, { pen: 1.1 }, { pen: 1.1, acc: 1.15 }, { pen: 1.1, acc: 1.15, atk: 1.15, hpPct: .12 }],
    F: [null, { cdSniper: 1 }, { cdSniper: 1, accFar: 1.2, supRes: .5 }, { cdSniper: 1, accFar: 1.2, supRes: .5, exec: 1.25 }],
    G: [null, { hpPct: .1 }, { hpPct: .1, atk: 1.15, flameZone: 1.15 }, { hpPct: .1, atk: 1.15, flameZone: 1.15, move: 1, flameHard: 1.35 }],
    H: [null, { supGive: 1.2 }, { supGive: 1.2, rof: 1.1, ammoAdd: 2 }, { supGive: 1.2, rof: 1.1, ammoAdd: 2, accFar: 1.1, hpPct: .15 }],
    I: [null, { ammoPct: .2 }, { ammoPct: .2, area: 1.1, supGive: 1.15 }, { ammoPct: .2, area: 1.1, supGive: 1.15, range: 1, hpPct: .2 }],
    J: [null, { accFar: 1.1 }, { accFar: 1.1, pen: 1.1 }, { accFar: 1.1, pen: 1.1, atk: 1.1, recv: .85 }],
    K: [null, { hpPct: .08 }, { hpPct: .08, pen: 1.1 }, { hpPct: .08, pen: 1.1, atk: 1.15, armorF: 1, critRes: .75 }],
    L: [null, { sight: 1 }, { sight: 1, pen: 1.1 }, { sight: 1, pen: 1.1, atk: 1.15, hpPct: .1 }],
    M: [null, { move: 1, sight: 1 }, { move: 1, sight: 1, recv: .9 }, { move: 1, sight: 1, recv: .9, hpPct: .15, acc: 1.1 }],   // v130: fuel saving → harder to hit
    N: [null, { effic: 1.25 }, { effic: 1.25, ammoSave: .15 }, { effic: 1.25, ammoSave: .15, hpPct: .15, move: 1 }]
  };
  const VET_DESC = {
    A: ['피격 명중 −10%', '명중 +15% · 수류탄류 재사용 −1턴', '분대원당 체력 +3 · 피격 명중 −20% (합계)'],
    B: ['시야 +1 · 위장 지속 +1턴', '이동 +1 · 피격 명중 −10%', '체력 +15% · 명중 +10%'],
    C: ['제압 누적 −25%', '연사 +20% · 스킬 재사용 −1턴', '체력 +15% · 피격 명중 −10%'],
    D: ['수리 횟수 +1 · 해체·회수 해금', '수리량 +10 · 건설 비용 −10% · 중간 등급 구조물 회수', '수리 횟수 +1 · 수리량 +20 (합계) · 건설 비용 −20% (합계) · 체력 +15% · 지뢰 피해 +10%'],
    E: ['관통력 +10%', '명중 +15%', '공격력 +15% · 체력 +12%'],
    F: ['정조준 재사용 −1턴', '원거리 명중 +20% · 제압 누적 −50%', '체력 50% 이하 보병에게 피해 ×1.25'],
    G: ['체력 +10%', '공격력·화염 지대 피해 ×1.15', '이동 +1 · 참호·가옥 소탕 ×1.35'],
    H: ['제압 부여 +20%', '연사 +10% · 최대 탄약 +2', '원거리 명중 +10% · 체력 +15%'],
    I: ['최대 탄약 +20%', '타격 범위 +10% · 제압 부여 +15%', '사거리 +1 · 체력 +20%'],
    J: ['원거리 명중 +10%', '관통력 +10%', '공격력 +10% · 피격 명중 −15%'],
    K: ['체력 +8%', '관통력 +10%', '공격력 +15% · 정면 장갑 +1 · 궤도 손상·엔진 화재 확률 −25%'],
    L: ['시야 +1', '관통력 +10%', '공격력 +15% · 체력 +10%'],
    M: ['이동 +1 · 시야 +1', '피격 명중 −10%', '체력 +15% · 명중 +10%'],
    N: ['수리·치료·보급 효율 +25%', '탄약 소모 −15%', '체력 +15% · 이동 +1']
  };
  const VET_ACC_ALL = .05;   // v142: every unit gains accuracy +5 % per star, multiplied with its class bonus
  Object.keys(VET_DESC).forEach(c => { VET_DESC[c] = VET_DESC[c].map((t, i) => t + ` · 공통 명중 +${5 * (i + 1)}%`); });
  const VET_CLASS_OF = {
    infantry: 'A', captain: 'A', scout: 'B', pathfinder: 'B',
    paratrooper: 'C', commando: 'C', ranger: 'C', jager: 'C', panzergren: 'C', fj: 'C', sturmtruppen: 'C',
    engineer: 'D', assault_eng: 'D', fp_pioneer: 'D', at_inf: 'E', sniper: 'F', flamer: 'G', hmg: 'H', hmg_50: 'H',
    mortar: 'I', howitzer: 'I', scott: 'I', priest: 'I', whizbang: 'I', nebel: 'I', wespe: 'I', wanze: 'L', pzb221: 'M', pz4cmd: 'K', stummel: 'M', amb251: 'N', hummel: 'I', pz3l: 'K',
    at_gun: 'J', m5gun: 'J', pack75: 'I', lg40: 'J', flak: 'J', flak38: 'J', flak36: 'J', obice210: 'I', sherman: 'K', bulldozer: 'K', easyeight: 'K', pershing: 'K', panzer4: 'K', brummbar: 'K', panther: 'K', tiger: 'K',
    m3gmc: 'L', tank_dest: 'L', stug: 'L', grant: 'K',
    weasel: 'M', vehicle: 'M', chaffee: 'M', stuart: 'M', m16: 'M', kettenkrad: 'M', puma: 'M', wirbelwind: 'M',
    ambulance: 'N', recovery: 'N', truck: 'N', transport: 'N', supply: 'N', bergepanzer: 'N'
  };
  const VET_MULT = { B: .8, D: .8, N: .8, C: 1.25, K: 1.25, L: 1.25 };   // 진급 임계 클래스 배수 (7-3)
  const vetCls = u => (u && (u.vetClass || VET_CLASS_OF[u.key])) || 'A';
  const vetV = u => (u && u.vet) || VET_NONE;
  const vetThr = u => { const VU = typeof vetU === 'function' ? vetU(u) : null; return VET_THRESHOLDS.map(x => Math.round(x * (VU ? VU.thrMul : (VET_MULT[vetCls(u)] || 1)))); };
  // 소수 절약량(연료·탄약·보급품)을 모았다가 1 이상이 되면 정수로 돌려준다
  function vetSave(u, key, amt) { u.vsv = u.vsv || {}; u.vsv[key] = (u.vsv[key] || 0) + (amt || 0); const k = Math.floor(u.vsv[key]); u.vsv[key] -= k; return k; }
  // 처치 XP = 대상 비용 ÷ 50 (반올림, 4~20). 구조물처럼 비용 숫자가 없으면 기존 8
  const killXp = v => (v && typeof v.cost === 'number') ? Math.max(4, Math.min(20, Math.round((v.val || v.cost) / 50))) : 8;   // v167: value incl. fuel
