from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"Expected exactly one match in {path}, got {count}: {old[:140]!r}")
    file.write_text(text.replace(old, new, 1))


# CW-C01 + CW-C04: normalize legacy hashes and scroll only after the route pathname changes.
Path("src/components/site/use-view-router.ts").write_text(r'''"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ViewId } from "@/lib/site-data";
import { PUBLIC_PATH_VIEWS, PUBLIC_VIEW_PATHS, publicViewPath } from "@/lib/public-navigation";

function legacyHashTarget(): string | null {
  if (typeof window === "undefined") return null;
  const raw = window.location.hash.replace(/^#\/?/, "").trim();
  if (raw === "ambassador") {
    const params = new URLSearchParams(window.location.search);
    params.set("path", "ambassador");
    return `/partner?${params.toString()}`;
  }
  return Object.prototype.hasOwnProperty.call(PUBLIC_VIEW_PATHS, raw)
    ? publicViewPath(raw as ViewId, window.location.search)
    : null;
}

function withCurrentQuery(path: string) {
  if (typeof window === "undefined") return path;
  return `${path}${window.location.search}`;
}

/**
 * Public navigation uses real, clean paths so links are shareable and indexable.
 * Legacy hash URLs remain supported and are normalized to their clean path.
 * Existing query parameters are preserved so referral attribution is not lost.
 */
export function useViewRouter(initialView: ViewId = "home") {
  const router = useRouter();
  const pathname = usePathname();
  const view = PUBLIC_PATH_VIEWS[pathname] ?? initialView;

  useEffect(() => {
    const legacyTarget = legacyHashTarget();
    if (legacyTarget) {
      router.replace(legacyTarget, { scroll: false });
      return;
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname, router]);

  const navigate = useCallback(
    (next: ViewId) => {
      const target = withCurrentQuery(PUBLIC_VIEW_PATHS[next]);

      if (view === next) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      router.push(target, { scroll: false });
    },
    [router, view],
  );

  return { view, navigate };
}
''')

# CW-C03: server and first client render are both Arabic; restore saved language after hydration.
replace_once(
    "src/components/site/i18n.tsx",
    '''  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "ar";
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (stored === "ar" || stored === "en") return stored;
    } catch {
      // ignore
    }
    return "ar";
  });''',
    '''  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (stored === "ar" || stored === "en") {
        void Promise.resolve().then(() => setLangState(stored));
      }
    } catch {
      // Keep the deterministic Arabic first render when storage is unavailable.
    }
  }, []);''',
)

# CW-C02: extend the existing /partner DOM translator instead of duplicating form logic.
partner_application_map = r'''const partnerApplicationEnglish: Record<string, string> = {
  "البرمجة والتطوير": "Programming & Development",
  "التصميم وتجربة المستخدم": "Design & User Experience",
  "التسويق الرقمي": "Digital Marketing",
  "تحليل الأعمال": "Business Analysis",
  "الذكاء الاصطناعي والأتمتة": "AI & Automation",
  "إدارة المشاريع": "Project Management",
  "صناعة المحتوى": "Content Creation",
  "مواقع ومتاجر إلكترونية": "Websites & Online Stores",
  "تطبيقات": "Applications",
  "أتمتة وذكاء اصطناعي": "Automation & AI",
  "تصميم وهوية": "Design & Branding",
  "تسويق ومحتوى": "Marketing & Content",
  "دعم تقني": "Technical Support",
  "تحليل واستشارات": "Analysis & Consulting",
  "أخرى": "Other",
  "معلومات العمل": "Work Information",
  "القدرة والتفرغ": "Capacity & Availability",
  "نبذة قصيرة": "Short Bio",
  "معلومات الدفع": "Payment Information",
  "تقدم التسجيل": "Application Progress",
  "نوع الشريك": "Partner Type",
  "فرد مستقل": "Independent Professional",
  "فريق أو شركة": "Team or Company",
  "مستشار متخصص": "Specialist Consultant",
  "مجال العمل": "Work Area",
  "الخدمات أو المجالات التي تستطيع دعمها": "Services or Areas You Can Support",
  "اكتب المستوى التعليمي أو الشهادة": "Enter Your Education Level or Qualification",
  "التخصص (إن وجد)": "Specialization (If Any)",
  "مبتدئ": "Beginner",
  "متوسط": "Intermediate",
  "متقدم": "Advanced",
  "خبير": "Expert",
  "عدد سنوات الخبرة": "Years of Experience",
  "عدد الساعات المتاحة أسبوعياً": "Available Hours per Week",
  "نبذة قصيرة عنك أو عن خبرتك": "A Short Bio About You or Your Experience",
  "(اختياري)": "(Optional)",
  "طرق الدفع المعتمدة": "Available Payment Methods",
  "اكتب طريقة الدفع الأخرى": "Enter the Other Payment Method",
  "يرجى إكمال الحقول المطلوبة في هذه المرحلة والتأكد من صحة البيانات.": "Please complete the required fields in this step and verify the information.",
  "اختر طريقة دفع واحدة على الأقل.": "Choose at least one payment method.",
  "إرسال الطلب للمراجعة": "Submit for Review",
  "تعذر إرسال الطلب.": "The application could not be submitted.",
};

'''
replace_once(
    "src/lib/dashboard-i18n.ts",
    "const dashboardPatterns: Array<[RegExp, (...matches: string[]) => string]> = [",
    partner_application_map + "const dashboardPatterns: Array<[RegExp, (...matches: string[]) => string]> = [",
)
replace_once(
    "src/lib/dashboard-i18n.ts",
    "  const exact = dashboardEnglish[normalized];",
    "  const exact = partnerApplicationEnglish[normalized] || dashboardEnglish[normalized];",
)

