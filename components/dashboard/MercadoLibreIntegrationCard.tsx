"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, buttonClassName } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DemoIntegrationPlaceholder } from "@/components/dashboard/DemoIntegrationPlaceholder";
import { useDemoMode } from "@/components/dashboard/DemoModeContext";
import { IntegrationBrandIcon } from "@/components/ui/IntegrationBrandIcon";

type StatusResponse =
  | { configured: false; connected: false; message?: string }
  | { configured: true; connected: false }
  | { configured: true; connected: true; userId: number | null };

export function MercadoLibreIntegrationCard() {
  const isDemo = useDemoMode();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mercadolibre/status", { cache: "no-store" });
      const data = (await res.json()) as StatusResponse;
      setStatus(data);
    } catch {
      setStatus({ configured: false, connected: false, message: "No se pudo leer el estado." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const mlNotice = searchParams.get("ml");
  const mlReason = searchParams.get("reason");

  if (isDemo) {
    return <DemoIntegrationPlaceholder brand="mercadolibre" name="Mercado Libre" />;
  }

  async function disconnect() {
    setDisconnecting(true);
    try {
      await fetch("/api/auth/mercadolibre/disconnect", { method: "POST" });
      await load();
    } finally {
      setDisconnecting(false);
    }
  }

  const connected = status?.configured && status.connected;
  const notConfigured = Boolean(status && !status.configured);
  const connectDisabled = loading || notConfigured;

  return (
    <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-lg font-semibold text-white">
          <IntegrationBrandIcon brand="mercadolibre" size="sm" />
          Mercado Libre
        </p>
        {mlNotice === "connected" ? (
          <p className="mt-1 text-sm text-margify-cyan">Cuenta vinculada correctamente.</p>
        ) : null}
        {mlNotice === "error" ? (
          <p className="mt-1 text-sm text-margify-negative">
            No se pudo conectar{mlReason ? `: ${decodeURIComponent(mlReason)}` : "."}
          </p>
        ) : null}
        {loading ? (
          <p className="mt-1 text-sm text-margify-muted">Cargando estado…</p>
        ) : notConfigured ? (
          <p className="mt-1 text-sm text-margify-muted">
            Falta configurar MERCADOLIBRE_APP_ID en el servidor (Vercel o .env.local).
          </p>
        ) : (
          <p className="mt-1 text-sm text-margify-muted">
            Estado:{" "}
            <span className={connected ? "text-margify-cyan" : "text-margify-muted"}>
              {connected
                ? `Conectada${status && "userId" in status && status.userId != null ? ` (usuario ${status.userId})` : ""}`
                : "Desconectada"}
            </span>
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {connected ? (
          <Button
            type="button"
            variant="secondary"
            disabled={disconnecting}
            onClick={() => void disconnect()}
          >
            {disconnecting ? "Desconectando…" : "Desconectar"}
          </Button>
        ) : (
          <Link
            href="/api/auth/mercadolibre"
            className={buttonClassName("secondary")}
            aria-disabled={connectDisabled}
            tabIndex={connectDisabled ? -1 : undefined}
            onClick={(e) => {
              if (connectDisabled) e.preventDefault();
            }}
          >
            Conectar con Mercado Libre
          </Link>
        )}
      </div>
    </Card>
  );
}
