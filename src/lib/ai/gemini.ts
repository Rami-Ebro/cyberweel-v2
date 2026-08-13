type GeminiTextResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
};

export class GeminiServiceError extends Error {
  constructor(public readonly code: "AI_NOT_CONFIGURED" | "AI_PROVIDER_ERROR") {
    super(code);
  }
}

export async function generateGeminiText(input: {
  systemInstruction: string;
  prompt: string;
  maxOutputTokens?: number;
}) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new GeminiServiceError("AI_NOT_CONFIGURED");

  const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash-lite";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: input.systemInstruction }] },
          contents: [{ role: "user", parts: [{ text: input.prompt }] }],
          generationConfig: {
            temperature: 0.25,
            maxOutputTokens: input.maxOutputTokens || 450,
          },
        }),
        cache: "no-store",
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      console.error("[gemini] Text generation failed", { status: response.status, model });
      throw new GeminiServiceError("AI_PROVIDER_ERROR");
    }

    const payload = (await response.json()) as GeminiTextResponse;
    const answer = payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

    if (!answer) throw new GeminiServiceError("AI_PROVIDER_ERROR");
    return answer;
  } catch (error) {
    if (error instanceof GeminiServiceError) throw error;
    console.error("[gemini] Text generation request failed", {
      model,
      cause: error instanceof Error ? error.name : "unknown",
    });
    throw new GeminiServiceError("AI_PROVIDER_ERROR");
  } finally {
    clearTimeout(timeout);
  }
}
