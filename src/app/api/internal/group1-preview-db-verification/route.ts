import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXPECTED_GIT_REF = "fix/group-1-payment-submission-security";
const EXPECTED_NEON_BRANCH_ID = "br-lucky-truth-a2u46jgq";
const PRODUCTION_DB_HOST_FRAGMENT = "ep-quiet-bird-asiuetz3";
const EXPECTED_TOKEN_HASH = "2958999529d491a36373013fb88cf7c06792161979bce0ebf89becc656992bd9";

const rewardFunctionSql = `
CREATE OR REPLACE FUNCTION "enforceAmbassadorRewardPaymentEvidence"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  proof jsonb;
  payload text;
  must_validate boolean := false;
BEGIN
  IF TG_OP = 'INSERT' THEN
    must_validate := NEW."status" = 'PAID';
  ELSE
    must_validate := NEW."status" = 'PAID'
      AND (
        OLD."status" IS DISTINCT FROM NEW."status"
        OR OLD."paidAt" IS DISTINCT FROM NEW."paidAt"
        OR OLD."adminNotes" IS DISTINCT FROM NEW."adminNotes"
      );
  END IF;

  IF must_validate THEN
    IF NEW."paidAt" IS NULL OR NEW."adminNotes" IS NULL OR NEW."adminNotes" NOT LIKE 'PAYMENT_PROOF:%' THEN
      RAISE EXCEPTION 'AMBASSADOR_REWARD_PAYMENT_EVIDENCE_REQUIRED';
    END IF;

    payload := substring(NEW."adminNotes" FROM length('PAYMENT_PROOF:') + 1);
    BEGIN
      proof := payload::jsonb;
    EXCEPTION WHEN others THEN
      RAISE EXCEPTION 'AMBASSADOR_REWARD_PAYMENT_EVIDENCE_INVALID';
    END;

    IF COALESCE(btrim(proof->>'method'), '') = ''
       OR COALESCE(btrim(proof->>'reference'), '') = ''
       OR COALESCE(btrim(proof->>'paidAt'), '') = ''
       OR COALESCE(btrim(proof->>'attachmentUrl'), '') = ''
       OR COALESCE(btrim(proof->>'attachmentName'), '') = ''
       OR COALESCE(btrim(proof->>'attachmentType'), '') = '' THEN
      RAISE EXCEPTION 'AMBASSADOR_REWARD_PAYMENT_EVIDENCE_REQUIRED';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
`;

const partnerFunctionSql = `
CREATE OR REPLACE FUNCTION "enforceStagePartnerPaymentEvidence"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  must_validate boolean := false;
BEGIN
  IF TG_OP = 'INSERT' THEN
    must_validate := NEW."paymentStatus" = 'PAID';
  ELSE
    must_validate := NEW."paymentStatus" = 'PAID'
      AND (
        OLD."paymentStatus" IS DISTINCT FROM NEW."paymentStatus"
        OR OLD."paidAt" IS DISTINCT FROM NEW."paidAt"
        OR OLD."paymentMethod" IS DISTINCT FROM NEW."paymentMethod"
        OR OLD."paymentReference" IS DISTINCT FROM NEW."paymentReference"
        OR OLD."paymentProofUrl" IS DISTINCT FROM NEW."paymentProofUrl"
        OR OLD."paymentProofName" IS DISTINCT FROM NEW."paymentProofName"
      );
  END IF;

  IF must_validate THEN
    IF NEW."paidAt" IS NULL
       OR COALESCE(btrim(NEW."paymentMethod"), '') = ''
       OR COALESCE(btrim(NEW."paymentReference"), '') = ''
       OR COALESCE(btrim(NEW."paymentProofUrl"), '') = ''
       OR COALESCE(btrim(NEW."paymentProofName"), '') = '' THEN
      RAISE EXCEPTION 'STAGE_PARTNER_PAYMENT_EVIDENCE_REQUIRED';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
`;

