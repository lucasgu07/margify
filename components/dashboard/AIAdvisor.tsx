"use client";

import { useCallback, useEffect, useState } from "react";
import { Brain, RefreshCw, Rocket, AlertTriangle, Bell } from "lucide-react";
import { useDemoMode } from "@/components/dashboard/DemoModeContext";
import type {
  AdvisorApiResponse,
  AdvisorRecommendation,
  RecommendationType,
} from "@/lib/ai-advisor/recommendation-types";
import { ADVISOR_REFRESH_MS } from "@/lib/ai-advisor/recommendation-types";
import Link from "next/link";

type ViewState = "loading" | "ready" | "error" | "empty" | "insufficient";

function typeIcon(type: RecommendationType) {
  switch (type) {
    case "danger":
      return <AlertTriangle className="h-4 w-4" aria-hidden />;
    case "warning":
      return <Bell className="h-4 w-4" aria-hidden />;
    default:
      return <Rocket className="h-4 w-4" aria-hidden />;
  }
}

function typeStyles(type: RecommendationType) {
  switch (type) {
    case "danger":
      return "bg-red-950/80 text-red-200";
    case "warning":
      return "bg-amber-950/80 text-amber-200";
    default:
      return "bg-emerald-950/80 text-emerald-200";
  }
}

function minutesAgo(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
}

function RecommendationCard({ rec }: { rec: AdvisorRecommendation }) {
  return (
    <div className="border-t border-white/10 pt-4 first:border-t-0 first:pt-0">
      <div className="flex gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${typeStyles(rec.type)}`}
        >
          {typeIcon(rec.type)}
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <h3 className="text-sm font-bold text-white">{rec.title}</h3>
          <p className="text-[13px] leading-relaxed text-margify-muted">{rec.problem}</p>
          <p className="text-[13px] leading-relaxed text-white">{rec.action}</p>
          <p className="text-[13px] font-bold leading-relaxed text-margify-cyan">{rec.impact}</p>
        </div>
      </div>
    </div>
  );
}

function SkeletonCards() {
  return (
    <div className="mt-4 space-y-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-lg bg-[#1a1a1a]"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}

export function AIAdvisor() {
  const isDemo = useDemoMode();
  const [state, setState] = useState<ViewState>("loading");
  const [recommendations, setRecommendations] = useState<AdvisorRecommendation[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [motivationalClose, setMotivationalClose] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [source, setSource] = useState<"claude" | "fallback" | "cache" | null>(null);
  const [claudeConfigured, setClaudeConfigured] = useState<boolean | null>(null);

  const applyResponse = useCallback((data: AdvisorApiResponse & { stale?: boolean }) => {
    if ("status" in data) {
      if (data.status === "no_store") {
        setState("empty");
        setMessage(data.message);
        return;
      }
      if (data.status === "insufficient_data") {
        setState("insufficient");
        setMessage(data.message);
        return;
      }
      setState("error");
      setMessage(data.message);
      return;
    }
    setRecommendations(data.recommendations);
    setGeneratedAt(data.generatedAt);
    setMotivationalClose(data.motivationalClose ?? null);
    setSource(data.source);
    setClaudeConfigured(data.claudeConfigured);
    setState("ready");
    setMessage(null);
  }, []);

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
          setState("error");
          setMessage(data.message);
          return;
        }
        applyResponse(data);

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

  const mins = generatedAt ? minutesAgo(generatedAt) : null;
  const nextRefreshMins =
    mins != null ? Math.max(0, Math.ceil((ADVISOR_REFRESH_MS - mins * 60000) / 60000)) : 360;

  return (
    <section
      className="rounded-xl border border-[#64DFDF] bg-[#111111] p-5"
      aria-labelledby="margify-ai-advisor-title"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#64DFDF]/15">
            <Brain className="h-5 w-5 text-[#64DFDF]" aria-hidden />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="margify-ai-advisor-title" className="text-base font-bold text-[#64DFDF]">
                Margify AI
              </h2>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64DFDF]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#64DFDF]" />
                En vivo
              </span>
            </div>
            <p className="mt-0.5 text-sm text-margify-muted">Basado en tus últimos 30 días</p>
            {state === "ready" && source === "claude" ? (
              <p className="mt-1 text-xs text-[#64DFDF]/80">Análisis generado con Claude</p>
            ) : null}
            {state === "ready" && source === "fallback" ? (
              <p className="mt-1 text-xs text-amber-200/80">
                {claudeConfigured === false
                  ? "Modo estimado — configurá ANTHROPIC_API_KEY en el servidor para análisis con IA"
                  : "Modo estimado — Claude no respondió; mostramos reglas locales"}
              </p>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          disabled={state === "loading" || refreshing}
          onClick={() => void fetchAdvisor(true)}
          className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-control border border-[#64DFDF]/50 bg-transparent px-3 py-2 text-sm font-medium text-[#64DFDF] transition hover:bg-[#64DFDF]/10 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden />
          Actualizar análisis
        </button>
      </div>

      {state === "loading" && <SkeletonCards />}

      {state === "error" && (
        <p className="mt-4 text-sm text-margify-muted" role="alert">
          {message ?? "No pudimos generar el análisis. Revisá que tu tienda esté conectada."}
        </p>
      )}

      {state === "empty" && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-margify-muted">{message}</p>
          <Link
            href="/dashboard/integraciones"
            className="inline-block text-sm font-medium text-[#64DFDF] hover:underline"
          >
            Ir a conectar tienda →
          </Link>
        </div>
      )}

      {state === "insufficient" && (
        <p className="mt-4 text-sm text-margify-muted" role="status">
          {message}
        </p>
      )}

      {state === "ready" && (
        <>
          <div className="mt-4 space-y-4">
            {recommendations.map((rec, i) => (
              <RecommendationCard key={`${rec.title}-${i}`} rec={rec} />
            ))}
          </div>
          {motivationalClose ? (
            <p className="mt-4 text-sm font-medium text-white/90">{motivationalClose}</p>
          ) : null}
        </>
      )}

      {state === "ready" && generatedAt ? (
        <p className="mt-4 text-xs text-margify-muted">
          Actualizado hace {mins === 0 ? "menos de 1" : mins} minuto{mins === 1 ? "" : "s"} ·
          Próxima actualización automática en {nextRefreshMins >= 60 ? `${Math.round(nextRefreshMins / 60)} horas` : `${nextRefreshMins} minutos`}
        </p>
      ) : null}
    </section>
  );
}
