const DEFAULT_API_URL = 'https://sitecms.se';

export function cmsSettings(env = process.env) {
  const site = (env.CMS_SITE || '').trim();
  const apiKey = (env.CMS_API_KEY || '').trim();
  if (!site && !apiKey && env.CMS_REQUIRED !== 'true') return null;
  if (!site || !apiKey) throw new Error('SiteCMS kräver CMS_SITE och CMS_API_KEY.');
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(site)) throw new Error('CMS_SITE har ogiltigt format.');
  let url;
  try { url = new URL(env.CMS_API_URL || DEFAULT_API_URL); }
  catch { throw new Error('CMS_API_URL är ogiltig.'); }
  if (url.origin !== DEFAULT_API_URL || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('CMS_API_URL ska vara https://sitecms.se.');
  }
  return { baseUrl: `${url.origin}/api/v1/sites/${encodeURIComponent(site)}`, apiKey };
}

export async function loadSiteContent({ env = process.env, fetchImpl = fetch } = {}) {
  const settings = cmsSettings(env);
  if (!settings) return null;
  const response = await fetchImpl(`${settings.baseUrl}/content`, {
    headers: { 'x-api-key': settings.apiKey, Accept: 'application/json' },
    signal: AbortSignal.timeout(15_000),
    redirect: 'error',
  });
  if (!response.ok) throw new Error(`SiteCMS innehåll kunde inte hämtas (HTTP ${response.status}).`);
  const content = await response.json();
  if (!content || !Array.isArray(content.pages) || !Array.isArray(content.seo)) {
    throw new Error('SiteCMS returnerade ett ogiltigt innehållsformat.');
  }
  return content;
}

// Return plain text only. The renderer must HTML-escape this value.
export function text(content, pageSlug, key, fallback = '') {
  const block = content?.pages?.find(page => page.slug === pageSlug)?.blocks?.find(item => item.key === key);
  return typeof block?.value === 'string' ? block.value : fallback;
}

export function seo(content, pageSlug) {
  return content?.seo?.find(item => item.pageSlug === pageSlug) || null;
}
