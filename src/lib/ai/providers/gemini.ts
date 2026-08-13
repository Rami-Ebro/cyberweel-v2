import {
  AiProviderError,
  assistantTurnSchema,
  type AiProvider,
  type AiProviderInput,
  type AssistantTurn,
} from "@/lib/ai/types";

const DEFAULT_MODEL = "gemini-3.5-flash-lite";
const FREE_TIER_MODEL_ALLOWLIST = new Set([DEFAULT_MODEL]);
const REQUEST_TIMEOUT_MS = 18_000;

const responseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    reply: { type: "string" },
    detectedLanguage: {
      type: "object",
      additionalProperties: false,
      properties: {
        name: { type: "string" },
        code: { type: "string" },
        primaryCode: { type: "string" },
        multilingual: { type: "boolean" },
      },
      required: ["name", "code", "primaryCode", "multilingual"],
    },
    intent: {
      type: "string",
      enum: ["INFORMATION", "SERVICE_INTEREST", "READY_FOR_HANDOFF", "OUT_OF_SCOPE"],
    },
    suggestedServiceArabic: { type: "string" },
    shouldOfferLeadForm: { type: "boolean" },
    arabicSummary: { type: "string" },
    handoffUi: {
      type: "object",
      additionalProperties: false,
      properties: {
        cta: { type: "string" },
        title: { type: "string" },
        intro: { type: "string" },
        nameLabel: { type: "string" },
        emailLabel: { type: "string" },
        phoneLabel: { type: "string" },
        companyLabel: { type: "string" },
        needLabel: { type: "string" },
        submitLabel: { type: "string" },
        cancelLabel: { type: "string" },
        successMessage: { type: "string" },
      },
      required: [
        "cta",
        "title",
        "intro",
        "nameLabel",
        "emailLabel",
        "phoneLabel",
        "companyLabel",
        "needLabel",
        "submitLabel",
        "cancelLabel",
        "successMessage",
      ],
    },
  },
  required: [
    "reply",
    "detectedLanguage",
    "intent",
    "suggestedServiceArabic",
    "shouldOfferLeadForm",
    "arabicSummary",
    "handoffUi",
  ],
};

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
};

function configuration() {
  if (process.env.GEMINI_FREE_TIER_ONLY !== "true") {
    console.error("Gemini configuration rejected", {
      freeTierOnlyEnabled: false,
      hasApiKey: Boolean(process.env.GEMINI_API_KEY?.trim()),
    });
    throw new AiProviderError(
      "NOT_CONFIGURED",
      "GEMINI_FREE_TIER_ONLY must be explicitly enabled",
    );
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  if (!apiKey) {
    console.error("Gemini configuration rejected", {
      freeTierOnlyEnabled: true,
      hasApiKey: false,
    });
    throw new AiProviderError("NOT_CONFIGURED", "Gemini API key is not configured");
  }
  if (!FREE_TIER_MODEL_ALLOWLIST.has(model)) {
    console.error("Gemini configuration rejected", {
      freeTierOnlyEnabled: true,
      hasApiKey: true,
      model,
    });
    throw new AiProviderError(
      "NOT_CONFIGURED",
      "Configured Gemini model is not approved for this free-tier-only build",
    );
  }
  return { apiKey, model };
}

export class GeminiProvider implements AiProvider {
  readonly name = "gemini";

  async generateTurn(input: AiProviderInput): Promise<AssistantTurn> {
    const { apiKey, model } = configuration();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          signal: controller.signal,
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: input.systemInstruction }] },
            contents: input.messages.map((message) => ({
              role: message.role === "assistant" ? "model" : "user",
              parts: [{ text: message.content }],
            })),
            generationConfig: {
              temperature: 0.25,
              maxOutputTokens: 900,
              responseMimeType: "application/json",
              responseJsonSchema: responseSchema,
            },
          }),
        },
      );

      if (!response.ok) {
        const upstreamError = (await response.json().catch(() => null)) as {
          error?: { status?: string; message?: string };
        } | null;
        console.error("Gemini request rejected", {
          httpStatus: response.status,
          upstreamStatus: upstreamError?.error?.status,
          upstreamMessage: upstreamError?.error?.message?.slice(0, 400),
        });

        if (response.status === 429) {
          throw new AiProviderError("QUOTA_EXHAUSTED", "Gemini free quota is exhausted", 429);
        }
        if (response.status === 401 || response.status === 403) {
          throw new AiProviderError("NOT_CONFIGURED", "Gemini credentials were rejected", 503);
        }
        throw new AiProviderError("UNAVAILABLE", `Gemini returned ${response.status}`, 503);
      }

      const payload = (await response.json()) as GeminiResponse;
      const raw = payload.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim();
      if (!raw) {
        throw new AiProviderError("INVALID_RESPONSE", "Gemini returned an empty response");
      }

      const parsed = assistantTurnSchema.safeParse(JSON.parse(raw));
      if (!parsed.success) {
        throw new AiProviderError("INVALID_RESPONSE", "Gemini response failed validation");
      }
      return parsed.data;
    } catch (error) {
      if (error instanceof AiProviderError) throw error;
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new AiProviderError("TIMEOUT", "Gemini request timed out", 504);
      }
      if (error instanceof SyntaxError) {
        throw new AiProviderError("INVALID_RESPONSE", "Gemini returned invalid JSON");
      }
      const cause = error instanceof Error && "cause" in error
        ? error.cause as { code?: string } | undefined
        : undefined;
      console.error("Gemini request failed before receiving a response", {
        name: error instanceof Error ? error.name : typeof error,
        message: error instanceof Error ? error.message.slice(0, 400) : "Unknown error",
        causeCode: cause?.code,
      });
      throw new AiProviderError("UNAVAILABLE", "Gemini request failed", 503);
    } finally {
      clearTimeout(timeout);
    }
  }
}
