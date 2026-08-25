import { head, put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PARTNER_SESSION_COOKIE, readPartnerSession } from "@/lib/partner-auth";
import { hasTrustedOrigin, invalidOriginResponse } from "@/lib/request-security";
import { getStagePartnerAssignment } from "@/lib/stage-partner-assignments";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ assignmentId: string }> };
type ChunkInfo = { url?: unknown; size?: unknown };
type ManifestBody = {
  fileId?: unknown;
  fileName?: unknown;
  fileType?: unknown;
  totalSize?: unknown;
  chunks?: unknown;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_CHUNK_SIZE = 3 * 1024 * 1024;
const MAX_CHUNKS = Math.ceil(MAX_FILE_SIZE / MAX_CHUNK_SIZE);
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/octet-stream",
  "text/plain",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);
const ALLOWED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "pdf", "zip", "txt", "csv", "docx", "xlsx", "pptx"]);

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

function normalizedFileName(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 180) : "";
}

function normalizedFileType(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 180) : "application/octet-stream";
}

function validFile(fileName: string, fileType: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";
  return Boolean(fileName) && ALLOWED_EXTENSIONS.has(extension) && ALLOWED_TYPES.has(fileType);
}

function validFileId(value: unknown) {
  return typeof value === "string" && /^[A-Za-z0-9_-]{8,80}$/.test(value);
}

async function ensureAssignmentCanReceiveFiles(request: NextRequest, assignmentId: string) {
  const partnerId = await currentPartnerId(request);
  if (!partnerId) throw new Error("الحساب غير متاح");

  const assignment = await getStagePartnerAssignment(assignmentId, partnerId);
  if (!assignment) throw new Error("إسناد المرحلة غير موجود");
  if (assignment.stageStatus === "NOT_STARTED") throw new Error("لا يمكن رفع ملفات التسليم قبل أن تبدأ الإدارة هذه المرحلة");
  if (["COMPLETED", "CANCELLED"].includes(assignment.stageStatus) || ["COMPLETED", "CANCELLED"].includes(assignment.projectStatus)) {
    throw new Error("المرحلة أو المشروع مغلق ولا يقبل تسليمات جديدة");
  }
  if (assignment.status === "COMPLETED" || ["APPROVED", "PAID"].includes(assignment.paymentStatus)) {
    throw new Error("اعتمدت الإدارة هذا التسليم بالفعل، ولا يمكن رفع نسخة جديدة");
  }

  const latest = await db.projectStagePartnerSubmission.findFirst({
    where: { assignmentId },
    orderBy: { version: "desc" },
    select: { status: true },
  });
  if (latest?.status === "SUBMITTED") {
    throw new Error("لديك نسخة بانتظار مراجعة الإدارة. انتظر قرار المراجعة قبل رفع نسخة جديدة");
  }
}

