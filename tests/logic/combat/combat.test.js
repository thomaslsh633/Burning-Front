import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as combat from '../../../src/logic/combat/index.js';
import { createRng } from '../../../src/services/rng/index.js';
import { testMatch, tweak } from '../../helpers/match.js';
import { assertOwnsOnly } from '../../helpers/ownership.js';

const H = (c, r) => ({ c, r });
const blue = (sbps, pos, x = {}) => ({ team: 'blue', sbps, pos, ...x });
const red = (sbps, pos, x = {}) => ({ team: 'red', sbps, pos, ...x });
const hp = u => u.members.reduce((s, m) => s + m.hp, 0);

test('bands are thirds of the range', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6].map(d => combat.band(d, 6)), ['near', 'near', 'mid', 'mid', 'far', 'far']);
  assert.deepEqual([3, 4, 5, 6, 7].map(d => combat.band(d, 7)), ['near', 'mid', 'mid', 'far', 'far']);
});

test('armour face from the hull; penetration chance; splash falloff', () => {
  const t = { pos: H(5, 5), facing: 0 };
  const arcs = { front: 60, side: 120 };
  assert.equal(combat.armorFace(t, H(8, 5), arcs), 'front');
  assert.equal(combat.armorFace(t, H(5, 2), arcs), 'side');
  assert.equal(combat.armorFace(t, H(2, 5), arcs), 'rear');
  assert.equal(combat.penChance(135, 195), 135 / 195);
  assert.equal(combat.penChance(2, 1), 1);
  const aoe = { damage: { near: 0.84, mid: 0.25, far: 0.15 }, distance_m: { near: 0.25, mid: 0.75, far: 4.5 } };
  assert.equal(combat.splashFactor(aoe, 0), 0.84);
  assert.ok(Math.abs(combat.splashFactor(aoe, 2.5) - (0.25 - 0.1 * 1.75 / 3.75)) < 1e-9);
  assert.equal(combat.splashFactor(aoe, 9), 0);
});

test('firing weapons: every rifleman; the crew weapon once; the gun of a towed gun; no smoke launcher; damaged main gun', () => {
  const { state, data } = testMatch([blue('riflemen_us', H(1, 1)), blue('hmg_30cal_us', H(2, 1)), blue('at_gun_57mm_us', H(3, 1)), blue('sherman_us', H(4, 1))]);
  const ids = id => combat.firingWeapons(state.units[id], data).map(w => w.id);
  assert.deepEqual(ids('u1'), ['thompson_riflemen_leader_us', ...Array(5).fill('garand_rifleman_us')]);
  assert.deepEqual(ids('u2'), ['30cal_hmg_us']);
  assert.deepEqual(ids('u3'), ['57mm_at_gun_us']);
  assert.deepEqual(ids('u4'), ['75mm_sherman_us', '30cal_coaxial_sherman_us', '30cal_hull_sherman_us']);
  assert.deepEqual(combat.firingWeapons({ ...state.units.u4, criticals: ['main_gun_damaged'] }, data).map(w => w.id), ['30cal_coaxial_sherman_us', '30cal_hull_sherman_us']);
  const dead = tweak(state, 'u2', { members: state.units.u2.members.map(m => ({ ...m, hp: 0 })) });
  assert.deepEqual(combat.firingWeapons(dead.units.u2, data), []);
});

test('weapon reach: range, emplacement, arc, fire after moving', () => {
  const { state, data } = testMatch([blue('hmg_30cal_us', H(2, 5), { facing: 0 }), red('grenadier_ger', H(6, 5)), red('grenadier_ger', H(2, 9))]);
  const mg = combat.firingWeapons(state.units.u1, data)[0];
  assert.equal(combat.weaponReach(state, data, state.units.u1, mg, H(6, 5)), 'must_emplace');
  const set = tweak(state, 'u1', { fsm: { ...state.units.u1.fsm, stance: 'EMPLACED' } });
  assert.equal(combat.weaponReach(set, data, set.units.u1, mg, H(6, 5)), null);
  assert.equal(combat.weaponReach(set, data, set.units.u1, mg, H(2, 9)), 'out_of_arc');
  assert.equal(combat.weaponReach(set, data, set.units.u1, mg, H(11, 5)), 'out_of_range');
  const moved = tweak(set, 'u1', { budget: { ...set.units.u1.budget, moved: true } });
  assert.equal(combat.weaponReach(moved, data, moved.units.u1, mg, H(6, 5)), 'cannot_fire_after_moving');
});

