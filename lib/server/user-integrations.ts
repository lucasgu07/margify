import { createSupabaseAdminClient } from "@/lib/server/supabase-admin";

export type IntegrationProvider =
  | "shopify"
  | "tiendanube"
  | "mercadolibre"
  | "meta"
  | "google_ads";

export async function saveUserIntegration(
  userId: string,
  provider: IntegrationProvider,
  payload: Record<string, unknown>
): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  if (!admin) return false;
  const { error } = await admin.from("user_integrations").upsert(
    {
      user_id: userId,
      provider,
      payload,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,provider" }
  );
  return !error;
}

export async function getUserIntegration(
  userId: string,
  provider: IntegrationProvider
): Promise<Record<string, unknown> | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;
  const { data, error } = await admin
    .from("user_integrations")
    .select("payload")
    .eq("user_id", userId)
    .eq("provider", provider)
    .maybeSingle();
  if (error || !data?.payload) return null;
  return data.payload as Record<string, unknown>;
}

export async function deleteUserIntegration(
  userId: string,
  provider: IntegrationProvider
): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  if (!admin) return false;
  const { error } = await admin
    .from("user_integrations")
    .delete()
    .eq("user_id", userId)
    .eq("provider", provider);
  return !error;
}

export async function listUserIdsWithIntegrations(): Promise<string[]> {
  const admin = createSupabaseAdminClient();
  if (!admin) return [];
  const { data, error } = await admin.from("user_integrations").select("user_id");
  if (error || !data) return [];
  return Array.from(new Set(data.map((r) => r.user_id as string)));
}
