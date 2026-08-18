'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePathname } from 'next/navigation'
import {
  Activity, BarChart3, CheckCircle2, ChevronDown, CircleDollarSign, Loader2,
  Plus, RefreshCw, Save, Settings2, Trash2, TrendingDown, TrendingUp, Wallet, X,
} from 'lucide-react'
import {
  CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'

const TOKEN_KEY = 'portfolio_admin_token'
const RANGES = ['1D', '1M', '3M', '6M', '1Y']
const ASSET_CLASSES = ['Equity', 'ETF', 'Mutual Fund', 'Crypto', 'Fixed Income', 'Gold', 'Other']
const PIE_COLORS = ['#2563eb', '#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e', '#64748b', '#14b8a6']

const blankHolding = () => ({
  id: `holding-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  symbol: '',
  label: '',
  quantity: '',
  avgPrice: '',
  assetClass: 'Equity',
  currency: 'INR',
  notes: '',
  enabled: true,
})

function money(value, currency = 'INR') {
  if (!Number.isFinite(Number(value))) return '—'
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: currency || 'INR', maximumFractionDigits: 2,
    }).format(Number(value))
  } catch {
    return `${currency || ''} ${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`.trim()
  }
}

function number(value, digits = 2) {
  if (!Number.isFinite(Number(value))) return '—'
  return Number(value).toLocaleString('en-IN', { maximumFractionDigits: digits })
}

function signed(value, suffix = '') {
  if (!Number.isFinite(Number(value))) return '—'
  const n = Number(value)
  return `${n >= 0 ? '+' : ''}${number(n)}${suffix}`
}

function pnlClass(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n === 0) return 'text-slate-600'
  return n > 0 ? 'text-emerald-600' : 'text-rose-600'
}

function MiniKpi({ icon: Icon, label, value, sub, tone }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
          <Icon className="h-4 w-4 text-blue-600" />
        </div>
        {sub && <div className={`text-[11px] font-medium ${tone || 'text-slate-500'}`}>{sub}</div>}
      </div>
      <div className="mt-4 text-[23px] md:text-[27px] font-semibold tracking-tight text-slate-900 tabular-nums">{value}</div>
      <div className="mt-1 text-[10.5px] uppercase tracking-[0.16em] text-slate-400">{label}</div>
    </div>
  )
}

function LivePortfolioDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState('')
  const [range, setRange] = useState('3M')
  const [history, setHistory] = useState(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/portfolio/live', { cache: 'no-store' })
      const body = await res.json().catch(() => null)
      if (body) {
        setData(body)
        setLastRefresh(new Date())
        const first = body?.holdings?.find((h) => !h.quoteError)?.symbol
        setSelected((current) => current || first || '')
      }
      return body
    } catch {
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    let timer
    const cycle = async () => {
      const body = await load()
      if (cancelled) return
      const seconds = Math.max(20, Math.min(300, Number(body?.refreshSeconds || 60)))
      timer = setTimeout(cycle, seconds * 1000)
    }
    cycle()
    return () => { cancelled = true; if (timer) clearTimeout(timer) }
  }, [load])

  useEffect(() => {
    if (!selected) { setHistory(null); return }
    let cancelled = false
    setHistoryLoading(true)
    fetch(`/api/portfolio/history?symbol=${encodeURIComponent(selected)}&range=${range}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (!cancelled && !d.error) setHistory(d) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setHistoryLoading(false) })
    return () => { cancelled = true }
  }, [selected, range])

  const config = data?.portfolio
  const holdings = data?.holdings || []
  const totals = data?.totals
  const baseCurrency = config?.baseCurrency || 'INR'

  const allocation = useMemo(() => holdings
    .filter((h) => Number.isFinite(Number(h.currentValue)) && Number(h.currentValue) > 0)
    .map((h) => ({ name: h.label || h.symbol, value: Number(h.currentValue) })), [holdings])

  if (loading) return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 flex items-center justify-center text-slate-400">
      <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading live portfolio…
    </div>
  )

  if (!data || data.hidden || !config?.showPublic || !holdings.length) return null
  if (!data.configured) return null

  const current = holdings.find((h) => h.symbol === selected)
  const chartPoints = (history?.points || []).map((p) => ({ ...p, label: p.datetime }))

  return (
    <div className="mt-10 pt-10 border-t border-slate-100">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-blue-600">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span>
            Live portfolio engine
          </div>
          <h3 className="mt-2 text-[22px] md:text-[28px] font-semibold text-slate-900 tracking-tight">{config.title}</h3>
          <p className="mt-1 text-[12.5px] text-slate-500 max-w-2xl">{config.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 text-[10.5px] text-slate-400">
          <RefreshCw className="h-3.5 w-3.5" />
          {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString()}` : 'Updating'} · {data.provider}
        </div>
      </div>

      {totals && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MiniKpi icon={Wallet} label="Current value" value={money(totals.currentValue, baseCurrency)} sub={`${totals.positions} live positions`} />
          {config.showCostBasis ? (
            <MiniKpi icon={CircleDollarSign} label="Capital invested" value={money(totals.investedValue, baseCurrency)} />
          ) : (
            <MiniKpi icon={BarChart3} label="Portfolio positions" value={String(totals.positions)} />
          )}
          <MiniKpi icon={totals.dayPnL >= 0 ? TrendingUp : TrendingDown} label="Today's P&L" value={signed(totals.dayPnL == null ? null : totals.dayPnL)} sub={signed(totals.dayPct, '%')} tone={pnlClass(totals.dayPnL)} />
          {config.showCostBasis ? (
            <MiniKpi icon={totals.unrealizedPnL >= 0 ? TrendingUp : TrendingDown} label="Unrealized P&L" value={signed(totals.unrealizedPnL)} sub={signed(totals.unrealizedPct, '%')} tone={pnlClass(totals.unrealizedPnL)} />
          ) : (
            <MiniKpi icon={Activity} label="Data refresh" value={`${data.refreshSeconds}s`} />
          )}
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 xl:grid-cols-[1.55fr_0.75fr] gap-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm min-w-0">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Price history</div>
              <div className="mt-1 flex items-center gap-3">
                <select value={selected} onChange={(e) => setSelected(e.target.value)} className="bg-transparent text-[17px] font-semibold text-slate-900 outline-none cursor-pointer">
                  {holdings.filter((h) => !h.quoteError).map((h) => <option key={h.symbol} value={h.symbol}>{h.label || h.symbol} · {h.symbol}</option>)}
                </select>
                {current && <span className={`text-[12px] font-medium ${pnlClass(current.percentChange)}`}>{signed(current.percentChange, '%')}</span>}
              </div>
            </div>
            <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 p-1">
              {RANGES.map((r) => <button key={r} onClick={() => setRange(r)} className={`px-2.5 py-1 rounded-full text-[10.5px] transition ${range === r ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{r}</button>)}
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-3">
            <div className="text-[28px] font-semibold text-slate-900 tabular-nums">{current ? money(current.price, current.currency || baseCurrency) : '—'}</div>
            {current?.exchange && <div className="text-[10.5px] text-slate-400">{current.exchange}</div>}
          </div>

          <div className="mt-5 h-[285px]">
            {historyLoading ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-[12px]"><Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading chart…</div>
            ) : chartPoints.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartPoints} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#eef2f7" />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94a3b8' }} minTickGap={42} axisLine={false} tickLine={false} tickFormatter={(v) => String(v).slice(5, 16)} />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={55} tickFormatter={(v) => number(v, 0)} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 10, border: '1px solid #e2e8f0' }} formatter={(v) => [number(v), 'Close']} labelFormatter={(v) => v} />
                  <Line type="monotone" dataKey="close" stroke="#2563eb" strokeWidth={2.2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-[12px]">Historical chart is unavailable for this symbol/range on the current API plan.</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Live allocation</div>
          <div className="mt-3 h-[180px]">
            {allocation.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={allocation} dataKey="value" nameKey="name" innerRadius={50} outerRadius={78} paddingAngle={2} stroke="none">
                    {allocation.map((entry, i) => <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => money(Number(v), baseCurrency)} contentStyle={{ fontSize: 11, borderRadius: 10, border: '1px solid #e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="space-y-2.5">
            {holdings.filter((h) => Number.isFinite(Number(h.weight))).sort((a, b) => b.weight - a.weight).slice(0, 6).map((h, i) => (
              <div key={h.symbol} className="flex items-center gap-2.5 text-[11.5px]">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="flex-1 text-slate-700 truncate">{h.label || h.symbol}</span>
                <span className="font-mono text-slate-500">{number(h.weight)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="text-[12.5px] font-medium text-slate-900">Portfolio holdings</div>
          <div className="text-[10.5px] text-slate-400">Market prices update automatically</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="bg-slate-50/70 text-[9.5px] uppercase tracking-widest text-slate-400">
              <tr>
                <th className="px-5 py-3 font-medium">Holding</th>
                {config.showQuantities && <th className="px-4 py-3 font-medium text-right">Qty</th>}
                <th className="px-4 py-3 font-medium text-right">Live price</th>
                <th className="px-4 py-3 font-medium text-right">Day</th>
                <th className="px-4 py-3 font-medium text-right">Value</th>
                <th className="px-4 py-3 font-medium text-right">Weight</th>
                {config.showCostBasis && <th className="px-5 py-3 font-medium text-right">P&L</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {holdings.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-5 py-4">
                    <div className="text-[13px] font-medium text-slate-900">{h.label || h.symbol}</div>
                    <div className="mt-0.5 text-[10.5px] text-slate-400">{h.symbol} · {h.assetClass}{h.exchange ? ` · ${h.exchange}` : ''}</div>
                  </td>
                  {config.showQuantities && <td className="px-4 py-4 text-right text-[12px] font-mono text-slate-600">{number(h.quantity, 4)}</td>}
                  <td className="px-4 py-4 text-right text-[12.5px] font-mono text-slate-900">{h.quoteError ? 'Unavailable' : money(h.price, h.currency || baseCurrency)}</td>
                  <td className={`px-4 py-4 text-right text-[12px] font-medium ${pnlClass(h.percentChange)}`}>{signed(h.percentChange, '%')}</td>
                  <td className="px-4 py-4 text-right text-[12px] font-mono text-slate-700">{money(h.currentValue, baseCurrency)}</td>
                  <td className="px-4 py-4 text-right text-[12px] font-mono text-slate-500">{Number.isFinite(Number(h.weight)) ? `${number(h.weight)}%` : '—'}</td>
                  {config.showCostBasis && <td className={`px-5 py-4 text-right text-[12px] font-medium ${pnlClass(h.unrealizedPnL)}`}>{signed(h.unrealizedPnL)}<div className="text-[10px] font-normal opacity-75">{signed(h.unrealizedPct, '%')}</div></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-3 text-[9.5px] text-slate-400 leading-relaxed">
        Market data is supplied by {data.provider}. Data freshness depends on exchange rules and your provider plan. Portfolio calculations assume holdings are quoted in the selected base currency; FX conversion is not applied yet.
      </div>
    </div>
  )
}

function PortfolioPortal() {
  const pathname = usePathname()
  const [target, setTarget] = useState(null)

  useEffect(() => {
    if (pathname !== '/') { setTarget(null); return }
    let timer
    const attach = () => {
      const lab = document.getElementById('lab')
      if (!lab) { timer = setTimeout(attach, 250); return }
      let mount = document.getElementById('live-portfolio-dashboard-mount')
      if (!mount) {
        mount = document.createElement('div')
        mount.id = 'live-portfolio-dashboard-mount'
        lab.appendChild(mount)
      }
      setTarget(mount)
    }
    attach()
    return () => { if (timer) clearTimeout(timer) }
  }, [pathname])

  return target ? createPortal(<LivePortfolioDashboard />, target) : null
}

function AdminPortfolioPanel() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [config, setConfig] = useState({
    title: 'My Live Portfolio', subtitle: 'Live portfolio monitoring powered by market data APIs.',
    baseCurrency: 'INR', benchmark: '', showPublic: true, showCostBasis: true,
    showQuantities: false, holdings: [],
  })

  const token = useMemo(() => typeof window === 'undefined' ? '' : localStorage.getItem(TOKEN_KEY) || '', [open])

  useEffect(() => {
    if (!pathname?.startsWith('/admin') || !open || !token) return
    setLoading(true); setMessage('')
    fetch('/api/portfolio/config', { headers: { 'x-admin-token': token } })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(d.detail || d.error || `HTTP ${r.status}`)
        setConfig(d)
      })
      .catch((e) => setMessage(e.message || 'Unable to load portfolio settings'))
      .finally(() => setLoading(false))
  }, [pathname, open, token])

  if (!pathname?.startsWith('/admin')) return null

  const updateHolding = (index, patch) => setConfig((c) => ({ ...c, holdings: c.holdings.map((h, i) => i === index ? { ...h, ...patch } : h) }))
  const removeHolding = (index) => setConfig((c) => ({ ...c, holdings: c.holdings.filter((_, i) => i !== index) }))
  const addHolding = () => setConfig((c) => ({ ...c, holdings: [...c.holdings, blankHolding()] }))

  const save = async () => {
    if (!token) { setMessage('Sign in to Admin first.'); return }
    setSaving(true); setMessage('')
    try {
      const res = await fetch('/api/portfolio/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify(config),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.detail || d.error || `HTTP ${res.status}`)
      setConfig(d.config)
      setMessage('Portfolio saved. The Investment Lab will use these holdings on the next refresh.')
    } catch (e) { setMessage(e.message || 'Save failed') } finally { setSaving(false) }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="fixed bottom-20 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-blue-600 text-white px-4 py-2.5 text-[12px] font-medium shadow-xl hover:bg-blue-700 transition">
        <Wallet className="h-4 w-4" /> Portfolio
      </button>
      {open && (
        <div className="fixed inset-0 z-[75] bg-slate-950/35 backdrop-blur-sm flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-2xl p-5 md:p-7 no-scrollbar">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex h-9 w-9 rounded-lg bg-blue-50 border border-blue-100 items-center justify-center"><Wallet className="h-4 w-4 text-blue-600" /></div>
                <h2 className="mt-4 text-2xl font-semibold text-slate-900 tracking-tight">Live Portfolio Manager</h2>
                <p className="mt-1 text-[12.5px] text-slate-500 max-w-2xl">Enter the positions you want displayed. Prices and charts are pulled through the Market API you already configure in Admin.</p>
              </div>
              <button onClick={() => setOpen(false)} className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50"><X className="h-4 w-4" /></button>
            </div>

            {loading ? <div className="py-16 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-blue-600" /></div> : (
              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label><span className="text-[10px] uppercase tracking-widest text-slate-400">Dashboard title</span><input value={config.title || ''} onChange={(e) => setConfig((c) => ({ ...c, title: e.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100" /></label>
                  <label><span className="text-[10px] uppercase tracking-widest text-slate-400">Base currency</span><input value={config.baseCurrency || 'INR'} onChange={(e) => setConfig((c) => ({ ...c, baseCurrency: e.target.value.toUpperCase() }))} placeholder="INR" className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100" /></label>
                </div>
                <label className="block"><span className="text-[10px] uppercase tracking-widest text-slate-400">Subtitle</span><input value={config.subtitle || ''} onChange={(e) => setConfig((c) => ({ ...c, subtitle: e.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100" /></label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label><span className="text-[10px] uppercase tracking-widest text-slate-400">Benchmark ticker (optional)</span><input value={config.benchmark || ''} onChange={(e) => setConfig((c) => ({ ...c, benchmark: e.target.value.toUpperCase() }))} placeholder="NIFTY or SPY" className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100" /></label>
                  <div className="flex items-end gap-5 pb-2 flex-wrap">
                    {[['showPublic', 'Show publicly'], ['showCostBasis', 'Show cost & P&L'], ['showQuantities', 'Show quantities']].map(([key, label]) => (
                      <label key={key} className="inline-flex items-center gap-2 text-[12px] text-slate-600"><input type="checkbox" checked={!!config[key]} onChange={(e) => setConfig((c) => ({ ...c, [key]: e.target.checked }))} className="rounded" /> {label}</label>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div><div className="text-[13px] font-medium text-slate-900">Holdings</div><div className="text-[10.5px] text-slate-400">Use the exact ticker syntax supported by your selected Market API provider.</div></div>
                    <button onClick={addHolding} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-[11.5px] text-blue-700 hover:bg-blue-100"><Plus className="h-3.5 w-3.5" /> Add holding</button>
                  </div>

                  <div className="space-y-3">
                    {(config.holdings || []).map((h, index) => (
                      <div key={h.id || index} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                        <div className="grid grid-cols-2 md:grid-cols-[1.15fr_1.35fr_0.8fr_0.8fr_1fr_auto] gap-3 items-end">
                          <label><span className="text-[9px] uppercase tracking-widest text-slate-400">Ticker</span><input value={h.symbol || ''} onChange={(e) => updateHolding(index, { symbol: e.target.value.toUpperCase() })} placeholder="RELIANCE:NSE" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[12px] outline-none focus:ring-2 focus:ring-blue-100" /></label>
                          <label><span className="text-[9px] uppercase tracking-widest text-slate-400">Display name</span><input value={h.label || ''} onChange={(e) => updateHolding(index, { label: e.target.value })} placeholder="Reliance Industries" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[12px] outline-none focus:ring-2 focus:ring-blue-100" /></label>
                          <label><span className="text-[9px] uppercase tracking-widest text-slate-400">Quantity</span><input type="number" step="any" value={h.quantity ?? ''} onChange={(e) => updateHolding(index, { quantity: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[12px] outline-none focus:ring-2 focus:ring-blue-100" /></label>
                          <label><span className="text-[9px] uppercase tracking-widest text-slate-400">Avg buy price</span><input type="number" step="any" value={h.avgPrice ?? ''} onChange={(e) => updateHolding(index, { avgPrice: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[12px] outline-none focus:ring-2 focus:ring-blue-100" /></label>
                          <label><span className="text-[9px] uppercase tracking-widest text-slate-400">Asset class</span><select value={h.assetClass || 'Equity'} onChange={(e) => updateHolding(index, { assetClass: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[12px] outline-none focus:ring-2 focus:ring-blue-100">{ASSET_CLASSES.map((a) => <option key={a}>{a}</option>)}</select></label>
                          <button onClick={() => removeHolding(index)} className="h-9 w-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                        <div className="mt-3 flex items-center gap-4">
                          <label className="inline-flex items-center gap-2 text-[10.5px] text-slate-500"><input type="checkbox" checked={h.enabled !== false} onChange={(e) => updateHolding(index, { enabled: e.target.checked })} /> Include publicly</label>
                          <input value={h.notes || ''} onChange={(e) => updateHolding(index, { notes: e.target.value })} placeholder="Optional note" className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10.5px] outline-none focus:ring-2 focus:ring-blue-100" />
                        </div>
                      </div>
                    ))}
                    {(config.holdings || []).length === 0 && <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-[12px] text-slate-400">No holdings yet. Add your first stock, ETF, mutual fund or other market-linked position.</div>}
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] text-amber-800 leading-relaxed">
                  For Twelve Data, examples can look like <span className="font-mono">RELIANCE:NSE</span>. Alpha Vantage documents Indian BSE symbols such as <span className="font-mono">RELIANCE.BSE</span>. Test the ticker in the Market API panel before relying on it. Mixed-currency portfolios do not yet perform FX conversion.
                </div>

                {message && <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[12px] text-slate-600 flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> {message}</div>}

                <div className="flex justify-end gap-2 pt-1">
                  <button onClick={() => setOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-[12px] text-slate-600 hover:bg-slate-50">Close</button>
                  <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-[12px] font-medium text-white hover:bg-blue-700 disabled:opacity-50">{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save portfolio</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default function PortfolioEnhancements() {
  return (
    <>
      <PortfolioPortal />
      <AdminPortfolioPanel />
    </>
  )
}