test('canAttack: friends, unseen targets, ammo', () => {
  const { state, data } = testMatch([blue('riflemen_us', H(2, 5)), blue('riflemen_us', H(3, 5)), red('grenadier_ger', H(6, 5)), red('grenadier_ger', H(9, 5))],
    { terrain: { '9,5': { object: 'bush' } } });
  assert.equal(combat.canAttack(state, data, 'u1', 'u2'), 'friendly_target');
  assert.equal(combat.canAttack(state, data, 'u1', 'u3'), null);
  assert.equal(combat.canAttack(state, data, 'u1', 'u4'), 'target_not_seen');
  assert.equal(combat.canAttack(tweak(state, 'u1', { ammo: 0 }), data, 'u1', 'u3'), 'out_of_ammo');
});

test('resolve: HP only falls, never below 0, one volley of ammo, combat writes only its fields; same seed same result', () => {
  const { state, data } = testMatch([blue('riflemen_us', H(2, 5)), red('grenadier_ger', H(5, 5))]);
  const r = combat.resolveAttack(state, data, 'u1', 'u2', createRng(5));
  assert.ok(hp(r.state.units.u2) < hp(state.units.u2));
  assert.ok(r.state.units.u2.members.every(m => m.hp >= 0));
  assert.equal(r.state.units.u1.ammo, state.units.u1.ammo - 1);
  assert.deepEqual(r.events.filter(e => e.type === 'Fired').map(e => e.weapon), ['thompson_riflemen_leader_us', ...Array(5).fill('garand_rifleman_us')]);
  assertOwnsOnly('combat', state, r.state);
  assert.deepEqual(combat.resolveAttack(state, data, 'u1', 'u2', createRng(5)), r);
});

test('preview matches the average of resolved attacks (rifles at mid range, open ground)', () => {
  const { state, data } = testMatch([blue('riflemen_us', H(1, 5)), red('grenadier_ger', H(5, 5))]);
  const p = combat.previewAttack(state, data, 'u1', 'u2');
  const expected = p.hpLoss.reduce((a, b) => a + b, 0);
  let total = 0;
  const N = 300;
  for (let seed = 0; seed < N; seed++) total += hp(state.units.u2) - hp(combat.resolveAttack(state, data, 'u1', 'u2', createRng(seed)).state.units.u2);
  assert.ok(Math.abs(total / N - expected) / expected < 0.1, `average ${total / N} vs preview ${expected}`);
  assert.equal(p.weapons[0].band, 'mid');
});

test('cover cuts the expected loss; MGs suppress infantry, not tanks', () => {
  const open = testMatch([blue('hmg_30cal_us', H(1, 5), { stance: 'EMPLACED' }), red('grenadier_ger', H(4, 5)), red('panzer_iv_ger', H(4, 6))]);
  const cover = testMatch([blue('hmg_30cal_us', H(1, 5), { stance: 'EMPLACED' }), red('grenadier_ger', H(4, 5))], { terrain: { '4,5': { object: 'trench' } } });
  const loss = x => combat.previewAttack(x.state, x.data, 'u1', 'u2').hpLoss.reduce((a, b) => a + b, 0);
  assert.ok(loss(cover) < loss(open) * 0.5);
  assert.ok(combat.previewAttack(open.state, open.data, 'u1', 'u2').suppression > 50);
  const r = combat.resolveAttack(open.state, open.data, 'u1', 'u3', createRng(1));
  assert.equal(r.suppression.u3, undefined);
});

