import test from 'node:test';
import assert from 'node:assert/strict';
import { cmsSettings, loadSiteContent, text } from '../lib/sitecms.mjs';
import { createRevalidateHandler } from '../api/sitecms/revalidate.mjs';

test('CMS is optional locally, required when enabled and rejects partial config', () => {
  assert.equal(cmsSettings({}), null);
  assert.throws(() => cmsSettings({ CMS_REQUIRED: 'true' }));
  assert.throws(() => cmsSettings({ CMS_SITE: 'swea' }));
  assert.throws(() => cmsSettings({ CMS_SITE: 'swea', CMS_API_KEY: 'test', CMS_API_URL: 'https://elsewhere.example' }));
});
test('CMS uses documented server API and fails build on upstream errors', async () => {
  const env = { CMS_SITE: 'swea', CMS_API_KEY: 'test' };
  const content = { pages: [{ slug: 'home', blocks: [{ key: 'hero.title', value: '<edited>' }] }], seo: [] };
  const loaded = await loadSiteContent({ env, fetchImpl: async (url, options) => {
    assert.equal(url, 'https://sitecms.se/api/v1/sites/swea/content');
    assert.equal(options.headers['x-api-key'], 'test');
    return { ok: true, json: async () => content };
  } });
  assert.equal(text(loaded, 'home', 'hero.title'), '<edited>');
  assert.equal(text(loaded, 'home', 'missing', 'fallback'), 'fallback');
  await assert.rejects(loadSiteContent({ env, fetchImpl: async () => ({ ok: false, status: 401 }) }), /HTTP 401/);
});
const env = { CMS_REVALIDATE_SECRET: 'x'.repeat(40), VERCEL_DEPLOY_HOOK_URL: 'https://api.vercel.com/v1/integrations/deploy/prj_test/test' };
async function invoke(handler, body, method = 'POST') {
  const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(raw) { this.body = JSON.parse(raw); } };
  await handler({ method, body, headers: { 'content-type': 'application/json' } }, res);
  return res;
}
test('Webhook rejects invalid auth before contacting deploy hook', async () => {
  let calls = 0;
  const handler = createRevalidateHandler({ env, fetchImpl: async () => { calls++; } });
  assert.equal((await invoke(handler, { secret: 'wrong' })).statusCode, 401);
  assert.equal((await invoke(handler, {}, 'GET')).statusCode, 405);
  assert.equal((await invoke(handler, { secret: 'x'.repeat(3000) })).statusCode, 413);
  assert.equal(calls, 0);
});
test('Webhook acknowledges only an accepted deploy hook; never claims deployment complete', async () => {
  const handler = createRevalidateHandler({ env, fetchImpl: async (url, options) => {
    assert.equal(url, env.VERCEL_DEPLOY_HOOK_URL);
    assert.equal(options.method, 'POST');
    return { ok: true };
  } });
  const res = await invoke(handler, { secret: env.CMS_REVALIDATE_SECRET });
  assert.equal(res.statusCode, 202);
  assert.equal(res.body.accepted, true);
  assert.equal(res.body.revalidated, undefined);
  const failed = createRevalidateHandler({ env, fetchImpl: async () => ({ ok: false }) });
  assert.equal((await invoke(failed, { secret: env.CMS_REVALIDATE_SECRET })).statusCode, 503);
});
