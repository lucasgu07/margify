import type { AlertChannel, AlertType } from "@/types";
import { createSupabaseAdminClient } from "@/lib/server/supabase-admin";
import { sendAlertWhatsApp, type WhatsAppAlertPayload } from "@/lib/server/whatsapp-cloud";

export type { WhatsAppAlertPayload };
export { sendAlertWhatsApp };

export type AlertConfigRow = {
  id: string;
  user_id: string;
  alert_type: AlertType;
  title: string;
  description: string;
  threshold: number;
  channel: AlertChannel;
  active: boolean;
};

export type AlertHistoryRow = {
  id: string;
  user_id: string;
  alert_type: AlertType;
  message: string;
  channel: string;
  triggered_at: string;
  read: boolean;
};

export async function listAlertConfigs(userId: string): Promise<AlertConfigRow[]> {
  const admin = createSupabaseAdminClient();
  if (!admin) return [];
  const { data, error } = await admin
    .from("user_alerts_config")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data as AlertConfigRow[];
}

export async function replaceAlertConfigs(
  userId: string,
  configs: Omit<AlertConfigRow, "user_id">[]
): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  if (!admin) return false;
  await admin.from("user_alerts_config").delete().eq("user_id", userId);
  if (!configs.length) return true;
  const rows = configs.map((c) => ({
    id: c.id,
    user_id: userId,
    alert_type: c.alert_type,
    title: c.title,
    description: c.description,
    threshold: c.threshold,
    channel: c.channel,
    active: c.active,
  }));
  const { error } = await admin.from("user_alerts_config").insert(rows);
  return !error;
}

export async function listAlertHistory(userId: string, limit = 50): Promise<AlertHistoryRow[]> {
  const admin = createSupabaseAdminClient();
  if (!admin) return [];
  const { data, error } = await admin
    .from("user_alerts_history")
    .select("*")
    .eq("user_id", userId)
    .order("triggered_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as AlertHistoryRow[];
}

export async function insertAlertHistory(
  userId: string,
  alertType: AlertType,
  message: string,
  channel: string
): Promise<void> {
  const admin = createSupabaseAdminClient();
  if (!admin) return;
  await admin.from("user_alerts_history").insert({
    user_id: userId,
    alert_type: alertType,
    message,
    channel,
    read: false,
  });
}

export async function sendAlertEmail(to: string, subject: string, body: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim() || "Margify <alertas@margify.app>";
  if (!key) {
    console.warn("[alerts] RESEND_API_KEY missing, skip email to", to);
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, text: body }),
  });
  return res.ok;
}
