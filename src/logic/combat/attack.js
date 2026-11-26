// Attacks: check, preview and resolve with the same numbers (SPEC §4, §5, §10).
// Writes only members (HP) and ammo (src/logic/state/ownership.js). Suppression, criticals, deaths, reveal and the
// action budget belong to status, lifecycle, vision and turn; resolveAttack returns them for the route to apply.
import { distance, disk, inside } from '../hex/index.js';
import { unitAt, putUnit, isOnMap } from '../state/index.js';
import { canSee, coverAgainst, sightLine, eyeHeight } from '../vision/index.js';
import { ev } from '../events/index.js';
import { rankMods } from '../status/index.js';
import { band, armorFace, penChance, splashFactor, targetMods, hitChance, wholeDamage } from './formulas.js';
import { firingWeapons, weaponReach } from './weapons.js';

const alive = m => m.hp > 0;
const isVehicle = u => u.kind === 'vehicle';
const takesSuppression = u => u.kind === 'squad' || u.kind === 'team_weapon';

/** → reason or null. Own turn, own unit and state vetoes are checked by commands first. */
export function canAttack(state, data, attackerId, targetId) {
  const att = state.units[attackerId], tgt = state.units[targetId];
  if (!tgt) return 'no_such_target';
  if (tgt.team === att.team) return 'friendly_target';
  if (tgt.fsm.life !== 'ACTIVE' || (!isOnMap(tgt) && tgt.fsm.location !== 'GARRISONED')) return 'not_a_target';
  if (att.ammo <= 0) return 'out_of_ammo';
  if (!canSee(state, data, att.team, tgt)) return 'target_not_seen';
  const ws = firingWeapons(att, data);
  if (!ws.length) return 'no_weapon';
  const reasons = ws.map(w => weaponReach(state, data, att, w, tgt.pos));
  return reasons.some(r => r === null) ? null : reasons[0];
}

/** Everything one weapon's volley needs: band, shots, hit chance, damage, suppression per shot. */
export function volleyModel(state, data, att, w, tgt) {
  const c = data.balance.combat, a = w.weapon.attack, wp = w.weapon;
  const d = distance(att.pos, tgt.pos), b = band(d, a.range_hex.max);
  const cover = a.fire_mode === 'indirect' ? 'none' : coverAgainst(state, data, tgt, att.pos);
  const coverMods = a.vs_cover?.[cover] || {};
  const moraleMods = tgt.fsm.morale === 'SUPPRESSED' ? a.vs_suppressed || {} : tgt.fsm.morale === 'PINNED' ? a.vs_pinned || {} : {};
  const n = data.units.sbps[tgt.sbps].members.reduce((s, m) => s + m.count, 0), lost = tgt.members.filter(m => !alive(m)).length;
  const obscured = a.fire_mode !== 'indirect' && sightLine(state, data, att.pos, tgt.pos, eyeHeight(att, data)).obscured;
  const factors = [
    a.accuracy[b], a.accuracy_scale?.[b] ?? 1,
    coverMods.accuracy ?? 1, moraleMods.accuracy ?? 1,
    c.attacker_morale_accuracy[att.fsm.morale] ?? 1,
    att.budget.moved ? wp.moving?.accuracy ?? 1 : 1,
    tgt.kind === 'squad' && n > 1 ? 1 + (c.lost_men_received_accuracy * lost) / (n - 1) : 1,
    tgt.fsm.morale === 'RETREATING' ? c.retreating_received_accuracy : 1,
    obscured ? data.balance.vision.obscured_accuracy : 1,
    rankMods(att, data).weapon_accuracy ?? 1, rankMods(tgt, data).received_accuracy ?? 1,
  ];
  const emplaced = tgt.fsm.stance === 'EMPLACED';
  const supp = takesSuppression(tgt) ? ((wp.suppression?.amount ?? 0) * c.suppression_points) / (a.shot_multiplier ?? 1)
    * (coverMods.suppression ?? 1) * (moraleMods.suppression ?? 1) * (emplaced ? c.emplaced_received.suppression : 1) : 0;
  const shots = Math.max(1, Math.round(a.shots_per_turn[b] / (rankMods(att, data).attack_speed ?? 1)));   // faster cycle, more shots
  return { band: b, cover, shots, factors, damage: a.damage_per_shot[b] * (coverMods.damage ?? 1) * (emplaced ? c.emplaced_received.damage : 1),
    suppressionPerShot: supp, indirect: a.fire_mode === 'indirect' };
}

