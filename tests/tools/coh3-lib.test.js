import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXT, avg, r2, last, isTrue, refsIn, records, byId } from '../../tools/lib/coh3.js';

test('records finds weapon and blueprint leaves with their category path', () => {
  const data = {
    small_arms: { single_fire: { rifle: { garand: { weapon_bag: {} } } } },
    infantry: { riflemen: { extensions: [] }, specialist: { sniper: { extensions: [] } } },
    kits: { bar: { upgrade_bag: {} } },
  };
  assert.deepEqual([...records(data)].map(r => r.path.join('/')),
    ['small_arms/single_fire/rifle/garand', 'infantry/riflemen', 'infantry/specialist/sniper', 'kits/bar']);
});

test('EXT finds an extension by template name in every CoH3 wrapper shape', () => {
  const rec = { extensions: [
    { exts: { template_reference: { value: 'ebpextensions\\health_ext' }, hitpoints: 80 } },
    { squadexts: { template_reference: { value: 'sbpextensions\\squad_loadout_ext' }, unit_list: [] } },
    { template_reference: { value: 'ebpextensions\\sight_ext' }, sight_package: {} },
  ] };
  assert.equal(EXT(rec, 'health_ext').hitpoints, 80);
  assert.deepEqual(EXT(rec, 'squad_loadout_ext').unit_list, []);
  assert.ok(EXT(rec, 'sight_ext').sight_package);
  assert.equal(EXT(rec, 'moving_ext'), undefined);
  assert.equal(EXT(undefined, 'health_ext'), undefined);
});

test('small helpers', () => {
  assert.equal(avg({ min: 2, max: 3 }), 2.5);
  assert.equal(avg(undefined), 0);
  assert.equal(r2(0.12345), 0.12);
  assert.equal(last('sbps/races/american/infantry/riflemen_us'), 'riflemen_us');
  assert.equal(last(undefined), '');
  assert.equal(isTrue('True'), true);
  assert.equal(isTrue('False'), false);
  assert.deepEqual(refsIn({ a: 'upgrade/american/x', b: ['upgrade/american/y', 'upgrade/american/x'], c: 'ebps/z' }, 'upgrade/'),
    ['upgrade/american/x', 'upgrade/american/y']);
});

test('byId keys an index by the last path part and keeps the full path as ref', () => {
  const m = byId(new Map([['ebps/races/american/infantry/rifleman_us', { race: 'american', path: ['infantry', 'rifleman_us'], rec: {} }]]));
  assert.equal(m.get('rifleman_us').ref, 'ebps/races/american/infantry/rifleman_us');
  assert.equal(m.get('rifleman_us').race, 'american');
});
