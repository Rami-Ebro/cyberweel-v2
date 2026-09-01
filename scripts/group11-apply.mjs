import { readFileSync, writeFileSync } from "node:fs";

function read(path) {
  return readFileSync(path, "utf8");
}

function write(path, content) {
  writeFileSync(path, content, "utf8");
}

function replaceOnce(content, search, replacement, label) {
  const first = content.indexOf(search);
  if (first < 0) throw new Error(`Missing marker: ${label}`);
  if (content.indexOf(search, first + search.length) >= 0) throw new Error(`Marker not unique: ${label}`);
  return content.slice(0, first) + replacement + content.slice(first + search.length);
}

function replaceAllRequired(content, search, replacement, label) {
  if (!content.includes(search)) throw new Error(`Missing marker: ${label}`);
  return content.split(search).join(replacement);
}

const storageHelper = `export function readLocalStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeLocalStorage(key: string, value: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
`;
write("src/lib/browser-storage.ts", storageHelper);

const drawerHook = `"use client";

import { type Dispatch, type SetStateAction, useEffect, useState } from "react";

export function useDashboardMobileDrawer(
  open: boolean,
  setOpen: Dispatch<SetStateAction<boolean>>,
) {
  const [desktopSidebar, setDesktopSidebar] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => {
      setDesktopSidebar(media.matches);
      if (media.matches) setOpen(false);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [setOpen]);

  useEffect(() => {
    if (!open || desktopSidebar) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [desktopSidebar, open, setOpen]);

  return { desktopSidebar };
}
`;
write("src/components/dashboard-mobile-drawer.ts", drawerHook);

let i18n = read("src/components/dashboard-i18n-provider.tsx");
i18n = replaceOnce(
  i18n,
  'import { type DashboardLang, translateDashboardText } from "@/lib/dashboard-i18n";\n',
  'import { type DashboardLang, translateDashboardText } from "@/lib/dashboard-i18n";\nimport { readLocalStorage, writeLocalStorage } from "@/lib/browser-storage";\n',
  "dashboard i18n storage import",
);
i18n = replaceOnce(i18n, 'const stored = window.localStorage.getItem(STORAGE_KEY);', 'const stored = readLocalStorage(STORAGE_KEY);', "dashboard language safe read");
i18n = replaceOnce(
  i18n,
  `    try {\n      window.localStorage.setItem(STORAGE_KEY, next);\n    } catch {\n      // Keep same-tab language synchronization working even when storage is unavailable.\n    }`,
  `    writeLocalStorage(STORAGE_KEY, next);`,
  "dashboard language safe write",
);
write("src/components/dashboard-i18n-provider.tsx", i18n);

let partnerHeader = read("src/components/partner/partner-header-tools.tsx");
partnerHeader = replaceOnce(
  partnerHeader,
  'import { ArrowLeft, Bell, CheckCircle2, CheckCheck, RefreshCw } from "lucide-react";\n',
  'import { ArrowLeft, Bell, CheckCircle2, CheckCheck, RefreshCw } from "lucide-react";\nimport { readLocalStorage, writeLocalStorage } from "@/lib/browser-storage";\n',
  "partner header storage import",
);
partnerHeader = replaceAllRequired(partnerHeader, "localStorage.getItem(", "readLocalStorage(", "partner header safe reads");
partnerHeader = replaceAllRequired(partnerHeader, "localStorage.setItem(", "writeLocalStorage(", "partner header safe writes");
write("src/components/partner/partner-header-tools.tsx", partnerHeader);

