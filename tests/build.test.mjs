import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, copyFile, readFile, access, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repository = fileURLToPath(new URL('..', import.meta.url));
const schema = JSON.parse(await readFile(new URL('../sitecms.schema.json', import.meta.url), 'utf8'));
const content = {
  pages: schema.pages.map(page => ({ ...page, blocks: page.blocks.map(block => ({ ...block, value: block.default })) })),
  seo: [{ pageSlug: 'home', title: 'CMS-rubrik', description: 'CMS-beskrivning' }],
};
content.pages[0].blocks.find(b => b.key === 'hero.title').value = '<img src=x onerror=alert(1)>';
async function buildFixture(overrides) {
  const cwd = await mkdtemp(join(tmpdir(), 'swea-build-'));
  for (const file of ['content/privacy.html', 'src/app/globals.css', 'public/site.js', 'public/contact-form.js', 'assets/brand/swea-logotyp-referens.png']) {
    await mkdir(dirname(join(cwd, file)), { recursive: true });
    await copyFile(join(repository, file), join(cwd, file));
  }
  const entry = pathToFileURL(join(repository, 'scripts/build.mjs')).href;
  const source = `globalThis.fetch = async (url) => { if (!url.startsWith('https://sitecms.se/api/v1/sites/test-site/')) throw new Error('Unexpected network request'); return {ok:true,json:async()=>(${JSON.stringify(content)})}; }; await import(${JSON.stringify(entry)});`;
  const run = spawnSync(process.execPath, ['--input-type=module', '-e', source], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, SITE_URL: 'https://www.sweaenterprise.se', SITE_INDEXABLE: 'true', VERCEL_ENV: 'production', CMS_REQUIRED: 'true', CMS_SITE: 'test-site', CMS_API_KEY: 'test-secret-key-not-for-browser', CMS_API_URL: 'https://sitecms.se', TURNSTILE_SITE_KEY: 'test-public-key', ...overrides },
  });
  return { cwd, run, html: run.status === 0 ? await readFile(join(cwd, 'dist/index.html'), 'utf8') : '' };
}

test('Production build uses CMS and SEO, escapes edited text and keeps private keys out of output', async () => {
  const { cwd, run, html } = await buildFixture({});
  try {
    assert.equal(run.status, 0, run.stderr);
    assert.match(html, /<title>CMS-rubrik<\/title>/);
    assert.match(html, /rel="canonical" href="https:\/\/www.sweaenterprise.se\/"/);
    assert.match(html, /name="robots" content="index,follow"/);
    assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
    assert.ok(!html.includes('<img src=x'));
    assert.ok(!html.includes('test-secret-key-not-for-browser'));
    const sitemap = await readFile(join(cwd, 'dist/sitemap.xml'), 'utf8');
    assert.equal((sitemap.match(/<loc>/g) || []).length, 11);
    assert.ok(!sitemap.includes('404'));
    const contact = await readFile(join(cwd, 'dist/kontakt/index.html'), 'utf8');
    assert.match(contact, /data-action="contact"/);
    assert.match(contact, /tel:\+46733688666/);
  } finally { await rm(cwd, { recursive: true, force: true }); }
});

test('Preview cannot become indexable even with the production index flag', async () => {
  const { cwd, run, html } = await buildFixture({ VERCEL_ENV: 'preview' });
  try {
    assert.equal(run.status, 0, run.stderr);
    assert.match(html, /name="robots" content="noindex,nofollow"/);
    assert.ok(!html.includes('rel="canonical"'));
    await assert.rejects(access(join(cwd, 'dist/sitemap.xml')));
  } finally { await rm(cwd, { recursive: true, force: true }); }
});

test('Indexable production refuses an unconnected CMS', async () => {
  const { cwd, run } = await buildFixture({ CMS_REQUIRED: 'false', CMS_SITE: '', CMS_API_KEY: '' });
  try { assert.notEqual(run.status, 0); }
  finally { await rm(cwd, { recursive: true, force: true }); }
});
