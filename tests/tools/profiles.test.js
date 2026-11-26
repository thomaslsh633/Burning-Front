import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkProfile, checkGroupedFile } from '../../tools/profiles.js';
import { validate } from '../../tools/validate.js';

const profiles = {
  weapon: {
    modules: ['attack', 'aoe', 'scatter', 'trigger', 'emplace'],
    categories: {
      mine: { must: ['aoe', 'trigger'], may: [], must_not: ['attack', 'emplace'] },
      mortar: { must: ['attack', 'aoe', 'scatter', 'emplace'], may: [], must_not: ['trigger'] },
    },
  },
};

test('a mine with attack and without trigger is rejected', () => {
  assert.deepEqual(checkProfile(profiles, 'weapon', 'mine', { aoe: {}, attack: {} }),
    ['missing module "trigger" (must for mine)', 'module "attack" not allowed for mine']);
});

test('a mortar without scatter is rejected; a complete mortar passes', () => {
  assert.deepEqual(checkProfile(profiles, 'weapon', 'mortar', { attack: {}, aoe: {}, emplace: {} }), ['missing module "scatter" (must for mortar)']);
  assert.deepEqual(checkProfile(profiles, 'weapon', 'mortar', { attack: {}, aoe: {}, scatter: {}, emplace: {} }), []);
});

test('unknown category is an error; core fields are not modules', () => {
  assert.deepEqual(checkProfile(profiles, 'weapon', 'laser', { damage: 1 }), ['no profile for category "laser"']);
  assert.deepEqual(checkProfile(profiles, 'weapon', 'mine', { damage: 5, aoe: {}, trigger: {} }), []);
});

test('grouped file: every record is checked against its category', () => {
  const file = { mine: { m1: { aoe: {}, trigger: {} }, m2: { aoe: {} } } };
  assert.deepEqual(checkGroupedFile(profiles, 'weapon', file), [{ path: '$.mine.m2', message: 'missing module "trigger" (must for mine)' }]);
});

test('propertyVocab: object keys must be in the named list', () => {
  const vocab = { lists: { cover: ['none', 'light', 'heavy'] } };
  const s = { type: 'object', propertyVocab: 'cover', additionalProperties: { type: 'number' } };
  assert.deepEqual(validate(s, { light: 1, heavy: 2 }, { vocab }), []);
  assert.deepEqual(validate(s, { light: 1, glass: 2 }, { vocab }).map(e => e.message), ['key "glass" not in vocab list cover']);
});
