import { getCurrentPartner } from "@/lib/current-partner";
import { redirect } from "next/navigation";

export default async function PartnerDashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentPartner();
  if (!user?.partner || user.role !== "PARTNER" || user.partner.status !== "ACTIVE") {
    redirect("/partner/login");
  }
  return children;
}
