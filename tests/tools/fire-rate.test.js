import { test } from 'node:test';
import assert from 'node:assert/strict';
import { magazineTime, rawShots, applyRate, fireRate } from '../../tools/import-coh3/fire-rate.js';

const cfg = { window_seconds: 6, bands: ['near', 'mid', 'far'], single_shot_categories: ['tank_gun'] };
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

test('magazine time follows the CoH3 cycle: shots, cooldowns between them, one reload', () => {
  // near: per shot 0.5*0.5 + 0.75 = 1.0; 10 shots, 9 cooldowns of 1.25*0.25, reload 2.75
  assert.ok(Math.abs(magazineTime(bag(), 'near').time - (10 * 1.0 + 9 * 0.3125 + 2.75)) < 1e-9);
  assert.equal(magazineTime(bag(), 'near').shots, 10);
});

test('raw shots per 6 s window per band', () => {
  const near = rawShots(bag(), 'near', 6);
  assert.ok(Math.abs(near - 10 / 15.5625 * 6) < 1e-9);
  assert.ok(rawShots(bag(), 'far', 6) < near);
});

test('bursts count every bullet', () => {
  const mg = bag({ burst: { can_burst: 'True', duration: { min: 4, max: 5 }, rate_of_fire: { min: 8, max: 8 }, duration_multiplier: one, rate_of_fire_multiplier: one },
    reload: { duration: { min: 6, max: 6.5 }, duration_multiplier: one, frequency: { min: 0, max: 0 } } });
  // one burst of 4.5 s at 8 rps = 36 bullets; per shot 0.5*0.5 + 0.75 + 4.5; no cooldown (1 shot), reload 6.25
  assert.ok(Math.abs(rawShots(mg, 'near', 6) - 36 / (5.5 + 6.25) * 6) < 1e-9);
});

test('ordinary weapons round to whole shots, damage unchanged', () => {
  assert.deepEqual(applyRate(3.86, 10, false), { shots: 4, correction: 1, damage: 10 });
  assert.deepEqual(applyRate(2.49, 10, false), { shots: 2, correction: 1, damage: 10 });
});

test('single-shot weapons fire once and carry the rate in their damage', () => {
  assert.deepEqual(applyRate(0.923, 120, true), { shots: 1, correction: 0.92, damage: 111 });
  assert.deepEqual(applyRate(1.4, 100, true), { shots: 1, correction: 1.4, damage: 140 });
});

test('any weapon slower than one shot per turn becomes single-shot with correction', () => {
  assert.deepEqual(applyRate(0.4, 200, false), { shots: 1, correction: 0.4, damage: 80 });
});

test('fireRate gives whole shots and damage per band', () => {
  const tank = bag({ aim: { fire_aim_time: { min: 0.125, max: 0.125 }, aim_time_multiplier: one }, fire: { wind_up: 0, wind_down: 0.875 },
    cooldown: { duration: { min: 0, max: 0 }, duration_multiplier: one },
    reload: { duration: { min: 5.5, max: 5.5 }, duration_multiplier: one, frequency: { min: 0, max: 0 } }, damage: { min: 120, max: 120 } });
  const r = fireRate(tank, 'tank_gun', cfg);
  assert.deepEqual(r.shots_per_turn, { near: 1, mid: 1, far: 1 });
  assert.deepEqual(r.damage_per_shot, { near: 111, mid: 111, far: 111 });   // 120 × 6 / 6.5 = 110.77
  assert.equal(r.single_shot, true);
});

test('grenades and mines are per use: one shot, CoH3 damage', () => {
  const r = fireRate(bag({ damage: { min: 80, max: 80 } }), 'grenade', { ...cfg, per_use_categories: ['grenade', 'mine'] });
  assert.deepEqual(r.shots_per_turn, { near: 1, mid: 1, far: 1 });
  assert.deepEqual(r.damage_per_shot, { near: 80, mid: 80, far: 80 });
  assert.equal(r.per_use, true);
});
