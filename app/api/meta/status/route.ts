import { NextResponse } from "next/server";

/** Versión estable reciente del Graph API; ajustable si Meta lo requiere. */
const GRAPH_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

/**
 * Comprueba que META_ACCESS_TOKEN esté configurado y sea válido.
 * El token va en .env.local — no lo pegues en el código ni en el chat.
 *
 * GET /api/meta/status
 */
export async function GET() {
  const token = process.env.META_ACCESS_TOKEN?.trim();

  if (!token) {
    return NextResponse.json(
      {
        configured: false,
        message:
          "Falta META_ACCESS_TOKEN. Creá .env.local en la raíz del proyecto y agregá: META_ACCESS_TOKEN=tu_token (mirá .env.example). Reiniciá npm run dev.",
      },
      { status: 200 }
    );
  }

  const headers = { Authorization: `Bearer ${token}` };

  const meRes = await fetch(`${GRAPH_BASE}/me?fields=id,name`, { headers });
  const meData: { id?: string; name?: string; error?: { message: string; code?: number } } =
    await meRes.json();

  if (meData.error) {
    return NextResponse.json(
      {
        configured: true,
        valid: false,
        error: meData.error.message,
        hint:
          "El token puede estar vencido, revocado o sin permisos. Generá uno nuevo en Meta o revisá la app en developers.facebook.com.",
      },
      { status: 400 }
    );
  }

  const adRes = await fetch(
    `${GRAPH_BASE}/me/adaccounts?fields=id,name,account_id&limit=15`,
    { headers }
  );
  const adData: {
    data?: { id: string; name?: string; account_id?: string }[];
    error?: { message: string };
  } = await adRes.json();

  return NextResponse.json({
    configured: true,
    valid: true,
    user: { id: meData.id, name: meData.name },
    adAccounts:
      adData.data?.map((a) => ({
        id: a.id,
        name: a.name ?? null,
        account_id: a.account_id ?? null,
      })) ?? [],
    adAccountsNote: adData.error?.message
      ? `No se pudieron listar cuentas publicitarias: ${adData.error.message}`
      : undefined,
  });
}
