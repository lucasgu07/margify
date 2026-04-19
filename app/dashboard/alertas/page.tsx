"use client";

import { useMemo, useState } from "react";
import { buildAlertasAdvisorInsights } from "@/lib/ai-advisor-insights";
import { AIAdvisor } from "@/components/dashboard/AIAdvisor";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/Table";
import { useDashboardIdentity } from "@/components/dashboard/DemoModeContext";
import { Header } from "@/components/ui/Header";
import { Input, Label } from "@/components/ui/Input";
import { mockAlertsHistory } from "@/lib/mock-data";
import type { AlertChannel } from "@/types";
import { formatDate } from "@/lib/utils";

type AlertRow = {
  id: string;
  title: string;
  description: string;
  threshold: number;
  channel: AlertChannel;
  active: boolean;
};

const defaults: AlertRow[] = [
  {
    id: "a1",
    title: "ROAS real bajo",
    description: "Se dispara cuando el ROAS real cae por debajo del umbral.",
    threshold: 1.5,
    channel: "both",
    active: true,
  },
  {
    id: "a2",
    title: "Margen neto bajo",
    description: "Alerta si tu margen neto promedio cae por debajo del umbral.",
    threshold: 10,
    channel: "whatsapp",
    active: true,
  },
  {
    id: "a3",
    title: "Cashflow negativo proyectado",
    description: "Si el cashflow proyectado es negativo en los próximos N días.",
    threshold: 7,
    channel: "both",
    active: true,
  },
  {
    id: "a4",
    title: "Campaña sin conversiones",
    description: "Campaña con gasto activo y sin conversiones verificadas por más de N días.",
    threshold: 3,
    channel: "email",
    active: true,
  },
  {
    id: "a5",
    title: "Producto vendido sin ganancia",
    description: "Detecta ventas con margen ≤ 0 en ventana móvil.",
    threshold: 0,
    channel: "both",
    active: true,
  },
  {
    id: "a6",
    title: "Resumen semanal de rentabilidad",
    description: "Envío programado con KPIs clave de la semana.",
    threshold: 1,
    channel: "email",
    active: true,
  },
];

export default function AlertasPage() {
  const { full_name } = useDashboardIdentity();
  const advisorInsights = useMemo(() => buildAlertasAdvisorInsights(), []);
  const [rows, setRows] = useState(defaults);
  const [wa, setWa] = useState("+5491122334455");
  const [waConnected, setWaConnected] = useState(false);

  const historyCols: Column<(typeof mockAlertsHistory)[number]>[] = [
    {
      key: "triggered_at",
      header: "Fecha",
      sortable: true,
      accessor: (r) => r.triggered_at,
      render: (r) => formatDate(r.triggered_at, "short"),
    },
    { key: "alert_type", header: "Tipo", sortable: true },
    { key: "message", header: "Mensaje", sortable: false },
    {
      key: "read",
      header: "Leída",
      render: (r) => (r.read ? "Sí" : "No"),
    },
  ];

  return (
    <>
      <Header userName={full_name} showDateRange={false} />
      <h1 className="mb-6 text-2xl font-bold text-white">Alertas</h1>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-1 md:gap-4">
        {rows.map((r) => (
          <Card
            key={r.id}
            className="flex flex-col gap-4 max-md:gap-2 max-md:p-3 md:flex-row md:items-center md:justify-between"
          >
            <div className="flex flex-1 flex-col gap-3 max-md:gap-2 md:flex-row md:items-center">
              <label className="inline-flex cursor-pointer items-start gap-2 max-md:flex-col max-md:gap-2 md:items-center md:gap-3">
                <input
                  type="checkbox"
                  checked={r.active}
                  onChange={(e) =>
                    setRows((x) =>
                      x.map((row) => (row.id === r.id ? { ...row, active: e.target.checked } : row))
                    )
                  }
                  className="mt-0.5 h-5 w-5 shrink-0 rounded border-margify-border bg-margify-cardAlt accent-margify-cyan"
                />
                <div className="min-w-0">
                  <p className="font-semibold leading-snug text-white max-md:text-sm">{r.title}</p>
                  <p className="text-sm leading-snug text-margify-muted max-md:line-clamp-3 max-md:text-[0.7rem]">
                    {r.description}
                  </p>
                </div>
              </label>
              <div className="flex flex-wrap gap-3 max-md:w-full max-md:flex-col max-md:gap-2 md:ml-auto">
                <div className="max-md:w-full">
                  <Label className="text-xs">Umbral</Label>
                  <Input
                    className="w-28 max-md:w-full"
                    type="number"
                    step={0.1}
                    value={r.threshold}
                    onChange={(e) =>
                      setRows((x) =>
                        x.map((row) =>
                          row.id === r.id ? { ...row, threshold: Number(e.target.value) } : row
                        )
                      )
                    }
                  />
                </div>
                <div className="max-md:w-full">
                  <Label className="text-xs">Canal</Label>
                  <select
                    className="mt-1.5 w-40 max-md:w-full rounded-control border border-margify-border bg-margify-cardAlt px-2 py-2 text-sm text-white"
                    value={r.channel}
                    onChange={(e) =>
                      setRows((x) =>
                        x.map((row) =>
                          row.id === r.id
                            ? { ...row, channel: e.target.value as AlertChannel }
                            : row
                        )
                      )
                    }
                  >
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="both">Ambos</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-10">
        <CardTitle>WhatsApp</CardTitle>
        <CardDescription>Conectá tu número para recibir alertas críticas al toque.</CardDescription>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label>Número con código de país</Label>
            <Input value={wa} onChange={(e) => setWa(e.target.value)} placeholder="+54…" />
          </div>
          <Button type="button" onClick={() => setWaConnected(true)}>
            Verificar número
          </Button>
        </div>
        <p className="mt-3 text-sm text-margify-muted">
          Estado:{" "}
          <span className={waConnected ? "text-margify-cyan" : "text-margify-negative"}>
            {waConnected ? "Conectado" : "No conectado"}
          </span>
        </p>
      </Card>

      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-white">Historial reciente</h2>
        <DataTable columns={historyCols} data={mockAlertsHistory} pageSize={5} />
      </div>

      <div className="mt-10">
        <AIAdvisor insights={advisorInsights} />
      </div>
    </>
  );
}
