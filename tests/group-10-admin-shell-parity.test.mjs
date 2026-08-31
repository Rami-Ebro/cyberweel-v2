import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Group 10 resolves admin shell access on the server and provides it once at the admin root", () => {
  const layout = read("src/app/admin/layout.tsx");
  const auth = read("src/lib/admin-auth.ts");
  assert.match(layout, /requireAdminShellAccess/);
  assert.match(layout, /AdminShellAccessProvider access=\{access\}/);
  assert.match(auth, /getAdminShellAccess/);
  assert.match(auth, /verifySessionToken\(cookieStore\.get\(ADMIN_SESSION_COOKIE\)/);
  assert.match(auth, /return \{ isOwner: true, permissions: \[\.\.\.ADMIN_PERMISSIONS\] \}/);
  assert.match(auth, /user\.adminProfile\.permissions\.filter/);
});

test("Group 10 canonical shell filters navigation with server-resolved permissions", () => {
  const shell = read("src/components/admin/admin-shell.tsx");
  assert.match(shell, /useAdminShellAccess/);
  assert.match(shell, /permission: "overview"/);
  assert.match(shell, /permission: "clients"/);
  assert.match(shell, /permission: "projects"/);
  assert.match(shell, /permission: "invoices"/);
  assert.match(shell, /permission: "referrals"/);
  assert.match(shell, /permission: "partners"/);
  assert.match(shell, /permission: "audit_log"/);
  assert.match(shell, /permission: "smart_links"/);
  assert.match(shell, /ownerOnly: true/);
  assert.match(shell, /visibleItems = items\.filter/);
  assert.match(shell, /\{visibleItems\.map/);
});

test("Group 10 keeps ambassador and rewards navigation reachable only for granted capabilities", () => {
  const shell = read("src/components/admin/admin-shell.tsx");
  assert.match(shell, /permissionsAny: \["ambassadors", "rewards"\]/);
  assert.match(shell, /!canManageAmbassadors && canManageRewards/);
  assert.match(shell, /\{canManageAmbassadors && \(/);
  assert.match(shell, /\{canManageRewards && \(/);
});

test("Group 10 removes the duplicate partners shell and uses the canonical AdminShell", () => {
  const partners = read("src/app/admin/partners/page.tsx");
  assert.match(partners, /import \{ AdminShell \} from "@\/components\/admin\/admin-shell"/);
  assert.match(partners, /<AdminShell active=\{section\}/);
  assert.doesNotMatch(partners, /className="nav-link"/);
  assert.doesNotMatch(partners, /data-admin-shell-root/);
  assert.doesNotMatch(partners, /AdminNotificationCenter/);
  assert.doesNotMatch(partners, /DashboardLanguageButton/);
  assert.doesNotMatch(partners, /async function logout\(\)/);
});

test("Group 10 keeps the account section reachable while team remains owner-only", () => {
  const shell = read("src/components/admin/admin-shell.tsx");
  assert.match(shell, /key: "account"[^
]+href: "\/admin\/partners\?section=account"/);
  assert.match(shell, /key: "team"[^
]+ownerOnly: true/);
});
