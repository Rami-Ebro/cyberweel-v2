-- Defense in depth: PAID must never be persisted without complete payment evidence.
-- The triggers are intentionally transition/update scoped so legacy PAID rows can still exist
-- until an administrator completes their proof, while every new PAID write is protected.

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

DROP TRIGGER IF EXISTS "AmbassadorRewardPaymentEvidenceGuard" ON "AmbassadorReward";
CREATE TRIGGER "AmbassadorRewardPaymentEvidenceGuard"
BEFORE INSERT OR UPDATE ON "AmbassadorReward"
FOR EACH ROW
EXECUTE FUNCTION "enforceAmbassadorRewardPaymentEvidence"();

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

DROP TRIGGER IF EXISTS "StagePartnerPaymentEvidenceGuard" ON "ProjectStagePartnerAssignment";
CREATE TRIGGER "StagePartnerPaymentEvidenceGuard"
BEFORE INSERT OR UPDATE ON "ProjectStagePartnerAssignment"
FOR EACH ROW
EXECUTE FUNCTION "enforceStagePartnerPaymentEvidence"();
