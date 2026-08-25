import { getCurrentPartner } from "@/lib/current-partner";
import { hasAdminPermission } from "@/lib/admin-auth";
import { PartnerDeliveryWorkspace } from "@/components/partner/partner-delivery-workspace";
import { PartnerDeliveryFeedback } from "@/components/partner/partner-delivery-feedback";
import { PartnerHeaderTools } from "@/components/partner/partner-header-tools";
import { PartnerProjectDeliveryLauncher } from "@/components/partner/partner-project-delivery-launcher";
import { DashboardVisualPolish } from "@/components/dashboard-visual-polish";
import { redirect } from "next/navigation";

export default async function PartnerDashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentPartner();
  if (await hasAdminPermission("partners")) {
    return <><PartnerDeliveryWorkspace /><PartnerDeliveryFeedback /><PartnerHeaderTools /><PartnerProjectDeliveryLauncher /><DashboardVisualPolish mode="partner" />{children}</>;
  }
  if (!user?.partner || user.partner.status !== "ACTIVE") {
    redirect("/login");
  }
  if (!user.partner.profileCompletedAt) redirect("/complete-profile?capability=PARTNER");
  return <><PartnerDeliveryWorkspace /><PartnerDeliveryFeedback /><PartnerHeaderTools /><PartnerProjectDeliveryLauncher /><DashboardVisualPolish mode="partner" />{children}</>;
}
