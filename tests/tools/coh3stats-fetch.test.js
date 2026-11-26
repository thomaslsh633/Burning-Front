import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { trimUnit, RACE_MAP } from '../../tools/coh3stats/fetch.js';

const cd = JSON.parse(fs.readFileSync(new URL('../fixtures/coh3stats-tommy.json', import.meta.url), 'utf8'));

test('coh3stats races map to our CoH3 races (british = british_africa)', () => {
  assert.deepEqual(RACE_MAP, { german: 'german', american: 'american', dak: 'afrika_korps', british: 'british_africa' });
});

test('trimUnit keeps names, squad totals, entities and weapon DPS curves', () => {
  const u = trimUnit(cd);
  assert.equal(u.id, 'tommy_africa_uk');
  assert.equal(u.name, 'Infantry Section');
  assert.equal(u.cost.manpower, 260);
  assert.equal(u.cost.popcap, 7);
  const officer = u.entities.find(e => e.id === 'officer_tommy_africa_uk');
  assert.deepEqual([officer.hp, officer.speed, officer.sight], [95, 6, 35]);
  const rifle = u.weapons.find(w => w.id === 'lee_enfield_tommy_africa_uk');
  assert.equal(rifle.name, 'Lee-Enfield');
  assert.equal(rifle.num, 4);
  assert.deepEqual(rifle.dps[0], [0, 3.61]);
  assert.equal(u.veterancy[0].xp, 900);
});
