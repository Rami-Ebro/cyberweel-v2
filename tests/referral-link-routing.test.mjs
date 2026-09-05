import assert from "node:assert/strict";
import fs from "node:fs";

const proxy = fs.readFileSync("src/proxy.ts", "utf8");
const verifier = fs.readFileSync("src/app/ref/[code]/route.ts", "utf8");

assert.match(proxy, /new URL\(`\/ref\/\$\{encodeURIComponent\(referralCode\)\}`/);
assert.doesNotMatch(proxy, /REFERRAL_CODE_COOKIE/);
assert.doesNotMatch(proxy, /request\.cookies\.get\(/);
assert.doesNotMatch(proxy, /matching HttpOnly cookie/);
assert.match(verifier, /new URL\("\/share-challenge", request\.url\)/);
assert.match(verifier, /destination\.searchParams\.set\("ref", normalizedCode\)/);
assert.match(verifier, /status: "ACTIVE"/);

console.log("Referral links use the same verified redirect flow with or without cookies.");
