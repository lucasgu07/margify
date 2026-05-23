"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonClassName } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
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

/** Pro: anual USD/mes (principal) vs mensual de referencia. */
const PRO_ANNUAL_USD = 26;
const PRO_MONTHLY_REF_USD = 39;
const SCALE_ANNUAL_USD = 67;
const SCALE_MONTHLY_REF_USD = Math.round((SCALE_ANNUAL_USD * PRO_MONTHLY_REF_USD) / PRO_ANNUAL_USD);

/** Precio según facturación anual (efectivo/mes) o mensual. */
function PaidPlanPrice({
  annualUsd,
  monthlyUsd,
  billingAnnual,
  featured,
}: {
  annualUsd: number;
  monthlyUsd: number;
  billingAnnual: boolean;
  featured?: boolean;
}) {
  const priceColor = featured ? "text-margify-cyan" : "text-white";
  const displayUsd = billingAnnual ? annualUsd : monthlyUsd;

  return (
    <div className="mt-2 space-y-1.5">
      <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-margify-cyan/85">
        {billingAnnual ? "Facturación anual" : "Facturación mensual"}
      </p>
      <p className={cn("text-3xl font-bold tabular-nums leading-none max-md:text-2xl", priceColor)}>
        USD {displayUsd}
        <span className="ml-1 text-base font-normal text-margify-muted">/ mes</span>
      </p>
      {/* Misma altura en anual/mensual: ambos bloques ocupan la grilla (el oculto sigue midiendo). */}
      <div className="grid [&>*]:col-start-1 [&>*]:row-start-1">
        <div className={cn("space-y-1.5", !billingAnnual && "invisible")} aria-hidden={!billingAnnual}>
          <p className="text-xs leading-snug text-margify-muted">10 meses al año · 2 sin cargo</p>
          <p className="border-t border-margify-border/50 pt-1.5 text-xs leading-snug text-margify-muted">
            Ref. mes a mes:{" "}
            <span className="text-neutral-400">USD {monthlyUsd} / mes</span>
          </p>
        </div>
        <div className={cn("space-y-1.5", billingAnnual && "invisible")} aria-hidden={billingAnnual}>
          <p className="text-xs leading-snug text-margify-muted">
            Con facturación anual:{" "}
            <span className="text-neutral-300">USD {annualUsd} / mes</span>
            <span className="text-margify-muted"> (2 meses sin cargo)</span>
          </p>
          <p
            className="border-t border-margify-border/50 pt-1.5 text-xs leading-snug text-margify-muted opacity-0"
            aria-hidden
          >
            &nbsp;
          </p>
        </div>
      </div>
    </div>
  );
}

const planCardClass =
  "flex h-full min-h-0 w-full min-w-0 flex-col max-md:p-4 max-md:[&_h3]:text-base";

/** Separador fino antes de features (sin agrandar la tarjeta). */
const paidFeaturesClass = "mt-3 border-t border-margify-border/40 pt-3";

const freeFeatures = [
  "Dashboard y ganancia neta en tiempo real",
  "Integración completa con tu tienda (TiendaNube, Shopify o Mercado Libre)",
  "Historial de datos (1 mes)",
  "Alertas por email",
  "Control total de anuncios (Meta, TikTok y Google)",
] as const;

const proFeatures = [
  "Todo lo del plan Gratis +",
  "Historial de datos ilimitado",
  "ROAS real",
  "Rentabilidad por producto",
  "Automatización de campañas",
  "Alertas por email y WhatsApp",
  "Margify AI con recomendaciones + Asistente con AI (15 consultas/mes)",
  "API access",
  "Soporte prioritario",
] as const;

const scaleFeatures = [
  "Todo lo del plan Pro +",
  "Asistente con AI en tiempo real (consultas ilimitadas)",
  "Detección automática de oportunidades para escalar",
  "Métricas avanzadas (LTV, cohortes, retención)",
  "Alertas inteligentes y reglas ilimitadas",
  "Multi-cliente y gestión de equipos",
  "Reportes profesionales con tu marca",
  "Integraciones completas y sin límites",
] as const;

