import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Plan } from "@/types";

export type AuthUser = {
  id: string;
  email: string;
  full_name: string;
  plan: Plan;
};

function mapPlan(raw: unknown): Plan {
  if (raw === "free") return "starter";
  if (raw === "pro" || raw === "growth") return "growth";
  if (raw === "scale") return "scale";
  if (raw === "agency") return "agency";
  return "starter";
}

/** Usuario autenticado vía Supabase (null si no hay sesión o Supabase no configurado). */
export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const u = data.user;
  const meta = u.user_metadata as {
    full_name?: string;
    selected_plan?: string;
  } | undefined;
  const fromMeta =
    typeof meta?.full_name === "string" && meta.full_name.trim()
      ? meta.full_name.trim()
      : null;
  return {
    id: u.id,
    email: u.email ?? "",
    full_name: fromMeta ?? u.email?.split("@")[0] ?? "Usuario",
    plan: mapPlan(meta?.selected_plan),
  };
}
