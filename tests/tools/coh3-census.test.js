import { test } from 'node:test';
import assert from 'node:assert/strict';
import { records, WEAPON_CHECKS } from '../../tools/coh3/census.js';

test('records finds weapon and blueprint leaves with their category path', () => {
  const data = {
    small_arms: { single_fire: { rifle: { garand: { weapon_bag: {} } } } },
    infantry: { riflemen: { extensions: [] }, specialist: { sniper: { extensions: [] } } },
  };
  assert.deepEqual([...records(data)].map(r => r.path.join('/')),
    ['small_arms/single_fire/rifle/garand', 'infantry/riflemen', 'infantry/specialist/sniper']);
});

test('weapon checks read CoH3 string booleans and numbers', () => {
  const bag = { behaviour: { non_moving_setup: 'True' }, area_effect: { area_info: { outer_radius: 3 } }, burst: { can_burst: 'False' } };
  assert.equal(WEAPON_CHECKS.setup(bag), true);
  assert.equal(WEAPON_CHECKS.aoe(bag), true);
  assert.equal(WEAPON_CHECKS.burst(bag), false);
  assert.equal(WEAPON_CHECKS.scatter({}), false);
});
