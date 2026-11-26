import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { checkLayers } from '../../tools/check-layers.js';

function fixture(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'layers-'));
  for (const [rel, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  }
  return root;
}
const rules = root => checkLayers(root).map(v => `${v.file} ${v.rule}`);

test('clean tree passes', () => {
  const root = fixture({
    'src/logic/hex/index.js': 'export const distance = (a, b) => 0;',
    'src/logic/combat/index.js': "import { distance } from '../hex/index.js';\nimport { band } from './formulas.js';",
    'src/logic/combat/formulas.js': 'export const band = () => 0;',
    'src/presentation/render/index.js': "import { distance } from '../../logic/hex/index.js';\nimport { t } from '../../services/i18n/index.js';",
    'src/services/i18n/index.js': 'export const t = k => k;',
    'src/app/index.js': "import '../presentation/render/index.js';\nconst w = window;",
  });
  assert.deepEqual(rules(root), []);
});

test('logic may not import presentation or services', () => {
  const root = fixture({
    'src/logic/combat/index.js': "import '../../presentation/render/index.js';\nimport '../../services/rng/index.js';",
  });
  assert.deepEqual(rules(root), ['src/logic/combat/index.js layer', 'src/logic/combat/index.js layer']);
});

test('services may not import logic or presentation', () => {
  const root = fixture({ 'src/services/save/index.js': "export * from '../../logic/state/index.js';" });
  assert.deepEqual(rules(root), ['src/services/save/index.js layer']);
});

test('nothing below app may import app', () => {
  const root = fixture({ 'src/presentation/ui/index.js': "import '../../app/index.js';" });
  assert.deepEqual(rules(root), ['src/presentation/ui/index.js layer']);
});

test('another system is reached only through its index.js', () => {
  const root = fixture({ 'src/logic/combat/index.js': "import { x } from '../hex/grid.js';" });
  assert.deepEqual(rules(root), ['src/logic/combat/index.js internal']);
});

test('package imports are refused (offline, no dependencies)', () => {
  const root = fixture({ 'src/presentation/ui/index.js': "import React from 'react';" });
  assert.deepEqual(rules(root), ['src/presentation/ui/index.js external']);
});

test('logic and rng may not use browser or clock globals', () => {
  const root = fixture({
    'src/logic/combat/index.js': '// Math.random in a comment is fine\nconst s = "document";\nconst r = Math.random();\nconst t = Date.now();',
    'src/services/rng/index.js': 'const n = performance.now();',
    'src/services/clock/index.js': 'export const now = () => performance.now();',
  });
  assert.deepEqual(rules(root), [
    'src/logic/combat/index.js global',
    'src/logic/combat/index.js global',
    'src/services/rng/index.js global',
  ]);
});

test('violations report the line number', () => {
  const root = fixture({ 'src/logic/turn/index.js': '\n\nconst x = window;' });
  assert.equal(checkLayers(root)[0].line, 3);
});

test('logic may not name a unit id; presentation and comments may', () => {
  const root = fixture({
    'data/generated/units.json': JSON.stringify({ factions: { american: {
      sbps: { vehicles: { sherman_us: {} } }, weapon: { tank_gun: { '75mm_sherman_us': {} } }, ebps: {}, upgrade: {} } } }),
    'src/logic/combat/index.js': [
      "// sherman_us used to get a bonus here; 'sherman_us' in a comment is fine",
      "export const bonus = u => (u.sbps === 'sherman_us' ? 1 : 0);",
      'export const gun = w => w.id === "75mm_sherman_us";',
      "export const byTag = u => u.tags.includes('tank');",
      'export const label = u => `unit ${u.sbps}`;',
    ].join('\n'),
    'src/presentation/ui/index.js': "export const icon = 'sherman_us';",
  });
  assert.deepEqual(checkLayers(root).map(v => `${v.file}:${v.line} ${v.rule}`),
    ['src/logic/combat/index.js:2 unit-id', 'src/logic/combat/index.js:3 unit-id']);
});
