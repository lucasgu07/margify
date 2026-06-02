import { Suspense } from "react";
import { IntegracionesPageClient } from "@/components/dashboard/integrations/IntegracionesPageClient";

export default function IntegracionesPage() {
  return (
    <Suspense
      fallback={
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-margify-border" />
          <div className="h-4 w-72 rounded bg-margify-border" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-40 rounded-[12px] bg-margify-card" />
            <div className="h-40 rounded-[12px] bg-margify-card" />
          </div>
        </div>
      }
    >
      <IntegracionesPageClient />
    </Suspense>
  );
}
