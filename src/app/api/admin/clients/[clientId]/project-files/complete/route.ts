import { NextRequest, NextResponse } from "next/server";
import { canAdmin } from "@/lib/admin-permissions";
import { db } from "@/lib/db";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ clientId: string }> };

const MAX_FILE_SIZE = 25 * 1024 * 1024;

function cleanFilename(value: string) {
  return value.replace(/[\r\n"]/g, "").trim().slice(0, 180) || "project-file";
}

function isVercelBlobUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!(await canAdmin(request, "clients"))) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { clientId } = await context.params;
  const body = await request.json().catch(() => null);
  const projectId = typeof body?.projectId === "string" ? body.projectId : "";
  const originalName = typeof body?.originalName === "string" ? cleanFilename(body.originalName) : "";
  const url = typeof body?.url === "string" ? body.url : "";
  const size = Number(body?.size);

  if (!projectId || !originalName || !isVercelBlobUrl(url) || !Number.isFinite(size) || size <= 0 || size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "بيانات الملف غير صالحة" }, { status: 400 });
  }

  const project = await db.clientProject.findFirst({
    where: { id: projectId, clientId },
    select: { id: true },
  });
  if (!project) return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });

  const existing = await db.clientFile.findFirst({
    where: { projectId, url },
    select: { id: true, name: true },
  });
  if (existing) return NextResponse.json({ file: existing });

  const file = await db.clientFile.create({
    data: {
      projectId,
      name: originalName,
      url,
      kind: "PROJECT_ATTACHMENT",
      size: Math.round(size),
      storageProvider: "VERCEL_BLOB",
    },
  });

  return NextResponse.json({ file }, { status: 201 });
}
