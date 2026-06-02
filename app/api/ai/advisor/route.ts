import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getLatestRecommendations } from "@/lib/ai-advisor/recommendations-store";
import {
  ADVISOR_DATA_DAYS,
  type AdvisorApiResponse,
  type AdvisorApiSuccess,
} from "@/lib/ai-advisor/recommendation-types";
import { runAdvisorDemo, runAdvisorForUser, shouldRefreshClient } from "@/lib/ai-advisor/run-advisor";
import { getAuthUser } from "@/lib/server/auth-user";
import { DEMO_COOKIE, isDemoCookieActive } from "@/lib/demo-cookie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function successPayload(data: AdvisorApiSuccess, stale = false) {
  return NextResponse.json({ ...data, stale });
}

export async function GET(request: Request) {
  const cookieStore = cookies();
  const demoActive = isDemoCookieActive(cookieStore.get(DEMO_COOKIE)?.value);
  const authUser = await getAuthUser();
  const url = new URL(request.url);
  const force = url.searchParams.get("refresh") === "true";

  if (demoActive && !authUser) {
    const demo = await runAdvisorDemo();
    return successPayload(demo, false);
  }

  if (!authUser) {
    return NextResponse.json({ status: "error", message: "No autorizado" }, { status: 401 });
  }

  if (force) {
    const result = await runAdvisorForUser(authUser.id, authUser.plan, { force: true });
    if ("status" in result) return NextResponse.json(result);
    return successPayload(result, false);
  }

  const cached = await getLatestRecommendations(authUser.id);
  if (cached) {
    const stale = shouldRefreshClient(cached.created_at);
    const payload: AdvisorApiSuccess = {
      recommendations: cached.recommendations,
      generatedAt: cached.created_at,
      dataFromDays: ADVISOR_DATA_DAYS,
      motivationalClose: cached.motivational_close ?? undefined,
      source: "cache",
      claudeConfigured: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
    };
    if (!stale) return successPayload(payload, false);
    return successPayload(payload, true);
  }

  const result = await runAdvisorForUser(authUser.id, authUser.plan, { force: false });
  if ("status" in result) return NextResponse.json(result);
  return successPayload(result, false);
}

export async function POST() {
  const cookieStore = cookies();
  const demoActive = isDemoCookieActive(cookieStore.get(DEMO_COOKIE)?.value);
  const authUser = await getAuthUser();

  if (demoActive && !authUser) {
    const demo = await runAdvisorDemo();
    return successPayload(demo, false);
  }

  if (!authUser) {
    return NextResponse.json({ status: "error", message: "No autorizado" }, { status: 401 });
  }

  const result = await runAdvisorForUser(authUser.id, authUser.plan, { force: true });
  if ("status" in result) return NextResponse.json(result);
  return successPayload(result as AdvisorApiSuccess, false);
}
