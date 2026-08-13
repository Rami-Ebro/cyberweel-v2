import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { cleanPlainText, containsArabic, normalizeArabicSummary } from "@/lib/ai/privacy";
import {
  consumeRateLimit,
  hasTrustedOrigin,
  invalidOriginResponse,
  rateLimitResponse,
} from "@/lib/request-security";

export const runtime = "nodejs";

const leadSchema = z.object({
  name: z.string().max(120),
  email: z.string().max(254).optional().default(""),
  phone: z.string().max(40).optional().default(""),
  company: z.string().max(160).optional().default(""),
  need: z.string().max(3000),
  suggestedServiceArabic: z.string().max(180).optional().default(""),
  languageName: z.string().max(80),
  languageCode: z.string().max(24),
  arabicSummary: z.string().max(2400),
  website: z.string().max(200).optional().default(""),
});

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return invalidOriginResponse();

  const rateLimit = await consumeRateLimit(request, {
    action: "ai-lead",
    limit: 3,
    windowMs: 24 * 60 * 60 * 1000,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit, "AI_LEAD_RATE_LIMITED");

  const parsed = leadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_LEAD" }, { status: 400 });
  }

  const name = cleanPlainText(parsed.data.name, 120);
  const email = cleanPlainText(parsed.data.email, 254).toLowerCase();
  const phone = cleanPlainText(parsed.data.phone, 40);
  const company = cleanPlainText(parsed.data.company, 160);
  const need = cleanPlainText(parsed.data.need, 3000);
  const service = cleanPlainText(parsed.data.suggestedServiceArabic, 180);
  const languageName = cleanPlainText(parsed.data.languageName, 80);
  const languageCode = cleanPlainText(parsed.data.languageCode, 24).toLowerCase();
  const suppliedSummary = cleanPlainText(parsed.data.arabicSummary, 2400);

  if (parsed.data.website) return NextResponse.json({ ok: true });
  if (
    !name ||
    !need ||
    (!email && !phone) ||
    (email && !validEmail(email)) ||
    !/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/.test(languageCode)
  ) {
    return NextResponse.json({ error: "INVALID_LEAD" }, { status: 400 });
  }

  const arabicSummary = normalizeArabicSummary(containsArabic(suppliedSummary)
    ? suppliedSummary
    : `العميل مهتم بالتواصل مع فريق سايبرويل${service ? ` بخصوص ${service}` : " بخصوص خدمة رقمية"}. يحتاج الطلب إلى مراجعة بشرية لأن الملخص الآلي العربي لم يكن متاحًا.`);
  const contactMethod = email && phone
    ? "البريد الإلكتروني والهاتف"
    : email
      ? "البريد الإلكتروني"
      : "الهاتف";
  const notes = [
    "مصدر الطلب: CyberWeel AI Assistant",
    `لغة العميل: ${languageName} (${languageCode})`,
    `الخدمة المقترحة: ${service || "تحتاج إلى تحديد من الفريق"}`,
    "",
    "ملخص الإدارة بالعربية:",
    arabicSummary,
    "",
    "وصف العميل بلغته الأصلية:",
    need,
  ].join("\n").slice(0, 5000);

  try {
    const referral = await db.$transaction(async (transaction) => {
      const created = await transaction.partnerReferral.create({
        data: {
          name,
          email: email || null,
          phone: phone || null,
          company: company || null,
          notes,
          source: "AI_CHAT",
          sourcePath: "/ai-chat",
          contactMethod,
          adminDecision: "PENDING_REVIEW",
        },
        select: { id: true },
      });
      await transaction.adminNotification.create({
        data: {
          title: "طلب جديد من المساعد الذكي",
          body: `${name} · ${service || "احتياج يحتاج إلى مراجعة"} · ${languageName}`,
          href: "/admin/referrals?source=AI_CHAT",
          kind: "AI_CHAT_LEAD",
        },
      });
      return created;
    });

    return NextResponse.json({ ok: true, referralId: referral.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "LEAD_SAVE_FAILED" }, { status: 500 });
  }
}
