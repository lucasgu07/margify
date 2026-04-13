import Link from "next/link";
import { LayoutDashboard, Link2, Receipt, Sparkles } from "lucide-react";
import { buttonClassName } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { Badge } from "@/components/ui/Badge";
import { LandingPricing } from "@/components/landing/LandingPricing";

const howItWorksSteps = [
  {
    step: 1,
    title: "Conectá tu tienda y canales",
    description:
      "Enlazá TiendaNube, Shopify, MercadoLibre y tus cuentas de publicidad. Los datos de ventas y ads se sincronizan solos.",
    Icon: Link2,
  },
  {
    step: 2,
    title: "Sumá todos tus costos",
    description:
      "Comisiones, envío, costo del producto y gastos fijos en un solo lugar. Así el margen refleja la realidad, no un estimado.",
    Icon: Receipt,
  },
  {
    step: 3,
    title: "Mirá tu ganancia real",
    description:
      "Un dashboard claro con rentabilidad total y por producto. Sin planillas ni números sueltos entre plataformas.",
    Icon: LayoutDashboard,
  },
  {
    step: 4,
    title: "Actuá a tiempo",
    description:
      "Alertas cuando algo se desvía y el asistente con IA te orienta qué revisar o ajustar para proteger tu margen.",
    Icon: Sparkles,
  },
] as const;

const integrations = [
  "TiendaNube",
  "Shopify",
  "MercadoLibre",
  "Meta",
  "Google",
  "TikTok",
];

