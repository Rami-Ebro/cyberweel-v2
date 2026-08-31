import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server.js";
import { legacyPartnerPaymentError } from "../src/lib/legacy-partner-payment-policy.ts";

// Execute real server handlers/helpers; every external dependency is explicit.
// No PrismaClient, credentials, network transport, or Production data is loaded.
const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const transpiled = new Map();
function load(path, dependencies = {}, extraGlobals = {}) {
  if (!transpiled.has(path)) transpiled.set(path, ts.transpileModule(source(path), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }, fileName: path,
  }).outputText);
  const loadedModule = { exports: {} };
  runInNewContext(transpiled.get(path), {
    module: loadedModule, exports: loadedModule.exports, URL, Date, console, Buffer,
    require: (name) => {
      if (name === "next/server") return { NextRequest, NextResponse };
      if (name === "@prisma/client") return { Prisma };
      if (name === "node:crypto") return { randomUUID };
      assert.ok(Object.hasOwn(dependencies, name), `Unmocked dependency: ${name}`);
      return dependencies[name];
    }, ...extraGlobals,
  }, { filename: path });
  return loadedModule.exports;
}
const json = (value) => JSON.parse(JSON.stringify(value));
const request = (body, method = "PATCH", pathname = "/api/admin/partners") => new NextRequest(`http://localhost${pathname}`, {
  method, headers: { "content-type": "application/json", origin: "http://localhost" }, body: JSON.stringify(body),
});
const fail = () => assert.fail("Unexpected external call");
function dependencies(db, audit = [], access = { userId: "admin-1", isOwner: true, permissions: [] }) {
  return {
    "@/lib/db": { db },
    "@/lib/admin-permissions": { currentAdminAccess: async () => access, canAdmin: async () => Boolean(access) },
    "@/lib/admin-audit": { writeAdminAudit: async (_tx, event) => audit.push(event) },
    "@/lib/client-invitation": { sendClientInvitation: fail },
    "@/lib/accept-collaboration": {},
    "@/lib/user-identity": { clientAccessWhere: (id) => ({ id }) },
    "@/lib/admin-user-profile": {},
    "@/lib/ambassador-rewards": { syncStageReward: fail, rewardRateForNewProject: fail },
    "@/lib/legacy-partner-payment-policy": { legacyPartnerPaymentError },
    "@/lib/request-security": { hasTrustedOrigin: (r) => r.headers.get("origin") === r.nextUrl.origin, invalidOriginResponse: () => NextResponse.json({}, { status: 403 }) },
  };
}
const legacyBody = { entity: "project", clientId: "client-1", partnerIds: ["partner-1"], title: "Local regression", projectStatus: "PLANNING", feeAmount: "100", feeCurrency: "USD", currency: "USD", progress: 0 };
function legacyStore() {
  const writes = [], audit = [], assignments = [];
  const project = { id: "project-1", clientId: "client-1", title: "Existing", status: "PLANNING", progress: 0, currency: "USD", dueAt: null, partnerAssignments: [] };
  const create = (model, data) => { writes.push({ model, data: json(data) }); return { id: `${model}-${writes.length}`, ...data }; };
  const db = {
    user: { findFirst: async () => ({ id: "client-1" }) },
    partner: { findMany: async ({ where }) => where.id.in.map((id) => ({ id })), count: async ({ where }) => where.id.in.length, findUnique: async () => ({ id: "partner-1", status: "ACTIVE", user: { isActive: true } }) },
    clientProject: { findUnique: async () => project, create: async ({ data }) => create("clientProject", data), update: async ({ data }) => { writes.push({ model: "clientProject", data: json(data) }); Object.assign(project, data); return project; } },
    partnerProject: {
      findFirst: async () => null,
      create: async ({ data }) => { const row = create("partnerProject", data); assignments.push(row); return row; },
      updateMany: async ({ data }) => { writes.push({ model: "partnerProject", data: json(data) }); for (const row of assignments) Object.assign(row, data); return { count: assignments.length }; },
    },
    clientNotification: { create: async ({ data }) => create("notification", data) },
    projectStage: { findMany: async () => [], create: async ({ data }) => create("projectStage", data) },
    partnerReferral: { findMany: async () => [] },
    $transaction: async (callback) => callback(db),
  };
  return { db, writes, audit, assignments, project, deps: dependencies(db, audit) };
}

