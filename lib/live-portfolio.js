import { MongoClient } from 'mongodb'
import { createHash, timingSafeEqual } from 'crypto'

let client
let db

const ADMIN_FALLBACK_HASH = '58f67ecff7dae550c76dc6ea5192ed1475317f655c13232c1151e39bb3708657'
const PROVIDERS = new Set(['twelvedata', 'alphavantage'])
const ASSET_CLASSES = new Set(['Equity', 'ETF', 'Mutual Fund', 'Crypto', 'Fixed Income', 'Gold', 'Other'])

function sha256(value = '') {
  return createHash('sha256').update(String(value)).digest('hex')
}

function expectedAdminHash() {
  if (process.env.ADMIN_PASSWORD_HASH) return String(process.env.ADMIN_PASSWORD_HASH).trim().toLowerCase()
  if (process.env.ADMIN_PASSWORD) return sha256(process.env.ADMIN_PASSWORD)
  return ADMIN_FALLBACK_HASH
}

export function isPortfolioAdmin(request) {
  const token = request.headers.get('x-admin-token')
  if (!token) return false
  const actual = Buffer.from(sha256(token), 'hex')
  const expected = Buffer.from(expectedAdminHash(), 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export async function getPortfolioDb() {
  if (db) return db
  const mongoUrl = process.env.MONGO_URL
  const dbName = process.env.DB_NAME
  if (!mongoUrl || !dbName) {
    const error = new Error('Database is not configured. Set MONGO_URL and DB_NAME in the deployment environment.')
    error.code = 'DB_NOT_CONFIGURED'
    throw error
  }
  if (!client) {
    client = new MongoClient(mongoUrl, { serverSelectionTimeoutMS: 8000 })
    await client.connect()
  }
  db = client.db(dbName)
  return db
}

function cleanText(value, max = 120) {
  return String(value || '').trim().slice(0, max)
}

function cleanNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function sanitizeHolding(raw, index) {
  const symbol = cleanText(raw?.symbol, 50).toUpperCase()
  if (!symbol) return null
  const quantity = Math.max(0, cleanNumber(raw?.quantity))
  const avgPrice = Math.max(0, cleanNumber(raw?.avgPrice))
  const assetClass = ASSET_CLASSES.has(raw?.assetClass) ? raw.assetClass : 'Equity'
  return {
    id: cleanText(raw?.id, 80) || `${symbol.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${index + 1}`,
    symbol,
    label: cleanText(raw?.label, 80) || symbol,
    quantity,
    avgPrice,
    assetClass,
    currency: cleanText(raw?.currency, 8).toUpperCase(),
    notes: cleanText(raw?.notes, 180),
    enabled: raw?.enabled !== false,
  }
}

export function sanitizePortfolioConfig(raw = {}) {
  const holdings = (Array.isArray(raw.holdings) ? raw.holdings : [])
    .slice(0, 30)
    .map(sanitizeHolding)
    .filter(Boolean)

  return {
    id: 'portfolio',
    title: cleanText(raw.title, 80) || 'My Live Portfolio',
    subtitle: cleanText(raw.subtitle, 180) || 'Live portfolio monitoring powered by market data APIs.',
    baseCurrency: cleanText(raw.baseCurrency, 8).toUpperCase() || 'INR',
    benchmark: cleanText(raw.benchmark, 50).toUpperCase(),
    showPublic: raw.showPublic !== false,
    showCostBasis: raw.showCostBasis !== false,
    showQuantities: raw.showQuantities === true,
    holdings,
  }
}

export async function readPortfolioConfig(database) {
  const stored = await database.collection('site_settings').findOne({ id: 'portfolio' })
  return sanitizePortfolioConfig(stored || {})
}

export async function savePortfolioConfig(database, raw) {
  const config = sanitizePortfolioConfig(raw)
  await database.collection('site_settings').updateOne(
    { id: 'portfolio' },
    { $set: { ...config, updatedAt: new Date() } },
    { upsert: true }
  )
  return config
}

export async function readMarketSettings(database) {
  const stored = await database.collection('site_settings').findOne({ id: 'market' })
  return {
    provider: PROVIDERS.has(stored?.provider) ? stored.provider : 'twelvedata',
    apiKey: stored?.apiKey || process.env.MARKET_API_KEY || '',
    refreshSeconds: Math.min(3600, Math.max(15, cleanNumber(stored?.refreshSeconds, 60))),
  }
}

async function fetchJson(url) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)
  try {
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.message || data?.error || `Market provider returned HTTP ${res.status}`)
    return data
  } finally {
    clearTimeout(timeout)
  }
}

