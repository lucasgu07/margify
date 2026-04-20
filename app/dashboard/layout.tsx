import { cookies } from "next/headers";
import { DashboardProvider } from "@/components/dashboard/DashboardContext";
import { DemoModeProvider } from "@/components/dashboard/DemoModeContext";
import { StarterPlanUsageBar } from "@/components/dashboard/StarterPlanUsageBar";
import { Sidebar } from "@/components/ui/Sidebar";
import { DEMO_USER_LABEL } from "@/lib/demo-user";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  countCompletedOrdersInCurrentMonth,
  mockAlertsHistory,
  mockOrders,
  mockUser,
} from "@/lib/mock-data";

const DEMO_COOKIE = "margify_demo";

/** Evita prerender estático: `cookies()` requiere request en runtime (Vercel / producción). */
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const demoCookie = cookieStore.get(DEMO_COOKIE)?.value === "1";
  const supabase = createServerSupabaseClient();
  const { data: authData } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const user = authData.user;

  /** Demo = entró con "Ver demo" (cookie) y no hay sesión de Supabase. Con cuenta siempre es false. */
  const isDemo = Boolean(demoCookie && !user);

  let full_name: string;
  let email: string;
  if (isDemo) {
    full_name = DEMO_USER_LABEL.full_name;
    email = DEMO_USER_LABEL.email;
  } else if (user) {
    const meta = user.user_metadata as { full_name?: string } | undefined;
    const fromMeta =
      typeof meta?.full_name === "string" && meta.full_name.trim() ? meta.full_name.trim() : null;
    full_name = fromMeta ?? user.email?.split("@")[0] ?? "Usuario";
    email = user.email ?? "";
  } else {
    full_name = mockUser.full_name;
    email = mockUser.email;
  }

  const alertCount = mockAlertsHistory.filter((a) => !a.read).length;
  const starterOrdersThisMonth = countCompletedOrdersInCurrentMonth(mockOrders);
  const showStarterUsage = mockUser.plan === "starter" && !isDemo;

  return (
    <DemoModeProvider value={{ isDemo, full_name, email }}>
      <DashboardProvider>
        <div className="flex min-h-screen bg-margify-bg">
          <Sidebar userName={full_name} userEmail={email} alertCount={alertCount} />
          <main className="min-h-screen min-w-0 flex-1 px-4 pb-12 pt-[4.5rem] md:ml-60 md:px-8 md:pt-8">
            {showStarterUsage ? <StarterPlanUsageBar ordersUsed={starterOrdersThisMonth} /> : null}
            {children}
          </main>
        </div>
      </DashboardProvider>
    </DemoModeProvider>
  );
}
