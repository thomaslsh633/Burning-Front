// D1-5: conversion of real CoH3 records (data/source/coh3) into the data forms.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { importFaction } from '../../tools/import-coh3/import.js';
import { hexHitChance } from '../../tools/import-coh3/convert.js';

const { files, report } = importFaction('american', ['riflemen_us', 'sherman_us', 'at_gun_57mm_us', 'mortar_81mm_us', 'hmg_30cal_us']);
const find = (k, id) => Object.values(files[k]).map(c => c[id]).find(Boolean);

test('infantry moves 4 hexes (3.6 m/s), a Sherman 6 (5.5 m/s); sight = metres / 7 + 1', () => {
  assert.equal(find('ebps', 'rifleman_us').move.hex, 4);
  assert.equal(find('ebps', 'sherman_us').move.hex, 6);
  assert.equal(find('ebps', 'rifleman_us').sight.hex, 6);
});

test('role comes from the main weapon; engineers only by engineer tag', () => {
  assert.equal(find('sbps', 'riflemen_us').role, 'anti_infantry');
  assert.equal(find('sbps', 'hmg_30cal_us').role, 'suppression');
  assert.equal(find('sbps', 'mortar_81mm_us').role, 'indirect');
});

test('one weapon per hardpoint: upgrade alternatives are not extra guns', () => {
  const ws = find('ebps', 'sherman_us').weapons.map(w => w.weapon);
  assert.ok(ws.includes('75mm_sherman_us'));
  assert.ok(!ws.includes('76mm_sherman_us'));
});

test('indirect accuracy = chance to land on the hex from the scatter ellipse', () => {
  const m = find('weapon', '81mm_mortar_us').attack.accuracy;
  assert.ok(m.near > 0 && m.near <= 1 && m.far <= m.near);
  assert.equal(hexHitChance({ angle_scatter: 0, distance_scatter_ratio: 0, distance_scatter_max: 0 }, 50, 7), 1);
  assert.ok(hexHitChance({ angle_scatter: 10, distance_scatter_ratio: 0.1, distance_scatter_max: 10 }, 80, 7) < 0.5);
});

test('team weapons find their veterancy in the common file; upgrades keep only required player upgrades', () => {
  assert.equal(report.filter(r => r.kind === 'veterancy' && r.notes.some(n => n.includes('not found'))).length, 0);
  assert.deepEqual(find('upgrade', 'bar_rifleman_squad_us').requires?.upgrades, ['bar_riflemen_global_us']);
});

test('carried team weapon: crew members only, weapon item as the team weapon', () => {
  const hmg = find('sbps', 'hmg_30cal_us');
  assert.deepEqual(hmg.members, [{ entity: 'crew_hmg_us', count: 4 }]);
  assert.equal(hmg.team_weapon.weapon_entity, 'w_30cal_hmg_us');
});
