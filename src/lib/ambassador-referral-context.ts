export const TRUSTED_REFERRAL_SELECT = {
  name: true,
  company: true,
  status: true,
  updatedAt: true,
} as const;

export function ownedReferralWhere(referralId: string, ambassadorId: string) {
  return {
    id: referralId,
    ambassadorId,
  } as const;
}

export type TrustedReferralContext = {
  name: string | null;
  company: string | null;
  status: string;
  updatedAt: string | null;
};

export function toTrustedReferralContext(referral: {
  name: string | null;
  company: string | null;
  status: string;
  updatedAt: Date | string | null;
}): TrustedReferralContext {
  return {
    name: referral.name,
    company: referral.company,
    status: referral.status,
    updatedAt: referral.updatedAt ? new Date(referral.updatedAt).toISOString() : null,
  };
}