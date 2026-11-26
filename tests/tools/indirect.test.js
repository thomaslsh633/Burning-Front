import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classOf, rangeHex, minRangeHex, normalFire, barrageUse, blindFire } from '../../tools/import-coh3/indirect.js';

const cfg = { classes: {
  mortar: { patterns: ['mortar'], usage_turns: 1, range_cap_hex: 12, spread_hex: 0, min_range_floor_hex: 2 },
  spg: { patterns: ['hummel', 'priest'], usage_turns: 1, range_cap_hex: 16, spread_hex: 1 },
  rocket: { patterns: ['nebelwerfer'], usage_turns: 2, range_cap_hex: 16, spread_hex: 2, min_range_floor_hex: 3, max_shells: 3 },
  heavy: { patterns: ['105mm_howitzer', 'obice'], usage_turns: 2, range_cap_hex: 18, spread_hex: 1, min_range_floor_hex: 3 },
}, blind: { extra_spread_hex: 1, default_fow_multiplier: 1.25 }, scale: { metres_per_hex: 7, seconds_per_turn: 10 } };

test('class by id pattern, first match wins; unknown → null', () => {
  assert.equal(classOf('81mm_mortar_us', cfg).id, 'mortar');
  assert.equal(classOf('150mm_hummel_ger', cfg).id, 'spg');
  assert.equal(classOf('barrage_nebelwerfer_150mm_he_ger', cfg).id, 'rocket');
  assert.equal(classOf('105mm_howitzer_us', cfg).id, 'heavy');
  assert.equal(classOf('garand_rifleman_us', cfg), null);
});

test('range: metres ÷ 7, capped per class', () => {
  assert.equal(rangeHex(90, classOf('81mm_mortar_us', cfg)), 12);    // 12.9 → cap 12
  assert.equal(rangeHex(300, classOf('105mm_howitzer_us', cfg)), 18); // 42.9 → cap 18
  assert.equal(rangeHex(70, classOf('81mm_mortar_us', cfg)), 10);
});

test('normal fire: one volley per usage turns, shells = ceil(rate × turns), accuracy carries the rest', () => {
  // 81 mm: 1.78 shells per turn, every turn → 2 shells at ×0.89
  assert.deepEqual(normalFire(1.78, classOf('81mm_mortar_us', cfg)), { usage_turns: 1, reload_turns: 0, shells: 2, accuracy_scale: 0.89, spread_hex: 0 });
  // 105 mm: 0.41 per turn, every 2 turns → 0.82 → 1 shell at ×0.82
  assert.deepEqual(normalFire(0.41, classOf('105mm_howitzer_us', cfg)), { usage_turns: 2, reload_turns: 1, shells: 1, accuracy_scale: 0.82, spread_hex: 1 });
});

test('barrage: CoH3 shells scaled to the new cadence, fewer shells for a faster recharge', () => {
  // 105 mm barrage: 6 shells per 60 s → every 2 turns (20 s) → 2 shells, exact
  assert.deepEqual(barrageUse({ shells: 6, recharge_s: 60 }, classOf('105mm_howitzer_us', cfg)),
    { usage_turns: 2, shells: 2, accuracy_scale: 1, spread_hex: 1 });
  // Hummel barrage: 6 shells per 45 s → every turn (10 s) → 1.33 → 2 shells at ×0.67
  assert.deepEqual(barrageUse({ shells: 6, recharge_s: 45 }, classOf('barrage_hummel_ger', cfg)),
    { usage_turns: 1, shells: 2, accuracy_scale: 0.67, spread_hex: 1 });
  // never more shells than CoH3 fires
  assert.equal(barrageUse({ shells: 3, recharge_s: 5 }, classOf('81mm_mortar_us', cfg)).shells, 3);
});

test('minimum range scales with the range compression, never below the class floor', () => {
  // mortar 25–90 m → max 12 hexes → min 25 / 90 × 12 = 3.3 → 3
  assert.equal(minRangeHex(25, 90, classOf('81mm_mortar_us', cfg)), 3);
  // Nebelwerfer 60–500 m → max 16 → 60 / 500 × 16 = 1.9 → floor 3
  assert.equal(minRangeHex(60, 500, classOf('150mm_nebelwerfer_ger', cfg)), 3);
  // no CoH3 minimum → the floor
  assert.equal(minRangeHex(0, 275, classOf('105mm_howitzer_us', cfg)), 3);
});

test('rocket volleys in normal fire are capped', () => {
  assert.equal(normalFire(3.4, classOf('150mm_nebelwerfer_ger', cfg)).shells, 3);   // 6.8 → 7 → cap 3
});

test('blind fire: accuracy ÷ CoH3 fog multipliers, one hex more spread; sound-ranged hexes are not blind', () => {
  const bag = { scatter: { fow_angle_multiplier: 1.25, fow_distance_multiplier: 1.25 } };
  assert.deepEqual(blindFire(bag, classOf('81mm_mortar_us', cfg), cfg, false), { accuracy_scale: 0.64, spread_hex: 1 });
  assert.deepEqual(blindFire(bag, classOf('105mm_howitzer_us', cfg), cfg, false), { accuracy_scale: 0.64, spread_hex: 2 });
  assert.deepEqual(blindFire(bag, classOf('105mm_howitzer_us', cfg), cfg, true), { accuracy_scale: 1, spread_hex: 1 });
  assert.deepEqual(blindFire({}, classOf('81mm_mortar_us', cfg), cfg, false), { accuracy_scale: 0.64, spread_hex: 1 });   // default 1.25
});
