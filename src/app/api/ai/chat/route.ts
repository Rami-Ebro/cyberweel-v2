import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateAssistantTurn } from "@/lib/ai/gateway";
import { AiProviderError, chatMessageSchema } from "@/lib/ai/types";
import {
  consumeRateLimit,
  hasTrustedOrigin,
  invalidOriginResponse,
  rateLimitResponse,
} from "@/lib/request-security";

export const runtime = "nodejs";

const requestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(12),
}).superRefine((value, context) => {
  const total = value.messages.reduce((sum, message) => sum + message.content.length, 0);
  if (total > 14_000) {
    context.addIssue({ code: "custom", message: "Conversation is too large" });
  }
  if (value.messages.at(-1)?.role !== "user") {
    context.addIssue({ code: "custom", message: "Last message must be from the user" });
  }
});

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return invalidOriginResponse();

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > 32_000) {
    return NextResponse.json({ error: "REQUEST_TOO_LARGE" }, { status: 413 });
  }

  const rateLimit = await consumeRateLimit(request, {
    action: "ai-chat",
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit, "AI_RATE_LIMITED");
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_CHAT_REQUEST" }, { status: 400 });
  }

  try {
    const turn = await generateAssistantTurn(parsed.data.messages);
    return NextResponse.json({ ok: true, turn, provider: "gemini" });
  } catch (error) {
    if (error instanceof AiProviderError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: "UNAVAILABLE" }, { status: 503 });
  }
}
