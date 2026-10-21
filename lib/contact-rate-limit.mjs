import { isIP } from 'node:net';

export function clientIp(req, env) {
  const raw = env.VERCEL === '1' ? req.headers['x-vercel-forwarded-for'] : req.socket?.remoteAddress;
  if (typeof raw !== 'string' || !isIP(raw.trim())) return null;
  const ip = raw.trim();
  return isIP(ip) === 6 ? new URL(`http://[${ip}]/`).hostname.slice(1, -1) : ip;
}

// Short-burst protection per function instance. SiteCMS also enforces the shared
// five-request hourly limit using the same hashed IP across all instances.
export function createRateLimiter({ now = Date.now, limit = 5, windowMs = 600_000, capacity = 10_000 } = {}) {
  const buckets = new Map();
  return function consume(key) {
    const time = now();
    for (const [id, bucket] of buckets) if (bucket.until <= time) buckets.delete(id);
    let bucket = buckets.get(key);
    if (!bucket) {
      if (buckets.size >= capacity) return 60;
      bucket = { count: 0, until: time + windowMs };
      buckets.set(key, bucket);
    }
    if (bucket.count >= limit) return Math.max(1, Math.ceil((bucket.until - time) / 1000));
    bucket.count++;
    return 0;
  };
}
