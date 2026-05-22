"use client";

import { Suspense, useEffect, useState } from "react";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { useDashboardIdentity, useDemoMode } from "@/components/dashboard/DemoModeContext";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Header } from "@/components/ui/Header";
import { Input, Label } from "@/components/ui/Input";
import { GoogleAdsIntegrationCard } from "@/components/dashboard/GoogleAdsIntegrationCard";
import { MercadoLibreIntegrationCard } from "@/components/dashboard/MercadoLibreIntegrationCard";
import { MetaIntegrationCard } from "@/components/dashboard/MetaIntegrationCard";
import { ShopifyIntegrationCard } from "@/components/dashboard/ShopifyIntegrationCard";
import { TiendanubeIntegrationCard } from "@/components/dashboard/TiendanubeIntegrationCard";
import { IntegrationBrandIcon } from "@/components/ui/IntegrationBrandIcon";
import type { IntegrationBrandId } from "@/lib/integration-brands";
import { mockCostsConfig } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase";

function IntegrationCard({
  brand,
  name,
  status,
  soon,
}: {
  brand: IntegrationBrandId;
  name: string;
  status: "Conectada" | "Desconectada";
  soon?: boolean;
}) {
  return (
    <Card glass className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="flex items-center gap-2 text-lg font-semibold text-white">
          <IntegrationBrandIcon brand={brand} size="sm" />
          {name}
        </p>
        <p className="text-sm text-margify-muted">
          Estado:{" "}
          <span className={status === "Conectada" ? "text-margify-cyan" : "text-margify-muted"}>
            {soon ? "Próximamente" : status}
          </span>
        </p>
      </div>
      <Button type="button" variant="secondary" disabled={soon}>
        {soon ? "Disponible pronto" : "Reconectar"}
      </Button>
    </Card>
  );
}

