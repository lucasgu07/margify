import { NextResponse } from "next/server";
import { evaluateAlertsForUser } from "@/lib/server/evaluate-alerts";
import { listUserIdsWithIntegrations } from "@/lib/server/user-integrations";
import { createSupabaseAdminClient } from "@/lib/server/supabase-admin";
import { planFromBillingMeta, type UserBillingMeta } from "@/lib/dodo-billing";
import type { Plan } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/**
 * Cron: evalúa alertas activas para usuarios con integraciones.
 * Header: Authorization: Bearer CRON_SECRET
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });
  }

  const userIds = await listUserIdsWithIntegrations();
  let evaluated = 0;
  let fired = 0;

  for (const userId of userIds) {
    const { data } = await admin.auth.admin.getUserById(userId);
    const user = data.user;
    if (!user?.email) continue;
    const meta = (user.user_metadata ?? {}) as UserBillingMeta;
    const plan: Plan = planFromBillingMeta(meta);
    evaluated += 1;
    fired += await evaluateAlertsForUser(userId, user.email, plan);
  }

  return NextResponse.json({ ok: true, evaluated, fired });
}
