'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowRight, Award, BadgeCheck, BarChart3, BookOpen, BriefcaseBusiness,
  CheckCircle2, Download, ExternalLink, FileText, GraduationCap,
  LineChart, Mail, MapPin, Paperclip, ShieldCheck, Sparkles, Wallet, Wrench, X,
} from 'lucide-react'
import { SEED_CONTENT } from '@/lib/portfolio-data'

const unique = (items) => [...new Set((items || []).filter(Boolean))]

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
    <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-3 text-center hover:border-blue-200 hover:bg-blue-50/40 transition-colors">
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
      .then((d) => setFiles(Array.isArray(d) ? d.filter((f) => !String(f.label || '').startsWith('__project_thumbnail__')) : []))
      .catch(() => setFiles([]))
  }, [project])
  if (!project || typeof document === 'undefined') return null
  return createPortal(
    <div className="fixed inset-0 z-[160] bg-slate-950/45 backdrop-blur-sm p-3 md:p-8 overflow-y-auto" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
        {project.coverImageUrl && <div className="h-52 md:h-72 bg-slate-100 overflow-hidden"><img src={project.coverImageUrl} alt="" className="w-full h-full object-cover object-top" /></div>}
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

export default function RecruiterBody() {
  const [content, setContent] = useState(SEED_CONTENT)
  const [portfolio, setPortfolio] = useState(null)
  const [activeProject, setActiveProject] = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.allSettled([
      fetch('/api/content').then((r) => r.ok ? r.json() : null),
      fetch('/api/portfolio/live').then((r) => r.ok ? r.json() : null),
    ]).then((results) => {
      if (cancelled) return
      const next = results[0].status === 'fulfilled' ? results[0].value : null
      if (next && !next.error) setContent({ ...SEED_CONTENT, ...next })
      if (results[1].status === 'fulfilled') setPortfolio(results[1].value)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const legacy = document.querySelectorAll('main > section:not(#top)')
    legacy.forEach((el) => {
      if (el.id) {
        el.dataset.legacyAnchor = el.id
        el.removeAttribute('id')
      }
    })
    return () => legacy.forEach((el) => {
      if (el.dataset.legacyAnchor) el.id = el.dataset.legacyAnchor
    })
  }, [])

  const model = useMemo(() => {
    const projects = (content.projects || []).filter((p) => !p.hidden)
    const featured = [...projects].sort((a, b) => Number(!!b.featured) - Number(!!a.featured)).slice(0, 4)
    const transactions = (content.transactions || []).slice(0, 4)
    const skills = content.skills || []
    const finance = skills.find((g) => /finance|valuation/i.test(g.group || ''))?.items || skills[0]?.items || []
    const dataTools = skills.find((g) => /data|engineering|tool/i.test(g.group || ''))?.items || []
    const projectTools = projects.flatMap((p) => p.tools || [])
    const tools = unique(content.tools?.length ? content.tools : [...dataTools, ...projectTools]).slice(0, 12)
    const expertise = unique([...(content.expertise || []), ...(skills.find((g) => /strategy|research/i.test(g.group || ''))?.items || [])]).slice(0, 14)
    const certifications = (content.certifications || []).slice(0, 8)
    const insights = [...projects].sort((a, b) => Number(b.year || 0) - Number(a.year || 0)).slice(0, 4)
    const testimonials = (content.testimonials || []).slice(0, 4)
    const experience = content.experience || []
    const education = content.education || []
    const principles = content.chapters?.find((c) => Array.isArray(c.principles))?.principles || []
    return { projects, featured, transactions, finance: finance.slice(0, 8), tools, expertise, certifications, insights, testimonials, experience, education, principles }
  }, [content])

  const holdings = useMemo(() => {
    const live = Array.isArray(portfolio?.holdings) ? portfolio.holdings : Array.isArray(portfolio?.positions) ? portfolio.positions : []
    return live.filter((h) => h?.enabled !== false).slice(0, 5)
  }, [portfolio])

  const summary = useMemo(() => {
    const s = portfolio?.summary || portfolio || {}
    const marketValue = Number(s.marketValue ?? s.totalValue ?? s.currentValue ?? s.portfolioValue)
    const invested = Number(s.investedValue ?? s.costBasis ?? s.totalCost)
    const totalPnl = Number(s.totalPnl ?? s.pnl ?? (Number.isFinite(marketValue) && Number.isFinite(invested) ? marketValue - invested : NaN))
    const returnPct = Number(s.returnPercent ?? s.returnPct ?? (Number.isFinite(totalPnl) && invested ? totalPnl / invested * 100 : NaN))
    return { marketValue, invested, totalPnl, returnPct }
  }, [portfolio])

  const owner = content.owner || {}
  const metrics = (owner.metrics || []).slice(0, 4)

  return (
    <>
      <style jsx global>{`
        main > section:not(#top), main > footer { display: none !important; }
        html { scroll-behavior: smooth; }
        body { overscroll-behavior-y: auto; }
        .recruiter-body { display: block; background: #fff; color: #0f172a; }
        .rb-card { background:#fff; border:1px solid #e2e8f0; border-radius:12px; }
        .rb-section { border-top:1px solid #eef2f7; scroll-margin-top:76px; }
        .rb-hover { transition:border-color .16s ease, box-shadow .16s ease, transform .16s ease; }
        .rb-hover:hover { border-color:#bfdbfe; box-shadow:0 12px 28px -24px rgba(37,99,235,.45); transform:translateY(-1px); }
        @media (prefers-reduced-motion: reduce) { html { scroll-behavior:auto; } .rb-hover { transition:none; } .rb-hover:hover { transform:none; } }
      `}</style>

      <div className="recruiter-body">
        <section id="story" className="max-w-[1400px] mx-auto px-6 md:px-10 pt-3 pb-8">
          <div className="rb-card px-5 py-4 md:px-7 grid grid-cols-1 lg:grid-cols-[1.15fr_1.85fr] gap-5 items-center">
            <div className="font-serif text-[21px] md:text-[25px] leading-snug text-slate-800">{model.principles[0]?.t || 'Finance, strategy and technology — built around better decisions.'}</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{metrics.map((m) => <div key={m.label} className="border-l border-slate-100 pl-3"><div className="text-[17px] md:text-[20px] font-semibold text-blue-700">{m.value}</div><div className="mt-1 text-[10px] leading-snug text-slate-500">{m.label}</div></div>)}</div>
          </div>
        </section>

        <section id="work" className="rb-section max-w-[1400px] mx-auto px-6 md:px-10 py-9 md:py-11">
          <SectionTitle icon={BriefcaseBusiness} title="Featured Projects" action={<span className="text-[10px] uppercase tracking-widest text-blue-600">Selected institutional work</span>} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {model.featured.map((p) => <button key={p.id} onClick={() => setActiveProject(p)} className="rb-card rb-hover overflow-hidden text-left group">
              <div className="h-32 relative overflow-hidden bg-gradient-to-br from-blue-50 to-slate-100">
                {p.coverImageUrl ? <img src={p.coverImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover object-top" /> : <div className="absolute inset-0 flex items-center justify-center font-serif text-[72px] text-blue-900/[.07]">{p.coverEmoji || '◇'}</div>}
                <span className="absolute top-2.5 left-2.5 text-[9px] uppercase tracking-widest bg-white/90 border border-blue-100 rounded px-2 py-1 text-blue-700">{p.category}</span>
              </div>
              <div className="p-4"><div className="text-[14px] font-semibold leading-snug text-slate-900 min-h-[38px]">{p.title}</div><p className="mt-2 text-[10.8px] leading-relaxed text-slate-500 line-clamp-2">{p.impact || p.executiveSummary}</p><div className="mt-3 flex gap-1 flex-wrap">{(p.tools || []).slice(0, 3).map((t) => <span key={t} className="text-[9px] px-1.5 py-1 rounded border border-slate-200 bg-slate-50 text-slate-500">{t}</span>)}</div><div className="mt-4 text-[10px] uppercase tracking-widest text-blue-600 flex items-center gap-1">View project <ArrowRight className="h-3 w-3" /></div></div>
            </button>)}
          </div>
        </section>

        {model.transactions.length > 0 && <section id="transactions" className="rb-section max-w-[1400px] mx-auto px-6 md:px-10 py-9 md:py-11">
          <SectionTitle icon={BarChart3} title="Selected Transactions" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">{model.transactions.map((t) => <div key={t.id} className="rb-card p-4"><div className="flex items-center justify-between"><span className="text-[9px] uppercase tracking-widest text-emerald-600">{t.year}</span><span className="text-[9px] px-1.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-100">{t.type}</span></div><div className="mt-3 text-[14px] font-semibold text-slate-900 leading-snug">{t.target}</div><div className="mt-1 text-[10.5px] text-slate-500">{t.subtitle}</div><div className="mt-4 grid grid-cols-2 gap-2 text-[10px]"><div><div className="uppercase tracking-widest text-slate-400">Sector</div><div className="mt-1 text-slate-700">{t.sector}</div></div><div><div className="uppercase tracking-widest text-slate-400">Size</div><div className="mt-1 font-mono text-blue-700">{t.size}</div></div></div><div className="mt-3 pt-3 border-t border-slate-100 text-[10.5px] text-slate-600 line-clamp-2">{t.role}</div></div>)}</div>
        </section>}

        <section id="lab" className="rb-section max-w-[1400px] mx-auto px-6 md:px-10 py-9 md:py-11">
          <SectionTitle icon={Wallet} title="Investment Lab" action={<span className="text-[10px] text-slate-400">Latest available market data</span>} />
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-3">
            <div className="rb-card p-5"><div className="text-[9px] uppercase tracking-widest text-slate-400">Portfolio value</div><div className="mt-2 text-[28px] font-semibold tracking-tight text-slate-950">{money(summary.marketValue)}</div><div className="mt-4 grid grid-cols-3 gap-3"><div><div className="text-[9px] uppercase tracking-widest text-slate-400">Invested</div><div className="mt-1 text-[12px] font-medium">{money(summary.invested)}</div></div><div><div className="text-[9px] uppercase tracking-widest text-slate-400">P&L</div><div className={`mt-1 text-[12px] font-medium ${summary.totalPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{money(summary.totalPnl)}</div></div><div><div className="text-[9px] uppercase tracking-widest text-slate-400">Return</div><div className={`mt-1 text-[12px] font-medium ${summary.returnPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{pct(summary.returnPct)}</div></div></div></div>
            <div className="rb-card p-5"><div className="text-[9px] uppercase tracking-widest text-slate-400">Holdings</div><div className="mt-3 divide-y divide-slate-100">{holdings.length ? holdings.map((h) => <div key={h.symbol || h.ticker || h.name} className="py-2.5 flex items-center justify-between gap-4"><div><div className="text-[12px] font-medium text-slate-800">{h.companyName || h.company_name || h.name || h.symbol}</div><div className="text-[9.5px] text-slate-400 font-mono">{h.symbol || h.ticker}</div></div><div className="text-right"><div className="text-[11.5px] font-medium">{money(h.marketValue ?? h.currentValue)}</div><div className={`text-[10px] ${(h.returnPercent ?? h.returnPct ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{pct(h.returnPercent ?? h.returnPct)}</div></div></div>) : <div className="py-7 text-[11px] text-slate-400">Add holdings from Admin → Investment Lab → Portfolio.</div>}</div></div>
          </div>
        </section>

        <section id="experience" className="rb-section max-w-[1400px] mx-auto px-6 md:px-10 py-9 md:py-11">
          <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-5">
            <div><SectionTitle icon={BriefcaseBusiness} title="Work Experience" /><div className="rb-card p-4 divide-y divide-slate-100">{model.experience.map((e, i) => <div key={e.company + i} className="py-3 first:pt-0 last:pb-0 grid grid-cols-[90px_1fr] gap-3"><div className="text-[9.5px] font-mono text-slate-400">{e.period}</div><div><div className="text-[12.5px] font-semibold text-slate-900">{e.role}</div><div className="text-[10.5px] text-blue-700">{e.company}</div><div className="mt-1 text-[10px] text-slate-400 flex items-center gap-1"><MapPin className="h-3 w-3" />{e.location}</div><p className="mt-2 text-[10.5px] text-slate-600 line-clamp-2">{(e.bullets || []).join(' · ')}</p></div></div>)}</div></div>
            <div><SectionTitle icon={GraduationCap} title="Education" /><div className="rb-card p-4 divide-y divide-slate-100">{model.education.map((e) => <div key={e.id || e.degree} className="py-3 first:pt-0 last:pb-0"><div className="text-[9.5px] font-mono text-slate-400">{e.period}</div><div className="mt-1 text-[12.5px] font-semibold text-slate-900">{e.degree}</div><div className="text-[10.5px] text-blue-700">{e.institution}</div><p className="mt-2 text-[10.5px] text-slate-500 line-clamp-2">{e.details}</p></div>)}</div></div>
          </div>
        </section>

        <section id="skills-tools" className="rb-section max-w-[1400px] mx-auto px-6 md:px-10 py-9 md:py-11">
          <SectionTitle icon={Wrench} title="Skills & Tools" />
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr_1.15fr] gap-3">
            <div className="rb-card p-5"><div className="text-[10px] uppercase tracking-[.15em] text-blue-700 flex items-center gap-2"><LineChart className="h-3.5 w-3.5" /> Financial skills</div><div className="mt-4 space-y-2">{model.finance.map((s) => <div key={s} className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-[11px] text-slate-700"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" />{s}</div>)}</div></div>
            <div className="rb-card p-5"><div className="text-[10px] uppercase tracking-[.15em] text-blue-700">Tools & platforms</div><div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-2">{model.tools.map((t) => <ToolTile key={t} name={t} />)}</div></div>
            <div className="rb-card p-5"><div className="text-[10px] uppercase tracking-[.15em] text-blue-700 flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5" /> Expertise areas</div><div className="mt-4 flex flex-wrap gap-2">{model.expertise.map((x) => <span key={x} className="text-[10.5px] px-2.5 py-2 rounded-lg border border-slate-200 text-slate-600">{x}</span>)}</div><div className="mt-5 rounded-xl bg-blue-50 border border-blue-100 p-4 text-[10.5px] text-slate-600 leading-relaxed"><Sparkles className="h-3.5 w-3.5 text-blue-600 inline mr-2" />Model first, source-backed assumptions and decision-ready output.</div></div>
          </div>
        </section>

        <section id="certifications" className="rb-section max-w-[1400px] mx-auto px-6 md:px-10 py-9 md:py-11">
          <SectionTitle icon={Award} title="Certifications" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">{model.certifications.map((c) => <div key={c.id || c.name} className="rb-card p-4 min-h-[150px] flex flex-col"><div className="flex justify-between"><span className="h-9 w-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center"><BadgeCheck className="h-4.5 w-4.5 text-blue-600" /></span><span className="text-[9px] text-slate-400">{c.year}</span></div><div className="mt-4 text-[10px] text-slate-400">{c.issuer}</div><div className="mt-1 text-[13px] font-semibold text-slate-900 leading-snug">{c.name}</div>{c.credentialUrl && <a href={c.credentialUrl} target="_blank" rel="noreferrer" className="mt-auto pt-4 text-[10px] text-blue-600 inline-flex items-center gap-1">Verify <ExternalLink className="h-3 w-3" /></a>}</div>)}</div>
        </section>

        <section id="insights" className="rb-section max-w-[1400px] mx-auto px-6 md:px-10 py-9 md:py-11">
          <SectionTitle icon={BookOpen} title="Insights & Research" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{model.insights.map((p) => <button key={p.id} onClick={() => setActiveProject(p)} className="rb-card rb-hover p-5 text-left"><div className="flex justify-between"><span className="text-[9px] uppercase tracking-widest text-blue-600 flex items-center gap-1"><FileText className="h-3 w-3" />{p.category}</span><span className="text-[9px] text-slate-400">{p.year}</span></div><div className="mt-3 text-[14px] font-semibold text-slate-900">{p.title}</div><p className="mt-2 text-[10.5px] text-slate-500 line-clamp-2">{p.executiveSummary}</p><div className="mt-4 text-[10px] text-blue-600 flex items-center gap-1">View case study <ArrowRight className="h-3 w-3" /></div></button>)}</div>
        </section>

        {model.testimonials.length > 0 && <section className="rb-section max-w-[1400px] mx-auto px-6 md:px-10 py-9 md:py-11"><SectionTitle icon={Sparkles} title="Selected References" /><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{model.testimonials.map((t) => <div key={t.id} className="rb-card p-5"><p className="font-serif text-[15px] leading-relaxed text-slate-700">“{t.quote}”</p><div className="mt-4 text-[10.5px] font-semibold text-slate-900">{t.name}</div><div className="text-[9.5px] text-slate-400">{t.title} · {t.company}</div></div>)}</div></section>}

        <section id="contact" className="rb-section max-w-[1400px] mx-auto px-6 md:px-10 py-9 md:py-11"><div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5"><div><div className="text-[9px] uppercase tracking-[.18em] text-blue-600">Contact</div><div className="mt-2 text-[24px] font-semibold tracking-tight text-slate-950">Let’s build the next chapter together.</div><p className="mt-2 text-[11.5px] text-slate-500 max-w-xl">{owner.bio}</p></div><div className="flex flex-wrap gap-2">{owner.email && <a href={`mailto:${owner.email}`} className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-blue-600 text-white text-[11.5px] font-medium hover:bg-blue-700"><Mail className="h-3.5 w-3.5" />Send a message</a>}{owner.linkedin && <a href={owner.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-slate-200 bg-white text-slate-700 text-[11.5px]">LinkedIn</a>}</div></div></section>

        <footer className="max-w-[1400px] mx-auto px-6 md:px-10 py-7 border-t border-slate-100 flex items-center justify-between gap-4 text-[9.5px] text-slate-400"><span>© {new Date().getFullYear()} {owner.name}</span><span>Finance · Strategy · Technology</span></footer>
      </div>

      <ProjectModal project={activeProject} onClose={() => setActiveProject(null)} />
    </>
  )
}
