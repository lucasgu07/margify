import { Brain } from "lucide-react";
import { buttonClassName } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { AdvisorInsights } from "@/lib/ai-advisor-insights";
import Link from "next/link";

export function AIAdvisor({ insights }: { insights: AdvisorInsights }) {
  return (
    <Card glass className="border-margify-cyan/35 shadow-[0_0_0_1px_rgba(100,223,223,0.12)]">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-margify-cyan/15">
          <Brain className="h-7 w-7 text-margify-cyan" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Margify AI recomienda</h2>
            <p className="text-sm text-margify-muted">{insights.subtitle}</p>
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
            href={insights.ctaHref}
            className={buttonClassName("primary", "mt-2 w-full sm:w-auto")}
          >
            {insights.ctaLabel}
          </Link>
        </div>
      </div>
    </Card>
  );
}
