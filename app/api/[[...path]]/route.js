import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { createHash, timingSafeEqual } from 'crypto'
import { getSupabase, ensureBucket, BUCKET, categoryFromMime, slugifyName } from '@/lib/supabase'
import { SEED_CONTENT } from '@/lib/portfolio-data'

export const runtime = 'nodejs'

let client
let db
let marketCache = { key: '', at: 0, payload: null }

const REQUESTED_ADMIN_PASSWORD_HASH = '58f67ecff7dae550c76dc6ea5192ed1475317f655c13232c1151e39bb3708657'
const MARKET_PROVIDERS = new Set(['twelvedata', 'alphavantage'])

function sha256(value = '') {
  return createHash('sha256').update(String(value)).digest('hex')
}

function expectedAdminHash() {
  if (process.env.ADMIN_PASSWORD_HASH) return String(process.env.ADMIN_PASSWORD_HASH).trim().toLowerCase()
  if (process.env.ADMIN_PASSWORD) return sha256(process.env.ADMIN_PASSWORD)
  // Safe-ish fallback: the requested password is not committed in plaintext.
  // For production, set ADMIN_PASSWORD (or ADMIN_PASSWORD_HASH) in the deployment environment.
  return REQUESTED_ADMIN_PASSWORD_HASH
}

function verifyAdminSecret(candidate) {
  if (!candidate || typeof candidate !== 'string') return false
  const actual = Buffer.from(sha256(candidate), 'hex')
  const expected = Buffer.from(expectedAdminHash(), 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

function requireAdmin(request) {
  return verifyAdminSecret(request.headers.get('x-admin-token'))
}

async function getDb() {
  if (db) return db
  const mongoUrl = process.env.MONGO_URL
  const dbName = process.env.DB_NAME
  if (!mongoUrl || !dbName) {
    const err = new Error('Database is not configured. Set MONGO_URL and DB_NAME in the deployment environment.')
    err.code = 'DB_NOT_CONFIGURED'
    throw err
  }
  if (!client) {
    client = new MongoClient(mongoUrl, { serverSelectionTimeoutMS: 8000 })
    await client.connect()
  }
  db = client.db(dbName)
  return db
}

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

function json(body, init) {
  return handleCORS(NextResponse.json(body, init))
}

function unauthorized() {
  return json({ error: 'unauthorized' }, { status: 401 })
}

function sanitizeSymbols(input) {
  const raw = Array.isArray(input) ? input : String(input || '').split(',')
  return [...new Set(raw.map((s) => String(s).trim().toUpperCase()).filter(Boolean))].slice(0, 12)
}

function maskKey(key) {
  if (!key) return ''
  if (key.length <= 8) return '••••••••'
  return `${key.slice(0, 3)}••••••${key.slice(-3)}`
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 9000)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal, cache: 'no-store' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.message || data?.error || `Market provider returned HTTP ${res.status}`)
    return data
  } finally {
    clearTimeout(timeout)
  }
}

async function fetchTwelveDataQuote(symbol, apiKey) {
  const url = new URL('https://api.twelvedata.com/quote')
  url.searchParams.set('symbol', symbol)
  url.searchParams.set('apikey', apiKey)
  const data = await fetchJson(url)
  if (data?.status === 'error' || data?.code) throw new Error(data?.message || `No quote returned for ${symbol}`)
  const price = Number(data?.close ?? data?.price)
  const previousClose = Number(data?.previous_close)
  const percentChange = Number(data?.percent_change)
  const change = Number(data?.change)
  if (!Number.isFinite(price)) throw new Error(`No live/latest price returned for ${symbol}`)
  return {
    symbol: data?.symbol || symbol,
    name: data?.name || symbol,
    exchange: data?.exchange || '',
    currency: data?.currency || '',
    price,
    previousClose: Number.isFinite(previousClose) ? previousClose : null,
    change: Number.isFinite(change) ? change : null,
    percentChange: Number.isFinite(percentChange) ? percentChange : null,
    timestamp: data?.datetime || (data?.timestamp ? new Date(Number(data.timestamp) * 1000).toISOString() : null),
    extendedHours: !!data?.is_extended_hours,
  }
}

