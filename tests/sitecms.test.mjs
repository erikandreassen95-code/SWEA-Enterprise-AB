import test from 'node:test';
import assert from 'node:assert/strict';
import { cmsSettings, loadSiteContent, text } from '../lib/sitecms.mjs';

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
  await assert.rejects(loadSiteContent({ env, fetchImpl: async () => ({ ok: false, status: 401, json: async () => ({error:"Unauthorized"}) }) }), /HTTP 401/);
});
