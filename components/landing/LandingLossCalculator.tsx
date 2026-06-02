"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { buttonClassName } from "@/components/ui/Button";

function parseAmount(raw: string): number {
  const n = Number.parseFloat(raw.replace(/,/g, "."));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

const IOS_ATTRIBUTION_GAP_PCT = 25;

export function LandingLossCalculator() {
  const [revenueRaw, setRevenueRaw] = useState("");
  const [adsRaw, setAdsRaw] = useState("");
  const [marginRaw, setMarginRaw] = useState("");
  const [showResults, setShowResults] = useState(false);

  const results = useMemo(() => {
    const revenue = parseAmount(revenueRaw);
    const ads = parseAmount(adsRaw);
    const marginPct = parseAmount(marginRaw);
    const profit = revenue * (marginPct / 100) - ads;
    const profitShareOfRevenue = revenue > 0 ? (profit / revenue) * 100 : 0;
    const marginGapLossMonthly = revenue * 0.05;
    const marginGapLossYearly = marginGapLossMonthly * 12;

    return {
      revenue,
      ads,
      marginPct,
      profit,
      profitShareOfRevenue,
      marginGapLossMonthly,
      marginGapLossYearly,
    };
  }, [revenueRaw, adsRaw, marginRaw]);

  const handleCalculate = () => {
    setShowResults(true);
  };

  const profitIsLow = results.revenue > 0 && results.profitShareOfRevenue < 10;

  return (
    <section
      id="calculadora-perdida"
      className="relative z-10 scroll-mt-32 py-14 md:py-20"
      aria-labelledby="loss-calculator-heading"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="loss-calculator-heading"
            className="text-[32px] font-bold leading-tight text-white"
          >
            ¿Cuánto estás perdiendo sin saberlo?
          </h2>
          <p className="mt-3 text-neutral-400">
            Completá tres datos y te mostramos el número que nadie te quiere decir
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-[600px] rounded-xl border border-[#222222] bg-[#111111] p-8">
          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-neutral-300">
                ¿Cuánto facturás por mes?
              </span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                  $
                </span>
                <input
                  type="number"
                  min={0}
                  inputMode="decimal"
                  placeholder="USD 10.000"
                  value={revenueRaw}
                  onChange={(e) => setRevenueRaw(e.target.value)}
                  className="w-full rounded-lg border border-[#222222] bg-black/40 py-3 pl-8 pr-3 text-white placeholder:text-neutral-600 focus:border-[#64DFDF]/50 focus:outline-none focus:ring-1 focus:ring-[#64DFDF]/40"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-neutral-300">
                ¿Cuánto gastás en Meta Ads por mes?
              </span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                  $
                </span>
                <input
                  type="number"
                  min={0}
                  inputMode="decimal"
                  placeholder="USD 2.000"
                  value={adsRaw}
                  onChange={(e) => setAdsRaw(e.target.value)}
                  className="w-full rounded-lg border border-[#222222] bg-black/40 py-3 pl-8 pr-3 text-white placeholder:text-neutral-600 focus:border-[#64DFDF]/50 focus:outline-none focus:ring-1 focus:ring-[#64DFDF]/40"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-neutral-300">
                ¿Cuál es tu margen estimado?
              </span>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  inputMode="decimal"
                  placeholder="25"
                  value={marginRaw}
                  onChange={(e) => setMarginRaw(e.target.value)}
                  className="w-full rounded-lg border border-[#222222] bg-black/40 py-3 pl-3 pr-10 text-white placeholder:text-neutral-600 focus:border-[#64DFDF]/50 focus:outline-none focus:ring-1 focus:ring-[#64DFDF]/40"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">
                  %
                </span>
              </div>
            </label>

            <button
              type="button"
              onClick={handleCalculate}
              className={buttonClassName(
                "primary",
                "w-full border-0 bg-[#64DFDF] font-bold text-black hover:bg-[#64DFDF]/90"
              )}
            >
              Calcular mi pérdida real
            </button>
          </div>

          {showResults ? (
            <div className="mt-8 space-y-6 border-t border-[#222222] pt-8">
              <div>
                <p className="text-sm font-semibold text-[#64DFDF]">ROAS que Meta no te muestra</p>
                <p className="mt-2 text-sm leading-relaxed text-neutral-300">
                  Meta te oculta el {IOS_ATTRIBUTION_GAP_PCT}% de tus conversiones desde iOS 14. Esto
                  significa que tu ROAS real podría ser hasta un 35% menor al que ves en Ads Manager.
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-[#64DFDF]">Ganancia real estimada</p>
                <p
                  className={
                    profitIsLow
                      ? "mt-2 text-sm leading-relaxed text-red-400"
                      : "mt-2 text-sm leading-relaxed text-[#64DFDF]"
                  }
                >
                  {results.revenue <= 0 && results.marginPct <= 0 ? (
                    "Completá facturación y margen para ver tu ganancia estimada."
                  ) : profitIsLow ? (
                    <>
                      Tu ganancia neta estimada es {formatUsd(results.profit)} — solo el{" "}
                      {results.profitShareOfRevenue.toFixed(1)}% de tu facturación. ¿Estás seguro de que
                      ese número es real?
                    </>
                  ) : (
                    <>
                      Tu ganancia neta estimada es {formatUsd(results.profit)} — el{" "}
                      {results.profitShareOfRevenue.toFixed(1)}% de tu facturación después de ads.
                    </>
                  )}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-[#64DFDF]">Costo de no saberlo</p>
                <p className="mt-2 text-sm leading-relaxed text-neutral-300">
                  Si tu margen real es 5% menor al estimado, estás perdiendo{" "}
                  {formatUsd(results.marginGapLossMonthly)} por mes —{" "}
                  {formatUsd(results.marginGapLossYearly)} al año — sin saberlo.
                </p>
              </div>

              <Link
                href="/auth/register"
                className={buttonClassName(
                  "primary",
                  "mt-2 w-full border-0 bg-[#64DFDF] text-center font-bold text-black hover:bg-[#64DFDF]/90"
                )}
              >
                Conectá Margify y descubrí el número exacto
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
