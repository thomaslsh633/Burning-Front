import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as hex from '../../../src/logic/hex/index.js';

const H = (c, r) => ({ c, r });

test('cube round trip and distance match the v214 maths', () => {
  for (const h of [H(0, 0), H(3, 1), H(4, 7), H(10, 13)]) assert.deepEqual(hex.fromCube(hex.toCube(h)), h);
  assert.equal(hex.distance(H(0, 0), H(0, 0)), 0);
  assert.equal(hex.distance(H(0, 0), H(3, 0)), 3);
  assert.equal(hex.distance(H(0, 0), H(0, 2)), 2);
  assert.equal(hex.distance(H(2, 3), H(5, 8)), 5);   // cube (1,3) → (1,8)
});

test('neighbours follow the v214 edge order (0 E, clockwise), even and odd rows', () => {
  assert.deepEqual(hex.neighbours(H(2, 2)), [H(3, 2), H(2, 3), H(1, 3), H(1, 2), H(1, 1), H(2, 1)]);
  assert.deepEqual(hex.neighbours(H(2, 3)), [H(3, 3), H(3, 4), H(2, 4), H(1, 3), H(2, 2), H(3, 2)]);
  for (const n of hex.neighbours(H(5, 5))) assert.equal(hex.distance(H(5, 5), n), 1);
});

test('line is inclusive, contiguous and deterministic', () => {
  const l = hex.line(H(0, 0), H(4, 3));
  assert.deepEqual(l[0], H(0, 0));
  assert.deepEqual(l.at(-1), H(4, 3));
  assert.equal(l.length, hex.distance(H(0, 0), H(4, 3)) + 1);
  for (let i = 1; i < l.length; i++) assert.equal(hex.distance(l[i - 1], l[i]), 1);
  assert.deepEqual(hex.line(H(0, 0), H(4, 3)), l);
});

test('ring and disk sizes', () => {
  assert.equal(hex.ring(H(5, 5), 0).length, 1);
  assert.equal(hex.ring(H(5, 5), 2).length, 12);
  assert.equal(hex.disk(H(5, 5), 2).length, 19);
  for (const h of hex.ring(H(5, 5), 3)) assert.equal(hex.distance(H(5, 5), h), 3);
});

test('direction and turn steps', () => {
  const o = H(4, 4);
  hex.neighbours(o).forEach((n, d) => assert.equal(hex.direction(o, n), d));
  assert.equal(hex.direction(o, H(8, 4)), 0);
  assert.equal(hex.turnSteps(0, 3), 3);
  assert.equal(hex.turnSteps(5, 1), 2);
  assert.equal(hex.turnSteps(2, 2), 0);
});

test('arcs: 120° around facing east covers E and the two diagonals beside it only', () => {
  const o = H(4, 4), n = hex.neighbours(o);
  assert.deepEqual(n.map(h => hex.arcContains(o, 0, 120, h)), [true, true, false, false, false, true]);
  assert.equal(hex.arcContains(o, 0, 360, n[3]), true);
  assert.equal(hex.arcContains(o, 3, 60, H(0, 4)), true);
});

test('inside the map', () => {
  assert.equal(hex.inside(H(0, 0), 22, 14), true);
  assert.equal(hex.inside(H(22, 0), 22, 14), false);
  assert.equal(hex.inside(H(0, -1), 22, 14), false);
});

test('an edge has one key from both sides', () => {
  const a = H(4, 4);
  hex.neighbours(a).forEach((n, d) => assert.equal(hex.edgeKey(a, d), hex.edgeKey(n, (d + 3) % 6)));
  assert.equal(new Set([0, 1, 2, 3, 4, 5].map(d => hex.edgeKey(a, d))).size, 6);
});
