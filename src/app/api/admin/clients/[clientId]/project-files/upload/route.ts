import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { canAdmin } from "@/lib/admin-permissions";
import { db } from "@/lib/db";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ clientId: string }> };
type UploadPayload = {
  clientId: string;
  projectId: string;
  originalName: string;
  size: number;
};

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
];

function parsePayload(value: string | null): UploadPayload | null {
  try {
    const parsed = JSON.parse(value || "");
    if (
      typeof parsed?.clientId !== "string" ||
      typeof parsed?.projectId !== "string" ||
      typeof parsed?.originalName !== "string" ||
      typeof parsed?.size !== "number"
    ) return null;
    return parsed;
  } catch {
    return null;
  }
}

function cleanFilename(value: string) {
  return value.replace(/[\r\n"]/g, "").trim().slice(0, 180) || "project-file";
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { clientId } = await context.params;
  const body = await request.json().catch(() => null) as HandleUploadBody | null;
  if (!body) return NextResponse.json({ error: "طلب رفع غير صالح" }, { status: 400 });

  try {
    const response = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!(await canAdmin(request, "clients"))) throw new Error("غير مصرح");
        const payload = parsePayload(clientPayload);
        if (!payload || payload.clientId !== clientId || payload.size <= 0 || payload.size > MAX_FILE_SIZE) {
          throw new Error("بيانات الملف غير صالحة");
        }

        const project = await db.clientProject.findFirst({
          where: { id: payload.projectId, clientId },
          select: { id: true },
        });
        if (!project || !pathname.startsWith(`clients/${clientId}/projects/${project.id}/`)) {
          throw new Error("المشروع غير متاح");
        }

        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_FILE_SIZE,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            ...payload,
            originalName: cleanFilename(payload.originalName),
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = parsePayload(tokenPayload || null);
        if (!payload) throw new Error("بيانات الملف غير مكتملة");

        const project = await db.clientProject.findFirst({
          where: { id: payload.projectId, clientId: payload.clientId },
          select: { id: true },
        });
        if (!project) throw new Error("المشروع غير موجود");

        const existing = await db.clientFile.findFirst({
          where: { projectId: project.id, url: blob.url },
          select: { id: true },
        });
        if (!existing) {
          await db.clientFile.create({
            data: {
              projectId: project.id,
              name: cleanFilename(payload.originalName),
              url: blob.url,
              kind: "PROJECT_ATTACHMENT",
              size: Math.round(payload.size),
              storageProvider: "VERCEL_BLOB",
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
