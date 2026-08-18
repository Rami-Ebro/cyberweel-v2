import { NextRequest, NextResponse } from "next/server";
import type { ClientProjectStatus } from "@prisma/client";
import { currentAdminAccess } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { writeAdminAudit } from "@/lib/admin-audit";
import { hasTrustedOrigin, invalidOriginResponse } from "@/lib/request-security";

const projectStatuses = new Set<ClientProjectStatus>([
  "PLANNING",
  "IN_PROGRESS",
  "REVIEW",
  "COMPLETED",
  "ON_HOLD",
  "CANCELLED",
]);

async function requireProjectsAdmin(request: NextRequest) {
  const access = await currentAdminAccess(request);
  if (!access || !(access.isOwner || access.permissions.includes("projects"))) return null;
  return access;
}

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return invalidOriginResponse();
  const access = await requireProjectsAdmin(request);
  if (!access) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const projectId = typeof body?.projectId === "string" ? body.projectId.trim() : "";
  const status = projectStatuses.has(body?.status as ClientProjectStatus)
    ? body.status as ClientProjectStatus
    : null;
  const progress = Number(body?.progress);

  if (!projectId || !status || !Number.isInteger(progress) || progress < 0 || progress > 100) {
    return NextResponse.json({ error: "بيانات تقدم المشروع غير صالحة" }, { status: 400 });
  }

  const existing = await db.clientProject.findUnique({
    where: { id: projectId },
    select: { id: true, title: true, status: true, progress: true },
  });
  if (!existing) return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });

  const updated = await db.$transaction(async (tx) => {
    const project = await tx.clientProject.update({
      where: { id: projectId },
      data: { status, progress },
      select: { id: true, status: true, progress: true },
    });

    await writeAdminAudit(tx, {
      actorId: access.userId,
      action: "PROJECT_EXECUTION_PROGRESS_UPDATED",
      category: status === "COMPLETED" ? "POSITIVE" : status === "CANCELLED" ? "SENSITIVE" : "NORMAL",
      entityType: "CLIENT_PROJECT",
      entityId: projectId,
      entityLabel: existing.title,
      before: { status: existing.status, progress: existing.progress },
      after: { status, progress },
    });

    return project;
  });

  return NextResponse.json({ project: updated });
}
