import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const TEST_PARTNER = {
  email: "hamdo.partner@cyberweel.com",
  name: "حمدو",
  referralNumber: 1,
};

async function main() {
  const conflictingPartner = await db.partner.findUnique({
    where: { referralNumber: TEST_PARTNER.referralNumber },
    include: { user: true },
  });

  if (
    conflictingPartner &&
    conflictingPartner.user.email !== TEST_PARTNER.email
  ) {
    throw new Error(
      `Referral number ${TEST_PARTNER.referralNumber} is already assigned to ${conflictingPartner.user.email}`,
    );
  }

  const user = await db.user.upsert({
    where: { email: TEST_PARTNER.email },
    update: {
      name: TEST_PARTNER.name,
      role: "PARTNER",
    },
    create: {
      email: TEST_PARTNER.email,
      name: TEST_PARTNER.name,
      role: "PARTNER",
    },
  });

  const partner = await db.partner.upsert({
    where: { userId: user.id },
    update: {
      status: "ACTIVE",
    },
    create: {
      userId: user.id,
      referralNumber: TEST_PARTNER.referralNumber,
      status: "ACTIVE",
    },
  });

  console.log("Test partner is ready:");
  console.log({
    name: user.name,
    email: user.email,
    referralCode: `CW-${String(partner.referralNumber).padStart(4, "0")}`,
    status: partner.status,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
