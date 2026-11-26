// CoH3 records → Burning Front data forms (docs/data-labels.md). Pure functions: CoH3 record + settings in, record out,
// plus `notes` describing every value that was guessed, defaulted or dropped. Used by tools/import-coh3/import.js.
import { fireRate } from './fire-rate.js';
import { classOf } from './indirect.js';
import { EXT, avg, r2, isTrue, last } from '../lib/coh3.js';

const band = (o, f = r2) => (o ? { near: f(o.near ?? 0), mid: f(o.mid ?? 0), far: f(o.far ?? 0) } : null);
const turnsOf = (s, scale) => Math.max(0, Math.ceil((s ?? 0) / scale.seconds_per_turn));
const nonOne = mods => Object.fromEntries(Object.entries(mods).filter(([, v]) => v != null && Math.abs(v - 1) > 1e-9));

const COVER = { tp_defcover: 'none', tp_light_cover: 'light', tp_heavy_cover: 'heavy', tp_garrison_cover: 'garrison',
  tp_trench_cover: 'trench', tp_smoke_cover: 'smoke', tp_water_cover: 'water', tp_negative_cover: 'negative' };
const modsOf = m => nonOne({ accuracy: m.accuracy_multiplier, damage: m.damage_multiplier, penetration: m.penetration_multiplier ?? m['penetration_ multiplier'], suppression: m.suppression_multiplier });
const INDIRECT_CATS = ['mortar', 'light_artillery', 'heavy_artillery'];

/** Chance a shell lands within the target hex (radius ≈ metres per hex / 2): scatter ellipse at distance d (CoH3 metres),
 *  lateral half-axis d · tan(angle / 2), longitudinal min(d · ratio, max); uniform over the ellipse. */
export function hexHitChance(scatter, d, metresPerHex) {
  const r = metresPerHex / 2;
  const lat = d * Math.tan(((scatter?.angle_scatter ?? 0) / 2) * Math.PI / 180);
  const lon = Math.min(d * (scatter?.distance_scatter_ratio ?? 0), scatter?.distance_scatter_max ?? 0);
  const a = Math.max(lat, r), b = Math.max(lon, r);
  return r2(Math.min(1, (r * r) / (a * b)));
}

/** Keep only the modules the category profile allows; report the rest. */
export function applyProfile(record, profiles, kind, category, notes) {
  const p = profiles[kind], prof = p.categories[category];
  for (const m of p.modules) {
    if (!(m in record)) continue;
    if (!prof.must.includes(m) && !prof.may.includes(m)) { delete record[m]; notes.push(`dropped module ${m} (not allowed for ${category})`); }
  }
  return prof.must.filter(m => !(m in record));
}