/** Hit chance on one member (target size: CoH3 accuracy × the entity's target size). */
const memberHit = (model, ebps) => hitChance([...model.factors, ebps.target_size ?? 1]);

/** Damage a hit deals to one member, and whether it penetrated (or the chance, with rng absent). */
function hitOn(model, w, ebps, face) {
  const mods = targetMods(w.weapon, ebps);
  const armor = ebps.armor?.[face] ?? 1;   // infantry armour is 1: always penetrated
  const pen = penChance(w.weapon.penetration[model.band] * (mods.penetration ?? 1), armor);
  const dmg = model.damage * (mods.damage ?? 1) * (ebps.directional_damage?.[face] ?? 1);
  return { pen, dmg, deflect: dmg * (w.weapon.deflection?.damage_ratio ?? 0) };
}

/** Expected numbers for the attack preview (the HP-bar loss): per member expected HP loss and the expected suppression. */
export function previewAttack(state, data, attackerId, targetId) {
  const att = state.units[attackerId], tgt = state.units[targetId], c = data.balance.combat;
  const face = armorFace(tgt, att.pos, c.armor_arcs_deg);
  const loss = tgt.members.map(() => 0);
  let suppression = 0;
  const weapons = [];
  for (const w of firingWeapons(att, data)) {
    if (weaponReach(state, data, att, w, tgt.pos)) continue;
    const m = volleyModel(state, data, att, w, tgt);
    const living = tgt.members.map((x, i) => i).filter(i => alive(tgt.members[i]));
    let expected = 0;
    for (const i of living) {
      const e = data.units.ebps[tgt.members[i].ebps], h = hitOn(m, w, e, face);
      const per = (m.shots / living.length) * memberHit(m, e) * (h.pen * h.dmg + (1 - h.pen) * h.deflect);
      loss[i] += per; expected += per;
    }
    suppression += m.shots * m.suppressionPerShot;
    weapons.push({ weapon: w.id, band: m.band, cover: m.cover, shots: m.shots, expectedDamage: Math.round(expected) });
  }
  const hpLoss = tgt.members.map((x, i) => Math.min(x.hp, Math.round(loss[i])));
  return { weapons, hpLoss, expectedKills: hpLoss.filter((l, i) => l >= tgt.members[i].hp && tgt.members[i].hp > 0).length, suppression: Math.round(suppression) };
}

/** Pick a living member index at random, or -1. */
const pick = (members, rng) => { const l = members.map((m, i) => i).filter(i => alive(members[i])); return l.length ? l[rng.int(l.length)] : -1; };

function damageMember(unit, i, amount, events) {
  const m = unit.members[i], dmg = Math.min(m.hp, wholeDamage(amount));
  if (dmg <= 0) return unit;
  const members = unit.members.map((x, j) => (j === i ? { ...x, hp: x.hp - dmg } : x));
  events.push(ev('Damaged', { unit: unit.id, member: i, amount: dmg, hp: members[i].hp }));
  if (members[i].hp === 0) events.push(ev('ModelKilled', { unit: unit.id, member: i }));
  return { ...unit, members };
}

/** Splash to up to `count` other living members (random order). */
function splash(unit, amount, count, skip, rng, events) {
  let u = unit;
  const others = u.members.map((m, i) => i).filter(i => i !== skip && alive(u.members[i]));
  for (let k = 0; k < count && others.length; k++) u = damageMember(u, others.splice(rng.int(others.length), 1)[0], amount, events);
  return u;
}

