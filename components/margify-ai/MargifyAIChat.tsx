"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode, type KeyboardEvent } from "react";
import Link from "next/link";
import {
  ArrowUp,
  BarChart3,
  Bell,
  Brain,
  Loader2,
  Paperclip,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useDemoMode } from "@/components/dashboard/DemoModeContext";
import { buttonClassName } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { MargifyAIChatMessage } from "@/lib/margify-ai/types";

const WELCOME_ID = "margify-ai-welcome";

const WELCOME_SUBTITLE =
  "Preguntá por campañas, ROAS, CTR, conversiones, costos y qué revisar cuando algo no rinde. Las respuestas son orientativas; validá con tus datos.";

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

type AutoResizeProps = { minHeight: number; maxHeight?: number };

function useAutoResizeTextarea({ minHeight, maxHeight }: AutoResizeProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight ?? Infinity));
      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.style.height = `${minHeight}px`;
  }, [minHeight]);

  return { textareaRef, adjustHeight };
}

const QUICK_ACTIONS: { label: string; prompt: string; icon: ReactNode }[] = [
  { label: "Bajar costo por lead", prompt: "¿Cómo puedo bajar el costo por lead en mis campañas de Meta o Google?", icon: <Target className="h-4 w-4" /> },
  { label: "ROAS bajo", prompt: "Mi ROAS está por debajo de lo que espero. ¿Qué reviso primero?", icon: <TrendingUp className="h-4 w-4" /> },
  { label: "CTR y creatividades", prompt: "¿Cómo mejorar el CTR? ¿Qué debería probar en creatividades?", icon: <BarChart3 className="h-4 w-4" /> },
  { label: "Gasto vs. ventas", prompt: "¿Cómo cruzo gasto en ads con mis ventas reales en Margify?", icon: <Wallet className="h-4 w-4" /> },
  { label: "Campañas a pausar", prompt: "¿Cómo identifico qué campañas conviene pausar o ajustar?", icon: <Bell className="h-4 w-4" /> },
];

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
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight: 48, maxHeight: 160 });

  const showIntroHero = messages.length === 1 && messages[0].id === WELCOME_ID;

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
    if (!showIntroHero) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, showIntroHero]);

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
    adjustHeight(true);
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
  }, [input, loading, messages, isDemo, adjustHeight, textareaRef]);

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  function clearChat() {
    setMessages([createWelcomeMessage()]);
    setError(null);
    setInput("");
    adjustHeight(true);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* */
    }
  }

  function applyQuickAction(prompt: string) {
    setInput(prompt);
    requestAnimationFrame(() => {
      adjustHeight();
      textareaRef.current?.focus();
    });
  }

  return (
    <div
      className={cn(
        "relative flex min-h-[min(88dvh,900px)] flex-1 flex-col overflow-hidden",
        "rounded-2xl border border-margify-cyan/15 shadow-[0_0_0_1px_rgba(100,223,223,0.08)_inset,0_24px_80px_rgba(0,0,0,0.45)]"
      )}
    >
      {/* Fondo inmersivo (sin imagen externa) */}
      <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden rounded-2xl" aria-hidden>
        <div className="absolute inset-0 bg-margify-bg" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_105%_90%_at_50%_40%,transparent_32%,rgba(100,223,223,0.08)_55%,rgba(100,223,223,0.04)_70%,transparent_88%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_100%_at_0%_50%,rgba(100,223,223,0.12),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_100%_at_100%_50%,rgba(100,223,223,0.12),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_0%,rgba(100,223,223,0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(100,223,223,0.1)_0%,transparent_35%,rgba(0,0,0,0.2)_100%)]" />
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-margify-border/50 px-4 py-3.5 backdrop-blur-sm md:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-margify-cyan/15 ring-1 ring-margify-cyan/20">
              <Brain className="h-5 w-5 text-margify-cyan" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">Margify AI</p>
              <p className="truncate text-xs text-margify-muted">Asistente de campañas y rentabilidad</p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearChat}
            className="shrink-0 rounded-control border border-margify-border/80 bg-margify-black/30 px-3 py-1.5 text-xs font-medium text-margify-muted transition-colors duration-margify hover:border-margify-cyan/35 hover:text-margify-text"
          >
            Nueva conversación
          </button>
        </div>

        {isDemo ? (
          <div className="border-b border-margify-cyan/20 bg-margify-cyan/10 px-4 py-3 text-sm text-margify-text md:px-5">
            <span className="font-medium text-margify-cyan">Modo demo:</span> el chat no envía mensajes al
            servidor.{" "}
            <Link href="/auth/register" className="font-medium text-margify-cyan underline underline-offset-2">
              Creá tu cuenta
            </Link>{" "}
            para usar Margify AI.
          </div>
        ) : null}

        {!isDemo && error ? (
          <div className="border-b border-margify-negative/30 bg-margify-negative/10 px-4 py-2.5 text-sm text-margify-negative md:px-5">
            {error}
          </div>
        ) : null}

        {showIntroHero ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 pb-6 pt-4 text-center md:pt-2">
            <h1 className="text-3xl font-semibold tracking-tight text-white drop-shadow-sm md:text-4xl">
              Margify AI
            </h1>
            <p className="mt-3 max-w-lg text-balance text-sm leading-relaxed text-margify-muted md:text-base">
              {WELCOME_SUBTITLE}
            </p>
          </div>
        ) : (
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 md:px-6 md:py-5">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn("flex w-full gap-3", m.role === "user" ? "flex-row-reverse" : "flex-row")}
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
                      : "border border-margify-border/80 bg-margify-black/40 text-margify-text"
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
        )}

        <form
          className="mt-auto w-full max-w-3xl self-center border-t border-margify-border/40 bg-margify-bg/20 px-4 pb-6 pt-4 backdrop-blur-md md:px-5"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <div className="relative rounded-xl border border-margify-border/70 bg-margify-black/50 shadow-[0_0_0_1px_rgba(100,223,223,0.06)_inset] backdrop-blur-md">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                adjustHeight();
              }}
              onKeyDown={onKeyDown}
              placeholder="Escribí tu pregunta sobre campañas, ROAS, métricas, costos…"
              disabled={loading || isDemo}
              className={cn(
                "min-h-[48px] w-full resize-none border-0 border-none bg-transparent px-4 py-3 text-sm text-white",
                "placeholder:text-margify-muted/75 focus-visible:ring-0 focus-visible:ring-offset-0"
              )}
              style={{ overflow: "hidden" }}
            />
            <div className="flex items-center justify-between gap-2 p-2 pl-3">
              <button
                type="button"
                disabled
                title="Adjuntos: próximamente"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-margify-muted opacity-50"
                aria-label="Adjuntos, próximamente"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <button
                type="submit"
                disabled={isDemo || loading || !input.trim()}
                className={buttonClassName("primary", "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg p-0")}
                aria-label="Enviar"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ArrowUp className="h-4 w-4" aria-hidden />}
              </button>
            </div>
          </div>

          <div
            className={cn("mt-4 flex flex-wrap items-center justify-center gap-2", showIntroHero && "md:mt-5")}
            role="group"
            aria-label="Preguntas sugeridas"
          >
            {QUICK_ACTIONS.map(({ label, prompt, icon }) => (
              <button
                key={label}
                type="button"
                disabled={isDemo || loading}
                onClick={() => applyQuickAction(prompt)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border border-margify-border/60 bg-margify-black/40 px-3 py-1.5 text-xs font-medium text-margify-muted",
                  "transition-colors duration-margify hover:border-margify-cyan/35 hover:text-margify-cyan",
                  "disabled:cursor-not-allowed disabled:opacity-40"
                )}
              >
                {icon}
                <span>{label}</span>
              </button>
            ))}
          </div>

          <p className="mt-3 text-center text-xs text-margify-muted/90">
            Enter envía · Shift+Enter salto de línea. Orientación general; no reemplaza asesoría legal o fiscal.
          </p>
        </form>
      </div>
    </div>
  );
}