for (const entity of ["project", "project_update", "partner_assignment"]) {
  for (const injection of [{ paymentStatus: "PAID" }, { paymentStatus: "APPROVED" }, { paymentStatus: "CANCELLED" }, { paymentStatus: { set: "PAID" } }, { status: "PAID" }, { projectStatus: "PAID" }, { paidAt: "2026-08-01" }]) {
    test(`legacy ${entity} rejects ${JSON.stringify(injection)} before any DB call`, async () => {
      const db = new Proxy({}, { get: fail });
      const route = load("src/app/api/admin/partners/route.ts", dependencies(db));
      const response = await route.PATCH(request({ ...legacyBody, entity, id: "partner-1", projectId: "project-1", ...injection }));
      assert.equal(response.status, 409);
      assert.equal((await response.json()).code, "LEGACY_PARTNER_PAYMENT_DISABLED");
    });
  }
}

test("legacy authorization still runs before financial validation", async () => {
  const route = load("src/app/api/admin/partners/route.ts", dependencies({}, [], null));
  assert.equal((await route.PATCH(request({ ...legacyBody, paymentStatus: "PAID" }))).status, 403);
});

for (const partnerIds of [[], ["partner-1"], ["partner-1", "partner-2"]]) {
  test(`legacy project creation with ${partnerIds.length} partners persists only PENDING/null`, async () => {
    const store = legacyStore();
    const route = load("src/app/api/admin/partners/route.ts", store.deps);
    const response = await route.PATCH(request({ ...legacyBody, partnerIds, data: { paymentStatus: "PAID", paidAt: "2026-08-01" } }));
    assert.equal(response.status, 201);
    assert.equal(store.assignments.length, partnerIds.length);
    for (const row of store.assignments) { assert.equal(row.paymentStatus, "PENDING"); assert.equal(row.paidAt, null); }
  });
}

test("adding a partner to an existing project starts PENDING without paidAt", async () => {
  const store = legacyStore();
  const route = load("src/app/api/admin/partners/route.ts", store.deps);
  assert.equal((await route.PATCH(request({ entity: "partner_assignment", id: "partner-1", projectId: "project-1" }))).status, 201);
  assert.equal(store.assignments[0].paymentStatus, "PENDING");
  assert.equal(store.assignments[0].paidAt, null);
});

for (const projectStatus of ["PLANNING", "IN_PROGRESS", "REVIEW", "ON_HOLD", "COMPLETED", "CANCELLED"]) {
  test(`legacy operational update ${projectStatus} preserves historical financial state`, async () => {
    const store = legacyStore();
    const historical = { id: "old-1", partnerId: "partner-1", paymentStatus: "PAID", paidAt: new Date("2026-08-01") };
    store.assignments.push(historical);
    store.project.partnerAssignments = [{ id: historical.id, partnerId: historical.partnerId }];
    const route = load("src/app/api/admin/partners/route.ts", store.deps);
    const response = await route.PATCH(request({ ...legacyBody, entity: "project_update", id: "project-1", projectStatus, partnerIds: ["partner-1", "partner-2"] }));
    assert.equal(response.status, 200);
    assert.equal(historical.paymentStatus, "PAID");
    assert.equal(historical.paidAt.toISOString(), "2026-08-01T00:00:00.000Z");
    assert.equal(store.assignments[1].paymentStatus, "PENDING");
    assert.equal(store.assignments[1].paidAt, null);
    assert.equal(store.writes.find((w) => w.model === "partnerProject").data.paymentStatus, undefined);
  });
}

