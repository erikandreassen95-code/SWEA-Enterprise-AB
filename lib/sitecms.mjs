import { createSitecms, text as cmsText, seo as cmsSeo } from 'sitecms-next';
const DEFAULT_API_URL = 'https://sitecms.se';

export function cmsSettings(env = process.env) {
  const site = (env.CMS_SITE || '').trim();
  const apiKey = (env.CMS_API_KEY || '').trim();
  if (!site && !apiKey && env.CMS_REQUIRED !== 'true') return null;
  if (!apiKey) throw new Error('SiteCMS kräver CMS_API_KEY.');
  if (site && !/^[a-z0-9][a-z0-9._-]*$/.test(site)) throw new Error('CMS_SITE har ogiltigt format.');
  let url;
  try { url = new URL(env.CMS_API_URL || DEFAULT_API_URL); }
  catch { throw new Error('CMS_API_URL är ogiltig.'); }
  if (url.origin !== DEFAULT_API_URL || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('CMS_API_URL ska vara https://sitecms.se.');
  }
  return { baseUrl: site ? `${url.origin}/api/v1/sites/${encodeURIComponent(site)}` : `${url.origin}/api/v1/site`, apiKey };
}

export async function loadSiteContent({ env = process.env, fetchImpl = fetch } = {}) {
  const settings = cmsSettings(env);
  if (!settings) return null;
  const content = await createSitecms({
    apiKey: settings.apiKey,
    apiUrl: 'https://sitecms.se',
    site: env.CMS_SITE || '',
    fetch: (url, options) => fetchImpl(url, { ...options, cache: 'no-store', signal: AbortSignal.timeout(15_000), redirect: 'error' }),
  }).getContent();
  if (!content || !Array.isArray(content.pages) || !Array.isArray(content.seo)) {
    throw new Error('SiteCMS returnerade ett ogiltigt innehållsformat.');
  }
  return content;
}

// Return plain text only. The renderer must HTML-escape this value.
export function text(content, pageSlug, key, fallback = '') {
  return content ? cmsText(content, pageSlug, key, fallback) : fallback;
}

export function seo(content, pageSlug) {
  return content ? cmsSeo(content, pageSlug) : null;
}
