import type { ReactNode } from "react";
import { AdminActionFeedback } from "@/components/admin/admin-action-feedback";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AdminActionFeedback />
      {children}
    </>
  );
}
