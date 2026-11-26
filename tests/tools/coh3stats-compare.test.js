import { test } from 'node:test';
import assert from 'node:assert/strict';
import { curveAt, bandDistances } from '../../tools/coh3stats/compare.js';

test('curveAt interpolates and returns null beyond the curve', () => {
  const c = [[0, 10], [10, 5], [20, 0]];
  assert.equal(curveAt(c, 0), 10);
  assert.equal(curveAt(c, 5), 7.5);
  assert.equal(curveAt(c, 20), 0);
  assert.equal(curveAt(c, 25), null);
});

test('band distances use CoH3 distances, far = -1 means max range', () => {
  assert.deepEqual(bandDistances({ range: { max: 35, distance: { near: 7, mid: 25, far: -1 } } }), { near: 7, mid: 25, far: 35 });
});
