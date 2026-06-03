"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, DollarSign, Target } from "lucide-react";
import type { AdvisorWeeklyReview } from "@/lib/ai-advisor/recommendation-types";

type WeeklyReviewPanelProps = {
  review: AdvisorWeeklyReview;
};

export function WeeklyReviewPanel({ review }: WeeklyReviewPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const wastedFormatted =
    review.wastedSpendUsd >= 1000
      ? `$${(review.wastedSpendUsd / 1000).toFixed(1)}k`
      : `$${review.wastedSpendUsd.toFixed(0)}`;

  const marginSign = review.marginEvolutionPp >= 0 ? "+" : "";
  const marginColor = review.marginEvolutionPp >= 0 ? "text-emerald-400" : "text-red-400";

  return (
    <div className="rounded-xl border border-white/8 bg-[#0d0d0d]">
      <button
        type="button"
        className="w-full px-4 py-3.5 text-left"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5">
              <Target className="h-4 w-4 text-white/50" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/30">
                Revisión semanal
              </p>
              <div className="mt-0.5 flex items-center gap-3">
                <span className={`text-sm font-bold ${marginColor}`}>
                  {marginSign}{review.marginEvolutionPp.toFixed(1)}pp margen
                </span>
                {review.wastedSpendUsd > 0 && (
                  <span className="text-sm text-red-400">
                    {wastedFormatted} desperdiciado
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="shrink-0 text-white/30">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/5 px-4 pb-4 pt-3">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Improved */}
            {review.improved.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
                    Mejoró
                  </p>
                </div>
                <ul className="space-y-1.5">
                  {review.improved.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12px] text-white/60">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400/60" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Worsened */}
            {review.worsened.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-1.5">
                  <TrendingDown className="h-3.5 w-3.5 text-red-400" />
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
                    Empeoró
                  </p>
                </div>
                <ul className="space-y-1.5">
                  {review.worsened.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12px] text-white/60">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400/60" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Wasted spend summary */}
          {review.wastedSpendUsd > 0 && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-950/40 px-3 py-2">
              <DollarSign className="h-4 w-4 shrink-0 text-red-400" />
              <p className="text-[12px] text-red-300">
                Esta semana se detectaron <strong>{wastedFormatted}</strong> en gasto publicitario
                sin retorno suficiente.
              </p>
            </div>
          )}

          {/* Recommended actions */}
          {review.recommendedActions.length > 0 && (
            <div className="mt-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                Prioridades para esta semana
              </p>
              <ul className="space-y-2">
                {review.recommendedActions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-white/70">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#64DFDF]/60" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Top opportunity */}
          {review.topOpportunity && (
            <div className="mt-3 rounded-lg border border-[#64DFDF]/15 bg-[#64DFDF]/5 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#64DFDF]/60">
                Mayor oportunidad
              </p>
              <p className="mt-1 text-[12px] text-white/70">{review.topOpportunity}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
