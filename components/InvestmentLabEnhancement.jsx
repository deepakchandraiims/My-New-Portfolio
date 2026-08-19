'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Activity, ArrowUpRight, BarChart3, Clock3, LineChart as LineChartIcon,
  Loader2, RefreshCw, TrendingDown, TrendingUp, Wallet,
} from 'lucide-react'
import {
  CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'

const RANGES = ['1M', '3M', '6M', '1Y']
const PIE_COLORS = ['#2563eb', '#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#64748b', '#14b8a6']

function money(value, currency = 'INR', compact = false) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  if (compact && currency === 'INR') {
    if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`
    if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`
  }
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: currency || 'INR', maximumFractionDigits: n >= 1000 ? 0 : 2,
    }).format(n)
  } catch {
    return `${currency || ''} ${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`.trim()
  }
}

function number(value, digits = 2) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('en-IN', { maximumFractionDigits: digits })
}

function signed(value, suffix = '') {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return `${n >= 0 ? '+' : ''}${number(n)}${suffix}`
}

function tone(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n === 0) return 'text-slate-500'
  return n > 0 ? 'text-emerald-600' : 'text-rose-600'
}

function dateLabel(value) {
  if (!value) return 'Latest available'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function Stat({ label, value, sub, valueClass = 'text-slate-950' }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-[0_8px_30px_-26px_rgba(15,23,42,.45)]">
      <div className="text-[9px] uppercase tracking-[.18em] text-slate-400">{label}</div>
      <div className={`mt-1.5 text-[19px] md:text-[22px] font-semibold tracking-tight tabular-nums ${valueClass}`}>{value}</div>
      {sub && <div className="mt-1 text-[9.5px] text-slate-400">{sub}</div>}
    </div>
  )
}

