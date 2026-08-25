import { spawnSync } from "node:child_process";
import path from "node:path";

const legacyDbPushPreviewBranch = "codex-9b7hcm";
const stagePartnerPreviewBranch = "feat/stage-partner-assignment-workflow";
const productionBranch = "main";
const productionDatabaseHostFragment = "ep-quiet-bird-asiuetz3";

const isVercel = process.env.VERCEL === "1";
const gitRef = process.env.VERCEL_GIT_COMMIT_REF || "";
const isAllowedPreview =
  isVercel &&
  process.env.VERCEL_ENV === "preview" &&
  [legacyDbPushPreviewBranch, stagePartnerPreviewBranch].includes(gitRef);
const isStagePartnerPreview = isAllowedPreview && gitRef === stagePartnerPreviewBranch;
const isAllowedProduction =
  isVercel &&
  process.env.VERCEL_ENV === "production" &&
  gitRef === productionBranch;

if (!isAllowedPreview && !isAllowedProduction) {
  console.log("[deployment-db] Skipped outside the approved Vercel deployments.");
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.error("[deployment-db] DATABASE_URL is missing.");
  process.exit(1);
}

let databaseUrl;

try {
  databaseUrl = new URL(process.env.DATABASE_URL);
} catch {
  console.error("[deployment-db] DATABASE_URL is invalid.");
  process.exit(1);
}

if (!databaseUrl.hostname.endsWith(".neon.tech")) {
  console.error("[deployment-db] Refusing to change a non-Neon database host.");
  process.exit(1);
}

if (isAllowedPreview && databaseUrl.hostname.includes(productionDatabaseHostFragment)) {
  console.error("[deployment-db] Refusing to use the Production database from Preview.");
  process.exit(1);
}

if (isAllowedProduction && !databaseUrl.hostname.includes(productionDatabaseHostFragment)) {
  console.error("[deployment-db] Refusing to migrate an unapproved Production database host.");
  process.exit(1);
}

const prismaBinary = path.join(
  process.cwd(),
  "node_modules",
  ".bin",
  process.platform === "win32" ? "prisma.cmd" : "prisma",
);
const maxAttempts = 3;

async function runPrisma(args, label) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    console.log(`[deployment-db] ${label} attempt ${attempt}/${maxAttempts}.`);
    const result = spawnSync(prismaBinary, args, {
      env: process.env,
      stdio: "inherit",
    });

    if (!result.error && result.status === 0) return true;
    if (result.error) console.error("[deployment-db] Failed to start Prisma:", result.error.message);

    if (attempt < maxAttempts) {
      const delayMs = attempt * 5000;
      console.warn(`[deployment-db] Prisma did not complete; retrying in ${delayMs / 1000} seconds.`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    } else {
      process.exit(result.status ?? 1);
    }
  }
  return false;
}

if (isAllowedPreview) {
  console.log("[deployment-db] Synchronizing the isolated Preview database schema.");
  await runPrisma(["db", "push", "--skip-generate"], "Preview schema sync");

  if (isStagePartnerPreview) {
    console.log("[deployment-db] Applying the stage-partner Preview-only schema extension.");
    await runPrisma(
      ["db", "execute", "--file", "scripts/preview-stage-partner-schema.sql", "--schema", "prisma/schema.prisma"],
      "Stage-partner Preview schema",
    );
  }
  process.exit(0);
}

console.log("[deployment-db] Applying reviewed migrations to Production.");
await runPrisma(["migrate", "deploy"], "Production migration");
process.exit(0);
