import { test } from 'node:test';
import assert from 'node:assert/strict';
import { playMatch } from '../../tools/greybox/autoplay.js';
import { gameData } from '../helpers/game-data.js';

test('autoplay: a whole 1v1 between two factions ends by tickets through commands, with no broken invariant', () => {
  const r = playMatch(gameData(), ['american', 'german'], { seed: 1, tickets: 40 });
  assert.equal(r.error, null);
  assert.deepEqual(r.invariants, []);
  assert.equal(r.reason, 'tickets');
  assert.ok(r.produced.blue > 0 && r.produced.red > 0, 'both sides produced');
});
