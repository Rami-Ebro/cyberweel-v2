const expectedGitRef = "fix/group9-legacy-partner-payment";
const expectedNeonProjectId = "royal-firefly-25895184";

function safeDatabaseIdentity(raw) {
  if (!raw) return { present: false, host: null, database: null };
  const parsed = new URL(raw);
  return {
    present: true,
    host: parsed.hostname,
    database: parsed.pathname.replace(/^\//, "") || null,
  };
}

const identity = {
  vercelEnv: process.env.VERCEL_ENV || null,
  gitRef: process.env.VERCEL_GIT_COMMIT_REF || null,
  neonProjectId: process.env.NEON_PROJECT_ID || null,
  neonBranchId: process.env.NEON_BRANCH_ID || null,
  database: safeDatabaseIdentity(process.env.DATABASE_URL),
  databaseUnpooled: safeDatabaseIdentity(process.env.DATABASE_URL_UNPOOLED),
  neonRelatedVariableNames: Object.keys(process.env)
    .filter((key) => /^(NEON_|DATABASE_URL|PGHOST|PGDATABASE)/.test(key))
    .sort(),
};

console.log("[group9-preview-db-diagnostic]", JSON.stringify(identity));

if (identity.vercelEnv !== "preview") {
  throw new Error(`Refusing diagnostic outside Preview: ${identity.vercelEnv}`);
}
if (identity.gitRef !== expectedGitRef) {
  throw new Error(`Refusing diagnostic for unexpected Git ref: ${identity.gitRef}`);
}
if (identity.neonProjectId !== expectedNeonProjectId) {
  throw new Error(`Refusing diagnostic for unexpected Neon project: ${identity.neonProjectId}`);
}
if (!identity.database.present) {
  throw new Error("DATABASE_URL is missing from Preview environment");
}
