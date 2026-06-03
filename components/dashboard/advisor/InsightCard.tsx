"use client";

import { useState } from "react";
import { AlertTriangle, Bell, Rocket, ChevronDown, ChevronUp, Check, X } from "lucide-react";
import type {
  AdvisorRecommendation,
  RecommendationType,
  RecommendationUrgency,
  RecommendationCategory,
} from "@/lib/ai-advisor/recommendation-types";
import { CATEGORY_LABELS, URGENCY_LABELS } from "@/lib/ai-advisor/recommendation-types";

// ─── Sub-components ───────────────────────────────────────────────────────────

function TypeIcon({ type }: { type: RecommendationType }) {
  switch (type) {
    case "danger":
      return <AlertTriangle className="h-3.5 w-3.5" aria-hidden />;
    case "warning":
      return <Bell className="h-3.5 w-3.5" aria-hidden />;
    default:
      return <Rocket className="h-3.5 w-3.5" aria-hidden />;
  }
}

function typeColor(type: RecommendationType) {
  switch (type) {
    case "danger":
      return {
        bg: "bg-red-950/60",
        text: "text-red-300",
        border: "border-red-900/60",
        iconBg: "bg-red-900/50 text-red-300",
        dot: "bg-red-400",
      };
    case "warning":
      return {
        bg: "bg-amber-950/40",
        text: "text-amber-300",
        border: "border-amber-900/50",
        iconBg: "bg-amber-900/50 text-amber-300",
        dot: "bg-amber-400",
      };
    default:
      return {
        bg: "bg-emerald-950/40",
        text: "text-emerald-300",
        border: "border-emerald-900/50",
        iconBg: "bg-emerald-900/50 text-emerald-300",
        dot: "bg-emerald-400",
      };
  }
}

function urgencyDot(urgency?: RecommendationUrgency) {
  if (urgency === "high") return "bg-red-400";
  if (urgency === "medium") return "bg-amber-400";
  return "bg-slate-500";
}

function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-16 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[#64DFDF]"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-[11px] tabular-nums text-white/40">{value}%</span>
    </div>
  );
}

function ImpactBadge({ usd }: { usd: number }) {
  const abs = Math.abs(usd);
  const label =
    abs >= 1000
      ? `$${(abs / 1000).toFixed(1)}k`
      : `$${abs.toFixed(0)}`;
  return (
    <span className="inline-flex items-center rounded-md bg-[#64DFDF]/10 px-2 py-0.5 text-xs font-bold text-[#64DFDF]">
      {label}/mes
    </span>
  );
}

function CategoryBadge({ category }: { category: RecommendationCategory }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/40">
      {CATEGORY_LABELS[category]}
    </span>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

type InsightCardProps = {
  rec: AdvisorRecommendation;
  index: number;
  onDecision?: (title: string, decision: "applied" | "dismissed") => void;
  appliedTitles?: Set<string>;
  dismissedTitles?: Set<string>;
};

// ─── Main component ───────────────────────────────────────────────────────────

export function InsightCard({
  rec,
  index,
  onDecision,
  appliedTitles,
  dismissedTitles,
}: InsightCardProps) {
  const [expanded, setExpanded] = useState(false);
  const colors = typeColor(rec.type);
  const isApplied = appliedTitles?.has(rec.title);
  const isDismissed = dismissedTitles?.has(rec.title);
  const decided = isApplied || isDismissed;

  return (
    <div
      className={`rounded-xl border transition-all ${colors.border} ${decided ? "opacity-50" : ""} bg-[#111111]`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Header row */}
      <button
        type="button"
        className="w-full px-4 py-4 text-left"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Icon + title */}
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colors.iconBg}`}
            >
              <TypeIcon type={rec.type} />
            </div>
            <div className="min-w-0 flex-1">
              {/* Badges row */}
              <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                {rec.urgency && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-white/50">
                    <span className={`h-1.5 w-1.5 rounded-full ${urgencyDot(rec.urgency)}`} />
                    {URGENCY_LABELS[rec.urgency]}
                  </span>
                )}
                {rec.category && <CategoryBadge category={rec.category} />}
              </div>
              {/* Title */}
              <h3 className={`text-sm font-bold leading-snug ${decided ? "text-white/40" : "text-white"}`}>
                {isApplied && <span className="mr-1.5 text-[#64DFDF]">✓</span>}
                {isDismissed && <span className="mr-1.5 text-white/30">–</span>}
                {rec.title}
              </h3>
              {/* Impact + confidence */}
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {rec.estimatedImpactUsd !== undefined && (
                  <ImpactBadge usd={rec.estimatedImpactUsd} />
                )}
                {rec.confidence !== undefined && (
                  <ConfidenceBar value={rec.confidence} />
                )}
              </div>
            </div>
          </div>
          {/* Expand toggle */}
          <div className="mt-1 shrink-0 text-white/30">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>

        {/* Problem preview (always visible) */}
        <p className="mt-2 pl-11 text-[13px] leading-relaxed text-white/50">{rec.problem}</p>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-white/5 px-4 pb-4 pt-3">
          <div className="space-y-3 pl-11">
            {/* Action */}
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                Acción
              </p>
              <p className="text-[13px] leading-relaxed text-white">{rec.action}</p>
            </div>

            {/* Impact */}
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                Impacto
              </p>
              <p className={`text-[13px] font-semibold leading-relaxed ${colors.text}`}>
                {rec.impact}
              </p>
            </div>

            {/* Data points (explainability) */}
            {rec.dataPoints && rec.dataPoints.length > 0 && (
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                  Datos usados
                </p>
                <ul className="space-y-1">
                  {rec.dataPoints.map((dp, i) => (
                    <li key={i} className="flex items-center gap-2 text-[12px] text-white/40">
                      <span className="h-1 w-1 shrink-0 rounded-full bg-[#64DFDF]/50" />
                      {dp}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Decision buttons */}
            {onDecision && !decided && (
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onDecision(rec.title, "applied")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#64DFDF]/30 bg-[#64DFDF]/10 px-3 py-1.5 text-xs font-semibold text-[#64DFDF] transition hover:bg-[#64DFDF]/20"
                >
                  <Check className="h-3.5 w-3.5" />
                  Aplicar
                </button>
                <button
                  type="button"
                  onClick={() => onDecision(rec.title, "dismissed")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/40 transition hover:border-white/20 hover:text-white/60"
                >
                  <X className="h-3.5 w-3.5" />
                  Ignorar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
