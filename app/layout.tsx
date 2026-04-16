import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { WhatsAppFloatButton } from "@/components/landing/WhatsAppFloatButton";
import { getWhatsAppChatUrl } from "@/lib/whatsapp";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Margify — Ganancia real para tu e-commerce",
  description:
    "Dashboard de rentabilidad para tiendas en LATAM. Unificá ventas, costos y ads. IA y alertas por WhatsApp.",
  icons: {
    icon: [
      { url: "/margify-logo.png", type: "image/png", sizes: "512x512" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/margify-logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const whatsappUrl = getWhatsAppChatUrl();

  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans">
        {children}
        {whatsappUrl ? <WhatsAppFloatButton href={whatsappUrl} /> : null}
      </body>
    </html>
  );
}
