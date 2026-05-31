import Anthropic from "@anthropic-ai/sdk";
import { buildAdvisorContextBlock } from "@/lib/ai-advisor/build-context";
import { parseClaudeAdvisorResponse } from "@/lib/ai-advisor/parse-insights";
import { AI_ADVISOR_SYSTEM_PROMPT } from "@/lib/ai-advisor/system-prompt";
import type { AdvisorPage } from "@/lib/ai-advisor/types";
import type { AdvisorInsights } from "@/lib/ai-advisor-insights";
import type { Campaign, Order } from "@/types";

export async function generateClaudeAdvisorInsights(
  page: AdvisorPage,
  orders: Order[],
  campaigns: Campaign[],
  extras?: { alertHistory?: { message: string; alert_type: string; read: boolean }[] }
): Promise<AdvisorInsights> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) throw new Error("missing_anthropic_key");

  const context = buildAdvisorContextBlock(page, orders, campaigns, extras);
  const model = process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-20250514";

  const anthropic = new Anthropic({ apiKey });
  const message = await anthropic.messages.create({
    model,
    max_tokens: 900,
    temperature: 0.55,
    system: AI_ADVISOR_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Analizá estos datos y devolvé el JSON con 3 tips accionables:\n\n${context}`,
      },
    ],
  });

  const block = message.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("empty_claude_response");

  return parseClaudeAdvisorResponse(block.text, page);
}
