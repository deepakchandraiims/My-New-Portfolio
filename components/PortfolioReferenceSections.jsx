'use client'

import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowRight, Award, BadgeCheck, BarChart3, BookOpen, BriefcaseBusiness,
  Building2, Calendar, CheckCircle2, Download, ExternalLink, FileText,
  GraduationCap, LineChart, Mail, MapPin, Paperclip, ShieldCheck, Sparkles,
  TrendingUp, Wallet, Wrench, X,
} from 'lucide-react'

const unique = (items) => [...new Set((items || []).filter(Boolean))]
const cls = (...parts) => parts.filter(Boolean).join(' ')

function money(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`
  if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

function pct(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`
}

function SectionTitle({ icon: Icon, title, action }) {
  return (
    <div className="flex items-center justify-between gap-4 mb-4">
      <div className="flex items-center gap-2 min-w-0">
        <span className="h-7 w-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0"><Icon className="h-3.5 w-3.5 text-blue-600" /></span>
        <h2 className="text-[14px] md:text-[15px] font-semibold uppercase tracking-[.12em] text-slate-700 truncate">{title}</h2>
      </div>
      {action}
    </div>
  )
}

function ToolTile({ name }) {
  const initials = String(name || '').split(/\s+/).filter(Boolean).map((x) => x[0]).slice(0, 3).join('').toUpperCase()
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-3 text-center hover:border-blue-200 hover:bg-blue-50/40 transition">
      <div className="mx-auto h-8 w-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[9px] font-bold text-blue-700">{initials || '•'}</div>
      <div className="mt-2 text-[10.5px] font-medium text-slate-700 leading-tight line-clamp-2">{name}</div>
    </div>
  )
}

