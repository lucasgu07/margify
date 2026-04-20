"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { Button, buttonClassName } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IntegrationBrandIcon } from "@/components/ui/IntegrationBrandIcon";
import { DataTable, type Column } from "@/components/ui/Table";
import type { ShopifyMetrics, ShopifyOrder } from "@/lib/shopify-auth";

type SyncResponse =
  | {
      ok: true;
      shop: string;
      syncedAt: number;
      products: unknown[];
      orders: ShopifyOrder[];
      metrics: ShopifyMetrics;
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

export function ShopifyOrdersTable() {
  const [rows, setRows] = useState<ShopifyOrder[] | null>(null);
  const [metrics, setMetrics] = useState<ShopifyMetrics | null>(null);
  const [shop, setShop] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/shopify/status", { cache: "no-store" });
      const data = (await res.json()) as
        | { configured: boolean; connected: false }
        | {
            configured: true;
            connected: true;
            shop: string;
            lastSyncedAt: number | null;
          };
      if ("connected" in data && data.connected) {
        setConnected(true);
        setShop(data.shop);
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
      const res = await fetch("/api/shopify/sync", { method: "POST" });
      const data = (await res.json()) as SyncResponse;
      if ("error" in data) {
        setError(data.message || data.error);
        if (data.error === "token_invalid") {
          setConnected(false);
        }
      } else {
        setRows(data.orders);
        setMetrics(data.metrics);
        setShop(data.shop);
        setLastSyncedAt(data.syncedAt);
      }
    } catch {
      setError("No se pudo conectar con Shopify.");
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

  const columns: Column<ShopifyOrder>[] = [
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
  ];

  const currency = rows?.find((r) => r.currency)?.currency ?? null;

  return (
    <div className="relative min-w-0">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <IntegrationBrandIcon brand="shopify" size="md" />
          Pedidos de Shopify
          {shop ? (
            <span className="text-xs font-normal text-margify-muted">({shop})</span>
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
          <p className="text-sm text-margify-muted">Cargando pedidos de Shopify…</p>
        </Card>
      ) : connected === false ? (
        <Card className="flex flex-col items-start gap-3">
          <p className="text-sm text-margify-muted">
            Conectá tu tienda de Shopify en Configuración para ver tus pedidos acá.
          </p>
          <Link
            href="/dashboard/configuracion"
            className={buttonClassName("primary")}
          >
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
