import { test } from 'node:test';
import assert from 'node:assert/strict';
import { englishNames, seed } from '../../tools/i18n/seed.js';

const stats = { american: {
  riflemen_us: { name: 'Riflemen Squad', brief: 'Effective against infantry. \\n• Large squad.', loadout: [{ entity: 'rifleman_us', num: 5 }],
    weapons: [{ id: 'garand_us', name: 'M1 Garand' }, { id: 'unnamed_us', name: '' }], upgrades: [{ id: 'bar_us', name: 'BAR' }] },
  sherman_us: { name: 'M4A1 Sherman', loadout: [{ entity: 'sherman_us', num: 1 }], weapons: [] },
} };

test('English names from coh3stats: squad name and brief, weapons, upgrades, one-model entities', () => {
  const n = englishNames(stats);
  assert.equal(n['unit.riflemen_us.name'], 'Riflemen Squad');
  assert.equal(n['unit.riflemen_us.desc'], 'Effective against infantry. \n• Large squad.', 'escaped newlines become newlines');
  assert.equal(n['weapon.garand_us.name'], 'M1 Garand');
  assert.equal('weapon.unnamed_us.name' in n, false, 'CoH3 leaves some weapons unnamed');
  assert.equal(n['upgrade.bar_us.name'], 'BAR');
  assert.equal(n['entity.sherman_us.name'], 'M4A1 Sherman', 'one model: the entity is the unit');
  assert.equal('entity.rifleman_us.name' in n, false, 'a soldier is not the squad');
});

test('seed adds only keys in use, never overwrites, keeps keys sorted', () => {
  const names = englishNames(stats);
  const r = seed({ 'unit.riflemen_us.name': 'Riflemen (edited)', 'ui.end_turn': 'End turn' },
    new Set(['unit.riflemen_us.name', 'weapon.garand_us.name', 'weapon.unnamed_us.name']), names);
  assert.deepEqual(r.added, ['weapon.garand_us.name']);
  assert.deepEqual(r.strings, { 'ui.end_turn': 'End turn', 'unit.riflemen_us.name': 'Riflemen (edited)', 'weapon.garand_us.name': 'M1 Garand' });
});
