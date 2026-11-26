  // [v162] Veterancy from the CoH3 data: every rank's modifiers stack on the ones before; the cumulative values are
  //   mapped onto the engine's veterancy keys. Promotion thresholds scale with the unit's CoH3 XP (riflemen 900 = ×1).
  const VET_RAW_BASE = 900;
  const vpct = m => (m >= 1 ? '+' : '−') + Math.round(Math.abs(m - 1) * 100) + '%';
  function vetFromRaw(t, V) {
    const c = { recv: 1, recvDmg: 1, acc: 1, rof: 1, atk: 1, pen: 1, supGive: 1, hp: 0, rngM: 0, rngMul: 1, sightM: 0, spd: 1, armF: 0, cd: 1, atkAdd: 0 };
    const tbl = [null], desc = [];
    V.ranks.forEach(rk => {
      const m = rk.mods || {}, d = [];
      const mul = (k, id, txt, inv) => { if (m[id] !== undefined) { const v = inv ? 1 / m[id] : m[id]; c[k] *= v; d.push(txt + ' ' + vpct(v)); } };
      mul('recv', 'RECEIVED_ACCURACY_MODIFIER', '피격 명중');
      mul('recvDmg', 'RECEIVED_DAMAGE_MODIFIER', '받는 피해');
      mul('acc', 'WEAPON_ACCURACY_MODIFIER', '명중');
      mul('rof', 'WEAPON_OVERALL_ATTACK_SPEED', '공격 속도', true);
      if (m.WEAPON_OVERALL_ATTACK_SPEED_MULT_ADD !== undefined) { const v = 1 / (1 + m.WEAPON_OVERALL_ATTACK_SPEED_MULT_ADD); c.rof *= v; d.push('공격 속도 ' + vpct(v)); }
      mul('rof', 'WEAPON_BURST_RATE_OF_FIRE_MODIFIER', '연사');
      mul('rof', 'WEAPON_BURST_DURATION_MODIFIER', '점사 길이');
      mul('atk', 'WEAPON_DAMAGE_MODIFIER', '피해');
      mul('pen', 'WEAPON_PENETRATION_MODIFIER', '관통');
      mul('supGive', 'WEAPON_SUPPRESSION_MODIFIER', '제압');
      mul('spd', 'SPEED_MODIFIER', '이동 속도');
      mul('cd', 'ABILITY_RECHARGE_MODIFIER', '스킬 재사용');
      mul('rngMul', 'WEAPON_RANGE_MULTIPLICATION_MODIFIER', '사거리');
      if (m.HEALTH_MODIFIER_ADDITION) { c.hp += m.HEALTH_MODIFIER_ADDITION; d.push(`체력 +${m.HEALTH_MODIFIER_ADDITION}${t.N ? '/인' : ''}`); }
      if (m.WEAPON_RANGE_MODIFIER) { if (m.WEAPON_RANGE_MODIFIER < 2) { c.rngMul *= m.WEAPON_RANGE_MODIFIER; d.push('사거리 ' + vpct(m.WEAPON_RANGE_MODIFIER)); } else { c.rngM += m.WEAPON_RANGE_MODIFIER; d.push(`사거리 +${m.WEAPON_RANGE_MODIFIER}m`); } }
      if (m.UNIT_SIGHT_MODIFIER) { c.sightM += m.UNIT_SIGHT_MODIFIER; d.push(`시야 +${m.UNIT_SIGHT_MODIFIER}m`); }
      if (m.FRONT_ARMOR_ADDITION) { c.armF += m.FRONT_ARMOR_ADDITION; d.push(`정면 장갑 +${m.FRONT_ARMOR_ADDITION}`); }
      if (m.WEAPON_DAMAGE_ADDITION_MODIFIER) { c.atkAdd += m.WEAPON_DAMAGE_ADDITION_MODIFIER; d.push(`피해 +${m.WEAPON_DAMAGE_ADDITION_MODIFIER}`); }
      const baseAtkRaw = t.raw ? t.atk / RAW.HPK : 0;
      const e = { recv: c.recv, recvDmg: c.recvDmg, acc: c.acc, rof: c.rof, supGive: c.supGive };
      const atkM = c.atk * (baseAtkRaw > 0 ? (baseAtkRaw + c.atkAdd) / baseAtkRaw : 1); if (atkM !== 1) e.atk = atkM;
      if (c.pen !== 1) e.pen = c.pen;
      if (c.hp) e.hpModel = c.hp * RAW.HPK;
      const rng = Math.round(c.rngM / RAW.HEX_M + (t.range || 0) * (c.rngMul - 1)); if (rng) e.range = rng;
      const sg = Math.round(c.sightM / RAW.HEX_M); if (sg) e.sight = sg;
      const mv = Math.round((t.move || 0) * (c.spd - 1)); if (mv) e.move = mv;
      if (c.armF) e.armorF = Math.round(c.armF * RAW.PENK * 100) / 100;
      if (c.cd < 1) e.cdAll = c.cd <= 0.5 ? 2 : 1;
      tbl.push(e); desc.push(d.join(' · ') || '능력 해금');
    });
    return { tbl, desc, thrMul: V.xp && V.xp[0] ? V.xp[0] / VET_RAW_BASE : 1 };
  }
  const vetU = u => { if (!u || !u.team || !u.key) return null; const R = UNIT_ROSTER[u.team] && UNIT_ROSTER[u.team][u.key]; if (!R || !R.rawVet) return null; if (!R.vetU) R.vetU = vetFromRaw(R, R.rawVet); return R.vetU; };
  function vetTraitsHtml(u) {
    const VU = vetU(u);
    if (VU) {
      const rows = VU.desc.map((t, i) => `<dt style="color:${u.rank > i ? '#fbbf24' : '#64748b'}">${'★'.repeat(i + 1)}</dt><dd style="color:${u.rank > i ? '#e2e8f0' : '#64748b'}">${t}</dd>`).join('');
      return `<div class="set-group"><h3>베테랑 특성 · CoH3 ${u.uniqueName || ''}</h3><dl class="legend">${rows}</dl><div class="sheet-note">진급 XP ${vetThr(u).join(' / ')}</div></div>`;
    }
    const c = vetCls(u), d = VET_DESC[c]; if (!d) return '';
    const rows = d.map((t, i) => `<dt style="color:${u.rank > i ? '#fbbf24' : '#64748b'}">${'★'.repeat(i + 1)}</dt><dd style="color:${u.rank > i ? '#e2e8f0' : '#64748b'}">${t}</dd>`).join('');
    return `<div class="set-group"><h3>베테랑 특성 · ${VET_CLASS_NAME[c]}</h3><dl class="legend">${rows}</dl><div class="sheet-note">진급 XP ${vetThr(u).join(' / ')}</div></div>`;
  }
  // [VET-V45 END]
  const HUB_G = 100, HUB_F = 15;   // legacy v58 values (unused since v59; see YIELD)
  // ── v59 zone-capture data (logic lives in section [17c]) ──
  const BASE_FUEL = 5, BASE_MUN = 10;                                                    // base income (new: +5 fuel)
  const YIELD = { vp: {}, manpower: { g: 70 }, fuel: { f: 12 }, fuel_minor: { f: 6 }, mun: { m: 14 } };   // v140: fuel −20 %   // per-turn yield by point class
  const CTRL_W = { manpower: 2, mun: 2, fuel: 2, fuel_minor: 1 };                       // resource-control weights (parity tiebreak only)
  const ZONE_R = { vp: 3, manpower: 2, fuel: 2, fuel_minor: 2, mun: 2 };                // zone radius by class (v128: 48×48 map, range-6 units)
  const ZONE_R_SMALL = { vp: 2, manpower: 1, fuel: 1, fuel_minor: 1, mun: 1 };          // legacy small test maps
  let MAP_PALETTE = {};                                                                  // per-map terrain colour override
  function canProd__base(b, key) {
    const t = UNIT_ROSTER[b.team][key];
    return !!t && b.hp > 0 && !b.crippled && (t.bld ? [].concat(t.bld).includes(b.type) : (BLD[b.type] && BLD[b.type].make === t.cat));   // v52: 유닛 bld 필드 기준 (HQ 포함)
  }

