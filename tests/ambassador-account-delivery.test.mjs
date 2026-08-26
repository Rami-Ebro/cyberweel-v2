import assert from "node:assert/strict";
import test from "node:test";
import { accountInvitationCopy } from "../src/lib/account-invitation-copy.ts";
import { shouldSendAcceptanceInvitation } from "../src/lib/account-invitation-policy.ts";
import { canUsePasswordAccess } from "../src/lib/password-access.ts";

test("supported account roles can request and consume password-access tokens", () => {
  assert.equal(canUsePasswordAccess("AMBASSADOR"), true);
  assert.equal(canUsePasswordAccess("PARTNER"), true);
  assert.equal(canUsePasswordAccess("CLIENT"), true);
  assert.equal(canUsePasswordAccess("ADMIN"), true);
});

test("ambassador acceptance copy uses a secure set-password link without a plaintext password", () => {
  const url = "https://preview.example/partner/reset-password?token=secure-token";
  const arabic = accountInvitationCopy("AMBASSADOR", "ar", url);
  const english = accountInvitationCopy("AMBASSADOR", "en", url);

  assert.match(arabic.subject, /قبول طلبك/);
  assert.match(arabic.html, /تعيين كلمة المرور وتفعيل الحساب/);
  assert.match(arabic.html, /secure-token/);
  assert.doesNotMatch(arabic.html, /مؤقتة/);

  assert.match(english.subject, /accepted/i);
  assert.match(english.html, /set your password and activate your account/i);
  assert.match(english.html, /secure-token/);
  assert.doesNotMatch(english.html, /temporary password/i);
});

test("an idempotent acceptance does not send another invitation", () => {
  assert.equal(shouldSendAcceptanceInvitation({ idempotent: true, userId: "user-1", email: "ambassador@example.com" }), false);
  assert.equal(shouldSendAcceptanceInvitation({ idempotent: false, userId: "user-1", email: "ambassador@example.com" }), true);
  assert.equal(shouldSendAcceptanceInvitation({ idempotent: false, userId: null, email: "ambassador@example.com" }), false);
});
