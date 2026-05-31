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
import { TikTokIntegrationCard } from "@/components/dashboard/TikTokIntegrationCard";
import { IntegrationBrandIcon } from "@/components/ui/IntegrationBrandIcon";
import type { IntegrationBrandId } from "@/lib/integration-brands";
import { daysUntil } from "@/lib/dodo-billing";
import { canUseApiAccess, planDisplayName } from "@/lib/plan-features";
import { mockCostsConfig } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

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
  const { costsConfig, refreshBootstrap, plan, billing } = useDashboard();
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [apiKeyMsg, setApiKeyMsg] = useState<string | null>(null);
  const [generatingKey, setGeneratingKey] = useState(false);
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
            <Input
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="md:col-span-2 flex flex-wrap gap-3">
            <Button type="button" disabled={isDemo || savingAccount} onClick={() => void saveAccount()}>
              {savingAccount ? "Guardando…" : "Guardar cuenta"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={isDemo || savingAccount || !password.trim()}
              onClick={async () => {
                if (isDemo || !password.trim()) return;
                setSavingAccount(true);
                setSaveErr(null);
                const supabase = createClient();
                if (!supabase) {
                  setSaveErr("Supabase no configurado.");
                  setSavingAccount(false);
                  return;
                }
                const { error } = await supabase.auth.updateUser({ password: password.trim() });
                setSavingAccount(false);
                if (error) {
                  setSaveErr(error.message);
                  return;
                }
                setPassword("");
                setSaveMsg("Contraseña actualizada.");
              }}
            >
              Cambiar contraseña
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
        <Suspense fallback={<Card glass className="p-4 text-sm text-margify-muted">Cargando TikTok…</Card>}>
          <TikTokIntegrationCard />
        </Suspense>
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
        <h2 className="text-lg font-semibold text-margify-cyan">API (plan Pro+)</h2>
        <Card glass>
          <CardTitle>Clave de API</CardTitle>
          <CardDescription>
            Accedé a métricas con GET /api/v1/metrics y Authorization: Bearer mfy_...
          </CardDescription>
          {apiKeyMsg ? (
            <p className="mt-3 break-all text-sm text-margify-cyan" role="status">
              {apiKeyMsg}
            </p>
          ) : null}
          <Button
            type="button"
            className="mt-4"
            variant="secondary"
            disabled={isDemo || generatingKey || !canUseApiAccess(plan)}
            onClick={async () => {
              setGeneratingKey(true);
              setApiKeyMsg(null);
              try {
                const res = await fetch("/api/account/api-key", { method: "POST" });
                const data = (await res.json()) as { api_key?: string; message?: string; error?: string };
                if (!res.ok) {
                  setApiKeyMsg(data.message ?? "No se pudo generar la clave.");
                  return;
                }
                setApiKeyMsg(
                  `Clave (copiala ahora, no se vuelve a mostrar): ${data.api_key ?? ""}`
                );
              } catch {
                setApiKeyMsg("Error de red.");
              } finally {
                setGeneratingKey(false);
              }
            }}
          >
            {generatingKey ? "Generando…" : "Generar clave API"}
          </Button>
          {!canUseApiAccess(plan) && !isDemo ? (
            <p className="mt-2 text-xs text-margify-muted">Disponible en plan Pro o Scale.</p>
          ) : null}
        </Card>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-lg font-semibold text-margify-cyan">Plan actual</h2>
        <Card glass>
          <CardTitle>{planDisplayName(plan)}</CardTitle>
          <CardDescription>
            {billing.billing_status === "trialing" && billing.trial_ends_at
              ? `Periodo de prueba — termina en ${daysUntil(billing.trial_ends_at) ?? "?"} días.`
              : billing.billing_status === "active"
                ? "Suscripción activa."
                : plan === "starter"
                  ? "Plan gratuito (30 órdenes/mes, historial 1 mes)."
                  : "Estado de facturación pendiente de sincronizar."}
          </CardDescription>
          <Link href="/#planes" className="mt-4 inline-block">
            <Button type="button" variant="secondary">
              Cambiar plan
            </Button>
          </Link>
        </Card>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-lg font-semibold text-margify-negative">Zona de peligro</h2>
        <Card glass className="border-margify-negative/40">
          <CardTitle>Eliminar cuenta</CardTitle>
          <CardDescription>
            Esta acción es irreversible. Vas a perder históricos, integraciones y alertas.
          </CardDescription>
          <Button
            type="button"
            variant="danger"
            className="mt-4"
            disabled={isDemo || deleting}
            onClick={async () => {
              if (isDemo || !window.confirm("¿Eliminar tu cuenta de forma permanente?")) return;
              setDeleting(true);
              try {
                const res = await fetch("/api/account", { method: "DELETE" });
                if (res.ok) {
                  window.location.href = "/";
                  return;
                }
                setSaveErr("No se pudo eliminar la cuenta.");
              } catch {
                setSaveErr("Error al eliminar la cuenta.");
              } finally {
                setDeleting(false);
              }
            }}
          >
            {deleting ? "Eliminando…" : "Eliminar cuenta"}
          </Button>
        </Card>
      </section>
    </>
  );
}
