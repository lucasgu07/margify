import { createSupabaseAdminClient } from "@/lib/server/supabase-admin";
import type { InventoryStockRow, StockSource } from "@/lib/inventory/types";

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getInventoryStock(userId: string): Promise<InventoryStockRow[]> {
  const admin = createSupabaseAdminClient();
  if (!admin) return [];
  const { data, error } = await admin
    .from("inventory_stock")
    .select("*")
    .eq("user_id", userId)
    .order("product_name", { ascending: true });
  if (error || !data) return [];
  return data as InventoryStockRow[];
}

export async function getStockRow(
  userId: string,
  productName: string
): Promise<InventoryStockRow | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;
  const { data, error } = await admin
    .from("inventory_stock")
    .select("*")
    .eq("user_id", userId)
    .eq("product_name", productName)
    .maybeSingle();
  if (error || !data) return null;
  return data as InventoryStockRow;
}

// ─── Upsert ───────────────────────────────────────────────────────────────────

export type StockUpsertInput = {
  product_name: string;
  current_stock: number;
  reorder_point?: number;
  reorder_quantity?: number;
  supplier_lead_days?: number;
  cost_per_unit?: number | null;
  external_sku?: string | null;
  variant_label?: string | null;
  stock_source?: StockSource;
};

export async function upsertStockRow(
  userId: string,
  input: StockUpsertInput
): Promise<InventoryStockRow | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;
  const { data, error } = await admin
    .from("inventory_stock")
    .upsert(
      {
        user_id: userId,
        product_name: input.product_name,
        current_stock: input.current_stock,
        reorder_point: input.reorder_point ?? 10,
        reorder_quantity: input.reorder_quantity ?? 50,
        supplier_lead_days: input.supplier_lead_days ?? 7,
        cost_per_unit: input.cost_per_unit ?? null,
        external_sku: input.external_sku ?? null,
        variant_label: input.variant_label ?? null,
        stock_source: input.stock_source ?? "manual",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,product_name" }
    )
    .select("*")
    .single();
  if (error || !data) return null;
  return data as InventoryStockRow;
}

// ─── Log event ────────────────────────────────────────────────────────────────

export async function logInventoryEvent(
  userId: string,
  productName: string,
  eventType: "sale" | "restock" | "adjustment" | "sync",
  quantityDelta: number,
  quantityAfter?: number,
  note?: string,
  source: "system" | "manual" | "shopify" | "tiendanube" = "manual"
): Promise<void> {
  const admin = createSupabaseAdminClient();
  if (!admin) return;
  await admin.from("inventory_events").insert({
    user_id: userId,
    product_name: productName,
    event_type: eventType,
    quantity_delta: quantityDelta,
    quantity_after: quantityAfter ?? null,
    note: note ?? null,
    source,
  });
}
