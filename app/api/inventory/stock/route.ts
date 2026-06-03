import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/server/auth-user";
import { getInventoryStock, upsertStockRow, logInventoryEvent } from "@/lib/inventory/store";
import type { StockUpsertInput } from "@/lib/inventory/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ status: "error", message: "No autorizado" }, { status: 401 });
  }
  const rows = await getInventoryStock(authUser.id);
  return NextResponse.json({ rows });
}

export async function PUT(request: Request) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ status: "error", message: "No autorizado" }, { status: 401 });
  }

  let body: StockUpsertInput;
  try {
    body = (await request.json()) as StockUpsertInput;
  } catch {
    return NextResponse.json({ status: "error", message: "Body inválido" }, { status: 400 });
  }

  if (!body.product_name) {
    return NextResponse.json(
      { status: "error", message: "product_name es requerido" },
      { status: 400 }
    );
  }

  if (typeof body.current_stock !== "number" || body.current_stock < 0) {
    return NextResponse.json(
      { status: "error", message: "current_stock debe ser un número >= 0" },
      { status: 400 }
    );
  }

  const updated = await upsertStockRow(authUser.id, body);
  if (!updated) {
    return NextResponse.json(
      { status: "error", message: "No se pudo actualizar el stock" },
      { status: 500 }
    );
  }

  // Log the manual adjustment
  await logInventoryEvent(
    authUser.id,
    body.product_name,
    "adjustment",
    body.current_stock,
    body.current_stock,
    "Actualización manual",
    "manual"
  );

  return NextResponse.json({ status: "ok", row: updated });
}
