import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../src/components/admin/project-execution-plan.tsx", import.meta.url), "utf8");

test("first stage waits for payment because its invoice already exists", () => {
  assert.match(source, /const firstStageInvoiceExists = isFirstStage && Boolean\(stage\.invoice\)/);
  assert.match(source, /const firstStagePaid = firstStageInvoiceExists && stage\.paymentStatus === "PAID"/);
  assert.match(source, /const canStartFirstStage = firstStagePaid && stage\.status === "NOT_STARTED"/);
  assert.match(source, /فاتورة المرحلة الأولى صدرت تلقائيًا عند إنشاء المشروع/);
  assert.match(source, /تم تسجيل دفع فاتورة المرحلة الأولى\. يمكن بدء التنفيذ الآن\./);
});

test("first stage start action does not claim to issue a second invoice", () => {
  assert.match(source, />\{busy === `start-\$\{stage\.id\}` \? "جارٍ البدء\.\.\." : "بدء المرحلة"\}<\/button>/);
  assert.match(source, /الفاتورة \$\{stage\.invoice\.number\} كانت صادرة مسبقًا/);
  assert.match(source, /const showGenericStart = !isFirstStage/);
});
