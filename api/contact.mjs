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
    email: cleanField(body.email, 254, true),
    company: cleanField(body.company, 120),
    phone: cleanField(body.phone, 40),
    location: cleanField(body.location, 120),
    service: cleanField(body.service, 80, true),
    description: cleanField(body.description, 2_000, true, true),
  };
  if (Object.values(fields).some((value) => value === null)) return null;
  if (!EMAIL_RE.test(fields.email) || fields.description.length < 10) return null;
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
    if (!siteUrl || !validSender(from) || !EMAIL_RE.test(to || "") || !env.RESEND_API_KEY) {
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
      const delivery = await fetchImpl("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [to],
          reply_to: fields.email,
          subject: "Ny förfrågan via SWEA Enterprise",
          text: content,
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!delivery.ok) return respond(res, 502, "Förfrågan kunde inte skickas. Försök igen senare.");
      return respond(res, 200, "Tack! Din förfrågan har skickats.");
    } catch {
      return respond(res, 502, "Förfrågan kunde inte skickas. Försök igen senare.");
    }
  };
}

export default createContactHandler();
