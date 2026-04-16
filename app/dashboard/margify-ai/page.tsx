"use client";

import { MargifyAIChat } from "@/components/margify-ai/MargifyAIChat";
import { Header } from "@/components/ui/Header";
import { mockUser } from "@/lib/mock-data";

export default function MargifyAIPage() {
  return (
    <div className="flex min-h-0 flex-col gap-6">
      <Header userName={mockUser.full_name} showDateRange={false} />
      <div className="flex min-h-0 flex-1 flex-col">
        <p className="mb-1 text-sm text-margify-muted md:max-w-3xl">
          Asistente para anuncios, métricas y decisiones de marketing. Las sugerencias son orientativas;
          validá siempre con tus datos y tu criterio.
        </p>
        <MargifyAIChat storageKey={`margify-ai-chat-${mockUser.id}`} />
      </div>
    </div>
  );
}
