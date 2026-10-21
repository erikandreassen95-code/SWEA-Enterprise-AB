import { mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { loadSiteContent } from '../lib/sitecms.mjs';
import { renderSite } from '../lib/render-site.mjs';

const cmsContent = await loadSiteContent();
const pages = renderSite({ cmsContent, privacyHtml: readFileSync(join(process.cwd(), 'content/privacy.html'), 'utf8') });
const dist = join(process.cwd(), 'dist');
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
for (const [path, content] of pages) {
  // Vercel must route page requests to the live renderer, not an existing static HTML file.
  if (process.env.VERCEL === '1' && path.endsWith('/index.html')) continue;
  const target = join(dist, path.slice(1));
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content, 'utf8');
}
for (const [source, target] of [['src/app/globals.css','site.css'], ['public/site.js','site.js'], ['public/contact-form.js','contact-form.js'], ['assets/brand/swea-logotyp-referens.png','brand/swea-logotyp-referens.png']]) {
  const out = join(dist, target);
  mkdirSync(dirname(out), { recursive: true });
  copyFileSync(join(process.cwd(), source), out);
}
console.log(`Built 12 HTML pages in ${dist}`);
