import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { currentClientAccessFromCookies } from "@/lib/client-access";

export default async function ClientLayout({ children }: { children: ReactNode }) {
  if (!(await currentClientAccessFromCookies())) {
    redirect("/login?next=/client/dashboard");
  }

  return children;
}
