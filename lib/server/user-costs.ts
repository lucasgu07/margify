import { cookies } from "next/headers";
import type { CostsConfig } from "@/types";
import { mockCostsConfig } from "@/lib/mock-data";
import { readCostsFromDb, writeCostsToDb } from "@/lib/server/user-costs-db";

export const MARGIFY_COSTS_COOKIE = "margify_user_costs";

export type CostsConfigInput = {
  product_cost_percent: number;
  payment_commission_percent: number;
  shipping_cost_fixed: number;
  agency_fee_percent: number;
};

type CostsStore = Record<string, CostsConfigInput>;

function parseStore(raw: string | undefined): CostsStore {
  if (!raw) return {};
  try {
    const o = JSON.parse(raw) as CostsStore;
    return o && typeof o === "object" ? o : {};
  } catch {
    return {};
  }
}

export function defaultCostsInput(): CostsConfigInput {
  return {
    product_cost_percent: mockCostsConfig.product_cost_percent,
    payment_commission_percent: mockCostsConfig.payment_commission_percent,
    shipping_cost_fixed: mockCostsConfig.shipping_cost_fixed,
    agency_fee_percent: mockCostsConfig.agency_fee_percent,
  };
}

export function readCostsForUser(userId: string): CostsConfigInput {
  return readCostsForUserSync(userId);
}

/** Sync read from cookie only (legacy). Prefer `readCostsForUserAsync`. */
export function readCostsForUserSync(userId: string): CostsConfigInput {
  const store = parseStore(cookies().get(MARGIFY_COSTS_COOKIE)?.value);
  const row = store[userId];
  if (!row) return defaultCostsInput();
  return {
    product_cost_percent: Number(row.product_cost_percent) || defaultCostsInput().product_cost_percent,
    payment_commission_percent:
      Number(row.payment_commission_percent) || defaultCostsInput().payment_commission_percent,
    shipping_cost_fixed: Number(row.shipping_cost_fixed) || defaultCostsInput().shipping_cost_fixed,
    agency_fee_percent: Number(row.agency_fee_percent) ?? defaultCostsInput().agency_fee_percent,
  };
}

/** Lee costos: Supabase primero, cookie como respaldo. */
export async function readCostsForUserAsync(userId: string): Promise<CostsConfigInput> {
  const fromDb = await readCostsFromDb(userId);
  if (fromDb) return fromDb;
  return readCostsForUserSync(userId);
}

export function toCostsConfig(userId: string, input: CostsConfigInput): CostsConfig {
  return {
    id: `costs-${userId}`,
    user_id: userId,
    ...input,
  };
}

export function writeCostsForUser(userId: string, input: CostsConfigInput): void {
  const normalized = {
    product_cost_percent: Math.min(100, Math.max(0, input.product_cost_percent)),
    payment_commission_percent: Math.min(100, Math.max(0, input.payment_commission_percent)),
    shipping_cost_fixed: Math.max(0, input.shipping_cost_fixed),
    agency_fee_percent: Math.min(100, Math.max(0, input.agency_fee_percent)),
  };
  const store = parseStore(cookies().get(MARGIFY_COSTS_COOKIE)?.value);
  store[userId] = normalized;
  cookies().set(MARGIFY_COSTS_COOKIE, JSON.stringify(store), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
    secure: process.env.NODE_ENV === "production",
  });
  void writeCostsToDb(userId, normalized);
}
