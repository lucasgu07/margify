"use client";

import { Suspense, useState } from "react";
import { useDashboardIdentity } from "@/components/dashboard/DemoModeContext";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Header } from "@/components/ui/Header";
import { Input, Label } from "@/components/ui/Input";
import { MercadoLibreIntegrationCard } from "@/components/dashboard/MercadoLibreIntegrationCard";
import { IntegrationBrandIcon } from "@/components/ui/IntegrationBrandIcon";
import type { IntegrationBrandId } from "@/lib/integration-brands";
import { mockCostsConfig } from "@/lib/mock-data";

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
    <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
  const [name, setName] = useState(identity.full_name);
  const [email, setEmail] = useState(identity.email);
  const [costs, setCosts] = useState({
    product: mockCostsConfig.product_cost_percent,
    pay: mockCostsConfig.payment_commission_percent,
    ship: mockCostsConfig.shipping_cost_fixed,
    agency: mockCostsConfig.agency_fee_percent,
  });

  return (
    <>
      <Header userName={identity.full_name} showDateRange={false} />
      <h1 className="mb-8 text-2xl font-bold text-white">Configuración</h1>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-margify-cyan">Tu cuenta</h2>
        <Card className="grid gap-4 md:grid-cols-2">
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
            <Button type="button">Guardar cuenta</Button>
          </div>
        </Card>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-lg font-semibold text-margify-cyan">Integraciones conectadas</h2>
        <IntegrationCard brand="tiendanube" name="TiendaNube" status="Conectada" />
        <Suspense
          fallback={
            <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-margify-muted">Cargando Mercado Libre…</p>
            </Card>
          }
        >
          <MercadoLibreIntegrationCard />
        </Suspense>
        <IntegrationCard brand="shopify" name="Shopify" status="Conectada" />
        <IntegrationCard brand="meta" name="Meta Ads" status="Conectada" />
        <IntegrationCard brand="googleAds" name="Google Ads" status="Desconectada" soon />
        <IntegrationCard brand="tiktok" name="TikTok Ads" status="Desconectada" soon />
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-lg font-semibold text-margify-cyan">Mis costos</h2>
        <Card className="grid gap-4 md:grid-cols-2">
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
            <Button type="button">Guardar cambios</Button>
          </div>
        </Card>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-lg font-semibold text-margify-cyan">Plan actual</h2>
        <Card>
          <CardTitle>Pro — USD 26 / mes</CardTitle>
          <CardDescription>Renovación estimada: 12/05/2026.</CardDescription>
          <Button type="button" className="mt-4" variant="secondary">
            Cambiar plan
          </Button>
        </Card>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-lg font-semibold text-margify-negative">Zona de peligro</h2>
        <Card className="border-margify-negative/40">
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
