import { NextRequest, NextResponse } from "next/server";
import { currentAdminAccess } from "@/lib/admin-permissions";
import { rewardRateForNewProject, syncStageReward } from "@/lib/ambassador-rewards";
import { writeAdminAudit } from "@/lib/admin-audit";
import { db } from "@/lib/db";
import { hasTrustedOrigin, invalidOriginResponse } from "@/lib/request-security";

function normalizeDigits(value: string) {
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  const eastern = "۰۱۲۳۴۵۶۷۸۹";
  return value
    .replace(/[٠-٩]/g, (digit) => String(arabic.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(eastern.indexOf(digit)));
}

function stringList(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 100);
  }
  if (typeof value === "string") {
    return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean).slice(0, 100);
  }
  return [];
}

function normalizeProjectLink(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed.replace(/^\/+/, "")}`;
  try {
    const url = new URL(candidate);
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname || !url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function parseLinks(value: unknown) {
  const raw = stringList(value);
  const parsed = raw.map((original) => ({ original, normalized: normalizeProjectLink(original) }));
  return {
    links: [...new Set(parsed.flatMap((item) => item.normalized ? [item.normalized] : []))],
    invalid: parsed.filter((item) => !item.normalized).map((item) => item.original),
  };
}

function stageNames(value: unknown) {
  return typeof value === "string"
    ? value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, 30)
    : [];
}

function stageAmount(line: string) {
  const normalized = normalizeDigits(line).trim();
  const explicit = normalized.match(/(?:\$\s*([0-9][0-9.,]*)|([0-9][0-9.,]*)\s*(?:\$|USD|EUR|SYP|TRY|دولار|دولارات|يورو|ليرة)|^([0-9][0-9.,]*)(?:\s|$))/i);
  const raw = explicit?.[1] || explicit?.[2] || explicit?.[3] || "";
  const amount = Number(raw.replace(/,/g, ""));
  return Number.isFinite(amount) && amount > 0 && amount <= 9_999_999_999.99 ? amount : null;
}

function stageDrafts(stagesValue: unknown, financialPlanValue: unknown, currency: string) {
  const names = stageNames(stagesValue);
  const financialLines = typeof financialPlanValue === "string"
    ? financialPlanValue.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
    : [];
  const amounts = financialLines.map(stageAmount);
  if (!names.length) return { stages: [], error: "أضف مرحلة واحدة على الأقل للمشروع." };
  if (names.length !== amounts.length || amounts.some((amount) => amount === null)) {
    return { stages: [], error: "كل مرحلة تحتاج مبلغًا صحيحًا واحدًا. راجع أسماء المراحل ومبالغها ثم أعد الحفظ." };
  }
  return {
    stages: names.map((name, index) => ({ name: name.slice(0, 160), amount: amounts[index] as number, currency })),
    error: null as string | null,
  };
}

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return invalidOriginResponse();
  const access = await currentAdminAccess(request);
  if (!access || !(access.isOwner || access.permissions.includes("projects"))) {
    return NextResponse.json({ error: "لا تملك صلاحية إدارة المشاريع" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const clientId = typeof body?.clientId === "string" ? body.clientId.trim() : "";
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const currencyRaw = typeof body?.currency === "string" ? body.currency : typeof body?.feeCurrency === "string" ? body.feeCurrency : "USD";
  const currency = currencyRaw.trim().toUpperCase();
  const dueAt = body?.dueAt ? new Date(body.dueAt) : null;
  const requestedReferralId = typeof body?.referralId === "string" ? body.referralId.trim() : "";
  const parsedLinks = parseLinks(body?.links);
  const parsedStages = stageDrafts(body?.stages, body?.financialPlan, currency);

  if (!clientId) return NextResponse.json({ error: "اختر العميل صاحب المشروع." }, { status: 400 });
  if (title.length < 2) return NextResponse.json({ error: "اسم المشروع مطلوب." }, { status: 400 });
  if (!/^[A-Z]{3}$/.test(currency)) return NextResponse.json({ error: "عملة المشروع غير صالحة." }, { status: 400 });
  if (dueAt && Number.isNaN(dueAt.getTime())) return NextResponse.json({ error: "موعد التسليم غير صالح." }, { status: 400 });
  if (parsedLinks.invalid.length) return NextResponse.json({ error: `الرابط غير صالح: ${parsedLinks.invalid[0]}` }, { status: 400 });
  if (parsedStages.error) return NextResponse.json({ error: parsedStages.error }, { status: 400 });

  const [client, referrals] = await Promise.all([
    db.user.findFirst({
      where: { id: clientId, OR: [{ role: "CLIENT" }, { clientEnabled: true }] },
      select: { id: true, name: true, email: true },
    }),
    db.partnerReferral.findMany({
      where: { convertedClientId: clientId, status: "CONVERTED", clientProject: null },
      orderBy: { convertedAt: "desc" },
      take: 20,
      select: { id: true, ambassadorId: true },
    }),
  ]);
  if (!client) return NextResponse.json({ error: "العميل غير موجود أو غير متاح." }, { status: 404 });

  const referral = requestedReferralId
    ? referrals.find((item) => item.id === requestedReferralId) || null
    : referrals.length === 1
      ? referrals[0]
      : null;
  if (requestedReferralId && !referral) {
    return NextResponse.json({ error: "الإحالة المحددة غير متاحة لهذا العميل." }, { status: 409 });
  }
  if (!requestedReferralId && referrals.length > 1) {
    return NextResponse.json({
      error: "لدى هذا العميل أكثر من إحالة غير مرتبطة. يجب تحديد مصدر المشروع قبل الإنشاء حتى لا تُنسب المكافأة إلى سفير خاطئ.",
      code: "MULTIPLE_ELIGIBLE_REFERRALS",
    }, { status: 409 });
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const rewardSnapshot = referral?.ambassadorId
        ? await rewardRateForNewProject(tx, referral.ambassadorId)
        : null;

      const project = await tx.clientProject.create({
        data: {
          clientId,
          referralId: referral?.id || null,
          title,
          description: typeof body?.description === "string" ? body.description.trim() || null : null,
          agreementDetails: typeof body?.agreementDetails === "string" ? body.agreementDetails.trim() || null : null,
          financialPlan: parsedStages.stages.map((stage) => String(stage.amount)).join("\n"),
          currency,
          stages: parsedStages.stages.map((stage) => stage.name).join("\n"),
          links: parsedLinks.links,
          notes: typeof body?.notes === "string" ? body.notes.trim() || null : null,
          status: "PLANNING",
          progress: 0,
          dueAt,
          ambassadorRewardRate: rewardSnapshot?.rate,
          ambassadorQualifiedAt: rewardSnapshot?.qualifiedAt,
        },
      });

      const stageIds: string[] = [];
      let firstStage: { id: string; name: string; amount: number; currency: string } | null = null;
      for (const [index, input] of parsedStages.stages.entries()) {
        const stage = await tx.projectStage.create({
          data: {
            projectId: project.id,
            name: input.name,
            amount: input.amount,
            currency: input.currency,
            position: index + 1,
          },
        });
        stageIds.push(stage.id);
        if (index === 0) {
          firstStage = { id: stage.id, name: stage.name, amount: Number(stage.amount), currency: stage.currency };
        }
        if (rewardSnapshot) await syncStageReward(tx, stage.id);
      }

      if (!firstStage) throw new Error("FIRST_STAGE_MISSING");

      const invoiceYear = project.createdAt.getUTCFullYear();
      const sequence = await tx.invoiceSequence.upsert({
        where: { year: invoiceYear },
        create: { year: invoiceYear, lastNumber: 1 },
        update: { lastNumber: { increment: 1 } },
      });
      const firstInvoiceNumber = `CW-${invoiceYear}-${String(sequence.lastNumber).padStart(4, "0")}`;
      await tx.clientInvoice.create({
        data: {
          projectId: project.id,
          number: firstInvoiceNumber,
          type: "STANDARD",
          amount: firstStage.amount,
          currency: firstStage.currency,
          status: "DUE",
          dueAt: project.createdAt,
        },
      });

      await tx.clientNotification.create({
        data: {
          clientId,
          title: "تمت إضافة مشروع جديد",
          body: title,
          section: "projects",
        },
      });
      await tx.clientNotification.create({
        data: {
          clientId,
          title: "مطالبة دفع للمرحلة الأولى",
          body: `${title} — ${firstStage.name} — ${firstStage.amount} ${firstStage.currency} — ${firstInvoiceNumber}`,
          section: "invoices",
        },
      });

      await writeAdminAudit(tx, {
        actorId: access.userId,
        action: "PROJECT_CREATED",
        category: "POSITIVE",
        entityType: "CLIENT_PROJECT",
        entityId: project.id,
        entityLabel: title,
        after: {
          clientId,
          status: "PLANNING",
          progress: 0,
          stageCount: stageIds.length,
          stageIds,
          referralId: referral?.id || null,
          firstStageId: firstStage.id,
          firstInvoiceNumber,
          firstStagePaymentDueAt: project.createdAt.toISOString(),
        },
      });
      await writeAdminAudit(tx, {
        actorId: access.userId,
        action: "PROJECT_STAGES_CREATED_FROM_PROJECT",
        category: "POSITIVE",
        entityType: "CLIENT_PROJECT",
        entityId: project.id,
        entityLabel: title,
        after: { stageCount: stageIds.length, stageIds },
      });

      if (referral) {
        await writeAdminAudit(tx, {
          actorId: access.userId,
          action: "PROJECT_REFERRAL_AUTO_LINKED",
          category: "POSITIVE",
          entityType: "CLIENT_PROJECT",
          entityId: project.id,
          entityLabel: title,
          after: { referralId: referral.id, ambassadorId: referral.ambassadorId || null },
        });
      }
      if (rewardSnapshot && referral) {
        await writeAdminAudit(tx, {
          actorId: access.userId,
          action: "AMBASSADOR_REWARD_RATE_LOCKED",
          category: "POSITIVE",
          entityType: "CLIENT_PROJECT",
          entityId: project.id,
          entityLabel: title,
          after: {
            ambassadorId: referral.ambassadorId,
            referralId: referral.id,
            referralPosition: rewardSnapshot.referralPosition,
            level: rewardSnapshot.levelName,
            rate: rewardSnapshot.rate.toString(),
          },
        });
      }

      return { project, firstInvoiceNumber };
    });

    return NextResponse.json({
      project: result.project,
      assignments: [],
      structuredStagesCreated: parsedStages.stages.length,
      firstInvoiceNumber: result.firstInvoiceNumber,
    }, { status: 201 });
  } catch (error) {
    console.error("[admin-projects] Canonical project creation failed", error);
    return NextResponse.json({ error: "تعذر إنشاء المشروع كاملًا. لم يتم اعتماد إنشاء جزئي." }, { status: 409 });
  }
}
