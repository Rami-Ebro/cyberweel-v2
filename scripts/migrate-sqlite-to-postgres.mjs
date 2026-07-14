import { PrismaClient as PostgresClient } from "@prisma/client";
import { PrismaClient as SqliteClient } from "../src/generated/sqlite-client/index.js";

const sqlite = new SqliteClient();
const postgres = new PostgresClient();

async function upsertMany(items, upsert) {
  for (const item of items) {
    await upsert(item);
  }
}

async function main() {
  if (!process.env.SQLITE_DATABASE_URL) {
    throw new Error("SQLITE_DATABASE_URL is required");
  }
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

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

  await upsertMany(users, (user) =>
    postgres.user.upsert({
      where: { id: user.id },
      create: user,
      update: user,
    }),
  );

  await upsertMany(smartLinks, (link) =>
    postgres.smartLink.upsert({
      where: { id: link.id },
      create: link,
      update: link,
    }),
  );

  await upsertMany(scans, (scan) =>
    postgres.smartLinkScan.upsert({
      where: { id: scan.id },
      create: scan,
      update: scan,
    }),
  );

  const [userCount, smartLinkCount, scanCount] = await Promise.all([
    postgres.user.count(),
    postgres.smartLink.count(),
    postgres.smartLinkScan.count(),
  ]);

  console.log("Destination counts", {
    users: userCount,
    smartLinks: smartLinkCount,
    scans: scanCount,
  });

  if (
    userCount < users.length ||
    smartLinkCount < smartLinks.length ||
    scanCount < scans.length
  ) {
    throw new Error("Destination counts are lower than source counts");
  }

  console.log("Migration completed successfully");
}

main()
  .catch((error) => {
    console.error("Migration failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.allSettled([sqlite.$disconnect(), postgres.$disconnect()]);
  });
