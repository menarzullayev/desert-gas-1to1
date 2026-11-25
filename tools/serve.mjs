// Static server with HTTP range support (needed for video seeking): node tools/serve.mjs [port]
import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../web'), types = { '.html': 'text/html; charset=utf-8', '.mp4': 'video/mp4', '.m4a': 'audio/mp4' };
http.createServer((q, s) => {
  const u = decodeURIComponent(new URL(q.url, 'http://x').pathname), f = path.join(root, u === '/' ? 'index.html' : path.normalize(u));
  if (!f.startsWith(root + path.sep) || !fs.existsSync(f) || !fs.statSync(f).isFile()) { s.writeHead(404); return s.end(); }
  const size = fs.statSync(f).size, h = { 'content-type': types[path.extname(f)] || 'application/octet-stream', 'accept-ranges': 'bytes' }, m = /bytes=(\d+)-(\d*)/.exec(q.headers.range || '');
  if (m) { const a = +m[1], b = m[2] ? Math.min(+m[2], size - 1) : size - 1; s.writeHead(206, { ...h, 'content-range': `bytes ${a}-${b}/${size}`, 'content-length': b - a + 1 }); fs.createReadStream(f, { start: a, end: b }).pipe(s); }
  else { s.writeHead(200, { ...h, 'content-length': size }); fs.createReadStream(f).pipe(s); }
}).listen(+process.argv[2] || 8123, '127.0.0.1', () => console.log('http://localhost:' + (+process.argv[2] || 8123)));
