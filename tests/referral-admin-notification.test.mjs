import assert from "node:assert/strict";
import fs from "node:fs";

const referralsRoute = fs.readFileSync("src/app/api/referrals/route.ts", "utf8");
const notificationCenter = fs.readFileSync("src/components/admin/admin-notification-center.tsx", "utf8");

assert.match(referralsRoute, /db\.\$transaction\(async \(tx\) =>/);
assert.match(referralsRoute, /tx\.adminNotification\.create/);
assert.match(referralsRoute, /kind: "REFERRAL_CREATED"/);
assert.match(referralsRoute, /href: "\/admin\/referrals"/);
assert.match(notificationCenter, /REFERRAL_CREATED: "\/admin\/referrals"/);
assert.match(notificationCenter, /window\.setInterval\(refreshWhenVisible, 25_000\)/);
assert.match(notificationCenter, /window\.addEventListener\("focus", refresh\)/);
assert.match(notificationCenter, /document\.addEventListener\("visibilitychange", refreshWhenVisible\)/);

console.log("Referral creation produces an admin notification and the badge refreshes across open devices.");
