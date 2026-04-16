import type { Campaign } from "@/types";
import { formatCurrency } from "@/lib/utils";

/** Filas de la tabla: todas las métricas posibles (las columnas visibles se filtran en la UI). */
export type CampaignTableRow = {
  id: string;
  nombre: string;
  gasto: number;
  ventas: number;
  conversiones: number;
  roasMeta: number;
  roasReal: number;
  diff: number;
  cpa: number;
  impresiones: number;
  clics: number;
  ctr: number;
  cpc: number;
  cpm: number;
  alcance: number;
  frecuencia: number;
  estado: Campaign["status"];
};

export type CampaignMetricKey = keyof Omit<CampaignTableRow, "id" | "nombre">;

/** Métricas opcionales (todo salvo nombre fijo y columna de acción). */
export const CAMPAIGN_METRIC_OPTIONS: {
  key: CampaignMetricKey;
  label: string;
  description: string;
}[] = [
  { key: "gasto", label: "Importe gastado", description: "Spend total del período" },
  { key: "ventas", label: "Ventas atribuidas", description: "Valor de compra / conversiones atribuidas" },
  { key: "conversiones", label: "Conversiones", description: "Conversiones reportadas en el modelo" },
  { key: "roasMeta", label: "ROAS (Meta)", description: "Retorno según el Ads Manager" },
  { key: "roasReal", label: "ROAS real (Margify)", description: "ROAS con ventas verificadas" },
  { key: "diff", label: "Diferencia % Meta vs real", description: "Brecha entre ROAS de plataforma y real" },
  { key: "cpa", label: "CPA", description: "Costo por conversión (gasto / conversiones)" },
  { key: "impresiones", label: "Impresiones", description: "Veces que se mostró el anuncio" },
  { key: "clics", label: "Clics (enlaces)", description: "Clics en el anuncio" },
  { key: "ctr", label: "CTR", description: "Clics / impresiones" },
  { key: "cpc", label: "CPC", description: "Costo por clic" },
  { key: "cpm", label: "CPM", description: "Costo por mil impresiones" },
  { key: "alcance", label: "Alcance", description: "Cuentas alcanzadas (estimado)" },
  { key: "frecuencia", label: "Frecuencia", description: "Impresiones / alcance" },
];

/** Estado y Pausar/Activar son columnas fijas al inicio de la tabla (no se eligen en el panel). */
const DEFAULT_VISIBLE: CampaignMetricKey[] = [
  "gasto",
  "ventas",
  "roasMeta",
  "roasReal",
  "diff",
];

export const CAMPAIGN_TABLE_STORAGE_KEY = "margify-campanas-metricas-tabla";

export function loadCampaignMetricVisibility(): Set<CampaignMetricKey> {
  if (typeof window === "undefined") {
    return new Set(DEFAULT_VISIBLE);
  }
  try {
    const raw = window.localStorage.getItem(CAMPAIGN_TABLE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as string[];
      const valid = new Set(CAMPAIGN_METRIC_OPTIONS.map((o) => o.key));
      const filtered = parsed.filter((k): k is CampaignMetricKey => valid.has(k as CampaignMetricKey));
      return new Set(filtered);
    }
  } catch {
    /* ignore */
  }
  return new Set(DEFAULT_VISIBLE);
}

export function saveCampaignMetricVisibility(keys: Set<CampaignMetricKey>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    CAMPAIGN_TABLE_STORAGE_KEY,
    JSON.stringify(Array.from(keys))
  );
}

export function buildCampaignTableRows(campaigns: Campaign[]): CampaignTableRow[] {
  return campaigns.map((c) => {
    const conv = Math.max(1, c.conversions ?? 1);
    const diff =
      c.roas_platform > 0 ? ((c.roas_real - c.roas_platform) / c.roas_platform) * 100 : 0;
    const cpa = c.spend / conv;
    const seed = c.id.split("").reduce((a, ch) => a + ch.charCodeAt(0), 0);
    const impresiones = Math.max(800, Math.round(c.spend * 62 + c.attributed_revenue * 1.8 + (seed % 200)));
    const clics = Math.max(
      12,
      Math.round(impresiones * (0.007 + (seed % 7) * 0.0004))
    );
    const ctr = (clics / impresiones) * 100;
    const cpc = c.spend / clics;
    const cpm = (c.spend / impresiones) * 1000;
    const alcance = Math.round(impresiones * (0.78 + (seed % 10) * 0.004));
    const frecuencia = impresiones / Math.max(1, alcance);

    return {
      id: c.id,
      nombre: c.campaign_name,
      gasto: c.spend,
      ventas: c.attributed_revenue,
      conversiones: c.conversions ?? 0,
      roasMeta: c.roas_platform,
      roasReal: c.roas_real,
      diff,
      cpa,
      impresiones,
      clics,
      ctr,
      cpc,
      cpm,
      alcance,
      frecuencia,
      estado: c.status,
    };
  });
}

export function formatMetricCell(key: CampaignMetricKey, row: CampaignTableRow): string {
  switch (key) {
    case "gasto":
    case "ventas":
    case "cpa":
    case "cpc":
    case "cpm":
      return formatCurrency(row[key]);
    case "conversiones":
    case "impresiones":
    case "clics":
    case "alcance":
      return new Intl.NumberFormat("es-AR").format(Math.round(row[key] as number));
    case "roasMeta":
    case "roasReal":
      return `${(row[key] as number).toFixed(2)}x`;
    case "diff":
      return `${(row[key] as number) > 0 ? "+" : ""}${(row[key] as number).toFixed(1)}%`;
    case "ctr":
      return `${(row[key] as number).toFixed(2)}%`;
    case "frecuencia":
      return (row[key] as number).toFixed(2);
    case "estado":
      return row.estado === "active" ? "Activa" : "Pausada";
    default:
      return "";
  }
}