export async function GET(request: NextRequest) {
  if (process.env.VERCEL !== "1" || process.env.VERCEL_ENV !== "preview") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (process.env.VERCEL_GIT_COMMIT_REF !== EXPECTED_GIT_REF) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const token = request.nextUrl.searchParams.get("token") ?? "";
  const tokenHash = createHash("sha256").update(token).digest("hex");
  if (tokenHash !== EXPECTED_TOKEN_HASH) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    return NextResponse.json({ error: "preview DATABASE_URL is missing" }, { status: 500 });
  }

  let databaseHost = "";
  try {
    databaseHost = new URL(databaseUrl).hostname.toLowerCase();
  } catch {
    return NextResponse.json({ error: "preview DATABASE_URL is invalid" }, { status: 500 });
  }

  if (!databaseHost.endsWith(".neon.tech") || databaseHost.includes(PRODUCTION_DB_HOST_FRAGMENT)) {
    return NextResponse.json({ error: "database safety guard rejected target" }, { status: 500 });
  }

  const exposedBranchId = process.env.NEON_BRANCH_ID?.trim();
  if (exposedBranchId && exposedBranchId !== EXPECTED_NEON_BRANCH_ID) {
    return NextResponse.json({ error: "Neon branch safety guard rejected target" }, { status: 500 });
  }

  try {
    const result = await db.$transaction(
      async (tx) => {
        await tx.$executeRawUnsafe(rewardFunctionSql);
        await tx.$executeRawUnsafe(`DROP TRIGGER IF EXISTS "AmbassadorRewardPaymentEvidenceGuard" ON "AmbassadorReward";`);
        await tx.$executeRawUnsafe(`CREATE TRIGGER "AmbassadorRewardPaymentEvidenceGuard" BEFORE INSERT OR UPDATE ON "AmbassadorReward" FOR EACH ROW EXECUTE FUNCTION "enforceAmbassadorRewardPaymentEvidence"();`);

        await tx.$executeRawUnsafe(partnerFunctionSql);
        await tx.$executeRawUnsafe(`DROP TRIGGER IF EXISTS "StagePartnerPaymentEvidenceGuard" ON "ProjectStagePartnerAssignment";`);
        await tx.$executeRawUnsafe(`CREATE TRIGGER "StagePartnerPaymentEvidenceGuard" BEFORE INSERT OR UPDATE ON "ProjectStagePartnerAssignment" FOR EACH ROW EXECUTE FUNCTION "enforceStagePartnerPaymentEvidence"();`);

        await tx.$executeRawUnsafe(`
          CREATE TEMP TABLE "_group1_reward_guard_test" (
            "status" text,
            "paidAt" timestamptz,
            "adminNotes" text
          ) ON COMMIT DROP;
        `);
        await tx.$executeRawUnsafe(`
          CREATE TRIGGER "_group1_reward_guard"
          BEFORE INSERT OR UPDATE ON "_group1_reward_guard_test"
          FOR EACH ROW EXECUTE FUNCTION "enforceAmbassadorRewardPaymentEvidence"();
        `);
        await tx.$executeRawUnsafe(`
          DO $$
          BEGIN
            BEGIN
              INSERT INTO "_group1_reward_guard_test" ("status", "paidAt", "adminNotes")
              VALUES ('PAID', now(), NULL);
              RAISE EXCEPTION 'GROUP1_REWARD_NEGATIVE_TEST_FAILED';
            EXCEPTION WHEN others THEN
              IF SQLERRM <> 'AMBASSADOR_REWARD_PAYMENT_EVIDENCE_REQUIRED' THEN
                RAISE;
              END IF;
            END;
          END;
          $$;
        `);
        await tx.$executeRawUnsafe(`
          INSERT INTO "_group1_reward_guard_test" ("status", "paidAt", "adminNotes")
          VALUES (
            'PAID',
            now(),
            'PAYMENT_PROOF:{"method":"bank","reference":"TEST-REF","paidAt":"2026-08-29","attachmentUrl":"https://proof.invalid/test.pdf","attachmentName":"test.pdf","attachmentType":"application/pdf"}'
          );
        `);

        await tx.$executeRawUnsafe(`
          CREATE TEMP TABLE "_group1_partner_guard_test" (
            "paymentStatus" text,
            "paidAt" timestamptz,
            "paymentMethod" text,
            "paymentReference" text,
            "paymentProofUrl" text,
            "paymentProofName" text
          ) ON COMMIT DROP;
        `);
        await tx.$executeRawUnsafe(`
          CREATE TRIGGER "_group1_partner_guard"
          BEFORE INSERT OR UPDATE ON "_group1_partner_guard_test"
          FOR EACH ROW EXECUTE FUNCTION "enforceStagePartnerPaymentEvidence"();
        `);
        await tx.$executeRawUnsafe(`
          DO $$
          BEGIN
            BEGIN
              INSERT INTO "_group1_partner_guard_test" (
                "paymentStatus", "paidAt", "paymentMethod", "paymentReference", "paymentProofUrl", "paymentProofName"
              ) VALUES ('PAID', now(), 'bank', 'TEST-REF', NULL, NULL);
              RAISE EXCEPTION 'GROUP1_PARTNER_NEGATIVE_TEST_FAILED';
            EXCEPTION WHEN others THEN
              IF SQLERRM <> 'STAGE_PARTNER_PAYMENT_EVIDENCE_REQUIRED' THEN
                RAISE;
              END IF;
            END;
          END;
          $$;
        `);
        await tx.$executeRawUnsafe(`
          INSERT INTO "_group1_partner_guard_test" (
            "paymentStatus", "paidAt", "paymentMethod", "paymentReference", "paymentProofUrl", "paymentProofName"
          ) VALUES ('PAID', now(), 'bank', 'TEST-REF', 'https://proof.invalid/test.pdf', 'test.pdf');
        `);

        const rewardRows = await tx.$queryRawUnsafe<Array<{ count: number }>>(
          `SELECT count(*)::int AS count FROM "_group1_reward_guard_test" WHERE "status" = 'PAID';`,
        );
        const partnerRows = await tx.$queryRawUnsafe<Array<{ count: number }>>(
          `SELECT count(*)::int AS count FROM "_group1_partner_guard_test" WHERE "paymentStatus" = 'PAID';`,
        );
        const triggers = await tx.$queryRawUnsafe<Array<{ trigger_name: string; table_name: string }>>(`
          SELECT t.tgname AS trigger_name, c.relname AS table_name
          FROM pg_trigger t
          JOIN pg_class c ON c.oid = t.tgrelid
          WHERE NOT t.tgisinternal
            AND t.tgname IN ('AmbassadorRewardPaymentEvidenceGuard', 'StagePartnerPaymentEvidenceGuard')
          ORDER BY t.tgname;
        `);

        return {
          rewardPositiveRows: rewardRows[0]?.count ?? 0,
          partnerPositiveRows: partnerRows[0]?.count ?? 0,
          triggers,
        };
      },
      { maxWait: 5000, timeout: 30000 },
    );

    return NextResponse.json({
      ok: true,
      environment: "preview",
      gitRef: EXPECTED_GIT_REF,
      expectedNeonBranchId: EXPECTED_NEON_BRANCH_ID,
      exposedNeonBranchId: exposedBranchId || null,
      databaseSafety: {
        neonHost: true,
        productionHostRejected: true,
      },
      migrationApplied: result.triggers.length === 2,
      rewardNegativeTestRejected: true,
      rewardPositiveTestAccepted: result.rewardPositiveRows === 1,
      partnerNegativeTestRejected: true,
      partnerPositiveTestAccepted: result.partnerPositiveRows === 1,
      triggers: result.triggers,
    });
  } catch (error) {
    console.error("GROUP1_PREVIEW_DB_VERIFICATION_FAILED", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "unknown verification failure",
      },
      { status: 500 },
    );
  }
}
