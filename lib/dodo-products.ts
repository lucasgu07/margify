/** Product IDs de Dodo Payments para planes Margify. */
export const DODO_PRODUCT_IDS = {
  pro: {
    monthly: "pdt_0NfQMFrogbkuClvBg5u5E",
    annual: "pdt_0NfQMnMX7dB9GndimOg68",
  },
  scale: {
    monthly: "pdt_0NfQNyqwpSJcyhaGtZgoj",
    annual: "pdt_0NfQOGgSSl54tlwyxaxl3",
  },
} as const;

const ALLOWED = new Set<string>([
  DODO_PRODUCT_IDS.pro.monthly,
  DODO_PRODUCT_IDS.pro.annual,
  DODO_PRODUCT_IDS.scale.monthly,
  DODO_PRODUCT_IDS.scale.annual,
]);

export function getProDodoProductId(billingAnnual: boolean): string {
  return billingAnnual ? DODO_PRODUCT_IDS.pro.annual : DODO_PRODUCT_IDS.pro.monthly;
}

export function getScaleDodoProductId(billingAnnual: boolean): string {
  return billingAnnual ? DODO_PRODUCT_IDS.scale.annual : DODO_PRODUCT_IDS.scale.monthly;
}

export function isAllowedDodoProductId(productId: string): boolean {
  return ALLOWED.has(productId);
}
