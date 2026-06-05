"use client";

import { useState } from "react";
import Link from "next/link";
import { Brain, Check, X } from "lucide-react";
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

const PRO_ANNUAL_USD = 16;
const PRO_MONTHLY_USD = 19;
const SCALE_ANNUAL_USD = 41;
const SCALE_MONTHLY_USD = 49;

// ─── Feature line ─────────────────────────────────────────────────────────────

function FeatureLine({
  text,
  included = true,
  highlight = false,
  isAI = false,
}: {
  text: string;
  included?: boolean;
  highlight?: boolean;
  isAI?: boolean;
}) {
  return (
    <li className="flex items-start gap-2.5 text-sm leading-snug">
      {included ? (
        isAI ? (
          <Brain className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#64DFDF]" aria-hidden strokeWidth={2} />
        ) : (
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#64DFDF]" aria-hidden strokeWidth={2.5} />
        )
      ) : (
        <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/20" aria-hidden strokeWidth={2} />
      )}
      <span className={cn(included ? (highlight ? "font-semibold text-white" : "text-white/70") : "text-white/25")}>
        {text}
      </span>
    </li>
  );
}

// ─── Price block ──────────────────────────────────────────────────────────────

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
      <p className={cn("text-3xl font-bold tabular-nums leading-none max-md:text-2xl", cyan ? "text-[#64DFDF]" : "text-white")}>
        USD {displayUsd}
        <span className="ml-1 text-sm font-normal text-white/40">/ mes</span>
      </p>
      <div className="grid [&>*]:col-start-1 [&>*]:row-start-1">
        <p className={cn("text-xs text-white/35", !billingAnnual && "invisible")} aria-hidden={!billingAnnual}>
          Facturación anual · 2 meses gratis incluidos
        </p>
        <p className={cn("text-xs text-white/35", billingAnnual && "invisible")} aria-hidden={billingAnnual}>
          Con plan anual: USD {annualUsd}/mes · 2 meses gratis
        </p>
      </div>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type SelectedPlanId = "free" | "pro" | "scale";

export type SelectedPlanChoice = {
  plan: SelectedPlanId;
  annual: boolean;
};

type PricingPlansContentProps = {
  variant: "landing" | "onboarding";
  onSelectPlan?: (choice: SelectedPlanChoice) => void;
};

// ─── Main component ───────────────────────────────────────────────────────────

