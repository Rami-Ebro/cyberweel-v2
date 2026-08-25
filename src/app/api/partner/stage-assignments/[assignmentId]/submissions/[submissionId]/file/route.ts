import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { currentAdminAccess } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { PARTNER_SESSION_COOKIE, readPartnerSession } from "@/lib/partner-auth";
import { getStagePartnerAssignment } from "@/lib/stage-partner-assignments";

export const runtime = "nodejs";

// This route intentionally streams private delivery files through CyberWeel after
// authorization. Chunked uploads are stored as a small private manifest plus private
// chunk blobs; we resolve and validate every chunk before sending the response so a
// missing/corrupt chunk produces a controlled error instead of crashing mid-stream.
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

type ResolvedChunk = {
  stream: ReadableStream<Uint8Array>;
  size: number;
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

function concatenateStreams(chunks: ResolvedChunk[], expectedSize: number) {
  let chunkIndex = 0;
  let currentReader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  let streamedSize = 0;

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        while (chunkIndex < chunks.length) {
          if (!currentReader) currentReader = chunks[chunkIndex].stream.getReader();
          const { done, value } = await currentReader.read();
          if (done) {
            currentReader.releaseLock();
            currentReader = null;
            chunkIndex += 1;
            continue;
          }
          if (value?.byteLength) {
            streamedSize += value.byteLength;
            controller.enqueue(value);
            return;
          }
        }

        if (streamedSize !== expectedSize) {
          throw new Error(`streamed size mismatch: expected ${expectedSize}, got ${streamedSize}`);
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
    async cancel() {
      if (currentReader) {
        await currentReader.cancel().catch(() => undefined);
        currentReader.releaseLock();
      }
    },
  });
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { assignmentId, submissionId } = await context.params;

  try {
    const assignment = await getStagePartnerAssignment(assignmentId);
    if (!assignment) return NextResponse.json({ error: "ملف التسليم غير موجود" }, { status: 404 });

    const [admin, partnerId] = await Promise.all([currentAdminAccess(request), currentPartnerId(request)]);
    const adminAllowed = Boolean(admin && (admin.isOwner || admin.permissions.includes("projects") || admin.permissions.includes("partners")));
    if (!adminAllowed && partnerId !== assignment.partnerId) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

    const submission = await db.projectStagePartnerSubmission.findFirst({
      where: { id: submissionId, assignmentId },
    });
    if (!submission) return NextResponse.json({ error: "نسخة التسليم غير موجودة" }, { status: 404 });

    const indexParam = request.nextUrl.searchParams.get("index");
    const index = indexParam === null ? 0 : Number(indexParam);
    if (!Number.isInteger(index) || index < 0 || index >= submission.fileUrls.length) {
      return NextResponse.json({ error: "الملف المطلوب غير موجود" }, { status: 404 });
    }

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
    if (!blobToken) return NextResponse.json({ error: "خدمة الملفات غير مهيأة" }, { status: 503 });

    const fileUrl = submission.fileUrls[index];
    const blob = await get(fileUrl, { access: "private", token: blobToken, useCache: false });
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

      const resolvedChunks: ResolvedChunk[] = [];
      let verifiedSize = 0;

      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
        const chunk = chunks[chunkIndex];
        const chunkUrl = typeof chunk?.url === "string" ? chunk.url.trim() : "";
        const declaredSize = Number(chunk?.size);
        if (!chunkUrl || !Number.isInteger(declaredSize) || declaredSize <= 0) {
          console.error("[partner-stage-file] invalid chunk manifest entry", { assignmentId, submissionId, chunkIndex });
          return NextResponse.json({ error: "أحد أجزاء الملف المخزن غير صالح" }, { status: 500 });
        }

        const chunkBlob = await get(chunkUrl, { access: "private", token: blobToken, useCache: false });
        if (!chunkBlob || chunkBlob.statusCode !== 200 || chunkBlob.blob.size !== declaredSize) {
          console.error("[partner-stage-file] chunk unavailable", { assignmentId, submissionId, chunkIndex, declaredSize, actualSize: chunkBlob?.blob.size ?? null });
          return NextResponse.json({ error: "تعذر قراءة أحد أجزاء الملف المخزن" }, { status: 500 });
        }

        verifiedSize += chunkBlob.blob.size;
        resolvedChunks.push({ stream: chunkBlob.stream, size: chunkBlob.blob.size });
      }

      if (verifiedSize !== totalSize) {
        console.error("[partner-stage-file] manifest size mismatch", { assignmentId, submissionId, totalSize, verifiedSize });
        return NextResponse.json({ error: "حجم الملف المخزن غير متطابق" }, { status: 500 });
      }

      return new Response(concatenateStreams(resolvedChunks, totalSize), {
        headers: {
          "Content-Type": contentType,
          "Content-Length": String(totalSize),
          "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(safeName(submission.fileNames[index]))}`,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    return new Response(blob.stream, {
      headers: {
        "Content-Type": blob.blob.contentType || submission.fileTypes[index] || "application/octet-stream",
        "Content-Length": String(blob.blob.size),
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(safeName(submission.fileNames[index]))}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        ETag: blob.blob.etag,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown file delivery error";
    console.error("[partner-stage-file] failed", { assignmentId, submissionId, message });
    return NextResponse.json({ error: "تعذر فتح ملف التسليم حاليًا" }, { status: 500 });
  }
}
