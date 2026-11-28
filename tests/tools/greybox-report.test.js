import { test } from 'node:test';
import assert from 'node:assert/strict';
import { duel, ttkTable, markdown } from '../../tools/greybox/report.js';
import { gameData } from '../helpers/game-data.js';

const data = gameData();

test('duel: a Sherman kills a rifle squad; a 57 mm AT gun cannot; an MG pins before it kills', () => {
  const tank = duel(data, 'sherman_us', 'riflemen_us', { seeds: 10, maxTurns: 20 });
  assert.ok(tank.turns.every(t => t != null && t <= 20));
  const at = duel(data, 'at_gun_57mm_us', 'riflemen_us', { seeds: 10, maxTurns: 10 });
  assert.ok(at.turns.every(t => t == null));
  const mg = duel(data, 'hmg_mg42_ger', 'riflemen_us', { seeds: 10, maxTurns: 20 });
  assert.ok(mg.pins.every((p, i) => p != null && (mg.turns[i] == null || p <= mg.turns[i])));
});

test('table: rows per attacker and target; a role outside its range is flagged', () => {
  const criteria = { targets: ['riflemen_us', 'sherman_us'], max_turns: 10, ranges: [{ role: 'anti_tank', target_kind: 'vehicle', turns: [1, 1] }] };
  const t = ttkTable(data, criteria, { seeds: 5, attackers: ['at_gun_57mm_us', 'riflemen_us'] });
  assert.deepEqual(t.rows.map(r => r.id), ['at_gun_57mm_us', 'riflemen_us']);
  assert.match(t.rows[0].flags[0], /anti_tank vs vehicle: best TTK \d+ outside 1–1/);
  assert.deepEqual(t.rows[1].flags, []);
  assert.match(markdown(t, criteria, 5), /\| `at_gun_57mm_us` \| american \| anti_tank \|/);
});
