// Downloads the CoH3 game data used by Burning Front from cohstats/coh3-data (data/chunked),
// pinned to one commit, into data/source/coh3/<kind>/<race>.json, and records it in SOURCE.json.
//
// usage: node tools/coh3/fetch.js            re-download the commit pinned in SOURCE.json (or master if none)
//        node tools/coh3/fetch.js --latest   download current master and re-pin
//        node tools/coh3/fetch.js --verify   offline: check local files against SOURCE.json hashes
// Needs git and network for download; --verify needs neither.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const REPO = 'https://github.com/cohstats/coh3-data.git';
export const RACES = ['german', 'american', 'afrika_korps', 'british', 'common'];
// kind → path pattern inside the repository
const KINDS = {
  weapon: r => `data/chunked/weapon/${r}.json`,
  ebps: r => `data/chunked/ebps/races/${r}.json`,
  sbps: r => `data/chunked/sbps/races/${r}.json`,
  upgrade: r => `data/chunked/upgrade/${r}.json`,
  veterancy: r => `data/chunked/veterancy/${r}.json`,
  abilities: r => `data/chunked/abilities/races/${r}.json`,
};

export function fileList() {
  return Object.entries(KINDS).flatMap(([kind, src]) => RACES.map(r => ({ source: src(r), target: `${kind}/${r}.json` })));
}

export const sha256 = buf => crypto.createHash('sha256').update(buf).digest('hex');

export function verify(dir, source) {
  const problems = [];
  for (const f of source.files) {
    const p = path.join(dir, f.target);
    if (!fs.existsSync(p)) problems.push({ target: f.target, problem: 'missing' });
    else if (sha256(fs.readFileSync(p)) !== f.sha256) problems.push({ target: f.target, problem: 'changed' });
  }
  return problems;
}

const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

function download(outDir, ref) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'coh3-data-'));
  try {
    git(tmp, 'init', '-q');
    git(tmp, 'remote', 'add', 'origin', REPO);
    git(tmp, 'fetch', '-q', '--depth', '1', '--filter=blob:none', 'origin', ref);
    const commit = git(tmp, 'rev-parse', 'FETCH_HEAD');
    const commitDate = git(tmp, 'log', '-1', '--format=%cI', 'FETCH_HEAD');
    const list = fileList();
    git(tmp, 'checkout', '-q', 'FETCH_HEAD', '--', ...list.map(f => f.source));
    const files = list.map(f => {
      const buf = fs.readFileSync(path.join(tmp, f.source));
      JSON.parse(buf.toString('utf8'));   // refuse anything that is not plain JSON
      const dest = path.join(outDir, f.target);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, buf);
      return { ...f, bytes: buf.length, sha256: sha256(buf) };
    });
    return { repo: REPO, commit, commit_date: commitDate, files };
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const outDir = path.join(root, 'data/source/coh3');
  const sourceFile = path.join(outDir, 'SOURCE.json');
  const pinned = fs.existsSync(sourceFile) ? JSON.parse(fs.readFileSync(sourceFile, 'utf8')) : null;

  if (process.argv.includes('--verify')) {
    if (!pinned) { console.log('no SOURCE.json'); process.exit(1); }
    const problems = verify(outDir, pinned);
    for (const p of problems) console.log(`${p.problem}: ${p.target}`);
    console.log(problems.length ? `${problems.length} problem(s)` : `ok: ${pinned.files.length} files match ${pinned.commit.slice(0, 8)}`);
    process.exit(problems.length ? 1 : 0);
  }

  const ref = process.argv.includes('--latest') || !pinned ? 'master' : pinned.commit;
  const source = download(outDir, ref);
  fs.writeFileSync(sourceFile, JSON.stringify(source, null, 2) + '\n');
  const mb = source.files.reduce((a, f) => a + f.bytes, 0) / 1048576;
  console.log(`coh3-data ${source.commit.slice(0, 8)} (${source.commit_date}): ${source.files.length} files, ${mb.toFixed(1)} MB → data/source/coh3/`);
}
