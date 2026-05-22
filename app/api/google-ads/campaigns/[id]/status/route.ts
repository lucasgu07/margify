import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { GoogleAdsApi, enums } from "google-ads-api";
import {
  GOOGLE_ADS_COOKIE,
  normalizeCustomerId,
  parseGoogleAdsSession,
} from "@/lib/google-ads";

export const runtime = "nodejs";

type Body = { status?: "ENABLED" | "PAUSED" };

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const campaignId = params.id?.trim();
  if (!campaignId) {
    return NextResponse.json({ error: "missing_campaign_id" }, { status: 400 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const status = body.status;
  if (status !== "ENABLED" && status !== "PAUSED") {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_ADS_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET?.trim();
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN?.trim();

  if (!clientId || !clientSecret || !developerToken) {
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  const session = parseGoogleAdsSession(cookies().get(GOOGLE_ADS_COOKIE)?.value);
  if (!session?.refresh_token) {
    return NextResponse.json({ error: "not_connected" }, { status: 401 });
  }

  const customerId =
    normalizeCustomerId(session.customer_id) ||
    normalizeCustomerId(process.env.GOOGLE_ADS_CUSTOMER_ID);
  if (!customerId) {
    return NextResponse.json({ error: "no_customer_id" }, { status: 400 });
  }

  const loginCustomerId =
    normalizeCustomerId(session.login_customer_id) ||
    normalizeCustomerId(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID);

  try {
    const client = new GoogleAdsApi({
      client_id: clientId,
      client_secret: clientSecret,
      developer_token: developerToken,
    });
    const customer = client.Customer({
      customer_id: customerId,
      refresh_token: session.refresh_token,
      ...(loginCustomerId ? { login_customer_id: loginCustomerId } : {}),
    });

    const campaignStatus =
      status === "ENABLED"
        ? enums.CampaignStatus.ENABLED
        : enums.CampaignStatus.PAUSED;

    await customer.campaigns.update([
      {
        resource_name: `customers/${customerId}/campaigns/${campaignId}`,
        status: campaignStatus,
      },
    ]);

    return NextResponse.json({ ok: true, id: campaignId, status });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "google_update_failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
