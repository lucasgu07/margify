"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, buttonClassName } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IntegrationBrandIcon } from "@/components/ui/IntegrationBrandIcon";

type StatusResponse =
  | { configured: false; connected: false; message?: string }
  | { configured: true; connected: false }
  | {
      configured: true;
      connected: true;
      storeId: string;
      storeName: string | null;
      storeUrl: string | null;
      currency: string | null;
      scope: string;
      lastSyncedAt: number | null;
    };

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

export function TiendanubeIntegrationCard() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"disconnect" | "sync" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [syncInfo, setSyncInfo] = useState<{ count: number; syncedAt: number } | null>(
    null
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tiendanube/status", { cache: "no-store" });
      const data = (await res.json()) as StatusResponse;
      setStatus(data);
    } catch {
      setStatus({
        configured: false,
        connected: false,
        message: "No se pudo leer el estado.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const notice = searchParams.get("tiendanube");
  const reason = searchParams.get("reason");

  async function disconnect() {
    setBusy("disconnect");
    setActionError(null);
    try {
      await fetch("/api/auth/tiendanube/disconnect", { method: "POST" });
      setSyncInfo(null);
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function sync() {
    setBusy("sync");
    setActionError(null);
    try {
      const res = await fetch("/api/tiendanube/sync", { method: "POST" });
      const data = (await res.json()) as
        | {
            ok: true;
            syncedAt: number;
            products: unknown[];
            orders: unknown[];
          }
        | { error: string; message?: string };
      if ("error" in data) {
        setActionError(data.message || data.error);
        if (data.error === "token_invalid") {
          await load();
        }
      } else {
        setSyncInfo({
          count: data.products.length + data.orders.length,
          syncedAt: data.syncedAt,
        });
      }
      await load();
    } catch {
      setActionError("No se pudo sincronizar con TiendaNube.");
    } finally {
      setBusy(null);
    }
  }

  const connected = status?.configured && status.connected;
  const notConfigured = Boolean(status && !status.configured);

  const noticeMap: Record<string, { text: string; tone: "ok" | "error" }> = {
    connected: { text: "Tienda vinculada correctamente.", tone: "ok" },
    state_mismatch: {
      text: "La validación de seguridad (state) falló. Intentá conectar otra vez.",
      tone: "error",
    },
    hmac_failed: {
      text: "La firma del callback no coincide. Reintentá la conexión.",
      tone: "error",
    },
    not_configured: {
      text: "Faltan TIENDANUBE_APP_ID / TIENDANUBE_CLIENT_SECRET en el servidor.",
      tone: "error",
    },
    error: {
      text: reason
        ? `No se pudo conectar: ${decodeURIComponent(reason)}`
        : "No se pudo conectar con TiendaNube.",
      tone: "error",
    },
  };
  const noticeEntry = notice ? noticeMap[notice] : null;

  return (
    <Card className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-lg font-semibold text-white">
          <IntegrationBrandIcon brand="tiendanube" size="sm" />
          TiendaNube
        </p>

        {noticeEntry ? (
          <p
            className={`mt-1 text-sm ${
              noticeEntry.tone === "ok"
                ? "text-margify-cyan"
                : "text-margify-negative"
            }`}
          >
            {noticeEntry.text}
          </p>
        ) : null}

        {loading ? (
          <p className="mt-1 text-sm text-margify-muted">Cargando estado…</p>
        ) : notConfigured ? (
          <p className="mt-1 text-sm text-margify-muted">
            Faltan TIENDANUBE_APP_ID y/o TIENDANUBE_CLIENT_SECRET en el servidor (Vercel
            o .env.local).
          </p>
        ) : connected && status && "storeId" in status ? (
          <>
            <p className="mt-1 text-sm text-margify-muted">
              Estado:{" "}
              <span className="text-margify-cyan">
                Conectada
                {status.storeName ? ` (${status.storeName})` : ""}
              </span>
            </p>
            {status.storeUrl ? (
              <p className="mt-1 text-xs text-margify-muted">
                URL:{" "}
                <a
                  href={status.storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-margify-cyan underline-offset-2 hover:underline"
                >
                  {status.storeUrl}
                </a>
              </p>
            ) : null}
            {status.scope ? (
              <p className="mt-1 text-xs text-margify-muted">
                Permisos: <span className="text-margify-text">{status.scope}</span>
              </p>
            ) : null}
            {status.currency ? (
              <p className="mt-1 text-xs text-margify-muted">
                Moneda: <span className="text-margify-text">{status.currency}</span>
              </p>
            ) : null}
            <p className="mt-2 text-xs text-margify-muted">
              Última sincronización: {formatLastSync(status.lastSyncedAt)}
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-margify-muted">
            Conectá tu tienda de TiendaNube para sincronizar productos y pedidos.
          </p>
        )}

        {actionError ? (
          <p className="mt-2 text-sm text-margify-negative">{actionError}</p>
        ) : null}
        {syncInfo ? (
          <p className="mt-2 text-xs text-margify-cyan">
            Sincronización OK — {syncInfo.count} registro
            {syncInfo.count === 1 ? "" : "s"} ({formatLastSync(syncInfo.syncedAt)}).
          </p>
        ) : null}
      </div>

      {connected ? (
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            type="button"
            variant="primary"
            disabled={busy !== null}
            onClick={() => void sync()}
          >
            {busy === "sync" ? "Sincronizando…" : "Sincronizar ahora"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy !== null}
            onClick={() => void disconnect()}
          >
            {busy === "disconnect" ? "Desconectando…" : "Desconectar"}
          </Button>
        </div>
      ) : !loading && !notConfigured ? (
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link href="/api/auth/tiendanube" className={buttonClassName("primary")}>
            Conectar con TiendaNube
          </Link>
        </div>
      ) : null}
    </Card>
  );
}
