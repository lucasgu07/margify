import { NextResponse } from "next/server";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import { getAppOrigin } from "@/lib/meta-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("auth_code") || searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  try {
    const response = await axios.post(
      "https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/",
      {
        app_id: process.env.TIKTOK_CLIENT_ID,
        secret: process.env.TIKTOK_CLIENT_SECRET,
        auth_code: code,
      }
    );

    const accessToken = response.data.data.access_token as string;
    const advertiserId = response.data.data.advertiser_ids?.[0] as string | undefined;

    if (url && serviceKey) {
      const supabase = createClient(url, serviceKey);
      await supabase.from("stores").insert({
        platform: "tiktok",
        api_token: accessToken,
        store_url: advertiserId ?? null,
        status: "connected",
        connected_at: new Date().toISOString(),
      });
    }

    const res = NextResponse.redirect(`${getAppOrigin()}/dashboard/configuracion?tiktok=connected`);
    res.cookies.set("tiktok_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return res;
  } catch {
    return NextResponse.redirect(
      `${getAppOrigin()}/dashboard/configuracion?tiktok=error`
    );
  }
}
