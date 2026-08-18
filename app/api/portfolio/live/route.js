import { NextResponse } from 'next/server'
import { getLivePortfolio, getPortfolioDb } from '@/lib/live-portfolio'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const db = await getPortfolioDb()
    const payload = await getLivePortfolio(db)
    return NextResponse.json(payload, { headers: { 'Cache-Control': 'no-store, max-age=0' } })
  } catch (error) {
    const detail = String(error?.message || error)
    return NextResponse.json({ error: error?.code === 'DB_NOT_CONFIGURED' ? 'Database not configured' : 'Unable to load live portfolio', detail }, { status: error?.code === 'DB_NOT_CONFIGURED' ? 503 : 500 })
  }
}
