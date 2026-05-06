"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CalendarRange, ChevronDown, Plus } from "lucide-react";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { Button } from "@/components/ui/Button";
import type { DateRangeKey } from "@/types";
import { DATE_RANGE_LABELS, DATE_RANGE_OPTIONS, isoDateLocal } from "@/lib/dashboard-filters";
import type { CustomDateBounds } from "@/lib/dashboard-filters";
import { formatDate, cn } from "@/lib/utils";
import { IntegrationBrandIcon, storePlatformToBrandId } from "@/components/ui/IntegrationBrandIcon";
import { adsPlatformToBrandId } from "@/lib/integration-brands";
import type { AdsPlatformScope } from "@/types";
import { multiTouchClusterClasses, multiTouchClusterChildButtonClasses } from "@/lib/multi-touch-cluster";

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
  landingPreview = false,
  /** En la vista previa de la home: toolbar tipo dashboard vs campañas (Meta/TikTok/Google). */
  landingPreviewMode = "dashboard",
  density = "default",
}: {
  userName: string;
  /** En Configuración no hace falta el selector de fechas. */
  showDateRange?: boolean;
  showConnect?: boolean;
  onConnect?: () => void;
  /** En la home, el mismo encabezado que el dashboard principal (alcance tiendas + fechas). */
  landingPreview?: boolean;
  landingPreviewMode?: "dashboard" | "campanas";
  /** Encabezado más denso para vista previa embebida en la landing. */
  density?: "default" | "compact";
}) {
  const pathname = usePathname() ?? "";
  const previewEmbed = landingPreview ? landingPreviewMode : null;
  const showStoreScope =
    previewEmbed === "dashboard" ||
    (!landingPreview && (pathname === "/dashboard" || PATHS_WITH_STORE_SCOPE.has(pathname)));
  const showAdsPlatformScope =
    previewEmbed === "campanas" || (!landingPreview && pathname === "/dashboard/campanas");
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

  const compact = density === "compact";
  /** En el embed de la landing el ancho es ~784px: filas explícitas evitan solapamientos al hacer wrap. */
  const stackedToolbar = landingPreview && compact;

  return (
    <header
      className={cn(
        "border-b border-margify-border",
        compact ? "mb-3 pb-3" : "mb-6 pb-6"
      )}
    >
      <div
        className={cn(
          "flex flex-col",
          stackedToolbar
            ? "gap-2"
            : cn(
                "lg:flex-row lg:items-center lg:justify-between",
                compact ? "gap-2 lg:gap-3" : "gap-4 lg:gap-4"
              )
        )}
      >
        <h1
          className={cn(
            "shrink-0 font-bold leading-tight text-white max-md:w-full",
            stackedToolbar ? "w-full" : "lg:mr-2",
            compact ? "text-lg md:text-xl" : "text-2xl md:text-3xl"
          )}
        >
          {greeting}, {userName}
        </h1>
        <div
          className={cn(
            "flex min-w-0 flex-col",
            stackedToolbar
              ? "w-full gap-2"
              : cn(
                  "w-full md:flex-1 md:flex-row md:flex-wrap md:items-start lg:items-center lg:justify-between",
                  compact ? "gap-2 md:gap-x-3 md:gap-y-2 lg:gap-3" : "gap-3 md:gap-x-4 md:gap-y-2 lg:gap-4"
                )
          )}
        >
          <div
            className={cn(
              "flex min-w-0 flex-col md:flex-row md:flex-wrap md:items-center",
              stackedToolbar
                ? "w-full gap-2"
                : cn("lg:flex-1", compact ? "gap-2 md:gap-x-3 md:gap-y-1.5" : "gap-3 md:gap-x-4 md:gap-y-2")
            )}
          >
            {showStoreScope ? (
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="sr-only">Alcance de métricas</span>
                <div
                  className={cn(
                    "flex flex-wrap gap-1 rounded-control border border-margify-border bg-margify-card p-1",
                    multiTouchClusterClasses
                  )}
                >
                  <button
                    type="button"
                    onClick={selectAllStores}
                    className={cn(
                      "rounded-control font-medium outline-none transition-all duration-200 ease-out motion-safe:hover:brightness-110 focus-visible:ring-2 focus-visible:ring-margify-cyan/40",
                      compact ? "px-2 py-1 text-[11px] md:text-xs" : "px-3 py-1.5 text-xs md:text-sm",
                      storeScope === "all"
                        ? "bg-margify-cyan/15 text-margify-cyan motion-safe:hover:bg-margify-cyan/25"
                        : "text-margify-muted motion-safe:hover:bg-white/5 motion-safe:hover:text-margify-text"
                    )}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={selectOneStoreMode}
                    className={cn(
                      "rounded-control font-medium outline-none transition-all duration-200 ease-out motion-safe:hover:brightness-110 focus-visible:ring-2 focus-visible:ring-margify-cyan/40",
                      compact ? "px-2 py-1 text-[11px] md:text-xs" : "px-3 py-1.5 text-xs md:text-sm",
                      storeScope !== "all"
                        ? "bg-margify-cyan/15 text-margify-cyan motion-safe:hover:bg-margify-cyan/25"
                        : "text-margify-muted motion-safe:hover:bg-white/5 motion-safe:hover:text-margify-text"
                    )}
                  >
                    Por plataforma
                  </button>
                </div>
                {storeScope !== "all" ? (
                  <label className="flex w-full min-w-0 max-w-full items-center gap-2 sm:w-auto sm:max-w-[min(100%,280px)]">
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
                      className={cn(
                        "min-w-0 w-full truncate rounded-control border border-margify-border bg-margify-cardAlt py-1.5 pl-2 pr-8 text-xs text-white sm:w-auto md:text-sm"
                      )}
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
                <div
                  className={cn(
                    "flex max-w-full flex-wrap gap-1 rounded-control border border-margify-border bg-margify-card p-1",
                    multiTouchClusterClasses
                  )}
                >
                  {ADS_PLATFORM_OPTIONS.map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setAdsPlatform(id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-control font-medium outline-none transition-all duration-200 ease-out motion-safe:hover:brightness-110 focus-visible:ring-2 focus-visible:ring-margify-cyan/40",
                        compact ? "px-2 py-1 text-[10px] md:text-xs" : "px-2.5 py-1.5 text-xs md:px-3 md:text-sm",
                        adsPlatform === id
                          ? "bg-margify-cyan/15 text-margify-cyan motion-safe:hover:bg-margify-cyan/25"
                          : "text-margify-muted motion-safe:hover:bg-white/5 motion-safe:hover:text-margify-text"
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

          <div
            className={cn(
              "flex min-w-0 flex-col md:flex-row md:items-center md:justify-end",
              stackedToolbar
                ? "w-full flex-row flex-wrap items-center justify-end gap-2"
                : "w-full",
              !stackedToolbar && "lg:w-auto lg:shrink-0",
              compact ? "gap-2" : "gap-3"
            )}
          >
            {showConnect ? (
              <Button
                type="button"
                variant="secondary"
                className={cn(
                  "shrink-0 border-margify-cyan/40 text-margify-cyan",
                  compact && "h-8 gap-1 px-2.5 py-1.5 text-xs [&_svg]:h-3.5 [&_svg]:w-3.5"
                )}
                onClick={onConnect}
              >
                <Plus className="h-4 w-4" />
                Conectar plataforma
              </Button>
            ) : null}
            {showDateRange ? (
              <div
                ref={dateWrapRef}
                className={cn(
                  "relative min-w-0 shrink-0",
                  stackedToolbar ? "w-full min-w-[12rem] sm:w-auto sm:max-w-[min(100%,22rem)]" : "min-w-[12rem] max-w-[min(100%,22rem)]"
                )}
              >
                <label className="sr-only" htmlFor="header-date-range">
                  Rango de fechas
                </label>
                <select
                  id="header-date-range"
                  value={dateRange}
                  onChange={onRangeSelectChange}
                  className={cn(
                    "w-full cursor-pointer appearance-none rounded-control border border-margify-border",
                    "bg-margify-card pl-3 pr-10 text-left font-medium text-white",
                    "transition-colors duration-margify hover:border-margify-cyan/50 focus:border-margify-cyan focus:outline-none focus:ring-1 focus:ring-margify-cyan/40",
                    compact ? "h-8 py-1 text-xs" : "h-10 py-2 text-sm"
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
                    <div className={cn("mt-4 flex flex-wrap gap-2", multiTouchClusterClasses)}>
                      <Button
                        type="button"
                        className={cn("flex-1", multiTouchClusterChildButtonClasses)}
                        onClick={applyCustomRange}
                      >
                        Aplicar
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className={multiTouchClusterChildButtonClasses}
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
      <p
        className={cn(
          "text-margify-muted",
          compact ? "mt-2 text-[11px] leading-snug" : "mt-3 text-sm"
        )}
      >
        {formatDate(new Date(), "long")}
      </p>
    </header>
  );
}