test('tank guns: rear shots penetrate more often than frontal ones; penetrating hits may roll criticals', () => {
  const front = testMatch([blue('at_gun_57mm_us', H(2, 5), { stance: 'EMPLACED', facing: 0 }), red('panzer_iv_ger', H(5, 5), { facing: 3 })]);
  const rear = testMatch([blue('at_gun_57mm_us', H(2, 5), { stance: 'EMPLACED', facing: 0 }), red('panzer_iv_ger', H(5, 5), { facing: 0 })]);
  const loss = x => combat.previewAttack(x.state, x.data, 'u1', 'u2').hpLoss[0];
  assert.ok(loss(rear) >= loss(front));
  let crits = 0;
  for (let seed = 0; seed < 200; seed++) crits += combat.resolveAttack(rear.state, rear.data, 'u1', 'u2', createRng(seed)).criticals.length;
  assert.ok(crits > 0);
});

test('mortar: indirect shells splash the squad; ammo per shell', () => {
  const { state, data } = testMatch([blue('mortar_81mm_us', H(1, 5), { stance: 'EMPLACED' }), red('grenadier_ger', H(6, 5))]);   // crew sight 6
  assert.equal(combat.canAttack(state, data, 'u1', 'u2'), null);
  let hurt = 0;
  for (let seed = 0; seed < 50; seed++) {
    const r = combat.resolveAttack(state, data, 'u1', 'u2', createRng(seed));
    if (hp(r.state.units.u2) < hp(state.units.u2)) hurt++;
    assert.equal(r.state.units.u1.ammo, state.units.u1.ammo - 2, '2 shells');
  }
  assert.ok(hurt > 10);
});

test('a crew without its towed gun fights with its own small arms', () => {
  const { state, data } = testMatch([blue('at_gun_57mm_us', H(2, 2))]);
  const crewOnly = tweak(state, 'u1', { members: state.units.u1.members.filter(m => m.ebps !== 'tw_at_gun_57mm_us') });
  assert.deepEqual(combat.firingWeapons(crewOnly.units.u1, data).map(w => w.id), Array(5).fill('carbine_crew_us'));
  const gunDead = tweak(state, 'u1', { members: state.units.u1.members.map(m => (m.ebps === 'tw_at_gun_57mm_us' ? { ...m, hp: 0 } : m)) });
  assert.equal(combat.firingWeapons(gunDead.units.u1, data).length, 5);
});

test('setMembers: a crew change writes members only', () => {
  const { state } = testMatch([blue('at_gun_57mm_us', H(2, 2))]);
  const r = combat.setMembers(state, 'u1', [{ ebps: 'tw_at_gun_57mm_us', hp: 10 }]);
  assert.deepEqual(r.state.units.u1.members, [{ ebps: 'tw_at_gun_57mm_us', hp: 10 }]);
  assertOwnsOnly('combat', state, r.state);
});

test('loadout weapons: a bazooka team\'s first two models fire bazookas, the rest their carbines', () => {
  const { state, data } = testMatch([blue('bazooka_team_us', H(2, 2))]);
  const ids = combat.firingWeapons(state.units.u1, data).map(w => w.id).sort();
  assert.deepEqual(ids, ['bazooka_bazooka_team_us', 'bazooka_bazooka_team_us', 'carbine_bazooka_team_us', 'carbine_bazooka_team_us']);
  const one = tweak(state, 'u1', { members: state.units.u1.members.map((m, i) => (i < 3 ? { ...m, hp: 0 } : m)) });
  assert.deepEqual(combat.firingWeapons(one.units.u1, data).map(w => w.id), ['bazooka_bazooka_team_us'], 'the last man picks up the bazooka');
});

test('addUpgrade writes only the unit\'s upgrades', () => {
  const { state } = testMatch([blue('riflemen_us', H(2, 2))]);
  const r = combat.addUpgrade(state, 'u1', 'bar_rifleman_squad_us');
  assert.deepEqual(r.state.units.u1.upgrades, ['bar_rifleman_squad_us']);
  assert.equal(r.events[0].type, 'UpgradeFitted');
  assertOwnsOnly('combat', state, r.state);
});
