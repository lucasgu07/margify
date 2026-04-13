import type { Order } from "@/types";
import type { DateRangeKey } from "@/types";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function filterOrdersByRange(orders: Order[], range: DateRangeKey): Order[] {
  const now = startOfDay(new Date());
  const todayStr = now.toISOString().slice(0, 10);

  if (range === "today") {
    return orders.filter((o) => o.date === todayStr);
  }

  const from = new Date(now);
  if (range === "week") from.setDate(from.getDate() - 6);
  else if (range === "30d") from.setDate(from.getDate() - 29);
  else if (range === "month") {
    from.setDate(1);
  }

  const fromStr = from.toISOString().slice(0, 10);
  return orders.filter((o) => o.date >= fromStr && o.date <= todayStr);
}

export function filterSeriesByRange<T extends { date: string }>(
  series: T[],
  range: DateRangeKey
): T[] {
  const n = range === "today" ? 1 : range === "week" ? 7 : range === "month" ? 30 : 30;
  return series.slice(-n);
}
