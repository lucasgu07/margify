import type { SupabaseClient } from "@supabase/supabase-js";
import { translateSupabaseAuthError } from "@/lib/supabase-auth-errors";

export function getAuthEmailRedirectUrl(next = "/onboarding"): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const path = next.startsWith("/") ? next : `/${next}`;
  return `${origin}/auth/callback?next=${encodeURIComponent(path)}`;
}

/** Tras signUp: hay usuario pero no sesión → Supabase pide confirmar email. */
export function signupNeedsEmailConfirmation(session: unknown, user: unknown): boolean {
  return Boolean(user && !session);
}

export async function resendSignupConfirmationEmail(
  supabase: SupabaseClient,
  email: string,
  next = "/onboarding"
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: email.trim(),
    options: {
      emailRedirectTo: getAuthEmailRedirectUrl(next),
    },
  });

  if (error) {
    return { ok: false, message: translateSupabaseAuthError(error) };
  }

  return { ok: true };
}
