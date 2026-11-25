import { test } from 'node:test';
import assert from 'node:assert/strict';
import { magazineTime, rawShots, volley, ruleOf, fireRate } from '../../tools/import-coh3/fire-rate.js';

const cfg = {
  window_seconds: 6, bands: ['near', 'mid', 'far'],
  groups: { per_use: ['grenade', 'mine'], single_shot: ['tank_gun'], artillery: ['heavy_artillery', 'mortar'] },
  volley: { tolerance: 0.05, max_multiplier: 6 },
  artillery: { max_reload_turns: 4, min_raw: 0.05 },
};
const one = { near: 1, mid: 1, far: 1 };
const bag = over => ({
  aim: { fire_aim_time: { min: 0.375, max: 0.625 }, aim_time_multiplier: { near: 0.5, mid: 1, far: 2 } },
  fire: { wind_up: 0, wind_down: 0.75 },
  burst: { can_burst: 'False', duration: { min: 0, max: 0 }, rate_of_fire: { min: 0, max: 0 }, duration_multiplier: one, rate_of_fire_multiplier: one },
  cooldown: { duration: { min: 1, max: 1.5 }, duration_multiplier: { near: 0.25, mid: 1, far: 1.5 } },
  reload: { duration: { min: 2.5, max: 3 }, duration_multiplier: one, frequency: { min: 9, max: 9 } },
  damage: { min: 10, max: 10 },
  ...over,
});
// a gun that fires once per `seconds` (no aim, no cooldown, reload = seconds)
const slow = (seconds, damage) => bag({ aim: { fire_aim_time: { min: 0, max: 0 }, aim_time_multiplier: one }, fire: { wind_up: 0, wind_down: 0 },
  cooldown: { duration: { min: 0, max: 0 }, duration_multiplier: one },
  reload: { duration: { min: seconds, max: seconds }, duration_multiplier: one, frequency: { min: 0, max: 0 } }, damage: { min: damage, max: damage } });

test('magazine time follows the CoH3 cycle: shots, cooldowns between them, one reload', () => {
  assert.ok(Math.abs(magazineTime(bag(), 'near').time - (10 * 1.0 + 9 * 0.3125 + 2.75)) < 1e-9);
  assert.equal(magazineTime(bag(), 'near').shots, 10);
  assert.ok(Math.abs(rawShots(bag(), 'near', 6) - 10 / 15.5625 * 6) < 1e-9);
});

test('bursts count every bullet', () => {
  const mg = bag({ burst: { can_burst: 'True', duration: { min: 4, max: 5 }, rate_of_fire: { min: 8, max: 8 }, duration_multiplier: one, rate_of_fire_multiplier: one },
    reload: { duration: { min: 6, max: 6.5 }, duration_multiplier: one, frequency: { min: 0, max: 0 } } });
  assert.ok(Math.abs(rawShots(mg, 'near', 6) - 36 / (5.5 + 6.25) * 6) < 1e-9);
});

test('volley picks the smallest multiplier that brings every band within tolerance', () => {
  // Kar98k-like 1.86 / 1.44 / 1.36: ×1 is 30 % off; ×5 → 9 / 7 / 7 (all within 5 %)
  assert.deepEqual(volley({ near: 1.86, mid: 1.44, far: 1.36 }, 0.05, 6), { m: 5, shots: { near: 9, mid: 7, far: 7 } });
  assert.deepEqual(volley({ near: 58, mid: 49, far: 40 }, 0.05, 6), { m: 1, shots: { near: 58, mid: 49, far: 40 } });
  // never reaches tolerance → the multiplier with the smallest worst error, up to the max
  assert.equal(volley({ near: 1.5, mid: 1.5, far: 1.5 }, 0.0, 3).m, 2);
});

test('small arms: more shots, damage and suppression per shot divided by the multiplier', () => {
  const r = fireRate(bag({ damage: { min: 14, max: 14 } }), 'rifle', cfg);
  assert.equal(r.rule, 'volley');
  assert.equal(r.damage_per_shot.near, Math.round(14 / r.multiplier * 100) / 100);
  assert.equal(r.suppression_scale, Math.round(1 / r.multiplier * 1000) / 1000);
  for (const b of cfg.bands) assert.ok(Math.abs(r.shots_per_turn[b] / (r.raw[b] * r.multiplier) - 1) <= 0.05 + 0.01);
});

test('single-shot weapons fire once and carry the rate in their damage', () => {
  const r = fireRate(slow(6.5, 120), 'tank_gun', cfg);   // 6 / 6.5 = 0.923
  assert.equal(r.rule, 'single_shot');
  assert.deepEqual(r.shots_per_turn, { near: 1, mid: 1, far: 1 });
  assert.deepEqual(r.damage_per_shot, { near: 110.77, mid: 110.77, far: 110.77 });   // 120 × 6 / 6.5
});

test('artillery keeps CoH3 damage; rate rounded up, hit rate carries the difference', () => {
  const mortar = fireRate(slow(3.4, 100), 'mortar', cfg);   // 1.765 per turn → 2 shells at ×0.88 accuracy
  assert.deepEqual(mortar.shots_per_turn, { near: 2, mid: 2, far: 2 });
  assert.deepEqual(mortar.damage_per_shot, { near: 100, mid: 100, far: 100 });
  assert.equal(mortar.reload_turns, 0);
  assert.deepEqual(mortar.accuracy_scale, { near: 0.88, mid: 0.88, far: 0.88 });
  const howitzer = fireRate(slow(14.6, 160), 'heavy_artillery', cfg);   // 0.41 → 1 shell every 2 turns at ×0.82
  assert.deepEqual(howitzer.shots_per_turn, { near: 1, mid: 1, far: 1 });
  assert.deepEqual(howitzer.damage_per_shot, { near: 160, mid: 160, far: 160 });
  assert.equal(howitzer.reload_turns, 1);
  assert.deepEqual(howitzer.accuracy_scale, { near: 0.82, mid: 0.82, far: 0.82 });
});

test('artillery that is too slow for normal fire is ability-only', () => {
  const r = fireRate(slow(200, 200), 'heavy_artillery', cfg);   // 0.03 per turn
  assert.equal(r.rule, 'ability');
  assert.deepEqual(r.damage_per_shot, { near: 200, mid: 200, far: 200 });
});

test('a small arm slower than one shot per turn (sniper) fires once with damage × rate', () => {
  const r = fireRate(slow(7.5, 100), 'rifle', cfg);   // 0.8
  assert.equal(r.rule, 'single_shot');
  assert.deepEqual(r.shots_per_turn, { near: 1, mid: 1, far: 1 });
  assert.deepEqual(r.damage_per_shot, { near: 80, mid: 80, far: 80 });   // 100 × 0.8
});

test('grenades and mines are per use: one shot, CoH3 damage', () => {
  const r = fireRate(bag({ damage: { min: 80, max: 80 } }), 'grenade', cfg);
  assert.equal(r.rule, 'per_use');
  assert.deepEqual(r.shots_per_turn, { near: 1, mid: 1, far: 1 });
  assert.deepEqual(r.damage_per_shot, { near: 80, mid: 80, far: 80 });
});

test('rule groups come from the settings', () => {
  assert.equal(ruleOf('grenade', cfg), 'per_use');
  assert.equal(ruleOf('tank_gun', cfg), 'single_shot');
  assert.equal(ruleOf('mortar', cfg), 'artillery');
  assert.equal(ruleOf('light_machine_gun', cfg), 'volley');
});
