import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/server/auth-user";
import { saveDecision } from "@/lib/ai-advisor/recommendations-store";
import type { DecisionType, RecommendationCategory } from "@/lib/ai-advisor/recommendation-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DecisionBody = {
  recommendationTitle: string;
  recommendationCategory?: RecommendationCategory;
  decision: DecisionType;
};

export async function POST(request: Request) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ status: "error", message: "No autorizado" }, { status: 401 });
  }

  let body: DecisionBody;
  try {
    body = (await request.json()) as DecisionBody;
  } catch {
    return NextResponse.json({ status: "error", message: "Body inválido" }, { status: 400 });
  }

  const { recommendationTitle, recommendationCategory, decision } = body;

  if (!recommendationTitle || !decision) {
    return NextResponse.json(
      { status: "error", message: "recommendationTitle y decision son requeridos" },
      { status: 400 }
    );
  }

  if (decision !== "applied" && decision !== "dismissed") {
    return NextResponse.json(
      { status: "error", message: "decision debe ser 'applied' o 'dismissed'" },
      { status: 400 }
    );
  }

  const saved = await saveDecision(authUser.id, {
    recommendationTitle,
    recommendationCategory,
    decision,
    decidedAt: new Date().toISOString(),
  });

  if (!saved) {
    return NextResponse.json(
      { status: "error", message: "No se pudo guardar la decisión" },
      { status: 500 }
    );
  }

  return NextResponse.json({ status: "ok" });
}
