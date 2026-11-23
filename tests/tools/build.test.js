// Bundler and architecture guard: builds small module trees in a temp folder and runs the bundle in a sandbox.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { collect, bundle } from '../../tools/build/bundle.js';
import { checkLayers, checkCoreGlobals, layerOf } from '../../tools/build/check.js';

function tree(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bf-build-'));
  for (const [name, code] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
    fs.writeFileSync(path.join(root, name), code);
  }
  return root;
}

function run(files) {
  const root = tree(files);
  const mods = collect(root, path.join(root, 'src/main.js'));
  const out = [];
  vm.runInNewContext(bundle(mods, 'src/main.js'), { out });
  return { mods, out };
}

test('named, default, namespace, renamed and JSON imports work', () => {
  const { out } = run({
    'src/main.js': "import dflt, { a, b as bee } from './core/m.js'; import * as ns from './core/m.js'; import data from '../data/d.json' with { type: 'json' }; out.push(dflt(), a, bee, ns.a, data.n);",
    'src/core/m.js': 'export const a = 1; export function b() { return 2; } export default function () { return 0; }',
    'data/d.json': '{ "n": 7 }',
  });
  assert.equal(out[0], 0); assert.equal(out[1], 1); assert.equal(out[2](), 2); assert.equal(out[3], 1); assert.equal(out[4], 7);
});

test('re-exports, export lists, destructured exports and default expressions work', () => {
  const { out } = run({
    'src/main.js': "import { x, y, z, q, all } from './core/index.js'; import d from './core/e.js'; out.push(x, y, z, q, all.k, d);",
    'src/core/index.js': "export { x } from './a.js'; export * from './b.js'; export * as all from './b.js'; const z0 = 3; export { z0 as z };",
    'src/core/a.js': 'export const x = 1;',
    'src/core/b.js': 'export const { y, k } = { y: 2, k: 5 }; export let q = 4;',
    'src/core/e.js': 'export default 6 * 7;',
  });
  assert.deepEqual(out, [1, 2, 3, 4, 5, 42]);
});

test('modules run once, dependencies first', () => {
  const { out } = run({
    'src/main.js': "import './core/a.js'; import './core/b.js'; out.push('main');",
    'src/core/a.js': "import { log } from './log.js'; log('a');",
    'src/core/b.js': "import { log } from './log.js'; log('b');",
    'src/core/log.js': 'export const log = (s) => out.push(s);',
  });
  assert.deepEqual(out, ['a', 'b', 'main']);
});

test('cycles, packages, missing extensions and dynamic import are refused', () => {
  const c = tree({ 'src/main.js': "import './core/a.js';", 'src/core/a.js': "import './b.js';", 'src/core/b.js': "import './a.js';" });
  assert.throws(() => collect(c, path.join(c, 'src/main.js')), /import cycle: src\/core\/a\.js -> src\/core\/b\.js -> src\/core\/a\.js/);
  const p = tree({ 'src/main.js': "import x from 'lodash';" });
  assert.throws(() => collect(p, path.join(p, 'src/main.js')), /not a relative path/);
  const e = tree({ 'src/main.js': "import x from './core/a';", 'src/core/a.js': '' });
  assert.throws(() => collect(e, path.join(e, 'src/main.js')), /extension/);
  const d = tree({ 'src/main.js': "import('./x.js');" });
  assert.throws(() => collect(d, path.join(d, 'src/main.js')), /dynamic import/);
});

test('layers: calls only go down', () => {
  assert.equal(layerOf('src/core/fsm.js'), 'core');
  assert.equal(layerOf('src/main.js'), 'main');
  assert.equal(layerOf('data/i18n/ko.json'), 'data');
  const root = tree({
    'src/main.js': "import './core/a.js'; import './view/v.js';",
    'src/core/a.js': "import '../view/v.js';",
    'src/view/v.js': "import '../app/x.js';",
    'src/app/x.js': '',
  });
  const errors = checkLayers(collect(root, path.join(root, 'src/main.js')));
  assert.equal(errors.length, 2);
  assert.match(errors.join('\n'), /src\/core\/a\.js: core may not import view/);
  assert.match(errors.join('\n'), /src\/view\/v\.js: view may not import app/);
});

test('core may not touch the browser, the clock or Math.random', () => {
  const root = tree({
    'src/main.js': "import './core/a.js';",
    'src/core/a.js': [
      'export const f = () => Math.random();',
      'export const g = () => Date.now();',
      'export const h = () => window.innerWidth;',
      'export const ok = { document: 1, performance: 2 }.document;',
      'export const ok2 = (o) => o.window + o.Date;',
    ].join('\n'),
  });
  const errors = checkCoreGlobals(collect(root, path.join(root, 'src/main.js')));
  assert.deepEqual(errors.map(e => e.split(':').slice(0, 2).join(':')), ['src/core/a.js:1', 'src/core/a.js:2', 'src/core/a.js:3']);
});
