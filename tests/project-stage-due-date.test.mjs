import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const projectRoute = await readFile(new URL("../src/app/api/admin/projects/route.ts", import.meta.url), "utf8");
const clientDashboardRoute = await readFile(new URL("../src/app/api/client/dashboard/route.ts", import.meta.url), "utf8");

test("new projects create the first-stage invoice due on the project creation date", () => {
  assert.match(projectRoute, /await tx\.clientInvoice\.create\(\{/);
  assert.match(projectRoute, /status: "DUE"/);
  assert.match(projectRoute, /dueAt: project\.createdAt/);
  assert.match(projectRoute, /title: "مطالبة دفع للمرحلة الأولى"/);
});

test("client stage cards use invoice due dates rather than execution start dates", () => {
  assert.match(clientDashboardRoute, /const stageInvoices = project\.invoices/);
  assert.match(clientDashboardRoute, /\.filter\(\(invoice\) => invoice\.type === "STANDARD"\)/);
  assert.match(clientDashboardRoute, /dueAt: stageInvoices\[index\]\?\.dueAt \|\| null/);
  assert.doesNotMatch(clientDashboardRoute, /dueAt: stage\.startsAt/);
});
