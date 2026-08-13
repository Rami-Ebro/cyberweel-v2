import { buildSystemInstruction } from "@/lib/ai/system-instruction";
import { detectLatestMessageLanguage, resolveDetectedLanguage } from "@/lib/ai/language";
import { normalizeArabicSummary, redactPersonalData } from "@/lib/ai/privacy";
import { GeminiProvider } from "@/lib/ai/providers/gemini";
import type { AssistantTurn, ChatMessage } from "@/lib/ai/types";

const MAX_CONTEXT_MESSAGES = 10;
const MAX_CONTEXT_CHARACTERS = 12_000;

function compactContext(messages: ChatMessage[]) {
  const recent = messages.slice(-MAX_CONTEXT_MESSAGES);
  const result: ChatMessage[] = [];
  let used = 0;

  for (let index = recent.length - 1; index >= 0; index -= 1) {
    const message = recent[index];
    const content = redactPersonalData(message.content).slice(0, 2000);
    if (used + content.length > MAX_CONTEXT_CHARACTERS && result.length > 0) break;
    result.unshift({ ...message, content });
    used += content.length;
  }

  while (result[0]?.role === "assistant") result.shift();

  return result.reduce<ChatMessage[]>((normalized, message) => {
    const previous = normalized.at(-1);
    if (previous?.role === message.role) {
      previous.content = `${previous.content}\n\n${message.content}`.slice(-2000);
    } else {
      normalized.push({ ...message });
    }
    return normalized;
  }, []);
}

export async function generateAssistantTurn(messages: ChatMessage[]): Promise<AssistantTurn> {
  const provider = new GeminiProvider();
  const context = compactContext(messages);
  const latestUserMessage = [...messages].reverse().find((message) => message.role === "user");
  const latestLanguage = latestUserMessage
    ? detectLatestMessageLanguage(latestUserMessage.content)
    : null;
  const runtimeLanguageInstruction = latestLanguage
    ? `\n\nRUNTIME LANGUAGE OVERRIDE\nThe actual latest customer message was detected as ${latestLanguage.name} (${latestLanguage.code}). Reply in ${latestLanguage.name}, translate every handoffUi value into ${latestLanguage.name}, and return detectedLanguage as ${latestLanguage.name} (${latestLanguage.code}).`
    : "";
  const turn = await provider.generateTurn({
    messages: context,
    systemInstruction: `${buildSystemInstruction()}${runtimeLanguageInstruction}`,
  });

  return {
    ...turn,
    detectedLanguage: resolveDetectedLanguage(messages, turn.detectedLanguage),
    arabicSummary: normalizeArabicSummary(turn.arabicSummary),
  };
}
