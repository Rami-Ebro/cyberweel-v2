export type FollowUpReferralBase = {
  id: string;
  status: string;
  createdAt: string;
  updatedAt?: string | null;
  followUpEligible?: boolean;
};

const FOLLOW_UP_STATUSES = ["NEW", "CONTACTED", "INTERESTED", "AWAITING_RESPONSE"] as const;

export function isFollowUpEligible(status: string): boolean {
  return FOLLOW_UP_STATUSES.includes(status as (typeof FOLLOW_UP_STATUSES)[number]);
}

export function getFollowUpPriorityDate(referral: FollowUpReferralBase): string {
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

export function sortFollowUpsByPriority<T extends FollowUpReferralBase>(
  referrals: readonly T[]
): T[] {
  return [...referrals].sort(
    (a, b) => daysSince(getFollowUpPriorityDate(b)) - daysSince(getFollowUpPriorityDate(a))
  );
}

export function filterAndSortFollowUps<T extends FollowUpReferralBase>(
  referrals: readonly T[]
): T[] {
  return sortFollowUpsByPriority(
    referrals.filter((r) => r.followUpEligible ?? isFollowUpEligible(r.status))
  );
}