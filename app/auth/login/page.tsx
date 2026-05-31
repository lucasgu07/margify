"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { ConfirmEmailPanel } from "@/components/auth/ConfirmEmailPanel";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase";
import { DEMO_DASHBOARD_ENTRY } from "@/lib/demo-entry";
import { isEmailNotConfirmedError, translateSupabaseAuthError } from "@/lib/supabase-auth-errors";

function safeAuthRedirect(next: string | null): string {
  if (!next || !next.startsWith("/")) return "/dashboard";
  if (next.startsWith("/dashboard") || next.startsWith("/onboarding")) return next;
  return "/dashboard";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const callbackError = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    if (callbackError === "auth_callback") {
      return "No pudimos validar el link de confirmación. Probá reenviar el email o iniciá sesión.";
    }
    if (callbackError === "supabase_config") {
      return "Falta configurar Supabase (variables NEXT_PUBLIC_SUPABASE_*).";
    }
    return null;
  });
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNeedsEmailConfirm(false);
    setLoading(true);
    const supabase = createClient();
    if (!supabase) {
      setError("Falta configurar Supabase (variables NEXT_PUBLIC_SUPABASE_*).");
      setLoading(false);
      return;
    }
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(translateSupabaseAuthError(err));
      if (isEmailNotConfirmedError(err)) {
        setNeedsEmailConfirm(true);
      }
      return;
    }
    try {
      await fetch("/api/auth/clear-demo", { method: "POST" });
    } catch {
      /* no bloquear login */
    }
    router.push(safeAuthRedirect(next));
    router.refresh();
  }

  if (needsEmailConfirm && email.trim()) {
    return (
      <AuthShell quote="Tu negocio no debería depender de un ROAS que no refleja la realidad de tu bolsillo. Margify te muestra la verdad.">
        <div className="rounded-card border border-margify-border bg-margify-card p-6 md:p-8">
          {error ? (
            <p className="mb-4 rounded-control border border-margify-negative/40 bg-margify-negative/10 px-3 py-2 text-sm text-margify-negative">
              {error}
            </p>
          ) : null}
          <ConfirmEmailPanel
            email={email.trim()}
            next={safeAuthRedirect(next)}
            showInitialHint={false}
          />
          <Button
            type="button"
            variant="ghost"
            className="mt-4 w-full"
            onClick={() => setNeedsEmailConfirm(false)}
          >
            Volver al login
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell quote="Tu negocio no debería depender de un ROAS que no refleja la realidad de tu bolsillo. Margify te muestra la verdad.">
      <div className="rounded-card border border-margify-border bg-margify-card p-6 md:p-8">
        <h1 className="text-2xl font-bold text-white">Ingresá a tu cuenta</h1>
        <p className="mt-1 text-sm text-margify-muted">
          Accedé a tu dashboard de rentabilidad en tiempo real.
        </p>
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
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Link
                href="/auth/forgot-password"
                className="text-xs font-medium text-margify-cyan transition-colors duration-margify hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error ? (
            <p className="rounded-control border border-margify-negative/40 bg-margify-negative/10 px-3 py-2 text-sm text-margify-negative">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Ingresando…" : "Ingresar"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-margify-muted">
          <Link
            href={DEMO_DASHBOARD_ENTRY}
            className="font-medium text-margify-cyan transition-colors duration-margify hover:underline"
          >
            Explorar demo sin cuenta
          </Link>
        </p>
        <p className="mt-4 text-center text-sm text-margify-muted">
          ¿No tenés cuenta?{" "}
          <Link
            href="/auth/register"
            className="font-medium text-margify-cyan transition-colors duration-margify hover:underline"
          >
            Registrate
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthShell quote="Tu negocio no debería depender de un ROAS que no refleja la realidad de tu bolsillo. Margify te muestra la verdad.">
          <div className="rounded-card border border-margify-border bg-margify-card p-6 md:p-8 animate-pulse">
            <div className="h-8 w-48 rounded bg-margify-border" />
            <div className="mt-8 h-40 rounded bg-margify-border/60" />
          </div>
        </AuthShell>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
