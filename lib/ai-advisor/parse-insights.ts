import { defaultCtaForPage } from "@/lib/ai-advisor/page-defaults";
import type { AdvisorPage } from "@/lib/ai-advisor/types";
import type { AdvisorInsights } from "@/lib/ai-advisor-insights";

function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("no_json");
    return JSON.parse(match[0]);
  }
}

export function parseClaudeAdvisorResponse(text: string, page: AdvisorPage): AdvisorInsights {
  const parsed = extractJsonObject(text) as {
    subtitle?: unknown;
    tips?: unknown;
    ctaHref?: unknown;
    ctaLabel?: unknown;
  };

  const subtitle =
    typeof parsed.subtitle === "string" && parsed.subtitle.trim()
      ? parsed.subtitle.trim()
      : "Recomendaciones según tus métricas recientes";

  const tipsRaw = Array.isArray(parsed.tips) ? parsed.tips : [];
  const tips = tipsRaw
    .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
    .map((t) => t.trim())
    .slice(0, 3);

  if (tips.length < 3) {
    throw new Error("insufficient_tips");
  }

  const defaults = defaultCtaForPage(page);
  const ctaHref =
    typeof parsed.ctaHref === "string" && parsed.ctaHref.startsWith("/")
      ? parsed.ctaHref
      : defaults.ctaHref;
  const ctaLabel =
    typeof parsed.ctaLabel === "string" && parsed.ctaLabel.trim()
      ? parsed.ctaLabel.trim()
      : defaults.ctaLabel;

  return { subtitle, tips, ctaHref, ctaLabel };
}
