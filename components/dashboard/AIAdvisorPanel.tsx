"use client";

import { useEffect, useState } from "react";
import { Brain } from "lucide-react";
import { useDemoMode } from "@/components/dashboard/DemoModeContext";
import type { AdvisorInsights } from "@/lib/ai-advisor-insights";
import type {
  AdvisorApiResponse,
  AdvisorRecommendation,
} from "@/lib/ai-advisor/recommendation-types";
import { defaultCtaForPage } from "@/lib/ai-advisor/page-defaults";
import type { AdvisorPage } from "@/lib/ai-advisor/types";
import Link from "next/link";
import { buttonClassName } from "@/components/ui/Button";

function toLegacyInsights(
  page: AdvisorPage,
  recs: AdvisorRecommendation[]
): AdvisorInsights {
  const cta = defaultCtaForPage(page);
  return {
    subtitle: "Recomendaciones basadas en tus últimos 30 días",
    tips: recs.map((r) => `${r.title}: ${r.action.replace(/^→\s*/, "")}`),
    ctaHref: cta.ctaHref,
    ctaLabel: cta.ctaLabel,
  };
}

type AIAdvisorPanelProps = {
  page: AdvisorPage;
  fallbackInsights: AdvisorInsights;
};

/** Advisor compacto en subpáginas (misma API que el home). */
export function AIAdvisorPanel({ page, fallbackInsights }: AIAdvisorPanelProps) {
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

    async function load() {
      setLoading(true);
      try {
        let res = await fetch("/api/ai/advisor", { cache: "no-store" });
        let data = (await res.json()) as AdvisorApiResponse & { stale?: boolean };
        if (data.stale && "recommendations" in data) {
          res = await fetch("/api/ai/advisor", { method: "POST", cache: "no-store" });
          data = (await res.json()) as AdvisorApiResponse;
        }
        if (cancelled || !("recommendations" in data)) return;
        setInsights(toLegacyInsights(page, data.recommendations));
      } catch {
        /* fallback */
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [isDemo, page]);

  return (
    <section className="rounded-xl border border-margify-cyan/35 bg-[#111111] p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-margify-cyan/15">
          <Brain className={`h-7 w-7 text-margify-cyan ${loading ? "animate-pulse" : ""}`} aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-[#64DFDF]">Margify AI recomienda</h2>
            <p className="text-sm text-margify-muted">
              {loading ? "Analizando tus métricas…" : insights.subtitle}
            </p>
          </div>
          <ul className="space-y-2 text-sm leading-relaxed text-margify-text">
            {insights.tips.map((t, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-margify-cyan" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/dashboard"
            className={buttonClassName("primary", "mt-2 w-full sm:w-auto")}
          >
            Ver análisis completo
          </Link>
        </div>
      </div>
    </section>
  );
}
