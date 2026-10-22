import { noStore, setPreviewCookies, verifyPreview } from '../../lib/sitecms-preview.mjs';

function safePath(path) {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') && !/[\\\x00-\x20\x7f]/.test(path)
    && !/^\/(?:%2f|%5c)/i.test(path);
}
export function createPreviewHandler({ env = process.env, fetchImpl = fetch } = {}) {
  return async (req, res) => {
    noStore(res);
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    if (req.method !== 'GET') { res.statusCode = 405; res.setHeader('Allow', 'GET'); return res.end(); }
    const url = new URL(req.url, 'https://internal.invalid');
    const path = url.searchParams.get('path') || '/';
    if (!safePath(path)) { res.statusCode = 401; res.setHeader('Content-Type', 'text/html; charset=utf-8'); return res.end('<!doctype html><html lang="sv"><meta charset="utf-8"><title>Ogiltig förhandsgranskning</title><h1>Ogiltig adress för förhandsgranskning.</h1></html>'); }
    if (url.searchParams.get('disable') === '1') {
      setPreviewCookies(res); res.statusCode = 307; res.setHeader('Location', path); return res.end();
    }
    const token = url.searchParams.get('token');
    let verified;
    try { verified = await verifyPreview(token, env, fetchImpl); } catch { /* deny */ }
    if (!verified) {
      setPreviewCookies(res); res.statusCode = 401; res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.end('<!doctype html><html lang="sv"><meta charset="utf-8"><title>Förhandsgranskningen är inte tillgänglig</title><h1>Förhandsgranskningen har gått ut eller är ogiltig.</h1><p>Öppna en ny förhandsgranskning från SiteCMS.</p></html>');
    }
    setPreviewCookies(res, token, verified.panelOrigin);
    res.statusCode = 307; res.setHeader('Location', path); res.end();
  };
}
export default createPreviewHandler();
