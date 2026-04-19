"use client";

import { createContext, useContext, useMemo } from "react";
import { mockUser } from "@/lib/mock-data";

const DemoModeContext = createContext(false);

/** Textos para layout server y modo demo (sin datos personales). */
export const DEMO_USER_LABEL = {
  full_name: "Usuario demo",
  email: "demo@margify.app",
} as const;

export function DemoModeProvider({
  isDemo,
  children,
}: {
  isDemo: boolean;
  children: React.ReactNode;
}) {
  return <DemoModeContext.Provider value={isDemo}>{children}</DemoModeContext.Provider>;
}

export function useDemoMode(): boolean {
  return useContext(DemoModeContext);
}

/** Identidad mostrada en header/sidebar: en modo demo, sin datos personales. */
export function useDashboardIdentity() {
  const isDemo = useDemoMode();
  return useMemo(
    () =>
      isDemo
        ? { full_name: DEMO_USER_LABEL.full_name, email: DEMO_USER_LABEL.email }
        : { full_name: mockUser.full_name, email: mockUser.email },
    [isDemo]
  );
}
