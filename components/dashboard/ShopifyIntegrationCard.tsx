"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DemoIntegrationPlaceholder } from "@/components/dashboard/DemoIntegrationPlaceholder";
import { useDemoMode } from "@/components/dashboard/DemoModeContext";
import { IntegrationBrandIcon } from "@/components/ui/IntegrationBrandIcon";
import {
  buildShopifyOAuthUrl,
  shopifyShopInputErrorMessage,
  stripShopifyShopInput,
} from "@/lib/shopify-shop-input";
import { multiTouchClusterClasses, multiTouchClusterChildButtonClasses } from "@/lib/multi-touch-cluster";
import { cn } from "@/lib/utils";

type StatusResponse =
  | { configured: false; connected: false; message?: string }
  | { configured: true; connected: false }
  | {
      configured: true;
      connected: true;
      shop: string;
      scope: string;
      installedAt: number;
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

export function ShopifyIntegrationCard() {
  const isDemo = useDemoMode();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"disconnect" | "sync" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [syncInfo, setSyncInfo] = useState<{ count: number; syncedAt: number } | null>(
    null
  );
  const [shopInput, setShopInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (isDemo) return;
    setLoading(true);
    try {
      const res = await fetch("/api/shopify/status", { cache: "no-store" });
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
  }, [isDemo]);

  useEffect(() => {
    if (isDemo) return;
    void load();
  }, [load, isDemo]);

  const notice = searchParams.get("shopify");
  const reason = searchParams.get("reason");

  if (isDemo) {
    return <DemoIntegrationPlaceholder brand="shopify" name="Shopify" />;
  }

  async function disconnect() {
    setBusy("disconnect");
    setActionError(null);
    try {
      await fetch("/api/auth/shopify/disconnect", { method: "POST" });
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
      const res = await fetch("/api/shopify/sync", { method: "POST" });
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
      setActionError("No se pudo sincronizar con Shopify.");
    } finally {
      setBusy(null);
    }
  }

  function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setInputError(null);
    const shop = stripShopifyShopInput(shopInput);
    const err = shopifyShopInputErrorMessage(shopInput);
    if (err) {
      setInputError(err);
      return;
    }
    window.location.href = buildShopifyOAuthUrl(shop);
  }

  const connected = status?.configured && status.connected;
  const notConfigured = Boolean(status && !status.configured);

  const noticeMap: Record<string, { text: string; tone: "ok" | "error" }> = {
    connected: { text: "Tienda vinculada correctamente.", tone: "ok" },
    invalid_shop: {
      text: 'Dominio inválido. Tiene que ser "mi-tienda.myshopify.com".',
      tone: "error",
    },
    state_mismatch: {
      text: "La validación de seguridad (state) falló. Intentá conectar otra vez.",
      tone: "error",
    },
    hmac_failed: {
      text: "La firma de Shopify no coincide. Reintentá la conexión.",
      tone: "error",
    },
    not_configured: {
      text: "Faltan SHOPIFY_API_KEY / SHOPIFY_API_SECRET en el servidor.",
      tone: "error",
    },
    error: {
      text: reason
        ? `No se pudo conectar: ${decodeURIComponent(reason)}`
        : "No se pudo conectar con Shopify.",
      tone: "error",
    },
  };
  const noticeEntry = notice ? noticeMap[notice] : null;

  return (
    <Card glass className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-lg font-semibold text-white">
          <IntegrationBrandIcon brand="shopify" size="sm" />
          Shopify
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
            Faltan SHOPIFY_API_KEY y/o SHOPIFY_API_SECRET en el servidor (Vercel
            o .env.local).
          </p>
        ) : connected && status && "shop" in status ? (
          <>
            <p className="mt-1 text-sm text-margify-muted">
              Estado:{" "}
              <span className="text-margify-cyan">
                Conectada ({status.shop})
              </span>
            </p>
            {status.scope ? (
              <p className="mt-1 text-xs text-margify-muted">
                Permisos: <span className="text-margify-text">{status.scope}</span>
              </p>
            ) : null}
            <p className="mt-2 text-xs text-margify-muted">
              Última sincronización: {formatLastSync(status.lastSyncedAt)}
            </p>
          </>
        ) : (
          <form onSubmit={handleConnect} className="mt-2 flex flex-col gap-2">
            <label
              htmlFor="shopify-shop-input"
              className="text-xs text-margify-muted"
            >
              Dominio de tu tienda
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="shopify-shop-input"
                type="text"
                value={shopInput}
                onChange={(e) => setShopInput(e.target.value)}
                placeholder="mi-tienda.myshopify.com"
                className="min-w-0 flex-1 rounded-control border border-margify-border bg-margify-cardAlt px-3 py-2 text-sm text-margify-text outline-none focus:border-margify-cyan"
                autoComplete="off"
                spellCheck={false}
              />
              <Button type="submit" variant="primary" disabled={!shopInput.trim()}>
                Conectar con Shopify
              </Button>
            </div>
            {inputError ? (
              <p className="text-xs text-margify-negative">{inputError}</p>
            ) : null}
            <p className="text-xs text-margify-muted">
              Es el dominio del panel de administración de Shopify (siempre termina en{" "}
              <code>.myshopify.com</code>
              ), no el dominio público de la tienda.
            </p>
          </form>
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
        <div className={cn("flex shrink-0 flex-wrap gap-2", multiTouchClusterClasses)}>
          <Button
            type="button"
            variant="primary"
            disabled={busy !== null}
            className={multiTouchClusterChildButtonClasses}
            onClick={() => void sync()}
          >
            {busy === "sync" ? "Sincronizando…" : "Sincronizar ahora"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy !== null}
            className={multiTouchClusterChildButtonClasses}
            onClick={() => void disconnect()}
          >
            {busy === "disconnect" ? "Desconectando…" : "Desconectar"}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
