import assert from "node:assert/strict";
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
