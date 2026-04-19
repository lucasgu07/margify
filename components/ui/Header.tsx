"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CalendarRange, ChevronDown, Plus } from "lucide-react";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { Button } from "@/components/ui/Button";
import type { DateRangeKey } from "@/types";
import { DATE_RANGE_LABELS, DATE_RANGE_OPTIONS, isoDateLocal } from "@/lib/dashboard-filters";
import type { CustomDateBounds } from "@/lib/dashboard-filters";
import { formatDate } from "@/lib/utils";
import { IntegrationBrandIcon, storePlatformToBrandId } from "@/components/ui/IntegrationBrandIcon";
import { adsPlatformToBrandId } from "@/lib/integration-brands";
import type { AdsPlatformScope } from "@/types";
import { cn } from "@/lib/utils";

const PATHS_WITH_STORE_SCOPE = new Set([
  "/dashboard/rentabilidad",
  "/dashboard/productos",
  "/dashboard/cashflow",
]);

const ADS_PLATFORM_OPTIONS: { id: AdsPlatformScope; label: string }[] = [
  { id: "meta", label: "Meta Ads" },
  { id: "tiktok", label: "TikTok Ads" },
  { id: "google", label: "Google Ads" },
];

export function Header({
  userName,
  showDateRange = true,
  showConnect,
  onConnect,
}: {
  userName: string;
  /** En Configuración no hace falta el selector de fechas. */
  showDateRange?: boolean;
  showConnect?: boolean;
  onConnect?: () => void;
}) {
  const pathname = usePathname() ?? "";
  const showStoreScope =
    pathname === "/dashboard" || PATHS_WITH_STORE_SCOPE.has(pathname);
  const showAdsPlatformScope = pathname === "/dashboard/campanas";
  const {
    dateRange,
    setDateRange,
    customRange,
    setCustomRange,
    rangeDisplayLabel,
    storeScope,
    setStoreScope,
    adsPlatform,
    setAdsPlatform,
    connectedStores,
  } = useDashboard();

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Buenos días";
    if (h < 19) return "Buenas tardes";
    return "Buenas noches";
  }, []);

  const selectedStore = useMemo(
    () => connectedStores.find((s) => s.id === storeScope),
    [connectedStores, storeScope]
  );

  const [customPanelOpen, setCustomPanelOpen] = useState(false);
  const [draft, setDraft] = useState<CustomDateBounds>(customRange);
  const dateWrapRef = useRef<HTMLDivElement>(null);

  const todayStr = useMemo(() => isoDateLocal(new Date()), []);

  useEffect(() => {
    if (customPanelOpen) setDraft(customRange);
  }, [customPanelOpen, customRange]);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dateWrapRef.current && !dateWrapRef.current.contains(e.target as Node)) {
        setCustomPanelOpen(false);
      }
    }
    if (customPanelOpen) {
      document.addEventListener("mousedown", handleOutside);
      return () => document.removeEventListener("mousedown", handleOutside);
    }
  }, [customPanelOpen]);

  function selectAllStores() {
    setStoreScope("all");
  }

  function selectOneStoreMode() {
    const first = connectedStores[0]?.id;
    if (first) setStoreScope(first);
  }

  function onRangeSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value as DateRangeKey;
    setDateRange(v);
    if (v === "custom") setCustomPanelOpen(true);
    else setCustomPanelOpen(false);
  }

  function applyCustomRange() {
    let a = draft.fromStr;
    let b = draft.toStr;
    if (!a?.trim() || !b?.trim()) return;
    if (a > b) {
      const t = a;
      a = b;
      b = t;
    }
    setCustomRange({ fromStr: a, toStr: b });
    setCustomPanelOpen(false);
  }

  return (
    <header className="mb-6 border-b border-margify-border pb-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <h1 className="shrink-0 text-2xl font-bold leading-tight text-white max-md:w-full md:text-3xl lg:mr-2">
          {greeting}, {userName}
        </h1>
        <div className="flex w-full min-w-0 flex-col gap-3 md:flex-1 md:flex-row md:flex-wrap md:items-center lg:flex-row lg:items-center lg:justify-between lg:gap-4">
          <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:flex-wrap md:gap-x-4 md:gap-y-2 lg:flex-1">
            {showStoreScope ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="sr-only">Alcance de métricas</span>
                <div className="flex flex-wrap gap-1 rounded-control border border-margify-border bg-margify-card p-1">
                  <button
                    type="button"
                    onClick={selectAllStores}
                    className={cn(
                      "rounded-control px-3 py-1.5 text-xs font-medium transition-all duration-margify md:text-sm",
                      storeScope === "all"
                        ? "bg-margify-cyan/15 text-margify-cyan"
                        : "text-margify-muted hover:text-margify-text"
                    )}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={selectOneStoreMode}
                    className={cn(
                      "rounded-control px-3 py-1.5 text-xs font-medium transition-all duration-margify md:text-sm",
                      storeScope !== "all"
                        ? "bg-margify-cyan/15 text-margify-cyan"
                        : "text-margify-muted hover:text-margify-text"
                    )}
                  >
                    Por plataforma
                  </button>
                </div>
                {storeScope !== "all" ? (
                  <label className="flex min-w-0 items-center gap-2">
                    <span className="sr-only">Elegir tienda</span>
                    {selectedStore ? (
                      <IntegrationBrandIcon
                        brand={storePlatformToBrandId(selectedStore.platform)}
                        size="xs"
                      />
                    ) : null}
                    <select
                      value={storeScope}
                      onChange={(e) => setStoreScope(e.target.value)}
                      className="max-w-[min(100%,280px)] truncate rounded-control border border-margify-border bg-margify-cardAlt py-1.5 pl-2 pr-8 text-xs text-white md:text-sm"
                    >
                      {connectedStores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>
            ) : null}
            {showAdsPlatformScope ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="sr-only">Plataforma de publicidad</span>
                <div className="flex max-w-full flex-wrap gap-1 rounded-control border border-margify-border bg-margify-card p-1">
                  {ADS_PLATFORM_OPTIONS.map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setAdsPlatform(id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-control px-2.5 py-1.5 text-xs font-medium transition-all duration-margify md:px-3 md:text-sm",
                        adsPlatform === id
                          ? "bg-margify-cyan/15 text-margify-cyan"
                          : "text-margify-muted hover:text-margify-text"
                      )}
                    >
                      <IntegrationBrandIcon brand={adsPlatformToBrandId(id)} size="xs" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-end lg:w-auto lg:shrink-0">
            {showConnect ? (
              <Button
                type="button"
                variant="secondary"
                className="shrink-0 border-margify-cyan/40 text-margify-cyan"
                onClick={onConnect}
              >
                <Plus className="h-4 w-4" />
                Conectar plataforma
              </Button>
            ) : null}
            {showDateRange ? (
              <div ref={dateWrapRef} className="relative min-w-[12rem] max-w-[min(100%,22rem)]">
                <label className="sr-only" htmlFor="header-date-range">
                  Rango de fechas
                </label>
                <select
                  id="header-date-range"
                  value={dateRange}
                  onChange={onRangeSelectChange}
                  className={cn(
                    "h-10 w-full cursor-pointer appearance-none rounded-control border border-margify-border",
                    "bg-margify-card py-2 pl-3 pr-10 text-left text-sm font-medium text-white",
                    "transition-colors duration-margify hover:border-margify-cyan/50 focus:border-margify-cyan focus:outline-none focus:ring-1 focus:ring-margify-cyan/40"
                  )}
                >
                  {DATE_RANGE_OPTIONS.map((key) => (
                    <option key={key} value={key}>
                      {DATE_RANGE_LABELS[key]}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-margify-cyan"
                  aria-hidden
                />
                {dateRange === "custom" ? (
                  <p className="mt-1 truncate text-xs text-margify-muted" title={rangeDisplayLabel}>
                    {rangeDisplayLabel}
                  </p>
                ) : null}

                {customPanelOpen ? (
                  <div
                    className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-1.5rem,20rem)] rounded-card border border-margify-border bg-margify-card p-4 shadow-xl"
                    role="dialog"
                    aria-label="Elegir fechas personalizadas"
                  >
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
                      <CalendarRange className="h-4 w-4 shrink-0 text-margify-cyan" aria-hidden />
                      Período personalizado
                    </div>
                    <p className="mb-3 text-xs text-margify-muted">
                      Elegí desde y hasta. Los datos del dashboard respetan este rango.
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label htmlFor="custom-from" className="mb-1 block text-xs text-margify-muted">
                          Desde
                        </label>
                        <input
                          id="custom-from"
                          type="date"
                          max={todayStr}
                          value={draft.fromStr}
                          onChange={(e) => setDraft((d) => ({ ...d, fromStr: e.target.value }))}
                          className="w-full rounded-control border border-margify-border bg-margify-cardAlt px-3 py-2 text-sm text-white [color-scheme:dark]"
                        />
                      </div>
                      <div>
                        <label htmlFor="custom-to" className="mb-1 block text-xs text-margify-muted">
                          Hasta
                        </label>
                        <input
                          id="custom-to"
                          type="date"
                          max={todayStr}
                          value={draft.toStr}
                          onChange={(e) => setDraft((d) => ({ ...d, toStr: e.target.value }))}
                          className="w-full rounded-control border border-margify-border bg-margify-cardAlt px-3 py-2 text-sm text-white [color-scheme:dark]"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button type="button" className="flex-1" onClick={applyCustomRange}>
                        Aplicar
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setCustomPanelOpen(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <p className="mt-3 text-sm text-margify-muted">{formatDate(new Date(), "long")}</p>
    </header>
  );
}
