export const PANEL_ORIGINS = ['https://sitecms.se', 'https://www.sitecms.se', 'https://sitecms-zeta.vercel.app'];
export const previewCookies = ['sitecms_preview', 'sitecms_preview_origin', 'sitecms_preview_active'];
export function cookies(req) {
  const result = {};
  for (const item of (req.headers?.cookie || '').split(';')) {
    const i = item.indexOf('=');
    if (i < 0) continue;
    try { result[item.slice(0, i).trim()] = decodeURIComponent(item.slice(i + 1)); } catch { /* invalid cookie */ }
  }
  return result;
}
export function setPreviewCookies(res, token = '', origin = '') {
  res.setHeader('Set-Cookie', previewCookies.map((name, i) => `${name}=${encodeURIComponent([token, origin, token ? '1' : ''][i])}; ${i < 2 ? 'HttpOnly; ' : ''}Secure; SameSite=None; Partitioned; Path=/; Max-Age=${token ? 7200 : 0}`));
}
export function noStore(res) {
  for (const header of ['Cache-Control', 'CDN-Cache-Control', 'Vercel-CDN-Cache-Control']) res.setHeader(header, 'no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
}
export async function verifyPreview(token, env, fetchImpl) {
  if (typeof token !== 'string' || !token || token.length > 3500 || /[\x00-\x20\x7f]/.test(token) || !env.CMS_API_KEY) return null;
  const r = await fetchImpl('https://sitecms.se/api/v1/site/preview', {
    headers: { 'x-api-key': env.CMS_API_KEY, 'x-sitecms-preview': token },
    cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) return null;
  const data = await r.json();
  return data.ok === true && PANEL_ORIGINS.includes(data.panelOrigin) ? data : null;
}

