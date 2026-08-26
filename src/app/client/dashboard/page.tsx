import { ClientDashboard } from "@/components/client-dashboard";
import { DashboardVisualPolish } from "@/components/dashboard-visual-polish";
import { ClientDashboardParityTools } from "@/components/client/client-dashboard-parity-tools";

export default function ClientDashboardPage() {
  return <><ClientDashboard /><DashboardVisualPolish mode="client" /><ClientDashboardParityTools /></>;
}
