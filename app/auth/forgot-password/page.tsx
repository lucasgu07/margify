"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase";
import { getPasswordResetRedirectUrl } from "@/lib/supabase-auth-actions";
import { translateSupabaseAuthError } from "@/lib/supabase-auth-errors";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSent(false);
    setLoading(true);

    const supabase = createClient();
    if (!supabase) {
      setError("Falta configurar Supabase (variables NEXT_PUBLIC_SUPABASE_*).");
      setLoading(false);
      return;
    }

    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: getPasswordResetRedirectUrl(),
    });

    setLoading(false);
    if (err) {
      setError(translateSupabaseAuthError(err));
      return;
    }

    setSent(true);
  }

  return (
    <AuthShell quote="Recuperá el acceso a tu dashboard en unos minutos.">
      <div className="rounded-card border border-margify-border bg-margify-card p-6 md:p-8">
        <h1 className="text-2xl font-bold text-white">¿Olvidaste tu contraseña?</h1>
        <p className="mt-1 text-sm text-margify-muted">
          Te enviamos un link a tu email para elegir una contraseña nueva.
        </p>

        {sent ? (
          <div className="mt-8 space-y-4">
            <p className="rounded-control border border-margify-cyan/35 bg-margify-cyan/10 px-3 py-2 text-sm text-margify-cyan">
              Si existe una cuenta con <strong className="text-white">{email.trim()}</strong>, vas a
              recibir un email en unos minutos. Revisá también spam.
            </p>
            <Link
              href="/auth/login"
              className="inline-block text-sm font-medium text-margify-cyan hover:underline"
            >
              Volver a iniciar sesión
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {error ? (
              <p className="rounded-control border border-margify-negative/40 bg-margify-negative/10 px-3 py-2 text-sm text-margify-negative">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Enviando…" : "Enviar link de recuperación"}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-margify-muted">
          <Link
            href="/auth/login"
            className="font-medium text-margify-cyan transition-colors duration-margify hover:underline"
          >
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
