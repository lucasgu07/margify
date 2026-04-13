"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (!terms) {
      setError("Tenés que aceptar los términos para continuar.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    if (!supabase) {
      setError("Falta configurar Supabase (variables NEXT_PUBLIC_SUPABASE_*).");
      setLoading(false);
      return;
    }
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push("/onboarding");
    router.refresh();
  }

  return (
    <AuthShell quote="En minutos vas a ver qué productos te dejan plata de verdad y cuáles te la comen en silencio.">
      <div className="rounded-card border border-margify-border bg-margify-card p-6 md:p-8">
        <h1 className="text-2xl font-bold text-white">Creá tu cuenta gratis</h1>
        <p className="mt-1 text-sm text-margify-muted">Sin tarjeta. Cancelás cuando quieras.</p>
        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <div>
            <Label htmlFor="name">Nombre completo</Label>
            <Input
              id="name"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
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
              autoComplete="new-password"
              required
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
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <label className="flex items-start gap-3 text-sm text-margify-muted">
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-margify-border bg-margify-cardAlt text-margify-cyan focus:ring-margify-cyan"
            />
            <span>
              Acepto los términos y la política de privacidad de Margify (demo).
            </span>
          </label>
          {error ? (
            <p className="rounded-control border border-margify-negative/40 bg-margify-negative/10 px-3 py-2 text-sm text-margify-negative">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creando cuenta…" : "Crear cuenta gratis"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-margify-muted">
          ¿Ya tenés cuenta?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-margify-cyan transition-colors duration-margify hover:underline"
          >
            Ingresá
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
