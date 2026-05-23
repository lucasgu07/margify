import { NextResponse } from "next/server";
import { canUseWhatsAppAlerts } from "@/lib/plan-features";
import { getAuthUser } from "@/lib/server/auth-user";
import {
  listAlertConfigs,
  listAlertHistory,
  replaceAlertConfigs,
} from "@/lib/server/user-alerts";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AlertChannel, AlertType } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AlertPayload = {
  id: string;
  title: string;
  description: string;
  threshold: number;
  channel: AlertChannel;
  active: boolean;
  alert_type: AlertType;
};

function defaultConfigs(): AlertPayload[] {
  return [
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
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let configs = await listAlertConfigs(user.id);
  if (!configs.length) {
    configs = defaultConfigs().map((c) => ({ ...c, user_id: user.id }));
  }
  const history = await listAlertHistory(user.id);

  return NextResponse.json({
    configs: configs.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      threshold: c.threshold,
      channel: c.channel,
      active: c.active,
      alert_type: c.alert_type,
    })),
    history: history.map((h) => ({
      id: h.id,
      alert_type: h.alert_type,
      message: h.message,
      triggered_at: h.triggered_at,
      read: h.read,
      channel: h.channel,
    })),
    whatsappAllowed: canUseWhatsAppAlerts(user.plan),
  });
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: {
    configs?: AlertPayload[];
    whatsapp_number?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const configs = body.configs ?? [];
  for (const c of configs) {
    if (
      (c.channel === "whatsapp" || c.channel === "both") &&
      !canUseWhatsAppAlerts(user.plan)
    ) {
      return NextResponse.json(
        { error: "whatsapp_requires_pro", message: "WhatsApp requiere plan Pro o Scale." },
        { status: 403 }
      );
    }
  }

  const ok = await replaceAlertConfigs(
    user.id,
    configs.map((c) => ({
      id: c.id,
      alert_type: c.alert_type,
      title: c.title,
      description: c.description,
      threshold: c.threshold,
      channel: c.channel,
      active: c.active,
    }))
  );

  if (body.whatsapp_number !== undefined) {
    const supabase = createServerSupabaseClient();
    if (supabase) {
      await supabase.auth.updateUser({
        data: { whatsapp_number: body.whatsapp_number.trim() },
      });
    }
  }

  if (!ok) {
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
