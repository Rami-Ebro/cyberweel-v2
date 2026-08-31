import type { ReactNode } from "react";
import { AdminActionFeedback } from "@/components/admin/admin-action-feedback";
import { AdminShellAccessProvider } from "@/components/admin/admin-shell-access";
import { requireAdminShellAccess } from "@/lib/admin-auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const access = await requireAdminShellAccess();

  return (
    <AdminShellAccessProvider access={access}>
      <AdminActionFeedback />
      {children}
      <style>{`
        [data-admin-shell-root="true"].dark > div > section [class^="bg-emerald-50/"],
        [data-admin-shell-root="true"].dark > div > section [class*=" bg-emerald-50/"],
        [data-admin-shell-root="true"].dark > div > section [class^="bg-emerald-100/"],
        [data-admin-shell-root="true"].dark > div > section [class*=" bg-emerald-100/"] { background-color: #052e16 !important; }

        [data-admin-shell-root="true"].dark > div > section [class^="bg-rose-50/"],
        [data-admin-shell-root="true"].dark > div > section [class*=" bg-rose-50/"],
        [data-admin-shell-root="true"].dark > div > section [class^="bg-rose-100/"],
        [data-admin-shell-root="true"].dark > div > section [class*=" bg-rose-100/"],
        [data-admin-shell-root="true"].dark > div > section [class^="bg-red-50/"],
        [data-admin-shell-root="true"].dark > div > section [class*=" bg-red-50/"],
        [data-admin-shell-root="true"].dark > div > section [class^="bg-red-100/"],
        [data-admin-shell-root="true"].dark > div > section [class*=" bg-red-100/"] { background-color: #4c0519 !important; }

        [data-admin-shell-root="true"].dark > div > section [class^="bg-amber-50/"],
        [data-admin-shell-root="true"].dark > div > section [class*=" bg-amber-50/"],
        [data-admin-shell-root="true"].dark > div > section [class^="bg-amber-100/"],
        [data-admin-shell-root="true"].dark > div > section [class*=" bg-amber-100/"] { background-color: #451a03 !important; }

        [data-admin-shell-root="true"].dark > div > section [class^="bg-sky-50/"],
        [data-admin-shell-root="true"].dark > div > section [class*=" bg-sky-50/"],
        [data-admin-shell-root="true"].dark > div > section [class^="bg-sky-100/"],
        [data-admin-shell-root="true"].dark > div > section [class*=" bg-sky-100/"] { background-color: #082f49 !important; }

        [data-admin-shell-root="true"].dark > div > section [class^="bg-violet-50/"],
        [data-admin-shell-root="true"].dark > div > section [class*=" bg-violet-50/"],
        [data-admin-shell-root="true"].dark > div > section [class^="bg-violet-100/"],
        [data-admin-shell-root="true"].dark > div > section [class*=" bg-violet-100/"] { background-color: #2e1065 !important; }

        [data-admin-shell-root="true"].dark > div > section [class^="bg-teal-50/"],
        [data-admin-shell-root="true"].dark > div > section [class*=" bg-teal-50/"],
        [data-admin-shell-root="true"].dark > div > section [class^="bg-teal-100/"],
        [data-admin-shell-root="true"].dark > div > section [class*=" bg-teal-100/"] { background-color: #042f2e !important; }
      `}</style>
    </AdminShellAccessProvider>
  );
}
