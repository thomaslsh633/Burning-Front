import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileList, RACES, verify, sha256 } from '../../tools/coh3/fetch.js';

test('file list covers every kind for the factions (british in two theatre sets) and common', () => {
  const list = fileList();
  assert.deepEqual(RACES, ['german', 'american', 'afrika_korps', 'british', 'british_africa', 'common']);
  assert.equal(list.length, 6 * RACES.length - 1);   // CoH3 has no british_africa veterancy file
  assert.ok(list.some(f => f.source === 'data/chunked/ebps/races/british.json' && f.target === 'ebps/british.json'));
  assert.ok(list.some(f => f.source === 'data/chunked/weapon/afrika_korps.json' && f.target === 'weapon/afrika_korps.json'));
  assert.ok(list.some(f => f.source === 'data/chunked/abilities/races/common.json' && f.target === 'abilities/common.json'));
  assert.ok(list.some(f => f.source === 'data/chunked/sbps/races/british_africa.json' && f.target === 'sbps/british_africa.json'));
  assert.ok(!list.some(f => f.target === 'veterancy/british_africa.json'));
});

test('verify reports missing and changed files', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'coh3-'));
  fs.mkdirSync(path.join(dir, 'weapon'));
  fs.writeFileSync(path.join(dir, 'weapon/german.json'), '{"a":1}');
  fs.writeFileSync(path.join(dir, 'weapon/american.json'), '{"b":2}');
  const source = { files: [
    { target: 'weapon/german.json', sha256: sha256(Buffer.from('{"a":1}')) },
    { target: 'weapon/american.json', sha256: sha256(Buffer.from('{"b":3}')) },
    { target: 'weapon/british.json', sha256: 'x' },
  ] };
  assert.deepEqual(verify(dir, source), [
    { target: 'weapon/american.json', problem: 'changed' },
    { target: 'weapon/british.json', problem: 'missing' },
  ]);
});
