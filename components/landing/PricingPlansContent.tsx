"use client";

import { useState } from "react";
import Link from "next/link";
import { Brain, Check, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonClassName } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  landingGlassPanel,
  landingGlassPanelHover,
  landingGlassPricingToggle,
} from "@/lib/landing-glass-styles";
import { multiTouchClusterClasses } from "@/lib/multi-touch-cluster";
import { startDodoCheckout } from "@/lib/dodo-checkout";
import { getProDodoProductId, getScaleDodoProductId } from "@/lib/dodo-products";
import { getWhatsAppChatUrl } from "@/lib/whatsapp";

// ─── Prices ───────────────────────────────────────────────────────────────────

const PRO_ANNUAL_USD = 26;
const PRO_MONTHLY_REF_USD = 39;
const SCALE_ANNUAL_USD = 67;
const SCALE_MONTHLY_REF_USD = Math.round((SCALE_ANNUAL_USD * PRO_MONTHLY_REF_USD) / PRO_ANNUAL_USD);

// ─── Feature line ─────────────────────────────────────────────────────────────

type FeatureLineProps = {
  text: string;
  included?: boolean;
  highlight?: boolean;
  isAI?: boolean;
};

function FeatureLine({ text, included = true, highlight = false, isAI = false }: FeatureLineProps) {
  return (
    <li className="flex items-start gap-2.5 text-sm leading-snug">
      {included ? (
        isAI ? (
          <Brain
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#64DFDF]"
            aria-hidden
            strokeWidth={2}
          />
        ) : (
          <Check
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#64DFDF]"
            aria-hidden
            strokeWidth={2.5}
          />
        )
      ) : (
        <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/20" aria-hidden strokeWidth={2} />
      )}
      <span
        className={cn(
          included ? (highlight ? "font-semibold text-white" : "text-white/70") : "text-white/25"
        )}
      >
        {text}
      </span>
    </li>
  );
}

// ─── Price display ────────────────────────────────────────────────────────────

function PriceBlock({
  annualUsd,
  monthlyUsd,
  billingAnnual,
  cyan,
}: {
  annualUsd: number;
  monthlyUsd: number;
  billingAnnual: boolean;
  cyan?: boolean;
}) {
  const displayUsd = billingAnnual ? annualUsd : monthlyUsd;
  return (
    <div className="mt-4 space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
        {billingAnnual ? "Facturación anual" : "Facturación mensual"}
      </p>
      <p className={cn("text-3xl font-bold tabular-nums leading-none", cyan ? "text-[#64DFDF]" : "text-white")}>
        USD {displayUsd}
        <span className="ml-1 text-sm font-normal text-white/40">/ mes</span>
      </p>
      <div className="grid [&>*]:col-start-1 [&>*]:row-start-1">
        <p className={cn("text-xs text-white/35", !billingAnnual && "invisible")} aria-hidden={!billingAnnual}>
          Equivale a USD {annualUsd * 10}/año · 2 meses sin cargo
        </p>
        <p className={cn("text-xs text-white/35", billingAnnual && "invisible")} aria-hidden={billingAnnual}>
          Con facturación anual: USD {annualUsd}/mes
        </p>
      </div>
    </div>
  );
}

// ─── ROI anchor card ──────────────────────────────────────────────────────────

function RoiAnchor({ text, highlight }: { text: string; highlight?: string }) {
  const parts = highlight ? text.split(highlight) : [text];
  return (
    <div className="mt-4 rounded-lg border border-[#64DFDF]/15 bg-[#64DFDF]/5 px-3 py-2.5">
      <div className="flex items-start gap-2">
        <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#64DFDF]/70" />
        <p className="text-[12px] leading-snug text-white/55">
          {parts.length > 1 ? (
            <>
              {parts[0]}
              <span className="font-bold text-[#64DFDF]">{highlight}</span>
              {parts[1]}
            </>
          ) : (
            text
          )}
        </p>
      </div>
    </div>
  );
}

// ─── Plan card types ──────────────────────────────────────────────────────────

export type SelectedPlanId = "free" | "pro" | "scale";

export type SelectedPlanChoice = {
  plan: SelectedPlanId;
  annual: boolean;
};

type PricingPlansContentProps = {
  variant: "landing" | "onboarding";
  onSelectPlan?: (choice: SelectedPlanChoice) => void;
};

// ─── CTA helper ───────────────────────────────────────────────────────────────