let ambassadorHeader = read("src/components/ambassador/ambassador-header-tools.tsx");
ambassadorHeader = replaceOnce(
  ambassadorHeader,
  'import { ArrowLeft, Bell, CheckCircle2, CheckCheck, RefreshCw } from "lucide-react";\n',
  'import { ArrowLeft, Bell, CheckCircle2, CheckCheck, RefreshCw } from "lucide-react";\nimport { readLocalStorage, writeLocalStorage } from "@/lib/browser-storage";\n',
  "ambassador header storage import",
);
ambassadorHeader = replaceAllRequired(ambassadorHeader, "localStorage.getItem(", "readLocalStorage(", "ambassador header safe reads");
ambassadorHeader = replaceAllRequired(ambassadorHeader, "localStorage.setItem(", "writeLocalStorage(", "ambassador header safe writes");
write("src/components/ambassador/ambassador-header-tools.tsx", ambassadorHeader);

let partner = read("src/app/partner/dashboard/page.tsx");
partner = replaceOnce(
  partner,
  'import { dashboardErrorMessage, dashboardLabel } from "@/lib/dashboard-labels";\n',
  'import { dashboardErrorMessage, dashboardLabel } from "@/lib/dashboard-labels";\nimport { useDashboardMobileDrawer } from "@/components/dashboard-mobile-drawer";\nimport { readLocalStorage, writeLocalStorage } from "@/lib/browser-storage";\n',
  "partner dashboard imports",
);
partner = replaceOnce(partner, '  const [menuOpen, setMenuOpen] = useState(false);\n', '  const [menuOpen, setMenuOpen] = useState(false);\n  const { desktopSidebar } = useDashboardMobileDrawer(menuOpen, setMenuOpen);\n', "partner drawer hook");
partner = replaceOnce(partner, 'queueMicrotask(() => setDarkMode(localStorage.getItem("cyberweel-partner-theme") === "dark"));', 'queueMicrotask(() => setDarkMode(readLocalStorage("cyberweel-partner-theme") === "dark"));', "partner theme safe read");
partner = replaceOnce(partner, 'localStorage.setItem("cyberweel-partner-theme", next ? "dark" : "light");', 'writeLocalStorage("cyberweel-partner-theme", next ? "dark" : "light");', "partner theme safe write");
partner = replaceAllRequired(partner, '<button aria-label="إغلاق القائمة"', '<button type="button" aria-label="إغلاق القائمة"', "partner close buttons");
partner = replaceOnce(partner, '<aside className={`fixed inset-y-0 right-0', '<aside id="partner-dashboard-menu" inert={!desktopSidebar && !menuOpen} aria-hidden={!desktopSidebar && !menuOpen ? true : undefined} aria-label="قائمة لوحة الشريك" className={`fixed inset-y-0 right-0', "partner drawer accessibility");
partner = replaceOnce(partner, '<button aria-label="فتح القائمة" onClick={() => setMenuOpen(true)}', '<button type="button" aria-label="فتح القائمة" aria-expanded={menuOpen} aria-controls="partner-dashboard-menu" onClick={() => setMenuOpen(true)}', "partner menu trigger accessibility");
partner = replaceOnce(
  partner,
  '<Link href="/" className="flex items-center justify-center gap-2 rounded-2xl bg-[#bd9850] px-4 py-3 font-black text-slate-950"><ArrowLeft size={18} />العودة إلى الموقع</Link>',
  '<Link href="/" className="flex items-center justify-center gap-2 rounded-2xl bg-[#bd9850] px-4 py-3 font-black text-slate-950"><ArrowLeft size={18} />العودة إلى الموقع</Link><button type="button" onClick={logout} disabled={loggingOut} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 px-4 py-3 font-black text-white/80 transition hover:bg-white/10 disabled:opacity-60 sm:hidden"><LogOut size={18} />{data?.isAdminPreview ? "العودة للإدارة" : loggingOut ? "جارٍ الخروج" : "تسجيل الخروج"}</button>',
  "partner mobile logout",
);
partner = replaceOnce(partner, '<div className="overflow-x-auto"><table className="w-full min-w-[980px] text-right">', '<div role="region" aria-label="جدول مستحقات المشاريع" tabIndex={0} className="overflow-x-auto focus:outline-none focus:ring-2 focus:ring-[#B89A5A] focus:ring-inset"><table className="w-full min-w-[980px] text-right">', "partner table accessible scroll");
write("src/app/partner/dashboard/page.tsx", partner);

