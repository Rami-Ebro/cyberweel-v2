import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import styles from "./current-level.module.css";
import { RewardViewPolish } from "./reward-view-polish";
import { DashboardVisualPolish } from "@/components/dashboard-visual-polish";
import { AmbassadorHeaderTools } from "@/components/ambassador/ambassador-header-tools";
import { currentAmbassadorFromCookies } from "@/lib/ambassador-auth";
import { hasAdminPermission } from "@/lib/admin-auth";

export default async function AmbassadorDashboardLayout({ children }: { children: ReactNode }) {
  const adminPreviewAllowed = await hasAdminPermission("ambassadors");
  if (!adminPreviewAllowed) {
    const user = await currentAmbassadorFromCookies();
    if (!user) redirect("/login?next=/ambassador/dashboard");
    if (!user.ambassador?.profileCompletedAt) {
      redirect("/complete-profile?capability=AMBASSADOR");
    }
  }

  return (
    <div className={styles.scope}>
      {children}
      <RewardViewPolish />
      <DashboardVisualPolish mode="ambassador" />
      <AmbassadorHeaderTools />
    </div>
  );
}
