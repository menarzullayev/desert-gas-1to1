// node tools/shot.mjs <entry> <out.png> [frame] [scale] [timeoutSec] — bundle an entry and render it in headless Chrome on the GPU.
import esbuild from 'esbuild'; import puppeteer from 'puppeteer-core'; import fs from 'fs'; import path from 'path'; import http from 'http';
const [, , entry, out, frame = '150', scale = '1', to = '300'] = process.argv;
const js = (await esbuild.build({ entryPoints: [`src/${entry}.js`], bundle: true, write: false, format: 'iife', loader: { '.glsl': 'text' } })).outputFiles[0].text;
const html = `<!doctype html><body style="margin:0;background:#000"><canvas></canvas><script>window.__method=${JSON.stringify(entry)};window.__frame=${frame};window.__scale=${scale};window.__spp=${process.env.SPP || 400}</script><script src="/b.js"></script>`;
const srv = http.createServer((q, s) => { if (q.method === 'POST') { q.pipe(fs.createWriteStream(path.join(out, path.basename(q.url)))).on('finish', () => s.end('ok')); return; } s.setHeader('content-type', q.url === '/b.js' ? 'text/javascript; charset=utf-8' : 'text/html; charset=utf-8'); s.end(q.url === '/b.js' ? js : html); }).listen(0, '127.0.0.1');
await new Promise((r) => srv.once('listening', r));
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, protocolTimeout: 3600e3, userDataDir: path.resolve('out/raw/chrome'), args: ['--use-angle=' + (process.env.ANGLE || 'd3d11'), '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-webgpu', '--disable-gpu-watchdog'] });
try {
  const p = await b.newPage(); p.on('console', (m) => { const t = m.text(); if (!/GPU stall|deprecated/.test(t)) console.log('[page]', t.slice(0, 1200)); }); p.on('pageerror', (e) => console.log('[err]', e.message));
  const t0 = Date.now(); await p.goto(`http://127.0.0.1:${srv.address().port}/`, { waitUntil: 'domcontentloaded', timeout: 0 }); await p.waitForFunction('window.__done', { timeout: +to * 1000, polling: 500 });
  const err = await p.evaluate('window.__err'); if (err) throw new Error(err);
  const ext = path.extname(out);
  if (entry === 'exportmesh') { /* uploaded by the page */ }
  else { const d = await p.evaluate(() => document.querySelector('canvas').toDataURL('image/png')); fs.writeFileSync(out, Buffer.from(d.split(',')[1], 'base64')); }
  console.log('GPU:', await p.evaluate(() => { const g = document.createElement('canvas').getContext('webgl2'); const e = g.getExtension('WEBGL_debug_renderer_info'); return g.getParameter(e.UNMASKED_RENDERER_WEBGL); })); console.log('saved', out, fs.statSync(out).size, ((Date.now() - t0) / 1000).toFixed(1) + 's');
} finally { await b.close(); srv.close(); }
