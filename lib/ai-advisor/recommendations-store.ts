import type { AdvisorRecommendation } from "@/lib/ai-advisor/recommendation-types";
import { createSupabaseAdminClient } from "@/lib/server/supabase-admin";

export type StoredRecommendationRow = {
  recommendations: AdvisorRecommendation[];
  motivational_close: string | null;
  created_at: string;
};

export async function getLatestRecommendations(
  userId: string
): Promise<StoredRecommendationRow | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;
  const { data, error } = await admin
    .from("ai_recommendations")
    .select("recommendations, motivational_close, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return {
    recommendations: data.recommendations as AdvisorRecommendation[],
    motivational_close: data.motivational_close as string | null,
    created_at: data.created_at as string,
  };
}

export async function saveRecommendations(
  userId: string,
  recommendations: AdvisorRecommendation[],
  motivationalClose?: string
): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;
  const { data, error } = await admin
    .from("ai_recommendations")
    .insert({
      user_id: userId,
      recommendations,
      motivational_close: motivationalClose ?? null,
    })
    .select("created_at")
    .single();
  if (error) return null;
  return data.created_at as string;
}
