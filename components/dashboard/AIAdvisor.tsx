import { Brain } from "lucide-react";
import { buttonClassName } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

const tips = [
  "Tu campaña \"Lanzamiento jean\" lleva 4 días con ROAS real de 0,8x y gastó $12.400. Te recomendamos pausarla hoy y reasignar presupuesto a \"Remarketing carrito\", que mantiene 4,0x real.",
  "El margen de \"Medias pack x3\" cayó al 9%: revisá costo de proveedor o subí precio un 6% para volver a zona saludable (>15%).",
  "Detectamos picos de comisión de pago en MercadoLibre (+0,6 pp vs. promedio). Activá alerta de margen en WhatsApp para que te avisemos si vuelve a pasar.",
];

export function AIAdvisor() {
  return (
    <Card className="border-margify-cyan/40 bg-gradient-to-br from-margify-card to-margify-black">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-margify-cyan/15">
          <Brain className="h-7 w-7 text-margify-cyan" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Margify AI recomienda</h2>
            <p className="text-sm text-margify-muted">
              Acciones concretas basadas en tus ventas, costos y campañas reales.
            </p>
          </div>
          <ul className="space-y-2 text-sm leading-relaxed text-margify-text">
            {tips.map((t, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-margify-cyan" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/dashboard/campanas"
            className={buttonClassName("primary", "mt-2 w-full sm:w-auto")}
          >
            Ver análisis completo
          </Link>
        </div>
      </div>
    </Card>
  );
}
