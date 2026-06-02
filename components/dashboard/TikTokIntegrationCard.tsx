"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, buttonClassName } from "@/components/ui/Button";
import { IntegrationCardRoot } from "@/components/dashboard/integrations/integration-card-root";
import { DemoIntegrationPlaceholder } from "@/components/dashboard/DemoIntegrationPlaceholder";
import { useDemoMode } from "@/components/dashboard/DemoModeContext";
import { IntegrationBrandIcon } from "@/components/ui/IntegrationBrandIcon";
import { multiTouchClusterClasses, multiTouchClusterChildButtonClasses } from "@/lib/multi-touch-cluster";
import { cn } from "@/lib/utils";

type StatusResponse =
  | { configured: false; connected: false; message?: string }
  | { configured: true; connected: false }
  | { configured: true; connected: true; advertiserId: string; lastSyncedAt: number | null };

export function TikTokIntegrationCard({ embedded }: { embedded?: boolean } = {}) {
  const isDemo = useDemoMode();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tiktok-ads/status", { cache: "no-store" });
      setStatus((await res.json()) as StatusResponse);
    } catch {
      setStatus({ configured: false, connected: false, message: "No se pudo leer el estado." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const notice = searchParams.get("tiktok");
  const reason = searchParams.get("reason");

  if (isDemo) {
    return <DemoIntegrationPlaceholder brand="tiktok" name="TikTok Ads" embedded={embedded} />;
  }

  async function disconnect() {
    setDisconnecting(true);
    try {
      await fetch("/api/auth/tiktok/disconnect", { method: "POST" });
      await load();
    } finally {
      setDisconnecting(false);
    }
  }

  const connected = status?.configured && status.connected;
  const notConfigured = Boolean(status && !status.configured);

  return (
    <IntegrationCardRoot
      embedded={embedded}
      className={embedded ? undefined : "sm:flex-row sm:items-center sm:justify-between"}
    >
      <div className="min-w-0 flex-1">
        {!embedded ? (
          <p className="flex items-center gap-2 text-lg font-semibold text-white">
            <IntegrationBrandIcon brand="tiktok" size="sm" />
            TikTok Ads
          </p>
        ) : null}
        {notice === "connected" ? (
          <p className="mt-1 text-sm text-margify-cyan">Cuenta vinculada correctamente.</p>
        ) : null}
        {notice === "error" ? (
          <p className="mt-1 text-sm text-margify-negative">
            No se pudo conectar{reason ? `: ${decodeURIComponent(reason)}` : "."}
          </p>
        ) : null}
        {loading ? (
          <p className="mt-1 text-sm text-margify-muted">Cargando estado…</p>
        ) : notConfigured ? (
          <p className="mt-1 text-sm text-margify-muted">
            {(status as { message?: string }).message ?? "TikTok no configurado en el servidor."}
          </p>
        ) : connected ? (
          <p className="mt-1 text-sm text-margify-cyan">
            Advertiser ID: {(status as { advertiserId: string }).advertiserId}
          </p>
        ) : (
          <p className="mt-1 text-sm text-margify-muted">No conectada.</p>
        )}
      </div>
      <div className={cn("flex shrink-0 flex-wrap gap-2", multiTouchClusterClasses)}>
        {connected ? (
          <Button
            type="button"
            variant="secondary"
            className={multiTouchClusterChildButtonClasses}
            disabled={disconnecting}
            onClick={() => void disconnect()}
          >
            {disconnecting ? "Desconectando…" : "Desconectar"}
          </Button>
        ) : (
          <Link
            href="/api/auth/tiktok"
            className={cn(
              buttonClassName("primary"),
              multiTouchClusterChildButtonClasses,
              (loading || notConfigured) && "pointer-events-none opacity-50"
            )}
            aria-disabled={loading || notConfigured}
            onClick={() => setConnecting(true)}
          >
            {connecting ? "Conectando…" : "Conectar TikTok Ads"}
          </Link>
        )}
      </div>
    </IntegrationCardRoot>
  );
}