async function twelveDataQuote(symbol, apiKey) {
  const url = new URL('https://api.twelvedata.com/quote')
  url.searchParams.set('symbol', symbol)
  url.searchParams.set('apikey', apiKey)
  const data = await fetchJson(url)
  if (data?.status === 'error' || data?.code) throw new Error(data?.message || `No quote returned for ${symbol}`)
  const price = Number(data?.close ?? data?.price)
  if (!Number.isFinite(price)) throw new Error(`No current price returned for ${symbol}`)
  return {
    symbol: data?.symbol || symbol,
    name: data?.name || symbol,
    exchange: data?.exchange || '',
    currency: data?.currency || '',
    price,
    previousClose: Number.isFinite(Number(data?.previous_close)) ? Number(data.previous_close) : null,
    change: Number.isFinite(Number(data?.change)) ? Number(data.change) : null,
    percentChange: Number.isFinite(Number(data?.percent_change)) ? Number(data.percent_change) : null,
    timestamp: data?.datetime || (data?.timestamp ? new Date(Number(data.timestamp) * 1000).toISOString() : null),
  }
}

async function alphaVantageQuote(symbol, apiKey) {
  const url = new URL('https://www.alphavantage.co/query')
  url.searchParams.set('function', 'GLOBAL_QUOTE')
  url.searchParams.set('symbol', symbol)
  url.searchParams.set('apikey', apiKey)
  const data = await fetchJson(url)
  if (data?.Note || data?.Information || data?.['Error Message']) throw new Error(data.Note || data.Information || data['Error Message'])
  const q = data?.['Global Quote'] || {}
  const price = Number(q['05. price'])
  if (!Number.isFinite(price)) throw new Error(`No current price returned for ${symbol}`)
  return {
    symbol: q['01. symbol'] || symbol,
    name: symbol,
    exchange: '',
    currency: '',
    price,
    previousClose: Number.isFinite(Number(q['08. previous close'])) ? Number(q['08. previous close']) : null,
    change: Number.isFinite(Number(q['09. change'])) ? Number(q['09. change']) : null,
    percentChange: Number.isFinite(Number(String(q['10. change percent'] || '').replace('%', ''))) ? Number(String(q['10. change percent']).replace('%', '')) : null,
    timestamp: q['07. latest trading day'] || null,
  }
}

async function fetchQuote(provider, symbol, apiKey) {
  return provider === 'alphavantage' ? alphaVantageQuote(symbol, apiKey) : twelveDataQuote(symbol, apiKey)
}

function rangeSpec(range) {
  const key = String(range || '3M').toUpperCase()
  const specs = {
    '1D': { interval: '5min', outputsize: 90 },
    '1M': { interval: '1day', outputsize: 32 },
    '3M': { interval: '1day', outputsize: 95 },
    '6M': { interval: '1day', outputsize: 190 },
    '1Y': { interval: '1day', outputsize: 270 },
  }
  return { key: specs[key] ? key : '3M', ...(specs[key] || specs['3M']) }
}

async function twelveDataHistory(symbol, apiKey, range) {
  const spec = rangeSpec(range)
  const url = new URL('https://api.twelvedata.com/time_series')
  url.searchParams.set('symbol', symbol)
  url.searchParams.set('interval', spec.interval)
  url.searchParams.set('outputsize', String(spec.outputsize))
  url.searchParams.set('apikey', apiKey)
  const data = await fetchJson(url)
  if (data?.status === 'error' || data?.code) throw new Error(data?.message || `No history returned for ${symbol}`)
  const points = (data?.values || []).map((v) => ({
    datetime: v.datetime,
    open: Number(v.open),
    high: Number(v.high),
    low: Number(v.low),
    close: Number(v.close),
    volume: Number(v.volume),
  })).filter((p) => Number.isFinite(p.close)).reverse()
  return { symbol: data?.meta?.symbol || symbol, currency: data?.meta?.currency || '', exchange: data?.meta?.exchange || '', range: spec.key, interval: spec.interval, points }
}

