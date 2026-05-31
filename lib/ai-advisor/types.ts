import type { CustomDateBounds } from "@/lib/dashboard-filters";
import type { AdsPlatformScope, DateRangeKey } from "@/types";

export type AdvisorPage =
  | "dashboard"
  | "campanas"
  | "rentabilidad"
  | "cashflow"
  | "productos"
  | "alertas";

export type AdvisorRequestBody = {
  page: AdvisorPage;
  storeScope?: "all" | string;
  adsPlatform?: AdsPlatformScope;
  dateRange?: DateRangeKey;
  customRange?: CustomDateBounds | null;
};

export type AdvisorSource = "claude" | "rules";

export type AdvisorApiResponse = {
  insights: import("@/lib/ai-advisor-insights").AdvisorInsights;
  source: AdvisorSource;
};
