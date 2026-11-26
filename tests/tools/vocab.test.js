import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = f => JSON.parse(fs.readFileSync(new URL(`../../${f}`, import.meta.url), 'utf8'));
const vocab = read('data/rules/vocab.json');

test('vocab lists agree with the rule files they mirror', () => {
  assert.deepEqual(vocab.lists.status_flag, read('data/rules/status-flags.json').flags.map(f => f.id));
  assert.deepEqual(vocab.lists.weapon_trait, read('data/rules/weapon-flags.json').flags.filter(f => f.use).map(f => f.id));
  assert.deepEqual([...vocab.lists.indirect_class].sort(), Object.keys(read('data/balance/indirect.json').classes).sort());
});

test('no word appears twice in a list; no CoH3 veterancy modifier is both mapped and ignored', () => {
  for (const [k, list] of Object.entries(vocab.lists)) assert.equal(new Set(list).size, list.length, `duplicate in ${k}`);
  const mapped = Object.values(vocab.veterancy_modifiers).flat();
  assert.deepEqual(mapped.filter(m => vocab.veterancy_ignored.includes(m)), []);
});