export function convertWeapon(bag, { id, category, ref, cfg, vocab, profiles, flags }) {
  const notes = [];
  const scale = cfg.scale;
  const fr = fireRate(bag, category, cfg, id);
  const indirect = INDIRECT_CATS.includes(category);
  const cls = indirect ? classOf(id, cfg.indirect) : null;
  const rec = { coh3_ref: ref, class: bag.weapon_class, fire_rule: fr.rule, damage: Math.round(avg(bag.damage)),
    damage_type: bag.damage?.damage_type, penetration: band(bag.penetration, Math.round) };
  if (bag.weapon_class === 'dummy') notes.push('dummy weapon class');
  // vs_target: CoH3 target_type_table keyed by unit type
  const vt = {};
  for (const t of bag.target_type_table || []) {
    const tm = t.target_unit_type_multipliers, mods = modsOf(tm.weapon_multipliers || {});
    if (!Object.keys(mods).length) continue;
    if (vocab.lists.unit_tags.includes(tm.unit_type)) vt[tm.unit_type] = mods; else notes.push(`vs_target ${tm.unit_type} dropped (not in vocab)`);
  }
  if (Object.keys(vt).length) rec.vs_target = vt;
  const traits = flags.filter(f => f.test(bag)).map(f => f.id);
  if (traits.length) rec.traits = traits;

  if (fr.rule !== 'per_use' && fr.rule !== 'ability') {
    const maxM = bag.range?.max ?? 0, minM = bag.range?.min ?? 0;
    const range = indirect && fr.range_hex != null ? { min: fr.min_range_hex, max: fr.range_hex }
      : { min: Math.round(minM / scale.metres_per_hex), max: Math.round(maxM / scale.metres_per_hex) + scale.direct_range_bonus_hex };   // SPEC §1
    const l = bag.tracking?.normal?.max_left ?? -180, r = bag.tracking?.normal?.max_right ?? 180;
    const vc = {};
    for (const [k, name] of Object.entries(COVER)) { const m = bag.cover_table?.[k]; if (m) { const mm = modsOf(m); if (Object.keys(mm).length) vc[name] = mm; } }
    // CoH3 artillery has no accuracy (it hits by scatter): accuracy = chance to land on the target hex at each band's distance
    const dist = { near: bag.range?.distance?.near ?? 0, mid: bag.range?.distance?.mid ?? 0, far: (bag.range?.distance?.far ?? -1) < 0 ? maxM : bag.range.distance.far };
    const acc = indirect && !((bag.accuracy?.near ?? 0) > 0) ? band(Object.fromEntries(Object.entries(dist).map(([k, d]) => [k, hexHitChance(bag.scatter, d, scale.metres_per_hex)]))) : band(bag.accuracy);
    if (indirect && !((bag.accuracy?.near ?? 0) > 0)) notes.push('accuracy derived from scatter (chance to land on the hex)');
    rec.attack = { fire_mode: indirect ? 'indirect' : 'direct', accuracy: acc, range_hex: range,
      shots_per_turn: fr.shots_per_turn, damage_per_shot: fr.damage_per_shot,
      ...(fr.multiplier && fr.multiplier !== 1 ? { shot_multiplier: fr.multiplier } : {}),
      ...(Object.values(fr.accuracy_scale || {}).some(v => v !== 1) ? { accuracy_scale: fr.accuracy_scale } : {}),
      arc_deg: Math.min(360, Math.round(r - l)),
      ...(Object.keys(vc).length ? { vs_cover: vc } : {}),
      ...(Object.keys(modsOf(bag.suppression?.target_suppressed_multipliers || {})).length ? { vs_suppressed: modsOf(bag.suppression.target_suppressed_multipliers) } : {}),
      ...(Object.keys(modsOf(bag.suppression?.target_pinned_multipliers || {})).length ? { vs_pinned: modsOf(bag.suppression.target_pinned_multipliers) } : {}) };
    rec.ammo = { per_shot: 1 };
  }
  const ae = bag.area_effect;
  if ((ae?.area_info?.outer_radius ?? 0) > 0) {
    rec.aoe = { damage: band(ae.damage), distance_m: band(ae.distance), suppression: band(ae.suppression),
      max_members: ae.damage_max_members_per_squad ?? -1, friendly_fire: isTrue(ae.has_friendly_fire) };
  }
  if ((bag.scatter?.angle_scatter ?? 0) > 0) rec.scatter = { angle_deg: bag.scatter.angle_scatter, distance_ratio: bag.scatter.distance_scatter_ratio, distance_max_m: bag.scatter.distance_scatter_max };
  if ((bag.suppression?.amount ?? 0) > 0) rec.suppression = { amount: bag.suppression.amount, nearby_mult: bag.suppression.nearby_suppression_multiplier ?? 0,
    nearby_radius_m: bag.suppression.nearby_suppression_radius ?? 0, ...(fr.suppression_scale && fr.suppression_scale !== 1 ? { scale: fr.suppression_scale } : {}) };
  if (isTrue(bag.deflection?.has_deflection_damage)) rec.deflection = { damage_ratio: bag.deflection.deflection_damage_multiplier };
  if (fr.reload_turns > 0) rec.reload = { turns: fr.reload_turns };
  if (isTrue(bag.behaviour?.non_moving_setup)) rec.emplace = { required: true, ...scale.emplace, faces_target: isTrue(bag.behaviour?.non_moving_setup_requires_facing) };
  if (bag.moving) rec.moving = { can_fire: isTrue(bag.moving.can_fire_while_moving), accuracy: bag.moving.accuracy_multiplier ?? 1 };
  if (category === 'mine') rec.trigger = { on: 'enter_hex' };
  if (category === 'grenade' || category === 'aircraft' || category === 'smoke' || fr.rule === 'ability') rec.use = { by_ability: true };
  if (cls && fr.indirect_class) rec.indirect = { class: fr.indirect_class, usage_turns: cls.usage_turns, spread_hex: fr.spread_hex,
    min_range_hex: fr.min_range_hex, range_hex: fr.range_hex };

  const missing = applyProfile(rec, profiles, 'weapon', category, notes);
  for (const m of missing) {
    if (m === 'deflection') { rec.deflection = { damage_ratio: 0 }; notes.push('deflection defaulted to 0 (CoH3: no deflection damage)'); }
    else if (m === 'emplace') { rec.emplace = { required: true, ...scale.emplace }; notes.push('emplace defaulted (category requires it)'); }
    else if (m === 'scatter') { rec.scatter = { angle_deg: 0, distance_ratio: 0, distance_max_m: 0 }; notes.push('scatter defaulted to 0'); }
    else notes.push(`missing module ${m}`);
  }
  return { record: rec, notes };
}

