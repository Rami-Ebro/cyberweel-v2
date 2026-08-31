import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { Prisma, PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server.js";
import * as vercelBlob from "@vercel/blob";

const expectedRef = "fix/group9-legacy-partner-payment";
const productionHostFragment = "ep-quiet-bird-asiuetz3";
const databaseUrl = process.env.DATABASE_URL || "";
const unpooledUrl = process.env.DATABASE_URL_UNPOOLED || "";
const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim() || "";

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

console.log("[group9-live] guarded Preview identity OK", JSON.stringify({
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
    File,
    FormData,
    require: (name) => {
      if (name === "next/server") return { NextRequest, NextResponse };
      if (name === "@prisma/client") return { Prisma };
      if (name === "node:crypto") return { randomUUID };
      assert.ok(Object.hasOwn(dependencies, name), `Unmocked dependency: ${name}`);
      return dependencies[name];
    },
    ...extraGlobals,
  }, { filename: path });
  return loadedModule.exports;
}

const db = new PrismaClient();
const tag = `${Date.now()}-${randomUUID().slice(0, 8)}`;
const clientEmail = `group9-live-client-${tag}@cyberweel.test`;
const partnerEmail = `group9-live-partner-${tag}@cyberweel.test`;
const uploadedBlobUrls = [];

const policy = load("src/lib/legacy-partner-payment-policy.ts");
const adminAccess = { userId: `group9-live-admin-${tag}`, isOwner: true, permissions: ["partners", "projects", "referrals"] };
const security = {
  hasTrustedOrigin: (request) => request.headers.get("origin") === request.nextUrl.origin,
  invalidOriginResponse: () => NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 }),
};
const request = (pathname, body) => new NextRequest(`http://localhost${pathname}`, {
  method: "PATCH",
  headers: { "content-type": "application/json", origin: "http://localhost" },
  body: JSON.stringify(body),
});

const partnerRoute = load("src/app/api/admin/partners/route.ts", {
  "@/lib/db": { db },
  "@/lib/admin-permissions": { currentAdminAccess: async () => adminAccess, canAdmin: async () => true },
  "@/lib/client-invitation": { sendClientInvitation: async () => ({ sent: false }) },
  "@/lib/accept-collaboration": {
    AcceptApplicationError: class extends Error {},
    acceptErrorMessage: () => "",
    decideCollaborationApplication: async () => { throw new Error("Unexpected application decision"); },
  },
  "@/lib/user-identity": { clientAccessWhere: (id) => id ? { id } : { OR: [{ role: "CLIENT" }, { clientEnabled: true }] } },
  "@/lib/admin-user-profile": {
    AdminUserProfileError: class extends Error {},
    validatedAdminUserProfile: async () => { throw new Error("Unexpected profile validation"); },
  },
  "@/lib/admin-audit": { writeAdminAudit: async () => {} },
  "@/lib/ambassador-rewards": { syncStageReward: async () => {} },
  "@/lib/legacy-partner-payment-policy": policy,
});

const referralRoute = load("src/app/api/admin/referrals/route.ts", {
  "@/lib/db": { db },
  "@/lib/admin-permissions": { currentAdminAccess: async () => adminAccess },
  "@/lib/request-security": security,
});

const paymentProof = load("src/lib/payment-proof-blob.ts", { "@vercel/blob": vercelBlob });
const stageHelper = load("src/lib/stage-partner-assignments.ts", {
  "@/lib/db": { db },
  "@/lib/payment-proof-blob": paymentProof,
});

let clientUser;
let partnerUser;
let clientProject;
let stage;
let assignment;

