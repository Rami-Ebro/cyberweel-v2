import { NextRequest, NextResponse } from "next/server";
import { currentAmbassador } from "@/lib/ambassador-auth";
import {
  ambassadorAssistantModes,
  answerAmbassadorQuestion,
  type AmbassadorAssistantMode,
} from "@/lib/ambassador-assistant";
import { GeminiServiceError } from "@/lib/ai/gemini";
import {
  consumeRateLimit,
  hasTrustedOrigin,
  invalidOriginResponse,
  rateLimitResponse,
} from "@/lib/request-security";

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return invalidOriginResponse();

  const user = await currentAmbassador(request);
  if (!user) return NextResponse.json({ error: "FORBIDDEN" }, { status: 401 });
  const ambassador = user.ambassador;
  if (!ambassador || !ambassador.profileCompletedAt) {
    return NextResponse.json({ error: "PROFILE_REQUIRED" }, { status: 428 });
  }

  const limit = await consumeRateLimit(request, {
    action: "ambassador-ai-assistant",
    subject: user.id,
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) return rateLimitResponse(limit);

  const body = await request.json().catch(() => null);
  const mode = typeof body?.mode === "string" ? body.mode : "";
  const situation = typeof body?.situation === "string" ? body.situation.trim() : "";

  if (
    !ambassadorAssistantModes.includes(mode as AmbassadorAssistantMode) ||
    situation.length < 10 ||
    situation.length > 2500
  ) {
    return NextResponse.json({ error: "أدخل وصفًا واضحًا واختر نوع المساعدة" }, { status: 400 });
  }

  try {
    const answer = await answerAmbassadorQuestion({
      mode: mode as AmbassadorAssistantMode,
      situation,
    });
    return NextResponse.json({ answer });
  } catch (error) {
    if (error instanceof GeminiServiceError) {
      return NextResponse.json({ error: error.code }, { status: error.code === "AI_NOT_CONFIGURED" ? 503 : 502 });
    }
    if (error instanceof Error && error.message === "AI_GUARDRAIL_FAILED") {
      return NextResponse.json({ error: "AI_GUARDRAIL_FAILED" }, { status: 422 });
    }
    console.error("[ambassador-assistant] Unexpected failure", { cause: error instanceof Error ? error.name : "unknown" });
    return NextResponse.json({ error: "AI_PROVIDER_ERROR" }, { status: 502 });
  }
}
