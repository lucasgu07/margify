import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import OpenAI from "openai";
import { buildMargifyAIContextBlock } from "@/lib/margify-ai/build-context";
import { MARGIFY_AI_SYSTEM_PROMPT } from "@/lib/margify-ai/system-prompt";
import type { MargifyAIApiMessage } from "@/lib/margify-ai/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const DEMO_COOKIE = "margify_demo";

const MAX_MESSAGES = 40;
const MAX_CONTENT_PER_MESSAGE = 12_000;

function validateMessages(raw: unknown): MargifyAIApiMessage[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error("messages debe ser un array no vacío");
  }
  const slice = raw.slice(-MAX_MESSAGES);
  const out: MargifyAIApiMessage[] = [];
  for (const item of slice) {
    if (!item || typeof item !== "object") throw new Error("mensaje inválido");
    const m = item as { role?: string; content?: unknown };
    if (m.role !== "user" && m.role !== "assistant") {
      throw new Error("role debe ser user o assistant");
    }
    if (typeof m.content !== "string") throw new Error("content inválido");
    const content = m.content.trim();
    if (!content) throw new Error("content vacío");
    if (content.length > MAX_CONTENT_PER_MESSAGE) throw new Error("mensaje demasiado largo");
    out.push({ role: m.role, content });
  }
  return out;
}

export async function POST(req: Request) {
  const cookieStore = cookies();
  const demoCookie = cookieStore.get(DEMO_COOKIE)?.value === "1";
  const supabase = createServerSupabaseClient();
  const { data: authData } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (demoCookie && !authData.user) {
    return NextResponse.json({ error: "No disponible en modo demo" }, { status: 403 });
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "El asistente no está configurado. Agregá OPENAI_API_KEY en las variables de entorno del servidor.",
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido" }, { status: 400 });
  }

  const messagesRaw = (body as { messages?: unknown }).messages;
  let userMessages: MargifyAIApiMessage[];
  try {
    userMessages = validateMessages(messagesRaw);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Solicitud inválida";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const systemContent = `${MARGIFY_AI_SYSTEM_PROMPT}

---
Contexto de la cuenta (usalo solo como referencia; no inventes datos que no figuren aquí):

${buildMargifyAIContextBlock()}`;

  const openai = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  try {
    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.65,
      max_tokens: 1536,
      messages: [
        { role: "system", content: systemContent },
        ...userMessages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      ],
    });

    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) {
      return NextResponse.json({ error: "Respuesta vacía del modelo" }, { status: 502 });
    }

    return NextResponse.json({ message: text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al contactar al modelo";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
