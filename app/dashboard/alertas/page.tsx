"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { buildAlertasAdvisorInsights } from "@/lib/ai-advisor-insights";
import { AIAdvisor } from "@/components/dashboard/AIAdvisor";
import { useDemoMode } from "@/components/dashboard/DemoModeContext";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/Table";
import { useDashboardIdentity } from "@/components/dashboard/DemoModeContext";
import { Header } from "@/components/ui/Header";
import { Input, Label } from "@/components/ui/Input";
import { mockAlertsHistory } from "@/lib/mock-data";
import type { AlertChannel, AlertType } from "@/types";
import { formatDate } from "@/lib/utils";

type AlertRow = {
  id: string;
  title: string;
  description: string;
  threshold: number;
  channel: AlertChannel;
  active: boolean;
  alert_type: AlertType;
};

type HistoryRow = {
  id: string;
  alert_type: string;
  message: string;
  triggered_at: string;
  read: boolean;
};

const defaults: AlertRow[] = [
  {
    id: "a1",
    alert_type: "roas_drop",
    title: "ROAS real bajo",
    description: "Se dispara cuando el ROAS real cae por debajo del umbral.",
    threshold: 1.5,
    channel: "both",
    active: true,
  },
  {
    id: "a2",
    alert_type: "margin_drop",
    title: "Margen neto bajo",
    description: "Alerta si tu margen neto promedio cae por debajo del umbral.",
    threshold: 10,
    channel: "email",
    active: true,
  },
  {
    id: "a3",
    alert_type: "cashflow_negative",
    title: "Cashflow negativo proyectado",
    description: "Si el cashflow proyectado es negativo en los próximos N días.",
    threshold: 7,
    channel: "email",
    active: true,
  },
];

export default function AlertasPage() {
  const { full_name } = useDashboardIdentity();
  const isDemo = useDemoMode();
  const advisorInsights = useMemo(() => buildAlertasAdvisorInsights(), []);
  const [rows, setRows] = useState(defaults);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [wa, setWa] = useState("");
  const [whatsappAllowed, setWhatsappAllowed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingWa, setTestingWa] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (isDemo) return;
    const res = await fetch("/api/alerts", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as {
      configs: AlertRow[];
      history: HistoryRow[];
      whatsappAllowed: boolean;
    };
    if (data.configs?.length) setRows(data.configs);
    setHistory(data.history ?? []);
    setWhatsappAllowed(Boolean(data.whatsappAllowed));
  }, [isDemo]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveAlerts() {
    if (isDemo) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configs: rows, whatsapp_number: wa }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { message?: string };
        setSaveMsg(err.message ?? "No se pudieron guardar las alertas.");
        return;
      }
      setSaveMsg("Alertas guardadas. Se evalúan cada hora automáticamente.");
      await load();
    } catch {
      setSaveMsg("Error de red al guardar.");
    } finally {
      setSaving(false);
    }
  }

  const historyCols: Column<HistoryRow>[] = [
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

  const displayHistory = isDemo ? mockAlertsHistory : history;

  return (
    <>
      <Header userName={full_name} showDateRange={false} />
      <h1 className="mb-6 text-2xl font-bold text-white">Alertas</h1>

      {saveMsg ? (
        <p className="mb-4 text-sm text-margify-cyan" role="status">
          {saveMsg}
        </p>
      ) : null}

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
                  disabled={isDemo}
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
                    disabled={isDemo}
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
                    disabled={isDemo}
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
                    <option value="whatsapp" disabled={!whatsappAllowed}>
                      WhatsApp{whatsappAllowed ? "" : " (Pro+)"}
                    </option>
                    <option value="both" disabled={!whatsappAllowed}>
                      Ambos{whatsappAllowed ? "" : " (Pro+)"}
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {!isDemo ? (
        <Button type="button" className="mt-6" disabled={saving} onClick={() => void saveAlerts()}>
          {saving ? "Guardando…" : "Guardar alertas"}
        </Button>
      ) : null}

      <Card glass className="mt-10">
        <CardTitle>WhatsApp</CardTitle>
        <CardDescription>
          Número para alertas críticas{whatsappAllowed ? "" : " (requiere plan Pro o Scale)"}.
        </CardDescription>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label>Número con código de país</Label>
            <Input
              value={wa}
              disabled={isDemo || !whatsappAllowed}
              onChange={(e) => setWa(e.target.value)}
              placeholder="+54911…"
            />
          </div>
          {whatsappAllowed && !isDemo ? (
            <Button
              type="button"
              variant="secondary"
              disabled={testingWa || !wa.trim()}
              onClick={async () => {
                setTestingWa(true);
                setSaveMsg(null);
                try {
                  const saveRes = await fetch("/api/alerts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ configs: rows, whatsapp_number: wa }),
                  });
                  if (!saveRes.ok) {
                    setSaveMsg("Guardá el número antes de probar.");
                    return;
                  }
                  const res = await fetch("/api/alerts/test-whatsapp", { method: "POST" });
                  const data = (await res.json()) as { message?: string };
                  if (!res.ok) {
                    setSaveMsg(data.message ?? "No se pudo enviar la prueba.");
                    return;
                  }
                  setSaveMsg("WhatsApp de prueba enviado. Revisá tu celular.");
                } catch {
                  setSaveMsg("Error al enviar prueba de WhatsApp.");
                } finally {
                  setTestingWa(false);
                }
              }}
            >
              {testingWa ? "Enviando…" : "Enviar prueba"}
            </Button>
          ) : null}
        </div>
      </Card>

      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-white">Historial reciente</h2>
        <DataTable columns={historyCols} data={displayHistory} pageSize={5} />
      </div>

      <div className="mt-10">
        <AIAdvisor insights={advisorInsights} />
      </div>
    </>
  );
}
