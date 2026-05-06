"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SquarePen } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { IntegrationBrandIcon } from "@/components/ui/IntegrationBrandIcon";
import { DataTable, type Column } from "@/components/ui/Table";
import {
  buildCampaignTableRows,
  CAMPAIGN_METRIC_OPTIONS,
  type CampaignMetricKey,
  type CampaignTableRow,
  formatMetricCell,
  loadCampaignMetricVisibility,
  saveCampaignMetricVisibility,
} from "@/lib/campaign-table-metrics";
import {
  ADS_PLATFORM_SHORT_LABEL,
  adsPlatformToBrandId,
  type IntegrationBrandId,
} from "@/lib/integration-brands";
import type { AdsPlatformScope, Campaign } from "@/types";
import { multiTouchClusterClasses, multiTouchClusterChildButtonClasses } from "@/lib/multi-touch-cluster";
import { cn } from "@/lib/utils";

function campaignMetricHeader(
  opt: (typeof CAMPAIGN_METRIC_OPTIONS)[number],
  brand: IntegrationBrandId,
  platformShort: string
) {
  const label =
    opt.key === "roasMeta"
      ? `ROAS (${platformShort})`
      : opt.key === "diff"
        ? `Diferencia % ${platformShort} vs real`
        : opt.label;
  const needsPlatformIcon = opt.key === "roasMeta" || opt.key === "diff";
  if (!needsPlatformIcon) return label;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <IntegrationBrandIcon brand={brand} size="xs" />
      {label}
    </span>
  );
}

function buildColumns(
  visible: Set<CampaignMetricKey>,
  onToggleStatus: (id: string) => void,
  adsBrand: IntegrationBrandId,
  platformShort: string
): Column<CampaignTableRow>[] {
  const estadoCol: Column<CampaignTableRow> = {
    key: "estado",
    header: "Estado",
    sortable: true,
    accessor: (r) => r.estado,
    render: (r) => (
      <Badge
        type={r.estado === "active" ? "success" : "neutral"}
        label={r.estado === "active" ? "Activa" : "Pausada"}
      />
    ),
  };

  const actionCol: Column<CampaignTableRow> = {
    key: "acciones",
    header: "Acción",
    sortable: false,
    render: (r) => (
      <button
        type="button"
        onClick={() => onToggleStatus(r.id)}
        className="rounded-control border border-margify-border px-2 py-1 text-xs text-margify-muted transition-colors duration-margify hover:border-margify-cyan hover:text-margify-cyan"
      >
        {r.estado === "active" ? "Pausar" : "Activar"}
      </button>
    ),
  };

  const nombreCol: Column<CampaignTableRow> = {
    key: "nombre",
    header: "Campaña",
    sortable: true,
    accessor: (r) => r.nombre,
  };

  const ordered = CAMPAIGN_METRIC_OPTIONS.filter((o) => visible.has(o.key)).map((o) => o.key);

  const metricCols: Column<CampaignTableRow>[] = ordered.map((key) => {
    const opt = CAMPAIGN_METRIC_OPTIONS.find((x) => x.key === key)!;
    return {
      key,
      header: campaignMetricHeader(opt, adsBrand, platformShort),
      sortable: true,
      accessor: (r) => {
        const v = r[key];
        if (typeof v === "number") return v;
        return 0;
      },
      render: (r) => formatMetricCell(key, r),
    };
  });

  return [estadoCol, actionCol, nombreCol, ...metricCols];
}

type Props = {
  campaigns: Campaign[];
  onToggleStatus: (id: string) => void;
  adsPlatform: AdsPlatformScope;
};

