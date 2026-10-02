import { generateGeminiText } from "@/lib/ai/gemini";
import { hasUnapprovedCommercialCommitment } from "@/lib/ambassador-assistant-guardrails";
import {
  ambassadorSystemInstruction as systemInstruction,
  buildAmbassadorAssistantPrompt,
  finalizeAmbassadorAnswer,
  type AmbassadorAssistantInput,
} from "@/lib/ambassador-assistant-content";

export { ambassadorAssistantModes, type AmbassadorAssistantMode } from "@/lib/ambassador-assistant-content";

export async function answerAmbassadorQuestion(input: AmbassadorAssistantInput) {
  const prompt = buildAmbassadorAssistantPrompt(input);
  const firstAnswer = finalizeAmbassadorAnswer(await generateGeminiText({ systemInstruction, prompt }), input);
  if (!hasUnapprovedCommercialCommitment(firstAnswer)) return firstAnswer;

  const revisedAnswer = finalizeAmbassadorAnswer(await generateGeminiText({
    systemInstruction,
    prompt: `${prompt}\n\nRewrite the draft below in the same language and conversational tone. Remove every numeric price, price range, timeline, deadline, guarantee, and performance promise. If any estimate is needed, refer it to CyberWeel administration. Keep the verified referral URL unchanged.\n\nDraft:\n${firstAnswer}`,
  }), input);

  if (hasUnapprovedCommercialCommitment(revisedAnswer)) {
    throw new Error("AI_GUARDRAIL_FAILED");
  }

  return revisedAnswer;
}
