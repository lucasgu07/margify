import Anthropic from "@anthropic-ai/sdk";
import type { AdvisorMetricsPayload } from "@/lib/ai-advisor/compute-metrics";
import type {
  AdvisorRecommendation,
  AdvisorWeeklyReview,
  RecommendationCategory,
  RecommendationUrgency,
  RecommendationType,
} from "@/lib/ai-advisor/recommendation-types";

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Sos Margify AI, el CFO + operador de crecimiento de una tienda e-commerce latinoamericana. Tu trabajo es analizar métricas reales y generar recomendaciones tan específicas y accionables que el dueño sienta que tenés acceso directo a su negocio.

FILOSOFÍA:
- Nunca des consejos genéricos. Si hay una campaña con mal ROAS, nombrala exactamente.
- Cuantificá SIEMPRE el impacto en dinero. "Podés dejar de perder $812/semana" > "tu ROAS está cayendo".
- Confianza calibrada: si el dato es claro, tenés 90%+ de confianza. Si es una estimación, 60-75%.
- Hablá en español rioplatense, directo, como un socio que conoce el negocio.
- Una mala recomendación daña la confianza más que no dar ninguna.

REGLAS ESTRICTAS:
1. Entre 4 y 7 recomendaciones ordenadas por impacto financiero (mayor primero).
2. Cada recomendación DEBE tener un estimatedImpactUsd (positivo = ganancia/ahorro mensual si tomás la acción; negativo si ignorás el riesgo).
3. dataPoints debe tener 2-4 datos específicos que usaste para llegar a esa conclusión.
4. urgency "high" solo para cosas que cuestan dinero HOY si no se actúa (campañas sangrando, margen negativo en productos de alto volumen).
5. El título máximo 6 palabras, sin signos de exclamación.
6. El campo action siempre empieza con "→" y tiene un paso concreto con número o nombre específico cuando sea posible.
7. El campo impact siempre tiene un número en USD o porcentaje.

CATEGORÍAS DISPONIBLES: Ads | Profitability | Inventory | Retention | CashFlow | Scaling | Risk

Respondé ÚNICAMENTE con JSON válido (sin markdown, sin texto extra):
{
  "recommendations": [
    {
      "title": "string (≤6 palabras)",
      "problem": "string (1-2 oraciones con datos específicos)",
      "action": "string (empieza con →, paso concreto)",
      "impact": "string (tiene número USD o %)",
      "type": "danger" | "warning" | "opportunity",
      "category": "Ads" | "Profitability" | "Inventory" | "Retention" | "CashFlow" | "Scaling" | "Risk",
      "confidence": number (0-100),
      "urgency": "high" | "medium" | "low",
      "estimatedImpactUsd": number,
      "dataPoints": ["string", "string", ...]
    }
  ],
  "motivationalClose": "string (1 frase directa, sin emojis, sin exclamaciones)",
  "weeklyReview": {
    "improved": ["string", ...],
    "worsened": ["string", ...],
    "wastedSpendUsd": number,
    "topOpportunity": "string",
    "marginEvolutionPp": number,
    "recommendedActions": ["string", "string"]
  }
}`;

// ─── User message builder ─────────────────────────────────────────────────────

function buildUserMessage(metrics: AdvisorMetricsPayload): string {
  const campaignLines = metrics.campaigns
    .map(
      (c) =>
        `- "${c.name}": gasto $${c.spend.toFixed(0)} · ROAS ${c.realRoas.toFixed(2)}x · ${c.conversions} conv · ${c.daysWithoutConversion}d sin conv · desperdicio est. $${c.estimatedWeeklyWaste.toFixed(0)}/sem`
    )
    .join("\n") || "(sin campañas activas)";

  const bestLines = metrics.bestProducts
    .map((p) => `- "${p.name}": margen ${p.margin.toFixed(1)}% · ${p.unitsSold} u · $${p.revenue.toFixed(0)} rev`)
    .join("\n") || "(sin datos)";

  const worstLines = metrics.worstProducts
    .map(
      (p) =>
        `- "${p.name}": margen ${p.margin.toFixed(1)}% · ${p.unitsSold} u · $${p.revenue.toFixed(0)} rev${p.minPriceHint ? ` · precio mínimo sugerido ~$${p.minPriceHint.toFixed(0)}` : ""}`
    )
    .join("\n") || "(sin datos)";

  const highRiskLines =
    metrics.highVolumeButLowMarginProducts.length > 0
      ? metrics.highVolumeButLowMarginProducts
          .map((p) => `- "${p.name}": margen ${p.margin.toFixed(1)}% · ${p.unitsSold} unidades`)
          .join("\n")
      : "(ninguno)";

  return `Analizá estas métricas de mi tienda y generá entre 4 y 7 recomendaciones ordenadas por impacto financiero (mayor primero):

PERÍODO: últimos 30 días
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINANCIERO
  Ventas totales:    $${metrics.totalRevenue.toFixed(0)}
  Ganancia neta:     $${metrics.netProfit.toFixed(0)}
  Margen promedio:   ${metrics.avgMargin.toFixed(1)}%
  Cashflow próx 7d:  $${metrics.projectedCashflow.toFixed(0)}
  Crecimiento rev:   ${metrics.revenueGrowthPct > 0 ? "+" : ""}${metrics.revenueGrowthPct.toFixed(1)}% (últimos 15d vs anteriores)

