"use client";

import { createContext, useContext } from "react";

export type DashboardSessionValue = {
  isDemo: boolean;
  full_name: string;
  email: string;
};

const DashboardSessionContext = createContext<DashboardSessionValue | null>(null);

export function DemoModeProvider({
  value,
  children,
}: {
  value: DashboardSessionValue;
  children: React.ReactNode;
}) {
  return (
    <DashboardSessionContext.Provider value={value}>{children}</DashboardSessionContext.Provider>
  );
}

/** `true` solo con cookie "Ver demo" y sin sesión de Supabase (visitante sin cuenta). */
export function useDemoMode(): boolean {
  const ctx = useContext(DashboardSessionContext);
  if (!ctx) {
    throw new Error("useDemoMode debe usarse dentro de DemoModeProvider");
  }
  return ctx.isDemo;
}

/** Nombre y email mostrados en header/sidebar: demo, usuario Supabase o mock si no hay auth. */
export function useDashboardIdentity(): { full_name: string; email: string } {
  const ctx = useContext(DashboardSessionContext);
  if (!ctx) {
    throw new Error("useDashboardIdentity debe usarse dentro de DemoModeProvider");
  }
  return { full_name: ctx.full_name, email: ctx.email };
}
