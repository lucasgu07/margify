export type RecommendationType = "danger" | "warning" | "opportunity";

export type AdvisorRecommendation = {
  title: string;
  problem: string;
  action: string;
  impact: string;
  type: RecommendationType;
};

export type AdvisorSource = "claude" | "fallback" | "cache";

export type AdvisorApiSuccess = {
  recommendations: AdvisorRecommendation[];
  generatedAt: string;
  dataFromDays: number;
  motivationalClose?: string;
  /** Origen de las recomendaciones: Claude, reglas locales o cache Supabase */
  source: AdvisorSource;
  /** true si ANTHROPIC_API_KEY está configurada en el servidor */
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

export const ADVISOR_DATA_DAYS = 30;
export const ADVISOR_REFRESH_MS = 6 * 60 * 60 * 1000;
