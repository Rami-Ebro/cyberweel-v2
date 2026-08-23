import type { ReactNode } from "react";
import styles from "./current-level.module.css";

export default function AmbassadorDashboardLayout({ children }: { children: ReactNode }) {
  return <div className={styles.scope}>{children}</div>;
}
