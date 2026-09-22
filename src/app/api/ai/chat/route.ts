import { Buffer } from "node:buffer";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateAssistantTurn } from "@/lib/ai/gateway";
import { redactPersonalData } from "@/lib/ai/privacy";
import { checkGeminiHealth } from "@/lib/ai/providers/gemini";
import { AiProviderError, chatMessageSchema, type AssistantTurn, type ChatMessage } from "@/lib/ai/types";
import {
  consumeRateLimit,
  hasTrustedOrigin,
  invalidOriginResponse,
  rateLimitResponse,
  signServerValue,
  verifyServerValue,
  type RateLimitResult,
} from "@/lib/request-security";

export const runtime = "nodejs";

const MEMORY_COOKIE = "cw_ai_memory";
const CONSULTATION_COOKIE = "cw_ai_consultation";
const MAX_MEMORY_CHARACTERS = 700;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const BASE_LIMIT = 20;
const EXTENDED_LIMIT = 40;

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

const consultationStateSchema = z.object({
  userTurns: z.number().int().min(0).max(200),
  continuityStreak: z.number().int().min(0).max(200),
  extendedEligible: z.boolean(),
  handoffDeclined: z.boolean(),
});

type ConsultationState = z.infer<typeof consultationStateSchema>;
type HealthPayload = Awaited<ReturnType<typeof checkGeminiHealth>>;
let healthCache: { expiresAt: number; payload: HealthPayload } | null = null;
let healthPromise: Promise<HealthPayload> | null = null;

function emptyConsultationState(): ConsultationState {
  return {
    userTurns: 0,
    continuityStreak: 0,
    extendedEligible: false,
    handoffDeclined: false,
  };
}

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

