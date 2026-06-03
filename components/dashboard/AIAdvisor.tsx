"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Brain, RefreshCw, Plug, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useDemoMode } from "@/components/dashboard/DemoModeContext";
import { InsightCard } from "@/components/dashboard/advisor/InsightCard";
import { CategoryFilter } from "@/components/dashboard/advisor/CategoryFilter";
import { WeeklyReviewPanel } from "@/components/dashboard/advisor/WeeklyReviewPanel";
import type {
  AdvisorApiResponse,
  AdvisorRecommendation,
  AdvisorWeeklyReview,
  RecommendationCategory,
  DecisionType,
} from "@/lib/ai-advisor/recommendation-types";
import { ADVISOR_REFRESH_MS } from "@/lib/ai-advisor/recommendation-types";

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewState = "loading" | "ready" | "error" | "empty" | "insufficient";

type SortMode = "impact" | "urgency";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonFeed() {
  return (
    <div className="mt-4 space-y-3">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-20 animate-pulse rounded-xl bg-[#1a1a1a]"
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
}

// ─── Urgency sort weight ──────────────────────────────────────────────────────

function urgencyWeight(rec: AdvisorRecommendation): number {
  if (rec.urgency === "high") return 3;
  if (rec.urgency === "medium") return 2;
  return 1;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AIAdvisor() {
  const isDemo = useDemoMode();

  // Fetch state
  const [state, setState] = useState<ViewState>("loading");
  const [recommendations, setRecommendations] = useState<AdvisorRecommendation[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [motivationalClose, setMotivationalClose] = useState<string | null>(null);
  const [weeklyReview, setWeeklyReview] = useState<AdvisorWeeklyReview | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [source, setSource] = useState<"claude" | "fallback" | "cache" | null>(null);

  // UI state
  const [categoryFilter, setCategoryFilter] = useState<RecommendationCategory | "all">("all");
  const [sortMode, setSortMode] = useState<SortMode>("impact");
  const [appliedTitles, setAppliedTitles] = useState<Set<string>>(new Set());
  const [dismissedTitles, setDismissedTitles] = useState<Set<string>>(new Set());

  // ─── Response handler ──────────────────────────────────────────────────────

  const applyResponse = useCallback((data: AdvisorApiResponse & { stale?: boolean }) => {
    if ("status" in data) {
      if (data.status === "no_store") { setState("empty"); setMessage(data.message); return; }
      if (data.status === "insufficient_data") { setState("insufficient"); setMessage(data.message); return; }
      setState("error"); setMessage(data.message);
      return;
    }
    setRecommendations(data.recommendations);
    setGeneratedAt(data.generatedAt);
    setMotivationalClose(data.motivationalClose ?? null);
    setWeeklyReview(data.weeklyReview ?? null);
    setSource(data.source);
    setState("ready");
    setMessage(null);
  }, []);

  // ─── Fetch ────────────────────────────────────────────────────────────────

  const fetchAdvisor = useCallback(
    async (force: boolean) => {
      if (force) setRefreshing(true);
      else setState((s) => (s === "ready" ? s : "loading"));
      try {
        const url = force ? "/api/ai/advisor?refresh=true" : "/api/ai/advisor";
        const method = force ? "POST" : "GET";
        const res = await fetch(url, { method, cache: "no-store" });
        const data = (await res.json()) as AdvisorApiResponse & { stale?: boolean };
        if (!res.ok && "status" in data && data.status === "error") {
          setState("error"); setMessage(data.message); return;
        }
        applyResponse(data);
        // Background refresh if stale
        if (!force && data.stale && "recommendations" in data) {
          const postRes = await fetch("/api/ai/advisor", { method: "POST", cache: "no-store" });
          const fresh = (await postRes.json()) as AdvisorApiResponse;
          applyResponse(fresh);
        }
      } catch {
        setState("error");
        setMessage("No pudimos generar el análisis. Revisá que tu tienda esté conectada.");
      } finally {
        setRefreshing(false);
      }
    },
    [applyResponse]
  );

  useEffect(() => {
    void fetchAdvisor(false);
  }, [fetchAdvisor, isDemo]);

  // ─── Decision handler ──────────────────────────────────────────────────────

  const handleDecision = useCallback(
    async (title: string, decision: DecisionType) => {
      if (decision === "applied") setAppliedTitles((s) => new Set(s).add(title));
      else setDismissedTitles((s) => new Set(s).add(title));

      const rec = recommendations.find((r) => r.title === title);
      try {
        await fetch("/api/ai/advisor/decision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recommendationTitle: title,
            recommendationCategory: rec?.category,
            decision,
          }),
        });
      } catch {
        // Non-critical — UI already updated optimistically
      }
    },
    [recommendations]
  );

  // ─── Filtered + sorted recs ────────────────────────────────────────────────

  const filteredRecs = useMemo(() => {
    let recs = recommendations;
    if (categoryFilter !== "all") {
      recs = recs.filter((r) => r.category === categoryFilter);
    }
    if (sortMode === "urgency") {
      recs = [...recs].sort((a, b) => urgencyWeight(b) - urgencyWeight(a));
    } else {
      recs = [...recs].sort(
        (a, b) => (b.estimatedImpactUsd ?? 0) - (a.estimatedImpactUsd ?? 0)
      );
    }
    return recs;
  }, [recommendations, categoryFilter, sortMode]);

  // ─── Time helpers ──────────────────────────────────────────────────────────

  const mins = generatedAt
    ? Math.max(0, Math.floor((Date.now() - new Date(generatedAt).getTime()) / 60000))
    : null;
  const nextRefreshMins =
    mins != null ? Math.max(0, Math.ceil((ADVISOR_REFRESH_MS - mins * 60000) / 60000)) : 360;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <section
      className="rounded-xl border border-[#64DFDF]/30 bg-[#0a0a0a] p-5"
      aria-labelledby="margify-ai-advisor-title"
    >
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#64DFDF]/10">
            <Brain className="h-5 w-5 text-[#64DFDF]" aria-hidden />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="margify-ai-advisor-title" className="text-base font-bold text-[#64DFDF]">
                Margify AI
              </h2>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64DFDF]/70">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#64DFDF]" />
                En vivo
              </span>
              {source === "claude" && (
                <span className="rounded-full border border-[#64DFDF]/20 px-2 py-0.5 text-[10px] font-medium text-[#64DFDF]/60">
                  Claude
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-white/40">
              {state === "ready"
                ? `${recommendations.length} insights · últimos 30 días`
                : "Analizando tus últimos 30 días"}
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={state === "loading" || refreshing}
          onClick={() => void fetchAdvisor(true)}
          className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm font-medium text-white/50 transition hover:border-[#64DFDF]/30 hover:text-[#64DFDF] disabled:opacity-40"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} aria-hidden />
          Actualizar
        </button>
      </div>

      {/* ── Loading ── */}
      {(state === "loading" || refreshing) && !recommendations.length && <SkeletonFeed />}

      {/* ── Error ── */}
      {state === "error" && (
        <p className="mt-4 text-sm text-white/40" role="alert">
          {message ?? "No pudimos generar el análisis. Revisá que tu tienda esté conectada."}
        </p>
      )}

      {/* ── No store connected ── */}
      {state === "empty" && (
        <div className="mt-6 flex flex-col items-center gap-4 py-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
            <Plug className="h-6 w-6 text-white/30" />
          </div>
          <div>
            <p className="text-sm font-medium text-white/60">Sin tienda conectada</p>
            <p className="mt-1 text-xs text-white/30">
              Conectá tu tienda para que Margify AI pueda analizar tus datos.
            </p>
          </div>
          <Link
            href="/dashboard/integraciones"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#64DFDF]/10 px-4 py-2 text-sm font-semibold text-[#64DFDF] transition hover:bg-[#64DFDF]/20"
          >
            Conectar tienda →
          </Link>
        </div>
      )}

      {/* ── Insufficient data ── */}
      {state === "insufficient" && (
        <div className="mt-6 flex flex-col items-center gap-3 py-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
            <BarChart3 className="h-6 w-6 text-white/30" />
          </div>
          <p className="text-sm text-white/40" role="status">
            {message}
          </p>
        </div>
      )}

      {/* ── Ready ── */}
      {state === "ready" && (
        <>
          {/* Weekly review */}
          {weeklyReview && (
            <div className="mt-4">
              <WeeklyReviewPanel review={weeklyReview} />
            </div>
          )}

          {/* Filters + sort */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CategoryFilter
              recommendations={recommendations}
              selected={categoryFilter}
              onChange={setCategoryFilter}
            />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/25">
                Ordenar
              </span>
              {(["impact", "urgency"] as SortMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSortMode(mode)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                    sortMode === mode
                      ? "bg-white/10 text-white/70"
                      : "text-white/30 hover:text-white/50"
                  }`}
                >
                  {mode === "impact" ? "Impacto" : "Urgencia"}
                </button>
              ))}
            </div>
          </div>

          {/* Insight cards */}
          <div className="mt-3 space-y-2.5">
            {filteredRecs.map((rec, i) => (
              <InsightCard
                key={`${rec.title}-${i}`}
                rec={rec}
                index={i}
                onDecision={handleDecision}
                appliedTitles={appliedTitles}
                dismissedTitles={dismissedTitles}
              />
            ))}
            {filteredRecs.length === 0 && (
              <p className="py-4 text-center text-sm text-white/30">
                No hay insights en esta categoría.
              </p>
            )}
          </div>

          {/* Motivational close */}
          {motivationalClose && (
            <p className="mt-4 text-sm font-medium text-white/60 italic">{motivationalClose}</p>
          )}

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-white/25">
              {mins === 0 ? "Actualizado hace menos de 1 min" : `Actualizado hace ${mins} min`}
              {" · "}próx. actualización en{" "}
              {nextRefreshMins >= 60
                ? `${Math.round(nextRefreshMins / 60)}h`
                : `${nextRefreshMins} min`}
            </p>
          </div>
        </>
      )}
    </section>
  );
}
