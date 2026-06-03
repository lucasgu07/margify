import type {
  AdvisorDecision,
  AdvisorRecommendation,
  AdvisorWeeklyReview,
} from "@/lib/ai-advisor/recommendation-types";
import { createSupabaseAdminClient } from "@/lib/server/supabase-admin";

// ─── Recommendation rows ──────────────────────────────────────────────────────

export type StoredRecommendationRow = {
  recommendations: AdvisorRecommendation[];
  motivational_close: string | null;
  weekly_review: AdvisorWeeklyReview | null;
  created_at: string;
};

export async function getLatestRecommendations(
  userId: string
): Promise<StoredRecommendationRow | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;
  const { data, error } = await admin
    .from("ai_recommendations")
    .select("recommendations, motivational_close, weekly_review, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return {
    recommendations: data.recommendations as AdvisorRecommendation[],
    motivational_close: data.motivational_close as string | null,
    weekly_review: (data.weekly_review as AdvisorWeeklyReview | null) ?? null,
    created_at: data.created_at as string,
  };
}

export async function saveRecommendations(
  userId: string,
  recommendations: AdvisorRecommendation[],
  motivationalClose?: string,
  weeklyReview?: AdvisorWeeklyReview
): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;
  const { data, error } = await admin
    .from("ai_recommendations")
    .insert({
      user_id: userId,
      recommendations,
      motivational_close: motivationalClose ?? null,
      weekly_review: weeklyReview ?? null,
    })
    .select("created_at")
    .single();
  if (error) return null;
  return data.created_at as string;
}

// ─── Decision tracking (AI memory) ───────────────────────────────────────────

export async function saveDecision(
  userId: string,
  decision: Omit<AdvisorDecision, "id">
): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  if (!admin) return false;
  const { error } = await admin.from("ai_advisor_decisions").insert({
    user_id: userId,
    recommendation_title: decision.recommendationTitle,
    recommendation_category: decision.recommendationCategory ?? null,
    decision: decision.decision,
    decided_at: decision.decidedAt,
  });
  return !error;
}

export async function getRecentDecisions(
  userId: string,
  limit = 50
): Promise<AdvisorDecision[]> {
  const admin = createSupabaseAdminClient();
  if (!admin) return [];
  const { data, error } = await admin
    .from("ai_advisor_decisions")
    .select("id, recommendation_title, recommendation_category, decision, decided_at")
    .eq("user_id", userId)
    .order("decided_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id as string,
    recommendationTitle: row.recommendation_title as string,
    recommendationCategory: row.recommendation_category as AdvisorDecision["recommendationCategory"],
    decision: row.decision as AdvisorDecision["decision"],
    decidedAt: row.decided_at as string,
  }));
}

// ─── Weekly review ────────────────────────────────────────────────────────────

export async function getLatestWeeklyReview(
  userId: string
): Promise<AdvisorWeeklyReview | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;

  // First check the new dedicated table
  const { data: weeklyData, error: weeklyError } = await admin
    .from("ai_advisor_weekly")
    .select("review, generated_at")
    .eq("user_id", userId)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!weeklyError && weeklyData) {
    const review = weeklyData.review as AdvisorWeeklyReview;
    return { ...review, generatedAt: weeklyData.generated_at as string };
  }

  // Fallback to weekly_review embedded in latest recommendation row
  const latest = await getLatestRecommendations(userId);
  return latest?.weekly_review ?? null;
}

export async function saveWeeklyReview(
  userId: string,
  review: AdvisorWeeklyReview
): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  if (!admin) return false;
  const { error } = await admin.from("ai_advisor_weekly").insert({
    user_id: userId,
    review,
    generated_at: review.generatedAt,
  });
  return !error;
}
