import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRoster, squadPrice, weaponsOf } from '../../tools/coh3/roster.js';

const ext = (name, body = {}) => ({ exts: { template_reference: { value: `ext\\${name}` }, ...body } });
const ebp = (...exts) => ({ extensions: exts });
const sbp = (members, more = []) => ({ extensions: [ext('squad_loadout_ext', {
  unit_list: members.map(([e, num]) => ({ loadout_data: { type: { instance_reference: e }, num } })) }), ...more] });
const index = rows => new Map(rows.map(([p, rec]) => [p, { race: 'american', path: p.split('/').slice(3), rec }]));

const E = 'ebps/races/american';
const S = 'sbps/races/american';
const GARAND = 'weapon/american/small_arms/single_fire/rifle/garand_us';
const BAR = 'weapon/american/small_arms/machine_gun/light_machine_gun/bar_us';

const src = {
  ebps: index([
    [`${E}/buildings/barracks_us`, ebp(ext('spawner_ext', { squad_table: [`${S}/infantry/riflemen_us`] }))],
    [`${E}/emplacements/bunker_us`, ebp(ext('recrew_ext', { squad: `${S}/team_weapons/hmg_bunker_us` }))],
    [`${E}/infantry/rifleman_us`, ebp(ext('health_ext', { hitpoints: 80 }), ext('cost_ext', { time_cost: { cost: { manpower: 45 } } }),
      ext('combat_ext', { hardpoints: [{ weapon_table: [`${E}/weapons/garand_item_us`] }] }))],
    [`${E}/weapons/garand_item_us`, ebp(ext('weapon_ext', { weapon: { instance_reference: GARAND } }))],
    [`${E}/weapons/bar_item_us`, ebp(ext('weapon_ext', { weapon: { instance_reference: BAR } }))],
  ]),
  sbps: index([
    [`${S}/infantry/riflemen_us`, sbp([[`${E}/infantry/rifleman_us`, 4]], [ext('squad_upgrade_ext', { upgrades: [{ upgrade: { instance_reference: 'upgrade/american/items/bar_us' } }] })])],
    [`${S}/team_weapons/hmg_bunker_us`, sbp([[`${E}/infantry/rifleman_us`, 2]])],
    [`${S}/infantry/captain_us`, sbp([[`${E}/infantry/rifleman_us`, 1]], [ext('squad_requirement_ext', { req: 'upgrade/american/battlegroups/airborne/captain' })])],
    [`${S}/infantry/medic_us`, sbp([[`${E}/infantry/rifleman_us`, 3]])],
    [`${S}/infantry/rangers_us`, sbp([[`${E}/infantry/rifleman_us`, 5]])],
    [`${S}/infantry/orphan_us`, sbp([])],
    [`${S}/infantry/tutorial_dummy_us`, sbp([])],
    [`${S}/aircraft/p47_us`, sbp([])],
  ]),
  weapons: new Map([
    [GARAND, { race: 'american', path: GARAND.split('/').slice(2), rec: { weapon_bag: { weapon_class: 'rifle' } } }],
    [BAR, { race: 'american', path: BAR.split('/').slice(2), rec: { weapon_bag: { weapon_class: 'lmg' } } }],
  ]),
  upgrades: new Map([['upgrade/american/items/bar_us', { race: 'american', path: ['items', 'bar_us'],
    rec: { upgrade_bag: { time_cost: { cost: { munition: 60, fuel: 0 } }, requirements_to_complete: [`${E}/weapons/bar_item_us`] } } }]]),
  text: { abilities: `{"spawn": "${S}/infantry/captain_us"}`, upgrade: '' },
  coh3stats: { american: { rangers_us: { name: 'Rangers', cost: { manpower: 300, munition: 0 }, pop: 7, cost_time: 30 } } },
};
const roster = { restore: { american: ['medic_us'] }, heroes: { units: ['captain_us'] },
  coh3stats: { include_named_units: true, exclude: [], squad_price_from_coh3stats: true } };

const r = buildRoster(src, roster, ['american']).american;
const unit = id => r.units.find(u => u.id === id);

test('a squad is kept for the first way it enters the game', () => {
  assert.equal(unit('riflemen_us').source, 'produced');
  assert.deepEqual(unit('riflemen_us').producers, ['barracks_us']);
  assert.equal(unit('hmg_bunker_us').source, 'built');
  assert.equal(unit('captain_us').source, 'called_in');
  assert.equal(unit('medic_us').source, 'restored');
  assert.equal(unit('rangers_us').source, 'coh3stats');
});

test('everything else is excluded with a reason', () => {
  assert.deepEqual(r.excluded.map(x => [x.id, x.reason]).sort(), [
    ['orphan_us', 'not produced or called in'], ['p47_us', 'off-map aircraft'], ['tutorial_dummy_us', 'dummy / test / map object']]);
});

test('members, hardpoint weapons, equipment and its weapon', () => {
  assert.deepEqual(unit('riflemen_us').members, [{ entity: 'rifleman_us', count: 4, category: 'infantry', hp: 80, weapons: ['garand_us'] }]);
  assert.deepEqual(unit('riflemen_us').upgrades, [{ id: 'bar_us', cost: { munition: 60 }, weapon: 'bar_us' }]);
  assert.deepEqual(r.weapons, [{ id: 'bar_us', category: 'light_machine_gun', class: 'lmg' }, { id: 'garand_us', category: 'rifle', class: 'rifle' }]);
});

test('price: coh3stats total when listed, else member entity costs', () => {
  assert.deepEqual(unit('rangers_us').price, { cost: { manpower: 300 }, from: 'coh3stats' });
  assert.deepEqual(unit('riflemen_us').price, { cost: { manpower: 180 }, from: 'entities' });   // 4 × 45
  assert.deepEqual(squadPrice(undefined, [], new Map(), {}), { cost: {}, from: 'entities' });
});

test('battlegroup requirement marks a doctrine unit; roster.json heroes are flagged', () => {
  assert.equal(unit('captain_us').doctrine, true);
  assert.equal(unit('captain_us').hero, true);
  assert.equal(unit('riflemen_us').doctrine, false);
});

test('weaponsOf: the entity itself is a weapon item, or its hardpoints point to weapon items', () => {
  assert.deepEqual(weaponsOf(src.ebps.get(`${E}/weapons/bar_item_us`).rec, src.ebps), [BAR]);
  assert.deepEqual(weaponsOf(src.ebps.get(`${E}/infantry/rifleman_us`).rec, src.ebps), [GARAND]);
});
