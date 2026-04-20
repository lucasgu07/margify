"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { buildCampanasAdvisorInsights } from "@/lib/ai-advisor-insights";

import { Megaphone, MousePointerClick, Target, Wallet } from "lucide-react";

import { AIAdvisor } from "@/components/dashboard/AIAdvisor";

import { CampaignsDataTable } from "@/components/dashboard/CampaignsDataTable";
import { GoogleAdsCampaignsTable } from "@/components/dashboard/GoogleAdsCampaignsTable";
import { MetaAdsCampaignsTable } from "@/components/dashboard/MetaAdsCampaignsTable";

import { useDashboardIdentity } from "@/components/dashboard/DemoModeContext";
import { useDashboard } from "@/components/dashboard/DashboardContext";

import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { IntegrationBrandIcon } from "@/components/ui/IntegrationBrandIcon";

import { Header } from "@/components/ui/Header";

import { MetricCard } from "@/components/ui/MetricCard";

import { adsPlatformToBrandId } from "@/lib/integration-brands";
import { filterCampaignsByStoreAndAds, mockCampaigns } from "@/lib/mock-data";

import type { AdsPlatformScope, Campaign } from "@/types";

function pctChange(cur: number, prev: number) {
  if (!Number.isFinite(cur) || !Number.isFinite(prev) || prev === 0) return 0;

  return ((cur - prev) / Math.abs(prev)) * 100;
}

function aggregateCampaignTotals(c: Campaign[]) {
  const spend = c.reduce((a, x) => a + x.spend, 0);

  const attr = c.reduce((a, x) => a + x.attributed_revenue, 0);

  const conv = c.reduce((a, x) => a + (x.conversions ?? 0), 0);

  const roas = spend > 0 ? attr / spend : 0;

  const cpa = conv > 0 ? spend / conv : 0;

  return { spend, attr, conv, roas, cpa };
}

function campaignKpiChangesVsPrevious(rows: Campaign[]) {
  const prevRows = rows.map((row) => ({
    ...row,

    spend: row.spend * 0.97,

    attributed_revenue: row.attributed_revenue * 0.98,

    conversions: Math.max(1, Math.round((row.conversions ?? 1) * 0.95)),
  }));

  const cur = aggregateCampaignTotals(rows);

  const prev = aggregateCampaignTotals(prevRows);

  return {
    spendChange: pctChange(cur.spend, prev.spend),

    roasChange: pctChange(cur.roas, prev.roas),

    cpaChange: pctChange(cur.cpa, prev.cpa),

    convChange: pctChange(cur.conv, prev.conv),
  };
}

function importantNote(adsPlatform: AdsPlatformScope) {
  if (adsPlatform === "meta") {
    return (
      <>
        Meta pierde entre 30% y 50% de tus conversiones desde iOS 14. El ROAS real de Margify incluye
        todas las ventas verificadas contra tu backoffice y medios de pago.
      </>
    );
  }
  if (adsPlatform === "tiktok") {
    return (
      <>
        TikTok Ads puede atribuir distinto a tus ventas reales. El ROAS real de Margify cruza gasto y
        ingresos verificados para ver el retorno con el mismo criterio que el resto de tu cuenta.
      </>
    );
  }
  return (
    <>
      Google Ads reporta conversiones con su ventana y modelo. El ROAS real de Margify contrasta con
      ventas verificadas para que compares con un solo estándar.
    </>
  );
}

export default function CampanasPage() {
  const { full_name } = useDashboardIdentity();
  const { storeScope, adsPlatform } = useDashboard();

  const baseCampaigns = useMemo(
    () => filterCampaignsByStoreAndAds(mockCampaigns, storeScope, adsPlatform),
    [storeScope, adsPlatform]
  );

  const [rows, setRows] = useState<Campaign[]>(() =>
    filterCampaignsByStoreAndAds(mockCampaigns, "all", "meta")
  );

  useEffect(() => {
    setRows([...baseCampaigns]);
  }, [baseCampaigns]);

  const adsBrand = adsPlatformToBrandId(adsPlatform);

  const totals = useMemo(() => {
    const spend = rows.reduce((a, c) => a + c.spend, 0);

    const attr = rows.reduce((a, c) => a + c.attributed_revenue, 0);

    const conv = rows.reduce((a, c) => a + (c.conversions ?? 0), 0);

    const roas = spend > 0 ? attr / spend : 0;

    const cpa = conv > 0 ? spend / conv : 0;

    return { spend, roas, cpa, conv };
  }, [rows]);

  const kpiDelta = useMemo(() => campaignKpiChangesVsPrevious(rows), [rows]);

  const toggleStatus = useCallback((id: string) => {
    setRows((r) =>
      r.map((c) =>
        c.id === id ? { ...c, status: c.status === "active" ? "paused" : "active" } : c
      )
    );
  }, []);

  const advisorInsights = useMemo(
    () => buildCampanasAdvisorInsights(storeScope, adsPlatform),
    [storeScope, adsPlatform]
  );

  return (
    <>
      <Header userName={full_name} />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Gasto total en ads"
          value={totals.spend}
          icon={Wallet}
          integrationBrand={adsBrand}
          change={kpiDelta.spendChange}
        />

        <MetricCard
          title="ROAS real promedio"
          value={totals.roas}
          valueIsCurrency={false}
          suffix="x"
          icon={Target}
          integrationBrand={adsBrand}
          change={kpiDelta.roasChange}
        />

        <MetricCard
          title="CPA real"
          value={totals.cpa}
          icon={MousePointerClick}
          integrationBrand={adsBrand}
          change={kpiDelta.cpaChange}
        />

        <MetricCard
          title="Conversiones"
          value={totals.conv}
          valueIsCurrency={false}
          icon={Megaphone}
          integrationBrand={adsBrand}
          change={kpiDelta.convChange}
        />
      </div>

      <Card className="mt-8 border-margify-cyan/25 bg-margify-cyan/5">
        <CardTitle className="text-margify-cyan">Importante</CardTitle>

        <CardDescription className="text-margify-text/90">
          <span className="inline-flex items-start gap-2">
            <IntegrationBrandIcon brand={adsBrand} size="sm" className="mt-0.5 shrink-0" />
            <span>{importantNote(adsPlatform)}</span>
          </span>
        </CardDescription>
      </Card>

      <div className="mt-8">
        {adsPlatform === "google" ? (
          <GoogleAdsCampaignsTable />
        ) : adsPlatform === "meta" ? (
          <MetaAdsCampaignsTable />
        ) : (
          <CampaignsDataTable
            campaigns={rows}
            onToggleStatus={toggleStatus}
            adsPlatform={adsPlatform}
          />
        )}
      </div>

      <div className="mt-10">
        <AIAdvisor insights={advisorInsights} />
      </div>
    </>
  );
}