for (const owner of [{ partnerId: "partner-1", source: "MANUAL" }, { partnerId: null, source: "PARTNER" }]) {
  test(`partner referral PAID is rejected using persisted ownership ${JSON.stringify(owner)}`, async () => {
    const db = { partnerReferral: { findUnique: async () => ({ id: "ref-1", ...owner }), update: fail } };
    const route = load("src/app/api/admin/referrals/route.ts", dependencies(db));
    const response = await route.PATCH(request({ id: "ref-1", status: "INTERESTED", adminDecision: "ACCEPTED", commissionStatus: "PAID", partnerId: null, source: "AMBASSADOR" }));
    assert.equal(response.status, 409);
    assert.equal((await response.json()).code, "LEGACY_PARTNER_PAYMENT_DISABLED");
  });
}

test("partner referral can still become DUE without claiming payment", async () => {
  let saved;
  const referral = { id: "ref-1", partnerId: "partner-1", source: "PARTNER", convertedClientId: null, commissionStatus: "VERIFYING", clientProject: { id: "project-1", currency: "USD", invoices: [{ amount: 500, type: "STANDARD" }] } };
  const db = { partnerReferral: { findUnique: async () => referral, update: async ({ data }) => { saved = data; return { ...referral, ...data }; } } };
  const route = load("src/app/api/admin/referrals/route.ts", dependencies(db));
  const response = await route.PATCH(request({ id: "ref-1", status: "INTERESTED", adminDecision: "ACCEPTED", commissionStatus: "DUE", commissionType: "FIXED", commissionAmount: "50" }));
  assert.equal(response.status, 200);
  assert.equal(saved.commissionStatus, "DUE");
});

const proofUrl = "https://local.private.blob.vercel-storage.com/partner-stage-payments/assignment-1/proof/receipt.pdf";
const payment = { action: "record_payment", assignmentId: "assignment-1", paymentMethod: "Bank", paymentReference: "LOCAL-ONLY", paidAt: "2026-08-01", paymentProofUrl: proofUrl, paymentProofName: "receipt.pdf" };
function stageFixture(overrides = {}) {
  return { id: "assignment-1", projectStageId: "stage-1", partnerId: "partner-1", projectId: "project-1", projectTitle: "Local project", projectStatus: "IN_PROGRESS", stageName: "Local stage", stageStatus: "IN_PROGRESS", stageAmount: 500, stageCurrency: "USD", stagePaymentStatus: "PAID", partnerEmail: "local@example.test", tasks: ["Task"], deliverables: ["Delivery"], status: "COMPLETED", progress: 100, paymentStatus: "APPROVED", feeAmount: 100, feeCurrency: "USD", paidAt: null, approvedAt: new Date("2026-07-31"), paymentMethod: null, paymentReference: null, paymentProofUrl: null, paymentProofName: null, createdAt: new Date("2026-07-30"), updatedAt: new Date("2026-07-31"), ...overrides };
}
function modernHarness(overrides = {}, blobOk = true) {
  const row = stageFixture(overrides), queries = [], audit = [], verifications = [];
  const db = {
    $queryRaw: async (query) => {
      queries.push(query);
      if (query.text.includes('UPDATE "ProjectStagePartnerAssignment"')) {
        // Deliberately a persistence double, not a PostgreSQL integration test.
        assert.match(query.text, /"status" = 'COMPLETED'/);
        assert.match(query.text, /"paymentStatus" = 'APPROVED'/);
        const [paidAt, paymentMethod, paymentReference, paymentProofUrl, paymentProofName, id, allowRepair] = query.values;
        const incomplete = !row.paidAt || !row.paymentMethod?.trim() || !row.paymentReference?.trim() || !row.paymentProofUrl?.trim() || !row.paymentProofName?.trim();
        if (id !== row.id || row.status !== "COMPLETED" || !(row.paymentStatus === "APPROVED" || (allowRepair && row.paymentStatus === "PAID" && incomplete))) return [];
        Object.assign(row, { paidAt, paymentMethod, paymentReference, paymentProofUrl, paymentProofName, paymentStatus: "PAID" });
        return [{ id: row.id }];
      }
      return [{ ...row }];
    },
  };
  const deps = dependencies(db, audit);
  deps["@/lib/payment-proof-blob"] = { verifyPrivatePaymentProofBlob: async (input) => { verifications.push(input); return { ok: blobOk }; } };
  const helper = load("src/lib/stage-partner-assignments.ts", deps);
  deps["@/lib/stage-partner-assignments"] = helper;
  deps["@/lib/stage-partner-submissions"] = {};
  const route = load("src/app/api/admin/stage-partner-assignments/route.ts", deps);
  return { route, helper, row, queries, audit, verifications, deps };
}

