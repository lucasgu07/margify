import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inventario — Margify",
  description:
    "Inteligencia de inventario: forecast de quiebre, stock muerto, relación ads-inventario y más.",
};

export default function InventarioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
