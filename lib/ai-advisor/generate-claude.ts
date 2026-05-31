import Anthropic from "@anthropic-ai/sdk";
import type { AdvisorMetricsPayload } from "@/lib/ai-advisor/compute-metrics";
import type { AdvisorRecommendation, RecommendationType } from "@/lib/ai-advisor/recommendation-types";

const SYSTEM_PROMPT = `Sos Margify AI, un consultor experto en e-commerce latinoamericano. Tu trabajo es analizar métricas de una tienda online y dar exactamente 3 recomendaciones concretas y accionables.

REGLAS ESTRICTAS:
- Cada recomendación tiene que tener una acción específica que el dueño puede tomar HOY
- Incluí siempre el impacto en dinero cuando sea posible (cuánto ahorrás o ganás)
- Hablá en español rioplatense, directo, sin vueltas, como un socio de negocios
- Nunca des consejos genéricos. Todo tiene que ser específico a los datos que recibís
- Si hay una campaña perdiendo plata, decí exactamente cuál y exactamente cuánto
- Si hay un producto con margen negativo, decí exactamente cuál y qué precio mínimo necesita para ser rentable
- El formato de cada recomendación es:
  TÍTULO (máximo 6 palabras)
  PROBLEMA: qué está pasando con los datos
  ACCIÓN: qué hacer exactamente hoy
  IMPACTO: cuánto dinero representa esto
- Terminá siempre con una frase motivadora corta y directa

Respondé ÚNICAMENTE con JSON válido (sin markdown):
{
  "recommendations": [
    { "title": "...", "problem": "...", "action": "...", "impact": "...", "type": "danger"|"warning"|"opportunity" }
  ],
  "motivationalClose": "..."
}`;

function buildUserMessage(metrics: AdvisorMetricsPayload): string {
  const campaignLines = metrics.campaigns
    .map(
      (c) =>
        `- ${c.name}: gastó $${c.spend.toFixed(0)}, ROAS real ${c.realRoas.toFixed(2)}x, ${c.conversions} conversiones, ${c.daysWithoutConversion} días sin convertir`
    )
    .join("\n");

  const worstLines = metrics.worstProducts
    .map(
      (p) =>
        `- ${p.name}: margen ${p.margin.toFixed(1)}%, ${p.unitsSold} unidades vendidas${p.minPriceHint ? `, precio mínimo sugerido ~$${p.minPriceHint.toFixed(0)}` : ""}`
    )
    .join("\n");

  return `Analizá estas métricas de mi tienda y dame 3 recomendaciones:

PERÍODO: últimos 30 días
Ventas totales: $${metrics.totalRevenue.toFixed(0)}
Ganancia neta: $${metrics.netProfit.toFixed(0)}
Margen promedio: ${metrics.avgMargin.toFixed(1)}%

CAMPAÑAS:
${campaignLines || "(sin campañas activas)"}

PRODUCTOS CON PEOR MARGEN:
${worstLines || "(sin datos de productos)"}

CASHFLOW PRÓXIMOS 7 DÍAS: $${metrics.projectedCashflow.toFixed(0)}

Dame 3 recomendaciones concretas y accionables en JSON.`;
}

function normalizeType(raw: unknown): RecommendationType {
  if (raw === "danger" || raw === "warning" || raw === "opportunity") return raw;
  return "warning";
}

function parseJsonResponse(text: string): {
  recommendations: AdvisorRecommendation[];
  motivationalClose?: string;
} {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : trimmed) as {
    recommendations?: unknown[];
    motivationalClose?: string;
  };

  const recommendations: AdvisorRecommendation[] = [];
  if (Array.isArray(parsed.recommendations)) {
    for (const item of parsed.recommendations) {
      if (!item || typeof item !== "object") continue;
      const r = item as Record<string, unknown>;
      const title = String(r.title ?? "").trim();
      const problem = String(r.problem ?? "").trim();
      let action = String(r.action ?? "").trim();
      const impact = String(r.impact ?? "").trim();
      if (!title || !problem || !action || !impact) continue;
      if (!action.startsWith("→")) action = `→ ${action}`;
      recommendations.push({
        title,
        problem,
        action,
        impact,
        type: normalizeType(r.type),
      });
    }
  }

  if (recommendations.length < 3) throw new Error("insufficient_recommendations");

  return {
    recommendations: recommendations.slice(0, 3),
    motivationalClose:
      typeof parsed.motivationalClose === "string" ? parsed.motivationalClose.trim() : undefined,
  };
}

export async function generateClaudeRecommendations(
  metrics: AdvisorMetricsPayload
): Promise<{ recommendations: AdvisorRecommendation[]; motivationalClose?: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) throw new Error("missing_anthropic_key");

  const anthropic = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-20250514";

  const message = await anthropic.messages.create({
    model,
    max_tokens: 1000,
    temperature: 0.5,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserMessage(metrics) }],
  });

  const block = message.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("empty_claude_response");

  return parseJsonResponse(block.text);
}