async function fetchAlphaVantageQuote(symbol, apiKey) {
  const url = new URL('https://www.alphavantage.co/query')
  url.searchParams.set('function', 'GLOBAL_QUOTE')
  url.searchParams.set('symbol', symbol)
  url.searchParams.set('apikey', apiKey)
  const data = await fetchJson(url)
  if (data?.Note || data?.Information || data?.['Error Message']) {
    throw new Error(data.Note || data.Information || data['Error Message'])
  }
  const q = data?.['Global Quote'] || {}
  const price = Number(q['05. price'])
  const previousClose = Number(q['08. previous close'])
  const change = Number(q['09. change'])
  const percentChange = Number(String(q['10. change percent'] || '').replace('%', ''))
  if (!Number.isFinite(price)) throw new Error(`No quote returned for ${symbol}`)
  return {
    symbol: q['01. symbol'] || symbol,
    name: symbol,
    exchange: '',
    currency: '',
    price,
    previousClose: Number.isFinite(previousClose) ? previousClose : null,
    change: Number.isFinite(change) ? change : null,
    percentChange: Number.isFinite(percentChange) ? percentChange : null,
    timestamp: q['07. latest trading day'] || null,
    extendedHours: false,
  }
}

async function fetchProviderQuote(provider, symbol, apiKey) {
  if (provider === 'alphavantage') return fetchAlphaVantageQuote(symbol, apiKey)
  return fetchTwelveDataQuote(symbol, apiKey)
}

async function readMarketConfig(database) {
  const stored = await database.collection('site_settings').findOne({ id: 'market' })
  return {
    provider: MARKET_PROVIDERS.has(stored?.provider) ? stored.provider : 'twelvedata',
    apiKey: stored?.apiKey || process.env.MARKET_API_KEY || '',
    symbols: sanitizeSymbols(stored?.symbols?.length ? stored.symbols : (process.env.MARKET_SYMBOLS || 'AAPL,MSFT,GOOGL')),
    refreshSeconds: Math.min(3600, Math.max(15, Number(stored?.refreshSeconds || 60))),
    updatedAt: stored?.updatedAt || null,
  }
}

async function getMarketPayload(database, force = false) {
  const config = await readMarketConfig(database)
  if (!config.apiKey) {
    return {
      configured: false,
      provider: config.provider,
      symbols: config.symbols,
      refreshSeconds: config.refreshSeconds,
      quotes: [],
      error: 'Market API key is not configured. Add it in Admin → Market API.',
    }
  }

  const cacheKey = `${config.provider}|${config.symbols.join(',')}`
  const ttl = Math.max(15, Math.min(config.refreshSeconds, 300)) * 1000
  if (!force && marketCache.payload && marketCache.key === cacheKey && Date.now() - marketCache.at < ttl) {
    return marketCache.payload
  }

  const results = await Promise.allSettled(config.symbols.map((symbol) => fetchProviderQuote(config.provider, symbol, config.apiKey)))
  const quotes = []
  const errors = []
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') quotes.push(result.value)
    else errors.push({ symbol: config.symbols[index], error: String(result.reason?.message || result.reason) })
  })

  const payload = {
    configured: true,
    provider: config.provider,
    symbols: config.symbols,
    refreshSeconds: config.refreshSeconds,
    quotes,
    errors,
    fetchedAt: new Date().toISOString(),
  }
  if (quotes.length) marketCache = { key: cacheKey, at: Date.now(), payload }
  return payload
}

export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

