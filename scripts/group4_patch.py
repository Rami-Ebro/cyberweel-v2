from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"Expected exactly one match in {path}, got {count}: {old[:160]!r}")
    file.write_text(text.replace(old, new, 1))


# 1) Real, non-generating Gemini health probe.
replace_once(
    "src/lib/ai/providers/gemini.ts",
    'const REQUEST_TIMEOUT_MS = 18_000;\n',
    '''const REQUEST_TIMEOUT_MS = 18_000;
const HEALTH_TIMEOUT_MS = 4_000;

export type GeminiHealthResult = {
  status: "ready" | "limited" | "unavailable";
  code: "OK" | "QUOTA_EXHAUSTED" | "NOT_CONFIGURED" | "TIMEOUT" | "UNAVAILABLE";
};
''',
)

replace_once(
    "src/lib/ai/providers/gemini.ts",
    'export class GeminiProvider implements AiProvider {',
    '''export async function checkGeminiHealth(): Promise<GeminiHealthResult> {
  let configured: { apiKey: string; model: string };
  try {
    configured = configuration();
  } catch (error) {
    return {
      status: "unavailable",
      code: error instanceof AiProviderError && error.code === "NOT_CONFIGURED" ? "NOT_CONFIGURED" : "UNAVAILABLE",
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(configured.model)}`,
      {
        method: "GET",
        headers: { "x-goog-api-key": configured.apiKey },
        signal: controller.signal,
        cache: "no-store",
      },
    );

    if (response.ok) return { status: "ready", code: "OK" };
    if (response.status === 429) return { status: "limited", code: "QUOTA_EXHAUSTED" };
    if ([401, 403, 404].includes(response.status)) {
      return { status: "unavailable", code: "NOT_CONFIGURED" };
    }
    return { status: "unavailable", code: "UNAVAILABLE" };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { status: "unavailable", code: "TIMEOUT" };
    }
    return { status: "unavailable", code: "UNAVAILABLE" };
  } finally {
    clearTimeout(timeout);
  }
}

export class GeminiProvider implements AiProvider {''',
)

replace_once(
    "src/app/api/ai/chat/route.ts",
    'import { generateAssistantTurn } from "@/lib/ai/gateway";\n',
    'import { generateAssistantTurn } from "@/lib/ai/gateway";\nimport { checkGeminiHealth } from "@/lib/ai/providers/gemini";\n',
)

replace_once(
    "src/app/api/ai/chat/route.ts",
    'export async function POST(request: NextRequest) {',
    '''type HealthPayload = Awaited<ReturnType<typeof checkGeminiHealth>>;
let healthCache: { expiresAt: number; payload: HealthPayload } | null = null;
let healthPromise: Promise<HealthPayload> | null = null;

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
  return NextResponse.json(
    { ok: health.status === "ready", provider: "gemini", ...health },
    { headers: { "Cache-Control": "private, max-age=30" } },
  );
}

export async function POST(request: NextRequest) {''',
)

# 2) AI status follows the real health probe and real turn outcomes.
replace_once(
    "src/components/site/ai-assistant.tsx",
    'type ChatState = {\n',
    '''type ServiceStatus = "idle" | "checking" | "ready" | "limited" | "unavailable";

type ChatState = {
''',
)

replace_once(
    "src/components/site/ai-assistant.tsx",
    'export function CyberWeelAiAssistant() {',
    '''function serviceStatusUi(status: ServiceStatus, arabic: boolean) {
  if (status === "ready") {
    return { label: arabic ? "متصل الآن" : "Online", dot: "bg-emerald-400" };
  }
  if (status === "limited") {
    return { label: arabic ? "الخدمة محدودة حاليًا" : "Service limited", dot: "bg-amber-400" };
  }
  if (status === "unavailable") {
    return { label: arabic ? "غير متاح حاليًا" : "Temporarily unavailable", dot: "bg-rose-400" };
  }
  return { label: arabic ? "جارٍ التحقق من الخدمة…" : "Checking service…", dot: "bg-slate-400 animate-pulse" };
}

export function CyberWeelAiAssistant() {''',
)

replace_once(
    "src/components/site/ai-assistant.tsx",
    '  const [leadError, setLeadError] = useState("");\n',
    '  const [leadError, setLeadError] = useState("");\n  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>("idle");\n',
)

