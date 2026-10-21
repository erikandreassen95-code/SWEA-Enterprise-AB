import test from 'node:test';
import assert from 'node:assert/strict';
import { clientIp, createRateLimiter } from '../lib/contact-rate-limit.mjs';

test('rate window expires and one IP does not consume another IP quota', () => {
  let time = 0;
  const consume = createRateLimiter({ now: () => time, limit: 1, windowMs: 10_000 });
  assert.equal(consume('a'), 0);
  assert.equal(consume('a'), 10);
  assert.equal(consume('b'), 0);
  time = 10_001;
  assert.equal(consume('a'), 0);
});

test('IP parsing canonicalizes IPv6 and only uses trusted production headers', () => {
  assert.equal(clientIp({headers:{'x-vercel-forwarded-for':'2001:0db8:0:0:0:0:0:1'}},{VERCEL:'1'}),'2001:db8::1');
  assert.equal(clientIp({headers:{'x-forwarded-for':'192.0.2.1'}},{VERCEL:'1'}),null);
  assert.equal(clientIp({headers:{},socket:{remoteAddress:'127.0.0.1'}},{}),'127.0.0.1');
});
