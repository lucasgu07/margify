import type { AdvisorPage } from "@/lib/ai-advisor/types";
import type { AdvisorInsights } from "@/lib/ai-advisor-insights";

const PAGE_CTA: Record<AdvisorPage, Pick<AdvisorInsights, "ctaHref" | "ctaLabel">> = {
  dashboard: {
    ctaHref: "/dashboard/rentabilidad",
    ctaLabel: "Ver rentabilidad detallada",
  },
  campanas: {
    ctaHref: "/dashboard/rentabilidad",
    ctaLabel: "Ver impacto en rentabilidad",
  },
  rentabilidad: {
    ctaHref: "/dashboard/productos",
    ctaLabel: "Ir a rentabilidad por producto",
  },
  productos: {
    ctaHref: "/dashboard/rentabilidad",
    ctaLabel: "Ver comparativa de costos",
  },
  cashflow: {
    ctaHref: "/dashboard/alertas",
    ctaLabel: "Configurar alertas de liquidez",
  },
  alertas: {
    ctaHref: "/dashboard/configuracion",
    ctaLabel: "WhatsApp e integraciones",
  },
};

export function defaultCtaForPage(page: AdvisorPage): Pick<AdvisorInsights, "ctaHref" | "ctaLabel"> {
  return PAGE_CTA[page];
}

export function pageLabel(page: AdvisorPage): string {
  switch (page) {
    case "dashboard":
      return "Dashboard principal";
    case "campanas":
      return "Campañas publicitarias";
    case "rentabilidad":
      return "Rentabilidad";
    case "cashflow":
      return "Cashflow";
    case "productos":
      return "Productos";
    case "alertas":
      return "Alertas";
    default:
      return page;
  }
}
