import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";

const allowedPreviewBranch = "codex-9b7hcm";
const productionDatabaseHostFragment = "ep-quiet-bird-asiuetz3";

const isAllowedPreview =
  process.env.VERCEL === "1" &&
  process.env.VERCEL_ENV === "preview" &&
  process.env.VERCEL_GIT_COMMIT_REF === allowedPreviewBranch;

if (!isAllowedPreview) {
  console.log("[preview-seed] Skipped outside the isolated PR preview.");
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.error("[preview-seed] DATABASE_URL is missing from Preview.");
  process.exit(1);
}

let databaseUrl;

try {
  databaseUrl = new URL(process.env.DATABASE_URL);
} catch {
  console.error("[preview-seed] DATABASE_URL is invalid.");
  process.exit(1);
}

if (
  !databaseUrl.hostname.endsWith(".neon.tech") ||
  databaseUrl.hostname.includes(productionDatabaseHostFragment)
) {
  console.error("[preview-seed] Refusing to seed an unapproved database host.");
  process.exit(1);
}

const password = process.env.PREVIEW_TEST_PASSWORD;

if (!password) {
  console.error("[preview-seed] PREVIEW_TEST_PASSWORD is missing from the Preview environment.");
  process.exit(1);
}

if (password.length < 12 || password.length > 256) {
  console.error("[preview-seed] PREVIEW_TEST_PASSWORD must contain 12-256 characters.");
  process.exit(1);
}

function hashPassword(value) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(value, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const passwordHash = hashPassword(password);
const db = new PrismaClient();
const now = new Date();

const emails = {
  admin: "preview.admin@cyberweel.com",
  partner: "preview.partner@cyberweel.com",
  ambassador: "preview.ambassador@cyberweel.com",
};

try {
  await db.$transaction(async (tx) => {
    const admin = await tx.user.upsert({
      where: { email: emails.admin },
      update: {
        name: "إدارة المعاينة",
        role: "ADMIN",
        isActive: true,
        passwordHash,
      },
      create: {
        email: emails.admin,
        name: "إدارة المعاينة",
        role: "ADMIN",
        isActive: true,
        passwordHash,
      },
    });

    await tx.adminProfile.upsert({
      where: { userId: admin.id },
      update: { isOwner: true, isActive: true },
      create: {
        userId: admin.id,
        isOwner: true,
        isActive: true,
        permissions: [],
      },
    });

    const partnerUser = await tx.user.upsert({
      where: { email: emails.partner },
      update: {
        name: "شريك تنفيذ تجريبي",
        role: "PARTNER",
        isActive: true,
        passwordHash,
      },
      create: {
        email: emails.partner,
        name: "شريك تنفيذ تجريبي",
        role: "PARTNER",
        isActive: true,
        passwordHash,
      },
    });

    const partner = await tx.partner.upsert({
      where: { userId: partnerUser.id },
      update: {
        status: "ACTIVE",
        profileCompletedAt: now,
        phone: "+963900000001",
        specialty: "تطوير المنتجات الرقمية",
        experience: "خبرة تجريبية لمعاينة رحلة الشريك",
        availability: "متاح لمشروع واحد",
        portfolioUrl: "https://www.cyberweel.com",
      },
      create: {
        userId: partnerUser.id,
        status: "ACTIVE",
        profileCompletedAt: now,
        phone: "+963900000001",
        specialty: "تطوير المنتجات الرقمية",
        experience: "خبرة تجريبية لمعاينة رحلة الشريك",
        availability: "متاح لمشروع واحد",
        portfolioUrl: "https://www.cyberweel.com",
      },
    });

    const existingProject = await tx.partnerProject.findFirst({
      where: {
        partnerId: partner.id,
        title: "مشروع تجريبي لتطوير رحلة العميل",
      },
      select: { id: true },
    });

    const projectData = {
      description: "مشروع معاينة يوضح المهام والتسليمات والتحديثات داخل لوحة الشريك.",
      tasks: ["مراجعة المتطلبات", "إعداد خطة التنفيذ", "تسليم النسخة الأولية"],
      deliverables: ["خطة عمل", "نسخة أولية", "تقرير تسليم"],
      files: [],
      updates: ["تم إسناد المشروع إلى الشريك", "بدأت مراجعة المتطلبات"],
      status: "IN_PROGRESS",
      dueAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    };

    if (existingProject) {
      await tx.partnerProject.update({
        where: { id: existingProject.id },
        data: projectData,
      });
    } else {
      await tx.partnerProject.create({
        data: {
          partnerId: partner.id,
          title: "مشروع تجريبي لتطوير رحلة العميل",
          ...projectData,
        },
      });
    }

    const ambassadorUser = await tx.user.upsert({
      where: { email: emails.ambassador },
      update: {
        name: "سفير CyberWeel تجريبي",
        role: "AMBASSADOR",
        isActive: true,
        passwordHash,
      },
      create: {
        email: emails.ambassador,
        name: "سفير CyberWeel تجريبي",
        role: "AMBASSADOR",
        isActive: true,
        passwordHash,
      },
    });

    const ambassador = await tx.ambassador.upsert({
      where: { userId: ambassadorUser.id },
      update: {
        status: "ACTIVE",
        profileCompletedAt: now,
        phone: "+963900000002",
        country: "سوريا",
        contactMethod: "واتساب",
        payoutMethod: "محفظة إلكترونية",
        payoutDetails: "بيانات تجريبية",
      },
      create: {
        userId: ambassadorUser.id,
        status: "ACTIVE",
        profileCompletedAt: now,
        phone: "+963900000002",
        country: "سوريا",
        contactMethod: "واتساب",
        payoutMethod: "محفظة إلكترونية",
        payoutDetails: "بيانات تجريبية",
      },
    });

    const existingReferral = await tx.partnerReferral.findFirst({
      where: {
        ambassadorId: ambassador.id,
        email: "preview.client@cyberweel.com",
      },
      select: { id: true },
    });

    const referralData = {
      name: "عميل تجريبي",
      email: "preview.client@cyberweel.com",
      phone: "+963900000003",
      status: "QUALIFIED",
      sourcePath: "/?ref=preview",
      source: "رابط السفير",
      contactMethod: "واتساب",
      adminDecision: "مؤهل للمتابعة",
      commissionAmount: "125.00",
      commissionCurrency: "USD",
      commissionStatus: "APPROVED",
      notes: "إحالة تجريبية لعرض رحلة السفير.",
    };

    if (existingReferral) {
      await tx.partnerReferral.update({
        where: { id: existingReferral.id },
        data: referralData,
      });
    } else {
      await tx.partnerReferral.create({
        data: {
          ambassadorId: ambassador.id,
          ...referralData,
        },
      });
    }
  }, { maxWait: 15_000, timeout: 60_000 });

  console.log("[preview-seed] Test accounts are ready:", Object.values(emails));
} finally {
  await db.$disconnect();
}
