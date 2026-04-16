import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import type { ProductFilterState, ProductSortKey } from "@/lib/product-filters";
const MIN_UNITS_OPTIONS = [0, 1, 5, 10, 25, 50];

export const SORT_LABELS: Record<ProductSortKey, string> = {
  margin_percent: "Margen %",
  profit: "Ganancia",
  revenue: "Ingresos",
  units_sold: "Unidades vendidas",
  name: "Nombre (A–Z)",
};

const selectClass =
  "mt-1.5 w-full rounded-control border border-margify-border bg-margify-cardAlt px-3 py-2 text-sm text-white outline-none transition-[border] duration-margify focus:border-margify-cyan";

type Props = {
  idPrefix: string;
  filters: ProductFilterState;
  onUpdate: <K extends keyof ProductFilterState>(key: K, value: ProductFilterState[K]) => void;
  onReset: () => void;
};

export function ProductFiltersFields({ idPrefix, filters, onUpdate, onReset }: Props) {
  const id = (s: string) => `${idPrefix}-${s}`;

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <div>
        <Label htmlFor={id("search")}>Buscar por nombre</Label>
        <Input
          id={id("search")}
          placeholder="Ej. jean, medias…"
          value={filters.query}
          onChange={(e) => onUpdate("query", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor={id("margin")}>Margen %</Label>
        <select
          id={id("margin")}
          className={selectClass}
          value={filters.marginBand}
          onChange={(e) => onUpdate("marginBand", e.target.value as ProductFilterState["marginBand"])}
        >
          <option value="all">Todos</option>
          <option value="high">Alto (≥ 30%)</option>
          <option value="mid">Medio (15% – &lt; 30%)</option>
          <option value="low">Bajo (&lt; 15%)</option>
        </select>
      </div>
      <div>
        <Label htmlFor={id("profit")}>Rentabilidad</Label>
        <select
          id={id("profit")}
          className={selectClass}
          value={filters.profitFilter}
          onChange={(e) =>
            onUpdate("profitFilter", e.target.value as ProductFilterState["profitFilter"])
          }
        >
          <option value="all">Todos</option>
          <option value="profit">Solo con ganancia</option>
          <option value="loss">Solo con pérdida</option>
        </select>
      </div>
      <div>
        <Label htmlFor={id("units")}>Unidades mínimas vendidas</Label>
        <select
          id={id("units")}
          className={selectClass}
          value={filters.minUnits}
          onChange={(e) => onUpdate("minUnits", Number(e.target.value))}
        >
          {MIN_UNITS_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n === 0 ? "Cualquiera" : `Al menos ${n}`}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor={id("sort")}>Ordenar por</Label>
        <select
          id={id("sort")}
          className={selectClass}
          value={filters.sortBy}
          onChange={(e) => onUpdate("sortBy", e.target.value as ProductSortKey)}
        >
          {(Object.keys(SORT_LABELS) as ProductSortKey[]).map((k) => (
            <option key={k} value={k}>
              {SORT_LABELS[k]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor={id("dir")}>Dirección</Label>
        <select
          id={id("dir")}
          className={selectClass}
          value={filters.sortDir}
          onChange={(e) => onUpdate("sortDir", e.target.value as "asc" | "desc")}
        >
          <option value="desc">Mayor a menor</option>
          <option value="asc">Menor a mayor</option>
        </select>
      </div>
      <div className="flex items-end sm:col-span-2 lg:col-span-1">
        <Button type="button" variant="secondary" className="w-full" onClick={onReset}>
          Restablecer filtros
        </Button>
      </div>
    </div>
  );
}
