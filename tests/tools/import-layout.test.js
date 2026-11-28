import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitByUnit, reachOf } from '../../tools/import-coh3/layout.js';

const files = {
  sbps: { infantry: { riflemen: { members: [{ entity: 'rifleman', count: 5 }], upgrades: { list: ['bar_kit'], pending: ['medkit'] }, abilities: ['frag', 'sprint'], veterancy: { set: 'riflemen' } } },
    team_weapons: { hmg: { members: [{ entity: 'crew', count: 4 }], team_weapon: { weapon: 'mg30', crew_entity: 'crew' } },
      mortar: { members: [{ entity: 'crew_m', count: 4 }], team_weapon: { weapon: 'm81', crew_entity: 'crew_m' } } } },
  ebps: { infantry: { rifleman: { weapons: [{ weapon: 'garand' }] }, crew: { weapons: [{ weapon: 'carbine' }] }, crew_m: { weapons: [{ weapon: 'carbine' }] } } },
  weapon: { rifle: { garand: {}, carbine: {} }, grenade: { frag_w: {} }, light_machine_gun: { bar: {} }, heavy_machine_gun: { mg30: {} }, mortar: { m81: {} } },
  upgrade: { infantry: { bar_kit: { effects: [{ type: 'add_weapon', weapon: 'bar' }] } } },
  ability: { weapon: { frag: { weapon: 'frag_w' } } },
  veterancy: { riflemen: {} },
  fx: { sbps: { riflemen: {}, hmg: {}, mortar: {} }, weapon: { garand: {}, carbine: {}, bar: {} }, ebps: { rifleman: {} }, upgrade: { bar_kit: {} } },
};

test('a squad reaches its members, their weapons, its imported kits, abilities and their weapons, its veterancy set', () => {
  assert.deepEqual(reachOf(files, 'riflemen'), { sbps: ['riflemen'], ebps: ['rifleman'], weapon: ['garand', 'bar', 'frag_w'], upgrade: ['bar_kit'], ability: ['frag'], veterancy: ['riflemen'] });
  assert.deepEqual(reachOf(files, 'hmg').weapon.sort(), ['carbine', 'mg30']);
});

test('records one squad uses go to its folder; records two squads use go to shared/', () => {
  const out = splitByUnit(files);
  assert.deepEqual(Object.keys(out).sort(), ['hmg', 'mortar', 'riflemen', 'shared']);
  assert.deepEqual(out.riflemen.weapon, { rifle: { garand: {} }, grenade: { frag_w: {} }, light_machine_gun: { bar: {} } });
  assert.deepEqual(out.riflemen.ability, { weapon: { frag: { weapon: 'frag_w' } } });
  assert.deepEqual(out.riflemen.upgrade, { infantry: { bar_kit: files.upgrade.infantry.bar_kit } });
  assert.deepEqual(out.riflemen.veterancy, { riflemen: {} });
  assert.deepEqual(out.shared.weapon, { rifle: { carbine: {} } });
  assert.deepEqual(out.shared.fx, { weapon: { carbine: {} } }, 'an fx entry sits with its record');
  assert.equal(out.hmg.upgrade, undefined, 'empty kinds are left out');
});
