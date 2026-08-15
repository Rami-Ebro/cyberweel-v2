const PASSWORD_ACCESS_ROLES = new Set(["PARTNER", "AMBASSADOR", "CLIENT"]);

export function canUsePasswordAccess(role: string) {
  return PASSWORD_ACCESS_ROLES.has(role);
}
