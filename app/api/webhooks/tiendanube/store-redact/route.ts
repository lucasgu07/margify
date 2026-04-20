import { NextResponse } from "next/server";
import { verifyTiendanubeWebhookHmac } from "@/lib/tiendanube-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const raw = await request.text();
  const hmac = request.headers.get("x-linkedstore-hmac-sha256");
  const secret = process.env.TIENDANUBE_CLIENT_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }
  if (!verifyTiendanubeWebhookHmac(raw, hmac, secret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    payload = raw;
  }
  console.log("[tiendanube webhook store/redact]", payload);
  return NextResponse.json({ ok: true });
}
