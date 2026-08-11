import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { currentClientAccess } from "@/lib/client-access";
import {
  cleanSubmissionFilename,
  MAX_SUBMISSION_FILES,
  MAX_SUBMISSION_FILE_SIZE,
  SUBMISSION_ALLOWED_CONTENT_TYPES,
  SUBMISSION_ALLOWED_EXTENSIONS,
} from "@/lib/client-submissions";
import { db } from "@/lib/db";

export const runtime = "nodejs";

type UploadPayload = {
  clientId: string;
  projectId: string;
  submissionId: string;
  originalName: string;
  size: number;
};

function parsePayload(value: string | null): UploadPayload | null {
  try {
    const parsed = JSON.parse(value || "");
    if ([parsed?.clientId, parsed?.projectId, parsed?.submissionId, parsed?.originalName].some((item) => typeof item !== "string") || typeof parsed?.size !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as HandleUploadBody | null;
  if (!body) return NextResponse.json({ error: "طلب رفع غير صالح" }, { status: 400 });
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!blobToken) {
    return NextResponse.json({ error: "خدمة رفع الملفات غير مهيأة حاليًا" }, { status: 503 });
  }

  try {
    const response = await handleUpload({
      token: blobToken,
      request,
      body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const client = await currentClientAccess(request);
        if (!client) throw new Error("غير مصرح");
        const payload = parsePayload(clientPayload);
        const extension = payload?.originalName.split(".").pop()?.toLowerCase() || "";
        if (!payload || payload.clientId !== client.id || payload.size <= 0 || payload.size > MAX_SUBMISSION_FILE_SIZE || !SUBMISSION_ALLOWED_EXTENSIONS.has(extension)) {
          throw new Error("بيانات الملف غير صالحة");
        }

        const submission = await db.clientSubmission.findFirst({
          where: { id: payload.submissionId, projectId: payload.projectId, status: "UPLOADING", project: { clientId: client.id } },
          select: { id: true, projectId: true, _count: { select: { files: true } } },
        });
        if (!submission || submission._count.files >= MAX_SUBMISSION_FILES || !pathname.startsWith(`clients/${client.id}/submissions/${submission.id}/`)) {
          throw new Error("الإرسال غير متاح أو بلغ حد الملفات");
        }

        return {
          allowedContentTypes: SUBMISSION_ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_SUBMISSION_FILE_SIZE,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ ...payload, originalName: cleanSubmissionFilename(payload.originalName) }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = parsePayload(tokenPayload || null);
        if (!payload) throw new Error("بيانات الملف غير مكتملة");
        const submission = await db.clientSubmission.findFirst({
          where: { id: payload.submissionId, projectId: payload.projectId, status: "UPLOADING", project: { clientId: payload.clientId } },
          select: { id: true, projectId: true },
        });
        if (!submission) throw new Error("الإرسال غير موجود");
        const existing = await db.clientFile.findFirst({ where: { submissionId: submission.id, url: blob.url }, select: { id: true } });
        if (!existing) {
          await db.clientFile.create({
            data: {
              projectId: submission.projectId,
              submissionId: submission.id,
              name: cleanSubmissionFilename(payload.originalName),
              url: blob.url,
              kind: "CLIENT_SUBMISSION",
              size: Math.round(payload.size),
              storageProvider: "VERCEL_BLOB",
              source: "CLIENT",
            },
          });
        }
      },
    });
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر رفع الملف";
    return NextResponse.json({ error: message }, { status: message === "غير مصرح" ? 403 : 400 });
  }
}
