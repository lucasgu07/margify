"use client";

import Link from "next/link";
import { useDemoMode } from "@/components/dashboard/DemoModeContext";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { daysUntil } from "@/lib/dodo-billing";

function planLabel(billingPlan: string | undefined): string {
  return billingPlan === "scale" ? "Scale" : "Pro";
}

/**
 * Avisos de trial, cobro fallido o suscripción pausada/cancelada.
 */
export function BillingStatusBanner() {
  const isDemo = useDemoMode();
  const { billing, plan } = useDashboard();

  if (isDemo || !billing) return null;

  const status = billing.billing_status ?? "none";
  const tier = planLabel(billing.billing_plan);
  const trialDays = daysUntil(billing.trial_ends_at);

  if (status === "trialing" && plan !== "starter") {
    const daysText =
      trialDays === null
        ? "7 días"
        : trialDays === 0
          ? "hoy"
          : trialDays === 1
            ? "1 día"
            : `${trialDays} días`;
    return (
      <div
        role="status"
        className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100"
      >
        Estás en periodo de prueba de <strong>{tier}</strong>. El primer cobro es en{" "}
        <strong>{daysText}</strong> (Dodo Payments cobra automáticamente al terminar el trial).
      </div>
    );
  }

  if (status === "past_due") {
    return (
      <div
        role="alert"
        className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
      >
        No pudimos procesar el último cobro de tu plan {tier}. Actualizá tu método de pago en el
        portal de Dodo Payments o{" "}
        <Link href="/#planes" className="underline hover:text-white">
          elegí un plan de nuevo
        </Link>
        .
      </div>
    );
  }

  if (status === "on_hold") {
    return (
      <div
        role="alert"
        className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
      >
        Tu suscripción {tier} está en pausa. Revisá el estado en Dodo Payments para reactivarla.
      </div>
    );
  }

  if (status === "cancelled" && plan === "starter") {
    return (
      <div
        role="status"
        className="mb-4 rounded-lg border border-zinc-600/50 bg-zinc-800/40 px-4 py-3 text-sm text-zinc-300"
      >
        Tu suscripción terminó. Seguís en el plan Gratis.{" "}
        <Link href="/#planes" className="underline hover:text-white">
          Ver planes
        </Link>
      </div>
    );
  }

  return null;
}
