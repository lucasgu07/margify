import { NextResponse } from 'next/server'
import axios from 'axios'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 })
  }

  try {
    const response = await axios.post(
      'https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/',
      {
        app_id: process.env.TIKTOK_CLIENT_ID,
        secret: process.env.TIKTOK_CLIENT_SECRET,
        auth_code: code,
      }
    )

    const accessToken = response.data.data.access_token

    // Guardamos el token en una cookie segura
    const res = NextResponse.redirect('http://localhost:3000/dashboard')
    res.cookies.set('tiktok_token', accessToken, {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24, // 1 día
    })

    return res

  } catch (error) {
    return NextResponse.json({ error: 'Error getting token' }, { status: 500 })
  }
}