function FeatureList({
  items,
  emphasisFirst,
  className,
}: {
  items: readonly string[];
  emphasisFirst?: boolean;
  className?: string;
}) {
  return (
    <ul className={cn("mt-4 flex flex-1 flex-col gap-2.5", className)}>
      {items.map((text, i) => (
        <li key={`${text}-${i}`} className="flex gap-2 text-sm leading-snug text-neutral-300">
          <Check
            className="mt-0.5 h-4 w-4 shrink-0 text-margify-cyan"
            aria-hidden
            strokeWidth={2.5}
          />
          <span
            className={cn(
              emphasisFirst && i === 0 && "font-semibold text-margify-text"
            )}
          >
            {text}
          </span>
        </li>
      ))}
    </ul>
  );
}

export type SelectedPlanId = "free" | "pro" | "scale";

export type SelectedPlanChoice = {
  plan: SelectedPlanId;
  /** Si aplica a Pro/Scale; en Gratis o “probar 7 días” no cambia el cobro todavía (demo). */
  annual: boolean;
};

type PricingPlansContentProps = {
  variant: "landing" | "onboarding";
  /** En onboarding, se llama al elegir un plan (misma UI que la landing; los botones reemplazan los links a registro). */
  onSelectPlan?: (choice: SelectedPlanChoice) => void;
};

/**
 * Misma sección de planes que la home (`variant="landing"`) o flujo post-registro (`variant="onboarding"`).
 */
