import { cookies } from "next/headers";
import { DashboardProvider } from "@/components/dashboard/DashboardContext";
import { DemoModeProvider } from "@/components/dashboard/DemoModeContext";
import { StarterPlanUsageBar } from "@/components/dashboard/StarterPlanUsageBar";
import { DEMO_USER_LABEL } from "@/lib/demo-user";
import { Sidebar } from "@/components/ui/Sidebar";
import {
  countCompletedOrdersInCurrentMonth,
  mockAlertsHistory,
  mockOrders,
  mockUser,
} from "@/lib/mock-data";

const DEMO_COOKIE = "margify_demo";

/** Evita prerender estático: `cookies()` requiere request en runtime (Vercel / producción). */
export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const isDemo = cookieStore.get(DEMO_COOKIE)?.value === "1";
  const alertCount = mockAlertsHistory.filter((a) => !a.read).length;
  const starterOrdersThisMonth = countCompletedOrdersInCurrentMonth(mockOrders);
  const showStarterUsage = mockUser.plan === "starter" && !isDemo;

  const displayName = isDemo ? DEMO_USER_LABEL.full_name : mockUser.full_name;
  const displayEmail = isDemo ? DEMO_USER_LABEL.email : mockUser.email;

  return (
    <DemoModeProvider isDemo={isDemo}>
      <DashboardProvider>
        <div className="flex min-h-screen bg-margify-bg">
          <Sidebar userName={displayName} userEmail={displayEmail} alertCount={alertCount} />
          <main className="min-h-screen min-w-0 flex-1 px-4 pb-12 pt-[4.5rem] md:ml-60 md:px-8 md:pt-8">
            {showStarterUsage ? <StarterPlanUsageBar ordersUsed={starterOrdersThisMonth} /> : null}
            {children}
          </main>
        </div>
      </DashboardProvider>
    </DemoModeProvider>
  );
}
