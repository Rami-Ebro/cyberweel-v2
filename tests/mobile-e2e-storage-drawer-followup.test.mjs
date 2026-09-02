import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(path, "utf8");

test("client parity tools use safe storage and expose an accessible mobile drawer", () => {
  const source = read("src/components/client/client-dashboard-parity-tools.tsx");
  assert.ok(source.includes("readLocalStorage(CLIENT_THEME_KEY)"));
  assert.ok(source.includes("writeLocalStorage(CLIENT_THEME_KEY"));
  assert.ok(!source.includes("localStorage."));
  assert.ok(source.includes('aria-controls="client-dashboard-menu"'));
  assert.ok(source.includes("aria-expanded={menuOpen}"));
  assert.ok(source.includes('drawer.id = "client-dashboard-menu"'));
  assert.ok(source.includes("drawer.inert = hidden"));
  assert.ok(source.includes('drawer.setAttribute("aria-hidden"'));
  assert.ok(source.includes("useDashboardMobileDrawer(menuOpen, setMenuOpen)"));
});

test("partner delivery feedback survives blocked session storage", () => {
  const source = read("src/components/partner/partner-delivery-feedback.tsx");
  assert.ok(source.includes("readSessionStorage(STORAGE_KEY)"));
  assert.ok(source.includes("removeSessionStorage(STORAGE_KEY)"));
  assert.ok(source.includes("writeSessionStorage(STORAGE_KEY, message)"));
  assert.ok(!source.includes("sessionStorage."));
});

test("browser storage helpers fail closed for both local and session storage", () => {
  const source = read("src/lib/browser-storage.ts");
  for (const name of ["readLocalStorage", "writeLocalStorage", "readSessionStorage", "writeSessionStorage", "removeSessionStorage"]) {
    assert.ok(source.includes(`export function ${name}(`), `missing ${name}`);
  }
  assert.ok((source.match(/catch \{/g) || []).length >= 5);
});
