import assert from "node:assert/strict";
import test from "node:test";
import {
  detectLatestMessageLanguage,
  resolveDetectedLanguage,
} from "../src/lib/ai/language.ts";
import { normalizeArabicSummary, redactPersonalData } from "../src/lib/ai/privacy.ts";
import { assistantTurnSchema } from "../src/lib/ai/types.ts";

test("detects Arabic from the customer's actual latest message", () => {
  assert.deepEqual(
    detectLatestMessageLanguage("أريد إنشاء متجر إلكتروني لعلامتي التجارية."),
    { name: "Arabic", code: "ar", primaryCode: "ar" },
  );
});

test("detects English from the customer's actual latest message", () => {
  assert.deepEqual(
    detectLatestMessageLanguage("I am ready to hire CyberWeel to build my website."),
    { name: "English", code: "en", primaryCode: "en" },
  );
});

test("detects French from the customer's actual latest message", () => {
  assert.deepEqual(
    detectLatestMessageLanguage("Je souhaite créer un site web pour mon entreprise."),
    { name: "French", code: "fr", primaryCode: "fr" },
  );
});

test("overrides a stale model language with the latest customer language", () => {
  const result = resolveDetectedLanguage([
    { role: "user", content: "Je souhaite créer un site web pour mon entreprise." },
    { role: "assistant", content: "Très bien, précisez votre besoin." },
    { role: "user", content: "I am ready to hire CyberWeel to build my website." },
  ], {
    name: "French",
    code: "fr-fr",
    primaryCode: "fr",
    multilingual: true,
  });

  assert.deepEqual(result, {
    name: "English",
    code: "en",
    primaryCode: "en",
    multilingual: true,
  });
});

test("replaces an ambiguous team reference in the Arabic summary", () => {
  assert.equal(
    normalizeArabicSummary("العميل يريد أن يراجع فريقه الطلب."),
    "العميل يريد أن يراجع فريق سايبرويل الطلب.",
  );
});

test("redacts obvious contact data without hiding ordinary years", () => {
  const result = redactPersonalData(
    "Email me at client@example.com or +963 933 123 456 during 2026.",
  );

  assert.doesNotMatch(result, /client@example\.com/);
  assert.doesNotMatch(result, /933 123 456/);
  assert.match(result, /\[EMAIL_REDACTED\]/);
  assert.match(result, /\[CONTACT_REDACTED\]/);
  assert.match(result, /2026/);
});

test("accepts a multilingual assistant turn with an Arabic admin summary", () => {
  const result = assistantTurnSchema.safeParse({
    reply: "Je peux vous aider à clarifier les besoins de votre boutique.",
    detectedLanguage: {
      name: "French",
      code: "fr",
      primaryCode: "fr",
      multilingual: false,
    },
    intent: "SERVICE_INTEREST",
    suggestedServiceArabic: "متجر إلكتروني",
    shouldOfferLeadForm: false,
    arabicSummary: "العميل مهتم بإنشاء متجر إلكتروني ويحتاج إلى توضيح المتطلبات.",
    handoffUi: {
      cta: "Transmettre ma demande",
      title: "Faire examiner mon besoin",
      intro: "Partagez vos coordonnées lorsque vous êtes prêt.",
      nameLabel: "Nom",
      emailLabel: "E-mail",
      phoneLabel: "Téléphone",
      companyLabel: "Entreprise",
      needLabel: "Besoin",
      submitLabel: "Envoyer",
      cancelLabel: "Annuler",
      successMessage: "Votre demande a été enregistrée.",
    },
  });

  assert.equal(result.success, true);
});

test("rejects an invalid detected language code", () => {
  const result = assistantTurnSchema.safeParse({
    reply: "Hello",
    detectedLanguage: {
      name: "English",
      code: "not a language code",
      primaryCode: "en",
      multilingual: false,
    },
    intent: "INFORMATION",
    suggestedServiceArabic: "",
    shouldOfferLeadForm: false,
    arabicSummary: "لا توجد نية شراء واضحة بعد.",
    handoffUi: {
      cta: "Contact the team",
      title: "Human review",
      intro: "Share contact details when ready.",
      nameLabel: "Name",
      emailLabel: "Email",
      phoneLabel: "Phone",
      companyLabel: "Company",
      needLabel: "Need",
      submitLabel: "Send",
      cancelLabel: "Cancel",
      successMessage: "Saved.",
    },
  });

  assert.equal(result.success, false);
});

test("rejects a non-Arabic internal summary", () => {
  const result = assistantTurnSchema.safeParse({
    reply: "I can help clarify the project.",
    detectedLanguage: {
      name: "English",
      code: "en",
      primaryCode: "en",
      multilingual: false,
    },
    intent: "INFORMATION",
    suggestedServiceArabic: "",
    shouldOfferLeadForm: false,
    arabicSummary: "The visitor is still explaining the need.",
    handoffUi: {
      cta: "Contact the team",
      title: "Human review",
      intro: "Share contact details when ready.",
      nameLabel: "Name",
      emailLabel: "Email",
      phoneLabel: "Phone",
      companyLabel: "Company",
      needLabel: "Need",
      submitLabel: "Send",
      cancelLabel: "Cancel",
      successMessage: "Saved.",
    },
  });

  assert.equal(result.success, false);
});