export function PricingPlansContent({ variant, onSelectPlan }: PricingPlansContentProps) {
  const [annual, setAnnual] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const isOnboarding = variant === "onboarding";
  const glassCard = !isOnboarding ? cn(landingGlassPanel, landingGlassPanelHover) : undefined;

  async function handleProCheckout() {
    setCheckoutError(null);
    setCheckoutLoading(true);
    try {
      await startDodoCheckout(getProDodoProductId(annual));
    } catch {
      setCheckoutError("No pudimos abrir el checkout. Intentá de nuevo en un momento.");
      setCheckoutLoading(false);
    }
  }

  async function handleScaleCheckout() {
    setCheckoutError(null);
    setCheckoutLoading(true);
    try {
      await startDodoCheckout(getScaleDodoProductId(annual));
    } catch {
      setCheckoutError("No pudimos abrir el checkout. Intentá de nuevo en un momento.");
      setCheckoutLoading(false);
    }
  }

  function cta(
    plan: SelectedPlanId,
    label: string,
    style: "primary" | "secondary",
    href = "/auth/register",
    featured = false
  ) {
    const classes = buttonClassName(
      style,
      featured
        ? "mt-auto w-full px-4 py-2.5 text-sm font-semibold max-md:mt-3"
        : "mt-auto w-fit self-center px-4 py-2 text-sm font-semibold max-md:mt-3"
    );
    const external = href.startsWith("http");
    if (isOnboarding && onSelectPlan && !external) {
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

  function proCheckoutCta() {
    const classes = buttonClassName(
      "primary",
      "mt-auto w-full px-4 py-2.5 text-sm font-semibold max-md:mt-3 disabled:cursor-not-allowed disabled:opacity-60"
    );

    if (isOnboarding) {
      return (
        <button
          type="button"
          className={classes}
          disabled={checkoutLoading}
          onClick={() => void handleProCheckout()}
        >
          {checkoutLoading ? "Abriendo checkout…" : "Probar gratis 7 días"}
        </button>
      );
    }

    return (
      <button
        type="button"
        className={classes}
        disabled={checkoutLoading}
        onClick={() => void handleProCheckout()}
      >
        {checkoutLoading ? "Abriendo checkout…" : "Probar gratis 7 días"}
      </button>
    );
  }

  function scaleCheckoutCta() {
    const waUrl = getWhatsAppChatUrl();
    const primaryClasses = buttonClassName(
      "primary",
      "mt-auto w-full px-4 py-2.5 text-sm font-semibold max-md:mt-3 disabled:cursor-not-allowed disabled:opacity-60"
    );
    const secondaryClasses = buttonClassName(
      "secondary",
      "mt-2 w-full px-4 py-2 text-sm font-semibold max-md:mt-2"
    );

    return (
      <div className="mt-auto flex w-full flex-col">
        <button
          type="button"
          className={primaryClasses}
          disabled={checkoutLoading}
          onClick={() => void handleScaleCheckout()}
        >
          {checkoutLoading ? "Abriendo checkout…" : "Probar Scale 7 días"}
        </button>
        {waUrl ? (
          <a href={waUrl} target="_blank" rel="noopener noreferrer" className={secondaryClasses}>
            Hablar con ventas
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6">
      <h2 className="text-center text-3xl font-bold text-white md:text-4xl">Planes</h2>

      <div
        className={cn(
          "mx-auto mt-8 flex max-w-md justify-center rounded-full border p-1",
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
            "min-h-[2.5rem] flex-1 rounded-full px-4 py-2 text-sm font-medium transition-all duration-margify",
            annual ? "bg-margify-cyan text-black" : "text-margify-muted hover:text-white"
          )}
        >
          Anual
        </button>
        <button
          type="button"
          onClick={() => setAnnual(false)}
          className={cn(
            "min-h-[2.5rem] flex-1 rounded-full px-4 py-2 text-sm font-medium transition-all duration-margify",
            !annual ? "bg-margify-cyan text-black" : "text-margify-muted hover:text-white"
          )}
        >
          Mensual
        </button>
      </div>
      <div className="mx-auto mt-2 max-w-md grid [&>*]:col-start-1 [&>*]:row-start-1 text-center text-xs text-neutral-400">
        <p className={cn(!annual && "invisible")} aria-hidden={!annual}>
          Plan anual: cobrás 10 meses por año (2 meses sin cargo).
        </p>
        <p className={cn(annual && "invisible")} aria-hidden={annual}>
          Facturación mes a mes, sin compromiso anual.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-6xl max-md:grid-cols-2 max-md:gap-3 items-stretch gap-6 md:grid-cols-3 md:gap-6 lg:gap-8">
        <Card className={cn(planCardClass, glassCard)}>
          <CardTitle>Gratis</CardTitle>
          <p className="mt-1 text-sm font-bold text-white">Hasta 30 órdenes por mes</p>
          <p className="mt-2 text-3xl font-bold text-white max-md:text-2xl">Gratis</p>
          <FeatureList items={freeFeatures} />
          {cta("free", "Empezar gratis", "secondary")}
        </Card>

        <Card
          className={cn(
            planCardClass,
            glassCard,
            "border-2 border-margify-cyan shadow-[0_0_0_1px_rgba(100,223,223,0.35)]"
          )}
        >
          <div className="mb-2 flex flex-wrap gap-1.5">
            <Badge type="success" label="Más popular" className="w-fit" />
            <Badge
              type="success"
              label="Mejor precio · anual"
              className={cn("w-fit", !annual && "invisible")}
              aria-hidden={!annual}
            />
          </div>
          <CardTitle>Pro</CardTitle>
          <p className="mt-1 text-sm font-bold text-white">Órdenes ilimitadas</p>
          <PaidPlanPrice
            annualUsd={PRO_ANNUAL_USD}
            monthlyUsd={PRO_MONTHLY_REF_USD}
            billingAnnual={annual}
            featured
          />
          <FeatureList items={proFeatures} emphasisFirst className={paidFeaturesClass} />
          {proCheckoutCta()}
          {checkoutError ? (
            <p className="mt-2 text-center text-xs text-red-400" role="alert">
              {checkoutError}
            </p>
          ) : null}
        </Card>

        <Card
          className={cn(
            planCardClass,
            glassCard,
            "max-md:col-span-2 max-md:w-full max-md:max-w-[22rem] max-md:justify-self-center"
          )}
        >
          <CardTitle>Scale</CardTitle>
          <p className="mt-1 text-sm font-bold text-white">Órdenes ilimitadas</p>
          <PaidPlanPrice
            annualUsd={SCALE_ANNUAL_USD}
            monthlyUsd={SCALE_MONTHLY_REF_USD}
            billingAnnual={annual}
          />
          <FeatureList items={scaleFeatures} emphasisFirst className={paidFeaturesClass} />
          {scaleCheckoutCta()}
        </Card>
      </div>
    </div>
  );
}
