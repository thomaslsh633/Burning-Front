import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validate } from '../../tools/validate.js';

const vocab = { lists: { band: ['near', 'mid', 'far'], weapon_class: ['rifle', 'hmg'] } };
const types = { $defs: {
  Band3: { type: 'object', required: ['near', 'mid', 'far'], additionalProperties: false,
    properties: { near: { type: 'number' }, mid: { type: 'number' }, far: { type: 'number' } } },
} };
const opts = { vocab, schemas: { 'types.schema.json': types } };
const errs = (schema, value) => validate(schema, value, opts).map(e => `${e.path} ${e.message}`);

test('types, required and unknown properties', () => {
  const s = { type: 'object', required: ['id'], additionalProperties: false, properties: { id: { type: 'string' }, n: { type: 'integer', minimum: 0 } } };
  assert.deepEqual(errs(s, { id: 'a', n: 2 }), []);
  assert.deepEqual(errs(s, { n: 1.5, x: 1 }), ['$ missing required "id"', '$.n expected integer', '$.x unknown property']);
  assert.deepEqual(errs(s, { id: 'a', n: -1 }), ['$.n below minimum 0']);
});

test('$ref into the shared types file', () => {
  const s = { $ref: 'types.schema.json#/$defs/Band3' };
  assert.deepEqual(errs(s, { near: 1, mid: 2, far: 3 }), []);
  assert.deepEqual(errs(s, { near: 1, mid: 'x' }), ['$ missing required "far"', '$.mid expected number']);
});

test('vocab keyword: string must be in the named list', () => {
  const s = { type: 'array', items: { type: 'string', vocab: 'weapon_class' } };
  assert.deepEqual(errs(s, ['rifle', 'hmg']), []);
  assert.deepEqual(errs(s, ['rifle', 'laser']), ['$[1] "laser" not in vocab list weapon_class']);
});

test('enum, pattern, anyOf, additionalProperties schema, array bounds', () => {
  assert.deepEqual(errs({ enum: [1, 2] }, 3), ['$ not one of 1, 2']);
  assert.deepEqual(errs({ type: 'string', pattern: '^[a-z_]+$' }, 'Bad-Id'), ['$ does not match ^[a-z_]+$']);
  assert.deepEqual(errs({ anyOf: [{ type: 'string' }, { type: 'number' }] }, true), ['$ matches none of anyOf']);
  assert.deepEqual(errs({ type: 'object', additionalProperties: { type: 'number' } }, { a: 1, b: 'x' }), ['$.b expected number']);
  assert.deepEqual(errs({ type: 'array', minItems: 1 }, []), ['$ fewer than 1 items']);
});

test('propertyNames checks every key; minLength rejects empty text', () => {
  const strings = { type: 'object', propertyNames: { pattern: '^[a-z0-9_.]+$' }, additionalProperties: { type: 'string', minLength: 1 } };
  assert.deepEqual(errs(strings, { 'unit.riflemen_us.name': 'Riflemen', 'Unit.Bad': 'x', 'ui.empty': '' }),
    ['$.Unit.Bad key: does not match ^[a-z0-9_.]+$', '$.ui.empty shorter than 1']);
});
