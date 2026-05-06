import { NextResponse } from "next/server"
import axios from "axios"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 })
  }

  try {
    const response = await axios.post(
      "https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/",
      {
        app_id: process.env.TIKTOK_CLIENT_ID,
        secret: process.env.TIKTOK_CLIENT_SECRET,
        auth_code: code,
      }
    )

    const accessToken = response.data.data.access_token
    const advertiserId = response.data.data.advertiser_ids?.[0]

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    await supabase.from("stores").insert({
      platform: "tiktok",
      api_token: accessToken,
      store_url: advertiserId,
      status: "connected",
      connected_at: new Date().toISOString(),
    })

    const res = NextResponse.redirect("https://www.margify.app/dashboard")
    res.cookies.set("tiktok_token", accessToken, {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24 * 30,
    })

    return res

  } catch (error) {
    return NextResponse.json({ error: "Error getting token" }, { status: 500 })
  }
}import { NextResponse } from "next/server"
import axios from "axios"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("auth_code") || searchParams.get("code")

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 })
  }

  try {
    const response = await axios.post(
      "https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/",
      {
        app_id: process.env.TIKTOK_CLIENT_ID,
        secret: process.env.TIKTOK_CLIENT_SECRET,
        auth_code: code,
      }
    )

    const accessToken = response.data.data.access_token
    const advertiserId = response.data.data.advertiser_ids?.[0]

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    await supabase.from("stores").insert({
      platform: "tiktok",
      api_token: accessToken,
      store_url: advertiserId,
      status: "connected",
      connected_at: new Date().toISOString(),
    })

    const res = NextResponse.redirect("https://www.margify.app/dashboard")
    res.cookies.set("tiktok_token", accessToken, {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24 * 30,
    })

    return res

  } catch (error) {
    return NextResponse.json({ error: "Error getting token" }, { status: 500 })
  }
}