import assert from "node:assert/strict";

const expectedRef = "fix/group12-account-settings-hardening";
const productionHostFragment = "ep-quiet-bird-asiuetz3";
const databaseUrl = process.env.DATABASE_URL || "";
const unpooledUrl = process.env.DATABASE_URL_UNPOOLED || "";

function parseDb(raw) {
  const parsed = new URL(raw);
  return {
    host: parsed.hostname,
    database: parsed.pathname.replace(/^\//, ""),
    endpoint: parsed.hostname.split(".")[0].replace(/-pooler$/, ""),
  };
}

assert.equal(process.env.VERCEL, "1", "Refusing schema initialization outside Vercel");
assert.equal(process.env.VERCEL_ENV, "preview", "Refusing schema initialization outside Preview");
assert.equal(process.env.VERCEL_GIT_COMMIT_REF, expectedRef, "Refusing schema initialization on unexpected Git ref");
assert.ok(databaseUrl && unpooledUrl, "Preview DATABASE_URL values are required");
const pooled = parseDb(databaseUrl);
const unpooled = parseDb(unpooledUrl);
assert.ok(pooled.host.endsWith(".neon.tech") && unpooled.host.endsWith(".neon.tech"), "Refusing non-Neon database");
assert.equal(pooled.database, "neondb");
assert.equal(unpooled.database, "neondb");
assert.equal(pooled.endpoint, unpooled.endpoint, "Pooled/unpooled endpoints differ");
assert.ok(!pooled.host.includes(productionHostFragment) && !unpooled.host.includes(productionHostFragment), "Refusing Production database endpoint");

console.log("[group12-bootstrap] isolated Preview DB guard PASS", JSON.stringify({
  env: process.env.VERCEL_ENV,
  ref: process.env.VERCEL_GIT_COMMIT_REF,
  database: pooled.database,
  productionEndpointMatch: false,
}));
