import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

const [
  accountAccess,
  accountSecurity,
  accountLayout,
  accountSession,
  accountSettings,
  clientAccount,
  adminAccount,
  loginRoute,
  schema,
] = await Promise.all([
  source("src/lib/account-access.ts"),
  source("src/lib/account-security.ts"),
  source("src/app/account/layout.tsx"),
  source("src/app/api/account/session/route.ts"),
  source("src/app/api/account/settings/route.ts"),
  source("src/app/api/client/account/route.ts"),
  source("src/app/api/admin/account/route.ts"),
  source("src/app/api/partner/login/route.ts"),
  source("prisma/schema.prisma"),
]);

test("account page, session API, and settings API share one live capability guard", () => {
  assert.ok(accountAccess.includes("export function hasUnifiedAccountAccess"));
  assert.ok(accountAccess.includes("if (!user?.isActive) return false"));
  assert.ok(accountAccess.includes('user.role === "ADMIN" && user.adminProfile && !user.adminProfile.isActive'));
  assert.ok(accountAccess.includes('user.partner?.status === "ACTIVE"'));
  assert.ok(accountAccess.includes('user.ambassador?.status === "ACTIVE"'));
  assert.ok(accountLayout.includes("hasUnifiedAccountAccess(user)"));
  assert.ok(accountSession.includes("hasUnifiedAccountAccess(user)"));
  assert.ok(accountSettings.includes("hasUnifiedAccountAccess(user) ? user : null"));
});

test("unified settings API checks trusted origin before authenticated mutation work", () => {
  const origin = accountSettings.indexOf("if (!hasTrustedOrigin(request)) return invalidOriginResponse();");
  const current = accountSettings.indexOf("const user = await currentUser(request);", accountSettings.indexOf("export async function PATCH"));
  assert.ok(origin >= 0);
  assert.ok(current > origin, "origin validation must happen before account lookup/mutation");
});

test("email, phone, and password changes all require current-password reauthentication", () => {
  assert.ok(accountSettings.includes("const emailChanged = email !== user.email;"));
  assert.ok(accountSettings.includes("const phoneChanged = phone !== user.phone;"));
  assert.ok(accountSettings.includes("const sensitiveChange = emailChanged || phoneChanged || Boolean(newPassword);"));
  assert.ok(accountSettings.includes("requireCurrentPasswordForSensitiveAccountChange"));
});

test("reauthentication failures are rate limited and password input is bounded", () => {
  assert.ok(accountSecurity.includes('action: "account-reauth-failure-v1"'));
  assert.ok(accountSecurity.includes("limit: 5"));
  assert.ok(accountSecurity.includes("15 * 60 * 1000"));
  assert.ok(accountSecurity.includes("MAX_ACCOUNT_PASSWORD_LENGTH = 256"));
  assert.ok(accountSecurity.includes("verifyPassword(input.currentPassword, input.passwordHash)"));
});

test("identity conflicts are checked only after successful sensitive-change reauthentication", () => {
  const reauth = accountSettings.indexOf("requireCurrentPasswordForSensitiveAccountChange");
  const emailConflict = accountSettings.indexOf("if (emailChanged) {");
  const phoneConflict = accountSettings.indexOf("if (phoneChanged && phone) {");
  assert.ok(reauth >= 0 && emailConflict > reauth && phoneConflict > reauth);
});

test("legacy client self-account writer has origin and login-email reauthentication guards", () => {
  assert.ok(clientAccount.includes("if (!hasTrustedOrigin(request)) return invalidOriginResponse();"));
  assert.ok(clientAccount.includes("const emailChanged = Boolean(email && email !== client.email);"));
  assert.ok(clientAccount.includes("if (emailChanged || newPassword)"));
  assert.ok(clientAccount.includes("requireCurrentPasswordForSensitiveAccountChange"));
});

test("legacy admin self-account writer has origin and login-identity reauthentication guards", () => {
  assert.ok(adminAccount.includes("if (!hasTrustedOrigin(request)) return invalidOriginResponse();"));
  assert.ok(adminAccount.includes("const identityChanged = requestedEmail !== admin.email || requestedPhone !== admin.phone;"));
  assert.ok(adminAccount.includes("if (identityChanged || newPassword)"));
  assert.ok(adminAccount.includes("requireCurrentPasswordForSensitiveAccountChange"));
});

test("phone-login ambiguity remains fail closed and Group 12 does not invent a schema migration", () => {
  assert.ok(loginRoute.includes("if (!isEmail && matchingUsers.length > 1)"));
  assert.ok(loginRoute.includes("هذا الهاتف مرتبط بأكثر من حساب"));
  assert.match(schema, /phone\s+String\?/);
  assert.doesNotMatch(schema, /phone\s+String\?\s+@unique/);
});

test("normal name-only unified account update remains possible without forced password change", () => {
  assert.ok(accountSettings.includes("const sensitiveChange = emailChanged || phoneChanged || Boolean(newPassword);"));
  assert.ok(accountSettings.includes("if (sensitiveChange) {"));
  assert.ok(accountSettings.includes("name,"));
});
