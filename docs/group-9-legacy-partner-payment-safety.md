# Group 9 — legacy partner payment safety

Base: `a7fd1a9b3af9bc35f8bdbb4d34853fe06d7f0d45` (Group 8).
Local branch: `fix/group9-legacy-partner-payment`. No deployment or database mutation.

## Architecture decision

`PartnerProject` is a legacy project-level execution/compensation record. It has
`paymentStatus` and `paidAt`, but no structured payment evidence. Preserve existing
records and operational compatibility; do not build a second payment system here.
Every new compatibility assignment starts `PENDING` with `paidAt = null`.

`ProjectStagePartnerAssignment` is the approved execution payment source. It belongs
to a `ProjectStage`, has its own fee/currency, delivery approval, and payment evidence.
The lifecycle is assignment (`PENDING`), reviewed delivery (`APPROVED`), then the
dedicated `record_payment` operation (`PAID`). Approval is not payment.

Partner Dashboard/Dues prefers stage assignments for a project and uses legacy
records only when the partner has no stage assignment for that project. Historic
financial values remain readable; this change does not rewrite them.

`ProjectStage.paymentStatus` describes client billing, not payment to an execution
partner. Ambassador rewards and referral commissions are separate obligations.
Never convert a partner referral commission into an execution fee as a workaround.

## Complete application writer trace

Paths below are relative to the repository root. Searches covered `src`, `scripts`,
Prisma schema/migrations, server actions, raw SQL, nested relation writes, and callers.

| Entry point / file | Write | Payment authority after fix |
| --- | --- | --- |
| `PATCH /api/admin/partners`, `entity=project`; `src/app/api/admin/partners/route.ts` | Creates ClientProject and one PartnerProject per selected partner | Reject financial declarations; force PENDING/null |
| Same API, `entity=partner_assignment` | Creates PartnerProject for an existing project | Same guard and PENDING/null |
| Same API, `entity=project_update` | Updates operational fields; creates new partner associations | Same guard; old payment fields untouched; new rows PENDING/null |
| `POST /api/admin/project-execution`; `src/app/api/admin/project-execution/route.ts` | Bulk legacy status/progress update, including close | No financial writes |
| `POST /api/admin/project-stages`; `src/app/api/admin/project-stages/route.ts` | Legacy status/progress synchronization during start/update | No partner financial writes |
| `PATCH /api/partner/dashboard`; `src/app/api/partner/dashboard/route.ts` | Legacy progress/completion, or modern guarded progress helper | Explicit operational fields only; injected payment fields unused |
| `POST /api/admin/stage-partner-assignments`, upsert; `src/lib/stage-partner-assignments.ts` | Raw INSERT/ON CONFLICT of assignment details and fee | Defaults PENDING/null; atomic conflict guard prevents changing started/approved/paid assignments |
| Partner submissions API; `src/lib/stage-partner-submissions.ts#createStagePartnerSubmission` | Assignment REVIEW/progress 100 | Not payment |
| Admin approve_delivery/request_changes; same submissions helper | COMPLETED/APPROVED/approvedAt or IN_PROGRESS/progress 99 | Approval only, never PAID/paidAt |
| `POST /api/admin/stage-partner-assignments`, record_payment; same assignment helper | Conditional UPDATE to PAID and evidence | Dedicated authority, including evidence repair for incomplete historic modern PAID rows |
| Same API, delete | Deletes only eligible unstarted PENDING assignments via helper | Does not set PAID |
| Payment-proof upload API | Writes a private Blob | Does not mark an assignment paid |
| `PATCH /api/admin/referrals`; `src/app/api/admin/referrals/route.ts` | Commission state, including partner-linked referrals | PAID blocked when persisted partnerId exists or source is PARTNER |

No other PartnerProject or ProjectStagePartnerAssignment writer or partner-payment
server action was found. A permanent inventory regression test flags new direct writers.
This inventory is not a guarantee against future dynamic code or external SQL access.

Other reviewed paths:

- `src/app/api/admin/projects/route.ts`: canonical project/stage creation, no partner financial writes.
- `src/app/api/admin/clients/[clientId]/route.ts`: client project/stage creation, no partner financial writes.
- `src/app/api/admin/invoices/route.ts`: client invoice and ProjectStage payment, not partner payment.
- `src/app/api/admin/rewards/route.ts`, `src/lib/ambassador-rewards.ts`: ambassador reward/client-stage lifecycle; no execution-partner payment writes.
- `src/app/admin/smart-links/actions.ts`: no payment writes.
- `src/components/admin/canonical-project-creation-router.tsx`: browser interception of the legacy form is not a security boundary; direct PATCH needed protection.

## Bypasses found and fixes