ADS
  Total gasto:       $${metrics.totalAdSpend.toFixed(0)}
  MER:               ${metrics.mer.toFixed(2)}x
  CAC blended:       $${metrics.blendedCac.toFixed(1)}
  Gasto desperdiciado (ROAS<1): $${metrics.wastedSpend.toFixed(0)}
  Tendencia ROAS:    ${metrics.roasTrendPct > 0 ? "+" : ""}${metrics.roasTrendPct.toFixed(1)}% (última sem vs anterior)
${metrics.topWastedCampaign ? `  Campaña más costosa: "${metrics.topWastedCampaign.name}" ($${metrics.topWastedCampaign.estimatedWeeklyWaste.toFixed(0)}/sem de desperdicio)` : ""}

CAMPAÑAS ACTIVAS
${campaignLines}

MEJORES PRODUCTOS (por margen)
${bestLines}

PEORES PRODUCTOS (por margen)
${worstLines}

PRODUCTOS CON ALTO VOLUMEN Y BAJO MARGEN (riesgo)
${highRiskLines}

Total órdenes:  ${metrics.orderCount}
Prods con margen < 10%:  ${metrics.lowMarginProductCount}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generá el JSON con recomendaciones + weeklyReview.`;
}

// ─── Type normalizers ─────────────────────────────────────────────────────────

function normalizeType(raw: unknown): RecommendationType {
  if (raw === "danger" || raw === "warning" || raw === "opportunity") return raw;
  return "warning";
}

function normalizeCategory(raw: unknown): RecommendationCategory | undefined {
  const valid: RecommendationCategory[] = [
    "Ads", "Profitability", "Inventory", "Retention", "CashFlow", "Scaling", "Risk",
  ];
  if (typeof raw === "string" && valid.includes(raw as RecommendationCategory))
    return raw as RecommendationCategory;
  return undefined;
}

function normalizeUrgency(raw: unknown): RecommendationUrgency | undefined {
  if (raw === "high" || raw === "medium" || raw === "low") return raw;
  return undefined;
}

// ─── Response parser ──────────────────────────────────────────────────────────

type ClaudeOutput = {
  recommendations: AdvisorRecommendation[];
  motivationalClose?: string;
  weeklyReview?: AdvisorWeeklyReview;
};

function parseJsonResponse(text: string): ClaudeOutput {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : trimmed) as {
    recommendations?: unknown[];
    motivationalClose?: unknown;
    weeklyReview?: Record<string, unknown>;
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

      const dataPoints = Array.isArray(r.dataPoints)
        ? (r.dataPoints as unknown[]).map((d) => String(d)).filter(Boolean)
        : undefined;

      recommendations.push({
        title,
        problem,
        action,
        impact,
        type: normalizeType(r.type),
        category: normalizeCategory(r.category),
        confidence: typeof r.confidence === "number" ? Math.min(100, Math.max(0, r.confidence)) : undefined,
        urgency: normalizeUrgency(r.urgency),
        estimatedImpactUsd: typeof r.estimatedImpactUsd === "number" ? r.estimatedImpactUsd : undefined,
        dataPoints: dataPoints?.length ? dataPoints : undefined,
      });
    }
  }

  if (recommendations.length < 3) throw new Error("insufficient_recommendations");

  // Parse weekly review
  let weeklyReview: AdvisorWeeklyReview | undefined;
  if (parsed.weeklyReview && typeof parsed.weeklyReview === "object") {
    const wr = parsed.weeklyReview;
    weeklyReview = {
      improved: Array.isArray(wr.improved) ? (wr.improved as unknown[]).map(String) : [],
      worsened: Array.isArray(wr.worsened) ? (wr.worsened as unknown[]).map(String) : [],
      wastedSpendUsd: typeof wr.wastedSpendUsd === "number" ? wr.wastedSpendUsd : 0,
      topOpportunity: typeof wr.topOpportunity === "string" ? wr.topOpportunity : "",
      marginEvolutionPp: typeof wr.marginEvolutionPp === "number" ? wr.marginEvolutionPp : 0,
      recommendedActions: Array.isArray(wr.recommendedActions)
        ? (wr.recommendedActions as unknown[]).map(String)
        : [],
      generatedAt: new Date().toISOString(),
    };
  }

  return {
    recommendations: recommendations.slice(0, 7),
    motivationalClose:
      typeof parsed.motivationalClose === "string" ? parsed.motivationalClose.trim() : undefined,
    weeklyReview,
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateClaudeRecommendations(
  metrics: AdvisorMetricsPayload
): Promise<ClaudeOutput> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) throw new Error("missing_anthropic_key");

  const anthropic = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-20250514";

  const message = await anthropic.messages.create({
    model,
    max_tokens: 2000,
    temperature: 0.3,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserMessage(metrics) }],
  });

  const block = message.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("empty_claude_response");

  return parseJsonResponse(block.text);
}
