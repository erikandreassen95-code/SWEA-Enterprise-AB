import { cookies, noStore, verifyPreview } from '../../lib/sitecms-preview.mjs';

export function createPreviewContentHandler({ env = process.env, fetchImpl = fetch } = {}) {
  return async (req, res) => {
    noStore(res); res.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (req.method !== 'GET') { res.statusCode = 405; res.setHeader('Allow', 'GET'); return res.end(); }
    const token = cookies(req).sitecms_preview;
    try {
      const verified = await verifyPreview(token, env, fetchImpl);
      if (verified) {
        const r = await fetchImpl('https://sitecms.se/api/v1/site/content', {
          headers: { 'x-api-key': env.CMS_API_KEY, 'x-sitecms-preview': token },
          cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(8000),
        });
        if (r.ok) {
          const content = await r.json();
          if (!Array.isArray(content.pages)) throw new Error('Invalid content');
          res.statusCode = 200;
          return res.end(JSON.stringify({ preview: true, panelOrigin: verified.panelOrigin, content }));
        }
        if (r.status !== 401) throw new Error('CMS unavailable');
      }
      res.statusCode = 401; res.end(JSON.stringify({ preview: false }));
    } catch {
      res.statusCode = 503; res.end(JSON.stringify({ preview: false }));
    }
  };
}
export default createPreviewContentHandler();