for (const field of ["paymentMethod", "paymentReference", "paidAt", "paymentProofUrl", "paymentProofName"]) {
  test(`modern payment rejects missing ${field} before persistence`, async () => {
    const h = modernHarness();
    assert.equal((await h.route.POST(request({ ...payment, [field]: "" }, "POST"))).status, 400);
    assert.equal(h.queries.length, 0);
    assert.equal(h.row.paymentStatus, "APPROVED");
    assert.equal(h.row.paidAt, null);
  });
}
for (const url of ["https://example.test/receipt.pdf", proofUrl.replace("assignment-1", "assignment-2"), proofUrl.replace(".private.", ".public.")]) {
  test(`modern payment rejects unowned/non-private proof ${url}`, async () => {
    const h = modernHarness();
    assert.equal((await h.route.POST(request({ ...payment, paymentProofUrl: url }, "POST"))).status, 400);
    assert.equal(h.queries.length, 0);
  });
}
for (const paidAt of ["invalid", "2999-01-01"]) {
  test(`modern payment rejects invalid/future date ${paidAt}`, async () => {
    const h = modernHarness();
    assert.equal((await h.route.POST(request({ ...payment, paidAt }, "POST"))).status, 400);
  });
}
for (const overrides of [{ status: "REVIEW", paymentStatus: "PENDING" }, { status: "COMPLETED", paymentStatus: "PENDING" }]) {
  test(`modern payment requires approval ${JSON.stringify(overrides)}`, async () => {
    const h = modernHarness(overrides);
    assert.equal((await h.route.POST(request(payment, "POST"))).status, 409);
    assert.equal(h.verifications.length, 0);
    assert.equal(h.row.paidAt, null);
  });
}
test("modern payment with nonexistent Blob proof fails closed", async () => {
  const h = modernHarness({}, false);
  assert.equal((await h.route.POST(request(payment, "POST"))).status, 409);
  assert.equal(h.verifications[0].expectedPrefix, "partner-stage-payments/assignment-1/proof/");
  assert.equal(h.queries.filter((q) => q.text.includes("UPDATE")).length, 0);
  assert.equal(h.row.paidAt, null);
});
test("modern complete payment persists evidence, audits, and rejects replay", async () => {
  const h = modernHarness();
  assert.equal((await h.route.POST(request(payment, "POST"))).status, 200);
  assert.equal(h.row.paymentStatus, "PAID");
  assert.equal(h.row.paidAt.toISOString(), "2026-08-01T00:00:00.000Z");
  assert.equal(h.row.paymentProofUrl, proofUrl);
  assert.equal(h.audit[0].action, "STAGE_PARTNER_PAYMENT_RECORDED");
  assert.equal((await h.route.POST(request(payment, "POST"))).status, 409);
  assert.equal(h.audit.length, 1);
});
test("incomplete historical modern payment can repair evidence only through verified flow", async () => {
  const h = modernHarness({ paymentStatus: "PAID" });
  assert.equal((await h.route.POST(request(payment, "POST"))).status, 200);
  assert.equal(h.audit[0].action, "STAGE_PARTNER_PAYMENT_EVIDENCE_REPAIRED");
  assert.equal(h.verifications.length, 1);
});
test("payment persistence helper rejects missing metadata even without the API", async () => {
  for (const change of [{ paymentMethod: " " }, { paymentReference: " " }, { paymentProofName: " " }, { paidAt: new Date("invalid") }]) {
    const h = modernHarness();
    assert.equal(await h.helper.recordStagePartnerPayment({ ...payment, paidAt: new Date(payment.paidAt), ...change }), null);
    assert.equal(h.queries.length, 0);
    assert.equal(h.verifications.length, 0);
  }
});
test("assignment upsert cannot change compensation after concurrent execution/payment", async () => {
  let sql;
  const db = { $queryRaw: async (query) => { sql = query; return []; } };
  const helper = load("src/lib/stage-partner-assignments.ts", { ...dependencies(db), "@/lib/payment-proof-blob": {} });
  assert.equal(await helper.upsertStagePartnerAssignment({ projectStageId: "s1", partnerId: "p1", tasks: ["task"], deliverables: ["delivery"], feeAmount: 100, feeCurrency: "USD", dueAt: null }), null);
  assert.match(sql.text, /WHERE "ProjectStagePartnerAssignment"\."status" = 'ASSIGNED'/);
  assert.match(sql.text, /"progress" = 0/);
  assert.match(sql.text, /"paymentStatus" = 'PENDING'/);
});

