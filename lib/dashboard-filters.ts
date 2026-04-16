import type { Order } from "@/types";
import type { DateRangeKey } from "@/types";
import { formatDate } from "@/lib/utils";

/** Etiquetas alineadas con el selector de fechas del header */
export const DATE_RANGE_LABELS: Record<DateRangeKey, string> = {
  today: "Hoy",
  week: "Esta semana",
  month: "Este mes",
  "30d": "Últimos 30 días",
  "6m": "Últimos 6 meses",
  "1y": "Un año",
  year: "Este año",
  custom: "Personalizar fechas…",
};

/** Orden del desplegable de rangos */
export const DATE_RANGE_OPTIONS: DateRangeKey[] = [
  "today",
  "week",
  "month",
  "30d",
  "6m",
  "1y",
  "year",
  "custom",
];

export type CustomDateBounds = { fromStr: string; toStr: string };

export function formatCustomRangeLabel(bounds: CustomDateBounds): string {
  return `${formatDate(bounds.fromStr, "short")} – ${formatDate(bounds.toStr, "short")}`;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** YYYY-MM-DD en calendario local (evita desfases UTC de toISOString). */
export function isoDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Filtra por tienda conectada; `null` = todas las tiendas. */
export function filterOrdersByStore(orders: Order[], storeId: string | null): Order[] {
  if (storeId === null) return orders;
  return orders.filter((o) => o.store_id === storeId);
}

/** Inicio y fin (YYYY-MM-DD locales) del rango; `today` es un solo día. */
export function getDateRangeBounds(
  range: DateRangeKey,
  customRange?: CustomDateBounds | null
): { fromStr: string; toStr: string } {
  const now = startOfDay(new Date());
  const todayStr = isoDateLocal(now);

  if (range === "custom") {
    if (customRange?.fromStr && customRange?.toStr) {
      let a = customRange.fromStr;
      let b = customRange.toStr;
      if (a > b) {
        const t = a;
        a = b;
        b = t;
      }
      return { fromStr: a, toStr: b };
    }
    return getDateRangeBounds("30d");
  }

  if (range === "today") {
    return { fromStr: todayStr, toStr: todayStr };
  }

  if (range === "month") {
    return {
      fromStr: isoDateLocal(new Date(now.getFullYear(), now.getMonth(), 1)),
      toStr: todayStr,
    };
  }

  if (range === "year") {
    return {
      fromStr: isoDateLocal(new Date(now.getFullYear(), 0, 1)),
      toStr: todayStr,
    };
  }

  if (range === "6m") {
    const from = new Date(now);
    from.setMonth(from.getMonth() - 6);
    return { fromStr: isoDateLocal(from), toStr: todayStr };
  }

  if (range === "1y") {
    const from = new Date(now);
    from.setDate(from.getDate() - 364);
    return { fromStr: isoDateLocal(from), toStr: todayStr };
  }

  const from = new Date(now);
  if (range === "week") from.setDate(from.getDate() - 6);
  else from.setDate(from.getDate() - 29);

  return { fromStr: isoDateLocal(from), toStr: todayStr };
}

export function filterOrdersByRange(
  orders: Order[],
  range: DateRangeKey,
  customRange?: CustomDateBounds | null
): Order[] {
  if (range === "today") {
    const todayStr = isoDateLocal(startOfDay(new Date()));
    return orders.filter((o) => o.date === todayStr);
  }
  const { fromStr, toStr } = getDateRangeBounds(range, customRange);
  return orders.filter((o) => o.date >= fromStr && o.date <= toStr);
}
