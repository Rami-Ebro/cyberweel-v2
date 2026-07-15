import { neon } from "@neondatabase/serverless";
import { PrismaClient as SqliteClient } from "../src/generated/sqlite-client/index.js";

process.env.SQLITE_DATABASE_URL ||= "file:./custom.db";

const postgresUrl = process.env.POSTGRES_DATABASE_URL || process.env.DATABASE_URL;
if (!postgresUrl?.startsWith("postgres")) {
  throw new Error("POSTGRES_DATABASE_URL or DATABASE_URL must contain the Neon PostgreSQL URL");
}

const sqlite = new SqliteClient();
const sql = neon(postgresUrl);

const iso = (value) => (value instanceof Date ? value.toISOString() : value);

async function main() {
  const [users, smartLinks, scans] = await Promise.all([
    sqlite.user.findMany(),
    sqlite.smartLink.findMany(),
    sqlite.smartLinkScan.findMany(),
  ]);

  console.log("Source counts", {
    users: users.length,
    smartLinks: smartLinks.length,
    scans: scans.length,
  });

  for (const user of users) {
    await sql.query(
      `INSERT INTO "User" ("id", "email", "name", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT ("id") DO UPDATE SET
         "email" = EXCLUDED."email",
         "name" = EXCLUDED."name",
         "createdAt" = EXCLUDED."createdAt",
         "updatedAt" = EXCLUDED."updatedAt"`,
      [user.id, user.email, user.name, iso(user.createdAt), iso(user.updatedAt)],
    );
  }

  for (const link of smartLinks) {
    await sql.query(
      `INSERT INTO "SmartLink"
         ("id", "title", "slug", "destinationUrl", "isActive", "redirectType", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT ("id") DO UPDATE SET
         "title" = EXCLUDED."title",
         "slug" = EXCLUDED."slug",
         "destinationUrl" = EXCLUDED."destinationUrl",
         "isActive" = EXCLUDED."isActive",
         "redirectType" = EXCLUDED."redirectType",
         "createdAt" = EXCLUDED."createdAt",
         "updatedAt" = EXCLUDED."updatedAt"`,
      [
        link.id,
        link.title,
        link.slug,
        link.destinationUrl,
        link.isActive,
        link.redirectType,
        iso(link.createdAt),
        iso(link.updatedAt),
      ],
    );
  }

  for (const scan of scans) {
    await sql.query(
      `INSERT INTO "SmartLinkScan"
         ("id", "smartLinkId", "scannedAt", "ipHash", "country", "city", "device", "os", "browser", "userAgent", "referer", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT ("id") DO UPDATE SET
         "smartLinkId" = EXCLUDED."smartLinkId",
         "scannedAt" = EXCLUDED."scannedAt",
         "ipHash" = EXCLUDED."ipHash",
         "country" = EXCLUDED."country",
         "city" = EXCLUDED."city",
         "device" = EXCLUDED."device",
         "os" = EXCLUDED."os",
         "browser" = EXCLUDED."browser",
         "userAgent" = EXCLUDED."userAgent",
         "referer" = EXCLUDED."referer",
         "createdAt" = EXCLUDED."createdAt"`,
      [
        scan.id,
        scan.smartLinkId,
        iso(scan.scannedAt),
        scan.ipHash,
        scan.country,
        scan.city,
        scan.device,
        scan.os,
        scan.browser,
        scan.userAgent,
        scan.referer,
        iso(scan.createdAt),
      ],
    );
  }

  const [userRows, linkRows, scanRows] = await Promise.all([
    sql.query('SELECT COUNT(*)::int AS count FROM "User"'),
    sql.query('SELECT COUNT(*)::int AS count FROM "SmartLink"'),
    sql.query('SELECT COUNT(*)::int AS count FROM "SmartLinkScan"'),
  ]);

  const destination = {
    users: userRows[0].count,
    smartLinks: linkRows[0].count,
    scans: scanRows[0].count,
  };

  console.log("Destination counts", destination);

  if (
    destination.users < users.length ||
    destination.smartLinks < smartLinks.length ||
    destination.scans < scans.length
  ) {
    throw new Error("Destination counts are lower than source counts");
  }

  console.log("Migration completed successfully over Neon HTTPS");
}

main()
  .catch((error) => {
    console.error("Migration failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sqlite.$disconnect();
  });
