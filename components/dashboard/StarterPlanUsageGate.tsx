"use client";

import { useDemoMode } from "@/components/dashboard/DemoModeContext";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { StarterPlanUsageBar } from "@/components/dashboard/StarterPlanUsageBar";

/** Muestra el cupo del plan Gratis con órdenes reales (logueado) o mock (demo no aplica barra). */
export function StarterPlanUsageGate() {
  const isDemo = useDemoMode();
  const { plan, starterOrdersThisMonth } = useDashboard();

  if (isDemo || plan !== "starter") return null;

  return <StarterPlanUsageBar ordersUsed={starterOrdersThisMonth} />;
}