let ambassador = read("src/app/ambassador/dashboard/page.tsx");
ambassador = replaceOnce(
  ambassador,
  'import { useDashboardI18n } from "@/components/dashboard-i18n-provider";\n',
  'import { useDashboardI18n } from "@/components/dashboard-i18n-provider";\nimport { useDashboardMobileDrawer } from "@/components/dashboard-mobile-drawer";\nimport { readLocalStorage, writeLocalStorage } from "@/lib/browser-storage";\n',
  "ambassador dashboard imports",
);
ambassador = replaceOnce(ambassador, '  const [menuOpen, setMenuOpen] = useState(false);\n', '  const [menuOpen, setMenuOpen] = useState(false);\n  const { desktopSidebar } = useDashboardMobileDrawer(menuOpen, setMenuOpen);\n', "ambassador drawer hook");
ambassador = replaceOnce(ambassador, 'setDarkMode(localStorage.getItem("cyberweel-ambassador-theme") === "dark");', 'setDarkMode(readLocalStorage("cyberweel-ambassador-theme") === "dark");', "ambassador theme safe read");
ambassador = replaceOnce(ambassador, 'localStorage.setItem("cyberweel-ambassador-theme", next ? "dark" : "light");', 'writeLocalStorage("cyberweel-ambassador-theme", next ? "dark" : "light");', "ambassador theme safe write");
ambassador = replaceAllRequired(ambassador, '<button aria-label="إغلاق القائمة"', '<button type="button" aria-label="إغلاق القائمة"', "ambassador close buttons");
ambassador = replaceOnce(ambassador, '<aside className={`fixed inset-y-0 right-0', '<aside id="ambassador-dashboard-menu" inert={!desktopSidebar && !menuOpen} aria-hidden={!desktopSidebar && !menuOpen ? true : undefined} aria-label="قائمة لوحة السفير" className={`fixed inset-y-0 right-0', "ambassador drawer accessibility");
ambassador = replaceOnce(ambassador, '<button aria-label="فتح القائمة" onClick={() => setMenuOpen(true)}', '<button type="button" aria-label="فتح القائمة" aria-expanded={menuOpen} aria-controls="ambassador-dashboard-menu" onClick={() => setMenuOpen(true)}', "ambassador menu trigger accessibility");
ambassador = replaceOnce(
  ambassador,
  '<Link href="/" className="flex items-center justify-center gap-2 rounded-2xl bg-[#bd9850] px-4 py-3 font-black text-slate-950"><ArrowLeft size={18} />العودة إلى الموقع</Link>',
  '<Link href="/" className="flex items-center justify-center gap-2 rounded-2xl bg-[#bd9850] px-4 py-3 font-black text-slate-950"><ArrowLeft size={18} />العودة إلى الموقع</Link><button type="button" onClick={logout} disabled={loggingOut} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 px-4 py-3 font-black text-white/80 transition hover:bg-white/10 disabled:opacity-60 sm:hidden"><LogOut size={18} />{data?.isAdminPreview ? "العودة للإدارة" : loggingOut ? "جارٍ الخروج" : "تسجيل الخروج"}</button>',
  "ambassador mobile logout",
);
ambassador = replaceOnce(ambassador, '<div className="overflow-x-auto"><table className="w-full min-w-[1080px] text-right">', '<div role="region" aria-label="جدول إحالات السفير" tabIndex={0} className="overflow-x-auto focus:outline-none focus:ring-2 focus:ring-[#B89A5A] focus:ring-inset"><table className="w-full min-w-[1080px] text-right">', "ambassador referrals accessible scroll");
ambassador = replaceOnce(ambassador, '<div className="overflow-x-auto"><table className="w-full min-w-[1120px] text-right">', '<div role="region" aria-label="جدول مكافآت السفير" tabIndex={0} className="overflow-x-auto focus:outline-none focus:ring-2 focus:ring-[#B89A5A] focus:ring-inset"><table className="w-full min-w-[1120px] text-right">', "ambassador rewards accessible scroll");
write("src/app/ambassador/dashboard/page.tsx", ambassador);

