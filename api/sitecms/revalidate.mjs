import { createHash, timingSafeEqual } from 'node:crypto';

const equal = (a, b) => timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());
function reply(res, status, payload) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.statusCode = status;
  res.end(JSON.stringify(payload));
}

export function createRevalidateHandler({ env = process.env, fetchImpl = fetch } = {}) {
  return async function handler(req, res) {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return reply(res, 405, { error: 'Använd POST.' });
    }
    const expected = env.CMS_REVALIDATE_SECRET;
    let hook;
    try { hook = new URL(env.VERCEL_DEPLOY_HOOK_URL); } catch { /* configured below */ }
    if (!expected || expected.length < 32 || !hook || hook.origin !== 'https://api.vercel.com' || !hook.pathname.startsWith('/v1/integrations/deploy/') || hook.username || hook.password || hook.hash) {
      return reply(res, 503, { error: 'CMS-publicering är inte konfigurerad.' });
    }
    if (!(req.headers?.['content-type'] || '').toLowerCase().startsWith('application/json')) {
      return reply(res, 415, { error: 'Använd application/json.' });
    }
    let body;
    try {
      if (Number(req.headers?.['content-length'] || 0) > 2048) return reply(res, 413, { error: 'För stor begäran.' });
      if (req.body !== undefined) {
        const raw = typeof req.body === 'string' || Buffer.isBuffer(req.body) ? String(req.body) : JSON.stringify(req.body);
        if (Buffer.byteLength(raw) > 2048) return reply(res, 413, { error: 'För stor begäran.' });
        body = JSON.parse(raw);
      } else {
        const chunks = [];
        let size = 0;
        for await (const chunk of req) {
          const buffer = Buffer.from(chunk);
          size += buffer.length;
          if (size > 2048) return reply(res, 413, { error: 'För stor begäran.' });
          chunks.push(buffer);
        }
        body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      }
    } catch { return reply(res, 400, { error: 'Ogiltig JSON.' }); }
    if (typeof body?.secret !== 'string' || !equal(body.secret, expected)) {
      return reply(res, 401, { error: 'Fel hemlighet.' });
    }
    try {
      const response = await fetchImpl(hook.href, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(3000) });
      if (!response.ok) throw new Error('Hook failed');
      return reply(res, 202, { accepted: true, message: 'Ett nytt webbbygge har begärts. Innehållet syns när deployen är klar.' });
    } catch {
      return reply(res, 503, { error: 'Publiceringen kunde inte startas. Spara igen eller starta en deploy i Vercel.' });
    }
  };
}

export default createRevalidateHandler();
