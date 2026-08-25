import { del, get, head } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { currentAdminAccess } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { PARTNER_SESSION_COOKIE, readPartnerSession } from "@/lib/partner-auth";
import { hasTrustedOrigin, invalidOriginResponse } from "@/lib/request-security";
import { getStagePartnerAssignment } from "@/lib/stage-partner-assignments";
import {
  createStagePartnerSubmission,
  listStagePartnerSubmissions,
  serializeStagePartnerSubmission,
  StagePartnerSubmissionError,
} from "@/lib/stage-partner-submissions";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ assignmentId: string }> };
type UploadedFileInput = { url?: unknown; name?: unknown; type?: unknown };
type SubmissionBody = { note?: unknown; links?: unknown; files?: unknown };
type ManifestChunk = { url?: unknown; size?: unknown };
type ChunkManifest = {
  version?: unknown;
  assignmentId?: unknown;
  fileId?: unknown;
  fileName?: unknown;
  fileType?: unknown;
  totalSize?: unknown;
  chunks?: unknown;
};

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TOTAL_SIZE = 30 * 1024 * 1024;
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

function linksFrom(value: unknown) {
  const raw = typeof value === "string" ? value : "";
  const candidates = raw.split(/\r?\n/).map((item) => item.trim()).filter(Boolean).slice(0, 10);
  const links: string[] = [];

  for (const item of candidates) {
    const normalized = /^[a-z][a-z0-9+.-]*:\/\//i.test(item) ? item : `https://${item}`;
    try {
      const url = new URL(normalized);
      if (!["http:", "https:"].includes(url.protocol) || !url.hostname) return null;
      links.push(url.toString());
    } catch {
      return null;
    }
  }
  return links;
}

function normalizedFileInput(value: UploadedFileInput) {
  const url = typeof value.url === "string" ? value.url.trim() : "";
  const name = typeof value.name === "string" ? value.name.trim().slice(0, 180) : "";
  const type = typeof value.type === "string" ? value.type.trim().slice(0, 180) : "";
  return { url, name, type };
}

function validManifestFileId(value: unknown) {
  return typeof value === "string" && /^[A-Za-z0-9_-]{8,80}$/.test(value);
}

