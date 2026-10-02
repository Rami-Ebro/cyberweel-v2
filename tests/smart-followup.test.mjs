import assert from "node:assert/strict";
import test from "node:test";
import { filterAndSortFollowUps, getFollowUpPriorityDate, daysSince, isFollowUpEligible } from "../src/lib/ambassador-followup.ts";

const now = Date.now();
const oneDay = 86_400_000;
const fiveDaysAgo = new Date(now - 5 * oneDay).toISOString();
const twoDaysAgo = new Date(now - 2 * oneDay).toISOString();
const tenDaysAgo = new Date(now - 10 * oneDay).toISOString();
const fifteenDaysAgo = new Date(now - 15 * oneDay).toISOString();

test("isFollowUpEligible returns true for eligible statuses", () => {
  assert.equal(isFollowUpEligible("NEW"), true);
  assert.equal(isFollowUpEligible("CONTACTED"), true);
  assert.equal(isFollowUpEligible("INTERESTED"), true);
  assert.equal(isFollowUpEligible("AWAITING_RESPONSE"), true);
});

test("isFollowUpEligible returns false for non-eligible statuses", () => {
  assert.equal(isFollowUpEligible("CONVERTED"), false);
  assert.equal(isFollowUpEligible("REJECTED"), false);
  assert.equal(isFollowUpEligible("CANCELLED"), false);
  assert.equal(isFollowUpEligible("NOT_INTERESTED"), false);
});

test("getFollowUpPriorityDate uses updatedAt when valid", () => {
  const referral = { updatedAt: twoDaysAgo, createdAt: fifteenDaysAgo };
  assert.equal(getFollowUpPriorityDate(referral), twoDaysAgo);
});

test("getFollowUpPriorityDate falls back to createdAt when updatedAt is invalid", () => {
  const referral = { updatedAt: "invalid-date", createdAt: fifteenDaysAgo };
  assert.equal(getFollowUpPriorityDate(referral), fifteenDaysAgo);
});

test("getFollowUpPriorityDate falls back to createdAt when updatedAt is missing", () => {
  const referral = { createdAt: fifteenDaysAgo };
  assert.equal(getFollowUpPriorityDate(referral), fifteenDaysAgo);
});

test("daysSince returns 0 for invalid dates", () => {
  assert.equal(daysSince("invalid-date"), 0);
});

test("filterAndSortFollowUps: older updatedAt gets higher priority", () => {
  const referrals = [
    { id: "1", updatedAt: fiveDaysAgo, createdAt: fifteenDaysAgo, status: "NEW" },
    { id: "2", updatedAt: twoDaysAgo, createdAt: tenDaysAgo, status: "CONTACTED" },
    { id: "3", updatedAt: tenDaysAgo, createdAt: fifteenDaysAgo, status: "INTERESTED" },
  ];

  const sorted = filterAndSortFollowUps(referrals);

  assert.equal(sorted[0].id, "3"); // 10 days ago (oldest updatedAt)
  assert.equal(sorted[1].id, "1"); // 5 days ago
  assert.equal(sorted[2].id, "2"); // 2 days ago (most recent updatedAt)
});

test("filterAndSortFollowUps falls back to createdAt when updatedAt missing", () => {
  const referrals = [
    { id: "1", updatedAt: twoDaysAgo, createdAt: fifteenDaysAgo, status: "NEW" },
    { id: "2", createdAt: fiveDaysAgo, status: "CONTACTED" }, // no updatedAt
    { id: "3", updatedAt: tenDaysAgo, createdAt: fifteenDaysAgo, status: "INTERESTED" },
  ];

  const sorted = filterAndSortFollowUps(referrals);

  // id:2 has no updatedAt, falls back to createdAt (5 days ago)
  // id:1 has updatedAt 2 days ago
  // id:3 has updatedAt 10 days ago (oldest)
  assert.equal(sorted[0].id, "3"); // 10 days ago
  assert.equal(sorted[1].id, "2"); // 5 days ago (fallback to createdAt)
  assert.equal(sorted[2].id, "1"); // 2 days ago
});

test("filterAndSortFollowUps filters out non-eligible statuses", () => {
  const referrals = [
    { id: "1", updatedAt: fiveDaysAgo, createdAt: fifteenDaysAgo, status: "NEW" },
    { id: "2", updatedAt: twoDaysAgo, createdAt: tenDaysAgo, status: "CONVERTED" },
    { id: "3", updatedAt: tenDaysAgo, createdAt: fifteenDaysAgo, status: "REJECTED" },
  ];

  const sorted = filterAndSortFollowUps(referrals);

  assert.equal(sorted.length, 1);
  assert.equal(sorted[0].id, "1");
});