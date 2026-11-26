import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildProduction } from '../../tools/coh3/production.js';

const unit = (id, category, producers, tags, source = 'produced') => ({ id, category, producers, tags, source });
const roster = { american: { units: [
  unit('rifles', 'infantry', ['bar'], ['infantry', 'rifleman']),
  unit('truck', 'vehicles', ['bar'], ['vehicle', 'truck']),
  unit('tank', 'vehicles', ['depot'], ['vehicle', 'medium_armor']),
  unit('tank2', 'vehicles', ['depot'], ['vehicle', 'heavy_armor']),
  unit('para', 'infantry', [], ['infantry', 'elite'], 'called_in'),
  unit('heavy', 'vehicles', [], ['vehicle', 'heavy_armor'], 'called_in'),
  unit('bunker', 'emplacements', [], [], 'built'),
] } };
const types = { barracks: { american: 'bar' }, tank_depot: { american: 'depot' } };

test('squads go to the CoH3 building that spawns them; others to research in the most similar building', () => {
  assert.deepEqual(buildProduction(roster, types), {
    bar: { squads: ['rifles', 'truck'], research: ['para'] },
    depot: { squads: ['tank', 'tank2'], research: ['heavy'] },
  });
});

test('a hand placement wins over the guess', () => {
  assert.deepEqual(buildProduction(roster, types, { heavy: 'bar' }).bar.research, ['heavy', 'para']);
});
