import assert from "node:assert/strict";
import test from "node:test";
import { ownedReferralWhere, TRUSTED_REFERRAL_SELECT, toTrustedReferralContext } from "../src/lib/ambassador-referral-context.ts";

test("ownedReferralWhere includes both id and ambassadorId", () => {
  const where = ownedReferralWhere("ref-123", "amb-456");
  assert.equal(where.id, "ref-123");
  assert.equal(where.ambassadorId, "amb-456");
});

test("TRUSTED_REFERRAL_SELECT contains only safe fields", () => {
  const select = TRUSTED_REFERRAL_SELECT;
  assert.equal(select.name, true);
  assert.equal(select.company, true);
  assert.equal(select.status, true);
  assert.equal(select.updatedAt, true);
  assert.equal("phone" in select, false);
  assert.equal("email" in select, false);
  assert.equal("contactMethod" in select, false);
  assert.equal("adminNotes" in select, false);
  assert.equal("commissionAmount" in select, false);
  assert.equal("commissionRate" in select, false);
  assert.equal("commissionStatus" in select, false);
  assert.equal("payoutMethod" in select, false);
  assert.equal("payoutDetails" in select, false);
});

test("toTrustedReferralContext returns only safe fields", () => {
  const referral = {
    name: "أحمد محمد",
    company: "شركة التقنية",
    status: "INTERESTED",
    updatedAt: new Date("2024-01-15T10:30:00.000Z"),
    phone: "+963999888777",
    email: "secret@example.com",
    contactMethod: "WhatsApp +963999888777",
    adminNotes: "internal note",
    commissionAmount: 1000,
    commissionRate: 10,
    commissionStatus: "PAID",
    payoutMethod: "شام كاش",
    payoutDetails: "account details",
  };

  const context = toTrustedReferralContext(referral);

  assert.equal(context.name, "أحمد محمد");
  assert.equal(context.company, "شركة التقنية");
  assert.equal(context.status, "INTERESTED");
  assert.equal(context.updatedAt, "2024-01-15T10:30:00.000Z");

  // Sensitive fields must NOT be present
  assert.ok(!("phone" in context));
  assert.ok(!("email" in context));
  assert.ok(!("contactMethod" in context));
  assert.ok(!("adminNotes" in context));
  assert.ok(!("commissionAmount" in context));
  assert.ok(!("commissionRate" in context));
  assert.ok(!("commissionStatus" in context));
  assert.ok(!("payoutMethod" in context));
  assert.ok(!("payoutDetails" in context));
});

test("toTrustedReferralContext handles null updatedAt", () => {
  const referral = {
    name: "Test",
    company: "Test Co",
    status: "NEW",
    updatedAt: null,
  };

  const context = toTrustedReferralContext(referral);
  assert.equal(context.updatedAt, null);
});

test("toTrustedReferralContext handles undefined updatedAt", () => {
  const referral = {
    name: "Test",
    company: "Test Co",
    status: "NEW",
  };

  const context = toTrustedReferralContext(referral);
  assert.equal(context.updatedAt, null);
});

// Integration test - skipped unless RUN_INTEGRATION_TESTS=1
if (process.env.RUN_INTEGRATION_TESTS) {
  const TEST_BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

  test("owned referral contract: API rejects referralId not owned by current ambassador", async () => {
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
  });

  test("owned referral contract: API works without referralId (backward compatibility)", async () => {
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
  });
} else {
  test.skip("owned referral contract: API rejects referralId not owned by current ambassador (integration)");
  test.skip("owned referral contract: API accepts referralId owned by current ambassador (integration)");
  test.skip("owned referral contract: API works without referralId (integration)");
}