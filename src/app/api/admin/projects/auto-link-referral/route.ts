import { db } from "@/lib/db";
import { currentAdminAccess } from "@/lib/admin-permissions";
import { rewardRateForNewProject } from "@/lib/ambassador-rewards";
import { writeAdminAudit } from "@/lib/admin-audit";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const access = await currentAdminAccess(request);
  if (!access || !(access.isOwner || access.permissions.includes("projects"))) {
    return NextResponse.json({ error: "لا تملك صلاحية إدارة المشاريع" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const projectId = typeof body?.projectId === "string" ? body.projectId.trim() : "";
  const clientId = typeof body?.clientId === "string" ? body.clientId.trim() : "";
  if (!projectId || !clientId) {
    return NextResponse.json({ error: "بيانات المشروع غير مكتملة" }, { status: 400 });
  }

  const project = await db.clientProject.findFirst({
    where: { id: projectId, clientId },
    select: { id: true, title: true, referralId: true },
  });
  if (!project) return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });
  if (project.referralId) return NextResponse.json({ linked: true, referralId: project.referralId, alreadyLinked: true });

  const referrals = await db.partnerReferral.findMany({
    where: { convertedClientId: clientId, status: "CONVERTED", clientProject: null },
    orderBy: { convertedAt: "desc" },
    take: 2,
    select: { id: true, ambassadorId: true },
  });

  if (!referrals.length) {
    return NextResponse.json({ linked: false, reason: "NO_ELIGIBLE_REFERRAL" });
  }
  if (referrals.length > 1) {
    return NextResponse.json({ error: "MULTIPLE_ELIGIBLE_REFERRALS" }, { status: 409 });
  }

  const referral = referrals[0];
  const linked = await db.$transaction(async (tx) => {
    const rewardSnapshot = referral.ambassadorId
      ? await rewardRateForNewProject(tx, referral.ambassadorId)
      : null;

    const updated = await tx.clientProject.update({
      where: { id: project.id },
      data: {
        referralId: referral.id,
        ambassadorRewardRate: rewardSnapshot?.rate,
        ambassadorQualifiedAt: rewardSnapshot?.qualifiedAt,
      },
    });

    await writeAdminAudit(tx, {
      actorId: access.userId,
      action: "PROJECT_REFERRAL_AUTO_LINKED",
      category: "POSITIVE",
      entityType: "CLIENT_PROJECT",
      entityId: project.id,
      entityLabel: project.title,
      after: { referralId: referral.id, ambassadorId: referral.ambassadorId || null },
    });

    if (rewardSnapshot) {
      await writeAdminAudit(tx, {
        actorId: access.userId,
        action: "AMBASSADOR_REWARD_RATE_LOCKED",
        category: "POSITIVE",
        entityType: "CLIENT_PROJECT",
        entityId: project.id,
        entityLabel: project.title,
        after: {
          ambassadorId: referral.ambassadorId,
          referralId: referral.id,
          referralPosition: rewardSnapshot.referralPosition,
          level: rewardSnapshot.levelName,
          rate: rewardSnapshot.rate.toString(),
        },
      });
    }

    return updated;
  });

  return NextResponse.json({
    linked: true,
    referralId: linked.referralId,
    ambassadorRewardRate: linked.ambassadorRewardRate,
    ambassadorQualifiedAt: linked.ambassadorQualifiedAt,
  });
}
