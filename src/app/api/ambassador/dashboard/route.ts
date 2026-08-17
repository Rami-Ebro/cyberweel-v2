import { db } from "@/lib/db";
import { canAdmin } from "@/lib/admin-permissions";
import { currentAmbassador } from "@/lib/ambassador-auth";
import { formatAmbassadorReferralCode } from "@/lib/partner-referral";
import { DEFAULT_AMBASSADOR_REWARD_LEVELS, utcMonthRange } from "@/lib/ambassador-rewards";
import {
  consumeRateLimit,
  hasTrustedOrigin,
  invalidOriginResponse,
  rateLimitResponse,
} from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";

async function dashboardAmbassador(request: NextRequest) {
  const previewId = request.nextUrl.searchParams.get("adminPreview");
  if (previewId) {
    if (!(await canAdmin(request, "ambassadors"))) return null;
    const ambassador = await db.ambassador.findUnique({
      where: { id: previewId },
      select: {
        id: true,
        referralNumber: true,
        status: true,
        phone: true,
        country: true,
        contactMethod: true,
        payoutMethod: true,
        payoutDetails: true,
        profileCompletedAt: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true, role: true, isActive: true } },
      },
    });
    if (!ambassador) return null;
    return {
      ...ambassador.user,
      ambassador: {
        id: ambassador.id,
        referralNumber: ambassador.referralNumber,
        status: ambassador.status,
        phone: ambassador.phone,
        country: ambassador.country,
        contactMethod: ambassador.contactMethod,
        payoutMethod: ambassador.payoutMethod,
        payoutDetails: ambassador.payoutDetails,
        profileCompletedAt: ambassador.profileCompletedAt,
        createdAt: ambassador.createdAt,
      },
      isAdminPreview: true,
    };
  }

  const user = await currentAmbassador(request);
  return user ? { ...user, isAdminPreview: false } : null;
}

function serializeReferral<T extends {
  commissionAmount: { toString(): string } | null;
  clientProject?: {
    title: string;
    currency: string;
    ambassadorRewardRate: { toString(): string } | null;
  } | null;
}>(referral: T) {
  return {
    ...referral,
    commissionAmount: referral.commissionAmount?.toString() ?? null,
    clientProject: referral.clientProject
      ? {
          ...referral.clientProject,
          ambassadorRewardRate: referral.clientProject.ambassadorRewardRate?.toString() ?? null,
        }
      : null,
  };
}

