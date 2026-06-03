// ─── Core recommendation types ──────────────────────────────────────────────

export type RecommendationType = "danger" | "warning" | "opportunity";

export type RecommendationCategory =
  | "Ads"
  | "Profitability"
  | "Inventory"
  | "Retention"
  | "CashFlow"
  | "Scaling"
  | "Risk";

export type RecommendationUrgency = "high" | "medium" | "low";

export type AdvisorRecommendation = {
  /** Client-side stable key; may be absent in cached recs. */
  id?: string;
  title: string;
  problem: string;
  action: string;
  impact: string;
  type: RecommendationType;
  // ── Enhanced fields (Claude-generated; optional for backward-compat) ──────
  /** Business domain of the recommendation. */
  category?: RecommendationCategory;
  /** Model confidence 0–100. */
  confidence?: number;
  /** How time-sensitive this action is. */
  urgency?: RecommendationUrgency;
  /**
   * Positive = money gained/saved per month if action is taken.
   * Negative = money lost per month if action is ignored.
   */
  estimatedImpactUsd?: number;
  /** Specific data points the AI used. Displayed in explainability panel. */
  dataPoints?: string[];
};

// ─── Weekly review ───────────────────────────────────────────────────────────

export type AdvisorWeeklyReview = {
  /** What improved vs last week. */
  improved: string[];
  /** What worsened vs last week. */
  worsened: string[];
  /** Total estimated wasted ad spend this week (USD). */
  wastedSpendUsd: number;
  /** Single biggest opportunity sentence. */
  topOpportunity: string;
  /** Margin change in percentage points vs prior period. */
  marginEvolutionPp: number;
  /** 2–3 recommended actions for the week ahead. */
  recommendedActions: string[];
  generatedAt: string;
};

// ─── Decision tracking (AI memory) ───────────────────────────────────────────

export type DecisionType = "applied" | "dismissed";

export type AdvisorDecision = {
  id?: string;
  recommendationTitle: string;
  recommendationCategory?: RecommendationCategory;
  decision: DecisionType;
  decidedAt: string;
};

// ─── API response types ───────────────────────────────────────────────────────

export type AdvisorSource = "claude" | "fallback" | "cache";

export type AdvisorApiSuccess = {
  recommendations: AdvisorRecommendation[];
  generatedAt: string;
  dataFromDays: number;
  motivationalClose?: string;
  weeklyReview?: AdvisorWeeklyReview;
  source: AdvisorSource;
  claudeConfigured: boolean;
};

export type AdvisorApiEmpty = {
  status: "no_store";
  message: string;
};

export type AdvisorApiInsufficient = {
  status: "insufficient_data";
  orderCount: number;
  message: string;
};

export type AdvisorApiError = {
  status: "error";
  message: string;
};

export type AdvisorApiResponse =
  | AdvisorApiSuccess
  | AdvisorApiEmpty
  | AdvisorApiInsufficient
  | AdvisorApiError;

// ─── Constants ────────────────────────────────────────────────────────────────

export const ADVISOR_DATA_DAYS = 30;
export const ADVISOR_REFRESH_MS = 6 * 60 * 60 * 1000;
export const ADVISOR_MAX_RECS = 7;

export const CATEGORY_LABELS: Record<RecommendationCategory, string> = {
  Ads: "Ads",
  Profitability: "Rentabilidad",
  Inventory: "Inventario",
  Retention: "Retención",
  CashFlow: "Cashflow",
  Scaling: "Escalar",
  Risk: "Riesgo",
};

export const URGENCY_LABELS: Record<RecommendationUrgency, string> = {
  high: "Urgente",
  medium: "Esta semana",
  low: "Cuando puedas",
};
