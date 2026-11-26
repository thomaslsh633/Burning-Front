// A throwaway repo root for build tests: the real schemas, rules, balance and American base data, nothing else.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export function tempRoot() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bf-data-'));
  for (const d of ['data/schema', 'data/rules', 'data/balance', 'data/base/american']) fs.cpSync(path.join(repo, d), path.join(dir, d), { recursive: true });
  return dir;
}

/** Write a JSON file under a temp root, creating folders. */
export function writeJson(root, rel, obj) {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), JSON.stringify(obj));
}
