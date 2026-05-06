"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClassName } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IntegrationBrandIcon } from "@/components/ui/IntegrationBrandIcon";
import { DataTable, type Column } from "@/components/ui/Table";
import { useDemoMode } from "@/components/dashboard/DemoModeContext";
import { demoMetaAdsCampaignRows } from "@/lib/mock-data";
import {
  metaStatusBadgeTone,
  metaStatusLabel,
  type MetaAdAccount,
  type MetaCampaignRow,
} from "@/lib/meta-auth";

type Row = MetaCampaignRow;

type SyncResponse =
  | {
      ok: true;
      campaigns: Row[];
      syncedAt: number;
      count: number;
      adAccountId: string;
      currency: string | null;
    }
  | { error: string };

type CampaignsResponse = {
  connected: boolean;
  adAccountId: string | null;
  adAccounts: MetaAdAccount[];
  lastSyncedAt: number | null;
};

const intFmt = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
const floatFmt = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function money(v: number, currency: string | null): string {
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(v);
  } catch {
    return `${floatFmt.format(v)} ${currency || ""}`.trim();
  }
}

function formatPct(v: number): string {
  return `${floatFmt.format(v)}%`;
}

function formatLastSync(ts: number | null): string {
  if (!ts) return "nunca";
  try {
    return new Intl.DateTimeFormat("es-AR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(ts));
  } catch {
    return "nunca";
  }
}

export function MetaAdsCampaignsTable() {
  const isDemo = useDemoMode();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [currency, setCurrency] = useState<string | null>(null);
  const [meta, setMeta] = useState<CampaignsResponse | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMeta = useCallback(async () => {
    try {
      const res = await fetch("/api/meta-ads/campaigns", { cache: "no-store" });
      const data = (await res.json()) as CampaignsResponse;
      setMeta(data);
      return data;
    } catch {
      setMeta({ connected: false, adAccountId: null, adAccounts: [], lastSyncedAt: null });
      return null;
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (isDemo) {
      setSyncing(true);
      setError(null);
      try {
        await new Promise((r) => setTimeout(r, 450));
        setMeta((prev) =>
          prev
            ? { ...prev, lastSyncedAt: Date.now() }
            : {
                connected: true,
                adAccountId: "act_demo",
                adAccounts: [],
                lastSyncedAt: Date.now(),
              }
        );
      } finally {
        setSyncing(false);
      }
      return;
    }
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch("/api/meta-ads/sync", { method: "POST" });
      const data = (await res.json()) as SyncResponse;
      if ("error" in data) {
        setError(data.error);
        setRows([]);
      } else {
        setRows(data.campaigns);
        setCurrency(data.currency);
        setMeta((prev) => ({
          connected: true,
          adAccountId: data.adAccountId,
          adAccounts: prev?.adAccounts ?? [],
          lastSyncedAt: data.syncedAt,
        }));
      }
    } catch {
      setError("No se pudo conectar con Meta Ads.");
    } finally {
      setSyncing(false);
    }
  }, [isDemo]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (isDemo) {
        setLoading(true);
        setError(null);
        setCurrency("ARS");
        setRows(demoMetaAdsCampaignRows);
        setMeta({
          connected: true,
          adAccountId: "act_demo",
          adAccounts: [],
          lastSyncedAt: Date.now() - 1000 * 60 * 12,
        });
        if (!cancelled) setLoading(false);
        return;
      }
      setLoading(true);
      const m = await loadMeta();
      if (cancelled) return;
      if (m?.connected) {
        await syncNow();
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [isDemo, loadMeta, syncNow]);

  const columns: Column<Row>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Campaña",
        sortable: true,
        accessor: (r) => r.name,
        render: (r) => (
          <div className="min-w-0">
            <p className="font-medium text-white">{r.name}</p>
            {r.objective ? (
              <p className="text-xs text-margify-muted">{r.objective}</p>
            ) : null}
          </div>
        ),
      },
      {
        key: "status",
        header: "Estado",
        sortable: true,
        accessor: (r) => r.status,
        render: (r) => <Badge type={metaStatusBadgeTone(r.status)} label={metaStatusLabel(r.status)} />,
      },
      {
        key: "spend",
        header: "Gasto",
        sortable: true,
        accessor: (r) => r.spend,
        render: (r) => money(r.spend, r.currency),
      },
      {
        key: "impressions",
        header: "Impresiones",
        sortable: true,
        accessor: (r) => r.impressions,
        render: (r) => intFmt.format(r.impressions),
      },
      {
        key: "reach",
        header: "Alcance",
        sortable: true,
        accessor: (r) => r.reach,
        render: (r) => intFmt.format(r.reach),
      },
      {
        key: "frequency",
        header: "Frecuencia",
        sortable: true,
        accessor: (r) => r.frequency,
        render: (r) => floatFmt.format(r.frequency),
      },
      {
        key: "clicks",
        header: "Clics",
        sortable: true,
        accessor: (r) => r.clicks,
        render: (r) => intFmt.format(r.clicks),
      },
      {
        key: "ctr",
        header: "CTR",
        sortable: true,
        accessor: (r) => r.ctr,
        render: (r) => formatPct(r.ctr),
      },
      {
        key: "cpc",
        header: "CPC",
        sortable: true,
        accessor: (r) => r.cpc,
        render: (r) => money(r.cpc, r.currency),
      },
      {
        key: "cpm",
        header: "CPM",
        sortable: true,
        accessor: (r) => r.cpm,
        render: (r) => money(r.cpm, r.currency),
      },
      {
        key: "conversions",
        header: "Conversiones",
        sortable: true,
        accessor: (r) => r.conversions,
        render: (r) => intFmt.format(Math.round(r.conversions)),
      },
      {
        key: "cost_per_conversion",
        header: "Costo por conversión",
        sortable: true,
        accessor: (r) => r.cost_per_conversion,
        render: (r) => (r.cost_per_conversion > 0 ? money(r.cost_per_conversion, r.currency) : "—"),
      },
      {
        key: "purchases",
        header: "Compras",
        sortable: true,
        accessor: (r) => r.purchases,
        render: (r) => intFmt.format(Math.round(r.purchases)),
      },
      {
        key: "conversion_value",
        header: "Valor de conversiones",
        sortable: true,
        accessor: (r) => r.conversion_value,
        render: (r) => money(r.conversion_value, r.currency),
      },
      {
        key: "roas",
        header: "ROAS Meta",
        sortable: true,
        accessor: (r) => r.roas,
        render: (r) => (r.roas > 0 ? `${floatFmt.format(r.roas)}x` : "—"),
      },
    ],
    []
  );

  const notConnected = meta && !meta.connected;

  return (
    <div className="relative min-w-0">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <IntegrationBrandIcon brand="meta" size="md" />
          Campañas de Meta Ads
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-margify-muted">
            Última sincronización: {formatLastSync(meta?.lastSyncedAt ?? null)}
            {currency ? ` · ${currency}` : ""}
          </span>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void syncNow()}
            disabled={syncing || !meta?.connected}
            className="inline-flex items-center gap-2"
          >
            <RefreshCw className={syncing ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden />
            {syncing ? "Sincronizando…" : "Sincronizar"}
          </Button>
        </div>
      </div>

      {error ? (
        <Card glass className="mb-4 border-margify-negative/40 bg-margify-negative/5">
          <p className="text-sm text-margify-negative">{error}</p>
        </Card>
      ) : null}

      {loading ? (
        <Card glass>
          <p className="text-sm text-margify-muted">Cargando campañas de Meta Ads…</p>
        </Card>
      ) : notConnected ? (
        <Card glass className="flex flex-col items-start gap-3">
          <p className="text-sm text-margify-muted">
            Conectá tu cuenta de Meta Ads en Configuración para ver tus campañas acá.
          </p>
          <Link href="/dashboard/configuracion" className={buttonClassName("primary")}>
            Ir a Configuración
          </Link>
        </Card>
      ) : rows && rows.length === 0 ? (
        <Card glass>
          <p className="text-sm text-margify-muted">
            No encontramos campañas con actividad en los últimos 30 días.
          </p>
        </Card>
      ) : (
        <DataTable columns={columns} data={rows ?? []} pageSize={10} />
      )}
    </div>
  );
}
