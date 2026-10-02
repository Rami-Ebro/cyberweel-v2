export type FollowUpEligibleReferral = {
  id: string;
  status: string;
  createdAt: string;
  updatedAt?: string | null;
};

const FOLLOW_UP_STATUSES = ["NEW", "CONTACTED", "INTERESTED", "AWAITING_RESPONSE"] as const;

export function isFollowUpEligible(status: string): boolean {
  return FOLLOW_UP_STATUSES.includes(status as (typeof FOLLOW_UP_STATUSES)[number]);
}

export function getFollowUpPriorityDate(referral: FollowUpEligibleReferral): string {
  if (referral.updatedAt) {
    const time = new Date(referral.updatedAt).getTime();
    if (Number.isFinite(time)) return referral.updatedAt;
  }
  return referral.createdAt;
}

export function daysSince(value: string): number {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return 0;
  return Math.max(0, Math.floor((Date.now() - time) / 86_400_000));
}

export function sortFollowUpsByPriority(
  referrals: FollowUpEligibleReferral[]
): FollowUpEligibleReferral[] {
  return [...referrals].sort(
    (a, b) => daysSince(getFollowUpPriorityDate(b)) - daysSince(getFollowUpPriorityDate(a))
  );
}

export function filterAndSortFollowUps(
  referrals: FollowUpEligibleReferral[]
): FollowUpEligibleReferral[] {
  return sortFollowUpsByPriority(referrals.filter((r) => isFollowUpEligible(r.status)));
}