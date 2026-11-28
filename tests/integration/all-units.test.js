// Stage G gate (docs/dev-plan.ko.md): every imported squad can be created, move, fire and die in the rules engine.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createUnit, checkUnit, putUnit } from '../../src/logic/state/index.js';
import { moveClass, reachable } from '../../src/logic/movement/index.js';
import { firingWeapons, resolveAttack } from '../../src/logic/combat/index.js';
import { checkDeaths } from '../../src/logic/lifecycle/index.js';
import { createRng } from '../../src/services/rng/index.js';
import { testMatch } from '../helpers/match.js';

test('every squad: created, consistent, moves if it can, fires its weapons at an enemy, dies', () => {
  const { state: base, data } = testMatch([{ team: 'red', sbps: 'grenadier_ger', pos: { c: 6, r: 4 }, id: 'target' }], { cols: 14, rows: 10 });
  const problems = [], unarmed = [];
  for (const id of Object.keys(data.units.sbps)) {
    try {
      const u = createUnit({ id: 'x', team: 'blue', sbps: id, pos: { c: 4, r: 4 }, facing: 0, stance: 'EMPLACED' }, data);
      const bad = checkUnit(u);
      if (bad.length) { problems.push(`${id}: ${bad.join('; ')}`); continue; }
      let s = putUnit(base, { ...u, budget: { move: 4, action: 1, counter: 0, moved: false, fired: false, shocked: false }, fsm: { ...u.fsm, action: 'IDLE' } });
      if (moveClass(u, data)) reachable(s, data, 'x');
      if (firingWeapons(u, data).length) resolveAttack(s, data, 'x', 'target', createRng(1));
      else unarmed.push(id);
      s = putUnit(s, { ...s.units.x, members: s.units.x.members.map(m => ({ ...m, hp: 0 })) });
      const d = checkDeaths(s, 'x', data);
      if (d.state.units.x?.fsm.life === 'ACTIVE') problems.push(`${id}: does not die at 0 HP`);
    } catch (e) { problems.push(`${id}: ${e.message}`); }
  }
  assert.deepEqual(problems, []);
  assert.ok(Object.keys(data.units.sbps).length > 250);
});
