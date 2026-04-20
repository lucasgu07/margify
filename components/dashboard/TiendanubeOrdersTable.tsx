"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { Button, buttonClassName } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IntegrationBrandIcon } from "@/components/ui/IntegrationBrandIcon";
import { DataTable, type Column } from "@/components/ui/Table";
import type { TiendanubeMetrics, TiendanubeOrder } from "@/lib/tiendanube-auth";

type SyncResponse =
  | {
      ok: true;
      storeId: string;
      syncedAt: number;
      products: unknown[];
      orders: TiendanubeOrder[];
      metrics: TiendanubeMetrics;
    }
  | { error: string; message?: string };

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

function formatCurrency(amount: number, currency: string | null): string {
  const c = currency || "USD";
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: c,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${c} ${amount.toFixed(2)}`;
  }
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-AR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function TiendanubeOrdersTable() {
  const [rows, setRows] = useState<TiendanubeOrder[] | null>(null);
  const [metrics, setMetrics] = useState<TiendanubeMetrics | null>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/tiendanube/status", { cache: "no-store" });
      const data = (await res.json()) as
        | { configured: boolean; connected: false }
        | {
            configured: true;
            connected: true;
            storeId: string;
            storeName: string | null;
            lastSyncedAt: number | null;
          };
      if ("connected" in data && data.connected) {
        setConnected(true);
        setLabel(data.storeName ?? data.storeId);
        setLastSyncedAt(data.lastSyncedAt ?? null);
        return true;
      }
      setConnected(false);
      return false;
    } catch {
      setConnected(false);
      return false;
    }
  }, []);

  const syncNow = useCallback(async () => {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch("/api/tiendanube/sync", { method: "POST" });
      const data = (await res.json()) as SyncResponse;
      if ("error" in data) {
        setError(data.message || data.error);
        if (data.error === "token_invalid") {
          setConnected(false);
        }
      } else {
        setRows(data.orders);
        setMetrics(data.metrics);
        setLabel(data.storeId);
        setLastSyncedAt(data.syncedAt);
      }
    } catch {
      setError("No se pudo conectar con TiendaNube.");
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const isConnected = await loadStatus();
      if (cancelled) return;
      if (isConnected) await syncNow();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadStatus, syncNow]);

  const columns: Column<TiendanubeOrder>[] = [
    {
      key: "name",
      header: "Orden",
      sortable: true,
      accessor: (r) => r.name,
      render: (r) => <span className="font-medium text-white">{r.name}</span>,
    },
    {
      key: "createdAt",
      header: "Fecha",
      sortable: true,
      accessor: (r) => r.createdAt,
      render: (r) => formatDate(r.createdAt),
    },
    {
      key: "customerEmail",
      header: "Cliente",
      sortable: true,
      accessor: (r) => r.customerEmail ?? "",
      render: (r) => r.customerEmail ?? "—",
    },
    {
      key: "itemsCount",
      header: "Items",
      sortable: true,
      accessor: (r) => r.itemsCount,
      render: (r) => r.itemsCount,
    },
    {
      key: "subtotal",
      header: "Subtotal",
      sortable: true,
      accessor: (r) => r.subtotal,
      render: (r) => formatCurrency(r.subtotal, r.currency),
    },
    {
      key: "total",
      header: "Total",
      sortable: true,
      accessor: (r) => r.total,
      render: (r) => (
        <span className="font-medium text-white">
          {formatCurrency(r.total, r.currency)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      sortable: true,
      accessor: (r) => r.status,
      render: (r) => r.status || "—",
    },
  ];

  const currency = rows?.find((r) => r.currency)?.currency ?? null;

  return (
    <div className="relative mt-10 min-w-0">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <IntegrationBrandIcon brand="tiendanube" size="md" />
          Pedidos de TiendaNube
          {label ? (
            <span className="text-xs font-normal text-margify-muted">({label})</span>
          ) : null}
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-margify-muted">
            Última sincronización: {formatLastSync(lastSyncedAt)}
          </span>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void syncNow()}
            disabled={syncing || !connected}
            className="inline-flex items-center gap-2"
          >
            <RefreshCw
              className={syncing ? "h-4 w-4 animate-spin" : "h-4 w-4"}
              aria-hidden
            />
            {syncing ? "Sincronizando…" : "Sincronizar"}
          </Button>
        </div>
      </div>

      {metrics && connected ? (
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card>
            <p className="text-xs text-margify-muted">Revenue (últimos 30 días)</p>
            <p className="mt-1 text-xl font-bold text-white">
              {formatCurrency(metrics.totalRevenue, currency)}
            </p>
          </Card>
          <Card>
            <p className="text-xs text-margify-muted">Pedidos</p>
            <p className="mt-1 text-xl font-bold text-white">
              {metrics.totalOrders}
            </p>
          </Card>
          <Card>
            <p className="text-xs text-margify-muted">AOV (ticket promedio)</p>
            <p className="mt-1 text-xl font-bold text-white">
              {formatCurrency(metrics.aov, currency)}
            </p>
          </Card>
        </div>
      ) : null}

      {error ? (
        <Card className="mb-4 border-margify-negative/40 bg-margify-negative/5">
          <p className="text-sm text-margify-negative">{error}</p>
        </Card>
      ) : null}

      {loading ? (
        <Card>
          <p className="text-sm text-margify-muted">Cargando pedidos de TiendaNube…</p>
        </Card>
      ) : connected === false ? (
        <Card className="flex flex-col items-start gap-3">
          <p className="text-sm text-margify-muted">
            Conectá tu tienda de TiendaNube en Configuración para ver tus pedidos acá.
          </p>
          <Link href="/dashboard/configuracion" className={buttonClassName("primary")}>
            Ir a Configuración
          </Link>
        </Card>
      ) : rows && rows.length === 0 ? (
        <Card>
          <p className="text-sm text-margify-muted">
            No encontramos pedidos en los últimos 30 días.
          </p>
        </Card>
      ) : (
        <DataTable columns={columns} data={rows ?? []} pageSize={10} />
      )}
    </div>
  );
}