export function convertEntity(rec, { ref, category, vocab, profiles, weaponIdsOf, scale }) {
  const notes = [];
  const h = EXT(rec, 'health_ext') || {}, al = h.armor_layout_option || {};
  const tags = (EXT(rec, 'type_ext')?.unit_type_list || []).map(t => t.unit_type).filter(t => vocab.lists.unit_tags.includes(t));
  const armor = al.front_armor != null ? { front: al.front_armor, side: al.side_armor, rear: al.rear_armor } : { front: al.armor ?? 1, side: al.armor ?? 1, rear: al.armor ?? 1 };
  const scaler = h.armor_scaler_by_damage_type || {};
  const cost = Object.fromEntries(['manpower', 'munition', 'fuel'].map(k => [k, Math.round(EXT(rec, 'cost_ext')?.time_cost?.cost?.[k] || 0)]).filter(([, v]) => v));
  const out = { coh3_ref: ref, tags, hp: h.hitpoints ?? 0, target_size: h.target_size ?? 1, armor,
    ...(al.front_damage_multiplier != null ? { directional_damage: { front: al.front_damage_multiplier, side: al.side_damage_multiplier, rear: al.rear_damage_multiplier } } : {}),
    resist: { ballistic: scaler.ballistic ?? 1, explosive: scaler.explosive ?? 1, flame: scaler.flame ?? 1, true: scaler['True Damage'] ?? 1 }, cost };
  const traits = [];
  if (isTrue(h.receive_weapon_cover_modifiers) && category === 'infantry') traits.push('receives_cover');
  if (isTrue(h.can_repair)) traits.push('repairable');
  if (EXT(rec, 'recrewable_ext')) traits.push('recrewable');
  if (EXT(rec, 'towing_trailer_ext')) traits.push('towable');
  if (traits.length) out.traits = traits;
  const mv = EXT(rec, 'moving_ext');
  const speed = mv?.speed_scaling_table?.default_speed > 0 ? mv.speed_scaling_table.default_speed : mv?.speed_scaling_table?.max_speed;
  if (speed) out.move = { hex: Math.max(1, Math.round((speed / scale.infantry_speed_mps) * scale.infantry_move_hex)), pass: last(mv.pass_type?.instance_reference) };
  const sg = EXT(rec, 'sight_ext');
  if (sg) out.sight = { hex: Math.round((sg.sight_package?.outer_radius ?? 0) / scale.metres_per_hex) + scale.sight_bonus_hex, detect_hex: Math.round(Math.max(0, sg.detect_camouflage?.tp_global ?? 0) / scale.metres_per_hex) };
  const ws = weaponIdsOf(rec);
  if (ws.length) {
    const fixed = tags.includes('fixed_turret') || category === 'team_weapons' || category === 'emplacements';
    out.weapons = ws.map((w, i) => ({ weapon: w.id, mount: category === 'infantry' ? 'hull' : fixed ? 'fixed' : /hull/.test(w.id) ? 'hull' : 'turret',
      slot: w.type === 'accessory' ? 'accessory' : i === 0 ? 'main' : 'secondary' }));
  }
  const cam = EXT(rec, 'camouflage_ext');
  if ((cam?.detection_radius ?? 0) > 0) out.stealth = { detected_hex: Math.max(1, Math.round(cam.detection_radius / scale.metres_per_hex)), first_strike_shots: cam.first_strike_shots ?? 0, recloak_turns: turnsOf(cam.combat_reset_time, scale) };
  const twe = EXT(rec, 'team_weapon_ext');
  if (twe) out.crew = { min: (twe.role_list || []).filter(r => isTrue(r.role?.required)).length || 1, roles: (twe.role_list || []).map(r => r.role?.role_name).filter(Boolean) };
  const rc = EXT(rec, 'recrewable_ext');
  if (rc) {
    const RACE = { americans: 'american', germans: 'german', afrika_korps: 'afrika_korps', british: 'british', british_africa: 'british' };
    const by = {};
    for (const r of rc.race_list || []) { const f = RACE[last(r.race_data?.ext_key?.instance_reference)]; const s = last(r.race_data?.info?.capture_squad_blueprint?.instance_reference); if (f && s) by[f] = s; }
    const info = rc.race_list?.[0]?.race_data?.info || {};
    out.recrew = { by_faction: by, min_crew: info.min_capture_crew_size ?? 1, max_squad: info.recrew_max_squad_size ?? 0,
      manual_abandon: isTrue(twe?.can_manual_abandon), abandoned_on_spawn: isTrue(info.is_abandoned_on_spawn) };
  }
  const wreck = last(h.wreck_entity_option?.wreck_entities?.default?.instance_reference);
  if (wreck) out.wreck = { entity: wreck, ...scale.wreck };
  const tow = EXT(rec, 'towing_trailer_ext');
  if (tow) out.tow = { by: [] };
  const con = EXT(rec, 'construction_ext');
  if (con || category === 'emplacements' || category === 'buildings') out.construction = { build_turns: Math.max(1, turnsOf(EXT(rec, 'cost_ext')?.time_cost?.time_seconds, scale)), footprint_hex: 1 };
  if ((h.regeneration ?? 0) > 0) out.regen = { per_turn: r2(h.regeneration * 10) };
  if (EXT(rec, 'flight_ext')) out.flight = {};
  const missing = applyProfile(out, profiles, 'ebps', category, notes);
  for (const m of missing) notes.push(`missing module ${m}`);
  return { record: out, notes };
}

