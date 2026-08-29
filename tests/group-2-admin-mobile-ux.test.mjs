import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const adminRewards = read("src/app/admin/rewards/page.tsx");
const ambassador = read("src/app/ambassador/dashboard/page.tsx");
const adminShell = read("src/components/admin/admin-shell.tsx");
const invoices = read("src/app/admin/invoices/page.tsx");
const partner = read("src/app/partner/dashboard/page.tsx");
const partnerApi = read("src/app/api/partner/dashboard/route.ts");

assert.match(adminRewards, /EXPECTED: "متوقعة"/);
assert.match(adminRewards, /EARNED: "مستحقة \/ بانتظار الدفع"/);
assert.match(ambassador, /EARNED: "مستحقة \/ بانتظار الدفع"/);

assert.match(adminShell, /const \[menuOpen, setMenuOpen\] = useState\(false\)/);
assert.match(adminShell, /aria-label="فتح قائمة الإدارة"/);
assert.match(adminShell, /fixed inset-y-0 right-0 z-50/);
assert.match(adminShell, /overflow-y-auto overscroll-contain/);
assert.match(adminShell, /lg:sticky/);

assert.match(invoices, /className="grid gap-3 lg:hidden"/);
assert.match(invoices, /className="hidden overflow-x-auto lg:block"/);
assert.match(invoices, /max-h-\[calc\(100dvh-2rem\)\]/);

assert.match(partner, /max=\{99\}/);
assert.doesNotMatch(partner, /max=\{100\}/);
assert.match(partner, /Math\.min\(99/);
assert.match(partner, /\["COMPLETED", "REVIEW"\]\.includes\(project\.status\)/);
assert.match(partnerApi, /progress > 99/);
assert.doesNotMatch(partnerApi, /progress > 100/);

for (const content of [partner, ambassador]) {
  assert.match(content, /max-w-\[calc\(100vw-1rem\)\]/);
  assert.match(content, /overflow-y-auto overscroll-contain/);
}

console.log("Group 2 admin/mobile UX regression checks passed.");
