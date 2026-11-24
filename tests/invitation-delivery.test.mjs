import assert from "node:assert/strict";
import test from "node:test";
import { deliverInvitation } from "../src/lib/invitation-delivery.ts";

const message = { to: "ambassador@example.com", subject: "Invitation", html: "Secure link" };
const config = { apiKey: "test-key", from: "CyberWeel <test@example.com>" };

test("missing mail configuration fails without contacting the provider", async () => {
  let calls = 0;
  const result = await deliverInvitation(message, {}, async () => { calls++; });
  assert.deepEqual(result, { sent: false, error: "EMAIL_NOT_CONFIGURED" });
  assert.equal(calls, 0);
});

test("provider acceptance requires a message ID and sends the intended envelope", async () => {
  const result = await deliverInvitation(message, config, async (url, options) => {
    assert.equal(url, "https://api.resend.com/emails");
    assert.equal(options.headers.Authorization, "Bearer test-key");
    assert.deepEqual(JSON.parse(options.body), { from: config.from, ...message });
    assert.ok(options.signal instanceof AbortSignal);
    return Response.json({ id: "mail-1" });
  });
  assert.deepEqual(result, { sent: true });
});

for (const [name, response] of [
  ["sender rejection", () => Response.json({ message: "Unverified sender" }, { status: 403 })],
  ["rate limit", () => Response.json({ message: "Too many requests" }, { status: 429 })],
  ["invalid success payload", () => Response.json({})],
  ["non-JSON response", () => new Response("upstream unavailable", { status: 502 })],
]) {
  test(`${name} never reports successful delivery`, async () => {
    assert.deepEqual(await deliverInvitation(message, config, async () => response()), { sent: false, error: "EMAIL_SEND_FAILED" });
  });
}

test("network errors and timeouts produce a recoverable failure", async () => {
  for (const error of [new TypeError("network down"), new DOMException("timed out", "TimeoutError")]) {
    assert.deepEqual(await deliverInvitation(message, config, async () => { throw error; }), { sent: false, error: "EMAIL_SEND_FAILED" });
  }
});
