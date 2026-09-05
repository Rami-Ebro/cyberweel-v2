import assert from "node:assert/strict";
import fs from "node:fs";

const adminPage = fs.readFileSync("src/app/admin/referrals/page.tsx", "utf8");
const challengeView = fs.readFileSync("src/components/sections/share-challenge-view.tsx", "utf8");

assert.match(adminPage, /const \[filtersOpen, setFiltersOpen\] = useState\(false\)/);
assert.match(adminPage, /aria-controls="referral-filters"/);
assert.match(adminPage, /إعادة الضبط/);
assert.match(adminPage, /activeFilterCount/);
assert.doesNotMatch(adminPage, /title="بيانات العمولة"/);
assert.doesNotMatch(adminPage, /CircleDollarSign/);
assert.match(adminPage, /xl:grid-cols-2/);

assert.match(challengeView, /المرفقات اختيارية/);
assert.match(challengeView, /لا ترسل كلمات مرور أو مفاتيح دخول أو بيانات شديدة الحساسية/);
assert.match(challengeView, /Attachments are optional/);

console.log("Referral admin prioritizes referral content, hides commission controls, and clarifies attachments.");