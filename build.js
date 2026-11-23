#!/usr/bin/env node
// Build Burning Front from src/ + data/ into one HTML file.
// usage: node build.js [out.html] [--no-test] [--test-only]
//   1. runs every tests/**/*.test.js with node --test (skip with --no-test)
//   2. bundles src/main.js and everything it imports (tools/build/bundle.js)
//   3. refuses the build if a module breaks the layer rules (tools/build/check.js)
//   4. writes dist/burning_front_<VERSION>.html: src/index.html + src/view/styles/*.css + the script
// No npm dependencies. The frozen v214 game builds separately with legacy/build.js.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { collect, bundle, BuildError } from './tools/build/bundle.js';
import { checkLayers, checkCoreGlobals } from './tools/build/check.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flags = new Set(args.filter(a => a.startsWith('--')));
const version = fs.readFileSync(path.join(root, 'VERSION'), 'utf8').trim();
const out = args.find(a => !a.startsWith('--')) || path.join(root, 'dist', `burning_front_${version}.html`);

const listFiles = (dir, test) => !fs.existsSync(dir) ? [] : fs.readdirSync(dir, { withFileTypes: true })
  .flatMap(d => d.isDirectory() ? listFiles(path.join(dir, d.name), test) : test(d.name) ? [path.join(dir, d.name)] : [])
  .sort();

function runTests() {
  const files = listFiles(path.join(root, 'tests'), n => n.endsWith('.test.js'));
  if (!files.length) return;
  const r = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit', cwd: root });
  if (r.status !== 0) { console.error('\nbuild stopped: tests failed'); process.exit(1); }
}

function build() {
  const modules = collect(root, path.join(root, 'src', 'main.js'));
  const errors = [...checkLayers(modules), ...checkCoreGlobals(modules)];
  if (errors.length) throw new BuildError(`architecture rules broken:\n  ${errors.join('\n  ')}`);
  const script = bundle(modules, 'src/main.js').replace(/<\/script/gi, '<\\/script');
  const styles = listFiles(path.join(root, 'src', 'view', 'styles'), n => n.endsWith('.css'))
    .map(f => fs.readFileSync(f, 'utf8')).join('\n');
  const html = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8')
    .replace('%%STYLES%%', () => styles)
    .replace('%%SCRIPT%%', () => script)
    .split('%%VERSION%%').join(version);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  console.log(`built ${path.relative(process.cwd(), out) || out} (${modules.length} modules, ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB)`);
}

try {
  if (!flags.has('--no-test')) runTests();
  if (!flags.has('--test-only')) build();
} catch (e) {
  if (e instanceof BuildError) { console.error(`build failed: ${e.message}`); process.exit(1); }
  throw e;
}