// Weapon flags (data/rules/weapon-flags.json ids) → test on the CoH3 weapon_bag. Value-type flags are not traits.
export const FLAG_TESTS = {
  ignores_blockers: b => isTrue(b.behaviour?.ignore_shot_blocking),
  needs_sight: b => isTrue(b.behaviour?.artillery_force_obey_los),
  anti_air: b => isTrue(b.behaviour?.aa_weapon),
  anti_air_through_cover: b => isTrue(b.behaviour?.aa_weapon_shoot_through),
  emplace_required: b => isTrue(b.behaviour?.non_moving_setup),
  emplace_faces_target: b => isTrue(b.behaviour?.non_moving_setup_requires_facing),
  friendly_fire: b => isTrue(b.behaviour?.can_damage_allies) || isTrue(b.area_effect?.has_friendly_fire),
  piercing: b => isTrue(b.behaviour?.piercing),
  hits_all_on_miss: b => isTrue(b.behaviour?.hit_everything_on_miss),
  hits_all_on_hit: b => isTrue(b.behaviour?.hit_everything_on_hit),
  attack_ground: b => (b.behaviour?.attack_ground_type ?? 'not_allowed') !== 'not_allowed',
  targets_garrison: b => isTrue(b.behaviour?.fire_at_building_combat_slot),
  sniper_kill: b => b.behaviour?.reaction_type === 'sniped',
  replaceable: b => isTrue(b.behaviour?.can_be_substituted),
  replacement: b => isTrue(b.behaviour?.substitute_weapon),
  fire_on_move: b => isTrue(b.moving?.can_fire_while_moving),
  reveals_on_fire: b => isTrue(b.fog_of_war?.reveal_self_on_attack),
};