replace_once(
    "src/components/site/ai-assistant.tsx",
    '  const handoffUi = chat.lastTurn?.handoffUi || defaultHandoffUi(arabicSite);\n',
    '  const handoffUi = chat.lastTurn?.handoffUi || defaultHandoffUi(arabicSite);\n  const statusUi = serviceStatusUi(serviceStatus, arabicSite);\n',
)

replace_once(
    "src/components/site/ai-assistant.tsx",
    '''  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat.messages, busy, leadOpen, open]);''',
    '''  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setServiceStatus("checking");
    void fetch("/api/ai/chat", { method: "GET", headers: { Accept: "application/json" } })
      .then((response) => response.json().catch(() => null))
      .then((payload) => {
        if (cancelled) return;
        const next = payload?.status;
        setServiceStatus(next === "ready" || next === "limited" || next === "unavailable" ? next : "unavailable");
      })
      .catch(() => {
        if (!cancelled) setServiceStatus("unavailable");
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat.messages, busy, leadOpen, open]);''',
)

replace_once(
    "src/components/site/ai-assistant.tsx",
    '      const turn = payload.turn as AssistantTurn;\n',
    '      const turn = payload.turn as AssistantTurn;\n      setServiceStatus("ready");\n',
)

replace_once(
    "src/components/site/ai-assistant.tsx",
    '''    } catch (cause) {
      const code = cause instanceof Error ? cause.message : "UNAVAILABLE";
      setError(errorText(code, activeLanguage));''',
    '''    } catch (cause) {
      const code = cause instanceof Error ? cause.message : "UNAVAILABLE";
      if (code === "QUOTA_EXHAUSTED" || code === "AI_RATE_LIMITED") setServiceStatus("limited");
      else setServiceStatus("unavailable");
      setError(errorText(code, activeLanguage));''',
)

replace_once(
    "src/components/site/ai-assistant.tsx",
    '''                <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-slate-300" role="status">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" aria-hidden />
                  {arabicSite ? "متصل الآن" : "Online"}
                </p>''',
    '''                <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-slate-300" role="status" aria-live="polite">
                  <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", statusUi.dot)} aria-hidden />
                  {statusUi.label}
                </p>''',
)

# Fixed utilities sit below navigation sheets/dialogs (z-50).
replace_once(
    "src/components/site/ai-assistant.tsx",
    'right-4 z-[70] grid',
    'right-4 z-40 grid',
)
replace_once(
    "src/components/site/ai-assistant.tsx",
    'z-[69] flex h-[min(32rem,calc(100dvh_-_7.5rem_-_env(safe-area-inset-bottom)))]',
    'z-40 flex h-[min(32rem,calc(100dvh_-_7.5rem_-_env(safe-area-inset-bottom)))]',
)
replace_once(
    "src/components/site/whatsapp-button.tsx",
    'left-4 z-50 flex h-12',
    'left-4 z-40 flex h-12',
)
replace_once(
    "src/components/site/scroll-utilities.tsx",
    'left-4 z-50 flex h-12',
    'left-4 z-40 flex h-12',
)

# 3) Keep the site and dashboard language providers in sync inside the same tab.
replace_once(
    "src/components/site/i18n.tsx",
    'const STORAGE_KEY = "cyberweel-lang";\n',
    'const STORAGE_KEY = "cyberweel-lang";\nconst LANGUAGE_EVENT = "cyberweel:language-change";\n',
)
replace_once(
    "src/components/site/i18n.tsx",
    '''  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // ignore
    }
  }, []);''',
    '''  useEffect(() => {
    const syncLanguage = (event: Event) => {
      const next = (event as CustomEvent<{ lang?: Lang }>).detail?.lang;
      if (next === "ar" || next === "en") setLangState(next);
    };
    window.addEventListener(LANGUAGE_EVENT, syncLanguage);
    return () => window.removeEventListener(LANGUAGE_EVENT, syncLanguage);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent(LANGUAGE_EVENT, { detail: { lang: l } }));
  }, []);''',
)

