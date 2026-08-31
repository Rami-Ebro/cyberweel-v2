"use client";

import { createContext, type ReactNode, useContext } from "react";

export type AdminShellAccess = {
  isOwner: boolean;
  permissions: string[];
};

const AdminShellAccessContext = createContext<AdminShellAccess | null>(null);

export function AdminShellAccessProvider({ access, children }: { access: AdminShellAccess; children: ReactNode }) {
  return <AdminShellAccessContext.Provider value={access}>{children}</AdminShellAccessContext.Provider>;
}

export function useAdminShellAccess() {
  const access = useContext(AdminShellAccessContext);
  if (!access) throw new Error("AdminShellAccessProvider is required for AdminShell");
  return access;
}
