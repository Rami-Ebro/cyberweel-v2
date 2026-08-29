import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../src/app/admin/ambassadors/page.tsx", import.meta.url), "utf8");

test("keeps the seven-column ambassador table desktop-only", () => {
  assert.match(source, /data-ambassador-desktop-table="true"[^>]*className="[^"]*hidden[^"]*lg:block/);
  assert.match(source, /<table className="w-full table-fixed/);
  for (const label of ["السفير", "التواصل", "الحالة والمستوى", "الإحالات", "المكافآت", "آخر نشاط", "الإجراء"]) {
    assert.ok(source.includes(`>${label}</th>`), `missing desktop column: ${label}`);
  }
});

test("renders a dedicated ambassador card list below lg", () => {
  assert.match(source, /data-ambassador-mobile-list="true"[^>]*className="[^"]*lg:hidden/);
  assert.match(source, /data-ambassador-mobile-card="true"/);
  assert.ok(source.includes("<AmbassadorMobileCard"));
  assert.ok(source.includes("break-all text-right text-sm"), "mobile contact values must wrap safely");
  assert.ok(source.includes("min-w-0 rounded-2xl"), "mobile card must allow narrow-grid shrinking");
});

test("mobile cards preserve account data and all existing ambassador actions", () => {
  for (const label of ["التواصل", "الحالة والمستوى", "آخر نشاط", "الإحالات", "المكافآت", "عرض", "تعديل", "تفعيل", "تعليق"]) {
    assert.ok(source.includes(label), `missing mobile/account capability: ${label}`);
  }
  assert.match(source, /const size = compact \? "min-h-8[^\n]+: "min-h-11/);
  assert.match(source, /href=\{`\/ambassador\/dashboard\?adminPreview=\$\{ambassador\.id\}`\}/);
  assert.match(source, /onUpdateStatus\(ambassador\.id, "ACTIVE"\)/);
  assert.match(source, /onUpdateStatus\(ambassador\.id, "SUSPENDED"\)/);
});

test("desktop and mobile reuse the same edit and action components", () => {
  assert.ok((source.match(/<AmbassadorActions/g) || []).length >= 2, "shared actions should render in desktop and mobile");
  assert.ok((source.match(/<AmbassadorEditForm/g) || []).length >= 2, "shared edit form should render in desktop and mobile");
  for (const field of ["name=\"name\"", "name=\"email\"", "name=\"phone\"", "name=\"age\""]) {
    assert.ok(source.includes(field), `missing edit field: ${field}`);
  }
  assert.ok(source.includes("حفظ بيانات السفير"));
  assert.ok(source.includes("إلغاء"));
});

test("application decision controls remain usable on narrow screens", () => {
  assert.match(source, /className="grid gap-2 sm:grid-cols-2 md:col-span-2"/);
  assert.match(source, /min-h-11 rounded-lg bg-emerald-600/);
  assert.match(source, /min-h-11 rounded-lg bg-rose-600/);
});
