import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

const expectedGitRef = "fix/group9-legacy-partner-payment";
const productionEndpointId = "ep-quiet-bird-asiuetz3";

function parseDatabase(raw) {
  if (!raw) return null;
  const parsed = new URL(raw);
  return {
    host: parsed.hostname,
    database: parsed.pathname.replace(/^\//, "") || null,
  };
}

function endpointId(host) {
  return host.split(".")[0].replace(/-pooler$/, "");
}

function fingerprint(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

const pooled = parseDatabase(process.env.DATABASE_URL);
const direct = parseDatabase(process.env.DATABASE_URL_UNPOOLED);
const vercelEnv = process.env.VERCEL_ENV || null;
const gitRef = process.env.VERCEL_GIT_COMMIT_REF || null;

if (vercelEnv !== "preview") {
  throw new Error(`Refusing Preview DB bootstrap outside Preview: ${vercelEnv}`);
}
if (gitRef !== expectedGitRef) {
  throw new Error(`Refusing Preview DB bootstrap for unexpected Git ref: ${gitRef}`);
}
if (!pooled || !direct) {
  throw new Error("Preview DATABASE_URL and DATABASE_URL_UNPOOLED are both required");
}
if (!pooled.host.endsWith(".neon.tech") || !direct.host.endsWith(".neon.tech")) {
  throw new Error("Preview DB bootstrap requires Neon database hosts");
}
if (pooled.database !== "neondb" || direct.database !== "neondb") {
  throw new Error("Preview DB bootstrap requires the expected neondb database");
}

const pooledEndpoint = endpointId(pooled.host);
const directEndpoint = endpointId(direct.host);
if (pooledEndpoint !== directEndpoint) {
  throw new Error("Pooled and unpooled Preview URLs resolve to different Neon endpoints");
}
if (pooledEndpoint === productionEndpointId) {
  throw new Error("Refusing Preview DB bootstrap against the Production Neon endpoint");
}

console.log("[group9-preview-db-bootstrap]", JSON.stringify({
  vercelEnv,
  gitRef,
  database: pooled.database,
  neonEndpointFingerprint: fingerprint(pooledEndpoint),
  productionEndpointMatch: false,
}));

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(command, ["prisma", "db", "push", "--skip-generate"], {
  stdio: "inherit",
  env: process.env,
});

if (result.error) throw result.error;
if (result.status !== 0) {
  throw new Error(`prisma db push failed with exit code ${result.status}`);
}

console.log("[group9-preview-db-bootstrap] Prisma schema sync completed on guarded Preview database.");
