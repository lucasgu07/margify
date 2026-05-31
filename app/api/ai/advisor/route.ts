import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateClaudeAdvisorInsights } from "@/lib/ai-advisor/generate-claude";
import {
  loadAdvisorDataDemo,
  loadAdvisorDataForUser,
} from "@/lib/ai-advisor/server-data";
import type { AdvisorPage, AdvisorRequestBody } from "@/lib/ai-advisor/types";
import { canUseMargifyAI } from "@/lib/plan-features";
import { getAuthUser } from "@/lib/server/auth-user";
import { DEMO_COOKIE, isDemoCookieActive } from "@/lib/demo-cookie";
import type { AdsPlatformScope, DateRangeKey } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_PAGES: AdvisorPage[] = [
  "dashboard",
  "campanas",
  "rentabilidad",
  "cashflow",
  "productos",
  "alertas",
];

const VALID_RANGES: DateRangeKey[] = [
  "today",
  "week",
  "month",
  "30d",
  "6m",
  "1y",
  "year",
  "custom",
];

function parseBody(raw: unknown): AdvisorRequestBody {
  if (!raw || typeof raw !== "object") throw new Error("invalid_body");
  const b = raw as Record<string, unknown>;
  const page = b.page;
  if (typeof page !== "string" || !VALID_PAGES.includes(page as AdvisorPage)) {
    throw new Error("invalid_page");
  }

  const storeScope =
    b.storeScope === "all" || (typeof b.storeScope === "string" && b.storeScope)
      ? (b.storeScope as "all" | string)
      : "all";

  let adsPlatform: AdsPlatformScope | undefined;
  if (typeof b.adsPlatform === "string") {
    adsPlatform = b.adsPlatform as AdsPlatformScope;
  }

  let dateRange: DateRangeKey | undefined;
  if (typeof b.dateRange === "string" && VALID_RANGES.includes(b.dateRange as DateRangeKey)) {
    dateRange = b.dateRange as DateRangeKey;
  }

  let customRange: AdvisorRequestBody["customRange"];
  if (b.customRange && typeof b.customRange === "object") {
    const cr = b.customRange as { fromStr?: unknown; toStr?: unknown };
    if (typeof cr.fromStr === "string" && typeof cr.toStr === "string") {
      customRange = { fromStr: cr.fromStr, toStr: cr.toStr };
    }
  }

  return { page: page as AdvisorPage, storeScope, adsPlatform, dateRange, customRange };
}

export async function POST(req: Request) {
  let body: AdvisorRequestBody;
  try {
    body = parseBody(await req.json());
  } catch (e) {
    const msg = e instanceof Error ? e.message : "invalid_request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const cookieStore = cookies();
  const demoActive = isDemoCookieActive(cookieStore.get(DEMO_COOKIE)?.value);
  const authUser = await getAuthUser();

  if (demoActive && !authUser) {
    const demo = loadAdvisorDataDemo(body);
    return NextResponse.json({ insights: demo.ruleInsights, source: "rules" });
  }

  if (!authUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const bundle = await loadAdvisorDataForUser(authUser.id, authUser.plan, body);

  if (!canUseMargifyAI(authUser.plan) || !process.env.ANTHROPIC_API_KEY?.trim()) {
    return NextResponse.json({ insights: bundle.ruleInsights, source: "rules" });
  }

  try {
    const insights = await generateClaudeAdvisorInsights(
      body.page,
      bundle.orders,
      bundle.campaigns,
      { alertHistory: bundle.alertHistory }
    );
    return NextResponse.json({ insights, source: "claude" });
  } catch {
    return NextResponse.json({ insights: bundle.ruleInsights, source: "rules" });
  }
}
