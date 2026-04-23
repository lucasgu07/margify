"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonClassName } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

/** Precio mensual equivalente si pagás 10 meses al año (2 meses gratis). */
function annualMonthlyEquivalent(usd: number) {
  return Math.round((usd * 10) / 12);
}

/** Mismo % de descuento que Pro (26 vs 39) aplicado a Scale → precio de lista mensual. */
const PRO_LIST_USD = 39;
const PRO_PRICE_USD = 26;
const SCALE_PRICE_USD = 67;
const SCALE_LIST_USD = Math.round((SCALE_PRICE_USD * PRO_LIST_USD) / PRO_PRICE_USD);

function PaidPlanPrice({
  monthlyUsd,
  listUsd,
  annual,
  featured,
}: {
  monthlyUsd: number;
  listUsd: number;
  annual: boolean;
  featured?: boolean;
}) {
  const color = featured ? "text-margify-cyan" : "text-white";
  const equiv = annualMonthlyEquivalent(monthlyUsd);

  if (!annual) {
    return (
      <div className="mt-2">
        <p className="text-sm text-margify-muted line-through max-md:text-xs">USD {listUsd} / mes</p>
        <p className={cn("text-3xl font-bold tabular-nums max-md:text-2xl", color)}>USD {monthlyUsd}</p>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <p className="text-sm text-margify-muted line-through max-md:text-xs">USD {listUsd} / mes</p>
      <p className="text-sm text-margify-muted line-through max-md:text-xs">USD {monthlyUsd} / mes</p>
      <p className={cn("mt-1 text-3xl font-bold tabular-nums max-md:text-2xl", color)}>
        USD {equiv}
        <span className="ml-1 text-base font-normal text-margify-muted">/ mes</span>
      </p>
      <p className="mt-1 text-xs leading-snug text-margify-muted">
        Equivalente con facturación anual (ahorrás 2 meses).
      </p>
    </div>
  );
}

const planCardClass =
  "flex h-full min-h-0 w-full min-w-0 flex-col max-md:p-4 max-md:[&_h3]:text-base";

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

function FeatureList({ items, emphasisFirst }: { items: readonly string[]; emphasisFirst?: boolean }) {
  return (
    <ul className="mt-4 flex flex-1 flex-col gap-2.5">
      {items.map((text, i) => (
        <li key={`${text}-${i}`} className="flex gap-2 text-sm leading-snug text-margify-muted">
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
  const [annual, setAnnual] = useState(false);
  const isOnboarding = variant === "onboarding";

  function cta(
    plan: SelectedPlanId,
    label: string,
    style: "primary" | "secondary"
  ) {
    const classes = buttonClassName(
      style,
      "mt-auto block w-full pt-6 text-center max-md:pt-4"
    );
    if (isOnboarding && onSelectPlan) {
      return (
        <button type="button" className={classes} onClick={() => onSelectPlan({ plan, annual })}>
          {label}
        </button>
      );
    }
    return (
      <Link href="/auth/register" className={classes}>
        {label}
      </Link>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6">
      <h2 className="text-center text-3xl font-bold text-white md:text-4xl">Planes</h2>

      <div
        className="mx-auto mt-8 flex max-w-md justify-center rounded-full border border-margify-border bg-margify-black p-1"
        role="group"
        aria-label="Facturación"
      >
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
      </div>
      <p className="mt-2 text-center text-xs text-margify-muted">
        Plan anual: cobrás 10 meses por año (2 meses sin cargo).
      </p>

      <div className="mx-auto mt-10 grid max-w-6xl max-md:grid-cols-2 max-md:gap-3 items-stretch gap-6 md:grid-cols-3 md:gap-6 lg:gap-8">
        <Card className={planCardClass}>
          <CardTitle>Gratis</CardTitle>
          <p className="mt-1 text-sm font-bold text-white">Hasta 30 órdenes por mes</p>
          <p className="mt-2 text-3xl font-bold text-white max-md:text-2xl">Gratis</p>
          <FeatureList items={freeFeatures} />
          {cta("free", "Empezar", "secondary")}
        </Card>

        <Card
          className={cn(
            planCardClass,
            "border-margify-cyan shadow-[0_0_0_1px_rgba(100,223,223,0.35)]"
          )}
        >
          <Badge type="success" label="Más popular" className="mb-2 w-fit" />
          <CardTitle>Pro</CardTitle>
          <p className="mt-1 text-sm font-bold text-white">Órdenes ilimitadas</p>
          <PaidPlanPrice
            monthlyUsd={PRO_PRICE_USD}
            listUsd={PRO_LIST_USD}
            annual={annual}
            featured
          />
          <FeatureList items={proFeatures} emphasisFirst />
          {cta("pro", "Elegir Pro", "primary")}
        </Card>

        <Card
          className={cn(
            planCardClass,
            "max-md:col-span-2 max-md:w-full max-md:max-w-[22rem] max-md:justify-self-center"
          )}
        >
          <CardTitle>Scale</CardTitle>
          <p className="mt-1 text-sm font-bold text-white">Órdenes ilimitadas</p>
          <PaidPlanPrice monthlyUsd={SCALE_PRICE_USD} listUsd={SCALE_LIST_USD} annual={annual} />
          <FeatureList items={scaleFeatures} emphasisFirst />
          {cta("scale", "Elegir Scale", "secondary")}
        </Card>
      </div>

      <div className="mt-10 flex flex-col items-center gap-2">
        {isOnboarding && onSelectPlan ? (
          <button
            type="button"
            onClick={() => onSelectPlan({ plan: "free", annual: false })}
            className={buttonClassName("primary", "w-full max-w-md px-8 py-3 text-center sm:w-auto")}
          >
            Probar gratis 7 días
          </button>
        ) : (
          <Link
            href="/auth/register"
            className={buttonClassName("primary", "w-full max-w-md px-8 py-3 text-center sm:w-auto")}
          >
            Probar gratis 7 días
          </Link>
        )}
        <p className="text-center text-xs text-margify-muted">Probá la app 7 días sin compromiso.</p>
      </div>
    </div>
  );
}
