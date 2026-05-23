import type { Subscription } from "dodopayments/resources/subscriptions";
import type { Payment } from "dodopayments/resources/payments";
import {
  billingAnnualFromProductId,
  computeTrialEndsAt,
  defaultTrialEndsAt,
  planTierFromProductId,
  type BillingStatus,
  type UserBillingMeta,
} from "@/lib/dodo-billing";
import { createSupabaseAdminClient } from "@/lib/server/supabase-admin";

export type { UserBillingMeta };

function subscriptionStatusToBilling(status: Subscription["status"]): BillingStatus {
  switch (status) {
    case "active":
      return "active";
    case "on_hold":
      return "on_hold";
    case "cancelled":
    case "expired":
      return "cancelled";
    case "pending":
      return "trialing";
    default:
      return "none";
  }
}

export async function findUserIdByEmail(email: string): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;
  const normalized = email.trim().toLowerCase();
  let page = 1;
  const perPage = 200;
  for (let i = 0; i < 10; i++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error || !data.users.length) break;
    const match = data.users.find((u) => u.email?.toLowerCase() === normalized);
    if (match) return match.id;
    if (data.users.length < perPage) break;
    page += 1;
  }
  return null;
}

export async function mergeUserBillingMetadata(
  userId: string,
  patch: Partial<UserBillingMeta>
): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  if (!admin) return false;

  const { data: userData, error: getError } = await admin.auth.admin.getUserById(userId);
  if (getError || !userData.user) return false;

  const current = (userData.user.user_metadata ?? {}) as UserBillingMeta;
  const next: UserBillingMeta = {
    ...current,
    ...patch,
    last_dodo_sync_at: new Date().toISOString(),
  };

  const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: next,
  });
  return !updateError;
}

export async function mergeUserBillingByEmail(
  email: string,
  patch: Partial<UserBillingMeta>
): Promise<boolean> {
  const userId = await findUserIdByEmail(email);
  if (!userId) return false;
  return mergeUserBillingMetadata(userId, patch);
}

export function billingPatchFromSubscription(sub: Subscription): Partial<UserBillingMeta> {
  const tier = planTierFromProductId(sub.product_id);
  const trialEnds =
    sub.trial_period_days > 0
      ? computeTrialEndsAt(sub.created_at, sub.trial_period_days)
      : null;

  let status = subscriptionStatusToBilling(sub.status);
  if (status === "active" && trialEnds && Date.now() < Date.parse(trialEnds)) {
    status = "trialing";
  }

  return {
    billing_status: status,
    billing_plan: tier ?? undefined,
    billing_annual: billingAnnualFromProductId(sub.product_id),
    selected_plan: tier === "scale" ? "scale" : tier === "growth" ? "pro" : undefined,
    trial_ends_at: trialEnds,
    current_period_end: sub.next_billing_date,
    dodo_subscription_id: sub.subscription_id,
    dodo_customer_id: sub.customer.customer_id,
    dodo_product_id: sub.product_id,
    last_dodo_event: "subscription.sync",
  };
}

export function billingPatchFromPayment(payment: Payment): Partial<UserBillingMeta> {
  const productId =
    payment.product_cart?.[0]?.product_id ?? payment.metadata?.product_id ?? null;
  const tier = planTierFromProductId(productId);

  return {
    billing_status: "active",
    billing_plan: tier ?? undefined,
    billing_annual: billingAnnualFromProductId(productId),
    selected_plan: tier === "scale" ? "scale" : tier === "growth" ? "pro" : undefined,
    dodo_customer_id: payment.customer.customer_id,
    dodo_product_id: productId ?? undefined,
    dodo_subscription_id: payment.subscription_id ?? undefined,
    last_dodo_event: "payment.succeeded",
  };
}

export function billingPatchFromActivateReturn(productId: string): Partial<UserBillingMeta> {
  const tier = planTierFromProductId(productId);
  return {
    billing_status: "trialing",
    billing_plan: tier ?? "growth",
    billing_annual: billingAnnualFromProductId(productId),
    selected_plan: tier === "scale" ? "scale" : "pro",
    trial_ends_at: defaultTrialEndsAt(7),
    dodo_product_id: productId,
    last_dodo_event: "checkout.return",
  };
}

export async function applySubscriptionWebhook(sub: Subscription, eventType: string): Promise<void> {
  const email = sub.customer.email?.trim();
  if (!email) return;

  let patch = billingPatchFromSubscription(sub);
  patch.last_dodo_event = eventType;

  if (
    eventType === "subscription.cancelled" ||
    eventType === "subscription.expired" ||
    eventType === "subscription.on_hold" ||
    eventType === "subscription.failed"
  ) {
    patch = {
      ...patch,
      billing_status:
        eventType === "subscription.on_hold"
          ? "on_hold"
          : eventType === "subscription.failed"
            ? "past_due"
            : "cancelled",
      selected_plan: "free",
    };
  }

  const userId = sub.metadata?.supabase_user_id;
  if (userId) {
    await mergeUserBillingMetadata(userId, patch);
    return;
  }
  await mergeUserBillingByEmail(email, patch);
}

export async function applyPaymentSucceededWebhook(payment: Payment): Promise<void> {
  const email = payment.customer.email?.trim();
  if (!email) return;

  const patch = billingPatchFromPayment(payment);
  const userId = payment.metadata?.supabase_user_id;
  if (userId) {
    await mergeUserBillingMetadata(userId, patch);
    return;
  }
  await mergeUserBillingByEmail(email, patch);
}

export async function applyPaymentFailedWebhook(payment: Payment): Promise<void> {
  const email = payment.customer.email?.trim();
  if (!email) return;
  const patch: Partial<UserBillingMeta> = {
    billing_status: "past_due",
    last_dodo_event: "payment.failed",
    dodo_customer_id: payment.customer.customer_id,
    dodo_subscription_id: payment.subscription_id ?? undefined,
  };
  const userId = payment.metadata?.supabase_user_id;
  if (userId) {
    await mergeUserBillingMetadata(userId, patch);
    return;
  }
  await mergeUserBillingByEmail(email, patch);
}
