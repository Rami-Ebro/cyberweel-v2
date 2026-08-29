import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  clientSubmissionBlobPrefix,
  isExpectedClientSubmissionBlobUrl,
} from "../src/lib/client-submissions.ts";

const repoFile = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("client submission blob paths are bound to current client and submission", () => {
  assert.equal(clientSubmissionBlobPrefix("client-1", "sub-1"), "clients/client-1/submissions/sub-1/");
  assert.equal(
    isExpectedClientSubmissionBlobUrl(
      "https://store.private.blob.vercel-storage.com/clients/client-1/submissions/sub-1/a.pdf",
      "client-1",
      "sub-1",
    ),
    true,
  );
  assert.equal(
    isExpectedClientSubmissionBlobUrl(
      "https://store.private.blob.vercel-storage.com/clients/client-2/submissions/sub-1/a.pdf",
      "client-1",
      "sub-1",
    ),
    false,
  );
  assert.equal(
    isExpectedClientSubmissionBlobUrl(
      "https://store.private.blob.vercel-storage.com/clients/client-1/submissions/sub-2/a.pdf",
      "client-1",
      "sub-1",
    ),
    false,
  );
  assert.equal(
    isExpectedClientSubmissionBlobUrl(
      "https://store.public.blob.vercel-storage.com/clients/client-1/submissions/sub-1/a.pdf",
      "client-1",
      "sub-1",
    ),
    false,
  );
  assert.equal(
    isExpectedClientSubmissionBlobUrl("https://example.com/clients/client-1/submissions/sub-1/a.pdf", "client-1", "sub-1"),
    false,
  );
});

test("invoice payment route requires evidence fields, guards duplicate payment, and writes audit", async () => {
  const source = await repoFile("src/app/api/admin/invoices/route.ts");
  assert.match(source, /paymentMethod/);
  assert.match(source, /paymentReference/);
  assert.match(source, /paidAt/);
  assert.match(source, /status === "PAID"/);
  assert.match(source, /updateMany/);
  assert.match(source, /status: \{ in: \["DRAFT", "DUE", "OVERDUE"\] \}/);
  assert.match(source, /CLIENT_INVOICE_PAID/);
  assert.match(source, /writeAdminAudit\(tx/);
});

test("ambassador and partner PAID routes require payment attachment", async () => {
  const [rewardRoute, partnerRoute] = await Promise.all([
    repoFile("src/app/api/admin/rewards/route.ts"),
    repoFile("src/app/api/admin/stage-partner-assignments/route.ts"),
  ]);
  assert.match(rewardRoute, /مرفق إثبات الدفع مطلوب قبل تسجيل المكافأة كمدفوعة/);
  assert.match(rewardRoute, /effectiveAttachmentUrl/);
  assert.match(partnerRoute, /مرفق إثبات الدفع مطلوب قبل تسجيل مستحق الشريك كمدفوع/);
  assert.match(partnerRoute, /private\.blob\.vercel-storage\.com/);
  assert.match(partnerRoute, /partner-stage-payments\/\$\{assignmentId\}\/proof\//);
});

test("database migration blocks PAID payment records without complete evidence", async () => {
  const migration = await repoFile("prisma/migrations/20260829122000_require_payment_evidence/migration.sql");
  assert.match(migration, /AmbassadorRewardPaymentEvidenceGuard/);
  assert.match(migration, /StagePartnerPaymentEvidenceGuard/);
  for (const required of ["method", "reference", "paidAt", "attachmentUrl", "attachmentName", "attachmentType"]) {
    assert.ok(migration.includes(required), `ambassador proof migration should require ${required}`);
  }
  for (const required of ["paymentMethod", "paymentReference", "paymentProofUrl", "paymentProofName"]) {
    assert.ok(migration.includes(required), `partner proof migration should require ${required}`);
  }
});

test("submission completion verifies actual private blob ownership before linking", async () => {
  const source = await repoFile("src/app/api/client/submissions/[submissionId]/complete/route.ts");
  assert.match(source, /head\(file\.url/);
  assert.match(source, /isExpectedClientSubmissionBlobUrl\(file\.url, client\.id, initialSubmission\.id\)/);
  assert.match(source, /details\.pathname\.startsWith\(expectedPrefix\)/);
  assert.match(source, /linkedElsewhere/);
  assert.match(source, /source === "CLIENT"/);
  assert.match(source, /storageProvider === "VERCEL_BLOB"/);
  assert.match(source, /kind === "CLIENT_SUBMISSION"/);
});