replace_once(
    "src/components/dashboard-i18n-provider.tsx",
    'const STORAGE_KEY = "cyberweel-lang";\n',
    'const STORAGE_KEY = "cyberweel-lang";\nconst LANGUAGE_EVENT = "cyberweel:language-change";\n',
)
replace_once(
    "src/components/dashboard-i18n-provider.tsx",
    '''  const setLang = useCallback((next: DashboardLang) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);''',
    '''  useEffect(() => {
    if (!active) return;
    const syncLanguage = (event: Event) => {
      const next = (event as CustomEvent<{ lang?: DashboardLang }>).detail?.lang;
      if (next === "ar" || next === "en") setLangState(next);
    };
    window.addEventListener(LANGUAGE_EVENT, syncLanguage);
    return () => window.removeEventListener(LANGUAGE_EVENT, syncLanguage);
  }, [active]);

  const setLang = useCallback((next: DashboardLang) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new CustomEvent(LANGUAGE_EVENT, { detail: { lang: next } }));
  }, []);''',
)
replace_once(
    "src/components/dashboard-i18n-provider.tsx",
    '''      {active && pathname !== "/login" && !pathname.startsWith("/admin") && !pathname.startsWith("/client") && !pathname.startsWith("/partner/dashboard") ? (
        <DashboardLanguageButton className="fixed bottom-5 left-5 z-[100] h-11 shadow-lg" />
      ) : null}''',
    '''      {active && pathname !== "/login" && pathname !== "/partner" && !pathname.startsWith("/admin") && !pathname.startsWith("/client") && !pathname.startsWith("/partner/dashboard") ? (
        <DashboardLanguageButton className="fixed bottom-5 left-5 z-20 h-11 shadow-lg" />
      ) : null}''',
)

# 4) Ambassador dynamic errors are localized before they enter React state.
replace_once(
    "src/app/ambassador/dashboard/page.tsx",
    '  const { lang } = useDashboardI18n();\n',
    '  const { lang, tr } = useDashboardI18n();\n',
)
replace_once(
    "src/app/ambassador/dashboard/page.tsx",
    '  const [askingAssistant, setAskingAssistant] = useState(false);\n',
    '''  const [askingAssistant, setAskingAssistant] = useState(false);

  function localizeMessage(value: string) {
    return lang === "en" ? tr(value) : value;
  }
''',
)
replace_once(
    "src/app/ambassador/dashboard/page.tsx",
    '      throw new Error(dashboardErrorMessage(payload.error, "تعذر تحميل لوحة السفير"));',
    '      throw new Error(localizeMessage(dashboardErrorMessage(payload.error, "تعذر تحميل لوحة السفير")));',
)
replace_once(
    "src/app/ambassador/dashboard/page.tsx",
    '      loadDashboard().catch((cause) => setError(cause instanceof Error ? cause.message : "تعذر تحميل البيانات"));',
    '      loadDashboard().catch((cause) => setError(cause instanceof Error ? cause.message : localizeMessage("تعذر تحميل البيانات")));',
)
replace_once(
    "src/app/ambassador/dashboard/page.tsx",
    '      setError("تعذر النسخ تلقائيًا. حدّد النص وانسخه يدويًا.");',
    '      setError(localizeMessage("تعذر النسخ تلقائيًا. حدّد النص وانسخه يدويًا."));',
)
replace_once(
    "src/app/ambassador/dashboard/page.tsx",
    '      setError("تعذرت المشاركة الآن.");',
    '      setError(localizeMessage("تعذرت المشاركة الآن."));',
)
replace_once(
    "src/app/ambassador/dashboard/page.tsx",
    '        throw new Error(messages[payload?.error] || dashboardErrorMessage(payload?.error, "تعذر إنشاء الرد"));',
    '        throw new Error(localizeMessage(messages[payload?.error] || dashboardErrorMessage(payload?.error, "تعذر إنشاء الرد")));',
)
replace_once(
    "src/app/ambassador/dashboard/page.tsx",
    '      setError(cause instanceof Error ? cause.message : "تعذر إنشاء الرد");',
    '      setError(cause instanceof Error ? cause.message : localizeMessage("تعذر إنشاء الرد"));',
)
replace_once(
    "src/app/ambassador/dashboard/page.tsx",
    '      if (!response.ok) throw new Error(payload?.message || dashboardErrorMessage(payload?.error, "تعذر إضافة الإحالة"));',
    '''      if (!response.ok) {
        const message = typeof payload?.message === "string"
          ? payload.message
          : dashboardErrorMessage(payload?.error, "تعذر إضافة الإحالة");
        throw new Error(localizeMessage(message));
      }''',
)
replace_once(
    "src/app/ambassador/dashboard/page.tsx",
    '      setError(cause instanceof Error ? cause.message : "تعذر إضافة الإحالة");',
    '      setError(cause instanceof Error ? cause.message : localizeMessage("تعذر إضافة الإحالة"));',
)
replace_once(
    "src/app/ambassador/dashboard/page.tsx",
    '      if (!response.ok) throw new Error(dashboardErrorMessage(payload.error, "تعذر حفظ الملف"));',
    '      if (!response.ok) throw new Error(localizeMessage(dashboardErrorMessage(payload.error, "تعذر حفظ الملف")));',
)
replace_once(
    "src/app/ambassador/dashboard/page.tsx",
    '      setError(cause instanceof Error ? cause.message : "تعذر حفظ الملف");',
    '      setError(cause instanceof Error ? cause.message : localizeMessage("تعذر حفظ الملف"));',
)

