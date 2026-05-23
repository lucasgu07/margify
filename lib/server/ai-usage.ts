import { aiMonthlyLimit } from "@/lib/plan-features";
import { createSupabaseAdminClient } from "@/lib/server/supabase-admin";
import type { Plan } from "@/types";

function monthKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export type AiUsageStatus = {
  used: number;
  limit: number | null;
  remaining: number | null;
  allowed: boolean;
};

export async function getAiUsageStatus(userId: string, plan: Plan): Promise<AiUsageStatus> {
  const limit = aiMonthlyLimit(plan);
  if (limit === 0) {
    return { used: 0, limit: 0, remaining: 0, allowed: false };
  }
  if (limit === null) {
    return { used: 0, limit: null, remaining: null, allowed: true };
  }

  const admin = createSupabaseAdminClient();
  let used = 0;
  if (admin) {
    const { data } = await admin
      .from("ai_usage")
      .select("query_count")
      .eq("user_id", userId)
      .eq("month_key", monthKey())
      .maybeSingle();
    used = data?.query_count ?? 0;
  }

  const remaining = Math.max(0, limit - used);
  return {
    used,
    limit,
    remaining,
    allowed: remaining > 0,
  };
}

export async function incrementAiUsage(userId: string): Promise<void> {
  const admin = createSupabaseAdminClient();
  if (!admin) return;
  const key = monthKey();
  const { data } = await admin
    .from("ai_usage")
    .select("query_count")
    .eq("user_id", userId)
    .eq("month_key", key)
    .maybeSingle();

  const next = (data?.query_count ?? 0) + 1;
  await admin.from("ai_usage").upsert(
    { user_id: userId, month_key: key, query_count: next },
    { onConflict: "user_id,month_key" }
  );
}