export function PricingPlansContent({ variant, onSelectPlan }: PricingPlansContentProps) {
  const [annual, setAnnual] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const isOnboarding = variant === "onboarding";
  const glassCard = !isOnboarding ? cn(landingGlassPanel, landingGlassPanelHover) : undefined;
  const waUrl = getWhatsAppChatUrl();

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

  function freeCta() {
    const classes = buttonClassName("secondary", "w-full px-4 py-2.5 text-sm font-semibold");
    if (isOnboarding && onSelectPlan) {
      return (
        <button type="button" className={classes} onClick={() => onSelectPlan({ plan: "free", annual })}>
          Empezar gratis
        </button>
      );
    }
    return <Link href="/auth/register" className={classes}>Empezar gratis</Link>;
  }

  function proCta() {
    const classes = buttonClassName(
      "primary",
      "w-full px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
    );
    const label = checkoutLoading ? "Abriendo checkout…" : "Probar gratis 14 días";
    if (isOnboarding && onSelectPlan) {
      return (
        <button type="button" className={classes} onClick={() => onSelectPlan({ plan: "pro", annual })}>
          {label}
        </button>
      );
    }
    return (
      <button type="button" className={classes} disabled={checkoutLoading} onClick={() => void handleProCheckout()}>
        {label}
      </button>
    );
  }

  function scaleCta() {
    const primaryClasses = buttonClassName(
      "primary",
      "w-full px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
    );
    const secondaryClasses = buttonClassName("secondary", "w-full px-4 py-2 text-sm font-semibold");
    const label = checkoutLoading ? "Abriendo checkout…" : "Probar gratis 14 días";
    const primary = isOnboarding && onSelectPlan ? (
      <button type="button" className={primaryClasses} onClick={() => onSelectPlan({ plan: "scale", annual })}>
        {label}
      </button>
    ) : (
      <button type="button" className={primaryClasses} disabled={checkoutLoading} onClick={() => void handleScaleCheckout()}>
        {label}
      </button>
    );
    return (
      <div className="flex flex-col gap-2">
        {primary}
        {waUrl && (
          <a href={waUrl} target="_blank" rel="noopener noreferrer" className={secondaryClasses}>
            Hablar con ventas
          </a>
        )}
      </div>
    );
  }

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
            <span className="rounded-full bg-black/20 px-1.5 py-0.5 text-[10px] font-bold leading-none">
              2 meses gratis
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

      {/* ── Grid ── */}
      <div className="mx-auto mt-8 grid max-w-6xl items-stretch gap-4 max-md:grid-cols-2 max-md:gap-3 md:grid-cols-3 md:gap-6">

        {/* ── GRATIS ── */}
        <div className={cn("flex flex-col rounded-2xl border border-white/10 p-6 max-md:p-4", glassCard)}>
          <h3 className="text-xl font-bold text-white max-md:text-lg">Gratis</h3>
          <p className="mt-1 text-sm text-white/40">Hasta 30 órdenes · para siempre</p>

          <div className="mt-4 space-y-1">
            <p className="text-3xl font-bold text-white max-md:text-2xl">$0</p>
            <p className="text-xs text-white/35 opacity-0" aria-hidden>—</p>
            <p className="text-xs text-white/35 opacity-0" aria-hidden>—</p>
          </div>

          <ul className="mt-5 flex flex-1 flex-col gap-2.5">
            <FeatureLine text="Dashboard de rentabilidad en tiempo real" />
            <FeatureLine text="TiendaNube, Shopify y MercadoLibre" />
            <FeatureLine text="Cálculo automático de margen real" />
            <FeatureLine text="Ganancia neta por orden" />
            <FeatureLine text="Historial de 7 días" />
            <FeatureLine text="Alertas por email" />
            <FeatureLine text="Meta, Google y TikTok Ads" included={false} />
            <FeatureLine text="ROAS real" included={false} />
            <FeatureLine text="Margify AI" included={false} />
            <FeatureLine text="Alertas por WhatsApp" included={false} />
          </ul>

          <div className="mt-6">{freeCta()}</div>
        </div>

        {/* ── PRO (featured) ── */}
        <div
          className={cn(
            "relative flex flex-col rounded-2xl border-2 border-[#64DFDF] p-6 shadow-[0_0_32px_rgba(100,223,223,0.12)] max-md:p-4",
            glassCard
          )}
        >
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            <Badge type="success" label="Más popular" className="w-fit" />
            {annual && <Badge type="success" label="Mejor precio" className="w-fit" />}
          </div>

          <h3 className="text-xl font-bold text-white max-md:text-lg">Pro</h3>
          <p className="mt-1 text-sm text-white/50">Órdenes ilimitadas</p>

          <PriceBlock annualUsd={PRO_ANNUAL_USD} monthlyUsd={PRO_MONTHLY_USD} billingAnnual={annual} cyan />

          <ul className="mt-5 flex flex-1 flex-col gap-2.5">
            <FeatureLine text="Todo el plan Gratis +" highlight />
            <FeatureLine text="Meta Ads con ROAS real" />
            <FeatureLine text="Google Ads y TikTok Ads" />
            <FeatureLine text="ROAS real vs ROAS reportado por Meta" />
            <FeatureLine text="Rentabilidad por producto y SKU" />
            <FeatureLine
              text="Margify AI — recomendaciones concretas de qué pausar, escalar o revisar hoy"
              highlight
              isAI
            />
            <FeatureLine text="Alertas por WhatsApp en tiempo real" />
            <FeatureLine text="Pausar y activar campañas desde Margify" />
            <FeatureLine text="Cashflow proyectado" />
            <FeatureLine text="Historial ilimitado" />
            <FeatureLine text="Soporte prioritario por chat" />
          </ul>

          <div className="mt-6">{proCta()}</div>
          {checkoutError && (
            <p className="mt-2 text-center text-xs text-red-400" role="alert">{checkoutError}</p>
          )}
        </div>

        {/* ── SCALE ── */}
        <div
          className={cn(
            "flex flex-col rounded-2xl border border-white/10 p-6 max-md:col-span-2 max-md:w-full max-md:max-w-[22rem] max-md:justify-self-center max-md:p-4",
            glassCard
          )}
        >
          <h3 className="text-xl font-bold text-white max-md:text-lg">Scale</h3>
          <p className="mt-1 text-sm text-white/40">Para tiendas y agencias que escalan</p>

          <PriceBlock annualUsd={SCALE_ANNUAL_USD} monthlyUsd={SCALE_MONTHLY_USD} billingAnnual={annual} />

          <ul className="mt-5 flex flex-1 flex-col gap-2.5">
            <FeatureLine text="Todo el plan Pro +" highlight />
            <FeatureLine text="Margify AI ilimitado en tiempo real" highlight isAI />
            <FeatureLine text="Portal multi-cliente para agencias" />
            <FeatureLine text="Accesos acotados por cliente" />
            <FeatureLine text="Datos separados por cliente sin mezclar" />
            <FeatureLine text="Alertas inteligentes y reglas ilimitadas" />
            <FeatureLine text="LTV y tasa de recompra por canal" />
            <FeatureLine text="Onboarding 1 a 1 incluido" />
            <FeatureLine text="Soporte 24/7 por WhatsApp" />
          </ul>

          <div className="mt-6">{scaleCta()}</div>
        </div>
      </div>

      {/* ── Footer note ── */}
      <p className="mt-8 text-center text-sm text-white/40">
        14 días de prueba completa en todos los planes · Sin tarjeta de crédito · Cancelás cuando querés
      </p>
    </div>
  );
}
