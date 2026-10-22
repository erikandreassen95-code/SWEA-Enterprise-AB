import { readFileSync } from 'node:fs';
import { loadSiteContent } from '../lib/sitecms.mjs';
import { renderSite } from '../lib/render-site.mjs';
import { cookies, PANEL_ORIGINS } from '../lib/sitecms-preview.mjs';

const privacyHtml = readFileSync(new URL('../content/privacy.html', import.meta.url), 'utf8');

export function createPageHandler({ env = process.env, loadContent = loadSiteContent } = {}) {
  return async function handler(req, res) {
    res.setHeader('Content-Security-Policy', `frame-ancestors 'self' ${PANEL_ORIGINS.join(' ')}`);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('CDN-Cache-Control', 'no-store');
    res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.setHeader('Allow', 'GET, HEAD');
      res.statusCode = 405;
      return res.end();
    }
    const url = new URL(req.url, 'https://internal.invalid');
    const path = url.searchParams.get('path') || url.pathname;
    const key = path === '/' ? '/index.html' : `${path.replace(/\/$/, '')}/index.html`;
    try {
      const cmsContent = await loadContent({ env: { ...env, CMS_REQUIRED: 'true' } });
      const preview = cookies(req).sitecms_preview_active === '1';
      if (preview) res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      const pages = renderSite({ cmsContent, env: preview ? { ...env, SITE_INDEXABLE: 'false' } : env, privacyHtml });
      const html = pages.get(key);
      res.statusCode = html ? 200 : 404;
      return res.end(req.method === 'HEAD' ? undefined : html || pages.get('/404.html'));
    } catch {
      res.statusCode = 503;
      res.setHeader('Retry-After', '30');
      return res.end(req.method === 'HEAD' ? undefined : '<!doctype html><html lang="sv"><meta charset="utf-8"><meta name="robots" content="noindex"><title>Tillfälligt otillgänglig</title><h1>Sidan kunde inte hämtas just nu.</h1><p>Försök igen om en stund eller kontakta oss på <a href="mailto:info@sweaenterprise.se">info@sweaenterprise.se</a>.</p></html>');
    }
  };
}

export default createPageHandler();