function useCta(
  variant: "landing" | "onboarding",
  annual: boolean,
  onSelectPlan?: PricingPlansContentProps["onSelectPlan"]
) {
  function renderCta(
    plan: SelectedPlanId,
    label: string,
    style: "primary" | "secondary",
    href = "/auth/register",
    fullWidth = false
  ) {
    const classes = buttonClassName(
      style,
      cn("text-sm font-semibold", fullWidth ? "w-full px-4 py-2.5" : "w-fit self-center px-4 py-2")
    );
    const external = href.startsWith("http");
    if (variant === "onboarding" && onSelectPlan && !external) {
      return (
        <button type="button" className={classes} onClick={() => onSelectPlan({ plan, annual })}>
          {label}
        </button>
      );
    }
    if (external) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
          {label}
        </a>
      );
    }
    return (
      <Link href={href} className={classes}>
        {label}
      </Link>
    );
  }
  return { renderCta };
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PricingPlansContent({ variant, onSelectPlan }: PricingPlansContentProps) {
  const [annual, setAnnual] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const isOnboarding = variant === "onboarding";
  const glassCard = !isOnboarding ? cn(landingGlassPanel, landingGlassPanelHover) : undefined;
  const { renderCta } = useCta(variant, annual, onSelectPlan);

  async function handleProCheckout() {
    setCheckoutError(null);
    setCheckoutLoading(true);
    try {
      await startDodoCheckout(getProDodoProductId(annual));
    } catch {
      setCheckoutError("No pudimos abrir el checkout. Intentá de nuevo.");
      setCheckoutLoading(false);
    }
  }

  async function handleScaleCheckout() {
    setCheckoutError(null);
    setCheckoutLoading(true);
    try {
      await startDodoCheckout(getScaleDodoProductId(annual));
    } catch {
      setCheckoutError("No pudimos abrir el checkout. Intentá de nuevo.");
      setCheckoutLoading(false);
    }
  }

  const waUrl = getWhatsAppChatUrl();
  const btnBase = "text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6">
      {/* ── Billing toggle ── */}
      <div
        className={cn(
          "mx-auto flex max-w-sm justify-center rounded-full border p-1",
          multiTouchClusterClasses,
          isOnboarding ? "border-margify-border bg-margify-black" : landingGlassPricingToggle
        )}
        role="group"
        aria-label="Facturación"
      >
        <button
          type="button"
          onClick={() => setAnnual(true)}
          className={cn(
            "flex min-h-[2.5rem] flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-margify",
            annual ? "bg-[#64DFDF] text-black" : "text-white/50 hover:text-white"
          )}
        >
          Anual
          {annual && (
            <span className="rounded-full bg-black/20 px-1.5 py-0.5 text-[10px] font-bold">
              Ahorrás 33%
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setAnnual(false)}
          className={cn(
            "min-h-[2.5rem] flex-1 rounded-full px-4 py-2 text-sm font-medium transition-all duration-margify",
            !annual ? "bg-[#64DFDF] text-black" : "text-white/50 hover:text-white"
          )}
        >
          Mensual
        </button>
      </div>

      {/* ── Plan grid ── */}
      <div className="mx-auto mt-8 grid max-w-6xl items-stretch gap-4 max-md:grid-cols-2 max-md:gap-3 md:grid-cols-3 md:gap-6">

        {/* ────── FREE ────── */}
        <div
          className={cn(
            "flex flex-col rounded-2xl border border-white/10 p-6 max-md:p-4",
            glassCard
          )}
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35">Para empezar</p>
          <h3 className="mt-1.5 text-xl font-bold text-white max-md:text-lg">Gratis</h3>
          <p className="mt-1 text-sm text-white/40">Descubrí cuánto ganás realmente</p>

          <div className="mt-4 space-y-1">
            <p className="text-3xl font-bold text-white max-md:text-2xl">$0</p>
            <p className="text-xs text-white/35">Sin tarjeta. Sin límite de tiempo.</p>
          </div>

          <p className="mt-4 text-[10px] font-semibold uppercase tracking-widest text-white/25">Hasta 30 órdenes/mes</p>

          <ul className="mt-4 flex flex-1 flex-col gap-2.5">
            <FeatureLine text="Dashboard de rentabilidad en tiempo real" />
            <FeatureLine text="Conectá TiendaNube, Shopify o Mercado Libre" />
            <FeatureLine text="Analizá Meta, TikTok y Google Ads" />
            <FeatureLine text="Historial de 30 días" />
            <FeatureLine text="Alertas básicas por email" />
            <FeatureLine text="Margify AI Advisor" included={false} />
            <FeatureLine text="Alertas por WhatsApp" included={false} />
            <FeatureLine text="Historial ilimitado" included={false} />
          </ul>

          <div className="mt-6">
            {renderCta("free", "Empezar gratis", "secondary", "/auth/register", true)}
          </div>
        </div>

        {/* ────── PRO (featured) ────── */}
        <div
          className={cn(
            "relative flex flex-col rounded-2xl border-2 border-[#64DFDF] p-6 shadow-[0_0_32px_rgba(100,223,223,0.12)] max-md:p-4",
            glassCard
          )}
        >
          {/* Popular badge */}
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            <Badge type="success" label="Más popular" className="w-fit" />
            {annual && (
              <Badge type="success" label="Mejor precio" className="w-fit" />
            )}
          </div>

          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#64DFDF]/70">Para operadores</p>
          <h3 className="mt-1.5 text-xl font-bold text-white max-md:text-lg">Pro</h3>
          <p className="mt-1 text-sm text-white/50">Tomá decisiones que te ahorran dinero</p>

          <PriceBlock
            annualUsd={PRO_ANNUAL_USD}
            monthlyUsd={PRO_MONTHLY_REF_USD}
            billingAnnual={annual}
            cyan
          />

          {/* ROI anchor */}
          <RoiAnchor
            text="Si Margify te ayuda a pausar 1 campaña perdiendo $500/mes, el plan se pagó 19 veces."
            highlight="se pagó 19 veces."
          />

          <p className="mt-4 text-[10px] font-semibold uppercase tracking-widest text-white/25">
            Órdenes ilimitadas · Todo Gratis +
          </p>

          <ul className="mt-3 flex flex-1 flex-col gap-2.5">
            <FeatureLine text="Margify AI — 5 a 7 insights semanales con impacto en $" highlight isAI />
            <FeatureLine text="Historial de datos ilimitado" highlight />
            <FeatureLine text="ROAS real por campaña y producto" />
            <FeatureLine text="Rentabilidad por producto + inteligencia de inventario" />
            <FeatureLine text="Automatización de campañas" />
            <FeatureLine text="Alertas en tiempo real por WhatsApp" />
            <FeatureLine text="API access" />
            <FeatureLine text="Soporte prioritario" />
          </ul>

          <div className="mt-6">
            <button
              type={isOnboarding ? "button" : "button"}
              disabled={checkoutLoading}
              onClick={isOnboarding && onSelectPlan
                ? () => onSelectPlan({ plan: "pro", annual })
                : () => void handleProCheckout()
              }
              className={buttonClassName("primary", cn("w-full px-4 py-2.5", btnBase))}
            >
              {checkoutLoading ? "Abriendo checkout…" : "Probar gratis 7 días"}
            </button>
          </div>
          {checkoutError && (
            <p className="mt-2 text-center text-xs text-red-400" role="alert">
              {checkoutError}
            </p>
          )}
        </div>

        {/* ────── SCALE ────── */}
        <div
          className={cn(
            "flex flex-col rounded-2xl border border-white/10 p-6 max-md:col-span-2 max-md:w-full max-md:max-w-[22rem] max-md:justify-self-center max-md:p-4",
            glassCard
          )}
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35">Para marcas en crecimiento</p>
          <h3 className="mt-1.5 text-xl font-bold text-white max-md:text-lg">Scale</h3>
          <p className="mt-1 text-sm text-white/40">Tu operador de crecimiento con IA ilimitada</p>

          <PriceBlock
            annualUsd={SCALE_ANNUAL_USD}
            monthlyUsd={SCALE_MONTHLY_REF_USD}
            billingAnnual={annual}
          />

          {/* ROI anchor */}
          <RoiAnchor
            text="IA ilimitada + simulaciones de escenarios. Sabés exactamente qué pasa si tomás cada decisión antes de tomarla."
            highlight="antes de tomarla."
          />

          <p className="mt-4 text-[10px] font-semibold uppercase tracking-widest text-white/25">
            Órdenes ilimitadas · Todo Pro +
          </p>

          <ul className="mt-3 flex flex-1 flex-col gap-2.5">
            <FeatureLine text="Margify AI — consultas ilimitadas, sin restricciones" highlight isAI />
            <FeatureLine text="Revisión semanal automática con IA" isAI />
            <FeatureLine text='Simulaciones: "¿Qué pasa si bajo el presupuesto 20%?"' />
            <FeatureLine text="LTV, cohortes y métricas de retención" />
            <FeatureLine text="Alertas inteligentes ilimitadas" />
            <FeatureLine text="Multi-cliente y gestión de equipos" />
            <FeatureLine text="Reportes profesionales con tu marca" />
          </ul>

          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              disabled={checkoutLoading}
              onClick={isOnboarding && onSelectPlan
                ? () => onSelectPlan({ plan: "scale", annual })
                : () => void handleScaleCheckout()
              }
              className={buttonClassName("primary", cn("w-full px-4 py-2.5", btnBase))}
            >
              {checkoutLoading ? "Abriendo checkout…" : "Probar Scale 7 días"}
            </button>
            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClassName("secondary", "w-full px-4 py-2 text-sm font-semibold")}
              >
                Hablar con ventas
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Positioning footnote ── */}
      <p className="mt-6 text-center text-xs text-white/25">
        Margify no es un dashboard más. Es la capa de inteligencia que convierte datos en decisiones con impacto en dinero.
      </p>
    </div>
  );
}
