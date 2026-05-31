"use client";

import { useEffect, useState } from "react";
import { AIAdvisor } from "@/components/dashboard/AIAdvisor";
import { useDemoMode } from "@/components/dashboard/DemoModeContext";
import type { CustomDateBounds } from "@/lib/dashboard-filters";
import type { AdvisorInsights } from "@/lib/ai-advisor-insights";
import type { AdvisorPage } from "@/lib/ai-advisor/types";
import type { AdsPlatformScope, DateRangeKey } from "@/types";

type AIAdvisorPanelProps = {
  page: AdvisorPage;
  fallbackInsights: AdvisorInsights;
  storeScope?: "all" | string;
  adsPlatform?: AdsPlatformScope;
  dateRange?: DateRangeKey;
  customRange?: CustomDateBounds | null;
};

export function AIAdvisorPanel({
  page,
  fallbackInsights,
  storeScope = "all",
  adsPlatform,
  dateRange,
  customRange,
}: AIAdvisorPanelProps) {
  const isDemo = useDemoMode();
  const [insights, setInsights] = useState<AdvisorInsights>(fallbackInsights);
  const [loading, setLoading] = useState(!isDemo);

  useEffect(() => {
    setInsights(fallbackInsights);
  }, [fallbackInsights]);

  useEffect(() => {
    if (isDemo) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/ai/advisor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            page,
            storeScope,
            adsPlatform,
            dateRange,
            customRange: customRange ?? null,
          }),
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          insights?: AdvisorInsights;
        };
        if (data.insights && !cancelled) {
          setInsights(data.insights);
        }
      } catch {
        /* fallback ya aplicado */
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [isDemo, page, storeScope, adsPlatform, dateRange, customRange]);

  const display: AdvisorInsights = loading
    ? {
        ...fallbackInsights,
        subtitle: "Analizando tus métricas con IA…",
      }
    : insights;

  return <AIAdvisor insights={display} loading={loading} />;
}