1. **High:** legacy `entity=project` accepted `paymentStatus=PAID`, created legacy rows
   and assigned the current time to `paidAt` without evidence. Removed the financial
   selector/payload, added server rejection, and made creation values explicit.
   The other two legacy mutation entities did not previously pay records, but now
   explicitly reject the same attempted bypass instead of silently accepting it.
2. **High:** partner-linked referral commission could transition DUE to PAID merely
   because a client invoice was paid. There was no partner payment evidence. Blocked
   this operation server-side using persisted attribution and disabled its UI option.
   Nonfinancial referral changes and DUE calculation remain supported. No new payout
   system was invented for these commissions; ambassador-only behavior is unchanged.
3. **Code risk:** assignment upsert checked lifecycle before writing, but ON CONFLICT
   could later overwrite a paid assignment's fee during a race. Added lifecycle
   predicates to the SQL mutation and return 409 when it no longer applies.

The modern persistence helper also rejects blank method/reference/proof metadata and
invalid/future dates itself, in addition to the existing HTTP checks and real private
Blob lookup. No schema change or migration is required to close the known app paths.

## Verification scope and commands

`tests/group-9-legacy-partner-payment.test.mjs` executes the real TypeScript server
handlers and helpers with actual NextRequest/NextResponse objects. Imports are
allowlisted and DB/Blob/auth dependencies are explicit local doubles. No PrismaClient,
real credentials, financial records, or live writes are used. These are server-handler
and unit regressions, not browser or PostgreSQL/Blob integration tests.

Coverage includes manual PAID/paidAt injection in all legacy entities, nested payloads,
authorization, zero/one/multiple partners, adding a partner, all allowed operational
states, preservation of historical financial fields, partner referral blocking/DUE,
modern validation and approval, Blob failure, payment evidence persistence/audit/replay,
evidence repair, assignment upsert safeguards, client project creation, dashboard dues,
admin serialization, and reward derivation.

Final results: **104/104 tests passed**, including **61 Group 9 tests**; full
`npm run lint`, targeted ESLint, TypeScript no-emit, direct Next production build,
and `git diff --check` passed. The build generated 70 static pages. Node emitted the
existing module-type warning; npm emitted its environment http-proxy warning. Neither
was an application test/build failure. Package manifests and lockfile are unchanged.

```sh
npm ci --ignore-scripts --no-audit --no-fund
./node_modules/.bin/prisma generate
node --experimental-strip-types --test tests/*.test.mjs
./node_modules/.bin/tsc --noEmit --incremental false
./node_modules/.bin/eslint src/lib/legacy-partner-payment-policy.ts src/lib/stage-partner-assignments.ts src/app/api/admin/partners/route.ts src/app/api/admin/referrals/route.ts src/app/api/admin/stage-partner-assignments/route.ts src/app/admin/partners/page.tsx src/app/admin/referrals/page.tsx tests/group-9-legacy-partner-payment.test.mjs
./node_modules/.bin/next build
git diff --check
```

Do not substitute `npm run build` for the last build command during a read-only audit:
the project's wrapper can run Production migrations. Direct `next build` does not
invoke `scripts/prepare-production-db.mjs`. Prisma generate only generates the client.

## Historical Production audit — CLEAN (current snapshot only)

Read-only Neon audit at **2026-08-30T01:33:15.113Z**:

- Production project identity was verified against the configured environment.
- Production branch and database identity were verified read-only.
- The Production database host matched the deployment allowlist in
  `scripts/prepare-production-db.mjs`; the separate managed database project was
  not mistaken for Production.
- PartnerProject total **0**, PAID **0**, non-null paidAt **0**.
- ProjectStagePartnerAssignment total **0**, PAID **0**, PAID missing evidence fields **0**.
- Partner-linked/source-PARTNER referral commissions PAID **0**.
- Existing `StagePartnerPaymentEvidenceGuard` trigger is enabled (`tgenabled=O`).
- Existing migration `20260829122000_require_payment_evidence` finished
  `2026-08-29T17:23:24.463Z`, not rolled back.

Evidence came from SELECT aggregate counts, pg_trigger, and _prisma_migrations via
the Neon connector. No INSERT/UPDATE/DELETE/DDL, migration, branch creation, or reset.
There are no current suspicious IDs to investigate. This does not establish whether
previously deleted records ever existed or whether old payments were genuine.

## Remaining verification / limits

- Fix is local and not deployed; the old application remains vulnerable until release.
- Real authenticated browser flow, actual PostgreSQL concurrency, and real Blob payment
  integration were not exercised. Local SQL-shape checks are not a concurrency test.
- A payment document's existence/ownership is checked; its truth and bank settlement
  are not independently verified by a banking integration.
- Legacy partner referral payout remains intentionally blocked pending a separately
  approved evidence-backed workflow. Existing records are not migrated automatically.
- External SQL/DB administrators and future code paths are outside the application
  request guarantee. No new database-wide constraint was added to PartnerProject.
