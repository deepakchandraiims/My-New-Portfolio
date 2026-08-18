'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Activity, CheckCircle2, KeyRound, Loader2, RefreshCw, Save, Settings2, X } from 'lucide-react'

const TOKEN_KEY = 'portfolio_admin_token'

function formatPrice(q) {
  if (!q || q.price == null) return '—'
  try {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(Number(q.price))
  } catch {
    return String(q.price)
  }
}

function LiveMarketStrip() {
  const pathname = usePathname()
  const [data, setData] = useState(null)

  useEffect(() => {
    if (pathname !== '/') return
    let cancelled = false
    let timer
    const load = async () => {
      try {
        const res = await fetch('/api/market/quotes', { cache: 'no-store' })
        const body = await res.json().catch(() => null)
        if (!cancelled && body) setData(body)
        const seconds = Math.max(20, Math.min(300, Number(body?.refreshSeconds || 60)))
        if (!cancelled) timer = setTimeout(load, seconds * 1000)
      } catch {
        if (!cancelled) timer = setTimeout(load, 60000)
      }
    }
    load()
    return () => { cancelled = true; if (timer) clearTimeout(timer) }
  }, [pathname])

  if (pathname !== '/' || !data?.configured || !Array.isArray(data.quotes) || data.quotes.length === 0) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-5xl rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-xl shadow-xl shadow-slate-900/10 px-4 py-3">
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
        <div className="shrink-0 flex items-center gap-2 pr-3 border-r border-slate-200">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Investment Lab</div>
            <div className="text-[12px] font-medium text-slate-800">Live / latest market feed</div>
          </div>
        </div>
        {data.quotes.map((q) => {
          const pct = Number(q.percentChange)
          const up = Number.isFinite(pct) ? pct >= 0 : null
          return (
            <div key={q.symbol} className="shrink-0 min-w-[125px] px-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold text-slate-800">{q.symbol}</span>
                {Number.isFinite(pct) && <span className={`text-[10.5px] font-medium ${up ? 'text-emerald-600' : 'text-rose-600'}`}>{up ? '+' : ''}{pct.toFixed(2)}%</span>}
              </div>
              <div className="mt-0.5 text-[13px] font-mono tabular-nums text-slate-900">{formatPrice(q)}</div>
            </div>
          )
        })}
        <div className="shrink-0 ml-auto pl-3 border-l border-slate-200 text-right">
          <div className="text-[9.5px] uppercase tracking-widest text-slate-400">Provider</div>
          <div className="text-[11px] text-slate-600 capitalize">{data.provider}</div>
        </div>
      </div>
    </div>
  )
}

function AdminMarketPanel() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState('')
  const [config, setConfig] = useState({ provider: 'twelvedata', apiKey: '', symbols: 'AAPL,MSFT,GOOGL', refreshSeconds: 60, hasApiKey: false, maskedApiKey: '' })

  const token = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem(TOKEN_KEY) || ''
  }, [open])

  useEffect(() => {
    if (!pathname?.startsWith('/admin') || !open || !token) return
    setLoading(true)
    fetch('/api/market/config', { headers: { 'x-admin-token': token } })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`)
        setConfig((c) => ({ ...c, ...d, apiKey: '', symbols: (d.symbols || []).join(',') }))
      })
      .catch((e) => setMessage(e.message || 'Unable to load market settings'))
      .finally(() => setLoading(false))
  }, [pathname, open, token])

  if (!pathname?.startsWith('/admin')) return null

  const save = async () => {
    if (!token) { setMessage('Sign in to Admin first.'); return }
    setSaving(true); setMessage('')
    try {
      const res = await fetch('/api/market/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({
          provider: config.provider,
          apiKey: config.apiKey,
          symbols: config.symbols.split(',').map((s) => s.trim()).filter(Boolean),
          refreshSeconds: Number(config.refreshSeconds || 60),
        }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.error || `HTTP ${res.status}`)
      setConfig((c) => ({ ...c, apiKey: '', hasApiKey: d.hasApiKey, maskedApiKey: d.maskedApiKey }))
      setMessage('Market settings saved.')
    } catch (e) { setMessage(e.message || 'Save failed') } finally { setSaving(false) }
  }

  const test = async () => {
    if (!token) { setMessage('Sign in to Admin first.'); return }
    setTesting(true); setMessage('')
    try {
      const symbol = config.symbols.split(',').map((s) => s.trim()).filter(Boolean)[0]
      const res = await fetch('/api/market/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({ provider: config.provider, apiKey: config.apiKey, symbol }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.error || `HTTP ${res.status}`)
      setMessage(`Connected: ${d.quote.symbol} ${formatPrice(d.quote)}`)
    } catch (e) { setMessage(e.message || 'Connection test failed') } finally { setTesting(false) }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-4 py-2.5 text-[12px] font-medium shadow-xl hover:bg-blue-700 transition">
        <Activity className="h-4 w-4" /> Market API
      </button>
      {open && (
        <div className="fixed inset-0 z-[70] bg-slate-950/30 backdrop-blur-sm flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex h-9 w-9 rounded-lg bg-blue-50 border border-blue-100 items-center justify-center"><Settings2 className="h-4 w-4 text-blue-600" /></div>
                <h2 className="mt-4 text-2xl font-semibold text-slate-900 tracking-tight">Live Market API</h2>
                <p className="mt-1 text-[12.5px] text-slate-500">Configure the server-side quote provider used by the Investment Lab.</p>
              </div>
              <button onClick={() => setOpen(false)} className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50"><X className="h-4 w-4" /></button>
            </div>

            {loading ? <div className="py-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-blue-600" /></div> : (
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-[10px] uppercase tracking-widest text-slate-400">Provider</span>
                    <select value={config.provider} onChange={(e) => setConfig((c) => ({ ...c, provider: e.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-100">
                      <option value="twelvedata">Twelve Data</option>
                      <option value="alphavantage">Alpha Vantage</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-[10px] uppercase tracking-widest text-slate-400">Refresh interval</span>
                    <input type="number" min="15" max="3600" value={config.refreshSeconds} onChange={(e) => setConfig((c) => ({ ...c, refreshSeconds: e.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-100" />
                  </label>
                </div>

                <label className="block">
                  <span className="text-[10px] uppercase tracking-widest text-slate-400">API key</span>
                  <div className="mt-1.5 relative">
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input type="password" value={config.apiKey} onChange={(e) => setConfig((c) => ({ ...c, apiKey: e.target.value }))} placeholder={config.hasApiKey ? `Saved: ${config.maskedApiKey}` : 'Paste provider API key'} className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-100" />
                  </div>
                  <div className="mt-1 text-[10.5px] text-slate-400">Stored server-side in MongoDB settings and never returned in full to the browser.</div>
                </label>

                <label className="block">
                  <span className="text-[10px] uppercase tracking-widest text-slate-400">Symbols</span>
                  <input value={config.symbols} onChange={(e) => setConfig((c) => ({ ...c, symbols: e.target.value }))} placeholder="AAPL, MSFT, RELIANCE:NSE" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-100" />
                  <div className="mt-1 text-[10.5px] text-slate-400">Use the ticker syntax supported by the selected provider.</div>
                </label>

                {message && <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[12px] text-slate-600 flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> {message}</div>}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button onClick={test} disabled={testing} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-[12px] text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                    {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Test connection
                  </button>
                  <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-[12px] font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save settings
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default function MarketEnhancements() {
  return (
    <>
      <LiveMarketStrip />
      <AdminMarketPanel />
    </>
  )
}
