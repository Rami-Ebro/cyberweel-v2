import { Prisma } from "@prisma/client";

type RewardClient = Pick<
  Prisma.TransactionClient,
  "clientProject" | "projectStage" | "ambassadorReward"
>;

export const DEFAULT_AMBASSADOR_REWARD_LEVELS = [
  {
    id: "default-ambassador-level-1",
    name: "منطلق",
    minSuccessfulReferrals: 1,
    rate: new Prisma.Decimal(10),
  },
  {
    id: "default-ambassador-level-2",
    name: "نشط",
    minSuccessfulReferrals: 2,
    rate: new Prisma.Decimal(15),
  },
  {
    id: "default-ambassador-level-3",
    name: "نخبة",
    minSuccessfulReferrals: 5,
    rate: new Prisma.Decimal(20),
  },
] as const;

export function utcMonthRange(at = new Date()) {
  return {
    start: new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), 1)),
    end: new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth() + 1, 1)),
  };
}

export async function rewardRateForNewProject(
  tx: RewardClient,
  ambassadorId: string,
  qualifiedAt = new Date(),
) {
  const { start, end } = utcMonthRange(qualifiedAt);
  const successfulProjects = await tx.ambassadorReward.findMany({
    where: {
      ambassadorId,
      status: { in: ["EARNED", "PAID"] },
      earnedAt: { gte: start, lt: end },
    },
    select: { projectId: true },
    distinct: ["projectId"],
  });

  const levels = DEFAULT_AMBASSADOR_REWARD_LEVELS;
  const referralPosition = successfulProjects.length + 1;
  const level = [...levels]
    .reverse()
    .find((item) => item.minSuccessfulReferrals <= referralPosition) || levels[0];

  return {
    rate: level.rate,
    levelId: level.id,
    levelName: level.name,
    referralPosition,
    qualifiedAt,
  };
}

export async function syncStageReward(tx: RewardClient, stageId: string) {
  const stage = await tx.projectStage.findUnique({
    where: { id: stageId },
    include: {
      project: {
        include: {
          referral: { select: { id: true, ambassadorId: true } },
        },
      },
      rewards: true,
    },
  });
  if (!stage?.project.referral?.ambassadorId || !stage.project.ambassadorRewardRate) return null;

  const ambassadorId = stage.project.referral.ambassadorId;
  const rate = stage.project.ambassadorRewardRate;
  const amount = new Prisma.Decimal(stage.amount).mul(rate).div(100).toDecimalPlaces(2);
  const existing = stage.rewards.find((item) => item.ambassadorId === ambassadorId);

  if (!existing) {
    return tx.ambassadorReward.create({
      data: {
        ambassadorId,
        referralId: stage.project.referral.id,
        clientId: stage.project.clientId,
        projectId: stage.project.id,
        projectStageId: stage.id,
        rate,
        baseAmount: stage.amount,
        amount,
        currency: stage.currency,
        status:
          stage.status === "CANCELLED" || stage.paymentStatus === "CANCELLED"
            ? "CANCELLED"
            : stage.status === "COMPLETED" && stage.paymentStatus === "PAID" && stage.approvedAt
              ? "EARNED"
              : "EXPECTED",
        earnedAt:
          stage.status === "COMPLETED" && stage.paymentStatus === "PAID" && stage.approvedAt
            ? new Date()
            : null,
        cancelledAt:
          stage.status === "CANCELLED" || stage.paymentStatus === "CANCELLED" ? new Date() : null,
        cancelReason:
          stage.status === "CANCELLED" || stage.paymentStatus === "CANCELLED"
            ? "أُلغيت المرحلة قبل استحقاق المكافأة."
            : null,
      },
    });
  }

  if (existing.status === "PAID" || existing.status === "EARNED") return existing;

  const cancelled = stage.status === "CANCELLED" || stage.paymentStatus === "CANCELLED";
  const earned = stage.status === "COMPLETED" && stage.paymentStatus === "PAID" && Boolean(stage.approvedAt);
  return tx.ambassadorReward.update({
    where: { id: existing.id },
    data: {
      baseAmount: stage.amount,
      amount,
      rate,
      currency: stage.currency,
      status: cancelled ? "CANCELLED" : earned ? "EARNED" : "EXPECTED",
      earnedAt: earned ? existing.earnedAt || new Date() : null,
      cancelledAt: cancelled ? existing.cancelledAt || new Date() : null,
      cancelReason: cancelled ? existing.cancelReason || "أُلغيت المرحلة قبل استحقاق المكافأة." : null,
    },
  });
}
