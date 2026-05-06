"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClassName } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IntegrationBrandIcon } from "@/components/ui/IntegrationBrandIcon";
import { DataTable, type Column } from "@/components/ui/Table";
import type { TiendanubeProduct } from "@/lib/tiendanube-auth";

type SyncResponse =
  | {
      ok: true;
      storeId: string;
      syncedAt: number;
      products: TiendanubeProduct[];
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

function priceLabel(p: TiendanubeProduct): string {
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

export function TiendanubeProductsTable({
  hideWhenDisconnected = false,
}: {
  hideWhenDisconnected?: boolean;
} = {}) {
  const [rows, setRows] = useState<TiendanubeProduct[] | null>(null);
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
        setRows(data.products);
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

  const columns: Column<TiendanubeProduct>[] = [
    {
      key: "title",
      header: "Producto",
      sortable: true,
      accessor: (r) => r.title,
      render: (r) => <span className="font-medium text-white">{r.title}</span>,
    },
    {
      key: "brand",
      header: "Marca",
      sortable: true,
      accessor: (r) => r.brand ?? "",
      render: (r) => r.brand ?? "—",
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
      key: "published",
      header: "Estado",
      sortable: true,
      accessor: (r) => (r.published ? "1" : "0"),
      render: (r) => (
        <Badge
          type={r.published ? "success" : "neutral"}
          label={r.published ? "Publicado" : "No publicado"}
        />
      ),
    },
  ];

  return (
    <div className="relative min-w-0">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <IntegrationBrandIcon brand="tiendanube" size="md" />
          Productos de TiendaNube
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

      {error ? (
        <Card glass className="mb-4 border-margify-negative/40 bg-margify-negative/5">
          <p className="text-sm text-margify-negative">{error}</p>
        </Card>
      ) : null}

      {loading ? (
        <Card glass>
          <p className="text-sm text-margify-muted">Cargando productos de TiendaNube…</p>
        </Card>
      ) : connected === false ? (
        <Card glass className="flex flex-col items-start gap-3">
          <p className="text-sm text-margify-muted">
            Conectá tu tienda de TiendaNube en Configuración para ver tus productos acá.
          </p>
          <Link href="/dashboard/configuracion" className={buttonClassName("primary")}>
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