export function CampaignsDataTable({ campaigns, onToggleStatus, adsPlatform }: Props) {
  const [visible, setVisible] = useState<Set<CampaignMetricKey>>(
    () => new Set(loadCampaignMetricVisibility())
  );
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    saveCampaignMetricVisibility(visible);
  }, [visible]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    }
    if (panelOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [panelOpen]);

  const adsBrand = adsPlatformToBrandId(adsPlatform);
  const platformShort = ADS_PLATFORM_SHORT_LABEL[adsPlatform];
  const tableTitle =
    adsPlatform === "meta"
      ? "Campañas de Meta Ads"
      : adsPlatform === "tiktok"
        ? "Campañas de TikTok Ads"
        : "Campañas de Google Ads";

  const tableData = useMemo(() => buildCampaignTableRows(campaigns), [campaigns]);

  const columns = useMemo(
    () => buildColumns(visible, onToggleStatus, adsBrand, platformShort),
    [visible, onToggleStatus, adsBrand, platformShort]
  );

  function toggleMetric(key: CampaignMetricKey) {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function selectAll() {
    setVisible(new Set(CAMPAIGN_METRIC_OPTIONS.map((o) => o.key)));
  }

  function selectNone() {
    setVisible(new Set());
  }

  return (
    <div className="relative min-w-0">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <IntegrationBrandIcon brand={adsBrand} size="md" />
          {tableTitle}
        </h2>
        <div className="relative shrink-0" ref={panelRef}>
          <button
            type="button"
            onClick={() => setPanelOpen((o) => !o)}
            className="rounded-control border border-margify-border bg-margify-cardAlt p-2 text-margify-muted transition-colors duration-margify hover:border-margify-cyan hover:text-margify-cyan"
            aria-expanded={panelOpen}
            aria-controls="campanas-metricas-panel"
            title="Elegir métricas de la tabla"
          >
            <SquarePen className="h-5 w-5" aria-hidden />
          </button>

          {panelOpen ? (
            <div
              id="campanas-metricas-panel"
              className="absolute right-0 top-full z-30 mt-2 w-[min(100vw-2rem,22rem)] rounded-card border border-margify-border bg-margify-card p-4 shadow-xl"
            >
              <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-white">
                <IntegrationBrandIcon brand={adsBrand} size="sm" />
                Métricas de {tableTitle.replace(/^Campañas de /, "")}
              </p>
              <p className="mb-3 text-xs text-margify-muted">
                Las columnas Estado y Acción (Pausar/Activar) van siempre primero; después el nombre
                de la campaña y las métricas que marques.
              </p>
              <div className={cn("mb-3 flex flex-wrap gap-2", multiTouchClusterClasses)}>
                <Button
                  type="button"
                  variant="secondary"
                  className={cn("text-xs", multiTouchClusterChildButtonClasses)}
                  onClick={selectAll}
                >
                  Todas
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className={cn("text-xs", multiTouchClusterChildButtonClasses)}
                  onClick={selectNone}
                >
                  Ninguna
                </Button>
              </div>
              <ul className="max-h-[min(60vh,320px)] space-y-2 overflow-y-auto pr-1">
                {CAMPAIGN_METRIC_OPTIONS.map((opt) => (
                  <li key={opt.key}>
                    <label className="flex cursor-pointer gap-3 rounded-control border border-transparent px-2 py-1.5 hover:border-margify-border hover:bg-margify-cardAlt/50">
                      <input
                        type="checkbox"
                        checked={visible.has(opt.key)}
                        onChange={() => toggleMetric(opt.key)}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-margify-border bg-margify-cardAlt accent-margify-cyan"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm text-margify-text">{opt.label}</span>
                        <span className="block text-xs text-margify-muted">{opt.description}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[10px] text-margify-muted">Se guardan en este navegador.</p>
            </div>
          ) : null}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={tableData}
        pageSize={6}
        rowClassName={(r) =>
          cn(
            r.roasReal >= 2 && "bg-margify-cyan/5",
            r.roasReal >= 1 && r.roasReal < 2 && "bg-amber-500/5",
            r.roasReal < 1 && "bg-margify-negative/5"
          )
        }
      />
    </div>
  );
}
