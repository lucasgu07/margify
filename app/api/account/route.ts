import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** DELETE /api/account — elimina la cuenta autenticada. */
export async function DELETE() {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });
  }

  await admin.from("user_integrations").delete().eq("user_id", user.id);
  await admin.from("user_costs").delete().eq("user_id", user.id);
  await admin.from("ai_usage").delete().eq("user_id", user.id);
  await admin.from("user_alerts_config").delete().eq("user_id", user.id);
  await admin.from("user_alerts_history").delete().eq("user_id", user.id);

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
