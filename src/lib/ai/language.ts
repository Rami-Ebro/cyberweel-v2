import type { AssistantTurn, ChatMessage } from "@/lib/ai/types";

type DetectedLanguage = AssistantTurn["detectedLanguage"];
type ActualLanguage = Omit<DetectedLanguage, "multilingual">;

const ARABIC: ActualLanguage = { name: "Arabic", code: "ar", primaryCode: "ar" };
const ENGLISH: ActualLanguage = { name: "English", code: "en", primaryCode: "en" };
const FRENCH: ActualLanguage = { name: "French", code: "fr", primaryCode: "fr" };

const ENGLISH_MARKERS = new Set([
  "a", "about", "am", "an", "and", "build", "business", "company", "contact",
  "english", "for", "hello", "help", "hire", "i", "is", "my", "need", "please",
  "ready", "request", "review", "service", "team", "the", "to", "want", "website",
]);

const FRENCH_MARKERS = new Set([
  "avec", "besoin", "bonjour", "créer", "cyberweel", "de", "des", "entreprise",
  "équipe", "français", "je", "la", "le", "les", "ma", "mon", "pour", "projet",
  "service", "site", "souhaite", "un", "une", "veuillez", "veux", "votre", "web",
]);

function tokens(value: string) {
  return value.toLocaleLowerCase().match(/\p{L}+/gu) || [];
}

function markerScore(words: string[], markers: Set<string>) {
  return words.reduce((score, word) => score + (markers.has(word) ? 1 : 0), 0);
}

export function detectLatestMessageLanguage(value: string): ActualLanguage | null {
  const arabicCharacters = value.match(/[\u0600-\u06FF]/g)?.length || 0;
  const latinCharacters = value.match(/[A-Za-zÀ-ÖØ-öø-ÿŒœÆæ]/g)?.length || 0;

  if (arabicCharacters >= 2 && arabicCharacters >= latinCharacters) return ARABIC;
  if (!latinCharacters) return null;

  const words = tokens(value);
  const englishScore = markerScore(words, ENGLISH_MARKERS);
  const frenchScore = markerScore(words, FRENCH_MARKERS);
  const hasFrenchCharacters = /[àâçéèêëîïôùûüÿœæ]/i.test(value);

  if (frenchScore > englishScore || (hasFrenchCharacters && frenchScore >= englishScore)) {
    return FRENCH;
  }
  if (englishScore > frenchScore) return ENGLISH;

  return null;
}

export function resolveDetectedLanguage(
  messages: ChatMessage[],
  fallback: DetectedLanguage,
): DetectedLanguage {
  const actualLanguages = messages
    .filter((message) => message.role === "user")
    .map((message) => detectLatestMessageLanguage(message.content))
    .filter((language): language is ActualLanguage => language !== null);
  const latest = actualLanguages.at(-1);

  if (!latest) return fallback;

  return {
    ...latest,
    multilingual: new Set(actualLanguages.map((language) => language.primaryCode)).size > 1,
  };
}
