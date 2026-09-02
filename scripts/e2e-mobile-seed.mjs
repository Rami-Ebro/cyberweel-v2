import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";

const db = new PrismaClient();
const PASSWORD = "CwMobileE2E!2026-Safe";
const emails = {
  owner: "e2e-owner@cyberweel.test",
  client: "e2e-client@cyberweel.test",
  partner: "e2e-partner@cyberweel.test",
  ambassador: "e2e-ambassador@cyberweel.test",
};

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const passwordHash = hashPassword(PASSWORD);
const now = new Date();
const future = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

try {
  const owner = await db.user.create({
    data: {
      email: emails.owner,
      name: "E2E Owner",
      role: "ADMIN",
      isActive: true,
      passwordHash,
      adminProfile: { create: { isOwner: true, isActive: true } },
    },
  });

  const client = await db.user.create({
    data: {
      email: emails.client,
      name: "E2E Client",
      role: "CLIENT",
      clientEnabled: true,
      isActive: true,
      passwordHash,
    },
  });

  const partnerUser = await db.user.create({
    data: {
      email: emails.partner,
      name: "E2E Partner",
      role: "PARTNER",
      isActive: true,
      passwordHash,
      partner: {
        create: {
          status: "ACTIVE",
          profileCompletedAt: now,
          phone: "+963900000001",
          specialty: "Mobile E2E",
        },
      },
    },
    include: { partner: true },
  });

  const ambassadorUser = await db.user.create({
    data: {
      email: emails.ambassador,
      name: "E2E Ambassador",
      role: "AMBASSADOR",
      isActive: true,
      passwordHash,
      ambassador: {
        create: {
          status: "ACTIVE",
          profileCompletedAt: now,
          phone: "+963900000002",
          country: "E2E",
          contactMethod: "WhatsApp",
          payoutMethod: "حوالة مالية",
          payoutDetails: "E2E payout details",
        },
      },
    },
    include: { ambassador: true },
  });

  const referral = await db.partnerReferral.create({
    data: {
      ambassadorId: ambassadorUser.ambassador.id,
      name: "E2E Referred Client",
      email: "e2e-referred-client@cyberweel.test",
      phone: "+963900000003",
      contactMethod: "WhatsApp",
      status: "CONVERTED",
      adminDecision: "CONVERTED_TO_CLIENT",
      commissionType: "FIXED",
      commissionAmount: "50.00",
      commissionCurrency: "USD",
      commissionStatus: "DUE",
      convertedClientId: client.id,
      convertedAt: now,
      notes: "Representative mobile E2E referral",
    },
  });

  const project = await db.clientProject.create({
    data: {
      clientId: client.id,
      referralId: referral.id,
      title: "Mobile E2E Project",
      description: "Representative project used only inside the isolated mobile E2E database.",
      agreementDetails: "Responsive dashboard validation at 320, 375, 390 and 430 pixels.",
      financialPlan: "المرحلة الأولى: 1000 USD\nالمرحلة الثانية: 1200 USD",
      currency: "USD",
      stages: "Discovery → Build → Review",
      ambassadorRewardRate: "5.00",
      ambassadorQualifiedAt: now,
      status: "IN_PROGRESS",
      progress: 45,
      startsAt: now,
      dueAt: future,
    },
  });

  const stage = await db.projectStage.create({
    data: {
      projectId: project.id,
      name: "Mobile E2E Stage",
      position: 1,
      amount: "1000.00",
      currency: "USD",
      status: "IN_PROGRESS",
      paymentStatus: "PENDING",
      startsAt: now,
    },
  });

  await db.projectStagePartnerAssignment.create({
    data: {
      id: "e2e-mobile-assignment-1",
      projectStageId: stage.id,
      partnerId: partnerUser.partner.id,
      tasks: ["راجع العرض على الهاتف", "تحقق من الجدول الأفقي"],
      deliverables: ["Mobile screenshot", "Accessibility verification"],
      status: "IN_PROGRESS",
      progress: 42,
      feeAmount: "550.00",
      feeCurrency: "USD",
      paymentStatus: "APPROVED",
      approvedAt: now,
      dueAt: future,
    },
  });

  await db.clientInvoice.create({
    data: {
      projectId: project.id,
      number: "E2E-MOBILE-001",
      amount: "1200.00",
      currency: "USD",
      status: "DUE",
      dueAt: future,
    },
  });

  await db.clientMessage.create({
    data: {
      clientId: client.id,
      projectId: project.id,
      subject: "Mobile E2E update",
      body: "This representative message validates the mobile client dashboard.",
      fromAdmin: true,
    },
  });

  await db.clientNotification.create({
    data: {
      clientId: client.id,
      title: "Mobile E2E notification",
      body: "Open this notification popover at narrow viewport widths.",
      section: "invoices",
    },
  });

  await db.adminNotification.create({
    data: {
      title: "Mobile E2E admin notification",
      body: "Representative admin notification for responsive verification.",
      href: "/admin/partners",
      kind: "E2E",
    },
  });

  await db.ambassadorReward.create({
    data: {
      ambassadorId: ambassadorUser.ambassador.id,
      referralId: referral.id,
      clientId: client.id,
      projectId: project.id,
      projectStageId: stage.id,
      rate: "5.00",
      baseAmount: "1000.00",
      amount: "50.00",
      currency: "USD",
      status: "EARNED",
      earnedAt: now,
    },
  });

  console.log(JSON.stringify({
    ok: true,
    password: PASSWORD,
    accounts: emails,
    ids: {
      owner: owner.id,
      client: client.id,
      partner: partnerUser.partner.id,
      ambassador: ambassadorUser.ambassador.id,
      project: project.id,
      stage: stage.id,
    },
  }, null, 2));
} finally {
  await db.$disconnect();
}
