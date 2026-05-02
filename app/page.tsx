import Link from "next/link";
import type { SimpleIcon } from "simple-icons";
import { siGmail, siInstagram, siX } from "simple-icons";
import { LayoutDashboard, Link2, Receipt, Sparkles } from "lucide-react";
import { buttonClassName } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { Badge } from "@/components/ui/Badge";
import { LandingPricing } from "@/components/landing/LandingPricing";
import { LandingMainAmbient } from "@/components/landing/LandingMainAmbient";
import { LandingParticleBackground } from "@/components/landing/LandingParticleBackground";
import { LandingFaq } from "@/components/landing/LandingFaq";
import { LandingTestimonials } from "@/components/landing/LandingTestimonials";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingHeroCampaignsPreview } from "@/components/landing/LandingHeroCampaignsPreview";
import { LandingHeroDashboardPreview } from "@/components/landing/LandingHeroDashboardPreview";
import { LandingIntegrationsShowcase } from "@/components/landing/LandingIntegrationsShowcase";
import {
  landingGlassBadge,
  landingGlassBodyText,
  landingGlassPanel,
  landingGlassPanelHover,
} from "@/lib/landing-glass-styles";
import { cn } from "@/lib/utils";

/** Reemplazá por tu perfil de Instagram, X y el correo de contacto cuando estén listos. */
const LANDING_FOOTER_INSTAGRAM = "https://www.instagram.com/";
const LANDING_FOOTER_X = "https://x.com/";
const LANDING_FOOTER_MAIL = "mailto:hola@margify.com";

function FooterSocialLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: SimpleIcon;
  label: string;
}) {
  const isHttp = href.startsWith("http");
  return (
    <a
      href={href}
      {...(isHttp ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="inline-flex rounded-md p-1.5 text-neutral-400 transition-colors duration-margify hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-margify-accent"
      aria-label={label}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="currentColor" aria-hidden>
        <path d={icon.path} />
      </svg>
    </a>
  );
}

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

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-margify-bg text-margify-text">
      <LandingParticleBackground />
      <div className="relative z-[1]">
        <LandingMainAmbient />
        <LandingHeader />

        <main className="relative z-10 overflow-x-hidden bg-transparent">
          <section id="inicio" className="relative z-10 scroll-mt-32">
            <div className="mx-auto max-w-6xl px-4 pt-14 pb-6 md:px-6 md:pt-20 md:pb-8 lg:max-w-7xl lg:pt-24 lg:pb-8">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-center lg:gap-x-10 lg:gap-y-0 xl:gap-x-14">
                <div className="flex min-w-0 flex-col gap-5 lg:max-w-xl xl:max-w-lg">
                  <div className="mb-1 flex flex-wrap gap-2">
                    <Badge type="neutral" label="Rentabilidad real + campañas + IA" className={cn(landingGlassBadge, "w-fit")} />
                    <Badge
                      type="neutral"
                      label="+704 tiendas ya mejoraron su margen con Margify"
                      className={cn(landingGlassBadge, "w-fit")}
                    />
                  </div>
                  <h1 className="text-3xl font-bold leading-[1.15] tracking-tight text-white sm:text-4xl lg:text-[2.35rem] lg:leading-tight xl:text-5xl">
                    Sabé si ganás o perdés: ventas, ads, costos e IA en un solo panel
                  </h1>
                  <p className="text-base leading-relaxed text-neutral-400 md:text-lg">
                    Margify integra TiendaNube, Shopify o Mercado Libre con Meta, TikTok y Google Ads:
                    ganancia neta y margen por producto, ROAS real, tablas de campañas con Margify AI,
                    alertas por WhatsApp y cashflow proyectado. Todo al día, sin Excel ni datos sueltos.
                  </p>
                  <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Link
                      href="/auth/register"
                      className={buttonClassName("primary", "w-full px-7 py-3 sm:w-auto")}
                    >
                      Empezar gratis
                    </Link>
                  </div>
                </div>

                <div className="relative min-h-0 min-w-0">
                  <LandingHeroDashboardPreview />
                </div>
              </div>
            </div>
            <LandingIntegrationsShowcase />
          </section>

          <section
            id="como-funciona"
            className="relative z-10 scroll-mt-32 py-14 md:py-20"
            aria-labelledby="how-it-works-heading"
          >
            <div className="mx-auto max-w-6xl px-4 md:px-6">
              <div className="mx-auto max-w-2xl text-center">
                <Badge type="neutral" label="Cómo funciona" className={cn("mb-4", landingGlassBadge)} />
                <h2
                  id="how-it-works-heading"
                  className="text-3xl font-bold tracking-tight text-white md:text-4xl"
                >
                  Cuatro pasos para ver tu negocio con claridad
                </h2>
                <p className="mt-4 text-neutral-400 md:text-lg">
                  Sin complicaciones: conectás, cargás costos, mirás el panel y reaccionás cuando hace falta.
                </p>
              </div>
              <ol className="mt-12 grid list-none grid-cols-2 gap-4 p-0 sm:gap-6 lg:grid-cols-4 lg:gap-8">
                {howItWorksSteps.map(({ step, title, description, Icon }) => (
                  <li key={step}>
                    <Card
                      className={cn(
                        "relative h-full pt-8 max-md:p-4 max-md:pt-7",
                        landingGlassPanel,
                        landingGlassPanelHover
                      )}
                    >
                      <div className="absolute left-4 top-0 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/18 bg-black/55 text-xs font-bold text-margify-cyan backdrop-blur-md sm:left-6 sm:h-10 sm:w-10 sm:text-sm">
                        {step}
                      </div>
                      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-control border border-white/12 bg-white/[0.08] text-margify-cyan backdrop-blur-sm sm:mb-4 sm:h-11 sm:w-11">
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
                      </div>
                      <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
                      <CardDescription
                        className={cn("mt-2 text-xs leading-relaxed sm:text-sm", landingGlassBodyText)}
                      >
                        {description}
                      </CardDescription>
                    </Card>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section
            id="dentro-de-margify"
            className="relative z-10 scroll-mt-32 py-16 md:py-24"
            aria-labelledby="campaigns-ai-heading"
          >
            <div className="mx-auto max-w-6xl px-4 md:px-6">
              <div className="mx-auto max-w-3xl text-center">
                <h2
                  id="campaigns-ai-heading"
                  className="text-3xl font-bold tracking-tight text-white md:text-4xl"
                >
                  Campañas y Margify AI en el mismo lugar
                </h2>
                <p className="mt-4 text-pretty text-neutral-400 md:text-lg">
                  Armá la vista con{" "}
                  <span className="font-medium text-margify-text">las métricas y columnas que quieras seguir</span>: vos
                  elegís qué mirar en cada campaña y canal. Debajo,{" "}
                  <span className="font-medium text-margify-text">Margify AI</span> no solo te marca riesgos y cosas a
                  revisar: también te dice cuando algo va bien, para que puedas potenciarlo o escalar con criterio.
                </p>
              </div>
              <div className="mx-auto mt-10 max-w-4xl lg:mt-14">
                <LandingHeroCampaignsPreview />
              </div>
            </div>
          </section>

          <section id="funciones" className="relative z-10 scroll-mt-32 py-16 md:py-24">
            <div className="mx-auto max-w-6xl px-4 md:px-6">
              <h2 className="text-center text-3xl font-bold text-white md:text-4xl">
                Todo lo que necesitás para decidir con dinero de verdad
              </h2>
              <div className="mt-12 grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-3">
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
                  <Card
                    key={title}
                    className={cn("max-md:p-4", landingGlassPanel, landingGlassPanelHover)}
                  >
                    <CardTitle className="text-sm md:text-base">{title}</CardTitle>
                    <CardDescription className={cn("max-md:text-xs", landingGlassBodyText)}>
                      {description}
                    </CardDescription>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          <LandingTestimonials />

          <section id="planes" className="relative z-10 scroll-mt-32 py-16 md:py-24">
            <LandingPricing />
          </section>

          <section
            id="faq"
            className="relative z-10 scroll-mt-32 py-16 md:py-24"
            aria-labelledby="faq-heading"
          >
            <LandingFaq />
          </section>
        </main>

        <footer className="relative z-10 bg-transparent pb-10 pt-6 md:pb-12 md:pt-8">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 text-sm text-neutral-400 md:flex-row md:px-6">
            <Logo size="sm" />
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/dashboard?demo=1" className="transition-colors duration-margify hover:text-white text-neutral-300">
                Producto
              </Link>
              <Link href="/auth/login" className="transition-colors duration-margify hover:text-white text-neutral-300">
                Ingresar
              </Link>
              <Link
                href="/auth/register"
                className="transition-colors duration-margify hover:text-white text-neutral-300"
              >
                Registro
              </Link>
            </div>
            <nav
              className="flex items-center justify-center gap-1 sm:gap-2"
              aria-label="Redes sociales y contacto"
            >
              <FooterSocialLink
                href={LANDING_FOOTER_INSTAGRAM}
                icon={siInstagram}
                label="Instagram de Margify"
              />
              <FooterSocialLink href={LANDING_FOOTER_X} icon={siX} label="X de Margify" />
              <FooterSocialLink
                href={LANDING_FOOTER_MAIL}
                icon={siGmail}
                label="Correo electrónico"
              />
            </nav>
            <p className="text-neutral-400">© Margify 2026</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
