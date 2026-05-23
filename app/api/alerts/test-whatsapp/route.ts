import { NextResponse } from "next/server";
import { canUseWhatsAppAlerts } from "@/lib/plan-features";
import { getAuthUser } from "@/lib/server/auth-user";
import { sendAlertWhatsApp } from "@/lib/server/whatsapp-cloud";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/alerts/test-whatsapp
 * Envía un WhatsApp de prueba al número guardado en el perfil (plan Pro+).
 */
export async function POST() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!canUseWhatsAppAlerts(user.plan)) {
    return NextResponse.json(
      { error: "whatsapp_requires_pro", message: "WhatsApp requiere plan Pro o Scale." },
      { status: 403 }
    );
  }

  const supabase = createServerSupabaseClient();
  const { data: authData } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const meta = authData?.user?.user_metadata as { whatsapp_number?: string } | undefined;
  const phone = meta?.whatsapp_number?.trim();
  if (!phone) {
    return NextResponse.json(
      { error: "no_phone", message: "Guardá tu número en Alertas primero." },
      { status: 400 }
    );
  }

  const ok = await sendAlertWhatsApp(phone, {
    title: "Prueba de Margify",
    message: "Si recibiste esto, las alertas por WhatsApp están bien configuradas.",
  });

  if (!ok) {
    return NextResponse.json(
      {
        error: "send_failed",
        message:
          "No se pudo enviar. Revisá WHATSAPP_API_TOKEN, WHATSAPP_PHONE_NUMBER_ID y la plantilla margify_alert en Meta.",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