async function handleRoute(request, { params }) {
  const { path = [] } = await params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    // Routes that MUST NOT depend on MongoDB. This fixes the admin-login 500
    // when database environment variables are missing or temporarily unavailable.
    if ((route === '/' || route === '/root') && method === 'GET') {
      return json({
        message: 'Portfolio API online',
        ts: Date.now(),
        databaseConfigured: !!(process.env.MONGO_URL && process.env.DB_NAME),
        marketApiConfigured: !!process.env.MARKET_API_KEY,
      })
    }

    if (route === '/admin/login' && method === 'POST') {
      const body = await request.json().catch(() => ({}))
      if (verifyAdminSecret(body?.password)) {
        // The token is re-verified server-side on every protected request.
        return json({ ok: true, token: body.password })
      }
      return json({ error: 'invalid password' }, { status: 401 })
    }

    const database = await getDb()

    // ---------------- Contact ----------------
    if (route === '/contact' && method === 'POST') {
      const body = await request.json()
      if (!body.email || !body.message) return json({ error: 'email and message are required' }, { status: 400 })
      const record = {
        id: uuidv4(),
        name: body.name || '',
        email: body.email,
        company: body.company || '',
        role: body.role || '',
        message: body.message,
        recruiterMode: !!body.recruiterMode,
        createdAt: new Date(),
      }
      await database.collection('contact_requests').insertOne(record)
      const { _id, ...safe } = record
      return json({ ok: true, request: safe })
    }

    if (route === '/contact' && method === 'GET') {
      if (!requireAdmin(request)) return unauthorized()
      const docs = await database.collection('contact_requests').find({}).sort({ createdAt: -1 }).limit(100).toArray()
      return json(docs.map(({ _id, ...r }) => r))
    }

    // ---------------- Files ----------------
    if (route === '/files/upload' && method === 'POST') {
      if (!requireAdmin(request)) return unauthorized()
      await ensureBucket()
      const supabase = getSupabase()
      const form = await request.formData()
      const file = form.get('file')
      const projectId = form.get('projectId') || null
      const projectTitle = form.get('projectTitle') || null
      const label = form.get('label') || null

      if (!file || typeof file === 'string') return json({ error: 'file is required' }, { status: 400 })
      const originalName = file.name || 'upload.bin'
      const mimeType = file.type || 'application/octet-stream'
      const size = file.size || 0
      if (size > 50 * 1024 * 1024) return json({ error: 'file exceeds 50MB' }, { status: 413 })

      const buffer = Buffer.from(await file.arrayBuffer())
      const id = uuidv4()
      const safeName = slugifyName(originalName)
      const key = `${projectId || 'unassigned'}/${Date.now()}-${id.slice(0, 8)}-${safeName}`
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(key, buffer, { contentType: mimeType, upsert: false })
      if (upErr) return json({ error: 'storage upload failed', detail: upErr.message }, { status: 502 })

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(key)
      const record = {
        id,
        originalName,
        label: label || originalName,
        mimeType,
        size,
        category: categoryFromMime(mimeType, originalName),
        storageKey: key,
        publicUrl: pub?.publicUrl,
        projectId: projectId || null,
        projectTitle: projectTitle || null,
        createdAt: new Date(),
      }
      await database.collection('files').insertOne(record)
      const { _id, ...safe } = record
      return json({ ok: true, file: safe }, { status: 201 })
    }

    if (route === '/files' && method === 'GET') {
      const url = new URL(request.url)
      const projectId = url.searchParams.get('projectId')
      const docs = await database.collection('files').find(projectId ? { projectId } : {}).sort({ createdAt: -1 }).limit(500).toArray()
      return json(docs.map(({ _id, ...r }) => r))
    }

    if (route.startsWith('/files/') && method === 'DELETE') {
      if (!requireAdmin(request)) return unauthorized()
      const id = route.replace('/files/', '')
      const doc = await database.collection('files').findOne({ id })
      if (!doc) return json({ error: 'not found' }, { status: 404 })
      const supabase = getSupabase()
      const { error: rmErr } = await supabase.storage.from(BUCKET).remove([doc.storageKey])
      if (rmErr) console.error('Supabase delete error:', rmErr)
      await database.collection('files').deleteOne({ id })
      return json({ ok: true })
    }

    if (route.startsWith('/files/') && method === 'PATCH') {
      if (!requireAdmin(request)) return unauthorized()
      const id = route.replace('/files/', '')
      const body = await request.json()
      const update = {}
      if (body.projectId !== undefined) update.projectId = body.projectId || null
      if (body.projectTitle !== undefined) update.projectTitle = body.projectTitle || null
      if (body.label !== undefined) update.label = body.label
      const result = await database.collection('files').findOneAndUpdate({ id }, { $set: update }, { returnDocument: 'after' })
      const updated = result?.value ?? result
      if (!updated) return json({ error: 'not found' }, { status: 404 })
      const { _id, ...safe } = updated
      return json({ ok: true, file: safe })
    }

    // ---------------- Analytics ----------------
    if (route === '/analytics/track' && method === 'POST') {
      const body = await request.json().catch(() => null)
      const allowed = ['pageview', 'project_view', 'resume_click']
      if (!body || !allowed.includes(body.type)) return json({ error: 'invalid event type' }, { status: 400 })
      await database.collection('analytics_events').insertOne({
        id: uuidv4(),
        type: body.type,
        sessionId: typeof body.sessionId === 'string' ? body.sessionId.slice(0, 100) : null,
        projectId: body.projectId || null,
        projectTitle: body.projectTitle || null,
        path: typeof body.path === 'string' ? body.path.slice(0, 300) : null,
        referrer: typeof body.referrer === 'string' ? body.referrer.slice(0, 300) : null,
        userAgent: request.headers.get('user-agent') || null,
        createdAt: new Date(),
      })
      return json({ ok: true })
    }

    if (route === '/analytics/summary' && method === 'GET') {
      if (!requireAdmin(request)) return unauthorized()
      const url = new URL(request.url)
      const days = Math.min(180, Math.max(7, parseInt(url.searchParams.get('days') || '30', 10) || 30))
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      const col = database.collection('analytics_events')

      const [allTimePageviews, allTimeProjectViews, allTimeResumeClicks] = await Promise.all([
        col.countDocuments({ type: 'pageview' }),
        col.countDocuments({ type: 'project_view' }),
        col.countDocuments({ type: 'resume_click' }),
      ])
      const [rangePageviews, rangeProjectViews, rangeResumeClicks, rangeSessions] = await Promise.all([
        col.countDocuments({ type: 'pageview', createdAt: { $gte: since } }),
        col.countDocuments({ type: 'project_view', createdAt: { $gte: since } }),
        col.countDocuments({ type: 'resume_click', createdAt: { $gte: since } }),
        col.distinct('sessionId', { type: 'pageview', createdAt: { $gte: since } }),
      ])

      const dailyAgg = await col.aggregate([
        { $match: { type: 'pageview', createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      ]).toArray()
      const dailyMap = Object.fromEntries(dailyAgg.map((d) => [d._id, d.count]))
      const dailySeries = []
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        const key = d.toISOString().slice(0, 10)
        dailySeries.push({ date: key, pageviews: dailyMap[key] || 0 })
      }

      const topProjectsAgg = await col.aggregate([
        { $match: { type: 'project_view', createdAt: { $gte: since }, projectId: { $ne: null } } },
        { $group: { _id: { projectId: '$projectId', projectTitle: '$projectTitle' }, views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: 8 },
      ]).toArray()

      return json({
        allTime: { pageviews: allTimePageviews, projectViews: allTimeProjectViews, resumeClicks: allTimeResumeClicks },
        range: { days, pageviews: rangePageviews, uniqueVisitors: (rangeSessions || []).filter(Boolean).length, projectViews: rangeProjectViews, resumeClicks: rangeResumeClicks },
        dailySeries,
        topProjects: topProjectsAgg.map((p) => ({ projectId: p._id.projectId, projectTitle: p._id.projectTitle || p._id.projectId, views: p.views })),
      })
    }

    // ---------------- Live market configuration ----------------
    if (route === '/market/config' && method === 'GET') {
      if (!requireAdmin(request)) return unauthorized()
      const config = await readMarketConfig(database)
      return json({
        provider: config.provider,
        symbols: config.symbols,
        refreshSeconds: config.refreshSeconds,
        hasApiKey: !!config.apiKey,
        maskedApiKey: maskKey(config.apiKey),
        updatedAt: config.updatedAt,
      })
    }

    if (route === '/market/config' && method === 'PUT') {
      if (!requireAdmin(request)) return unauthorized()
      const body = await request.json().catch(() => ({}))
      const current = await readMarketConfig(database)
      const provider = MARKET_PROVIDERS.has(body.provider) ? body.provider : current.provider
      const symbols = sanitizeSymbols(body.symbols?.length ? body.symbols : current.symbols)
      const refreshSeconds = Math.min(3600, Math.max(15, Number(body.refreshSeconds || current.refreshSeconds || 60)))
      const apiKey = body.clearApiKey ? '' : (String(body.apiKey || '').trim() || current.apiKey)
      if (!symbols.length) return json({ error: 'Add at least one market symbol.' }, { status: 400 })

      await database.collection('site_settings').updateOne(
        { id: 'market' },
        { $set: { id: 'market', provider, apiKey, symbols, refreshSeconds, updatedAt: new Date() } },
        { upsert: true }
      )
      marketCache = { key: '', at: 0, payload: null }
      return json({ ok: true, provider, symbols, refreshSeconds, hasApiKey: !!apiKey, maskedApiKey: maskKey(apiKey) })
    }

    if (route === '/market/test' && method === 'POST') {
      if (!requireAdmin(request)) return unauthorized()
      const body = await request.json().catch(() => ({}))
      const current = await readMarketConfig(database)
      const provider = MARKET_PROVIDERS.has(body.provider) ? body.provider : current.provider
      const apiKey = String(body.apiKey || '').trim() || current.apiKey
      const symbol = sanitizeSymbols([body.symbol || current.symbols?.[0]])[0]
      if (!apiKey) return json({ error: 'API key is required before testing.' }, { status: 400 })
      if (!symbol) return json({ error: 'A symbol is required before testing.' }, { status: 400 })
      const quote = await fetchProviderQuote(provider, symbol, apiKey)
      return json({ ok: true, provider, quote })
    }

    if (route === '/market/quotes' && method === 'GET') {
      const payload = await getMarketPayload(database)
      return json(payload, { status: payload.configured ? 200 : 503 })
    }

    // ---------------- Site content (whole-site CMS) ----------------
    if (route === '/content' && method === 'GET') {
      let doc = await database.collection('site_content').findOne({ id: 'main' })
      if (!doc) {
        doc = { id: 'main', content: SEED_CONTENT, updatedAt: new Date() }
        await database.collection('site_content').insertOne(doc)
      }
      return json(doc.content)
    }

    if (route === '/content' && method === 'PUT') {
      if (!requireAdmin(request)) return unauthorized()
      const body = await request.json()
      if (!body || typeof body !== 'object') return json({ error: 'invalid payload' }, { status: 400 })
      const shape = ['owner', 'chapters', 'categories', 'projects', 'skills', 'experience']
      for (const k of shape) if (!(k in body)) return json({ error: `missing key: ${k}` }, { status: 400 })
      await database.collection('site_content').updateOne(
        { id: 'main' },
        { $set: { id: 'main', content: body, updatedAt: new Date() } },
        { upsert: true }
      )
      return json({ ok: true, updatedAt: new Date() })
    }

    if (route === '/content/reset' && method === 'POST') {
      if (!requireAdmin(request)) return unauthorized()
      await database.collection('site_content').updateOne(
        { id: 'main' },
        { $set: { id: 'main', content: SEED_CONTENT, updatedAt: new Date() } },
        { upsert: true }
      )
      return json({ ok: true, content: SEED_CONTENT })
    }

    return json({ error: `Route ${route} not found` }, { status: 404 })
  } catch (error) {
    console.error('API Error:', error)
    const detail = String(error?.message || error)
    if (error?.code === 'DB_NOT_CONFIGURED') {
      return json({ error: 'Database not configured', detail }, { status: 503 })
    }
    if (error?.name === 'AbortError') {
      return json({ error: 'Market data provider timed out', detail }, { status: 504 })
    }
    return json({ error: 'Internal server error', detail }, { status: 500 })
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
