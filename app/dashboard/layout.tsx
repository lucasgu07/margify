import { cookies } from "next/headers";
import { DashboardProvider } from "@/components/dashboard/DashboardContext";
import { DemoModeProvider } from "@/components/dashboard/DemoModeContext";
import { DashboardStarfieldBackground } from "@/components/dashboard/DashboardStarfieldBackground";
import { StarterPlanUsageGate } from "@/components/dashboard/StarterPlanUsageGate";
import { Sidebar } from "@/components/ui/Sidebar";
import { DEMO_COOKIE, isDemoCookieActive } from "@/lib/demo-cookie";
import { DEMO_USER_LABEL } from "@/lib/demo-user";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { mockAlertsHistory } from "@/lib/mock-data";

/** Evita prerender estático: `cookies()` requiere request en runtime (Vercel / producción). */
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient();
  const { data: authData } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const user = authData.user;
  const demoCookie = cookies().get(DEMO_COOKIE)?.value;

  /**
   * Demo = ingreso explícito desde la landing (`?demo=1` / cookie), sin sesión.
   * Usuario registrado siempre ve datos reales (vacíos hasta conectar integraciones).
   */
  const isDemo = !user && isDemoCookieActive(demoCookie);

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
    full_name = DEMO_USER_LABEL.full_name;
    email = DEMO_USER_LABEL.email;
  }

  const alertCount = mockAlertsHistory.filter((a) => !a.read).length;

  return (
    <DemoModeProvider value={{ isDemo, full_name, email }}>
      <DashboardProvider>
        <div className="relative flex min-h-screen bg-black">
          <DashboardStarfieldBackground />
          <Sidebar userName={full_name} userEmail={email} alertCount={alertCount} />
          <main className="relative z-[1] min-h-screen min-w-0 flex-1 bg-transparent px-4 pb-12 pt-[4.5rem] md:ml-60 md:px-8 md:pt-8">
            <StarterPlanUsageGate />
            {children}
          </main>
        </div>
      </DashboardProvider>
    </DemoModeProvider>
  );
}
