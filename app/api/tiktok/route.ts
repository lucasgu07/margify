import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = '7635922910925815825'
  const redirectUri = encodeURIComponent('https://couch-saffron-relic.ngrok-free.dev/api/tiktok/callback')

  const url = `https://business-api.tiktok.com/portal/auth?app_id=${clientId}&redirect_uri=${redirectUri}&state=margify_secure_state`

  return NextResponse.redirect(url)
}