/**
 * Resolve one attack: every firing weapon in reach fires its volley; each shot rolls hit, then penetration; a hit lands on
 * one member and never carries over; AoE splashes squads. Indirect shells may land off target (spread).
 * → { state, events, suppression: { unitId: points }, criticals: [{ unit, critical }], ammo }
 */
export function resolveAttack(state, data, attackerId, targetId, rng) {
  const c = data.balance.combat;
  let s = state;
  const att = s.units[attackerId], events = [], suppression = {}, criticals = [];
  let perShotAmmo = 0;
  for (const w of firingWeapons(att, data)) {
    const tgt0 = s.units[targetId];
    if (weaponReach(s, data, att, w, tgt0.pos)) continue;
    const m = volleyModel(s, data, att, w, tgt0);
    let hits = 0, pens = 0;
    const shotEvents = [];
    perShotAmmo = Math.max(perShotAmmo, (w.weapon.ammo?.per_shot ?? 1) * (m.indirect ? m.shots : 1));
    for (let shot = 0; shot < m.shots; shot++) {
      // indirect: the shell lands on the aimed hex or a random hex within the spread; it hits whatever stands there
      let aimed = tgt0.pos;
      if (m.indirect && w.weapon.indirect?.spread_hex) {
        const spots = disk(tgt0.pos, w.weapon.indirect.spread_hex).filter(h => inside(h, s.map.cols, s.map.rows));
        aimed = spots[rng.int(spots.length)];
      }
      const victim = m.indirect ? unitAt(s, aimed) : s.units[targetId];
      if (!victim || victim.fsm.life !== 'ACTIVE') continue;
      let v = victim;
      const face = armorFace(v, att.pos, c.armor_arcs_deg);
      const i = pick(v.members, rng);
      if (i < 0) break;
      const e = data.units.ebps[v.members[i].ebps];
      if (takesSuppression(v) && v.id === targetId) suppression[v.id] = (suppression[v.id] ?? 0) + m.suppressionPerShot;
      const multi = w.weapon.aoe && v.members.length > 1 && !isVehicle(v);
      const sf = multi ? splashFactor(w.weapon.aoe, c.aoe.squad_spread_m) : 0;
      if (rng.next() < memberHit(m, e)) {
        hits++;
        const h = hitOn(m, w, e, face);
        const penetrated = rng.next() < h.pen;
        if (penetrated) {
          pens++;
          v = damageMember(v, i, h.dmg, shotEvents);
          if (isVehicle(v)) for (const [crit, p] of Object.entries(c.criticals)) if (rng.next() < p) criticals.push({ unit: v.id, critical: crit });
        } else {
          shotEvents.push(ev('PenetrationFailed', { unit: v.id, member: i, weapon: w.id }));
          if (h.deflect > 0) v = damageMember(v, i, h.deflect, shotEvents);
        }
        if (multi && sf > 0) v = splash(v, m.damage * sf, (w.weapon.aoe.max_members ?? 1) - 1, i, rng, shotEvents);
      } else if (multi && sf > 0) {
        v = splash(v, m.damage * sf * c.aoe.miss_splash, w.weapon.aoe.max_members ?? 1, -1, rng, shotEvents);
      }
      s = putUnit(s, v);
    }
    events.push(ev('Fired', { unit: attackerId, target: targetId, weapon: w.id, band: m.band, shots: m.shots, hits, penetrations: pens }), ...shotEvents);
  }
  const a = s.units[attackerId], spent = Math.min(a.ammo, perShotAmmo);
  s = putUnit(s, { ...a, ammo: a.ammo - spent });
  events.push(ev('AmmoSpent', { unit: attackerId, amount: spent, left: a.ammo - spent }));
  for (const id of Object.keys(suppression)) suppression[id] = Math.round(suppression[id]);
  return { state: s, events, suppression, criticals };
}
