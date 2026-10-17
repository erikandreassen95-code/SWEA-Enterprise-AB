import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, resolve, sep, extname } from 'node:path';

const dist = resolve('dist');
const port = Number(process.env.PORT || 4173);
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.png':'image/png', '.txt':'text/plain; charset=utf-8' };

createServer(async (req,res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname); }
  catch { res.writeHead(400); res.end('Bad request'); return; }
  if (pathname.includes('\0') || pathname.includes('\\')) { res.writeHead(400); res.end('Bad request'); return; }
  let target = resolve(dist, '.' + pathname);
  if (target !== dist && !target.startsWith(dist + sep)) { res.writeHead(403); res.end('Forbidden'); return; }
  try { if ((await stat(target)).isDirectory()) target = join(target,'index.html'); }
  catch { /* handled below */ }
  try {
    const data = await readFile(target);
    res.writeHead(200, { 'Content-Type':types[extname(target)] || 'application/octet-stream', 'X-Robots-Tag':'noindex, nofollow', 'Cache-Control':'no-store' });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch {
    const data = await readFile(join(dist,'404.html'));
    res.writeHead(404, { 'Content-Type':'text/html; charset=utf-8', 'X-Robots-Tag':'noindex, nofollow' });
    res.end(req.method === 'HEAD' ? undefined : data);
  }
}).listen(port,'127.0.0.1',()=>console.log(`SWEA local preview: http://127.0.0.1:${port}/`));
