import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const adminRewards = read("src/app/admin/rewards/page.tsx");
const ambassador = read("src/app/ambassador/dashboard/page.tsx");
const adminShell = read("src/components/admin/admin-shell.tsx");
const invoices = read("src/app/admin/invoices/page.tsx");
const partner = read("src/app/partner/dashboard/page.tsx");
const partnerApi = read("src/app/api/partner/dashboard/route.ts");
const partnerDelivery = read("src/components/partner/partner-delivery-workspace.tsx");

assert.match(adminRewards, /EXPECTED: "متوقعة"/);
assert.match(adminRewards, /EARNED: "مستحقة \/ بانتظار الدفع"/);
assert.match(ambassador, /EARNED: "مستحقة \/ بانتظار الدفع"/);

assert.match(adminShell, /const \[menuOpen, setMenuOpen\] = useState\(false\)/);
assert.match(adminShell, /const \[desktopSidebar, setDesktopSidebar\] = useState\(false\)/);
assert.match(adminShell, /matchMedia\("\(min-width: 1024px\)"\)/);
assert.match(adminShell, /inert=\{!desktopSidebar && !menuOpen\}/);
assert.match(adminShell, /aria-hidden=\{!desktopSidebar && !menuOpen \? true : undefined\}/);
assert.match(adminShell, /aria-label="فتح قائمة الإدارة"/);
assert.match(adminShell, /fixed inset-y-0 right-0 z-50/);
assert.match(adminShell, /overflow-y-auto overscroll-contain/);
assert.match(adminShell, /lg:sticky/);

assert.match(invoices, /className="grid gap-3 lg:hidden"/);
assert.match(invoices, /className="hidden overflow-x-auto lg:block"/);
assert.match(invoices, /max-h-\[calc\(100dvh-2rem\)\]/);

assert.match(partner, /projectStageId\?: string/);
assert.match(partner, /const structuredAssignment = Boolean\(project\.projectStageId\)/);
assert.match(partner, /const maxProgress = structuredAssignment \? 99 : 100/);
assert.match(partner, /data-stage-progress=\{structuredAssignment \? "true" : undefined\}/);
assert.match(partner, /!structuredAssignment && draft === 100 \? "إكمال المشروع"/);
assert.match(partner, /\["COMPLETED", "REVIEW"\]\.includes\(project\.status\)/);
assert.match(partner, /project\.status === "REVIEW" \? "تم إرسال التسليم وهو الآن بانتظار مراجعة الإدارة\."/);
assert.match(partnerApi, /progress > 100/);
assert.match(partnerApi, /if \(stageAssignment\) \{\n    if \(progress > 99\)/);
assert.match(partnerApi, /data: progress === 100 \? \{ progress: 100, status: "COMPLETED" \} : \{ progress \}/);
assert.match(partnerDelivery, /input\[data-stage-progress="true"\]/);
assert.doesNotMatch(partnerDelivery, /input\[aria-label="نسبة تقدم المشروع"\]/);
assert.doesNotMatch(partnerDelivery, /input\[type="number"\]\[max="100"\]/);

for (const content of [partner, ambassador]) {
  assert.match(content, /max-w-\[calc\(100vw-1rem\)\]/);
  assert.match(content, /overflow-y-auto overscroll-contain/);
}

console.log("Group 2 admin/mobile UX regression checks passed.");
