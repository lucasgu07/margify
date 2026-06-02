import { landingGlassPanel } from "@/lib/landing-glass-styles";
import { cn } from "@/lib/utils";

const FEATURES = [
  "Margen neto real (ventas menos ads y costos)",
  "ROAS real descontando devoluciones y costos",
  "Rentabilidad por producto individual",
  "Alertas cuando el margen cae",
  "Cashflow proyectado",
  "Recomendaciones de IA sobre qué hacer hoy",
  "Alertas por WhatsApp en tiempo real",
] as const;

const COMPETITOR_COLUMNS = [
  { key: "stores", label: "TiendaNube / Shopify / ML", minW: "min-w-[9.5rem]" },
  { key: "ads", label: "Meta / TikTok / Google", minW: "min-w-[8.5rem]" },
  { key: "excel", label: "Excel", minW: "min-w-[4.5rem]" },
] as const;

const thBase =
  "px-3 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wide text-[#888888] md:px-4";
const tdCenter = "px-3 py-3.5 text-center md:px-4";

function CellMark({ ok }: { ok: boolean }) {
  return (
    <span
      className="text-[18px] font-semibold leading-none tabular-nums"
      style={{ color: ok ? "#64DFDF" : "#ff4444" }}
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

        <div className="mt-8 -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0 [scrollbar-width:thin] [scrollbar-color:rgba(100,223,223,0.35)_transparent]">
          <table
            className={cn(
              "w-full min-w-[52rem] overflow-hidden rounded-xl border border-white/10 text-left text-sm md:text-[15px]",
              landingGlassPanel
            )}
          >
            <thead>
              <tr className="bg-white/[0.04]">
                <th
                  scope="col"
                  className="min-w-[10.5rem] border-b border-white/10 px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[#888888] md:px-5"
                >
                  Funcionalidad
                </th>
                {COMPETITOR_COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={cn(thBase, col.minW, "border-b border-l border-white/10")}
                  >
                    <span className="inline-block max-w-[9rem] leading-snug md:max-w-none">
                      {col.label}
                    </span>
                  </th>
                ))}
                <th
                  scope="col"
                  className="min-w-[5.5rem] border-b border-l border-margify-cyan/25 bg-margify-cyan/[0.10] px-3 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wide text-[#64DFDF] md:px-4"
                >
                  Margify
                </th>
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((label, i) => (
                <tr
                  key={label}
                  className={cn(i % 2 === 1 ? "bg-white/[0.025]" : "bg-transparent")}
                >
                  <td className="border-b border-white/8 px-4 py-3.5 text-left font-medium text-margify-text/95 md:px-5">
                    {label}
                  </td>
                  {COMPETITOR_COLUMNS.map((col) => (
                    <td
                      key={col.key}
                      className={cn(tdCenter, "border-b border-l border-white/8")}
                    >
                      <CellMark ok={false} />
                      <span className="sr-only">No disponible en {col.label}</span>
                    </td>
                  ))}
                  <td
                    className={cn(
                      tdCenter,
                      "border-b border-l border-margify-cyan/25 bg-margify-cyan/[0.10]"
                    )}
                  >
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
