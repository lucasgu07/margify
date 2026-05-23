import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/server/auth-user";
import { readCostsForUserAsync, toCostsConfig, writeCostsForUser, type CostsConfigInput } from "@/lib/server/user-costs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const input = await readCostsForUserAsync(user.id);
  return NextResponse.json({ costsConfig: toCostsConfig(user.id, input) });
}

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Partial<CostsConfigInput>;
  try {
    body = (await req.json()) as Partial<CostsConfigInput>;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const current = await readCostsForUserAsync(user.id);
  const next: CostsConfigInput = {
    product_cost_percent: Number(body.product_cost_percent ?? current.product_cost_percent),
    payment_commission_percent: Number(
      body.payment_commission_percent ?? current.payment_commission_percent
    ),
    shipping_cost_fixed: Number(body.shipping_cost_fixed ?? current.shipping_cost_fixed),
    agency_fee_percent: Number(body.agency_fee_percent ?? current.agency_fee_percent),
  };

  if (
    !Number.isFinite(next.product_cost_percent) ||
    !Number.isFinite(next.payment_commission_percent) ||
    !Number.isFinite(next.shipping_cost_fixed) ||
    !Number.isFinite(next.agency_fee_percent)
  ) {
    return NextResponse.json({ error: "invalid_values" }, { status: 400 });
  }

  writeCostsForUser(user.id, next);
  return NextResponse.json({ ok: true, costsConfig: toCostsConfig(user.id, next) });
}

export async function PUT(req: Request) {
  return POST(req);
}
