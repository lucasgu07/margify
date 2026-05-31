import { NextResponse } from "next/server";
import { runAdvisorForUser } from "@/lib/ai-advisor/run-advisor";
import { createSupabaseAdminClient } from "@/lib/server/supabase-admin";
import { listUserIdsWithIntegrations } from "@/lib/server/user-integrations";
import { planFromBillingMeta, type UserBillingMeta } from "@/lib/dodo-billing";
import type { Plan } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function planForUser(userId: string): Promise<Plan> {
  const admin = createSupabaseAdminClient();
  if (!admin) return "starter";
  const { data } = await admin.auth.admin.getUserById(userId);
  const meta = (data.user?.user_metadata ?? {}) as UserBillingMeta;
  return planFromBillingMeta(meta);
}

/**
 * Cron: regenera recomendaciones IA Advisor cada 6 h para usuarios con integraciones.
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    return NextResponse.json({ ok: false, error: "missing_anthropic_key" }, { status: 503 });
  }

  const userIds = await listUserIdsWithIntegrations();
  let ok = 0;
  let skipped = 0;
  let failed = 0;

  for (const userId of userIds) {
    try {
      const plan = await planForUser(userId);
      const result = await runAdvisorForUser(userId, plan, { force: true, useCache: false });
      if ("status" in result) {
        skipped += 1;
      } else {
        ok += 1;
      }
    } catch {
      failed += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    users: userIds.length,
    generated: ok,
    skipped,
    failed,
  });
}
