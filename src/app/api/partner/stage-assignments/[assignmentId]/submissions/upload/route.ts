import { issueSignedToken } from "@vercel/blob";
import {
  handleUploadPresigned,
  type HandleUploadPresignedBody,
} from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PARTNER_SESSION_COOKIE, readPartnerSession } from "@/lib/partner-auth";
import { getStagePartnerAssignment } from "@/lib/stage-partner-assignments";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ assignmentId: string }> };

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
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
];

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

export async function GET() {
  return NextResponse.json({
    hasBlobToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim()),
    mode: "presigned",
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { assignmentId } = await context.params;
  const body = await request.json().catch(() => null) as HandleUploadPresignedBody | null;
  if (!body) return NextResponse.json({ error: "تعذر قراءة طلب رفع الملف" }, { status: 400 });

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!blobToken) {
    console.error("[partner-stage-upload] BLOB_READ_WRITE_TOKEN is unavailable in this deployment");
    return NextResponse.json({ error: "خدمة رفع الملفات غير مهيأة في بيئة الاختبار الحالية" }, { status: 503 });
  }

  try {
    const jsonResponse = await handleUploadPresigned({
      body,
      request,
      getSignedToken: async (pathname, clientPayload) => {
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

        if (!pathname.startsWith(`partner-stage-submissions/${assignmentId}/`)) {
          throw new Error("مسار ملف التسليم غير صالح");
        }

        if (clientPayload) {
          try {
            const parsed = JSON.parse(clientPayload) as { fileName?: unknown };
            if (parsed.fileName !== undefined && typeof parsed.fileName !== "string") throw new Error();
          } catch {
            throw new Error("بيانات الملف غير صالحة");
          }
        }

        return {
          token: await issueSignedToken({
            pathname,
            operations: ["put"],
            allowedContentTypes: ALLOWED_TYPES,
            maximumSizeInBytes: MAX_FILE_SIZE,
            validUntil: Date.now() + 10 * 60 * 1000,
            token: blobToken,
          }),
          urlOptions: {
            allowedContentTypes: ALLOWED_TYPES,
            addRandomSuffix: true,
            allowOverwrite: false,
          },
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر تجهيز رفع الملف";
    console.error("[partner-stage-upload] failed", { assignmentId, message });
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