test("modern upsert ignores injected financial status and passes only assignment fields", async () => {
  let input;
  const h = modernHarness();
  h.deps["@/lib/db"] = { db: { projectStage: { findUnique: async () => ({ id: "stage-1", status: "NOT_STARTED", project: { id: "project-1", status: "PLANNING", currency: "USD" } }) }, partner: { findFirst: async () => ({ id: "partner-1", user: { email: "local@example.test" } }) } } };
  h.deps["@/lib/stage-partner-assignments"] = { ...h.helper, listStagePartnerAssignments: async () => [], upsertStagePartnerAssignment: async (value) => { input = value; return stageFixture({ status: "ASSIGNED", progress: 0, paymentStatus: "PENDING" }); } };
  const route = load("src/app/api/admin/stage-partner-assignments/route.ts", h.deps);
  const response = await route.POST(request({ action: "upsert", projectStageId: "stage-1", partnerId: "partner-1", tasks: ["Task"], deliverables: ["Delivery"], feeAmount: 100, paymentStatus: "PAID", paidAt: "2026-08-01" }, "POST"));
  assert.equal(response.status, 201);
  assert.equal(input.paymentStatus, undefined);
  assert.equal(input.paidAt, undefined);
  assert.equal((await response.json()).assignment.paymentStatus, "PENDING");
});

test("private Blob verifier checks actual metadata, not just a plausible URL", async () => {
  const pathname = "partner-stage-payments/assignment-1/proof/receipt.pdf";
  for (const [metadata, ok] of [[{ url: proofUrl, pathname, size: 100, contentType: "application/pdf" }, true], [{ url: proofUrl, pathname, size: 0, contentType: "application/pdf" }, false], [{ url: proofUrl, pathname: "someone-else/proof.pdf", size: 100, contentType: "application/pdf" }, false]]) {
    const verifier = load("src/lib/payment-proof-blob.ts", { "@vercel/blob": { head: async () => metadata } }, { process: { env: { BLOB_READ_WRITE_TOKEN: "local-mocked-token" } } });
    assert.equal((await verifier.verifyPrivatePaymentProofBlob({ url: proofUrl, expectedPrefix: "partner-stage-payments/assignment-1/proof/" })).ok, ok);
  }
});

test("canonical and client-admin project creation do not write partner financial records", async () => {
  for (const file of ["src/app/api/admin/projects/route.ts", "src/app/api/admin/clients/[clientId]/route.ts"]) {
    const store = legacyStore();
    const route = load(file, store.deps);
    const response = await route.POST(request({ action: "project", clientId: "client-1", title: "Client project", stages: "Design\nDelivery", financialPlan: "100 USD\n200 USD", currency: "USD", progress: 0, partnerIds: ["partner-1"], paymentStatus: "PAID", paidAt: "2026-08-01" }, "POST"), { params: Promise.resolve({ clientId: "client-1" }) });
    assert.equal(response.status, 201);
    assert.equal(store.writes.filter((w) => w.model === "projectStage").length, 2);
    assert.equal(store.assignments.length, 0);
    assert.equal(store.writes[0].data.paymentStatus, undefined);
    assert.equal(store.writes[0].data.paidAt, undefined);
  }
});

