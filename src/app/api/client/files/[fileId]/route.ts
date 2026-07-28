import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { canAdmin } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { PARTNER_SESSION_COOKIE, readPartnerSession } from "@/lib/partner-auth";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ fileId: string }> };

function downloadName(value: string) {
  return value.replace(/[\r\n"]/g, "").trim().slice(0, 180) || "project-file";
}

export async function GET(request: NextRequest, context: RouteContext) {
  const session = readPartnerSession(request.cookies.get(PARTNER_SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { fileId } = await context.params;
  const [user, file] = await Promise.all([
    db.user.findUnique({
      where: { id: session.userId },
      select: { id: true, role: true, isActive: true },
    }),
    db.clientFile.findUnique({
      where: { id: fileId },
      select: {
        id: true,
        name: true,
        url: true,
        storageProvider: true,
        project: { select: { clientId: true } },
      },
    }),
  ]);

  if (!user?.isActive || !file) return NextResponse.json({ error: "الملف غير متاح" }, { status: 404 });

  const isClientOwner = user.role === "CLIENT" && file.project.clientId === user.id;
  const isAllowedAdmin = user.role === "ADMIN" && (await canAdmin(request, "files"));
  if (!isClientOwner && !isAllowedAdmin) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  if (file.storageProvider !== "VERCEL_BLOB") {
    return NextResponse.redirect(file.url);
  }

  const result = await get(file.url, { access: "private" });
  if (!result || result.statusCode !== 200) {
    return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 });
  }

  return new Response(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType || "application/octet-stream",
      "Content-Length": String(result.blob.size),
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(downloadName(file.name))}`,
      "Cache-Control": "private, max-age=60",
      ETag: result.blob.etag,
    },
  });
}
