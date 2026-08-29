import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync("src/app/admin/invoices/page.tsx", "utf8");

assert.match(page, /dark:bg-emerald-950\/40 dark:text-emerald-200/);
assert.match(page, /dark:bg-rose-950\/40 dark:text-rose-200/);
assert.match(page, /dark:bg-emerald-950\/50 dark:text-emerald-200/);
assert.match(page, /dark:bg-rose-100 text-rose-800|dark:bg-rose-950\/50 dark:text-rose-200/);
assert.match(page, /dark:bg-slate-900 dark:text-slate-100/);
assert.match(page, /\[data-admin-shell-root="true"\]\.dark \.field\{border-color:#334155;background:#0f172a;color:#f8fafc;color-scheme:dark\}/);
assert.match(page, /\.dark \.field::placeholder\{color:#94a3b8\}/);
assert.match(page, /\.dark select\.field option\{background:#0f172a;color:#f8fafc\}/);
assert.doesNotMatch(page, /\.field\{[^}]*background:white\}`}/);

console.log("Group 5 admin invoice dark-mode checks passed.");
