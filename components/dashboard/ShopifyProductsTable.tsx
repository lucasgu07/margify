"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClassName } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IntegrationBrandIcon } from "@/components/ui/IntegrationBrandIcon";
import { DataTable, type Column } from "@/components/ui/Table";
import type { ShopifyProduct } from "@/lib/shopify-auth";

type SyncResponse =
  | {
      ok: true;
      shop: string;
      syncedAt: number;
      products: ShopifyProduct[];
      orders: unknown[];
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

function priceLabel(p: ShopifyProduct): string {
  const currency = p.currency || "USD";
  const fmt = (n: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(n);
  if (p.priceMin === p.priceMax) return fmt(p.priceMin);
  return `${fmt(p.priceMin)} – ${fmt(p.priceMax)}`;
}

function statusToBadge(
  status: string
): { label: string; tone: "success" | "warning" | "neutral" | "danger" } {
  const s = status.toUpperCase();
  if (s === "ACTIVE") return { label: "Activo", tone: "success" };
  if (s === "DRAFT") return { label: "Borrador", tone: "warning" };
  if (s === "ARCHIVED") return { label: "Archivado", tone: "neutral" };
  return { label: status || "—", tone: "neutral" };
}

export function ShopifyProductsTable({
  hideWhenDisconnected = false,
}: {
  /** Si Shopify no está conectado, no renderiza nada en lugar de mostrar el CTA. */
  hideWhenDisconnected?: boolean;
} = {}) {
  const [rows, setRows] = useState<ShopifyProduct[] | null>(null);
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
        setRows(data.products);
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
      if (isConnected) {
        await syncNow();
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadStatus, syncNow]);

  if (hideWhenDisconnected && connected !== true) {
    return null;
  }

  const columns: Column<ShopifyProduct>[] = [
    {
      key: "title",
      header: "Producto",
      sortable: true,
      accessor: (r) => r.title,
      render: (r) => <span className="font-medium text-white">{r.title}</span>,
    },
    {
      key: "vendor",
      header: "Vendor",
      sortable: true,
      accessor: (r) => r.vendor ?? "",
      render: (r) => r.vendor ?? "—",
    },
    {
      key: "totalInventory",
      header: "Stock",
      sortable: true,
      accessor: (r) => r.totalInventory,
      render: (r) =>
        new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(
          r.totalInventory
        ),
    },
    {
      key: "price",
      header: "Precio",
      sortable: true,
      accessor: (r) => r.priceMin,
      render: (r) => priceLabel(r),
    },
    {
      key: "status",
      header: "Estado",
      sortable: true,
      accessor: (r) => r.status,
      render: (r) => {
        const b = statusToBadge(r.status);
        return <Badge type={b.tone} label={b.label} />;
      },
    },
  ];

  return (
    <div className="relative min-w-0">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <IntegrationBrandIcon brand="shopify" size="md" />
          Productos de Shopify
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

      {error ? (
        <Card glass className="mb-4 border-margify-negative/40 bg-margify-negative/5">
          <p className="text-sm text-margify-negative">{error}</p>
        </Card>
      ) : null}

      {loading ? (
        <Card glass>
          <p className="text-sm text-margify-muted">Cargando productos de Shopify…</p>
        </Card>
      ) : connected === false ? (
        <Card glass className="flex flex-col items-start gap-3">
          <p className="text-sm text-margify-muted">
            Conectá tu tienda de Shopify en Configuración para ver tus productos acá.
          </p>
          <Link
            href="/dashboard/configuracion"
            className={buttonClassName("primary")}
          >
            Ir a Configuración
          </Link>
        </Card>
      ) : rows && rows.length === 0 ? (
        <Card glass>
          <p className="text-sm text-margify-muted">
            Aún no encontramos productos en tu tienda.
          </p>
        </Card>
      ) : (
        <DataTable columns={columns} data={rows ?? []} pageSize={10} />
      )}
    </div>
  );
}
