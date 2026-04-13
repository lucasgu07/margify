"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import Link from "next/link";

type Platform = "tiendanube" | "shopify" | "mercadolibre";

const platforms: { id: Platform; label: string }[] = [
  { id: "tiendanube", label: "TiendaNube" },
  { id: "shopify", label: "Shopify" },
  { id: "mercadolibre", label: "MercadoLibre" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<Platform[]>([]);
  const [storeUrl, setStoreUrl] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [productCost, setProductCost] = useState(40);
  const [payComm, setPayComm] = useState(3.5);
  const [ship, setShip] = useState(5);
  const [agency, setAgency] = useState(0);

  useEffect(() => {
    if (step !== 4) return;
    const t = setTimeout(() => router.push("/dashboard"), 3000);
    return () => clearTimeout(t);
  }, [router, step]);

  function togglePlatform(p: Platform) {
    setSelected((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]));
  }

  return (
    <div className="min-h-screen bg-margify-bg px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="inline-block">
          <Logo />
        </Link>
        <div className="mt-6 flex gap-2">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className={`h-1 flex-1 rounded-full transition-colors duration-margify ${
                n <= step ? "bg-margify-cyan" : "bg-margify-border"
              }`}
            />
          ))}
        </div>

        {step === 1 ? (
          <Card className="mt-8">
            <h1 className="text-2xl font-bold text-white">¿Dónde vendés?</h1>
            <p className="mt-1 text-margify-muted">Podés elegir más de un canal.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {platforms.map((p) => {
                const on = selected.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePlatform(p.id)}
                    className={`rounded-card border px-4 py-8 text-center text-lg font-semibold transition-all duration-margify ${
                      on
                        ? "border-margify-cyan bg-margify-cyan/15 text-margify-cyan"
                        : "border-margify-border bg-margify-cardAlt text-white hover:border-margify-cyan/40"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            <Button
              type="button"
              className="mt-8 w-full sm:w-auto"
              disabled={!selected.length}
              onClick={() => setStep(2)}
            >
              Continuar
            </Button>
          </Card>
        ) : null}

        {step === 2 ? (
          <Card className="mt-8 space-y-6">
            <h1 className="text-2xl font-bold text-white">Conectá tu tienda</h1>
            {selected.includes("tiendanube") ? (
              <div className="space-y-3 rounded-card border border-margify-border bg-margify-cardAlt p-4">
                <p className="text-sm font-semibold text-margify-cyan">TiendaNube</p>
                <div>
                  <Label>URL de tu tienda</Label>
                  <Input
                    placeholder="https://tu-tienda.mitiendanube.com"
                    value={storeUrl}
                    onChange={(e) => setStoreUrl(e.target.value)}
                  />
                </div>
                <div>
                  <Label>API Token</Label>
                  <Input
                    placeholder="Token privado de la API"
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-margify-muted">
                    En TiendaNube: Configuración → API y webhooks → Generar token de acceso.
                  </p>
                </div>
              </div>
            ) : null}
            {selected.includes("shopify") ? (
              <div className="space-y-3 rounded-card border border-margify-border bg-margify-cardAlt p-4">
                <p className="text-sm font-semibold text-margify-cyan">Shopify</p>
                <div>
                  <Label>URL de tu tienda</Label>
                  <Input placeholder="https://tu-marca.myshopify.com" />
                </div>
                <div>
                  <Label>API Key</Label>
                  <Input placeholder="Clave de app privada" />
                </div>
              </div>
            ) : null}
            {selected.includes("mercadolibre") ? (
              <div className="rounded-card border border-margify-border bg-margify-cardAlt p-4">
                <p className="text-sm font-semibold text-margify-cyan">MercadoLibre</p>
                <Button type="button" variant="secondary" className="mt-3">
                  Conectar con MercadoLibre (OAuth)
                </Button>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                Atrás
              </Button>
              <Button type="button" onClick={() => setStep(3)}>
                Conectar y continuar
              </Button>
            </div>
          </Card>
        ) : null}

        {step === 3 ? (
          <Card className="mt-8 space-y-6">
            <h1 className="text-2xl font-bold text-white">
              Para calcular tu margen real necesitamos tus costos
            </h1>
            <div className="space-y-4">
              <div>
                <Label>Costo del producto (% del precio de venta)</Label>
                <div className="mt-2 flex items-center gap-4">
                  <input
                    type="range"
                    min={10}
                    max={80}
                    value={productCost}
                    onChange={(e) => setProductCost(Number(e.target.value))}
                    className="flex-1 accent-margify-cyan"
                  />
                  <Input
                    className="w-24"
                    type="number"
                    value={productCost}
                    onChange={(e) => setProductCost(Number(e.target.value))}
                  />
                </div>
              </div>
              <div>
                <Label>Comisión de pago (%)</Label>
                <div className="mt-2 flex items-center gap-4">
                  <input
                    type="range"
                    min={0}
                    max={15}
                    step={0.1}
                    value={payComm}
                    onChange={(e) => setPayComm(Number(e.target.value))}
                    className="flex-1 accent-margify-cyan"
                  />
                  <Input
                    className="w-24"
                    type="number"
                    step={0.1}
                    value={payComm}
                    onChange={(e) => setPayComm(Number(e.target.value))}
                  />
                </div>
              </div>
              <div>
                <Label>Costo de envío fijo (USD)</Label>
                <Input
                  type="number"
                  value={ship}
                  onChange={(e) => setShip(Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Fee de agencia (% del gasto en ads)</Label>
                <Input
                  type="number"
                  value={agency}
                  onChange={(e) => setAgency(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="ghost" onClick={() => setStep(2)}>
                Atrás
              </Button>
              <Button type="button" onClick={() => setStep(4)}>
                Guardar y ver mi dashboard
              </Button>
            </div>
          </Card>
        ) : null}

        {step === 4 ? (
          <Card className="mt-8 flex flex-col items-center py-14 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-margify-cyan bg-margify-cyan/15">
              <Check className="h-9 w-9 text-margify-cyan" />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-white">
              ¡Todo listo! Estamos importando tus datos
            </h1>
            <p className="mt-2 max-w-md text-margify-muted">
              En unos segundos vas a ver tu rentabilidad real. Te redirigimos al dashboard…
            </p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
