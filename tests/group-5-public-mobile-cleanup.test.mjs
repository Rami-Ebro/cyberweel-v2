import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const header = read("src/components/layout/site-header-refined.tsx");
const language = read("src/components/site/language-switcher.tsx");
const theme = read("src/components/site/theme-toggle.tsx");
const sheet = read("src/components/ui/sheet.tsx");
const register = read("src/app/partner/register/page.tsx");
const legal = read("src/components/site/legal-page-client.tsx");
const referral = read("src/app/ref/[code]/route.ts");

assert.match(header, /sm:hidden"><Logo size=\{42\}/);
assert.match(header, /hidden sm:inline-flex"><Wordmark/);
assert.match(language, /h-11 min-w-11/);
assert.match(theme, /h-11 w-11/);
assert.match(sheet, /h-dvh w-3\/4 overflow-y-auto overscroll-contain/);
assert.match(sheet, /inline-flex h-11 w-11 items-center justify-center/);
assert.match(sheet, /side === "left" \? "left-2" : "right-2"/);
assert.match(sheet, /إغلاق القائمة · Close navigation/);
assert.doesNotMatch(sheet, /<span className="sr-only">Close<\/span>/);
assert.match(register, /redirect\("\/partner"\)/);
assert.doesNotMatch(register, /\/#\/partner/);
assert.match(legal, /publicViewPath\(view, window\.location\.search\)/);
assert.doesNotMatch(legal, /`\/#\/\$\{view\}`/);
assert.match(referral, /new URL\("\/share-challenge", request\.url\)/);
assert.doesNotMatch(referral, /destination\.hash\s*=/);

console.log("Group 5 public mobile/accessibility and clean-route checks passed.");
