import { createHmac } from 'node:crypto';
import { cmsSettings } from '../lib/sitecms.mjs';

const MAX_BODY_BYTES = 16_384;
const REQUEST_TIMEOUT_MS = 8_000;
const EMAIL_RE = /^[^\s@\x00-\x1f\x7f]+@[^\s@\x00-\x1f\x7f]+\.[^\s@\x00-\x1f\x7f]+$/;

function validSender(value) {
  if (EMAIL_RE.test(value || "")) return true;
  const named = /^([^<>\r\n\x00-\x1f\x7f]{1,100}) <([^<>]+)>$/.exec(value || "");
  return Boolean(named && EMAIL_RE.test(named[2]));
}

function respond(res, status, message) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify({ message }));
}

function parseSiteUrl(value) {
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return null;
    return url;
  } catch {
    return null;
  }
}

async function readBody(req) {
  const declaredSize = Number(req.headers["content-length"]);
  if (Number.isFinite(declaredSize) && declaredSize > MAX_BODY_BYTES) return null;
  if (req.body !== undefined) {
    const raw = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    if (Buffer.byteLength(raw) > MAX_BODY_BYTES) return null;
    return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) return null;
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function cleanField(value, maxLength, required = false, multiline = false) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if ((required && !trimmed) || trimmed.length > maxLength) return null;
  if (/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(trimmed)) return null;
  if (!multiline && /[\r\n]/.test(trimmed)) return null;
  return trimmed;
}

function validateSubmission(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const fields = {
    name: cleanField(body.name, 100, true),
    email: cleanField(body.email, 200, true),
    company: cleanField(body.company, 100),
    phone: cleanField(body.phone, 40, true),
    location: cleanField(body.location, 100),
    service: cleanField(body.service, 80, true),
    description: cleanField(body.description, 2_000, true, true),
  };
  if (Object.values(fields).some((value) => value === null)) return null;
  if (!EMAIL_RE.test(fields.email) || fields.description.length < 10) return null;
  if (fields.name.length < 2 || body.consent !== true) return null;
  const phone = fields.phone.replace(/[\s\-().]/g, '').replace(/^0046/, '+46').replace(/^0/, '+46');
  if (!/^\+46[1-9]\d{5,9}$/.test(phone)) return null;
  fields.phone = phone;
  return fields;
}

export function createContactHandler({ env = process.env, fetchImpl = fetch } = {}) {
  return async function contactHandler(req, res) {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return respond(res, 405, "Metoden stöds inte.");
    }
    if (new URL(req.url || "/api/contact", "https://internal.invalid").pathname !== "/api/contact") {
      return respond(res, 404, "Sidan hittades inte.");
    }

    const siteUrl = parseSiteUrl(env.SITE_URL);
    const from = env.CONTACT_FROM_EMAIL;
    const to = env.CONTACT_TO_EMAIL;
    let cms;
    try { cms = cmsSettings({ ...env, CMS_REQUIRED: 'true' }); } catch { /* fail closed below */ }
    if (!siteUrl || !validSender(from) || !EMAIL_RE.test(to || "") || !env.RESEND_API_KEY || !cms) {
      return respond(res, 503, "Kontaktformuläret är tillfälligt otillgängligt.");
    }
    if (req.headers.origin !== siteUrl.origin) {
      return respond(res, 403, "Begäran nekades.");
    }
    if (!/^application\/json(?:\s*;|\s*$)/i.test(req.headers["content-type"] || "")) {
      return respond(res, 415, "Fel innehållstyp.");
    }

    let body;
    try {
      body = await readBody(req);
    } catch {
      return respond(res, 400, "Kontrollera formuläret och försök igen.");
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return respond(res, 400, "Kontrollera formuläret och försök igen.");
    }
    // A filled honeypot is acknowledged without contacting either external service.
    if (typeof body.website === "string" && body.website.trim()) {
      return respond(res, 200, "Tack! Din förfrågan har skickats.");
    }
    if (body.website !== "" && body.website !== undefined) {
      return respond(res, 400, "Kontrollera formuläret och försök igen.");
    }
    const fields = validateSubmission(body);
    if (!fields) return respond(res, 400, "Kontrollera formuläret och försök igen.");

    let quote;
    try {
      const ip = req.headers['x-vercel-forwarded-for']?.split(',')[0]?.trim();
      const stored = await fetchImpl('https://sitecms.se/api/v1/site/quote-requests', {
        method: 'POST',
        headers: { 'x-api-key': cms.apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, jobType: fields.service, consent: true,
          ...(ip ? { ipHash: createHmac('sha256', cms.apiKey).update(ip).digest('hex') } : {}),
        }),
        redirect: 'error',
        signal: AbortSignal.timeout(20_000),
      });
      if (!stored.ok) return respond(res, stored.status === 429 ? 429 : stored.status === 400 ? 400 : 502,
        stored.status === 429 ? 'För många försök. Vänta en stund eller ring oss.' : 'Förfrågan kunde inte registreras. Kontrollera uppgifterna och försök igen.');
      quote = await stored.json();
      if (typeof quote.id !== 'string' || !quote.id) throw new Error('Missing request ID');
    } catch {
      return respond(res, 502, 'Förfrågan kunde inte registreras. Försök igen senare.');
    }

    const content = [
      `Namn: ${fields.name}`,
      `E-post: ${fields.email}`,
      `Företag: ${fields.company || "Ej angivet"}`,
      `Telefon: ${fields.phone || "Ej angivet"}`,
      `Ort: ${fields.location || "Ej angiven"}`,
      `Tjänsteområde: ${fields.service}`,
      "",
      "Beskrivning:",
      fields.description,
    ].join("\n");
    try {
      const delivery = await fetchImpl("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          'Idempotency-Key': `quote-${quote.id}`,
        },
        body: JSON.stringify([{
          from,
          to: [to],
          reply_to: fields.email,
          subject: "Ny förfrågan via SWEA Enterprise",
          text: `Förfrågan ${quote.id}\n\n${content}`,
        }, {
          from: 'SWEA Enterprise AB <info@sweaenterprise.se>',
          to: [fields.email],
          reply_to: 'info@sweaenterprise.se',
          subject: 'Vi har tagit emot din förfrågan – SWEA Enterprise AB',
          text: `Hej!\n\nTack för att du kontaktar SWEA Enterprise AB. Vi har tagit emot din förfrågan och återkommer så snart vi kan.\n\nReferens: ${quote.id}\n\nDetta är en mottagningsbekräftelse, inte en boknings- eller offertbekräftelse. Du kan svara på det här mejlet om du vill komplettera din förfrågan.\n\nVänliga hälsningar\nAnton\nSWEA Enterprise AB\ninfo@sweaenterprise.se\n073-368 86 66`,
        }]),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!delivery.ok) throw new Error('Mail delivery failed');
      return respond(res, 200, "Tack! Din förfrågan har skickats.");
    } catch {
      console.error('contact: request stored but email failed', { requestId: quote.id });
      return respond(res, 200, 'Din förfrågan är mottagen. Bekräftelsemejlet kunde inte skickas just nu.');
    }
  };
}

export default createContactHandler();
