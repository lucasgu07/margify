"use client";

import { Shield, TrendingUp, Zap } from "lucide-react";
import { PricingPlansContent } from "@/components/landing/PricingPlansContent";

// ─── Guarantee strip ──────────────────────────────────────────────────────────

function GuaranteeStrip() {
  return (
    <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
      {[
        { icon: <Zap className="h-3.5 w-3.5" />, text: "7 días gratis en planes pagos" },
        { icon: <Shield className="h-3.5 w-3.5" />, text: "Sin tarjeta de crédito" },
        { icon: <TrendingUp className="h-3.5 w-3.5" />, text: "Cancelás cuando querés" },
      ].map(({ icon, text }) => (
        <div key={text} className="flex items-center gap-2 text-sm text-white/40">
          <span className="text-[#64DFDF]/60">{icon}</span>
          {text}
        </div>
      ))}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function LandingPricing() {
  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6">
      {/* ROI pill */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#64DFDF]/20 bg-[#64DFDF]/8 px-4 py-1.5 text-xs font-semibold text-[#64DFDF]/80">
          <span className="h-1.5 w-1.5 rounded-full bg-[#64DFDF]" />
          Clientes Pro detectan gasto desperdiciado la primera semana
        </div>
      </div>

      {/* Headline */}
      <div className="mt-6 text-center">
        <h2 className="text-3xl font-bold leading-tight text-white md:text-4xl lg:text-5xl">
          No estás pagando por dashboards.
          <br />
          <span className="text-[#64DFDF]">Estás pagando por saber dónde ganar más.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-white/50">
          Margify analiza tus ads, márgenes y campañas para decirte exactamente qué hacer hoy.
          En lenguaje de negocio, con impacto en dinero.
        </p>
      </div>

      {/* Pricing cards */}
      <div className="mt-10">
        <PricingPlansContent variant="landing" />
      </div>

      {/* Guarantee strip */}
      <GuaranteeStrip />
    </div>
  );
}
