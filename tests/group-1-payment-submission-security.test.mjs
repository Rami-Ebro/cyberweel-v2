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

test("invoice payment date uses the shared local DateInput default", async () => {
  const source = await repoFile("src/app/admin/invoices/page.tsx");
  assert.match(source, /<DateInput name="paidAt" required className="field font-normal" \/>/);
  assert.doesNotMatch(source, /name="paidAt"[^>]*new Date\(\)\.toISOString/);
});

test("ambassador and partner PAID paths require private payment attachments", async () => {
  const [rewardRoute, partnerRoute, partnerAssignments] = await Promise.all([
    repoFile("src/app/api/admin/rewards/route.ts"),
    repoFile("src/app/api/admin/stage-partner-assignments/route.ts"),
    repoFile("src/lib/stage-partner-assignments.ts"),
  ]);
  assert.match(rewardRoute, /مرفق إثبات الدفع مطلوب قبل تسجيل المكافأة كمدفوعة/);
  assert.match(rewardRoute, /effectiveAttachmentUrl/);
  assert.match(rewardRoute, /private\.blob\.vercel-storage\.com/);
  assert.match(rewardRoute, /ambassador-rewards\/\$\{rewardId\}\/proof\//);
  assert.match(rewardRoute, /validPaymentProofUrl\(effectiveAttachmentUrl, reward\.id\)/);
  assert.match(rewardRoute, /verifyPrivatePaymentProofBlob/);
  assert.match(partnerRoute, /مرفق إثبات الدفع مطلوب قبل تسجيل مستحق الشريك كمدفوع/);
  assert.match(partnerRoute, /private\.blob\.vercel-storage\.com/);
  assert.match(partnerRoute, /partner-stage-payments\/\$\{assignmentId\}\/proof\//);
  assert.match(partnerAssignments, /verifyPrivatePaymentProofBlob/);
  assert.match(partnerAssignments, /partner-stage-payments\/\$\{input\.assignmentId\}\/proof\//);
});

test("payment proof verifier checks the actual private blob before PAID persistence", async () => {
  const source = await repoFile("src/lib/payment-proof-blob.ts");
  assert.match(source, /head\(input\.url/);
  assert.match(source, /details\.url !== input\.url/);
  assert.match(source, /details\.pathname\.startsWith\(input\.expectedPrefix\)/);
  assert.match(source, /PAYMENT_PROOF_CONTENT_TYPES\.has\(contentType\)/);
  assert.match(source, /BLOB_READ_WRITE_TOKEN/);
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

test("submission upload callback rejects cross-linked blob URLs", async () => {
  const source = await repoFile("src/app/api/client/submissions/upload/route.ts");
  assert.match(source, /existingLinks/);
  assert.match(source, /hasCrossLink/);
  assert.match(source, /file\.submissionId !== submission\.id/);
  assert.match(source, /file\.projectId !== submission\.projectId/);
  assert.match(source, /file\.storageProvider !== "VERCEL_BLOB"/);
  assert.match(source, /file\.source !== "CLIENT"/);
});

test("submission completion claims UPLOADING atomically and reconciles verified file size", async () => {
  const source = await repoFile("src/app/api/client/submissions/[submissionId]/complete/route.ts");
  assert.match(source, /clientSubmission\.updateMany/);
  assert.match(source, /status: "UPLOADING"/);
  assert.match(source, /data: \{ status: "PROCESSING" \}/);
  assert.match(source, /claimed\.count !== 1/);
  assert.match(source, /where: \{ id: submissionId, status: "PROCESSING"/);
  assert.match(source, /existing\.size !== file\.actualSize/);
  assert.match(source, /data: \{ size: file\.actualSize \}/);
});

test("submission completion verifies actual private blob ownership and rejects duplicate links", async () => {
  const source = await repoFile("src/app/api/client/submissions/[submissionId]/complete/route.ts");
  assert.match(source, /head\(file\.url/);
  assert.match(source, /isExpectedClientSubmissionBlobUrl\(file\.url, client\.id, initialSubmission\.id\)/);
  assert.match(source, /details\.pathname\.startsWith\(expectedPrefix\)/);
  assert.match(source, /linkedElsewhere/);
  assert.match(source, /duplicateElsewhere/);
  assert.match(source, /id: \{ not: existing\.id \}/);
  assert.match(source, /source === "CLIENT"/);
  assert.match(source, /storageProvider === "VERCEL_BLOB"/);
  assert.match(source, /kind === "CLIENT_SUBMISSION"/);
});
