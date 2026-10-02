import assert from "node:assert/strict";
import test from "node:test";
import { describe, it, before, after } from "node:test";

const TEST_BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

async function fetchWithAuth(url, options = {}) {
  const response = await fetch(`${TEST_BASE_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
  });
  return response;
}

test("owned referral contract: API rejects referralId not owned by current ambassador", async () => {
  if (!process.env.RUN_INTEGRATION_TESTS) {
    console.log("Skipping integration test - set RUN_INTEGRATION_TESTS=1 to run");
    return;
  }

  const ambassador1Cookie = process.env.AMBASSADOR_1_COOKIE;
  const ambassador2Cookie = process.env.AMBASSADOR_2_COOKIE;
  const ambassador2ReferralId = process.env.AMBASSADOR_2_REFERRAL_ID;

  if (!ambassador1Cookie || !ambassador2Cookie || !ambassador2ReferralId) {
    console.log("Skipping - requires AMBASSADOR_1_COOKIE, AMBASSADOR_2_COOKIE, AMBASSADOR_2_REFERRAL_ID");
    return;
  }

  const response = await fetch(`${TEST_BASE_URL}/api/ambassador/assistant`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: ambassador1Cookie,
    },
    body: JSON.stringify({
      mode: "WHATSAPP_MESSAGE",
      situation: "أريد رسالة متابعة لهذه الإحالة",
      referralId: ambassador2ReferralId,
    }),
  });

  assert.equal(response.status, 404);
  const data = await response.json();
  assert.equal(data.error, "REFERRAL_NOT_FOUND");
});

test("owned referral contract: API accepts referralId owned by current ambassador", async () => {
  if (!process.env.RUN_INTEGRATION_TESTS) {
    console.log("Skipping integration test - set RUN_INTEGRATION_TESTS=1 to run");
    return;
  }

  const ambassador1Cookie = process.env.AMBASSADOR_1_COOKIE;
  const ambassador1ReferralId = process.env.AMBASSADOR_1_REFERRAL_ID;

  if (!ambassador1Cookie || !ambassador1ReferralId) {
    console.log("Skipping - requires AMBASSADOR_1_COOKIE, AMBASSADOR_1_REFERRAL_ID");
    return;
  }

  const response = await fetch(`${TEST_BASE_URL}/api/ambassador/assistant`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: ambassador1Cookie,
    },
    body: JSON.stringify({
      mode: "WHATSAPP_MESSAGE",
      situation: "أريد رسالة متابعة لهذه الإحالة",
      referralId: ambassador1ReferralId,
    }),
  });

  assert.equal(response.status, 200);
  const data = await response.json();
  assert.ok(data.answer);
  assert.ok(typeof data.answer === "string");
  assert.ok(data.answer.length > 0);
});

test("owned referral contract: API works without referralId (backward compatibility)", async () => {
  if (!process.env.RUN_INTEGRATION_TESTS) {
    console.log("Skipping integration test - set RUN_INTEGRATION_TESTS=1 to run");
    return;
  }

  const ambassador1Cookie = process.env.AMBASSADOR_1_COOKIE;

  if (!ambassador1Cookie) {
    console.log("Skipping - requires AMBASSADOR_1_COOKIE");
    return;
  }

  const response = await fetch(`${TEST_BASE_URL}/api/ambassador/assistant`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: ambassador1Cookie,
    },
    body: JSON.stringify({
      mode: "WHATSAPP_MESSAGE",
      situation: "أريد رسالة متابعة عامة",
    }),
  });

  assert.equal(response.status, 200);
  const data = await response.json();
  assert.ok(data.answer);
  assert.ok(typeof data.answer === "string");
  assert.ok(data.answer.length > 0);
});