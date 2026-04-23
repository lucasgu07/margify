"use client";

import { useDashboardIdentity } from "@/components/dashboard/DemoModeContext";
import { MargifyAIChat } from "@/components/margify-ai/MargifyAIChat";
import { Header } from "@/components/ui/Header";
import { mockUser } from "@/lib/mock-data";

export default function MargifyAIPage() {
  const { full_name } = useDashboardIdentity();
  return (
    <div className="flex min-h-0 flex-col gap-4 md:gap-5">
      <Header userName={full_name} showDateRange={false} />
      <div className="flex min-h-0 flex-1 flex-col">
        <MargifyAIChat storageKey={`margify-ai-chat-${mockUser.id}`} />
      </div>
    </div>
  );
}
