import DodoPayments from "dodopayments";
import { getAppOrigin } from "@/lib/google-ads";

export function getDodoPaymentsClient(): DodoPayments {
  const bearerToken = process.env.DODO_PAYMENTS_API_KEY?.trim();
  if (!bearerToken) {
    throw new Error("missing_dodo_api_key");
  }

  const environment =
    process.env.DODO_PAYMENTS_ENV?.trim() === "test_mode" ? "test_mode" : "live_mode";

  return new DodoPayments({ bearerToken, environment });
}

export function getDodoCheckoutReturnUrl(): string {
  return `${getAppOrigin()}/dashboard?checkout=success`;
}

export function getDodoCheckoutCancelUrl(): string {
  return `${getAppOrigin()}/#planes`;
}