async function alphaVantageHistory(symbol, apiKey, range) {
  const spec = rangeSpec(range)
  const url = new URL('https://www.alphavantage.co/query')
  if (spec.key === '1D') {
    url.searchParams.set('function', 'TIME_SERIES_INTRADAY')
    url.searchParams.set('interval', '5min')
    url.searchParams.set('outputsize', 'compact')
  } else {
    url.searchParams.set('function', 'TIME_SERIES_DAILY')
    url.searchParams.set('outputsize', 'compact')
  }
  url.searchParams.set('symbol', symbol)
  url.searchParams.set('apikey', apiKey)
  const data = await fetchJson(url)
  if (data?.Note || data?.Information || data?.['Error Message']) throw new Error(data.Note || data.Information || data['Error Message'])
  const seriesKey = Object.keys(data || {}).find((k) => k.toLowerCase().includes('time series'))
  const series = seriesKey ? data[seriesKey] : null
  if (!series || typeof series !== 'object') throw new Error(`No history returned for ${symbol}`)
  let entries = Object.entries(series).map(([datetime, v]) => ({
    datetime,
    open: Number(v['1. open']),
    high: Number(v['2. high']),
    low: Number(v['3. low']),
    close: Number(v['4. close']),
    volume: Number(v['5. volume']),
  })).filter((p) => Number.isFinite(p.close)).reverse()
  if (spec.key === '1M') entries = entries.slice(-32)
  if (spec.key === '3M') entries = entries.slice(-95)
  return { symbol, currency: '', exchange: '', range: spec.key, interval: spec.key === '1D' ? '5min' : '1day', points: entries }
}

export async function getPortfolioHistory(database, symbol, range) {
  const market = await readMarketSettings(database)
  if (!market.apiKey) throw new Error('Market API key is not configured.')
  const cleanSymbol = cleanText(symbol, 50).toUpperCase()
  if (!cleanSymbol) throw new Error('Symbol is required.')
  const payload = market.provider === 'alphavantage'
    ? await alphaVantageHistory(cleanSymbol, market.apiKey, range)
    : await twelveDataHistory(cleanSymbol, market.apiKey, range)
  return { ...payload, provider: market.provider }
}

export async function getLivePortfolio(database) {
  const [portfolio, market] = await Promise.all([readPortfolioConfig(database), readMarketSettings(database)])
  const enabled = portfolio.holdings.filter((h) => h.enabled)
  if (!portfolio.showPublic) return { configured: true, hidden: true, portfolio: { ...portfolio, holdings: [] } }
  if (!market.apiKey) return { configured: false, hidden: false, error: 'Market API key is not configured.', provider: market.provider, refreshSeconds: market.refreshSeconds, portfolio }
  if (!enabled.length) return { configured: true, hidden: false, provider: market.provider, refreshSeconds: market.refreshSeconds, portfolio, holdings: [], totals: null }

  const results = await Promise.allSettled(enabled.map((h) => fetchQuote(market.provider, h.symbol, market.apiKey)))
  const holdings = []
  const errors = []

  results.forEach((result, index) => {
    const h = enabled[index]
    if (result.status !== 'fulfilled') {
      errors.push({ symbol: h.symbol, error: String(result.reason?.message || result.reason) })
      holdings.push({ ...h, quoteError: true })
      return
    }
    const q = result.value
    const investedValue = h.quantity * h.avgPrice
    const currentValue = h.quantity * q.price
    const unrealizedPnL = currentValue - investedValue
    const unrealizedPct = investedValue > 0 ? (unrealizedPnL / investedValue) * 100 : null
    const dayPnL = q.previousClose == null ? null : h.quantity * (q.price - q.previousClose)
    holdings.push({ ...h, ...q, investedValue, currentValue, unrealizedPnL, unrealizedPct, dayPnL })
  })

  const priced = holdings.filter((h) => Number.isFinite(h.currentValue))
  const currentValue = priced.reduce((sum, h) => sum + h.currentValue, 0)
  const investedValue = priced.reduce((sum, h) => sum + h.investedValue, 0)
  const unrealizedPnL = currentValue - investedValue
  const dayPnL = priced.reduce((sum, h) => sum + (Number.isFinite(h.dayPnL) ? h.dayPnL : 0), 0)
  const previousValue = currentValue - dayPnL

  const withWeights = holdings.map((h) => ({
    ...h,
    weight: Number.isFinite(h.currentValue) && currentValue > 0 ? (h.currentValue / currentValue) * 100 : null,
  }))

  return {
    configured: true,
    hidden: false,
    provider: market.provider,
    refreshSeconds: market.refreshSeconds,
    fetchedAt: new Date().toISOString(),
    portfolio,
    holdings: withWeights,
    errors,
    totals: {
      currentValue,
      investedValue,
      unrealizedPnL,
      unrealizedPct: investedValue > 0 ? (unrealizedPnL / investedValue) * 100 : null,
      dayPnL,
      dayPct: previousValue > 0 ? (dayPnL / previousValue) * 100 : null,
      positions: priced.length,
    },
  }
}
