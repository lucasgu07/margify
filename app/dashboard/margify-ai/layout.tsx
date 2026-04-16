import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Margify AI",
  description:
    "Asistente de IA para optimizar anuncios, interpretar métricas y tomar mejores decisiones de marketing.",
};

export default function MargifyAILayout({ children }: { children: React.ReactNode }) {
  return children;
}
