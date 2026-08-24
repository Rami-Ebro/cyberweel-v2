import { getCurrentPartner } from "@/lib/current-partner";
import { hasAdminPermission } from "@/lib/admin-auth";
import { PartnerDeliveryWorkspace } from "@/components/partner/partner-delivery-workspace";
import { redirect } from "next/navigation";

export default async function PartnerDashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentPartner();
  if (await hasAdminPermission("partners")) {
    return <><PartnerDeliveryWorkspace />{children}</>;
  }
  if (!user?.partner || user.partner.status !== "ACTIVE") {
    redirect("/login");
  }
  if (!user.partner.profileCompletedAt) redirect("/complete-profile?capability=PARTNER");
  return <><PartnerDeliveryWorkspace />{children}</>;
}
