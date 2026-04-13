"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonClassName } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

/** Precio mensual equivalente si pagás 10 meses al año (2 meses gratis). */
function annualMonthlyEquivalent(usd: number) {
  return Math.round((usd * 10) / 12);
}

type PaidPlan = {
  name: string;
  monthlyUsd: number;
  ordersLine: string;
  cta: string;
  featured?: boolean;
};

const paidPlans: PaidPlan[] = [
  { name: "Growth", monthlyUsd: 22, ordersLine: "/ mes · hasta 500 órdenes.", cta: "Elegir Growth" },
  {
    name: "Pro",
    monthlyUsd: 67,
    ordersLine: "/ mes · hasta 2000 órdenes.",
    cta: "Elegir Pro",
    featured: true,
  },
  { name: "Scale", monthlyUsd: 91, ordersLine: "/ mes · 2000+ órdenes.", cta: "Elegir Scale" },
  {
    name: "Plan Agencias",
    monthlyUsd: 149,
    ordersLine: "/ mes · hasta 15 clientes.",
    cta: "Hablar con ventas",
  },
];

function PaidPlanPrice({
  monthlyUsd,
  annual,
  featured,
}: {
  monthlyUsd: number;
  annual: boolean;
  featured?: boolean;
}) {
  const color = featured ? "text-margify-cyan" : "text-white";
  const equiv = annualMonthlyEquivalent(monthlyUsd);

  if (!annual) {
    return <p className={cn("mt-2 text-3xl font-bold tabular-nums", color)}>USD {monthlyUsd}</p>;
  }

  return (
    <div className="mt-2">
      <p className="text-sm text-margify-muted line-through">USD {monthlyUsd} / mes</p>
      <p className={cn("mt-1 text-3xl font-bold tabular-nums", color)}>
        USD {equiv}
        <span className="ml-1 text-base font-normal text-margify-muted">/ mes</span>
      </p>
      <p className="mt-1 text-xs leading-snug text-margify-muted">
        Equivalente con facturación anual (ahorrás 2 meses).
      </p>
    </div>
  );
}

export function LandingPricing() {
  const [annual, setAnnual] = useState(false);

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

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardTitle>Starter</CardTitle>
          <p className="mt-2 text-3xl font-bold text-white">Gratis</p>
          <CardDescription className="mt-1">Hasta 30 órdenes / mes.</CardDescription>
          <Link
            href="/auth/register"
            className={buttonClassName("secondary", "mt-6 block w-full text-center")}
          >
            Empezar
          </Link>
        </Card>

        {paidPlans.map((plan) =>
          plan.featured ? (
            <Card
              key={plan.name}
              className="border-margify-cyan shadow-[0_0_0_1px_rgba(100,223,223,0.35)]"
            >
              <Badge type="success" label="Más popular" className="mb-2" />
              <CardTitle>{plan.name}</CardTitle>
              <PaidPlanPrice monthlyUsd={plan.monthlyUsd} annual={annual} featured />
              <CardDescription className={annual ? "mt-3" : "mt-1"}>{plan.ordersLine}</CardDescription>
              <Link
                href="/auth/register"
                className={buttonClassName("primary", "mt-6 block w-full text-center")}
              >
                {plan.cta}
              </Link>
            </Card>
          ) : (
            <Card key={plan.name}>
              <CardTitle>{plan.name}</CardTitle>
              <PaidPlanPrice monthlyUsd={plan.monthlyUsd} annual={annual} />
              <CardDescription className={annual ? "mt-3" : "mt-1"}>{plan.ordersLine}</CardDescription>
              <Link
                href="/auth/register"
                className={buttonClassName("secondary", "mt-6 block w-full text-center")}
              >
                {plan.cta}
              </Link>
            </Card>
          )
        )}
      </div>

      <div className="mt-10 flex flex-col items-center gap-2">
        <Link
          href="/auth/register"
          className={buttonClassName("primary", "w-full max-w-md px-8 py-3 text-center sm:w-auto")}
        >
          Probar gratis 7 días
        </Link>
        <p className="text-center text-xs text-margify-muted">Probá la app 7 días sin compromiso.</p>
      </div>
    </div>
  );
}
