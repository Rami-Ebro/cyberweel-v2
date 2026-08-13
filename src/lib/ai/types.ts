import { z } from "zod";

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(2000),
});

export const detectedLanguageSchema = z.object({
  name: z.string().trim().min(2).max(80),
  code: z.string().trim().toLowerCase().regex(/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/),
  primaryCode: z.string().trim().toLowerCase().regex(/^[a-z]{2,3}$/),
  multilingual: z.boolean(),
});

export const assistantTurnSchema = z.object({
  reply: z.string().trim().min(1).max(2400),
  detectedLanguage: detectedLanguageSchema,
  intent: z.enum([
    "INFORMATION",
    "SERVICE_INTEREST",
    "READY_FOR_HANDOFF",
    "OUT_OF_SCOPE",
  ]),
  suggestedServiceArabic: z.string().trim().max(180).refine(
    (value) => !value || /[\u0600-\u06FF]/.test(value),
    "Suggested service must be Arabic when present",
  ),
  shouldOfferLeadForm: z.boolean(),
  arabicSummary: z.string().trim().min(1).max(2400).refine(
    (value) => /[\u0600-\u06FF]/.test(value),
    "Admin summary must be Arabic",
  ),
  handoffUi: z.object({
    cta: z.string().trim().min(1).max(80),
    title: z.string().trim().min(1).max(120),
    intro: z.string().trim().min(1).max(240),
    nameLabel: z.string().trim().min(1).max(60),
    emailLabel: z.string().trim().min(1).max(60),
    phoneLabel: z.string().trim().min(1).max(60),
    companyLabel: z.string().trim().min(1).max(60),
    needLabel: z.string().trim().min(1).max(100),
    submitLabel: z.string().trim().min(1).max(80),
    cancelLabel: z.string().trim().min(1).max(60),
    successMessage: z.string().trim().min(1).max(240),
  }),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type AssistantTurn = z.infer<typeof assistantTurnSchema>;

export type AiProviderInput = {
  messages: ChatMessage[];
  systemInstruction: string;
};

export interface AiProvider {
  readonly name: string;
  generateTurn(input: AiProviderInput): Promise<AssistantTurn>;
}

export type AiProviderErrorCode =
  | "NOT_CONFIGURED"
  | "QUOTA_EXHAUSTED"
  | "TIMEOUT"
  | "UNAVAILABLE"
  | "INVALID_RESPONSE";

export class AiProviderError extends Error {
  public readonly code: AiProviderErrorCode;
  public readonly status: number;

  constructor(
    code: AiProviderErrorCode,
    message: string,
    status = 503,
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = "AiProviderError";
  }
}