const KIND = { infantry: 'squad', team_weapons: 'team_weapon', vehicles: 'vehicle', emplacements: 'structure', buildings: 'structure', aircraft: 'vehicle' };
const ROLE_BY_CLASS = { rifle: 'anti_infantry', smg: 'anti_infantry', pistol: 'anti_infantry', lmg: 'anti_infantry', flame: 'anti_infantry',
  sniper: 'recon', sniper_gib: 'recon', hmg: 'suppression', bazooka: 'anti_tank', panzerbuchse: 'anti_tank', at_gun: 'anti_tank',
  cannon: 'all_round', cannon_large: 'anti_tank', cannon_small: 'anti_light_vehicle', cannon_burst: 'anti_light_vehicle',
  mortar: 'indirect', artillery_small: 'indirect', artillery_medium: 'indirect', artillery_mobile: 'indirect', nebelwerfer: 'indirect' };

/** sbps → squad record. ctx: { ref, category, id, catalogUnit, mainWeaponClass, memberCategory, ammo, cfg } */
export function convertSquad(rec, ctx) {
  const notes = [];
  const kind = KIND[ctx.category];
  const members = (EXT(rec, 'squad_loadout_ext')?.unit_list || []).map(u => ({ entity: last(u.loadout_data.type.instance_reference), count: u.loadout_data.num }));
  const tags = (EXT(rec, 'squad_type_ext')?.squad_type_list || []).map(t => t.squad_type).filter(Boolean);
  let role = ROLE_BY_CLASS[ctx.mainWeaponClass] ?? 'logistics';
  const engineer = tags.includes('engineer') || (ctx.entityTags || []).includes('engineer');
  if (engineer) role = 'engineer';
  notes.push(`role "${role}" guessed from ${engineer ? 'engineer tag' : `main weapon class ${ctx.mainWeaponClass ?? 'none'}`}`);
  const u = ctx.catalogUnit || {};
  const out = { coh3_ref: ctx.ref, kind, role, members,
    price: u.price ? { cost: u.price.cost, from: u.price.from } : { cost: {}, from: 'entities' },
    pop: Math.round(u.pop ?? EXT(rec, 'squad_population_ext')?.personnel_pop ?? 0),
    ...(u.build_seconds ? { build_turns: Math.max(1, turnsOf(u.build_seconds, ctx.scale)) } : {}),
    ...(u.name ? { name_en: u.name } : {}), ...(tags.length ? { tags } : {}), source: u.source ?? 'produced' };
  if (u.hero) { out.unique = true; out.traits = ['unique', 'hero']; }
  const ups = (EXT(rec, 'squad_upgrade_ext')?.upgrades || []).map(x => last(x.upgrade?.instance_reference)).filter(Boolean);
  if (ups.length) out.upgrades = { slots: EXT(rec, 'squad_upgrade_ext').number_of_slots ?? -1, list: ups };
  const abil = (EXT(rec, 'squad_ability_ext')?.abilities || []).map(a => last(a.ability?.instance_reference)).filter(Boolean);
  if (abil.length) out.abilities = abil;
  const cap = EXT(rec, 'squad_capture_strategic_point_ext');
  if (cap) out.capture = { rate: cap.capture_rate_multiplier ?? 1 };
  const rein = EXT(rec, 'squad_reinforce_ext');
  if (rein) out.reinforce = { cost_ratio: r2(rein.time_cost_percentage?.cost_percentage ?? 1) };
  if (EXT(rec, 'squad_veterancy_ext')) out.veterancy = { set: ctx.id };
  if (kind === 'team_weapon') {
    const gun = members.find(m => ctx.memberCategory(m.entity) !== 'infantry'), crew = members.find(m => ctx.memberCategory(m.entity) === 'infantry');
    if (gun && crew) out.team_weapon = { weapon_entity: gun.entity, crew_entity: crew.entity };
  }
  const a = ctx.ammo;
  out.supply = { ammo: a.by_indirect_class[ctx.indirectClass] ?? a.by_role[role] ?? a.by_kind[kind] };
  if (out.supply.ammo == null) notes.push(`no ammo setting for kind ${kind}`);
  const eng = EXT(rec, 'squad_engineer_ext');
  if (eng) out.build = { menu: [...new Set(JSON.stringify(eng.construction_groups || []).match(/ebps\/races\/[a-z_]+\/[a-z0-9_/]+/g) || [])].map(last) };
  const missing = applyProfile(out, ctx.profiles, 'sbps', ctx.category, notes);
  for (const m of missing) {
    if (m === 'reinforce') { out.reinforce = { cost_ratio: 1 }; notes.push('reinforce defaulted (cost ratio 1)'); }
    else if (m === 'capture') { out.capture = { rate: 1 }; notes.push('capture defaulted (rate 1)'); }
    else notes.push(`missing module ${m}`);
  }
  return { record: out, notes };
}