export async function GET() {
  return NextResponse.json({
    hasBlobToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim()),
    mode: "same-origin-chunk-proxy",
    maxChunkSize: MAX_CHUNK_SIZE,
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!hasTrustedOrigin(request)) return invalidOriginResponse();

  const { assignmentId } = await context.params;
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!blobToken) {
    console.error("[partner-stage-upload] BLOB_READ_WRITE_TOKEN is unavailable in this deployment");
    return NextResponse.json({ error: "خدمة رفع الملفات غير مهيأة في بيئة الاختبار الحالية" }, { status: 503 });
  }

  try {
    await ensureAssignmentCanReceiveFiles(request, assignmentId);
    const action = request.nextUrl.searchParams.get("action");

    if (action === "chunk") {
      const fileId = request.nextUrl.searchParams.get("fileId");
      const fileName = normalizedFileName(request.nextUrl.searchParams.get("fileName"));
      const fileType = normalizedFileType(request.nextUrl.searchParams.get("fileType"));
      const totalSize = Number(request.nextUrl.searchParams.get("totalSize"));
      const chunkIndex = Number(request.nextUrl.searchParams.get("chunkIndex"));

      if (!validFileId(fileId) || !validFile(fileName, fileType)) {
        return NextResponse.json({ error: "بيانات الملف غير صالحة" }, { status: 400 });
      }
      if (!Number.isInteger(totalSize) || totalSize <= 0 || totalSize > MAX_FILE_SIZE) {
        return NextResponse.json({ error: "حجم الملف غير صالح" }, { status: 400 });
      }

      const expectedChunks = Math.ceil(totalSize / MAX_CHUNK_SIZE);
      if (!Number.isInteger(chunkIndex) || chunkIndex < 0 || chunkIndex >= expectedChunks || expectedChunks > MAX_CHUNKS) {
        return NextResponse.json({ error: "رقم جزء الملف غير صالح" }, { status: 400 });
      }

      const expectedSize = Math.min(MAX_CHUNK_SIZE, totalSize - chunkIndex * MAX_CHUNK_SIZE);
      const contentLength = Number(request.headers.get("content-length") || 0);
      if (contentLength && contentLength !== expectedSize) {
        return NextResponse.json({ error: "حجم جزء الملف لا يطابق المتوقع" }, { status: 400 });
      }

      const buffer = await request.arrayBuffer();
      if (buffer.byteLength !== expectedSize || buffer.byteLength > MAX_CHUNK_SIZE) {
        return NextResponse.json({ error: "حجم جزء الملف غير صالح" }, { status: 400 });
      }

      const pathname = `partner-stage-submissions/${assignmentId}/chunks/${fileId}/${chunkIndex}.part`;
      const blob = await put(pathname, buffer, {
        access: "private",
        token: blobToken,
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/octet-stream",
      });

      return NextResponse.json({ url: blob.url, size: buffer.byteLength, chunkIndex }, { status: 201 });
    }

    if (action === "manifest") {
      const body = await request.json().catch(() => null) as ManifestBody | null;
      const fileId = body?.fileId;
      const fileName = normalizedFileName(body?.fileName);
      const fileType = normalizedFileType(body?.fileType);
      const totalSize = Number(body?.totalSize);
      const chunks = Array.isArray(body?.chunks) ? body.chunks as ChunkInfo[] : [];

      if (!validFileId(fileId) || !validFile(fileName, fileType)) {
        return NextResponse.json({ error: "بيانات الملف غير صالحة" }, { status: 400 });
      }
      if (!Number.isInteger(totalSize) || totalSize <= 0 || totalSize > MAX_FILE_SIZE) {
        return NextResponse.json({ error: "حجم الملف غير صالح" }, { status: 400 });
      }

      const expectedChunks = Math.ceil(totalSize / MAX_CHUNK_SIZE);
      if (chunks.length !== expectedChunks || expectedChunks > MAX_CHUNKS) {
        return NextResponse.json({ error: "أجزاء الملف غير مكتملة" }, { status: 400 });
      }

      const verifiedChunks: Array<{ url: string; size: number }> = [];
      let verifiedTotal = 0;
      for (let index = 0; index < chunks.length; index += 1) {
        const url = typeof chunks[index]?.url === "string" ? chunks[index].url!.trim() : "";
        const declaredSize = Number(chunks[index]?.size);
        const expectedSize = Math.min(MAX_CHUNK_SIZE, totalSize - index * MAX_CHUNK_SIZE);
        if (!url || declaredSize !== expectedSize) {
          return NextResponse.json({ error: "أحد أجزاء الملف غير صالح" }, { status: 400 });
        }

        const blob = await head(url, { token: blobToken });
        const requiredPath = `partner-stage-submissions/${assignmentId}/chunks/${fileId}/${index}.part`;
        if (blob.pathname !== requiredPath || blob.size !== expectedSize) {
          return NextResponse.json({ error: "أحد أجزاء الملف لا ينتمي إلى هذا التسليم" }, { status: 400 });
        }

        verifiedChunks.push({ url: blob.url, size: blob.size });
        verifiedTotal += blob.size;
      }

      if (verifiedTotal !== totalSize) {
        return NextResponse.json({ error: "حجم الملف النهائي غير متطابق" }, { status: 400 });
      }

      const manifestPath = `partner-stage-submissions/${assignmentId}/manifests/${fileId}.cwmanifest.json`;
      const manifest = {
        version: 1,
        assignmentId,
        fileId,
        fileName,
        fileType,
        totalSize,
        chunks: verifiedChunks,
      };
      const manifestBlob = await put(manifestPath, JSON.stringify(manifest), {
        access: "private",
        token: blobToken,
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      });

      return NextResponse.json({
        url: manifestBlob.url,
        name: fileName,
        type: fileType,
        size: totalSize,
      }, { status: 201 });
    }

    return NextResponse.json({ error: "نوع طلب رفع الملف غير معروف" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر رفع الملف";
    console.error("[partner-stage-upload] failed", { assignmentId, message });
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
