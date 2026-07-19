import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_FILES = 3;
const MAX_TOTAL_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

type ContactField = {
  name?: string;
  label?: string;
  value?: string;
};

function clean(value: unknown, max = 4000) {
  return String(value ?? "").trim().slice(0, max);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Honeypot: bots commonly fill hidden fields.
    if (clean(formData.get("website"), 200)) {
      return NextResponse.json({ ok: true });
    }

    const subject = clean(formData.get("subject"), 180) || "New CyberWeel enquiry";
    const rawFields = clean(formData.get("fields"), 30000);

    let parsedFields: ContactField[] = [];
    try {
      const parsed = JSON.parse(rawFields);
      if (Array.isArray(parsed)) parsedFields = parsed;
    } catch {
      return NextResponse.json(
        { ok: false, error: "INVALID_FIELDS" },
        { status: 400 },
      );
    }

    const fields = parsedFields
      .slice(0, 20)
      .map((field) => ({
        name: clean(field.name, 80),
        label: clean(field.label, 120),
        value: clean(field.value, 5000),
      }))
      .filter((field) => field.label && field.value);

    if (fields.length === 0) {
      return NextResponse.json(
        { ok: false, error: "EMPTY_MESSAGE" },
        { status: 400 },
      );
    }

    const files = formData
      .getAll("attachments")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0)
      .slice(0, MAX_FILES);

    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
    if (totalBytes > MAX_TOTAL_BYTES) {
      return NextResponse.json(
        { ok: false, error: "FILES_TOO_LARGE" },
        { status: 413 },
      );
    }

    const unsupportedFile = files.find((file) => !ALLOWED_TYPES.has(file.type));
    if (unsupportedFile) {
      return NextResponse.json(
        { ok: false, error: "UNSUPPORTED_FILE_TYPE" },
        { status: 415 },
      );
    }

    const attachments = await Promise.all(
      files.map(async (file) => ({
        filename: sanitizeFilename(file.name),
        content: Buffer.from(await file.arrayBuffer()).toString("base64"),
        content_type: file.type,
      })),
    );

    const apiKey = process.env.RESEND_API_KEY;
    const recipient = process.env.CONTACT_TO_EMAIL || "hello@cyberweel.com";
    const from = process.env.CONTACT_FROM_EMAIL || "CyberWeel <onboarding@resend.dev>";

    if (!apiKey) {
      console.error("RESEND_API_KEY is not configured");
      return NextResponse.json(
        { ok: false, error: "EMAIL_NOT_CONFIGURED" },
        { status: 503 },
      );
    }

    const text = fields
      .map((field) => `${field.label}:\n${field.value}`)
      .join("\n\n");

    const html = fields
      .map(
        (field) =>
          `<p><strong>${escapeHtml(field.label)}</strong><br>${escapeHtml(field.value).replace(/\n/g, "<br>")}</p>`,
      )
      .join("");

    const replyTo = fields.find((field) => field.name === "email")?.value;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [recipient],
        subject,
        text,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
        ...(attachments.length ? { attachments } : {}),
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      console.error("Resend email failed", response.status, details);
      return NextResponse.json(
        { ok: false, error: "EMAIL_SEND_FAILED" },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Contact form error", error);
    return NextResponse.json(
      { ok: false, error: "INVALID_REQUEST" },
      { status: 400 },
    );
  }
}

function sanitizeFilename(value: string) {
  return value.replace(/[^\p{L}\p{N}._ -]/gu, "_").slice(0, 120) || "attachment";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
