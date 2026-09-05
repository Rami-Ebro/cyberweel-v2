import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const referralRouteSource = await readFile(new URL("../src/app/api/referrals/route.ts", import.meta.url), "utf8");
const identityCheckRouteSource = await readFile(new URL("../src/app/api/referrals/check-identity/route.ts", import.meta.url), "utf8");
const adminClientsRouteSource = await readFile(new URL("../src/app/api/admin/clients/route.ts", import.meta.url), "utf8");
const mailtoFormSource = await readFile(new URL("../src/components/site/mailto-form.tsx", import.meta.url), "utf8");

test("public referral intake rejects an already-registered client identity", () => {
  assert.match(referralRouteSource, /EXISTING_CLIENT/);
  assert.match(referralRouteSource, /clientEnabled/);
  assert.match(referralRouteSource, /role === "CLIENT"/);
});

test("referral conversion does not silently reuse an existing client", () => {
  assert.match(adminClientsRouteSource, /EXISTING_CLIENT/);
  assert.match(adminClientsRouteSource, /referralId/);
  assert.match(adminClientsRouteSource, /emailOwner\.role === "CLIENT" \|\| emailOwner\.clientEnabled/);
});

test("reused non-client accounts without a login can still receive an invitation", () => {
  assert.match(adminClientsRouteSource, /passwordHash: true/);
  assert.match(adminClientsRouteSource, /sendInvite && !emailOwner\?\.passwordHash/);
});

test("referral identity can be checked live without exposing client details", () => {
  assert.match(identityCheckRouteSource, /referral-identity-check/);
  assert.match(identityCheckRouteSource, /existingClient/);
  assert.doesNotMatch(identityCheckRouteSource, /select:\s*\{[^}]*email:\s*true/);
  assert.doesNotMatch(identityCheckRouteSource, /select:\s*\{[^}]*name:\s*true/);
});

test("contact form debounces live identity checks and blocks duplicates before contact submission", () => {
  assert.match(mailtoFormSource, /setTimeout\(\(\) => \{/);
  assert.match(mailtoFormSource, /\}, 500\);/);
  assert.match(mailtoFormSource, /referralIdentityStatus === "blocked"/);
  const submitStart = mailtoFormSource.indexOf("const handleSubmit = async");
  const verifyCall = mailtoFormSource.indexOf("verifyReferralIdentityBeforeSubmit(data)", submitStart);
  const contactCall = mailtoFormSource.indexOf('fetch("/api/contact"', submitStart);
  assert.ok(submitStart >= 0 && verifyCall > submitStart && contactCall > verifyCall);
});
