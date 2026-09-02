import fs from "node:fs/promises";

async function replaceExact(path, before, after) {
  const source = await fs.readFile(path, "utf8");
  if (!source.includes(before)) throw new Error(`${path}: expected marker not found`);
  const occurrences = source.split(before).length - 1;
  if (occurrences !== 1) throw new Error(`${path}: expected one marker, found ${occurrences}`);
  await fs.writeFile(path, source.replace(before, after));
}

const clientPath = "src/components/client/client-dashboard-parity-tools.tsx";
await replaceExact(
  clientPath,
  'import { useRouter } from "next/navigation";\n',
  'import { useRouter } from "next/navigation";\nimport { useDashboardMobileDrawer } from "@/components/dashboard-mobile-drawer";\nimport { readLocalStorage, writeLocalStorage } from "@/lib/browser-storage";\n',
);
await replaceExact(
  clientPath,
  '  const [menuOpen, setMenuOpen] = useState(false);\n',
  '  const [menuOpen, setMenuOpen] = useState(false);\n  const { desktopSidebar } = useDashboardMobileDrawer(menuOpen, setMenuOpen);\n',
);
await replaceExact(
  clientPath,
  '    queueMicrotask(() => setDarkMode(localStorage.getItem(CLIENT_THEME_KEY) === "dark"));',
  '    queueMicrotask(() => setDarkMode(readLocalStorage(CLIENT_THEME_KEY) === "dark"));',
);
await replaceExact(
  clientPath,
  `  useEffect(() => {\n    const root = rootRef.current;\n    if (!root) return;\n    root.dataset.cwClientMenuOpen = menuOpen ? "true" : "false";\n  }, [menuOpen, controls]);`,
  `  useEffect(() => {\n    const root = rootRef.current;\n    if (!root || !aside) return;\n\n    root.dataset.cwClientMenuOpen = menuOpen ? "true" : "false";\n    aside.id = "client-dashboard-menu";\n    const hidden = !desktopSidebar && !menuOpen;\n    aside.setAttribute("aria-hidden", hidden ? "true" : "false");\n    aside.inert = hidden;\n\n    return () => {\n      aside.inert = false;\n      aside.removeAttribute("aria-hidden");\n      if (aside.id === "client-dashboard-menu") aside.removeAttribute("id");\n    };\n  }, [aside, controls, desktopSidebar, menuOpen]);`,
);
await replaceExact(
  clientPath,
  `\n  useEffect(() => {\n    if (!menuOpen) return;\n    const closeOnEscape = (event: KeyboardEvent) => {\n      if (event.key === "Escape") setMenuOpen(false);\n    };\n    document.addEventListener("keydown", closeOnEscape);\n    return () => document.removeEventListener("keydown", closeOnEscape);\n  }, [menuOpen]);\n`,
  "\n",
);
await replaceExact(
  clientPath,
  '      localStorage.setItem(CLIENT_THEME_KEY, next ? "dark" : "light");',
  '      writeLocalStorage(CLIENT_THEME_KEY, next ? "dark" : "light");',
);
await replaceExact(
  clientPath,
  `            aria-label="فتح القائمة"\n            onClick={() => setMenuOpen(true)}`,
  `            aria-label="فتح القائمة"\n            aria-controls="client-dashboard-menu"\n            aria-expanded={menuOpen}\n            onClick={() => setMenuOpen(true)}`,
);

const storagePath = "src/lib/browser-storage.ts";
const storageSource = await fs.readFile(storagePath, "utf8");
if (storageSource.includes("readSessionStorage")) throw new Error("session storage helpers already exist unexpectedly");
await fs.writeFile(storagePath, `${storageSource.trimEnd()}\n\nexport function readSessionStorage(key: string): string | null {\n  if (typeof window === "undefined") return null;\n  try {\n    return window.sessionStorage.getItem(key);\n  } catch {\n    return null;\n  }\n}\n\nexport function writeSessionStorage(key: string, value: string): boolean {\n  if (typeof window === "undefined") return false;\n  try {\n    window.sessionStorage.setItem(key, value);\n    return true;\n  } catch {\n    return false;\n  }\n}\n\nexport function removeSessionStorage(key: string): boolean {\n  if (typeof window === "undefined") return false;\n  try {\n    window.sessionStorage.removeItem(key);\n    return true;\n  } catch {\n    return false;\n  }\n}\n`);

const feedbackPath = "src/components/partner/partner-delivery-feedback.tsx";
await replaceExact(
  feedbackPath,
  'import { useEffect, useRef, useState } from "react";\n',
  'import { useEffect, useRef, useState } from "react";\nimport { readSessionStorage, removeSessionStorage, writeSessionStorage } from "@/lib/browser-storage";\n',
);
await replaceExact(feedbackPath, '      const stored = sessionStorage.getItem(STORAGE_KEY);', '      const stored = readSessionStorage(STORAGE_KEY);');
await replaceExact(feedbackPath, '        sessionStorage.removeItem(STORAGE_KEY);', '        removeSessionStorage(STORAGE_KEY);');
await replaceExact(feedbackPath, '      if (kind === "success") sessionStorage.setItem(STORAGE_KEY, message);', '      if (kind === "success") writeSessionStorage(STORAGE_KEY, message);');

const testPath = "tests/group-11-mobile-e2e-followup.test.mjs";
await fs.writeFile(testPath, `import test from "node:test";\nimport assert from "node:assert/strict";\nimport fs from "node:fs";\n\nconst client = fs.readFileSync("src/components/client/client-dashboard-parity-tools.tsx", "utf8");\nconst feedback = fs.readFileSync("src/components/partner/partner-delivery-feedback.tsx", "utf8");\nconst storage = fs.readFileSync("src/lib/browser-storage.ts", "utf8");\n\ntest("client mobile parity tools use the shared safe storage and drawer primitives", () => {\n  assert.match(client, /useDashboardMobileDrawer\\(menuOpen, setMenuOpen\\)/);\n  assert.match(client, /readLocalStorage\\(CLIENT_THEME_KEY\\)/);\n  assert.match(client, /writeLocalStorage\\(CLIENT_THEME_KEY/);\n  assert.doesNotMatch(client, /(?<!read|write)LocalStorage|localStorage\\./);\n});\n\ntest("client mobile drawer exposes stable accessibility state", () => {\n  assert.match(client, /aside\\.id = "client-dashboard-menu"/);\n  assert.match(client, /aside\\.setAttribute\\("aria-hidden", hidden \? "true" : "false"\\)/);\n  assert.match(client, /aside\\.inert = hidden/);\n  assert.match(client, /aria-controls="client-dashboard-menu"/);\n  assert.match(client, /aria-expanded=\\{menuOpen\\}/);\n});\n\ntest("partner delivery feedback never accesses sessionStorage directly", () => {\n  assert.match(feedback, /readSessionStorage\\(STORAGE_KEY\\)/);\n  assert.match(feedback, /removeSessionStorage\\(STORAGE_KEY\\)/);\n  assert.match(feedback, /writeSessionStorage\\(STORAGE_KEY, message\\)/);\n  assert.doesNotMatch(feedback, /sessionStorage\\./);\n  assert.match(storage, /export function readSessionStorage/);\n  assert.match(storage, /export function writeSessionStorage/);\n  assert.match(storage, /export function removeSessionStorage/);\n});\n`);

await fs.rm("scripts/apply-mobile-e2e-followup.mjs", { force: true });
await fs.rm(".github/workflows/tmp-mobile-e2e-followup.yml", { force: true });