ambassador_map = '''const ambassadorUiEnglish: Record<string, string> = {
  "تعذر تحميل لوحة السفير": "Unable to load the ambassador dashboard.",
  "تعذر تحميل البيانات": "Unable to load the dashboard data.",
  "تعذر النسخ تلقائيًا. حدّد النص وانسخه يدويًا.": "Automatic copying failed. Select the text and copy it manually.",
  "تعذرت المشاركة الآن.": "Sharing is unavailable right now.",
  "المشاركة غير متاحة في هذا المتصفح، لذلك تم نسخ المحتوى.": "Sharing is unavailable in this browser, so the content was copied instead.",
  "المعاينة الإدارية للقراءة فقط.": "Admin preview is read-only.",
  "مساعد السفير غير مهيأ بعد. أضف مفتاح Gemini في إعدادات البيئة.": "The ambassador assistant is not configured yet. Add the Gemini key to the environment settings.",
  "تعذر الوصول إلى مساعد السفير الآن. حاول مجددًا لاحقًا.": "The ambassador assistant is unavailable right now. Please try again later.",
  "امتنع المساعد عن تقديم رد قد يتضمن سعرًا أو موعدًا غير معتمد. حوّل الحالة إلى الإدارة.": "The assistant withheld a response that could include an unapproved price or timeline. Escalate this case to the admin team.",
  "تعذر إنشاء الرد": "Unable to generate a response.",
  "تعذر إضافة الإحالة": "Unable to add the referral.",
  "أدخل اسم العميل والبريد الإلكتروني ووسيلة تواصل إضافية واحتياجه بشكل صحيح.": "Enter the client name, email address, an additional contact method, and the need correctly.",
  "لا يمكنك تسجيل بريد حسابك كإحالة عميل.": "You cannot use your own account email as a client referral.",
  "هذا البريد مسجل بالفعل ضمن إحالاتك. تابع الإحالة الحالية بدل إنشاء نسخة جديدة.": "This email is already in your referrals. Continue with the existing referral instead of creating a duplicate.",
  "هذا البريد مسجل بالفعل كإحالة في CyberWeel ولا يمكن إنشاء إحالة مكررة.": "This email is already registered as a CyberWeel referral and cannot be duplicated.",
  "هذا البريد مرتبط بحساب موجود في CyberWeel ولا يمكن تسجيله كإحالة جديدة.": "This email belongs to an existing CyberWeel account and cannot be registered as a new referral.",
  "تعذر حفظ الملف": "Unable to save the profile.",
};

'''
replace_once(
    "src/lib/dashboard-i18n.ts",
    'const dashboardPatterns: Array<[RegExp, (...matches: string[]) => string]> = [',
    ambassador_map + 'const dashboardPatterns: Array<[RegExp, (...matches: string[]) => string]> = [',
)
replace_once(
    "src/lib/dashboard-i18n.ts",
    '  const exact = partnerApplicationEnglish[normalized] || dashboardEnglish[normalized];',
    '  const exact = ambassadorUiEnglish[normalized] || partnerApplicationEnglish[normalized] || dashboardEnglish[normalized];',
)

# Group 4 regression checks.
Path("tests/group-4-ai-health-ambassador-layering.test.mjs").write_text(r'''import assert from "node:assert/strict";
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
''')
