"use client";

import { useDashboardIdentity } from "@/components/dashboard/DemoModeContext";
import { MargifyAIChat } from "@/components/margify-ai/MargifyAIChat";
import { Header } from "@/components/ui/Header";
import { mockUser } from "@/lib/mock-data";

export default function MargifyAIPage() {
  const { full_name } = useDashboardIdentity();
  return (
    <div className="flex min-h-0 flex-col gap-6">
      <Header userName={full_name} showDateRange={false} />
      <div className="flex min-h-0 flex-1 flex-col">
        <p className="mb-1 text-sm text-margify-muted md:max-w-3xl">
          Chat exclusivo de Margify para tu negocio: campañas, métricas (ROAS, CTR, conversiones), costos y
          qué revisar cuando algo no rinde. Las sugerencias son orientativas; validá siempre con tus datos y
          tu criterio.
        </p>
        <MargifyAIChat storageKey={`margify-ai-chat-${mockUser.id}`} />
      </div>
    </div>
  );
}