test("partner progress ignores injected payment fields and dues prefer modern assignments", async () => {
  const h = modernHarness();
  const legacy = { id: "legacy-1", clientProjectId: "old-project", partnerId: "partner-1", title: "Legacy", status: "ASSIGNED", progress: 0, feeAmount: 50, feeCurrency: "USD", paymentStatus: "PENDING", paidAt: null };
  const user = { id: "user-1", isActive: true, name: "Local", email: "local@example.test", partner: { id: "partner-1", status: "ACTIVE", createdAt: new Date() } };
  const db = { user: { findUnique: async () => user }, partnerProject: { findFirst: async () => legacy, update: async ({ data }) => Object.assign(legacy, data), findMany: async () => [legacy, { ...legacy, id: "shadow", clientProjectId: "project-1", feeAmount: 999 }] }, projectStagePartnerSubmission: { findMany: async () => [] } };
  const deps = { ...dependencies(db), "@/lib/partner-auth": { PARTNER_SESSION_COOKIE: "local", readPartnerSession: () => ({ userId: "user-1" }) }, "@/lib/stage-partner-assignments": { ...h.helper, getStagePartnerAssignment: async () => null, listStagePartnerAssignments: async () => [h.row] } };
  const route = load("src/app/api/partner/dashboard/route.ts", deps);
  assert.equal((await route.PATCH(request({ action: "progress", projectId: legacy.id, progress: 100, paymentStatus: "PAID", paidAt: "2026-08-01" }))).status, 200);
  assert.equal(legacy.paymentStatus, "PENDING");
  assert.equal(legacy.paidAt, null);
  const result = await (await route.GET(new NextRequest("http://localhost/api/partner/dashboard"))).json();
  assert.equal(result.projects.length, 2);
  assert.equal(result.stats.duesByCurrency[0].expected, "50.00");
  assert.equal(result.stats.duesByCurrency[0].due, "100.00");
  assert.equal(result.stats.duesByCurrency[0].paid, "0.00");
});