export async function GET(request: NextRequest) {
  const user = await dashboardAmbassador(request);
  if (!user) return NextResponse.json({ error: "FORBIDDEN", redirectTo: "/login" }, { status: 401 });
  if (!user.isAdminPreview && !user.ambassador!.profileCompletedAt) {
    return NextResponse.json({ error: "PROFILE_REQUIRED", redirectTo: "/complete-profile?capability=AMBASSADOR" }, { status: 428 });
  }

  const month = utcMonthRange();
  const [rawReferrals, rawRewards, configuredRewardLevels, successfulProjectsThisMonth] = await Promise.all([
    db.partnerReferral.findMany({
      where: { ambassadorId: user.ambassador!.id },
      orderBy: { createdAt: "desc" },
      include: {
        clientProject: {
          select: {
            title: true,
            currency: true,
            ambassadorRewardRate: true,
          },
        },
      },
    }),
    db.ambassadorReward.findMany({
      where: { ambassadorId: user.ambassador!.id },
      orderBy: { createdAt: "desc" },
      include: {
        referral: { select: { name: true, email: true } },
        project: { select: { title: true, client: { select: { name: true, email: true } } } },
        projectStage: { select: { name: true } },
      },
    }),
    db.ambassadorRewardLevel.findMany({ where: { isActive: true }, orderBy: { minSuccessfulReferrals: "asc" } }),
    db.ambassadorReward.findMany({
      where: {
        ambassadorId: user.ambassador!.id,
        status: { in: ["EARNED", "PAID"] },
        earnedAt: { gte: month.start, lt: month.end },
      },
      select: { projectId: true },
      distinct: ["projectId"],
    }),
  ]);
  const successfulThisMonth = successfulProjectsThisMonth.length;
  const successfulReferralIds = new Set(
    rawRewards
      .filter((reward) =>
        ["EARNED", "PAID"].includes(reward.status) &&
        reward.earnedAt &&
        reward.earnedAt >= month.start &&
        reward.earnedAt < month.end,
      )
      .map((reward) => reward.referralId),
  );
  const rewardLevels = configuredRewardLevels.length ? configuredRewardLevels : DEFAULT_AMBASSADOR_REWARD_LEVELS;
  const referrals = rawReferrals.map((rawReferral) => {
    const referral = serializeReferral(rawReferral);
    const displayStatus = successfulReferralIds.has(rawReferral.id)
      ? "إحالة ناجحة"
      : referral.clientProject?.ambassadorRewardRate
        ? "تم الاتفاق — بانتظار أول دفعة"
        : rawReferral.status === "INTERESTED"
          ? "قيد التفاوض"
          : rawReferral.status;
    return { ...referral, status: displayStatus };
  });
  const summaries = new Map<string, {
    currency: string;
    pending: number;
    approved: number;
    paid: number;
    cancelled: number;
  }>();

  for (const referral of referrals) {
    if (!referral.commissionAmount) continue;
    const amount = Number(referral.commissionAmount);
    if (!Number.isFinite(amount)) continue;
    const currency = referral.commissionCurrency.toUpperCase();
    const summary = summaries.get(currency) || { currency, pending: 0, approved: 0, paid: 0, cancelled: 0 };
    if (["VERIFYING", "ON_HOLD"].includes(referral.commissionStatus)) summary.pending += amount;
    if (referral.commissionStatus === "DUE") summary.approved += amount;
    if (referral.commissionStatus === "PAID") summary.paid += amount;
    if (referral.commissionStatus === "NOT_ELIGIBLE") summary.cancelled += amount;
    summaries.set(currency, summary);
  }

  const rewardSummaries = new Map<string, { currency: string; total: number; expected: number; earned: number; paid: number }>();
  const rewards = rawRewards.map((reward) => {
    const value = Number(reward.amount);
    const summary = rewardSummaries.get(reward.currency) || { currency: reward.currency, total: 0, expected: 0, earned: 0, paid: 0 };
    if (reward.status !== "CANCELLED") summary.total += value;
    if (reward.status === "EXPECTED") summary.expected += value;
    if (reward.status === "EARNED") summary.earned += value;
    if (reward.status === "PAID") summary.paid += value;
    rewardSummaries.set(reward.currency, summary);
    return {
      ...reward,
      rate: reward.rate.toString(),
      baseAmount: reward.baseAmount.toString(),
      amount: reward.amount.toString(),
    };
  });
  const currentLevel = successfulThisMonth
    ? [...rewardLevels].reverse().find((level) => level.minSuccessfulReferrals <= successfulThisMonth) || null
    : null;
  const nextLevel = rewardLevels.find((level) => level.minSuccessfulReferrals > successfulThisMonth) || null;

  const code = formatAmbassadorReferralCode(user.ambassador!.referralNumber);
  return NextResponse.json({
    ambassador: {
      id: user.ambassador!.id,
      name: user.name || user.email,
      email: user.email,
      code,
      referralUrl: `${request.nextUrl.origin}/?ref=${code}`,
      joinedAt: user.ambassador!.createdAt,
      phone: user.ambassador!.phone,
      country: user.ambassador!.country,
      contactMethod: user.ambassador!.contactMethod,
      payoutMethod: user.ambassador!.payoutMethod,
      payoutDetails: user.ambassador!.payoutDetails,
    },
    isAdminPreview: user.isAdminPreview,
    stats: {
      referrals: referrals.length,
      followUp: rawReferrals.filter((item) =>
        ["NEW", "CONTACTED", "INTERESTED", "AWAITING_RESPONSE"].includes(item.status) &&
        !["REJECTED", "CANCELLED"].includes(item.adminDecision || ""),
      ).length,
      converted: rawReferrals.filter((item) => item.status === "CONVERTED").length,
      qualified: rawReferrals.filter((item) => item.status === "INTERESTED").length,
      commissionsByCurrency: Array.from(summaries.values()).map((item) => ({
        currency: item.currency,
        pending: item.pending.toFixed(2),
        approved: item.approved.toFixed(2),
        paid: item.paid.toFixed(2),
        cancelled: item.cancelled.toFixed(2),
      })),
      rewardsByCurrency: Array.from(rewardSummaries.values()).map((item) => ({
        currency: item.currency,
        total: item.total.toFixed(2),
        expected: item.expected.toFixed(2),
        earned: item.earned.toFixed(2),
        paid: item.paid.toFixed(2),
      })),
      rewardLevels: rewardLevels.map((level) => ({
        id: level.id,
        name: level.name,
        minSuccessfulReferrals: level.minSuccessfulReferrals,
        rate: level.rate.toString(),
      })),
      monthlyLevel: {
        successfulReferrals: successfulThisMonth,
        name: currentLevel?.name || "البداية",
        rate: currentLevel?.rate.toString() || "0",
        nextRate: nextLevel?.rate.toString() || null,
        nextTarget: nextLevel?.minSuccessfulReferrals || null,
        remaining: nextLevel ? Math.max(0, nextLevel.minSuccessfulReferrals - successfulThisMonth) : 0,
      },
    },
    referrals,
    rewards,
  });
}

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return invalidOriginResponse();

  const user = await currentAmbassador(request);
  if (!user) return NextResponse.json({ error: "الحساب غير متاح" }, { status: 401 });
  if (!user.ambassador!.profileCompletedAt) {
    return NextResponse.json({ error: "أكمل ملفك أولًا" }, { status: 428 });
  }

  const limit = await consumeRateLimit(request, {
    action: "ambassador-direct-referral",
    subject: user.id,
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) return rateLimitResponse(limit);

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const contactMethod = typeof body?.contactMethod === "string" ? body.contactMethod.trim() : "";
  const company = typeof body?.company === "string" ? body.company.trim() : "";
  const needs = typeof body?.needs === "string" ? body.needs.trim() : "";
  const extraNotes = typeof body?.notes === "string" ? body.notes.trim() : "";

  if (
    !name ||
    name.length > 120 ||
    !email ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    phone.length > 40 ||
    !contactMethod ||
    contactMethod.length > 160 ||
    company.length > 160 ||
    !needs ||
    needs.length > 2000 ||
    extraNotes.length > 2000
  ) {
    return NextResponse.json(
      { error: "INVALID_REFERRAL", message: "أدخل اسم العميل والبريد الإلكتروني ووسيلة تواصل إضافية واحتياجه بشكل صحيح." },
      { status: 400 },
    );
  }

  if (email === user.email.trim().toLowerCase()) {
    return NextResponse.json(
      { error: "SELF_REFERRAL", message: "لا يمكنك تسجيل بريد حسابك كإحالة عميل." },
      { status: 409 },
    );
  }

  const [existingReferral, existingUser] = await Promise.all([
    db.partnerReferral.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true, status: true, ambassadorId: true, convertedClientId: true },
    }),
    db.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    }),
  ]);

  if (existingReferral) {
    return NextResponse.json(
      {
        error: "DUPLICATE_REFERRAL_EMAIL",
        message: existingReferral.ambassadorId === user.ambassador!.id
          ? "هذا البريد مسجل بالفعل ضمن إحالاتك. تابع الإحالة الحالية بدل إنشاء نسخة جديدة."
          : "هذا البريد مسجل بالفعل كإحالة في CyberWeel ولا يمكن إنشاء إحالة مكررة.",
      },
      { status: 409 },
    );
  }

  if (existingUser) {
    return NextResponse.json(
      { error: "EXISTING_ACCOUNT_EMAIL", message: "هذا البريد مرتبط بحساب موجود في CyberWeel ولا يمكن تسجيله كإحالة جديدة." },
      { status: 409 },
    );
  }

  const notes = extraNotes ? `${needs}\n\nملاحظات السفير: ${extraNotes}` : needs;

  const referral = await db.partnerReferral.create({
    data: {
      ambassadorId: user.ambassador!.id,
      name,
      email,
      phone: phone || null,
      company: company || null,
      contactMethod,
      notes,
      source: "إضافة مباشرة من السفير",
      sourcePath: "/ambassador/dashboard",
    },
  });

  return NextResponse.json({ referral: serializeReferral(referral) }, { status: 201 });
}
