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
      customerId: string | null;
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

function formatCustomerId(id: string | null): string {
  if (!id) return "";
  if (id.length !== 10) return id;
  return `${id.slice(0, 3)}-${id.slice(3, 6)}-${id.slice(6)}`;
}

export function GoogleAdsIntegrationCard() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"disconnect" | "sync" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [syncInfo, setSyncInfo] = useState<{ count: number; syncedAt: number } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/google-ads/status", { cache: "no-store" });
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

  const gaNotice = searchParams.get("ga");
  const gaReason = searchParams.get("reason");

  async function disconnect() {
    setBusy("disconnect");
    setActionError(null);
    try {
      await fetch("/api/auth/google/disconnect", { method: "POST" });
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
      const res = await fetch("/api/google-ads/sync", { method: "POST" });
      const data = (await res.json()) as
        | { ok: true; syncedAt: number; count: number }
        | { error: string };
      if ("error" in data) {
        setActionError(data.error);
      } else {
        setSyncInfo({ count: data.count, syncedAt: data.syncedAt });
      }
      await load();
    } catch {
      setActionError("No se pudo sincronizar con Google Ads.");
    } finally {
      setBusy(null);
    }
  }

  const connected = status?.configured && status.connected;
  const notConfigured = Boolean(status && !status.configured);
  const connectDisabled = loading || notConfigured;

  return (
    <Card className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-lg font-semibold text-white">
          <IntegrationBrandIcon brand="googleAds" size="sm" />
          Google Ads
        </p>

        {gaNotice === "connected" ? (
          <p className="mt-1 text-sm text-margify-cyan">Cuenta vinculada correctamente.</p>
        ) : null}
        {gaNotice === "error" ? (
          <p className="mt-1 text-sm text-margify-negative">
            No se pudo conectar{gaReason ? `: ${decodeURIComponent(gaReason)}` : "."}
          </p>
        ) : null}

        {loading ? (
          <p className="mt-1 text-sm text-margify-muted">Cargando estado…</p>
        ) : notConfigured ? (
          <p className="mt-1 text-sm text-margify-muted">
            Faltan GOOGLE_ADS_CLIENT_ID y/o GOOGLE_ADS_DEVELOPER_TOKEN en el servidor (Vercel
            o .env.local).
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-margify-muted">
              Estado:{" "}
              <span className={connected ? "text-margify-cyan" : "text-margify-muted"}>
                {connected ? "Conectada" : "Desconectada"}
              </span>
            </p>
            {connected && status && "customerId" in status && status.customerId ? (
              <p className="mt-1 text-xs text-margify-muted">
                Customer ID:{" "}
                <span className="font-mono text-margify-text">
                  {formatCustomerId(status.customerId)}
                </span>
              </p>
            ) : null}
            {connected && status && "lastSyncedAt" in status ? (
              <p className="mt-1 text-xs text-margify-muted">
                Última sincronización: {formatLastSync(status.lastSyncedAt)}
              </p>
            ) : null}
          </>
        )}

        {actionError ? (
          <p className="mt-2 text-sm text-margify-negative">{actionError}</p>
        ) : null}
        {syncInfo ? (
          <p className="mt-2 text-xs text-margify-cyan">
            Sincronización OK — {syncInfo.count} campaña{syncInfo.count === 1 ? "" : "s"} (
            {formatLastSync(syncInfo.syncedAt)}).
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        {connected ? (
          <>
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
          </>
        ) : (
          <Link
            href="/api/auth/google"
            className={buttonClassName("secondary")}
            aria-disabled={connectDisabled}
            tabIndex={connectDisabled ? -1 : undefined}
            onClick={(e) => {
              if (connectDisabled) e.preventDefault();
            }}
          >
            Conectar Google Ads
          </Link>
        )}
      </div>
    </Card>
  );
}