function ProjectModal({ project, onClose }) {
  const [files, setFiles] = useState([])
  useEffect(() => {
    if (!project) return
    fetch(`/api/files?projectId=${encodeURIComponent(project.id)}`)
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setFiles(Array.isArray(d) ? d : []))
      .catch(() => setFiles([]))
  }, [project])
  if (!project) return null
  return createPortal(
    <div className="fixed inset-0 z-[150] bg-slate-950/45 backdrop-blur-sm p-3 md:p-8 overflow-y-auto" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
        <div className="p-5 md:p-7 border-b border-slate-100 flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[.18em] text-blue-600">{project.category} · {project.year}</div>
            <h3 className="mt-2 text-[23px] md:text-[30px] font-semibold tracking-tight text-slate-950 leading-tight">{project.title}</h3>
            <p className="mt-3 text-[13px] leading-relaxed text-slate-600">{project.executiveSummary}</p>
          </div>
          <button onClick={onClose} className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 shrink-0"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 md:p-7 grid grid-cols-1 md:grid-cols-[1.4fr_.9fr] gap-7">
          <div>
            {project.problem && <><div className="text-[10px] uppercase tracking-widest text-slate-400">Business problem</div><p className="mt-2 text-[13px] leading-relaxed text-slate-700">{project.problem}</p></>}
            {(project.approach || []).length > 0 && <div className="mt-6"><div className="text-[10px] uppercase tracking-widest text-slate-400">Approach</div><div className="mt-3 space-y-2">{project.approach.map((step, i) => <div key={i} className="flex gap-3 text-[12.5px] text-slate-700"><span className="h-5 w-5 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-[10px] shrink-0">{i + 1}</span><span>{step}</span></div>)}</div></div>}
            {project.learnings && <div className="mt-6 rounded-xl bg-blue-50/60 border border-blue-100 p-4"><div className="text-[10px] uppercase tracking-widest text-blue-600">Key insight</div><p className="mt-2 text-[13px] italic text-slate-700">“{project.learnings}”</p></div>}
          </div>
          <div className="space-y-5">
            {(project.tools || []).length > 0 && <div><div className="text-[10px] uppercase tracking-widest text-slate-400">Tools</div><div className="mt-2 flex flex-wrap gap-1.5">{project.tools.map((t) => <span key={t} className="text-[10.5px] px-2 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-600">{t}</span>)}</div></div>}
            {(project.deliverables || []).length > 0 && <div><div className="text-[10px] uppercase tracking-widest text-slate-400">Deliverables</div><div className="mt-2 space-y-1.5">{project.deliverables.map((d) => <div key={d} className="flex items-start gap-2 text-[11.5px] text-slate-600"><CheckCircle2 className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />{d}</div>)}</div></div>}
            {files.length > 0 && <div><div className="text-[10px] uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><Paperclip className="h-3 w-3" /> Project files</div><div className="mt-2 space-y-2">{files.map((f) => <a key={f.id} href={f.publicUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2.5 hover:border-blue-200 hover:bg-blue-50/40 transition"><span className="text-[11.5px] text-slate-700 truncate">{f.label || f.originalName}</span><Download className="h-3.5 w-3.5 text-blue-600 shrink-0" /></a>)}</div></div>}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default function PortfolioReferenceSections() {
  const [host, setHost] = useState(null)
  const [content, setContent] = useState(null)
  const [portfolio, setPortfolio] = useState(null)
  const [portfolioConfig, setPortfolioConfig] = useState(null)
  const [activeProject, setActiveProject] = useState(null)

  useLayoutEffect(() => {
    if (typeof document === 'undefined') return undefined
    const main = document.querySelector('main')
    const hero = document.getElementById('top')
    if (!main || !hero) return undefined

    let node = main.querySelector('[data-reference-body-host="true"]')
    if (!node) {
      node = document.createElement('div')
      node.dataset.referenceBodyHost = 'true'
      hero.insertAdjacentElement('afterend', node)
    }
    main.classList.add('reference-body-active')
    setHost(node)

    return () => {
      main.classList.remove('reference-body-active')
      setHost(null)
      if (node?.isConnected) node.remove()
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    Promise.allSettled([
      fetch('/api/content').then((r) => r.ok ? r.json() : null),
      fetch('/api/portfolio/live').then((r) => r.ok ? r.json() : null),
      fetch('/api/portfolio/config').then((r) => r.ok ? r.json() : null),
    ]).then((results) => {
      if (cancelled) return
      setContent(results[0].status === 'fulfilled' ? results[0].value : null)
      setPortfolio(results[1].status === 'fulfilled' ? results[1].value : null)
      setPortfolioConfig(results[2].status === 'fulfilled' ? results[2].value : null)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  const model = useMemo(() => {
    if (!content) return null
    const projects = (content.projects || []).filter((p) => !p.hidden)
    const featured = [...projects].sort((a, b) => Number(!!b.featured) - Number(!!a.featured)).slice(0, 4)
    const transactions = (content.transactions || []).slice(0, 4)
    const skills = content.skills || []
    const finance = skills.find((g) => /finance|valuation/i.test(g.group || ''))?.items || skills[0]?.items || []
    const dataTools = skills.find((g) => /data|engineering|tool/i.test(g.group || ''))?.items || []
    const projectTools = projects.flatMap((p) => p.tools || [])
    const tools = unique(content.tools?.length ? content.tools : [...dataTools, ...projectTools]).slice(0, 12)
    const expertise = unique(content.expertise || []).slice(0, 14)
    const certifications = (content.certifications || []).slice(0, 4)
    const insights = [...projects].sort((a, b) => Number(b.year || 0) - Number(a.year || 0)).slice(0, 2)
    const principles = content.chapters?.find((c) => Array.isArray(c.principles))?.principles || []
    return { projects, featured, transactions, finance: finance.slice(0, 8), tools, expertise, certifications, insights, principles: principles.slice(0, 4) }
  }, [content])

  const holdings = useMemo(() => {
    const live = Array.isArray(portfolio?.holdings) ? portfolio.holdings : Array.isArray(portfolio?.positions) ? portfolio.positions : []
    const configured = Array.isArray(portfolioConfig?.holdings) ? portfolioConfig.holdings : []
    return (live.length ? live : configured).filter((h) => h?.enabled !== false).slice(0, 5)
  }, [portfolio, portfolioConfig])

  const summary = useMemo(() => {
    const s = portfolio?.summary || portfolio || {}
    const marketValue = Number(s.marketValue ?? s.totalValue ?? s.currentValue ?? s.portfolioValue)
    const invested = Number(s.investedValue ?? s.costBasis ?? s.totalCost)
    const totalPnl = Number(s.totalPnl ?? s.pnl ?? (Number.isFinite(marketValue) && Number.isFinite(invested) ? marketValue - invested : NaN))
    const returnPct = Number(s.returnPercent ?? s.returnPct ?? (Number.isFinite(totalPnl) && invested ? totalPnl / invested * 100 : NaN))
    return { marketValue, invested, totalPnl, returnPct }
  }, [portfolio])

  if (!host || !model) return null

  const owner = content.owner || {}
  const metrics = (owner.metrics || []).slice(0, 4)
  const findProject = (id) => model.projects.find((p) => p.id === id)

  return createPortal(
    <>
      <style jsx global>{`
        main.reference-body-active > section:not(#top),
        main.reference-body-active > footer {
          display: none !important;
        }
        main.reference-body-active > [data-reference-body-host="true"] {
          display: block !important;
        }
        .rb-shell { background: #fff; color: #0f172a; }
        .rb-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; }
        .rb-card:hover { border-color: #bfdbfe; }
        .rb-section { border-top: 1px solid #eef2f7; }
        @media (prefers-reduced-motion: no-preference) {
          .rb-hover { transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease; }
          .rb-hover:hover { transform: translateY(-2px); box-shadow: 0 14px 28px -24px rgba(37,99,235,.45); }
        }
      `}</style>

      <div className="rb-shell">
        <section id="story" className="max-w-[1400px] mx-auto px-6 md:px-10 pt-3 pb-8">
          <div className="rb-card px-5 py-4 md:px-7 grid grid-cols-1 lg:grid-cols-[1.2fr_1.8fr] gap-5 items-center">
            <div className="font-serif text-[21px] md:text-[25px] leading-snug text-slate-800">{model.principles[0]?.t || 'Finance, strategy and technology — built around better decisions.'}</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {metrics.map((m) => <div key={m.label} className="border-l border-slate-100 pl-3"><div className="text-[17px] md:text-[20px] font-semibold text-blue-700">{m.value}</div><div className="mt-1 text-[10px] leading-snug text-slate-500">{m.label}</div></div>)}
            </div>
          </div>
        </section>

        <section id="work" className="rb-section max-w-[1400px] mx-auto px-6 md:px-10 py-9 md:py-11">
          <SectionTitle icon={BriefcaseBusiness} title="Featured Projects" action={<span className="text-[10px] uppercase tracking-widest text-blue-600">Selected institutional work</span>} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {model.featured.map((p) => <button key={p.id} onClick={() => setActiveProject(p)} className="rb-card rb-hover overflow-hidden text-left group">
              <div className="h-28 relative overflow-hidden bg-gradient-to-br from-blue-50 to-slate-100">
                {p.coverImageUrl ? <img src={p.coverImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center font-serif text-[72px] text-blue-900/[.07]">{p.coverEmoji || '◇'}</div>}
                <span className="absolute top-2.5 left-2.5 text-[9px] uppercase tracking-widest bg-white/90 border border-blue-100 rounded px-2 py-1 text-blue-700">{p.category}</span>
              </div>
              <div className="p-4"><div className="text-[14px] font-semibold leading-snug text-slate-900 min-h-[38px]">{p.title}</div><p className="mt-2 text-[10.8px] leading-relaxed text-slate-500 line-clamp-2">{p.impact || p.executiveSummary}</p><div className="mt-3 flex flex-wrap gap-1">{(p.tools || []).slice(0, 3).map((t) => <span key={t} className="text-[9px] px-1.5 py-0.5 rounded border border-slate-200 text-slate-500">{t}</span>)}</div><div className="mt-3 text-[10px] uppercase tracking-widest text-blue-600 inline-flex items-center gap-1">View project <ArrowRight className="h-3 w-3" /></div></div>
            </button>)}
          </div>
        </section>

        {model.transactions.length > 0 && <section id="transactions" className="rb-section max-w-[1400px] mx-auto px-6 md:px-10 py-9 md:py-11">
          <SectionTitle icon={Building2} title="Selected Transactions" action={<span className="text-[10px] uppercase tracking-widest text-slate-400">Representative mandates</span>} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {model.transactions.map((t) => {
              const linked = t.projectId ? findProject(t.projectId) : null
              return <button key={t.id} disabled={!linked} onClick={() => linked && setActiveProject(linked)} className={cls('rb-card p-4 text-left', linked && 'rb-hover cursor-pointer')}>
                <div className="flex items-center justify-between gap-2"><span className="text-[9px] uppercase tracking-widest text-blue-600">{t.type}</span><span className="text-[9px] text-slate-400">{t.year}</span></div>
                <div className="mt-3 text-[14px] font-semibold leading-tight text-slate-900">{t.target}</div>
                <div className="mt-1 text-[10.5px] text-slate-500 line-clamp-2">{t.subtitle}</div>
                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2"><div><div className="text-[8px] uppercase tracking-widest text-slate-400">Size</div><div className="mt-1 text-[10.5px] font-medium text-blue-700">{t.size || '—'}</div></div><div><div className="text-[8px] uppercase tracking-widest text-slate-400">Sector</div><div className="mt-1 text-[10.5px] text-slate-600 line-clamp-1">{t.sector}</div></div></div>
                {linked && <div className="mt-3 text-[9.5px] uppercase tracking-widest text-blue-600">View case study →</div>}
              </button>
            })}
          </div>
        </section>}

        <section id="lab" className="rb-section max-w-[1400px] mx-auto px-6 md:px-10 py-9 md:py-11">
          <SectionTitle icon={Wallet} title="Investment Lab" action={<span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Latest available market data</span>} />
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.55fr] gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rb-card p-4"><div className="text-[9px] uppercase tracking-widest text-slate-400">Market Value</div><div className="mt-2 text-[21px] font-semibold text-slate-900">{money(summary.marketValue)}</div></div>
              <div className="rb-card p-4"><div className="text-[9px] uppercase tracking-widest text-slate-400">Total Return</div><div className={cls('mt-2 text-[21px] font-semibold', Number(summary.returnPct) >= 0 ? 'text-emerald-600' : 'text-rose-600')}>{pct(summary.returnPct)}</div></div>
              <div className="rb-card p-4"><div className="text-[9px] uppercase tracking-widest text-slate-400">Invested</div><div className="mt-2 text-[16px] font-semibold text-slate-900">{money(summary.invested)}</div></div>
              <div className="rb-card p-4"><div className="text-[9px] uppercase tracking-widest text-slate-400">Holdings</div><div className="mt-2 text-[21px] font-semibold text-slate-900">{holdings.length}</div></div>
            </div>
            <div className="rb-card overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between"><div className="text-[10px] uppercase tracking-widest text-slate-500">Portfolio holdings</div><div className="text-[9px] text-slate-400">Supabase · Alpha Vantage</div></div>
              <div className="divide-y divide-slate-100">
                {holdings.length ? holdings.map((h, i) => {
                  const name = h.companyName || h.company_name || h.name || h.symbol || `Holding ${i + 1}`
                  const symbol = h.symbol || h.ticker || ''
                  const value = Number(h.marketValue ?? h.currentValue ?? h.market_value)
                  const change = Number(h.returnPercent ?? h.returnPct ?? h.changePercent)
                  return <div key={h.id || symbol || i} className="px-4 py-3 grid grid-cols-[1.5fr_.7fr_.6fr] gap-3 items-center"><div><div className="text-[11.5px] font-medium text-slate-800">{name}</div><div className="text-[9px] text-slate-400">{symbol}</div></div><div className="text-right text-[10.5px] font-medium text-slate-700">{money(value)}</div><div className={cls('text-right text-[10px] font-medium', change >= 0 ? 'text-emerald-600' : 'text-rose-600')}>{Number.isFinite(change) ? pct(change) : '—'}</div></div>
                }) : <div className="px-4 py-8 text-center text-[11px] text-slate-400">No public holdings added yet. Add them from Admin → Investment Lab → Portfolio.</div>}
              </div>
            </div>
          </div>
        </section>

        <section id="experience" className="rb-section max-w-[1400px] mx-auto px-6 md:px-10 py-9 md:py-11">
          <div className="grid grid-cols-1 lg:grid-cols-[1.45fr_.9fr] gap-5">
            <div><SectionTitle icon={LineChart} title="Work Experience" />
              <div className="rb-card divide-y divide-slate-100">{(content.experience || []).map((e, i) => <div key={`${e.company}-${i}`} className="p-4 grid grid-cols-1 md:grid-cols-[120px_1fr] gap-2 md:gap-4"><div className="text-[9.5px] uppercase tracking-wider text-slate-400">{e.period}</div><div><div className="text-[12px] font-semibold text-slate-900">{e.role} <span className="font-normal text-blue-700">· {e.company}</span></div><div className="mt-1 flex items-center gap-1 text-[9.5px] text-slate-400"><MapPin className="h-3 w-3" /> {e.location}</div><div className="mt-2 flex flex-wrap gap-1.5">{(e.bullets || []).slice(0, 3).map((b, j) => <span key={j} className="text-[9.5px] leading-snug text-slate-600 bg-slate-50 border border-slate-100 rounded px-2 py-1">{b}</span>)}</div></div></div>)}</div>
            </div>
            <div><SectionTitle icon={GraduationCap} title="Education" />
              <div className="space-y-3">{(content.education || []).map((e) => <div key={e.id || e.degree} className="rb-card p-4"><div className="flex items-center justify-between gap-3"><div className="text-[9px] uppercase tracking-widest text-slate-400">{e.period}</div><Calendar className="h-3.5 w-3.5 text-blue-500" /></div><div className="mt-2 text-[12.5px] font-semibold text-slate-900">{e.degree}</div><div className="mt-1 text-[10.5px] text-blue-700">{e.institution}</div>{e.details && <div className="mt-2 text-[9.8px] leading-relaxed text-slate-500 line-clamp-3">{e.details}</div>}</div>)}</div>
            </div>
          </div>
        </section>

        <section id="skills-tools" className="rb-section max-w-[1400px] mx-auto px-6 md:px-10 py-9 md:py-11">
          <SectionTitle icon={Wrench} title="Skills & Tools" />
          <div className="grid grid-cols-1 lg:grid-cols-[.95fr_1.2fr_1fr] gap-3">
            <div className="rb-card p-4"><div className="text-[9px] uppercase tracking-widest text-blue-600">Financial skills</div><div className="mt-3 space-y-2">{model.finance.map((s) => <div key={s} className="flex items-center gap-2 border-b border-slate-100 pb-2 last:border-0"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" /><span className="text-[10.8px] text-slate-700">{s}</span></div>)}</div></div>
            <div className="rb-card p-4"><div className="text-[9px] uppercase tracking-widest text-blue-600">Tools & platforms</div><div className="mt-3 grid grid-cols-4 gap-2">{model.tools.map((t) => <ToolTile key={t} name={t} />)}</div></div>
            <div className="rb-card p-4"><div className="text-[9px] uppercase tracking-widest text-blue-600">Expertise areas</div><div className="mt-3 flex flex-wrap gap-1.5">{model.expertise.map((x) => <span key={x} className="text-[10px] px-2 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-slate-600">{x}</span>)}</div><div className="mt-4 rounded-lg bg-blue-50 border border-blue-100 p-3"><div className="flex items-center gap-1.5 text-[9.5px] uppercase tracking-widest text-blue-700"><ShieldCheck className="h-3.5 w-3.5" /> Working style</div><div className="mt-2 text-[10px] leading-relaxed text-slate-600">Source-backed assumptions, decision-ready outputs, and automation where it removes repetitive analyst work.</div></div></div>
          </div>
        </section>

        {model.certifications.length > 0 && <section id="certifications" className="rb-section max-w-[1400px] mx-auto px-6 md:px-10 py-9 md:py-11">
          <SectionTitle icon={Award} title="Certificates" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">{model.certifications.map((c) => <div key={c.id || c.name} className="rb-card p-4 min-h-[145px] flex flex-col"><div className="flex items-center justify-between"><BadgeCheck className="h-5 w-5 text-blue-600" /><span className="text-[9px] text-slate-400">{c.year}</span></div><div className="mt-3 text-[9.5px] text-slate-400">{c.issuer}</div><div className="mt-1 text-[12.5px] font-semibold leading-snug text-slate-900">{c.name}</div><div className="mt-auto pt-4">{c.credentialUrl ? <a href={c.credentialUrl} target="_blank" rel="noreferrer" className="text-[9.5px] uppercase tracking-widest text-blue-600 inline-flex items-center gap-1">Verify <ExternalLink className="h-3 w-3" /></a> : <span className="text-[9.5px] text-slate-400">Credential listed</span>}</div></div>)}</div>
        </section>}

        {model.insights.length > 0 && <section id="insights" className="rb-section max-w-[1400px] mx-auto px-6 md:px-10 py-9 md:py-11">
          <SectionTitle icon={BookOpen} title="Insights & Research" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{model.insights.map((p) => <button key={p.id} onClick={() => setActiveProject(p)} className="rb-card rb-hover p-4 text-left"><div className="flex items-center justify-between"><span className="text-[9px] uppercase tracking-widest text-blue-600 inline-flex items-center gap-1"><FileText className="h-3 w-3" /> {p.category}</span><span className="text-[9px] text-slate-400">{p.year}{p.readingMinutes ? ` · ${p.readingMinutes} min` : ''}</span></div><div className="mt-2 text-[13px] font-semibold text-slate-900">{p.title}</div><div className="mt-2 text-[10.5px] leading-relaxed text-slate-500 line-clamp-2">{p.executiveSummary}</div><div className="mt-3 text-[9.5px] uppercase tracking-widest text-blue-600">Read case study →</div></button>)}</div>
        </section>}

        {(content.testimonials || []).length > 0 && <section className="rb-section max-w-[1400px] mx-auto px-6 md:px-10 py-9 md:py-11"><SectionTitle icon={Sparkles} title="Selected References" /><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{content.testimonials.slice(0, 2).map((t) => <div key={t.id} className="rb-card p-4"><p className="font-serif text-[15px] leading-relaxed text-slate-700">“{t.quote}”</p><div className="mt-3 text-[10px] font-medium text-slate-900">{t.name}</div><div className="text-[9.5px] text-slate-400">{t.title} · {t.company}</div></div>)}</div></section>}

        <section id="contact" className="rb-section max-w-[1400px] mx-auto px-6 md:px-10 py-9 md:py-12">
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white overflow-hidden grid grid-cols-1 lg:grid-cols-[1fr_1.15fr]">
            <div className="p-6 md:p-8 border-b lg:border-b-0 lg:border-r border-blue-100"><div className="text-[9px] uppercase tracking-[.18em] text-blue-600">Life philosophy</div><div className="mt-3 font-serif text-[25px] md:text-[31px] italic leading-tight text-slate-800">Build work that is useful before it is impressive.</div></div>
            <div className="p-6 md:p-8"><div className="text-[22px] md:text-[28px] font-semibold tracking-tight text-slate-900">Let’s build the next chapter together.</div><p className="mt-2 text-[11.5px] text-slate-500 max-w-xl">Open to conversations across strategic finance, investment banking, M&A, corporate development and private markets.</p><div className="mt-5 flex flex-wrap gap-2">{owner.email && <a href={`mailto:${owner.email}`} className="h-9 px-4 rounded-lg bg-blue-600 text-white text-[11px] font-medium inline-flex items-center gap-2 hover:bg-blue-700"><Mail className="h-3.5 w-3.5" /> Send a message</a>}{owner.linkedin && <a href={owner.linkedin} target="_blank" rel="noreferrer" className="h-9 px-4 rounded-lg border border-slate-200 bg-white text-slate-700 text-[11px] inline-flex items-center gap-2 hover:border-blue-200">LinkedIn <ExternalLink className="h-3.5 w-3.5" /></a>}</div></div>
          </div>
        </section>

        <footer className="border-t border-slate-100 py-6"><div className="max-w-[1400px] mx-auto px-6 md:px-10 flex flex-wrap items-center justify-between gap-3 text-[9.5px] text-slate-400"><span>© {new Date().getFullYear()} {owner.name || 'Deepak'}.</span><span>Strategic Finance · M&A · Investment Banking · AI for Finance</span></div></footer>
      </div>

      <ProjectModal project={activeProject} onClose={() => setActiveProject(null)} />
    </>,
    host,
  )
}
