import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAppOrigin } from "@/lib/google-ads";

export const dynamic = "force-dynamic";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/")) return "/onboarding";
  if (raw.startsWith("/dashboard") || raw.startsWith("/onboarding")) return raw;
  return "/onboarding";
}

/**
 * Callback de Supabase Auth (confirmación de email, magic links, etc.).
 * Agregar en Supabase → Authentication → URL Configuration → Redirect URLs:
 *   {NEXT_PUBLIC_SITE_URL}/auth/callback
 */
export async function GET(request: Request) {
  const origin = getAppOrigin();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=auth_callback`);
  }

  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.redirect(`${origin}/auth/login?error=supabase_config`);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/auth/login?error=auth_callback`);
  }

  const res = NextResponse.redirect(`${origin}${next}`);
  res.cookies.set("margify_demo", "", { path: "/", maxAge: 0, sameSite: "lax" });
  return res;
}
