import { NextResponse } from 'next/server'
import axios from 'axios'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = cookies()
  const token = cookieStore.get('tiktok_token')?.value

  if (!token) {
    return NextResponse.json({ error: 'No token found' }, { status: 401 })
  }

  try {
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)

    const formatDate = (d: Date) => d.toISOString().split('T')[0]

    const response = await axios.get(
      'https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/',
      {
        headers: { 'Access-Token': token },
        params: {
          advertiser_id: '7636492357463719937',
          report_type: 'BASIC',
          dimensions: JSON.stringify(['stat_time_day']),
          metrics: JSON.stringify(['spend', 'impressions', 'clicks', 'conversion', 'cost_per_conversion']),
          start_date: formatDate(thirtyDaysAgo),
          end_date: formatDate(today),
          page_size: 30,
          data_level: 'AUCTION_ADVERTISER',
        },
      }
    )

    return NextResponse.json(response.data)

  } catch (error) {
    return NextResponse.json({ error: 'Error fetching stats' }, { status: 500 })
  }
}