async function consumeAiRateLimit(
  request: NextRequest,
  options: { action: string; limit: number },
): Promise<RateLimitResult> {
  const config = {
    action: options.action,
    limit: options.limit,
    windowMs: RATE_WINDOW_MS,
  } as const;

  try {
    return await consumeRateLimit(request, config);
  } catch (error) {
    if (!isMissingPreviewRateLimitTable(error)) throw error;

    console.warn("[ai-chat] preview RateLimitBucket missing; bypassing DB limiter for preview verification only", {
      action: options.action,
    });
    return {
      allowed: true,
      limit: options.limit,
      remaining: options.limit,
      retryAfterSeconds: Math.ceil(RATE_WINDOW_MS / 1000),
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

function readConsultationState(request: NextRequest, messageCount: number): ConsultationState {
  if (messageCount <= 1) return emptyConsultationState();
  const raw = verifyServerValue(request.cookies.get(CONSULTATION_COOKIE)?.value);
  if (!raw) return emptyConsultationState();

  try {
    const parsed = consultationStateSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : emptyConsultationState();
  } catch {
    return emptyConsultationState();
  }
}

function writeConsultationState(response: NextResponse, state: ConsultationState) {
  response.cookies.set(CONSULTATION_COOKIE, signServerValue(JSON.stringify(state)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

function normalizeIntentText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function handoffPreference(messages: ChatMessage[]): "declined" | "consented" | null {
  const latest = messages.at(-1);
  if (!latest || latest.role !== "user") return null;
  const text = normalizeIntentText(latest.content);

  const declinePatterns = [
    /(?:لا|ليس|لست|ما بدي|ما بديش)\s*(?:أريد|اريد|أرغب|ارغب|احتاج)?[^.،]{0,35}(?:التواصل|الفريق|اتصال|يتواصل|يتصل|مراجعة بشرية)/i,
    /(?:لا أريد|لا اريد|لا أرغب|لا ارغب)[^.،]{0,40}(?:فريق|سايبرويل|cyberweel)/i,
    /\b(?:do not|don't|dont|no)\b[^.]{0,45}\b(?:contact|team|human|handoff|call)\b/i,
    /\b(?:ne pas|pas de)\b[^.]{0,45}\b(?:contact|équipe|humain)\b/i,
    /\b(?:nicht|kein)\b[^.]{0,45}\b(?:kontakt|team|mensch)\b/i,
    /\b(?:istemiyorum|hayır)\b[^.]{0,45}\b(?:iletişim|ekip|insan)\b/i,
    /\b(?:no quiero|sin)\b[^.]{0,45}\b(?:contacto|equipo|humano)\b/i,
  ];
  if (declinePatterns.some((pattern) => pattern.test(text))) return "declined";

  const directConsentPatterns = [
    /(?:أريد|اريد|أوافق|اوافق|موافق|نعم)[^.،]{0,45}(?:الفريق|سايبرويل|cyberweel|التواصل|يتواصل|يتصل|مراجعة بشرية)/i,
    /(?:تواصل|اتصل|خلي|دع)[^.،]{0,35}(?:الفريق|سايبرويل|cyberweel)/i,
    /\b(?:contact|connect|speak|talk|hand off|handoff|review)\b[^.]{0,45}\b(?:team|human|cyberweel)\b/i,
    /\b(?:équipe|contact humain|contacter cyberweel)\b/i,
    /\b(?:team kontaktieren|mit dem team|menschlichen)\b/i,
    /\b(?:ekiple iletişim|ekiple görüş|insan desteği)\b/i,
    /\b(?:contactar al equipo|hablar con el equipo|revisión humana)\b/i,
  ];
  if (directConsentPatterns.some((pattern) => pattern.test(text))) return "consented";

  const shortYes = /^(?:نعم|أجل|اجل|موافق|تمام|yes|yeah|yep|ok|okay|oui|ja|evet|sí|si)[.!، ]*$/i.test(text);
  if (!shortYes) return null;

  const previousAssistant = [...messages.slice(0, -1)].reverse().find((message) => message.role === "assistant");
  if (!previousAssistant) return null;
  const previous = normalizeIntentText(previousAssistant.content);
  const teamMention = /(?:الفريق|سايبرويل|cyberweel|تواصل|contact|team|human|équipe|kontakt|ekip|equipo)/i.test(previous);
  return teamMention ? "consented" : null;
}

function updateConsultationState(
  previous: ConsultationState,
  turn: AssistantTurn,
  preference: "declined" | "consented" | null,
): ConsultationState {
  const userTurns = Math.min(previous.userTurns + 1, 200);
  const advancingSameTopic = turn.consultationSignals.sameTopic && turn.consultationSignals.substantiveProgress;
  const continuityStreak = advancingSameTopic
    ? Math.min(previous.continuityStreak + 1, 200)
    : 0;
  const handoffDeclined = preference === "declined"
    ? true
    : preference === "consented"
      ? false
      : previous.handoffDeclined;

  return {
    userTurns,
    continuityStreak,
    extendedEligible: userTurns >= 6 && continuityStreak >= 4,
    handoffDeclined,
  };
}

function applyHandoffGuard(turn: AssistantTurn, consented: boolean): AssistantTurn {
  if (consented) return turn;
  return {
    ...turn,
    shouldOfferLeadForm: false,
    intent: turn.intent === "READY_FOR_HANDOFF" ? "SERVICE_INTEREST" : turn.intent,
  };
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

export async function DELETE(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return invalidOriginResponse();
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(MEMORY_COOKIE);
  response.cookies.delete(CONSULTATION_COOKIE);
  return response;
}

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return invalidOriginResponse();

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > 32_000) {
    return NextResponse.json({ error: "REQUEST_TOO_LARGE" }, { status: 413 });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_CHAT_REQUEST" }, { status: 400 });
  }

  const previousState = readConsultationState(request, parsed.data.messages.length);
  const preference = handoffPreference(parsed.data.messages);
  const consented = preference === "consented";
  const handoffDeclined = preference === "declined"
    ? true
    : consented
      ? false
      : previousState.handoffDeclined;

  const baseLimit = await consumeAiRateLimit(request, {
    action: "ai-chat-v2-base",
    limit: BASE_LIMIT,
  });

  if (!baseLimit.allowed) {
    if (consented) {
      const handoffLimit = await consumeAiRateLimit(request, {
        action: "ai-chat-v2-handoff",
        limit: 2,
      });
      if (!handoffLimit.allowed) {
        return rateLimitResponse(handoffLimit, "AI_RATE_LIMITED");
      }
    } else if (previousState.extendedEligible) {
      const extendedLimit = await consumeAiRateLimit(request, {
        action: "ai-chat-v2-extended",
        limit: EXTENDED_LIMIT,
      });
      if (!extendedLimit.allowed) {
        return rateLimitResponse(
          extendedLimit,
          handoffDeclined ? "AI_RATE_LIMITED_NO_HANDOFF" : "AI_RATE_LIMITED",
        );
      }
    } else {
      console.info("[ai-chat] consultation base limit reached without extension eligibility", {
        userTurns: previousState.userTurns,
        continuityStreak: previousState.continuityStreak,
        handoffDeclined,
      });
      return rateLimitResponse(
        baseLimit,
        handoffDeclined ? "AI_RATE_LIMITED_NO_HANDOFF" : "AI_RATE_LIMITED",
      );
    }
  }

  if (parsed.data.inputMode === "voice") {
    console.info("[ai-chat] input_mode=voice");
  }

  try {
    const conversationMemory = readConversationMemory(request, parsed.data.messages.length);
    const rawTurn = await generateAssistantTurn(
      parsed.data.messages,
      conversationMemory,
      { handoffDeclined },
    );
    const turn = applyHandoffGuard(rawTurn, consented);
    const nextState = updateConsultationState(previousState, turn, preference);
    const response = NextResponse.json({ ok: true, turn, provider: "gemini" });
    writeConversationMemory(response, turn.arabicSummary);
    writeConsultationState(response, nextState);
    return response;
  } catch (error) {
    if (error instanceof AiProviderError) {
      console.error("[ai-chat] provider failure", {
        code: error.code,
        status: error.status,
        name: error.name,
      });
      return NextResponse.json({ error: error.code }, { status: error.status });
    }

    console.error("[ai-chat] unhandled failure", {
      name: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message.slice(0, 300) : "Unknown error",
    });
    return NextResponse.json({ error: "UNAVAILABLE" }, { status: 503 });
  }
}
