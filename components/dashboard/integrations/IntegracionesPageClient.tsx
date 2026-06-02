"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { GoogleAdsIntegrationCard } from "@/components/dashboard/GoogleAdsIntegrationCard";
import { MercadoLibreIntegrationCard } from "@/components/dashboard/MercadoLibreIntegrationCard";
import { MetaIntegrationCard } from "@/components/dashboard/MetaIntegrationCard";
import { ShopifyIntegrationCard } from "@/components/dashboard/ShopifyIntegrationCard";
import { TiendanubeIntegrationCard } from "@/components/dashboard/TiendanubeIntegrationCard";
import { TikTokIntegrationCard } from "@/components/dashboard/TikTokIntegrationCard";
import { IntegrationPlatformShell } from "@/components/dashboard/integrations/IntegrationPlatformShell";
import { Header } from "@/components/ui/Header";
import { useDashboardIdentity, useDemoMode } from "@/components/dashboard/DemoModeContext";

type IntegrationsFlags = {
  shopify: boolean;
  tiendanube: boolean;
  mercadolibre: boolean;
  meta: boolean;
  google: boolean;
  tiktok: boolean;
};

function countActive(flags: IntegrationsFlags | null): number {
  if (!flags) return 0;
  return Object.values(flags).filter(Boolean).length;
}

function IntegracionesGlobalBanner({
  activeCount,
  isDemo,
}: {
  activeCount: number;
  isDemo: boolean;
}) {
  if (isDemo) {
    return (
      <p className="rounded-[12px] border border-margify-border bg-margify-card/80 px-4 py-3 text-sm text-margify-muted">
        Estás en modo demo: las integraciones se muestran como ejemplo.{" "}
        <Link href="/auth/register" className="font-medium text-[#64DFDF] hover:underline">
          Creá tu cuenta
        </Link>{" "}
        para conectar canales reales.
      </p>
    );
  }
  if (activeCount === 0) {
    return (
      <p
        className="rounded-[12px] border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"
        role="status"
      >
        Conectá al menos un canal de venta para ver tus datos reales
      </p>
    );
  }
  return (
    <p
      className="inline-flex items-center rounded-full bg-emerald-500/15 px-3 py-1.5 text-sm font-medium text-emerald-400"
      role="status"
    >
      {activeCount} integración{activeCount === 1 ? "" : "es"} activa{activeCount === 1 ? "" : "s"}
    </p>
  );
}

function CardFallback({ label }: { label: string }) {
  return <p className="text-sm text-margify-muted">Cargando {label}…</p>;
}

export function IntegracionesPageClient() {
  const identity = useDashboardIdentity();
  const isDemo = useDemoMode();
  const [flags, setFlags] = useState<IntegrationsFlags | null>(null);

  const loadFlags = useCallback(async () => {
    if (isDemo) {
      setFlags({
        shopify: true,
        tiendanube: true,
        mercadolibre: true,
        meta: true,
        google: true,
        tiktok: true,
      });
      return;
    }
    try {
      const res = await fetch("/api/dashboard/bootstrap", { cache: "no-store" });
      if (!res.ok) {
        setFlags(null);
        return;
      }
      const data = (await res.json()) as { integrations?: IntegrationsFlags };
      setFlags(data.integrations ?? null);
    } catch {
      setFlags(null);
    }
  }, [isDemo]);

  useEffect(() => {
    void loadFlags();
  }, [loadFlags]);

  const activeCount = useMemo(() => countActive(flags), [flags]);

  return (
    <>
      <Header userName={identity.full_name} showDateRange={false} />
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">Integraciones</h1>
        <p className="mt-1 text-sm text-margify-muted">
          Conectá tus canales de venta y plataformas de publicidad
        </p>
      </header>

      <div className="mb-8">
        <IntegracionesGlobalBanner activeCount={activeCount} isDemo={isDemo} />
      </div>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-white">Canales de venta</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <IntegrationPlatformShell
            brand="tiendanube"
            title="TiendaNube"
            description="Importá tus órdenes y productos automáticamente"
            connected={Boolean(flags?.tiendanube)}
          >
            <Suspense fallback={<CardFallback label="TiendaNube" />}>
              <TiendanubeIntegrationCard embedded />
            </Suspense>
          </IntegrationPlatformShell>

          <IntegrationPlatformShell
            brand="mercadolibre"
            title="MercadoLibre"
            description="Unificá tus ventas de MercadoLibre con tu dashboard"
            connected={Boolean(flags?.mercadolibre)}
          >
            <Suspense fallback={<CardFallback label="MercadoLibre" />}>
              <MercadoLibreIntegrationCard embedded />
            </Suspense>
          </IntegrationPlatformShell>

          <IntegrationPlatformShell
            brand="shopify"
            title="Shopify"
            description="Importá órdenes desde tu tienda Shopify"
            connected={Boolean(flags?.shopify)}
          >
            <Suspense fallback={<CardFallback label="Shopify" />}>
              <ShopifyIntegrationCard embedded />
            </Suspense>
          </IntegrationPlatformShell>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-white">Plataformas de publicidad</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <IntegrationPlatformShell
            brand="meta"
            title="Meta Ads"
            description="Calculá tu ROAS real y controlá tus campañas"
            connected={Boolean(flags?.meta)}
          >
            <Suspense fallback={<CardFallback label="Meta Ads" />}>
              <MetaIntegrationCard embedded />
            </Suspense>
          </IntegrationPlatformShell>

          <IntegrationPlatformShell
            brand="googleAds"
            title="Google Ads"
            description="Unificá tus campañas de Google con tu rentabilidad"
            connected={Boolean(flags?.google)}
          >
            <Suspense fallback={<CardFallback label="Google Ads" />}>
              <GoogleAdsIntegrationCard embedded />
            </Suspense>
          </IntegrationPlatformShell>

          <IntegrationPlatformShell
            brand="tiktok"
            title="TikTok Ads"
            description="Medí el rendimiento real de tus ads en TikTok"
            connected={Boolean(flags?.tiktok)}
          >
            <Suspense fallback={<CardFallback label="TikTok Ads" />}>
              <TikTokIntegrationCard embedded />
            </Suspense>
          </IntegrationPlatformShell>
        </div>
      </section>
    </>
  );
}