test("repository writer inventory detects new payment mutation entry points", () => {
  const walk = (dir) => readdirSync(new URL(`../${dir}`, import.meta.url), { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(`${dir}/${entry.name}`) : /\.[cm]?[jt]sx?$/.test(entry.name) ? [`${dir}/${entry.name}`] : []);
  const files = [...walk("src"), ...walk("scripts")];
  const legacyWriters = files.filter((file) => /partnerProject\.(?:create|update|upsert|delete)|(?:INSERT INTO|UPDATE|DELETE FROM) "PartnerProject"/.test(source(file))).sort();
  assert.deepEqual(legacyWriters, ["src/app/api/admin/partners/route.ts", "src/app/api/admin/project-execution/route.ts", "src/app/api/admin/project-stages/route.ts", "src/app/api/partner/dashboard/route.ts"]);
  const modernWriters = files.filter((file) => /projectStagePartnerAssignment\.(?:create|update|upsert|delete)|(?:INSERT INTO|UPDATE|DELETE FROM) "ProjectStagePartnerAssignment"/.test(source(file))).sort();
  assert.deepEqual(modernWriters, ["src/lib/stage-partner-assignments.ts", "src/lib/stage-partner-submissions.ts"]);
  for (const file of legacyWriters.filter((file) => !file.endsWith("admin/partners/route.ts"))) assert.doesNotMatch(source(file), /data:\s*\{[^}]*\b(?:paymentStatus|paidAt):/);
  assert.doesNotMatch(source("src/app/api/admin/partners/route.ts").split("export async function PATCH")[1], /paidAt:.*new Date|^\s*paymentStatus,|paymentStatus: body/m);
});

test("delivery approval creates a due amount, never a paid amount", async () => {
  const row = stageFixture({ status: "REVIEW", progress: 100, paymentStatus: "PENDING", approvedAt: null });
  const submission = { id: "submission-1", status: "SUBMITTED" };
  row.submissions = [submission];
  const db = {
    projectStagePartnerAssignment: { findUnique: async () => row, update: async ({ data }) => Object.assign(row, data) },
    projectStagePartnerSubmission: { update: async ({ data }) => Object.assign(submission, data) },
    $transaction: async (callback) => callback(db),
  };
  const helper = load("src/lib/stage-partner-submissions.ts", dependencies(db));
  await helper.reviewStagePartnerSubmission({ assignmentId: row.id, submissionId: submission.id, decision: "APPROVED" });
  assert.equal(row.status, "COMPLETED");
  assert.equal(row.paymentStatus, "APPROVED");
  assert.ok(row.approvedAt instanceof Date);
  assert.equal(row.paidAt, null);
});

test("new modern assignment uses schema defaults and no client payment fields", async () => {
  const row = stageFixture({ status: "ASSIGNED", progress: 0, paymentStatus: "PENDING", approvedAt: null });
  let insert;
  const db = { $queryRaw: async (query) => {
    if (query.text.includes("INSERT INTO")) { insert = query; return [{ id: row.id }]; }
    return [row];
  } };
  const helper = load("src/lib/stage-partner-assignments.ts", { ...dependencies(db), "@/lib/payment-proof-blob": {} });
  const saved = await helper.upsertStagePartnerAssignment({ projectStageId: "stage-1", partnerId: "partner-1", tasks: ["Task"], deliverables: ["Delivery"], feeAmount: 100, feeCurrency: "USD", dueAt: null, paymentStatus: "PAID", paidAt: new Date() });
  assert.doesNotMatch(insert.text.split("ON CONFLICT")[0], /"paymentStatus"|"paidAt"/);
  const schema = source("prisma/schema.prisma").split("model ProjectStagePartnerAssignment {")[1].split("\n}")[0];
  assert.match(schema, /paymentStatus\s+ProjectPaymentStatus\s+@default\(PENDING\)/);
  assert.equal(saved.paymentStatus, "PENDING");
  assert.equal(saved.paidAt, null);
});

test("admin project listing still serializes legacy partner financial records", async () => {
  const partner = { id: "partner-1", user: { name: "Partner", email: "local@example.test" } };
  const assignment = { ...stageFixture({ paymentStatus: "PENDING" }), partner };
  const project = { id: "project-1", title: "Local", status: "PLANNING", currency: "USD", progress: 0, partnerAssignments: [assignment], client: { id: "client-1", name: "Client", email: "client@example.test" } };
  const db = { partner: { findMany: async () => [partner] }, partnerReferral: { findMany: async () => [] }, user: { findMany: async () => [project.client] }, clientProject: { findMany: async () => [project] } };
  const route = load("src/app/api/admin/partners/route.ts", dependencies(db));
  const response = await route.GET(new NextRequest("http://localhost/api/admin/partners?scope=projects"));
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.projects[0].partners[0].paymentStatus, "PENDING");
  assert.equal(payload.projects[0].partners[0].feeAmount, 100);
});

test("Rewards GET and reward derivation remain independent of partner payment state", async () => {
  const stage = { id: "stage-1", rewards: [], amount: new Prisma.Decimal(500), currency: "USD", status: "COMPLETED", paymentStatus: "PAID", approvedAt: new Date(), project: { id: "project-1", clientId: "client-1", ambassadorRewardRate: new Prisma.Decimal(10), referral: { id: "ref-1", ambassadorId: "amb-1" } } };
  let saved;
  const tx = { projectStage: { findUnique: async () => stage }, ambassadorReward: { findUnique: async () => null, create: async ({ data }) => { saved = data; return data; } } };
  const helpers = load("src/lib/ambassador-rewards.ts");
  await helpers.syncStageReward(tx, stage.id);
  assert.equal(saved.status, "EARNED");
  assert.equal(saved.amount.toString(), "50");
  assert.equal(saved.paidAt, undefined);
  const db = { ambassadorReward: { findMany: async () => [{ ...saved, id: "reward-1" }] }, ambassadorRewardLevel: { findMany: async () => [] }, clientProject: { findMany: async () => [] } };
  const deps = { ...dependencies(db), "@/lib/ambassador-rewards": helpers, "@/lib/payment-proof-blob": {} };
  const route = load("src/app/api/admin/rewards/route.ts", deps);
  const response = await route.GET(new NextRequest("http://localhost/api/admin/rewards"));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).rewards[0].status, "EARNED");
});
