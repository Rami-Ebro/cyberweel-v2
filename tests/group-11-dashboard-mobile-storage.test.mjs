import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { readLocalStorage, writeLocalStorage } from "../src/lib/browser-storage.ts";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

function withWindow(value, run) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, writable: true, value });
  try { run(); } finally {
    if (descriptor) Object.defineProperty(globalThis, "window", descriptor);
    else delete globalThis.window;
  }
}

test("Group 11 browser storage helpers fail closed when localStorage is unavailable", () => {
  withWindow({ localStorage: {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("blocked"); },
  } }, () => {
    assert.equal(readLocalStorage("x"), null);
    assert.equal(writeLocalStorage("x", "y"), false);
  });
});

test("Group 11 dashboard storage callers no longer access localStorage directly", () => {
  for (const path of [
    "src/components/dashboard-i18n-provider.tsx",
    "src/components/partner/partner-header-tools.tsx",
    "src/components/ambassador/ambassador-header-tools.tsx",
    "src/app/partner/dashboard/page.tsx",
    "src/app/ambassador/dashboard/page.tsx",
  ]) {
    assert.doesNotMatch(read(path), /\blocalStorage\./, path);
  }
});

test("Group 11 mobile drawers are inert while hidden, announce state, lock scroll, and close on Escape", () => {
  const hook = read("src/components/dashboard-mobile-drawer.ts");
  assert.match(hook, /document\.body\.style\.overflow = "hidden"/);
  assert.match(hook, /event\.key === "Escape"/);
  assert.match(hook, /matchMedia\("\(min-width: 1024px\)"\)/);

  for (const [path, id] of [
    ["src/app/partner/dashboard/page.tsx", "partner-dashboard-menu"],
    ["src/app/ambassador/dashboard/page.tsx", "ambassador-dashboard-menu"],
  ]) {
    const source = read(path);
    assert.match(source, /inert=\{!desktopSidebar && !menuOpen\}/, path);
    assert.match(source, /aria-hidden=\{!desktopSidebar && !menuOpen \? true : undefined\}/, path);
    assert.match(source, new RegExp(`aria-controls="${id}"`), path);
    assert.match(source, /aria-expanded=\{menuOpen\}/, path);
    assert.match(source, /sm:hidden[^
]*<LogOut/, path);
  }
});

test("Group 11 dashboard tables remain readable and keyboard-scrollable on narrow screens", () => {
  const client = read("src/components/client-dashboard.tsx");
  assert.match(client, /aria-label="جدول فواتير العميل"[^>]*tabIndex=\{0\}[^>]*overflow-x-auto/);
  assert.match(client, /min-w-\[900px\]/);

  const partner = read("src/app/partner/dashboard/page.tsx");
  assert.match(partner, /aria-label="جدول مستحقات المشاريع"[^>]*tabIndex=\{0\}/);

  const ambassador = read("src/app/ambassador/dashboard/page.tsx");
  assert.match(ambassador, /aria-label="جدول إحالات السفير"[^>]*tabIndex=\{0\}/);
  assert.match(ambassador, /aria-label="جدول مكافآت السفير"[^>]*tabIndex=\{0\}/);
});
