import { buildSystemInstruction } from "@/lib/ai/system-instruction";
import { redactPersonalData } from "@/lib/ai/privacy";
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
  return provider.generateTurn({
    messages: compactContext(messages),
    systemInstruction: buildSystemInstruction(),
  });
}
