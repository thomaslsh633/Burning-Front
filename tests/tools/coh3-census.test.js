import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WEAPON_CHECKS } from '../../tools/coh3/census.js';

test('weapon checks read CoH3 string booleans and numbers', () => {
  const bag = { behaviour: { non_moving_setup: 'True' }, area_effect: { area_info: { outer_radius: 3 } }, burst: { can_burst: 'False' } };
  assert.equal(WEAPON_CHECKS.setup(bag), true);
  assert.equal(WEAPON_CHECKS.aoe(bag), true);
  assert.equal(WEAPON_CHECKS.burst(bag), false);
  assert.equal(WEAPON_CHECKS.scatter({}), false);
});
