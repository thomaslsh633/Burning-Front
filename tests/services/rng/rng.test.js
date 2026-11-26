import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../../../src/services/rng/index.js';

test('same seed, same rolls; different seed, different rolls', () => {
  const a = createRng('match-1'), b = createRng('match-1'), c = createRng('match-2');
  const roll = r => Array.from({ length: 8 }, () => r.next());
  const ra = roll(a);
  assert.deepEqual(roll(b), ra);
  assert.notDeepEqual(roll(c), ra);
  for (const x of ra) assert.ok(x >= 0 && x < 1);
});

test('state() resumes the sequence exactly', () => {
  const a = createRng(42);
  a.next(); a.next();
  const saved = a.state();
  const expected = [a.next(), a.next(), a.int(6)];
  const b = createRng({ state: saved });
  assert.deepEqual([b.next(), b.next(), b.int(6)], expected);
});

test('int stays in range and covers it; chance follows p', () => {
  const r = createRng(7), seen = new Set();
  let hits = 0;
  for (let i = 0; i < 3000; i++) { const v = r.int(6); assert.ok(v >= 0 && v < 6); seen.add(v); if (r.chance(0.25)) hits++; }
  assert.equal(seen.size, 6);
  assert.ok(hits > 600 && hits < 900, `chance(0.25) gave ${hits} / 3000`);
});