let client = read("src/components/client-dashboard.tsx");
client = replaceOnce(client, '<button onClick={() => setNotificationsOpen((value) => !value)} className="relative flex items-center justify-center gap-2 rounded-xl border border-[#D8D2C4] bg-white px-4 py-3 font-bold shadow-sm">', '<button type="button" aria-expanded={notificationsOpen} aria-haspopup="dialog" onClick={() => setNotificationsOpen((value) => !value)} className="relative flex items-center justify-center gap-2 rounded-xl border border-[#D8D2C4] bg-white px-4 py-3 font-bold shadow-sm">', "client notifications accessibility");
client = replaceOnce(client, '<div className="mt-5 rounded-2xl border border-[#D8D2C4] bg-white shadow-sm">\n              <table className="w-full table-fixed text-right text-xs xl:text-sm">', '<div role="region" aria-label="جدول فواتير العميل" tabIndex={0} className="mt-5 overflow-x-auto rounded-2xl border border-[#D8D2C4] bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#B89A5A] focus:ring-inset">\n              <table className="w-full min-w-[900px] table-fixed text-right text-xs xl:text-sm">', "client invoices mobile scroll");
write("src/components/client-dashboard.tsx", client);

const testFile = `import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { readLocalStorage, writeLocalStorage } from "../src/lib/browser-storage.ts";

const read = (path) => readFileSync(new URL(\`../\${path}\`, import.meta.url), "utf8");

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
    assert.doesNotMatch(read(path), /\\blocalStorage\\./, path);
  }
});

test("Group 11 mobile drawers are inert while hidden, announce state, lock scroll, and close on Escape", () => {
  const hook = read("src/components/dashboard-mobile-drawer.ts");
  assert.match(hook, /document\\.body\\.style\\.overflow = "hidden"/);
  assert.match(hook, /event\\.key === "Escape"/);
  assert.match(hook, /matchMedia\\("\\(min-width: 1024px\\)"\\)/);

  for (const [path, id] of [
    ["src/app/partner/dashboard/page.tsx", "partner-dashboard-menu"],
    ["src/app/ambassador/dashboard/page.tsx", "ambassador-dashboard-menu"],
  ]) {
    const source = read(path);
    assert.match(source, /inert=\\{!desktopSidebar && !menuOpen\\}/, path);
    assert.match(source, /aria-hidden=\\{!desktopSidebar && !menuOpen \\? true : undefined\\}/, path);
    assert.match(source, new RegExp(\`aria-controls="\${id}"\`), path);
    assert.match(source, /aria-expanded=\\{menuOpen\\}/, path);
    assert.match(source, /sm:hidden[^\n]*<LogOut/, path);
  }
});

test("Group 11 dashboard tables remain readable and keyboard-scrollable on narrow screens", () => {
  const client = read("src/components/client-dashboard.tsx");
  assert.match(client, /aria-label="جدول فواتير العميل"[^>]*tabIndex=\\{0\\}[^>]*overflow-x-auto/);
  assert.match(client, /min-w-\\[900px\\]/);

  const partner = read("src/app/partner/dashboard/page.tsx");
  assert.match(partner, /aria-label="جدول مستحقات المشاريع"[^>]*tabIndex=\\{0\\}/);

  const ambassador = read("src/app/ambassador/dashboard/page.tsx");
  assert.match(ambassador, /aria-label="جدول إحالات السفير"[^>]*tabIndex=\\{0\\}/);
  assert.match(ambassador, /aria-label="جدول مكافآت السفير"[^>]*tabIndex=\\{0\\}/);
});
`;
write("tests/group-11-dashboard-mobile-storage.test.mjs", testFile);

console.log("Group 11 deterministic patch applied.");
