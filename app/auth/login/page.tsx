"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
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
      setError(err.message);
      return;
    }
    try {
      await fetch("/api/auth/clear-demo", { method: "POST" });
    } catch {
      /* no bloquear login */
    }
    router.push("/dashboard");
    router.refresh();
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
            <Label htmlFor="password">Contraseña</Label>
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
