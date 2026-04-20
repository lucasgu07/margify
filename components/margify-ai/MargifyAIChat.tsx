"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Brain, Loader2, Send } from "lucide-react";
import { useDemoMode } from "@/components/dashboard/DemoModeContext";
import { buttonClassName } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { MargifyAIChatMessage } from "@/lib/margify-ai/types";

const WELCOME_ID = "margify-ai-welcome";

function createWelcomeMessage(): MargifyAIChatMessage {
  return {
    id: WELCOME_ID,
    role: "assistant",
    content:
      "Soy Margify AI. Podés preguntarme sobre anuncios, métricas (CTR, CPC, ROAS, conversiones…), cómo optimizar campañas o qué revisar cuando algo no rinde. Si falta contexto, te voy a pedir detalle.",
    createdAt: Date.now(),
  };
}

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function messagesForApi(list: MargifyAIChatMessage[]): { role: "user" | "assistant"; content: string }[] {
  return list
    .filter((m) => m.id !== WELCOME_ID)
    .map((m) => ({ role: m.role, content: m.content }));
}

type MargifyAIChatProps = {
  storageKey: string;
};

export function MargifyAIChat({ storageKey }: MargifyAIChatProps) {
  const isDemo = useDemoMode();
  const [messages, setMessages] = useState<MargifyAIChatMessage[]>([createWelcomeMessage()]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as MargifyAIChatMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.every(
            (m) =>
              m &&
              typeof m.id === "string" &&
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string" &&
              typeof m.createdAt === "number"
          );
          if (valid) setMessages(parsed);
        }
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {
      /* quota */
    }
  }, [messages, storageKey, hydrated]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = useCallback(async () => {
    if (isDemo) return;
    const text = input.trim();
    if (!text || loading) return;

    setError(null);
    const userMsg: MargifyAIChatMessage = {
      id: newId(),
      role: "user",
      content: text,
      createdAt: Date.now(),
    };

    const threadAfterUser = [...messages, userMsg];
    const history = messagesForApi(threadAfterUser);

    setInput("");
    setMessages(threadAfterUser);
    setLoading(true);

    try {
      const res = await fetch("/api/margify-ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      const raw = await res.text();
      let data: { message?: string; error?: string };
      try {
        data = raw ? (JSON.parse(raw) as { message?: string; error?: string }) : {};
      } catch {
        throw new Error(
          res.ok
            ? "Respuesta inválida del servidor"
            : `Error del servidor (${res.status}). Probá de nuevo.`
        );
      }

      if (!res.ok) {
        throw new Error(data.error || `No se pudo obtener respuesta (${res.status})`);
      }
      if (!data.message?.trim()) throw new Error("Respuesta vacía");

      const assistantMsg: MargifyAIChatMessage = {
        id: newId(),
        role: "assistant",
        content: data.message.trim(),
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error de red";
      setError(msg);
      setMessages((prev) => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        if (last.id === userMsg.id && last.role === "user") {
          return prev.slice(0, -1);
        }
        return prev;
      });
      setInput(text);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }, [input, loading, messages, isDemo]);

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  function clearChat() {
    setMessages([createWelcomeMessage()]);
    setError(null);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* */
    }
  }

  return (
    <div className="flex min-h-[min(70dvh,720px)] flex-1 flex-col overflow-hidden rounded-card border border-margify-border bg-margify-black/35 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]">
      <div className="flex items-center justify-between gap-3 border-b border-margify-border px-4 py-3 md:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-margify-cyan/15">
            <Brain className="h-5 w-5 text-margify-cyan" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">Margify AI</p>
            <p className="truncate text-xs text-margify-muted">Marketing y publicidad digital</p>
          </div>
        </div>
        <button
          type="button"
          onClick={clearChat}
          className="shrink-0 rounded-control border border-margify-border px-3 py-1.5 text-xs font-medium text-margify-muted transition-colors duration-margify hover:border-margify-cyan/40 hover:text-margify-text"
        >
          Nueva conversación
        </button>
      </div>

      {isDemo ? (
        <div className="border-b border-margify-cyan/25 bg-margify-cyan/10 px-4 py-3 text-sm text-margify-text md:px-5">
          <span className="font-medium text-margify-cyan">Modo demo:</span> el chat no envía mensajes al
          servidor (ahorrá API).{" "}
          <Link href="/auth/register" className="font-medium text-margify-cyan underline underline-offset-2">
            Creá tu cuenta
          </Link>{" "}
          para usar Margify AI con tu negocio y campañas.
        </div>
      ) : null}

      {!isDemo && error ? (
        <div className="border-b border-margify-negative/30 bg-margify-negative/10 px-4 py-2 text-sm text-margify-negative md:px-5">
          {error}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "flex w-full gap-3",
              m.role === "user" ? "flex-row-reverse" : "flex-row"
            )}
          >
            {m.role === "assistant" ? (
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-margify-cyan/10">
                <Brain className="h-4 w-4 text-margify-cyan" aria-hidden />
              </div>
            ) : (
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-margify-cardAlt text-xs font-semibold text-margify-cyan">
                Vos
              </div>
            )}
            <div
              className={cn(
                "max-w-[min(100%,720px)] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                m.role === "user"
                  ? "border border-margify-cyan/25 bg-margify-cyan/10 text-margify-text"
                  : "border border-margify-border bg-margify-card text-margify-text"
              )}
            >
              <div className="whitespace-pre-wrap [word-break:break-word]">{m.content}</div>
            </div>
          </div>
        ))}

        {loading ? (
          <div className="flex items-center gap-2 pl-11 text-sm text-margify-muted">
            <Loader2 className="h-4 w-4 animate-spin text-margify-cyan" aria-hidden />
            <span>Margify AI está escribiendo…</span>
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      <form
        className="border-t border-margify-border bg-margify-bg/80 p-4 backdrop-blur-sm md:p-5"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="sr-only" htmlFor="margify-ai-input">
            Escribí tu mensaje
          </label>
          <textarea
            id="margify-ai-input"
            ref={textareaRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ej.: ¿Por qué mi CTR es bajo? ¿Cómo escalar esta campaña?"
            disabled={loading || isDemo}
            className="min-h-[3rem] w-full flex-1 resize-y rounded-control border border-margify-border bg-margify-cardAlt px-4 py-3 text-sm text-white placeholder:text-margify-muted/80 focus:border-margify-cyan focus:outline-none focus:ring-1 focus:ring-margify-cyan/40 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={loading || isDemo || !input.trim()}
            className={buttonClassName(
              "primary",
              "inline-flex shrink-0 items-center justify-center gap-2 px-5 py-3 sm:min-w-[7.5rem]"
            )}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
            Enviar
          </button>
        </div>
        <p className="mt-2 text-xs text-margify-muted">
          Enter para enviar · Shift+Enter para salto de línea. Las respuestas son orientativas; no sustituyen asesoría
          legal o financiera.
        </p>
      </form>
    </div>
  );
}
