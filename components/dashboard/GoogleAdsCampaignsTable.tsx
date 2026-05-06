"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClassName } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IntegrationBrandIcon } from "@/components/ui/IntegrationBrandIcon";
import { DataTable, type Column } from "@/components/ui/Table";
import { statusBadgeTone, type GoogleAdsCampaignRow } from "@/lib/google-ads";

type Row = GoogleAdsCampaignRow;

type SyncResponse =
  | { ok: true; campaigns: Row[]; syncedAt: number; count: number; customerId: string }
  | { error: string };

type CampaignsResponse = {
  connected: boolean;
  customerId: string | null;
  lastSyncedAt: number | null;
};

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const int = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

function formatPct(v: number): string {
  const pct = v > 1 ? v : v * 100;
  return `${pct.toFixed(2)}%`;
}

function statusLabel(status: Row["status"]): string {
  if (status === "ENABLED") return "Habilitada";
  if (status === "PAUSED") return "Pausada";
  if (status === "REMOVED") return "Eliminada";
  return "Desconocida";
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

export function GoogleAdsCampaignsTable() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [meta, setMeta] = useState<CampaignsResponse | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMeta = useCallback(async () => {
    try {
      const res = await fetch("/api/google-ads/campaigns", { cache: "no-store" });
      const data = (await res.json()) as CampaignsResponse;
      setMeta(data);
      return data;
    } catch {
      setMeta({ connected: false, customerId: null, lastSyncedAt: null });
      return null;
    }
  }, []);

  const syncNow = useCallback(async () => {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch("/api/google-ads/sync", { method: "POST" });
      const data = (await res.json()) as SyncResponse;
      if ("error" in data) {
        setError(data.error);
        setRows([]);
      } else {
        setRows(data.campaigns);
        setMeta({
          connected: true,
          customerId: data.customerId,
          lastSyncedAt: data.syncedAt,
        });
      }
    } catch {
      setError("No se pudo conectar con Google Ads.");
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
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
  }, [loadMeta, syncNow]);

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Campaña",
      sortable: true,
      accessor: (r) => r.name,
      render: (r) => <span className="font-medium text-white">{r.name}</span>,
    },
    {
      key: "status",
      header: "Estado",
      sortable: true,
      accessor: (r) => r.status,
      render: (r) => <Badge type={statusBadgeTone(r.status)} label={statusLabel(r.status)} />,
    },
    {
      key: "cost",
      header: "Gasto",
      sortable: true,
      accessor: (r) => r.cost,
      render: (r) => usd.format(r.cost),
    },
    {
      key: "impressions",
      header: "Impresiones",
      sortable: true,
      accessor: (r) => r.impressions,
      render: (r) => int.format(r.impressions),
    },
    {
      key: "clicks",
      header: "Clics",
      sortable: true,
      accessor: (r) => r.clicks,
      render: (r) => int.format(r.clicks),
    },
    {
      key: "ctr",
      header: "CTR",
      sortable: true,
      accessor: (r) => r.ctr,
      render: (r) => formatPct(r.ctr),
    },
    {
      key: "average_cpc",
      header: "CPC",
      sortable: true,
      accessor: (r) => r.average_cpc,
      render: (r) => usd.format(r.average_cpc),
    },
    {
      key: "conversions",
      header: "Conversiones",
      sortable: true,
      accessor: (r) => r.conversions,
      render: (r) => int.format(Math.round(r.conversions)),
    },
    {
      key: "cost_per_conversion",
      header: "Costo por conversión",
      sortable: true,
      accessor: (r) => r.cost_per_conversion,
      render: (r) => (r.cost_per_conversion > 0 ? usd.format(r.cost_per_conversion) : "—"),
    },
  ];

  const notConnected = meta && !meta.connected;

  return (
    <div className="relative min-w-0">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <IntegrationBrandIcon brand="googleAds" size="md" />
          Campañas de Google Ads
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-margify-muted">
            Última sincronización: {formatLastSync(meta?.lastSyncedAt ?? null)}
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
          <p className="text-sm text-margify-muted">Cargando campañas de Google Ads…</p>
        </Card>
      ) : notConnected ? (
        <Card glass className="flex flex-col items-start gap-3">
          <p className="text-sm text-margify-muted">
            Conectá tu cuenta de Google Ads en Configuración para ver tus campañas acá.
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
