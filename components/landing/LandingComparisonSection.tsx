import { landingGlassPanel } from "@/lib/landing-glass-styles";
import { cn } from "@/lib/utils";

const FEATURES = [
  "Margen neto real (ventas menos ads y costos)",
  "ROAS real descontando devoluciones y costos",
  "Rentabilidad por producto individual",
  "Alertas cuando el margen cae",
  "Cashflow proyectado",
] as const;

const COMPETITOR_COLUMNS = [
  {
    key: "stores",
    label: "TiendaNube / Shopify / MercadoLibre",
    minW: "min-w-[9.5rem]",
  },
  { key: "ads", label: "Meta / TikTok / Google Ads", minW: "min-w-[8.5rem]" },
  { key: "excel", label: "Excel", minW: "min-w-[4.5rem]" },
] as const;

const MARGIFY_COL =
  "bg-margify-cyan/12 text-margify-cyan border-margify-cyan/25";

const thCenter = "px-3 py-3.5 text-center font-semibold text-neutral-300 md:px-4";
const tdCenter = "px-3 py-3.5 text-center md:px-4";

function CellMark({ ok }: { ok: boolean }) {
  return (
    <span
      className={cn(
        "text-base font-semibold tabular-nums",
        ok ? "text-emerald-400" : "text-margify-negative/75"
      )}
      aria-hidden
    >
      {ok ? "✓" : "✗"}
    </span>
  );
}

export function LandingComparisonSection() {
  return (
    <section
      className="relative z-10 mt-10 pt-12 pb-12 md:mt-14 md:pt-16 md:pb-16 lg:mt-20 lg:pt-20 lg:pb-20"
      aria-labelledby="comparison-heading"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <h2
          id="comparison-heading"
          className="mx-auto max-w-3xl text-center text-2xl font-bold leading-snug tracking-tight text-white md:text-3xl lg:text-[2rem]"
        >
          Tu tienda te dice cuánto vendiste. Margify te dice cuánto ganaste.
        </h2>

        <div
          className={cn(
            "mt-8 -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0",
            "[scrollbar-width:thin] [scrollbar-color:rgba(100,223,223,0.35)_transparent]"
          )}
        >
          <table
            className={cn(
              "w-full min-w-[52rem] border-collapse text-left text-sm md:text-[15px]",
              landingGlassPanel,
              "overflow-hidden rounded-card"
            )}
          >
            <thead>
              <tr className="border-b border-white/10">
                <th
                  scope="col"
                  className="min-w-[10.5rem] px-4 py-3.5 font-semibold text-white md:px-5"
                >
                  Funcionalidad
                </th>
                {COMPETITOR_COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={cn(thCenter, col.minW)}
                  >
                    <span className="inline-block max-w-[9rem] leading-snug md:max-w-none">
                      {col.label}
                    </span>
                  </th>
                ))}
                <th
                  scope="col"
                  className={cn(thCenter, "min-w-[5.5rem]", MARGIFY_COL, "border-x")}
                >
                  Margify
                </th>
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((label, i) => (
                <tr
                  key={label}
                  className={cn(
                    "border-b border-white/8 last:border-b-0",
                    i % 2 === 1 && "bg-black/20"
                  )}
                >
                  <td className="px-4 py-3.5 font-medium text-margify-text/95 md:px-5">
                    {label}
                  </td>
                  {COMPETITOR_COLUMNS.map((col) => (
                    <td key={col.key} className={tdCenter}>
                      <CellMark ok={false} />
                      <span className="sr-only">No disponible en {col.label}</span>
                    </td>
                  ))}
                  <td className={cn(tdCenter, MARGIFY_COL, "border-x")}>
                    <CellMark ok />
                    <span className="sr-only">Disponible en Margify</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
