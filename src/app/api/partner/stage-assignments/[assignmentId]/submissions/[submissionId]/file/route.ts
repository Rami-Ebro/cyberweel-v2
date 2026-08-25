import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { currentAdminAccess } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { PARTNER_SESSION_COOKIE, readPartnerSession } from "@/lib/partner-auth";
import { getStagePartnerAssignment } from "@/lib/stage-partner-assignments";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ assignmentId: string; submissionId: string }> };
type ManifestChunk = { url?: unknown; size?: unknown };
type ChunkManifest = {
  version?: unknown;
  assignmentId?: unknown;
  fileName?: unknown;
  fileType?: unknown;
  totalSize?: unknown;
  chunks?: unknown;
};

function safeName(value: string | null | undefined) {
  return (value || "partner-delivery").replace(/[\r\n\"]/g, "").trim().slice(0, 180) || "partner-delivery";
}

async function currentPartnerId(request: NextRequest) {
  const session = readPartnerSession(request.cookies.get(PARTNER_SESSION_COOKIE)?.value);
  if (!session) return null;
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { isActive: true, partner: { select: { id: true, status: true } } },
  });
  if (!user?.isActive || !user.partner || user.partner.status !== "ACTIVE") return null;
  return user.partner.id;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { assignmentId, submissionId } = await context.params;
  const assignment = await getStagePartnerAssignment(assignmentId);
  if (!assignment) return NextResponse.json({ error: "ملف التسليم غير موجود" }, { status: 404 });

  const [admin, partnerId] = await Promise.all([currentAdminAccess(request), currentPartnerId(request)]);
  const adminAllowed = Boolean(admin && (admin.isOwner || admin.permissions.includes("projects") || admin.permissions.includes("partners")));
  if (!adminAllowed && partnerId !== assignment.partnerId) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  const submission = await db.projectStagePartnerSubmission.findFirst({
    where: { id: submissionId, assignmentId },
  });
  if (!submission) return NextResponse.json({ error: "نسخة التسليم غير موجودة" }, { status: 404 });

  const index = Number(request.nextUrl.searchParams.get("index"));
  if (!Number.isInteger(index) || index < 0 || index >= submission.fileUrls.length) {
    return NextResponse.json({ error: "الملف المطلوب غير موجود" }, { status: 404 });
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!blobToken) return NextResponse.json({ error: "خدمة الملفات غير مهيأة" }, { status: 503 });

  const fileUrl = submission.fileUrls[index];
  const blob = await get(fileUrl, { access: "private", token: blobToken });
  if (!blob || blob.statusCode !== 200) return NextResponse.json({ error: "الملف غير موجود في التخزين" }, { status: 404 });

  const isChunkManifest = blob.blob.pathname.includes("/manifests/") && blob.blob.pathname.endsWith(".cwmanifest.json");
  if (isChunkManifest) {
    let manifest: ChunkManifest;
    try {
      manifest = JSON.parse(await new Response(blob.stream).text()) as ChunkManifest;
    } catch {
      return NextResponse.json({ error: "بيانات الملف المخزن غير صالحة" }, { status: 500 });
    }

    const chunks = Array.isArray(manifest.chunks) ? manifest.chunks as ManifestChunk[] : [];
    const totalSize = Number(manifest.totalSize);
    const contentType = typeof manifest.fileType === "string" && manifest.fileType.trim()
      ? manifest.fileType
      : submission.fileTypes[index] || "application/octet-stream";

    if (
      manifest.version !== 1 ||
      manifest.assignmentId !== assignmentId ||
      manifest.fileName !== submission.fileNames[index] ||
      !Number.isInteger(totalSize) ||
      totalSize <= 0 ||
      !chunks.length
    ) {
      return NextResponse.json({ error: "بيانات الملف المخزن غير مكتملة" }, { status: 500 });
    }

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          let streamedSize = 0;
          for (const chunk of chunks) {
            const chunkUrl = typeof chunk?.url === "string" ? chunk.url : "";
            const declaredSize = Number(chunk?.size);
            if (!chunkUrl || !Number.isInteger(declaredSize) || declaredSize <= 0) throw new Error("invalid chunk");

            const chunkBlob = await get(chunkUrl, { access: "private", token: blobToken });
            if (!chunkBlob || chunkBlob.statusCode !== 200 || chunkBlob.blob.size !== declaredSize) throw new Error("missing chunk");

            const reader = chunkBlob.stream.getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (value) {
                streamedSize += value.byteLength;
                controller.enqueue(value);
              }
            }
          }
          if (streamedSize !== totalSize) throw new Error("size mismatch");
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(totalSize),
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(safeName(submission.fileNames[index]))}`,
        "Cache-Control": "private, max-age=60",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  return new Response(blob.stream, {
    headers: {
      "Content-Type": blob.blob.contentType || submission.fileTypes[index] || "application/octet-stream",
      "Content-Length": String(blob.blob.size),
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(safeName(submission.fileNames[index]))}`,
      "Cache-Control": "private, max-age=60",
      "X-Content-Type-Options": "nosniff",
      ETag: blob.blob.etag,
    },
  });
}
