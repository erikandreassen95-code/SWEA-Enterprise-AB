import assert from "node:assert/strict";
import { test } from "node:test";
import { createContactHandler } from "../api/contact.mjs";

const env = {
  VERCEL: "1",
  SITE_URL: "https://swea.example",
  CONTACT_FROM_EMAIL: "SWEA Enterprise AB <form@swea.example>",
  CONTACT_TO_EMAIL: "info@swea.example",
  RESEND_API_KEY: "test-key",
  CMS_SITE: "swea",
  CMS_API_KEY: "test-cms-key",
};

const submission = {
  name: "Anna Test",
  email: "anna@example.com",
  company: "Exempel AB",
  phone: "0701234567",
  location: "Stockholm",
  service: "elinstallation",
  description: "Vi behöver hjälp med ett uppdrag nästa vecka.",
  website: "",
  consent: true,
};

function response() {
  return {
    statusCode: 200,
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    end(value) { this.body = JSON.parse(value); },
  };
}

async function invoke({ body = submission, headers = {}, url = "/api/contact", method = "POST", config = env, fetchImpl, handler } = {}) {
  const req = {
    method,
    url,
    headers: {
      origin: "https://swea.example",
      "x-vercel-forwarded-for": "192.0.2.10",
      "content-type": "application/json",
      ...headers,
    },
    body,
  };
  const res = response();
  await (handler || createContactHandler({ env: config, fetchImpl }))(req, res);
  return res;
}

test("stores in SiteCMS before sending company notice and customer receipt from info", async () => {
  const calls = [];
  const res = await invoke({ headers: { 'x-vercel-forwarded-for': '192.0.2.10' }, fetchImpl: async (url, options) => {
    calls.push({url, options});
    return { ok: true, json: async () => ({ id: 'quote-test-id', emailStatus: 'skipped' }) };
  } });
  assert.equal(res.statusCode, 200);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, 'https://sitecms.se/api/v1/site/quote-requests');
  const quote = JSON.parse(calls[0].options.body);
  assert.equal(quote.jobType, submission.service);
  assert.equal(quote.consent, true);
  assert.equal(quote.phone, '+46701234567');
  assert.match(quote.ipHash, /^[a-f0-9]{64}$/);
  assert.ok(!calls[0].options.body.includes('192.0.2.10'));
  assert.equal(calls[1].url, 'https://api.resend.com/emails/batch');
  const [message, receipt] = JSON.parse(calls[1].options.body);
  assert.deepEqual(message.to, ['info@swea.example']);
  assert.equal(message.reply_to, submission.email);
  assert.equal(receipt.from, 'SWEA Enterprise AB <info@sweaenterprise.se>');
  assert.deepEqual(receipt.to, [submission.email]);
  assert.equal(receipt.reply_to, 'info@sweaenterprise.se');
  assert.match(receipt.text, /tagit emot din förfrågan/);
  assert.ok(!receipt.text.includes(submission.description));
  assert.equal(calls[1].options.headers['Idempotency-Key'], 'quote-quote-test-id');
});

test("fails closed when production configuration is missing", async () => {
  let called = false;
  const res = await invoke({ config: { ...env, RESEND_API_KEY: "" }, fetchImpl: async () => { called = true; } });
  assert.equal(res.statusCode, 503);
  assert.equal(called, false);
});

test("rejects other origins and trailing-slash API paths", async () => {
  const noFetch = async () => { throw Error("Unexpected network call"); };
  assert.equal((await invoke({ headers: { origin: "https://other.example" }, fetchImpl: noFetch })).statusCode, 403);
  assert.equal((await invoke({ url: "/api/contact/", fetchImpl: noFetch })).statusCode, 404);
  assert.equal((await invoke({ method: "GET", fetchImpl: noFetch })).statusCode, 405);
});

test("rejects invalid fields and oversized requests before network calls", async () => {
  const noFetch = async () => { throw Error("Unexpected network call"); };
  assert.equal((await invoke({ body: { ...submission, email: "wrong", website: "" }, fetchImpl: noFetch })).statusCode, 400);
  assert.equal((await invoke({ body: { ...submission, description: "short" }, fetchImpl: noFetch })).statusCode, 400);
  assert.equal((await invoke({ body: { ...submission, name: "A".repeat(20_000) }, fetchImpl: noFetch })).statusCode, 400);
});

test("does not send emails when CMS storage fails", async () => {
  let calls = 0;
  const res = await invoke({ fetchImpl: async () => { calls++; return {ok:false,status:500}; } });
  assert.equal(res.statusCode, 502);
  assert.equal(calls, 1);
});

test("rate limiting from CMS is returned without sending email", async () => {
  const res = await invoke({ fetchImpl: async () => ({ok:false,status:429}) });
  assert.equal(res.statusCode, 429);
});

test("stored request stays successful if email fails so customer does not resubmit", async () => {
  let calls = 0;
  const res = await invoke({ fetchImpl: async () => {
    calls++;
    return calls === 1 ? {ok:true,json:async()=>({id:'saved-id'})} : {ok:false,status:500};
  } });
  assert.equal(res.statusCode, 200);
  assert.match(res.body.message, /Bekräftelsemejlet kunde inte skickas/);
  assert.equal(calls, 2);
});

test("requires explicit consent and a valid Swedish telephone number", async () => {
  const noFetch = async () => { throw new Error('Unexpected network call'); };
  for (const change of [{consent:false},{consent:undefined},{phone:''},{phone:'abc'}]) {
    assert.equal((await invoke({body:{...submission,...change},fetchImpl:noFetch})).statusCode,400);
  }
});

test("quietly acknowledges a filled honeypot without external calls", async () => {
  const res = await invoke({ body: { ...submission, website: "https://spam.example" }, fetchImpl: async () => { throw Error("Unexpected network call"); } });
  assert.equal(res.statusCode, 200);
});

 test('limits the sixth IP attempt locally without additional CMS or mail calls', async () => {
  let calls = 0;
  const handler = createContactHandler({env,fetchImpl:async()=>{calls++;return {ok:true,json:async()=>({id:'test-id'})};}});
  for(let i=0;i<5;i++) assert.equal((await invoke({handler})).statusCode,200);
  const blocked = await invoke({handler,headers:{'x-forwarded-for':'198.51.100.1'}});
  assert.equal(blocked.statusCode,429);
  assert.ok(Number(blocked.headers['Retry-After'])>0);
  assert.equal(calls,10);
  assert.equal((await invoke({handler,headers:{'x-vercel-forwarded-for':'192.0.2.11'}})).statusCode,200);
});

test('production rejects missing or malformed trusted IP rather than trusting spoofed headers', async () => {
  const noFetch=async()=>{throw Error('Unexpected network call');};
  for(const ip of [undefined, 'invalid', '192.0.2.1, 192.0.2.2']) {
    const res=await invoke({headers:{'x-vercel-forwarded-for':ip,'x-forwarded-for':'192.0.2.10'},fetchImpl:noFetch});
    assert.equal(res.statusCode,503);
  }
});
