import { NextResponse } from 'next/server'
import { getPortfolioDb, getPortfolioHistory } from '@/lib/live-portfolio'

export const runtime = 'nodejs'

export async function GET(request) {
  try {
    const url = new URL(request.url)
    const symbol = url.searchParams.get('symbol') || ''
    const range = url.searchParams.get('range') || '3M'
    const db = await getPortfolioDb()
    const payload = await getPortfolioHistory(db, symbol, range)
    return NextResponse.json(payload, { headers: { 'Cache-Control': 'no-store, max-age=0' } })
  } catch (error) {
    const detail = String(error?.message || error)
    return NextResponse.json({ error: 'Unable to load price history', detail }, { status: 500 })
  }
}
