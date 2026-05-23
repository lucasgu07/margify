"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase";
import {
  authConfirmationResentMessage,
  authConfirmationSentMessage,
} from "@/lib/supabase-auth-errors";
import { resendSignupConfirmationEmail } from "@/lib/supabase-auth-actions";

type ConfirmEmailPanelProps = {
  email: string;
  /** Ruta post-confirmación (link del mail). */
  next?: string;
  /** Si false, no muestra el texto inicial de “te enviamos…”. */
  showInitialHint?: boolean;
};

export function ConfirmEmailPanel({
  email,
  next = "/onboarding",
  showInitialHint = true,
}: ConfirmEmailPanelProps) {
  const [resending, setResending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackOk, setFeedbackOk] = useState(false);

  async function handleResend() {
    setResending(true);
    setFeedback(null);
    const supabase = createClient();
    if (!supabase) {
      setFeedbackOk(false);
      setFeedback("Falta configurar Supabase (variables NEXT_PUBLIC_SUPABASE_*).");
      setResending(false);
      return;
    }

    const result = await resendSignupConfirmationEmail(supabase, email, next);
    setResending(false);
    if (result.ok) {
      setFeedbackOk(true);
      setFeedback(authConfirmationResentMessage());
    } else {
      setFeedbackOk(false);
      setFeedback(result.message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-margify-cyan/15 text-margify-cyan">
          <Mail className="h-6 w-6" aria-hidden />
        </span>
      </div>
      <h1 className="text-center text-2xl font-bold text-white">Confirmá tu email</h1>
      {showInitialHint ? (
        <p className="text-center text-sm leading-relaxed text-margify-muted">
          {authConfirmationSentMessage()}
        </p>
      ) : null}
      <p className="rounded-control border border-margify-border bg-margify-cardAlt px-4 py-3 text-center text-sm text-white">
        <span className="text-margify-muted">Enviamos el link a </span>
        <span className="font-medium break-all">{email}</span>
      </p>
      <p className="text-center text-xs text-margify-muted">
        Si no lo ves en unos minutos, revisá spam o promociones. También podés reenviarlo.
      </p>
      {feedback ? (
        <p
          className={
            feedbackOk
              ? "rounded-control border border-margify-cyan/35 bg-margify-cyan/10 px-3 py-2 text-sm text-margify-cyan"
              : "rounded-control border border-margify-negative/40 bg-margify-negative/10 px-3 py-2 text-sm text-margify-negative"
          }
          role="status"
        >
          {feedback}
        </p>
      ) : null}
      <Button type="button" className="w-full" disabled={resending} onClick={() => void handleResend()}>
        {resending ? "Reenviando…" : "Reenviar email de confirmación"}
      </Button>
      <p className="text-center text-sm text-margify-muted">
        ¿Ya confirmaste?{" "}
        <Link
          href="/auth/login"
          className="font-medium text-margify-cyan transition-colors duration-margify hover:underline"
        >
          Ingresá acá
        </Link>
      </p>
    </div>
  );
}
