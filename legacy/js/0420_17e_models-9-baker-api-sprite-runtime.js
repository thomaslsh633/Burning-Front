    // v115: crew-served weapons — one model per surviving head count (_c0 … _cN) + a travel / silhouette variant (_v: trails closed, no crew); the M7 Priest
    { const G = { g57: [buildG57, 5], g3in: [buildG3in, 6], g105: [buildG105, 4], g75p: [buildG75p, 5], m81: [buildM81, 4], m1919: [buildM1919, 4], m2hb: [buildM2HB, 4] };   // v116: full crews
      Object.keys(G).forEach(k => { const [f, n] = G[k]; for (let c = 0; c <= n; c++) MODELS[k + '_c' + c] = { build: p => f(p, { crew: c }), X0: 0, ant: [0, 0, 0, 0], gun: true };
        MODELS[k + '_v'] = { build: p => f(p, { crew: 0, spread: 0 }), X0: 0, ant: [0, 0, 0, 0], gun: true }; });
      MODELS.m7 = { build: buildM7, X0: .0, ant: [-.80, 1.10, 1.81, 3.20] }; MODELS.m7_v = { build: p => buildM7(p, { crew: 0 }), X0: .0, ant: [-.80, 1.10, 1.81, 3.20] };
      // v124: German vehicles
      MODELS.sdkfz2 = { build: buildSdKfz2, X0: .30, ant: [-1.08, .40, .88, 1.62] };
      MODELS.wanze = { build: buildWanze, X0: .0, ant: [-1.60, .62, 1.30, 2.60] };
      MODELS.blitz = { build: p => buildOpelBlitz(p, false), X0: -.33, ant: [.40, -.70, 2.18, 2.95] };
      MODELS.blitzamb = { build: p => buildOpelBlitz(p, true), X0: -.33, ant: [.40, -.70, 2.18, 2.95] };
      MODELS.pzb221 = { build: p => buildSdKfz221(p, { pzb: true }), X0: .0, ant: [-2.00, .80, 1.46, 2.35], tp: [-.22, 0, 1.585] };
      MODELS.pz4cmd = { build: p => buildPanzer4b(p, { cmd: true }), X0: .35, ant: [.62, -.70, 1.77, 3.05], tp: [-.10, .067, 1.66] };
      // v126: Sd.Kfz. 251/9 Stummel, 251/8 ambulance, Hummel, Pz III L
      MODELS.stummel = { build: p => buildSdKfz251D(p, 'stummel'), X0: .0, ant: [-2.20, -.62, 1.83, 2.95] };
      MODELS.amb251 = { build: p => buildSdKfz251D(p, 'amb'), X0: .0, ant: [-2.10, .62, 2.10, 2.95] };
      MODELS.hummel = { build: buildHummel, X0: .10, ant: [-2.80, -1.10, 2.30, 3.50] };
      MODELS.pz3l = { build: buildPanzer3L, X0: .30, ant: [-1.10, -1.00, 1.64, 3.40], tp: [.30, 0, 1.635] };
      // v118: German crew-served weapons
      const GD = { nbw: [buildNbW, 4], flak36: [buildFlak36, 6], flak38: [buildFlak38, 4], obice210: [buildObice210, 6], grw34: [(p, o) => { V118DE.on = true; try { return buildM81(p, o); } finally { V118DE.on = false; } }, 4], mg42: [buildMG42, 4], flak30: [buildFlak30, 5], lg40: [buildLG40, 5], pak40: [buildPak40, 5], sfh18: [buildSFH18, 4] };
      Object.keys(GD).forEach(k => { const [f, n] = GD[k]; for (let c = 0; c <= n; c++) MODELS[k + '_c' + c] = { build: p => f(p, { crew: c }), X0: 0, ant: [0, 0, 0, 0], gun: true };
        MODELS[k + '_v'] = { build: p => f(p, { crew: 0, spread: 0 }), X0: 0, ant: [0, 0, 0, 0], gun: true }; });
      const OV = { nbw: .22, flak36: 0, flak38: 0, obice210: 0 };   // v122: as drawn, for the blueprint overlays
      Object.keys(OV).forEach(k => { const f = GD[k][0]; MODELS[k + '_o'] = { build: p => f(p, { crew: 0, spread: 0, elev: OV[k] }), X0: 0, ant: [0, 0, 0, 0], gun: true }; }); }
    // v112: crews in the open M3 half-tracks, then white Allied stars on every US (olive) model — [x, z, R] sides · [x, y, R, 'top'] · [y, z, R, 'front'|'rear']
    { const crewHT = (M, k) => {
        v112Crew(M, 'us_carbine_sith_light', .30, .40, .62, 0); v112Crew(M, 'us_carbine_rideh_light', .30, -.40, .62, 0);
        if (k === 'm3ht') { v112Crew(M, 'us_carbine_gunh_light', -1.25, 0, .98, 0); v112Crew(M, 'us_garand_rideb_light', -1.60, .74, .98, -Math.PI / 2); v112Crew(M, 'us_garand_rideb_light', -2.30, .74, .98, -Math.PI / 2); v112Crew(M, 'us_carbine_rideb_light', -1.95, -.74, .98, Math.PI / 2); }
        if (k === 'm16') v112Crew(M, 'us_carbine_sitq_light', -1.90, 0, 1.92, 0);
        if (k === 'm3gmc') { v112Crew(M, 'us_carbine_sgun_light', -1.15, .55, .98, 0); v112Crew(M, 'us_carbine_sload_light', -1.25, -.55, .98, .3); }   // v117: layer + loader
      };
      // v113: no stars on tank engine decks; trucks / half-tracks keep the hood star
      const ST = { m24: [[-.45, 1.92, .22], [.50, 1.30, .13, 'front']], m3lee: [[-.55, 1.62, .32]], m31: [[-.55, 1.62, .30]],
        jeep: [[-1.05, .80, .17]], m29: [[.55, 1.05, .22], [0, 1.05, .17, 'front']], cckw: [[.75, 1.30, .20], [2.20, 0, .24, 'top']], m3amb: [[.45, 1.12, .18]], m7: [[-1.60, 1.38, .30]],
        sherman: [[-.30, 1.55, .32]], easyeight: [[-.30, 1.55, .32]], bulldozer: [[-.30, 1.55, .32]], whizbang: [[-.30, 1.55, .32]],
        pershing: [[-.40, 1.45, .32]], m5: [[-.30, 1.20, .25]], m18: [[-.30, 1.30, .28]],
        m8grey: [[-.40, 1.25, .25]], m8hmc: [[-.30, 1.20, .25]],
        m3ht: [[-1.40, 1.45, .26], [1.80, 0, .24, 'top']], m16: [[-1.40, 1.45, .26], [1.80, 0, .24, 'top']], m3gmc: [[-1.40, 1.45, .26], [1.80, 0, .24, 'top']] };
      Object.keys(ST).forEach(k => { if (!MODELS[k]) return; const b = MODELS[k].build;
        MODELS[k].build = p => { const M = b(p); if (k === 'm3ht' || k === 'm16' || k === 'm3gmc') crewHT(M, k); if (p === 'olive') v112Stars(M, ST[k]); return M; }; }); }
    // v133: Balkenkreuz on the German vehicles — [x, z, R] on both sides (rays along ∓Y) · [x, y, R, 'top'] · [y, z, R, 'rear']
    { const BK = h => [[h, 1], [h, h], [1, h], [1, -h], [h, -h], [h, -1], [-h, -1], [-h, -h], [-1, -h], [-1, h], [-h, h], [-h, 1]];
      const V133_BK = { panther: [[-1.9, 1.45, .32]], panzer4: [[-1.0, 1.25, .30]], pz4cmd: [[-1.4, 1.25, .30]], pz3l: [[-.9, 1.3, .18]], brummbar: [[.4, 1.75, .38]], stug3g: [[-.4, 1.10, .26]],
        wirbelwind: [[1.4, 1.30, .25]], marder3m: [[-1.6, 1.45, .30]], sdkfz221: [[.2, .78, .16]], pzb221: [[.2, .78, .16]], sdkfz251: [[.2, 1.20, .26]],
        stummel: [[.6, 1.20, .24]], wespe: [[-1.4, 1.50, .30]], hummel: [[-.9, 1.75, .30]], bergepanther: [[-.5, 1.40, .32]] };
      const balk = (M, nT, o, d, R, up) => { const wh = M.mat([228, 228, 220], { spec: .05, noise: .3, dirt: .5 }), bl = M.mat([22, 24, 26], { spec: .05, noise: 0, dirt: .3 });
        v112Decal(M, nT, o, d, R, BK(.402), wh, up, .012); v112Decal(M, nT, o, d, R, BK(.212), bl, up, .022); };
      Object.keys(V133_BK).forEach(k => { if (!MODELS[k]) return; const b = MODELS[k].build;
        MODELS[k].build = p => { const M = b(p); if (p !== 'grey') return M; const nT = M.M.length;
          V133_BK[k].forEach(s => { if (s[3] === 'top') balk(M, nT, [s[0], s[1], 8], [0, 0, -1], s[2], [1, 0, 0]); else if (s[3] === 'rear') balk(M, nT, [-8, s[0], s[1]], [1, 0, 0], s[2], [0, 0, 1]);
            else for (const sy of [-1, 1]) balk(M, nT, [s[0], sy * 6, s[1]], [0, -sy, 0], s[2], [0, 0, 1]); });
          return M; }; }); }
    // ══════════════════════════════════════════════════════════════
    // v117 — crews on every tank (commander up in the cupola with binoculars, or on the roof MG's grips) and in the open-topped vehicles
    //        (gunner at the sight, loader with a round, MG gunner on the ring / pintle); positions and floor / hatch heights read off each
    //        model's roof height map. Entries: [figure, x, y, floor z, yaw]; the figure's floor point sits .90 under the hatch top so the
    //        belt line shows at the rim. Icons are baked with NC.on (no crew).
    // ══════════════════════════════════════════════════════════════
    { const st = (name, hands, lean) => { V7POSES[name] = Object.assign({}, V7STAND, { lean: lean == null ? .08 : lean, twist: 0, hands, el: [[-.3, -.9, -1], [-.3, .9, -1]], head: [.03, 0, .14], pitch: .02 }); };
      st('hatch', [[.26, -.20, .97], [.26, .20, .97]], .10);                 // standing in a hatch, hands on the rim
      v112GunPose('mgsh', .25, 1.19);                                          // Sherman: commander on the .50 behind the cupola
      v112GunPose('mgst', .25, .96);                                           // StuG III: loader behind the MG 34 shield
      v112GunPose('mga', .26, 1.08);                                           // M18: .50 on the rear ring, trained aft
      v112GunPose('mgm', .26, 1.15);                                           // M8: .50 on the turret ring
      v112GunPose('mgh', .25, 1.00);                                           // Sd.Kfz. 251: MG 34 behind the front shield
    }
    const V117_CREW = (() => { const U = p => 'us_carbine_' + p + '_light+cmd', G = (w, p) => 'de_' + w + '_' + p + '_light+jag', PI = Math.PI;
      return {
        sherman: [[U('mgsh'), -.80, -.50, 1.82]], bulldozer: [[U('mgsh'), -.80, -.50, 1.82]], whizbang: [[U('binoc'), -.38, -.50, 1.82]],
        easyeight: [[U('binoc'), -.12, -.44, 1.97]], pershing: [[U('binoc'), .25, -.66, 1.67]], m24: [[U('binoc'), -.06, .36, 1.51]],
        m5: [[U('binoc'), .33, .40, 1.55]], m3lee: [[U('binoc'), -.40, .66, 2.10]], m31: [[U('hatch'), -.30, .40, 1.93]],
        tiger: [[G('mp40', 'binoc'), -.40, .45, 1.95]], panther: [[G('mp40', 'binoc'), -.71, .35, 2.08]], panzer4: [[G('mp40', 'binoc'), -.68, .06, 1.73]], pz4cmd: [[G('mp40', 'binoc'), -.68, .06, 1.73], [G('k98', 'hatch'), .17, -.20, 1.30]],
        stug3g: [[G('mp40', 'binoc'), -.14, .53, 1.17], [G('k98', 'mgst'), -.52, -.57, 1.07]], brummbar: [[G('mp40', 'binoc'), -.41, .65, 1.68]],
        sdkfz231: [[G('mp40', 'hatch'), .50, .20, 1.46]], pzb221: [[G('mp40', 'pzbgun'), -.55, .10, .93]], stummel: [[G('mp40', 'sgun'), -.72, -.06, 1.02], [G('k98', 'sload'), -1.40, .40, 1.02, .3]],
        hummel: [[G('mp40', 'sgun'), -1.05, .62, 1.30], [G('k98', 'sload'), -1.80, -.40, 1.30, .3], [G('mp40', 'binoc'), -2.50, .45, 1.30]], pz3l: [[G('mp40', 'binoc'), -.23, 0, 1.47]], sdkfz221: [[G('mp40', 'hatch'), -.30, .05, .93]], bergepanther: [[G('mp40', 'binoc'), -.80, -.50, 1.55]],
        // open-topped: gunner at the sight, loader with a round, commander / MG gunner
        m18: [[U('sgun'), .55, .42, 1.10], [U('sload'), .20, -.42, 1.20, .3], [U('mga'), -.15, .60, 1.45, PI]],
        m8hmc: [[U('sgun'), .20, .42, 1.15], [U('sload'), .05, -.48, 1.15, .3], [U('binoc'), -.45, .35, 1.30]],
        m8grey: [[U('mgm'), -.04, -.10, 1.35], [U('binoc'), -.20, .40, .95]],
        wirbelwind: [[G('mp40', 'sitq'), -.75, 0, 1.78], [G('k98', 'sload'), -.30, .62, 1.78, -.3], [G('k98', 'sload'), -.30, -.62, 1.78, .3]],
        marder3m: [[G('mp40', 'sgun'), -1.35, .35, .92], [G('k98', 'sload'), -1.60, -.35, .92, .3], [G('mp40', 'binoc'), -2.05, .25, .92]],   // sunk so the walls reach the chest
        wespe: [[G('mp40', 'sgun'), -.95, .45, .78], [G('k98', 'sload'), -1.35, -.40, .78, .3], [G('mp40', 'binoc'), -2.00, .20, .78]],
        sdkfz251: [[G('k98', 'mgh'), .00, 0, 1.02], [G('k98', 'rideb'), -1.20, .62, .91, -PI / 2], [G('k98', 'rideb'), -1.90, -.62, .91, PI / 2]]
      }; })();
    Object.keys(V117_CREW).forEach(k => { if (!MODELS[k]) return; const b = MODELS[k].build;
      MODELS[k].build = p => { const M = b(p); V117_CREW[k].forEach(([f, x, y, z, yaw]) => v112Crew(M, f, x, y, z, yaw || 0)); return M; }; });
    function projectPoint(view, yaw, X0, S, X, Y, Z) {
      const lx = X - X0, ly = -Y, c = Math.cos(yaw), s = Math.sin(yaw), wx = lx * c - ly * s, wy = lx * s + ly * c;
      return [(view.a1 * wx + view.a2 * wy) * S, (view.b1 * wx + view.b2 * wy - view.b3 * Z) * S];
    }
    return { NC: V117NC, Mesh, MODELS, build, buildSoldier, buildTiger, buildPanther, buildPanzer4, buildBrummbar, buildWirbelwind, buildSherman, buildEasyEight, buildShermanDozer, buildWhizbang, buildPershing, renderMesh, bakeCell, viewFor, lightFor, projectPoint, mkCanvas };
  })();

  // ---- runtime: lazy per-direction bake + cache (hi = 4 px per game px, lo = 2 px) ----
  const TANK_SPR = {
    on: true, N: 24, B: 4, S: 4, W: 64, H: 48, PX: 32, PY: 30, SS: 2,
    models: TankBaker.MODELS,                   // unit key → { build, X0 (pivot shift), ant (antenna base/tip) }; add sherman/… in TankBaker.MODELS
    cache: new Map(), meshes: new Map(), view: null, light: null, sig: '', warmed: {},
    paintOf: team => team === 'blue' ? 'olive' : 'grey',
    alias: { red: { kettenkrad: 'sdkfz2', supply: 'blitz', ambulance: 'blitzamb', vehicle: 'sdkfz221', transport: 'sdkfz251', tank_dest: 'marder3m', puma: 'sdkfz231', stug: 'stug3g', bergepanzer: 'bergepanther' },
             blue: { vehicle: 'm8grey', transport: 'm3ht', tank_dest: 'm18', chaffee: 'm24', grant: 'm3lee', recovery: 'm31', truck: 'jeep', weasel: 'm29', supply: 'cckw', ambulance: 'm3amb', priest: 'm7', stuart: 'm5', scott: 'm8hmc' } },   // v112
    mkey(u) { const a = (this.alias[u.team] || {})[u.key] || u.key; return this.models[a] ? a : null; },   // model key for a unit (null → old prism art)
    ensureView() {
      const sig = ANG + ',' + TILT;
      if (sig !== this.sig) { this.sig = sig; this.cache.clear(); this.warmed = {}; this.view = TankBaker.viewFor(ANG, Math.asin(Math.min(.99, TILT))); this.light = TankBaker.lightFor(ANG); }
    },
    idx(fa) { const n = this.N; return ((Math.round(fa / (6.283185307 / n)) % n) + n) % n; },
    yaw(i) { return i * 6.283185307 / this.N; },
    get(key, team, fa) {
      this.ensureView();
      const paint = this.paintOf(team), i = this.idx(fa), ck = key + '|' + paint + '|' + i;
      let e = this.cache.get(ck); if (e) return e;
      let mesh = this.meshes.get(key + paint); if (!mesh) { mesh = TankBaker.build(key, paint); this.meshes.set(key + paint, mesh); }
      const B = this.B, hi = TankBaker.bakeCell(mesh, { yaw: this.yaw(i), X0: this.models[key].X0, S: this.S * B, ss: this.SS, W: this.W * B, H: this.H * B, px: this.PX * B, py: this.PY * B, view: this.view, L: this.light });
      const lo = TankBaker.mkCanvas(this.W * B / 2, this.H * B / 2), lc = lo.getContext('2d'); lc.imageSmoothingEnabled = true; lc.imageSmoothingQuality = 'high'; lc.drawImage(hi, 0, 0, lo.width, lo.height);
      e = { hi, lo }; this.cache.set(ck, e); return e;
    },
    // v182: hull-only / turret-only sprites for the split pilot (null until baked, the caller then draws the whole sprite)
    getPart(key, team, i, part, make) {
      const paint = this.paintOf(team), ck = key + '|' + paint + '|' + i + '|' + part, e = this.cache.get(ck); if (e || !make) return e || null;
      let mesh = this.meshes.get(key + paint); if (!mesh) { mesh = TankBaker.build(key, paint); this.meshes.set(key + paint, mesh); }
      const B = this.B, t0 = performance.now(), tur = part === 't';
      const hi = TankBaker.bakeCell(mesh, { yaw: this.yaw(i), X0: this.models[key].X0, S: this.S * B, ss: this.SS, W: this.W * B, H: this.H * B, px: this.PX * B, py: this.PY * B, view: this.view, L: this.light, part: tur ? 'turret' : 'hull', shadow: tur ? false : undefined, rim: .32 });
      const lo = TankBaker.mkCanvas(this.W * B / 2, this.H * B / 2), lc = lo.getContext('2d'); lc.imageSmoothingEnabled = true; lc.imageSmoothingQuality = 'high'; lc.drawImage(hi, 0, 0, lo.width, lo.height);
      const r = { hi, lo }; this.cache.set(ck, r); this.splitMs = (this.splitMs || 0) + performance.now() - t0; this.splitN = (this.splitN || 0) + 1; return r;
    },
    // fill the remaining directions one per idle tick so turning never stalls the frame
    warm(key, team) {
      const k = key + team; if (this.warmed[k]) return; this.warmed[k] = 1;
      let i = 0, ph = 0, sp = !!this.models[key].tp && (typeof V182 === 'undefined' || V182.on); const step = () => { if (this.warmed[k] !== 1) return;
        if (i < this.N) { this.get(key, team, this.yaw(i)); i++; return void setTimeout(step, 35); }
        if (sp && ph < this.N * 2) { this.getPart(key, team, ph >> 1, (ph & 1) ? 't' : 'h', true); ph++; setTimeout(step, 35); } };
      setTimeout(step, 250);
    }
  };
  
  /* drawUnitArt: layer moved to js/chains/drawUnitArt.js */


  // ---- v96 infantry: per-man 2.5D figures (baked like the tanks, 24 directions, hi + lo mip) composed into the squad formation; the alive model count sets the head count ----
  const INF_SPR = {
    on: true, S: 6, B: 4, W: 24, H: 30, PX: 12, PY: 26, SS: 2,                 // v98: baked at 1.5x the vehicle scale (6 px/m); drawn at v98InfScale()/1.5 (true scale at max zoom)
    squads: {                                                                   // v104: every infantry squad (figure id: nat_weapon_pose[_outfit+gear])
      blue: { infantry: ['us_garand_stand', 'us_garand_kneel', 'us_bar_walk', 'us_garand_walk', 'us_garand_kneel', 'us_garand_stand'], scout: ['us_carbine_walk_light', 'us_carbine_binoc_light', 'us_carbine_kneel_light'], engineer: ['us_garand_walk', 'us_garand_kneel_satchel', 'us_carbine_walk_satchel', 'us_garand_stand'], captain: ['us_carbine_point_off', 'us_carbine_walk_radio', 'us_thompson_walk'], at_inf: ['us_bazooka_shoulder', 'us_garand_kneel_rocket', 'us_garand_walk', 'us_carbine_stand'], sniper: ['us_m1903_prone_light'], pathfinder: ['us_thompson_walk_para', 'us_carbine_kneel_para', 'us_carbine_walk_para+radio', 'us_thompson_kneel_para'], paratrooper: ['us_thompson_walk_para', 'us_garand_kneel_para', 'us_bar_walk_para', 'us_garand_walk_para', 'us_garand_kneel_para', 'us_carbine_stand_para'], assault_eng: ['us_thompson_walk', 'us_detector_sweep', 'us_thompson_kneel_satchel', 'us_garand_walk_satchel', 'us_thompson_aim'], commando: ['us_thompson_walk_cmd', 'us_thompson_kneel_cmd', 'us_bar_walk_cmd', 'us_carbine_walk_cmd', 'us_thompson_aim_cmd', 'us_garand_stand_cmd'], ranger: ['us_thompson_walk_rgr', 'us_bar_kneel_rgr', 'us_garand_walk_rgr', 'us_garand_aim_rgr'] },
      red: { infantry: ['de_k98_stand', 'de_k98_kneel', 'de_mg42_carry', 'de_k98_walk', 'de_k98_kneel', 'de_k98_stand'], engineer: ['de_k98_walk', 'de_k98_kneel_satchel', 'de_mp40_walk_satchel'], at_inf: ['de_pschreck_shoulder', 'de_k98_kneel_rocket', 'de_k98_walk', 'de_mp40_stand'], sniper: ['de_g43_prone_camo'], fp_pioneer: ['de_fg42_walk_fj', 'de_mp40_kneel_fj+satchel', 'de_mp40_walk_fj', 'de_k98_kneel_fj'], jager: ['de_mp40_walk_jag', 'de_k98_kneel_jag', 'de_k98_walk_jag', 'de_k98_aim_jag', 'de_k98_stand_jag'], panzergren: ['de_stg44_walk', 'de_mg42_carry', 'de_k98_kneel', 'de_stg44_kneel', 'de_k98_walk'], fj: ['de_fg42_walk_fj', 'de_k98_kneel_fj', 'de_mp40_walk_fj', 'de_fg42_aim_fj'], sturmtruppen: ['de_stg44_walk_st', 'de_stg44_kneel_st', 'de_stg44_aim_st', 'de_mp40_walk_st'] }
    },
    FORM: [[8, 0], [2, -7], [2, 7], [-5, -3.5], [-5, 3.5], [-11, 0]],         // wedge: leader front, then pairs (local px, +a = facing)
    cache: new Map(), meshes: new Map(), sig: '', warmed: {},
    get(fig, fa) {
      TANK_SPR.ensureView(); if (this.sig !== TANK_SPR.sig) { this.sig = TANK_SPR.sig; this.cache.clear(); this.warmed = {}; }
      const i = TANK_SPR.idx(fa), ck = fig + '|' + i; let e = this.cache.get(ck); if (e) return e;
      let mesh = this.meshes.get(fig); if (!mesh) { mesh = TankBaker.buildSoldier(fig); this.meshes.set(fig, mesh); }
      const B = this.B, hi = TankBaker.bakeCell(mesh, { yaw: TANK_SPR.yaw(i), X0: 0, S: this.S * B, ss: this.SS, W: this.W * B, H: this.H * B, px: this.PX * B, py: this.PY * B, view: TANK_SPR.view, L: TANK_SPR.light });
      const lo = TankBaker.mkCanvas(this.W * B / 2, this.H * B / 2), lc = lo.getContext('2d'); lc.imageSmoothingEnabled = true; lc.imageSmoothingQuality = 'high'; lc.drawImage(hi, 0, 0, lo.width, lo.height);
      e = { hi, lo }; this.cache.set(ck, e); return e;
    },
    warm(figs) {                                                                // remaining directions one per idle tick
      const todo = [...new Set(figs)].filter(f => !this.warmed[f]); if (!todo.length) return; todo.forEach(f => this.warmed[f] = 1);
      let n = 0; const step = () => { if (n >= todo.length * TANK_SPR.N) return; const f = todo[n % todo.length], i = (n / todo.length) | 0; if (this.warmed[f] === 1) this.get(f, TANK_SPR.yaw(i)); n++; setTimeout(step, 30); };
      setTimeout(step, 300);
    }
  };
  
  /* drawUnitArt: layer moved to js/chains/drawUnitArt.js */


