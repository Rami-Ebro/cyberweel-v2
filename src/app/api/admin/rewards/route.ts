import { NextRequest, NextResponse } from "next/server";
import type {
  AmbassadorRewardStatus,
  Prisma,
  ProjectStagePaymentStatus,
  ProjectStageStatus,
} from "@prisma/client";
import { currentAdminAccess } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { rewardRateForNewProject, syncStageReward } from "@/lib/ambassador-rewards";
import { writeAdminAudit } from "@/lib/admin-audit";
import { hasTrustedOrigin, invalidOriginResponse } from "@/lib/request-security";

const stageStatuses = new Set<ProjectStageStatus>(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]);
const paymentStatuses = new Set<ProjectStagePaymentStatus>(["PENDING", "PAID", "CANCELLED"]);

async function requireRewardsAdmin(request: NextRequest) {
  const access = await currentAdminAccess(request);
  if (!access || !(access.isOwner || access.permissions.includes("rewards"))) return null;
  return access;
}

function money(value: { toString(): string }) {
  return value.toString();
}

function dateInput(value: unknown) {
  if (!value) return null;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

const rewardInclude = {
  ambassador: { select: { id: true, payoutMethod: true, payoutDetails: true, user: { select: { name: true, email: true } } } },
  referral: { select: { id: true, name: true, email: true } },
  project: { select: { id: true, title: true, client: { select: { id: true, name: true, email: true } } } },
  projectStage: { select: { id: true, name: true, status: true, paymentStatus: true, completedAt: true, approvedAt: true } },
} as const;

type RewardResult = Prisma.AmbassadorRewardGetPayload<{ include: typeof rewardInclude }>;

function rewardPayload(reward: RewardResult) {
  return {
    ...reward,
    rate: money(reward.rate),
    baseAmount: money(reward.baseAmount),
    amount: money(reward.amount),
  };
}

export async function GET(request: NextRequest) {
  if (!(await requireRewardsAdmin(request))) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  const [rewards, levels, projects] = await Promise.all([
    db.ambassadorReward.findMany({ orderBy: { createdAt: "desc" }, include: rewardInclude }),
    db.ambassadorRewardLevel.findMany({ orderBy: [{ minSuccessfulReferrals: "asc" }, { sortOrder: "asc" }] }),
    db.clientProject.findMany({
      where: { referral: { ambassadorId: { not: null } } },
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, name: true, email: true } },
        referral: { select: { id: true, ambassadorId: true, ambassador: { select: { user: { select: { name: true, email: true } } } } } },
        projectStages: { orderBy: { createdAt: "asc" }, include: { rewards: true } },
      },
    }),
  ]);

  return NextResponse.json({
    rewards: rewards.map(rewardPayload),
    levels: levels.map((level) => ({ ...level, rate: level.rate.toString() })),
    projects: projects.map((project) => ({
      ...project,
      ambassadorRewardRate: project.ambassadorRewardRate?.toString() || null,
      projectStages: project.projectStages.map((stage) => ({
        ...stage,
        amount: stage.amount.toString(),
        rewards: stage.rewards.map((reward) => ({ ...reward, rate: reward.rate.toString(), baseAmount: reward.baseAmount.toString(), amount: reward.amount.toString() })),
      })),
    })),
  });
}

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return invalidOriginResponse();
  const access = await requireRewardsAdmin(request);
  if (!access) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const body = await request.json().catch(() => null);
  const action = typeof body?.action === "string" ? body.action : "";

  try {
    if (action === "activate_project") {
      const projectId = typeof body?.projectId === "string" ? body.projectId : "";
      const project = await db.clientProject.findUnique({
        where: { id: projectId },
        include: { referral: { select: { id: true, ambassadorId: true } } },
      });
      if (!project?.referral?.ambassadorId) return NextResponse.json({ error: "المشروع غير مرتبط بإحالة سفير" }, { status: 409 });
      if (project.ambassadorRewardRate) return NextResponse.json({ error: "تم تثبيت نسبة هذا المشروع مسبقًا" }, { status: 409 });
      const updated = await db.$transaction(async (tx) => {
        const snapshot = await rewardRateForNewProject(tx, project.referral!.ambassadorId!);
        const saved = await tx.clientProject.update({
          where: { id: project.id },
          data: { ambassadorRewardRate: snapshot.rate, ambassadorQualifiedAt: snapshot.qualifiedAt },
        });
        await writeAdminAudit(tx, { actorId: access.userId, action: "AMBASSADOR_REWARD_RATE_LOCKED", category: "POSITIVE", entityType: "CLIENT_PROJECT", entityId: project.id, entityLabel: project.title, after: { ambassadorId: project.referral!.ambassadorId, referralPosition: snapshot.referralPosition, level: snapshot.levelName, rate: snapshot.rate.toString() } });
        return saved;
      });
      return NextResponse.json({ project: { ...updated, ambassadorRewardRate: updated.ambassadorRewardRate?.toString() } });
    }

    if (action === "stage_create") {
      const projectId = typeof body?.projectId === "string" ? body.projectId : "";
      const name = typeof body?.name === "string" ? body.name.trim().slice(0, 160) : "";
      const amount = Number(body?.amount);
      const startsAt = dateInput(body?.startsAt);
      if (!name || !Number.isFinite(amount) || amount <= 0 || amount > 9_999_999_999.99 || startsAt === undefined) {
        return NextResponse.json({ error: "اسم المرحلة وقيمتها الصحيحة مطلوبان" }, { status: 400 });
      }
      const project = await db.clientProject.findUnique({ where: { id: projectId }, select: { id: true, title: true, currency: true, ambassadorRewardRate: true, referral: { select: { ambassadorId: true } } } });
      if (!project?.referral?.ambassadorId || !project.ambassadorRewardRate) return NextResponse.json({ error: "فعّل مكافآت المشروع وثبّت النسبة أولًا" }, { status: 409 });
      const stage = await db.$transaction(async (tx) => {
        const created = await tx.projectStage.create({ data: { projectId, name, amount, currency: project.currency, startsAt } });
        const reward = await syncStageReward(tx, created.id);
        await writeAdminAudit(tx, { actorId: access.userId, action: "AMBASSADOR_REWARD_STAGE_CREATED", category: "POSITIVE", entityType: "PROJECT_STAGE", entityId: created.id, entityLabel: `${project.title} — ${name}`, after: { amount: String(amount), currency: project.currency, rewardId: reward?.id } });
        return created;
      });
      return NextResponse.json({ stage: { ...stage, amount: stage.amount.toString() } }, { status: 201 });
    }

    if (action === "stage_update") {
      const stageId = typeof body?.stageId === "string" ? body.stageId : "";
      const existing = await db.projectStage.findUnique({ where: { id: stageId }, include: { project: { select: { title: true } } } });
      if (!existing) return NextResponse.json({ error: "المرحلة غير موجودة" }, { status: 404 });
      const status = stageStatuses.has(body?.status as ProjectStageStatus) ? body.status as ProjectStageStatus : existing.status;
      const paymentStatus = paymentStatuses.has(body?.paymentStatus as ProjectStagePaymentStatus) ? body.paymentStatus as ProjectStagePaymentStatus : existing.paymentStatus;
      const amount = body?.amount === undefined ? Number(existing.amount) : Number(body.amount);
      const approved = body?.approved === true;
      if (!Number.isFinite(amount) || amount <= 0 || amount > 9_999_999_999.99) return NextResponse.json({ error: "قيمة المرحلة غير صالحة" }, { status: 400 });
      if (approved && status !== "COMPLETED") return NextResponse.json({ error: "لا يمكن اعتماد مرحلة غير مكتملة" }, { status: 409 });
      const stage = await db.$transaction(async (tx) => {
        const saved = await tx.projectStage.update({
          where: { id: stageId },
          data: {
            name: typeof body?.name === "string" && body.name.trim() ? body.name.trim().slice(0, 160) : existing.name,
            amount,
            status,
            paymentStatus,
            completedAt: status === "COMPLETED" ? existing.completedAt || new Date() : null,
            paidAt: paymentStatus === "PAID" ? existing.paidAt || new Date() : null,
            approvedAt: approved ? existing.approvedAt || new Date() : null,
            approvedById: approved ? access.userId : null,
          },
        });
        const reward = await syncStageReward(tx, stageId);
        await writeAdminAudit(tx, { actorId: access.userId, action: "AMBASSADOR_REWARD_STAGE_UPDATED", category: status === "CANCELLED" || paymentStatus === "CANCELLED" ? "SENSITIVE" : status === "COMPLETED" && approved ? "POSITIVE" : "NORMAL", entityType: "PROJECT_STAGE", entityId: stageId, entityLabel: `${existing.project.title} — ${saved.name}`, before: { status: existing.status, paymentStatus: existing.paymentStatus, amount: existing.amount.toString(), approvedAt: existing.approvedAt?.toISOString() || null }, after: { status, paymentStatus, amount: String(amount), approvedAt: saved.approvedAt?.toISOString() || null, rewardStatus: reward?.status } });
        return saved;
      });
      return NextResponse.json({ stage: { ...stage, amount: stage.amount.toString() } });
    }

    if (action === "reward_status") {
      const rewardId = typeof body?.rewardId === "string" ? body.rewardId : "";
      const requested = body?.status as AmbassadorRewardStatus;
      if (!["EARNED", "PAID", "CANCELLED"].includes(requested)) return NextResponse.json({ error: "حالة المكافأة غير صالحة" }, { status: 400 });
      const reward = await db.ambassadorReward.findUnique({ where: { id: rewardId }, include: { projectStage: true, project: { select: { title: true } } } });
      if (!reward) return NextResponse.json({ error: "المكافأة غير موجودة" }, { status: 404 });
      if (reward.status === "PAID") return NextResponse.json({ error: "المكافأة مدفوعة ولا يمكن تغييرها" }, { status: 409 });
      if (requested === "PAID" && reward.status !== "EARNED") return NextResponse.json({ error: "لا يمكن الدفع قبل الاستحقاق" }, { status: 409 });
      if (requested === "EARNED" && !(reward.projectStage.status === "COMPLETED" && reward.projectStage.paymentStatus === "PAID" && reward.projectStage.approvedAt)) return NextResponse.json({ error: "المرحلة يجب أن تكون مدفوعة ومكتملة ومعتمدة" }, { status: 409 });
      const reason = typeof body?.cancelReason === "string" ? body.cancelReason.trim().slice(0, 1000) : "";
      if (requested === "CANCELLED" && !reason) return NextResponse.json({ error: "سبب الإلغاء مطلوب" }, { status: 400 });
      const notes = typeof body?.adminNotes === "string" ? body.adminNotes.trim().slice(0, 3000) : "";
      const updated = await db.$transaction(async (tx) => {
        const saved = await tx.ambassadorReward.update({ where: { id: reward.id }, data: { status: requested, earnedAt: requested === "EARNED" ? reward.earnedAt || new Date() : reward.earnedAt, paidAt: requested === "PAID" ? new Date() : null, cancelledAt: requested === "CANCELLED" ? new Date() : null, cancelReason: requested === "CANCELLED" ? reason : null, adminNotes: notes || reward.adminNotes } });
        await writeAdminAudit(tx, { actorId: access.userId, action: requested === "PAID" ? "AMBASSADOR_REWARD_PAID" : requested === "CANCELLED" ? "AMBASSADOR_REWARD_CANCELLED" : "AMBASSADOR_REWARD_EARNED", category: requested === "CANCELLED" ? "SENSITIVE" : "POSITIVE", entityType: "AMBASSADOR_REWARD", entityId: reward.id, entityLabel: `${reward.project.title} — ${reward.projectStage.name}`, before: { status: reward.status }, after: { status: requested, amount: reward.amount.toString(), currency: reward.currency, reason: reason || null } });
        return saved;
      });
      return NextResponse.json({ reward: { ...updated, rate: updated.rate.toString(), baseAmount: updated.baseAmount.toString(), amount: updated.amount.toString() } });
    }

    if (action === "level_upsert") {
      const id = typeof body?.id === "string" ? body.id : "";
      const name = typeof body?.name === "string" ? body.name.trim().slice(0, 80) : "";
      const minSuccessfulReferrals = Number(body?.minSuccessfulReferrals);
      const rate = Number(body?.rate);
      if (!name || !Number.isInteger(minSuccessfulReferrals) || minSuccessfulReferrals < 1 || !Number.isFinite(rate) || rate <= 0 || rate > 100) return NextResponse.json({ error: "بيانات المستوى غير صالحة" }, { status: 400 });
      const saved = await db.$transaction(async (tx) => {
        const level = id
          ? await tx.ambassadorRewardLevel.update({ where: { id }, data: { name, minSuccessfulReferrals, rate, isActive: body?.isActive !== false, sortOrder: minSuccessfulReferrals } })
          : await tx.ambassadorRewardLevel.create({ data: { name, minSuccessfulReferrals, rate, isActive: body?.isActive !== false, sortOrder: minSuccessfulReferrals } });
        await writeAdminAudit(tx, { actorId: access.userId, action: "AMBASSADOR_REWARD_LEVEL_UPDATED", category: "NORMAL", entityType: "AMBASSADOR_REWARD_LEVEL", entityId: level.id, entityLabel: level.name, after: { minSuccessfulReferrals, rate: String(rate), isActive: level.isActive } });
        return level;
      });
      return NextResponse.json({ level: { ...saved, rate: saved.rate.toString() } });
    }

    return NextResponse.json({ error: "الإجراء غير معروف" }, { status: 400 });
  } catch (error) {
    console.error("[admin-rewards] operation failed", error);
    return NextResponse.json({ error: "تعذر حفظ العملية؛ تحقق من عدم تكرار المستوى أو المكافأة" }, { status: 409 });
  }
}
