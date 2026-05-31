"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase";
import { translateSupabaseAuthError } from "@/lib/supabase-auth-errors";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setCheckingSession(false);
      return;
    }
    void supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session));
      setCheckingSession(false);
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    if (!supabase) {
      setError("Falta configurar Supabase.");
      setLoading(false);
      return;
    }

    const { error: err } = await supabase.auth.updateUser({ password: password.trim() });
    setLoading(false);
    if (err) {
      setError(translateSupabaseAuthError(err));
      return;
    }

    setDone(true);
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1500);
  }

  if (checkingSession) {
    return (
      <AuthShell quote="Actualizá tu contraseña para seguir usando Margify.">
        <div className="rounded-card border border-margify-border bg-margify-card p-6 md:p-8 animate-pulse">
          <div className="h-8 w-56 rounded bg-margify-border" />
          <div className="mt-8 h-32 rounded bg-margify-border/60" />
        </div>
      </AuthShell>
    );
  }

  if (!hasSession) {
    return (
      <AuthShell quote="El link de recuperación puede haber expirado.">
        <div className="rounded-card border border-margify-border bg-margify-card p-6 md:p-8">
          <h1 className="text-2xl font-bold text-white">Link inválido o vencido</h1>
          <p className="mt-2 text-sm text-margify-muted">
            Pedí un nuevo email de recuperación e intentá de nuevo desde el link más reciente.
          </p>
          <Link href="/auth/forgot-password" className="mt-6 inline-block">
            <Button type="button">Pedir nuevo link</Button>
          </Link>
          <p className="mt-4 text-center text-sm text-margify-muted">
            <Link href="/auth/login" className="text-margify-cyan hover:underline">
              Volver a iniciar sesión
            </Link>
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell quote="Elegí una contraseña segura para tu cuenta.">
      <div className="rounded-card border border-margify-border bg-margify-card p-6 md:p-8">
        <h1 className="text-2xl font-bold text-white">Nueva contraseña</h1>
        <p className="mt-1 text-sm text-margify-muted">Ingresá y confirmá tu contraseña nueva.</p>

        {done ? (
          <p className="mt-8 rounded-control border border-margify-cyan/35 bg-margify-cyan/10 px-3 py-2 text-sm text-margify-cyan">
            Contraseña actualizada. Te redirigimos al dashboard…
          </p>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <div>
              <Label htmlFor="password">Contraseña nueva</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="confirm">Confirmar contraseña</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            {error ? (
              <p className="rounded-control border border-margify-negative/40 bg-margify-negative/10 px-3 py-2 text-sm text-margify-negative">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Guardando…" : "Guardar contraseña"}
            </Button>
          </form>
        )}
      </div>
    </AuthShell>
  );
}