function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState('')
  const [range, setRange] = useState('3M')
  const [history, setHistory] = useState(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [lastLoaded, setLastLoaded] = useState(null)

  const load = useCallback(async () => {
    setError('')
    try {
      const res = await fetch('/api/portfolio/live', { cache: 'no-store' })
      const body = await res.json().catch(() => null)
      if (!res.ok || !body) throw new Error(body?.detail || body?.error || `HTTP ${res.status}`)
      setData(body)
      setLastLoaded(new Date())
      const first = (body.holdings || []).find((h) => !h.quoteError)?.symbol
      setSelected((current) => {
        if (current && (body.holdings || []).some((h) => h.symbol === current && !h.quoteError)) return current
        return first || ''
      })
      return body
    } catch (e) {
      setError(e?.message || 'Unable to load market data')
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
      const seconds = Math.max(90, Math.min(600, Number(body?.refreshSeconds || 300)))
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
      .then(async (r) => {
        const d = await r.json().catch(() => null)
        if (!cancelled) setHistory(r.ok && d && !d.error ? d : null)
      })
      .catch(() => { if (!cancelled) setHistory(null) })
      .finally(() => { if (!cancelled) setHistoryLoading(false) })
    return () => { cancelled = true }
  }, [selected, range])

  const holdings = Array.isArray(data?.holdings) ? data.holdings.filter((h) => h?.enabled !== false) : []
  const priced = holdings.filter((h) => Number.isFinite(Number(h.currentValue)))
  const totals = data?.totals || {}
  const config = data?.portfolio || {}
  const currency = config.baseCurrency || 'INR'
  const current = holdings.find((h) => h.symbol === selected)
  const chartPoints = (history?.points || []).map((p) => ({ ...p, label: p.datetime }))
  const latestPriceDate = priced.map((h) => h.timestamp).filter(Boolean).sort().at(-1) || data?.fetchedAt

  const allocation = useMemo(() => priced
    .filter((h) => Number(h.currentValue) > 0)
    .map((h) => ({ name: h.label || h.symbol, value: Number(h.currentValue), symbol: h.symbol, weight: Number(h.weight) || 0 }))
    .sort((a, b) => b.value - a.value), [priced])

  if (loading) return (
    <div className="investment-lab-v3 rounded-2xl border border-slate-200 bg-white min-h-[310px] flex items-center justify-center text-[12px] text-slate-400">
      <Loader2 className="h-4 w-4 animate-spin mr-2 text-blue-600" /> Loading Investment Lab…
    </div>
  )

  if (error || !data || data.hidden || config.showPublic === false) return (
    <div className="investment-lab-v3 rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center"><Activity className="h-4 w-4 text-blue-600" /></div>
        <div>
          <div className="text-[14px] font-semibold text-slate-900">Investment Lab is temporarily unavailable</div>
          <div className="mt-1 text-[11px] text-slate-500">{error || 'The public portfolio is currently hidden.'}</div>
          <button onClick={() => { setLoading(true); load() }} className="mt-4 inline-flex items-center gap-1.5 text-[10.5px] text-blue-600"><RefreshCw className="h-3 w-3" /> Retry</button>
        </div>
      </div>
    </div>
  )

  if (!holdings.length) return (
    <div className="investment-lab-v3 rounded-2xl border border-dashed border-blue-200 bg-blue-50/30 p-7 text-center">
      <Wallet className="h-5 w-5 text-blue-600 mx-auto" />
      <div className="mt-3 text-[14px] font-semibold text-slate-900">Portfolio engine is connected</div>
      <div className="mt-1 text-[11px] text-slate-500">Add holdings from Admin → Portfolio and they will appear here automatically.</div>
    </div>
  )

  return (
    <div className="investment-lab-v3 space-y-3">
      <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_44%,#eef6ff_100%)] p-5 md:p-6">
        <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-blue-500/[.07] blur-2xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-2.5 py-1 text-[9px] uppercase tracking-[.17em] text-emerald-700 shadow-sm">
              <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50"/><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"/></span>
              Market feed connected
            </div>
            <h3 className="mt-3 text-[22px] md:text-[28px] font-semibold tracking-tight text-slate-950">{config.title || 'Investment Lab'}</h3>
            <p className="mt-1 max-w-2xl text-[11px] md:text-[11.5px] leading-relaxed text-slate-500">{config.subtitle || 'Live portfolio monitoring with market-data-backed prices, allocation and historical charts.'}</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[9.5px] text-slate-400">
            <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3 w-3" /> Prices as of {dateLabel(latestPriceDate)}</span>
            <span className="inline-flex items-center gap-1.5"><RefreshCw className="h-3 w-3" /> {data.provider || 'market'} · {lastLoaded ? `checked ${lastLoaded.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : 'connected'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Portfolio value" value={money(totals.currentValue, currency, true)} sub={`${totals.positions || priced.length} priced positions`} />
        <Stat label="Day P&L" value={money(totals.dayPnL, currency, true)} sub={signed(totals.dayPct, '%')} valueClass={tone(totals.dayPnL)} />
        <Stat label="Best mover" value={priced.length ? `${signed(Math.max(...priced.map((h) => Number(h.percentChange)).filter(Number.isFinite)), '%')}` : '—'} sub={priced.slice().sort((a,b)=>(Number(b.percentChange)||-999)-(Number(a.percentChange)||-999))[0]?.label || '—'} valueClass="text-emerald-600" />
        <Stat label="Market data" value={data.configured ? 'Connected' : 'Setup'} sub={`${data.provider || 'Provider'} · latest available`} valueClass={data.configured ? 'text-blue-700' : 'text-amber-600'} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.65fr_.75fr] gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 min-w-0 shadow-[0_12px_35px_-32px_rgba(15,23,42,.5)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[9px] uppercase tracking-[.18em] text-slate-400">Price history</div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <select value={selected} onChange={(e) => setSelected(e.target.value)} className="bg-transparent text-[15px] md:text-[16px] font-semibold text-slate-900 outline-none cursor-pointer max-w-[280px]">
                  {holdings.filter((h) => !h.quoteError).map((h) => <option key={h.symbol} value={h.symbol}>{h.label || h.symbol}</option>)}
                </select>
                {current && <span className={`text-[11px] font-medium ${tone(current.percentChange)}`}>{signed(current.percentChange, '%')}</span>}
              </div>
              <div className="mt-1 text-[24px] md:text-[27px] font-semibold tracking-tight text-slate-950 tabular-nums">{current ? money(current.price, current.currency || currency) : '—'}</div>
            </div>
            <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1">
              {RANGES.map((r) => <button key={r} onClick={() => setRange(r)} className={`px-2.5 py-1 rounded-full text-[9.5px] transition ${range === r ? 'bg-white text-blue-700 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-800 border border-transparent'}`}>{r}</button>)}
            </div>
          </div>

          <div className="mt-3 h-[245px] md:h-[285px]">
            {historyLoading ? (
              <div className="h-full flex items-center justify-center text-[11px] text-slate-400"><Loader2 className="h-4 w-4 animate-spin mr-2 text-blue-600" /> Loading price history…</div>
            ) : chartPoints.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartPoints} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#eef2f7" />
                  <XAxis dataKey="label" tick={{ fontSize: 8.5, fill: '#94a3b8' }} minTickGap={42} axisLine={false} tickLine={false} tickFormatter={(v) => String(v).slice(5, 10)} />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 8.5, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={52} tickFormatter={(v) => number(v, 0)} />
                  <Tooltip contentStyle={{ fontSize: 10.5, borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 12px 30px -18px rgba(15,23,42,.35)' }} formatter={(v) => [money(v, current?.currency || currency), 'Close']} />
                  <Line type="monotone" dataKey="close" stroke="#2563eb" strokeWidth={2.2} dot={false} activeDot={{ r: 3.5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full rounded-xl bg-slate-50/70 border border-dashed border-slate-200 flex flex-col items-center justify-center text-center px-6">
                <LineChartIcon className="h-5 w-5 text-slate-300" />
                <div className="mt-2 text-[11px] text-slate-500">Historical chart is loading or unavailable on the current market-data plan.</div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-[0_12px_35px_-32px_rgba(15,23,42,.5)]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[9px] uppercase tracking-[.18em] text-slate-400">Allocation</div>
              <div className="mt-1 text-[13px] font-semibold text-slate-900">By market value</div>
            </div>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 h-[165px]">
            {allocation.length > 0 && <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={allocation} dataKey="value" nameKey="name" innerRadius={43} outerRadius={68} paddingAngle={2} stroke="none">
                  {allocation.map((entry, i) => <Cell key={entry.symbol} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => money(v, currency, true)} contentStyle={{ fontSize: 10, borderRadius: 9, border: '1px solid #e2e8f0' }} />
              </PieChart>
            </ResponsiveContainer>}
          </div>
          <div className="space-y-2">
            {allocation.slice(0, 7).map((a, i) => <div key={a.symbol} className="flex items-center gap-2 text-[10.5px]">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
              <span className="flex-1 truncate text-slate-600">{a.name}</span>
              <span className="font-mono text-slate-500">{number(a.weight, 1)}%</span>
            </div>)}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-[0_12px_35px_-32px_rgba(15,23,42,.5)]">
        <div className="px-4 md:px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-[12px] font-semibold text-slate-900">Portfolio holdings</div>
            <div className="mt-0.5 text-[9.5px] text-slate-400">Prices are pulled from the connected market-data provider.</div>
          </div>
          <button onClick={load} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[9.5px] text-slate-500 hover:text-blue-700 hover:border-blue-200 transition"><RefreshCw className="h-3 w-3" /> Refresh view</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[690px] text-left">
            <thead className="bg-slate-50/70 text-[8.5px] uppercase tracking-[.16em] text-slate-400">
              <tr><th className="px-5 py-2.5 font-medium">Holding</th><th className="px-4 py-2.5 font-medium text-right">Price</th><th className="px-4 py-2.5 font-medium text-right">Day</th><th className="px-4 py-2.5 font-medium text-right">Market value</th><th className="px-5 py-2.5 font-medium text-right">Weight</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {holdings.map((h) => <tr key={h.id || h.symbol} className="hover:bg-blue-50/20 transition-colors">
                <td className="px-5 py-3"><div className="flex items-center gap-2.5"><div className="h-8 w-8 rounded-lg border border-blue-100 bg-blue-50 text-blue-700 flex items-center justify-center text-[9px] font-bold">{String(h.label || h.symbol).split(/\s+/).map((x)=>x[0]).slice(0,2).join('').toUpperCase()}</div><div><div className="text-[11.5px] font-medium text-slate-800">{h.label || h.symbol}</div><div className="text-[9px] font-mono text-slate-400">{h.symbol}{h.exchange ? ` · ${h.exchange}` : ''}</div></div></div></td>
                <td className="px-4 py-3 text-right text-[11px] font-mono text-slate-700">{h.quoteError ? 'Unavailable' : money(h.price, h.currency || currency)}</td>
                <td className={`px-4 py-3 text-right text-[10.5px] font-medium ${tone(h.percentChange)}`}>{signed(h.percentChange, '%')}</td>
                <td className="px-4 py-3 text-right text-[11px] font-mono text-slate-700">{money(h.currentValue, currency, true)}</td>
                <td className="px-5 py-3 text-right text-[10.5px] font-mono text-slate-500">{Number.isFinite(Number(h.weight)) ? `${number(h.weight, 1)}%` : '—'}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[8.8px] leading-relaxed text-slate-400">
        <span>Market data: {data.provider || 'connected provider'}. Quotes may be delayed according to exchange/provider rules.</span>
        <span className="inline-flex items-center gap-1 text-blue-600"><Activity className="h-3 w-3" /> Live engine <ArrowUpRight className="h-3 w-3" /></span>
      </div>
    </div>
  )
}

export default function InvestmentLabEnhancement() {
  const [target, setTarget] = useState(null)

  useEffect(() => {
    let timer
    const attach = () => {
      const lab = document.querySelector('.recruiter-body #lab')
      if (!lab) { timer = setTimeout(attach, 100); return }
      setTarget(lab)
    }
    attach()
    return () => { if (timer) clearTimeout(timer) }
  }, [])

  return (
    <>
      <style jsx global>{`
        .recruiter-body #lab > .grid { display: none !important; }
        .recruiter-body #lab > .investment-lab-v3 { display: block !important; }
      `}</style>
      {target ? createPortal(<Dashboard />, target) : null}
    </>
  )
}
