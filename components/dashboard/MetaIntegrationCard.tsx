"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, buttonClassName } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DemoIntegrationPlaceholder } from "@/components/dashboard/DemoIntegrationPlaceholder";
import { useDemoMode } from "@/components/dashboard/DemoModeContext";
import { IntegrationBrandIcon } from "@/components/ui/IntegrationBrandIcon";
import type { MetaAdAccount } from "@/lib/meta-auth";

type StatusResponse =
  | { configured: false; connected: false; message?: string }
  | { configured: true; connected: false }
  | {
      configured: true;
      connected: true;
      userId: string | null;
      userName: string | null;
      adAccountId: string | null;
      adAccounts: MetaAdAccount[];
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

export function MetaIntegrationCard() {
  const isDemo = useDemoMode();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"disconnect" | "sync" | "switch" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [syncInfo, setSyncInfo] = useState<{ count: number; syncedAt: number } | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/meta-ads/status", { cache: "no-store" });
      const data = (await res.json()) as StatusResponse;
      setStatus(data);
      if (data.configured && data.connected) {
        setSelectedAccount(data.adAccountId);
      }
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

  const metaNotice = searchParams.get("meta");
  const metaReason = searchParams.get("reason");

  async function disconnect() {
    setBusy("disconnect");
    setActionError(null);
    try {
      await fetch("/api/auth/meta/disconnect", { method: "POST" });
      setSyncInfo(null);
      setSelectedAccount(null);
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function sync(adAccountId?: string) {
    setBusy(adAccountId ? "switch" : "sync");
    setActionError(null);
    try {
      const res = await fetch("/api/meta-ads/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adAccountId }),
      });
      const data = (await res.json()) as
        | { ok: true; syncedAt: number; count: number; adAccountId: string }
        | { error: string };
      if ("error" in data) {
        setActionError(data.error);
      } else {
        setSyncInfo({ count: data.count, syncedAt: data.syncedAt });
      }
      await load();
    } catch {
      setActionError("No se pudo sincronizar con Meta Ads.");
    } finally {
      setBusy(null);
    }
  }

  const connected = status?.configured && status.connected;
  const notConfigured = Boolean(status && !status.configured);
  const connectDisabled = loading || notConfigured;

  const adAccounts: MetaAdAccount[] = useMemo(
    () => (status && "adAccounts" in status ? status.adAccounts : []),
    [status]
  );

  if (isDemo) {
    return <DemoIntegrationPlaceholder brand="meta" name="Meta Ads" />;
  }

  async function onSwitchAccount(next: string) {
    setSelectedAccount(next);
    if (next && next !== (status && "adAccountId" in status ? status.adAccountId : null)) {
      await sync(next);
    }
  }

  return (
    <Card className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-lg font-semibold text-white">
          <IntegrationBrandIcon brand="meta" size="sm" />
          Meta Ads
        </p>

        {metaNotice === "connected" ? (
          <p className="mt-1 text-sm text-margify-cyan">Cuenta vinculada correctamente.</p>
        ) : null}
        {metaNotice === "error" ? (
          <p className="mt-1 text-sm text-margify-negative">
            No se pudo conectar{metaReason ? `: ${decodeURIComponent(metaReason)}` : "."}
          </p>
        ) : null}

        {loading ? (
          <p className="mt-1 text-sm text-margify-muted">Cargando estado…</p>
        ) : notConfigured ? (
          <p className="mt-1 text-sm text-margify-muted">
            Faltan META_APP_ID y/o META_APP_SECRET en el servidor (Vercel o .env.local).
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-margify-muted">
              Estado:{" "}
              <span className={connected ? "text-margify-cyan" : "text-margify-muted"}>
                {connected ? "Conectada" : "Desconectada"}
              </span>
            </p>
            {connected && status && "userName" in status && status.userName ? (
              <p className="mt-1 text-xs text-margify-muted">
                Vinculada como <span className="text-margify-text">{status.userName}</span>
              </p>
            ) : null}
            {connected && adAccounts.length > 0 ? (
              <div className="mt-2">
                <label className="text-xs text-margify-muted" htmlFor="meta-ad-account">
                  Cuenta publicitaria activa
                </label>
                <select
                  id="meta-ad-account"
                  value={selectedAccount ?? ""}
                  onChange={(e) => void onSwitchAccount(e.target.value)}
                  disabled={busy !== null}
                  className="mt-1 block w-full max-w-sm rounded-control border border-margify-border bg-margify-cardAlt px-3 py-2 text-sm text-margify-text focus:border-margify-cyan focus:outline-none"
                >
                  {adAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                      {a.account_id ? ` (${a.account_id})` : ""}
                      {a.currency ? ` – ${a.currency}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            {connected && status && "lastSyncedAt" in status ? (
              <p className="mt-2 text-xs text-margify-muted">
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
              {busy === "sync" || busy === "switch" ? "Sincronizando…" : "Sincronizar ahora"}
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
            href="/api/auth/meta"
            className={buttonClassName("secondary")}
            aria-disabled={connectDisabled}
            tabIndex={connectDisabled ? -1 : undefined}
            onClick={(e) => {
              if (connectDisabled) e.preventDefault();
            }}
          >
            Conectar con Meta Ads
          </Link>
        )}
      </div>
    </Card>
  );
}
