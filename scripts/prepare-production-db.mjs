import { spawnSync } from "node:child_process";
import path from "node:path";

const productionBranch = "main";
const productionDatabaseHostFragment = "ep-quiet-bird-asiuetz3";
const group1PreviewBranch = "fix/group-1-payment-submission-security";
const group1PreviewNeonBranchId = "br-lucky-truth-a2u46jgq";

const isAllowedProduction =
  process.env.VERCEL === "1" &&
  process.env.VERCEL_ENV === "production" &&
  process.env.VERCEL_GIT_COMMIT_REF === productionBranch;

const isAllowedGroup1Preview =
  process.env.VERCEL === "1" &&
  process.env.VERCEL_ENV === "preview" &&
  process.env.VERCEL_GIT_COMMIT_REF === group1PreviewBranch;

if (!isAllowedProduction && !isAllowedGroup1Preview) {
  console.log("[deployment-db] Skipped outside the approved deployment.");
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

if (isAllowedGroup1Preview) {
  if (databaseUrl.hostname.includes(productionDatabaseHostFragment)) {
    console.error("[deployment-db] Refusing to initialize the Production database from Preview.");
    process.exit(1);
  }

  const exposedBranchId = process.env.NEON_BRANCH_ID?.trim();
  if (exposedBranchId && exposedBranchId !== group1PreviewNeonBranchId) {
    console.error("[deployment-db] Refusing to initialize an unexpected Neon Preview branch.");
    process.exit(1);
  }

  console.log("[deployment-db] Initializing isolated Group 1 Preview schema only.");
  await runPrisma(["db", "push", "--skip-generate"], "Group 1 Preview schema push");
  process.exit(0);
}

if (!databaseUrl.hostname.includes(productionDatabaseHostFragment)) {
  console.error("[deployment-db] Refusing to migrate an unapproved Production database host.");
  process.exit(1);
}

console.log("[deployment-db] Applying reviewed migrations to Production.");
await runPrisma(["migrate", "deploy"], "Production migration");
process.exit(0);
