import { Suspense, type ReactNode } from "react";
import { AmbassadorWorkspaceNavigation } from "@/components/ambassador/ambassador-workspace-navigation";

export default function AmbassadorActionCenterLayout({ children }: { children: ReactNode }) {
  return (
    <div className="pb-20 lg:pb-0">
      {children}
      <Suspense fallback={null}><AmbassadorWorkspaceNavigation actionCenter /></Suspense>
    </div>
  );
}
