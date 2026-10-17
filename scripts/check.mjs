import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import assert from 'node:assert/strict';

const root = resolve('dist');
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const paths = await Promise.all(entries.map(e => e.isDirectory() ? walk(join(dir, e.name)) : join(dir, e.name)));
  return paths.flat();
}
const pages = (await walk(root)).filter(p => p.endsWith('.html'));
const targets = new Set();
for (const page of pages) {
  const html = await readFile(page, 'utf8');
  assert.match(html, /<html lang="sv">/, page);
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1, `One h1: ${page}`);
  assert.match(html, /name="description" content="[^"]+"/, page);
  assert.match(html, /name="robots" content="noindex,nofollow"/, page);
  for (const match of html.matchAll(/(?:href|src)="(\/[^"?#]*)(?:[?#][^"]*)?"/g)) targets.add(match[1]);
}
for (const target of targets) {
  const file = join(root, target);
  const info = await stat(file);
  if (info.isDirectory()) await stat(join(file, 'index.html'));
  const response = await fetch(`http://127.0.0.1:4173${target}`);
  assert.equal(response.status, 200, `HTTP ${target}`);
  assert.match(response.headers.get('x-robots-tag') || '', /noindex/, target);
}
const missing = await fetch('http://127.0.0.1:4173/denna-sida-finns-inte/');
assert.equal(missing.status, 404, 'Missing page returns 404');
assert.match(await missing.text(), /Till startsidan/, 'Useful 404 navigation');
console.log(`OK: ${pages.length} HTML pages, ${targets.size} internal link/asset targets, preview noindex and real HTTP 404.`);
