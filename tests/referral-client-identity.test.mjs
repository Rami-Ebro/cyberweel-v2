import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const referralRouteSource = await readFile(new URL("../src/app/api/referrals/route.ts", import.meta.url), "utf8");
const adminClientsRouteSource = await readFile(new URL("../src/app/api/admin/clients/route.ts", import.meta.url), "utf8");

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
