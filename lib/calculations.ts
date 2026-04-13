/**
 * Ganancia por orden (incluye fee de agencia sobre ads atribuidos si aplica).
 */
export function orderProfit(params: {
  revenue: number;
  product_cost: number;
  shipping_cost: number;
  payment_commission: number;
  ads_spend_attributed?: number;
  agency_fee_percent?: number;
}) {
  const ads = params.ads_spend_attributed ?? 0;
  const agencyFee =
    ((params.agency_fee_percent ?? 0) / 100) * ads;
  return (
    params.revenue -
    params.product_cost -
    params.shipping_cost -
    params.payment_commission -
    ads -
    agencyFee
  );
}

/** Margen porcentual */
export function marginPercent(profit: number, revenue: number) {
  if (revenue <= 0) return 0;
  return (profit / revenue) * 100;
}

/** ROAS real */
export function realRoas(attributedRevenue: number, adSpend: number) {
  if (adSpend <= 0) return 0;
  return attributedRevenue / adSpend;
}

/** Días hábiles aproximados (lun–vie) desde una fecha */
export function addBusinessDays(from: Date, businessDays: number): Date {
  const d = new Date(from);
  let added = 0;
  while (added < businessDays) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return d;
}

/**
 * Cashflow proyectado por medio de pago:
 * - Mercado Pago cuotas: ~14 días hábiles
 * - Tarjeta débito: ~2 días hábiles
 * - Efectivo: inmediato
 */
export function costTotalsFromOrders(
  orders: {
    product_cost: number;
    shipping_cost: number;
    payment_commission: number;
    ads_spend_attributed?: number;
  }[]
) {
  return orders.reduce(
    (acc, o) => {
      acc.product += o.product_cost;
      acc.shipping += o.shipping_cost;
      acc.payment += o.payment_commission;
      acc.ads += o.ads_spend_attributed ?? 0;
      return acc;
    },
    { product: 0, shipping: 0, payment: 0, ads: 0 }
  );
}

export function estimatedPayoutDate(
  saleDate: Date,
  paymentMethod: "Mercado Pago" | "Tarjeta" | "Efectivo"
): Date {
  if (paymentMethod === "Efectivo") return new Date(saleDate);
  if (paymentMethod === "Tarjeta") return addBusinessDays(saleDate, 2);
  return addBusinessDays(saleDate, 14);
}