async function readChunkManifest(url: string, blobToken: string) {
  const manifestBlob = await get(url, { access: "private", token: blobToken });
  if (!manifestBlob || manifestBlob.statusCode !== 200) return null;
  try {
    const text = await new Response(manifestBlob.stream).text();
    return JSON.parse(text) as ChunkManifest;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { assignmentId } = await context.params;
  const assignment = await getStagePartnerAssignment(assignmentId);
  if (!assignment) return NextResponse.json({ error: "إسناد المرحلة غير موجود" }, { status: 404 });

  const [partnerId, admin] = await Promise.all([currentPartnerId(request), currentAdminAccess(request)]);
  const adminAllowed = Boolean(admin && (admin.isOwner || admin.permissions.includes("projects") || admin.permissions.includes("partners")));
  if (partnerId !== assignment.partnerId && !adminAllowed) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  const submissions = await listStagePartnerSubmissions([assignmentId]);
  return NextResponse.json({ submissions: submissions.map(serializeStagePartnerSubmission) });
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!hasTrustedOrigin(request)) return invalidOriginResponse();
  const partnerId = await currentPartnerId(request);
  if (!partnerId) return NextResponse.json({ error: "الحساب غير متاح" }, { status: 401 });

  const { assignmentId } = await context.params;
  const assignment = await getStagePartnerAssignment(assignmentId, partnerId);
  if (!assignment) return NextResponse.json({ error: "إسناد المرحلة غير موجود" }, { status: 404 });
  if (assignment.stageStatus === "NOT_STARTED") {
    return NextResponse.json({ error: "لا يمكن إرسال التسليم قبل أن تبدأ الإدارة هذه المرحلة" }, { status: 409 });
  }
  if (["COMPLETED", "CANCELLED"].includes(assignment.stageStatus) || ["COMPLETED", "CANCELLED"].includes(assignment.projectStatus)) {
    return NextResponse.json({ error: "المرحلة أو المشروع مغلق ولا يقبل تسليمات جديدة" }, { status: 409 });
  }
  if (assignment.status === "COMPLETED" || ["APPROVED", "PAID"].includes(assignment.paymentStatus)) {
    return NextResponse.json({ error: "اعتمدت الإدارة هذا التسليم بالفعل، ولا يمكن إرسال نسخة جديدة" }, { status: 409 });
  }

  const cleanupUrls: string[] = [];
  try {
    const body = await request.json().catch(() => null) as SubmissionBody | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "تعذر قراءة بيانات التسليم" }, { status: 400 });
    }

    const note = typeof body.note === "string" ? body.note.trim().slice(0, 4000) || null : null;
    const links = linksFrom(body.links);
    if (links === null) return NextResponse.json({ error: "أحد روابط التسليم غير صالح. استخدم رابطًا صالحًا في كل سطر" }, { status: 400 });

    const rawFiles = Array.isArray(body.files) ? body.files : [];
    if (!note && !links.length && !rawFiles.length) {
      return NextResponse.json({ error: "أرسل ملاحظة تسليم أو رابطًا أو ملفًا واحدًا على الأقل" }, { status: 400 });
    }
    if (rawFiles.length > MAX_FILES) return NextResponse.json({ error: "يمكن إرفاق 5 ملفات كحد أقصى في كل نسخة تسليم" }, { status: 400 });

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
    if (rawFiles.length && !blobToken) {
      return NextResponse.json({ error: "خدمة رفع ملفات التسليم غير مهيأة حاليًا" }, { status: 503 });
    }

    const fileUrls: string[] = [];
    const fileNames: string[] = [];
    const fileTypes: string[] = [];
    let totalSize = 0;
    const requiredPrefix = `partner-stage-submissions/${assignmentId}/`;

    for (const rawFile of rawFiles) {
      if (!rawFile || typeof rawFile !== "object") return NextResponse.json({ error: "بيانات أحد الملفات غير صالحة" }, { status: 400 });
      const file = normalizedFileInput(rawFile as UploadedFileInput);
      if (!file.url || !file.name) return NextResponse.json({ error: "بيانات أحد الملفات غير مكتملة" }, { status: 400 });

      const extension = file.name.split(".").pop()?.toLowerCase() || "";
      if (!ALLOWED_EXTENSIONS.has(extension) || (file.type && !ALLOWED_TYPES.has(file.type))) {
        return NextResponse.json({ error: `صيغة الملف «${file.name}» غير مدعومة` }, { status: 400 });
      }

      let blob;
      try {
        blob = await head(file.url, { token: blobToken });
      } catch {
        return NextResponse.json({ error: `تعذر التحقق من الملف «${file.name}»` }, { status: 400 });
      }
      if (!blob.pathname.startsWith(requiredPrefix)) {
        return NextResponse.json({ error: `الملف «${file.name}» لا ينتمي إلى هذا التسليم` }, { status: 400 });
      }

      const isChunkManifest = blob.pathname.startsWith(`${requiredPrefix}manifests/`) && blob.pathname.endsWith(".cwmanifest.json");
      if (isChunkManifest) {
        const manifest = await readChunkManifest(blob.url, blobToken!);
        const fileId = manifest?.fileId;
        const manifestFileName = typeof manifest?.fileName === "string" ? manifest.fileName : "";
        const manifestFileType = typeof manifest?.fileType === "string" ? manifest.fileType : "";
        const manifestTotalSize = Number(manifest?.totalSize);
        const manifestChunks = Array.isArray(manifest?.chunks) ? manifest.chunks as ManifestChunk[] : [];

        if (
          manifest?.version !== 1 ||
          manifest?.assignmentId !== assignmentId ||
          !validManifestFileId(fileId) ||
          manifestFileName !== file.name ||
          !ALLOWED_TYPES.has(manifestFileType) ||
          !Number.isInteger(manifestTotalSize) ||
          manifestTotalSize <= 0 ||
          manifestTotalSize > MAX_FILE_SIZE
        ) {
          return NextResponse.json({ error: `بيانات الملف «${file.name}» غير صالحة` }, { status: 400 });
        }

        const expectedChunks = Math.ceil(manifestTotalSize / MAX_CHUNK_SIZE);
        if (!manifestChunks.length || manifestChunks.length !== expectedChunks || expectedChunks > MAX_CHUNKS) {
          return NextResponse.json({ error: `أجزاء الملف «${file.name}» غير مكتملة` }, { status: 400 });
        }

        let manifestVerifiedSize = 0;
        const manifestChunkUrls: string[] = [];
        for (let index = 0; index < manifestChunks.length; index += 1) {
          const chunkUrl = typeof manifestChunks[index]?.url === "string" ? manifestChunks[index].url!.trim() : "";
          const declaredSize = Number(manifestChunks[index]?.size);
          const expectedSize = Math.min(MAX_CHUNK_SIZE, manifestTotalSize - index * MAX_CHUNK_SIZE);
          if (!chunkUrl || declaredSize !== expectedSize) {
            return NextResponse.json({ error: `أحد أجزاء الملف «${file.name}» غير صالح` }, { status: 400 });
          }

          let chunkBlob;
          try {
            chunkBlob = await head(chunkUrl, { token: blobToken! });
          } catch {
            return NextResponse.json({ error: `تعذر التحقق من أجزاء الملف «${file.name}»` }, { status: 400 });
          }
          const expectedPath = `${requiredPrefix}chunks/${fileId}/${index}.part`;
          if (chunkBlob.pathname !== expectedPath || chunkBlob.size !== expectedSize) {
            return NextResponse.json({ error: `أحد أجزاء الملف «${file.name}» لا ينتمي إلى هذا التسليم` }, { status: 400 });
          }

          manifestVerifiedSize += chunkBlob.size;
          manifestChunkUrls.push(chunkBlob.url);
        }

        if (manifestVerifiedSize !== manifestTotalSize) {
          return NextResponse.json({ error: `حجم الملف «${file.name}» غير متطابق` }, { status: 400 });
        }

        totalSize += manifestTotalSize;
        if (totalSize > MAX_TOTAL_SIZE) {
          return NextResponse.json({ error: "إجمالي ملفات التسليم يجب ألا يتجاوز 30 MB" }, { status: 400 });
        }

        fileUrls.push(blob.url);
        fileNames.push(file.name);
        fileTypes.push(manifestFileType);
        cleanupUrls.push(blob.url, ...manifestChunkUrls);
        continue;
      }

      if (blob.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: `الملف «${file.name}» يتجاوز الحد الأقصى 10 MB` }, { status: 400 });
      }
      if (blob.contentType && !ALLOWED_TYPES.has(blob.contentType)) {
        return NextResponse.json({ error: `صيغة الملف «${file.name}» غير مدعومة` }, { status: 400 });
      }

      totalSize += blob.size;
      if (totalSize > MAX_TOTAL_SIZE) {
        return NextResponse.json({ error: "إجمالي ملفات التسليم يجب ألا يتجاوز 30 MB" }, { status: 400 });
      }

      fileUrls.push(blob.url);
      fileNames.push(file.name);
      fileTypes.push(blob.contentType || file.type || "application/octet-stream");
      cleanupUrls.push(blob.url);
    }

    const submission = await createStagePartnerSubmission({
      assignmentId,
      note,
      links,
      fileUrls,
      fileNames,
      fileTypes,
    });

    cleanupUrls.length = 0;
    await db.adminNotification.create({
      data: {
        title: "تسليم شريك بانتظار المراجعة",
        body: `${assignment.partnerName || assignment.partnerEmail} — ${assignment.projectTitle} — ${assignment.stageName} — النسخة ${submission.version}`,
        href: "/admin/partners?section=projects",
        kind: "PARTNER_STAGE_REVIEW",
      },
    }).catch(() => undefined);

    return NextResponse.json({ submission: serializeStagePartnerSubmission(submission) }, { status: 201 });
  } catch (error) {
    if (cleanupUrls.length) await del(cleanupUrls).catch(() => undefined);
    if (error instanceof StagePartnerSubmissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[partner-stage-submission] failed", error);
    return NextResponse.json({ error: "تعذر إرسال التسليم. لم يتم اعتماد أي شيء" }, { status: 500 });
  }
}