# CW-C05: keep login language control in its header, not as a fixed footer-overlapping button.
replace_once(
    "src/components/dashboard-i18n-provider.tsx",
    '''      {active && !pathname.startsWith("/admin") && !pathname.startsWith("/client") && !pathname.startsWith("/partner/dashboard") ? (
        <DashboardLanguageButton className="fixed bottom-5 left-5 z-[100] h-11 shadow-lg" />
      ) : null}''',
    '''      {active && pathname !== "/login" && !pathname.startsWith("/admin") && !pathname.startsWith("/client") && !pathname.startsWith("/partner/dashboard") ? (
        <DashboardLanguageButton className="fixed bottom-5 left-5 z-[100] h-11 shadow-lg" />
      ) : null}''',
)

replace_once(
    "src/app/login/page.tsx",
    'import { dashboardErrorMessage } from "@/lib/dashboard-labels";',
    'import { dashboardErrorMessage } from "@/lib/dashboard-labels";\nimport { DashboardLanguageButton } from "@/components/dashboard-i18n-provider";',
)
replace_once(
    "src/app/login/page.tsx",
    '''          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-[#111827]">
            العودة إلى الموقع
            <ArrowLeft className="h-4 w-4" />
          </Link>''',
    '''          <div className="flex items-center gap-2">
            <DashboardLanguageButton className="h-10 px-3 shadow-none" />
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-[#111827]">
              العودة إلى الموقع
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>''',
)
# CW-C06: visible login CTA goes straight to the clean public path.
replace_once("src/app/login/page.tsx", 'href="/#/partner"', 'href="/partner"')

# Clean partner/ambassador share URLs and let /partner deep-link directly to the requested card.
replace_once("src/components/sections/partner-view.tsx", 'import { useState } from "react";', 'import { useEffect, useState } from "react";')
replace_once(
    "src/components/sections/partner-view.tsx",
    '  const [active, setActive] = useState<PathId | null>(null);',
    '''  const [active, setActive] = useState<PathId | null>(null);

  useEffect(() => {
    const requestedPath = new URLSearchParams(window.location.search).get("path");
    if (requestedPath === "partner" || requestedPath === "ambassador") {
      queueMicrotask(() => setActive(requestedPath));
    }
  }, []);''',
)
replace_once(
    "src/components/sections/collaboration-application-form.tsx",
    'const url = `${window.location.origin}/#/partner`;',
    'const url = `${window.location.origin}/partner?path=partner`;'
)
replace_once(
    "src/components/sections/collaboration-application-form.tsx",
    'const url = `${window.location.origin}/#/ambassador`;',
    'const url = `${window.location.origin}/partner?path=ambassador`;'
)

Path("tests/group-3-public-routing-i18n.test.mjs").write_text(r'''import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const router = read("src/components/site/use-view-router.ts");
const publicI18n = read("src/components/site/i18n.tsx");
const dashboardI18n = read("src/lib/dashboard-i18n.ts");
const dashboardProvider = read("src/components/dashboard-i18n-provider.tsx");
const login = read("src/app/login/page.tsx");
const partnerView = read("src/components/sections/partner-view.tsx");
const applications = read("src/components/sections/collaboration-application-form.tsx");

assert.match(router, /if \(raw === "ambassador"\)/);
assert.match(router, /params\.set\("path", "ambassador"\)/);
assert.match(router, /window\.scrollTo\(\{ top: 0, behavior: "auto" \}\)/);
assert.match(router, /\[pathname, router\]/);
assert.doesNotMatch(router, /window\.requestAnimationFrame/);

assert.match(publicI18n, /useState<Lang>\("ar"\)/);
assert.match(publicI18n, /Promise\.resolve\(\)\.then\(\(\) => setLangState\(stored\)\)/);
assert.doesNotMatch(publicI18n, /useState<Lang>\(\(\) =>/);

assert.match(dashboardI18n, /const partnerApplicationEnglish: Record<string, string>/);
assert.match(dashboardI18n, /"البرمجة والتطوير": "Programming & Development"/);
assert.match(dashboardI18n, /"إرسال الطلب للمراجعة": "Submit for Review"/);
assert.match(dashboardI18n, /partnerApplicationEnglish\[normalized\] \|\| dashboardEnglish\[normalized\]/);

assert.match(dashboardProvider, /pathname !== "\/login"/);
assert.match(login, /DashboardLanguageButton/);
assert.match(login, /href="\/partner"/);
assert.doesNotMatch(login, /\/#\/partner/);

assert.match(partnerView, /requestedPath === "partner" \|\| requestedPath === "ambassador"/);
assert.match(partnerView, /queueMicrotask\(\(\) => setActive\(requestedPath\)\)/);
assert.match(applications, /\/partner\?path=partner/);
assert.match(applications, /\/partner\?path=ambassador/);
assert.doesNotMatch(applications, /\/#\/partner/);
assert.doesNotMatch(applications, /\/#\/ambassador/);

console.log("Group 3 public routing/i18n regression checks passed.");
''')
