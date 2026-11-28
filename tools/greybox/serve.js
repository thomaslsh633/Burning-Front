// Serves the repository for the greybox (no dependencies): node tools/greybox/serve.js [port] → http://localhost:8080/greybox.html
// Listens on every interface, so a phone on the same network can open http://<this computer's IP>:<port>/greybox.html.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8' };

export function createServer() {
  return http.createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '') || 'greybox.html';
    const file = path.resolve(root, rel);
    if (!file.startsWith(root + path.sep) || !TYPES[path.extname(file)] || !fs.existsSync(file)) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)], 'cache-control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.argv[2] ?? 8080);
  createServer().listen(port, () => console.log(`greybox: http://localhost:${port}/greybox.html`));
}
