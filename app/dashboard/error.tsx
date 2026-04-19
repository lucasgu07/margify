"use client";

import { useEffect } from "react";
import { buttonClassName } from "@/components/ui/Button";

/**
 * Captura errores de render en el segmento /dashboard (incl. fallos de Server Components).
 * En producción Next oculta el mensaje detallado en el cliente; el digest ayuda a correlacionar con logs de Vercel.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard]", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <p className="text-lg font-semibold text-white">No pudimos cargar el panel</p>
      <p className="max-w-md text-sm text-margify-muted">
        Probá de nuevo. Si sigue fallando, revisá los logs del deploy en Vercel o contactá soporte con esta
        referencia.
      </p>
      {error.digest ? (
        <p className="font-mono text-xs text-margify-muted">
          Ref: <span className="text-margify-cyan">{error.digest}</span>
        </p>
      ) : null}
      <button type="button" className={buttonClassName("primary")} onClick={() => reset()}>
        Reintentar
      </button>
    </div>
  );
}