export default function ConfiguracionPage() {
  const identity = useDashboardIdentity();
  const isDemo = useDemoMode();
  const { costsConfig, refreshBootstrap } = useDashboard();
  const [name, setName] = useState(identity.full_name);
  const [email, setEmail] = useState(identity.email);
  const [costs, setCosts] = useState({
    product: mockCostsConfig.product_cost_percent,
    pay: mockCostsConfig.payment_commission_percent,
    ship: mockCostsConfig.shipping_cost_fixed,
    agency: mockCostsConfig.agency_fee_percent,
  });
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingCosts, setSavingCosts] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  useEffect(() => {
    if (isDemo) return;
    setCosts({
      product: costsConfig.product_cost_percent,
      pay: costsConfig.payment_commission_percent,
      ship: costsConfig.shipping_cost_fixed,
      agency: costsConfig.agency_fee_percent,
    });
  }, [costsConfig, isDemo]);

  async function saveAccount() {
    if (isDemo) return;
    setSavingAccount(true);
    setSaveErr(null);
    setSaveMsg(null);
    const supabase = createClient();
    if (!supabase) {
      setSaveErr("Supabase no configurado.");
      setSavingAccount(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({
      email: email.trim(),
      data: { full_name: name.trim() },
    });
    setSavingAccount(false);
    if (error) {
      setSaveErr(error.message);
      return;
    }
    setSaveMsg("Cuenta actualizada.");
  }

  async function saveCosts() {
    if (isDemo) return;
    setSavingCosts(true);
    setSaveErr(null);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/dashboard/costs-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_cost_percent: costs.product,
          payment_commission_percent: costs.pay,
          shipping_cost_fixed: costs.ship,
          agency_fee_percent: costs.agency,
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setSaveErr(data.error ?? "No se pudieron guardar los costos.");
        return;
      }
      await refreshBootstrap();
      setSaveMsg("Costos guardados. Las métricas se recalculan con estos valores.");
    } catch {
      setSaveErr("Error de red al guardar costos.");
    } finally {
      setSavingCosts(false);
    }
  }

  return (
    <>
      <Header userName={identity.full_name} showDateRange={false} />
      <h1 className="mb-8 text-2xl font-bold text-white">Configuración</h1>

      {saveMsg ? (
        <p className="mb-4 text-sm text-margify-cyan" role="status">
          {saveMsg}
        </p>
      ) : null}
      {saveErr ? (
        <p className="mb-4 text-sm text-margify-negative" role="alert">
          {saveErr}
        </p>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-margify-cyan">Tu cuenta</h2>
        <Card glass className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </div>
          <div className="md:col-span-2">
            <Label>Nueva contraseña</Label>
            <Input type="password" placeholder="••••••••" autoComplete="new-password" />
          </div>
          <div className="md:col-span-2">
            <Button
              type="button"
              disabled={isDemo || savingAccount}
              onClick={() => void saveAccount()}
            >
              {savingAccount ? "Guardando…" : "Guardar cuenta"}
            </Button>
          </div>
        </Card>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-lg font-semibold text-margify-cyan">Integraciones conectadas</h2>
        <Suspense
          fallback={
            <Card glass className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-margify-muted">Cargando TiendaNube…</p>
            </Card>
          }
        >
          <TiendanubeIntegrationCard />
        </Suspense>
        <Suspense
          fallback={
            <Card glass className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-margify-muted">Cargando Mercado Libre…</p>
            </Card>
          }
        >
          <MercadoLibreIntegrationCard />
        </Suspense>
        <Suspense
          fallback={
            <Card glass className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-margify-muted">Cargando Shopify…</p>
            </Card>
          }
        >
          <ShopifyIntegrationCard />
        </Suspense>
        <Suspense
          fallback={
            <Card glass className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-margify-muted">Cargando Meta Ads…</p>
            </Card>
          }
        >
          <MetaIntegrationCard />
        </Suspense>
        <Suspense
          fallback={
            <Card glass className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-margify-muted">Cargando Google Ads…</p>
            </Card>
          }
        >
          <GoogleAdsIntegrationCard />
        </Suspense>
        <IntegrationCard brand="tiktok" name="TikTok Ads" status="Desconectada" soon />
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-lg font-semibold text-margify-cyan">Mis costos</h2>
        <Card glass className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Costo del producto (%)</Label>
            <Input
              type="number"
              value={costs.product}
              onChange={(e) => setCosts({ ...costs, product: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>Comisión de pago (%)</Label>
            <Input
              type="number"
              value={costs.pay}
              onChange={(e) => setCosts({ ...costs, pay: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>Costo de envío fijo (USD)</Label>
            <Input
              type="number"
              value={costs.ship}
              onChange={(e) => setCosts({ ...costs, ship: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>Fee de agencia (% del gasto en ads)</Label>
            <Input
              type="number"
              value={costs.agency}
              onChange={(e) => setCosts({ ...costs, agency: Number(e.target.value) })}
            />
          </div>
          <div className="md:col-span-2">
            <Button
              type="button"
              disabled={isDemo || savingCosts}
              onClick={() => void saveCosts()}
            >
              {savingCosts ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
        </Card>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-lg font-semibold text-margify-cyan">Plan actual</h2>
        <Card glass>
          <CardTitle>Pro — USD 26 / mes</CardTitle>
          <CardDescription>Renovación estimada: 12/05/2026.</CardDescription>
          <Button type="button" className="mt-4" variant="secondary">
            Cambiar plan
          </Button>
        </Card>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-lg font-semibold text-margify-negative">Zona de peligro</h2>
        <Card glass className="border-margify-negative/40">
          <CardTitle>Eliminar cuenta</CardTitle>
          <CardDescription>
            Esta acción es irreversible. Vas a perder históricos, integraciones y alertas.
          </CardDescription>
          <Button type="button" variant="danger" className="mt-4">
            Eliminar cuenta
          </Button>
        </Card>
      </section>
    </>
  );
}
