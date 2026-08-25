import type { ReactNode } from "react";
import styles from "./current-level.module.css";
import { RewardViewPolish } from "./reward-view-polish";
import { DashboardVisualPolish } from "@/components/dashboard-visual-polish";
import { AmbassadorHeaderTools } from "@/components/ambassador/ambassador-header-tools";

export default function AmbassadorDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.scope}>
      {children}
      <RewardViewPolish />
      <DashboardVisualPolish mode="ambassador" />
      <AmbassadorHeaderTools />
    </div>
  );
}
