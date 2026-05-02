"use client";

import { DashboardHomeBody } from "@/components/dashboard/DashboardHomeBody";
import { useDashboardIdentity } from "@/components/dashboard/DemoModeContext";
import { Header } from "@/components/ui/Header";

export function DashboardPageClient() {
  const { full_name } = useDashboardIdentity();

  return (
    <>
      <Header
        userName={full_name}
        showConnect
        onConnect={() => {
          window.location.href = "/dashboard/configuracion";
        }}
      />
      <DashboardHomeBody />
    </>
  );
}
