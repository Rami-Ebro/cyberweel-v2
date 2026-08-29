import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const shellPath = path.join(root, "src/components/admin/admin-shell.tsx");
const adminRoot = path.join(root, "src/app/admin");

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function walkTsx(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return walkTsx(target);
    return entry.isFile() && entry.name.endsWith(".tsx") ? [target] : [];
  });
}

function tokensFromAdminFiles(pattern) {
  const tokens = new Set();
  for (const filePath of walkTsx(adminRoot)) {
    const source = read(filePath);
    for (const match of source.matchAll(pattern)) tokens.add(match[1]);
  }
  return [...tokens].sort();
}

test("admin theme storage failures do not break the visual toggle", () => {
  const shell = read(shellPath);
  assert.match(shell, /try\s*\{\s*setDarkMode\(window\.localStorage\.getItem\(ADMIN_THEME_KEY\) === "dark"\);/s);
  assert.match(shell, /try\s*\{\s*window\.localStorage\.setItem\(ADMIN_THEME_KEY, next \? "dark" : "light"\);/s);
  assert.match(shell, /catch\s*\{[\s\S]*?return next;/);
});

test("admin shell maps every semantic light status background used by admin pages", () => {
  const shell = read(shellPath);
  const tokens = tokensFromAdminFiles(/\b(bg-(?:emerald|rose|red|amber|sky|violet|teal)-(?:50|100)(?:\/\d+)?)\b/g);
  assert.ok(tokens.length > 0, "expected semantic status backgrounds in admin pages");
  for (const token of tokens) {
    assert.ok(shell.includes(`[class~="${token}"]`), `missing dark background mapping for ${token}`);
  }
});

test("admin shell maps semantic status borders and text used by admin pages", () => {
  const shell = read(shellPath);
  const borderTokens = tokensFromAdminFiles(/\b(border-(?:emerald|rose|red|amber|sky|violet|teal)-(?:200|300))\b/g);
  const textTokens = tokensFromAdminFiles(/\b(text-(?:emerald|rose|red|amber|sky|violet|teal)-(?:700|800|900|950))\b/g);
  for (const token of [...borderTokens, ...textTokens]) {
    assert.ok(shell.includes(`[class~="${token}"]`), `missing dark semantic mapping for ${token}`);
  }
});

test("admin shell covers shared translucent and warm light surfaces", () => {
  const shell = read(shellPath);
  for (const token of [
    "bg-white/70",
    "bg-[#F3EEE5]",
    "bg-[#F4F1EA]",
    "bg-[#FCFAF6]",
    "bg-[#FBF8F2]",
  ]) {
    assert.ok(shell.includes(`[class~="${token}"]`), `missing dark surface mapping for ${token}`);
  }
});
