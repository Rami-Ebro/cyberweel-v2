import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

const [
  adminAuth,
  adminLayout,
  clientAccess,
  clientLayout,
  ambassadorAuth,
  ambassadorLayout,
  accountAccess,
  accountLayout,
  partnerLayout,
  dashboardEntry,
] = await Promise.all([
  source("src/lib/admin-auth.ts"),
  source("src/app/admin/layout.tsx"),
  source("src/lib/client-access.ts"),
  source("src/app/client/layout.tsx"),
  source("src/lib/ambassador-auth.ts"),
  source("src/app/ambassador/dashboard/layout.tsx"),
  source("src/lib/account-access.ts"),
  source("src/app/account/layout.tsx"),
  source("src/app/partner/dashboard/layout.tsx"),
  source("src/app/dashboard/page.tsx"),
]);

test("admin layout requires a real server-side admin session before rendering", () => {
  assert.ok(adminLayout.includes("const access = await requireAdminShellAccess();"));
  assert.ok(adminLayout.includes("<AdminShellAccessProvider access={access}>"));
  assert.ok(adminAuth.includes("export async function requireAdminShellAccess"));
  assert.ok(adminAuth.includes("export async function getAdminShellAccess"));
  assert.ok(adminAuth.includes("verifySessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)"), "legacy owner session must remain supported");
  assert.ok(adminAuth.includes("readPartnerSession(cookieStore.get(PARTNER_SESSION_COOKIE)?.value)"), "unified account session must remain supported");
  assert.ok(adminAuth.includes('user.role !== "ADMIN"'));
  assert.ok(adminAuth.includes("!user.isActive"));
  assert.ok(adminAuth.includes("user.adminProfile?.isActive === false"));
  assert.ok(adminAuth.includes('redirect("/login")'));
});

test("client routes validate the signed unified session and client capability on the server", () => {
  assert.ok(clientLayout.includes("await currentClientAccessFromCookies()"));
  assert.ok(clientLayout.includes('redirect("/login?next=/client/dashboard")'));
  assert.ok(clientAccess.includes("export async function currentClientAccessFromCookies"));
  assert.ok(clientAccess.includes("readPartnerSession(token)"));
  assert.ok(clientAccess.includes("isActive: true"));
  assert.ok(clientAccess.includes('OR: [{ role: "CLIENT" }, { clientEnabled: true }]'));
});

test("ambassador dashboard is server guarded without breaking admin preview", () => {
  assert.ok(ambassadorLayout.includes('await hasAdminPermission("ambassadors")'), "admin preview permission must remain allowed");
  assert.ok(ambassadorLayout.includes("await currentAmbassadorFromCookies()"));
  assert.ok(ambassadorLayout.includes('redirect("/login?next=/ambassador/dashboard")'));
  assert.ok(ambassadorLayout.includes('redirect("/complete-profile?capability=AMBASSADOR")'));
  assert.ok(ambassadorAuth.includes("export async function currentAmbassadorFromCookies"));
  assert.ok(ambassadorAuth.includes("readPartnerSession(token)"));
  assert.ok(ambassadorAuth.includes('user.ambassador.status !== "ACTIVE"'));
});

test("account settings are rejected before the client shell for missing, inactive, or capability-less sessions", () => {
  assert.ok(accountLayout.includes("readPartnerSession"));
  assert.ok(accountLayout.includes('redirect("/login?next=/account/settings")'));
  assert.ok(accountLayout.includes("hasUnifiedAccountAccess(user)"));
  assert.ok(accountAccess.includes("if (!user?.isActive) return false"));
  assert.ok(accountAccess.includes('user.role === "CLIENT"'));
  assert.ok(accountAccess.includes("user.clientEnabled"));
  assert.ok(accountAccess.includes('user.partner?.status === "ACTIVE"'));
  assert.ok(accountAccess.includes('user.ambassador?.status === "ACTIVE"'));
});

test("existing partner dashboard and dashboard entry server guards remain intact", () => {
  assert.ok(partnerLayout.includes("getCurrentPartner()"));
  assert.ok(partnerLayout.includes('hasAdminPermission("partners")'));
  assert.ok(partnerLayout.includes('redirect("/login")'));
  assert.ok(dashboardEntry.includes("readPartnerSession"));
  assert.ok(dashboardEntry.includes('redirect("/login?next=/dashboard")'));
});