try {
  clientUser = await db.user.create({
    data: { email: clientEmail, name: "Group 9 Live Client", role: "CLIENT", clientEnabled: true },
  });
  partnerUser = await db.user.create({
    data: {
      email: partnerEmail,
      name: "Group 9 Live Partner",
      role: "PARTNER",
      partner: { create: { status: "ACTIVE" } },
    },
    include: { partner: true },
  });
  assert.ok(partnerUser.partner?.id);

  clientProject = await db.clientProject.create({
    data: {
      clientId: clientUser.id,
      title: `Group 9 Live Project ${tag}`,
      description: "Disposable Preview integration fixture",
      currency: "USD",
      status: "PLANNING",
      progress: 0,
    },
  });

  const injected = await partnerRoute.PATCH(request("/api/admin/partners", {
    entity: "partner_assignment",
    id: partnerUser.partner.id,
    projectId: clientProject.id,
    paymentStatus: "PAID",
    paidAt: new Date().toISOString(),
  }));
  assert.equal(injected.status, 409, "Legacy PAID injection must be rejected");
  assert.equal((await injected.json()).code, "LEGACY_PARTNER_PAYMENT_DISABLED");
  assert.equal(await db.partnerProject.count({ where: { partnerId: partnerUser.partner.id, clientProjectId: clientProject.id } }), 0);

  const normal = await partnerRoute.PATCH(request("/api/admin/partners", {
    entity: "partner_assignment",
    id: partnerUser.partner.id,
    projectId: clientProject.id,
  }));
  assert.equal(normal.status, 201, "Normal legacy operational assignment should succeed");
  const legacyAssignment = await db.partnerProject.findFirstOrThrow({
    where: { partnerId: partnerUser.partner.id, clientProjectId: clientProject.id },
  });
  assert.equal(legacyAssignment.paymentStatus, "PENDING");
  assert.equal(legacyAssignment.paidAt, null);
  console.log("[group9-live] legacy route PASS");

  const referral = await db.partnerReferral.create({
    data: {
      partnerId: partnerUser.partner.id,
      name: `Group 9 Referral ${tag}`,
      source: "PARTNER",
      status: "INTERESTED",
      adminDecision: "ACCEPTED",
      commissionType: "FIXED",
      commissionAmount: "25.00",
      commissionCurrency: "USD",
      commissionStatus: "DUE",
    },
  });
  const referralPaid = await referralRoute.PATCH(request("/api/admin/referrals", {
    id: referral.id,
    status: "INTERESTED",
    adminDecision: "ACCEPTED",
    commissionType: "FIXED",
    commissionAmount: "25.00",
    commissionRate: null,
    commissionCurrency: "USD",
    commissionStatus: "PAID",
  }));
  assert.equal(referralPaid.status, 409, "Partner referral PAID must be blocked");
  assert.equal((await referralPaid.json()).code, "LEGACY_PARTNER_PAYMENT_DISABLED");
  const referralAfter = await db.partnerReferral.findUniqueOrThrow({ where: { id: referral.id } });
  assert.equal(referralAfter.commissionStatus, "DUE");
  console.log("[group9-live] referral payment block PASS");

  stage = await db.projectStage.create({
    data: {
      projectId: clientProject.id,
      name: `Group 9 Stage ${tag}`,
      position: 1,
      amount: "500.00",
      currency: "USD",
    },
  });

  assignment = await stageHelper.upsertStagePartnerAssignment({
    projectStageId: stage.id,
    partnerId: partnerUser.partner.id,
    tasks: ["Initial task"],
    deliverables: ["Initial deliverable"],
    feeAmount: 100,
    feeCurrency: "USD",
    dueAt: null,
  });
  assert.ok(assignment?.id, "Initial modern assignment must be created");
  assert.equal(assignment.paymentStatus, "PENDING");
  assert.equal(assignment.paidAt, null);

  const staleSnapshot = await stageHelper.getStagePartnerAssignment(assignment.id);
  assert.equal(staleSnapshot.status, "ASSIGNED");
  assert.equal(staleSnapshot.progress, 0);
  await db.projectStagePartnerAssignment.update({
    where: { id: assignment.id },
    data: { status: "IN_PROGRESS", progress: 10 },
  });
  const staleOverwrite = await stageHelper.upsertStagePartnerAssignment({
    projectStageId: stage.id,
    partnerId: partnerUser.partner.id,
    tasks: ["Stale overwrite task"],
    deliverables: ["Stale overwrite deliverable"],
    feeAmount: 999,
    feeCurrency: "EUR",
    dueAt: new Date(Date.now() + 86400000),
  });
  assert.equal(staleOverwrite, null, "Lifecycle guard must reject stale upsert");
  const guardedRow = await db.projectStagePartnerAssignment.findUniqueOrThrow({ where: { id: assignment.id } });
  assert.equal(guardedRow.status, "IN_PROGRESS");
  assert.equal(guardedRow.progress, 10);
  assert.equal(String(guardedRow.feeAmount), "100");
  assert.equal(guardedRow.feeCurrency, "USD");
  console.log("[group9-live] real PostgreSQL stale-read lifecycle guard PASS");

  assert.ok(blobToken, "BLOB_READ_WRITE_TOKEN is missing in Preview; real Blob E2E cannot run");
  await db.projectStagePartnerAssignment.update({
    where: { id: assignment.id },
    data: { status: "COMPLETED", progress: 100, paymentStatus: "APPROVED", approvedAt: new Date() },
  });

  const tinyPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z7L8AAAAASUVORK5CYII=", "base64");
  const uploaded = await vercelBlob.put(
    `partner-stage-payments/${assignment.id}/proof/group9-live-${tag}.png`,
    tinyPng,
    { access: "private", token: blobToken, addRandomSuffix: true, contentType: "image/png" },
  );
  uploadedBlobUrls.push(uploaded.url);
  const verified = await paymentProof.verifyPrivatePaymentProofBlob({
    url: uploaded.url,
    expectedPrefix: `partner-stage-payments/${assignment.id}/proof/`,
    expectedContentType: "image/png",
  });
  assert.equal(verified.ok, true, "Real private Blob verification must succeed");

  const paidAt = new Date();
  const paid = await stageHelper.recordStagePartnerPayment({
    assignmentId: assignment.id,
    paidAt,
    paymentMethod: "GROUP9_TEST",
    paymentReference: `G9-${tag}`,
    paymentProofUrl: uploaded.url,
    paymentProofName: `group9-live-${tag}.png`,
  });
  assert.ok(paid, "Evidence-backed payment must persist");
  assert.equal(paid.paymentStatus, "PAID");
  assert.ok(paid.paidAt instanceof Date);
  assert.equal(paid.paymentMethod, "GROUP9_TEST");
  assert.equal(paid.paymentReference, `G9-${tag}`);
  assert.equal(paid.paymentProofUrl, uploaded.url);

  const replay = await stageHelper.recordStagePartnerPayment({
    assignmentId: assignment.id,
    paidAt: new Date(),
    paymentMethod: "GROUP9_TEST_REPLAY",
    paymentReference: `G9-REPLAY-${tag}`,
    paymentProofUrl: uploaded.url,
    paymentProofName: `group9-live-${tag}.png`,
  });
  assert.equal(replay, null, "Normal payment replay must not rewrite a complete PAID record");
  console.log("[group9-live] private Blob + evidence-backed payment persistence PASS");

  console.log("[group9-live] ALL LIVE PREVIEW CHECKS PASS");
} finally {
  for (const url of uploadedBlobUrls) {
    try { await vercelBlob.del(url, { token: blobToken }); }
    catch (error) { console.error("[group9-live] Blob cleanup failed", error instanceof Error ? error.message : String(error)); }
  }
  try {
    await db.user.deleteMany({ where: { email: { in: [clientEmail, partnerEmail] } } });
    const leftovers = await db.user.count({ where: { email: { in: [clientEmail, partnerEmail] } } });
    assert.equal(leftovers, 0, "Preview test user cleanup failed");
    console.log("[group9-live] disposable DB fixtures cleaned");
  } finally {
    await db.$disconnect();
  }
}
