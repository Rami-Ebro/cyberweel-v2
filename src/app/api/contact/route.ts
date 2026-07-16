import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type ContactPayload = {
  subject?: string;
  fields?: Array<{ name?: string; label?: string; value?: string }>;
  website?: string;
};

function clean(value: unknown, max = 4000) {
  return String(value ?? "").trim().slice(0, max);
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as ContactPayload;

    // Honeypot: bots commonly fill hidden fields.
    if (clean(payload.website, 200)) {
      return NextResponse.json({ ok: true });
    }

    const subject = clean(payload.subject, 180) || "New CyberWeel enquiry";
    const fields = Array.isArray(payload.fields)
      ? payload.fields
          .slice(0, 20)
          .map((field) => ({
            name: clean(field.name, 80),
            label: clean(field.label, 120),
            value: clean(field.value, 5000),
          }))
          .filter((field) => field.label && field.value)
      : [];

    if (fields.length === 0) {
      return NextResponse.json(
        { ok: false, error: "EMPTY_MESSAGE" },
        { status: 400 },
      );
    }

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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
