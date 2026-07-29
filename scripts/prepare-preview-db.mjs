import { spawnSync } from "node:child_process";
import path from "node:path";

const allowedPreviewBranch = "codex-9b7hcm";
const productionDatabaseHostFragment = "ep-quiet-bird-asiuetz3";

const isAllowedPreview =
  process.env.VERCEL === "1" &&
  process.env.VERCEL_ENV === "preview" &&
  process.env.VERCEL_GIT_COMMIT_REF === allowedPreviewBranch;

if (!isAllowedPreview) {
  console.log("[preview-db] Skipped outside the isolated PR preview.");
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.error("[preview-db] DATABASE_URL is missing from Preview.");
  process.exit(1);
}

let databaseUrl;

try {
  databaseUrl = new URL(process.env.DATABASE_URL);
} catch {
  console.error("[preview-db] DATABASE_URL is invalid.");
  process.exit(1);
}

if (
  !databaseUrl.hostname.endsWith(".neon.tech") ||
  databaseUrl.hostname.includes(productionDatabaseHostFragment)
) {
  console.error("[preview-db] Refusing to change an unapproved database host.");
  process.exit(1);
}

const prismaBinary = path.join(
  process.cwd(),
  "node_modules",
  ".bin",
  process.platform === "win32" ? "prisma.cmd" : "prisma",
);

console.log("[preview-db] Synchronizing the isolated Preview database schema.");

const result = spawnSync(prismaBinary, ["db", "push", "--skip-generate"], {
  env: process.env,
  stdio: "inherit",
});

if (result.error) {
  console.error("[preview-db] Failed to start Prisma:", result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