const navLinkClassName =
  "text-sm font-medium text-margify-muted transition-colors duration-margify hover:text-white";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-margify-bg text-margify-text">
      <header className="sticky top-0 z-50 border-b border-margify-border bg-margify-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-4 md:px-6">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-8 gap-y-2">
            <Link href="/" className="shrink-0">
              <Logo />
            </Link>
            <nav className="flex flex-wrap items-center gap-x-5 gap-y-1" aria-label="Secciones de la página">
              <a href="#como-funciona" className={navLinkClassName}>
                Cómo funciona
              </a>
              <a href="#funciones" className={navLinkClassName}>
                Funciones
              </a>
              <a href="#planes" className={navLinkClassName}>
                Planes
              </a>
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-margify-muted transition-colors duration-margify hover:text-white"
            >
              Ingresar
            </Link>
            <Link
              href="/auth/register"
              className={buttonClassName("primary", "px-4 py-2 text-sm")}
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section
          id="inicio"
          className="relative scroll-mt-24 overflow-hidden border-b border-margify-border/80"
        >
          <div className="pointer-events-none absolute inset-0 bg-margify-bg" aria-hidden />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_70%_at_50%_-35%,rgba(100,223,223,0.14),transparent_55%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_45%_at_100%_20%,rgba(100,223,223,0.08),transparent_60%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-margify-cyan/10 via-transparent to-margify-bg"
            aria-hidden
          />
          <div className="relative mx-auto max-w-6xl px-4 py-16 md:flex md:items-center md:justify-between md:px-6 md:py-24">
            <div className="max-w-2xl">
              <Badge type="neutral" label="+ 1.200 tiendas ya usan Margify" className="mb-6" />
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
                Sabé exactamente si tu tienda gana o pierde plata
              </h1>
              <p className="mt-6 text-lg text-margify-muted md:text-xl">
                Margify conecta todas tus ventas, suma todos tus costos ocultos y te muestra tu
                ganancia real en tiempo real. Sin Excel. Sin adivinar.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/auth/register"
                  className={buttonClassName("primary", "w-full px-8 py-3 sm:w-auto")}
                >
                  Empezar gratis
                </Link>
                <Link
                  href="/dashboard"
                  className={buttonClassName("secondary", "w-full px-8 py-3 sm:w-auto")}
                >
                  Ver demo
                </Link>
              </div>
              <div className="mt-12 flex flex-wrap gap-3">
                {integrations.map((n) => (
                  <span
                    key={n}
                    className="rounded-full border border-margify-border bg-margify-card px-3 py-1 text-xs font-medium text-margify-muted"
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          id="como-funciona"
          className="scroll-mt-24 border-b border-margify-border bg-margify-bg py-14 md:py-20"
          aria-labelledby="how-it-works-heading"
        >
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <Badge type="neutral" label="Cómo funciona" className="mb-4" />
              <h2
                id="how-it-works-heading"
                className="text-3xl font-bold tracking-tight text-white md:text-4xl"
              >
                Cuatro pasos para ver tu negocio con claridad
              </h2>
              <p className="mt-4 text-margify-muted md:text-lg">
                Sin complicaciones: conectás, cargás costos, mirás el panel y reaccionás cuando hace falta.
              </p>
            </div>
            <ol className="mt-12 grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              {howItWorksSteps.map(({ step, title, description, Icon }) => (
                <li key={step}>
                  <Card className="relative h-full border-margify-border bg-margify-card pt-8">
                    <div className="absolute left-6 top-0 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-margify-border bg-margify-black text-sm font-bold text-margify-cyan">
                      {step}
                    </div>
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-control border border-margify-border bg-margify-cardAlt text-margify-cyan">
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <CardTitle className="text-lg">{title}</CardTitle>
                    <CardDescription className="mt-2 text-sm leading-relaxed text-margify-muted">
                      {description}
                    </CardDescription>
                  </Card>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-y border-margify-border bg-margify-card py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <h2 className="text-center text-3xl font-bold text-white md:text-4xl">
              Basta de manejar tu negocio a ciegas
            </h2>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                {
                  t: "Meta dice ROAS 4x",
                  d: "El panel te muestra un número optimista que no incluye toda la realidad post iOS 14.",
                },
                {
                  t: "Pero sumás costos reales",
                  d: "Comisiones, envío, producto, agencia y errores de atribución comen el margen.",
                },
                {
                  t: "Resultado: estás perdiendo plata",
                  d: "Sin verlo en un solo lugar, ajustás campañas y precios a ciegas.",
                },
              ].map((c) => (
                <Card key={c.t} className="bg-margify-cardAlt">
                  <CardTitle className="text-xl">{c.t}</CardTitle>
                  <CardDescription className="text-margify-muted">{c.d}</CardDescription>
                </Card>
              ))}
            </div>
            <div className="mx-auto mt-12 max-w-md rounded-card border border-margify-border bg-margify-black p-6 md:p-8">
              <p className="text-center text-base font-semibold text-white">
                Por cada <span className="text-margify-cyan">$100</span> que vendés
              </p>
              <p className="mt-2 text-center text-sm leading-snug text-margify-muted">
                No es “ganancia = venta”. Parte se va en costos que ya ves y otra en los que casi nadie suma al día a día.
              </p>
              <div className="mt-8 space-y-3 border-t border-margify-border pt-6">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-margify-muted">Entra por la venta</span>
                  <span className="shrink-0 tabular-nums font-medium text-white">$100</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-margify-muted">Costos que ya controlás</span>
                  <span className="shrink-0 tabular-nums text-white/85">−$35</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-margify-negative/90">Costos que suelen quedar afuera</span>
                  <span className="shrink-0 tabular-nums text-margify-negative/90">−$22</span>
                </div>
                <div className="flex items-end justify-between gap-4 border-t border-margify-border pt-4">
                  <span className="text-sm font-semibold text-white">Te queda en el bolsillo</span>
                  <span className="shrink-0 text-3xl font-bold tabular-nums tracking-tight text-margify-cyan">
                    $43
                  </span>
                </div>
              </div>
              <div className="mt-8">
                <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-margify-muted">
                  En una mirada
                </p>
                <div className="flex h-4 overflow-hidden rounded-full bg-margify-border">
                  <div
                    className="flex w-[43%] items-center justify-center bg-margify-cyan"
                    title="Margen que queda"
                  />
                  <div
                    className="flex flex-1 items-center justify-center bg-gradient-to-r from-white/25 to-margify-negative/70"
                    title="Todo lo que se fue en costos"
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs text-margify-muted">
                  <span className="text-margify-cyan">43% para vos</span>
                  <span>57% en costos</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="funciones"
          className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 md:px-6 md:py-24"
        >
          <h2 className="text-center text-3xl font-bold text-white md:text-4xl">
            Todo lo que necesitás para decidir con plata de verdad
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Dashboard de rentabilidad en tiempo real",
                description:
                  "Ingresos, costos y margen en un solo lugar, actualizados para que decidas con números de hoy, no con exportaciones viejas.",
              },
              {
                title: "IA Advisor que te dice exactamente qué hacer",
                description:
                  "Te propone prioridades concretas: qué revisar, qué pausar o qué escalar, sin perderte en tablas interminables.",
              },
              {
                title: "Alertas por WhatsApp si algo falla o si algo va muy bien",
                description:
                  "Te avisamos si el margen cae, un canal se desvía o hay algo raro en las órdenes, y también cuando rindió mejor de lo esperado para que lo aproveches o lo escales.",
              },
              {
                title: "Rentabilidad real por producto/SKU",
                description:
                  "Ves qué productos te dejan ganancia de verdad y cuáles te la comen, por SKU o categoría, con todos los costos metidos.",
              },
              {
                title: "Predictor de cashflow",
                description:
                  "Proyectá entradas y salidas con lo que ya pasó y lo que tenés comprometido, para no quedarte corto entre campañas y reposición.",
              },
              {
                title: "Portal para agencias",
                description:
                  "Tu equipo o agencia entra a los mismos números que vos, con accesos acotados y sin mezclar datos entre clientes.",
              },
            ].map(({ title, description }) => (
              <Card key={title}>
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </Card>
            ))}
          </div>
        </section>

        <section
          id="planes"
          className="scroll-mt-24 border-y border-margify-border bg-margify-card py-16 md:py-24"
        >
          <LandingPricing />
        </section>
      </main>

      <footer className="border-t border-margify-border bg-margify-black py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 text-sm text-margify-muted md:flex-row md:px-6">
          <Logo size="sm" />
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/dashboard" className="transition-colors duration-margify hover:text-white">
              Producto
            </Link>
            <Link href="/auth/login" className="transition-colors duration-margify hover:text-white">
              Ingresar
            </Link>
            <Link
              href="/auth/register"
              className="transition-colors duration-margify hover:text-white"
            >
              Registro
            </Link>
          </div>
          <p>© Margify 2026</p>
        </div>
      </footer>
    </div>
  );
}
