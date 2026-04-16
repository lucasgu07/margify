import type { ProductProfit } from "@/types";

export type MarginBand = "all" | "high" | "mid" | "low";
export type ProfitFilter = "all" | "profit" | "loss";
export type ProductSortKey = "margin_percent" | "profit" | "revenue" | "units_sold" | "name";

export type ProductFilterState = {
  query: string;
  marginBand: MarginBand;
  profitFilter: ProfitFilter;
  minUnits: number;
  sortBy: ProductSortKey;
  sortDir: "asc" | "desc";
};

export const DEFAULT_PRODUCT_FILTERS: ProductFilterState = {
  query: "",
  marginBand: "all",
  profitFilter: "all",
  minUnits: 0,
  sortBy: "profit",
  sortDir: "desc",
};

function marginMatches(band: MarginBand, m: number): boolean {
  if (band === "all") return true;
  if (band === "high") return m >= 30;
  if (band === "mid") return m >= 15 && m < 30;
  return m < 15;
}

export function filterAndSortProducts(
  products: ProductProfit[],
  f: ProductFilterState
): ProductProfit[] {
  const q = f.query.trim().toLowerCase();
  let out = products.filter((p) => {
    if (q && !p.name.toLowerCase().includes(q)) return false;
    if (f.profitFilter === "profit" && p.profit < 0) return false;
    if (f.profitFilter === "loss" && p.profit >= 0) return false;
    if (p.units_sold < f.minUnits) return false;
    if (!marginMatches(f.marginBand, p.margin_percent)) return false;
    return true;
  });

  const dir = f.sortDir === "asc" ? 1 : -1;
  const key = f.sortBy;
  out = [...out].sort((a, b) => {
    if (key === "name") {
      const cmp = a.name.localeCompare(b.name, "es");
      return dir * cmp;
    }
    const va = a[key] as number;
    const vb = b[key] as number;
    return dir * (va - vb);
  });

  return out;
}
