import { Buffer } from "node:buffer";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateAssistantTurn } from "@/lib/ai/gateway";
import { redactPersonalData } from "@/lib/ai/privacy";
import { checkGeminiHealth } from "@/lib/ai/providers/gemini";
import { AiProviderError, chatMessageSchema } from "@/lib/ai/types";
import {
  consumeRateLimit,
  hasTrustedOrigin,
  invalidOriginResponse,
  rateLimitResponse,
  type RateLimitResult,
} from "@/lib/request-security";

export const runtime = "nodejs";

const MEMORY_COOKIE = "cw_ai_memory";
const MAX_MEMORY_CHARACTERS = 1_200;

const requestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(12),
  inputMode: z.enum(["text", "voice"]).optional().default("text"),
}).superRefine((value, context) => {
  const total = value.messages.reduce((sum, message) => sum + message.content.length, 0);
  if (total > 14_000) {
    context.addIssue({ code: "custom", message: "Conversation is too large" });
  }
  if (value.messages.at(-1)?.role !== "user") {
    context.addIssue({ code: "custom", message: "Last message must be from the user" });
  }
});

type HealthPayload = Awaited<ReturnType<typeof checkGeminiHealth>>;
let healthCache: { expiresAt: number; payload: HealthPayload } | null = null;
let healthPromise: Promise<HealthPayload> | null = null;

function isMissingPreviewRateLimitTable(error: unknown) {
  if (process.env.VERCEL_ENV !== "preview" || typeof error !== "object" || error === null) {
    return false;
  }

  const candidate = error as {
    code?: string;
    meta?: { modelName?: string; table?: string };
  };

  return candidate.code === "P2021"
    && candidate.meta?.modelName === "RateLimitBucket";
}

async function consumeAiChatRateLimit(request: NextRequest): Promise<RateLimitResult> {
  const options = {
    action: "ai-chat",
    limit: 20,
    windowMs: 60 * 60 * 1000,
  } as const;

  try {
    return await consumeRateLimit(request, options);
  } catch (error) {
    if (!isMissingPreviewRateLimitTable(error)) throw error;

    console.warn("[ai-chat] preview RateLimitBucket missing; bypassing DB limiter for preview verification only");
    return {
      allowed: true,
      limit: options.limit,
      remaining: options.limit,
      retryAfterSeconds: Math.ceil(options.windowMs / 1000),
    };
  }
}

function readConversationMemory(request: NextRequest, messageCount: number) {
  if (messageCount <= 1) return "";

  const encoded = request.cookies.get(MEMORY_COOKIE)?.value;
  if (!encoded) return "";

  try {
    return redactPersonalData(Buffer.from(encoded, "base64url").toString("utf8"))
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
      .trim()
      .slice(0, MAX_MEMORY_CHARACTERS);
  } catch {
    return "";
  }
}

function writeConversationMemory(response: NextResponse, summary: string) {
  const safeSummary = redactPersonalData(summary)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, MAX_MEMORY_CHARACTERS);

  if (!safeSummary) {
    response.cookies.delete(MEMORY_COOKIE);
    return;
  }

  response.cookies.set(MEMORY_COOKIE, Buffer.from(safeSummary, "utf8").toString("base64url"), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

async function readHealth() {
  const now = Date.now();
  if (healthCache && healthCache.expiresAt > now) return healthCache.payload;
  if (!healthPromise) {
    healthPromise = checkGeminiHealth().finally(() => {
      healthPromise = null;
    });
  }
  const payload = await healthPromise;
  healthCache = {
    payload,
    expiresAt: now + (payload.status === "ready" ? 60_000 : 20_000),
  };
  return payload;
}

export async function GET(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return invalidOriginResponse();
  const health = await readHealth();
  if (process.env.VERCEL_ENV === "preview") {
    console.info("[ai-chat] preview Gemini health", health);
  }
  return NextResponse.json(
    { ok: health.status === "ready", provider: "gemini", ...health },
    { headers: { "Cache-Control": "private, max-age=30" } },
  );
}

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return invalidOriginResponse();

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > 32_000) {
    return NextResponse.json({ error: "REQUEST_TOO_LARGE" }, { status: 413 });
  }

  const rateLimit = await consumeAiChatRateLimit(request);
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit, "AI_RATE_LIMITED");
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_CHAT_REQUEST" }, { status: 400 });
  }

  if (parsed.data.inputMode === "voice") {
    console.info("[ai-chat] input_mode=voice");
  }

  try {
    const conversationMemory = readConversationMemory(request, parsed.data.messages.length);
    const turn = await generateAssistantTurn(parsed.data.messages, conversationMemory);
    const response = NextResponse.json({ ok: true, turn, provider: "gemini" });
    writeConversationMemory(response, turn.arabicSummary);
    return response;
  } catch (error) {
    if (error instanceof AiProviderError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: "UNAVAILABLE" }, { status: 503 });
  }
}