/** sbps veterancy → { xp, ranks } with Burning Front modifier names. vetIndex: Map(path after custom_property_container/veterancy/ → record). */
export function convertVeterancy(rec, { vetIndex, vocab }) {
  const notes = [];
  const inv = {};
  for (const [ours, ids] of Object.entries(vocab.veterancy_modifiers)) for (const id of ids) inv[id] = ours;
  const info = EXT(rec, 'squad_veterancy_ext')?.race_list?.[0]?.race_data?.info;
  const ranks = (info?.veterancy_rank_info || []).slice(0, 3).map(r => r.veterancy_rank);
  const out = { coh3_ref: null, xp: ranks.map(r => Math.round(r.veterancy_value ?? 0)), ranks: [] };
  for (const r of ranks) {
    const ref = (r.custom_properties?.custom_pbgid_properties || []).map(p => p.custom_pbgid_property?.pbg?.instance_reference).find(Boolean);
    const vrec = ref ? vetIndex.get(ref.replace(/^custom_property_container\/veterancy\//, '')) : null;
    if (ref && !out.coh3_ref) out.coh3_ref = ref.replace(/\/[^/]+$/, '');
    const mods = {};
    for (const f of vrec?.custom_property_bag?.custom_float_properties || []) {
      const { id, value } = f.custom_float_property;
      if (inv[id]) { if (inv[id] in mods) notes.push(`${id} folded into ${inv[id]}`); else mods[inv[id]] = value; }
      else if (!vocab.veterancy_ignored.includes(id)) notes.push(`unknown veterancy modifier ${id}`);
    }
    if (!vrec) notes.push(`veterancy record not found: ${ref}`);
    out.ranks.push(mods);
  }
  while (out.xp.length < 3) { out.xp.push(0); out.ranks.push({}); notes.push('missing rank filled empty'); }
  return { record: out, notes };
}

/** upgrade_bag → upgrade record; null when its effect is not in the data (written by hand later). */
export function convertUpgrade(bag, { ref, weaponOfItem, scale }) {
  const notes = [];
  const item = (JSON.stringify(bag.requirements_to_complete || []).match(/ebps\/races\/[a-z_]+\/weapons\/[a-z0-9_/]+/) || [])[0];
  const weapon = item ? weaponOfItem(item) : null;
  if (!weapon) return { record: null, notes: ['effect not in CoH3 data (state tree): write by hand'] };
  const cost = Object.fromEntries(['manpower', 'munition', 'fuel'].map(k => [k, Math.round(bag.time_cost?.cost?.[k] || 0)]).filter(([, v]) => v));
  // only "must be present" player-upgrade conditions (mutually exclusive squad upgrades are is_present = False)
  // inside a required_any_in_list group the conditions are alternatives (any one is enough)
  const reqs = [], anyReqs = [];
  const walk = (o, any) => { if (Array.isArray(o)) o.forEach(x => walk(x, any)); else if (o && typeof o === 'object') {
    const t = o.template_reference?.value ?? '';
    if (t.endsWith('required_player_upgrade') && isTrue(o.is_present)) { const u = last(o.upgrade_name?.instance_reference); const list = any ? anyReqs : reqs; if (u && !list.includes(u)) list.push(u); }
    const anyHere = any || t.endsWith('required_any_in_list');
    for (const v of Object.values(o)) walk(v, anyHere); } };
  walk(bag.requirements || [], false);
  return { record: { coh3_ref: ref, scope: bag.owner_type === 'player' ? 'player' : 'unit', cost, build_turns: turnsOf(bag.time_cost?.time_seconds, scale),
    ...(reqs.length || anyReqs.length ? { requires: { ...(reqs.length ? { upgrades: reqs } : {}), ...(anyReqs.length ? { any_upgrades: anyReqs } : {}) } } : {}), ...(bag.local_max_limit ? { limit: Math.round(bag.local_max_limit) } : {}),
    effects: [{ type: 'add_weapon', weapon }] }, notes };
}
