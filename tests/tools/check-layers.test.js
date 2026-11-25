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
