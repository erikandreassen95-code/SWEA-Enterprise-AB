import assert from "node:assert/strict";
import { test } from "node:test";
import { createContactHandler } from "../api/contact.mjs";

const env = {
  SITE_URL: "https://swea.example",
  CONTACT_FROM_EMAIL: "SWEA Enterprise AB <form@swea.example>",
  CONTACT_TO_EMAIL: "info@swea.example",
  RESEND_API_KEY: "test-key",
  TURNSTILE_SECRET_KEY: "test-secret",
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
  turnstileToken: "test-token",
};

function response() {
  return {
    statusCode: 200,
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    end(value) { this.body = JSON.parse(value); },
  };
}

async function invoke({ body = submission, headers = {}, url = "/api/contact", method = "POST", config = env, fetchImpl } = {}) {
  const req = {
    method,
    url,
    headers: {
      origin: "https://swea.example",
      "content-type": "application/json",
      ...headers,
    },
    body,
  };
  const res = response();
  await createContactHandler({ env: config, fetchImpl })(req, res);
  return res;
}

test("verifies Turnstile and sends plain text through Resend", async () => {
  const calls = [];
  const res = await invoke({ fetchImpl: async (url, options) => {
    calls.push({ url, options });
    if (calls.length === 1) return { ok: true, json: async () => ({ success: true, hostname: "swea.example", action: "contact" }) };
    return { ok: true };
  } });
  assert.equal(res.statusCode, 200);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, "https://challenges.cloudflare.com/turnstile/v0/siteverify");
  assert.equal(calls[0].options.body.get("secret"), "test-secret");
  assert.equal(calls[1].url, "https://api.resend.com/emails");
  const message = JSON.parse(calls[1].options.body);
  assert.equal(message.from, "SWEA Enterprise AB <form@swea.example>");
  assert.deepEqual(message.to, ["info@swea.example"]);
  assert.equal(message.reply_to, "anna@example.com");
  assert.match(message.text, /Beskrivning:\nVi behöver hjälp/);
  assert.equal(message.html, undefined);
  assert.doesNotMatch(message.text, /test-token/);
});

test("fails closed when production configuration is missing", async () => {
  let called = false;
  const res = await invoke({ config: { ...env, TURNSTILE_SECRET_KEY: "" }, fetchImpl: async () => { called = true; } });
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

test("rejects an invalid or wrongly scoped Turnstile response", async () => {
  let calls = 0;
  const res = await invoke({ fetchImpl: async () => {
    calls++;
    return { ok: true, json: async () => ({ success: true, hostname: "other.example", action: "contact" }) };
  } });
  assert.equal(res.statusCode, 400);
  assert.equal(calls, 1);
});

test("rejects a Turnstile response for another action", async () => {
  let calls = 0;
  const res = await invoke({ fetchImpl: async () => {
    calls++;
    return { ok: true, json: async () => ({ success: true, hostname: "swea.example", action: "other" }) };
  } });
  assert.equal(res.statusCode, 400);
  assert.equal(calls, 1);
});

test("does not claim delivery when Resend fails", async () => {
  let calls = 0;
  const res = await invoke({ fetchImpl: async () => {
    calls++;
    return calls === 1
      ? { ok: true, json: async () => ({ success: true, hostname: "swea.example", action: "contact" }) }
      : { ok: false, status: 500 };
  } });
  assert.equal(res.statusCode, 502);
  assert.equal(calls, 2);
});

test("quietly acknowledges a filled honeypot without external calls", async () => {
  const res = await invoke({ body: { ...submission, website: "https://spam.example" }, fetchImpl: async () => { throw Error("Unexpected network call"); } });
  assert.equal(res.statusCode, 200);
});
