import { NextResponse } from 'next/server'
import { getPortfolioDb, isPortfolioAdmin, readPortfolioConfig, savePortfolioConfig } from '@/lib/live-portfolio'

export const runtime = 'nodejs'

function json(body, init) {
  return NextResponse.json(body, init)
}

export async function GET(request) {
  try {
    if (!isPortfolioAdmin(request)) return json({ error: 'unauthorized' }, { status: 401 })
    const db = await getPortfolioDb()
    const config = await readPortfolioConfig(db)
    return json(config)
  } catch (error) {
    const detail = String(error?.message || error)
    return json({ error: error?.code === 'DB_NOT_CONFIGURED' ? 'Database not configured' : 'Unable to load portfolio configuration', detail }, { status: error?.code === 'DB_NOT_CONFIGURED' ? 503 : 500 })
  }
}

export async function PUT(request) {
  try {
    if (!isPortfolioAdmin(request)) return json({ error: 'unauthorized' }, { status: 401 })
    const body = await request.json().catch(() => ({}))
    const db = await getPortfolioDb()
    const config = await savePortfolioConfig(db, body)
    return json({ ok: true, config })
  } catch (error) {
    const detail = String(error?.message || error)
    return json({ error: error?.code === 'DB_NOT_CONFIGURED' ? 'Database not configured' : 'Unable to save portfolio configuration', detail }, { status: error?.code === 'DB_NOT_CONFIGURED' ? 503 : 500 })
  }
}
