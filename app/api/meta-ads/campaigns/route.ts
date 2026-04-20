import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { META_COOKIE, parseMetaSession } from "@/lib/meta-auth";

/**
 * Metadata rápida de la sesión para la UI. La fuente real de verdad es
 * POST /api/meta-ads/sync, que trae campañas e insights en vivo.
 */
export async function GET() {
  const raw = cookies().get(META_COOKIE)?.value;
  const session = parseMetaSession(raw);
  return NextResponse.json({
    connected: Boolean(session?.access_token),
    adAccountId: session?.ad_account_id ?? null,
    adAccounts: session?.ad_accounts ?? [],
    lastSyncedAt: session?.last_synced_at ?? null,
  });
}
