import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const client = fs.readFileSync("src/components/client/client-dashboard-parity-tools.tsx", "utf8");
const feedback = fs.readFileSync("src/components/partner/partner-delivery-feedback.tsx", "utf8");
const storage = fs.readFileSync("src/lib/browser-storage.ts", "utf8");

test("client mobile parity tools use the shared safe storage and drawer primitives", () => {
  assert.match(client, /useDashboardMobileDrawer\(menuOpen, setMenuOpen\)/);
  assert.match(client, /readLocalStorage\(CLIENT_THEME_KEY\)/);
  assert.match(client, /writeLocalStorage\(CLIENT_THEME_KEY/);
  assert.doesNotMatch(client, /localStorage\./);
});

test("client mobile drawer exposes stable accessibility state", () => {
  assert.ok(client.includes('aside.id = "client-dashboard-menu";'));
  assert.ok(client.includes('aside.setAttribute("aria-hidden", hidden ? "true" : "false");'));
  assert.ok(client.includes("aside.inert = hidden;"));
  assert.match(client, /aria-controls="client-dashboard-menu"/);
  assert.match(client, /aria-expanded=\{menuOpen\}/);
  assert.ok(client.includes('[data-cw-client-notifications="true"] > [role="dialog"]'));
  assert.ok(client.includes("inset-inline: 1rem !important;"));
  assert.ok(client.includes("position: fixed !important;"));
});

test("partner delivery feedback never accesses sessionStorage directly", () => {
  assert.match(feedback, /readSessionStorage\(STORAGE_KEY\)/);
  assert.match(feedback, /removeSessionStorage\(STORAGE_KEY\)/);
  assert.match(feedback, /writeSessionStorage\(STORAGE_KEY, message\)/);
  assert.doesNotMatch(feedback, /sessionStorage\./);
  assert.match(storage, /export function readSessionStorage/);
  assert.match(storage, /export function writeSessionStorage/);
  assert.match(storage, /export function removeSessionStorage/);
});
