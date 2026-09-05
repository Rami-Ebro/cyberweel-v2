import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { accountInvitationCopy } from "../src/lib/account-invitation-copy.ts";
import { shouldSendAcceptanceInvitation } from "../src/lib/account-invitation-policy.ts";
import { canUsePasswordAccess } from "../src/lib/password-access.ts";

const acceptanceSource = await readFile(new URL("../src/lib/accept-collaboration.ts", import.meta.url), "utf8");
const profileRouteSource = await readFile(new URL("../src/app/api/profile/route.ts", import.meta.url), "utf8");
const ambassadorAdminPageSource = await readFile(new URL("../src/app/admin/ambassadors/page.tsx", import.meta.url), "utf8");
const ambassadorAdminRouteSource = await readFile(new URL("../src/app/api/admin/ambassadors/route.ts", import.meta.url), "utf8");

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

test("ambassador acceptance carries the canonical account phone into the ambassador record", () => {
  assert.match(acceptanceSource, /accountPhone: string \| null/);
  assert.match(acceptanceSource, /phone: existing\.phone \|\| accountPhone/);
  assert.match(acceptanceSource, /phone: accountPhone/);
  assert.match(acceptanceSource, /ensureAmbassadorForUser\(tx, user\.id, application, notes, user\.phone\)/);
});

test("ambassador profile reuses the account phone and keeps account and ambassador phones synchronized", () => {
  assert.match(profileRouteSource, /phone: user\.phone \|\| user\.ambassador\?\.phone \|\| null/);
  assert.match(profileRouteSource, /phoneIdentityCandidates\(phone\)/);
  assert.match(profileRouteSource, /db\.\$transaction\(\[/);
  assert.match(profileRouteSource, /db\.user\.update\(\{ where: \{ id: user\.id \}, data: \{ phone \} \}\)/);
  assert.match(profileRouteSource, /db\.ambassador\.update\(\{/);
});

test("admin accepts ambassadors without entering or transmitting a password", () => {
  assert.doesNotMatch(ambassadorAdminPageSource, /name="password"/);
  assert.doesNotMatch(ambassadorAdminPageSource, /كلمة مرور مؤقتة عند القبول/);
  assert.doesNotMatch(ambassadorAdminPageSource, /body: JSON\.stringify\(\{ entity: "application", id, status, notes, password \}\)/);
  assert.match(ambassadorAdminRouteSource, /randomBytes\(32\)\.toString\("base64url"\)/);
  assert.doesNotMatch(ambassadorAdminRouteSource, /body\.password/);
});
