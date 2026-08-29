import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const provider = read("src/lib/ai/providers/gemini.ts");
const route = read("src/app/api/ai/chat/route.ts");
const assistant = read("src/components/site/ai-assistant.tsx");
const siteI18n = read("src/components/site/i18n.tsx");
const dashboardProvider = read("src/components/dashboard-i18n-provider.tsx");
const dashboardI18n = read("src/lib/dashboard-i18n.ts");
const ambassador = read("src/app/ambassador/dashboard/page.tsx");
const whatsapp = read("src/components/site/whatsapp-button.tsx");
const scroll = read("src/components/site/scroll-utilities.tsx");

assert.match(provider, /export async function checkGeminiHealth/);
assert.match(provider, /method: "GET"/);
assert.match(provider, /HEALTH_TIMEOUT_MS = 4_000/);
assert.doesNotMatch(provider.match(/export async function checkGeminiHealth[\s\S]*?export class GeminiProvider/)?.[0] || "", /generateContent/);
assert.match(route, /export async function GET\(request: NextRequest\)/);
assert.match(route, /healthCache/);
assert.match(route, /Cache-Control": "private, max-age=30"/);

assert.match(assistant, /type ServiceStatus = "idle" \| "checking" \| "ready" \| "limited" \| "unavailable"/);
assert.match(assistant, /fetch\("\/api\/ai\/chat", \{ method: "GET"/);
assert.match(assistant, /serviceStatusUi/);
assert.match(assistant, /aria-live="polite"/);
assert.doesNotMatch(assistant, /rounded-full bg-emerald-400" aria-hidden \/>/);
assert.doesNotMatch(assistant, /z-\[70\]/);
assert.doesNotMatch(assistant, /z-\[69\]/);
assert.match(assistant, /right-4 z-40 grid/);
assert.match(whatsapp, /left-4 z-40 flex h-12/);
assert.match(scroll, /left-4 z-40 flex h-12/);

assert.match(siteI18n, /LANGUAGE_EVENT = "cyberweel:language-change"/);
assert.match(siteI18n, /window\.dispatchEvent\(new CustomEvent\(LANGUAGE_EVENT/);
assert.match(dashboardProvider, /LANGUAGE_EVENT = "cyberweel:language-change"/);
assert.match(dashboardProvider, /pathname !== "\/partner"/);
assert.match(dashboardProvider, /z-20 h-11 shadow-lg/);
assert.doesNotMatch(dashboardProvider, /z-\[100\]/);

assert.match(dashboardI18n, /const ambassadorUiEnglish: Record<string, string>/);
assert.match(dashboardI18n, /"هذا البريد مسجل بالفعل ضمن إحالاتك/);
assert.match(dashboardI18n, /ambassadorUiEnglish\[normalized\]/);
assert.match(ambassador, /const \{ lang, tr \} = useDashboardI18n\(\)/);
assert.match(ambassador, /function localizeMessage/);
assert.match(ambassador, /typeof payload\?\.message === "string"/);
assert.match(ambassador, /throw new Error\(localizeMessage\(message\)\)/);

console.log("Group 4 AI health, ambassador localization, language sync, and layering checks passed.");
