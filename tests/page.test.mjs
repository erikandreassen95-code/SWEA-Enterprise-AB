import test from 'node:test';
import assert from 'node:assert/strict';
import { createPageHandler } from '../api/page.mjs';

async function request(handler, path = '/', method = 'GET') {
  const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(body) { this.body = body; } };
  await handler({ method, url: `/api/page?path=${encodeURIComponent(path)}` }, res);
  return res;
}

test('Each page request loads fresh CMS text and SEO without redeployment or exposing credentials', async () => {
  let revision = 0;
  const handler = createPageHandler({ env: { CMS_API_KEY: 'private-key' }, loadContent: async ({ env }) => {
    assert.equal(env.CMS_REQUIRED, 'true');
    revision++;
    return { pages: [{ slug: 'home', blocks: [{ key: 'hero.title', value: `Revision ${revision} <script>` }] }], seo: [{ pageSlug: 'home', title: `Title ${revision}` }] };
  } });
  const first = await request(handler);
  const second = await request(handler);
  assert.equal(first.statusCode, 200);
  assert.match(first.body, /Revision 1 &lt;script&gt;/);
  assert.match(second.body, /Revision 2 &lt;script&gt;/);
  assert.match(second.body, /<title>Title 2<\/title>/);
  assert.doesNotMatch(second.body, /private-key/);
  assert.equal(second.headers['Cache-Control'], 'no-store');
  assert.equal(second.headers['Vercel-CDN-Cache-Control'], 'no-store');
});

test('CMS outage returns retryable 503 instead of silently serving old text', async () => {
  const handler = createPageHandler({ loadContent: async () => { throw new Error('private upstream details'); } });
  const res = await request(handler);
  assert.equal(res.statusCode, 503);
  assert.equal(res.headers['Retry-After'], '30');
  assert.doesNotMatch(res.body, /private upstream details/);
});

test('Dynamic pages support service routes, HEAD, missing pages and method restrictions', async () => {
  const handler = createPageHandler({ loadContent: async () => ({ pages: [], seo: [] }) });
  assert.equal((await request(handler, '/tjanster/uthyrning/')).statusCode, 200);
  assert.equal((await request(handler, '/saknas/')).statusCode, 404);
  assert.equal((await request(handler, '/', 'HEAD')).body, undefined);
  assert.equal((await request(handler, '/', 'POST')).statusCode, 405);
});
