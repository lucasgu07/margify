import { createSupabaseAdminClient } from "@/lib/server/supabase-admin";
import type { AlertType } from "@/types";

export async function wasAlertRecentlySent(
  userId: string,
  alertType: AlertType,
  hours = 24
): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  if (!admin) return false;
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const { data } = await admin
    .from("user_alerts_history")
    .select("id")
    .eq("user_id", userId)
    .eq("alert_type", alertType)
    .gte("triggered_at", since)
    .limit(1);
  return (data?.length ?? 0) > 0;
}
