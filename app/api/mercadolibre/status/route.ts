import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ML_TOKEN_COOKIE } from "@/lib/mercadolibre-auth";

type Session = {
  access_token: string;
  refresh_token?: string | null;
  user_id?: number | null;
  expires_in?: number | null;
  obtained_at?: number;
};

/**
 * Estado de la conexión Mercado Libre (cookie httpOnly).
 * GET /api/mercadolibre/status
 */
export async function GET() {
  const appIdConfigured = Boolean(process.env.MERCADOLIBRE_APP_ID?.trim());

  if (!appIdConfigured) {
    return NextResponse.json({
      configured: false,
      connected: false,
      message: "Falta MERCADOLIBRE_APP_ID en el servidor.",
    });
  }

  const raw = cookies().get(ML_TOKEN_COOKIE)?.value;
  if (!raw) {
    return NextResponse.json({
      configured: true,
      connected: false,
    });
  }

  try {
    const session = JSON.parse(raw) as Session;
    if (!session.access_token) {
      return NextResponse.json({ configured: true, connected: false });
    }
    return NextResponse.json({
      configured: true,
      connected: true,
      userId: session.user_id ?? null,
    });
  } catch {
    return NextResponse.json({ configured: true, connected: false });
  }
}
