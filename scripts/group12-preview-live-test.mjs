import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { Prisma, PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server.js";

const expectedRef = "fix/group12-account-settings-hardening";
const productionHostFragment = "ep-quiet-bird-asiuetz3";
const databaseUrl = process.env.DATABASE_URL || "";
const unpooledUrl = process.env.DATABASE_URL_UNPOOLED || "";

function parseDb(raw) {
  const parsed = new URL(raw);
  return {
    host: parsed.hostname,
    database: parsed.pathname.replace(/^\//, ""),
    endpoint: parsed.hostname.split(".")[0].replace(/-pooler$/, ""),
  };
}

assert.equal(process.env.VERCEL, "1", "Refusing live test outside Vercel");
assert.equal(process.env.VERCEL_ENV, "preview", "Refusing live test outside Preview");
assert.equal(process.env.VERCEL_GIT_COMMIT_REF, expectedRef, "Refusing live test on unexpected Git ref");
assert.ok(databaseUrl && unpooledUrl, "Preview DATABASE_URL values are required");
const pooled = parseDb(databaseUrl);
const unpooled = parseDb(unpooledUrl);
assert.ok(pooled.host.endsWith(".neon.tech") && unpooled.host.endsWith(".neon.tech"), "Refusing non-Neon database");
assert.equal(pooled.database, "neondb");
assert.equal(unpooled.database, "neondb");
assert.equal(pooled.endpoint, unpooled.endpoint, "Pooled/unpooled endpoints differ");
assert.ok(!pooled.host.includes(productionHostFragment) && !unpooled.host.includes(productionHostFragment), "Refusing Production database endpoint");

console.log("[group12-live] guarded Preview identity OK", JSON.stringify({
  env: process.env.VERCEL_ENV,
  ref: process.env.VERCEL_GIT_COMMIT_REF,
  database: pooled.database,
  productionEndpointMatch: false,
}));

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const transpiled = new Map();
function load(path, dependencies = {}, extraGlobals = {}) {
  if (!transpiled.has(path)) {
    transpiled.set(path, ts.transpileModule(source(path), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
      fileName: path,
    }).outputText);
  }
  const loadedModule = { exports: {} };
  runInNewContext(transpiled.get(path), {
    module: loadedModule,
    exports: loadedModule.exports,
    URL,
    Date,
    console,
    Buffer,
    process,
    setTimeout,
    clearTimeout,
    Math,
    require: (name) => {
      if (name === "next/server") return { NextRequest, NextResponse };
      if (name === "@prisma/client") return { Prisma };
      if (name === "node:crypto") return require("node:crypto");
      assert.ok(Object.hasOwn(dependencies, name), `Unmocked dependency: ${name}`);
      return dependencies[name];
    },
    ...extraGlobals,
  }, { filename: path });
  return loadedModule.exports;
}

const db = new PrismaClient();
const partnerAuth = load("src/lib/partner-auth.ts");
const requestSecurity = load("src/lib/request-security.ts", { "@/lib/db": { db } });
const accountAccess = load("src/lib/account-access.ts");
const accountSecurity = load("src/lib/account-security.ts", {
  "@/lib/partner-auth": partnerAuth,
  "@/lib/request-security": requestSecurity,
});
const accountSettings = load("src/app/api/account/settings/route.ts", {
  "@/lib/account-access": accountAccess,
  "@/lib/account-security": accountSecurity,
  "@/lib/db": { db },
  "@/lib/partner-auth": partnerAuth,
  "@/lib/request-security": requestSecurity,
});
const userIdentity = load("src/lib/user-identity.ts", {
  "@/lib/db": { db },
  "@/lib/partner-auth": partnerAuth,
});
const clientAccount = load("src/app/api/client/account/route.ts", {
  "@/lib/account-security": accountSecurity,
  "@/lib/db": { db },
  "@/lib/partner-auth": partnerAuth,
  "@/lib/request-security": requestSecurity,
  "@/lib/user-identity": userIdentity,
});

const tag = `${Date.now()}-${randomUUID().slice(0, 8)}`;
const originalEmail = `group12-live-${tag}@cyberweel.test`;
const changedEmail = `group12-live-changed-${tag}@cyberweel.test`;
const legacyEmail = `group12-live-legacy-${tag}@cyberweel.test`;
const originalPhone = `+1555${String(Date.now()).slice(-7)}`;
const changedPhone = `+1666${String(Date.now()).slice(-7)}`;
const currentPassword = `G12-current-${tag}!`;
const newPassword = `G12-new-${tag}!`;
const ip = "203.0.113.12";
const origin = "https://group12-preview.test";

function request(pathname, method = "GET", body, token, requestOrigin = origin) {
  const headers = new Headers({
    origin: requestOrigin,
    "x-forwarded-for": ip,
  });
  if (token) headers.set("cookie", `${partnerAuth.PARTNER_SESSION_COOKIE}=${token}`);
  if (body !== undefined) headers.set("content-type", "application/json");
  return new NextRequest(`${origin}${pathname}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

function rateLimitSubjectHash(userId) {
  const secret =
    process.env.RATE_LIMIT_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.ADMIN_SESSION_SECRET;
  assert.ok(secret && secret.length >= 32, "Preview rate-limit/authentication secret is required");
  return createHmac("sha256", secret).update(`${ip}:${userId}`).digest("hex");
}

let user;
try {
  user = await db.user.create({
    data: {
      email: originalEmail,
      phone: originalPhone,
      name: "Group 12 Live User",
      role: "CLIENT",
      clientEnabled: true,
      isActive: true,
      passwordHash: partnerAuth.hashPassword(currentPassword),
    },
  });
  const token = partnerAuth.createPartnerSession(user.id);

  const activeGet = await accountSettings.GET(request("/api/account/settings", "GET", undefined, token));
  assert.equal(activeGet.status, 200, "Active account GET must succeed");
  assert.equal((await activeGet.json()).account.id, user.id);

  await db.user.update({ where: { id: user.id }, data: { isActive: false } });
  const staleGet = await accountSettings.GET(request("/api/account/settings", "GET", undefined, token));
  assert.equal(staleGet.status, 401, "Inactive account must lose settings API access despite valid signed session");
  const stalePatch = await accountSettings.PATCH(request("/api/account/settings", "PATCH", {
    name: "Should Not Persist",
    email: originalEmail,
    phone: originalPhone,
  }, token));
  assert.equal(stalePatch.status, 401, "Inactive account mutation must be rejected despite valid signed session");
  assert.equal((await db.user.findUniqueOrThrow({ where: { id: user.id } })).name, "Group 12 Live User");
  await db.user.update({ where: { id: user.id }, data: { isActive: true } });
  console.log("[group12-live] stale signed-session capability guard PASS");

  const crossOrigin = await accountSettings.PATCH(request("/api/account/settings", "PATCH", {
    name: "Cross Origin Should Not Persist",
    email: originalEmail,
    phone: originalPhone,
  }, token, "https://attacker.invalid"));
  assert.equal(crossOrigin.status, 403, "Cross-origin settings mutation must be rejected");
  assert.equal((await db.user.findUniqueOrThrow({ where: { id: user.id } })).name, "Group 12 Live User");
  console.log("[group12-live] trusted-origin guard PASS");

  const nameOnly = await accountSettings.PATCH(request("/api/account/settings", "PATCH", {
    name: "Group 12 Renamed User",
    email: originalEmail,
    phone: originalPhone,
  }, token));
  assert.equal(nameOnly.status, 200, "Name-only update should remain available without forced reauthentication");
  assert.equal((await db.user.findUniqueOrThrow({ where: { id: user.id } })).name, "Group 12 Renamed User");

  const missingReauth = await accountSettings.PATCH(request("/api/account/settings", "PATCH", {
    name: "Group 12 Renamed User",
    email: changedEmail,
    phone: changedPhone,
  }, token));
  assert.equal(missingReauth.status, 400, "Login-identity change without current password must be rejected");
  let persisted = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  assert.equal(persisted.email, originalEmail);
  assert.equal(persisted.phone, originalPhone);

  const wrongReauth = await accountSettings.PATCH(request("/api/account/settings", "PATCH", {
    name: "Group 12 Renamed User",
    email: changedEmail,
    phone: changedPhone,
    currentPassword: "definitely-wrong",
  }, token));
  assert.equal(wrongReauth.status, 400, "Wrong current password must reject login-identity change");
  persisted = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  assert.equal(persisted.email, originalEmail);
  assert.equal(persisted.phone, originalPhone);

  const correctReauth = await accountSettings.PATCH(request("/api/account/settings", "PATCH", {
    name: "Group 12 Renamed User",
    email: changedEmail,
    phone: changedPhone,
    currentPassword,
  }, token));
  assert.equal(correctReauth.status, 200, "Correct current password must allow login-identity change");
  persisted = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  assert.equal(persisted.email, changedEmail);
  assert.equal(persisted.phone, changedPhone);
  console.log("[group12-live] sensitive login-identity reauthentication PASS");

  const passwordChange = await accountSettings.PATCH(request("/api/account/settings", "PATCH", {
    name: "Group 12 Renamed User",
    email: changedEmail,
    phone: changedPhone,
    currentPassword,
    newPassword,
  }, token));
  assert.equal(passwordChange.status, 200, "Correct current password must allow password change");
  persisted = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  assert.equal(partnerAuth.verifyPassword(newPassword, persisted.passwordHash), true, "New password hash must persist");
  assert.equal(partnerAuth.verifyPassword(currentPassword, persisted.passwordHash), false, "Old password must no longer verify");

  const legacyNoReauth = await clientAccount.PATCH(request("/api/client/account", "PATCH", {
    email: legacyEmail,
  }, token));
  assert.equal(legacyNoReauth.status, 400, "Legacy client self-account email change must also require reauthentication");
  persisted = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  assert.equal(persisted.email, changedEmail);
  console.log("[group12-live] password change + legacy client writer guard PASS");

  console.log("[group12-live] ALL LIVE PREVIEW CHECKS PASS");
} finally {
  if (user?.id) {
    try {
      await db.rateLimitBucket.deleteMany({
        where: {
          action: "account-reauth-failure-v1",
          subjectHash: rateLimitSubjectHash(user.id),
        },
      });
    } catch (error) {
      console.error("[group12-live] rate-limit cleanup failed", error instanceof Error ? error.message : String(error));
    }
  }
  await db.user.deleteMany({ where: { email: { in: [originalEmail, changedEmail, legacyEmail] } } });
  const leftovers = await db.user.count({ where: { email: { in: [originalEmail, changedEmail, legacyEmail] } } });
  assert.equal(leftovers, 0, "Preview test user cleanup failed");
  console.log("[group12-live] disposable Preview fixtures cleaned");
  await db.$disconnect();
}
