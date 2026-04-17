import { DashboardProvider } from "@/components/dashboard/DashboardContext";
import { StarterPlanUsageBar } from "@/components/dashboard/StarterPlanUsageBar";
import { Sidebar } from "@/components/ui/Sidebar";
import {
  countCompletedOrdersInCurrentMonth,
  mockAlertsHistory,
  mockOrders,
  mockUser,
} from "@/lib/mock-data";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const alertCount = mockAlertsHistory.filter((a) => !a.read).length;
  const starterOrdersThisMonth = countCompletedOrdersInCurrentMonth(mockOrders);
  const showStarterUsage = mockUser.plan === "starter";

  return (
    <DashboardProvider>
      <div className="flex min-h-screen bg-margify-bg">
        <Sidebar
          userName={mockUser.full_name}
          userEmail={mockUser.email}
          alertCount={alertCount}
        />
        <main className="min-h-screen min-w-0 flex-1 px-4 pb-12 pt-[4.5rem] md:ml-60 md:px-8 md:pt-8">
          {showStarterUsage ? <StarterPlanUsageBar ordersUsed={starterOrdersThisMonth} /> : null}
          {children}
        </main>
      </div>
    </DashboardProvider>
  );
}
