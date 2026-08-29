import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXPECTED_GIT_REF = "fix/group-1-payment-submission-security";
const PRODUCTION_DB_HOST_FRAGMENT = "ep-quiet-bird-asiuetz3";
const EXPECTED_TOKEN_HASH = "f3a2e2e018e6776a01684a56ed61269a9a3d0336752de286d57a3a6ccaca9bd2";
const ROLLBACK_PREFIX = "GROUP1_TRIGGER_LOGIC_ROLLBACK:";

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
  if (createHash("sha256").update(token).digest("hex") !== EXPECTED_TOKEN_HASH) {
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

  try {
    await db.$transaction(
      async (tx) => {
        await tx.$executeRawUnsafe(rewardFunctionSql);
        await tx.$executeRawUnsafe(partnerFunctionSql);

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

        const result = {
          rewardNegativeRejected: true,
          rewardPositiveAccepted: (rewardRows[0]?.count ?? 0) === 1,
          partnerNegativeRejected: true,
          partnerPositiveAccepted: (partnerRows[0]?.count ?? 0) === 1,
        };

        throw new Error(`${ROLLBACK_PREFIX}${JSON.stringify(result)}`);
      },
      { maxWait: 5000, timeout: 30000 },
    );

    return NextResponse.json({ ok: false, error: "rollback sentinel was not reached" }, { status: 500 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.startsWith(ROLLBACK_PREFIX)) {
      const result = JSON.parse(message.slice(ROLLBACK_PREFIX.length)) as Record<string, boolean>;
      return NextResponse.json({
        ok: Object.values(result).every(Boolean),
        rolledBack: true,
        ...result,
      });
    }

    console.error("GROUP1_PREVIEW_TRIGGER_LOGIC_TEST_FAILED", error);
    return NextResponse.json(
      { ok: false, error: message || "unknown trigger verification failure" },
      { status: 500 },
    );
  }
}
